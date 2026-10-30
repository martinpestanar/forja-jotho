-- ==============================================================================
-- SYNDEX 2.0: CEREBRO DE HÁBITOS, BOTÍN Y ECONOMÍA DURA (Modo Difícil)
-- ==============================================================================
-- Conecta los 4 Pilares con la Economía Real de Johto (Pokédólares, Bóveda e Ítems)
-- Cada pilar otorga recompensas diferenciadas e inyectables al juego.
-- ==============================================================================

-- 1. Tabla de Registro Diario de Hábitos
CREATE TABLE IF NOT EXISTS public.user_habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('cuerpo', 'mente', 'conciencia', 'dinero')),
  habit_title TEXT NOT NULL,
  minutes_spent INT NOT NULL DEFAULT 30,
  log_date DATE NOT NULL DEFAULT (timezone('America/Bogota', now()))::date,
  proof_url_or_note TEXT,
  pokedollars_earned INT NOT NULL DEFAULT 0,
  battery_minutes_earned INT NOT NULL DEFAULT 0,
  item_reward_granted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_habit_daily UNIQUE (user_id, habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.user_habit_logs(user_id, log_date);

-- 2. RPC Maestra: Registrar Cumplimiento de Hábito y Entregar Botín Duro
CREATE OR REPLACE FUNCTION public.rpc_complete_habit_v2(
  p_habit_id TEXT,
  p_pillar TEXT,
  p_habit_title TEXT,
  p_target_minutes INT DEFAULT 30,
  p_proof TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_p RECORD;
  v_pokedollars_reward INT := 0;
  v_battery_reward INT := 0;
  v_item_code TEXT := NULL;
  v_item_name TEXT := NULL;
  v_item_type TEXT := 'item';
  v_balance INT;
  v_vault_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar si ya se cobró hoy este hábito
  IF EXISTS (
    SELECT 1 FROM public.user_habit_logs 
    WHERE user_id = v_uid AND habit_id = p_habit_id AND log_date = v_today
  ) THEN
    SELECT pokedollars INTO v_balance FROM public.profiles WHERE id = v_uid;
    RETURN jsonb_build_object(
      'success', true, 
      'already_logged', true, 
      'message', 'Hábito ya registrado hoy',
      'wallet', v_balance
    );
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;

  -- 1. Batería de juego proporcional al esfuerzo (Máximo 25 min por hábito)
  v_battery_reward := LEAST(25, GREATEST(10, ROUND(p_target_minutes * 0.25)::INT));

  -- 2. Botín y Dinero según el Pilar (Economía calibrada)
  IF p_pillar = 'cuerpo' THEN
    v_pokedollars_reward := 35;
    -- Recompensa de Ítem físico para el cartucho
    v_item_code := CASE (ROUND(random() * 2)::INT)
      WHEN 0 THEN 'PROTEIN'
      WHEN 1 THEN 'IRON'
      ELSE 'SITRUS_BERRY'
    END;
    v_item_name := CASE v_item_code
      WHEN 'PROTEIN' THEN 'Proteína (+10 EV Ataque)'
      WHEN 'IRON' THEN 'Hierro (+10 EV Defensa)'
      ELSE 'Baya Zidra'
    END;

  ELSIF p_pillar = 'mente' THEN
    v_pokedollars_reward := 45;
    -- Recompensa intelectual / estudio
    v_item_code := CASE (ROUND(random() * 2)::INT)
      WHEN 0 THEN 'CALCIUM'
      WHEN 1 THEN 'ZINC'
      ELSE 'RARE_CANDY'
    END;
    v_item_name := CASE v_item_code
      WHEN 'CALCIUM' THEN 'Calcio (+10 EV At. Esp)'
      WHEN 'ZINC' THEN 'Zinc (+10 EV Def. Esp)'
      ELSE 'Caramelo Raro (+1 Nivel)'
    END;

  ELSIF p_pillar = 'conciencia' THEN
    v_pokedollars_reward := 30;
    -- Recompensa espiritual / afecto
    v_item_code := 'SOOTHE_BELL';
    v_item_name := 'Campana Alivio (Afecto x2)';

  ELSIF p_pillar = 'dinero' THEN
    -- El pilar de dinero entrega más capital pero ningún ítem gratis
    v_pokedollars_reward := 80;
    v_item_code := 'NUGGET';
    v_item_name := 'Pepita de Oro';
  ELSE
    v_pokedollars_reward := 25;
  END IF;

  -- Actualizar perfil del usuario
  v_balance := v_p.pokedollars + v_pokedollars_reward;
  
  UPDATE public.profiles
  SET pokedollars = v_balance,
      battery_minutes = COALESCE(battery_minutes, 0) + v_battery_reward,
      last_productive_date = v_today,
      updated_at = now()
  WHERE id = v_uid;

  -- Si otorgó ítem, depositarlo en la Bóveda Ancestral para inyección a la ROM
  IF v_item_code IS NOT NULL THEN
    INSERT INTO public.valdr_vault (
      user_id, item_type, item_id_or_species, display_name, quantity, status, source
    )
    VALUES (
      v_uid, v_item_type, v_item_code, v_item_name, 1, 'in_vault', 'habit_reward'
    )
    RETURNING id INTO v_vault_id;
  END IF;

  -- Registrar en log de hábitos
  INSERT INTO public.user_habit_logs (
    user_id, habit_id, pillar, habit_title, minutes_spent, log_date,
    proof_url_or_note, pokedollars_earned, battery_minutes_earned, item_reward_granted
  )
  VALUES (
    v_uid, p_habit_id, p_pillar, p_habit_title, p_target_minutes, v_today,
    p_proof, v_pokedollars_reward, v_battery_reward, v_item_code
  );

  -- Registrar en bitácora económica (economy_log)
  PERFORM public.economy_log(
    v_uid, 'work_reward', v_pokedollars_reward, v_balance,
    format('Hábito cumplido: %s (+%s ₽)', p_habit_title, v_pokedollars_reward),
    jsonb_build_object('pillar', p_pillar, 'item', v_item_code, 'battery', v_battery_reward)
  );

  RETURN jsonb_build_object(
    'success', true,
    'pillar', p_pillar,
    'pokedollars_earned', v_pokedollars_reward,
    'battery_earned', v_battery_reward,
    'item_granted', v_item_code,
    'item_name', v_item_name,
    'wallet', v_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_complete_habit_v2(TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_habit_v2(TEXT, TEXT, TEXT, INT, TEXT) TO authenticated;
