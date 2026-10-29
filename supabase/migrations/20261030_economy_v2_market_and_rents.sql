-- ==============================================================================
-- FASE 2.0 · WALL STREET JOHTO, BONGURIS, BOT SILPH CO., RENTAS Y SUELDO HQ
-- ==============================================================================
-- 1. Sueldo HQ por Tareas y Bloques (~420 ₽/día para meta de 4 meses = 50.000 ₽).
-- 2. Mercado de Bonguris (7 colores -> Balls de Kurt) + Bayas competitivas.
-- 3. Seguimiento de Precio Promedio de Compra (avg_buy_price) y P&L en Bóveda.
-- 4. Bot Market Maker (Silph Co. Auto-Trader) + Noticias/Eventos Semanales IA.
-- 5. Gastos Fijos Semanales (PC de Bill + Bóveda + Licencia Liga) vs.
--    Activos de Renta Pasiva (Árboles Bonguri, Granja Miltank, Bonos Silph, Staking PC).
-- 6. Moneda Única Espejo App <-> Cartucho GBA (Sincronización Delta sin exploits).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Ajustar configuración base a la meta de 50.000 ₽ (4 meses = 120 días)
-- ------------------------------------------------------------------------------
UPDATE public.economy_config
SET dratini_price = 50000,
    daily_net_estimate = 420,
    tax_base = 12,
    tax_per_extra_box = 8,
    tax_per_vault_block = 4,
    expedition_bonus_pct = 1.00,
    expedition_week_cap = 1500,
    updated_at = now()
WHERE id = 'global';

-- Añadir columna avg_buy_price a valdr_vault para calcular P&L real del portafolio
ALTER TABLE public.valdr_vault ADD COLUMN IF NOT EXISTS avg_buy_price NUMERIC NOT NULL DEFAULT 0;

-- Añadir columnas de control de vigor diario y rentas en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_productive_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_rent_payout_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_combat_earned INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_combat_date DATE;

-- ------------------------------------------------------------------------------
-- 1. Catálogo ampliado: 7 Bonguris (Mercado) + Shinies Variados (20k / 35k / 50k)
-- ------------------------------------------------------------------------------
-- Actualizar Dratini Shiny a 50.000 ₽
UPDATE public.economy_shop_prices
SET price = 50000, base_price = 50000, display_name = 'Dratini Shiny ✦ (Meta 4 Meses)'
WHERE item_id = 'SHINY_DRATINI';

-- Insertar los 7 Bonguris de Johto (al despachar al juego entregan la Ball de César)
INSERT INTO public.economy_shop_prices (item_id, kind, category, price, base_price, gba_item_id, gba_pocket, display_name, payload) VALUES
  ('BONGURI_RED',    'item', 'market', 85,  85,  18, 'POKEBALLS', 'Bonguri Rojo (Nivel Ball)',    '{"bonguri":true,"ballName":"Nivel Ball"}'),
  ('BONGURI_BLUE',   'item', 'market', 95,  95,  14, 'POKEBALLS', 'Bonguri Azul (Cebo Ball)',     '{"bonguri":true,"ballName":"Cebo Ball"}'),
  ('BONGURI_YELLOW', 'item', 'market', 110, 110, 17, 'POKEBALLS', 'Bonguri Amarillo (Luna Ball)', '{"bonguri":true,"ballName":"Luna Ball"}'),
  ('BONGURI_GREEN',  'item', 'market', 90,  90,  15, 'POKEBALLS', 'Bonguri Verde (Amigo Ball)',   '{"bonguri":true,"ballName":"Amigo Ball"}'),
  ('BONGURI_PINK',   'item', 'market', 105, 105, 13, 'POKEBALLS', 'Bonguri Rosa (Amor Ball)',     '{"bonguri":true,"ballName":"Amor Ball"}'),
  ('BONGURI_WHITE',  'item', 'market', 140, 140, 19, 'POKEBALLS', 'Bonguri Blanco (Rapid Ball)',  '{"bonguri":true,"ballName":"Rapid Ball"}'),
  ('BONGURI_BLACK',  'item', 'market', 165, 165, 16, 'POKEBALLS', 'Bonguri Negro (Peso Ball)',    '{"bonguri":true,"ballName":"Peso Ball"}')
ON CONFLICT (item_id) DO UPDATE SET
  price = EXCLUDED.price,
  base_price = EXCLUDED.base_price,
  gba_item_id = EXCLUDED.gba_item_id,
  gba_pocket = EXCLUDED.gba_pocket,
  display_name = EXCLUDED.display_name,
  payload = EXCLUDED.payload,
  active = TRUE;

-- Insertar variedad de Pokémon Shinies (Tier Leyenda 50k, Tier Élite 35k, Tier Especial 22k-25k)
INSERT INTO public.economy_shop_prices (item_id, kind, category, price, base_price, display_name, payload) VALUES
  ('SHINY_LARVITAR',   'pokemon', 'shiny', 50000, 50000, 'Larvitar Shiny ✦ (Titán 6-IV)',   '{"speciesId":246,"level":10,"perfectIVs":true,"tier":"legend"}'),
  ('SHINY_BELDUM',     'pokemon', 'shiny', 50000, 50000, 'Beldum Shiny ✦ (Metagross Gold)', '{"speciesId":374,"level":10,"perfectIVs":true,"tier":"legend"}'),
  ('SHINY_BAGON',      'pokemon', 'shiny', 48000, 48000, 'Bagon Shiny ✦ (Salamence Jade)',  '{"speciesId":371,"level":10,"perfectIVs":true,"tier":"legend"}'),
  ('SHINY_CHARMANDER', 'pokemon', 'shiny', 35000, 35000, 'Charmander Shiny ✦ (Charizard Negro)', '{"speciesId":4,"level":10,"perfectIVs":true,"tier":"elite"}'),
  ('SHINY_MUDKIP',     'pokemon', 'shiny', 35000, 35000, 'Mudkip Shiny ✦ (Swampert Purpúreo)', '{"speciesId":258,"level":10,"perfectIVs":true,"tier":"elite"}'),
  ('SHINY_TREECKO',    'pokemon', 'shiny', 35000, 35000, 'Treecko Shiny ✦ (Sceptile Cian)',  '{"speciesId":252,"level":10,"perfectIVs":true,"tier":"elite"}'),
  ('SHINY_GASTLY',     'pokemon', 'shiny', 32000, 32000, 'Gastly Shiny ✦ (Gengar Espectral)', '{"speciesId":92,"level":12,"perfectIVs":true,"tier":"elite"}'),
  ('SHINY_RALTS',      'pokemon', 'shiny', 25000, 25000, 'Ralts Shiny ✦ (Gardevoir Azul)',   '{"speciesId":280,"level":10,"perfectIVs":true,"tier":"special"}'),
  ('SHINY_SCYTHER',    'pokemon', 'shiny', 25000, 25000, 'Scyther Shiny ✦ (Scizor Verde)',   '{"speciesId":123,"level":15,"perfectIVs":true,"tier":"special"}'),
  ('SHINY_HERACROSS',  'pokemon', 'shiny', 22000, 22000, 'Heracross Shiny ✦ (Escarabajo Imperial)', '{"speciesId":214,"level":15,"perfectIVs":true,"tier":"special"}'),
  ('PKMN_SHINY_EEVEE', 'pokemon', 'shiny', 22000, 22000, 'Eevee Plateado ✦ (Shiny 6-IVs)',   '{"speciesId":133,"level":15,"perfectIVs":true,"tier":"special"}')
ON CONFLICT (item_id) DO UPDATE SET
  price = EXCLUDED.price,
  base_price = EXCLUDED.base_price,
  display_name = EXCLUDED.display_name,
  payload = EXCLUDED.payload,
  active = TRUE;

-- Kit de Supervivencia de Emergencia (Siempre comprable aunque haya deuda)
INSERT INTO public.economy_shop_prices (item_id, kind, category, price, base_price, gba_item_id, gba_pocket, display_name) VALUES
  ('GBA_POKE_BALL', 'item', 'balls', 20, 20, 4, 'POKEBALLS', 'Poké Ball Estándar'),
  ('GBA_GREAT_BALL', 'item', 'balls', 30, 30, 3, 'POKEBALLS', 'Super Ball')
ON CONFLICT (item_id) DO UPDATE SET
  price = EXCLUDED.price,
  base_price = EXCLUDED.base_price,
  active = TRUE;

-- ------------------------------------------------------------------------------
-- 2. Tablas del Mercado Vivo: Eventos Semanales IA + Libro de Órdenes del Bot
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key TEXT NOT NULL,                 -- ej: '2026-W44'
  regime TEXT NOT NULL DEFAULT 'CYCLE',   -- CRASH | BULL_RUN | SQUEEZE | ROCKET_MANIPULATION | CYCLE
  headline TEXT NOT NULL,                 -- Noticia principal (máx 2 líneas)
  rumor TEXT NOT NULL,                    -- Pista de lo que pasará en los próximos días
  crash_item_id TEXT NOT NULL,            -- Bonguri/Baya en desplome esta mitad de semana
  boom_item_id TEXT NOT NULL,             -- Bonguri/Baya en subida fuerte
  crash_discount_pct INT NOT NULL DEFAULT -42,
  boom_surge_pct INT NOT NULL DEFAULT 48,
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until DATE NOT NULL DEFAULT (CURRENT_DATE + 7),
  source TEXT NOT NULL DEFAULT 'oracle_ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS economy_market_events_dates_idx
  ON public.economy_market_events (active_from DESC, active_until DESC);

ALTER TABLE public.economy_market_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_market_events_read" ON public.economy_market_events;
CREATE POLICY "economy_market_events_read" ON public.economy_market_events
  FOR SELECT TO authenticated, anon USING (true);

-- Libro de órdenes relámpago del Bot Mercader (Silph Co. Auto-Trader)
CREATE TABLE IF NOT EXISTS public.economy_bot_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bot_name TEXT NOT NULL DEFAULT 'Bot Silph Co.',
  order_side TEXT NOT NULL CHECK (order_side IN ('BUY_FROM_USER', 'SELL_TO_USER')),
  item_id TEXT NOT NULL REFERENCES public.economy_shop_prices(item_id) ON DELETE CASCADE,
  unit_price INT NOT NULL CHECK (unit_price > 0),
  max_qty INT NOT NULL DEFAULT 15,
  remaining_qty INT NOT NULL DEFAULT 15 CHECK (remaining_qty >= 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS economy_bot_orders_date_idx
  ON public.economy_bot_orders (trade_date DESC);

ALTER TABLE public.economy_bot_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_bot_orders_read" ON public.economy_bot_orders;
CREATE POLICY "economy_bot_orders_read" ON public.economy_bot_orders
  FOR SELECT TO authenticated, anon USING (true);

-- ------------------------------------------------------------------------------
-- 3. Activos de Renta Pasiva, Staking en PC y Gastos Fijos Semanales
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_passive_catalog (
  asset_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,                 -- 'agro' | 'ranch' | 'dividend' | 'staking'
  purchase_cost INT NOT NULL CHECK (purchase_cost >= 0),
  daily_yield_rp INT NOT NULL DEFAULT 0,  -- Renta diaria en ₽
  yield_item_id TEXT,                     -- Si produce un Bonguri diario en vez de ₽
  yield_item_qty INT NOT NULL DEFAULT 0,
  weekly_upkeep INT NOT NULL DEFAULT 0,   -- Costo de mantenimiento semanal
  max_owned INT NOT NULL DEFAULT 5,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.economy_passive_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_passive_catalog_read" ON public.economy_passive_catalog;
CREATE POLICY "economy_passive_catalog_read" ON public.economy_passive_catalog
  FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.economy_passive_catalog (
  asset_code, display_name, category, purchase_cost, daily_yield_rp, yield_item_id, yield_item_qty, weekly_upkeep, max_owned, description
) VALUES
  ('KURT_BONGURI_ORCHARD', 'Huerto de Bonguris (Pueblo Azalea)', 'agro',     2400, 0,   'BONGURI_BLACK', 2, 25, 5, 'Produce 2 Bonguris diarios directo a tu Bóveda si cumples 1 tarea hoy.'),
  ('MOOMOO_DAIRY_SHARE',   'Vaca Miltank en Granja Mu-Mu',       'ranch',    5800, 95,  NULL,            0, 40, 4, 'Exporta Leche Mu-Mu a Ciudad Olivo: +95 ₽/día de renta en días productivos.'),
  ('SILPH_CO_BOND',        'Bono Corporativo Silph Co.',         'dividend', 11000, 175, NULL,            0, 50, 3, 'Paga +175 ₽/día (+bono alcista si el mercado está en Bull Run).'),
  ('PC_LEAGUE_GUARD_SLOT', 'Contrato Guardia de la Liga (PC)',   'staking',  1500, 45,  NULL,            0, 15, 6, 'Asigna un Pokémon evolucionado de tu PC a patrullar rutas: +45 ₽/día.')
ON CONFLICT (asset_code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  purchase_cost = EXCLUDED.purchase_cost,
  daily_yield_rp = EXCLUDED.daily_yield_rp,
  yield_item_id = EXCLUDED.yield_item_id,
  yield_item_qty = EXCLUDED.yield_item_qty,
  weekly_upkeep = EXCLUDED.weekly_upkeep,
  max_owned = EXCLUDED.max_owned,
  description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.economy_user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL REFERENCES public.economy_passive_catalog(asset_code) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_earned_rp INT NOT NULL DEFAULT 0,
  last_harvest_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_code)
);

ALTER TABLE public.economy_user_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_user_assets_read_own" ON public.economy_user_assets;
CREATE POLICY "economy_user_assets_read_own" ON public.economy_user_assets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Tabla de idempotencia para recompensas de tareas y bloques del HQ
CREATE TABLE IF NOT EXISTS public.economy_work_claims (
  claim_key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_kind TEXT NOT NULL,
  amount INT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.economy_work_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_work_claims_read_own" ON public.economy_work_claims;
CREATE POLICY "economy_work_claims_read_own" ON public.economy_work_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Cálculo de Gastos Fijos Diarios y Semanales (PC de Bill + Bóveda + Activos)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.economy_weekly_fixed_costs(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p RECORD;
  v_vault_items INT := 0;
  v_asset_upkeep INT := 0;
  v_bill_pc_weekly INT;
  v_vault_weekly INT;
  v_league_license_weekly INT;
  v_total_weekly INT;
  v_daily_slice INT;
BEGIN
  SELECT * INTO v_p FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('total_weekly', 0, 'daily_slice', 0);
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_vault_items
  FROM public.valdr_vault
  WHERE user_id = p_user_id AND status = 'in_vault';

  SELECT COALESCE(SUM(ua.quantity * pc.weekly_upkeep), 0) INTO v_asset_upkeep
  FROM public.economy_user_assets ua
  JOIN public.economy_passive_catalog pc ON pc.asset_code = ua.asset_code
  WHERE ua.user_id = p_user_id;

  -- 1. Servidor de Almacenamiento PC de Bill: 50 ₽ base + 35 ₽ por cada Caja extra
  v_bill_pc_weekly := 50 + GREATEST(0, COALESCE(v_p.pc_boxes, 1) - 1) * 35;

  -- 2. Custodia de Bóveda de Ciudad Trigal: 30 ₽ base + 15 ₽ por bloque extra + 1 ₽ por cada 3 objetos guardados
  v_vault_weekly := 30
    + GREATEST(0, (COALESCE(v_p.vault_slots, 20) - 20) / 10) * 15
    + FLOOR(v_vault_items / 3.0)::INT;

  -- 3. Seguro Médico Centro Pokémon & Licencia de la Liga: 45 ₽ base + 5 ₽ por nivel
  v_league_license_weekly := 45 + LEAST(60, COALESCE(v_p.current_level, 1) * 5);

  v_total_weekly := v_bill_pc_weekly + v_vault_weekly + v_league_license_weekly + v_asset_upkeep;
  v_daily_slice := CEIL(v_total_weekly / 6.0)::INT; -- Se cobra de lunes a sábado

  RETURN jsonb_build_object(
    'bill_pc_weekly', v_bill_pc_weekly,
    'vault_weekly', v_vault_weekly,
    'vault_items_count', v_vault_items,
    'league_license_weekly', v_league_license_weekly,
    'asset_upkeep_weekly', v_asset_upkeep,
    'total_weekly', v_total_weekly,
    'daily_slice', v_daily_slice
  );
END;
$$;

-- Actualizar economy_tax_due para usar la proporción diaria real
CREATE OR REPLACE FUNCTION public.economy_tax_due(p_pc_boxes INT, p_vault_slots INT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CEIL((
    50 + GREATEST(0, COALESCE(p_pc_boxes, 1) - 1) * 35
    + 30 + GREATEST(0, (COALESCE(p_vault_slots, 20) - 20) / 10) * 15
    + 50
  ) / 6.0)::INT;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPC: Pagar Sueldo por Tareas y Bloques del HQ (Idempotente + Activa Rentas)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_hq_claim_work_reward(
  p_claim_key TEXT,
  p_kind TEXT,           -- 'task' | 'block_checkout' | 'daily_bonus' | 'emergency_work'
  p_minutes INT DEFAULT 30,
  p_label TEXT DEFAULT 'Tarea HQ cumplida'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_reward INT := 0;
  v_debt_paid INT := 0;
  v_net_added INT := 0;
  v_balance INT;
  v_rent_result JSONB := NULL;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF p_claim_key IS NULL OR length(trim(p_claim_key)) < 3 THEN
    RAISE EXCEPTION 'claim_key inválida';
  END IF;

  -- Verificar idempotencia
  IF EXISTS (SELECT 1 FROM public.economy_work_claims WHERE claim_key = p_claim_key) THEN
    SELECT pokedollars INTO v_balance FROM public.profiles WHERE id = v_uid;
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'reward', 0, 'wallet', v_balance);
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;

  -- Escala salarial calibrada para ~420 ₽/día (50.000 ₽ en 120 días)
  IF p_kind = 'task' THEN
    v_reward := CASE
      WHEN p_minutes >= 60 THEN 135
      WHEN p_minutes >= 45 THEN 100
      WHEN p_minutes >= 30 THEN 75
      ELSE 45
    END;
  ELSIF p_kind = 'block_checkout' THEN
    v_reward := 80;
  ELSIF p_kind = 'daily_bonus' THEN
    v_reward := 150;
  ELSIF p_kind = 'emergency_work' THEN
    v_reward := 60;
  ELSE
    v_reward := 50;
  END IF;

  -- Si el usuario tiene deuda vencida, el 40% del sueldo abona automáticamente a liberar el embargo
  IF v_p.tax_debt > 0 THEN
    v_debt_paid := LEAST(v_p.tax_debt, CEIL(v_reward * 0.40)::INT);
  END IF;
  v_net_added := v_reward - v_debt_paid;
  v_balance := v_p.pokedollars + v_net_added;

  INSERT INTO public.economy_work_claims (claim_key, user_id, reward_kind, amount)
  VALUES (p_claim_key, v_uid, p_kind, v_reward);

  UPDATE public.profiles
  SET pokedollars = v_balance,
      tax_debt = GREATEST(0, v_p.tax_debt - v_debt_paid),
      last_productive_date = v_today,
      updated_at = now()
  WHERE id = v_uid;

  PERFORM public.economy_log(
    v_uid, 'work_reward', v_net_added, v_balance,
    format('%s (+%s ₽)', p_label, v_reward),
    jsonb_build_object('claim_key', p_claim_key, 'gross', v_reward, 'debt_paid', v_debt_paid)
  );

  -- ¡Regla de Oro!: Al registrar la primera acción productiva del día, tus Activos Pasivos cosechan hoy
  IF v_p.last_rent_payout_date IS NULL OR v_p.last_rent_payout_date < v_today THEN
    v_rent_result := public.rpc_economy_harvest_passive_rents();
    SELECT pokedollars INTO v_balance FROM public.profiles WHERE id = v_uid;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward', v_reward,
    'net_added', v_net_added,
    'debt_paid', v_debt_paid,
    'wallet', v_balance,
    'passive_harvest', v_rent_result
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. RPC: Comprar Activo de Renta Pasiva y Cosechar Rentas Diarias
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_buy_passive_asset(p_asset_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_cat public.economy_passive_catalog%ROWTYPE;
  v_owned INT := 0;
  v_balance INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_cat FROM public.economy_passive_catalog WHERE asset_code = p_asset_code AND active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Activo de inversión no disponible');
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_p.tax_debt > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Liquida tu deuda con la Liga antes de adquirir propiedades');
  END IF;

  SELECT COALESCE(quantity, 0) INTO v_owned
  FROM public.economy_user_assets
  WHERE user_id = v_uid AND asset_code = p_asset_code;

  IF v_owned >= v_cat.max_owned THEN
    RETURN jsonb_build_object('success', false, 'error', format('Límite máximo alcanzado (%s/%s)', v_owned, v_cat.max_owned));
  END IF;

  IF v_p.pokedollars < v_cat.purchase_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fondos insuficientes para esta inversión');
  END IF;

  v_balance := v_p.pokedollars - v_cat.purchase_cost;
  UPDATE public.profiles SET pokedollars = v_balance, updated_at = now() WHERE id = v_uid;

  INSERT INTO public.economy_user_assets (user_id, asset_code, quantity)
  VALUES (v_uid, p_asset_code, 1)
  ON CONFLICT (user_id, asset_code) DO UPDATE SET
    quantity = public.economy_user_assets.quantity + 1;

  PERFORM public.economy_log(
    v_uid, 'asset_purchase', -v_cat.purchase_cost, v_balance,
    format('Inversión adquirida: %s', v_cat.display_name),
    jsonb_build_object('asset_code', p_asset_code, 'owned_after', v_owned + 1)
  );

  RETURN jsonb_build_object(
    'success', true,
    'asset_code', p_asset_code,
    'owned', v_owned + 1,
    'wallet', v_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_economy_harvest_passive_rents()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_row RECORD;
  v_total_rp INT := 0;
  v_items_granted INT := 0;
  v_bonguri_id TEXT;
  v_bonguri_item RECORD;
  v_bonguri_colors TEXT[] := ARRAY['BONGURI_RED','BONGURI_BLUE','BONGURI_YELLOW','BONGURI_GREEN','BONGURI_PINK','BONGURI_WHITE','BONGURI_BLACK'];
  v_balance INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_p.last_rent_payout_date IS NOT NULL AND v_p.last_rent_payout_date >= v_today THEN
    RETURN jsonb_build_object('success', false, 'error', 'Las rentas de hoy ya fueron recolectadas');
  END IF;

  -- Condición anti-bola de nieve: requiere actividad productiva hoy
  IF v_p.last_productive_date IS NULL OR v_p.last_productive_date < v_today THEN
    RETURN jsonb_build_object('success', false, 'error', 'Completa al menos 1 tarea o check-in hoy para activar la producción de tus propiedades');
  END IF;

  FOR v_row IN
    SELECT ua.id, ua.asset_code, ua.quantity, pc.display_name, pc.daily_yield_rp, pc.yield_item_id, pc.yield_item_qty
    FROM public.economy_user_assets ua
    JOIN public.economy_passive_catalog pc ON pc.asset_code = ua.asset_code
    WHERE ua.user_id = v_uid
  LOOP
    IF v_row.daily_yield_rp > 0 THEN
      v_total_rp := v_total_rp + (v_row.daily_yield_rp * v_row.quantity);
      UPDATE public.economy_user_assets
      SET total_earned_rp = total_earned_rp + (v_row.daily_yield_rp * v_row.quantity),
          last_harvest_date = v_today
      WHERE id = v_row.id;
    END IF;

    IF v_row.yield_item_qty > 0 THEN
      -- Elegir un Bonguri determinista del día para la cosecha de César
      v_bonguri_id := v_bonguri_colors[1 + (EXTRACT(DOY FROM v_today)::INT % array_length(v_bonguri_colors, 1))];
      SELECT * INTO v_bonguri_item FROM public.economy_shop_prices WHERE item_id = v_bonguri_id;

      IF FOUND THEN
        INSERT INTO public.valdr_vault (
          user_id, item_type, item_id_or_species, display_name, quantity, avg_buy_price, payload_json, is_shiny, status
        ) VALUES (
          v_uid, 'item', v_bonguri_id, v_bonguri_item.display_name, v_row.yield_item_qty * v_row.quantity, 0,
          jsonb_build_object('shop_item_id', v_bonguri_id, 'gba_item_id', v_bonguri_item.gba_item_id, 'gba_pocket', v_bonguri_item.gba_pocket, 'category', 'market', 'unit_price', 0),
          false, 'in_vault'
        );
        v_items_granted := v_items_granted + (v_row.yield_item_qty * v_row.quantity);
      END IF;

      UPDATE public.economy_user_assets SET last_harvest_date = v_today WHERE id = v_row.id;
    END IF;
  END LOOP;

  v_balance := v_p.pokedollars + v_total_rp;
  UPDATE public.profiles
  SET pokedollars = v_balance,
      last_rent_payout_date = v_today,
      updated_at = now()
  WHERE id = v_uid;

  IF v_total_rp > 0 OR v_items_granted > 0 THEN
    PERFORM public.economy_log(
      v_uid, 'passive_rent', v_total_rp, v_balance,
      format('Cosecha de Rentas Pasivas: +%s ₽ y +%s Bonguris', v_total_rp, v_items_granted),
      jsonb_build_object('rp', v_total_rp, 'bonguris', v_items_granted)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'earned_rp', v_total_rp,
    'bonguris_harvested', v_items_granted,
    'wallet', v_balance
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Tick del Mercado Mejorado: Ciclos Semanales de Bonguris + Bot Market Maker
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_market_tick()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_dow INT := EXTRACT(ISODOW FROM v_today)::INT; -- 1 = Lunes .. 7 = Domingo
  v_week_key TEXT := to_char(v_today, 'IYYY-"W"IW');
  v_event public.economy_market_events%ROWTYPE;
  v_item RECORD;
  v_seed BIGINT;
  v_rnd NUMERIC;
  v_wave NUMERIC;
  v_mult NUMERIC;
  v_buy INT;
  v_sell INT;
  v_prev INT;
  v_count INT := 0;
  v_bonguri_list TEXT[] := ARRAY['BONGURI_RED','BONGURI_BLUE','BONGURI_YELLOW','BONGURI_GREEN','BONGURI_PINK','BONGURI_WHITE','BONGURI_BLACK'];
  v_week_num INT := EXTRACT(WEEK FROM v_today)::INT;
  v_crash_target TEXT;
  v_boom_target TEXT;
BEGIN
  -- 1. Asegurar que exista un Evento Semanal para esta semana
  SELECT * INTO v_event
  FROM public.economy_market_events
  WHERE v_today BETWEEN active_from AND active_until
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    v_crash_target := v_bonguri_list[1 + (v_week_num % array_length(v_bonguri_list, 1))];
    v_boom_target  := v_bonguri_list[1 + ((v_week_num + 3) % array_length(v_bonguri_list, 1))];

    INSERT INTO public.economy_market_events (
      week_key, regime, headline, rumor, crash_item_id, boom_item_id, crash_discount_pct, boom_surge_pct, active_from, active_until, source
    ) VALUES (
      v_week_key,
      'CYCLE',
      format('¡Cosecha masiva en Azalea! %s cae un -45%% esta semana, mientras %s escasea en Ciudad Trigal.', v_crash_target, v_boom_target),
      format('Rumor de César: La próxima semana Silph Co. absorberá todo el stock de %s con prima del +50%%.', v_crash_target),
      v_crash_target,
      v_boom_target,
      -45,
      50,
      v_today,
      v_today + 6,
      'cycle_engine'
    )
    RETURNING * INTO v_event;
  END IF;

  -- 2. Calcular precios de todos los activos de 'market' (Bonguris + Bayas)
  FOR v_item IN SELECT * FROM public.economy_shop_prices WHERE category = 'market' AND active LOOP
    v_seed := ABS(('x' || substr(md5(v_item.item_id || v_today::text), 1, 7))::bit(28)::int);
    v_rnd := (v_seed % 1000)::numeric / 1000.0;
    v_wave := SIN((v_today - DATE '2026-01-01')::numeric / 7.0 * 2 * PI());

    -- Ciclo semanal: Lunes-Miércoles (DOW 1..3) el crash_item está hundido (-45%) para acumular;
    -- Jueves-Domingo (DOW 4..7) empieza a rebotar fuerte hacia arriba (+35% a +55%) para vender con ganancia.
    IF v_item.item_id = v_event.crash_item_id THEN
      IF v_dow <= 3 THEN
        v_mult := 0.52 + (0.08 * v_rnd); -- Hundido: ¡Momento de comprar!
      ELSIF v_dow <= 5 THEN
        v_mult := 0.95 + (0.12 * v_rnd); -- Recuperación a precio base
      ELSE
        v_mult := 1.38 + (0.18 * v_rnd); -- Rebote alcista de fin de semana: ¡Momento de vender!
      END IF;
    ELSIF v_item.item_id = v_event.boom_item_id THEN
      IF v_dow <= 4 THEN
        v_mult := 1.42 + (0.20 * v_rnd); -- Euforia alta: ¡Vender!
      ELSE
        v_mult := 0.82 + (0.10 * v_rnd); -- Toma de ganancias
      END IF;
    ELSE
      v_mult := 0.72 + (0.50 * v_rnd) + (0.15 * v_wave);
    END IF;

    v_buy := GREATEST(10, ROUND(v_item.base_price * v_mult)::INT);
    -- Spread estrecho (90% a 94%) para que hacer swing trading de una semana a otra sea muy rentable
    v_sell := GREATEST(8, ROUND(v_buy * (0.90 + 0.05 * v_rnd))::INT);

    SELECT buy_price INTO v_prev
    FROM public.economy_market_prices
    WHERE item_id = v_item.item_id AND trade_date < v_today
    ORDER BY trade_date DESC LIMIT 1;

    INSERT INTO public.economy_market_prices (item_id, trade_date, buy_price, sell_price, change_pct)
    VALUES (
      v_item.item_id, v_today, v_buy, v_sell,
      CASE WHEN COALESCE(v_prev, 0) > 0 THEN ROUND((v_buy - v_prev)::numeric * 100 / COALESCE(v_prev, v_item.base_price), 1)
           ELSE ROUND((v_buy - v_item.base_price)::numeric * 100 / GREATEST(1, v_item.base_price), 1) END
    )
    ON CONFLICT (item_id, trade_date) DO UPDATE SET
      buy_price = EXCLUDED.buy_price,
      sell_price = EXCLUDED.sell_price,
      change_pct = EXCLUDED.change_pct;

    v_count := v_count + 1;
  END LOOP;

  -- 3. Generar las 2 Órdenes Relámpago del Bot Mercader (Silph Co. Auto-Trader) para hoy si no existen
  IF NOT EXISTS (SELECT 1 FROM public.economy_bot_orders WHERE trade_date = v_today) THEN
    -- Orden 1: El Bot COMPRA a sobreprecio (+35% sobre base) el activo en Boom
    SELECT * INTO v_item FROM public.economy_shop_prices WHERE item_id = v_event.boom_item_id;
    IF FOUND THEN
      INSERT INTO public.economy_bot_orders (
        trade_date, bot_name, order_side, item_id, unit_price, max_qty, remaining_qty, reason
      ) VALUES (
        v_today,
        'Bot Silph Co.',
        'BUY_FROM_USER',
        v_item.item_id,
        ROUND(v_item.base_price * 1.65)::INT,
        20,
        20,
        format('Contrato urgente en Kanto: compramos hasta 20 %s con +65%% de prima.', v_item.display_name)
      );
    END IF;

    -- Orden 2: El Bot VENDE en liquidación (-48% bajo base) un lote limitado del activo en Crash
    SELECT * INTO v_item FROM public.economy_shop_prices WHERE item_id = v_event.crash_item_id;
    IF FOUND THEN
      INSERT INTO public.economy_bot_orders (
        trade_date, bot_name, order_side, item_id, unit_price, max_qty, remaining_qty, reason
      ) VALUES (
        v_today,
        'Mercader de Azalea (Bot)',
        'SELL_TO_USER',
        v_item.item_id,
        GREATEST(12, ROUND(v_item.base_price * 0.50)::INT),
        15,
        15,
        format('Liquidación de excedente: 15 unidades de %s a mitad de precio.', v_item.display_name)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'date', v_today, 'items', v_count, 'week_key', v_week_key);
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC: Operar directamente contra una Orden Relámpago del Bot Mercader
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_trade_with_bot(p_order_id UUID, p_qty INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_order public.economy_bot_orders%ROWTYPE;
  v_item public.economy_shop_prices%ROWTYPE;
  v_vault RECORD;
  v_qty INT := GREATEST(1, LEAST(COALESCE(p_qty, 1), 50));
  v_total INT;
  v_balance INT;
  v_new_avg NUMERIC;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_order FROM public.economy_bot_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.remaining_qty <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La orden del Bot ya se agotó');
  END IF;

  v_qty := LEAST(v_qty, v_order.remaining_qty);
  v_total := v_order.unit_price * v_qty;

  SELECT * INTO v_item FROM public.economy_shop_prices WHERE item_id = v_order.item_id;
  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_order.order_side = 'SELL_TO_USER' THEN
    -- El usuario le compra barato al Bot
    IF v_p.tax_debt > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Liquida tu deuda antes de operar con el Bot');
    END IF;
    IF v_p.pokedollars < v_total THEN
      RETURN jsonb_build_object('success', false, 'error', 'Fondos insuficientes');
    END IF;

    v_balance := v_p.pokedollars - v_total;
    UPDATE public.profiles SET pokedollars = v_balance, updated_at = now() WHERE id = v_uid;
    UPDATE public.economy_bot_orders SET remaining_qty = remaining_qty - v_qty WHERE id = v_order.id;

    -- Agrupar en valdr_vault con Precio Promedio Ponderado (WAP)
    SELECT * INTO v_vault FROM public.valdr_vault
    WHERE user_id = v_uid AND item_id_or_species = v_order.item_id AND status = 'in_vault'
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

    IF FOUND THEN
      v_new_avg := ROUND(((v_vault.quantity * COALESCE(v_vault.avg_buy_price, v_order.unit_price)) + v_total)::numeric / (v_vault.quantity + v_qty), 1);
      UPDATE public.valdr_vault
      SET quantity = quantity + v_qty,
          avg_buy_price = v_new_avg
      WHERE id = v_vault.id;
    ELSE
      INSERT INTO public.valdr_vault (
        user_id, item_type, item_id_or_species, display_name, quantity, avg_buy_price, payload_json, is_shiny, status
      ) VALUES (
        v_uid, 'item', v_order.item_id, v_item.display_name, v_qty, v_order.unit_price,
        COALESCE(v_item.payload, '{}'::jsonb) || jsonb_build_object(
          'shop_item_id', v_order.item_id, 'gba_item_id', v_item.gba_item_id, 'gba_pocket', v_item.gba_pocket, 'category', v_item.category, 'unit_price', v_order.unit_price
        ),
        false, 'in_vault'
      );
    END IF;

    PERFORM public.economy_log(
      v_uid, 'bot_buy', -v_total, v_balance,
      format('Compra al %s: %s x%s a %s ₽', v_order.bot_name, v_item.display_name, v_qty, v_order.unit_price),
      jsonb_build_object('order_id', p_order_id, 'item_id', v_order.item_id, 'qty', v_qty, 'unit_price', v_order.unit_price)
    );
  ELSE
    -- BUY_FROM_USER: El usuario le vende caro al Bot
    SELECT * INTO v_vault FROM public.valdr_vault
    WHERE user_id = v_uid AND item_id_or_species = v_order.item_id AND status = 'in_vault'
    ORDER BY quantity DESC LIMIT 1 FOR UPDATE;

    IF NOT FOUND OR v_vault.quantity < v_qty THEN
      RETURN jsonb_build_object('success', false, 'error', 'No tienes suficientes unidades en la Bóveda para venderle al Bot');
    END IF;

    IF v_vault.quantity = v_qty THEN
      DELETE FROM public.valdr_vault WHERE id = v_vault.id;
    ELSE
      UPDATE public.valdr_vault SET quantity = quantity - v_qty WHERE id = v_vault.id;
    END IF;

    UPDATE public.economy_bot_orders SET remaining_qty = remaining_qty - v_qty WHERE id = v_order.id;
    v_balance := v_p.pokedollars + v_total;
    UPDATE public.profiles SET pokedollars = v_balance, updated_at = now() WHERE id = v_uid;

    PERFORM public.economy_log(
      v_uid, 'bot_sell', v_total, v_balance,
      format('Venta al %s: %s x%s a %s ₽', v_order.bot_name, v_item.display_name, v_qty, v_order.unit_price),
      jsonb_build_object('order_id', p_order_id, 'item_id', v_order.item_id, 'qty', v_qty, 'unit_price', v_order.unit_price)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'wallet', v_balance, 'qty', v_qty, 'total', v_total);
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. Actualizar Compra Normal para consolidar stacks en Bóveda y guardar avg_buy_price
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_purchase_shop_item(p_item_id TEXT, p_qty INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_item public.economy_shop_prices%ROWTYPE;
  v_qty INT := GREATEST(1, LEAST(COALESCE(p_qty, 1), 99));
  v_price INT;
  v_total INT;
  v_market RECORD;
  v_balance INT;
  v_vault_id UUID;
  v_existing_vault RECORD;
  v_new_avg NUMERIC;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_is_essential BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_item FROM public.economy_shop_prices WHERE item_id = p_item_id AND active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Producto no disponible en el Bazar');
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_item.category = 'market' THEN
    SELECT * INTO v_market FROM public.economy_market_prices
    WHERE item_id = p_item_id AND trade_date = v_today;
    v_price := COALESCE(v_market.buy_price, v_item.price);
  ELSE
    v_price := v_item.price;
  END IF;

  -- Kit de emergencia (cure y balls) siempre comprable aunque exista deuda
  v_is_essential := v_item.category IN ('cure', 'balls');
  IF v_p.tax_debt > 0 AND NOT v_is_essential AND v_item.kind <> 'expansion' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Embargo de Bill por deuda de %s ₽. Cumple tareas en el HQ o vende activos para liberar.', v_p.tax_debt),
      'debt', v_p.tax_debt
    );
  END IF;

  v_total := v_price * v_qty;
  IF v_p.pokedollars < v_total THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fondos insuficientes', 'pokedollars', v_p.pokedollars, 'price', v_total);
  END IF;

  v_balance := v_p.pokedollars - v_total;
  UPDATE public.profiles SET pokedollars = v_balance, updated_at = now() WHERE id = v_user_id;

  IF v_item.kind = 'expansion' AND v_item.payload ? 'type' THEN
    IF v_item.payload->>'type' = 'pc_box' THEN
      UPDATE public.profiles SET pc_boxes = LEAST(14, pc_boxes + COALESCE((v_item.payload->>'amount')::INT, 1)) WHERE id = v_user_id;
    ELSIF v_item.payload->>'type' = 'vault_slots' THEN
      UPDATE public.profiles SET vault_slots = LEAST(200, vault_slots + COALESCE((v_item.payload->>'amount')::INT, 10)) WHERE id = v_user_id;
    END IF;
  ELSIF v_item.kind = 'cosmetic' THEN
    UPDATE public.profiles
    SET cosmetics_inventory = CASE
      WHEN cosmetics_inventory ? p_item_id THEN cosmetics_inventory
      ELSE cosmetics_inventory || to_jsonb(p_item_id)
    END
    WHERE id = v_user_id;
  ELSE
    -- Si es un ítem apilable (item), consolidamos en la misma fila de Bóveda y calculamos Precio Promedio (WAP)
    IF v_item.kind = 'item' THEN
      SELECT * INTO v_existing_vault FROM public.valdr_vault
      WHERE user_id = v_user_id AND item_id_or_species = p_item_id AND status = 'in_vault'
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    END IF;

    IF v_item.kind = 'item' AND FOUND THEN
      v_new_avg := ROUND(((v_existing_vault.quantity * COALESCE(NULLIF(v_existing_vault.avg_buy_price, 0), v_price)) + v_total)::numeric / (v_existing_vault.quantity + v_qty), 1);
      UPDATE public.valdr_vault
      SET quantity = quantity + v_qty,
          avg_buy_price = v_new_avg
      WHERE id = v_existing_vault.id
      RETURNING id INTO v_vault_id;
    ELSE
      INSERT INTO public.valdr_vault (
        user_id, item_type, item_id_or_species, display_name, quantity, avg_buy_price, payload_json, is_shiny, status
      ) VALUES (
        v_user_id,
        v_item.kind,
        CASE WHEN v_item.kind = 'pokemon' THEN COALESCE(v_item.payload->>'speciesId', p_item_id) ELSE p_item_id END,
        COALESCE(v_item.display_name, p_item_id),
        v_qty,
        v_price,
        COALESCE(v_item.payload, '{}'::jsonb) || jsonb_build_object(
          'shop_item_id', p_item_id,
          'gba_item_id', v_item.gba_item_id,
          'gba_pocket', v_item.gba_pocket,
          'category', v_item.category,
          'unit_price', v_price
        ),
        v_item.kind = 'pokemon' AND v_item.category = 'shiny',
        'in_vault'
      )
      RETURNING id INTO v_vault_id;
    END IF;
  END IF;

  PERFORM public.economy_log(
    v_user_id, 'purchase', -v_total, v_balance,
    format('Compra: %s x%s', COALESCE(v_item.display_name, p_item_id), v_qty),
    jsonb_build_object('item_id', p_item_id, 'unit_price', v_price, 'qty', v_qty, 'vault_id', v_vault_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'quantity', v_qty,
    'unit_price', v_price,
    'total', v_total,
    'vault_id', v_vault_id,
    'remaining_pokedollars', v_balance
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Moneda Única Espejo App <-> Cartucho GBA (Sincronización Delta Segura)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_sync_game_money(p_in_game_money INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_delta INT;
  v_applied_delta INT := 0;
  v_combat_today INT;
  v_daily_cap INT := 650; -- Tope diario anti-exploit por combates NPC en la ROM
  v_debt_paid INT := 0;
  v_balance INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF p_in_game_money IS NULL OR p_in_game_money < 0 THEN
    RAISE EXCEPTION 'Dinero de juego inválido';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  -- Si es la primera sincronización histórica, alineamos in_game_money al wallet actual sin alterar saldo
  IF COALESCE(v_p.in_game_money, 0) = 0 AND v_p.pokedollars > 0 THEN
    UPDATE public.profiles SET in_game_money = v_p.pokedollars WHERE id = v_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'delta', 0,
      'bonus', 0,
      'wallet', v_p.pokedollars,
      'in_game_money', v_p.pokedollars
    );
  END IF;

  v_delta := p_in_game_money - COALESCE(v_p.in_game_money, v_p.pokedollars);
  v_balance := v_p.pokedollars;
  v_combat_today := CASE WHEN v_p.last_combat_date = v_today THEN COALESCE(v_p.daily_combat_earned, 0) ELSE 0 END;

  IF v_delta > 0 THEN
    -- Ganancia por vencer NPCs en la ROM: pasa 1:1 a la moneda única hasta el tope diario anti-exploit
    v_applied_delta := LEAST(v_delta, GREATEST(0, v_daily_cap - v_combat_today));
    IF v_applied_delta > 0 THEN
      v_debt_paid := LEAST(v_applied_delta, v_p.tax_debt);
      v_balance := v_balance + (v_applied_delta - v_debt_paid);
      v_combat_today := v_combat_today + v_applied_delta;

      PERFORM public.economy_log(
        v_user_id, 'combat_reward', v_applied_delta - v_debt_paid, v_balance,
        format('Combates en Johto: +%s ₽', v_applied_delta),
        jsonb_build_object('raw_delta', v_delta, 'applied', v_applied_delta, 'debt_paid', v_debt_paid)
      );
    END IF;
  ELSIF v_delta < 0 AND ABS(v_delta) <= 2500 THEN
    -- Penalización por perder combate (White Out) o gasto menor en el cartucho: se descuenta de la moneda única
    v_applied_delta := -LEAST(v_balance, ABS(v_delta));
    v_balance := v_balance + v_applied_delta;
    IF v_applied_delta < 0 THEN
      PERFORM public.economy_log(
        v_user_id, 'combat_loss', v_applied_delta, v_balance,
        format('Pérdida/Gasto en Cartucho GBA: %s ₽', v_applied_delta),
        jsonb_build_object('raw_delta', v_delta)
      );
    END IF;
  END IF;

  -- El saldo autoritativo unificado es v_balance
  UPDATE public.profiles
  SET pokedollars = v_balance,
      in_game_money = v_balance,
      tax_debt = GREATEST(0, v_p.tax_debt - v_debt_paid),
      daily_combat_earned = v_combat_today,
      last_combat_date = v_today,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'delta', v_delta,
    'bonus', GREATEST(0, v_applied_delta),
    'debt_paid', v_debt_paid,
    'wallet', v_balance,
    'in_game_money', v_balance,
    'combat_today', v_combat_today,
    'combat_cap', v_daily_cap
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. Estado Completo para el HUD (Incluye Evento IA, Bot, Rentas y Factura Bill)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_state()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_cfg public.economy_config%ROWTYPE;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_costs JSONB;
  v_tax INT;
  v_grace_until DATE;
  v_days_left INT;
  v_vault JSONB;
  v_market JSONB;
  v_event JSONB;
  v_bot_orders JSONB;
  v_passive_catalog JSONB;
  v_user_assets JSONB;
  v_daily_passive_rp INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil no encontrado'; END IF;
  SELECT * INTO v_cfg FROM public.economy_config WHERE id = 'global';

  -- Si aún no corrió el tick de mercado hoy, lo corremos al vuelo para que siempre haya precios frescos
  IF NOT EXISTS (SELECT 1 FROM public.economy_market_prices WHERE trade_date = v_today) THEN
    PERFORM public.rpc_economy_market_tick();
  END IF;

  v_costs := public.economy_weekly_fixed_costs(v_user_id);
  v_tax := COALESCE((v_costs->>'daily_slice')::INT, public.economy_tax_due(v_p.pc_boxes, v_p.vault_slots));
  v_grace_until := (v_p.economy_started_at AT TIME ZONE 'America/Bogota')::date + v_cfg.grace_days;

  SELECT COALESCE(SUM(ua.quantity * pc.daily_yield_rp), 0) INTO v_daily_passive_rp
  FROM public.economy_user_assets ua
  JOIN public.economy_passive_catalog pc ON pc.asset_code = ua.asset_code
  WHERE ua.user_id = v_user_id;

  v_days_left := GREATEST(0, CEIL((v_cfg.dratini_price - v_p.pokedollars)::numeric / GREATEST(1, v_cfg.daily_net_estimate + v_daily_passive_rp))::int);

  SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.created_at DESC), '[]'::jsonb)
  INTO v_vault
  FROM public.valdr_vault v
  WHERE v.user_id = v_user_id AND v.status = 'in_vault';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'item_id', m.item_id,
           'display_name', COALESCE(s.display_name, m.item_id),
           'buy_price', m.buy_price,
           'sell_price', m.sell_price,
           'change_pct', m.change_pct,
           'base_price', COALESCE(s.base_price, m.buy_price),
           'is_bonguri', (m.item_id LIKE 'BONGURI_%')
         ) ORDER BY (m.item_id LIKE 'BONGURI_%') DESC, m.item_id), '[]'::jsonb)
  INTO v_market
  FROM public.economy_market_prices m
  LEFT JOIN public.economy_shop_prices s ON s.item_id = m.item_id
  WHERE m.trade_date = v_today;

  SELECT to_jsonb(e) INTO v_event
  FROM public.economy_market_events e
  WHERE v_today BETWEEN e.active_from AND e.active_until
  ORDER BY e.created_at DESC LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', b.id,
           'bot_name', b.bot_name,
           'order_side', b.order_side,
           'item_id', b.item_id,
           'display_name', COALESCE(s.display_name, b.item_id),
           'unit_price', b.unit_price,
           'base_price', COALESCE(s.base_price, b.unit_price),
           'max_qty', b.max_qty,
           'remaining_qty', b.remaining_qty,
           'reason', b.reason
         ) ORDER BY b.created_at DESC), '[]'::jsonb)
  INTO v_bot_orders
  FROM public.economy_bot_orders b
  LEFT JOIN public.economy_shop_prices s ON s.item_id = b.item_id
  WHERE b.trade_date = v_today AND b.remaining_qty > 0;

  SELECT COALESCE(jsonb_agg(to_jsonb(pc) ORDER BY pc.purchase_cost ASC), '[]'::jsonb)
  INTO v_passive_catalog
  FROM public.economy_passive_catalog pc
  WHERE pc.active;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'asset_code', ua.asset_code,
           'quantity', ua.quantity,
           'total_earned_rp', ua.total_earned_rp,
           'last_harvest_date', ua.last_harvest_date,
           'display_name', pc.display_name,
           'daily_yield_rp', pc.daily_yield_rp,
           'yield_item_qty', pc.yield_item_qty,
           'weekly_upkeep', pc.weekly_upkeep
         )), '[]'::jsonb)
  INTO v_user_assets
  FROM public.economy_user_assets ua
  JOIN public.economy_passive_catalog pc ON pc.asset_code = ua.asset_code
  WHERE ua.user_id = v_user_id;

  RETURN jsonb_build_object(
    'wallet', v_p.pokedollars,
    'tax_debt', v_p.tax_debt,
    'in_game_money', v_p.pokedollars,
    'tax_due', v_tax,
    'tax_due_today', CASE WHEN v_p.last_tax_charge_date IS NULL OR v_p.last_tax_charge_date < v_today THEN v_tax ELSE 0 END,
    'last_tax_charge_date', v_p.last_tax_charge_date,
    'grace_until', v_grace_until,
    'in_grace', v_today < v_grace_until,
    'rescue_plan_active', v_p.rescue_plan_active,
    'rescue_until', v_p.rescue_until,
    'pc_boxes', v_p.pc_boxes,
    'vault_slots', v_p.vault_slots,
    'expedition_week_paid', COALESCE(v_p.daily_combat_earned, 0),
    'expedition_week_cap', 650,
    'dratini_price', v_cfg.dratini_price,
    'dratini_days_left', v_days_left,
    'dratini_progress_pct', LEAST(100, ROUND(v_p.pokedollars::numeric * 100 / GREATEST(1, v_cfg.dratini_price))),
    'vault', v_vault,
    'market', v_market,
    'market_event', v_event,
    'bot_orders', v_bot_orders,
    'fixed_costs', v_costs,
    'passive_catalog', v_passive_catalog,
    'user_assets', v_user_assets,
    'daily_passive_rp', v_daily_passive_rp,
    'productive_today', (v_p.last_productive_date = v_today),
    'rents_harvested_today', (v_p.last_rent_payout_date = v_today),
    'today', v_today
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. Permisos de las nuevas RPCs
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.economy_weekly_fixed_costs(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_hq_claim_work_reward(TEXT, TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_buy_passive_asset(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_harvest_passive_rents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_trade_with_bot(UUID, INT) TO authenticated;

-- Ejecutar el tick inicial para sembrar los Bonguris y las órdenes del Bot de hoy
SELECT public.rpc_economy_market_tick();
