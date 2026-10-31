const fs = require('fs');
const path = require('path');

const ITEMS_H_PATH = path.join(__dirname, '../pokehns-expansion/include/constants/items.h');
const OUT_PATH = path.join(__dirname, '../src/lib/hnsCatalog.ts');

console.log('Generating H&S v2.0.6 catalog from', ITEMS_H_PATH);

const content = fs.readFileSync(ITEMS_H_PATH, 'utf8');
const lines = content.split('\n');
const itemMap = {};
for (const line of lines) {
  const m = line.match(/^\s*(ITEM_[A-Z0-9_]+)\s*=\s*([0-9]+)/);
  if (m) itemMap[m[1]] = parseInt(m[2]);
}

const keyItemIds = {
  MASTER_BALL: itemMap.ITEM_MASTER_BALL ?? 4,
  ULTRA_BALL: itemMap.ITEM_ULTRA_BALL ?? 3,
  GREAT_BALL: itemMap.ITEM_GREAT_BALL ?? 2,
  POKE_BALL: itemMap.ITEM_POKE_BALL ?? 1,
  POTION: itemMap.ITEM_POTION ?? 28,
  SUPER_POTION: itemMap.ITEM_SUPER_POTION ?? 29,
  HYPER_POTION: itemMap.ITEM_HYPER_POTION ?? 30,
  MAX_POTION: itemMap.ITEM_MAX_POTION ?? 31,
  FULL_RESTORE: itemMap.ITEM_FULL_RESTORE ?? 32,
  FULL_HEAL: itemMap.ITEM_FULL_HEAL ?? 48,
  REVIVE: itemMap.ITEM_REVIVE ?? 33,
  MAX_REVIVE: itemMap.ITEM_MAX_REVIVE ?? 34,
  SACRED_ASH: itemMap.ITEM_SACRED_ASH ?? 54,
  RARE_CANDY: itemMap.ITEM_RARE_CANDY ?? 102,
  HEART_SCALE: itemMap.ITEM_HEART_SCALE ?? 152,
  EVERSTONE: itemMap.ITEM_EVERSTONE ?? 245,
  LEFTOVERS: itemMap.ITEM_LEFTOVERS ?? 472,
  SOOTHE_BELL: itemMap.ITEM_SOOTHE_BELL ?? 463,
  LUCKY_EGG: itemMap.ITEM_LUCKY_EGG ?? 470,
  CHOICE_BAND: itemMap.ITEM_CHOICE_BAND ?? 442,
  MACHO_BRACE: itemMap.ITEM_MACHO_BRACE ?? 418,
  SCOPE_LENS: itemMap.ITEM_SCOPE_LENS ?? 471,
  SHELL_BELL: itemMap.ITEM_SHELL_BELL ?? 473,
  MAX_ELIXIR: itemMap.ITEM_MAX_ELIXIR ?? 52,
  PP_MAX: itemMap.ITEM_PP_MAX ?? 72,
  FIRE_STONE: itemMap.ITEM_FIRE_STONE ?? 211,
  WATER_STONE: itemMap.ITEM_WATER_STONE ?? 212,
  THUNDER_STONE: itemMap.ITEM_THUNDER_STONE ?? 213,
  MOON_STONE: itemMap.ITEM_MOON_STONE ?? 217,
  SUN_STONE: itemMap.ITEM_SUN_STONE ?? 216,
  LEAF_STONE: itemMap.ITEM_LEAF_STONE ?? 214,
  ESCAPE_ROPE: itemMap.ITEM_ESCAPE_ROPE ?? 120,
  ABILITY_CAPSULE: itemMap.ITEM_ABILITY_CAPSULE ?? 79,
  ABILITY_PATCH: itemMap.ITEM_ABILITY_PATCH ?? 80,
};

const TM_META = [
  ['Fighting', 150, 100, 20], ['Dragon', 80, 100, 15], ['Water', 60, 100, 20],
  ['Psychic', null, null, 20], ['Normal', null, 100, 20], ['Poison', null, 90, 10],
  ['Ice', null, null, 10], ['Fighting', null, null, 20], ['Grass', 10, 100, 30],
  ['Normal', 60, 100, 15], ['Fire', null, null, 5], ['Dark', null, 100, 20],
  ['Ice', 95, 100, 10], ['Ice', 120, 70, 5], ['Normal', 150, 90, 5],
  ['Psychic', null, null, 30], ['Normal', null, null, 10], ['Water', null, null, 5],
  ['Grass', 75, 100, 10], ['Normal', null, null, 25], ['Normal', null, 100, 20],
  ['Grass', 120, 100, 10], ['Steel', 100, 75, 15], ['Electric', 95, 100, 15],
  ['Electric', 120, 70, 10], ['Ground', 100, 100, 10], ['Normal', null, 100, 20],
  ['Ground', 80, 100, 10], ['Psychic', 90, 100, 10], ['Ghost', 80, 100, 15],
  ['Fighting', 75, 100, 15], ['Normal', null, null, 15], ['Psychic', null, null, 20],
  ['Electric', 60, null, 20], ['Fire', 95, 100, 15], ['Poison', 90, 100, 10],
  ['Rock', null, null, 10], ['Fire', 120, 85, 5], ['Rock', 60, 95, 15],
  ['Flying', 60, null, 20], ['Dark', null, 100, 15], ['Normal', 70, 100, 20],
  ['Normal', 70, 100, 20], ['Psychic', null, null, 10], ['Normal', null, 100, 15],
  ['Dark', 60, 100, 25], ['Steel', 70, 90, 25], ['Psychic', null, null, 10],
  ['Dark', null, null, 10], ['Fire', 130, 90, 5],
];

const TYPE_ES = {
  Fighting: 'Lucha', Dragon: 'Dragón', Water: 'Agua', Psychic: 'Psíquico',
  Normal: 'Normal', Poison: 'Veneno', Ice: 'Hielo', Grass: 'Planta',
  Fire: 'Fuego', Dark: 'Siniestro', Steel: 'Acero', Electric: 'Eléctrico',
  Ground: 'Tierra', Ghost: 'Fantasma', Rock: 'Roca', Flying: 'Volador',
};

const MOVE_NAMES_ES = [
  'Puño Certero', 'Garra Dragón', 'Hidropulso', 'Paz Mental', 'Rugido',
  'Tóxico', 'Granizo', 'Corpulencia', 'Semillera', 'Poder Oculto',
  'Día Soleado', 'Mofa', 'Rayo Hielo', 'Ventisca', 'Hiperrayo',
  'Pantalla de Luz', 'Protección', 'Danza Lluvia', 'Gigadrenado', 'Salvaguardia',
  'Frustración', 'Rayo Solar', 'Cola Férrea', 'Rayo', 'Trueno',
  'Terremoto', 'Retribución', 'Excavar', 'Psíquico', 'Bola Sombra',
  'Demolición', 'Doble Equipo', 'Reflejo', 'Onda Electrizante', 'Lanzallamas',
  'Bomba Lodo', 'Tormenta de Arena', 'Llamarada', 'Tumba Rocas', 'Golpe Aéreo',
  'Tormento', 'Fachada', 'Poder Secreto', 'Descanso', 'Atracción',
  'Ladrón', 'Ala de Acero', 'Intercambio', 'Robo', 'Sofoco',
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
const tm01Base = itemMap.ITEM_TM01 ?? 582;
for (let n = 1; n <= 50; n++) {
  const itemId = tm01Base + (n - 1);
  const meta = TM_META[n - 1] || ['Normal', null, null, 10];
  const [typeEn, power, accuracy, pp] = meta;
  const type = TYPE_ES[typeEn] || typeEn;
  const moveName = MOVE_NAMES_ES[n - 1] || `Movimiento ${n}`;
  tms.push({
    code: `MT${String(n).padStart(2, '0')}`,
    itemId,
    moveId: n,
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

const MINT_NAMES = [
  ['ADAMANT', 'Adamant', '+Ataque / -At. Esp.', itemMap.ITEM_ADAMANT_MINT ?? 82],
  ['TIMID', 'Timid', '+Velocidad / -Ataque', itemMap.ITEM_TIMID_MINT ?? 97],
  ['MODEST', 'Modest', '+At. Esp. / -Ataque', itemMap.ITEM_MODEST_MINT ?? 89],
  ['JOLLY', 'Jolly', '+Velocidad / -At. Esp.', itemMap.ITEM_JOLLY_MINT ?? 99],
  ['BOLD', 'Bold', '+Defensa / -Ataque', itemMap.ITEM_BOLD_MINT ?? 85],
];

const mints = [];
for (const [key, label, effect, itemId] of MINT_NAMES) {
  mints.push({
    code: `MINT_${label.toUpperCase()}`,
    itemId,
    name: `Menta ${label}`,
    effect,
    price: 3200,
    description: `Cambia el crecimiento de estadísticas a naturaleza ${label}.`,
  });
}

const ts = `// AUTO-GENERATED by scripts/generate_hns_catalog.js
// Source of truth: pokehns-expansion v2.0.6 (Release-v2.0.6).
// Do not edit by hand; run: node scripts/generate_hns_catalog.js

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

export const HNS_TM_CATALOG: HnsTm[] = ${JSON.stringify(tms, null, 2)};

export const HNS_MINT_CATALOG: HnsMint[] = ${JSON.stringify(mints, null, 2)};
`;

fs.writeFileSync(OUT_PATH, ts, 'utf8');
console.log('Successfully wrote', OUT_PATH);
console.log('Key item ids count:', Object.keys(keyItemIds).length);
console.log('TMs count:', tms.length);
console.log('Mints count:', mints.length);
