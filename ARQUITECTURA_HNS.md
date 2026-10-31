# ARQUITECTURA HNS — Biblia Técnica de Offsets, Cifrado y Build
### `PokemonHnS-Development/pokehns-expansion` @ `Release-v2.0.6` (commit `167aa6d537`)

> **Audiencia:** agente de IA / ingeniero que escribirá el motor TypeScript de lectura e inyección sobre `.sav` de 128 KB (Flash 1 Mbit) y sobre EWRAM del core **mGBA-wasm**.
>
> **Estado de la auditoría:** todos los datos de este documento se extrajeron **leyendo el código fuente** del repo clonado en `pokehns-expansion/`, no de guías genéricas de Gen 3. Cada offset va acompañado de la línea/estructura que lo sustenta.
>
> **Limitación conocida:** la máquina de auditoría **no tiene toolchain ARM** (`arm-none-eabi-gcc`, `make` y `DEVKITPRO` ausentes), por lo que no se pudo compilar v2.0.6 para volcar `offsetof()` reales. Los offsets se derivaron por aritmética de `sizeof` + `alignof` del ABI `-mabi=apcs-gnu` y se **cruzaron contra los `STATIC_ASSERT` de tamaño del propio repo** (`test/save.c`) y contra el `GFRomHeader` embebido en la ROM. Los pocos valores no verificables están marcados **`[DERIVADO]`**.

---

## 0. Perfiles de compilación (LEER PRIMERO)

El workspace contiene **dos perfiles de guardado incompatibles**. Confundirlos corrompe partidas.

| Perfil | Origen | `sizeof(SaveBlock2)` | `sizeof(SaveBlock1)` | `encryptionKey` | `partyCount` | Bolsillos |
|---|---|---|---|---|---|---|
| **A** | Este repo, `Release-v2.0.6` | `0x0F2C` (3884) | `0x3CD0` (15568) | `0xAC` | `0x236` | 6 (combinados) |
| **B** | `public/roms/pokemonHnS.gba` (build **antigua**, NO es v2.0.6) | `0x0F50` (3920) | `0x3DB8` (15800) | `0xBC` | `0x234` | 5 reportados (90/30/16/64/46) + `treasures`/`battleItems` no expuestos |

**Perfil B se obtuvo empíricamente** leyendo `struct GFRomHeader` en la ROM (`0x100`, `gameName` en `0x108`) con `rom_header_probe.py`, y se validó contra los `.sav` reales (`scratch_fixed.sav`): la clave `0xBC` descifra `money` a `99999` y `3000`.

> ⚠️ **Hallazgo crítico:** la ROM desplegada en `public/roms/` **no coincide** con `Release-v2.0.6`. Si el motor se calibra con v2.0.6 y el usuario carga esa ROM, `money`/`coins`/`mochila` se leerán corruptos. **Solución obligatoria: resolver los offsets en runtime leyendo `GFRomHeader`** (§6).

### Los cambios de layout que introdujo v2.0.6 respecto del build antiguo

```c
// commit 409b66752f — "Add save version flag"
 struct SaveBlock1
 {
+             u16 saveVersion;      // <-- PREPENDIDO: desplaza TODO SaveBlock1 en +2
     /*0x00*/ struct Coords16 pos;
```
1. `u16 saveVersion` se antepuso a `SaveBlock1` → `playerPartyCount` pasó de `0x234` a **`0x236`** (los comentarios `/*0x234*/` del header quedaron obsoletos).
2. `u8 unused_9C2[6]` se reemplazó por `u32 saveVersionMagic` (`SAVE_VERSION_MAGIC 0xE8F828BC`), habilitando las migraciones de `src/save.c:931-979`.
3. La mochila se expandió y se pasó a **6 bolsillos combinados** (`I_COMBINE_BAG_POCKETS TRUE`): de 246 a 653 slots.
4. `struct Pokedex` dentro de `SaveBlock2` cambió de tamaño (build antiguo: `pokedex @0x1C`, `gcnLinkFlags @0xB8`; v2.0.6: `pokedex @0x18`, `gcnLinkFlags @0xA8`) → `SaveBlock2` pasó de `0xF50` a **`0xF2C`**.
5. `PokemonStorage` ganó `struct Pokemon fusions[MAX_FUSION_STORAGE]` (4 × 100 B) → de `0x83D0` a **`0x8560`**.
6. `SaveBlock3` ganó `struct ChallengeSettings` (bitfield *pinned* a 32 B por `STATIC_ASSERT` en `src/save.c:94`); no afecta a los offsets de `SaveBlock1`/`SaveBlock2`, sólo al chunk de 116 B por sector.

---

# SECCIÓN 1 — MAPA DE MEMORIA Y OFFSETS DEL SAVEBLOCK

## 1.1 Geometría de la Flash (ring buffer de 128 KB)

`include/save.h:6-33`:

```c
// Each 4 KiB flash sector contains 3968 bytes of actual data followed by 116 bytes of SaveBlock3 and then 12 bytes of footer.
#define SECTOR_DATA_SIZE        3968        // 0x0F80
#define SAVE_BLOCK_3_CHUNK_SIZE 116         // 0x0074
#define SECTOR_FOOTER_SIZE      12          // 0x000C
#define SECTOR_SIZE (SECTOR_DATA_SIZE + SAVE_BLOCK_3_CHUNK_SIZE + SECTOR_FOOTER_SIZE)  // 0x1000

#define NUM_SAVE_SLOTS  2
#define SECTOR_SIGNATURE 0x8012025          // 0x08012025  <-- FIRMA VÁLIDA
#define SPECIAL_SECTOR_SENTINEL 0xB39D

#define SAVE_VERSION       5
#define SAVE_VERSION_MAGIC 0xE8F828BC

#define SECTOR_ID_SAVEBLOCK2          0
#define SECTOR_ID_SAVEBLOCK1_START    1
#define SECTOR_ID_SAVEBLOCK1_END      4
#define SECTOR_ID_PKMN_STORAGE_START  5
#define SECTOR_ID_PKMN_STORAGE_END   13
#define NUM_SECTORS_PER_SLOT         14
// Save Slot 1: 0-13;  Save Slot 2: 14-27
#define SECTOR_ID_HOF_1              28
#define SECTOR_ID_HOF_2              29
#define SECTOR_ID_TRAINER_HILL       30
#define SECTOR_ID_RECORDED_BATTLE    31
#define SECTORS_COUNT                32
```

- **Firma válida (HnS v2.0.6): `0x08012025`** (little-endian en disco: `25 20 01 08`).
- `.sav` de 128 KB = `0x20000`. Los archivos reales del workspace miden **`0x20010` (131088)** → 16 bytes de cola tras la Flash. El motor debe **ignorar la cola** y usar solo los primeros `0x20000`.
- Sector físico `n` empieza en `fileOffset = n * 0x1000`.

### Footer del sector (`struct SaveSector`)

| Campo | Offset en el sector | Tipo | Notas |
|---|---|---|---|
| `data[3968]` | `0x0000` | `u8[]` | payload de la sección lógica |
| `saveBlock3Chunk[116]` | `0x0F80` | `u8[]` | trozo de `SaveBlock3` de ese sector (14 × 116 = 1624 B = tamaño máx. de `SaveBlock3`) |
| `id` (SectionID) | **`0x0FF4`** | `u16` | 0..13 |
| `checksum` | **`0x0FF6`** | `u16` | ver §2.1 |
| `signature` | **`0x0FF8`** | `u32` | `0x08012025` |
| `counter` (SaveCounter) | **`0x0FFC`** | `u32` | slot con contador "más nuevo" gana |

### Regla de oro del ring buffer

Los sectores **se rotan** en cada guardado. En `scratch_fixed.sav` el slot activo es el segundo (sectores 14–27) y el **sector 14 contiene la sección `id = 13`**. Por tanto:

> **NUNCA** asumas `seccion N = sector N`. Indexa siempre por el campo `id` en `0x0FF4`.

```ts
// Detección de slot activo — ver §1.9 para la versión completa
for (const slotBase of [0, 14]) {
  for (let i = 0; i < 14; i++) {
    const off = (slotBase + i) * 0x1000;
    if (readU32(view, off + 0xFF8) !== 0x08012025) continue;
    sections[readU16(view, off + 0xFF4)] = { sector: slotBase + i, counter: readU32(view, off + 0xFFC) };
  }
}
```

## 1.2 Layout lógico: `sSaveSlotLayout` (v2.0.6)

`src/save.c:49-78` — la tabla es **generada por macro**, no hardcodeada:

```c
#define SAVEBLOCK_CHUNK(structure, chunkNum)                                   \
{                                                                              \
    chunkNum * SECTOR_DATA_SIZE,                                               \
    sizeof(structure) >= chunkNum * SECTOR_DATA_SIZE ?                         \
    min(sizeof(structure) - chunkNum * SECTOR_DATA_SIZE, SECTOR_DATA_SIZE) : 0 \
}

struct { u16 offset; u16 size; } static const sSaveSlotLayout[NUM_SECTORS_PER_SLOT] =
{
    SAVEBLOCK_CHUNK(struct SaveBlock2, 0),      // SECTOR_ID_SAVEBLOCK2

    SAVEBLOCK_CHUNK(struct SaveBlock1, 0),      // SECTOR_ID_SAVEBLOCK1_START
    SAVEBLOCK_CHUNK(struct SaveBlock1, 1),
    SAVEBLOCK_CHUNK(struct SaveBlock1, 2),
    SAVEBLOCK_CHUNK(struct SaveBlock1, 3),      // SECTOR_ID_SAVEBLOCK1_END

    SAVEBLOCK_CHUNK(struct PokemonStorage, 0),  // SECTOR_ID_PKMN_STORAGE_START
    SAVEBLOCK_CHUNK(struct PokemonStorage, 1),
    ...                                          // hasta el chunk 8
    SAVEBLOCK_CHUNK(struct PokemonStorage, 8),  // SECTOR_ID_PKMN_STORAGE_END
};
```

### Tamaños por sección — PERFIL A (v2.0.6)

Derivados de `sizeof` y validados por los `STATIC_ASSERT` de `test/save.c`:
`T_SAVEBLOCK1_SIZE 15568` (`0x3CD0`), `T_SAVEBLOCK2_SIZE 3884` (`0x0F2C`), `T_POKEMONSTORAGE_SIZE 34144` (`0x8560`).

| SectionID | Bloque lógico | `size` | `offset` dentro del bloque | Verificación |
|---|---|---|---|---|
| `0` | `SaveBlock2` | **`0x0F2C`** (3884) | `0x0000` | `// sizeof=0xF2C` en `global.h:713` |
| `1` | `SaveBlock1` chunk 0 | **`0x0F80`** (3968) | `0x0000` | `min(15568-0, 3968)` |
| `2` | `SaveBlock1` chunk 1 | **`0x0F80`** | `0x0F80` | |
| `3` | `SaveBlock1` chunk 2 | **`0x0F80`** | `0x1F00` | |
| `4` | `SaveBlock1` chunk 3 | **`0x0E50`** (3664) | `0x2E80` | `15568 - 3*3968 = 3664` |
| `5` | `PokemonStorage` chunk 0 | **`0x0F80`** | `0x0000` | |
| `6` | chunk 1 | **`0x0F80`** | `0x0F80` | |
| `7` | chunk 2 | **`0x0F80`** | `0x1F00` | |
| `8` | chunk 3 | **`0x0F80`** | `0x2E80` | |
| `9` | chunk 4 | **`0x0F80`** | `0x3E00` | |
| `10` | chunk 5 | **`0x0F80`** | `0x4D80` | |
| `11` | chunk 6 | **`0x0F80`** | `0x5D00` | |
| `12` | chunk 7 | **`0x0F80`** | `0x6C80` | |
| `13` | `PokemonStorage` chunk 8 | **`0x0960`** (2400) | `0x7C00` | `34144 - 8*3968 = 2400` |

> Los 14 tamaños suman `3884 + 15568 + 34144 = 53596` bytes de datos útiles por slot.

### Tamaños por sección — PERFIL B (ROM desplegada)

De `GFRomHeader`: `saveBlock2Size = 0x0F50`, `saveBlock1Size = 0x3DB8`.

| SectionID | `size` |
|---|---|
| `0` | `0x0F50` (3920) |
| `1..3` | `0x0F80` |
| `4` | `0x0F38` (3896 = `15800 - 3*3968`) |
| `5..12` | `0x0F80` |
| `13` | **`[DERIVADO]`** — la ROM no expone `sizeof(PokemonStorage)`. Medición empírica sobre `scratch_fixed.sav`: el checksum guardado de la sección 13 (`0x586D`) sólo cuadra para `size >= 0x0D9C`, así que **`0x0F80` (sector completo, storage `0x8B80`) es la hipótesis más probable**, NO el `0x07D0` que usa hoy `gbaSaveEngine.ts` ni el `0x0960` de v2.0.6. |

## 1.3 `SaveBlock2` — perfil, seguridad y clave de cifrado (PERFIL A)

`include/global.h:674-713`:

```c
struct SaveBlock2
{
    /*0x00*/ u8 playerName[PLAYER_NAME_LENGTH + 1];   // PLAYER_NAME_LENGTH = 7
    /*0x08*/ u8 playerGender;                          // MALE=0, FEMALE=1
    /*0x09*/ u8 specialSaveWarpFlags;
    /*0x0A*/ u8 playerTrainerId[TRAINER_ID_LENGTH];    // TID u16 @0x0A | SID u16 @0x0C
    /*0x0E*/ u16 playTimeHours;
    /*0x10*/ u8 playTimeMinutes;
    /*0x11*/ u8 playTimeSeconds;
    /*0x12*/ u8 playTimeVBlanks;
    /*0x13*/ u8 optionsButtonMode;
    /*0x14*/ u16 optionsTextSpeed:3; ... optionsBattleSceneOff:1; regionMapZoom:1;
    /*0x18*/ struct Pokedex pokedex;
    /*0x90*/ u8 filler_90[0x8];
    /*0x98*/ struct Time localTimeOffset;
    /*0xA0*/ struct Time lastBerryTreeUpdate;
    /*0xA8*/ u32 gcnLinkFlags;       // Read by Pokémon Colosseum/XD
    /*0xAC*/ u32 encryptionKey;      // <-- CLAVE
    /*0xB0*/ struct PlayersApprentice playerApprentice;
    /*0xDC*/ struct Apprentice apprentices[APPRENTICE_COUNT];
    /*0x1EC*/ struct BerryCrush berryCrush;
    /*0x1FC*/ struct PokemonJumpRecords pokeJump;
    /*0x20C*/ struct BerryPickingResults berryPick;
    /*0x21C*/ struct RankingHall1P hallRecords1P[...];
    /*0x57C*/ struct RankingHall2P hallRecords2P[...];
    /*0x624*/ u16 contestLinkResults[...];
    /*0x64C*/ struct BattleFrontier frontier;
              u8 rivalName[PLAYER_NAME_LENGTH + 1];
}; // sizeof=0xF2C
```

| Dato | Offset | Tamaño | Formato |
|---|---|---|---|
| `playerName` | **`0x00`** | 8 B | charmap GBA (E/J), terminador `0xFF` |
| `playerGender` | `0x08` | 1 B | 0 = MALE, 1 = FEMALE |
| `playerTrainerId` | **`0x0A`** | 4 B | `u16 TID` @`0x0A` + `u16 SID` @`0x0C` |
| `playTimeHours` | `0x0E` | 2 B | |
| `pokedex` | `0x18` | `0x78` | |
| `gcnLinkFlags` | `0xA8` | 4 B | |
| **`encryptionKey`** | **`0xAC`** | **4 B `u32`** | regenerada en cada guardado |

**Perfil B:** `pokedexOffset = 0x1C`, `gcnLinkFlags = 0xB8`, **`encryptionKey = 0xBC`** (`sizeof = 0xF50`).
**La clave se relee en cada save** (`ApplyNewEncryptionKeyToAllEncryptedData`): el motor debe re-leerla cada vez, nunca cachearla entre sesiones.

## 1.4 `SaveBlock1` — equipo, dinero y estado

`include/global.h:1198-1323` (extracto con los offsets **reales de v2.0.6**, ya recalculados):

```c
struct SaveBlock1
{
             u16 saveVersion;              // 0x000  <-- PREPENDIDO (v2.0.6)
    /*0x00*/ struct Coords16 pos;          // 0x002
    /*0x04*/ struct WarpData location;     // 0x006
    /*0x0C*/ struct WarpData continueGameWarp;   // 0x00E
    /*0x14*/ struct WarpData dynamicWarp;        // 0x016
    /*0x1C*/ struct WarpData lastHealLocation;   // 0x01E
    /*0x24*/ struct WarpData escapeWarp;         // 0x026
    /*0x2C*/ u16 savedMusic;                     // 0x02E
    /*0x2E*/ u8 weather;                         // 0x030
    /*0x2F*/ u8 weatherCycleStage;               // 0x031
    /*0x30*/ u8 flashLevel;                      // 0x032
    /*0x32*/ u16 mapLayoutId;                    // 0x034
    /*0x34*/ u16 mapView[0x100];                 // 0x036 .. 0x236
    /*0x234*/ u8 playerPartyCount;               // 0x236  <-- 0x234 en perfil B
    /*0x238*/ struct Pokemon playerParty[PARTY_SIZE];  // 0x238 .. 0x490
    /*0x490*/ u32 money;                         // 0x490 (XOR con encryptionKey)
    /*0x494*/ u16 coins;                         // 0x494 (XOR truncado)
    /*0x496*/ u16 registeredItem;
    /*0x498*/ struct ItemSlot pcItems[PC_ITEMS_COUNT];  // 50 slots = 0xC8 -> 0x560
    /*0x560*/ struct Bag bag;                    // 0x560 .. 0xF94
    ...
};  // sizeof = 0x3CD0 (15568)
```

| Dato | Offset | Tamaño | Notas |
|---|---|---|---|
| `saveVersion` | `0x000` | 2 B | `5` en v2.0.6 |
| `playerPartyCount` | **`0x236`** (A) / **`0x234`** (B) | 1 B | máx. `PARTY_SIZE = 6` |
| `playerParty[0]` | **`0x238`** | **100 B** (`0x64`) c/u | 6 × 100 = `0x258` |
| `money` | **`0x490`** | 4 B | `valor ^ encryptionKey` |
| `coins` | **`0x494`** | 2 B | `valor ^ (u16)encryptionKey` |
| `registeredItem` | `0x496` | 2 B | **plaintext** |
| `pcItems[50]` | `0x498` | 200 B | 50 × `ItemSlot`(4 B) |
| `bag` | **`0x560`** | 2612 B (A) | ver §1.5 |
| `pokeblocks[40]` | `0xF94` | 280 B (7 B c/u) | `[DERIVADO]` |
| `flags[300]` | `≈0x1960` | 300 B | **`[DERIVADO ±4]`** — leer de `GFRomHeader.flagsOffset` |
| `vars[256]` | `≈0x1A8C` | 512 B | **`[DERIVADO]`** — leer de `GFRomHeader.varsOffset` |

> `flags`/`vars` no son necesarios para el motor de inyección de party/bag/PC, y su valor exacto **sólo es fiable leyéndolo del `GFRomHeader`** (§6). Perfil B verificado: `flagsOffset = 0x1364`, `varsOffset = 0x1490` (delta `0x12C` = 300 = `NUM_FLAG_BYTES`).

### `struct Pokemon` (party, 100 B) vs `struct BoxPokemon` (PC, 80 B)

`include/pokemon.h:255-296`:

```c
struct BoxPokemon          // sizeof = 0x50 (80)
{
    u32 personality;        // 0x00
    u32 otId;               // 0x04
    u8 nickname[10];        // 0x08  (min(10, POKEMON_NAME_LENGTH))
    u8 language:3;          // 0x12
    u8 hiddenNatureModifier:5;
    u8 isBadEgg:1;          // 0x13
    u8 hasSpecies:1;
    u8 isEgg:1;
    u8 blockBoxRS:1;
    u8 daysSinceFormChange:3;
    u8 unused_13:1;
    u8 otName[PLAYER_NAME_LENGTH];  // 0x14 (7 B)
    u8 markings:4;          // 0x1B
    u8 compressedStatus:4;
    u16 checksum;           // 0x1C
    u16 hpLost:14;          // 0x1E  (14 bits: 16383 HP)
    u16 shinyModifier:1;    // 0x1E bit 14  <-- EXCLUSIVO DE HnS
    u16 unused_1E:1;        // 0x1E bit 15
    union {
        u32 raw[12];                        // 0x20 .. 0x50  (48 B cifrados)
        union PokemonSubstruct substructs[4];
    } secure;
};

struct Pokemon             // sizeof = 0x64 (100)
{
    struct BoxPokemon box;  // 0x00 .. 0x50
    u32 status;             // 0x50
    u8 level;               // 0x54
    u8 mail;                // 0x55
    u16 hp;                 // 0x56
    u16 maxHP;              // 0x58
    u16 attack;             // 0x5A
    u16 defense;            // 0x5C
    u16 speed;              // 0x5E
    u16 spAttack;           // 0x60
    u16 spDefense;          // 0x62
};
```

> ⚠️ **No es Gen 3 vanilla.** En HnS v2.0.6 el campo `u16 @0x1E` se redefinió:
> `hpLost:14` + **`shinyModifier:1`** (bit 14) + `unused:1`. El `shinyModifier` es un XOR
> sobre la condición de shiny calculada por PID:
> `src/pokemon.c:4924` → `retVal = (shinyValue < SHINY_ODDS) ^ boxMon->shinyModifier;`
> `src/pokemon.c:5356` → `boxMon->shinyModifier = (shinyValue < SHINY_ODDS) ^ isShiny;`
> Un motor que escriba un Pokémon **debe** recalcular este bit o el shiny saldrá invertido.

## 1.5 La mochila (Bag) — offsets exactos, capacidades y `ItemSlot`

`include/global.h:763-767` y `1174-1188`:

```c
struct ItemSlot
{
    enum Item itemId;   // enum __attribute__((packed)) Item -> 2 BYTES
    u16 quantity;       // 2 BYTES (cifrado con XOR)
};                      // sizeof = 4

struct Bag
{
    struct ItemSlot items[BAG_ITEMS_COUNT];
#if I_COMBINE_BAG_POCKETS == FALSE
    struct ItemSlot treasures[BAG_TREASURES_COUNT];
#endif
    struct ItemSlot keyItems[BAG_KEYITEMS_COUNT];
    struct ItemSlot pokeBalls[BAG_POKEBALLS_COUNT];
    struct ItemSlot TMsHMs[BAG_TMHM_COUNT];
    struct ItemSlot berries[BAG_BERRIES_COUNT];
    struct ItemSlot medicine[BAG_MEDICINE_COUNT];
#if I_COMBINE_BAG_POCKETS == FALSE
    struct ItemSlot battleItems[BAG_BATTLE_ITEMS_COUNT];
#endif
};
```

Configuración activa — `include/config/item.h:55`:
```c
#define I_COMBINE_BAG_POCKETS       TRUE
```
Capacidades — `include/constants/global.h:122-127`:
```c
#define BAG_ITEMS_COUNT     (200 + 36)   // 236
#define BAG_KEYITEMS_COUNT  60
#define BAG_POKEBALLS_COUNT 39           // 29 + padding
#define BAG_TMHM_COUNT      160          // 110 + padding
#define BAG_BERRIES_COUNT   66           // 46 + padding
#define BAG_MEDICINE_COUNT  (60 + 32)    // 92
#define PC_ITEMS_COUNT      50           // global.h:102
```

### Tabla maestra de bolsillos — PERFIL A (`bag` @ `0x560`)

| Bolsillo | `POCKET_*` | Offset absoluto en SaveBlock1 | `maxSlots` | Bytes |
|---|---|---|---|---|
| Ítems | `POCKET_ITEMS = 0` | **`0x0560`** | **236** | 944 (`0x3B0`) |
| Objetos Clave | `POCKET_KEY_ITEMS = 5` | **`0x0910`** | **60** | 240 (`0x0F0`) |
| Poké Balls | `POCKET_POKE_BALLS = 2` | **`0x0A00`** | **39** | 156 (`0x09C`) |
| MTs/MOs | `POCKET_TM_HM = 3` | **`0x0A9C`** | **160** | 640 (`0x280`) |
| Bayas | `POCKET_BERRIES = 4` | **`0x0D1C`** | **66** | 264 (`0x108`) |
| Medicinas | `POCKET_MEDICINE = 1` | **`0x0E24`** | **92** | 368 (`0x170`) |
| — fin de `bag` — | | **`0x0F94`** | | 2612 (`0xA34`) |

`POCKET_TREASURES` y `POCKET_BATTLE_ITEMS` **no existen como bolsillos propios** cuando `I_COMBINE_BAG_POCKETS == TRUE`; se mapean a `POCKET_ITEMS` / `POCKET_MEDICINE` (`include/constants/item.h:18-19`).

**Estructura de cada slot (4 bytes):**
```
+0x00  u16  itemId     (enum Item empaquetado a 2 bytes)  -> PLAINTEXT
+0x02  u16  quantity   ->  quantity ^ (u16)encryptionKey
```
El orden de los bolsillos en memoria **no** coincide con el orden del enum: `SetBagItemsPointers()` (`src/item.c:152-180`) los enlaza por nombre.

### Tabla de bolsillos — PERFIL B (ROM desplegada, `GFRomHeader`)

| Bolsillo | Offset | `maxSlots` |
|---|---|---|
| Ítems | `0x0560` | **90** |
| Clave | `0x06C8` | **30** |
| Poké Balls | `0x0740` | **16** |
| MTs/MOs | `0x0780` | **64** |
| Bayas | `0x0880` | **46** |
| (fin de bag) | `0x0938` | — |

> En el build antiguo hay además los bolsillos separados `treasures` y `battleItems`; el `GFRomHeader` no los expone, por lo que su presencia debe inferirse del tamaño del bloque.

## 1.6 `PokemonStorage` — PC Boxes

`include/pokemon_storage_system.h:20-27`:

```c
struct PokemonStorage
{
    /*0x0000*/ u8 currentBox;
    /*0x0001*/ struct BoxPokemon boxes[TOTAL_BOXES_COUNT][IN_BOX_COUNT];
    /*0x8344*/ u8 boxNames[TOTAL_BOXES_COUNT][BOX_NAME_LENGTH + 1];
    /*0x83C2*/ u8 boxWallpapers[TOTAL_BOXES_COUNT];
    /*0x8432*/ struct Pokemon fusions[MAX_FUSION_STORAGE];
};   // sizeof = 0x8560 (34144)
```

Constantes: `TOTAL_BOXES_COUNT = 14`, `IN_BOX_COUNT = 30`, `BOX_NAME_LENGTH = 8`, `MAX_FUSION_STORAGE = 4`.

> El comentario `/*0x0001*/` del header es **obsoleto**: `BoxPokemon` tiene `alignof = 4` (contiene `u32`), así que `boxes` arranca en **`0x0004`**. Verificación: `0x0004 + 14*30*80 = 0x8344` = offset real de `boxNames`. ✔

| Campo | Offset (PERFIL A) | Tamaño |
|---|---|---|
| `currentBox` | **`0x0000`** | 1 B (0..13) |
| `boxes[0][0]` | **`0x0004`** | `BoxPokemon` de **80 B** |
| `boxNames[14][9]` | `0x8344` | 126 B |
| `boxWallpapers[14]` | `0x83C2` | 14 B |
| `fusions[4]` | `0x83D0` | 400 B (`4 × 100`) |
| **`sizeof`** | **`0x8560`** | 34144 |

### Fórmula de direccionamiento

```ts
// storageOffset = offset del bloque PokemonStorage dentro del .sav
// (sección 5..13 concatenadas SIN los footers)
const boxMonOffset = 0x0004 + (box * 30 + slot) * 0x50;   // 0x50 = 80
const abs = storageBase + boxMonOffset;
```

## 1.7 Ensamblado del bloque desde el `.sav`

```ts
function assembleBlock(view: DataView, sections: SectionMap, ids: number[], totalSize: number): Uint8Array {
  const out = new Uint8Array(totalSize);
  let dst = 0;
  for (const id of ids) {
    const s = sections.get(id)!;
    const src = s.sector * 0x1000;
    out.set(new Uint8Array(view.buffer, src, s.size).subarray(0, Math.min(s.size, totalSize - dst)), dst);
    dst += s.size;
  }
  return out;
}
// SB2      = assembleBlock(view, sections, [0],        0x0F2C)
// SB1      = assembleBlock(view, sections, [1,2,3,4],  0x3CD0)
// storage  = assembleBlock(view, sections, [5..13],    0x8560)
```

## 1.8 Dónde viven `gPlayerParty` y `gPlayerPartyCount`

**No están en `SaveBlock1` del todo.** `gPlayerPartyCount` y `gPlayerParty` son símbolos **EWRAM** (`src/pokemon.c:116` → `EWRAM_DATA struct Pokemon gPlayerParty[PARTY_SIZE] = {0};`) que el juego sincroniza con `SaveBlock1` al guardar.

- **Ruta `.sav` (recomendada para inyección offline):** `SaveBlock1 + 0x236` (count) y `SaveBlock1 + 0x238` (array de 6 × 100 B). Tras inyectar hay que **recalcular el checksum del sector** (§2.1) o el save se rechaza.
- **Ruta EWRAM (en caliente, mGBA-wasm):** hay que obtener las direcciones del `.sym` del build o hacer un *pattern scan*. Sin toolchain no se pueden fijar aquí; **`[PENDIENTE: requiere `pokehns.sym`]`**. Patrón sugerido: localizar en EWRAM una zona con 6 `BoxPokemon` consecutivos cuyo `checksum` (`u16@0x1C`) cuadre con la suma de sus 12 words descifradas.

---

# SECCIÓN 2 — ALGORITMOS DE INTEGRIDAD Y CIFRADO

## 2.1 Checksum de sector

`src/save.c:696-708` (código real, sin modificar):

```c
static u16 CalculateChecksum(void *data, u16 size)
{
    u16 i;
    u32 checksum = 0;

    for (i = 0; i < (size / 4); i++)
    {
        checksum += *((u32 *)data);
        data += sizeof(u32);
    }

    return ((checksum >> 16) + checksum);
}
```

**Matemática exacta:**
```
S  = ( Σ_{i=0}^{size/4 - 1} LE_u32(data + 4i) )  mod 2^32
CK = (u16)( (S >>> 16) + S )        // truncado a 16 bits: el carry se DESCARTA
```

Tres trampas que rompen implementaciones ingenuas:

1. `checksum` acumula en `u32` → **overflow modular a 32 bits** durante la suma.
2. La suma final `(hi + lo)` **puede superar 16 bits**; el `return` a `u16` **trunca y pierde el carry**. Hay que enmascarar con `& 0xFFFF`, no volver a plegar.
3. Sólo se recorren `size / 4` words → `size` **debe ser múltiplo de 4**. Todos los `size` de sección lo son (`0x0F2C`, `0x0F80`, `0x0E50`, `0x0960`).

Se escribe en el footer (`src/save.c:224`):
```c
gReadWriteSector->checksum = CalculateChecksum(data, size);
```

```ts
export function calculateChecksum(buf: Uint8Array, offset: number, size: number): number {
  const dv = new DataView(buf.buffer, buf.byteOffset + offset, size);
  let sum = 0 >>> 0;
  for (let i = 0; i < (size >>> 2); i++) {
    sum = (sum + dv.getUint32(i * 4, true)) >>> 0;   // overflow u32
  }
  return (((sum >>> 16) + sum) & 0xFFFF) >>> 0;      // truncado a u16
}
```

**Validación empírica:** este algoritmo reproduce byte a byte los checksums de los 14 sectores de `scratch_fixed.sav` (`0x9D33`, `0x12BA`, `0xC222`, `0x3E7C`, `0x591D`, …). ✔

## 2.2 Cifrado de dinero, monedas y cantidades

### Dinero — `src/money.c:119-127`
```c
u32 GetMoney(u32 *moneyPtr) { return *moneyPtr ^ gSaveBlock2Ptr->encryptionKey; }
void SetMoney(u32 *moneyPtr, u32 newValue) { *moneyPtr = gSaveBlock2Ptr->encryptionKey ^ newValue; }
```
→ XOR de **32 bits** completo sobre `u32 @ SaveBlock1+0x490`.

### Monedas — `src/coins.c:41-49`
```c
u16 GetCoins(void) { return gSaveBlock1Ptr->coins ^ gSaveBlock2Ptr->encryptionKey; }
void SetCoins(u16 coinAmount) { gSaveBlock1Ptr->coins = coinAmount ^ gSaveBlock2Ptr->encryptionKey; }
```
→ El `u16` se promociona a `u32`, se XORea y **se trunca a 16 bits**. Equivale a `coins ^ (key & 0xFFFF)`.

### Cantidad de ítems — `src/item.c:65-83`
```c
return (struct ItemSlot) {
    .itemId   = pocket->itemSlots[pocketPos].itemId,                              // PLAINTEXT
    .quantity = pocket->itemSlots[pocketPos].quantity ^ gSaveBlock2Ptr->encryptionKey,
};
...
pocket->itemSlots[pocketPos].itemId   = newSlot.itemId;
pocket->itemSlots[pocketPos].quantity = newSlot.quantity ^ gSaveBlock2Ptr->encryptionKey;
```
→ **Sólo `quantity`** se cifra (XOR con el `u16` bajo de la clave). `itemId` va en claro.
→ Los **PC items** usan las variantes `BagPocket_GetSlotDataPC` / `SetSlotDataPC` (`src/item.c:73-77`): **sin cifrar**. ¡`pcItems[50] @0x498` es plaintext!

```ts
const key = dv.getUint32(sb2 + 0xAC, true);
const money = (dv.getUint32(sb1 + 0x490, true) ^ key) >>> 0;
const coins = (dv.getUint16(sb1 + 0x494, true) ^ (key & 0xFFFF)) & 0xFFFF;
const qty   = (dv.getUint16(slot + 0x02, true) ^ (key & 0xFFFF)) & 0xFFFF;
```

## 2.3 `struct BoxPokemon` — 4 subestructuras cifradas

### Cifrado — `src/pokemon.c:4332-4348`
```c
static void EncryptBoxMon(struct BoxPokemon *boxMon)
{
    for (u32 i = 0; i < ARRAY_COUNT(boxMon->secure.raw); i++)
    {
        boxMon->secure.raw[i] ^= boxMon->personality;
        boxMon->secure.raw[i] ^= boxMon->otId;
    }
}

static void DecryptBoxMon(struct BoxPokemon *boxMon)
{
    for (u32 i = 0; i < ARRAY_COUNT(boxMon->secure.raw); i++)
    {
        boxMon->secure.raw[i] ^= boxMon->otId;
        boxMon->secure.raw[i] ^= boxMon->personality;
    }
}
```
`ARRAY_COUNT(boxMon->secure.raw) = 12` words → **48 bytes** en `BoxPokemon+0x20 .. +0x50`, cifrados con `personality ^ otId` (XOR conmutativo, el orden no importa).

### Checksum del Pokémon — `src/pokemon.c:3704-3725`
```c
static u16 CalculateBoxMonChecksum(struct BoxPokemon *boxMon)
{
    u32 checksum = 0;
    for (u32 i = 0; i < ARRAY_COUNT(boxMon->secure.raw); i++)
        checksum += boxMon->secure.raw[i] + (boxMon->secure.raw[i] >> 16);
    return checksum;
}
```
Se calcula sobre los 12 words **ya descifrados** y se almacena en `BoxPokemon+0x1C`.

### Orden de las 4 subestructuras — `src/pokemon.c:4350-4358`
```c
static const u8 sSubstructOffsets[4][24] =
{
    [SUBSTRUCT_TYPE_0] = {0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 2, 3, 1, 1, 2, 3, 2, 3, 1, 1, 2, 3, 2, 3},
    [SUBSTRUCT_TYPE_1] = {1, 1, 2, 3, 2, 3, 0, 0, 0, 0, 0, 0, 2, 3, 1, 1, 3, 2, 2, 3, 1, 1, 3, 2},
    [SUBSTRUCT_TYPE_2] = {2, 3, 1, 1, 3, 2, 2, 3, 1, 1, 3, 2, 0, 0, 0, 0, 0, 0, 3, 2, 3, 2, 1, 1},
    [SUBSTRUCT_TYPE_3] = {3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0},
};

ARM_FUNC NOINLINE static u32 ConstantMod24(u32 a) { return a % 24; }

static union PokemonSubstruct *GetSubstruct(struct BoxPokemon *boxMon, u32 personality, enum SubstructType substructType)
{
    return &boxMon->secure.substructs[sSubstructOffsets[substructType][ConstantMod24(personality)]];
}
```

`sSubstructOffsets[tipo][personality % 24]` devuelve el **índice de slot** donde vive esa subestructura. La tabla **inversa** (la que necesita el motor: `slot -> tipo`) es:

| `p = PID % 24` | slot0 | slot1 | slot2 | slot3 |
|---|---|---|---|---|
| 0 | 0 | 1 | 2 | 3 |
| 1 | 0 | 1 | 3 | 2 |
| 2 | 0 | 2 | 1 | 3 |
| 3 | 0 | 3 | 1 | 2 |
| 4 | 0 | 2 | 3 | 1 |
| 5 | 0 | 3 | 2 | 1 |
| 6 | 1 | 0 | 2 | 3 |
| 7 | 1 | 0 | 3 | 2 |
| 8 | 2 | 0 | 1 | 3 |
| 9 | 3 | 0 | 1 | 2 |
| 10 | 2 | 0 | 3 | 1 |
| 11 | 3 | 0 | 2 | 1 |
| 12 | 1 | 2 | 0 | 3 |
| 13 | 1 | 3 | 0 | 2 |
| 14 | 2 | 1 | 0 | 3 |
| 15 | 3 | 1 | 0 | 2 |
| 16 | 2 | 3 | 0 | 1 |
| 17 | 3 | 2 | 0 | 1 |
| 18 | 1 | 2 | 3 | 0 |
| 19 | 1 | 3 | 2 | 0 |
| 20 | 2 | 1 | 3 | 0 |
| 21 | 3 | 1 | 2 | 0 |
| 22 | 2 | 3 | 1 | 0 |
| 23 | 3 | 2 | 1 | 0 |

### Layout de las subestructuras (12 B cada una, `include/pokemon.h:129-227`)

Cada slot ocupa 12 bytes dentro de `secure`: `slot0 @+0x20`, `slot1 @+0x2C`, `slot2 @+0x38`, `slot3 @+0x44`.

**Tipo 0 — Growth** (`struct PokemonSubstruct0`)
| Offset | Bits | Campo |
|---|---|---|
| `+0x00` | `u16` bits 0..10 | `species:11` (2047 especies) |
| `+0x00` | `u16` bits 11..15 | `teraType:5` (`enum Type`) |
| `+0x02` | `u16` bits 0..9 | `heldItem:10` |
| `+0x02` | `u16` bits 10..15 | `unused_02:6` |
| `+0x04` | `u32` bits 0..20 | `experience:21` |
| `+0x04` | `u32` bits 21..28 | `nickname11:8` |
| `+0x04` | `u32` bits 29..31 | `unused_04:3` |
| `+0x08` | `u8` | `ppBonuses` |
| `+0x09` | `u8` | `friendship` |
| `+0x0A` | `u16` bits 0..5 | `pokeball:6` |
| `+0x0A` | `u16` bits 6..13 | `nickname12:8` |
| `+0x0A` | `u16` bits 14..15 | `unused_0A:2` |

**Tipo 1 — Attacks** (`struct PokemonSubstruct1`)
| Offset | Bits | Campo |
|---|---|---|
| `+0x00` | bits 0..10 | `move1:11` |
| `+0x00` | bits 11..15 | `evolutionTracker1:5` |
| `+0x02` | bits 0..10 | `move2:11` |
| `+0x02` | bits 11..15 | `evolutionTracker2:5` |
| `+0x04` | bits 0..10 | `move3:11` |
| `+0x04` | bits 11..15 | `unused_04:5` |
| `+0x06` | bits 0..10 | `move4:11` |
| `+0x06` | bits 11..13 | `unused_06:3` |
| `+0x06` | bit 14 | `hyperTrainedHP:1` |
| `+0x06` | bit 15 | `hyperTrainedAttack:1` |
| `+0x08` | bits 0..6 | `pp1:7` (127 PP) |
| `+0x08` | bit 7 | `hyperTrainedDefense:1` |
| `+0x09` | bits 0..6 / bit 7 | `pp2` / `hyperTrainedSpeed` |
| `+0x0A` | bits 0..6 / bit 7 | `pp3` / `hyperTrainedSpAttack` |
| `+0x0B` | bits 0..6 / bit 7 | `pp4` / `hyperTrainedSpDefense` |

**Tipo 2 — EVs/Condition** (`struct PokemonSubstruct2`, todo `u8`)
`+0x00 hpEV`, `+0x01 attackEV`, `+0x02 defenseEV`, `+0x03 speedEV`, `+0x04 spAttackEV`, `+0x05 spDefenseEV`, `+0x06 cool`, `+0x07 beauty`, `+0x08 cute`, `+0x09 smart`, `+0x0A tough`, `+0x0B sheen`.

**Tipo 3 — Misc** (`struct PokemonSubstruct3`)
| Offset | Bits | Campo |
|---|---|---|
| `+0x00` | `u8` | `pokerus` |
| `+0x01` | `u8` | `metLocation` |
| `+0x02` | `u16` bits 0..6 | `metLevel:7` |
| `+0x02` | bits 7..10 | `metGame:4` |
| `+0x02` | bits 11..14 | `dynamaxLevel:4` |
| `+0x02` | bit 15 | `otGender:1` |
| `+0x04` | `u32` bits 0..4 | `hpIV:5` |
| `+0x04` | bits 5..9 | `attackIV:5` |
| `+0x04` | bits 10..14 | `defenseIV:5` |
| `+0x04` | bits 15..19 | `speedIV:5` |
| `+0x04` | bits 20..24 | `spAttackIV:5` |
| `+0x04` | bits 25..29 | `spDefenseIV:5` |
| `+0x04` | bit 30 | `isEgg:1` |
| `+0x04` | bit 31 | `gigantamaxFactor:1` |
| `+0x08` | bits 0..14 | `coolRibbon:3, beautyRibbon:3, cuteRibbon:3, smartRibbon:3, toughRibbon:3` |
| `+0x08` | bit 15 | `championRibbon` |
| `+0x08` | bit 16 | `winningRibbon` |
| `+0x08` | bit 17 | `victoryRibbon` |
| `+0x08` | bit 18 | `artistRibbon` |
| `+0x08` | bit 19 | `effortRibbon` |
| `+0x08` | bits 20..26 | `marine/land/sky/country/national/earth/world` (7 ribbons) |
| `+0x08` | bit 27 | `isShadow:1` |
| `+0x08` | bit 28 | `unused_0B:1` |
| `+0x08` | bits 29..30 | **`abilityNum:2`** |
| `+0x08` | bit 31 | `modernFatefulEncounter:1` |

> **La habilidad NO es un ID.** El juego guarda `abilityNum` (0/1/2 = slot de habilidad normal / oculta) y resuelve el ID real consultando `gSpeciesInfo[species].abilities[abilityNum]`.

### Desencriptado completo en TS

```ts
const SUBSTRUCT_ORDER: number[][] = [ /* tabla inversa de 24 filas x 4, arriba */ ];

export function readBoxMon(buf: Uint8Array, off: number) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const pid = dv.getUint32(off + 0x00, true);
  const otId = dv.getUint32(off + 0x04, true);
  const key = (pid ^ otId) >>> 0;

  // 1) copiar y descifrar los 48 bytes
  const secure = new Uint8Array(48);
  secure.set(buf.subarray(off + 0x20, off + 0x50));
  const sdv = new DataView(secure.buffer);
  for (let i = 0; i < 12; i++) sdv.setUint32(i * 4, (sdv.getUint32(i * 4, true) ^ key) >>> 0, true);

  // 2) checksum de integridad
  let sum = 0;
  for (let i = 0; i < 12; i++) { const w = sdv.getUint32(i * 4, true); sum = (sum + w + (w >>> 16)) >>> 0; }
  const valid = (sum & 0xFFFF) === dv.getUint16(off + 0x1C, true);

  // 3) reordenar subestructuras
  const order = SUBSTRUCT_ORDER[pid % 24];
  const sub = (type: number) => secure.subarray(order.indexOf(type) * 12, order.indexOf(type) * 12 + 12);

  const g = new DataView(sub(0).buffer, sub(0).byteOffset, 12);   // growth
  const species = g.getUint16(0, true) & 0x7FF;
  const teraType = (g.getUint16(0, true) >>> 11) & 0x1F;
  const heldItem = g.getUint16(2, true) & 0x3FF;
  const exp = g.getUint32(4, true) & 0x1FFFFF;

  const a = sub(1), m = sub(3);
  const move1 = (a[0] | (a[1] << 8)) & 0x7FF;
  const ivs = m[4] | (m[5] << 8) | (m[6] << 16) | (m[7] << 24);
  const abilityNum = (ivs >>> 29) & 0x3;
  const iv = (i: number) => (ivs >>> (i * 5)) & 0x1F;

  return { pid, otId, species, teraType, heldItem, exp, move1, abilityNum,
           ivs: [iv(0), iv(1), iv(2), iv(3), iv(4), iv(5)], valid };
}
```

---

# SECCIÓN 3 — CATÁLOGOS DE CONSTANTES (CHEATSHEET)

## 3.1 Ítems — `include/constants/items.h`

```c
enum __attribute__((packed)) Item     // <-- PACKED: 2 BYTES, no 4
{
    ITEM_NONE = 0,
    ITEM_POKE_BALL = 1,  ITEM_GREAT_BALL = 2,  ITEM_ULTRA_BALL = 3,  ITEM_MASTER_BALL = 4,
    ...
    ITEM_AZURE_FLUTE,        // = 900  (último ítem)
    ITEMS_COUNT,             // = 901
    ITEM_FIELD_ARROW = ITEMS_COUNT,
};
```

| Rango | Valor |
|---|---|
| `ITEM_NONE` | `0` |
| Primer ítem real | `1` |
| Último ítem (`ITEM_AZURE_FLUTE`) | **`900`** |
| **`ITEMS_COUNT`** | **`901`** |
| Capacidad de campo `itemId` | 10 bits (Substruct0) / 16 bits (`ItemSlot`) → hasta 65535 |

### IDs clave

| Ítem | ID | Ítem | ID |
|---|---|---|---|
| `ITEM_POKE_BALL` | `1` | `ITEM_LEFTOVERS` | `472` |
| `ITEM_GREAT_BALL` | `2` | `ITEM_LIFE_ORB` | `479` |
| `ITEM_ULTRA_BALL` | `3` | `ITEM_FOCUS_SASH` | `481` |
| **`ITEM_MASTER_BALL`** | **`4`** | `ITEM_EVIOLITE` | `494` |
| `ITEM_POTION` | `28` | `ITEM_ROCKY_HELMET` | `496` |
| `ITEM_SUPER_POTION` | `29` | `ITEM_ASSAULT_VEST` | `503` |
| `ITEM_HYPER_POTION` | `30` | `ITEM_CHOICE_BAND` | `442` |
| `ITEM_MAX_POTION` | `31` | `ITEM_CHOICE_SPECS` | `443` |
| **`ITEM_FULL_RESTORE`** | **`32`** | `ITEM_CHOICE_SCARF` | `444` |
| `ITEM_REVIVE` | `33` | `ITEM_EXP_SHARE` | `461` |
| `ITEM_MAX_REVIVE` | `34` | `ITEM_AMULET_COIN` | `466` |
| **`ITEM_SACRED_ASH`** | **`54`** | `ITEM_LUCKY_EGG` | `470` |
| `ITEM_ABILITY_CAPSULE` | `79` | `ITEM_EVERSTONE` | `245` |
| `ITEM_ABILITY_PATCH` | `80` | `ITEM_MACH_BIKE` | `707` |
| **`ITEM_RARE_CANDY`** | **`102`** | `ITEM_SS_TICKET` | `727` |
| **`ITEM_HEART_SCALE`** | **`152`** | `ITEM_GS_BALL` | `875` |
| Mints (25 naturalezas) | `81`..`101` | `ITEM_ENIGMA_BERRY` | `574` |

**Mints** (orden = orden de naturaleza, `81 + NATURE_*`):
`LONELY 81, ADAMANT 82, NAUGHTY 83, BRAVE 84, BOLD 85, IMPISH 86, LAX 87, RELAXED 88, MODEST 89, MILD 90, RASH 91, QUIET 92, CALM 93, GENTLE 94, CAREFUL 95, SASSY 96, TIMID 97, HASTY 98, JOLLY 99, NAIVE 100, SERIOUS 101`.

Límites de cantidad: `MAX_BAG_ITEM_CAPACITY 999`, `MAX_PC_ITEM_CAPACITY 999`, `MAX_PYRAMID_BAG_ITEM_CAPACITY 99`.

## 3.2 Especies — `include/constants/species.h`

Son `#define`, **no** un enum, y siguen el orden de la Pokédex Nacional de Gen 1 → Gen 9 + formas:

| Hito | Valor |
|---|---|
| `SPECIES_NONE` | `0` |
| `SPECIES_BULBASAUR` | `1` |
| `SPECIES_CHIKORITA` | `152` |
| `SPECIES_TREECKO` | `252` |
| `SPECIES_TURTWIG` | `387` |
| `SPECIES_VICTINI` | `494` |
| `SPECIES_CHESPIN` | `650` |
| `SPECIES_SPRIGATITO` | `1289` |
| `SPECIES_PECHARUNT` | `1434` |
| `SPECIES_GLIMMORA_MEGA` | `1572` |
| **`SPECIES_EGG`** | **`1573`** (`SPECIES_GLIMMORA_MEGA + 1`) |
| **`NUM_SPECIES`** | **`SPECIES_EGG` = 1573`** |

> **Marcador de fin: `SPECIES_EGG` / `NUM_SPECIES` = 1573.** Las formas Mega, regionales y de Génesis se añaden **después** de la especie base con IDs propios, así que el ID **no** es correlativo con la dex.
> El campo `species:11` admite hasta 2047 → hay margen para 474 especies más.

## 3.3 Naturalezas — `include/constants/pokemon.h`

```c
#define NATURE_HARDY    0   // Neutral
#define NATURE_LONELY   1   // +Atk -Def
...
#define NATURE_QUIRKY   24  // Neutral
#define NUM_NATURES     25
#define NATURE_RANDOM            NUM_NATURES        // 25 (sentinela para scripts)
#define NATURE_MAY_SYNCHRONIZE   NUM_NATURES + 1    // 26
```
La naturaleza **no se almacena**: se deriva de `personality % 25`. Excepción HnS: `BoxPokemon.hiddenNatureModifier:5` (bitfield en `+0x12`) permite forzar una naturaleza distinta de la del PID.

## 3.4 Habilidades — `include/constants/abilities.h`

```c
enum {
    ABILITY_NONE = 0,
    ABILITY_STENCH = 1,
    ...
    ABILITY_TERAFORM_ZERO = 309,
    ABILITY_POISON_PUPPETEER = 310,
    ABILITIES_COUNT_GEN9,                 // 311
    ABILITIES_COUNT = ABILITIES_COUNT_GEN9,
};
```
Rango válido: `0..310`; `ABILITIES_COUNT = 311`.

## 3.5 Tipos — `include/constants/pokemon.h:5-26`

```c
enum __attribute__((packed)) Type
{
    TYPE_NONE = 0,   TYPE_NORMAL = 1,  TYPE_FIGHTING = 2, TYPE_FLYING = 3,
    TYPE_POISON = 4, TYPE_GROUND = 5,  TYPE_ROCK = 6,     TYPE_BUG = 7,
    TYPE_GHOST = 8,  TYPE_STEEL = 9,   TYPE_MYSTERY = 10, TYPE_FIRE = 11,
    TYPE_WATER = 12, TYPE_GRASS = 13,  TYPE_ELECTRIC = 14, TYPE_PSYCHIC = 15,
    TYPE_ICE = 16,   TYPE_DRAGON = 17, TYPE_DARK = 18,
    TYPE_FAIRY = 19,       // <-- Fairy presente (Gen 6+)
    TYPE_STELLAR = 20,     // <-- Stellar (Gen 9)
    NUMBER_OF_MON_TYPES    // 21
};
```
`enum Type` es **packed** → 1 byte. `teraType:5` en Substruct0 soporta los 21 valores.

## 3.6 Otras constantes de layout

| Constante | Valor | Archivo |
|---|---|---|
| `PARTY_SIZE` | `6` | `constants/global.h:85` |
| `PLAYER_NAME_LENGTH` | `7` | `constants/global.h` |
| `TRAINER_ID_LENGTH` | `4` | `constants/global.h` |
| `POKEMON_NAME_LENGTH` | `10` | `constants/global.h` |
| `PC_ITEMS_COUNT` | `50` | `constants/global.h:102` |
| `OBJECT_EVENTS_COUNT` | `16` | `constants/global.h:98` |
| `OBJECT_EVENT_TEMPLATES_COUNT` | `64` | `constants/global.h:103` |
| `POKEBLOCKS_COUNT` | `40` | `constants/global.h:97` |
| `SECRET_BASES_COUNT` | `20` | `constants/global.h:100` |
| `MAIL_COUNT` | `16` (`10 + PARTY_SIZE`) | `constants/global.h:99` |
| `MAX_REMATCH_ENTRIES` | `100` | `constants/global.h:108` |
| `ROAMER_COUNT` | `4` (o `1`) | `constants/global.h:115` |
| `VARS_COUNT` | `256` (`VARS_END 0x40FF - VARS_START 0x4000 + 1`) | `constants/vars.h:281` |
| `NUM_GAME_STATS` | `64` | `constants/game_stat.h:59` |
| `BERRY_TREES_COUNT` | `128` | `constants/berry.h:187` |
| `NUM_FLAG_BYTES` | `300` (`ROUND_BITS_TO_BYTES(FLAGS_COUNT)`) | `global.h:143` |
| `TOTAL_BOXES_COUNT` | `14` | `pokemon_storage_system.h` |
| `IN_BOX_COUNT` | `30` | `pokemon_storage_system.h` |
| `MAX_FUSION_STORAGE` | `4` | `pokemon_storage_system.h` |

---

# SECCIÓN 4 — MAPA DEL PROYECTO PARA PERSONALIZACIÓN

## 4.1 Balance y configuración central

Todo vive en **`include/config/*.h`** (22 archivos). Cada flag es un `#define` que se cambia a `TRUE`/`FALSE` o a una generación (`GEN_3`, `GEN_7`, `GEN_LATEST`).

| Archivo | Qué controla | Flags clave |
|---|---|---|
| `include/config/battle.h` | Mecánicas de combate | `B_CRIT_CHANCE`, `B_CRIT_MULTIPLIER`, `B_PARALYSIS_SPEED`, `B_CONFUSION_SELF_DMG_CHANCE`, `B_EXP_CATCH`, `B_SPLIT_EXP`, `B_BADGE_BOOST`, `B_RECALCULATE_STATS`, `B_BURN_DAMAGE` |
| `include/config/pokemon.h` | Especies, evoluciones, crianza | `P_UPDATED_TYPES`, `P_UPDATED_STATS`, `P_UPDATED_ABILITIES`, `P_UPDATED_EVS`, `P_UPDATED_EXP_YIELDS`, `P_LVL_UP_LEARNSETS`, `P_EGG_HATCH_LEVEL`, `P_NATURE_INHERITANCE`, `P_GENDER_DIFFERENCES` |
| `include/config/item.h` | Mochila e ítems | **`I_COMBINE_BAG_POCKETS`** (`TRUE` → 6 bolsillos), `I_...` |
| `include/config/save.h` | **Layout del save** | `FREE_EXTRA_SEEN_FLAGS_SAVEBLOCK1 TRUE`, `FREE_TRAINER_HILL FALSE`, `FREE_TRAINER_TOWER FALSE`, `FREE_MYSTERY_EVENT_BUFFERS TRUE`, `FREE_MATCH_CALL FALSE`, `FREE_UNION_ROOM_CHAT FALSE`, `FREE_ENIGMA_BERRY TRUE`, `FREE_LINK_BATTLE_RECORDS FALSE`, `FREE_MYSTERY_GIFT TRUE`, `FREE_POKEMON_JUMP FALSE`, `FREE_RECORD_MIXING_HALL_RECORDS FALSE`, `FREE_BATTLE_TOWER_E_READER FALSE`, `FREE_EXTRA_SEEN_FLAGS_SAVEBLOCK2 FALSE` |
| `include/config/overworld.h` | Overworld | seguidores, clima, etc. |
| `include/config/ai.h` | IA de entrenadores | |
| `include/config/debug.h` | Menú debug | |
| `include/config/randomizer.h` | Randomizer | |
| `include/config/dexnav.h` / `pokedex_plus_hgss.h` | Pokédex | |
| `include/config/follower_npc.h` | **`FNPC_ENABLE_NPC_FOLLOWERS`** | afecta a `SaveBlock3` |
| `include/config/contest.h`, `fishing.h`, `caps.h`, `name_box.h`, `summary_screen.h`, `text.h`, `test.h`, `species_enabled.h`, `pokerus.h` | subsistemas | |

> ⚠️ **`include/config/save.h` es el archivo que MUEVE LOS OFFSETS.** Cambiar cualquiera de esos `FREE_*` altera `sizeof(SaveBlock1)`/`sizeof(SaveBlock2)` y por tanto los offsets de `flags`, `vars`, `dexSeen`, etc. `test/save.c` fallará en CI si eso ocurre — es el *canary* oficial.

## 4.2 Mapas y eventos (Porymap + Poryscript)

| Qué | Ruta |
|---|---|
| Mapas (1499 directorios) | **`data/maps/<NombreMapa>/`** |
| Scripts de evento por mapa | `data/maps/<NombreMapa>/scripts.inc` (o `.pory`) |
| Metadatos del mapa | `data/maps/<NombreMapa>/map.json` |
| Objetos / warps / triggers | `data/maps/<NombreMapa>/events.inc` o en `map.json` |
| Layouts de tiles | `data/layouts/<NombreLayout>/` (`border.bin`, `map.bin`) |
| Tilesets | `data/tilesets/{primary,secondary}/...` |
| Scripts globales | `data/scripts/*.inc` (~90 archivos: `new_game.inc`, `field_move_scripts.inc`, `specials.inc`, …) |
| Tabla de comandos de script | `data/script_cmd_table.inc` |
| Mapas Johto (sufijo `_hns`) | `NewBarkTown_*_hns`, `CherrygroveCity_hns`, `AzaleaTown_hns`, `GoldenrodCity_*_hns`, `BurnedTower_*_hns`, … |
| Mapas Kanto (sufijo `_hns`) | `MtMoon_Cave_hns`, `Route14_hns`, `VictoryRoadKanto_1F_hns`, `IndigoPlateau_*_hns`, … |
| Mapas Alola | `AkalaIsle_hns`, `Melemele_House_hns`, `AlolaWater_hns`, … |
| Config del proyecto Porymap | `porymap.project.cfg` / `poryscript-plugins.toml` (en la raíz del repo) |

### Encuentros salvajes
**`src/data/wild_encounters.json`** — JSON con `wild_encounter_groups`, tasas por tipo y `for_maps: true`.
Estructura de tasas por defecto:
- `land_mons`: `[20,20,10,10,10,10,5,5,4,4,1,1]` (12 slots)
- `water_mons` / `rock_smash_mons` / `fishing_mons`: `[60,30,5,4,1]` (5 slots)

Se compila a C con `tools/wild_encounters` (dir `tools/wild_encounters`).

### Entrenadores y equipos
| Archivo | Formato | Contenido |
|---|---|---|
| **`src/data/trainers.party`** | texto (`trainerproc`) | entrenadores base |
| **`src/data/trainers_hns.party`** | texto (`trainerproc`) | **entrenadores propios de HnS** (`=== TRAINER_SAWYER_1_HNS ===`, `Class: Hiker Hns`, `Pic: Hiker`, `Music: Hg Suspicious 2`, `AI: Check Bad Move`) |
| `src/data/trainers_frlg.party` | texto | entrenadores de FRLG |
| `src/data/debug_trainers.party` | texto | equipo del menú debug |
| `src/data/trainer_parties.h` | C generado | salida de `trainerproc` |
| `src/data/battle_partners.party` | texto | compañeros multijugador |
| `src/data/party_menu.h`, `src/data/graphics/trainers.h` | C | sprites/paletas |
| `src/data/pokemon/trainer_class_lookups.h` | C | clases |

Formato `.party` (una entrada por entrenador):
```
=== TRAINER_ROSS_HNS ===
Name: ROSS
Class: Collector Hns
Pic: Collector
Gender: Male
Music: Hg Suspicious 1
Double Battle: No
AI: Check Bad Move

Koffing
Level: 28
IVs: 0 HP / 0 Atk / 0 Def / 0 SpA / 0 SpD / 0 Spe
```

## 4.3 Textos y diálogos

| Qué | Ruta exacta |
|---|---|
| **Discurso del profesor (intro)** | **`data/text/oak_speech_hns.inc`** (`gText_Oak_Welcome`, `gText_Oak_Pokemon`, `gText_Oak_MainSpeech`, …) |
| Gráficos del discurso | `graphics/oak_speech_hns/`, `graphics/oak_speech/`, `graphics/birch_speech/` |
| Script de intro / nuevo juego | `data/scripts/new_game.inc` |
| **Elección y entrega de iniciales** | **`data/maps/NewBarkTown_Lab_hns/scripts.inc`** |
| Laboratorio de Birch (rama alterna) | `data/maps/LittlerootTown_ProfessorBirchsLab/scripts.inc` |
| Gráficos de selección de inicial | `graphics/starter_choose/` (`birch_bag.bin`, `birch_grass.bin`, `pokeball_selection.png`, `starter_circle.png`, `tiles.png`) |
| Nombres de especies/ítems/movimientos | `src/data/text/species_names.h`, `src/data/items.h`, `src/data/moves_info.h` |
| Textos comunes | `data/text/*.inc` (40 archivos) + `src/data/text/` |
| Charmap | `charmap.txt` (raíz) |

### Script de iniciales (extracto real)

```asm
NewBarkTown_Lab_EventScript_ChikoritaBall::
	lock
	goto_if_set FLAG_SYS_POKEMON_GET, NewBarkTown_Lab_EventScript_ShouldntTouch
	goto_if_eq VAR_NEWBARKTOWN_LABSTATE, 1, NewBarkTown_Lab_EventScript_ChikoritaBall_Choice
	...
	setvar VAR_STARTER_MON, 0
	setvar PLAYER_STARTER_SPECIES, SPECIES_CHIKORITA
	showmonpic PLAYER_STARTER_SPECIES, 10, 3
	msgbox NewBarkTown_Lab_Text_ChooseChikorita, MSGBOX_YESNO
```

| Ball | `VAR_STARTER_MON` | Especie |
|---|---|---|
| Chikorita | `0` | `SPECIES_CHIKORITA` (152) |
| Cyndaquil | `1` | `SPECIES_CYNDAQUIL` |
| Totodile | `2` | `SPECIES_TOTODILE` |

La entrega usa `givemon ... SHINY_MODE_NEVER` / `SHINY_MODE_ALWAYS` según `FLAG_SHINY_STARTER_1/2/3`:

```asm
NewBarkTown_Lab_EventScript_GiveStarter_NotShiny::
	givemon PLAYER_STARTER_SPECIES, 5, ITEM_NONE, BALL_POKE, NATURE_RANDOM, NUM_ABILITY_PERSONALITY, \
	       MON_GENDER_RANDOM, 0,0,0,0,0,0, USE_RANDOM_IVS x6, MOVE_DEFAULT x4, SHINY_MODE_NEVER
```

Otros eventos de regalo relevantes en el mismo archivo: `giveitem ITEM_POTION` (ayudante), `giveitem ITEM_POKE_BALL, 5`, `giveitem ITEM_EVERSTONE`, `giveitem ITEM_MASTER_BALL` (Elm), `giveitem ITEM_SS_TICKET` (acceso a Kanto).

## 4.4 Gráficos e interfaz

| Qué | Ruta |
|---|---|
| **Sprites de entrenadores** | `graphics/trainers/front_pics/`, `graphics/trainers/back_pics/`, `graphics/trainers/palettes/` |
| Tabla C de sprites de entrenador | `src/data/graphics/trainers.h` (`gTrainerFrontPic_Hiker[] = INCBIN_U32("graphics/trainers/front_pics/hiker.4bpp.smol")`) |
| **Cajas de texto / UI** | `graphics/text_window/` (`1.png`…`20.png`, más variantes en `graphics/text_window/hns/`) |
| Interfaz general | `graphics/interface/` |
| Iconos de ítems | `graphics/items/` + `src/data/item_icon_table.h` |
| Sprites de Pokémon | `graphics/pokemon/` (front/back/palettes/icons por especie) |
| Iconos de Pokémon | `graphics/pokemon/icons/` |
| Tilesets | `data/tilesets/primary/`, `data/tilesets/secondary/` |
| Menú de fiesta | `graphics/party_menu/` |
| PC / Storage | `graphics/pokemon_storage/` |
| Pokédex | `graphics/pokedex/` |
| Resumen | `graphics/summary_screen/` |
| Bolsa | `graphics/bag/` |
| Pantalla de título | `graphics/title_screen/` |
| Fuentes | `graphics/fonts/` |
| Batalla | `graphics/battle_interface/`, `graphics/battle_anims/`, `graphics/types/` |
| Créditos | `graphics/credits/`, `graphics/credits_frlg/` |

---

# SECCIÓN 5 — PIPELINE DE COMPILACIÓN (CI/CD)

## 5.1 Targets de `make`

`Makefile:21-30` — el proyecto es **multi-versión** y HnS se selecciona por nombre de target:

```make
GAME_VERSION ?= EMERALD
TITLE        ?= POKEMON EMER
GAME_CODE    ?= BPEE
BUILD_NAME   ?= emerald
MAP_VERSION  ?= emerald
...
ifeq (hns, $(or $(BUILD), $(MAKECMDGOALS)))
	GAME_VERSION 	:= POKEMON_HNS
	TITLE       	:= POKEMON HNS
	GAME_CODE   	:= BPEE
	BUILD_NAME   	:= hns
	MAP_VERSION 	:= hns
endif
```

| Target | Efecto |
|---|---|
| **`make hns`** | ✅ **EL COMANDO PARA HnS.** Compila `pokehns.gba` con `GAME_VERSION=POKEMON_HNS`, `MAP_VERSION=hns`, título `POKEMON HNS`, código `BPEE` |
| `make` / `make all` / `make rom` | compila la variante **EMERALD** por defecto (`pokeemerald.gba`) — **NO es HnS** |
| `make firered` / `make leafgreen` | variantes FRLG |
| `make modern` | alias de `all` (el proyecto ya es 100 % modern; `MODERN=1` es fijo) |
| **`make hns release`** | build optimizado: `-DRELEASE`, `NDEBUG`, LTO on → `pokehns-release.gba` |
| `make hns debug` | `-Og -g` → `pokehns-debug.gba` |
| `make check` | ejecuta el Test Runner System (`TEST=1`) en mGBA headless |
| `make syms` | genera `pokehns.sym` (**necesario para EWRAM**) |
| `make clean` | `tidy + clean-tools + clean-check-tools + clean-generated + clean-assets` |

> ⚠️ El nombre del artefacto es **`pokehns.gba`** (`FILE_NAME := poke$(BUILD_NAME)`), **no** `pokemonHnS.gba`. El `pokemonHnS.gba` del workspace fue renombrado a mano.

## 5.2 Toolchain y flags

`Makefile:76-101`:
```make
TOOLCHAIN := $(DEVKITARM)
ifneq (,$(TOOLCHAIN))
  ifneq ($(wildcard $(TOOLCHAIN)/bin),)
    export PATH := $(TOOLCHAIN)/bin:$(PATH)
  endif
endif

PREFIX := arm-none-eabi-
OBJCOPY := $(PREFIX)objcopy
OBJDUMP := $(PREFIX)objdump
AS      := $(PREFIX)as
LD      := $(PREFIX)ld
CPP     := $(PREFIX)cpp
ARMCC   := $(PREFIX)gcc
```

`Makefile:157-179`:
```make
ASFLAGS := -mcpu=arm7tdmi -march=armv4t -meabi=5 --defsym MODERN=1 --defsym $(GAME_VERSION)=1

CPPFLAGS := $(INCLUDE_CPP_ARGS) -Wno-trigraphs -DMODERN=1 -DTESTING=$(TEST) -D$(GAME_VERSION) -std=gnu17

override CFLAGS += -mthumb -mthumb-interwork -O$(O_LEVEL) -mabi=apcs-gnu -mtune=arm7tdmi -march=armv4t \
                   -Wno-pointer-to-int-cast -std=gnu17 -Werror -Wall -Wno-strict-aliasing \
                   -Wno-attribute-alias -Woverride-init -Wnonnull -Wenum-conversion
```

| Elemento | Valor |
|---|---|
| Compilador | `arm-none-eabi-gcc` (devkitARM **o** el paquete `gcc-arm-none-eabi` de Debian/Ubuntu) |
| Arquitectura | `-march=armv4t -mtune=arm7tdmi -mthumb -mthumb-interwork` |
| **ABI** | **`-mabi=apcs-gnu`** ← crítico: redondea structs a múltiplo de 4 (`ChallengeSettings` 31 B → 32 B) |
| Estándar | `-std=gnu17` |
| Optimización | `-O2` por defecto; `-Og` con `DEBUG=1`; `-O0` con `NOOPT=1` |
| LTO | `-flto=auto -fno-fat-lto-objects` cuando `LTO=1` (auto en `release`) |
| Link | `-lc -lnosys -lgcc -L../../libagbsyscall -lagbsyscall` |
| Includes | `-iquote include` (compilación), `-I include` (scaninc) |
| Shell requerido | `bash` (`SHELL := bash -o pipefail`) → **en Windows hace falta MSYS2/WSL** |

> El ABI `apcs-gnu` y `-mthumb` son la razón por la que **no se pueden usar offsets de guías genéricas**: cualquier campo bitfield o struct packed cambia de tamaño.

## 5.3 Herramientas auxiliares (`tools/`)

Se compilan automáticamente desde `make_tools.mk`; requieren **host GCC/Clang + `libpng-dev`**:

| Herramienta | Función |
|---|---|
| `tools/gbagfx/gbagfx` | conversión de PNG ↔ tiles/4bpp/paletas |
| `tools/scaninc/scaninc` | escaneo de `#include` para dependencias |
| `tools/preproc/preproc` | preprocesador de `data/*.s` y macros |
| `tools/compresSmol/compresSmol`, `compresSmolTilemap` | compresión SMOL |
| `tools/jsonproc/jsonproc` | JSON → C (encuentros, layouts) |
| `tools/mapjson/mapjson` | `map.json` → C |
| `tools/trainerproc/trainerproc` | `.party` → `trainer_parties.h` |
| `tools/wild_encounters` | `wild_encounters.json` → C |
| `tools/mid2agb/mid2agb`, `tools/wav2agb/wav2agb` | audio |
| `tools/rsfont/rsfont`, `tools/bin2c/bin2c`, `tools/ramscrgen/ramscrgen` | fuentes, binarios, símbolos RAM |
| `tools/gbafix/gbafix` | fix del header GBA (checksum + título) |
| `tools/patchelf/patchelf` | parcheo de ELF (solo tests) |
| `tools/mgba`, `tools/mgba-rom-test-hydra` | runner de tests headless |
| `tools/poryscript/poryscript` | compilador Poryscript (`.pory` → `.inc`) |
| `tools/learnset_helpers/make_teachables.py` | **Python 3** — genera teachables |

**Requisitos de Python:** Python 3 (CI instala `python3`); `make_teachables.py` se invoca como
`python3 $(LEARNSET_HELPERS_DIR)/make_teachables.py --build $(GAME_VERSION) ...`.

## 5.4 Workflow de GitHub Actions (`.github/workflows/build.yml`)

El repo **ya trae** un workflow funcional. El job relevante para HnS es una variante del job `build-emerald`:

```yaml
name: CI
on: [push, pull_request]

env:
  GAME_REVISION: 0
  GAME_LANGUAGE: ENGLISH
  COMPARE: 0
  UNUSED_ERROR: 1
  DEPRECATED_ERROR: 1

jobs:
  build-hns:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install binutils
        run: |
          sudo apt-get update
          sudo apt-get install -y --no-install-recommends \
            binutils-arm-none-eabi gcc-arm-none-eabi libnewlib-arm-none-eabi libpng-dev python3

      - name: Cache build tools
        uses: actions/cache@v4
        with:
          path: |
            tools/bin2c/bin2c
            tools/gbafix/gbafix
            tools/gbagfx/gbagfx
            tools/jsonproc/jsonproc
            tools/mapjson/mapjson
            tools/mid2agb/mid2agb
            tools/preproc/preproc
            tools/ramscrgen/ramscrgen
            tools/rsfont/rsfont
            tools/scaninc/scaninc
            tools/trainerproc/trainerproc
            tools/compresSmol/compresSmol
            tools/compresSmol/compresSmolTilemap
            tools/wav2agb/wav2agb
          key: tools-${{ runner.os }}-${{ hashFiles('tools/*/Makefile', 'tools/**/*.c', 'tools/**/*.cpp', 'tools/**/*.h') }}

      - name: ROM (HnS)
        env:
          GAME_VERSION: POKEMON_HNS
        run: make hns -j$(nproc) -O

      - name: ROM (HnS, release)
        run: make hns release -j$(nproc) -O

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: pokemonHnS
          path: |
            pokehns.gba
            pokehns.sym
            pokehns.map
            pokehns-release.gba
```

Notas del workflow real:
- Los jobs existentes son `build-emerald`, `build-firered`, `build-leafgreen`, `release`, `test`, `docs_validate` y un job *gate* `build` que exige que todos pasen.
- `release` usa `GAME_VERSION: EMERALD` y `make -j$(nproc) release`.
- `test` usa `TEST: 1` + `make -j$(nproc) check` y necesita además `tools/patchelf/patchelf` y `tools/mgba-rom-test-hydra/mgba-rom-test-hydra`.
- **No hay job `hns`** en el workflow actual: para compilar HnS en CI hay que añadirlo (bloque de arriba) o ejecutar `make hns` localmente.

---

# SECCIÓN 6 — ANEXO: RESOLUCIÓN DE OFFSETS EN RUNTIME (`GFRomHeader`)

`src/rom_header_gf.c` embebe una **API pública de offsets** en la ROM, en la sección `.text.header_gf`, justo en **`0x100`** (`gameName` = `"pokemon emerald version"` en `0x108`). Es la fuente de verdad del propio binario y **elimina el problema de los perfiles**.

```c
struct GFRomHeader
{
    u32 version; u32 language; u8 gameName[32];
    ... punteros a sprites/ítems/movimientos ...
    u32 flagsOffset;            // offsetof(SaveBlock1, flags)
    u32 varsOffset;             // offsetof(SaveBlock1, vars)
    u32 pokedexOffset;          // offsetof(SaveBlock2, pokedex)
    u32 seen1Offset;            // offsetof(SaveBlock1, dexSeen)
    u32 seen2Offset;            // = seen1Offset (dex flags combinados)
    u32 pokedexVar; u32 pokedexFlag; u32 mysteryEventFlag; u32 pokedexCount;
    u8  playerNameLength, trainerNameLength, pokemonNameLength1, pokemonNameLength2;
    u8  unk5..unk17;
    u32 saveBlock2Size;         // sizeof(struct SaveBlock2)
    u32 saveBlock1Size;         // sizeof(struct SaveBlock1)
    u32 partyCountOffset;       // offsetof(SaveBlock1, playerPartyCount)
    u32 partyOffset;            // offsetof(SaveBlock1, playerParty)
    u32 warpFlagsOffset; u32 trainerIdOffset; u32 playerNameOffset; u32 playerGenderOffset;
    u32 frontierStatusOffset; u32 frontierStatusOffset2;
    u32 externalEventFlagsOffset; u32 externalEventDataOffset; u32 unk18;
    ... speciesInfo, abilityNames, items, moves, ballGfx ...
    u32 gcnLinkFlagsOffset;     // offsetof(SaveBlock2, gcnLinkFlags) -> encryptionKey = +4
    u32 gameClearFlag; u32 ribbonFlag;
    u8  bagCountItems, bagCountKeyItems, bagCountPokeballs, bagCountTMHMs, bagCountBerries, pcItemsCount;
    u32 pcItemsOffset;          // offsetof(SaveBlock1, pcItems)
    u32 giftRibbonsOffset; u32 enigmaBerryOffset; u32 enigmaBerrySize;
    const u8 *moveDescriptions; u32 unk20;
};
```

### Offsets de campo dentro de `GFRomHeader`

| Campo | Offset relativo a `0x100` |
|---|---|
| `gameName` | `+0x08` (absoluto `0x108`) |
| `flagsOffset` | `+0x50` |
| `varsOffset` | `+0x54` |
| `pokedexOffset` | `+0x58` |
| `seen1Offset` | `+0x5C` |
| `seen2Offset` | `+0x60` |
| `pokedexVar` | `+0x64` |
| `pokedexFlag` | `+0x68` |
| `mysteryEventFlag` | `+0x6C` |
| `pokedexCount` | `+0x70` |
| `playerNameLength` | `+0x74` |
| `saveBlock2Size` | `+0x88` |
| `saveBlock1Size` | `+0x8C` |
| `partyCountOffset` | `+0x90` |
| `partyOffset` | `+0x94` |
| `warpFlagsOffset` | `+0x98` |
| `trainerIdOffset` | `+0x9C` |
| `playerNameOffset` | `+0xA0` |
| `playerGenderOffset` | `+0xA4` |
| `gcnLinkFlagsOffset` | `+0xD8` |
| `gameClearFlag` | `+0xDC` |
| `ribbonFlag` | `+0xE0` |
| `bagCountItems` | `+0xE4` |
| `bagCountKeyItems` | `+0xE5` |
| `bagCountPokeballs` | `+0xE6` |
| `bagCountTMHMs` | `+0xE7` |
| `bagCountBerries` | `+0xE8` |
| `pcItemsCount` | `+0xE9` |
| `pcItemsOffset` | `+0xEC` |
| `giftRibbonsOffset` | `+0xF0` |
| `enigmaBerryOffset` | `+0xF4` |
| `enigmaBerrySize` | `+0xF8` |
| `moveDescriptions` | `+0xFC` |
| `unk20` | `+0x100` |
| **`sizeof(struct GFRomHeader)`** | **`0x104`** |

### Valores reales leídos de `public/roms/pokemonHnS.gba` (PERFIL B)

```
gameName                  "pokemon emerald version"   @0x108
flagsOffset               0x1364
varsOffset                0x1490
pokedexOffset             0x1C
seen1Offset / seen2Offset 0xA78
pokedexVar                0x46   (VAR_NATIONAL_DEX - VARS_START)
pokedexFlag               0x8E4
mysteryEventFlag          0x8AC
pokedexCount              420
playerNameLength          7      trainerNameLength 10
saveBlock2Size            0x0F50
saveBlock1Size            0x3DB8
partyCountOffset          0x0234
partyOffset               0x0238
trainerIdOffset           0x0A
playerNameOffset          0x00
playerGenderOffset        0x08
gcnLinkFlagsOffset        0xB8   ->  encryptionKey = 0xBC
bagCountItems             90
bagCountKeyItems          30
bagCountPokeballs         16
bagCountTMHMs             64
bagCountBerries           46
pcItemsCount              50
pcItemsOffset             0x0498
```

### Implementación TypeScript

```ts
export interface RomProfile {
  saveBlock2Size: number; saveBlock1Size: number;
  partyCountOffset: number; partyOffset: number;
  moneyOffset: number; coinsOffset: number; bagOffset: number; pcItemsOffset: number;
  encryptionKeyOffset: number;
  bag: { items: number; keyItems: number; pokeBalls: number; tmhm: number; berries: number; medicine: number };
}

export function resolveProfile(rom: Uint8Array): RomProfile {
  const dv = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);
  // localizar gameName para tolerar ROMs con cabecera desplazada
  const needle = "pokemon emerald version";
  let base = 0x100;
  const at = rom.findIndex((_, i) => {
    for (let j = 0; j < needle.length; j++) if (rom[i + j] !== needle.charCodeAt(j)) return false;
    return true;
  });
  if (at > 0) base = at - 0x08;

  const u32 = (o: number) => dv.getUint32(base + o, true);
  const u8  = (o: number) => dv.getUint8(base + o);

  const pcItemsOffset = u32(0xEC);
  const bagOffset = pcItemsOffset + u8(0xE9) * 4;      // pcItemsCount * sizeof(ItemSlot)

  return {
    saveBlock2Size: u32(0x88),
    saveBlock1Size: u32(0x8C),
    partyCountOffset: u32(0x90),
    partyOffset: u32(0x94),
    moneyOffset: u32(0x94) + 6 * 0x64,                  // partyOffset + PARTY_SIZE*100
    coinsOffset: u32(0x94) + 6 * 0x64 + 4,
    pcItemsOffset,
    bagOffset,
    encryptionKeyOffset: u32(0xD8) + 4,                 // gcnLinkFlags + 4
    bag: {
      items:     u8(0xE4),
      keyItems:  u8(0xE5),
      pokeBalls: u8(0xE6),
      tmhm:      u8(0xE7),
      berries:   u8(0xE8),
      medicine:  0,                                     // no expuesto por el header
    },
  };
}
```

> `medicine` no está en el `GFRomHeader`: se deriva como
> `saveBlock1Size`-dependiente, o se deja en 0 si `I_COMBINE_BAG_POCKETS == FALSE`.
> Para v2.0.6 se conoce por código: **92**.

### Tabla de decisión del motor

| Dato | Fuente recomendada |
|---|---|
| `saveBlock2Size`, `saveBlock1Size`, `partyCountOffset`, `partyOffset`, `pcItemsOffset`, `gcnLinkFlagsOffset` | **`GFRomHeader`** (siempre) |
| `encryptionKey` | `GFRomHeader.gcnLinkFlagsOffset + 4` (o `0xAC` fijo en v2.0.6) |
| `money` / `coins` | `partyOffset + 6*100` y `+4` |
| Tamaños de bolsillo | `GFRomHeader.bagCount*` |
| `flags`, `vars` | `GFRomHeader.flagsOffset` / `varsOffset` |
| `sizeof(PokemonStorage)` y `size` de la sección 13 | **No está en el header.** Calcular: `4 + 14*30*80 + 14*9 + 14 + MAX_FUSION_STORAGE*100` → v2.0.6 = `0x8560`; verificar escaneando los `checksum` de las secciones 5..13 |
| `encryptionKey` (fallback sin ROM) | probar `0xAC` y `0xBC`, validando que `money ^ key <= 999999` |

---

# APÉNDICE A — Validación empírica realizada

Scripts en `C:\Users\Martin\AppData\Local\Temp\opencode\`:

| Script | Uso |
|---|---|
| `rom_header_probe.py <rom>` | volcado completo de `GFRomHeader` |
| `hns_probe3.py <sav...>` | detección de slot activo, sectores, clave, tamaños por checksum |

Resultados sobre `scratch_fixed.sav` (131088 B, slot activo = **sectores 14–27**, `counter = 1`):

```
sector 14 -> id 13   sector 15 -> id 0    sector 16 -> id 1    sector 17 -> id 2
sector 18 -> id 3    sector 19 -> id 4    ... (rotación completa)
key candidates: [('0xbc', '0x360e38d5', 99999)]     <-- PERFIL B confirmado
SB1[0x00:0x02] = 0x0025  (37) = pos.x, NO hay saveVersion  <-- confirma PERFIL B
partyCount @0x234 = 2 ; party[0] = CHIKORITA ; party[1] = TODOTILE @0x238
```

---

# APÉNDICE B — Checklist de implementación del motor TS

1. **Leer la ROM** y ejecutar `resolveProfile()` → offsets reales del binario.
2. **Detectar el slot activo**: por `signature == 0x08012025` y `counter` mayor; indexar secciones por `id` en `0x0FF4`.
3. **Ensamblar** `SaveBlock2` (sec 0), `SaveBlock1` (sec 1–4) y `PokemonStorage` (sec 5–13) concatenando `size` bytes de cada una.
4. **Verificar checksums** con `calculateChecksum()` antes de confiar en el bloque.
5. **Leer `encryptionKey`** del perfil resuelto; descifrar `money`, `coins` y `quantity`.
6. **Leer/escribir `ItemSlot`**: `itemId` en claro, `quantity ^= key & 0xFFFF`. `pcItems` **sin cifrar**.
7. **Party/Box**: descifrar `secure.raw[12]` con `pid ^ otId`, reordenar por `SUBSTRUCT_ORDER[pid % 24]`, validar `checksum @+0x1C`.
8. **Al escribir**: recalcular `BoxPokemon.checksum`, re-cifrar `secure`, recalcular el checksum del sector afectado y reescribir el footer (`0x0FF6`) + `counter` (`0x0FFC`).
9. **Nunca** cachear `encryptionKey` entre guardados: cambia en cada save.
10. **No** reutilizar los offsets de `gbaSaveEngine.ts` tal como están: usa `SB2_ENCRYPTION_KEY 0xBC` (perfil B) y `SB1_PARTY_COUNT 0x234` (perfil B), pero `SECTION_SIZES[13] = 0x07D0` está **sin verificar** y `bag` usa capacidades del perfil B (90/30/16/64/46), no las de v2.0.6.

---

*Documento generado por auditoría directa del código fuente. Versión auditada: `Release-v2.0.6` / `167aa6d537`. Los valores marcados `[DERIVADO]` requieren confirmación por compilación (`make hns && make syms`) o por lectura de `GFRomHeader` en el binario final.*
