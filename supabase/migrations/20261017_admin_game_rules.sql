-- ==============================================================================
-- MIGRACIÓN SUPERADMIN: Reglas Dinámicas de Johto, Control Manual/Automático y RPCs
-- ==============================================================================

-- 1. Agregar columna is_admin a profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- NOTA: la versión original promovía a admin al "primer perfil" de la tabla.
-- Eso era un agujero: en un proyecto nuevo, el primer usuario en registrarse
-- se volvía administrador solo. El admin se marca a mano:
--   update public.profiles set is_admin = true where id = '<uuid>';

-- 2. Tabla centralizada de Reglas del Juego (admin_game_rules)
CREATE TABLE IF NOT EXISTS public.admin_game_rules (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (mode IN ('automatic', 'manual', 'hybrid')),
  levels_requirements JSONB NOT NULL DEFAULT '{
    "lvl-1": {
      "level": 1,
      "title": "Gimnasio Malva",
      "badge": "Medalla Céfiro",
      "leader": "Pegaso (Redes & Cloud)",
      "min_xp": 100,
      "required_missions": ["LVL1_TRIVIA_1", "LVL1_CABLE_FLOW"],
      "reward_item": "GBA_RARE_CANDY",
      "is_unlocked": true,
      "manual_unlocked": true
    },
    "lvl-2": {
      "level": 2,
      "title": "Ciudad Azalea",
      "badge": "Medalla Colmena",
      "leader": "Antón (Bugs & Parsers)",
      "min_xp": 250,
      "required_missions": ["LVL2_BUG_HUNT"],
      "reward_item": "GBA_MASTER_BALL",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-3": {
      "level": 3,
      "title": "Ciudad Trigal",
      "badge": "Medalla Planicie",
      "leader": "Blanca (Deadlocks & Memory)",
      "min_xp": 500,
      "required_missions": ["LVL3_API_CABLE"],
      "reward_item": "GBA_RARE_CANDY_5",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-4": {
      "level": 4,
      "title": "Ciudad Iris",
      "badge": "Medalla Niebla",
      "leader": "Morti (Ghost APIs & Webhooks)",
      "min_xp": 800,
      "required_missions": ["LVL4_WEBHOOK_EVENT"],
      "reward_item": "GBA_MAX_REVIVE",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-5": {
      "level": 5,
      "title": "Ciudad Olivo",
      "badge": "Medalla Mineral",
      "leader": "Jazmín (Microservicios)",
      "min_xp": 1200,
      "required_missions": ["LVL5_MICROSERVICE"],
      "reward_item": "GBA_FULL_RESTORE",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-6": {
      "level": 6,
      "title": "Ciudad Orquídea",
      "badge": "Medalla Tormenta",
      "leader": "Aníbal (Stress Testing)",
      "min_xp": 1700,
      "required_missions": ["LVL6_STRESS_TEST"],
      "reward_item": "GBA_SACRED_ASH",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-7": {
      "level": 7,
      "title": "Pueblo Caoba",
      "badge": "Medalla Glaciar",
      "leader": "Fredo (Cold Storage & Backups)",
      "min_xp": 2300,
      "required_missions": ["LVL7_BACKUP_FLOW"],
      "reward_item": "GBA_RARE_CANDY_5",
      "is_unlocked": false,
      "manual_unlocked": false
    },
    "lvl-8": {
      "level": 8,
      "title": "Ciudad Endrino",
      "badge": "Medalla Dragón",
      "leader": "Débora (High Concurrency)",
      "min_xp": 3000,
      "required_missions": ["LVL8_HIGH_CONCURRENCY"],
      "reward_item": "GBA_MASTER_BALL",
      "is_unlocked": false,
      "manual_unlocked": false
    }
  }'::JSONB,
  economy_settings JSONB NOT NULL DEFAULT '{
    "battery_minutes_per_mission": 15,
    "pokedollars_reward_multiplier": 1.0,
    "shiny_rate_weekend_multiplier": 2.5,
    "allow_free_arcade_testing": false
  }'::JSONB,
  manual_overrides JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO public.admin_game_rules (id, mode)
VALUES ('global_config', 'hybrid')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en admin_game_rules
ALTER TABLE public.admin_game_rules ENABLE ROW LEVEL SECURITY;

-- Helper de autorización. SECURITY DEFINER para poder leer profiles.is_admin
-- sin depender de la RLS del que llama.
CREATE OR REPLACE FUNCTION public.is_hq_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_hq_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_hq_admin() TO authenticated;

DROP POLICY IF EXISTS "Public read admin rules" ON public.admin_game_rules;
CREATE POLICY "Public read admin rules" ON public.admin_game_rules
  FOR SELECT TO authenticated, anon
  USING (true);

-- Antes: FOR ALL TO authenticated USING (true) WITH CHECK (true).
-- Cualquier usuario autenticado podía reescribir las reglas del juego.
DROP POLICY IF EXISTS "Admin update admin rules" ON public.admin_game_rules;
CREATE POLICY "Admin update admin rules" ON public.admin_game_rules
  FOR ALL TO authenticated
  USING (public.is_hq_admin())
  WITH CHECK (public.is_hq_admin());

-- ==============================================================================
-- FUNCIONES RPC SUPERADMIN
-- ==============================================================================

-- RPC: Obtener reglas completas
CREATE OR REPLACE FUNCTION public.rpc_get_admin_game_rules()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rules JSONB;
BEGIN
  SELECT to_jsonb(r) INTO v_rules
  FROM public.admin_game_rules r
  WHERE r.id = 'global_config';
  
  IF v_rules IS NULL THEN
    INSERT INTO public.admin_game_rules (id, mode)
    VALUES ('global_config', 'hybrid')
    RETURNING to_jsonb(admin_game_rules.*) INTO v_rules;
  END IF;

  RETURN v_rules;
END;
$$;

-- RPC: Guardar cambios de reglas (Modo, Niveles, Economía)
CREATE OR REPLACE FUNCTION public.rpc_update_admin_game_rules(
  p_mode TEXT,
  p_levels JSONB,
  p_economy JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_hq_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  UPDATE public.admin_game_rules
  SET 
    mode = COALESCE(p_mode, mode),
    levels_requirements = COALESCE(p_levels, levels_requirements),
    economy_settings = COALESCE(p_economy, economy_settings),
    updated_at = NOW()
  WHERE id = 'global_config'
  RETURNING to_jsonb(admin_game_rules.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC: Listar todos los estudiantes con sus datos gamificados para el SuperAdmin
CREATE OR REPLACE FUNCTION public.rpc_admin_get_students()
RETURNS TABLE (
  id UUID,
  trainer_name TEXT,
  starter_pokemon TEXT,
  nature_role TEXT,
  current_level INT,
  xp INT,
  pokedollars INT,
  battery_minutes INT,
  streak_days INT,
  gba_party_json JSONB,
  parent_whatsapp TEXT,
  is_admin BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_hq_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.trainer_name,
    p.starter_pokemon::TEXT,
    p.nature_role::TEXT,
    p.current_level,
    p.xp,
    p.pokedollars,
    p.battery_minutes,
    p.streak_days,
    COALESCE(p.gba_party_json, '[]'::JSONB),
    p.parent_whatsapp,
    COALESCE(p.is_admin, false),
    p.updated_at
  FROM public.profiles p
  ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

-- RPC: Acción de 1 Clic del SuperAdmin sobre un estudiante
CREATE OR REPLACE FUNCTION public.rpc_admin_override_student(
  p_student_id UUID,
  p_action TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.profiles;
  v_amount INT;
  v_target_level INT;
  v_item_key TEXT;
  v_gba_id INT;
  v_pocket TEXT;
BEGIN
  IF NOT public.is_hq_admin() THEN
    RAISE EXCEPTION 'Solo administradores';
  END IF;

  v_amount := COALESCE((p_payload->>'amount')::INT, 15);

  IF p_action = 'grant_battery' THEN
    UPDATE public.profiles
    SET battery_minutes = battery_minutes + v_amount,
        updated_at = NOW()
    WHERE id = p_student_id
    RETURNING * INTO v_updated;

  ELSIF p_action = 'set_battery' THEN
    UPDATE public.profiles
    SET battery_minutes = GREATEST(0, v_amount),
        updated_at = NOW()
    WHERE id = p_student_id
    RETURNING * INTO v_updated;

  ELSIF p_action = 'set_level' THEN
    v_target_level := LEAST(12, GREATEST(1, v_amount));
    UPDATE public.profiles
    SET current_level = v_target_level,
        updated_at = NOW()
    WHERE id = p_student_id
    RETURNING * INTO v_updated;

  ELSIF p_action = 'grant_pokedollars' THEN
    UPDATE public.profiles
    SET pokedollars = pokedollars + v_amount,
        updated_at = NOW()
    WHERE id = p_student_id
    RETURNING * INTO v_updated;

  ELSIF p_action = 'grant_xp' THEN
    UPDATE public.profiles
    SET xp = xp + v_amount,
        updated_at = NOW()
    WHERE id = p_student_id
    RETURNING * INTO v_updated;

  ELSIF p_action = 'inject_item' THEN
    v_item_key := COALESCE(p_payload->>'item_key', 'GBA_RARE_CANDY');
    v_gba_id := COALESCE((p_payload->>'gba_item_id')::INT, 68);
    v_pocket := COALESCE(p_payload->>'gba_pocket', 'ITEMS');

    -- item_id es NOT NULL desde el esquema viejo; si no se rellena, el INSERT
    -- revienta y la acción "inyectar ítem" del panel admin no funcionaba nunca.
    INSERT INTO public.shop_inventory (user_id, item_id, item_key, item_category, gba_item_id, gba_pocket, quantity, injection_status)
    VALUES (p_student_id, v_item_key, v_item_key, 'gba_injectable', v_gba_id, v_pocket, COALESCE((p_payload->>'quantity')::INT, 1), 'pending');

    SELECT * INTO v_updated FROM public.profiles WHERE id = p_student_id;

  ELSE
    RAISE EXCEPTION 'Acción desconocida: %', p_action;
  END IF;

  RETURN to_jsonb(v_updated);
END;
$$;

-- ==============================================================================
-- Permisos
-- Sin esto, PostgreSQL deja EXECUTE a PUBLIC en cada función nueva:
-- cualquier `anon` podía llamar al override y regalarse Pokédólares.
-- ==============================================================================
REVOKE ALL ON FUNCTION public.rpc_get_admin_game_rules() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_update_admin_game_rules(TEXT, JSONB, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_admin_get_students() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_admin_override_student(UUID, TEXT, JSONB) FROM PUBLIC, anon;

-- `rpc_get_admin_game_rules` lo usa el mapa para todos; el resto valida is_admin adentro.
GRANT EXECUTE ON FUNCTION public.rpc_get_admin_game_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_admin_game_rules(TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_students() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_override_student(UUID, TEXT, JSONB) TO authenticated;
