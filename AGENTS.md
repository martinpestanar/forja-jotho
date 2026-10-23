<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


<!-- BEGIN:nintendo-visual-ui-rule -->
# REGLA MAESTRA DE DISEÑO: Nintendo Visual UI & Dopamine Design System

Actúa bajo el estándar obligatorio de diseño: **"Nintendo Visual UI & Dopamine Design System"**. En todas las fases de este proyecto, queda estrictamente prohibido generar paredes de texto o interfaces aburridas tipo blog. Aplica siempre estas reglas en cada componente:

## 1. Política Cero Bloques de Texto
- Prohibido mostrar párrafos de más de 2 líneas.
- Toda explicación debe sustituirse por:
  - Diagramas de cartas visuales con iconos.
  - Barras de vida/energía elásticas.
  - Insignias de estado pixel-art.
  - Números rodantes o contadores visuales.
- Las intervenciones de la IA o personajes deben ir en un cuadro de diálogo clásico de RPG de Nintendo de máximo 2 oraciones cortas con efecto teletipo (*typewriter*) y sonido retro.

## 2. Estándar de Doble Tema Nintendo (Light & Dark)
- **Modo Light (Game Boy Color / Pokédex Clásica):**
  - Fondo marfil/crema retro (`#F4F1EA`).
  - Bordes biselados con sombras duras negras estilo neo-arcade (`shadow-[4px_4px_0px_0px_#000]`).
  - Botones táctiles rojo Nintendo (`#E60012`) y azul zafiro (`#2563EB`) que se hunden físicamente al hacer clic (`active:translate-x-1 active:translate-y-1 active:shadow-none`).
- **Modo Dark (Game Boy Advance SP / Cyber-Johto):**
  - Fondo grafito oscuro (`#121214`).
  - Bordes con sutil brillo neón.
  - Acentos verde Game Boy (`#22C55E`), cian (`#06B6D4`) y oro de Johto (`#F59E0B`).

## 3. Micro-interacciones Dopamínicas Obligatorias
- **Framer Motion:** Rebotes de botones, barras de progreso elásticas y sacudida de pantalla (*screen shake*) en fallos o ataques.
- **Canvas-Confetti:** Disparar lluvia de estrellas doradas y confeti en cada victoria, logro o entrega de misión.
- **Web Audio 8-bit:** Disparar efectos de audio retro sintetizados de 8-bits/16-bits para clics de menú, monedas recolectadas y fanfarrias de nivel superado (`soundFx`).
- **Feedback Numérico Flotante:** Cada vez que se sume XP o Pokédólares, mostrar números flotantes animados verdes o dorados (ej. `+25 💰`, `+15m 🔋`) que suben y se desvanecen hacia la barra superior.
<!-- END:nintendo-visual-ui-rule -->
