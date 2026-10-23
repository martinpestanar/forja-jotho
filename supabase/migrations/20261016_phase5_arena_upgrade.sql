-- ==============================================================================
-- FASE 5: Actualización de rpc_activate_squad_cable para soporte multi-escuadrón
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_activate_squad_cable(
  p_room_pin TEXT,
  p_squad_id TEXT,
  p_cable_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_room RECORD;
  v_cables JSONB;
  v_squad JSONB;
  v_damage INT := 0;
  v_all_active BOOLEAN := false;
  v_new_hp INT;
  v_status room_status_enum;
  v_squad_key TEXT := COALESCE(NULLIF(p_squad_id, ''), 'squad_1');
BEGIN
  SELECT * INTO v_room FROM public.arena_rooms WHERE room_pin = p_room_pin FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada: %', p_room_pin;
  END IF;

  v_cables := COALESCE(v_room.squad_cables_json, '{}'::jsonb);

  -- Si el jsonb es la estructura plana simple (fase previa), obtener de ahí o del objeto anidado
  IF (v_cables ? p_cable_role) AND NOT (v_cables ? v_squad_key) THEN
    v_squad := v_cables;
  ELSE
    v_squad := COALESCE(v_cables->v_squad_key, '{"fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb);
  END IF;

  -- Actualizar el cable específico en true
  v_squad := jsonb_set(v_squad, ARRAY[p_cable_role], 'true'::jsonb, true);

  -- Verificar si los 3 cables del escuadrón están conectados
  IF COALESCE((v_squad->>'fuego_ui')::boolean, false) = true AND
     COALESCE((v_squad->>'agua_data')::boolean, false) = true AND
     COALESCE((v_squad->>'planta_bots')::boolean, false) = true THEN
    v_all_active := true;
    v_damage := 25;
    -- Reset del escuadrón para permitir el siguiente ciclo de sobrecarga
    v_squad := '{"fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb;
  END IF;

  -- Guardar de vuelta en squad_cables_json
  v_cables := jsonb_set(v_cables, ARRAY[v_squad_key], v_squad, true);
  -- También mantener retrocompatibilidad plana en la raíz si es squad_1
  IF v_squad_key = 'squad_1' THEN
    v_cables := v_cables || v_squad;
  END IF;

  v_new_hp := GREATEST(0, v_room.boss_hp - v_damage);
  IF v_new_hp = 0 THEN
    v_status := 'victory';
  ELSE
    v_status := 'active';
  END IF;

  UPDATE public.arena_rooms
  SET squad_cables_json = v_cables,
      boss_hp = v_new_hp,
      status = v_status,
      updated_at = timezone('utc'::text, now())
  WHERE room_pin = p_room_pin;

  RETURN jsonb_build_object(
    'success', true,
    'squad_id', v_squad_key,
    'boss_hp', v_new_hp,
    'damage_dealt', v_damage,
    'combo_triggered', v_all_active,
    'status', v_status,
    'squad_cables', v_cables
  );
END;
$func$;

-- Crear sala por defecto 'JOHT' si no existe
INSERT INTO public.arena_rooms (room_pin, boss_name, boss_hp, timer_seconds, status, squad_cables_json)
VALUES (
  'JOHT',
  'Código Silver - Titán Cyber-Johto',
  100,
  1500,
  'active',
  '{"squad_1": {"fuego_ui": false, "agua_data": false, "planta_bots": false}, "squad_2": {"fuego_ui": false, "agua_data": false, "planta_bots": false}, "squad_3": {"fuego_ui": false, "agua_data": false, "planta_bots": false}, "squad_4": {"fuego_ui": false, "agua_data": false, "planta_bots": false}, "fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb
)
ON CONFLICT (room_pin) DO UPDATE SET
  boss_hp = CASE WHEN arena_rooms.boss_hp = 0 THEN 100 ELSE arena_rooms.boss_hp END,
  status = 'active';
