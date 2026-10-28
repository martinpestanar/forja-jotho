-- ============================================================================
-- Versiona rpc_valdr_dispatch_vault_item (Bóveda → cartucho)
--
-- Esta función vivía SOLO en producción: no estaba en supabase/migrations.
-- Si el proyecto se recreaba, la Bóveda dejaba de despachar sin error visible.
--
-- Cambios respecto a la versión que estaba en producción:
--   1. SET search_path = public (SECURITY DEFINER sin search_path fijo es
--      vector de secuestro de funciones).
--   2. El UPDATE pasa a ser la operación atómica: antes hacía SELECT y luego
--      UPDATE, así que dos llamadas concurrentes podían despachar dos veces
--      el mismo ítem.
--   3. REVOKE del EXECUTE público (estaba expuesto a anon vía PUBLIC).
--
-- Idempotente: CREATE OR REPLACE + REVOKE/GRANT.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_valdr_dispatch_vault_item(p_vault_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_item RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Atómico: solo una llamada puede mover el ítem de in_vault a despachado.
  UPDATE public.valdr_vault
     SET status = 'dispatched_to_save',
         dispatched_at = NOW()
   WHERE id = p_vault_id
     AND user_id = v_user_id
     AND status = 'in_vault'
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El objeto no se encuentra disponible en la Bóveda Ancestral';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_type', v_item.item_type,
    'item_id', v_item.item_id_or_species,
    'quantity', v_item.quantity,
    'payload', v_item.payload_json,
    'is_shiny', v_item.is_shiny
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_valdr_dispatch_vault_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_valdr_dispatch_vault_item(uuid) TO authenticated;
