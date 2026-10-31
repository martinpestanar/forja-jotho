---
name: hns-v2-game-modding
description: >-
  Guía maestra y runbook de ingeniería para modificar, personalizar, inyectar datos y compilar
  el juego Pokémon Heart & Soul v2.0.6 (repositorio martinpestanar/pokehns-expansion) y sincronizarlo
  con la plataforma SynDex (emulador mGBA WebAssembly, Save Engine y Supabase Storage).
---

# ⚔️ Heart & Soul v2.0.6 Modding & Architecture Skill (SynDex SSOT)

Este documento es la **fuente única de verdad (SSOT)** exclusiva para la **versión 2.0.6** de Pokémon Heart & Soul en SynDex. Cualquier modificación futura al juego (entrenadores, eventos de mapa, sprites, scripts en C, economía, objetos, inyecciones de Pokémon o saves) debe seguir estrictamente este flujo.

---

## 🏛️ 1. Arquitectura de Dos Repositorios

El ecosistema SynDex desacopla la plataforma web del código fuente del juego GBA:

```
┌────────────────────────────────────────────────────────┐
│  martinpestanar/pokehns-expansion (GitHub Fork)         │
│  - Rama de trabajo: syndex-v2                          │
│  - Código en C, asm, scripts, .party, items.h          │
│  - CI/CD: .github/workflows/deploy-rom.yml             │
│      └─ Compila: make hns -j$(nproc) -O                │
│      └─ Despliega: curl a Supabase Storage             │
└───────────────────────────┬────────────────────────────┘
                            │ Sube el binario compilado
                            ▼
┌────────────────────────────────────────────────────────┐
│  Supabase Storage (Bucket: roms/pokemonHnS.gba)        │
└───────────────────────────┬────────────────────────────┘
                            │ Descarga al boot / browser
                            ▼
┌────────────────────────────────────────────────────────┐
│  martinpestanar/forja-jotho (SynDex Web App)           │
│  - Emulador mGBA WebAssembly en navegador (puerto 3005)│
│  - gbaSaveEngine.ts (SaveBlock1 & SaveBlock2 v2.0.6)   │
│  - PokemonMemoryBridge.ts (Inyecciones vivas en SRAM)  │
│  - hnsCatalog.ts (IDs oficiales de ítems v2.0.6)       │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. Flujo de Trabajo para Modificar el Juego

### Regla de Oro:
**NUNCA editar binarios con parches manuales.** Todas las mejoras del juego se hacen directamente en el código fuente de [`pokehns-expansion/`](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/SynDex/pokehns-expansion/).

### Paso a Paso para Cualquier Cambio:

1. **Editar los Archivos Fuente:**
   * **Entrenadores y Equipos:** `src/data/trainers_hns.party`
   * **Precios y Propiedades de Ítems:** `src/data/items.h`
   * **Cinemáticas de Inicio / Elm / Oak:** `src/oak_speech_hns.c`
   * **Eventos de Mapas y NPCs:** `data/maps/*/scripts.inc`
   * **Lógica de Combate y Nuevas Mecánicas:** `src/battle_*.c`

2. **Commit y Push Autenticado al Fork:**
   Al interactuar con el repo remoto, usa siempre la variable del sistema `$env:GITHUB_PERSONAL_ACCESS_TOKEN` para evitar bloqueos interactivos:
   ```powershell
   cd pokehns-expansion
   git add .
   git commit -m "feat(game): descripcion de la mejora"
   git push "https://$($env:GITHUB_PERSONAL_ACCESS_TOKEN)@github.com/martinpestanar/pokehns-expansion.git" syndex-v2
   ```

3. **Verificar Compilación Automática (GitHub Actions):**
   ```powershell
   $env:GH_TOKEN = $env:GITHUB_PERSONAL_ACCESS_TOKEN
   gh run list --repo martinpestanar/pokehns-expansion
   # Para ver progreso en vivo:
   gh run view <RUN_ID> --repo martinpestanar/pokehns-expansion
   ```
   * *Target oficial de compilación:* `make hns -j$(nproc) -O` (Tiempo promedio: 3m 30s - 4m 15s).
   * Al terminar con éxito (`✓`), el workflow sube la ROM generada a Supabase Storage automáticamente (`roms/pokemonHnS.gba`).

4. **Sincronizar la ROM Local para Desarrollo:**
   Ejecutar desde la raíz de `SynDex`:
   ```powershell
   node --env-file=.env -e "
   const fs = require('fs');
   const https = require('https');
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/roms/pokemonHnS.gba';
   const file = fs.createWriteStream('public/roms/pokemonHnS.gba');
   https.get(url, (res) => {
     res.pipe(file);
     file.on('finish', () => {
       file.close();
       fs.copyFileSync('public/roms/pokemonHnS.gba', 'public/roms/pokemonHnS.clean.gba');
       console.log('ROM v2.0.6 sincronizada localmente (33,554,432 bytes).');
     });
   });
   "
   ```

---

## 🎯 3. Sintaxis y Reglas para Entrenadores (`trainers_hns.party`)

Para mantener la regla **"Nintendo Visual UI & Dopamine Design"** y el balance competitivo sin errores de compilación:

### Banderas de IA Competitiva:
```
AI: Check Bad Move / Try To Faint / Check Viability
```
*(Equivale a `aiFlags = 0x07`, evaluando daño en tiempo real, descarte de inmunes y castigo elemental).*

### Paletas de Mugshot Permitidas (C enum):
Únicamente están permitidos los colores definidos en `include/battle_transition.h`:
* `None`
* `Purple`
* `Green`
* `Pink`
* `Blue`
* `Yellow`
* `Dark Red`
* `Orange`
* `Light Blue`
*(¡OJO!: No existen `Cyan`, `Gray`, `Brown`, `Red` sin `Dark` ni `Dark Blue`).*

### Identificadores Clave de Sprites (Pics):
* Lt. Surge: `Pic: Leader Surge Hns` *(NO Lt Surge)*
* Rival Silver: `Pic: Silver Hns` *(NO Rival Silver)*
* Red: `Class: Pkmn Trainer 1 Hns` | `Pic: Red Hns`

---

## 🧬 4. Memoria y Save Engine v2.0.6 (`gbaSaveEngine.ts`)

La v2.0.6 utiliza un layout específico en la flash de 128 KB (Ring Buffer de 14 sectores por slot):

### Offsets Oficiales Calibrados v2.0.6:
| Sector | Bloque | Offset Campo | Descripción |
| :--- | :--- | :--- | :--- |
| **0** | **SaveBlock2** | `0x0000` | `playerName` (7 bytes GBA Charmap) |
| **0** | **SaveBlock2** | `0x000A` | `trainerId` (TID low 16b + SID high 16b) |
| **0** | **SaveBlock2** | `0x00AC` | **`encryptionKey`** (u32 para XOR de dinero e ítems) |
| **1** | **SaveBlock1** | `0x0238` | `partyCount` (u8/u32, 0 a 6 Pokémon) |
| **1** | **SaveBlock1** | `0x023C` | `party` (6 slots * 100 bytes = 600 bytes) |
| **1** | **SaveBlock1** | `0x0494` | `money` (`u32 ^ encryptionKey`) |
| **1** | **SaveBlock1** | `0x0564` | `bag_items` (30 slots * 4 bytes) |
| **1** | **SaveBlock1** | `0x05DC` | `bag_key_items` (34 slots * 4 bytes) |
| **1** | **SaveBlock1** | `0x0664` | `bag_pokeballs` (16 slots * 4 bytes) |
| **1** | **SaveBlock1** | `0x06A4` | `bag_tmhm` (64 slots * 4 bytes) |
| **1** | **SaveBlock1** | `0x07A4` | `bag_berries` (46 slots * 4 bytes) |
| **1** | **SaveBlock1** | `0x085C` | `bag_medicine` (40 slots * 4 bytes) |
| **5** | **PC Box 1** | `0x0004` | 30 slots de `struct BoxPokemon` (80 bytes c/u) |

### Algoritmo de Inyección:
1. **Pausa mGBA WebAssembly:** Pausa el hilo de ejecución para evitar condiciones de carrera con la SRAM.
2. **Cifrado Subestructuras:** Desplaza y rota subestructuras `G, A, E, M` según `PID % 24`, calcula checksum de 16 bits y cifra los 48 bytes con `PID ^ fullOtId`.
3. **Bit de Obediencia:** Se inyecta `0x80000000` en la subestructura `M` para garantizar obediencia sin requerir medallas.
4. **Desbordamiento Inteligente:** Si `partyCount === 6`, automáticamente deposita en la primera ranura vacía (`pid === 0 && ot === 0`) de la **PC Box 1**.
5. **Recálculo de Checksum de Sector:** Suma todas las palabras `u32` del sector y pliega a `u16`, escribiendo en el header del sector para evitar mensajes de "Partida dañada".

---

## 📜 6. Registro Histórico de Modificaciones Realizadas (Changelog Vivo)

Antes de realizar o proponer cualquier nueva modificación en el juego, **debes consultar obligatoriamente el archivo complementario**:
👉 [`.agents/skills/hns-v2-game-modding/CHANGELOG_V2.md`](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/SynDex/.agents/skills/hns-v2-game-modding/CHANGELOG_V2.md)

### Resumen de lo que ya está implementado (¡NO REPETIR NI SOBREESCRIBIR ACCIDENTALMENTE!):
1. **Líderes de Gimnasio Johto y Kanto (16 Líderes):** Todos con 6 Pokémon evolucionados, táctica y `aiFlags = 0x07`.
2. **Alto Mando y Campeón Lance (5 Entrenadores):** Todos con 6 Pokémon e ítems competitivos.
3. **Red (Monte Plateado):** Nivel 85–88 con Pikachu Bola Luminosa y equipo legendario competitivo.
4. **Rival Silver (7 Fases x 3 Starters = 21 Combates):** Todos con 6 Pokémon y hold items.
5. **Bypass del Menú Oak/Elm:** Desactivado el menú de randomizer y nuzlocke en `src/oak_speech_hns.c`.
6. **Economía Médica Prohibitiva:** Precios de Pociones, Revivir y Curas aumentados en `src/data/items.h`.
7. **Hierba Alta:** Se mantuvo 100% original por instrucción del usuario.

*Cualquier nueva mejora que realices al juego debe agregarse al historial de `CHANGELOG_V2.md` con su respectivo commit y archivo fuente alterado.*
