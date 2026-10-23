/**
 * @file src/lib/pokemonAssets.ts
 * @description Catálogo de Sprites 3D Animados (Showdown), Ítems GBA y Helper Oficial
 * para Pokémon Heart & Soul (Gen 1 a Gen 3 + Cross-evos).
 */

export interface PokemonAssetMetadata {
  id: number;
  name: string;
  types: string[];
  generation: 1 | 2 | 3 | 4 | 9;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpAtk: number;
  baseSpDef: number;
  baseSpd: number;
  flavor: string;
}

export interface ItemAssetMetadata {
  id: string;
  gbaItemId: number;
  name: string;
  slug: string;
  category: 'ball' | 'medicine' | 'key' | 'evo' | 'berry';
  description: string;
}

/**
 * URLs Oficiales de Alta Fidelidad
 */
export const POKEMON_ASSETS = {
  /**
   * Sprites 3D Animados estilo Pokémon Showdown (Frente)
   */
  getAnimatedSprite: (id: number, isShiny = false): string => {
    return isShiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${id}.gif`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
  },

  /**
   * Sprites 3D Animados de Espalda (Para batallas y vista de entrenador)
   */
  getAnimatedBackSprite: (id: number, isShiny = false): string => {
    return isShiny
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/${id}.gif`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/${id}.gif`;
  },

  /**
   * Mini ícono de caja / PC Box (Generación 7 oficial en PokeAPI)
   */
  getBoxIcon: (id: number): string => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/${id}.png`;
  },

  /**
   * Sprite oficial frontal pixel-art nítido para tarjetas compactas
   */
  getPixelSprite: (id: number): string => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  },

  /**
   * Ítems oficiales en PNG transparente
   */
  getItemSprite: (slug: string): string => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
  },
};

/**
 * Catálogo Curado de Pokémon de Johto + Kanto + Hoenn + Cross-Evos de H&S
 */
export const JOHTO_POKEDEX_CATALOG: PokemonAssetMetadata[] = [
  // Iniciales Johto
  {
    id: 152,
    name: 'Chikorita',
    types: ['Planta'],
    generation: 2,
    baseHp: 45,
    baseAtk: 49,
    baseDef: 65,
    baseSpAtk: 49,
    baseSpDef: 65,
    baseSpd: 45,
    flavor: 'Especialista en bots y automatización ecológica.',
  },
  {
    id: 153,
    name: 'Bayleef',
    types: ['Planta'],
    generation: 2,
    baseHp: 60,
    baseAtk: 62,
    baseDef: 80,
    baseSpAtk: 63,
    baseSpDef: 80,
    baseSpd: 60,
    flavor: 'El aroma de su collar revitaliza la energía del equipo.',
  },
  {
    id: 154,
    name: 'Meganium',
    types: ['Planta'],
    generation: 2,
    baseHp: 80,
    baseAtk: 82,
    baseDef: 100,
    baseSpAtk: 83,
    baseSpDef: 100,
    baseSpd: 80,
    flavor: 'Su aliento puede reanimar servidores y código caído.',
  },
  {
    id: 155,
    name: 'Cyndaquil',
    types: ['Fuego'],
    generation: 2,
    baseHp: 39,
    baseAtk: 52,
    baseDef: 43,
    baseSpAtk: 60,
    baseSpDef: 50,
    baseSpd: 65,
    flavor: 'Tímido pero libera llamaradas potentes al concentrarse.',
  },
  {
    id: 156,
    name: 'Quilava',
    types: ['Fuego'],
    generation: 2,
    baseHp: 58,
    baseAtk: 64,
    baseDef: 58,
    baseSpAtk: 80,
    baseSpDef: 65,
    baseSpd: 80,
    flavor: 'Su pelaje repele ataques de calor y sobrecarga de CPU.',
  },
  {
    id: 157,
    name: 'Typhlosion',
    types: ['Fuego'],
    generation: 2,
    baseHp: 78,
    baseAtk: 84,
    baseDef: 78,
    baseSpAtk: 109,
    baseSpDef: 85,
    baseSpd: 100,
    flavor: 'Crea ráfagas ardientes con energía explosiva inagotable.',
  },
  {
    id: 158,
    name: 'Totodile',
    types: ['Agua'],
    generation: 2,
    baseHp: 50,
    baseAtk: 65,
    baseDef: 64,
    baseSpAtk: 44,
    baseSpDef: 48,
    baseSpd: 43,
    flavor: 'Gran mandíbula mordaz; domina pipelines de streaming de datos.',
  },
  {
    id: 159,
    name: 'Croconaw',
    types: ['Agua'],
    generation: 2,
    baseHp: 65,
    baseAtk: 80,
    baseDef: 80,
    baseSpAtk: 59,
    baseSpDef: 63,
    baseSpd: 58,
    flavor: 'Una vez que muerde una tarea, no la suelta hasta completarla.',
  },
  {
    id: 160,
    name: 'Feraligatr',
    types: ['Agua'],
    generation: 2,
    baseHp: 85,
    baseAtk: 105,
    baseDef: 100,
    baseSpAtk: 79,
    baseSpDef: 83,
    baseSpd: 78,
    flavor: 'Bestia acuática pesada que arrasa con bugs complejos.',
  },

  // Especies Clásicas e Icónicas de Johto / Kanto
  {
    id: 25,
    name: 'Pikachu',
    types: ['Eléctrico'],
    generation: 1,
    baseHp: 35,
    baseAtk: 55,
    baseDef: 40,
    baseSpAtk: 50,
    baseSpDef: 50,
    baseSpd: 90,
    flavor: 'Genera electricidad en sus mejillas para recargar mGBA.',
  },
  {
    id: 133,
    name: 'Eevee',
    types: ['Normal'],
    generation: 1,
    baseHp: 55,
    baseAtk: 55,
    baseDef: 50,
    baseSpAtk: 45,
    baseSpDef: 65,
    baseSpd: 55,
    flavor: 'Código genético ultra polimórfico listo para evolucionar.',
  },
  {
    id: 196,
    name: 'Espeon',
    types: ['Psíquico'],
    generation: 2,
    baseHp: 65,
    baseAtk: 65,
    baseDef: 60,
    baseSpAtk: 130,
    baseSpDef: 95,
    baseSpd: 110,
    flavor: 'Predice los bugs antes de que lleguen a producción.',
  },
  {
    id: 197,
    name: 'Umbreon',
    types: ['Siniestro'],
    generation: 2,
    baseHp: 95,
    baseAtk: 65,
    baseDef: 110,
    baseSpAtk: 60,
    baseSpDef: 130,
    baseSpd: 65,
    flavor: 'Sus anillos neón brillan en el modo nocturno del IDE.',
  },
  {
    id: 212,
    name: 'Scizor',
    types: ['Bicho', 'Acero'],
    generation: 2,
    baseHp: 70,
    baseAtk: 130,
    baseDef: 100,
    baseSpAtk: 55,
    baseSpDef: 80,
    baseSpd: 65,
    flavor: 'Pinzas de aleación de acero capaces de triturar cualquier deadlock.',
  },
  {
    id: 248,
    name: 'Tyranitar',
    types: ['Roca', 'Siniestro'],
    generation: 2,
    baseHp: 100,
    baseAtk: 134,
    baseDef: 110,
    baseSpAtk: 95,
    baseSpDef: 100,
    baseSpd: 61,
    flavor: 'Monstruo colosal capaz de derribar montañas de código legado.',
  },
  {
    id: 249,
    name: 'Lugia',
    types: ['Psíquico', 'Volador'],
    generation: 2,
    baseHp: 106,
    baseAtk: 90,
    baseDef: 130,
    baseSpAtk: 90,
    baseSpDef: 154,
    baseSpd: 110,
    flavor: 'El guardián de las Islas Remolino y el tráfico submarino.',
  },
  {
    id: 250,
    name: 'Ho-Oh',
    types: ['Fuego', 'Volador'],
    generation: 2,
    baseHp: 106,
    baseAtk: 130,
    baseDef: 90,
    baseSpAtk: 110,
    baseSpDef: 154,
    baseSpd: 90,
    flavor: 'Vuela dejando una estela multicolor de promesas resueltas.',
  },
  {
    id: 251,
    name: 'Celebi',
    types: ['Psíquico', 'Planta'],
    generation: 2,
    baseHp: 100,
    baseAtk: 100,
    baseDef: 100,
    baseSpAtk: 100,
    baseSpDef: 100,
    baseSpd: 100,
    flavor: 'Guardián del tiempo en el Encinar; viaja entre ramas de Git.',
  },

  // Cross-Evos Destacadas soportadas en Pokémon Heart & Soul
  {
    id: 466,
    name: 'Electivire',
    types: ['Eléctrico'],
    generation: 4,
    baseHp: 75,
    baseAtk: 123,
    baseDef: 67,
    baseSpAtk: 95,
    baseSpDef: 85,
    baseSpd: 95,
    flavor: 'Conecta sus dos colas para descargar 20,000 voltios directo a RAM.',
  },
  {
    id: 467,
    name: 'Magmortar',
    types: ['Fuego'],
    generation: 4,
    baseHp: 75,
    baseAtk: 95,
    baseDef: 67,
    baseSpAtk: 125,
    baseSpDef: 95,
    baseSpd: 83,
    flavor: 'Dispara esferas de fuego a 2,000 °C desde sus cañones en los brazos.',
  },
  {
    id: 468,
    name: 'Togekiss',
    types: ['Hada', 'Volador'],
    generation: 4,
    baseHp: 85,
    baseAtk: 50,
    baseDef: 95,
    baseSpAtk: 120,
    baseSpDef: 115,
    baseSpd: 80,
    flavor: 'Trae bendiciones y cero errores en la integración continua.',
  },
];

/**
 * Catálogo Curado de Ítems de Mochila H&S (Bolsillos GBA)
 */
export const HNS_ITEMS_CATALOG: ItemAssetMetadata[] = [
  {
    id: 'master-ball',
    gbaItemId: 0x0001,
    name: 'Master Ball',
    slug: 'master-ball',
    category: 'ball',
    description: 'La mejor Poké Ball. Captura a cualquier Pokémon sin fallar jamás.',
  },
  {
    id: 'ultra-ball',
    gbaItemId: 0x0002,
    name: 'Ultra Ball',
    slug: 'ultra-ball',
    category: 'ball',
    description: 'Poké Ball ultra de alto rendimiento con ratio de captura superior.',
  },
  {
    id: 'rare-candy',
    gbaItemId: 0x0044,
    name: 'Raro Caramelo',
    slug: 'rare-candy',
    category: 'medicine',
    description: 'Sube al instante 1 nivel completo al Pokémon objetivo.',
  },
  {
    id: 'max-revive',
    gbaItemId: 0x0019,
    name: 'Revivir Máximo',
    slug: 'max-revive',
    category: 'medicine',
    description: 'Reanima a un Pokémon debilitado y recupera todos sus PS.',
  },
  {
    id: 'full-restore',
    gbaItemId: 0x0013,
    name: 'Restaurar Todo',
    slug: 'full-restore',
    category: 'medicine',
    description: 'Cura todos los PS y elimina cualquier problema de estado.',
  },
  {
    id: 'sacred-ash',
    gbaItemId: 0x002C,
    name: 'Ceniza Sagrada',
    slug: 'sacred-ash',
    category: 'medicine',
    description: 'Milagro de Ho-Oh: revive a todos los Pokémon caídos del equipo al 100%.',
  },
  {
    id: 'fire-stone',
    gbaItemId: 0x005F,
    name: 'Piedra Fuego',
    slug: 'fire-stone',
    category: 'evo',
    description: 'Piedra elemental que induce la evolución de Pokémon tipo Fuego.',
  },
  {
    id: 'water-stone',
    gbaItemId: 0x0060,
    name: 'Piedra Agua',
    slug: 'water-stone',
    category: 'evo',
    description: 'Piedra elemental que induce la evolución de Pokémon tipo Agua.',
  },
  {
    id: 'thunder-stone',
    gbaItemId: 0x0061,
    name: 'Piedra Trueno',
    slug: 'thunder-stone',
    category: 'evo',
    description: 'Piedra con forma de rayo que desata la evolución eléctrica.',
  },
  {
    id: 'leftovers',
    gbaItemId: 0x00C3,
    name: 'Restos',
    slug: 'leftovers',
    category: 'medicine',
    description: 'Ítem equipado que restaura gradualmente PS en cada turno.',
  },
];
