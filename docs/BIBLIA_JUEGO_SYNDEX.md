# 📜 BIBLIA DE DISEÑO Y GAME DESIGN: SYNDEX (FORJA JOHTO)
> **Versión:** 1.0 (Aprobada por Martín)  
> **Concepto:** App de Disciplina y Desarrollo Personal Gamificada mediante HackROM de Pokémon Heart & Soul (Base Emerald BPEE).  
> **Objetivo:** Convertir el progreso de la vida real (Mente, Cuerpo, Conciencia, Finanzas) en el motor de juego en el emulador, eliminando la culpa del gamer y fomentando hábitos sólidos.

---

## 🏛️ 1. LOS 4 PILARES MAESTROS DE DESARROLLO (ESTÁTICOS)

Las 4 áreas son sagradas e inamovibles. Dentro de cada una, el usuario elige o personaliza sus hábitos y compromisos durante el onboarding (estilo Duolingo):

```
         ┌─────────────────── SYNDEX ───────────────────┐
         │                                              │
    [💪 CUERPO]        [🧠 MENTE]      [🧘 CONCIENCIA]   [💰 DINERO]
   Fuerza / Salud    Estudio / Foco    Espíritu / Paz   Negocio / Acción
```

### 1.1. 💪 Pilar CUERPO (Salud, Energía y Vitalidad)
- **Ejemplos preestablecidos:**
  - Gym / Entrenamiento con pesas (45m - 1h30m).
  - Correr / Cardio / Deportes.
  - Alimentación limpia / Hidratación (2L+ agua).
  - Dormir 7-8 horas (sin pantallas antes de acostarse).
- **Recompensa dentro del juego:**
  - Vitaminas físicas (**Proteína** para Ataque, **Hierro** para Defensa, **Carburante** para Velocidad).
  - Pociones, Revivir, Bayas curativas (Sitrus, Lum).
  - EVs directos de estadísticas físicas.

### 1.2. 🧠 Pilar MENTE (Intelecto, Enfoque y Aprendizaje)
- **Ejemplos preestablecidos:**
  - Estudio de tema técnico o profesional (1h - 2h).
  - Lectura de libros (30m - 1h).
  - Práctica deliberada / Aprender idiomas.
- **Recompensa dentro del juego:**
  - **Calcio** (Ataque Especial), **Zinc** (Defensa Especial), **Más PP** / **Más PS**.
  - **Caramelos Raros (*Rare Candies*)** para subir de nivel sin grindear.
  - Máquinas Técnicas (MTs) de ataques estratégicos y de estado.

### 1.3. 🧘 Pilar CONCIENCIA / ESPIRITUALIDAD (Paz Mental, Claridad y Presencia)
- **Ejemplos preestablecidos:**
  - Meditación / Respiración consciente (10m - 20m).
  - Gratitud / Journaling / Diario personal.
  - Paseo en la naturaleza sin teléfono.
  - Oración / Práctica reflexiva / Desconexión digital.
- **Recompensa dentro del juego:**
  - **Felicidad de Pokémon al máximo** (clave para evoluciones por afecto: Eevee a Espeon/Umbreon, Togepi a Togetic, Lucario, Golbat a Crobat).
  - Campana Alivio (*Soothe Bell*).
  - Bayas raras reductoras de EVs negativos o purificadoras.
  - Cinturón Firme / Pañuelo Seda.

### 1.4. 💰 Pilar DINERO & NEGOCIOS (Acción, Ventas y Ejecución)
- **Ejemplos preestablecidos:**
  - Prospección comercial / Llamadas de ventas / Mensajes a leads.
  - Facturación, finanzas y control de presupuesto.
  - Creación y publicación de contenido de valor (TikTok/Reels/YouTube).
  - Entrega de proyectos a clientes.
- **Recompensa dentro del juego:**
  - **Pokédólares en el juego ($)** y Moneda del Bazar.
  - Moneda Amuleto (*Amulet Coin* / duplica ganancias de batallas).
  - Pepitas de oro (*Nuggets*), Perlas y Rocas del Rey para vender en las Tiendas Pokémon.

---

## 🎁 2. SISTEMA DE BOTÍN DINÁMICO (Cerebro en Supabase)

El botín diario **NO ES PLANO NI IGUAL PARA TODOS**. Se calcula en base a:
1. **El nivel de compromiso inicial (Onboarding):**
   - A cuántos días te comprometiste por cada hábito (ej: Gym 4 días/semana vs 6 días/semana).
   - El tiempo invertido configurado (ej: Estudiar 1 hora diaria otorga botín base; 2 horas otorga cofre enriquecido).
2. **Sistema Anti-Trampa (Verificación Opcional):**
   - Para hábitos críticos que el usuario elija con *"Candado de Verificación"*, el sistema pide una prueba activa:
     - Un enlace URL (ej: link al video publicado, commit de GitHub, documento Notion).
     - O una nota de reflexión de 2 líneas (ej: *"¿Qué aprendiste hoy en tu hora de estudio?"*).
   - No es solo marcar un checkbox; requiere interacción real.

---

## 🔋 3. MOTOR DE BATERÍA DE TIEMPO (POKÉMON TIME ENGINE)

### 3.1. Reglas de Batería entre Semana (Lunes a Jueves):
- **1 hora base gratis** todos los días para todos los usuarios.
- Conforme cumples tus hábitos en el transcurso del día, desbloqueas minutos adicionales de juego.
- **Tope diario máximo:** **2 horas** de juego al día (si completas el 100% de tus compromisos).
- **Banco de Tiempo Acumulable:** Si juegas menos de tu tiempo disponible (ej: ganaste 2h pero solo jugaste 30m), los **90 minutos sobrantes se van al Banco**.

### 3.2. Fines de Semana (Viernes, Sábado y Domingo):
- El tope diario sube a **3 horas al día**.
- **Liberación del Banco:** Los minutos que ahorraste entre semana los puedes usar libremente en fin de semana para maratones de juego sin culpa.

### 3.3. Configuración Flexible de Calendario:
- Cada hábito permite elegir sus días activos (ej: Lunes a Viernes, solo Fines de Semana, o días específicos L/M/V).

---

## ⚔️ 4. LÍDERES DE GIMNASIO: LOS JEFES SEMANALES

- Los líderes de gimnasio en el HackROM están diseñados con IA avanzada y equipos competitivos de alto nivel.
- **Acceso:** Puedes retar al líder de gimnasio.
- **Regla de Derrota Cruel:**
  - Si entras al gimnasio y **pierdes el combate**, se te bloquea el reintento.
  - **No podrás volver a retarlo hasta el fin de semana**, y **SOLO SI** completaste tu primera **Racha de 7 días continuos** de tus 4 pilares en la app.
  - Esto le da un valor épico y de tensión máxima a cada combate de gimnasio.

---

## 💀 5. ECONOMÍA DE COSTES FIJOS Y PENALIZACIÓN POR FALTA

- En este sistema, **el dinero es escaso y vital**:
  - Hay **gastos fijos del entrenador** (mantenimiento de almacenamiento en PC Box, suscripciones a servicios, alimentos/bazar).
- **Penalización por romper rachas:**
  - Si abandonas un hábito o rompes tu racha sin justificación previa, el sistema te **descuenta Pokédólares** de tu cuenta.
  - Si tu saldo cae a cero o en negativo, caes en **bancarrota de entrenador** (se congelan beneficios y acceso a la tienda del juego hasta que pagues tu deuda con hábitos cumplidos).

---

## 🔐 6. SEPARACIÓN DE ROLES: MODO ENTRENADOR VS MODO ADMIN

```
┌────────────────────────────────────────────────────────┐
│                      SYNDEX OS                         │
├──────────────────────────┬─────────────────────────────┤
│   🎮 MODO ENTRENADOR     │    👔 MODO ADMIN (HQ)       │
│      (Público General)   │       (Solo Martín)         │
├──────────────────────────┼─────────────────────────────┤
│ • Onboarding 4 Pilares   │ • Módulo CEO / CTO / CMO    │
│ • Check de Hábitos       │ • Clientes de Agencia       │
│ • Batería de Tiempo      │ • n8n Automatizaciones      │
│ • Emulador Pokémon       │ • Nilah AI & Farmacia       │
│ • Botín & Tienda Ítems   │ • Facturación Real          │
└──────────────────────────┴─────────────────────────────┘
```

---

## 🗺️ 7. ROADMAP DE IMPLEMENTACIÓN

1. **Fase 1 (Documentada y Aprobada):** Arquitectura y reglas de la biblia (este documento).
2. **Fase 2:** Onboarding interactivo estilo Duolingo con los 4 Pilares y configuración de días/tiempos.
3. **Fase 3:** Sistema de cálculo de botín dinámico en Supabase (`rpc_calculate_daily_loot`).
4. **Fase 4:** Lógica de bloqueo/reintento semanal de gimnasios y penalización financiera por racha rota.
5. **Fase 5:** Enmascarar la barra de navegación para que el público solo vea el "Modo Entrenador" y tú accedas al HQ mediante login de Admin.
