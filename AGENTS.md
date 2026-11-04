<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


<!-- BEGIN:nintendo-visual-ui-rule -->
# REGLA MAESTRA DE DISEÑO: SynDex Editorial Retro-Premium (Audiencia Adulta)

Actúa bajo el estándar obligatorio de diseño: **"SynDex Editorial Retro-Premium"** (definido en detalle en `.agents/skills/johto-arcade-design-system/SKILL.md`). En todas las fases de este proyecto, queda estrictamente prohibido generar interfaces infantiles tipo cómic con bordes negros toscos o tableros aburridos de oficina corporativa. Aplica siempre estas reglas:

## 1. Audiencia Objetivo & Tono Visual
- **Público:** Adultos de **24 a 38 años** que entrenan, leen, trabajan y buscan disciplina real. Valoran la nostalgia sobria de Pokémon Johto (Oro/Plata/Cristal).
- **Inspiración:** Diseño industrial de hardware minimalista (*Analogue Pocket*, *Teenage Engineering*).
- **Sensación:** Un dispositivo portátil de alta gama en tu mano, no un juego para niños de 10 años.

## 2. Acabados, Bordes y Superficies
- **Light Mode Obligatorio:** Fondo marfil cálido (`#FAF9F5`), tarjetas blanco puro (`#FFFFFF`). Cero fondos oscuros o apagados.
- **Bordes Finos de Precisión (1px):** `border border-[#E4E1D8]`. **TERMINANTEMENTE PROHIBIDO usar bordes negros gruesos de historieta (`border-2 border-black` o `shadow-[3px_3px_0px_#1A1915]`).**
- **Elevación Suave:** `shadow-[0_2px_8px_rgba(26,25,21,0.04)]` o reborde sutil `shadow-[0_2px_0px_#DCD8CD]`.

## 3. Paleta de Color "Johto Heritage"
- **Tinta:** Carbón cálido profundo (`#1C1B18`) y gris cálido (`#706E66`).
- **Rojo Ho-Oh Editorial:** `#D9383A` (botones de acción principal y vigor).
- **Oro Campana Clara:** `#C59B46` (disciplina y rachas).
- **Azul Zafiro Lugia:** `#2D68C4` (batería de juego y foco mental).
- **Verde Pueblo Primavera:** `#2E8555` (hábitos completados).

## 4. Ergonomía Mobile-First & Cero Fricción
- **Mobile-First Real:** En pantallas grandes, la app vive centrada en un marco de teléfono elegante (máximo 440px de ancho).
- **Cero Jerga de Oficina:** Nada de dashboards corporativos con paneles laterales densos; solo tus hábitos de vida, tu Pokémon acompañante y tu cartucho de GBA.
- **Contraste Seguro:** Jamás colocar texto blanco sobre fondos claros.
<!-- END:nintendo-visual-ui-rule -->


<!-- BEGIN:syndex-financial-intelligence -->
# REGLA MAESTRA FINANCIERA: Modo Difícil, Escasez Real y Cero Legendarios a la Venta

Actúa bajo el estándar obligatorio: **"Syndex Financial Intelligence"** (definido en `.agents/skills/syndex-financial-intelligence/SKILL.md`). Queda estrictamente prohibido generar interfaces o códigos que abaraten la experiencia o regalen progreso:

1. **PROHIBICIÓN ABSOLUTA DE VENDER POKÉMON LEGENDARIOS O MÍTICOS:** Mew, Celebi, Lugia, Ho-Oh, Suicune, Raikou, Entei, Rayquaza, etc., **NUNCA se compran ni venden en tiendas o bazares**. Se capturan con mérito exclusivo en la historia de la ROM.
2. **Precios Caros de Escasez Real:** Nada de ítems a ₽30 o ₽50. Los suministros reflejan la economía oficial (Poción ₽300, Poké Balls ₽1,000) y las MTs/Crianza cuestan entre ₽3,000 y ₽15,000. La meta cumbre (Dratini/Larvitar) cuesta ₽40,000-₽50,000 y requiere meses de ahorro y operaciones en la Bolsa de Trigal.
3. **El Servidor SIEMPRE Manda:** Cero transacciones con precios inventados en el front-end. Toda deducción y compra pasa por las RPCs de Supabase (`rpc_purchase_shop_item`, `rpc_valdr_dispatch_vault_item`, `rpc_valdr_buy_market_item`).
<!-- END:syndex-financial-intelligence -->

<!-- BEGIN:syndex-mcp-connections -->
# CONEXIONES MCP SIEMPRE DISPONIBLES (Supabase / GitHub / n8n)

Este proyecto tiene 3 MCPs conectados que se cargan automáticamente en cada sesión. **Antes de improvisar soluciones manuales, verifica si un MCP resuelve la tarea:**

- **`supabase`** → BD de producción REAL (SQL directo, esquema, RPCs, storage, logs). REGLA CRÍTICA: las migraciones en `supabase/migrations/` NO garantizan que existan en producción (histórico de divergencias: `rpc_grant_activity_reward`, `missions_progress`, tablas `valdr_*`). Antes de asumir que algo existe o no existe en la BD, VERIFÍCALO contra producción con este MCP.
- **`github`** → issues, PRs, commits y búsqueda de código del repo remoto.
- **`n8n-mcp`** → nodos y plantillas para automatizaciones de la agencia (n8n.koratflow.agency).

### Operaciones Git / Push Remoto
El token de autenticación de GitHub vive en la variable de entorno del sistema `$env:GITHUB_PERSONAL_ACCESS_TOKEN` (o `$env:GITHUB_TOKEN`).
**REGLA OBLIGATORIA:** Al hacer `git push` o interactuar con el repo remoto `origin`, NUNCA pedir credenciales ni esperar en un prompt interactivo. Ejecuta siempre el comando autenticado automáticamente:
`git push https://$($env:GITHUB_PERSONAL_ACCESS_TOKEN)@github.com/martinpestanar/forja-jotho.git <rama>` y luego sincroniza con `git fetch origin`.

Guía completa, diagnóstico y reglas de secretos: skill `syndex-mcp-connection`. Si un MCP no aparece en tu catálogo de tools, esa skill explica cómo arreglarlo (variables de entorno de usuario vía `setx`, nunca tokens crudos en `opencode.json` porque es git-tracked).

<!-- END:syndex-mcp-connections -->
