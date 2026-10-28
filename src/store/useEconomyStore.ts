'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';
import { triggerGbaItemInjection, triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';

export interface VaultItem {
  id: string;
  item_type: 'item' | 'pokemon' | 'egg' | 'cosmetic' | string;
  item_id_or_species: string;
  display_name: string;
  quantity: number;
  payload_json: Record<string, any> | null;
  is_shiny: boolean;
  status: string;
  created_at: string;
}

export interface MarketPrice {
  item_id: string;
  display_name: string;
  buy_price: number;
  sell_price: number;
  change_pct: number;
  base_price: number;
}

export interface EconomyStateSnapshot {
  wallet: number;
  tax_debt: number;
  in_game_money: number;
  tax_due: number;
  tax_due_today: number;
  last_tax_charge_date: string | null;
  grace_until: string;
  in_grace: boolean;
  rescue_plan_active: boolean;
  rescue_until: string | null;
  pc_boxes: number;
  vault_slots: number;
  expedition_week_paid: number;
  expedition_week_cap: number;
  dratini_price: number;
  dratini_days_left: number;
  dratini_progress_pct: number;
  vault: VaultItem[];
  market: MarketPrice[];
  today: string;
}

interface EconomyStore {
  snapshot: EconomyStateSnapshot | null;
  prices: Record<string, number>;
  oracleText: string;
  loading: boolean;
  lastError: string | null;
  loadEconomy: () => Promise<EconomyStateSnapshot | null>;
  loadPrices: () => Promise<void>;
  loadOracle: (action?: 'bulletin' | 'greeting') => Promise<void>;
  buy: (itemId: string, qty?: number) => Promise<{ success: boolean; error?: string }>;
  sell: (itemId: string, qty?: number) => Promise<{ success: boolean; error?: string }>;
  dispatchVaultItem: (vaultId: string) => Promise<{ success: boolean; error?: string }>;
  syncGameMoney: (amount: number) => Promise<void>;
  activateRescuePlan: () => Promise<{ success: boolean; error?: string }>;
  applyFine: (tier: 1 | 2 | 3, reason?: string) => Promise<{ success: boolean; error?: string }>;
}

export const useEconomyStore = create<EconomyStore>((set, get) => ({
  snapshot: null,
  prices: {},
  oracleText: '',
  loading: false,
  lastError: null,

  loadEconomy: async () => {
    // Invitados sin sesión: no consultamos la RPC para no generar ruido.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      set({ snapshot: null, lastError: null });
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('rpc_economy_state');
      if (error) {
        set({ lastError: error.message });
        return null;
      }
      const snapshot = data as EconomyStateSnapshot;
      set({ snapshot, lastError: null });
      if (snapshot) {
        useTrainerStore.getState().updateProfile({
          pokedollars: snapshot.wallet,
          in_game_money: snapshot.in_game_money,
          tax_debt: snapshot.tax_debt,
        } as any);
      }
      return snapshot;
    } catch (err: any) {
      set({ lastError: err?.message || 'Error cargando economía' });
      return null;
    }
  },

  loadPrices: async () => {
    try {
      const { data } = await supabase
        .from('economy_shop_prices')
        .select('item_id, price')
        .eq('active', true);
      if (data) {
        set({ prices: Object.fromEntries(data.map((row: any) => [row.item_id, row.price])) });
      }
    } catch {}
  },

  loadOracle: async (action = 'bulletin') => {
    const { snapshot } = get();
    try {
      const res = await fetch('/api/economy/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          market: snapshot?.market || [],
          wallet: snapshot?.wallet ?? 0,
          debt: snapshot?.tax_debt ?? 0,
          daysLeft: snapshot?.dratini_days_left ?? 0,
          inGrace: snapshot?.in_grace ?? false,
        }),
      });
      const data = await res.json();
      if (data?.text) set({ oracleText: data.text });
    } catch {
      set({ oracleText: 'El Oráculo guarda silencio. El mercado habla por sí solo hoy.' });
    }
  },

  buy: async (itemId, qty = 1) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('rpc_purchase_shop_item', {
        p_item_id: itemId,
        p_qty: qty,
      });
      if (error) return { success: false, error: error.message };
      const result = data as any;
      if (result?.success) {
        await get().loadEconomy();
      }
      return result?.success
        ? { success: true }
        : { success: false, error: result?.error || 'No se pudo completar la compra' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    } finally {
      set({ loading: false });
    }
  },

  sell: async (itemId, qty = 1) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('rpc_economy_sell', {
        p_item_id: itemId,
        p_qty: qty,
      });
      if (error) return { success: false, error: error.message };
      const result = data as any;
      if (result?.success) await get().loadEconomy();
      return result?.success
        ? { success: true }
        : { success: false, error: result?.error || 'No se pudo vender' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    } finally {
      set({ loading: false });
    }
  },

  dispatchVaultItem: async (vaultId) => {
    const gbaReady =
      typeof window !== 'undefined' && (window as any).__SYNDEX_GBA_READY__ === true;
    if (!gbaReady) {
      return {
        success: false,
        error: 'Abre la pestaña Cartucho y espera a que cargue el emulador.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('rpc_valdr_dispatch_vault_item', {
        p_vault_id: vaultId,
      });
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (!res?.success) return { success: false, error: res?.error || 'No se pudo despachar' };

      const payload = res.payload || {};
      if (res.item_type === 'pokemon' || res.item_type === 'egg') {
        triggerGbaPokemonInjection({
          speciesId: Number(payload.speciesId || res.item_id || 147),
          level: Number(payload.level || 5),
          nickname: res.item_type === 'egg' ? 'HUEVO' : undefined,
          isShiny: !!res.is_shiny,
          perfectIVs: !!payload.perfectIVs,
          targetDestination: 'auto',
        });
      } else if (res.item_type === 'item') {
        triggerGbaItemInjection(
          Number(payload.gba_item_id || 0),
          Number(res.quantity || 1),
          payload.gba_pocket || 'ITEMS',
          res.item_id
        );
      }

      await get().loadEconomy();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },

  syncGameMoney: async (amount) => {
    try {
      const { data, error } = await supabase.rpc('rpc_economy_sync_game_money', {
        p_in_game_money: Math.max(0, Math.round(amount)),
      });
      if (error) return;
      const res = data as any;
      if (res?.success) {
        useTrainerStore.getState().updateProfile({
          pokedollars: res.wallet,
          in_game_money: res.in_game_money,
        } as any);
      }
    } catch {}
  },

  activateRescuePlan: async () => {
    try {
      const { data, error } = await supabase.rpc('rpc_economy_activate_rescue_plan');
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true }
        : { success: false, error: res?.error || 'No se pudo activar el plan' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },

  applyFine: async (tier, reason) => {
    try {
      const { error } = await supabase.rpc('rpc_economy_apply_fine', {
        p_tier: tier,
        p_reason: reason || null,
      });
      if (error) return { success: false, error: error.message };
      await get().loadEconomy();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },
}));
