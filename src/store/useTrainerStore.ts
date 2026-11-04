import { create } from 'zustand';
import { ActiveTab, TrainerProfile } from '@/types/trainer';
import { supabase } from '@/lib/supabase';
import { useHqStore } from '@/store/useHqStore';

interface PurchaseResult {
  success: boolean;
  item_id?: string;
  remaining_pokedollars?: number;
  error?: string;
}

interface TrainerState {
  profile: TrainerProfile | null;
  activeTab: ActiveTab;
  theme: 'dark_sp' | 'light_gbc';
  toggleTheme: () => void;
  setTheme: (theme: 'dark_sp' | 'light_gbc') => void;
  initTheme: () => void;
  // Acciones locales
  isArcadeOpen: boolean;
  setArcadeOpen: (open: boolean) => void;
  openArcadeRoom: () => void;
  closeArcadeRoom: () => void;
  setProfile: (profile: TrainerProfile | null) => void;
  updateProfile: (partial: Partial<TrainerProfile>) => void;
  setActiveTab: (tab: ActiveTab) => void;

  setTrainerSkin: (skinId: string) => void;
  setPokemonCostume: (speciesId: number, costumeId: string | null) => void;
  equipCosmetic: (
    target: 'trainer' | 'pokemon',
    slot: 'headwear' | 'eyewear' | 'clothing' | 'aura' | 'badge',
    cosmeticId: string | null,
    targetPokemonId?: number
  ) => void;
  loadSessionProfileRpc: () => Promise<TrainerProfile | null>;
  consumeBatteryMinuteRpc: () => Promise<number>;
  purchaseShopItemRpc: (itemId: string, qty?: number) => Promise<PurchaseResult>;
}

const DEFAULT_PROFILE: TrainerProfile = {
  id: 'guest-trainer-id',
  trainer_name: 'Entrenador',
  starter_pokemon: null,
  nature_role: 'fuego_ui',
  current_level: 1,
  xp: 0,
  pokedollars: 250, // Balance inicial limpio para nuevo usuario
  streak_days: 1,
  battery_minutes: 120, // 2 Horas garantizadas
  egg_steps: 0,
  parent_whatsapp: null,
  equipped_accessory: null,
  equipped_trainer_cosmetics: {
    eyewear: null,
    aura: null,
    headwear: null,
    clothing: null,
  },
  equipped_pokemon_cosmetics: {
    targetPokemonId: 155,
    eyewear: null,
    headwear: null,
    aura: null,
  },
  cosmetics_inventory: [],
  gba_party_json: [], // Equipo vacío para iniciar desde cero en la ROM
  sav_file_url: null,
};

export const useTrainerStore = create<TrainerState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  activeTab: 'map',
  isLoading: false,
  theme: 'dark_sp',

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark_sp' ? 'light_gbc' : 'dark_sp';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('syndex_theme', nextTheme);
          document.documentElement.setAttribute('data-theme', nextTheme);
        } catch {}
      }
      return { theme: nextTheme };
    }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('syndex_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      } catch {}
    }
    set({ theme });
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('syndex_theme') as 'dark_sp' | 'light_gbc' | null;
        if (saved === 'dark_sp' || saved === 'light_gbc') {
          document.documentElement.setAttribute('data-theme', saved);
          set({ theme: saved });
          return;
        }
        document.documentElement.setAttribute('data-theme', 'dark_sp');
      } catch {}
    }
  },

  isArcadeOpen: false,
  setArcadeOpen: (isArcadeOpen) => set({ isArcadeOpen }),
  openArcadeRoom: () => set({ isArcadeOpen: true }),
  closeArcadeRoom: () => set({ isArcadeOpen: false }),

  setProfile: (profile) => set({ profile }),

  updateProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : null,
    })),

  setActiveTab: (activeTab) => set({ activeTab }),

  setTrainerSkin: (skinId) => {
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: {
          ...state.profile,
          equipped_trainer_skin: skinId,
        },
      };
    });
  },

  setPokemonCostume: (speciesId, costumeId) => {
    set((state) => {
      if (!state.profile) return state;
      const current = state.profile.equipped_pokemon_costumes || {};
      const updated = { ...current };
      if (costumeId) {
        updated[speciesId] = costumeId;
      } else {
        delete updated[speciesId];
      }
      return {
        profile: {
          ...state.profile,
          equipped_pokemon_costumes: updated,
        },
      };
    });
  },

  equipCosmetic: (target, slot, cosmeticId, targetPokemonId) => {
    set((state) => {
      if (!state.profile) return state;
      const profile = state.profile;

      if (target === 'trainer') {
        const currentTrainer = profile.equipped_trainer_cosmetics || {};
        const updatedTrainer = {
          ...currentTrainer,
          [slot]: cosmeticId,
        };
        return {
          profile: {
            ...profile,
            equipped_trainer_cosmetics: updatedTrainer,
          },
        };
      } else {
        const currentPkmn = profile.equipped_pokemon_cosmetics || {};
        const updatedPkmn = {
          ...currentPkmn,
          targetPokemonId: targetPokemonId || currentPkmn.targetPokemonId || 155,
          [slot]: cosmeticId,
        };
        return {
          profile: {
            ...profile,
            equipped_pokemon_cosmetics: updatedPkmn,
          },
        };
      }
    });
  },

  // 0. Cargar Perfil de Sesión Autenticada desde Supabase
  loadSessionProfileRpc: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.warn('[useTrainerStore] Error cargando perfil de sesión:', error.message);
        return null;
      }

      if (data) {
        const loadedProfile = data as TrainerProfile;
        set({ profile: loadedProfile });
        return loadedProfile;
      }
      return null;
    } catch (err) {
      console.error('[useTrainerStore] Excepción al cargar perfil:', err);
      return null;
    }
  },

  // 1. Consumir 1 minuto del banco de tiempo del HQ (2h base + tareas)
  consumeBatteryMinuteRpc: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Consultar batería real en valdr_profiles
        const { data: prof } = await supabase
          .from('valdr_profiles')
          .select('battery_minutes')
          .eq('id', session.user.id)
          .single();

        const currentBattery = prof?.battery_minutes ?? 120;
        const newBattery = Math.max(0, currentBattery - 1);

        await supabase
          .from('valdr_profiles')
          .update({ battery_minutes: newBattery })
          .eq('id', session.user.id);

        get().updateProfile({ battery_minutes: newBattery });
        return newBattery;
      }
    } catch (e) {
      console.warn('Error decrementing battery from Supabase:', e);
    }

    // Fallback local seguro
    const current = get().profile?.battery_minutes ?? 120;
    const remaining = Math.max(0, current - 1);
    get().updateProfile({ battery_minutes: remaining });
    return remaining;
  },

  // 2. RPC: Compra en el Poké-Bazar validada en PostgreSQL (precio del servidor)
  purchaseShopItemRpc: async (itemId, qty = 1) => {
    try {
      const { data, error } = await supabase.rpc('rpc_purchase_shop_item', {
        p_item_id: itemId,
        p_qty: qty,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const res = data as PurchaseResult;
      if (res.success && res.remaining_pokedollars !== undefined) {
        get().updateProfile({ pokedollars: res.remaining_pokedollars });
      }
      return res;
    } catch (err) {
      console.error('Error in rpc_purchase_shop_item:', err);
      return { success: false, error: 'Error de conexión' };
    }
  },

}));
