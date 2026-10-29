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
  avg_buy_price?: number;
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
  is_bonguri?: boolean;
}

export interface MarketEventInfo {
  id: string;
  week_key: string;
  regime: string;
  headline: string;
  rumor: string;
  crash_item_id: string;
  boom_item_id: string;
  crash_discount_pct: number;
  boom_surge_pct: number;
  active_from: string;
  active_until: string;
  source: string;
}

export interface BotOrder {
  id: string;
  bot_name: string;
  order_side: 'BUY_FROM_USER' | 'SELL_TO_USER';
  item_id: string;
  display_name: string;
  unit_price: number;
  base_price: number;
  max_qty: number;
  remaining_qty: number;
  reason: string;
}

export interface FixedCostsInfo {
  bill_pc_weekly: number;
  vault_weekly: number;
  vault_items_count: number;
  league_license_weekly: number;
  asset_upkeep_weekly: number;
  total_weekly: number;
  daily_slice: number;
}

export interface PassiveAssetCatalogItem {
  asset_code: string;
  display_name: string;
  category: 'agro' | 'ranch' | 'dividend' | 'staking' | string;
  purchase_cost: number;
  daily_yield_rp: number;
  yield_item_id: string | null;
  yield_item_qty: number;
  weekly_upkeep: number;
  max_owned: number;
  description: string;
}

export interface UserPassiveAsset {
  asset_code: string;
  quantity: number;
  total_earned_rp: number;
  last_harvest_date: string | null;
  display_name: string;
  daily_yield_rp: number;
  yield_item_qty: number;
  weekly_upkeep: number;
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
  market_event?: MarketEventInfo | null;
  bot_orders?: BotOrder[];
  fixed_costs?: FixedCostsInfo;
  passive_catalog?: PassiveAssetCatalogItem[];
  user_assets?: UserPassiveAsset[];
  daily_passive_rp?: number;
  productive_today?: boolean;
  rents_harvested_today?: boolean;
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
  loadOracle: (action?: 'bulletin' | 'greeting' | 'director') => Promise<void>;
  buy: (itemId: string, qty?: number) => Promise<{ success: boolean; error?: string }>;
  sell: (itemId: string, qty?: number) => Promise<{ success: boolean; error?: string }>;
  tradeWithBot: (orderId: string, qty?: number) => Promise<{ success: boolean; error?: string; total?: number }>;
  buyPassiveAsset: (assetCode: string) => Promise<{ success: boolean; error?: string }>;
  harvestPassiveRents: () => Promise<{ success: boolean; error?: string; earned_rp?: number; bonguris?: number }>;
  claimEmergencyWork: () => Promise<{ success: boolean; error?: string; reward?: number }>;
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
          vault: snapshot?.vault || [],
          wallet: snapshot?.wallet ?? 0,
          debt: snapshot?.tax_debt ?? 0,
          daysLeft: snapshot?.dratini_days_left ?? 0,
          inGrace: snapshot?.in_grace ?? false,
        }),
      });
      const data = await res.json();
      if (data?.text) set({ oracleText: data.text });
      if (data?.marketUpdated) {
        await get().loadEconomy();
      }
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

  tradeWithBot: async (orderId, qty = 1) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('rpc_economy_trade_with_bot', {
        p_order_id: orderId,
        p_qty: qty,
      });
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true, total: res.total }
        : { success: false, error: res?.error || 'No se pudo operar con el Bot' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    } finally {
      set({ loading: false });
    }
  },

  buyPassiveAsset: async (assetCode) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('rpc_economy_buy_passive_asset', {
        p_asset_code: assetCode,
      });
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true }
        : { success: false, error: res?.error || 'No se pudo adquirir el activo' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    } finally {
      set({ loading: false });
    }
  },

  harvestPassiveRents: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('rpc_economy_harvest_passive_rents');
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true, earned_rp: res.earned_rp, bonguris: res.bonguris_harvested }
        : { success: false, error: res?.error || 'No se pudieron recolectar las rentas' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    } finally {
      set({ loading: false });
    }
  },

  claimEmergencyWork: async () => {
    set({ loading: true });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.rpc('rpc_hq_claim_work_reward', {
        p_claim_key: `emergency_work:${today}`,
        p_kind: 'emergency_work',
        p_minutes: 15,
        p_label: 'Turno de Guardia en Centro Pokémon',
      });
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.already_claimed) {
        return { success: false, error: 'Ya realizaste el turno de guardia de emergencia hoy.' };
      }
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true, reward: res.reward }
        : { success: false, error: res?.error || 'No se pudo reclamar' };
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
      const { data, error } = await supabase.rpc('rpc_economy_apply_fine', {
        p_tier: tier,
        p_reason: reason || null,
      });
      if (error) return { success: false, error: error.message };
      const res = data as any;
      if (res?.success) await get().loadEconomy();
      return res?.success
        ? { success: true }
        : { success: false, error: res?.error || 'No se pudo aplicar la multa' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },
}));
