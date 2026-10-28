/**
 * Genera la semilla SQL de precios del Bazar a partir del catálogo real.
 * - Precios de ítems GBA: curados para la economía de ~430 ₽/día.
 * - MT / Mints: tomados de src/lib/hnsCatalog.ts (generado desde la ROM).
 * - Pokémon / cosméticos: precio del catálogo de la tienda.
 *
 * Uso: node scripts/generate_shop_seed.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOG_TS = path.join(ROOT, 'src/lib/shopCatalog.ts');
const HNS_TS = path.join(ROOT, 'src/lib/hnsCatalog.ts');
const OUT = path.join(ROOT, 'supabase/migrations/20261028_economy_shop_seed.sql');

// Precios curados de la economía (₽). Un día de tareas ≈ 430 ₽.
const PRICE_OVERRIDES = {
  GBA_POTION: 12,
  GBA_SUPER_POTION: 28,
  GBA_HYPER_POTION: 60,
  GBA_REVIVE: 45,
  GBA_MAX_REVIVE: 140,
  GBA_FULL_RESTORE: 160,
  GBA_SACRED_ASH: 90,
  GBA_MAX_ELIXIR: 70,
  GBA_PP_MAX: 320,
  GBA_RARE_CANDY: 220,
  GBA_MASTER_BALL: 900,
  GBA_ULTRA_BALL: 34,
  GBA_FIRE_STONE: 190,
  GBA_WATER_STONE: 190,
  GBA_THUNDER_STONE: 190,
  GBA_MOON_STONE: 240,
  GBA_SUN_STONE: 240,
  GBA_HEART_SCALE: 70,
  GBA_ESCAPE_ROPE: 25,
  BREED_EVERSTONE: 110,
  BREED_LEFTOVERS: 280,
  BREED_SOOTHE_BELL: 120,
  BREED_LUCKY_EGG: 450,
  BREED_CHOICE_BAND: 380,
  BREED_MACHO_BRACE: 240,
  BREED_SCOPE_LENS: 210,
  BREED_SHELL_BELL: 260,
};

const POCKET_CATEGORY = {
  POKEBALLS: 'balls',
  TMHM: 'tms',
};

const CURE_IDS = new Set([
  'GBA_POTION', 'GBA_SUPER_POTION', 'GBA_HYPER_POTION', 'GBA_FULL_RESTORE',
  'GBA_REVIVE', 'GBA_MAX_REVIVE', 'GBA_SACRED_ASH', 'GBA_MAX_ELIXIR', 'GBA_PP_MAX',
]);
const EVOLUTION_IDS = new Set([
  'GBA_FIRE_STONE', 'GBA_WATER_STONE', 'GBA_THUNDER_STONE', 'GBA_MOON_STONE', 'GBA_SUN_STONE',
]);

function esc(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${esc(value)}'`;
}

function loadHns() {
  const src = fs.readFileSync(HNS_TS, 'utf8');
  const idsMatch = src.match(/export const HNS_ITEM_IDS = (\{[\s\S]*?\}) as const;/);
  const tmsMatch = src.match(/export const HNS_TM_CATALOG: HnsTm\[\] = (\[[\s\S]*?\n\]);/);
  const mintsMatch = src.match(/export const HNS_MINT_CATALOG: HnsMint\[\] = (\[[\s\S]*?\n\]);/);
  if (!idsMatch || !tmsMatch || !mintsMatch) {
    throw new Error('No se pudo leer hnsCatalog.ts');
  }
  return {
    ids: JSON.parse(idsMatch[1]),
    tms: JSON.parse(tmsMatch[1]),
    mints: JSON.parse(mintsMatch[1]),
  };
}

function loadProducts() {
  const src = fs.readFileSync(CATALOG_TS, 'utf8');
  const re = /\{\s*id: '([^']+)',([\s\S]*?)\n  \},/g;
  const products = [];
  let m;
  while ((m = re.exec(src))) {
    const block = m[0];
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*([^,\\n]+)`).exec(block);
      return r ? r[1].trim() : null;
    };
    const gbaRaw = get('gbaItemId');
    let gbaItemId = null;
    if (gbaRaw) {
      if (/^\d+$/.test(gbaRaw)) gbaItemId = Number(gbaRaw);
      else {
        const key = /HNS_ITEM_IDS\.([A-Z0-9_]+)/.exec(gbaRaw);
        if (key) gbaItemId = null; // se resuelve después con el mapa
        gbaItemIdKey = key ? key[1] : null;
      }
    }
    products.push({
      id: m[1],
      block,
      gbaItemId,
      gbaItemIdKey: gbaRaw && /HNS_ITEM_IDS\.([A-Z0-9_]+)/.test(gbaRaw)
        ? /HNS_ITEM_IDS\.([A-Z0-9_]+)/.exec(gbaRaw)[1]
        : null,
      floor: (get('floor') || '').replace(/'/g, ''),
      cost: Number(get('cost') || 0),
      type: (get('type') || '').replace(/'/g, ''),
      pocket: (get('pocket') || '').replace(/'/g, ''),
      name: (get('name') || '').replace(/^'|'$/g, ''),
      speciesId: Number(get('speciesId') || 0) || null,
      level: Number(get('level') || 0) || null,
      isShiny: /isShiny:\s*true/.test(block),
      perfectIVs: /perfectIVs:\s*true/.test(block),
      skinId: get('skinId') ? get('skinId').replace(/'/g, '') : null,
      costumeId: get('costumeId') ? get('costumeId').replace(/'/g, '') : null,
    });
  }
  return products;
}

let gbaItemIdKey = null;
const { ids, tms, mints } = loadHns();
const products = loadProducts();
const rows = [];

for (const p of products) {
  let kind = 'item';
  let category = p.floor || 'general';
  let gbaItemId = p.gbaItemId;
  if (p.gbaItemIdKey) gbaItemId = ids[p.gbaItemIdKey] ?? null;

  if (p.floor === 'eggs') { kind = 'pokemon'; category = 'egg'; }
  else if (p.floor === 'specials') { kind = 'pokemon'; category = p.isShiny ? 'shiny' : 'special'; }
  else if (p.floor === 'supplies') {
    kind = 'item';
    category = POCKET_CATEGORY[p.pocket] || (CURE_IDS.has(p.id) ? 'cure' : EVOLUTION_IDS.has(p.id) ? 'evolution' : 'supplies');
  } else if (p.floor === 'breeding' || p.floor === 'tms' || p.floor === 'mints') {
    kind = 'item';
  } else if (p.floor === 'cosmetics' || p.floor === 'pokemon_costumes' || p.floor === 'trainer_skins') {
    kind = 'cosmetic';
  }

  const price = PRICE_OVERRIDES[p.id] ?? p.cost;
  if (kind === 'item' && !gbaItemId) continue; // sin ID real no se puede inyectar

  const payload = kind === 'pokemon'
    ? { speciesId: p.speciesId, level: p.level || 5, perfectIVs: !!p.perfectIVs }
    : p.floor === 'cosmetics'
      ? { cosmeticId: p.id }
      : p.floor === 'pokemon_costumes'
        ? { costumeId: p.costumeId, speciesId: p.speciesId }
        : p.floor === 'trainer_skins'
          ? { skinId: p.skinId }
          : {};

  rows.push({
    item_id: p.id,
    kind,
    category,
    price,
    base_price: price,
    gba_item_id: gbaItemId,
    gba_pocket: p.pocket || null,
    display_name: p.name,
    payload,
  });
}

for (const tm of tms) {
  rows.push({
    item_id: `GBA_${tm.code}`,
    kind: 'item',
    category: 'tms',
    price: tm.price,
    base_price: tm.price,
    gba_item_id: tm.itemId,
    gba_pocket: 'TMHM',
    display_name: `${tm.code} · ${tm.moveName}`,
    payload: { moveId: tm.moveId, moveType: tm.type },
  });
}

for (const mint of mints) {
  rows.push({
    item_id: `GBA_${mint.code}`,
    kind: 'item',
    category: 'mints',
    price: mint.price,
    base_price: mint.price,
    gba_item_id: mint.itemId,
    gba_pocket: 'ITEMS',
    display_name: mint.name,
    payload: { effect: mint.effect },
  });
}

const values = rows.map((r) => `(
  ${sql(r.item_id)}, ${sql(r.kind)}, ${sql(r.category)}, ${sql(r.price)}, ${sql(r.base_price)},
  ${r.gba_item_id ?? 'NULL'}, ${sql(r.gba_pocket)}, ${sql(r.display_name)},
  ${sql(JSON.stringify(r.payload))}::jsonb, TRUE
)`).join(',\n');

const output = `-- AUTO-GENERATED by scripts/generate_shop_seed.js
-- No editar a mano. Regenerar con: node scripts/generate_shop_seed.js
-- Precios del servidor para el Bazar de Ciudad Trigal (${rows.length} productos).

INSERT INTO public.economy_shop_prices
  (item_id, kind, category, price, base_price, gba_item_id, gba_pocket, display_name, payload, active)
VALUES
${values}
ON CONFLICT (item_id) DO UPDATE SET
  kind = EXCLUDED.kind,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  base_price = EXCLUDED.base_price,
  gba_item_id = EXCLUDED.gba_item_id,
  gba_pocket = EXCLUDED.gba_pocket,
  display_name = EXCLUDED.display_name,
  payload = EXCLUDED.payload,
  active = TRUE,
  updated_at = now();
`;

fs.writeFileSync(OUT, output, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`Products: ${rows.length}`);
const bad = rows.filter((r) => !r.gba_item_id && r.kind === 'item');
console.log(`Items without GBA id: ${bad.length}`);
