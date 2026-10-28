-- ==============================================================================
-- Recompensa de Templanza con una sola moneda (Pokédólares)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.rpc_economy_temperance_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_last DATE;
  v_streak INT := 0;
  v_balance INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT temperance_last_date, COALESCE(temperance_streak_days, 0)
  INTO v_last, v_streak
  FROM public.valdr_profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF v_last IS NOT NULL AND v_last >= v_today THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'La Templanza ya fue confirmada hoy',
      'streak_days', v_streak
    );
  END IF;

  UPDATE public.valdr_profiles
  SET temperance_last_date = v_today,
      temperance_streak_days = v_streak + 1,
      sovereignty_gold = COALESCE(sovereignty_gold, 0) + 100,
      updated_at = now()
  WHERE id = v_uid;

  UPDATE public.profiles
  SET pokedollars = COALESCE(pokedollars, 0) + 100,
      updated_at = now()
  WHERE id = v_uid
  RETURNING pokedollars INTO v_balance;

  PERFORM public.economy_log(
    v_uid, 'temperance', 100, v_balance,
    'Templanza confirmada: +100 ₽',
    jsonb_build_object('streak_days', v_streak + 1)
  );

  RETURN jsonb_build_object(
    'success', true,
    'gold_awarded', 100,
    'new_gold', v_balance,
    'streak_days', v_streak + 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_economy_temperance_reward() TO authenticated;
