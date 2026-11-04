# REGLA MAESTRA DE DISEÑO: SynDex Editorial Retro-Premium (Audiencia Adulta)

Actúa bajo el estándar obligatorio de diseño: **"SynDex Editorial Retro-Premium"** (definido en `.agents/skills/johto-arcade-design-system/SKILL.md`). En todas las fases de este proyecto, queda estrictamente prohibido generar interfaces infantiles estilo cómic con bordes negros toscos o tableros aburridos de oficina/SaaS.

## 1. Audiencia Objetivo & Dirección Visual
- **Audiencia:** Adultos de 24 a 38 años (disciplina, deporte, foco, emprendimiento y nostalgia sobria de Pokémon Johto).
- **Inspiración:** Diseño industrial de hardware retro-moderno (*Analogue Pocket*, *Teenage Engineering*, *Braun*).
- **Línea Gráfica:** Elegante, minimalista, con toques de pixel-art coleccionable y datos en tipografía monoespaciada técnica.

## 2. Acabados y Superficies
- **Light Mode Obligatorio:** Fondo marfil mate cálido (`#FAF9F5`), tarjetas blanco puro (`#FFFFFF`). Cero dark mode deprimente.
- **Bordes Finos de Precisión:** `border border-[#E4E1D8]` (1px nítido). **TERMINANTEMENTE PROHIBIDO usar bordes negros gruesos estilo historieta (`border-2 border-black` o `shadow-[4px_4px_0px_#000]`).**
- **Elevación Física Suave:** `shadow-[0_2px_8px_rgba(26,25,21,0.04)]` o reborde sutil `shadow-[0_2px_0px_#DCD8CD]`.

## 3. Paleta de Color "Johto Heritage"
- **Tinta:** Carbón cálido profundo (`#1C1B18`) para títulos y números; gris cálido (`#706E66`) para subtítulos.
- **Rojo Ho-Oh Editorial:** `#D9383A` (botones primarios y vigor físico).
- **Oro Campana Clara:** `#C59B46` (disciplina y rachas).
- **Azul Zafiro Lugia:** `#2D68C4` (batería de emulador y sesiones de foco mental).
- **Verde Pueblo Primavera:** `#2E8555` (hábitos completados).

## 4. Contraste & Ergonomía Mobile-First
- **Prohibido texto blanco sobre fondos claros.**
- **Viewport Centrado en Desktop:** La experiencia se visualiza como un dispositivo móvil moderno y centrado (máx. 440px de ancho) con respiración exterior.
- **Cero Jerga Corporativa:** Desterrar menús de oficina o paneles de empresa en la experiencia del usuario. La app es para hábitos personales, tu Pokémon y tu tiempo de emulador.
