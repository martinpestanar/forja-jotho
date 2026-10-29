/**
 * @file src/lib/gba/gbaSaveEngine.ts
 * @description Motor Quirúrgico de Lectura, Extracción de Equipo e Inyección de Ítems/Dinero
 * para archivos .sav de PokemonHnS (pokeemerald / Modern Emerald base).
 *
 * Arquitectura de Flash 1Mbit (128 KB = 131,072 bytes):
 *   - 32 sectores de 4,096 bytes
 *   - Slot A = Sectores 0-13, Slot B = Sectores 14-27
 *   - Anillo rotativo (Ring Buffer): se debe escanear el footer de cada sector
 *   - Footer: SectionID(0x0FF4), Checksum(0x0FF6), Signature(0x0FF8), Counter(0x0FFC)
 */

// ============================================================================
// Constantes de la arquitectura Flash GBA
// ============================================================================

export const GBA_SAVE_SIZE = 0x20000; // 131,072 bytes (128 KB)
export const SECTOR_SIZE = 0x1000;    // 4,096 bytes por sector
export const SECTORS_PER_SLOT = 14;   // 14 secciones lógicas por slot
export const VALID_SIGNATURE = 0x08012025;

/** Tamaños válidos de datos por Section ID (sSaveSlotLayout en pokeemerald) */
export const SECTION_SIZES: Record<number, number> = {
  0: 0x0F2C,  // SaveBlock2 (3,884 bytes)
  1: 0x0F80,  // SaveBlock1 Pt 1 (3,968 bytes) -> Party, Money, Bag
  2: 0x0F80,  // SaveBlock1 Pt 2
  3: 0x0F80,  // SaveBlock1 Pt 3
  4: 0x0F08,  // SaveBlock1 Pt 4 (3,848 bytes)
  5: 0x0F80,  // PokemonStorage Pt 1
  6: 0x0F80,  7: 0x0F80,  8: 0x0F80,  9: 0x0F80,
  10: 0x0F80, 11: 0x0F80, 12: 0x0F80,
  13: 0x07D0  // PokemonStorage Pt 9 (2,000 bytes)
};

// ============================================================================
// Offsets dentro de SaveBlock2 (Section 0) y SaveBlock1 (Section 1)
// ============================================================================

export const OFFSETS = {
  // SaveBlock2 (Sección Lógica 0)
  SB2_PLAYER_NAME: 0x0000,
  SB2_TRAINER_ID: 0x000A,      // u32: TID(16 low) | SID(16 high)
  SB2_ENCRYPTION_KEY: 0x00BC,  // u32: Llave XOR para dinero + items (offset real en Emerald/BPEE)

  // SaveBlock1 (Sección Lógica 1)
  SB1_PARTY_COUNT: 0x0234,     // u32 (1 byte útil, 0-6)
  SB1_PARTY_DATA: 0x0238,      // 6 * 100 bytes (struct Pokemon)
  SB1_MONEY: 0x0490,           // u32 cifrado con encryptionKey
  SB1_COINS: 0x0494,           // u16 cifrado con key16

  // Bolsillos de la Mochila (cada slot = 4 bytes: u16 itemId + u16 quantity_encrypted)
  SB1_BAG_ITEMS:     { offset: 0x0560, maxSlots: 30 },
  SB1_BAG_KEY_ITEMS: { offset: 0x05D8, maxSlots: 30 },
  SB1_BAG_POKEBALLS: { offset: 0x0650, maxSlots: 16 },
  SB1_BAG_TMHM:     { offset: 0x0690, maxSlots: 64 },
  SB1_BAG_BERRIES:   { offset: 0x0790, maxSlots: 46 },
} as const;

/** Catálogo de ítems clave para la Tienda de Ciudad Trigal */
export const HNS_ITEM_IDS = {
  MASTER_BALL: 0x0001,
  ULTRA_BALL: 0x0002,
  GREAT_BALL: 0x0003,
  POKE_BALL: 0x0004,
  POTION: 0x0012,         // Item 18 (Poción)
  SUPER_POTION: 0x001B,   // Item 27 (Superpoción)
  HYPER_POTION: 0x001A,   // Item 26 (Hiperpoción)
  MAX_POTION: 0x0019,     // Item 25 (Poción Máxima)
  FULL_RESTORE: 0x0018,   // Item 24 (Restaurar Todo)
  FULL_HEAL: 0x001C,      // Item 28 (Cura Total)
  REVIVE: 0x001D,         // Item 29 (Revivir)
  MAX_REVIVE: 0x001E,     // Item 30 (Revivir Máximo)
  SACRED_ASH: 0x002C,     // Item 44 (Ceniza Sagrada)
  RARE_CANDY: 0x0044,
  HEART_SCALE: 0x006F,
  ABILITY_CAPSULE: 0x0260,
} as const;

export type BagPocketType = 'ITEMS' | 'KEY_ITEMS' | 'POKEBALLS' | 'TMHM' | 'BERRIES';

// ============================================================================
// Interfaces
// ============================================================================

export interface PartyPokemonSummary {
  slot: number;
  speciesId: number;
  nickname: string;
  level: number;
  hp: number;
  maxHp: number;
  heldItemId: number;
  isShiny: boolean;
  isEgg: boolean;
  natureId: number;
  personality: number;
}

export interface InjectionPayload {
  addMoney?: number;
  setExactMoney?: number;
  itemsToInject?: Array<{
    pocket: BagPocketType;
    itemId: number;
    quantity: number;
  }>;
}

export interface PokemonInjectionOptions {
  speciesId: number;
  level: number;
  nickname?: string;
  heldItemId?: number;
  moves?: number[];
  isShiny?: boolean;
  perfectIVs?: boolean;
  friendship?: number;
  targetDestination?: 'party' | 'pc' | 'auto';
}

export interface PokemonInjectionResult {
  success: boolean;
  slot: number;
  speciesId: number;
  nickname: string;
  level: number;
  isShiny: boolean;
  inPcBox?: boolean;
  box?: number;
  updatedSav?: Uint8Array;
  error?: string;
}

// ============================================================================
// Tabla de permutación para Growth substruct (PID % 24) y permutación completa (G=0, A=1, E=2, M=3)
// ============================================================================

const GROWTH_SUBSTRUCT_ORDER: number[] = [
  0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 2, 3,
  1, 1, 2, 3, 2, 3, 1, 1, 2, 3, 2, 3,
];

export const SUBSTRUCT_ORDER_PERMUTATIONS: number[][] = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
  [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
  [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
];

// Presets de especies populares para cálculo de stats y moves automáticos
export const REWARD_POKEMON_PRESETS: Record<number, {
  name: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseSpAtk: number;
  baseSpDef: number;
  moves: number[];
  pps: number[];
}> = {
  // Iniciales Johto
  152: { name: 'CHIKORITA', baseHp: 45, baseAtk: 49, baseDef: 65, baseSpd: 45, baseSpAtk: 49, baseSpDef: 65, moves: [33, 45, 75, 77], pps: [35, 40, 25, 35] },
  155: { name: 'CYNDAQUIL', baseHp: 39, baseAtk: 52, baseDef: 43, baseSpd: 65, baseSpAtk: 60, baseSpDef: 50, moves: [33, 43, 108, 52], pps: [35, 30, 20, 25] },
  158: { name: 'TOTODILE',  baseHp: 50, baseAtk: 65, baseDef: 64, baseSpd: 43, baseSpAtk: 44, baseSpDef: 48, moves: [10, 43, 55, 99], pps: [35, 30, 25, 20] },
  // Populares
  25:  { name: 'PIKACHU',   baseHp: 35, baseAtk: 55, baseDef: 40, baseSpd: 90, baseSpAtk: 50, baseSpDef: 50, moves: [84, 98, 104, 85], pps: [30, 30, 15, 15] },
  133: { name: 'EEVEE',     baseHp: 55, baseAtk: 55, baseDef: 50, baseSpd: 55, baseSpAtk: 45, baseSpDef: 65, moves: [33, 39, 98, 44], pps: [35, 30, 30, 25] },
  143: { name: 'SNORLAX',   baseHp: 160, baseAtk: 110, baseDef: 65, baseSpd: 30, baseSpAtk: 65, baseSpDef: 110, moves: [34, 156, 173, 153], pps: [20, 10, 10, 15] },
  // Legendarios / Míticos de Evento Johto
  249: { name: 'LUGIA',     baseHp: 106, baseAtk: 90, baseDef: 130, baseSpd: 110, baseSpAtk: 90, baseSpDef: 154, moves: [177, 56, 105, 94], pps: [5, 5, 10, 10] },
  250: { name: 'HO-OH',     baseHp: 106, baseAtk: 130, baseDef: 90, baseSpd: 90, baseSpAtk: 110, baseSpDef: 154, moves: [221, 19, 105, 126], pps: [5, 15, 10, 5] },
  251: { name: 'CELEBI',    baseHp: 100, baseAtk: 100, baseDef: 100, baseSpd: 100, baseSpAtk: 100, baseSpDef: 100, moves: [105, 215, 219, 246], pps: [10, 5, 25, 5] },
  151: { name: 'MEW',       baseHp: 100, baseAtk: 100, baseDef: 100, baseSpd: 100, baseSpAtk: 100, baseSpDef: 100, moves: [94, 144, 5, 118], pps: [10, 10, 20, 10] },
  384: { name: 'RAYQUAZA',  baseHp: 105, baseAtk: 150, baseDef: 90, baseSpd: 95, baseSpAtk: 150, baseSpDef: 90, moves: [200, 19, 245, 63], pps: [15, 15, 5, 5] },
};

// ============================================================================
// Codificador / Decodificador de texto propietario GBA
// ============================================================================

const GBA_CHARMAP: Record<number, string> = {
  0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E', 0xC0: 'F', 0xC1: 'G',
  0xC2: 'H', 0xC3: 'I', 0xC4: 'J', 0xC5: 'K', 0xC6: 'L', 0xC7: 'M', 0xC8: 'N',
  0xC9: 'O', 0xCA: 'P', 0xCB: 'Q', 0xCC: 'R', 0xCD: 'S', 0xCE: 'T', 0xCF: 'U',
  0xD0: 'V', 0xD1: 'W', 0xD2: 'X', 0xD3: 'Y', 0xD4: 'Z',
  0xD5: 'a', 0xD6: 'b', 0xD7: 'c', 0xD8: 'd', 0xD9: 'e', 0xDA: 'f', 0xDB: 'g',
  0xDC: 'h', 0xDD: 'i', 0xDE: 'j', 0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n',
  0xE3: 'o', 0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's', 0xE8: 't', 0xE9: 'u',
  0xEA: 'v', 0xEB: 'w', 0xEC: 'x', 0xED: 'y', 0xEE: 'z',
  0xA1: '0', 0xA2: '1', 0xA3: '2', 0xA4: '3', 0xA5: '4',
  0xA6: '5', 0xA7: '6', 0xA8: '7', 0xA9: '8', 0xAA: '9',
  0x00: ' ', 0xAB: '!', 0xAC: '?', 0xB0: '-', 0xAD: '.',
};

const CHAR_TO_GBA: Record<string, number> = {};
Object.entries(GBA_CHARMAP).forEach(([byteHex, char]) => {
  CHAR_TO_GBA[char] = Number(byteHex);
});

export function encodeGbaString(str: string, maxLength: number): Uint8Array {
  const bytes = new Uint8Array(maxLength);
  bytes.fill(0xFF);
  const clean = str.slice(0, maxLength);
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    bytes[i] = CHAR_TO_GBA[ch] ?? CHAR_TO_GBA[ch.toUpperCase()] ?? 0x00;
  }
  return bytes;
}

function decodeGbaString(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) {
    if (b === 0xFF) break; // EOS terminator
    out += GBA_CHARMAP[b] ?? '';
  }
  return out.trim() || 'PKMN';
}

// ============================================================================
// Clase Principal: GbaSaveManipulator
// ============================================================================

export class GbaSaveManipulator {
  private buffer: Uint8Array;
  private view: DataView;

  constructor(savBuffer: ArrayBuffer | Uint8Array) {
    const raw = savBuffer instanceof Uint8Array ? savBuffer : new Uint8Array(savBuffer);
    if (raw.byteLength < 0x1C000) {
      throw new Error(
        `Archivo .sav inválido (${raw.byteLength} bytes). Se requieren al menos 114,688 bytes (idealmente 131,072).`
      );
    }
    // Clonar para inmutabilidad hasta confirmar integridad
    this.buffer = new Uint8Array(raw);
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
  }

  /** Retorna el buffer .sav actual */
  public getBuffer(): Uint8Array {
    return this.buffer;
  }

  /**
   * Checksum oficial de pokeemerald (src/save.c -> CalculateChecksum)
   * Suma u32 words, luego pliega 16 bits superiores con 16 bits inferiores.
   */
  public static calculateSectionChecksum(
    dataView: DataView, byteOffset: number, lengthInBytes: number
  ): number {
    let checksum32 = 0;
    const numWords = Math.floor(lengthInBytes / 4);
    for (let i = 0; i < numWords; i++) {
      checksum32 = (checksum32 + dataView.getUint32(byteOffset + i * 4, true)) >>> 0;
    }
    return ((checksum32 >>> 16) + (checksum32 & 0xFFFF)) & 0xFFFF;
  }

  /**
   * Escanea ambos slots y determina cuál es el activo
   * Retorna el mapa { sectionId -> physicalSectorIndex }
   */
  public getActiveSlotMap(): {
    slotName: 'A' | 'B';
    sectorMap: Map<number, number>;
    saveCounter: number;
  } {
    const evaluateSlot = (startSector: number) => {
      const map = new Map<number, number>();
      let maxCounter = -1;
      let validCount = 0;

      for (let s = startSector; s < startSector + SECTORS_PER_SLOT; s++) {
        const base = s * SECTOR_SIZE;
        if (base + SECTOR_SIZE > this.buffer.byteLength) break;
        const sig = this.view.getUint32(base + 0x0FF8, true);
        if (sig === VALID_SIGNATURE) {
          const sectionId = this.view.getUint16(base + 0x0FF4, true);
          const counter = this.view.getUint32(base + 0x0FFC, true);
          map.set(sectionId, s);
          if (counter > maxCounter) maxCounter = counter;
          validCount++;
        }
      }
      return { valid: validCount === SECTORS_PER_SLOT, map, counter: maxCounter };
    };

    const slotA = evaluateSlot(0);
    const slotB = evaluateSlot(14);

    if (!slotA.valid && !slotB.valid) {
      throw new Error(
        'Partida corrupta o no inicializada: ningún Slot contiene los 14 sectores firmados (0x08012025).'
      );
    }

    if (slotA.valid && (!slotB.valid || slotA.counter >= slotB.counter)) {
      return { slotName: 'A', sectorMap: slotA.map, saveCounter: slotA.counter };
    }
    return { slotName: 'B', sectorMap: slotB.map, saveCounter: slotB.counter };
  }

  /** Valida integridad del .sav sin lanzar excepciones (para shadow backups) */
  public isValid(): boolean {
    try {
      this.getActiveSlotMap();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extrae el perfil del jugador y su equipo Pokémon actual (hasta 6 slots)
   */
  public extractPlayerProfileAndTeam(): {
    trainerName: string;
    trainerId: number;
    secretId: number;
    money: number;
    party: PartyPokemonSummary[];
  } {
    const { sectorMap } = this.getActiveSlotMap();
    const sec0Sector = sectorMap.get(0);
    const sec1Sector = sectorMap.get(1);
    if (sec0Sector === undefined || sec1Sector === undefined) {
      throw new Error('Secciones 0 y/o 1 no encontradas en el slot activo');
    }
    const sec0Base = sec0Sector * SECTOR_SIZE;
    const sec1Base = sec1Sector * SECTOR_SIZE;

    // SaveBlock2
    const trainerName = decodeGbaString(
      this.buffer.subarray(sec0Base + OFFSETS.SB2_PLAYER_NAME, sec0Base + OFFSETS.SB2_PLAYER_NAME + 8)
    );
    const fullOtId = this.view.getUint32(sec0Base + OFFSETS.SB2_TRAINER_ID, true);
    const trainerId = fullOtId & 0xFFFF;
    const secretId = fullOtId >>> 16;
    const encryptionKey = this.view.getUint32(sec0Base + OFFSETS.SB2_ENCRYPTION_KEY, true);

    // SaveBlock1
    const encryptedMoney = this.view.getUint32(sec1Base + OFFSETS.SB1_MONEY, true);
    const money = (encryptedMoney ^ encryptionKey) >>> 0;

    const partyCount = Math.min(6, this.view.getUint32(sec1Base + OFFSETS.SB1_PARTY_COUNT, true) & 0xFF);
    const party: PartyPokemonSummary[] = [];

    for (let i = 0; i < partyCount; i++) {
      const pBase = sec1Base + OFFSETS.SB1_PARTY_DATA + i * 100;
      const personality = this.view.getUint32(pBase + 0x00, true);
      const otId = this.view.getUint32(pBase + 0x04, true);
      const nickname = decodeGbaString(this.buffer.subarray(pBase + 0x08, pBase + 0x12));
      const level = this.view.getUint8(pBase + 0x54);
      const hp = this.view.getUint16(pBase + 0x56, true);
      const maxHp = this.view.getUint16(pBase + 0x58, true);

      // Desencriptar subestructura Growth con K = PID ^ OTID
      const decKey = (personality ^ otId) >>> 0;
      const growthBlockIndex = GROWTH_SUBSTRUCT_ORDER[personality % 24];
      const growthOffset = pBase + 0x20 + growthBlockIndex * 12;

      // Los 48 bytes (4 subestructuras * 12 bytes) se XOR por words de 32 bits
      const word0 = (this.view.getUint32(growthOffset, true) ^ decKey) >>> 0;
      const speciesId = word0 & 0xFFFF;
      const heldItemId = (word0 >>> 16) & 0xFFFF;

      // Detección de Huevo (species == egg id o flag en misc)
      const isEgg = speciesId === 0x019C || level === 0;

      // Detección de Shiny: XOR de TID, SID, PID_high, PID_low
      const pHigh = personality >>> 16;
      const pLow = personality & 0xFFFF;
      const otHigh = otId >>> 16;
      const otLow = otId & 0xFFFF;
      const shinyXor = pHigh ^ pLow ^ otHigh ^ otLow;
      const isShiny = shinyXor < 8; // Umbral estándar Gen 3

      party.push({
        slot: i + 1,
        speciesId,
        nickname,
        level,
        hp,
        maxHp,
        heldItemId,
        isShiny,
        isEgg,
        natureId: personality % 25,
        personality,
      });
    }

    return { trainerName, trainerId, secretId, money, party };
  }

  /**
   * Inyecta dinero e ítems en el Slot Activo, cifra con encryptionKey
   * y recalcula el Checksum de la Sección 1 para evitar corrupción.
   */
  public injectRewards(payload: InjectionPayload): Uint8Array {
    const { sectorMap } = this.getActiveSlotMap();
    const sec0Sector = sectorMap.get(0);
    const sec1Sector = sectorMap.get(1);
    if (sec0Sector === undefined || sec1Sector === undefined) {
      throw new Error('Secciones 0 y/o 1 no encontradas');
    }
    const sec0Base = sec0Sector * SECTOR_SIZE;
    const sec1Base = sec1Sector * SECTOR_SIZE;

    const encryptionKey = this.view.getUint32(sec0Base + OFFSETS.SB2_ENCRYPTION_KEY, true);
    const key16 = encryptionKey & 0xFFFF;

    // 1. Inyección o Espejo Exacto de Dinero
    if (typeof payload.setExactMoney === 'number' && payload.setExactMoney >= 0) {
      const exact = Math.min(999999, Math.max(0, Math.round(payload.setExactMoney)));
      this.view.setUint32(sec1Base + OFFSETS.SB1_MONEY, (exact ^ encryptionKey) >>> 0, true);
    } else if (payload.addMoney && payload.addMoney > 0) {
      const currentEncrypted = this.view.getUint32(sec1Base + OFFSETS.SB1_MONEY, true);
      const currentMoney = (currentEncrypted ^ encryptionKey) >>> 0;
      const newMoney = Math.min(999999, currentMoney + payload.addMoney);
      this.view.setUint32(sec1Base + OFFSETS.SB1_MONEY, (newMoney ^ encryptionKey) >>> 0, true);
    }

    // 2. Inyección de Ítems
    if (payload.itemsToInject && payload.itemsToInject.length > 0) {
      const pocketMap: Record<BagPocketType, { offset: number; maxSlots: number }> = {
        ITEMS: OFFSETS.SB1_BAG_ITEMS,
        KEY_ITEMS: OFFSETS.SB1_BAG_KEY_ITEMS,
        POKEBALLS: OFFSETS.SB1_BAG_POKEBALLS,
        TMHM: OFFSETS.SB1_BAG_TMHM,
        BERRIES: OFFSETS.SB1_BAG_BERRIES,
      };

      for (const itemReq of payload.itemsToInject) {
        const pocketInfo = pocketMap[itemReq.pocket];
        let injected = false;

        for (let slot = 0; slot < pocketInfo.maxSlots; slot++) {
          const slotAddr = sec1Base + pocketInfo.offset + slot * 4;
          const existingItemId = this.view.getUint16(slotAddr, true);
          const encryptedQty = this.view.getUint16(slotAddr + 2, true);
          const currentQty = existingItemId === 0 ? 0 : (encryptedQty ^ key16);

          // Caso A: Ítem ya existe → sumar cantidad
          if (existingItemId === itemReq.itemId) {
            const updatedQty = Math.min(999, currentQty + itemReq.quantity);
            this.view.setUint16(slotAddr + 2, updatedQty ^ key16, true);
            injected = true;
            break;
          }

          // Caso B: Slot vacío → insertar nuevo ítem
          if (existingItemId === 0) {
            this.view.setUint16(slotAddr, itemReq.itemId, true);
            this.view.setUint16(slotAddr + 2, Math.min(999, itemReq.quantity) ^ key16, true);
            injected = true;
            break;
          }
        }

        if (!injected) {
          console.warn(
            `[gbaSaveEngine] Bolsillo ${itemReq.pocket} lleno — no se pudo inyectar itemId 0x${itemReq.itemId.toString(16)}`
          );
        }
      }
    }

    // 3. Recalcular Checksum de la Sección 1
    const newChecksum = GbaSaveManipulator.calculateSectionChecksum(
      this.view, sec1Base, SECTION_SIZES[1]
    );
    this.view.setUint16(sec1Base + 0x0FF6, newChecksum, true);

    return this.buffer;
  }

  /**
   * Inyecta un Pokémon completo (100 bytes) directamente en el equipo del jugador (SaveBlock1).
   * Genera PID genuino (o shiny), OTID del jugador, encripta las 4 subestructuras con PID ^ OTID,
   * calcula el checksum interno de 16 bits del Pokémon, actualiza playerPartyCount
   * y sella la Sección 1 con el checksum oficial de pokeemerald.
   */
  public injectPokemonToParty(options: PokemonInjectionOptions): PokemonInjectionResult {
    const { sectorMap } = this.getActiveSlotMap();
    const sec0Sector = sectorMap.get(0);
    const sec1Sector = sectorMap.get(1);
    if (sec0Sector === undefined || sec1Sector === undefined) {
      throw new Error('Secciones 0 y/o 1 no encontradas en el slot activo');
    }
    const sec0Base = sec0Sector * SECTOR_SIZE;
    const sec1Base = sec1Sector * SECTOR_SIZE;

    // Verificar espacio en el equipo o si se solicitó inyección directa a la PC Box 1
    const partyCount = this.view.getUint32(sec1Base + OFFSETS.SB1_PARTY_COUNT, true) & 0xFF;
    const forcePc = options.targetDestination === 'pc';
    const isPartyFull = forcePc || partyCount >= 6;

    let sec5Base: number | undefined;
    let pcSlot = -1;
    if (isPartyFull) {
      const sec5Sector = sectorMap.get(5);
      if (sec5Sector === undefined) {
        return {
          success: false,
          slot: -1,
          speciesId: options.speciesId,
          nickname: options.nickname || 'POKEMON',
          level: options.level,
          isShiny: !!options.isShiny,
          error: 'Equipo lleno (6/6) y Sector 5 (PC Box) no disponible.',
        };
      }
      sec5Base = sec5Sector * SECTOR_SIZE;
      const BOX_MON_SIZE = 80;
      const BOX_CAPACITY = 30;
      const BOX0_DATA_OFFSET = 0x0004;

      for (let i = 0; i < BOX_CAPACITY; i++) {
        const slotAddr = sec5Base + BOX0_DATA_OFFSET + i * BOX_MON_SIZE;
        const pid = this.view.getUint32(slotAddr, true);
        const ot = this.view.getUint32(slotAddr + 4, true);
        if (pid === 0 && ot === 0) {
          pcSlot = i;
          break;
        }
      }

      if (pcSlot === -1) {
        return {
          success: false,
          slot: -1,
          speciesId: options.speciesId,
          nickname: options.nickname || 'POKEMON',
          level: options.level,
          isShiny: !!options.isShiny,
          error: 'Equipo lleno (6/6) y PC Box 1 lleno (30/30). Libera espacio en el PC.',
        };
      }
    }

    // Datos del Entrenador Original (OT)
    const fullOtId = this.view.getUint32(sec0Base + OFFSETS.SB2_TRAINER_ID, true);
    const tid = fullOtId & 0xFFFF;
    const sid = fullOtId >>> 16;
    const target = tid ^ sid;

    // Generación de PID (Personalidad)
    let personality: number;
    const isShiny = !!options.isShiny;
    if (isShiny) {
      const pHigh = (Math.floor(Math.random() * 0xFFFF)) & 0xFFFF;
      const pLow = (target ^ pHigh ^ Math.floor(Math.random() * 8)) & 0xFFFF;
      personality = ((pHigh << 16) | pLow) >>> 0;
    } else {
      let p: number;
      do {
        p = (Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
      } while ((target ^ (p >>> 16) ^ (p & 0xFFFF)) < 8);
      personality = p;
    }

    const preset = REWARD_POKEMON_PRESETS[options.speciesId] ?? {
      name: `POKEMON_${options.speciesId}`,
      baseHp: 60, baseAtk: 60, baseDef: 60, baseSpd: 60, baseSpAtk: 60, baseSpDef: 60,
      moves: [33, 45, 0, 0], pps: [35, 40, 0, 0],
    };

    const nickname = (options.nickname || preset.name).toUpperCase();
    const level = Math.max(1, Math.min(100, options.level));
    const heldItemId = options.heldItemId || 0;
    const moves = options.moves && options.moves.length > 0 ? options.moves : preset.moves;
    const pps = preset.pps;

    // 1. Subestructura G (Growth - 12 bytes)
    const G = new Uint8Array(12);
    const gView = new DataView(G.buffer);
    gView.setUint16(0, options.speciesId, true);
    gView.setUint16(2, heldItemId, true);
    gView.setUint32(4, Math.floor(level * level * level), true);
    gView.setUint8(8, 0); // PP bonuses
    gView.setUint8(9, options.friendship !== undefined ? Math.min(255, options.friendship) : 70);

    // 2. Subestructura A (Attacks - 12 bytes)
    const A = new Uint8Array(12);
    const aView = new DataView(A.buffer);
    for (let m = 0; m < 4; m++) {
      aView.setUint16(m * 2, moves[m] || 0, true);
      aView.setUint8(8 + m, pps[m] || 0);
    }

    // 3. Subestructura E (EVs & Condition - 12 bytes)
    const E = new Uint8Array(12);

    // 4. Subestructura M (Misc - 12 bytes)
    const M = new Uint8Array(12);
    const mView = new DataView(M.buffer);
    mView.setUint8(0, 0); // Pokérus
    mView.setUint8(1, 0xFF); // Met Location: Fateful encounter / Special Gift
    const origins = (level & 0x7F) | (3 << 7) | (1 << 11);
    mView.setUint16(2, origins, true);
    const ivVal = options.perfectIVs ? 31 : 28;
    const ivs = (ivVal) | (ivVal << 5) | (ivVal << 10) | (ivVal << 15) | (ivVal << 20) | (ivVal << 25);
    mView.setUint32(4, ivs, true);
    mView.setUint32(8, 0x80000000, true); // Obedience bit

    // Permutar las 4 subestructuras
    const substructs = [G, A, E, M];
    const order = SUBSTRUCT_ORDER_PERMUTATIONS[personality % 24];
    const unencrypted = new Uint8Array(48);
    for (let pos = 0; pos < 4; pos++) {
      unencrypted.set(substructs[order[pos]], pos * 12);
    }

    // Checksum de los 48 bytes unencrypted (suma de u16 words)
    let pkmnChecksum = 0;
    const unencView = new DataView(unencrypted.buffer);
    for (let i = 0; i < 48; i += 2) {
      pkmnChecksum = (pkmnChecksum + unencView.getUint16(i, true)) & 0xFFFF;
    }

    // Encriptar los 48 bytes con K = personality ^ fullOtId
    const decKey = (personality ^ fullOtId) >>> 0;
    const encrypted = new Uint8Array(48);
    const encView = new DataView(encrypted.buffer);
    for (let i = 0; i < 48; i += 4) {
      encView.setUint32(i, (unencView.getUint32(i, true) ^ decKey) >>> 0, true);
    }

    // Ensamblar struct Pokemon de 100 bytes
    const pkmn = new Uint8Array(100);
    const pView = new DataView(pkmn.buffer);
    pView.setUint32(0x00, personality, true);
    pView.setUint32(0x04, fullOtId, true);
    pkmn.set(encodeGbaString(nickname, 10), 0x08);
    pView.setUint16(0x12, 0x0202, true); // English language
    pkmn.set(this.buffer.subarray(sec0Base + OFFSETS.SB2_PLAYER_NAME, sec0Base + OFFSETS.SB2_PLAYER_NAME + 7), 0x14);
    pView.setUint16(0x1C, pkmnChecksum, true);
    pkmn.set(encrypted, 0x20);

    if (isPartyFull) {
      // Escribir los primeros 80 bytes (struct BoxPokemon) en el slot libre de PC Box 1
      const BOX_MON_SIZE = 80;
      const BOX0_DATA_OFFSET = 0x0004;
      const targetOffset = sec5Base! + BOX0_DATA_OFFSET + pcSlot * BOX_MON_SIZE;
      this.buffer.set(pkmn.subarray(0, 80), targetOffset);

      // Recalcular Checksum de Section 5 (PokemonStorage Pt 1)
      const newSec5Checksum = GbaSaveManipulator.calculateSectionChecksum(
        this.view, sec5Base!, SECTION_SIZES[5]
      );
      this.view.setUint16(sec5Base! + 0x0FF6, newSec5Checksum, true);

      return {
        success: true,
        slot: -(pcSlot + 1), // Slot negativo indica ranura de PC
        inPcBox: true,
        box: 1,
        speciesId: options.speciesId,
        nickname,
        level,
        isShiny,
        updatedSav: this.buffer,
      };
    }

    // Calcular Stats de batalla para el equipo (offsets 0x50 - 0x63)
    const iv = options.perfectIVs ? 31 : 28;
    const maxHp = Math.floor(((2 * preset.baseHp + iv) * level) / 100) + level + 10;
    const atk = Math.floor(((2 * preset.baseAtk + iv) * level) / 100) + 5;
    const def = Math.floor(((2 * preset.baseDef + iv) * level) / 100) + 5;
    const spd = Math.floor(((2 * preset.baseSpd + iv) * level) / 100) + 5;
    const spAtk = Math.floor(((2 * preset.baseSpAtk + iv) * level) / 100) + 5;
    const spDef = Math.floor(((2 * preset.baseSpDef + iv) * level) / 100) + 5;

    pView.setUint8(0x54, level);
    pView.setUint16(0x56, maxHp, true); // HP actual
    pView.setUint16(0x58, maxHp, true); // HP máximo
    pView.setUint16(0x5A, atk, true);
    pView.setUint16(0x5C, def, true);
    pView.setUint16(0x5E, spd, true);
    pView.setUint16(0x60, spAtk, true);
    pView.setUint16(0x62, spDef, true);

    // Escribir en SaveBlock1 en el slot partyCount
    const targetOffset = sec1Base + OFFSETS.SB1_PARTY_DATA + partyCount * 100;
    this.buffer.set(pkmn, targetOffset);

    // Incrementar partyCount
    this.view.setUint32(sec1Base + OFFSETS.SB1_PARTY_COUNT, partyCount + 1, true);

    // Recalcular Checksum de SaveBlock1
    const newChecksum = GbaSaveManipulator.calculateSectionChecksum(
      this.view, sec1Base, SECTION_SIZES[1]
    );
    this.view.setUint16(sec1Base + 0x0FF6, newChecksum, true);

    return {
      success: true,
      slot: partyCount + 1,
      inPcBox: false,
      speciesId: options.speciesId,
      nickname,
      level,
      isShiny,
      updatedSav: this.buffer,
    };
  }
}

/**
 * Parche dinámico para la tabla de ítems de la ROM de Pokemon Heart & Soul.
 * Localiza la tabla gItems en memoria e infla los precios de Poké Balls,
 * Pociones y medicinas para obligar a los alumnos a usar la economía web.
 */
export function patchRomMartPrices(romBuffer: Uint8Array, multiplier = 50): { patched: boolean; count: number } {
  const masterBallSig = new Uint8Array([
    0xC7, 0xBB, 0xCD, 0xCE, 0xBF, 0xCC, 0x00, 0xBC, 0xBB, 0xC6, 0xC6, 0xFF
  ]);

  let tableOffset = -1;
  const limit = Math.min(romBuffer.byteLength - 44 * 40, 0x1000000);
  for (let i = 0x800000; i < limit; i++) {
    let match = true;
    for (let s = 0; s < masterBallSig.length; s++) {
      if (romBuffer[i + s] !== masterBallSig[s]) {
        match = false;
        break;
      }
    }
    if (match) {
      tableOffset = i;
      break;
    }
  }

  if (tableOffset === -1) {
    console.warn('[gbaSaveEngine] No se encontró la tabla gItems para hiperinflación');
    return { patched: false, count: 0 };
  }

  const view = new DataView(romBuffer.buffer, romBuffer.byteOffset, romBuffer.byteLength);
  let count = 0;

  for (let i = 0; i < 35; i++) {
    const itemOffset = tableOffset + i * 44;
    const price = view.getUint16(itemOffset + 16, true);
    if (price > 0) {
      const newPrice = Math.min(65000, price * multiplier);
      view.setUint16(itemOffset + 16, newPrice, true);
      count++;
    }
  }

  console.info(`[gbaSaveEngine] Hiperinflación aplicada a ${count} ítems en Marts de GBA (x${multiplier})`);
  return { patched: true, count };
}
