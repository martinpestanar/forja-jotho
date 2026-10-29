export type StarterPokemon = 'cyndaquil' | 'totodile' | 'chikorita';export type NatureRole = 'fuego_ui' | 'agua_data' | 'planta_bots';
export type ActiveTab = 'map' | 'party' | 'pokedex' | 'tuning' | 'minigames' | 'arena' | 'shop' | 'admin';

export interface TrainerProfile {
  id: string;
  trainer_name: string;
  starter_pokemon: StarterPokemon;
  nature_role: NatureRole;
  current_level: number;
  xp: number;
  pokedollars: number;
  in_game_money?: number;
  tax_debt?: number;
  last_tax_charge_date?: string | null;
  economy_started_at?: string | null;
  rescue_plan_active?: boolean;
  rescue_until?: string | null;
  pc_boxes?: number;
  vault_slots?: number;
  expedition_week_start?: string | null;
  expedition_week_paid?: number;
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
