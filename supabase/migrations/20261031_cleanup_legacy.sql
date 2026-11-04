-- ==============================================================================
-- LIMPIEZA: objetos de funcionalidades eliminadas del producto
-- ==============================================================================
-- Nada de esto lo usa ni el front (verificado con .from() / .rpc() en src) ni
-- ninguna otra funcion. Respaldo de filas en backup-legacy-20261030.json.
--
-- Contexto: el producto quedo reducido a Korat Flow HQ + juego GBA. Se fueron
-- el panel /admin, la Arena de Jefes con PIN, las misiones escolares y el
-- pipeline de video de la agencia anterior.
-- ==============================================================================

-- ------------------------------------------------------------------
-- 1. Panel /admin (eliminado del repo): reglas dinamicas del juego
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin update admin rules" ON public.admin_game_rules;
DROP POLICY IF EXISTS "Public read admin rules" ON public.admin_game_rules;

DROP FUNCTION IF EXISTS public.rpc_admin_override_student(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.rpc_admin_get_students();
DROP FUNCTION IF EXISTS public.rpc_update_admin_game_rules(TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.rpc_get_admin_game_rules();
DROP FUNCTION IF EXISTS public.is_hq_admin();

DROP TABLE IF EXISTS public.admin_game_rules;

-- ------------------------------------------------------------------
-- 2. Arena de Jefes con PIN (pantalla /projector eliminada)
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.rpc_activate_squad_cable(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.arena_rooms;

-- ------------------------------------------------------------------
-- 3. Misiones escolares: el reparto de recompensas hoy pasa por
--    rpc_hq_claim_work_reward (Time Engine del HQ).
-- ------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_notify_parent_mission ON public.missions_progress;
DROP FUNCTION IF EXISTS public.rpc_grant_activity_reward(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.missions_progress;

-- ------------------------------------------------------------------
-- 4. RPC de bateria reemplazada por el cliente + claim del HQ
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.rpc_consume_battery_minute();

-- ------------------------------------------------------------------
-- 5. Restos del pipeline de video de la agencia anterior
-- ------------------------------------------------------------------
DROP TABLE IF EXISTS public.google_accounts_pool;

-- ------------------------------------------------------------------
-- 6. Diario nocturno: save_midnight_journal nunca existio en produccion
--    y ninguna pantalla lo alimenta. La tabla estaba vacia.
-- ------------------------------------------------------------------
DROP TABLE IF EXISTS public.valdr_journal_entries;
