-- ==============================================================================
-- Fundaciones Valdr (tablas base de etapas anteriores que rigen bóveda y templanza)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.valdr_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_name TEXT NOT NULL DEFAULT 'Red',
  guide_totem TEXT NOT NULL DEFAULT 'oso',
  sovereignty_gold INT NOT NULL DEFAULT 150,
  battery_minutes INT NOT NULL DEFAULT 0,
  streak_fire_days INT NOT NULL DEFAULT 1,
  temperance_status TEXT NOT NULL DEFAULT 'invictus',
  temperance_streak_days INT NOT NULL DEFAULT 1,
  temperance_last_date DATE,
  business_regime TEXT DEFAULT 'cazador_informal',
  credit_score TEXT DEFAULT 'B',
  inner_beast TEXT,
  journey_start_date DATE,
  is_admin BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.valdr_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'valdr_profiles' AND policyname = 'valdr_profiles_own'
  ) THEN
    CREATE POLICY "valdr_profiles_own" ON public.valdr_profiles
      FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.valdr_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'item',
  item_id_or_species TEXT NOT NULL,
  display_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shiny BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'in_vault',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  dispatched_at TIMESTAMPTZ
);

ALTER TABLE public.valdr_vault ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.valdr_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  victories TEXT,
  challenges TEXT,
  tomorrow_focus TEXT,
  mood_rating INT DEFAULT 5 CHECK (mood_rating BETWEEN 1 AND 5),
  oracle_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_daily_journal UNIQUE (user_id, entry_date)
);

ALTER TABLE public.valdr_journal_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'valdr_journal_entries' AND policyname = 'Allow all access to valdr_journal_entries'
  ) THEN
    CREATE POLICY "Allow all access to valdr_journal_entries" ON public.valdr_journal_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
