/**
 * @file src/lib/gba/gbaSaveEngine.ts
 * @description Motor Quirúrgico de Lectura, Extracción de Equipo e Inyección de Ítems/Dinero
 * para archivos .sav de Pokemon Heart & Soul v2.0.6 (pokeemerald-expansion base).
 *
 * Arquitectura de Flash 1Mbit (128 KB = 131,072 bytes):
 *   - 32 sectores de 4,096 bytes
 *   - Slot A = Sectores 0-13, Slot B = Sectores 14-27
 *   - Anillo rotativo (Ring Buffer): se debe escanear el footer de cada sector
 *   - Footer: SectionID(0x0FF4), Checksum(0x0FF6), Signature(0x0FF8), Counter(0x0FFC)
 *   - Compatible bidireccionalmente con HnS v2.0.6 (Perfil A) y fallback para builds heredados (Perfil B)
 */

// ============================================================================
// Constantes de la arquitectura Flash GBA
// ============================================================================

export const GBA_SAVE_SIZE = 0x20000; // 131,072 bytes (128 KB)
export const SECTOR_SIZE = 0x1000;    // 4,096 bytes por sector
export const SECTORS_PER_SLOT = 14;   // 14 secciones lógicas por slot
export const VALID_SIGNATURE = 0x08012025;

/** Tamaños válidos de datos por Section ID (HnS v2.0.6 / sSaveSlotLayout) */
export const SECTION_SIZES_V2: Record<number, number> = {
  0: 0x0F34,  // SaveBlock2 (3,892 bytes en v2.0.6)
  1: 0x0F80,  // SaveBlock1 Chunk 0 (3,968 bytes) -> Party, Money, Bag
  2: 0x0F80,  // SaveBlock1 Chunk 1
  3: 0x0F80,  // SaveBlock1 Chunk 2
  4: 0x0F10,  // SaveBlock1 Chunk 3 (3,856 bytes: 15,760 - 3 * 3,968)
  5: 0x0F80,  // PokemonStorage Chunk 0
  6: 0x0F80, 7: 0x0F80, 8: 0x0F80, 9: 0x0F80,
  10: 0x0F80, 11: 0x0F80, 12: 0x0F80,
  13: 0x0960  // PokemonStorage Chunk 8 (2,400 bytes: 34,144 - 8 * 3,968)
};

/** Tamaños heredados (Perfil B / pre-2.0.6) para retrocompatibilidad */
export const SECTION_SIZES_LEGACY: Record<number, number> = {
  0: 0x0F50,
  1: 0x0F80,
  2: 0x0F80,
  3: 0x0F80,
  4: 0x0F38,
  5: 0x0F80,
  6: 0x0F80, 7: 0x0F80, 8: 0x0F80, 9: 0x0F80,
  10: 0x0F80, 11: 0x0F80, 12: 0x0F80,
  13: 0x07D0
};

export const SECTION_SIZES = SECTION_SIZES_V2;

// ============================================================================
// Offsets dentro de SaveBlock2 y SaveBlock1 (v2.0.6 por defecto)
// ============================================================================

export interface SaveOffsets {
  SB2_PLAYER_NAME: number;
  SB2_TRAINER_ID: number;
  SB2_ENCRYPTION_KEY: number;

  SB1_SAVE_VERSION: number;
  SB1_PARTY_COUNT: number;
  SB1_PARTY_DATA: number;
  SB1_MONEY: number;
  SB1_COINS: number;
  SB1_PC_ITEMS: number;

  SB1_BAG_ITEMS: { offset: number; maxSlots: number };
  SB1_BAG_KEY_ITEMS: { offset: number; maxSlots: number };
  SB1_BAG_POKEBALLS: { offset: number; maxSlots: number };
  SB1_BAG_TMHM: { offset: number; maxSlots: number };
  SB1_BAG_BERRIES: { offset: number; maxSlots: number };
  SB1_BAG_MEDICINE: { offset: number; maxSlots: number };
}

export const OFFSETS_V2: SaveOffsets = {
  // SaveBlock2 (Sección Lógica 0)
  SB2_PLAYER_NAME: 0x0000,
  SB2_TRAINER_ID: 0x000A,      // u32: TID(16 low) | SID(16 high)
  SB2_ENCRYPTION_KEY: 0x00AC,  // u32: gcnLinkFlags @ 0xA8 + 4

  // SaveBlock1 (Sección Lógica 1)
  SB1_SAVE_VERSION: 0x0000,    // u16: saveVersion (5 en v2.0.6)
  SB1_PARTY_COUNT: 0x0238,     // offsetof(struct SaveBlock1, playerPartyCount)
  SB1_PARTY_DATA: 0x023C,      // 6 * 100 bytes (struct Pokemon)
  SB1_MONEY: 0x0494,           // u32 cifrado con encryptionKey (partyOffset + 600)
  SB1_COINS: 0x0498,           // u16 cifrado con key16
  SB1_PC_ITEMS: 0x049C,        // 50 * 4 bytes (ItemSlot, sin cifrar)

  // Mochila v2.0.6 (6 bolsillos combinados, total 653 slots)
  SB1_BAG_ITEMS:     { offset: 0x0564, maxSlots: 236 },
  SB1_BAG_KEY_ITEMS: { offset: 0x0914, maxSlots: 60 },
  SB1_BAG_POKEBALLS: { offset: 0x0A04, maxSlots: 39 },
  SB1_BAG_TMHM:      { offset: 0x0AA0, maxSlots: 160 },
  SB1_BAG_BERRIES:   { offset: 0x0D20, maxSlots: 66 },
  SB1_BAG_MEDICINE:  { offset: 0x0E28, maxSlots: 92 },
};

export const OFFSETS_LEGACY: SaveOffsets = {
  SB2_PLAYER_NAME: 0x0000,
  SB2_TRAINER_ID: 0x000A,
  SB2_ENCRYPTION_KEY: 0x00BC,

  SB1_SAVE_VERSION: 0x0000,
  SB1_PARTY_COUNT: 0x0234,
  SB1_PARTY_DATA: 0x0238,
  SB1_MONEY: 0x0490,
  SB1_COINS: 0x0494,
  SB1_PC_ITEMS: 0x0498,

  SB1_BAG_ITEMS:     { offset: 0x0560, maxSlots: 90 },
  SB1_BAG_KEY_ITEMS: { offset: 0x06C8, maxSlots: 30 },
  SB1_BAG_POKEBALLS: { offset: 0x0740, maxSlots: 16 },
  SB1_BAG_TMHM:      { offset: 0x0780, maxSlots: 64 },
  SB1_BAG_BERRIES:   { offset: 0x0880, maxSlots: 46 },
  SB1_BAG_MEDICINE:  { offset: 0x0560, maxSlots: 90 }, // En legacy medicine caía en items
};

export const OFFSETS = OFFSETS_V2;

/**
 * Catálogo de IDs de ítems oficiales para Pokémon Heart & Soul v2.0.6
 * (Basado en pokehns-expansion Release-v2.0.6)
 */
export const HNS_ITEM_IDS = {
  // Poké Balls (1..27)
  POKE_BALL: 0x0001,
  GREAT_BALL: 0x0002,
  ULTRA_BALL: 0x0003,
  MASTER_BALL: 0x0004,

  // Medicinas & Restauradores (28..54)
  POTION: 0x001C,         // 28
  SUPER_POTION: 0x001D,   // 29
  HYPER_POTION: 0x001E,   // 30
  MAX_POTION: 0x001F,     // 31
  FULL_RESTORE: 0x0020,   // 32
  REVIVE: 0x0021,         // 33
  MAX_REVIVE: 0x0022,     // 34
  FULL_HEAL: 0x0030,      // 48
  MAX_ELIXIR: 0x0034,     // 52
  SACRED_ASH: 0x0036,     // 54
  PP_MAX: 0x0048,         // 72

  // Objetos de Crianza & Entrenamiento
  ABILITY_CAPSULE: 0x004F,// 79
  ABILITY_PATCH: 0x0050,  // 80
  RARE_CANDY: 0x0066,     // 102
  ESCAPE_ROPE: 0x0078,    // 120
  HEART_SCALE: 0x0098,    // 152
  EVERSTONE: 0x00F5,      // 245

  // Piedras Evolutivas
  FIRE_STONE: 0x00D3,     // 211
  WATER_STONE: 0x00D4,    // 212
  THUNDER_STONE: 0x00D5,  // 213
  LEAF_STONE: 0x00D6,     // 214
  SUN_STONE: 0x00D8,      // 216
  MOON_STONE: 0x00D9,     // 217

  // Competitivos
  MACHO_BRACE: 0x01A2,    // 418
  CHOICE_BAND: 0x01BA,    // 442
  CHOICE_SPECS: 0x01BB,   // 443
  CHOICE_SCARF: 0x01BC,   // 444
  SOOTHE_BELL: 0x01CF,    // 463
  LUCKY_EGG: 0x01D6,      // 470
  SCOPE_LENS: 0x01D7,     // 471
  LEFTOVERS: 0x01D8,      // 472
  SHELL_BELL: 0x01D9,     // 473
  LIFE_ORB: 0x01DF,       // 479
  FOCUS_SASH: 0x01E1,     // 481
  EVIOLITE: 0x01EE,       // 494
  ASSAULT_VEST: 0x01F7,   // 503
} as const;

export type BagPocketType = 'ITEMS' | 'KEY_ITEMS' | 'POKEBALLS' | 'TMHM' | 'BERRIES' | 'MEDICINE';

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
// Perfil dinámico desde GFRomHeader en tiempo de ejecución
// ============================================================================

export interface RomProfile {
  isV2: boolean;
  saveBlock2Size: number;
  saveBlock1Size: number;
  partyCountOffset: number;
  partyOffset: number;
  moneyOffset: number;
  coinsOffset: number;
  bagOffset: number;
  pcItemsOffset: number;
  encryptionKeyOffset: number;
  sectionSizes: Record<number, number>;
  offsets: SaveOffsets;
}

/**
 * Inspecciona un binario .gba en runtime para extraer los offsets reales de GFRomHeader
 */
export function resolveProfile(rom: Uint8Array): RomProfile {
  const dv = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);
  const needle = 'pokemon emerald version';
  let base = 0x100;
  for (let i = 0x100; i < Math.min(rom.length - needle.length, 0x1000); i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (rom[i + j] !== needle.charCodeAt(j)) {
        match = false;
        break;
      }
    }
    if (match) {
      base = i - 0x08;
      break;
    }
  }

  const u32 = (o: number) => dv.getUint32(base + o, true);
  const u8 = (o: number) => dv.getUint8(base + o);

  const saveBlock2Size = u32(0x88);
  const saveBlock1Size = u32(0x8C);
  const partyCountOffset = u32(0x90);
  const partyOffset = u32(0x94);
  const pcItemsOffset = u32(0xEC);
  const encryptionKeyOffset = u32(0xD8) + 4;

  const isV2 = partyCountOffset === 0x0238 || saveBlock1Size === 0x3D90;

  const bagCountItems = u8(0xE4);
  const bagCountKeyItems = u8(0xE5);
  const bagCountPokeballs = u8(0xE6);
  const bagCountTMHMs = u8(0xE7);
  const bagCountBerries = u8(0xE8);
  const bagCountMedicine = isV2 ? 92 : 0;

  const bagOffset = pcItemsOffset + 50 * 4;

  const offsets: SaveOffsets = {
    SB2_PLAYER_NAME: 0x0000,
    SB2_TRAINER_ID: 0x000A,
    SB2_ENCRYPTION_KEY: encryptionKeyOffset,
    SB1_SAVE_VERSION: 0x0000,
    SB1_PARTY_COUNT: partyCountOffset,
    SB1_PARTY_DATA: partyOffset,
    SB1_MONEY: partyOffset + 6 * 100,
    SB1_COINS: partyOffset + 6 * 100 + 4,
    SB1_PC_ITEMS: pcItemsOffset,
    SB1_BAG_ITEMS: { offset: bagOffset, maxSlots: bagCountItems },
    SB1_BAG_KEY_ITEMS: { offset: bagOffset + bagCountItems * 4, maxSlots: bagCountKeyItems },
    SB1_BAG_POKEBALLS: { offset: bagOffset + (bagCountItems + bagCountKeyItems) * 4, maxSlots: bagCountPokeballs },
    SB1_BAG_TMHM: { offset: bagOffset + (bagCountItems + bagCountKeyItems + bagCountPokeballs) * 4, maxSlots: bagCountTMHMs },
    SB1_BAG_BERRIES: { offset: bagOffset + (bagCountItems + bagCountKeyItems + bagCountPokeballs + bagCountTMHMs) * 4, maxSlots: bagCountBerries },
    SB1_BAG_MEDICINE: {
      offset: bagOffset + (bagCountItems + bagCountKeyItems + bagCountPokeballs + bagCountTMHMs + bagCountBerries) * 4,
      maxSlots: bagCountMedicine
    },
  };

  const sectionSizes: Record<number, number> = {
    0: saveBlock2Size,
    1: 0x0F80,
    2: 0x0F80,
    3: 0x0F80,
    4: saveBlock1Size - 3 * 3968,
    5: 0x0F80,
    6: 0x0F80, 7: 0x0F80, 8: 0x0F80, 9: 0x0F80,
    10: 0x0F80, 11: 0x0F80, 12: 0x0F80,
    13: isV2 ? 0x0960 : 0x07D0,
  };

  return {
    isV2,
    saveBlock2Size,
    saveBlock1Size,
    partyCountOffset,
    partyOffset,
    moneyOffset: partyOffset + 600,
    coinsOffset: partyOffset + 604,
    bagOffset,
    pcItemsOffset,
    encryptionKeyOffset,
    sectionSizes,
    offsets,
  };
}

// ============================================================================
// Tabla de permutación para Growth substruct (PID % 24)
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

export function decodeGbaString(bytes: Uint8Array): string {
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
  private activeOffsets: SaveOffsets;
  private activeSectionSizes: Record<number, number>;
  public isV2Save = true;

  constructor(savBuffer: ArrayBuffer | Uint8Array, customProfile?: RomProfile) {
    const raw = savBuffer instanceof Uint8Array ? savBuffer : new Uint8Array(savBuffer);
    if (raw.byteLength < 0x1C000) {
      throw new Error(
        `Archivo .sav inválido (${raw.byteLength} bytes). Se requieren al menos 114,688 bytes (idealmente 131,072).`
      );
    }
    // Si viene con bytes de cola (ej. 131088 bytes), usar solo el rango de 128KB estándar
    this.buffer = new Uint8Array(raw.subarray(0, Math.min(raw.byteLength, GBA_SAVE_SIZE)));
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);

    if (customProfile) {
      this.activeOffsets = customProfile.offsets;
      this.activeSectionSizes = customProfile.sectionSizes;
      this.isV2Save = customProfile.isV2;
    } else {
      // Auto-detección por análisis del SaveBlock
      const detected = this.detectProfileFromSave();
      this.activeOffsets = detected.offsets;
      this.activeSectionSizes = detected.sectionSizes;
      this.isV2Save = detected.isV2;
    }
  }

  /**
   * Detecta si la partida fue generada por v2.0.6 o por el motor heredado
   */
  private detectProfileFromSave(): { isV2: boolean; offsets: SaveOffsets; sectionSizes: Record<number, number> } {
    try {
      const { sectorMap } = this.getActiveSlotMap();
      const sec0Sector = sectorMap.get(0);
      const sec1Sector = sectorMap.get(1);
      if (sec0Sector !== undefined && sec1Sector !== undefined) {
        const sec0Base = sec0Sector * SECTOR_SIZE;
        const sec1Base = sec1Sector * SECTOR_SIZE;

        // Indicador 1: saveVersion en Sec1 @ 0x0000 (v2.0.6 tiene 5)
        const saveVer = this.view.getUint16(sec1Base, true);
        if (saveVer === 5) {
          return { isV2: true, offsets: OFFSETS_V2, sectionSizes: SECTION_SIZES_V2 };
        }

        // Indicador 2: Validar descifrado de dinero con clave 0xAC vs 0xBC
        const keyV2 = this.view.getUint32(sec0Base + 0x00AC, true);
        const moneyV2 = (this.view.getUint32(sec1Base + 0x0494, true) ^ keyV2) >>> 0;

        const keyLegacy = this.view.getUint32(sec0Base + 0x00BC, true);
        const moneyLegacy = (this.view.getUint32(sec1Base + 0x0490, true) ^ keyLegacy) >>> 0;

        if (moneyV2 <= 999999 && moneyLegacy > 999999) {
          return { isV2: true, offsets: OFFSETS_V2, sectionSizes: SECTION_SIZES_V2 };
        }
        if (moneyLegacy <= 999999 && moneyV2 > 999999) {
          return { isV2: false, offsets: OFFSETS_LEGACY, sectionSizes: SECTION_SIZES_LEGACY };
        }
      }
    } catch {
      // En caso de save no inicializado, priorizar v2.0.6
    }
    return { isV2: true, offsets: OFFSETS_V2, sectionSizes: SECTION_SIZES_V2 };
  }

  /** Retorna el buffer .sav actual */
  public getBuffer(): Uint8Array {
    return this.buffer;
  }

  /** Retorna los offsets activos del motor */
  public getOffsets(): SaveOffsets {
    return this.activeOffsets;
  }

  /**
   * Checksum oficial de pokeemerald / pokehns-expansion (src/save.c -> CalculateChecksum)
   * Suma palabras u32 con overflow modular de 32 bits, pliega a 16 bits y trunca el carry.
   */
  public static calculateSectionChecksum(
    dataView: DataView, byteOffset: number, lengthInBytes: number
  ): number {
    let sum = 0 >>> 0;
    const numWords = lengthInBytes >>> 2;
    for (let i = 0; i < numWords; i++) {
      sum = (sum + dataView.getUint32(byteOffset + i * 4, true)) >>> 0;
    }
    return (((sum >>> 16) + sum) & 0xFFFF) >>> 0;
  }

  /**
   * Escanea ambos slots físicos y determina cuál es el activo
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

  /** Valida integridad del .sav sin lanzar excepciones */
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
      this.buffer.subarray(
        sec0Base + this.activeOffsets.SB2_PLAYER_NAME,
        sec0Base + this.activeOffsets.SB2_PLAYER_NAME + 8
      )
    );
    const fullOtId = this.view.getUint32(sec0Base + this.activeOffsets.SB2_TRAINER_ID, true);
    const trainerId = fullOtId & 0xFFFF;
    const secretId = fullOtId >>> 16;
    const encryptionKey = this.view.getUint32(sec0Base + this.activeOffsets.SB2_ENCRYPTION_KEY, true);

    // SaveBlock1
    const encryptedMoney = this.view.getUint32(sec1Base + this.activeOffsets.SB1_MONEY, true);
    const money = (encryptedMoney ^ encryptionKey) >>> 0;

    const partyCountRaw = this.view.getUint8(sec1Base + this.activeOffsets.SB1_PARTY_COUNT);
    const partyCount = Math.min(6, Math.max(0, partyCountRaw));
    const party: PartyPokemonSummary[] = [];

    for (let i = 0; i < partyCount; i++) {
      const pBase = sec1Base + this.activeOffsets.SB1_PARTY_DATA + i * 100;
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

      const word0 = (this.view.getUint32(growthOffset, true) ^ decKey) >>> 0;
      const speciesId = word0 & 0xFFFF;
      const heldItemId = (word0 >>> 16) & 0xFFFF;

      // Detección de Huevo
      const isEgg = speciesId === 0x019C || level === 0;

      // Detección de Shiny con soporte de shinyModifier en bit 14 de 0x1E
      const pHigh = personality >>> 16;
      const pLow = personality & 0xFFFF;
      const otHigh = otId >>> 16;
      const otLow = otId & 0xFFFF;
      const naturalShiny = (pHigh ^ pLow ^ otHigh ^ otLow) < 8;

      const u16_1E = this.view.getUint16(pBase + 0x1E, true);
      const shinyModifierBit = (u16_1E >> 14) & 1;
      const isShiny = naturalShiny ? shinyModifierBit === 0 : shinyModifierBit === 1;

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
   * y recalcula el Checksum de la Sección 1.
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

    const encryptionKey = this.view.getUint32(sec0Base + this.activeOffsets.SB2_ENCRYPTION_KEY, true);
    const key16 = encryptionKey & 0xFFFF;

    // 1. Dinero
    if (typeof payload.setExactMoney === 'number' && payload.setExactMoney >= 0) {
      const exact = Math.min(999999, Math.max(0, Math.round(payload.setExactMoney)));
      this.view.setUint32(sec1Base + this.activeOffsets.SB1_MONEY, (exact ^ encryptionKey) >>> 0, true);
    } else if (payload.addMoney && payload.addMoney > 0) {
      const currentEncrypted = this.view.getUint32(sec1Base + this.activeOffsets.SB1_MONEY, true);
      const currentMoney = (currentEncrypted ^ encryptionKey) >>> 0;
      const newMoney = Math.min(999999, currentMoney + payload.addMoney);
      this.view.setUint32(sec1Base + this.activeOffsets.SB1_MONEY, (newMoney ^ encryptionKey) >>> 0, true);
    }

    // 2. Ítems
    if (payload.itemsToInject && payload.itemsToInject.length > 0) {
      const pocketMap: Record<BagPocketType, { offset: number; maxSlots: number }> = {
        ITEMS: this.activeOffsets.SB1_BAG_ITEMS,
        KEY_ITEMS: this.activeOffsets.SB1_BAG_KEY_ITEMS,
        POKEBALLS: this.activeOffsets.SB1_BAG_POKEBALLS,
        TMHM: this.activeOffsets.SB1_BAG_TMHM,
        BERRIES: this.activeOffsets.SB1_BAG_BERRIES,
        MEDICINE: this.activeOffsets.SB1_BAG_MEDICINE,
      };

      for (const itemReq of payload.itemsToInject) {
        // Enrutamiento inteligente: si es medicina (28..72, 102) y se pidió ITEMS en v2, redirigir a MEDICINE
        let targetPocket = itemReq.pocket;
        if (this.isV2Save && targetPocket === 'ITEMS') {
          if ((itemReq.itemId >= 28 && itemReq.itemId <= 72) || itemReq.itemId === 102) {
            targetPocket = 'MEDICINE';
          }
        }

        const pocketInfo = pocketMap[targetPocket] || pocketMap.ITEMS;
        let injected = false;

        for (let slot = 0; slot < pocketInfo.maxSlots; slot++) {
          const slotAddr = sec1Base + pocketInfo.offset + slot * 4;
          const existingItemId = this.view.getUint16(slotAddr, true);
          const encryptedQty = this.view.getUint16(slotAddr + 2, true);
          const currentQty = existingItemId === 0 ? 0 : (encryptedQty ^ key16);

          // Caso A: Ya existe → sumar cantidad
          if (existingItemId === itemReq.itemId) {
            const updatedQty = Math.min(999, currentQty + itemReq.quantity);
            this.view.setUint16(slotAddr + 2, updatedQty ^ key16, true);
            injected = true;
            break;
          }

          // Caso B: Slot vacío → insertar nuevo
          if (existingItemId === 0) {
            this.view.setUint16(slotAddr, itemReq.itemId, true);
            this.view.setUint16(slotAddr + 2, Math.min(999, itemReq.quantity) ^ key16, true);
            injected = true;
            break;
          }
        }

        if (!injected) {
          console.warn(
            `[gbaSaveEngine] Bolsillo ${targetPocket} lleno — no se pudo inyectar itemId 0x${itemReq.itemId.toString(16)}`
          );
        }
      }
    }

    // 3. Recalcular Checksum de la Sección 1
    const newChecksum = GbaSaveManipulator.calculateSectionChecksum(
      this.view, sec1Base, this.activeSectionSizes[1]
    );
    this.view.setUint16(sec1Base + 0x0FF6, newChecksum, true);

    return this.buffer;
  }

  /**
   * Inyecta un Pokémon completo (100 bytes) directamente en el equipo del jugador (SaveBlock1)
   * o en la PC Box 1 (Section 5) si el equipo está lleno.
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

    const partyCountRaw = this.view.getUint8(sec1Base + this.activeOffsets.SB1_PARTY_COUNT);
    const partyCount = Math.min(6, Math.max(0, partyCountRaw));
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

    // Datos del Entrenador Original
    const fullOtId = this.view.getUint32(sec0Base + this.activeOffsets.SB2_TRAINER_ID, true);
    const tid = fullOtId & 0xFFFF;
    const sid = fullOtId >>> 16;
    const target = tid ^ sid;

    // Generación de PID
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
    gView.setUint8(8, 0);
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
    mView.setUint8(1, 0xFF); // Met Location: Fateful encounter
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

    // Checksum de los 48 bytes unencrypted
    let pkmnChecksum = 0;
    const unencView = new DataView(unencrypted.buffer);
    for (let i = 0; i < 48; i += 2) {
      pkmnChecksum = (pkmnChecksum + unencView.getUint16(i, true)) & 0xFFFF;
    }

    // Cifrar los 48 bytes con PID ^ OTID
    const decKey = (personality ^ fullOtId) >>> 0;
    const encrypted = new Uint8Array(48);
    const encView = new DataView(encrypted.buffer);
    for (let i = 0; i < 48; i += 4) {
      encView.setUint32(i, (unencView.getUint32(i, true) ^ decKey) >>> 0, true);
    }

    // Ensamblar struct Pokemon (100 bytes)
    const pkmn = new Uint8Array(100);
    const pView = new DataView(pkmn.buffer);
    pView.setUint32(0x00, personality, true);
    pView.setUint32(0x04, fullOtId, true);
    pkmn.set(encodeGbaString(nickname, 10), 0x08);
    pView.setUint16(0x12, 0x0202, true);
    pkmn.set(
      this.buffer.subarray(
        sec0Base + this.activeOffsets.SB2_PLAYER_NAME,
        sec0Base + this.activeOffsets.SB2_PLAYER_NAME + 7
      ),
      0x14
    );
    pView.setUint16(0x1C, pkmnChecksum, true);

    // Calcular shinyModifier para HnS v2.0.6 (bit 14 en 0x1E)
    const naturalShiny = (target ^ (personality >>> 16) ^ (personality & 0xFFFF)) < 8;
    const shinyModifierBit = (naturalShiny ? 1 : 0) ^ (isShiny ? 1 : 0);
    pView.setUint16(0x1E, shinyModifierBit << 14, true);

    pkmn.set(encrypted, 0x20);

    if (isPartyFull) {
      const BOX_MON_SIZE = 80;
      const BOX0_DATA_OFFSET = 0x0004;
      const targetOffset = sec5Base! + BOX0_DATA_OFFSET + pcSlot * BOX_MON_SIZE;
      this.buffer.set(pkmn.subarray(0, 80), targetOffset);

      const newSec5Checksum = GbaSaveManipulator.calculateSectionChecksum(
        this.view, sec5Base!, this.activeSectionSizes[5]
      );
      this.view.setUint16(sec5Base! + 0x0FF6, newSec5Checksum, true);

      return {
        success: true,
        slot: -(pcSlot + 1),
        inPcBox: true,
        box: 1,
        speciesId: options.speciesId,
        nickname,
        level,
        isShiny,
        updatedSav: this.buffer,
      };
    }

    // Stats de combate (offsets 0x50 - 0x63)
    const iv = options.perfectIVs ? 31 : 28;
    const maxHp = Math.floor(((2 * preset.baseHp + iv) * level) / 100) + level + 10;
    const atk = Math.floor(((2 * preset.baseAtk + iv) * level) / 100) + 5;
    const def = Math.floor(((2 * preset.baseDef + iv) * level) / 100) + 5;
    const spd = Math.floor(((2 * preset.baseSpd + iv) * level) / 100) + 5;
    const spAtk = Math.floor(((2 * preset.baseSpAtk + iv) * level) / 100) + 5;
    const spDef = Math.floor(((2 * preset.baseSpDef + iv) * level) / 100) + 5;

    pView.setUint8(0x54, level);
    pView.setUint16(0x56, maxHp, true);
    pView.setUint16(0x58, maxHp, true);
    pView.setUint16(0x5A, atk, true);
    pView.setUint16(0x5C, def, true);
    pView.setUint16(0x5E, spd, true);
    pView.setUint16(0x60, spAtk, true);
    pView.setUint16(0x62, spDef, true);

    const targetOffset = sec1Base + this.activeOffsets.SB1_PARTY_DATA + partyCount * 100;
    this.buffer.set(pkmn, targetOffset);

    // Incrementar partyCount (1 byte en partyCountOffset)
    this.view.setUint8(sec1Base + this.activeOffsets.SB1_PARTY_COUNT, partyCount + 1);

    // Recalcular Checksum de SaveBlock1
    const newChecksum = GbaSaveManipulator.calculateSectionChecksum(
      this.view, sec1Base, this.activeSectionSizes[1]
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
 * Compatible con la ubicación en v2.0.6 (0x7A5C50) y legado (0x8FE9C0).
 */
export function patchRomMartPrices(romBuffer: Uint8Array, multiplier = 50): { patched: boolean; count: number } {
  const masterBallSig = new Uint8Array([
    0xC7, 0xBB, 0xCD, 0xCE, 0xBF, 0xCC, 0x00, 0xBC, 0xBB, 0xC6, 0xC6, 0xFF
  ]);

  let tableOffset = -1;
  const limit = Math.min(romBuffer.byteLength - 44 * 40, 0x1000000);
  // Escanear desde 0x500000 para cubrir tanto v2.0.6 (0x7A5C50) como v1.0 (0x8FE9C0)
  for (let i = 0x500000; i < limit; i++) {
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

  console.info(`[gbaSaveEngine] Hiperinflación aplicada a ${count} ítems en Marts de GBA @ 0x${tableOffset.toString(16)} (x${multiplier})`);
  return { patched: true, count };
}
