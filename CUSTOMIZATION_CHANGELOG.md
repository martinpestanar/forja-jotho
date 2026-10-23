# 📜 SynDex: Bitácora Maestra de Personalización & Modding de la ROM (pokemonHnS)

> **Documento Vivo (SSOT):** Registro histórico inmutable de modificaciones binarias, mecánicas de juego, balance pedagógico e integraciones con la plataforma web de SynDex.  
> **Última Actualización:** 18 de Octubre, 2026.  
> **ROM Base:** `pokemonHnS.gba` (33,554,432 bytes / 32 MB - Engine BPEE Emerald / Heart & Soul).  
> **Respaldo Limpio:** `public/roms/pokemonHnS.clean.gba`.

---

## 🏛️ 1. Mapeo de Memoria Binaria & Áreas Utilizadas

| Sección | Offset ROM | Tamaño | Estado / Uso |
| :--- | :--- | :--- | :--- |
| **Header GBA** | `0x00000000` | 192 B | `POKEMON EMER` (BPEE) |
| **Tabla `gTrainers`** | `0x0073C278` | 864 entradas * 40 B | Punteros y flags de líderes y entrenadores modificados |
| **Tabla `gSpeciesNames`** | `0x00744798` | 11 B por nombre | Expansión Gen 4 integrada (Togekiss=446, Yanmega=448, etc.) |
| **Tabla `gMoveNames`** | `0x00745B74` | 13 B por nombre | Movimientos Gen 3/4 |
| **Tabla `gItems`** | `0x008FE9C0` | 44 B por ítem | Precios y hold items |
| **Tablas Salvajes (`gWildMonHeaders`)** | `0x00D3BD90` | 577 headers | Tablas de arbustos (hierba alta) |
| **Espacio Libre para Inyecciones** | `0x01580000` - `0x02000000` | **10.54 MB** | **4.03 KB utilizados** para los equipos de líderes, revanchas y 7 fases del Rival |

---

## ⚔️ 2. Líderes de Gimnasio Rebalanceados (6 Pokémon Evolucionados c/u)

Todos los combates de medalla ahora cuentan con **6 Pokémon obligatorios**, movimientos con cobertura, objetos tácticos equipados y banderas de **IA Competitiva** activadas (`partyFlags = 3`, `partySize = 6`, `aiFlags = 0x07`).

### A. Región de Johto (Nivel 15 - 56)
1. **Falkner (Malvalona - Volador | Nv. 15-16):**
   - *Equipo:* Pidgeotto (Nv. 15), Swellow (Nv. 15), Pelipper (Nv. 15), Noctowl (Nv. 15), Fearow (Nv. 15), **Togekiss** (Nv. 16 - As con *Baya Zidra*).
   - *Táctica:* Cobertura contra tipo Roca/Eléctrico con Bofetón Lodo y Pistola Agua.
2. **Bugsy (Azalea - Bicho | Nv. 21-23):**
   - *Equipo:* Butterfree (Nv. 21), Beedrill (Nv. 21), Ninjask (Nv. 21), Armaldo (Nv. 22), Scyther (Nv. 22 con *Polvo Plata*), **Yanmega** (Nv. 23 - As con *Baya Zidra*).
3. **Whitney (Trigal - Normal | Nv. 27-29):**
   - *Equipo:* Clefable (Nv. 27), Wigglytuff (Nv. 27), Exploud (Nv. 27), Zangoose (Nv. 28), Ambipom (Nv. 28), **Miltank** (Nv. 29 - As con *Baya Lum*).
   - *Táctica:* Desenrollar, Batido, Atracción y cura de problemas de estado.
4. **Morty (Iris - Fantasma | Nv. 33-35):**
   - *Equipo:* Haunter (Nv. 33), Sableye (Nv. 33), Banette (Nv. 33), Dusclops (Nv. 34), Mismagius (Nv. 34 con *Hechizo*), **Gengar** (Nv. 35 - As con *Baya Zidra*).
5. **Chuck (Orquídea - Lucha | Nv. 39-41):**
   - *Equipo:* Primeape (Nv. 39), Hitmonlee (Nv. 39), Hitmonchan (Nv. 39), Hariyama (Nv. 40), Breloom (Nv. 40), **Poliwrath** (Nv. 41 - As con *Cinturón Negro*).
6. **Jasmine (Olivo - Acero | Nv. 44-46):**
   - *Equipo:* Skarmory (Nv. 44), Aggron (Nv. 44), Metang (Nv. 44), Magnezone (Nv. 45 con *Imán*), Scizor (Nv. 45), **Steelix** (Nv. 46 - As con *Restos*).
7. **Pryce (Caoba - Hielo | Nv. 49-51):**
   - *Equipo:* Dewgong (Nv. 49), Glalie (Nv. 49), Walrein (Nv. 49), Froslass (Nv. 50), Weavile (Nv. 50 con *Garra Rápida*), **Mamoswine** (Nv. 51 - As con *Antiderretir*).
8. **Clair (Endrino - Dragón | Nv. 54-56):**
   - *Equipo:* Dragonair (Nv. 54), Gyarados (Nv. 54), Altaria (Nv. 54), Flygon (Nv. 55), Salamence (Nv. 55 con *Colmillo Dragón*), **Kingdra** (Nv. 56 - As con *Baya Zidra*).

---

### B. Liga Pokémon & Campeón (Nivel 58 - 68)
- **Will (Psíquico | Nv. 58-60):** Xatu, Jynx, Slowbro, Exeggutor, Gardevoir, **Gallade** (As).
- **Koga (Veneno | Nv. 60-62):** Ariados, Muk, Forretress, Swalot, Roserade, **Crobat** (As).
- **Bruno (Lucha | Nv. 62-64):** Hitmonlee, Hitmonchan, Hitmontop, Hariyama, Medicham, **Machamp** (As).
- **Karen (Siniestro | Nv. 64-66):** Umbreon, Vileplume, Absol, Shiftry, Honchkrow, **Houndoom** (As).
- **Lance (Campeón | Nv. 66-68):** Gyarados, Charizard, Aerodactyl, Altaria, Salamence, **Dragonite** (As).

---

### C. Región de Kanto & Monte Plateado (Nivel 69 - 88)
- **Brock (Nv. 69-71):** Golem, Steelix, Relicanth, Armaldo, Rhyperior, Tyranitar.
- **Misty (Nv. 70-72):** Golduck, Quagsire, Lapras, Ludicolo, Milotic, Starmie (Restos).
- **Lt. Surge (Nv. 71-73):** Raichu, Magneton, Electrode, Manectric, Magnezone, Electivire (Imán).
- **Erika (Nv. 72-74):** Bellossom, Victreebel, Shiftry, Cradily, Tangrowth, Roserade.
- **Janine (Nv. 73-75):** Ariados, Weezing, Seviper, Roserade, Muk, Crobat.
- **Sabrina (Nv. 74-76):** Mr. Mime, Espeon, Claydol, Metagross, Gallade, Alakazam.
- **Blaine (Nv. 75-77):** Ninetales, Rapidash, Torkoal, Camerupt, Houndoom, Magmortar.
- **Blue (Nv. 77-79):** Pidgeot, Alakazam, Rhyperior, Gyarados, Arcanine, Tyranitar.
- **RED (Mt. Plateado | Nv. 85-88):**
  - **Pikachu** (Nv. 88 con *Bola Luminosa*)
  - **Lapras** (Nv. 86 con *Restos*)
  - **Snorlax** (Nv. 86 con *Restos*)
  - **Venusaur** (Nv. 86 con *Semilla Milagro*)
  - **Blastoise** (Nv. 86 con *Agua Mística*)
  - **Charizard** (Nv. 87 con *Carbón*)

---

## 🌿 3. Hierba Alta Dinámica (XP Booster) y Rutas
1. **Arbustos Tempranos (Rutas 29–31):**
   - Se modificaron **73 tablas de encuentros salvajes** terrestres tempranas.
   - Rangos de nivel aumentados de Nv. 2–3 a **Nv. 6–12**.
   - Permite al alumno farmear experiencia rápidamente consumiendo minutos de batería para preparar su equipo antes de Falkner.
2. **Entrenadores de Ruta:**
   - 60 entrenadores escalados para eliminar combates triviales de un solo Pokémon de nivel 2.

---

## 🛒 4. Tiendas & Economía "Code-to-Play"
1. **Poké Marts en la ROM (Runtime):**
   - Ejecutado en `GbaConsoleWorker.tsx` vía `patchRomMartPrices(romBytes, 50)`.
   - Poké Balls a ₽10,000, Pociones a ₽15,000 (Hiperinflación x50).
2. **Tienda Web de Ciudad Trigal (`GoldenrodShop.tsx`):**
   - Catálogo balanceado en Pokédólares ganados resolviendo misiones de código y trivias.
   - Inyección directa a la mochila mediante `PokemonMemoryBridge.ts` con cifrado XOR (`0x00BC`).

---

## 🔒 5. Torre de Control SuperAdmin (`/admin`) & Mapa Realtime
1. **Control del Profesor:**
   - Botones `🔓 ABIERTO` / `🔒 CERRADO` en la pestaña "Gimnasios" de `/admin` para cada nivel (`lvl-1` a `lvl-8`).
   - Persistencia en Supabase: tabla `admin_game_rules`.
2. **Feedback RPG en el Mapa del Alumno (`JohtoMap.tsx`):**
   - Conectado por **Supabase Realtime**.
   - Si está cerrado: Candado activo y diálogo RPG: *"GIMNASIO CERRADO POR EL PROFESOR: Completa tus ejercicios de código para que el docente autorice el desafío."*
   - Si está abierto: Botón verde brillante **`⚔️ Desafiar Líder (6 Pokémon) (+15m 🔋)`**.

---

## 🛠️ 6. Scripts Automatizados Disponibles en el Repositorio

| Script | Ubicación | Función |
| :--- | :--- | :--- |
| **Master Patcher** | `scripts/patch_hackrom_master.js` | Inyecta líderes, E4, Kanto, Red, wild booster, rutas y bypass intro en `pokemonHnS.gba`. |
| **Validador Forense** | `scripts/audit_patched_rom.js` | Audita los 22 entrenadores clave comprobando punteros, niveles y movimientos. |
| **Auditor de Save** | `.agents/skills/pokeemerald-hns-bridge/scripts/auditSave.ts` | Valida integridad de archivos `.sav` y slots activos en Supabase. |

---

## 🚫 7. Bypass del Menú Inicial de Personalización (Oak/Elm Speech)
- **Motivo Pedagógico:** Evitar que los alumnos activen Randomizers (rompiendo la progresión) o Nuzlocke (frustración por muerte de Pokémon), garantizando una experiencia estándar, competitiva y limpia para toda la clase.
- **Implementación Binaria:** Offset `0x144920` repunteado de `0x08144b49` a `0x08144be1`.
- **Efecto Inmediato:** El alumno elige género (Chico/Chica), confirma, y el juego salta de inmediato a la pantalla de ingreso de nombre, eliminando los diálogos de dificultad y menús de desafíos.

---

## 💊 8. Filosofía de Pociones, Revivir y Combates Oficiales
- **En Rutas y Cuevas (Gestión de Recursos):** Pociones y Revivir son lujos escasos (tiendas de la ROM a ₽15,000). Los alumnos valoran intensamente cada poción regalada por resolver misiones en SynDex para explorar sin tener que volver al Centro Pokémon.
- **En Combates de Gimnasio y Liga (Desafío Táctico):** Prohibido el spam de curaciones desde la mochila para evitar el efecto *Pay-to-Win* por acumulación de pociones. La victoria frente al líder exige estrategia de tipos, coberturas y objetos sostenidos (*Baya Zidra*, *Restos*, *Baya Lum*).

---

## 🧠 9. Inteligencia Artificial Competitiva en Líderes y Jefes (`aiFlags = 0x07`)
- **Implementación Binaria:** Offset `0x1C` dentro de cada entrada de `gTrainers` (`0x73C278 + index * 40`).
- **Valor Inyectado:** `0x00000007` (u32 Little-Endian) en los **42 entrenadores clave** (8 Líderes de Johto + revanchas, Alto Mando, Campeón Lance, 8 Líderes de Kanto y Red).
- **Capas de IA Activadas en el Motor de Combate:**
  1. **`AI_CHECK_BAD_MOVE` (Bit 0 - 0x01):** Descarta movimientos sin efecto sobre el alumno (inmunidades de tipo, ataques de estado repetidos si el rival ya duerme/está paralizado).
  2. **`AI_TRY_TO_FAINT` (Bit 1 - 0x02):** Simula el cálculo de daño en tiempo real. Si detecta que un ataque puede noquear (*KO*) al Pokémon del alumno en ese turno, lo prioriza de inmediato.
  3. **`AI_CHECK_VIABILITY` (Bit 2 - 0x04):** Evalúa la efectividad elemental (Super-Eficaz x2 / x4 vs Poco Eficaz x0.5 / x0.25). Castiga debilidades elementales del alumno con ataques de cobertura.

---

## 🌪️ 10. Climas Temáticos en Gimnasios Clave
Para elevar la exigencia pedagógica sin generar picos injustos, cuatro líderes despliegan climas temáticos inmediatos que potencian las habilidades pasivas de sus equipos:

1. **Jasmine (Gimnasio 6 - Acero | Ciudad Olivo):**
   - *Clima:* **Tormenta de Arena (`SANDSTORM`, ID: 201)** activada por Skarmory en el Turno 1.
   - *Sinergia:* Todo el equipo de Jasmine (Skarmory, Aggron, Metang, Magnezone, Scizor, Steelix) es inmune al daño de arena, mientras que el alumno recibe daño residual continuo (-1/16 PS/turno) si no cuenta con tipos Acero, Roca o Tierra.
2. **Pryce (Gimnasio 7 - Hielo | Pueblo Caoba):**
   - *Clima:* **Granizo (`HAIL`, ID: 258)** activado por Dewgong en el Turno 1.
   - *Sinergia:* El equipo helado de Pryce desgasta al alumno turno a turno, haciendo que Blizzard/Ventisca de Mamoswine no falle.
3. **Clair (Gimnasio 8 - Dragón | Ciudad Endrino):**
   - *Clima:* **Danza Lluvia (`RAIN DANCE`, ID: 240)** activada por Dragonair en el Turno 1.
   - *Sinergia:* **Kingdra (As)** cuenta con la habilidad *Nado Rápido (Swift Swim)*, duplicando su velocidad en lluvia y potenciando su Hidrobomba a +50% de daño base STAB. Dragonair cuenta con Trueno de precisión perfecta (100%).
4. **Blaine (Kanto Gimnasio 7 - Fuego | Isla Canela):**
   - *Clima:* **Día Soleado (`SUNNY DAY`, ID: 241)** activado por Ninetales en el Turno 1.
   - *Sinergia:* Potencia los movimientos de fuego de Rapidash, Camerupt, Houndoom y Magmortar, mientras debilita el daño de ataques de agua del alumno a la mitad (-50%).

---

## ⚡ 11. Rival Silver Competitivo (7 Fases, 21 Entrenadores, 6 Pokémon c/u)
El rival ya no es un trámite fácil de 1 o 2 Pokémon; se convierte en la némesis táctica del alumno a lo largo de toda su formación:

- **Evolución Escalable en 7 Fases:**
  1. *Fase 1 (Ciudad Cerezo Nv. 11-12 - IDs 240, 547, 594):* Zubat, Gastly, Sneasel, Magnemite, Larvitar (con Tormenta de Arena) + Starter Nv. 12 con *Baya Zidra*.
  2. *Fase 2 (Pueblo Azalea Nv. 18-20 - IDs 241, 340, 614):* Zubat, Haunter, Sneasel, Magneton, Larvitar + Starter Nv. 20 (Bayleef / Quilava / Croconaw).
  3. *Fase 3 (Torre Quemada Nv. 26-28 - IDs 242, 738, 315):* Golbat, Haunter, Sneasel, Magneton, Pupitar + Starter Nv. 28.
  4. *Fase 4 (Torre Radio Trigal Nv. 42-44 - IDs 541, 610, 492):* Golbat, Gengar, Weavile (Garra Rápida), Magnezone (Imán), Pupitar + Starter Nv. 44 (Meganium / Typhlosion / Feraligatr).
  5. *Fase 5 (Calle Victoria Nv. 54-56 - IDs 544, 611, 215):* Crobat, Gengar, Weavile, Magnezone, **Tyranitar** (despliega Tormenta de Arena con Restos) + Starter Nv. 56.
  6. *Fase 6 (Meseta Añil Rematch Nv. 66-68 - IDs 545, 612, 217):* Crobat, Gengar, Ursaluna (Cinturón Negro), Electivire (Imán), Tyranitar (Danza Dragón) + Starter Nv. 68.
  7. *Fase 7 (Monte Plateado / Final Nv. 76-78 - IDs 546, 613, 218):* Crobat, Gengar, Ursaluna, Salamence (Colmillo Dragón), Tyranitar + Starter Nv. 78 con Baya Lum.
- **IA Táctica Activa (`aiFlags = 0x07`):** Cobertura de tipos, remates inmediatos de rivales débiles y predicción de viabilidad.
- **Regla Pedagógica de Mochila:** A diferencia de los combates de gimnasio (donde no se permite spam de pociones), **en los combates contra el Rival el alumno SÍ puede usar pociones, revivires y objetos de su mochila**. Esto recompensa a los estudiantes que han cumplido misiones de código y ahorrado pociones en SynDex, permitiéndoles superar un combate de 6 Pokémon de alta dificultad.

---

## 🏅 12. Medallero Web Interactivo & Estuche Oficial (Johto & Kanto)
- **Componente Central:** `src/components/dashboard/GymBadgeShowcase.tsx`.
- **Integración:**
  - Botón dorado **`🏅 MEDALLERO`** y medalla Céfiro 3D interactiva en la cabecera de `JohtoMap.tsx`.
  - Botón de acceso directo en la barra superior de `CentralViewContainer.tsx` disponible en cualquier momento.
- **Estándar Nintendo Visual UI & Dopamine Design System:**
  - **Zero Bloques de Texto:** Vitrina aterciopelada con pines joya SVG pixel-art para las 16 medallas (8 Johto + 8 Kanto).
  - **Doble Tema Nintendo:** Modo Marfil Retro Game Boy Color (`#F4F1EA` con `shadow-[4px_4px_0_#000]`) y Modo Grafito Game Boy Advance SP (`#121214`).
  - **Micro-interacciones Dopamínicas:**
    - Clics con Web Audio 8-bit (`soundFx.playCoin()`, `soundFx.playFanfare()`, `soundFx.playClick()`).
    - Lluvia de estrellas doradas mediante `canvas-confetti` al inspeccionar medallas desbloqueadas.
    - Cuadro de diálogo RPG clásico de 2 líneas con efecto typewriter explicando el efecto táctico en el juego (ej. *Control de nivel*, *+10% Ataque*, *Uso de Surf/Vuelo*).
    - **Equipamiento Cosmético:** Botón para fijar cualquier medalla conquistada en la pechera del avatar (`profile.equipped_trainer_cosmetics.badge`), visible en rankings y salas colaborativas.

---

## 💊 13. Economía Médica Prohibitiva & Drops Académicos Unificados

Para resolver el equilibrio pedagógico y económico entre SynDex y la ROM GBA, se implementó el modelo **"Curarse es un lujo, estudiar es la cura"**:

- **Precios de Lujo en ROM (`public/roms/pokemonHnS.gba`):**
  - Parche binario aplicado en la tabla de ítems `gItems` (`0x8FE9C0`, struct de 44 bytes, offset `+16` = `u16 price`):
    - **Poción (ID 18):** ₽1,200 (antes ₽300)
    - **Superpoción (ID 27):** ₽3,500 (antes ₽700)
    - **Hiperpoción (ID 26):** ₽8,000 (antes ₽1,200)
    - **Poción Máxima (ID 25):** ₽12,000 (antes ₽2,500)
    - **Restaura Todo (ID 24):** ₽25,000 (antes ₽3,000)
    - **Revivir (ID 29):** ₽15,000 (antes ₽1,500)
    - **Max Revivir (ID 30):** ₽35,000 (antes ₽4,000)
    - **Cura Total (ID 28):** ₽2,000 (antes ₽600)
    - **Hierba Revivir (ID 38):** ₽20,000
    - **Poké Balls (ID 1):** Preservadas en ₽200 para garantizar que capturar Pokémon siga siendo accesible sin desbalancear el avance.
- **Precios Web Calibrados (`src/lib/shopCatalog.ts`):**
  - La Tienda Web refleja la misma escasez: Poción ₽600, Superpoción ₽1,800, Hiperpoción ₽4,500, Revivir ₽8,000, Max Revivir ₽15,000, Restaura Todo ₽18,000.
- **Drops de Código Automatizados (`src/components/dashboard/MissionSubmitModal.tsx`):**
  - Al completar misiones o tareas de programación, el estudiante recibe inyecciones de medicina médica directamente en la mochila GBA:
    - `🎁 Drop Médico Académico: 1x Poción + 1x Superpoción` (Ahorro directo de ₽4,700).
- **Sincronización Bidireccional de Pokédólares y Equipo (`PokemonMemoryBridge.ts` & `GbaConsoleWorker.tsx`):**
  - Lectura en tiempo real del SaveBlock1: Dinero desencriptado (`0x0490` XOR `encryptionKey`) y Equipo Pokémon (`0x0234` / `0x0238`).
  - Actualización reactiva instantánea al boot del emulador y a cada guardado manual en el perfil del estudiante (`pokedollars` y `gba_party_json`).
