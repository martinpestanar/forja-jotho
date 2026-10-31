# 📜 Registro Histórico & Changelog Maestro de Modificaciones (Pokémon Heart & Soul v2.0.6)

> **Documento SSOT Vivo (Fuente Única de Verdad):** Este archivo registra todas las alteraciones, personalizaciones y rebalances aplicados al código fuente de la ROM en el repositorio [`martinpestanar/pokehns-expansion`](https://github.com/martinpestanar/pokehns-expansion) (rama `syndex-v2`).  
> **Regla de Oro para Agentes IA:** Antes de proponer o aplicar cambios a entrenadores, objetos, eventos o mecánicas, revisa este historial para no repetir trabajo, mantener la coherencia pedagógica y construir sobre lo ya implementado.

---

## 🏛️ Índice de Módulos Modificados
1. [Líderes de Gimnasio Rebalanceados (6 Pokémon c/u)](#-1-líderes-de-gimnasio-rebalanceados)
2. [Alto Mando y Campeón Lance](#-2-alto-mando-y-campeón-lance)
3. [Líderes de Kanto y Monte Plateado (Red)](#-3-líderes-de-kanto-y-monte-plateado-red)
4. [Rival Silver: 7 Fases y 21 Encuentros](#-4-rival-silver-7-fases-y-21-encuentros)
5. [Bypass de Introducción y Menús de Dificultad](#-5-bypass-de-introducción-y-menús-de-dificultad)
6. [Economía Médica Prohibitiva](#-6-economía-médica-prohibitiva)
7. [Zonas Preservadas Intactas (Sin Modificaciones)](#-7-zonas-preservadas-intactas)
8. [Bitácora Cronológica de Commits](#-8-bitácora-cronológica-de-commits)

---

## ⚔️ 1. Líderes de Gimnasio Rebalanceados

* **Archivo Fuente:** `src/data/trainers_hns.party`
* **Estándar Aplicado:** 6 Pokémon evolucionados por combate, movimientos de cobertura, hold items tácticos, IVs a 25 en todas las estadísticas y banderas de IA competitiva:
  `AI: Check Bad Move / Try To Faint / Check Viability` (`aiFlags = 0x07`).

| Líder | Gimnasio / Región | Nivel | Equipo (6 Pokémon) | Objeto del As / Táctica |
| :--- | :--- | :--- | :--- | :--- |
| **Falkner** (`TRAINER_FALKNER_1_HNS`) | Ciudad Malvalona (Volador) | Nv. 15–16 | Pidgeotto, Swellow, Pelipper, Noctowl, Fearow, **Togekiss** | Baya Zidra en Togekiss. Cobertura con Bofetón Lodo y Pistola Agua. |
| **Bugsy** (`TRAINER_BUGSY_1_HNS`) | Pueblo Azalea (Bicho) | Nv. 21–23 | Butterfree, Beedrill, Ninjask, Armaldo, Scyther, **Yanmega** | Scyther con Polvo Plata, Yanmega con Baya Zidra. |
| **Whitney** (`TRAINER_WHITNEY_1_HNS`) | Ciudad Trigal (Normal) | Nv. 27–29 | Clefable, Wigglytuff, Exploud, Zangoose, Ambipom, **Miltank** | Baya Lum en Miltank (cura estado). Desenrollar + Batido + Atracción. |
| **Morty** (`TRAINER_MORTY_1_HNS`) | Ciudad Iris (Fantasma) | Nv. 33–35 | Haunter, Sableye, Banette, Dusclops, Mismagius, **Gengar** | Mismagius con Hechizo, Gengar con Baya Zidra (Hipnosis + Come Sueños). |
| **Chuck** (`TRAINER_CHUCK_1_HNS`) | Ciudad Orquídea (Lucha) | Nv. 39–41 | Primeape, Hitmonlee, Hitmonchan, Hariyama, Breloom, **Poliwrath** | Poliwrath con Cinturón Negro (Puño Dinámico, Surf, Cascada). |
| **Jasmine** (`TRAINER_JASMINE_1_HNS`) | Ciudad Olivo (Acero) | Nv. 44–46 | Skarmory, Aggron, Metang, Magnezone, Scizor, **Steelix** | Magnezone con Imán, Steelix con Restos. Despliegue de Tormenta Arena. |
| **Pryce** (`TRAINER_PRYCE_1_HNS`) | Pueblo Caoba (Hielo) | Nv. 49–51 | Dewgong, Glalie, Walrein, Froslass, Weavile, **Mamoswine** | Weavile con Garra Rápida, Mamoswine con Antiderretir. Despliegue de Granizo. |
| **Clair** (`TRAINER_CLAIR_1_HNS`) | Ciudad Endrino (Dragón) | Nv. 54–56 | Dragonair, Gyarados, Altaria, Flygon, Salamence, **Kingdra** | Salamence con Colmillo Dragón, Kingdra con Baya Zidra. Despliegue de Lluvia. |

---

## 🏆 2. Alto Mando y Campeón Lance

* **Archivo Fuente:** `src/data/trainers_hns.party`
* **Estándar:** Todos a 6 Pokémon, IVs competitivos, objetos sostenidos e IA de cálculo de KO en tiempo real.

| Entrenador | Especialidad | Nivel | Equipo (6 Pokémon) |
| :--- | :--- | :--- | :--- |
| **Will** (`TRAINER_WILL_1_HNS`) | Psíquico | Nv. 58–60 | Xatu, Slowbro, Jynx, Exeggutor, Gardevoir, **Gallade** (As con Cinta Elegida) |
| **Koga** (`TRAINER_KOGA_1_HNS`) | Veneno | Nv. 60–62 | Ariados, Muk, Forretress, Swalot, Roserade, **Crobat** (As con Lodo Negro) |
| **Bruno** (`TRAINER_BRUNO_1_HNS`) | Lucha | Nv. 62–64 | Hitmonlee, Hitmonchan, Hitmontop, Hariyama, Medicham, **Machamp** (As con Cinturón Negro) |
| **Karen** (`TRAINER_KAREN_1_HNS`) | Siniestro | Nv. 64–66 | Umbreon, Vileplume, Absol, Shiftry, Honchkrow, **Houndoom** (As con Carbón) |
| **Lance** (`TRAINER_LANCE_1_HNS`) | Dragón / Campeón | Nv. 66–68 | Gyarados, Charizard, Aerodactyl, Altaria, Salamence, **Dragonite** (As con Baya Zidra) |

---

## 🗻 3. Líderes de Kanto y Monte Plateado (Red)

* **Archivo Fuente:** `src/data/trainers_hns.party`
* **Nivel de Dificultad:** End-Game avanzado (Nv. 69 a 88).

| Entrenador | Región / Lugar | Nivel | Equipo (6 Pokémon) | Notas / Hold Items |
| :--- | :--- | :--- | :--- | :--- |
| **Brock** (`TRAINER_BROCK_HNS`) | Ciudad Plateada | Nv. 69–71 | Golem, Steelix, Relicanth, Armaldo, Rhyperior, Tyranitar | Tyranitar con Restos |
| **Misty** (`TRAINER_MISTY_HNS`) | Ciudad Celeste | Nv. 70–72 | Golduck, Quagsire, Lapras, Ludicolo, Milotic, Starmie | Starmie con Restos |
| **Lt. Surge** (`TRAINER_LTSURGE_HNS`) | Ciudad Carmín | Nv. 71–73 | Raichu, Magneton, Electrode, Manectric, Magnezone, Electivire | Electivire con Imán |
| **Erika** (`TRAINER_ERIKA_HNS`) | Ciudad Azulona | Nv. 72–74 | Bellossom, Victreebel, Shiftry, Cradily, Tangrowth, Roserade | Roserade con Semilla Milagro |
| **Janine** (`TRAINER_JANINE_HNS`) | Ciudad Fucsia | Nv. 73–75 | Ariados, Weezing, Seviper, Roserade, Muk, Crobat | Crobat con Lodo Negro |
| **Sabrina** (`TRAINER_SABRINA_HNS`) | Ciudad Azafrán | Nv. 74–76 | Mr. Mime, Espeon, Claydol, Metagross, Gallade, Alakazam | Alakazam con Cuchara Torcida |
| **Blaine** (`TRAINER_BLAINE_HNS`) | Isla Canela | Nv. 75–77 | Ninetales, Rapidash, Torkoal, Camerupt, Houndoom, Magmortar | Magmortar con Carbón. Día Soleado. |
| **Blue** (`TRAINER_BLUE_HNS`) | Ciudad Verde | Nv. 77–79 | Pidgeot, Alakazam, Rhyperior, Gyarados, Arcanine, Tyranitar | Tyranitar con Baya Lum |
| **RED** (`TRAINER_RED_HNS`) | Cima del Monte Plateado | **Nv. 85–88** | **Pikachu** (Nv. 88 @ Bola Luminosa), **Lapras** (Nv. 86 @ Restos), **Snorlax** (Nv. 86 @ Restos), **Venusaur** (Nv. 86 @ Semilla Milagro), **Blastoise** (Nv. 86 @ Agua Mística), **Charizard** (Nv. 87 @ Carbón) | Máximo desafío pedagógico. Todos los IVs a 31. Música oficial `Hg Champion`. |

---

## ⚡ 4. Rival Silver: 7 Fases y 21 Encuentros

* **Archivo Fuente:** `src/data/trainers_hns.party`
* **Estándar:** 6 Pokémon desde la Fase 1 hasta la Fase 7, cubriendo todas las ramificaciones según el starter elegido por el jugador:
  * Starter Chikorita (`TRAINER_RIVAL_CHIKORITA_1_HNS` a `7`)
  * Starter Cyndaquil (`TRAINER_RIVAL_CYNDAQUIL_1_HNS` a `7`)
  * Starter Totodile (`TRAINER_RIVAL_TOTODILE_1_HNS` a `7`)

| Fase | Ubicación en la Historia | Nivel | Core de 5 Pokémon + Starter |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Ciudad Cerezo | Nv. 11–12 | Zubat, Gastly, Sneasel, Magnemite, Larvitar + Starter Nv. 12 (@ Baya Zidra) |
| **Fase 2** | Pueblo Azalea | Nv. 18–20 | Zubat, Haunter, Sneasel, Magneton, Larvitar + Starter Nv. 20 (Fase 1 evol.) |
| **Fase 3** | Torre Quemada (Iris) | Nv. 26–28 | Golbat, Haunter, Sneasel, Magneton, Pupitar + Starter Nv. 28 |
| **Fase 4** | Torre Radio (Trigal) | Nv. 42–44 | Golbat, Gengar, Weavile (@ Garra Rápida), Magnezone (@ Imán), Pupitar + Starter Nv. 44 |
| **Fase 5** | Calle Victoria | Nv. 54–56 | Crobat, Gengar, Weavile, Magnezone, **Tyranitar** (@ Restos) + Starter Nv. 56 |
| **Fase 6** | Meseta Añil (Revancha) | Nv. 66–68 | Crobat, Gengar, Ursaluna (@ Cinturón Negro), Electivire (@ Imán), Tyranitar + Starter Nv. 68 |
| **Fase 7** | Monte Plateado (Final) | Nv. 76–78 | Crobat (@ Garra Rápida), Gengar, Ursaluna, Salamence (@ Colmillo Dragón), Tyranitar + Starter Nv. 78 (@ Baya Lum) |

* **Regla de Mochila en Combates de Rival:** A diferencia de los Líderes de Gimnasio, el alumno **sí tiene permitido usar objetos y pociones de su mochila** contra Silver, recompensando la resolución de tareas en SynDex.

---

## 🚫 5. Bypass de Introducción y Menús de Dificultad

* **Archivo Fuente:** `src/oak_speech_hns.c` (función `Task_NewGameHnsSpeech_ProcessNameYesNoMenu`)
* **Motivo:** Evitar que los alumnos activen Randomizers o modo Nuzlocke, garantizando una experiencia estandarizada y competitiva para toda la clase.
* **Implementación:** Al confirmar el nombre del jugador, el motor ejecuta directamente `SetDefaultChallengeSettings()`, oculta los sprites y salta de inmediato a `Task_NewGameHnsSpeech_SlidePlatformAway2`. Se eliminó la llamada a `CB2_InitChallengeMenu`.

---

## 💊 6. Economía Médica Prohibitiva ("Estudiar es la Cura")

* **Archivo Fuente:** `src/data/items.h`
* **Motivo:** Evitar el efecto *Pay-to-Win* por compra masiva de pociones en tiendas de la ROM. Los estudiantes deben resolver ejercicios en SynDex para recibir medicinas como recompensa.

| Ítem | Precio Original | **Nuevo Precio en ROM v2.0.6** |
| :--- | :--- | :--- |
| **Poción** (`ITEM_POTION`) | ₽300 | **₽1,200** |
| **Superpoción** (`ITEM_SUPER_POTION`) | ₽700 | **₽3,500** |
| **Hiperpoción** (`ITEM_HYPER_POTION`) | ₽1,200 | **₽8,000** |
| **Poción Máxima** (`ITEM_MAX_POTION`) | ₽2,500 | **₽12,000** |
| **Restaura Todo** (`ITEM_FULL_RESTORE`) | ₽3,000 | **₽25,000** |
| **Revivir** (`ITEM_REVIVE`) | ₽1,500 | **₽15,000** |
| **Max Revivir** (`ITEM_MAX_REVIVE`) | ₽4,000 | **₽35,000** |
| **Cura Total** (`ITEM_FULL_HEAL`) | ₽600 | **₽2,000** |
| **Hierba Revivir** (`ITEM_REVIVAL_HERB`) | ₽2,800 | **₽20,000** |
| **Poké Ball** (`ITEM_POKE_BALL`) | ₽200 | **₽200 (Preservada accesible)** |

---

## 🌿 7. Zonas Preservadas Intactas (Sin Modificaciones)

* **Hierba Alta Dinámica / Encuentros Salvajes:** Por instrucción explícita del usuario, `src/data/wild_encounters.json` y las tablas de salvajes de las rutas 29 a 31 **no fueron modificadas**. Se mantienen las tasas y niveles oficiales de Pokémon Heart & Soul v2.0.6.

---

## 📝 8. Bitácora Cronológica de Commits (Fork `martinpestanar/pokehns-expansion`)

| Commit | Mensaje | Descripción del Cambio |
| :--- | :--- | :--- |
| `5806ea106d` | `feat(custom-hns-v2): add 6-mon competitive trainers, rival phases, custom medicine prices and intro bypass` | Rebalanceo completo inicial de 22 líderes/E4/Red, 21 rivales, precios en `items.h` e intro bypass en `oak_speech_hns.c`. |
| `1d9ccc9b43` | `fix(ci): fix yaml syntax on deploy step and sanitize artifact upload path` | Corrección de indentación y sintaxis YAML en `.github/workflows/deploy-rom.yml`. |
| `e59498fea0` | `build(ci): use make hns target for Heart & Soul engine build` | Cambio del target de compilación a `make hns -j$(nproc) -O` para incluir flags de mapas de HnS. |
| `e72dc6fee6` | `fix(trainers): align mugshot colors, surge pic and red class to official definitions` | Ajuste de enums C (`Mugshot: Dark Red / Orange / Light Blue`, `Pic: Leader Surge Hns`, `Pic: Silver Hns`, `Class: Pkmn Trainer 1 Hns`). Compilación exitosa en 4m 14s (Run #41160628747). |

---

> [!TIP]
> **Para futuras modificaciones:** Registra cada nuevo cambio en esta bitácora agregando una sección detallada y anexando el commit a la tabla cronológica.
