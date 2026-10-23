import { create } from 'zustand';
import { ActiveTab, TrainerProfile } from '@/types/trainer';
import { supabase } from '@/lib/supabase';

interface ActivityRewardResult {
  success: boolean;
  added_xp: number;
  added_pokedollars: number;
  added_battery: number;
  added_steps: number;
  egg_hatched: boolean;
  is_shiny: boolean;
  new_egg_steps: number;
  current_level: number;
}

interface PurchaseResult {
  success: boolean;
  item_id?: string;
  remaining_pokedollars?: number;
  error?: string;
}

interface CableActivationResult {
  success: boolean;
  boss_hp: number;
  damage_dealt: number;
  combo_triggered: boolean;
  status: string;
  cables: Record<string, boolean>;
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
  grantActivityRewardRpc: (
    activityType: 'trivia_win' | 'pokegear_fix' | 'mission_complete',
    missionId?: string,
    projectUrl?: string
  ) => Promise<ActivityRewardResult | null>;
  purchaseShopItemRpc: (itemId: string, cost: number) => Promise<PurchaseResult>;
  activateSquadCableRpc: (roomPin: string, squadId: string, cableRole: string) => Promise<CableActivationResult | null>;
}

const DEFAULT_PROFILE: TrainerProfile = {
  id: 'guest-trainer-id',
  trainer_name: 'Gold Neo',
  starter_pokemon: 'cyndaquil',
  nature_role: 'fuego_ui',
  current_level: 5,
  xp: 450,
  pokedollars: 99999, // Modo Admin / Pruebas
  streak_days: 7,
  battery_minutes: 999,
  egg_steps: 40,
  parent_whatsapp: null,
  equipped_accessory: 'Visor Cyberpunk Oro',
  equipped_trainer_cosmetics: {
    eyewear: 'COSMETIC_CYBER_VISOR',
    aura: 'COSMETIC_NEON_AURA',
    headwear: null,
    clothing: null,
  },
  equipped_pokemon_cosmetics: {
    targetPokemonId: 155, // Cyndaquil por defecto
    eyewear: 'COSMETIC_CYBER_VISOR',
    headwear: 'COSMETIC_TRAINER_CAP',
    aura: 'COSMETIC_NEON_AURA',
  },
  cosmetics_inventory: [
    'COSMETIC_CYBER_VISOR',
    'COSMETIC_NEON_AURA',
    'COSMETIC_TRAINER_CAP',
  ],
  gba_party_json: [
    { name: 'Cyndaquil', speciesId: 155, level: 12, hp: 35, maxHp: 35, type: 'fire', isShiny: false }
  ],
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

  // 1. RPC: Consumir 1 minuto de batería en PostgreSQL
  consumeBatteryMinuteRpc: async () => {
    try {
      const { data, error } = await supabase.rpc('rpc_consume_battery_minute');
      if (error) {
        // Fallback optimista si no hay sesión activa en sandbox
        const currentMins = get().profile?.battery_minutes ?? 0;
        const fallbackMins = Math.max(0, currentMins - 1);
        get().updateProfile({ battery_minutes: fallbackMins });
        return fallbackMins;
      }
      const remaining = Number(data);
      get().updateProfile({ battery_minutes: remaining });
      return remaining;
    } catch {
      const currentMins = get().profile?.battery_minutes ?? 0;
      const fallbackMins = Math.max(0, currentMins - 1);
      get().updateProfile({ battery_minutes: fallbackMins });
      return fallbackMins;
    }
  },

  // 2. RPC: Otorgar recompensa atómica en PostgreSQL
  grantActivityRewardRpc: async (activityType, missionId, projectUrl) => {
    try {
      const { data, error } = await supabase.rpc('rpc_grant_activity_reward', {
        p_activity_type: activityType,
        p_mission_id: missionId || null,
        p_project_url: projectUrl || null,
      });

      if (error) {
        console.warn('RPC reward error, applying optimistic fallback:', error.message);
        // Fallback optimista
        const profile = get().profile;
        if (!profile) return null;
        const addPokedollars = activityType === 'mission_complete' ? 100 : 25;
        const addSteps = activityType === 'mission_complete' ? 50 : 20;
        const newEggSteps = (profile.egg_steps + addSteps) % 100;
        const hatched = profile.egg_steps + addSteps >= 100;

        const optimisticResult: ActivityRewardResult = {
          success: true,
          added_xp: activityType === 'mission_complete' ? 150 : 50,
          added_pokedollars: addPokedollars,
          added_battery: 15,
          added_steps: addSteps,
          egg_hatched: hatched,
          is_shiny: profile.streak_days >= 7,
          new_egg_steps: newEggSteps,
          current_level: profile.current_level,
        };

        get().updateProfile({
          pokedollars: profile.pokedollars + addPokedollars,
          battery_minutes: profile.battery_minutes + 15,
          egg_steps: newEggSteps,
          xp: profile.xp + optimisticResult.added_xp,
        });

        return optimisticResult;
      }

      const res = data as ActivityRewardResult;
      const currentProfile = get().profile;
      if (currentProfile) {
        get().updateProfile({
          pokedollars: currentProfile.pokedollars + res.added_pokedollars,
          battery_minutes: currentProfile.battery_minutes + res.added_battery,
          egg_steps: res.new_egg_steps,
          xp: currentProfile.xp + res.added_xp,
          current_level: res.current_level,
        });
      }
      return res;
    } catch (err) {
      console.error('Error invoking rpc_grant_activity_reward:', err);
      return null;
    }
  },

  // 3. RPC: Compra en la Poké-tienda validada en PostgreSQL
  purchaseShopItemRpc: async (itemId, cost) => {
    try {
      const { data, error } = await supabase.rpc('rpc_purchase_shop_item', {
        p_item_id: itemId,
        p_cost: cost,
      });

      if (error) {
        // Fallback en cliente si no hay sesión
        const profile = get().profile;
        if (!profile || profile.pokedollars < cost) {
          return { success: false, error: 'Fondos insuficientes' };
        }
        const remaining = profile.pokedollars - cost;
        get().updateProfile({ pokedollars: remaining });
        return { success: true, item_id: itemId, remaining_pokedollars: remaining };
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

  // 4. RPC: Activar cable de escuadrón y combo en Arena de Jefes
  activateSquadCableRpc: async (roomPin, squadId, cableRole) => {
    try {
      const { data, error } = await supabase.rpc('rpc_activate_squad_cable', {
        p_room_pin: roomPin,
        p_squad_id: squadId,
        p_cable_role: cableRole,
      });

      if (error) {
        console.error('Error invoking rpc_activate_squad_cable:', error.message);
        return null;
      }

      return data as CableActivationResult;
    } catch (err) {
      console.error('Error activating squad cable:', err);
      return null;
    }
  },
}));
