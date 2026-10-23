export type StarterPokemon = 'cyndaquil' | 'totodile' | 'chikorita';
export type NatureRole = 'fuego_ui' | 'agua_data' | 'planta_bots';
export type ActiveTab = 'map' | 'party' | 'pokedex' | 'tuning' | 'minigames' | 'arena' | 'shop' | 'admin';

export interface TrainerProfile {
  id: string;
  trainer_name: string;
  starter_pokemon: StarterPokemon;
  nature_role: NatureRole;
  current_level: number;
  xp: number;
  pokedollars: number;
  streak_days: number;
  battery_minutes: number;
  egg_steps: number;
  parent_whatsapp?: string | null;
  equipped_accessory: string | null;
  equipped_trainer_skin?: string | null;
  equipped_pokemon_costumes?: Record<number, string>; // speciesId -> costumeId (ej: 25 -> 'COSTUME_PIKA_CAP_ORIGINAL')
  equipped_trainer_cosmetics?: {
    headwear?: string | null;
    eyewear?: string | null;
    clothing?: string | null;
    aura?: string | null;
    badge?: string | null;
  };
  equipped_pokemon_cosmetics?: {
    targetPokemonId?: number;
    headwear?: string | null;
    eyewear?: string | null;
    clothing?: string | null;
    aura?: string | null;
    badge?: string | null;
  };
  cosmetics_inventory?: string[];
  gba_party_json: any[];
  sav_file_url: string | null;
  is_admin?: boolean;
  updated_at?: string;
}

export interface MissionsProgress {
  id: string;
  user_id: string;
  mission_id: string;
  project_url: string | null;
  quiz_passed: boolean;
  completed_at: string | null;
}

export interface ArenaRoom {
  room_pin: string;
  boss_name: string;
  boss_hp: number;
  timer_seconds: number;
  status: 'waiting' | 'active' | 'victory';
  squad_cables_json: {
    fuego_ui: boolean;
    agua_data: boolean;
    planta_bots: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ShopInventory {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
}

export interface LevelRequirement {
  level: number;
  title: string;
  badge: string;
  leader: string;
  min_xp: number;
  required_missions: string[];
  reward_item: string;
  is_unlocked: boolean;
  manual_unlocked: boolean;
}

export interface EconomySettings {
  battery_minutes_per_mission: number;
  pokedollars_reward_multiplier: number;
  shiny_rate_weekend_multiplier: number;
  allow_free_arcade_testing: boolean;
}

export interface AdminGameRules {
  id: string;
  mode: 'automatic' | 'manual' | 'hybrid';
  levels_requirements: Record<string, LevelRequirement>;
  economy_settings: EconomySettings;
  manual_overrides: Record<string, any>;
  updated_at?: string;
}

export interface StudentAdminRow {
  id: string;
  trainer_name: string;
  starter_pokemon: StarterPokemon;
  nature_role: NatureRole;
  current_level: number;
  xp: number;
  pokedollars: number;
  battery_minutes: number;
  streak_days: number;
  gba_party_json: any[];
  parent_whatsapp?: string | null;
  is_admin?: boolean;
  updated_at?: string;
}
