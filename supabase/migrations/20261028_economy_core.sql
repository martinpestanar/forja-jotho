-- ==============================================================================
-- FASE 0 + 1 · NÚCLEO ECONÓMICO DE JOHTO (SynDex)
-- ==============================================================================
-- Una sola moneda: Pokédólares (₽) en profiles.pokedollars.
-- in_game_money guarda el dinero del cartucho y NUNCA sobrescribe la wallet.
-- Impuestos diarios, multas, deuda, plan de rescate, mercado de bayas y bóveda.
-- Precios SIEMPRE determinados en el servidor (nunca p_cost del cliente).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Columnas de economía en profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS in_game_money INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_debt INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_tax_charge_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS economy_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rescue_plan_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rescue_until DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pc_boxes INT NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vault_slots INT NOT NULL DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expedition_week_start DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expedition_week_paid INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cosmetics_inventory JSONB NOT NULL DEFAULT '[]'::jsonb;

-- shop_inventory: columnas que el panel admin ya esperaba
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS item_key TEXT;
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS item_category TEXT DEFAULT 'gba_injectable';
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS gba_item_id INT;
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS gba_pocket TEXT;
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS injection_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.shop_inventory ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ------------------------------------------------------------------------------
-- 1. Configuración económica (singleton editable por el admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  tax_base INT NOT NULL DEFAULT 9,
  tax_per_extra_box INT NOT NULL DEFAULT 5,
  tax_per_vault_block INT NOT NULL DEFAULT 2,
  rest_day_dow INT NOT NULL DEFAULT 0,          -- 0 = domingo, sin impuesto
  fine_tier_1 INT NOT NULL DEFAULT 20,
  fine_tier_2 INT NOT NULL DEFAULT 50,
  fine_tier_3 INT NOT NULL DEFAULT 90,
  fine_cap_pct NUMERIC NOT NULL DEFAULT 0.20,
  grace_days INT NOT NULL DEFAULT 14,
  expedition_bonus_pct NUMERIC NOT NULL DEFAULT 0.22,
  expedition_week_cap INT NOT NULL DEFAULT 350,
  dratini_price INT NOT NULL DEFAULT 40000,
  daily_net_estimate INT NOT NULL DEFAULT 430,
  market_spread_pct NUMERIC NOT NULL DEFAULT 0.78,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.economy_config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.economy_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_config_read" ON public.economy_config;
CREATE POLICY "economy_config_read" ON public.economy_config
  FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "economy_config_admin_write" ON public.economy_config;
CREATE POLICY "economy_config_admin_write" ON public.economy_config
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND COALESCE(p.is_admin, false)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND COALESCE(p.is_admin, false)));

-- ------------------------------------------------------------------------------
-- 2. Libro mayor (ledger) inmutable
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS economy_ledger_user_created_idx
  ON public.economy_ledger (user_id, created_at DESC);

ALTER TABLE public.economy_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_ledger_read_own" ON public.economy_ledger;
CREATE POLICY "economy_ledger_read_own" ON public.economy_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Sin políticas de INSERT/UPDATE/DELETE: solo escriben las RPC SECURITY DEFINER.

-- ------------------------------------------------------------------------------
-- 3. Catálogo de precios del servidor (fuente de verdad)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_shop_prices (
  item_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'item',       -- item | pokemon | expansion | cosmetic
  category TEXT NOT NULL DEFAULT 'general', -- cure | balls | breeding | evolution | tms | mints | market | shiny | expansion | cosmetic
  price INT NOT NULL CHECK (price >= 0),
  base_price INT,
  gba_item_id INT,
  gba_pocket TEXT,
  display_name TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.economy_shop_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_shop_prices_read" ON public.economy_shop_prices;
CREATE POLICY "economy_shop_prices_read" ON public.economy_shop_prices
  FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "economy_shop_prices_admin_write" ON public.economy_shop_prices;
CREATE POLICY "economy_shop_prices_admin_write" ON public.economy_shop_prices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND COALESCE(p.is_admin, false)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND COALESCE(p.is_admin, false)));

-- Semillas fijas (los ítems GBA y MT llegan en 20261028_economy_shop_seed.sql)
INSERT INTO public.economy_shop_prices (item_id, kind, category, price, base_price, display_name, payload) VALUES
  ('SHINY_DRATINI',  'pokemon',   'shiny',     40000, 40000, 'Dratini Shiny',   '{"speciesId":147,"level":10,"perfectIVs":true}'),
  ('SHINY_EEVEE',    'pokemon',   'shiny',     25000, 25000, 'Eevee Shiny',     '{"speciesId":133,"level":10,"perfectIVs":true}'),
  ('SHINY_GYARADOS', 'pokemon',   'shiny',     60000, 60000, 'Gyarados Shiny',  '{"speciesId":130,"level":20,"perfectIVs":true}'),
  ('EXPAND_PC_BOX',  'expansion', 'expansion',  1500,  1500, 'Caja PC extra',   '{"type":"pc_box","amount":1}'),
  ('EXPAND_VAULT_10','expansion', 'expansion',   800,   800, 'Bóveda +10 slots','{"type":"vault_slots","amount":10}')
ON CONFLICT (item_id) DO NOTHING;

-- Bayas del mercado (precio base de referencia; el tick diario lo mueve)
INSERT INTO public.economy_shop_prices (item_id, kind, category, price, base_price, gba_item_id, gba_pocket, display_name) VALUES
  ('BERRY_ORAN',    'item', 'market', 30, 30, 139, 'BERRIES', 'Baya Oran'),
  ('BERRY_SITRUS',  'item', 'market', 55, 55, 142, 'BERRIES', 'Baya Sitrus'),
  ('BERRY_LUM',     'item', 'market', 70, 70, 141, 'BERRIES', 'Baya Lum'),
  ('BERRY_LEPPA',   'item', 'market', 45, 45, 138, 'BERRIES', 'Baya Leppa'),
  ('BERRY_CHERI',   'item', 'market', 25, 25, 133, 'BERRIES', 'Baya Cheri'),
  ('BERRY_CHESTO',  'item', 'market', 35, 35, 134, 'BERRIES', 'Baya Chesto'),
  ('BERRY_PECHA',   'item', 'market', 35, 35, 135, 'BERRIES', 'Baya Pecha'),
  ('BERRY_RAWST',   'item', 'market', 35, 35, 136, 'BERRIES', 'Baya Rawst'),
  ('BERRY_ASPEAR',  'item', 'market', 35, 35, 137, 'BERRIES', 'Baya Aspear'),
  ('BERRY_SALAC',   'item', 'market', 320, 320, 170, 'BERRIES', 'Baya Salac'),
  ('BERRY_PETAYA',  'item', 'market', 300, 300, 171, 'BERRIES', 'Baya Petaya'),
  ('BERRY_APICOT',  'item', 'market', 300, 300, 172, 'BERRIES', 'Baya Apicot'),
  ('BERRY_LIECHI',  'item', 'market', 260, 260, 168, 'BERRIES', 'Baya Liechi'),
  ('BERRY_GANLON',  'item', 'market', 240, 240, 169, 'BERRIES', 'Baya Ganlon'),
  ('BERRY_STARF',   'item', 'market', 380, 380, 174, 'BERRIES', 'Baya Starf')
ON CONFLICT (item_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Precios diarios del mercado (deterministas, sin IA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_market_prices (
  item_id TEXT NOT NULL,
  trade_date DATE NOT NULL,
  buy_price INT NOT NULL CHECK (buy_price >= 0),
  sell_price INT NOT NULL CHECK (sell_price >= 0),
  change_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, trade_date)
);

ALTER TABLE public.economy_market_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_market_prices_read" ON public.economy_market_prices;
CREATE POLICY "economy_market_prices_read" ON public.economy_market_prices
  FOR SELECT TO authenticated, anon USING (true);

-- ------------------------------------------------------------------------------
-- 5. Caché del Oráculo del Bazar (Gemini solo narrativa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_oracle_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.economy_oracle_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "economy_oracle_cache_read" ON public.economy_oracle_cache;
CREATE POLICY "economy_oracle_cache_read" ON public.economy_oracle_cache
  FOR SELECT TO authenticated, anon USING (true);

-- ------------------------------------------------------------------------------
-- 6. Blindaje: los saldos no se editan por UPDATE directo
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_economy_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  -- service_role y dueños de funciones SECURITY DEFINER pueden escribir.
  IF v_role = 'service_role' OR current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.pokedollars IS DISTINCT FROM OLD.pokedollars
     OR NEW.in_game_money IS DISTINCT FROM OLD.in_game_money
     OR NEW.tax_debt IS DISTINCT FROM OLD.tax_debt
     OR NEW.pc_boxes IS DISTINCT FROM OLD.pc_boxes
     OR NEW.vault_slots IS DISTINCT FROM OLD.vault_slots THEN
    RAISE EXCEPTION 'Los saldos y ampliaciones solo pueden modificarse mediante las RPC de economía';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_economy_columns ON public.profiles;
CREATE TRIGGER tr_protect_economy_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_economy_columns();

-- La bóveda deja de ser escribible directamente (antes era ALL con auth.uid())
DROP POLICY IF EXISTS "valdr_vault_own" ON public.valdr_vault;
DROP POLICY IF EXISTS "valdr_vault_read_own" ON public.valdr_vault;
CREATE POLICY "valdr_vault_read_own" ON public.valdr_vault
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- shop_inventory: cerrar inserción directa (antes regalaba ítems)
DROP POLICY IF EXISTS "Usuarios pueden comprar items (insertar en inventario)" ON public.shop_inventory;

-- ------------------------------------------------------------------------------
-- 7. Utilidades
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.economy_tax_due(p_pc_boxes INT, p_vault_slots INT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 9
    + 5 * GREATEST(0, COALESCE(p_pc_boxes, 1) - 1)
    + 2 * GREATEST(0, (COALESCE(p_vault_slots, 20) - 20) / 10);
$$;

CREATE OR REPLACE FUNCTION public.economy_log(
  p_user_id UUID,
  p_kind TEXT,
  p_amount INT,
  p_balance INT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.economy_ledger (user_id, kind, amount, balance_after, description, metadata)
  VALUES (p_user_id, p_kind, p_amount, p_balance, p_description, COALESCE(p_metadata, '{}'::jsonb));
$$;

-- ------------------------------------------------------------------------------
-- 8. Estado completo para el HUD
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
  v_tax INT;
  v_grace_until DATE;
  v_days_left INT;
  v_vault JSONB;
  v_market JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil no encontrado'; END IF;
  SELECT * INTO v_cfg FROM public.economy_config WHERE id = 'global';

  v_tax := public.economy_tax_due(v_p.pc_boxes, v_p.vault_slots);
  v_grace_until := (v_p.economy_started_at AT TIME ZONE 'America/Bogota')::date + v_cfg.grace_days;
  v_days_left := GREATEST(0, CEIL((v_cfg.dratini_price - v_p.pokedollars)::numeric / GREATEST(1, v_cfg.daily_net_estimate))::int);

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
           'base_price', COALESCE(s.base_price, m.buy_price)
         ) ORDER BY m.item_id), '[]'::jsonb)
  INTO v_market
  FROM public.economy_market_prices m
  LEFT JOIN public.economy_shop_prices s ON s.item_id = m.item_id
  WHERE m.trade_date = v_today;

  RETURN jsonb_build_object(
    'wallet', v_p.pokedollars,
    'tax_debt', v_p.tax_debt,
    'in_game_money', v_p.in_game_money,
    'tax_due', v_tax,
    'tax_due_today', CASE WHEN v_p.last_tax_charge_date IS NULL OR v_p.last_tax_charge_date < v_today THEN v_tax ELSE 0 END,
    'last_tax_charge_date', v_p.last_tax_charge_date,
    'grace_until', v_grace_until,
    'in_grace', v_today < v_grace_until,
    'rescue_plan_active', v_p.rescue_plan_active,
    'rescue_until', v_p.rescue_until,
    'pc_boxes', v_p.pc_boxes,
    'vault_slots', v_p.vault_slots,
    'expedition_week_paid', v_p.expedition_week_paid,
    'expedition_week_cap', v_cfg.expedition_week_cap,
    'dratini_price', v_cfg.dratini_price,
    'dratini_days_left', v_days_left,
    'dratini_progress_pct', LEAST(100, ROUND(v_p.pokedollars::numeric * 100 / GREATEST(1, v_cfg.dratini_price))),
    'vault', v_vault,
    'market', v_market,
    'today', v_today
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. Tick diario: impuestos, deuda y descanso semanal
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_daily_tick(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg public.economy_config%ROWTYPE;
  v_p RECORD;
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_grace_until DATE;
  v_tax INT;
  v_installment INT;
  v_due INT;
  v_paid INT;
  v_debt_paid INT;
  v_tax_paid INT;
  v_new_debt INT;
  v_balance INT;
  v_results JSONB := '[]'::jsonb;
  v_status TEXT;
BEGIN
  SELECT * INTO v_cfg FROM public.economy_config WHERE id = 'global';

  FOR v_p IN
    SELECT * FROM public.profiles
    WHERE (p_user_id IS NULL OR id = p_user_id)
    FOR UPDATE
  LOOP
    v_grace_until := (v_p.economy_started_at AT TIME ZONE 'America/Bogota')::date + v_cfg.grace_days;

    IF v_today < v_grace_until THEN
      v_results := v_results || jsonb_build_object('user_id', v_p.id, 'status', 'grace', 'until', v_grace_until);
      CONTINUE;
    END IF;

    IF v_p.last_tax_charge_date IS NOT NULL AND v_p.last_tax_charge_date >= v_today THEN
      v_results := v_results || jsonb_build_object('user_id', v_p.id, 'status', 'already_charged');
      CONTINUE;
    END IF;

    IF EXTRACT(DOW FROM v_today)::INT = v_cfg.rest_day_dow THEN
      UPDATE public.profiles SET last_tax_charge_date = v_today WHERE id = v_p.id;
      v_results := v_results || jsonb_build_object('user_id', v_p.id, 'status', 'rest_day');
      CONTINUE;
    END IF;

    v_tax := public.economy_tax_due(v_p.pc_boxes, v_p.vault_slots);
    IF v_p.rescue_plan_active AND (v_p.rescue_until IS NULL OR v_p.rescue_until >= v_today) THEN
      v_tax := CEIL(v_tax / 2.0)::INT;
    END IF;

    -- Amortización: hasta 50% del impuesto va a pagar deuda vieja
    v_installment := LEAST(v_p.tax_debt, CEIL(v_tax * 0.5)::INT);
    v_due := v_tax + v_installment;
    v_paid := LEAST(v_p.pokedollars, v_due);
    v_debt_paid := LEAST(v_paid, v_installment);
    v_tax_paid := v_paid - v_debt_paid;
    v_new_debt := v_p.tax_debt - v_debt_paid + (v_tax - v_tax_paid);
    v_balance := v_p.pokedollars - v_paid;

    UPDATE public.profiles
    SET pokedollars = v_balance,
        tax_debt = v_new_debt,
        last_tax_charge_date = v_today,
        rescue_plan_active = CASE
          WHEN v_p.rescue_until IS NOT NULL AND v_p.rescue_until < v_today THEN FALSE
          ELSE v_p.rescue_plan_active END,
        updated_at = now()
    WHERE id = v_p.id;

    PERFORM public.economy_log(
      v_p.id, 'tax', -v_tax_paid, v_balance,
      format('Impuesto diario de Johto (%s ₽)', v_tax_paid),
      jsonb_build_object('tax_due', v_tax, 'debt_paid', v_debt_paid, 'new_debt', v_new_debt)
    );

    IF v_tax_paid < v_tax THEN
      PERFORM public.economy_log(
        v_p.id, 'tax_debt', (v_tax - v_tax_paid), v_balance,
        'Impuesto impago añadido a la deuda',
        jsonb_build_object('new_debt', v_new_debt)
      );
      v_status := 'partial';
    ELSE
      v_status := 'charged';
    END IF;

    v_results := v_results || jsonb_build_object(
      'user_id', v_p.id, 'status', v_status, 'tax_due', v_tax,
      'paid', v_paid, 'debt', v_new_debt, 'balance', v_balance
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'date', v_today, 'results', v_results);
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Multas por tareas incumplidas
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_apply_fine(p_tier INT DEFAULT 1, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_cfg public.economy_config%ROWTYPE;
  v_base INT;
  v_fine INT;
  v_paid INT;
  v_new_debt INT;
  v_balance INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  SELECT * INTO v_cfg FROM public.economy_config WHERE id = 'global';

  v_base := CASE p_tier WHEN 3 THEN v_cfg.fine_tier_3 WHEN 2 THEN v_cfg.fine_tier_2 ELSE v_cfg.fine_tier_1 END;
  -- Tope: 20% del saldo líquido (mínimo 10 ₽ para que la multa importe)
  v_fine := LEAST(v_base, GREATEST(10, FLOOR(v_p.pokedollars * v_cfg.fine_cap_pct)::INT));

  v_paid := LEAST(v_p.pokedollars, v_fine);
  v_new_debt := v_p.tax_debt + (v_fine - v_paid);
  v_balance := v_p.pokedollars - v_paid;

  UPDATE public.profiles
  SET pokedollars = v_balance, tax_debt = v_new_debt, updated_at = now()
  WHERE id = v_user_id;

  PERFORM public.economy_log(
    v_user_id, 'fine', -v_paid, v_balance,
    COALESCE(p_reason, format('Multa de la Liga (tier %s)', p_tier)),
    jsonb_build_object('fine', v_fine, 'unpaid', v_fine - v_paid, 'new_debt', v_new_debt)
  );

  RETURN jsonb_build_object('success', true, 'fine', v_fine, 'paid', v_paid,
                            'unpaid', v_fine - v_paid, 'debt', v_new_debt, 'wallet', v_balance);
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. Sincronización del dinero del cartucho + Expedición de la Liga
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
  v_cfg public.economy_config%ROWTYPE;
  v_delta INT;
  v_bonus INT := 0;
  v_debt_paid INT := 0;
  v_week_start DATE := date_trunc('week', (timezone('America/Bogota', now()))::date)::date;
  v_week_paid INT;
  v_balance INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF p_in_game_money IS NULL OR p_in_game_money < 0 THEN
    RAISE EXCEPTION 'Dinero de juego inválido';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  SELECT * INTO v_cfg FROM public.economy_config WHERE id = 'global';

  v_delta := p_in_game_money - COALESCE(v_p.in_game_money, 0);
  v_balance := v_p.pokedollars;
  v_week_paid := CASE WHEN v_p.expedition_week_start = v_week_start THEN v_p.expedition_week_paid ELSE 0 END;

  IF v_delta > 0 THEN
    -- Bono de expedición SOLO sobre ganancias nuevas y con tope semanal
    v_bonus := LEAST(
      FLOOR(v_delta * v_cfg.expedition_bonus_pct)::INT,
      GREATEST(0, v_cfg.expedition_week_cap - v_week_paid)
    );

    IF v_bonus > 0 THEN
      v_debt_paid := LEAST(v_bonus, v_p.tax_debt);
      v_balance := v_balance + (v_bonus - v_debt_paid);

      UPDATE public.profiles
      SET in_game_money = p_in_game_money,
          pokedollars = v_balance,
          tax_debt = v_p.tax_debt - v_debt_paid,
          expedition_week_start = v_week_start,
          expedition_week_paid = v_week_paid + v_bonus,
          updated_at = now()
      WHERE id = v_user_id;

      PERFORM public.economy_log(
        v_user_id, 'expedition_bonus', v_bonus - v_debt_paid, v_balance,
        format('Expedición de la Liga: +%s ₽ de bono', v_bonus),
        jsonb_build_object('game_delta', v_delta, 'bonus', v_bonus, 'debt_paid', v_debt_paid)
      );
    ELSE
      UPDATE public.profiles
      SET in_game_money = p_in_game_money, updated_at = now()
      WHERE id = v_user_id;
    END IF;
  ELSE
    UPDATE public.profiles SET in_game_money = p_in_game_money, updated_at = now() WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'delta', v_delta,
    'bonus', v_bonus,
    'debt_paid', v_debt_paid,
    'wallet', v_balance,
    'in_game_money', p_in_game_money,
    'week_paid', LEAST(v_cfg.expedition_week_cap, v_week_paid + v_bonus),
    'week_cap', v_cfg.expedition_week_cap
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. Tick del mercado (determinista)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_market_tick()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (timezone('America/Bogota', now()))::date;
  v_item RECORD;
  v_seed BIGINT;
  v_rnd NUMERIC;
  v_wave NUMERIC;
  v_buy INT;
  v_sell INT;
  v_prev INT;
  v_count INT := 0;
BEGIN
  FOR v_item IN SELECT * FROM public.economy_shop_prices WHERE category = 'market' AND active LOOP
    v_seed := ABS(('x' || substr(md5(v_item.item_id || v_today::text), 1, 7))::bit(28)::int);
    v_rnd := (v_seed % 1000)::numeric / 1000.0;
    v_wave := SIN((v_today - DATE '2026-01-01')::numeric / 7.0 * 2 * PI());

    v_buy := ROUND(v_item.price * (0.70 + 0.55 * v_rnd + 0.12 * v_wave));
    v_buy := GREATEST(ROUND(v_item.price * 0.55)::INT, v_buy);
    v_sell := ROUND(v_buy * (0.74 + 0.12 * v_rnd));

    SELECT buy_price INTO v_prev
    FROM public.economy_market_prices
    WHERE item_id = v_item.item_id AND trade_date < v_today
    ORDER BY trade_date DESC LIMIT 1;

    INSERT INTO public.economy_market_prices (item_id, trade_date, buy_price, sell_price, change_pct)
    VALUES (
      v_item.item_id, v_today, v_buy, v_sell,
      CASE WHEN COALESCE(v_prev, 0) > 0 THEN ROUND((v_buy - v_prev)::numeric * 100 / v_prev, 1) ELSE 0 END
    )
    ON CONFLICT (item_id, trade_date) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'date', v_today, 'items', v_count);
END;
$$;

-- ------------------------------------------------------------------------------
-- 13. Compra (precio del servidor, sin p_cost)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.rpc_purchase_shop_item(TEXT, INT);

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

  v_is_essential := v_item.category IN ('cure', 'balls');
  IF v_p.tax_debt > 0 AND NOT v_is_essential AND v_item.kind <> 'expansion' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Deuda pendiente de %s ₽. Paga con la Expedición o activa el Plan de Rescate.', v_p.tax_debt),
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
      UPDATE public.profiles SET pc_boxes = LEAST(10, pc_boxes + COALESCE((v_item.payload->>'amount')::INT, 1)) WHERE id = v_user_id;
    ELSIF v_item.payload->>'type' = 'vault_slots' THEN
      UPDATE public.profiles SET vault_slots = LEAST(100, vault_slots + COALESCE((v_item.payload->>'amount')::INT, 10)) WHERE id = v_user_id;
    END IF;
  ELSIF v_item.kind = 'cosmetic' THEN
    UPDATE public.profiles
    SET cosmetics_inventory = CASE
      WHEN cosmetics_inventory ? p_item_id THEN cosmetics_inventory
      ELSE cosmetics_inventory || to_jsonb(p_item_id)
    END
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.valdr_vault (
      user_id, item_type, item_id_or_species, display_name, quantity, payload_json, is_shiny, status
    ) VALUES (
      v_user_id,
      v_item.kind,
      CASE WHEN v_item.kind = 'pokemon' THEN COALESCE(v_item.payload->>'speciesId', p_item_id) ELSE p_item_id END,
      COALESCE(v_item.display_name, p_item_id),
      v_qty,
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
-- 14. Venta de bayas / consumibles desde la bóveda
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_sell(p_item_id TEXT, p_qty INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_item public.economy_shop_prices%ROWTYPE;
  v_market RECORD;
  v_qty INT := GREATEST(1, LEAST(COALESCE(p_qty, 1), 99));
  v_vault RECORD;
  v_price INT;
  v_total INT;
  v_balance INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_item FROM public.economy_shop_prices WHERE item_id = p_item_id;
  IF NOT FOUND OR v_item.kind = 'pokemon' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este objeto no puede revenderse');
  END IF;

  SELECT * INTO v_vault FROM public.valdr_vault
  WHERE user_id = v_user_id AND item_id_or_species = p_item_id AND status = 'in_vault'
  FOR UPDATE;
  IF NOT FOUND OR v_vault.quantity < v_qty THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes suficientes unidades en la Bóveda');
  END IF;

  IF v_item.category = 'market' THEN
    SELECT * INTO v_market FROM public.economy_market_prices
    WHERE item_id = p_item_id AND trade_date = (timezone('America/Bogota', now()))::date;
    v_price := COALESCE(v_market.sell_price, ROUND(v_item.price * 0.78)::INT);
  ELSE
    v_price := ROUND(v_item.price * 0.5)::INT;
  END IF;

  v_total := v_price * v_qty;

  IF v_vault.quantity = v_qty THEN
    DELETE FROM public.valdr_vault WHERE id = v_vault.id;
  ELSE
    UPDATE public.valdr_vault SET quantity = quantity - v_qty WHERE id = v_vault.id;
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  v_balance := v_p.pokedollars + v_total;
  UPDATE public.profiles SET pokedollars = v_balance, updated_at = now() WHERE id = v_user_id;

  PERFORM public.economy_log(
    v_user_id, 'sale', v_total, v_balance,
    format('Venta: %s x%s', COALESCE(v_item.display_name, p_item_id), v_qty),
    jsonb_build_object('item_id', p_item_id, 'unit_price', v_price, 'qty', v_qty)
  );

  RETURN jsonb_build_object('success', true, 'item_id', p_item_id, 'quantity', v_qty,
                            'unit_price', v_price, 'total', v_total, 'pokedollars', v_balance);
END;
$$;

-- ------------------------------------------------------------------------------
-- 15. Plan de Rescate
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_economy_activate_rescue_plan()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_p RECORD;
  v_today DATE := (timezone('America/Bogota', now()))::date;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_p FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_p.rescue_plan_active AND v_p.rescue_until >= v_today THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plan de rescate ya está activo',
                              'until', v_p.rescue_until);
  END IF;

  UPDATE public.profiles
  SET rescue_plan_active = TRUE,
      rescue_until = v_today + 7,
      last_tax_charge_date = v_today,
      updated_at = now()
  WHERE id = v_user_id;

  PERFORM public.economy_log(
    v_user_id, 'rescue_plan', 0, v_p.pokedollars,
    'Plan de Rescate activado: 7 días con impuesto reducido a la mitad y multas congeladas',
    jsonb_build_object('until', v_today + 7)
  );

  RETURN jsonb_build_object('success', true, 'until', v_today + 7, 'wallet', v_p.pokedollars);
END;
$$;

-- ------------------------------------------------------------------------------
-- 16. Permisos
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.rpc_economy_daily_tick(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_economy_market_tick() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_daily_tick(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_economy_market_tick() TO service_role;

GRANT EXECUTE ON FUNCTION public.rpc_economy_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_purchase_shop_item(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_sell(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_sync_game_money(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_apply_fine(INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_economy_activate_rescue_plan() TO authenticated;

-- ------------------------------------------------------------------------------
-- 17. Backfill de perfiles existentes
-- ------------------------------------------------------------------------------
UPDATE public.profiles
SET economy_started_at = COALESCE(economy_started_at, timezone('utc', now())),
    in_game_money = COALESCE(in_game_money, 0),
    tax_debt = COALESCE(tax_debt, 0)
WHERE economy_started_at IS NULL OR in_game_money IS NULL OR tax_debt IS NULL;
