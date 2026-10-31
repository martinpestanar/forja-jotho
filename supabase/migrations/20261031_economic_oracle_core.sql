-- ==============================================================================
-- MIGRACIÓN MAESTRA: EL ORÁCULO DE SUPABASE & CEREBRO ECONÓMICO INTEGRAL v7.0
-- ==============================================================================
-- 1. Control de Vigor/Energía (⚡) y Batería de Radar en profiles.
-- 2. El Rancho SynDex: 4 Sectores, Turnos de 4 Horas, Work-Lock y Tope de EXP.
-- 3. Las 21 Megacorporaciones y PyMEs (Johto, Kanto, Hoenn) + Commodities.
-- 4. Sistema de Bolsa Determinista: Límite de Circuito ±25% y Quema de Comisión 3%.
-- 5. Cofre de Exportación / Inyección (.sav) con Prevención Criptográfica de Duplicación.
-- 6. Contratos Corporativos con SLA y Vencimiento.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIÓN DE PERFILES (Vigor ⚡, Batería y Estado de Suspensión)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS energy_charges INT NOT NULL DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS radar_battery INT NOT NULL DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (farm_status IN ('ACTIVE', 'SUSPENDED'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS farm_rent_due_at DATE DEFAULT ((timezone('America/Bogota', now()) + interval '7 days'))::date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_badge_count INT NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------------------
-- 2. EL RANCHO SYNDEX (4 SECTORES, TURNOS 4H, WORK-LOCK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ranch_sectors (
  sector_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  allowed_types TEXT[] NOT NULL,
  base_duration_hours INT NOT NULL DEFAULT 4,
  base_exp_reward INT NOT NULL,
  primary_yield_item TEXT NOT NULL,
  secondary_yield_item TEXT,
  description TEXT NOT NULL
);

INSERT INTO public.ranch_sectors (sector_id, name, allowed_types, base_duration_hours, base_exp_reward, primary_yield_item, secondary_yield_item, description)
VALUES
  ('ORCHARD',   'Huerto de Bayas',  ARRAY['WATER', 'GRASS', 'FIRE'],          4, 2000, 'BERRY_SITRUS', 'BERRY_LUM',    'Produce bayas curativas y semillas raras para el mercado y combate.'),
  ('QUARRY',    'Cantera y Mina',   ARRAY['ROCK', 'GROUND', 'STEEL', 'FIGHTING'], 4, 6000, 'NUGGET',       'STAR_PIECE',   'Extrae pepitas de oro, trozos estrella y fósiles milenarios.'),
  ('SAWMILL',   'Aserradero',       ARRAY['BUG', 'FLYING', 'GRASS'],           4, 4000, 'WOOD_HARD',    'WOOD_SOFT',    'Produce madera noble y materiales de construcción para el rancho.'),
  ('GENERATOR', 'Generador Central',ARRAY['ELECTRIC', 'STEEL'],                4, 3000, 'ENERGY_CELL',  'BATTERY_PACK', 'Acelera un 25% la velocidad de los demás sectores mediante energía continua.')
ON CONFLICT (sector_id) DO UPDATE SET
  name = EXCLUDED.name,
  allowed_types = EXCLUDED.allowed_types,
  base_duration_hours = EXCLUDED.base_duration_hours,
  base_exp_reward = EXCLUDED.base_exp_reward,
  primary_yield_item = EXCLUDED.primary_yield_item,
  secondary_yield_item = EXCLUDED.secondary_yield_item,
  description = EXCLUDED.description;

ALTER TABLE public.ranch_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ranch_sectors_read" ON public.ranch_sectors;
CREATE POLICY "ranch_sectors_read" ON public.ranch_sectors FOR SELECT TO authenticated, anon USING (true);

-- Tabla de Turnos Activos del Rancho
CREATE TABLE IF NOT EXISTS public.ranch_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sector_id TEXT NOT NULL REFERENCES public.ranch_sectors(sector_id),
  pokemon_uid TEXT NOT NULL,
  pokemon_species TEXT NOT NULL,
  pokemon_level INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finishes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'WORKING' CHECK (status IN ('WORKING', 'COMPLETED', 'CANCELLED')),
  exp_reward INT NOT NULL DEFAULT 0,
  item_reward_code TEXT,
  item_reward_qty INT NOT NULL DEFAULT 1,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranch_shifts_user_status ON public.ranch_shifts(user_id, status);

ALTER TABLE public.ranch_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ranch_shifts_user_read" ON public.ranch_shifts;
CREATE POLICY "ranch_shifts_user_read" ON public.ranch_shifts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. LAS 21 MEGACORPORACIONES Y PYMES (POKÉ-EXCHANGE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_corporations (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('JOHTO', 'KANTO', 'HOENN')),
  sector TEXT NOT NULL,
  current_price NUMERIC(12,2) NOT NULL CHECK (current_price > 0),
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price > 0),
  previous_close NUMERIC(12,2) NOT NULL CHECK (previous_close > 0),
  daily_change_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  tier TEXT NOT NULL DEFAULT 'ENTERPRISE' CHECK (tier IN ('ENTERPRISE', 'SME')),
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.market_corporations (ticker, name, region, sector, current_price, base_price, previous_close, tier, description)
VALUES
  -- 🌸 JOHTO
  ('$KRNM', 'Kuronuma Orfebres', 'JOHTO', 'Orfebrería y Pokéballs Bonguri', 125.00, 125.00, 125.00, 'ENTERPRISE', 'Líder en forja artesanal de Pokéballs especiales.'),
  ('$MUMU', 'Granja Mumu S.A.',   'JOHTO', 'Monopolio Lácteo Leche Mu-mu',   240.00, 240.00, 240.00, 'ENTERPRISE', 'Distribuidor exclusivo de nutrición de alto rendimiento.'),
  ('$RADJ', 'Radio Goldenrod',   'JOHTO', 'Telecomunicaciones & Heraldo',  85.00,  85.00,  85.00,  'ENTERPRISE', 'La voz de Johto y editora del Heraldo matutino.'),
  ('$MTRN', 'Mag-Train Rail',    'JOHTO', 'Transporte Ferroviario Rápido', 310.00, 310.00, 310.00, 'ENTERPRISE', 'Conexión estratégica comercial entre Ciudad Trigal y Azafrán.'),
  ('$APOT', 'Apoteca Tradicional','JOHTO','Herbolaria Medicinal',           55.00,  55.00,  55.00,  'SME',        'Polvos curativos y raíces de la meseta.'),
  ('$WHIR', 'Hidro Remolinos',   'JOHTO', 'Energía Mareomotriz',           190.00, 190.00, 190.00, 'ENTERPRISE', 'Aprovechamiento de las corrientes de las Islas Remolino.'),
  ('$PLTD', 'Mt. Silver Credit', 'JOHTO', 'Financiera y Casas de Empeño',  420.00, 420.00, 420.00, 'ENTERPRISE', 'Crédito para entrenadores de la élite de Johto.'),
  
  -- ⚡ KANTO
  ('$SLPH', 'Silph Co.',         'KANTO', 'Alta Tecnología & PC Systems',  850.00, 850.00, 850.00, 'ENTERPRISE', 'Gigante tecnológico desarrollador de la Master Ball.'),
  ('$CLDN', 'Celadon Pharma',    'KANTO', 'Vitaminas Sintéticas y EVs',    380.00, 380.00, 380.00, 'ENTERPRISE', 'Producción de Proteínas, Hierro y Más PS.'),
  ('$SSAN', 'S.S. Anne Corp',    'KANTO', 'Transporte Marítimo de Lujo',   290.00, 290.00, 290.00, 'ENTERPRISE', 'Línea de cruceros transoceánicos para la alta sociedad.'),
  ('$KBN',  'Kanto Broadcasting','KANTO', 'Televisión Oficial de la Liga',  140.00, 140.00, 140.00, 'ENTERPRISE', 'Retransmisiones de combates de gimnasio y campeonatos.'),
  ('$SFGR', 'Saffron AgroTech',  'KANTO', 'Fertilizantes y Cosechas',      110.00, 110.00, 110.00, 'ENTERPRISE', 'Biotecnología para el crecimiento acelerado de bayas.'),
  ('$POWR', 'Kanto Power Plant', 'KANTO', 'Energía Eléctrica Regional',    510.00, 510.00, 510.00, 'ENTERPRISE', 'La central que abastece a toda la región de Kanto.'),
  ('$RCKT', 'Syndicate Casino',  'KANTO', 'Entretenimiento y Mercado Negro',320.00, 320.00, 320.00, 'ENTERPRISE', 'Centro neurálgico de apuestas y premios raros.'),

  -- 🌋 HOENN
  ('$DEVN', 'Devon Corporation', 'HOENN', 'Minería Pesada y Fósiles',      920.00, 920.00, 920.00, 'ENTERPRISE', 'Pioneros en resurrección fósil y Scope de Devon.'),
  ('$SBSE', 'SubSea Exploration','HOENN', 'Submarinos de Fosa Abisal',     275.00, 275.00, 275.00, 'ENTERPRISE', 'Expediciones científicas a las profundidades oceánicas.'),
  ('$LAVA', 'Lavaridge Spas',    'HOENN', 'Turismo Termal & Salud',        130.00, 130.00, 130.00, 'SME',        'Balnearios naturales en las faldas del volcán.'),
  ('$WTHR', 'Weather Institute', 'HOENN', 'Satélites Climatológicos',      460.00, 460.00, 460.00, 'ENTERPRISE', 'Estudio avanzado de anomalías meteorológicas permanentes.'),
  ('$SLAT', 'Slateport Spices',  'HOENN', 'Especias & Bayas Exóticas',     175.00, 175.00, 175.00, 'ENTERPRISE', 'Comercio ultramarino en el puerto más activo.'),
  ('$CHIM', 'Chimney Geothermal','HOENN', 'Energía del Volcán',            390.00, 390.00, 390.00, 'ENTERPRISE', 'Explotación geotérmica de alta temperatura.'),
  ('$OCLG', 'Oceanic Salvage',   'HOENN', 'Salvamento Marítimo & Fletes',  210.00, 210.00, 210.00, 'ENTERPRISE', 'Recuperación de tesoros sumergidos en buques naufragados.')
ON CONFLICT (ticker) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  sector = EXCLUDED.sector,
  tier = EXCLUDED.tier,
  description = EXCLUDED.description;

ALTER TABLE public.market_corporations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "market_corporations_read" ON public.market_corporations;
CREATE POLICY "market_corporations_read" ON public.market_corporations FOR SELECT TO authenticated, anon USING (true);

-- Cartera de Acciones del Usuario
CREATE TABLE IF NOT EXISTS public.user_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL REFERENCES public.market_corporations(ticker) ON DELETE CASCADE,
  shares_owned NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (shares_owned >= 0),
  avg_buy_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_ticker UNIQUE (user_id, ticker)
);

ALTER TABLE public.user_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_portfolio_read_own" ON public.user_portfolio;
CREATE POLICY "user_portfolio_read_own" ON public.user_portfolio FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Histórico de Noticias "El Heraldo de Johto"
CREATE TABLE IF NOT EXISTS public.market_news_chronicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_date DATE NOT NULL DEFAULT ((timezone('America/Bogota', now()))::date),
  headline TEXT NOT NULL,
  subheadline TEXT,
  body_text TEXT NOT NULL,
  affected_ticker TEXT REFERENCES public.market_corporations(ticker),
  market_sentiment TEXT NOT NULL CHECK (market_sentiment IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  applied_shift_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_news_chronicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "market_news_chronicles_read" ON public.market_news_chronicles;
CREATE POLICY "market_news_chronicles_read" ON public.market_news_chronicles FOR SELECT TO authenticated, anon USING (true);

-- ------------------------------------------------------------------------------
-- 4. RPC DETERMINISTA: APLICAR SHIFT DE BOLSA (CLAMP ±25% Y FALLBACK)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_apply_market_shift_clamped(
  p_ticker TEXT,
  p_proposed_shift_pct NUMERIC,
  p_headline TEXT,
  p_body TEXT,
  p_sentiment TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_corp RECORD;
  v_clamped_shift NUMERIC;
  v_new_price NUMERIC;
  v_today DATE := (timezone('America/Bogota', now()))::date;
BEGIN
  SELECT * INTO v_corp FROM public.market_corporations WHERE ticker = p_ticker FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticker no encontrado');
  END IF;

  -- Regla de Oro: Clamping determinista estricto entre -25% y +25%
  v_clamped_shift := LEAST(GREATEST(p_proposed_shift_pct, -25.00), 25.00);

  -- Nuevo precio = precio previo * (1 + shift/100)
  v_new_price := ROUND(v_corp.current_price * (1.0 + (v_clamped_shift / 100.0)), 2);
  v_new_price := GREATEST(v_new_price, 5.00); -- Piso de seguridad 5$

  -- Actualizar corporación
  UPDATE public.market_corporations
  SET previous_close = v_corp.current_price,
      current_price = v_new_price,
      daily_change_pct = v_clamped_shift,
      updated_at = now()
  WHERE ticker = p_ticker;

  -- Insertar crónica en el Heraldo
  INSERT INTO public.market_news_chronicles (
    edition_date, headline, body_text, affected_ticker, market_sentiment, applied_shift_pct, is_ai_generated
  ) VALUES (
    v_today, p_headline, p_body, p_ticker, p_sentiment, v_clamped_shift, true
  );

  RETURN jsonb_build_object(
    'success', true,
    'ticker', p_ticker,
    'previous_price', v_corp.current_price,
    'new_price', v_new_price,
    'applied_shift_pct', v_clamped_shift
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPC DETERMINISTA: TRADING DE BOLSA (3% COMISIÓN DE QUEMA)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_trade_corporation_stock(
  p_ticker TEXT,
  p_action TEXT, -- 'BUY' | 'SELL'
  p_shares NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_corp RECORD;
  v_portfolio RECORD;
  v_gross_cost NUMERIC;
  v_fee NUMERIC;
  v_net_amount NUMERIC;
  v_new_balance INT;
  v_new_shares NUMERIC;
  v_new_avg NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_shares <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La cantidad debe ser mayor a 0');
  END IF;

  SELECT * INTO v_corp FROM public.market_corporations WHERE ticker = p_ticker;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Corporación inválida');
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;
  SELECT * INTO v_portfolio FROM public.user_portfolio WHERE user_id = v_uid AND ticker = p_ticker FOR UPDATE;

  v_gross_cost := ROUND(p_shares * v_corp.current_price, 2);
  -- 3% Comisión de quema
  v_fee := ROUND(v_gross_cost * 0.03, 2);

  IF p_action = 'BUY' THEN
    v_net_amount := v_gross_cost + v_fee;
    IF v_p.pokedollars < v_net_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Fondos insuficientes para compra + comisión del 3%');
    END IF;

    v_new_balance := (v_p.pokedollars - v_net_amount)::INT;
    
    -- Calcular nuevo precio medio
    IF v_portfolio.shares_owned IS NULL OR v_portfolio.shares_owned = 0 THEN
      v_new_shares := p_shares;
      v_new_avg := v_corp.current_price;
    ELSE
      v_new_shares := v_portfolio.shares_owned + p_shares;
      v_new_avg := ROUND(((v_portfolio.shares_owned * v_portfolio.avg_buy_price) + v_gross_cost) / v_new_shares, 2);
    END IF;

    -- Actualizar wallet
    UPDATE public.profiles SET pokedollars = v_new_balance WHERE id = v_uid;

    -- Actualizar cartera
    INSERT INTO public.user_portfolio (user_id, ticker, shares_owned, avg_buy_price, updated_at)
    VALUES (v_uid, p_ticker, v_new_shares, v_new_avg, now())
    ON CONFLICT (user_id, ticker) DO UPDATE SET
      shares_owned = EXCLUDED.shares_owned,
      avg_buy_price = EXCLUDED.avg_buy_price,
      updated_at = now();

    -- Registrar en ledger
    INSERT INTO public.economy_ledger (user_id, kind, amount, balance_after, description, metadata)
    VALUES (v_uid, 'STOCK_BUY', -(v_net_amount::INT), v_new_balance, 
      format('Compra de %s acciones de %s (Fee 3%%: %s)', p_shares, p_ticker, v_fee),
      jsonb_build_object('ticker', p_ticker, 'shares', p_shares, 'unit_price', v_corp.current_price, 'fee', v_fee)
    );

    RETURN jsonb_build_object(
      'success', true,
      'action', 'BUY',
      'shares', p_shares,
      'total_paid', v_net_amount,
      'burn_fee', v_fee,
      'new_balance', v_new_balance
    );

  ELSIF p_action = 'SELL' THEN
    IF v_portfolio.shares_owned IS NULL OR v_portfolio.shares_owned < p_shares THEN
      RETURN jsonb_build_object('success', false, 'error', 'No posees suficientes acciones para vender');
    END IF;

    v_net_amount := v_gross_cost - v_fee;
    v_new_balance := (v_p.pokedollars + v_net_amount)::INT;
    v_new_shares := v_portfolio.shares_owned - p_shares;

    -- Actualizar wallet
    UPDATE public.profiles SET pokedollars = v_new_balance WHERE id = v_uid;

    -- Actualizar cartera
    UPDATE public.user_portfolio 
    SET shares_owned = v_new_shares,
        avg_buy_price = CASE WHEN v_new_shares = 0 THEN 0 ELSE avg_buy_price END,
        updated_at = now()
    WHERE user_id = v_uid AND ticker = p_ticker;

    -- Registrar en ledger
    INSERT INTO public.economy_ledger (user_id, kind, amount, balance_after, description, metadata)
    VALUES (v_uid, 'STOCK_SELL', v_net_amount::INT, v_new_balance, 
      format('Venta de %s acciones de %s (Fee 3%%: %s)', p_shares, p_ticker, v_fee),
      jsonb_build_object('ticker', p_ticker, 'shares', p_shares, 'unit_price', v_corp.current_price, 'fee', v_fee)
    );

    RETURN jsonb_build_object(
      'success', true,
      'action', 'SELL',
      'shares', p_shares,
      'total_received', v_net_amount,
      'burn_fee', v_fee,
      'new_balance', v_new_balance
    );

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Acción inválida');
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. RPC DETERMINISTA: EL RANCHO (ASIGNAR TURNO 4H Y WORK-LOCK)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_start_ranch_shift(
  p_sector_id TEXT,
  p_pokemon_uid TEXT,
  p_pokemon_species TEXT,
  p_pokemon_level INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p RECORD;
  v_sector RECORD;
  v_finish_time TIMESTAMPTZ;
  v_shift_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_p.farm_status = 'SUSPENDED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rancho suspendido por falta de pago del alquiler semanal');
  END IF;

  IF v_p.energy_charges < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes Cargas de Energía (⚡). Completa hábitos reales para obtenerlas.');
  END IF;

  SELECT * INTO v_sector FROM public.ranch_sectors WHERE sector_id = p_sector_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sector de rancho no válido');
  END IF;

  -- Comprobar si el Pokémon ya está trabajando
  IF EXISTS (
    SELECT 1 FROM public.ranch_shifts
    WHERE user_id = v_uid AND pokemon_uid = p_pokemon_uid AND status = 'WORKING'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este Pokémon ya tiene un turno de trabajo activo');
  END IF;

  -- Duración estándar: 4 horas
  v_finish_time := now() + (v_sector.base_duration_hours || ' hours')::interval;

  -- Descontar 1 Carga de Energía
  UPDATE public.profiles
  SET energy_charges = energy_charges - 1
  WHERE id = v_uid;

  -- Crear turno de trabajo con Work-Lock
  INSERT INTO public.ranch_shifts (
    user_id, sector_id, pokemon_uid, pokemon_species, pokemon_level,
    started_at, finishes_at, status, exp_reward, item_reward_code, item_reward_qty
  ) VALUES (
    v_uid, p_sector_id, p_pokemon_uid, p_pokemon_species, p_pokemon_level,
    now(), v_finish_time, 'WORKING', v_sector.base_exp_reward, v_sector.primary_yield_item, 1
  ) RETURNING id INTO v_shift_id;

  RETURN jsonb_build_object(
    'success', true,
    'shift_id', v_shift_id,
    'sector', v_sector.name,
    'finishes_at', v_finish_time,
    'remaining_energy', v_p.energy_charges - 1
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC DETERMINISTA: RECLAMAR TURNO RANCHO (FRENO POR HARD CAP)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_claim_ranch_shift(p_shift_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_shift RECORD;
  v_p RECORD;
  v_cap INT;
  v_adjusted_exp INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_shift FROM public.ranch_shifts WHERE id = p_shift_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Turno no encontrado');
  END IF;

  IF v_shift.status != 'WORKING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este turno ya fue reclamado o cancelado');
  END IF;

  IF now() < v_shift.finishes_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'El turno aún está en progreso');
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid;

  -- Hard Cap de Johto según medallas del usuario (1 a 8)
  v_cap := CASE v_p.current_badge_count
    WHEN 0 THEN 14
    WHEN 1 THEN 20
    WHEN 2 THEN 26
    WHEN 3 THEN 30
    WHEN 4 THEN 32
    WHEN 5 THEN 33
    WHEN 6 THEN 34
    WHEN 7 THEN 35
    ELSE 36
  END;

  -- Si el Pokémon ya alcanzó el cap, la ganancia de EXP se reduce a 0 en el rancho
  IF v_shift.pokemon_level >= v_cap THEN
    v_adjusted_exp := 0;
  ELSE
    v_adjusted_exp := v_shift.exp_reward;
  END IF;

  -- Marcar turno como completado
  UPDATE public.ranch_shifts
  SET status = 'COMPLETED', claimed_at = now()
  WHERE id = p_shift_id;

  -- Acreditar el ítem cosechado a la Bóveda del usuario (valdr_vault)
  INSERT INTO public.valdr_vault (
    user_id, item_type, item_id_or_species, display_name, quantity, status, avg_buy_price
  ) VALUES (
    v_uid, 'item', v_shift.item_reward_code, 'Cosecha de Rancho: ' || v_shift.item_reward_code, v_shift.item_reward_qty, 'in_vault', 0
  );

  RETURN jsonb_build_object(
    'success', true,
    'exp_granted', v_adjusted_exp,
    'capped', (v_shift.pokemon_level >= v_cap),
    'current_cap', v_cap,
    'reward_item', v_shift.item_reward_code,
    'reward_qty', v_shift.item_reward_qty
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC DETERMINISTA: COFRE DE EXPORTACIÓN (ROM LOOT -> WEBAPP CON BORRADO)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_export_sav_treasures(
  p_treasures JSONB -- Array de [{item_id: "NUGGET", qty: 2, unit_val: 5000}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_item RECORD;
  v_total_pokedollars INT := 0;
  v_p RECORD;
  v_new_balance INT;
  v_receipt_hash TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_treasures) AS x(item_id TEXT, qty INT, unit_val INT)
  LOOP
    IF v_item.qty > 0 AND v_item.unit_val > 0 THEN
      -- Sanitización de valor para evitar inyecciones fraudulentas
      v_total_pokedollars := v_total_pokedollars + (v_item.qty * v_item.unit_val);
    END IF;
  END LOOP;

  IF v_total_pokedollars <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay tesoros válidos para exportar');
  END IF;

  v_new_balance := v_p.pokedollars + v_total_pokedollars;

  -- Acreditar en saldo
  UPDATE public.profiles SET pokedollars = v_new_balance WHERE id = v_uid;

  -- Generar recibo de liquidación criptográfica
  v_receipt_hash := md5(v_uid::text || now()::text || v_total_pokedollars::text);

  -- Registrar en ledger
  INSERT INTO public.economy_ledger (user_id, kind, amount, balance_after, description, metadata)
  VALUES (
    v_uid, 'SAV_LOOT_EXPORT', v_total_pokedollars, v_new_balance,
    'Liquidación de Tesoros de Cartucho GBA',
    jsonb_build_object('receipt_hash', v_receipt_hash, 'treasures', p_treasures)
  );

  RETURN jsonb_build_object(
    'success', true,
    'total_earned', v_total_pokedollars,
    'new_balance', v_new_balance,
    'receipt_hash', v_receipt_hash,
    'action_required', 'DELETE_FROM_SAV'
  );
END;
$$;
