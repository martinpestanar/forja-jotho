# Traspaso — Economía viva de Johto + Bazar inyectable

> Documento de entrega para el agente que continúa el trabajo.
> Última sesión cerró en el commit `e03a5c7`. Todo el código ya está en `main`.

---

## 0. Contexto en 30 segundos

- Repo: `C:\Users\Martin\Documents\Korat-Flow-Agencia\SynDex` · rama `main`.
- **El código ya está commiteado.** No hay nada pendiente de aplicar en el working tree (salvo cambios de otra sesión en `src/lib/hqNav.tsx`).
- **Las migraciones ya están aplicadas en producción** (Supabase). Falta únicamente verificar y pulir UI.
- Una sola moneda: `profiles.pokedollars`. `valdr_profiles.sovereignty_gold` quedó como legado (solo se sincroniza en Templanza).

### Commits de esta tanda

```
e03a5c7  style(bazar): rediseño a la línea Claude Warm Light del HQ
0fcfeb9  feat(hq): Bazar de Ciudad Trigal y acceso directo desde el Time Engine
f08b1ea  fix(economy): wallet real en Bazar, invitados sin ruido y labels de una sola moneda
65e9fe6  feat(economy): mercado vivo de Johto con una sola moneda y Bazar inyectable
```

---

## 1. Supabase — lo que YA está hecho (verificar, no reaplicar)

### 1.1 Migraciones aplicadas

| Archivo | Contenido |
|---|---|
| `supabase/migrations/20261028_economy_core.sql` | Columnas, tablas, RLS, triggers y 9 RPCs |
| `supabase/migrations/20261028_economy_shop_seed.sql` | 128 precios del Bazar (50 MT · 5 Mints · 35 huevos/breeding/shiny/especiales · 23 consumibles · 15 cosméticos) |
| `supabase/migrations/20261028_economy_temperance.sql` | Recompensa diaria de Templanza |

### 1.2 Columnas nuevas en `profiles`

```
in_game_money INT, tax_debt INT, last_tax_charge_date DATE, economy_started_at TIMESTAMPTZ,
rescue_plan_active BOOL, rescue_until DATE, pc_boxes INT, vault_slots INT,
expedition_week_start DATE, expedition_week_paid INT, cosmetics_inventory JSONB
```

### 1.3 Tablas nuevas

- `economy_config` — parámetros globales (impuesto base, multiplicadores, precio Dratini).
- `economy_ledger` — libro mayor de cada movimiento (compra, venta, impuesto, multa, rescate).
- `economy_shop_prices` — **precio autoritativo del servidor** para el Bazar.
- `economy_market_prices` — precios variables de mercado (compra/venta/% cambio).
- `economy_oracle_cache` — caché diaria del boletín del Oráculo.

### 1.4 RPCs

| RPC | Quién | Qué hace |
|---|---|---|
| `rpc_economy_state()` | `authenticated` | Devuelve snapshot: wallet, deuda, bóveda, mercado, progreso Dratini |
| `rpc_purchase_shop_item(p_item_id TEXT, p_qty INT)` | `authenticated` | **Precio lo decide el servidor**, debita, escribe en `valdr_vault` y en ledger |
| `rpc_economy_sell(p_item_id TEXT, p_qty INT)` | `authenticated` | Vende del inventario al mercado |
| `rpc_economy_sync_game_money(p_in_game_money INT)` | `authenticated` | Sincroniza el dinero del `.sav` sin pisar la wallet |
| `rpc_economy_apply_fine(p_tier INT, p_reason TEXT)` | `authenticated` | Multa 20 / 50 / 90 ₽, tope 20 % del saldo líquido |
| `rpc_economy_activate_rescue_plan()` | `authenticated` | 7 días con impuesto a la mitad |
| `rpc_economy_daily_tick(p_user_id UUID)` | `service_role` | Cobra impuestos y actualiza gracia/expedición |
| `rpc_economy_market_tick()` | `service_role` | Mueve los precios del mercado |
| `rpc_economy_temperance_reward()` | — | Bono diario de Templanza |

### 1.5 Seguridad aplicada

- `protect_economy_columns()` + trigger `tr_protect_economy_columns`: **bloquea** que `authenticated`/`anon` hagan `UPDATE` directo a `pokedollars`, `tax_debt`, etc. Solo pasa `service_role` o dueño de función `SECURITY DEFINER`.
- `valdr_vault`: se eliminó la escritura directa. **Solo `SELECT` propio** (`valdr_vault_read_own`). La escritura ocurre únicamente por RPC.
- `shop_inventory`: se cerró el `INSERT` directo del cliente. Se añadieron las columnas que el panel admin ya esperaba (`item_key`, `item_category`, `gba_item_id`, `gba_pocket`, `quantity`, `injection_status`, `delivered_at`).
- `economy_shop_prices`, `economy_market_prices`, `economy_config`: lectura pública autenticada, escritura solo admin.

### 1.6 Dependencia externa que NO está en el repo

`rpc_valdr_dispatch_vault_item(p_vault_id UUID)` **no está definida en `supabase/migrations`**; viene de la fase anterior (Templanza/valdr) y ya existe en la base. Se usa desde `src/store/useEconomyStore.ts:193`.

> ⚠️ Si se recrea el proyecto de Supabase desde cero, la Bóveda dejará de despachar. Hay que versionar esa función.

---

## 2. Verificación sugerida en Supabase (solo lectura)

Ejecutar en el SQL Editor y comprobar que todo responde:

```sql
-- a) migraciones aplicadas
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'economy%';
-- esperado: economy_config, economy_ledger, economy_market_prices,
--           economy_oracle_cache, economy_shop_prices

-- b) precios del Bazar cargados
select category, count(*) from public.economy_shop_prices group by category order by 2 desc;
-- esperado (total 128): tms 50, egg 15, cosmetics 15, special 12, cure 9,
--                       breeding 8, mints 5, evolution 5, shiny 4, supplies 3, balls 2

-- c) el trigger de protección existe
select tgname from pg_trigger where tgname = 'tr_protect_economy_columns';

-- d) la RPC de despacho existe
select proname from pg_proc where proname = 'rpc_valdr_dispatch_vault_item';

-- e) estado de la economía de cada perfil
select p.username, p.pokedollars, p.tax_debt, p.in_grace, p.grace_until
from public.rpc_economy_state() p;  -- requiere sesión; si no, consultar profiles

-- f) RLS de la bóveda: solo debe haber política de SELECT
select polname, cmd from pg_policies
where schemaname='public' and tablename='valdr_vault';
```

### Prueba funcional segura (con rollback)

```sql
begin;
  select public.rpc_economy_market_tick();          -- mueve 15 precios
  select public.rpc_purchase_shop_item('GBA_MT26', 1);
  select * from public.valdr_vault order by created_at desc limit 1;
rollback;
```

Si `rpc_purchase_shop_item` devuelve `{"success":true}` y aparece la fila en `valdr_vault`, el circuito compra → Bóveda está sano.

---

## 3. Entorno y despliegue

Variables necesarias (ya existen en local y Vercel, **no hace falta API key nueva de Gemini**):

```
GEMINI_API_KEY        # Oráculo (reusa la del proyecto)
HQ_CRON_SECRET        # protege /api/economy/tick
CRON_SECRET           # fallback de Vercel Cron
```

`vercel.json` ya tiene el cron:

```json
{ "path": "/api/economy/tick", "schedule": "5 5 * * *" }
```

Disparo manual del tick:

```bash
curl -H "Authorization: Bearer $HQ_CRON_SECRET" https://<dominio>/api/economy/tick
```

---

## 4. Archivos tocados

### Nuevos

| Archivo | Rol |
|---|---|
| `src/app/hq/tienda/page.tsx` | Página `/hq/tienda` — Bazar dentro del HQ (`initialTab="bazar"`) |
| `src/app/api/economy/tick/route.ts` | Cron: mercado + impuestos |
| `src/app/api/economy/oracle/route.ts` | Boletín del Oráculo (Gemini + caché + fallback determinista) |
| `src/lib/hnsCatalog.ts` | Catálogo real generado desde la ROM (343 ítems, 50 MT, 5 Mints) |
| `scripts/generate_hns_catalog.js` | Regenera el catálogo desde la ROM |
| `scripts/generate_shop_seed.js` | Regenera el seed SQL de precios |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/components/shop/GoldenrodShop.tsx` | **Rediseño completo** a Claude Warm Light + container queries + precio del servidor |
| `src/components/economy/EconomySanctuary.tsx` | Rediseño + pestañas (Bóveda/Mercado/Impuestos/Meta Dratini/Bazar) + prop `initialTab` |
| `src/store/useEconomyStore.ts` | load / buy / sell / dispatch / sync / rescue / fine / oráculo; sin ruido para invitados |
| `src/store/useTrainerStore.ts` | Compra vía RPC con precio del servidor |
| `src/lib/shopCatalog.ts` | Catálogo del Bazar por pisos/categorías |
| `src/components/gba/GbaConsoleWorker.tsx` | Expone `window.__SYNDEX_GBA_READY__` y sincroniza dinero del cartucho |
| `src/lib/gba/PokemonMemoryBridge.ts` | Sync del `.sav` sin sobrescribir la wallet |
| `src/components/dashboard/PartyPcManager.tsx` | **Se eliminó la inyección gratis**; ahora despacha desde la Bóveda |
| `src/types/trainer.ts`, `MobileTopHud.tsx`, `VigorHeaderSummary.tsx`, `OracleForgeModal.tsx`, `dashboard/page.tsx` | Labels unificados a Pokédólares ₽ |
| `src/lib/hqNav.tsx` | Ítem "Bazar" (**revisar conflicto con la otra sesión**) |
| `src/app/hq/tiempo/page.tsx` | Botón "Bazar" |
| `vercel.json` | cron diario |

---

## 5. Reglas de diseño que se aplicaron (no romper)

- Tokens del HQ: `hq-card`, `hq-panel`, `hq-btn`, `hq-title`, `hq-label`, `hq-chip`, `hq-mono`, `hq-scroll`, `hq-fade-up`.
- Acento oro `--hq-gold: #c49347`. **Sin** sombras duras `shadow-[4px_4px_0_#000]` ni bordes negros.
- Grid del Bazar con **container queries** (`@container` + `@min-[Npx]:`), no breakpoints de viewport: en `/dashboard` el contenedor es `max-w-md` (448 px) y `lg:` causaba solapamiento.
- Texto máximo 2 líneas; nada de párrafos largos.

---

## 6. Pendientes reales (lo que falta)

1. **Verificar `/hq/tienda` con sesión iniciada.** No se pudo hacer: `HqGuard` redirige a `/login` y el login es de sesión única (iniciar sesión cerraba la del usuario). `/dashboard` → Santuario → Bazar **sí** fue verificado visualmente, sin overflow y sin errores de consola.
2. **Probar el flujo completo con el emulador abierto:** compra → Bóveda → "Enviar" → `CONTINUAR` en el juego. Requiere `window.__SYNDEX_GBA_READY__ === true`.
3. **Decidir sobre `src/components/layout/CentralViewContainer.tsx`**: es código muerto pero todavía importa `GoldenrodShop`. Borrarlo o dejarlo.
4. **Confirmar el ítem "Bazar" en `src/lib/hqNav.tsx`** tras la edición concurrente de la otra sesión (sigue presente, pero el archivo está modificado sin commit).
5. **Versionar `rpc_valdr_dispatch_vault_item`** en una migración (ver §1.6).
6. Revisar si el panel admin de ítems debe seguir usando `shop_inventory` ahora que su `INSERT` directo está cerrado.

---

## 7. Números del diseño económico (para no desviarse)

| Concepto | Valor |
|---|---|
| Impuesto diario | 9 ₽ base + 5 ₽ por caja PC extra + 2 ₽ por cada +10 slots de Bóveda |
| Domingo | sin impuesto |
| Gracia inicial | 14 días (`grace_until` ≈ 2026-11-10 en producción) |
| Multas | 20 / 50 / 90 ₽, tope 20 % del saldo líquido |
| Dratini shiny | 40 000 ₽ (~80–90 días a 4–5 tareas/día) |
| Mints | 3 200 ₽ |
| MTs | 800 – 2 200 ₽ |
| Bono Expedición | 22 % del delta positivo, tope 350 ₽/semana, paga deuda primero |
| Deuda | bloquea compras e inyecciones, **no** bloquea jugar |

---

## 8. Estado de calidad al cierre

- `npx tsc --noEmit` → sin errores.
- `npm run build` → OK, incluye `○ /hq/tienda`.
- `npx eslint` en los dos componentes del Bazar → sin errores tras quitar el `setState` síncrono dentro del efecto.
- Consola del navegador en `/dashboard` → sin errores.
