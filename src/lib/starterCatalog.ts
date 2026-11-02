import { StarterPokemon } from '@/types/trainer';

export interface StarterOption {
  key: StarterPokemon;
  speciesId: number;
  name: string;
  region: 'Kanto' | 'Johto' | 'Hoenn';
  gen: 1 | 2 | 3;
  type: 'fuego' | 'agua' | 'planta';
  typeLabel: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  accentColor: string;
}

export const ALL_STARTERS: StarterOption[] = [
  // --- Kanto (Gen 1) ---
  {
    key: 'bulbasaur',
    speciesId: 1,
    name: 'Bulbasaur',
    region: 'Kanto',
    gen: 1,
    type: 'planta',
    typeLabel: 'Planta / Veneno',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    description: 'La semilla en su lomo florece con tu constancia diaria.',
    accentColor: '#22C55E',
  },
  {
    key: 'charmander',
    speciesId: 4,
    name: 'Charmander',
    region: 'Kanto',
    gen: 1,
    type: 'fuego',
    typeLabel: 'Fuego',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
    description: 'La llama de su cola arde más fuerte en tus rachas de foco.',
    accentColor: '#EF4444',
  },
  {
    key: 'squirtle',
    speciesId: 7,
    name: 'Squirtle',
    region: 'Kanto',
    gen: 1,
    type: 'agua',
    typeLabel: 'Agua',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    description: 'Su caparazón amortigua los días de bloqueo y procrastinación.',
    accentColor: '#3B82F6',
  },

  // --- Johto (Gen 2) ---
  {
    key: 'chikorita',
    speciesId: 152,
    name: 'Chikorita',
    region: 'Johto',
    gen: 2,
    type: 'planta',
    typeLabel: 'Planta',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    description: 'La hoja de su cabeza libera un aroma que restaura tu serenidad.',
    accentColor: '#10B981',
  },
  {
    key: 'cyndaquil',
    speciesId: 155,
    name: 'Cyndaquil',
    region: 'Johto',
    gen: 2,
    type: 'fuego',
    typeLabel: 'Fuego',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
    description: 'Tímido al inicio, pero desata ráfagas de código cuando te enfocas.',
    accentColor: '#F97316',
  },
  {
    key: 'totodile',
    speciesId: 158,
    name: 'Totodile',
    region: 'Johto',
    gen: 2,
    type: 'agua',
    typeLabel: 'Agua',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    description: 'Mandíbulas implacables para devorar tareas difíciles sin dudar.',
    accentColor: '#06B6D4',
  },

  // --- Hoenn (Gen 3) ---
  {
    key: 'treecko',
    speciesId: 252,
    name: 'Treecko',
    region: 'Hoenn',
    gen: 3,
    type: 'planta',
    typeLabel: 'Planta',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    description: 'Calmado y calculador. Escala cualquier reto con paciencia zen.',
    accentColor: '#15803D',
  },
  {
    key: 'torchic',
    speciesId: 255,
    name: 'Torchic',
    region: 'Hoenn',
    gen: 3,
    type: 'fuego',
    typeLabel: 'Fuego',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
    description: 'Un corazón ardiente que cobija tus metas más ambiciosas.',
    accentColor: '#EA580C',
  },
  {
    key: 'mudkip',
    speciesId: 258,
    name: 'Mudkip',
    region: 'Hoenn',
    gen: 3,
    type: 'agua',
    typeLabel: 'Agua',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    description: 'Su aleta detecta cualquier corriente de desconcentración.',
    accentColor: '#0284C7',
  },
];
