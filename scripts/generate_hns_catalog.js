const fs = require('fs');
const path = require('path');

const ROM_PATH = path.join(__dirname, '../public/roms/pokemonHnS.gba');
const OUT_PATH = path.join(__dirname, '../src/lib/hnsCatalog.ts');

const rom = fs.readFileSync(ROM_PATH);

const ITEMS_BASE = 0x8fe9c0;
const ITEMS_ENTRY_SIZE = 44;
const MOVES_BASE = 0x745b74;
const TMHM_MOVES_OFFSET = 0x91b450;

function decodeGba(buf) {
  let s = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0xff) break;
    if (b >= 0xbb && b <= 0xd4) s += String.fromCharCode(65 + (b - 0xbb));
    else if (b >= 0xd5 && b <= 0xef) s += String.fromCharCode(97 + (b - 0xd5));
    else if (b >= 0xa1 && b <= 0xaa) s += String.fromCharCode(48 + (b - 0xa1));
    else if (b === 0x00) s += ' ';
    else if (b === 0xae) s += '-';
    else s += '?';
  }
  return s.trim();
}

function moveName(moveId) {
  if (!moveId) return '---';
  const off = MOVES_BASE + moveId * 13;
  return decodeGba(rom.subarray(off, off + 13));
}

// ---------------------------------------------------------------------------
// 1. Item table: scan entries, group by the real item id stored at offset 14.
//    When an item id appears multiple times, the highest entry is the
//    expanded H&S definition (the lower ones are legacy duplicates).
// ---------------------------------------------------------------------------
const entries = [];
for (let entry = 1; entry <= 800; entry++) {
  const off = ITEMS_BASE + (entry - 1) * ITEMS_ENTRY_SIZE;
  const itemId = rom.readUInt16LE(off + 14);
  const name = decodeGba(rom.subarray(off, off + 14));
  if (!itemId || !name) continue;
  entries.push({
    entry,
    itemId,
    name,
    price: rom.readUInt16LE(off + 16),
    pocket: rom[off + 40],
  });
}

const canonicalById = new Map();
for (const item of entries) {
  const prev = canonicalById.get(item.itemId);
  if (!prev || item.entry > prev.entry) canonicalById.set(item.itemId, item);
}

function findByName(name) {
  const wanted = name.toUpperCase();
  let best = null;
  for (const item of entries) {
    if (item.name.toUpperCase() === wanted) {
      if (!best || item.entry > best.entry) best = item;
    }
  }
  return best;
}

function idOf(name) {
  const item = findByName(name);
  return item ? item.itemId : null;
}

const KEY_ITEMS = {
  MASTER_BALL: 'MASTER BALL',
  ULTRA_BALL: 'ULTRA BALL',
  GREAT_BALL: 'GREAT BALL',
  POKE_BALL: 'POK? BALL',
  POTION: 'POTION',
  SUPER_POTION: 'SUPER POTION',
  HYPER_POTION: 'HYPER POTION',
  MAX_POTION: 'MAX POTION',
  FULL_RESTORE: 'FULL RESTORE',
  FULL_HEAL: 'FULL HEAL',
  REVIVE: 'REVIVE',
  MAX_REVIVE: 'MAX REVIVE',
  SACRED_ASH: 'SACRED ASH',
  RARE_CANDY: 'RARE CANDY',
  HEART_SCALE: 'HEART SCALE',
  EVERSTONE: 'EVERSTONE',
  LEFTOVERS: 'LEFTOVERS',
  SOOTHE_BELL: 'SOOTHE BELL',
  LUCKY_EGG: 'LUCKY EGG',
  CHOICE_BAND: 'CHOICE BAND',
  MACHO_BRACE: 'MACHO BRACE',
  SCOPE_LENS: 'SCOPE LENS',
  SHELL_BELL: 'SHELL BELL',
  MAX_ELIXIR: 'MAX ELIXIR',
  PP_MAX: 'PP MAX',
  FIRE_STONE: 'FIRE STONE',
  WATER_STONE: 'WATER STONE',
  THUNDER_STONE: 'THUNDERSTONE',
  MOON_STONE: 'MOON STONE',
  SUN_STONE: 'SUN STONE',
  LEAF_STONE: 'LEAF STONE',
  ESCAPE_ROPE: 'ESCAPE ROPE',
};

const keyItemIds = {};
for (const [constant, name] of Object.entries(KEY_ITEMS)) {
  const item = findByName(name);
  if (item) keyItemIds[constant] = item.itemId;
}

// ---------------------------------------------------------------------------
// 2. TM metadata (Gen 3 values, in TM order)
// ---------------------------------------------------------------------------
const TM_META = [
  ['Fighting', 150, 100, 20],
  ['Dragon', 80, 100, 15],
  ['Water', 60, 100, 20],
  ['Psychic', null, null, 20],
  ['Normal', null, 100, 20],
  ['Poison', null, 90, 10],
  ['Ice', null, null, 10],
  ['Fighting', null, null, 20],
  ['Grass', 10, 100, 30],
  ['Normal', 60, 100, 15],
  ['Fire', null, null, 5],
  ['Dark', null, 100, 20],
  ['Ice', 95, 100, 10],
  ['Ice', 120, 70, 5],
  ['Normal', 150, 90, 5],
  ['Psychic', null, null, 30],
  ['Normal', null, null, 10],
  ['Water', null, null, 5],
  ['Grass', 75, 100, 10],
  ['Normal', null, null, 25],
  ['Normal', null, 100, 20],
  ['Grass', 120, 100, 10],
  ['Steel', 100, 75, 15],
  ['Electric', 95, 100, 15],
  ['Electric', 120, 70, 10],
  ['Ground', 100, 100, 10],
  ['Normal', null, 100, 20],
  ['Ground', 80, 100, 10],
  ['Psychic', 90, 100, 10],
  ['Ghost', 80, 100, 15],
  ['Fighting', 75, 100, 15],
  ['Normal', null, null, 15],
  ['Psychic', null, null, 20],
  ['Electric', 60, null, 20],
  ['Fire', 95, 100, 15],
  ['Poison', 90, 100, 10],
  ['Rock', null, null, 10],
  ['Fire', 120, 85, 5],
  ['Rock', 60, 95, 15],
  ['Flying', 60, null, 20],
  ['Dark', null, 100, 15],
  ['Normal', 70, 100, 20],
  ['Normal', 70, 100, 20],
  ['Psychic', null, null, 10],
  ['Normal', null, 100, 15],
  ['Dark', 60, 100, 25],
  ['Steel', 70, 90, 25],
  ['Psychic', null, null, 10],
  ['Dark', null, null, 10],
  ['Fire', 130, 90, 5],
];

const TYPE_ES = {
  Fighting: 'Lucha',
  Dragon: 'Dragón',
  Water: 'Agua',
  Psychic: 'Psíquico',
  Normal: 'Normal',
  Poison: 'Veneno',
  Ice: 'Hielo',
  Grass: 'Planta',
  Fire: 'Fuego',
  Dark: 'Siniestro',
  Steel: 'Acero',
  Electric: 'Eléctrico',
  Ground: 'Tierra',
  Ghost: 'Fantasma',
  Flying: 'Volador',
  Rock: 'Roca',
  Bug: 'Bicho',
};

const MOVE_NAMES_ES = [
  'Puño Certero',
  'Garra Dragón',
  'Pulso de Agua',
  'Paz Mental',
  'Rugido',
  'Tóxico',
  'Granizo',
  'Corpulencia',
  'Semillera',
  'Poder Oculto',
  'Día Soleado',
  'Mofa',
  'Rayo Hielo',
  'Ventisca',
  'Hiperrayo',
  'Pantalla de Luz',
  'Protección',
  'Danza Lluvia',
  'Gigadrenado',
  'Salvaguardia',
  'Frustración',
  'Rayo Solar',
  'Cola Férrea',
  'Rayo',
  'Trueno',
  'Terremoto',
  'Retribución',
  'Excavar',
  'Psíquico',
  'Bola Sombra',
  'Demolición',
  'Doble Equipo',
  'Reflejo',
  'Onda Electrizante',
  'Lanzallamas',
  'Bomba Lodo',
  'Tormenta de Arena',
  'Llamarada',
  'Tumba Rocas',
  'Golpe Aéreo',
  'Tormento',
  'Fachada',
  'Poder Secreto',
  'Descanso',
  'Atracción',
  'Ladrón',
  'Ala de Acero',
  'Intercambio',
  'Robo',
  'Sofoco',
];

function tmAppPrice(type, power) {
  if (power === null) return 900;
  if (power >= 120) return 2200;
  if (power >= 95) return 1800;
  if (power >= 80) return 1400;
  if (power >= 60) return 1000;
  return 800;
}

const tms = [];
for (let n = 1; n <= 50; n++) {
  const itemId = 288 + n;
  const moveId = rom.readUInt16LE(TMHM_MOVES_OFFSET + (n - 1) * 2);
  const meta = TM_META[n - 1] || ['Normal', null, null, 10];
  const [typeEn, power, accuracy, pp] = meta;
  const type = TYPE_ES[typeEn] || typeEn;
  const moveName = MOVE_NAMES_ES[n - 1] || moveName(moveId);
  tms.push({
    code: `MT${String(n).padStart(2, '0')}`,
    itemId,
    moveId,
    moveName,
    type,
    power,
    accuracy,
    pp,
    price: tmAppPrice(typeEn, power),
    description: power
      ? `Ataque ${type} de potencia ${power}.`
      : `Movimiento de apoyo ${type}.`,
  });
}

// ---------------------------------------------------------------------------
// 3. Rare mints (the 5 selected for the shop)
// ---------------------------------------------------------------------------
const MINT_NAMES = [
  ['ADAMANT MINT', 'Adamant', '+Ataque / -At. Esp.'],
  ['TIMID MINT', 'Timid', '+Velocidad / -Ataque'],
  ['MODEST MINT', 'Modest', '+At. Esp. / -Ataque'],
  ['JOLLY MINT', 'Jolly', '+Velocidad / -At. Esp.'],
  ['BOLD MINT', 'Bold', '+Defensa / -Ataque'],
];

const mints = [];
for (const [romName, label, effect] of MINT_NAMES) {
  const item = findByName(romName);
  if (!item) continue;
  mints.push({
    code: `MINT_${label.toUpperCase()}`,
    itemId: item.itemId,
    name: `Mint ${label}`,
    effect,
    price: 3200,
    description: `Cambia la naturaleza del Pokemon a ${label}.`,
  });
}

// ---------------------------------------------------------------------------
// 4. Clean item map for the app (only named, valid entries)
// ---------------------------------------------------------------------------
const cleanItems = [];
for (const [itemId, item] of Array.from(canonicalById.entries()).sort((a, b) => a[0] - b[0])) {
  if (item.name.includes('?') && !item.name.includes('POK')) continue;
  cleanItems.push({
    itemId,
    name: item.name,
    price: item.price,
    pocket: item.pocket,
  });
}

const header = `// AUTO-GENERATED by scripts/generate_hns_catalog.js
// Source of truth: public/roms/pokemonHnS.gba (item table + TMHM move table).
// Do not edit by hand; run: node scripts/generate_hns_catalog.js

`;

const ts = `${header}export interface HnsItemInfo {
  itemId: number;
  name: string;
  price: number;
  pocket: number;
}

export interface HnsTm {
  code: string;
  itemId: number;
  moveId: number;
  moveName: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  price: number;
  description: string;
}

export interface HnsMint {
  code: string;
  itemId: number;
  name: string;
  effect: string;
  price: number;
  description: string;
}

export const HNS_ITEM_IDS = ${JSON.stringify(keyItemIds, null, 2)} as const;

export const HNS_ITEM_INFO: Record<number, HnsItemInfo> = ${JSON.stringify(
  Object.fromEntries(cleanItems.map((item) => [item.itemId, item])),
  null,
  2
)};

export const HNS_TM_CATALOG: HnsTm[] = ${JSON.stringify(tms, null, 2)};

export const HNS_MINT_CATALOG: HnsMint[] = ${JSON.stringify(mints, null, 2)};

export const HNS_TM_BY_CODE: Record<string, HnsTm> = Object.fromEntries(
  HNS_TM_CATALOG.map((tm) => [tm.code, tm])
);

export const HNS_MINT_BY_CODE: Record<string, HnsMint> = Object.fromEntries(
  HNS_MINT_CATALOG.map((mint) => [mint.code, mint])
);
`;

fs.writeFileSync(OUT_PATH, ts, 'utf8');
console.log('Wrote', OUT_PATH);
console.log('Items:', cleanItems.length, '| TMs:', tms.length, '| Mints:', mints.length);
console.log('Key item ids:', keyItemIds);
