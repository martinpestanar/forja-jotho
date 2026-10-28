import { RoleKey } from './hqRoles';

export type BlockRole = RoleKey | 'ritual' | 'quick' | 'cierre' | 'rest' | 'game' | 'exercise' | 'flex';

export type BlockKind =
  | 'work'
  | 'ritual'
  | 'rest'
  | 'quick'
  | 'close'
  | 'game'
  | 'exercise'
  | 'flex';

export interface ScheduleBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  role: BlockRole;
  kind: BlockKind;
  project?: string;
}

export const WORK_DAYS = [0, 1, 2, 3, 4];

export const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { id: 'clean', label: 'Ritual de limpieza y orden', start: '11:00', end: '11:30', role: 'ritual', kind: 'ritual' },
  { id: 'cto-vegi', label: 'CTO · Vegi / Suna', start: '11:30', end: '12:30', role: 'cto', kind: 'work', project: 'Vegi / Suna' },
  { id: 'cto-nilah', label: 'CTO · Nilah AI', start: '12:30', end: '14:00', role: 'cto', kind: 'work', project: 'Nilah AI' },
  { id: 'cmo-tiktok', label: 'CMO · TikTok Nilah', start: '14:00', end: '14:30', role: 'cmo', kind: 'work', project: 'Nilah AI' },
  { id: 'cmo-redes', label: 'CMO · Redes monetizadas', start: '14:30', end: '15:00', role: 'cmo', kind: 'work', project: 'Mr. Green' },
  { id: 'lunch', label: 'Corte sagrado · Almuerzo', start: '15:00', end: '17:00', role: 'rest', kind: 'rest' },
  { id: 'ceo-nilah', label: 'CEO · Clientes & salud financiera', start: '17:00', end: '18:30', role: 'ceo', kind: 'work', project: 'Nilah AI' },
  { id: 'quick', label: 'Slot de caja rápida', start: '18:30', end: '19:30', role: 'quick', kind: 'quick' },
  { id: 'close', label: 'Cierre operativo & Check-Out', start: '19:30', end: '20:30', role: 'cierre', kind: 'close' },
  { id: 'game', label: 'Pokémon Time Engine', start: '20:30', end: '21:30', role: 'game', kind: 'game' },
  { id: 'exercise', label: 'Bloque de ejercicio físico', start: '21:30', end: '22:00', role: 'exercise', kind: 'exercise' },
  { id: 'flex', label: 'Slot flexible nocturno', start: '22:00', end: '23:30', role: 'flex', kind: 'flex' },
];

export const BLOCK_ACCENT: Record<BlockRole, string> = {
  ceo: 'var(--hq-ceo)',
  cto: 'var(--hq-cto)',
  cmo: 'var(--hq-cmo)',
  ritual: 'var(--hq-gold)',
  quick: 'var(--hq-gold)',
  cierre: 'var(--hq-ink-2)',
  rest: 'var(--hq-ink-3)',
  game: 'var(--hq-cto)',
  exercise: 'var(--hq-danger)',
  flex: 'var(--hq-cmo)',
};

export const BLOCK_KIND_LABEL: Record<BlockKind, string> = {
  work: 'Trabajo',
  ritual: 'Ritual',
  rest: 'Descanso',
  quick: 'Caja rápida',
  close: 'Cierre',
  game: 'Recompensa',
  exercise: 'Cuerpo',
  flex: 'Flexible',
};

export const BLOCK_ROLE_LABEL: Record<BlockRole, string> = {
  ceo: 'CEO',
  cto: 'CTO',
  cmo: 'CMO',
  ritual: 'Ritual',
  quick: 'Caja',
  cierre: 'Cierre',
  rest: 'Descanso',
  game: 'Juego',
  exercise: 'Cuerpo',
  flex: 'Flexible',
};

export interface ScheduleState {
  current: ScheduleBlock | null;
  next: ScheduleBlock | null;
  progress: number;
  minutesInto: number;
  minutesLeft: number;
  isRestDay: boolean;
  nowMinutes: number;
}

export function isOperativeBlockRole(role: BlockRole): role is RoleKey {
  return role === 'ceo' || role === 'cto' || role === 'cmo';
}

export function timeToMinutes(value: string): number {  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getScheduleState(now: Date = new Date()): ScheduleState {
  const isRestDay = !WORK_DAYS.includes(now.getDay());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (isRestDay) {
    return {
      current: null,
      next: null,
      progress: 0,
      minutesInto: 0,
      minutesLeft: 0,
      isRestDay: true,
      nowMinutes,
    };
  }

  const current =
    DEFAULT_SCHEDULE.find(
      (block) => nowMinutes >= timeToMinutes(block.start) && nowMinutes < timeToMinutes(block.end)
    ) ?? null;

  const next = DEFAULT_SCHEDULE.find((block) => timeToMinutes(block.start) > nowMinutes) ?? null;

  if (!current) {
    return {
      current: null,
      next,
      progress: 0,
      minutesInto: 0,
      minutesLeft: 0,
      isRestDay: false,
      nowMinutes,
    };
  }

  const start = timeToMinutes(current.start);
  const end = timeToMinutes(current.end);
  const minutesInto = nowMinutes - start;
  const minutesLeft = end - nowMinutes;
  const progress = Math.min(100, Math.max(0, Math.round((minutesInto / (end - start)) * 100)));

  return {
    current,
    next,
    progress,
    minutesInto,
    minutesLeft,
    isRestDay: false,
    nowMinutes,
  };
}

export function getTodayLabel(now: Date = new Date()): string {
  return now.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
