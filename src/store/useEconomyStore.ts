'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';
import { triggerGbaItemInjection, triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';
import { GbaSaveManipulator } from '@/lib/gba/gbaSaveEngine';
import { JOHTO_POKEDEX_CATALOG } from '@/lib/pokemonAssets';

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
  dispatchVaultItem: (
    vaultId: string,
    destination?: 'pc' | 'party' | 'auto'
  ) => Promise<{
    success: boolean;
    error?: string;
    inPcBox?: boolean;
    destination?: 'pc' | 'party';
    slot?: number;
    nickname?: string;
    level?: number;
  }>;
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

  dispatchVaultItem: async (vaultId, destination = 'pc') => {
    const vaultItem = get().snapshot?.vault?.find((v) => v.id === vaultId);
    const finalDest: 'pc' | 'party' = destination === 'party' ? 'party' : 'pc';

    const gbaReady =
      typeof window !== 'undefined' && (window as any).__SYNDEX_GBA_READY__ === true;

    // Helper interno para resolver detalles de especie de forma segura
    const resolvePokemonDetails = (res: any, sourceVaultItem?: VaultItem) => {
      const payload = (typeof res?.payload === 'object' && res.payload !== null)
        ? res.payload
        : (typeof sourceVaultItem?.payload_json === 'object' && sourceVaultItem?.payload_json !== null)
        ? sourceVaultItem.payload_json
        : {};

      let speciesId = 0;
      const pId = Number(payload.speciesId || payload.species_id);
      if (!isNaN(pId) && pId > 0) {
        speciesId = pId;
      }

      if (!speciesId) {
        const rawId = String(res?.item_id || sourceVaultItem?.item_id_or_species || '').trim();
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          speciesId = parsed;
        }
      }

      if (!speciesId) {
        const key = String(res?.item_id || sourceVaultItem?.item_id_or_species || sourceVaultItem?.display_name || '').toUpperCase();
        if (key.includes('DRATINI') || key.includes('DRAGONAIR') || key.includes('DRAGONITE')) speciesId = 147;
        else if (key.includes('LARVITAR') || key.includes('PUPITAR') || key.includes('TYRANITAR')) speciesId = 246;
        else if (key.includes('BELDUM') || key.includes('METANG') || key.includes('METAGROSS')) speciesId = 374;
        else if (key.includes('BAGON') || key.includes('SHELGON') || key.includes('SALAMENCE')) speciesId = 371;
        else if (key.includes('EEVEE')) speciesId = 133;
        else if (key.includes('CHARMANDER') || key.includes('CHARMELEON') || key.includes('CHARIZARD')) speciesId = 4;
        else if (key.includes('MUDKIP') || key.includes('MARSHTOMP') || key.includes('SWAMPERT')) speciesId = 258;
        else if (key.includes('TREECKO') || key.includes('GROVYLE') || key.includes('SCEPTILE')) speciesId = 252;
        else if (key.includes('TORCHIC') || key.includes('COMBUSKEN') || key.includes('BLAZIKEN')) speciesId = 255;
        else if (key.includes('GASTLY') || key.includes('HAUNTER') || key.includes('GENGAR')) speciesId = 92;
        else if (key.includes('RALTS') || key.includes('KIRLIA') || key.includes('GARDEVOIR')) speciesId = 280;
        else if (key.includes('SCYTHER') || key.includes('SCIZOR')) speciesId = 123;
        else if (key.includes('HERACROSS')) speciesId = 214;
        else if (key.includes('MAGIKARP') || key.includes('GYARADOS')) speciesId = 130;
        else if (key.includes('TOGEPI') || key.includes('TOGETIC')) speciesId = 175;
        else if (key.includes('PORYGON')) speciesId = 137;
        else if (key.includes('RIOLU') || key.includes('LUCARIO')) speciesId = 447;
        else if (key.includes('GIBLE') || key.includes('GABITE') || key.includes('GARCHOMP')) speciesId = 443;
        else if (key.includes('ELEKID') || key.includes('ELECTABUZZ')) speciesId = 239;
        else if (key.includes('MAGBY') || key.includes('MAGMAR')) speciesId = 240;
        else if (key.includes('SNORLAX') || key.includes('MUNCHLAX')) speciesId = 143;
        else if (key.includes('HOUNDOUR') || key.includes('HOUNDOOM')) speciesId = 228;
        else if (key.includes('AERODACTYL')) speciesId = 142;
        else if (key.includes('LAPRAS')) speciesId = 131;
        else if (key.includes('CHANSEY') || key.includes('BLISSEY')) speciesId = 113;
        else if (key.includes('PIKACHU') || key.includes('RAICHU')) speciesId = 25;
        else if (key.includes('TYROGUE') || key.includes('HITMON')) speciesId = 236;
        else if (key.includes('STEELIX') || key.includes('ONIX')) speciesId = 208;
        else if (key.includes('KINGDRA') || key.includes('HORSEA')) speciesId = 230;
        else if (key.includes('SKARMORY')) speciesId = 227;
        else if (key.includes('AMPHAROS') || key.includes('MAREEP')) speciesId = 181;
        else if (key.includes('ALAKAZAM') || key.includes('ABRA')) speciesId = 65;
        else if (key.includes('MACHAMP') || key.includes('MACHOP')) speciesId = 68;
        else {
          const match = JOHTO_POKEDEX_CATALOG.find((p) => key.includes(p.name.toUpperCase()));
          if (match) speciesId = match.id;
        }
      }

      if (!speciesId) speciesId = 147;

      const level = Number(payload.level) > 0 ? Number(payload.level) : (res?.item_type === 'egg' ? 5 : 10);
      const isShiny = Boolean(res?.is_shiny ?? sourceVaultItem?.is_shiny ?? payload.isShiny ?? payload.is_shiny);
      const perfectIVs = Boolean(payload.perfectIVs ?? payload.perfect_ivs ?? true);
      const fallbackMeta = JOHTO_POKEDEX_CATALOG.find((p) => p.id === speciesId);
      const nickname = res?.item_type === 'egg'
        ? 'HUEVO'
        : (payload.nickname || fallbackMeta?.name || 'POKÉMON').toUpperCase();

      return { speciesId, level, isShiny, perfectIVs, nickname };
    };

    // ─────────────────────────────────────────────────────────────
    // CASO A: El emulador mGBA está corriendo activo en pantalla
    // ─────────────────────────────────────────────────────────────
    if (gbaReady) {
      try {
        const { data, error } = await supabase.rpc('rpc_valdr_dispatch_vault_item', {
          p_vault_id: vaultId,
        });
        if (error) return { success: false, error: error.message };
        const res = data as any;
        if (!res?.success) return { success: false, error: res?.error || 'No se pudo despachar' };

        const payload = res.payload || {};
        if (res.item_type === 'pokemon' || res.item_type === 'egg') {
          const details = resolvePokemonDetails(res, vaultItem);
          triggerGbaPokemonInjection({
            speciesId: details.speciesId,
            level: details.level,
            nickname: details.nickname,
            isShiny: details.isShiny,
            perfectIVs: details.perfectIVs,
            targetDestination: finalDest,
          });
          await get().loadEconomy();
          return {
            success: true,
            destination: finalDest,
            inPcBox: finalDest === 'pc',
            nickname: details.nickname,
            level: details.level,
          };
        } else if (res.item_type === 'item') {
          triggerGbaItemInjection(
            Number(payload.gba_item_id || 0),
            Number(res.quantity || 1),
            payload.gba_pocket || 'ITEMS',
            res.item_id
          );
          await get().loadEconomy();
          return { success: true };
        }

        await get().loadEconomy();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Error de conexión' };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CASO B: El emulador está apagado/cerrado
    // Inyección quirúrgica directa al archivo .sav en la nube
    // ─────────────────────────────────────────────────────────────
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'Debes iniciar sesión para transferir objetos.' };
      }

      // Descargar el slot principal del usuario desde la API segura
      const fetchSav = await fetch(`/api/gba/save-sync?slot=slot_1.sav&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!fetchSav.ok) {
        return {
          success: false,
          error: 'No se encontró archivo de guardado en la nube. Abre el cartucho al menos una vez, habla con el Prof. Elm y guarda en el menú del juego (START -> GUARDAR) para habilitar la inyección directa.',
        };
      }

      const savBytes = new Uint8Array(await fetchSav.arrayBuffer());
      if (savBytes.byteLength < 0x1C000) {
        return { success: false, error: 'La partida en la nube no contiene los 128 KB requeridos.' };
      }

      const manipulator = new GbaSaveManipulator(savBytes);
      if (!manipulator.isValid()) {
        return { success: false, error: 'La partida en la nube no superó la verificación de integridad.' };
      }

      const isPokemon = vaultItem ? (vaultItem.item_type === 'pokemon' || vaultItem.item_type === 'egg') : true;
      let updatedSavBytes: Uint8Array;
      let injectionResult: any = null;

      if (isPokemon) {
        const details = resolvePokemonDetails({
          item_id: vaultItem?.item_id_or_species,
          display_name: vaultItem?.display_name,
          is_shiny: vaultItem?.is_shiny,
          item_type: vaultItem?.item_type,
          payload: vaultItem?.payload_json,
        }, vaultItem);

        injectionResult = manipulator.injectPokemonToParty({
          speciesId: details.speciesId,
          level: details.level,
          nickname: details.nickname,
          isShiny: details.isShiny,
          perfectIVs: details.perfectIVs,
          targetDestination: finalDest,
        });

        if (!injectionResult.success) {
          return { success: false, error: injectionResult.error || 'No se pudo inyectar el Pokémon al guardado.' };
        }

        updatedSavBytes = injectionResult.updatedSav || manipulator.getBuffer();
      } else {
        const payload = vaultItem?.payload_json || {};
        updatedSavBytes = manipulator.injectRewards({
          itemsToInject: [{
            itemId: Number(payload.gba_item_id || 0),
            quantity: Number(vaultItem?.quantity || 1),
            pocket: payload.gba_pocket || 'ITEMS',
          }],
        });
      }

      // Validada la inyección en memoria, despachar de la Bóveda en la BD
      const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_valdr_dispatch_vault_item', {
        p_vault_id: vaultId,
      });

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }
      const res = rpcData as any;
      if (!res?.success) {
        return { success: false, error: res?.error || 'No se pudo registrar el despacho en la base de datos.' };
      }

      // Persistir el .sav con los nuevos checksums a Supabase Storage
      const uploadRes = await fetch(`/api/gba/save-sync?slot=slot_1.sav`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([updatedSavBytes.buffer as ArrayBuffer]),
      });

      if (!uploadRes.ok) {
        console.warn('[/api/gba/save-sync] Error al sincronizar .sav actualizado a la nube');
      }

      // Actualizar localStorage como respaldo local offline
      try {
        let binaryString = '';
        const len = updatedSavBytes.byteLength;
        for (let i = 0; i < len; i += 8192) {
          const chunk = updatedSavBytes.subarray(i, Math.min(i + 8192, len));
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        localStorage.setItem('syndex_sav_slot_1.sav', btoa(binaryString));
      } catch {}

      // Si fue al equipo, actualizar el perfil web inmediatamente
      if (injectionResult && !injectionResult.inPcBox) {
        try {
          const { party } = manipulator.extractPlayerProfileAndTeam();
          useTrainerStore.getState().updateProfile({ gba_party_json: party as any });
          await supabase.from('profiles').update({ gba_party_json: party }).eq('id', session.user.id);
        } catch {}
      }

      await get().loadEconomy();

      return {
        success: true,
        destination: finalDest,
        inPcBox: injectionResult?.inPcBox ?? (finalDest === 'pc'),
        slot: injectionResult?.slot,
        nickname: injectionResult?.nickname,
        level: injectionResult?.level,
      };
    } catch (err: any) {
      console.error('[dispatchVaultItem offline] Error:', err);
      return { success: false, error: err?.message || 'Error al inyectar en la partida.' };
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
