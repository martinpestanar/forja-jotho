---
name: pokeemerald-hns-bridge
description: >-
  Guía técnica y runbook para modificar, auditar e inyectar ítems, Pokémon (Equipo y PC Box 1)
  o Pokédólares en el emulador mGBA WebAssembly y archivos .sav de Pokémon Heart & Soul (ROM base Emerald BPEE) en SynDex.
---

# 🎮 Pokeemerald H&S Bridge Runbook (SynDex)

Este documento es la referencia técnica obligatoria para cualquier modificación del motor de guardado GBA (`gbaSaveEngine.ts`), el puente de memoria (`PokemonMemoryBridge.ts`) y la consola web (`GbaConsoleWorker.tsx`).

---

## 🏛️ 1. Arquitectura de Almacenamiento y Ciclo de Vida

El sistema opera en tres capas de datos que deben mantenerse sincronizadas:

```
[ mGBA EWRAM (0x02000000) ] ── (Durante juego activo)
             │
[ Emscripten VFS (/data/saves/pokemonHnS.sav) ] ── (Disco virtual de la sesión)
             │
[ Supabase Storage (gba-saves/{userId}/slot_X.sav) ] ── (Persistencia en la nube)
```

### Reglas Críticas del Ciclo de Vida:
1. **No sobreescribir VFS con el juego corriendo:** Mientras el core C de mGBA corre, tiene SRAM sucia en memoria. Cualquier escritura directa a VFS sin reiniciar el core será sobreescrita si el jugador guarda desde el menú del juego.
2. **Reinicio por Recreación de Canvas (`rebootEmulator`):**
   - Nunca llamar a `mod.pauseMainLoop()` o `mod.quitGame()` esperando reutilizar el mismo módulo con `loadGame()` (esto congela el canvas WebGL).
   - Para recargar el `.sav` inyectado, pasar los bytes a `pendingSavBytesRef.current` y ejecutar `setBootCount(prev => prev + 1)`.
   - El canvas usa `key={`gba-canvas-${bootCount}`}`, lo que remonta un canvas nuevo con contexto WebGL limpio y carga el `.sav` inyectado en <200ms sin requerir F5 del navegador.
3. **Eliminar Autosaves Residuales:**
   - mGBA crea `/autosave/pokemonHnS_auto.ss`. Siempre debe eliminarse (`unlink`) antes de arrancar para evitar que el emulador restaure un save state viejo sobre la partida inyectada.

---

## 🔑 2. Offsets Binarios Oficiales (pokeemerald / BPEE)

Flash de 128 KB (131,072 bytes) en Ring Buffer rotativo de 14 sectores lógicos por slot (Slot A: 0-13, Slot B: 14-27).

### Section 0: SaveBlock2 (`SECTION_SIZES[0] = 0x0F2C`)
| Campo | Offset | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| `SB2_PLAYER_NAME` | `0x0000` | 7 bytes | Nombre del entrenador codificado en GBA Charmap |
| `SB2_TRAINER_ID` | `0x000A` | 4 bytes (u32) | TID (16 bits low) + SID (16 bits high) |
| `SB2_ENCRYPTION_KEY` | `0x00BC` | 4 bytes (u32) | **Llave XOR real para dinero e ítems de mochila** |

> [!IMPORTANT]
> **Offset de Encriptación:** En Emerald/BPEE la `encryptionKey` está en `0x00BC` (NUNCA usar `0x00A8` de Ruby/Sapphire). Usar la llave incorrecta corrompe el dinero y descarta los ítems inyectados.

### Section 1: SaveBlock1 (`SECTION_SIZES[1] = 0x0F80`)
| Campo | Offset | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| `SB1_PARTY_COUNT` | `0x0234` | 4 bytes (u32) | Cantidad de Pokémon en el equipo (0 a 6) |
| `SB1_PARTY_DATA` | `0x0238` | 6 * 100 bytes | Array de `struct Pokemon` del equipo |
| `SB1_MONEY` | `0x0490` | 4 bytes (u32) | Dinero cifrado: `money ^ encryptionKey` |
| `SB1_COINS` | `0x0494` | 2 bytes (u16) | Monedas Casino cifradas: `coins ^ (encryptionKey & 0xFFFF)` |
| `SB1_BAG_ITEMS` | `0x0560` | 30 * 4 bytes | Bolsillo Ítems (ItemId u16, Cantidad u16 ^ key16) |
| `SB1_BAG_KEY_ITEMS` | `0x05D8` | 30 * 4 bytes | Bolsillo Objetos Clave |
| `SB1_BAG_POKEBALLS` | `0x0650` | 16 * 4 bytes | Bolsillo Poké Balls |
| `SB1_BAG_TMHM` | `0x0690` | 64 * 4 bytes | Bolsillo MT/MO |
| `SB1_BAG_BERRIES` | `0x0790` | 46 * 4 bytes | Bolsillo Bayas |

### Section 5: PokemonStorage Parte 1 (`SECTION_SIZES[5] = 0x0F80`)
| Campo | Offset | Tamaño | Descripción |
| :--- | :--- | :--- | :--- |
| `currentBox` | `0x0000` | 1 byte (u8) | Caja activa actualmente en la PC |
| `boxes[0]` (PC Box 1) | `0x0004` | 30 * 80 bytes | 30 ranuras de `struct BoxPokemon` (0x0004 a 0x0964) |

- **Ranura vacía en PC:** Se detecta cuando `pid === 0 && otid === 0`.
- **Diferencia Box vs Party:** `struct BoxPokemon` tiene 80 bytes (sin los 20 bytes finales de estadísticas de combate en RAM `0x50`-`0x63`).

---

## 🔒 3. Checksums Oficiales de pokeemerald

Para que la ROM reconozca un sector modificado sin mostrar "La partida está dañada", se debe recalcular el checksum:

```typescript
// Suma de palabras u32 y plegado a 16 bits
let checksum32 = 0;
const numWords = Math.floor(lengthInBytes / 4);
for (let i = 0; i < numWords; i++) {
  checksum32 = (checksum32 + dataView.getUint32(byteOffset + i * 4, true)) >>> 0;
}
const checksum16 = ((checksum32 >>> 16) + (checksum32 & 0xFFFF)) & 0xFFFF;
dataView.setUint16(sectorBase + 0x0FF6, checksum16, true);
```

---

## ⚡ 4. Cómo Inyectar Nuevas Recompensas

### A. Para Ítems
1. Disparar el evento global desde cualquier componente React:
   ```typescript
   import { triggerGbaItemInjection } from '@/lib/gba/PokemonMemoryBridge';
   triggerGbaItemInjection(itemId, quantity, 'ITEMS', 'Nombre Ítem');
   ```
2. Bolsillos disponibles: `'ITEMS' | 'KEY_ITEMS' | 'POKEBALLS' | 'TMHM' | 'BERRIES'`.

### B. Para Pokémon
1. Disparar el evento global indicando el destino (`'pc'` o `'party'`):
   ```typescript
   import { triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';

   triggerGbaPokemonInjection({
     speciesId: 25,          // Pikachu
     level: 15,
     nickname: 'PIKACHU',
     isShiny: true,
     perfectIVs: true,
     targetDestination: 'pc', // 'pc' para Box 1, 'party' para equipo activo
   });
   ```
2. Si el equipo está lleno (6/6), el motor redirige automáticamente a **PC Box 1**.

---

## 📚 5. Documentos Maestros y Referencias
- [**Master Architecture Blueprint (SSOT)**](./references/architecture_blueprint.md): Mapa completo de las 6 pantallas, ingeniería inversa, bases de datos Supabase, modelo de negocio e inyecciones seguras.
- [**Script de Auditoría Forense**](./scripts/auditSave.ts): Validador automático de `.sav`, detección de slots activos y conteo de Pokémon en equipo y PC Box 1.

---

## 👑 6. Torre de Control SuperAdmin (`/admin`) y Filosofía del Proyecto
> [!IMPORTANT]
> **Pivote Oficial del Proyecto (App Personal de Productividad):**
> Esta app NO es una plataforma escolar para alumnos de 11 a 14 años (eso pertenecía a una versión anterior).
> Es una **herramienta personal de Martin** para trackear hábitos, objetivos de su agencia/SaaS y productividad diaria, donde el emulador mGBA (Pokémon Heart & Soul) actúa como recompensa estricta gamificada ("Code-to-Play"):
> 1. **La Batería es el motor real:** Las tareas SaaS y hábitos completados otorgan minutos de juego (+15m / +30m).
> 2. **Economía in-game sin tocar:** La ROM penaliza las derrotas automáticamente con `sWhiteOutBadgeMoney[medallas] * maxLevel`. No se necesita Money Governor ni modificar el C del juego para restringir dinero a estudiantes; el filtro es el tiempo real de batería.
> 3. **Panel Admin:** Actúa como centro de control personal y testing para inyectar recompensas de prueba o ajustar métricas con 1-clic.

- **Acciones Rápidas (1 Clic):**
  - `grant_battery`: +15m / +30m tiempo de emulador ganado por tareas.
  - `set_level`: Progreso de nivel / gimnasios (1 al 12).
  - `grant_pokedollars`: Dinero para la tienda web de recompensas.
  - `inject_item`: Encola ítems clave o Master Balls en `shop_inventory`.
- **Ruta del Panel:** `/admin` o pestaña `SuperAdmin` en el dashboard.

