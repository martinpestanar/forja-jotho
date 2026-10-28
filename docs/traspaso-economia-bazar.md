# Traspaso — Economía viva de Johto + Bazar inyectable

> Documento de entrega para el agente que continúa el trabajo.
> Última sesión cerró en el commit `e03a5c7`. Todo el código ya está en `main`.

---

## 0. Contexto en 30 segundos

- Repo: `C:\Users\Martin\Documents\Korat-Flow-Agencia\SynDex` · rama `main`.
- **El código ya está commiteado.** Working tree limpio; `src/lib/hqNav.tsx` ya quedó resuelto (conviven Bazar, Pendientes y Día Cero).
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
| `supabase/migrations/20261029_valdr_dispatch_vault_item.sql` | Versiona la RPC de despacho de la Bóveda + hardening |

> **Total real de precios: 147**, no 128. `economy_core.sql` siembra 19 precios base
> (15 bayas de `market`, 2 de `expansion`, y los `SHINY_*` / `PKMN_SHINY_*`), y el seed
> generado aporta los otros 128. Contar solo el seed da un falso negativo.

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

### 1.6 `rpc_valdr_dispatch_vault_item` — ya versionada

Antes vivía **solo** en producción (fase Templanza/valdr) y se usa desde `src/store/useEconomyStore.ts:193`. Ahora está en `supabase/migrations/20261029_valdr_dispatch_vault_item.sql`.

Al versionarla se endureció:

| Antes | Ahora |
|---|---|
| `SECURITY DEFINER` sin `search_path` | `SET search_path = public` (evita secuestro de funciones) |
| `SELECT` y luego `UPDATE` | un solo `UPDATE ... WHERE status='in_vault' RETURNING` (no despacha dos veces) |
| `EXECUTE` abierto a `PUBLIC` (incluía `anon`) | `REVOKE` de `PUBLIC`/`anon`, `GRANT` solo a `authenticated` |

Aplicada en producción y verificada: `proconfig = {search_path=public}` y `acl = {postgres, authenticated, service_role}`.

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
-- esperado (total 147): tms 50, egg 15, market 15, cosmetics 15, special 12,
--   cure 9, breeding 8, shiny 6, evolution 5, mints 5, supplies 3, balls 2, expansion 2

-- c) el trigger de protección existe
select tgname from pg_trigger where tgname = 'tr_protect_economy_columns';

-- d) la RPC de despacho existe y está endurecida
select proname, proconfig, proacl from pg_proc
where proname = 'rpc_valdr_dispatch_vault_item';
-- esperado: proconfig = {search_path=public}
--           proacl SIN "=X/" (eso sería EXECUTE público) y sin anon

-- e) estado de la economía (devuelve un jsonb, no filas)
select jsonb_pretty(public.rpc_economy_state());

-- f) RLS de la bóveda: solo debe haber política de SELECT
select policyname, cmd from pg_policies
where schemaname='public' and tablename='valdr_vault';
```

### Prueba funcional segura (con rollback)

`rpc_purchase_shop_item` usa `auth.uid()`. En el SQL Editor **no hay JWT**, así que hay que simular la sesión o la prueba falla aunque todo esté bien:

```sql
begin;
  select public.rpc_economy_market_tick();          -- mueve 15 precios (service_role)

  select set_config('request.jwt.claims',
    json_build_object('sub', (select id from auth.users limit 1),
                      'role','authenticated')::text, true);
  set local role authenticated;

  select public.rpc_purchase_shop_item('GBA_MT26', 1);
  select public.rpc_valdr_dispatch_vault_item(
    (select id from public.valdr_vault order by created_at desc limit 1));
  select status, dispatched_at is not null as tiene_fecha
  from public.valdr_vault order by created_at desc limit 1;
rollback;
```

Esperado: compra `success:true`, y `status = 'dispatched_to_save'` con fecha.

> Ojo: no metas el `status_after` como subconsulta del mismo `SELECT` que llama a la
> función. Postgres no garantiza el orden de evaluación dentro del target list y puedes
> leer el estado **antes** del despacho.

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
| `src/lib/hqNav.tsx` | Ítem "Bazar", convive con "Pendientes" y "Día Cero" (sin conflicto) |
| `src/components/layout/CentralViewContainer.tsx` | **Eliminado**: código muerto, sin referencias |
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

1. ~~**Verificar `/hq/tienda` con sesión iniciada.**~~ — **hecho**: se validó la ruta con la sesión existente (sin re-loguear, así no se cerró la del usuario). HUD ₽999.999 / deuda al día / 100 %, Catálogo, Oráculo y SALDO coinciden. Sin errores de consola.
2. **Probar el flujo completo con el emulador abierto:** compra → Bóveda → "Enviar" → `CONTINUAR` en el juego. Requiere `window.__SYNDEX_GBA_READY__ === true`. **El lado servidor ya está verificado** (compra → fila en Bóveda → despacho → `dispatched_to_save`, con rollback).
3. ~~**Decidir sobre `CentralViewContainer.tsx`**~~ — **hecho**: eliminado, no tenía referencias.
4. ~~**Confirmar el ítem "Bazar" en `hqNav.tsx`**~~ — **hecho**: Bazar, Pendientes y Día Cero conviven en el commit `254a3b0`.
5. ~~**Versionar `rpc_valdr_dispatch_vault_item`**~~ — **hecho**: `20261029_valdr_dispatch_vault_item.sql`, aplicada y verificada (ver §1.6).
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
- **Circuito económico verificado contra producción** (transacción con `rollback`, sin dejar rastro):
  `market_tick` → `purchase_shop_item('GBA_MT26')` debita 1.800 ₽ → fila en `valdr_vault` → `rpc_valdr_dispatch_vault_item` → `dispatched_to_save` con fecha. Un segundo despacho del mismo ítem **lanza excepción** (correcto).
- Precios en producción: **147** filas (no 128). Trigger de protección presente. `valdr_vault` solo tiene política `SELECT`.

---

## 9. Correcciones posteriores al traspaso

Tres defectos encontrados al verificar `/hq/tienda` de verdad:

1. **Oráculo mutilado.** Gemini 2.5 Flash gastaba los 120 tokens de presupuesto en *thinking* y devolvía textos de 4 caracteres (`"¡Sal"`, `"Joven viajero,"`). Estaban cacheados así en `economy_oracle_cache`.
   - `thinkingConfig: { thinkingBudget: 0 }` + `maxOutputTokens: 300`.
   - Si `finishReason === 'MAX_TOKENS'`, se descarta y cae al texto determinista.
   - `cacheKey` pasó a `v2:…` y se borraron las entradas truncadas (`length(text) < 20`).
2. **HUD con ceros falsos.** Mientras `rpc_economy_state` no respondía, el HUD mostraba `WALLET ₽0 · DEUDA ₽0 · DRATINI 0%` — indistinguible de "estás en bancarrota". Ahora muestra `—` / "cargando" hasta que hay snapshot.
3. **SALDO desincronizado en ese instante.** `GoldenrodShop` cae a `profile.pokedollars` (persistido) cuando no hay snapshot, así que por un segundo podía mostrar un saldo viejo. Se acepta como respaldo visual, pero conviene revisarlo si se nota.
