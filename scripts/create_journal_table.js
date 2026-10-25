const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim();
  return acc;
}, {});

const sqlScript = `
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
END
$$;

-- RPC para guardar y devolver feedback + recompensa
CREATE OR REPLACE FUNCTION public.save_midnight_journal(
  p_user_id UUID,
  p_victories TEXT,
  p_challenges TEXT,
  p_tomorrow_focus TEXT,
  p_mood INT,
  p_oracle_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_id UUID;
  v_gold_bonus INT := 50;
BEGIN
  INSERT INTO public.valdr_journal_entries (
    user_id,
    entry_date,
    victories,
    challenges,
    tomorrow_focus,
    mood_rating,
    oracle_feedback
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    p_victories,
    p_challenges,
    p_tomorrow_focus,
    p_mood,
    p_oracle_feedback
  )
  ON CONFLICT (user_id, entry_date) DO UPDATE SET
    victories = EXCLUDED.victories,
    challenges = EXCLUDED.challenges,
    tomorrow_focus = EXCLUDED.tomorrow_focus,
    mood_rating = EXCLUDED.mood_rating,
    oracle_feedback = COALESCE(EXCLUDED.oracle_feedback, valdr_journal_entries.oracle_feedback)
  RETURNING id INTO v_inserted_id;

  -- Recompensa de 50 de oro por reflexión diaria
  UPDATE public.valdr_profiles
  SET sovereignty_gold = sovereignty_gold + v_gold_bonus
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_inserted_id,
    'gold_awarded', v_gold_bonus
  );
END;
$$;
`;

const body = JSON.stringify({ query: sqlScript });

const opts = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/' + env.SUPABASE_PROJECT_ID + '/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + env.SUPABASE_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(opts, res => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => {
    console.log('SQL EXECUTION RESULT:', res.statusCode, resData);
  });
});

req.write(body);
req.end();
