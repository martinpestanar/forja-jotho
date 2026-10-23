-- ==============================================================================
-- Academia Cyber-Johto - Database Schema
-- Tablas con RLS: profiles, missions_progress, arena_rooms, shop_inventory
-- ==============================================================================

-- 1. Tipos Enumerados
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'starter_pokemon_enum') THEN
    CREATE TYPE starter_pokemon_enum AS ENUM ('cyndaquil', 'totodile', 'chikorita');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nature_role_enum') THEN
    CREATE TYPE nature_role_enum AS ENUM ('fuego_ui', 'agua_data', 'planta_bots');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status_enum') THEN
    CREATE TYPE room_status_enum AS ENUM ('waiting', 'active', 'victory');
  END IF;
END $$;

-- 2. Tabla Profiles (Vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  starter_pokemon starter_pokemon_enum NOT NULL DEFAULT 'cyndaquil',
  nature_role nature_role_enum NOT NULL DEFAULT 'fuego_ui',
  current_level INT NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  pokedollars INT NOT NULL DEFAULT 50 CHECK (pokedollars >= 0),
  streak_days INT NOT NULL DEFAULT 1 CHECK (streak_days >= 0),
  battery_minutes INT NOT NULL DEFAULT 0 CHECK (battery_minutes >= 0),
  egg_steps INT NOT NULL DEFAULT 0 CHECK (egg_steps >= 0),
  equipped_accessory TEXT,
  gba_party_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  sav_file_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla Missions Progress
CREATE TABLE IF NOT EXISTS public.missions_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  project_url TEXT,
  quiz_passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  CONSTRAINT unique_user_mission UNIQUE (user_id, mission_id)
);

-- 4. Tabla Arena Rooms
CREATE TABLE IF NOT EXISTS public.arena_rooms (
  room_pin TEXT PRIMARY KEY,
  boss_name TEXT NOT NULL,
  boss_hp INT NOT NULL DEFAULT 100 CHECK (boss_hp >= 0),
  timer_seconds INT NOT NULL DEFAULT 1500 CHECK (timer_seconds >= 0),
  status room_status_enum NOT NULL DEFAULT 'waiting',
  squad_cables_json JSONB NOT NULL DEFAULT '{"fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar Realtime para arena_rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'arena_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_rooms;
  END IF;
END $$;

-- 5. Tabla Shop Inventory
CREATE TABLE IF NOT EXISTS public.shop_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- Seguridad Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_inventory ENABLE ROW LEVEL SECURITY;

-- Politicas Profiles
CREATE POLICY "Profiles son visibles por cualquier usuario autenticado"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Politicas Missions Progress
CREATE POLICY "Usuarios pueden ver su progreso de misiones"
  ON public.missions_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su progreso de misiones"
  ON public.missions_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio progreso"
  ON public.missions_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politicas Arena Rooms
CREATE POLICY "Cualquier usuario autenticado puede ver y unirse a salas"
  ON public.arena_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear o actualizar salas"
  ON public.arena_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden sincronizar daño y cables de salas"
  ON public.arena_rooms FOR UPDATE
  TO authenticated
  USING (true);

-- Politicas Shop Inventory
CREATE POLICY "Usuarios pueden ver su propio inventario"
  ON public.shop_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden comprar items (insertar en inventario)"
  ON public.shop_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- Trigger para auto-crear perfil en signup (opcional / preventivo)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, trainer_name, starter_pokemon, nature_role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'trainer_name', 'Red'),
    COALESCE((new.raw_user_meta_data->>'starter_pokemon')::starter_pokemon_enum, 'cyndaquil'),
    COALESCE((new.raw_user_meta_data->>'nature_role')::nature_role_enum, 'fuego_ui')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
