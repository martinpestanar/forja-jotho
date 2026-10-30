import {
  Activity,
  Brain,
  Coins,
  Dumbbell,
  HeartHandshake,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type PillarKey = 'cuerpo' | 'mente' | 'conciencia' | 'dinero';

export interface PillarMeta {
  key: PillarKey;
  label: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  bgLight: string;
  borderColor: string;
  rewardsSummary: string;
  defaultHabits: Array<{
    title: string;
    minutes: number;
    daysPerWeek: number;
    requiresProof: boolean;
  }>;
}

export const PILLARS: Record<PillarKey, PillarMeta> = {
  cuerpo: {
    key: 'cuerpo',
    label: 'Cuerpo & Fuerza',
    tagline: 'Energía física, descanso y nutrición',
    icon: Dumbbell,
    color: '#E60012', // Rojo Nintendo
    bgLight: '#FEF2F2',
    borderColor: '#F87171',
    rewardsSummary: 'Vitaminas físicas (Proteína, Hierro), Pociones y EVs',
    defaultHabits: [
      { title: 'Entrenamiento / Gym (1h)', minutes: 60, daysPerWeek: 5, requiresProof: false },
      { title: 'Hidratación 2L & Alimentación Limpia', minutes: 15, daysPerWeek: 7, requiresProof: false },
      { title: 'Dormir 7-8h sin pantallas al acostarse', minutes: 480, daysPerWeek: 7, requiresProof: false },
    ],
  },
  mente: {
    key: 'mente',
    label: 'Mente & Enfoque',
    tagline: 'Intelecto, estudio técnico y aprendizaje',
    icon: Brain,
    color: '#2563EB', // Azul Zafiro
    bgLight: '#EFF6FF',
    borderColor: '#60A5FA',
    rewardsSummary: 'Calcio, Zinc, Caramelos Raros (Rare Candies) y MTs',
    defaultHabits: [
      { title: 'Estudio de tema clave / Programación (1h)', minutes: 60, daysPerWeek: 5, requiresProof: true },
      { title: 'Lectura constructiva (30 min)', minutes: 30, daysPerWeek: 6, requiresProof: false },
    ],
  },
  conciencia: {
    key: 'conciencia',
    label: 'Conciencia & Paz',
    tagline: 'Espiritualidad, gratitud y presencia',
    icon: HeartHandshake,
    color: '#16A34A', // Verde Hoja / Alola
    bgLight: '#F0FDF4',
    borderColor: '#4ADE80',
    rewardsSummary: 'Felicidad Pokémon al 100% (evoluciones de afecto) y Bayas',
    defaultHabits: [
      { title: 'Meditación o respiración consciente (15 min)', minutes: 15, daysPerWeek: 7, requiresProof: false },
      { title: 'Diario / Gratitud o paseo sin teléfono', minutes: 20, daysPerWeek: 7, requiresProof: false },
    ],
  },
  dinero: {
    key: 'dinero',
    label: 'Dinero & Negocios',
    tagline: 'Prospección comercial, ventas y acción',
    icon: Coins,
    color: '#D97706', // Oro Johto
    bgLight: '#FFFBEB',
    borderColor: '#FBBF24',
    rewardsSummary: 'Pokédólares ($), Moneda Amuleto y Pepitas de Oro',
    defaultHabits: [
      { title: 'Prospección o llamadas de venta / Clientes', minutes: 60, daysPerWeek: 5, requiresProof: true },
      { title: 'Crear / Publicar contenido de valor (TikTok/Reel)', minutes: 45, daysPerWeek: 4, requiresProof: true },
    ],
  },
};

export interface HabitItem {
  id: string;
  pillar: PillarKey;
  title: string;
  targetMinutes: number;
  daysOfWeek: number[]; // 0=Domingo, 1=Lunes, ... 6=Sabado
  requiresProof: boolean;
  active: boolean;
  history: Record<string, { completed: boolean; completedAt: string; proof?: string }>;
  createdAt: string;
}

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'habit_cuerpo_1',
    pillar: 'cuerpo',
    title: 'Gimnasio / Actividad Física (1 hora)',
    targetMinutes: 60,
    daysOfWeek: [1, 2, 3, 4, 5],
    requiresProof: false,
    active: true,
    history: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit_mente_1',
    pillar: 'mente',
    title: 'Estudio de Enfoque Profundo (1 hora)',
    targetMinutes: 60,
    daysOfWeek: [1, 2, 3, 4, 5],
    requiresProof: false,
    active: true,
    history: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit_conciencia_1',
    pillar: 'conciencia',
    title: 'Meditación & Diario de Gratitud (15 min)',
    targetMinutes: 15,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    requiresProof: false,
    active: true,
    history: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit_dinero_1',
    pillar: 'dinero',
    title: 'Grabación de Contenido / Ventas Activas',
    targetMinutes: 45,
    daysOfWeek: [1, 2, 3, 4, 5],
    requiresProof: false,
    active: true,
    history: {},
    createdAt: new Date().toISOString(),
  },
];
