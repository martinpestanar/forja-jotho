# 📜 Bitácora de Modding C & Hackrom (Pokémon Heart & Soul)

Historial oficial de compilaciones y modificaciones del código fuente C en el repositorio `martinpestanar/pokemonHnS` para la consola web de SynDex.

---

## 📅 28 de Octubre de 2026 - Overhaul Hardcore: Líderes, Secuaces y Liga (Johto + Kanto)

### 🎯 Objetivo
Transformar todos los combates de gimnasio de Johto y Kanto en una experiencia de alta dificultad competitiva:
1. **Líderes de Gimnasio:** Equipos completos de 6 Pokémon completamente evolucionados (mezcla de Gen 1, 2 y 3).
2. **Secuaces de Gimnasio:** Equipos de 3 a 4 Pokémon evolucionados acordes a la temática y nivel del gimnasio.
3. **Objetos y Movesets:** Held items competitivos (Restos, Vidasfera, Bayas reductoras/curativas) y movesets sin repeticiones absurdas.

---

### 📦 Trazabilidad Técnica
- **Repositorio Fuente:** [martinpestanar/pokemonHnS](https://github.com/martinpestanar/pokemonHnS)
- **Rama:** `main`
- **Commits Clave:**
  - `89b15de`: Actualización integral de `src/data/trainer_parties.h` (43 líderes y revanchas + 47 secuaces) y `src/data/trainers.h` (ítems de curación e IA).
  - `acd983e`: Ajuste de compatibilidad GCC 16 / devkitARM (`Makefile` con flag `-std=gnu17` para evitar conflicto con `nullptr_t` de C23).
- **GitHub Actions Runs:**
  - Build Check: Run ID `40814581142` (Status: Success)
  - Deploy Artifact: Run ID `40814581192` (Status: Success)
- **Artifact ID:** `12871882224` (`pokemonHnS.gba`)
- **Instalación Local en SynDex:**
  - Archivo: `public/roms/pokemonHnS.gba`
  - Tamaño: 33,554,432 bytes (32 MB)
  - SHA256: `D38A731292C13D3562F438FBEEEAEB4F8171E9765AE5BA5CEB6D5BFD8D0DE3AC`

---

### 🗺️ Resumen de Curva de Nivel y Líderes

| Líder | Región | Tipo | Nivel Máx | As Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Pegaso (Falkner)** | Johto | Volador | Nvl 21 | Pidgeot |
| **Antón (Bugsy)** | Johto | Bicho | Nvl 25 | Scizor |
| **Blanca (Whitney)** | Johto | Normal | Nvl 30 | Miltank |
| **Morti (Morty)** | Johto | Fantasma | Nvl 35 | Gengar |
| **Aníbal (Chuck)** | Johto | Lucha | Nvl 40 | Poliwrath |
| **Yasmina (Jasmine)** | Johto | Acero | Nvl 44 | Steelix |
| **Fredo (Pryce)** | Johto | Hielo | Nvl 48 | Mamoswine/Walrein |
| **Débora (Clair)** | Johto | Dragón | Nvl 53 | Kingdra |
| **Lt. Surge** | Kanto | Eléctrico | Nvl 58 | Raichu |
| **Sabrina** | Kanto | Psíquico | Nvl 60 | Alakazam |
| **Érika** | Kanto | Planta | Nvl 62 | Bellossom |
| **Misty** | Kanto | Agua | Nvl 64 | Starmie |
| **Sachiko (Janine)** | Kanto | Veneno | Nvl 66 | Crobat/Venomoth |
| **Brock** | Kanto | Roca | Nvl 68 | Tyranitar/Steelix |
| **Blaine** | Kanto | Fuego | Nvl 70 | Magmortar/Charizard |
| **Azul (Blue)** | Kanto | Mixto | Nvl 75 | Tyranitar |

---

### 📚 Documentación Relacionada
- [diseno_lideres_dificil_johto_kanto.md](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/SynDex/docs/diseno_lideres_dificil_johto_kanto.md): Desglose técnico de cada equipo, movimientos, EVs/IVs y objetos equipados.
- [SKILL.md](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/SynDex/.agents/skills/pokeemerald-hns-bridge/SKILL.md): Runbook del puente GBA, memoria RAM y emulador web.

---

## 📅 29 de Octubre de 2026 - Reforma Económica C (PokéMart x50 + Cooldown NPC 5m Incremental)

### 🎯 Objetivo
Bloquear los exploits de dinero dentro de la ROM y sincronizar la dificultad de las rutas con la **Moneda Única (`₽`)** de la App SynDex:
1. **Hiperinflación PokéMart (`x50`):** Comprar en los PokéMarts del juego cuesta `50x` el valor original (tope `60,000 ₽` en `u16`), obligando al jugador a abastecerse en el Bazar de Ciudad Trigal desde la App.
2. **Nerf de Venta en PokéMart (`1 ₽`):** Cualquier objeto vendido dentro del PokéMart paga exactamente `1 ₽` por unidad, eliminando el arbitraje infinito de vender objetos encontrados en las rutas.
3. **NPCs de Ruta con Cooldown de 5 Minutos y Escalado Incremental (Tiers 1 a 5):**
   - Desde el primer combate, los entrenadores de ruta tienen **+3 niveles base** y **+6 IVs**.
   - Al derrotar a un entrenador de ruta estándar (`TRAINER_BATTLE_SINGLE` sin script de historia bloqueante), entra en un **enfriamiento de 5 minutos (`300s` de tiempo de juego)**.
   - Pasados los 5 minutos, si hablas con el NPC, su bandera se reactiva automáticamente y sube de Tier (`Tier 1` a `Tier 5`), ganando **+4 niveles**, **+5 IVs** y **+35 ₽** adicionales por cada revancha.

---

### 📦 Trazabilidad Técnica
- **Repositorio Fuente:** [martinpestanar/pokemonHnS](https://github.com/martinpestanar/pokemonHnS)
- **Commit Clave:** `8fe46e3b` (`feat(economy): PokeMart x50 inflation, 1P sell nerf, and 5-min NPC incremental rematch scaling`)
- **Archivos C Modificados:**
  - `src/item.c` (`ItemId_GetPrice`)
  - `src/item_menu.c` (`DisplaySellItemPriceAndConfirm`, `InitSellHowManyInput`, `Task_ChooseHowManyToSell`, `ConfirmSell`, `SellItem`)
  - `include/battle_setup.h` & `src/battle_setup.c` (`sNpcRematchTracker`, `IsScalableRouteTrainer`, `GetNpcRematchTier`, `GetScaledLevel`, `GetTrainerFlag`, `CB2_EndTrainerBattle`)
  - `src/battle_main.c` (`CreateNPCTrainerParty` — escalado de IVs por Tier)
  - `src/battle_script_commands.c` (`GetTrainerMoneyToGive` — recompensa incremental calibrada a la moneda única)
- **GitHub Actions Runs:**
  - Build ROM: Run ID `40820538099` (Status: Success)
  - Build and Deploy: Run ID `40820537920` (Status: Success)
- **Artifact ID:** `12874346834` (`pokemonHnS.gba`)
- **Instalación Local en SynDex:**
  - Archivo: [pokemonHnS.gba](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/SynDex/public/roms/pokemonHnS.gba)
  - Tamaño: `33,554,432` bytes (32 MB)
  - SHA256: `F7AFA4587B8BA064341598C54907261CC70992ACB426221A1BEED572FE977C92`
