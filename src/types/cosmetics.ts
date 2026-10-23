/**
 * @file src/types/cosmetics.ts
 * @description Catálogo Maestro de Skins de Entrenador y Equipamientos / Trajes Pokémon
 * (Mega-Armaduras, Formas Ancestrales, Gorras de Campeón y Trajes de Élite).
 */

export type TuningTarget = 'trainer' | 'pokemon';

export interface TrainerSkin {
  id: string;
  name: string;
  title: string;
  cost: number;
  description: string;
  spriteUrl: string;
  badge: string;
  category: 'classic' | 'cyber' | 'leader' | 'special';
  glowColor: string;
}

export interface PokemonCostumeItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  applicableSpeciesId: number; // ID nacional de la especie
  speciesName: string;
  category: 'hat' | 'armor' | 'hisui' | 'cosplay';
  badge: string;
  iconUrl: string;
  costumeSpriteUrl: string;
}

// =========================================================================
// 1. SKINS DE ENTRENADOR (16 Skins Oficiales)
// =========================================================================
export const TRAINER_SKINS_CATALOG: TrainerSkin[] = [
  {
    id: 'SKIN_OAK_PROFESSOR',
    name: 'Profesor Oak',
    title: 'Investigador Principal de Kanto & Johto',
    cost: 0,
    description: 'El legendario científico de Pueblo Paleta con su clásica bata de laboratorio.',
    spriteUrl: '/trainers/oak.png',
    badge: 'DOCENTE OFICIAL',
    category: 'classic',
    glowColor: '#3B82F6',
  },
  {
    id: 'SKIN_ETHAN_GOLD',
    name: 'Gold / Ethan',
    title: 'Campeón de la Liga Johto',
    cost: 50,
    description: 'El intrépido entrenador de Pueblo Primavera con su gorra hacia atrás.',
    spriteUrl: '/trainers/ethan.png',
    badge: 'ENTRENADOR JOHTO',
    category: 'classic',
    glowColor: '#F59E0B',
  },
  {
    id: 'SKIN_RED_LEGEND',
    name: 'Red Legendario',
    title: 'Campeón Supremo de Monte Plateado',
    cost: 150,
    description: 'El mito viviente. Chaqueta carmesí y mirada imbatible.',
    spriteUrl: '/trainers/red.png',
    badge: 'CAMPEÓN SUPREMO',
    category: 'leader',
    glowColor: '#E60012',
  },
  {
    id: 'SKIN_LYRA_HEART',
    name: 'Lyra / Cristal',
    title: 'Exploradora de las Ruinas Alfa',
    cost: 60,
    description: 'Elegancia y simpatía con su peto azul y sombrero blanco.',
    spriteUrl: '/trainers/lyra.png',
    badge: 'EXPLORADORA JOHTO',
    category: 'classic',
    glowColor: '#10B981',
  },
  {
    id: 'SKIN_SCIENTIST_DEV',
    name: 'Científico de Silph Co.',
    title: 'Ingeniero de Software y Sistemas',
    cost: 75,
    description: 'Especialista en compilación de código, punteros y scripts GBA.',
    spriteUrl: '/trainers/scientist.png',
    badge: 'CODER SILPH CO.',
    category: 'cyber',
    glowColor: '#06B6D4',
  },
  {
    id: 'SKIN_SUPER_NERD',
    name: 'Hacker Cyberpunk',
    title: 'Analista de Memoria RAM',
    cost: 80,
    description: 'Gafas de marco grueso, laptop en mano y teclado mecánico listo.',
    spriteUrl: '/trainers/supernerd.png',
    badge: 'HACKER RAM',
    category: 'cyber',
    glowColor: '#8B5CF6',
  },
  {
    id: 'SKIN_ROCKET_OPERATIVE',
    name: 'Operativo Team Rocket',
    title: 'Infiltrado de Torre Radio',
    cost: 90,
    description: 'Uniforme negro blindado con la icónica R carmesí en el pecho.',
    spriteUrl: '/trainers/rocket.png',
    badge: 'TEAM ROCKET',
    category: 'special',
    glowColor: '#EF4444',
  },
  {
    id: 'SKIN_ACE_TRAINER',
    name: 'Entrenador Guay (Ace)',
    title: 'Especialista de Combates Dobles',
    cost: 100,
    description: 'Atuendo deportivo aerodinámico para el Alto Mando.',
    spriteUrl: '/trainers/acetrainer.png',
    badge: 'ÉLITE DE JOHTO',
    category: 'leader',
    glowColor: '#F97316',
  },
  {
    id: 'SKIN_LANCE_CHAMPION',
    name: 'Lance / Maestro Dragón',
    title: 'Líder del Alto Mando de la Meseta Añil',
    cost: 200,
    description: 'Capa ondeante de terciopelo violeta e indomable poder dracónico.',
    spriteUrl: '/trainers/lance.png',
    badge: 'LÍDER ALTO MANDO',
    category: 'leader',
    glowColor: '#8B5CF6',
  },
  {
    id: 'SKIN_CYNTHIA_CHAMPION',
    name: 'Cintia / Arqueóloga',
    title: 'Campeona Mítica de Sinnoh',
    cost: 220,
    description: 'Abrigo largo negro azabache y accesorios dorados de Garchomp.',
    spriteUrl: '/trainers/cynthia.png',
    badge: 'CAMPEONA SINNOH',
    category: 'leader',
    glowColor: '#F59E0B',
  },
  {
    id: 'SKIN_STEVEN_STONE',
    name: 'Máximo Peñas (Steven)',
    title: 'Campeón Maestro de Acero',
    cost: 210,
    description: 'Traje de corte elegante con corbata roja y anillos de megaevolución.',
    spriteUrl: '/trainers/steven.png',
    badge: 'CAMPEÓN ACERO',
    category: 'leader',
    glowColor: '#94A3B8',
  },
  {
    id: 'SKIN_GUITARIST_ROCK',
    name: 'Guitarrista Eléctrico',
    title: 'Rocker del Gimnasio Trueno',
    cost: 85,
    description: 'Chaqueta de cuero rockero y acordes de 8-bits a todo volumen.',
    spriteUrl: '/trainers/guitarist.png',
    badge: 'ROCKSTAR',
    category: 'special',
    glowColor: '#EAB308',
  },
  {
    id: 'SKIN_BLACKBELT_DOJO',
    name: 'Cinturón Negro del Dojo',
    title: 'Maestro de Artes Marciales',
    cost: 70,
    description: 'Kimono tradicional de entrenamiento y cinta negra en la frente.',
    spriteUrl: '/trainers/blackbelt.png',
    badge: 'MAESTRO DOJO',
    category: 'special',
    glowColor: '#F97316',
  },
  {
    id: 'SKIN_PSYCHIC_TELEPATH',
    name: 'Médium / Psíquico',
    title: 'Telépata de Ciudad Azafrán',
    cost: 95,
    description: 'Túnica mística que levita y canaliza telequinesis pura.',
    spriteUrl: '/trainers/psychic.png',
    badge: 'PSÍQUICO AURA',
    category: 'special',
    glowColor: '#EC4899',
  },
  {
    id: 'SKIN_RICH_BOY',
    name: 'Chico Elegante Trigal',
    title: 'Heredero del Casino de Johto',
    cost: 130,
    description: 'Chaleco de gala con Pokédólares sobresaliendo del bolsillo.',
    spriteUrl: '/trainers/richboy.png',
    badge: 'MAGNATE POKÉ',
    category: 'special',
    glowColor: '#10B981',
  },
  {
    id: 'SKIN_VETERAN_MASTER',
    name: 'Veterano de Batalla',
    title: 'Estratega de la Calle Victoria',
    cost: 140,
    description: 'Chaqueta militar de combate curtida en cientos de torneos.',
    spriteUrl: '/trainers/veteran.png',
    badge: 'VETERANO',
    category: 'leader',
    glowColor: '#64748B',
  },
];

// =========================================================================
// 2. EQUIPAMIENTOS, GORRAS Y MEGA-ARMADURAS MULTI-ESPECIE (35+ Ítems)
// =========================================================================
export const POKEMON_COSTUMES_CATALOG: PokemonCostumeItem[] = [
  // ── CHARIZARD (#6) ──
  {
    id: 'EQUIP_CHARIZARD_MEGA_X',
    name: 'Armadura Dragón Negro (Mega Charizard X)',
    applicableSpeciesId: 6,
    speciesName: 'Charizard',
    category: 'armor',
    cost: 180,
    description: 'Imbuye a Charizard en llamas azules y escamas oscuras de tipo Dragón.',
    badge: 'FUEGO AZUL DRAGO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charizardite-x.png',
    costumeSpriteUrl: '/pokemon-costumes/charizard-megax.gif',
  },
  {
    id: 'EQUIP_CHARIZARD_MEGA_Y',
    name: 'Alas de Fuego Solar (Mega Charizard Y)',
    applicableSpeciesId: 6,
    speciesName: 'Charizard',
    category: 'armor',
    cost: 170,
    description: 'Despliega tres cuernos aéreos y sequía solar abrasadora.',
    badge: 'SOL ABRASADOR',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charizardite-y.png',
    costumeSpriteUrl: '/pokemon-costumes/charizard-megay.gif',
  },
  {
    id: 'EQUIP_CHARIZARD_GMAX',
    name: 'Coloso Gigamax de Fuego',
    applicableSpeciesId: 6,
    speciesName: 'Charizard',
    category: 'armor',
    cost: 200,
    description: 'Alas compuestas enteramente de fuego puro colosal.',
    badge: 'COLOSO GIGAMAX',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-mushrooms.png',
    costumeSpriteUrl: '/pokemon-costumes/charizard-gmax.gif',
  },

  // ── TYPHLOSION (#157 - Starter Johto) ──
  {
    id: 'EQUIP_TYPHLOSION_HISUI',
    name: 'Manto de Llamas Fantasma (Forma Hisui)',
    applicableSpeciesId: 157,
    speciesName: 'Typhlosion',
    category: 'hisui',
    cost: 160,
    description: 'Llamas púrpuras y danzas espectrales ancestrales de las leyendas de Hisui.',
    badge: 'FUEGO FANTASMA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/typhlosion-hisui.gif',
  },

  // ── ARCANINE (#59) ──
  {
    id: 'EQUIP_ARCANINE_HISUI',
    name: 'Blindaje de Lava Rocosa (Forma Hisui)',
    applicableSpeciesId: 59,
    speciesName: 'Arcanine',
    category: 'hisui',
    cost: 150,
    description: 'Melena de lava petrificada y cuerno afilado de roca volcánica.',
    badge: 'FUEGO ROCA ANCESTRAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/arcanine-hisui.gif',
  },

  // ── SCIZOR (#212) ──
  {
    id: 'EQUIP_SCIZOR_MEGA',
    name: 'Pinzas de Acero Reforzado (Mega Scizor)',
    applicableSpeciesId: 212,
    speciesName: 'Scizor',
    category: 'armor',
    cost: 165,
    description: 'Pinzas gigantescas con sierras de aleación de cromo y blindaje de titanio.',
    badge: 'PINZAS DE TITANIO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png',
    costumeSpriteUrl: '/pokemon-costumes/scizor-mega.gif',
  },

  // ── STEELIX (#208) ──
  {
    id: 'EQUIP_STEELIX_MEGA',
    name: 'Cristales de Diamante Flotantes (Mega Steelix)',
    applicableSpeciesId: 208,
    speciesName: 'Steelix',
    category: 'armor',
    cost: 170,
    description: 'Anillos de diamantes y esquirlas de hierro que orbitan su cuerpo colosal.',
    badge: 'ÓRBITA DE DIAMANTES',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hard-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/steelix-mega.gif',
  },

  // ── AMPHAROS (#181) ──
  {
    id: 'EQUIP_AMPHAROS_MEGA',
    name: 'Melena Dragón Iluminada (Mega Ampharos)',
    applicableSpeciesId: 181,
    speciesName: 'Ampharos',
    category: 'armor',
    cost: 145,
    description: 'Hermosa melena blanca sedosa con perlas rojas imbuidas en poder Dragón.',
    badge: 'FARO DRACÓNICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
    costumeSpriteUrl: '/pokemon-costumes/ampharos-mega.gif',
  },

  // ── TYRANITAR (#248) ──
  {
    id: 'EQUIP_TYRANITAR_MEGA',
    name: 'Exoesqueleto Acorazado (Mega Tyranitar)',
    applicableSpeciesId: 248,
    speciesName: 'Tyranitar',
    category: 'armor',
    cost: 190,
    description: 'Su espalda se abre expulsando tormentas de arena devastadoras.',
    badge: 'TITÁN DESTRUCTOR',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/soft-sand.png',
    costumeSpriteUrl: '/pokemon-costumes/tyranitar-mega.gif',
  },

  // ── GYARADOS (#130) ──
  {
    id: 'EQUIP_GYARADOS_MEGA',
    name: 'Aletas de Siniestro Marino (Mega Gyarados)',
    applicableSpeciesId: 130,
    speciesName: 'Gyarados',
    category: 'armor',
    cost: 185,
    description: 'Cuerpo aerodinámico con propulsión a chorro de tipo Agua/Siniestro.',
    badge: 'LEVIATÁN SINIESTRO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystic-water.png',
    costumeSpriteUrl: '/pokemon-costumes/gyarados-mega.gif',
  },

  // ── ALAKAZAM (#65) ──
  {
    id: 'EQUIP_ALAKAZAM_MEGA',
    name: 'Cinco Cucharas Telequinéticas (Mega Alakazam)',
    applicableSpeciesId: 65,
    speciesName: 'Alakazam',
    category: 'armor',
    cost: 175,
    description: 'Levita con barba sabia y 5 cucharas de oro que amplifican su coeficiente intelectual.',
    badge: 'SABIO TELEQUINÉTICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/twisted-spoon.png',
    costumeSpriteUrl: '/pokemon-costumes/alakazam-mega.gif',
  },

  // ── GENGAR (#94) ──
  {
    id: 'EQUIP_GENGAR_GMAX',
    name: 'Fauce Abisal Dimensional (Gengar Gigamax)',
    applicableSpeciesId: 94,
    speciesName: 'Gengar',
    category: 'armor',
    cost: 180,
    description: 'Emerge del inframundo como una gigantesca boca que engulle todo a su paso.',
    badge: 'FAUCE ABISAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/spell-tag.png',
    costumeSpriteUrl: '/pokemon-costumes/gengar-gmax.gif',
  },

  // ── HERACROSS (#214) ──
  {
    id: 'EQUIP_HERACROSS_MEGA',
    name: 'Gran Cuerno Ariete (Mega Heracross)',
    applicableSpeciesId: 214,
    speciesName: 'Heracross',
    category: 'armor',
    cost: 155,
    description: 'Cuerno macizo frontal capaz de levantar hasta 500 veces su peso.',
    badge: 'ARIETE GIGANTE',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-belt.png',
    costumeSpriteUrl: '/pokemon-costumes/heracross-mega.gif',
  },

  // ── HOUNDOOM (#229) ──
  {
    id: 'EQUIP_HOUNDOOM_MEGA',
    name: 'Armadura Ósea Infernal (Mega Houndoom)',
    applicableSpeciesId: 229,
    speciesName: 'Houndoom',
    category: 'armor',
    cost: 160,
    description: 'Cornamenta en espiral y coraza de hueso expuesto al rojo vivo.',
    badge: 'CAN DEL INFRAMUNDO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charcoal.png',
    costumeSpriteUrl: '/pokemon-costumes/houndoom-mega.gif',
  },

  // ── LUCARIO (#448) ──
  {
    id: 'EQUIP_LUCARIO_MEGA',
    name: 'Guanteletes de Combate del Aura (Mega Lucario)',
    applicableSpeciesId: 448,
    speciesName: 'Lucario',
    category: 'armor',
    cost: 195,
    description: 'Picos carmesí en patas y manos con marcas de aura de combate puro.',
    badge: 'MAESTRO DEL AURA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/expert-belt.png',
    costumeSpriteUrl: '/pokemon-costumes/lucario-mega.gif',
  },

  // ── GARCHOMP (#445) ──
  {
    id: 'EQUIP_GARCHOMP_MEGA',
    name: 'Cuchillas Guadaña de Tierra (Mega Garchomp)',
    applicableSpeciesId: 445,
    speciesName: 'Garchomp',
    category: 'armor',
    cost: 190,
    description: 'Sus alas se funden en mortíferas guadañas que cortan el acero con facilidad.',
    badge: 'GUADAÑA TERRESTRE',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-fang.png',
    costumeSpriteUrl: '/pokemon-costumes/garchomp-mega.gif',
  },

  // ── SALAMENCE (#373) ──
  {
    id: 'EQUIP_SALAMENCE_MEGA',
    name: 'Alas Búmeran Monolíticas (Mega Salamence)',
    applicableSpeciesId: 373,
    speciesName: 'Salamence',
    category: 'armor',
    cost: 195,
    description: 'Una sola ala en forma de medialuna que vuela a velocidades hipersónicas.',
    badge: 'ALA LUNAR ALFA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
    costumeSpriteUrl: '/pokemon-costumes/salamence-mega.gif',
  },

  // ── METAGROSS (#376) ──
  {
    id: 'EQUIP_METAGROSS_MEGA',
    name: 'Proyector Cuádruple de Acero (Mega Metagross)',
    applicableSpeciesId: 376,
    speciesName: 'Metagross',
    category: 'armor',
    cost: 195,
    description: 'Fusión de 8 cerebros interconectados en una supercomputadora flotante.',
    badge: 'SUPERCOMPUTADORA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png',
    costumeSpriteUrl: '/pokemon-costumes/metagross-mega.gif',
  },

  // ── EEVEE (#133) ──
  {
    id: 'EQUIP_EEVEE_GMAX',
    name: 'Collar de Pelaje Gigamax',
    applicableSpeciesId: 133,
    speciesName: 'Eevee',
    category: 'cosplay',
    cost: 140,
    description: 'Un collarín de pelo mullido y colosal que envuelve a cualquier rival.',
    badge: 'PELAJE GIGAMAX',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silk-scarf.png',
    costumeSpriteUrl: '/pokemon-costumes/eevee-gmax.gif',
  },
  {
    id: 'EQUIP_EEVEE_STARTER',
    name: 'Pañuelo de Compañero Eevee',
    applicableSpeciesId: 133,
    speciesName: 'Eevee',
    category: 'cosplay',
    cost: 95,
    description: 'El simpático pañuelo rojo de Let’s Go Eevee.',
    badge: 'PAÑUELO COMPAÑERO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png',
    costumeSpriteUrl: '/pokemon-costumes/eevee-starter.gif',
  },

  // ── MEWTWO (#150) ──
  {
    id: 'EQUIP_MEWTWO_MEGA_X',
    name: 'Armadura Psico-Luchadora (Mega Mewtwo X)',
    applicableSpeciesId: 150,
    speciesName: 'Mewtwo',
    category: 'armor',
    cost: 250,
    description: 'Aumenta su masa muscular y destreza física para combate cuerpo a cuerpo.',
    badge: 'PSICO GUERRERO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mewtwonite-x.png',
    costumeSpriteUrl: '/pokemon-costumes/mewtwo-megax.gif',
  },
  {
    id: 'EQUIP_MEWTWO_MEGA_Y',
    name: 'Holo-Corona Telepática (Mega Mewtwo Y)',
    applicableSpeciesId: 150,
    speciesName: 'Mewtwo',
    category: 'armor',
    cost: 250,
    description: 'Cuerpo ultracompacto con cerebro extendido que desata psicoondas mundiales.',
    badge: 'OMNIPRESENCIA PSY',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mewtwonite-y.png',
    costumeSpriteUrl: '/pokemon-costumes/mewtwo-megay.gif',
  },

  // ── RAYQUAZA (#384) ──
  {
    id: 'EQUIP_RAYQUAZA_MEGA',
    name: 'Cintas de Energía Delta (Mega Rayquaza)',
    applicableSpeciesId: 384,
    speciesName: 'Rayquaza',
    category: 'armor',
    cost: 300,
    description: 'Cintas luminiscentes de la capa de ozono que anulan cualquier clima.',
    badge: 'DRAGÓN DE LA CAPA OZONO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/meteorite.png',
    costumeSpriteUrl: '/pokemon-costumes/rayquaza-mega.gif',
  },

  // ── RAICHU (#26) ──
  {
    id: 'EQUIP_RAICHU_SURF',
    name: 'Tabla de Surf Telequinética (Raichu Alola)',
    applicableSpeciesId: 26,
    speciesName: 'Raichu',
    category: 'hisui',
    cost: 135,
    description: 'Flota sobre su propia cola usándola como tabla de surf psíquica.',
    badge: 'SURFISTA ALOLA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystic-water.png',
    costumeSpriteUrl: '/pokemon-costumes/raichu-alola.gif',
  },

  // ── WEEZING (#110) ──
  {
    id: 'EQUIP_WEEZING_TOPHAT',
    name: 'Sombreros de Copa Industriales (Weezing Galar)',
    applicableSpeciesId: 110,
    speciesName: 'Weezing',
    category: 'hisui',
    cost: 125,
    description: 'Dos chimeneas victorianas que funcionan como sombreros de copa británicos.',
    badge: 'TOP-HAT GALAR',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/smoke-ball.png',
    costumeSpriteUrl: '/pokemon-costumes/weezing-galar.gif',
  },

  // ── MAROWAK (#105) ──
  {
    id: 'EQUIP_MAROWAK_FIREBONE',
    name: 'Hueso de Fuego Danzante (Marowak Alola)',
    applicableSpeciesId: 105,
    speciesName: 'Marowak',
    category: 'hisui',
    cost: 130,
    description: 'Danza de fuego ritual con hueso imbuido en llamas espectrales verdes.',
    badge: 'FUEGO ESPIRITUAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thick-club.png',
    costumeSpriteUrl: '/pokemon-costumes/marowak-alola.gif',
  },

  // ── VULPIX (#37) ──
  {
    id: 'EQUIP_VULPIX_SNOW',
    name: 'Manto de Nieve de las Alturas (Vulpix Alola)',
    applicableSpeciesId: 37,
    speciesName: 'Vulpix',
    category: 'hisui',
    cost: 110,
    description: 'Pelaje albino como témpanos de nieve eterna del Monte Lanakila.',
    badge: 'NIEVE ÁRTICA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/vulpix-alola.gif',
  },

  // ── PIKACHU (#25 - Colección de Gorras de Ash y Trajes) ──
  {
    id: 'COSTUME_PIKA_CAP_ORIGINAL',
    name: 'Gorra Clásica de Ash (Kanto/Johto)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 60,
    description: 'La histórica gorra roja y blanca de la primera temporada del anime.',
    badge: 'GORRA ASH ORIGINAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-card.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-original.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_HOENN',
    name: 'Gorra Verde Esmeralda (Hoenn)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 70,
    description: 'Gorra deportiva de la Liga Hoenn con visera verde esmeralda.',
    badge: 'GORRA HOENN',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-hoenn.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_SINNOH',
    name: 'Gorra Polar de Sinnoh',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 75,
    description: 'Gorra de expedición por el Monte Corona de la región Sinnoh.',
    badge: 'GORRA SINNOH',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-sinnoh.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_UNOVA',
    name: 'Gorra Urbana de Teselia (Unova)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 80,
    description: 'Gorra moderna con emblema de la Poké Ball azul y visera plana.',
    badge: 'GORRA TESELIA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-unova.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_KALOS',
    name: 'Gorra Roja de Kalos',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 85,
    description: 'La elegante gorra roja de la región de la Megaevolución.',
    badge: 'GORRA KALOS',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cherish-ball.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-kalos.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_ALOLA',
    name: 'Gorra Solar de Alola',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 90,
    description: 'Gorra tropical inspirada en el sol radiante de Melemele.',
    badge: 'GORRA ALOLA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sun-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-alola.gif',
  },
  {
    id: 'COSTUME_PIKA_CAP_PARTNER',
    name: 'Gorra de Compañero Fiel',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'hat',
    cost: 100,
    description: 'Gorra de la película «¡Te elijo a ti!» de la amistad de Pikachu y Ash.',
    badge: 'COMPAÑERO FIEL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/soothe-bell.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-partner.gif',
  },
  {
    id: 'COSTUME_PIKA_PHD',
    name: 'Bata de Científico & Lentes (Pikachu PhD)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'cosplay',
    cost: 115,
    description: '¡Graduado con honores en programación! Con bata blanca y gafas redondas.',
    badge: 'PIKACHU CIENTÍFICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silph-scope.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-phd.png',
  },
  {
    id: 'COSTUME_PIKA_LIBRE',
    name: 'Máscara de Luchador (Pikachu Libre)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'cosplay',
    cost: 120,
    description: 'Máscara de lucha libre profesional mexicana y capa combativa.',
    badge: 'PIKACHU LIBRE',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-belt.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-libre.png',
  },
  {
    id: 'COSTUME_PIKA_ROCKSTAR',
    name: 'Chaqueta Rockera Punk (Pikachu Rock Star)',
    applicableSpeciesId: 25,
    speciesName: 'Pikachu',
    category: 'cosplay',
    cost: 120,
    description: 'Chaqueta de cuero negra con tachuelas y cola con púa de guitarra eléctrica.',
    badge: 'ROCK STAR',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png',
    costumeSpriteUrl: '/pokemon-costumes/pikachu-rockstar.png',
  },

  // ── BLASTOISE (#9) ──
  {
    id: 'EQUIP_BLASTOISE_MEGA',
    name: 'Cañón Dorsal Hidráulico (Mega Blastoise)',
    applicableSpeciesId: 9,
    speciesName: 'Blastoise',
    category: 'armor',
    cost: 180,
    description: 'Un cañón titánico dorsal y dos en las muñecas con propulsión a chorro.',
    badge: 'CAÑÓN HIDRÁULICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blastoisinite.png',
    costumeSpriteUrl: '/pokemon-costumes/blastoise-mega.gif',
  },

  // ── VENUSAUR (#3) ──
  {
    id: 'EQUIP_VENUSAUR_MEGA',
    name: 'Palmeral de Esporas Gigante (Mega Venusaur)',
    applicableSpeciesId: 3,
    speciesName: 'Venusaur',
    category: 'armor',
    cost: 175,
    description: 'Floración prehistórica reforzada con liana coraza de sebo protector.',
    badge: 'BOSQUE PREHISTÓRICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/venusaurite.png',
    costumeSpriteUrl: '/pokemon-costumes/venusaur-mega.gif',
  },

  // ── SCEPTILE (#254) ──
  {
    id: 'EQUIP_SCEPTILE_MEGA',
    name: 'Misil Dracónico de Pino (Mega Sceptile)',
    applicableSpeciesId: 254,
    speciesName: 'Sceptile',
    category: 'armor',
    cost: 185,
    description: 'Cola en forma de pino que se dispara como un misil supersónico.',
    badge: 'MISIL DE PINO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sceptilite.png',
    costumeSpriteUrl: '/pokemon-costumes/sceptile-mega.gif',
  },

  // ── BLAZIKEN (#257) ──
  {
    id: 'EQUIP_BLAZIKEN_MEGA',
    name: 'Cintas Ígneas de Combate (Mega Blaziken)',
    applicableSpeciesId: 257,
    speciesName: 'Blaziken',
    category: 'armor',
    cost: 190,
    description: 'Llamas ardientes brotan de sus muñecas aumentando su velocidad marcial.',
    badge: 'LLAMAS MARCIALES',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blazikenite.png',
    costumeSpriteUrl: '/pokemon-costumes/blaziken-mega.gif',
  },

  // ── SWAMPERT (#260) ──
  {
    id: 'EQUIP_SWAMPERT_MEGA',
    name: 'Coraza Muscular de Pantano (Mega Swampert)',
    applicableSpeciesId: 260,
    speciesName: 'Swampert',
    category: 'armor',
    cost: 185,
    description: 'Hombros y brazos hipertrofiados que trituran rocas bajo el agua.',
    badge: 'TITÁN DE PANTANO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/swampertite.png',
    costumeSpriteUrl: '/pokemon-costumes/swampert-mega.gif',
  },

  // ── GENGAR (#94 - Mega Forma adicional) ──
  {
    id: 'EQUIP_GENGAR_MEGA',
    name: 'Tercer Ojo Espectral (Mega Gengar)',
    applicableSpeciesId: 94,
    speciesName: 'Gengar',
    category: 'armor',
    cost: 190,
    description: 'Se sumerge entre dimensiones abriendo un tercer ojo dorado en la frente.',
    badge: 'SOMBRA DIMENSIONAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/gengarite.png',
    costumeSpriteUrl: '/pokemon-costumes/gengar-mega.gif',
  },

  // ── AGGRON (#306) ──
  {
    id: 'EQUIP_AGGRON_MEGA',
    name: 'Placas de Acero Pesado (Mega Aggron)',
    applicableSpeciesId: 306,
    speciesName: 'Aggron',
    category: 'armor',
    cost: 180,
    description: 'Blindaje de acero monolítico que resiste impactos de proyectiles.',
    badge: 'BLINDAJE MONOLÍTICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/aggronite.png',
    costumeSpriteUrl: '/pokemon-costumes/aggron-mega.gif',
  },

  // ── GARDEVOIR (#282) ──
  {
    id: 'EQUIP_GARDEVOIR_MEGA',
    name: 'Vestido de Gala Espectral (Mega Gardevoir)',
    applicableSpeciesId: 282,
    speciesName: 'Gardevoir',
    category: 'armor',
    cost: 180,
    description: 'Elegante falda voluminosa blanca y corazón psíquico protector.',
    badge: 'CORAZÓN TELEPÁTICO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/gardevoirite.png',
    costumeSpriteUrl: '/pokemon-costumes/gardevoir-mega.gif',
  },

  // ── GALLADE (#475) ──
  {
    id: 'EQUIP_GALLADE_MEGA',
    name: 'Capa Blanca & Cuchillas Cruzadas (Mega Gallade)',
    applicableSpeciesId: 475,
    speciesName: 'Gallade',
    category: 'armor',
    cost: 180,
    description: 'Capa de caballero andante y espadas de luz en ambos antebrazos.',
    badge: 'ESPADA CABALLERO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/galladite.png',
    costumeSpriteUrl: '/pokemon-costumes/gallade-mega.gif',
  },

  // ── ABSOL (#359) ──
  {
    id: 'EQUIP_ABSOL_MEGA',
    name: 'Alas de Ángel Sombrío (Mega Absol)',
    applicableSpeciesId: 359,
    speciesName: 'Absol',
    category: 'armor',
    cost: 170,
    description: 'Alas etéreas emplumadas y cuerno afilado anunciador del destino.',
    badge: 'ÁNGEL DEL DESTINO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/absolite.png',
    costumeSpriteUrl: '/pokemon-costumes/absol-mega.gif',
  },

  // ── GRENINJA (#658) ──
  {
    id: 'EQUIP_GRENINJA_ASH',
    name: 'Shuriken de Agua Gigante (Greninja Ash)',
    applicableSpeciesId: 658,
    speciesName: 'Greninja',
    category: 'cosplay',
    cost: 220,
    description: 'Vínculo supremo con el entrenador, portando un shuriken colosal a la espalda.',
    badge: 'SINCRONÍA ASH',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystic-water.png',
    costumeSpriteUrl: '/pokemon-costumes/greninja-ash.gif',
  },

  // ── SNORLAX (#143) ──
  {
    id: 'EQUIP_SNORLAX_GMAX',
    name: 'Parque Natural Durmiente (Snorlax Gigamax)',
    applicableSpeciesId: 143,
    speciesName: 'Snorlax',
    category: 'armor',
    cost: 190,
    description: 'Un monte entero con césped y árboles ha brotado sobre su enorme vientre.',
    badge: 'MONTE DURMIENTE',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leftovers.png',
    costumeSpriteUrl: '/pokemon-costumes/snorlax-gmax.gif',
  },

  // ── LAPRAS (#131) ──
  {
    id: 'EQUIP_LAPRAS_GMAX',
    name: 'Pentagrama de Hielo Musical (Lapras Gigamax)',
    applicableSpeciesId: 131,
    speciesName: 'Lapras',
    category: 'armor',
    cost: 175,
    description: 'Lleva notas musicales de hielo flotando a su alrededor como un pentagrama.',
    badge: 'SINFONÍA DE HIELO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/never-melt-ice.png',
    costumeSpriteUrl: '/pokemon-costumes/lapras-gmax.gif',
  },

  // ── MACHAMP (#68) ──
  {
    id: 'EQUIP_MACHAMP_GMAX',
    name: 'Puños Colosales de Dinamita (Machamp Gigamax)',
    applicableSpeciesId: 68,
    speciesName: 'Machamp',
    category: 'armor',
    cost: 180,
    description: 'Cuatro brazos de magma puro imbuidos con energía Dinamax.',
    badge: 'PUÑOS COLOSALES',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png',
    costumeSpriteUrl: '/pokemon-costumes/machamp-gmax.gif',
  },

  // ── CORVIKNIGHT (#823) ──
  {
    id: 'EQUIP_CORVIKNIGHT_GMAX',
    name: 'Blindaje Aéreo de Acero Negro (Corviknight Gigamax)',
    applicableSpeciesId: 823,
    speciesName: 'Corviknight',
    category: 'armor',
    cost: 190,
    description: 'Plumas que se desprenden y vuelan independientemente como drones de acero.',
    badge: 'DRONES DE ACERO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png',
    costumeSpriteUrl: '/pokemon-costumes/corviknight-gmax.gif',
  },

  // ── TOXTRICITY (#849) ──
  {
    id: 'EQUIP_TOXTRICITY_GMAX',
    name: 'Guitarra Eléctrica Tóxica (Toxtricity Gigamax)',
    applicableSpeciesId: 849,
    speciesName: 'Toxtricity',
    category: 'armor',
    cost: 185,
    description: 'Condensa voltios y toxinas en una guitarra de rayo colosal.',
    badge: 'PUNK ROCK GIGAMAX',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png',
    costumeSpriteUrl: '/pokemon-costumes/toxtricity-gmax.gif',
  },

  // ── ZACIAN (#888) ──
  {
    id: 'EQUIP_ZACIAN_CROWNED',
    name: 'Espada Suprema de la Corona (Zacian Corona)',
    applicableSpeciesId: 888,
    speciesName: 'Zacian',
    category: 'armor',
    cost: 260,
    description: 'Blandiendo la espada sagrada legendaria que parte el mar en dos.',
    badge: 'ESPADA CORONADA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rusted-sword.png',
    costumeSpriteUrl: '/pokemon-costumes/zacian-crowned.gif',
  },

  // ── ZAMAZENTA (#889) ──
  {
    id: 'EQUIP_ZAMAZENTA_CROWNED',
    name: 'Escudo Supremo de la Corona (Zamazenta Corona)',
    applicableSpeciesId: 889,
    speciesName: 'Zamazenta',
    category: 'armor',
    cost: 260,
    description: 'Melena blindada convertida en un escudo impenetrable para todo ataque.',
    badge: 'ESCUDO CORONADO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rusted-shield.png',
    costumeSpriteUrl: '/pokemon-costumes/zamazenta-crowned.gif',
  },

  // ── GROUDON (#383) ──
  {
    id: 'EQUIP_GROUDON_PRIMAL',
    name: 'Magma Primitivo Continental (Groudon Primigenio)',
    applicableSpeciesId: 383,
    speciesName: 'Groudon',
    category: 'armor',
    cost: 280,
    description: 'Símbolo Omega en los brazos con magma líquido que fluye de sus fisuras.',
    badge: 'TIERRA PRIMIGENIA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-orb.png',
    costumeSpriteUrl: '/pokemon-costumes/groudon-primal.gif',
  },

  // ── KYOGRE (#382) ──
  {
    id: 'EQUIP_KYOGRE_PRIMAL',
    name: 'Auras Abisales Oceánicas (Kyogre Primigenio)',
    applicableSpeciesId: 382,
    speciesName: 'Kyogre',
    category: 'armor',
    cost: 280,
    description: 'Cuerpo translúcido con marcas Alpha brillantes y aletas luminiscentes.',
    badge: 'OCÉANO PRIMIGENIO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blue-orb.png',
    costumeSpriteUrl: '/pokemon-costumes/kyogre-primal.gif',
  },

  // ── GIRATINA (#487) ──
  {
    id: 'EQUIP_GIRATINA_ORIGIN',
    name: 'Forma Origen del Mundo Distorsión (Giratina)',
    applicableSpeciesId: 487,
    speciesName: 'Giratina',
    category: 'armor',
    cost: 270,
    description: 'Serpentea flotando sin patas en el Mundo Distorsión con picos oscuros.',
    badge: 'MUNDO DISTORSIÓN',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/griseous-orb.png',
    costumeSpriteUrl: '/pokemon-costumes/giratina-origin.gif',
  },

  // ── AERODACTYL (#142) ──
  {
    id: 'EQUIP_AERODACTYL_MEGA',
    name: 'Picos de Obsidiana Aérea (Mega Aerodactyl)',
    applicableSpeciesId: 142,
    speciesName: 'Aerodactyl',
    category: 'armor',
    cost: 165,
    description: 'Espinas de roca volcánica negra recubren su cuerpo haciéndolo feroz.',
    badge: 'OBSIDIANA AÉREA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/aerodactylite.png',
    costumeSpriteUrl: '/pokemon-costumes/aerodactyl-mega.gif',
  },

  // ── PIDGEOT (#18) ──
  {
    id: 'EQUIP_PIDGEOT_MEGA',
    name: 'Penacho Real de Huracán (Mega Pidgeot)',
    applicableSpeciesId: 18,
    speciesName: 'Pidgeot',
    category: 'armor',
    cost: 155,
    description: 'Elegante penacho magenta y alas ampliadas que desatan vendavales.',
    badge: 'REI DEL AIRE',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pidgeotite.png',
    costumeSpriteUrl: '/pokemon-costumes/pidgeot-mega.gif',
  },

  // ── BEEDRILL (#15) ──
  {
    id: 'EQUIP_BEEDRILL_MEGA',
    name: 'Cinco Aguijones de Taladro (Mega Beedrill)',
    applicableSpeciesId: 15,
    speciesName: 'Beedrill',
    category: 'armor',
    cost: 150,
    description: 'Tres aguijones en extremidades y dos en las patas con velocidad letal.',
    badge: 'TALADROS VENENO',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/beedrillite.png',
    costumeSpriteUrl: '/pokemon-costumes/beedrill-mega.gif',
  },

  // ── KANGASKHAN (#115) ──
  {
    id: 'EQUIP_KANGASKHAN_MEGA',
    name: 'Brote de Cría Guerrera (Mega Kangaskhan)',
    applicableSpeciesId: 115,
    speciesName: 'Kangaskhan',
    category: 'armor',
    cost: 160,
    description: 'La cría salta de la bolsa para combatir codo a codo con su madre.',
    badge: 'VÍNCULO FILIAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/kangaskhanite.png',
    costumeSpriteUrl: '/pokemon-costumes/kangaskhan-mega.gif',
  },

  // ── SLOWBRO (#80) ──
  {
    id: 'EQUIP_SLOWBRO_MEGA',
    name: 'Blindaje Concha Espiral (Mega Slowbro)',
    applicableSpeciesId: 80,
    speciesName: 'Slowbro',
    category: 'armor',
    cost: 155,
    description: 'Shellder lo engulle casi por completo funcionando como armadura giratoria.',
    badge: 'CONCHA GIRATORIA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/slowbronite.png',
    costumeSpriteUrl: '/pokemon-costumes/slowbro-mega.gif',
  },

  // ── PINSIR (#127) ──
  {
    id: 'EQUIP_PINSIR_MEGA',
    name: 'Alas Aéreas & Pinzas Afiladas (Mega Pinsir)',
    applicableSpeciesId: 127,
    speciesName: 'Pinsir',
    category: 'armor',
    cost: 160,
    description: 'Despliega alas membranosas adquiriendo el tipo Volador supersónico.',
    badge: 'PINZAS VOLADORAS',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pinsirite.png',
    costumeSpriteUrl: '/pokemon-costumes/pinsir-mega.gif',
  },

  // ── ZOROARK (#571) ──
  {
    id: 'EQUIP_ZOROARK_HISUI',
    name: 'Manto de Rencor Espectral (Forma Hisui)',
    applicableSpeciesId: 571,
    speciesName: 'Zoroark',
    category: 'hisui',
    cost: 170,
    description: 'Melena larga blanca y roja imbuida de rencor ilusorio tipo Fantasma/Normal.',
    badge: 'ILUSIÓN ESPECTRAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/zoroark-hisui.gif',
  },

  // ── NINETALES (#38) ──
  {
    id: 'EQUIP_NINETALES_ALOLA',
    name: 'Manto de Nueve Colas Glaciares (Ninetales Alola)',
    applicableSpeciesId: 38,
    speciesName: 'Ninetales',
    category: 'hisui',
    cost: 150,
    description: 'Colas ondulantes de escarcha y aura protectora de Hada/Hielo.',
    badge: 'HADA GLACIAL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-stone.png',
    costumeSpriteUrl: '/pokemon-costumes/ninetales-alola.gif',
  },

  // ── SAMUROTT (#503) ──
  {
    id: 'EQUIP_SAMUROTT_HISUI',
    name: 'Cuchillas Sombrías de Katana (Samurott Hisui)',
    applicableSpeciesId: 503,
    speciesName: 'Samurott',
    category: 'hisui',
    cost: 165,
    description: 'Armadura samurái roja y negra con espadas de corte siniestro.',
    badge: 'KATANA SOMBRÍA',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-glasses.png',
    costumeSpriteUrl: '/pokemon-costumes/samurott-hisui.gif',
  },

  // ── DECIDUEYE (#724) ──
  {
    id: 'EQUIP_DECIDUEYE_HISUI',
    name: 'Sombrero de Paja de Ronin (Decidueye Hisui)',
    applicableSpeciesId: 724,
    speciesName: 'Decidueye',
    category: 'hisui',
    cost: 165,
    description: 'Flechas de bambú y estilo de combate cuerpo a cuerpo Planta/Lucha.',
    badge: 'RONIN DE BAMBÚ',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/miracle-seed.png',
    costumeSpriteUrl: '/pokemon-costumes/decidueye-hisui.gif',
  },

  // ── GOODRA (#706) ──
  {
    id: 'EQUIP_GOODRA_HISUI',
    name: 'Caparazón Metálico Caracol (Goodra Hisui)',
    applicableSpeciesId: 706,
    speciesName: 'Goodra',
    category: 'hisui',
    cost: 170,
    description: 'Se refugia dentro de su pesado caparazón de metal líquido brillante.',
    badge: 'ACERO CARACOL',
    iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/metal-coat.png',
    costumeSpriteUrl: '/pokemon-costumes/goodra-hisui.gif',
  },
];
