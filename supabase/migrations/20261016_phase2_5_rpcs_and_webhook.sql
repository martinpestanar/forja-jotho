-- ==============================================================================
-- FASE 2.5: Inyección de Lógica en PostgreSQL (Supabase)
-- ==============================================================================

-- 1. Agregar parent_whatsapp a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT;

-- 2. Asegurar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Crear Bucket gba-saves en Storage (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gba-saves',
  'gba-saves',
  false,
  10485760,
  ARRAY['application/octet-stream', 'application/x-gba-rom', 'application/binary']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Políticas de Storage RLS para gba-saves ({user_id}/savegame.sav)
DROP POLICY IF EXISTS "Allow authenticated read own save" ON storage.objects;
CREATE POLICY "Allow authenticated read own save" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gba-saves' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow authenticated insert own save" ON storage.objects;
CREATE POLICY "Allow authenticated insert own save" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gba-saves' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow authenticated update own save" ON storage.objects;
CREATE POLICY "Allow authenticated update own save" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gba-saves' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow authenticated delete own save" ON storage.objects;
CREATE POLICY "Allow authenticated delete own save" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gba-saves' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==============================================================================
-- 4 FUNCIONES RPC (SECURITY DEFINER)
-- ==============================================================================

-- RPC 1: rpc_consume_battery_minute()
CREATE OR REPLACE FUNCTION public.rpc_consume_battery_minute()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_remaining INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  UPDATE public.profiles
  SET battery_minutes = GREATEST(0, battery_minutes - 1),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_user_id
  RETURNING battery_minutes INTO v_remaining;

  RETURN COALESCE(v_remaining, 0);
END;
$$;

-- RPC 2: rpc_grant_activity_reward()
CREATE OR REPLACE FUNCTION public.rpc_grant_activity_reward(
  p_activity_type TEXT,
  p_mission_id TEXT DEFAULT NULL,
  p_project_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_add_xp INT := 0;
  v_add_pokedollars INT := 0;
  v_add_battery INT := 15;
  v_add_steps INT := 0;
  v_new_steps INT := 0;
  v_hatched BOOLEAN := false;
  v_is_shiny BOOLEAN := false;
  v_shiny_roll INT;
  v_new_level INT;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  -- Cálculo según tipo de actividad
  IF p_activity_type = 'trivia_win' THEN
    v_add_xp := 30;
    v_add_pokedollars := 25;
    v_add_steps := 10;
  ELSIF p_activity_type = 'pokegear_fix' THEN
    v_add_xp := 50;
    v_add_pokedollars := 25;
    v_add_steps := 20;
  ELSIF p_activity_type = 'mission_complete' THEN
    v_add_xp := 150;
    v_add_pokedollars := 100;
    v_add_steps := 50;

    -- Registrar en missions_progress
    IF p_mission_id IS NOT NULL THEN
      INSERT INTO public.missions_progress (user_id, mission_id, project_url, quiz_passed, completed_at)
      VALUES (v_user_id, p_mission_id, p_project_url, true, timezone('utc'::text, now()))
      ON CONFLICT (user_id, mission_id) DO UPDATE SET
        project_url = COALESCE(EXCLUDED.project_url, missions_progress.project_url),
        quiz_passed = true,
        completed_at = timezone('utc'::text, now());
    END IF;
  ELSE
    v_add_xp := 20;
    v_add_pokedollars := 15;
    v_add_steps := 10;
  END IF;

  -- Lógica de Incubadora (egg_steps)
  v_new_steps := v_profile.egg_steps + v_add_steps;
  IF v_new_steps >= 100 THEN
    v_hatched := true;
    v_new_steps := v_new_steps - 100;

    -- Cálculo de Shiny aumentado si streak_days >= 7
    v_shiny_roll := floor(random() * 100) + 1;
    IF v_profile.streak_days >= 7 THEN
      v_is_shiny := (v_shiny_roll <= 25); -- 25% de probabilidad
    ELSE
      v_is_shiny := (v_shiny_roll <= 5);  -- 5% estándar
    END IF;
  END IF;

  -- Nivel (cada 100 XP sube 1 nivel)
  v_new_level := 1 + floor((v_profile.xp + v_add_xp) / 100);

  -- Actualizar perfil atómicamente
  UPDATE public.profiles
  SET xp = xp + v_add_xp,
      pokedollars = pokedollars + v_add_pokedollars,
      battery_minutes = battery_minutes + v_add_battery,
      egg_steps = v_new_steps,
      current_level = GREATEST(current_level, v_new_level),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'added_xp', v_add_xp,
    'added_pokedollars', v_add_pokedollars,
    'added_battery', v_add_battery,
    'added_steps', v_add_steps,
    'egg_hatched', v_hatched,
    'is_shiny', v_is_shiny,
    'new_egg_steps', v_new_steps,
    'current_level', GREATEST(v_profile.current_level, v_new_level)
  );

  RETURN v_result;
END;
$$;

-- RPC 3: rpc_purchase_shop_item()
CREATE OR REPLACE FUNCTION public.rpc_purchase_shop_item(
  p_item_id TEXT,
  p_cost INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT pokedollars INTO v_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  IF v_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fondos insuficientes', 'pokedollars', v_balance);
  END IF;

  -- Descontar saldo
  UPDATE public.profiles
  SET pokedollars = pokedollars - p_cost,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_user_id;

  -- Registrar compra en inventario
  INSERT INTO public.shop_inventory (user_id, item_id, purchased_at)
  VALUES (v_user_id, p_item_id, timezone('utc'::text, now()));

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'remaining_pokedollars', v_balance - p_cost
  );
END;
$$;

-- RPC 4: rpc_activate_squad_cable()
CREATE OR REPLACE FUNCTION public.rpc_activate_squad_cable(
  p_room_pin TEXT,
  p_squad_id TEXT,
  p_cable_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_updated_cables JSONB;
  v_damage INT := 0;
  v_all_active BOOLEAN := false;
  v_new_hp INT;
  v_status room_status_enum;
BEGIN
  SELECT * INTO v_room FROM public.arena_rooms WHERE room_pin = p_room_pin FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sala no encontrada: %', p_room_pin;
  END IF;

  -- Actualizar de forma atómica el cable indicado a true
  v_updated_cables := jsonb_set(
    COALESCE(v_room.squad_cables_json, '{"fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb),
    ARRAY[p_cable_role],
    'true'::jsonb,
    true
  );

  -- Comprobar si los 3 cables del escuadrón están conectados
  IF (v_updated_cables->>'fuego_ui')::boolean = true AND
     (v_updated_cables->>'agua_data')::boolean = true AND
     (v_updated_cables->>'planta_bots')::boolean = true THEN
    v_all_active := true;
    v_damage := 25;
    -- Reiniciar cables para el siguiente ciclo de sobrecarga
    v_updated_cables := '{"fuego_ui": false, "agua_data": false, "planta_bots": false}'::jsonb;
  END IF;

  v_new_hp := GREATEST(0, v_room.boss_hp - v_damage);
  IF v_new_hp = 0 THEN
    v_status := 'victory';
  ELSE
    v_status := v_room.status;
  END IF;

  UPDATE public.arena_rooms
  SET squad_cables_json = v_updated_cables,
      boss_hp = v_new_hp,
      status = v_status,
      updated_at = timezone('utc'::text, now())
  WHERE room_pin = p_room_pin;

  RETURN jsonb_build_object(
    'success', true,
    'boss_hp', v_new_hp,
    'damage_dealt', v_damage,
    'combo_triggered', v_all_active,
    'status', v_status,
    'cables', v_updated_cables
  );
END;
$$;

-- ==============================================================================
-- TRIGGER CON PG_NET: NOTIFICACIÓN A PADRES VÍA WEBHOOK DE N8N
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.notify_parent_via_n8n()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone TEXT;
  v_trainer_name TEXT;
  v_message TEXT;
  v_payload JSONB;
  v_webhook_url TEXT := 'https://n8n.koratflow.agency/webhook/academia-whatsapp-dispatcher';
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Disparador en Onboarding finalizado
    IF NEW.parent_whatsapp IS NOT NULL AND (OLD.starter_pokemon IS NULL OR OLD.starter_pokemon != NEW.starter_pokemon) THEN
      v_phone := NEW.parent_whatsapp;
      v_trainer_name := NEW.trainer_name;
      v_message := format(
        '🎮 *Academia Cyber-Johto* | ¡Hola! Le informamos que %s ha completado su ceremonia de iniciación con el Pokémon inicial *%s* (Rol: %s). ¡Ha iniciado con éxito su entrenamiento en programación y tecnología!',
        v_trainer_name,
        upper(NEW.starter_pokemon::text),
        upper(NEW.nature_role::text)
      );

      v_payload := jsonb_build_object(
        'phone', v_phone,
        'message', v_message,
        'event', 'onboarding_complete',
        'trainer_name', v_trainer_name
      );

      PERFORM net.http_post(
        url := v_webhook_url,
        body := v_payload,
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    END IF;

  ELSIF TG_TABLE_NAME = 'missions_progress' THEN
    -- Disparador en Misión completada
    IF NEW.quiz_passed = true THEN
      SELECT parent_whatsapp, trainer_name INTO v_phone, v_trainer_name
      FROM public.profiles WHERE id = NEW.user_id;

      IF v_phone IS NOT NULL THEN
        v_message := format(
          '⭐ *Academia Cyber-Johto* | ¡Gran logro! %s acaba de superar con éxito la misión técnica *%s*. Se han acreditado +100 Pokédólares y +15 min de batería GBA.',
          v_trainer_name,
          NEW.mission_id
        );

        v_payload := jsonb_build_object(
          'phone', v_phone,
          'message', v_message,
          'event', 'mission_completed',
          'mission_id', NEW.mission_id,
          'project_url', NEW.project_url
        );

        PERFORM net.http_post(
          url := v_webhook_url,
          body := v_payload,
          headers := '{"Content-Type": "application/json"}'::jsonb
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Evitar que una falla del webhook bloquee la transacción principal
  RAISE WARNING 'Falla al disparar webhook n8n: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para profiles
DROP TRIGGER IF EXISTS tr_notify_parent_onboarding ON public.profiles;
CREATE TRIGGER tr_notify_parent_onboarding
  AFTER UPDATE OF starter_pokemon, parent_whatsapp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parent_via_n8n();

-- Trigger para missions_progress
DROP TRIGGER IF EXISTS tr_notify_parent_mission ON public.missions_progress;
CREATE TRIGGER tr_notify_parent_mission
  AFTER INSERT OR UPDATE OF quiz_passed ON public.missions_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parent_via_n8n();
