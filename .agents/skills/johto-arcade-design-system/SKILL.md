---
name: johto-arcade-design-system
description: Sistema maestro de diseño UI/UX Retro-Premium & Alto Rendimiento para SynDex. Inspirado en Analogue Pocket, Teenage Engineering y la mística sobria de Pokémon Johto (Oro/Plata/Cristal). Diseñado específicamente para adultos (24-38 años).
---

# SynDex: Sistema de Diseño "Editorial Retro-Premium Johto" (Adult Audience Specification)

Esta especificación sustituye cualquier directriz infantil o cómic arcade previa. Es la **única fuente de verdad** para la interfaz, experiencia de usuario (UX), componentes y micro-animaciones de **SynDex**.

---

## 1. El Usuario y la Propuesta de Valor

- **Público Objetivo Real:** Adultos de **24 a 38 años** (profesionales, programadores, emprendedores, deportistas).
- **Su Psicología:** Buscan disciplina, enfoque y orden en su vida real. Valoran la estética de diseño industrial minimalista (como *Analogue Pocket*, *Teenage Engineering* o *Braun*). Les apasiona Pokémon por nostalgia pura y madura, no por caricaturas.
- **Regla de Oro:** La app debe lucir tan sobria y bien diseñada que el usuario no sienta vergüenza de tenerla abierta en su laptop en el trabajo o en su móvil en el gimnasio. Cero bordes gruesos de historieta, cero tipografías de payaso, cero colores chillones.

---

## 2. Principios de Diseño: "Industrial Retro-Minimalist"

1. **Light Mode Puro & Cálido (Acabado Hardware Analogue):**
   - **Fondo General:** Pergamino marfil mate ultra-limpio (`#FAF9F5` o `#F7F5F0`).
   - **Superficies de Tarjetas:** Blanco puro satinado (`#FFFFFF`).
   - **Bordes:** Finos, de precisión milimétrica: `border border-[#E4E1D8]` (1px nítido). Quedan **estrictamente prohibidos los bordes negros de 2px o 3px estilo caricatura**.
   - **Sombras:** Sombras táctiles sutiles y elegantes: `shadow-[0_2px_8px_rgba(26,25,21,0.04),0_1px_2px_rgba(26,25,21,0.06)]` o elevación física fina `shadow-[0_2px_0px_#DCD8CD]`.

2. **Tipografía & Jerarquía Editorial:**
   - **Textos & Títulos:** Sans-serif moderna y limpia (`Inter` o `Geist`) con espaciado ajustado (`tracking-tight`).
   - **Datos Técnicos & Tiempo:** Monoespaciado técnico sobrio (`font-mono`) para batería (`45m`, `120m`), días de racha y Pokédólares, emulando instrumentos de precisión analógicos.

3. **Paleta de Color: "Johto Heritage" (Madura y Equilibrada):**
   - **Tinta Principal:** Carbón cálido profundo (`#1C1B18`) para lectura sin fatiga.
   - **Texto Secundario:** Gris piedra cálido (`#706E66`).
   - **Rojo Ho-Oh Editorial (`#D9383A`):** Reservado únicamente para acciones principales y vigor físico.
   - **Oro Campana Clara (`#C59B46`):** Para disciplina, rachas y logros conseguidos.
   - **Azul Zafiro Lugia (`#2D68C4`):** Para batería de emulador y sesiones de foco mental.
   - **Verde Pueblo Primavera (`#2E8555`):** Para hábitos sellados y salud.

4. **Ergonomía Mobile-First & Formato Foco:**
   - En pantallas grandes o escritorios, la app **se proyecta como un viewport móvil elegante y centrado** (máximo 440px de ancho) con respiración alrededor, simulando un dispositivo de hardware portátil de lujo.
   - Cero dashboards de oficina llenos de 15 módulos corporativos. Toda la navegación gira en torno a:
     1. **Hoy (Misiones de Disciplina)**
     2. **Compañero & Batería (Estado y Energía)**
     3. **Cartucho GBA (El Premio)**
     4. **Ajustes**

5. **Micro-interacciones y Feedback Físico:**
   - **Hundimiento de Precisión:** Micro-presión física en botones: `active:scale-[0.98] transition-transform duration-75`.
   - **Audio Analógico Sutil:** Clics y campanadas retro sintetizadas breves, nunca fanfarrias estridentes e interminables.
   - **Contraste Inviolable:** Jamás colocar texto blanco sobre fondos claros. Todo texto blanco vive sobre pastillas sólidas de color saturado o carbón profundo.

---

## 3. Especificación de Componentes

### A. Tarjeta de Hábito (`HabitCard`)
```tsx
// Tarjeta moderna y limpia estilo hardware
className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#D5D1C5] transition-all flex items-center justify-between gap-3"
```
- Icono en caja suave con tinte temático sutil (no brillante).
- Título nítido en peso `font-semibold text-sm text-[#1C1B18]`.
- Subtítulo de duración o foco en `font-mono text-xs text-[#706E66]`.
- Botón de sellado táctil: Píldora sobria con micro-interacción de éxito.

### B. Widget del Compañero Pokémon (`CompanionWidget`)
- Presentado como un marco de arte digital o medidor de laboratorio.
- Sprite pixel-art oficial de Johto a escala perfecta y nítida (`image-rendering: pixelated`).
- Indicador de estado sobrio: no frases infantiles exageradas, sino un estado de conexión claro:
  - *"Cyndaquil · Nivel 14 · Energía al 80%"*
- Barra de batería técnica que muestra claramente cuántos minutos de juego tienes disponibles hoy para el emulador.

### C. Botón Primario de Acción
```tsx
// Botón elegante, no tosco
className="bg-[#D9383A] text-white font-semibold text-xs tracking-wider uppercase py-3 px-5 rounded-xl shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
```

---

## 4. Anti-Patrones Estrictos (Lo que queda TERMINANTEMENTE PROHIBIDO)

- ❌ **Prohibido estilo cómic infantil:** Cero bordes negros de 2px o 3px (`border-2 border-black` o `shadow-[4px_4px_0px_0px_#000]`).
- ❌ **Prohibido Dark Mode:** La app vive en Light Mode pergamino natural `#FAF9F5`.
- ❌ **Prohibido paneles de SaaS corporativo en la app:** Eliminar barras laterales gigantes de oficina o tablas de tareas grises aburridas.
- ❌ **Prohibido textos con poco contraste:** Textos en gris pálido o blancos sobre fondo claro.
- ❌ **Prohibido modales saturados:** Formularios limpios, de máximo 3 campos esenciales.
