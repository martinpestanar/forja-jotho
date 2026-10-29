import type { RoleKey } from './hqRoles';
import { DEFAULT_SCHEDULE, WORK_DAYS, isOperativeBlockRole, timeToMinutes } from './hqSchedule';

/**
 * Una tarea del HQ siempre pertenece a un rol y a un proyecto.
 * El carril explica de dónde nació, no qué tan importante es.
 */
export type TaskLane = 'arrastre' | 'vision' | 'decision';
export type TaskStatus = 'inbox' | 'planned' | 'doing' | 'done' | 'parked' | 'dropped';

export interface HqTask {
  id: string;
  title: string;
  lane: TaskLane;
  status: TaskStatus;
  role: RoleKey | null;
  project: string | null;
  minutes: number;
  day: string | null;
  blockId: string | null;
  carry: number;
  note: string;
  origin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockRelay {
  id: string;
  sessionId: string;
  date: string;
  role: RoleKey;
  blockId: string;
  blockLabel: string;
  at: string;
  wins: string;
  nextRoleNote: string;
  visionLine: string;
  decisionRole: RoleKey | null;
  decisionNote: string;
  energy: number;
  done: number;
  carried: number;
}

export const TASK_LANE_META: Record<TaskLane, { label: string; hint: string; accent: string }> = {
  arrastre: {
    label: 'Arrastre',
    hint: 'Quedó a medias y debe cerrarse',
    accent: 'var(--hq-gold)',
  },
  vision: {
    label: 'Visión',
    hint: 'Debe existir mañana para avanzar',
    accent: 'var(--hq-cto)',
  },
  decision: {
    label: 'Decisión',
    hint: 'Otro rol debe desbloquear',
    accent: 'var(--hq-ceo)',
  },
};

export const TASK_PROJECTS = ['Nilah AI', 'Vegi / Suna', 'Farmacia Familiar', 'Personal'] as const;

export const TASK_MINUTES = [15, 30, 45, 60, 90] as const;

export const MAX_CARRY = 3;

const VISION_TEMPLATES: Record<RoleKey, string[]> = {
  ceo: [
    'Que Nilah tenga una decisión tomada sobre precios',
    'Que la clienta en riesgo tenga respuesta hoy',
    'Que la caja de la semana esté cuadrada',
  ],
  cto: [
    'Que el onboarding funcione sin errores en producción',
    'Que el deploy de Vegi quede publicado',
    'Que el bug que bloquea a clientes esté cerrado',
  ],
  cmo: [
    'Que haya contenido publicado y respondido',
    'Que los leads nuevos tengan primer mensaje',
    'Que la oferta esté visible en el perfil',
  ],
};

export function visionTemplates(role: RoleKey): string[] {
  return VISION_TEMPLATES[role];
}

export function taskDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nextWorkday(date: Date = new Date()): Date {
  const cursor = new Date(date);
  cursor.setDate(cursor.getDate() + 1);
  let guard = 0;
  while (!WORK_DAYS.includes(cursor.getDay()) && guard < 10) {
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return cursor;
}

export function nextWorkdayKey(date: Date = new Date()): string {
  return taskDayKey(nextWorkday(date));
}

export interface RoleCapacity {
  ceo: number;
  cto: number;
  cmo: number;
}

/**
 * Capacidad real por rol: 80% del tiempo de sus bloques.
 * El 20% restante es margen para imprevistos, no para más tareas.
 */
export function roleCapacity(day: Date = new Date()): RoleCapacity {
  const capacity: RoleCapacity = { ceo: 0, cto: 0, cmo: 0 };
  if (!WORK_DAYS.includes(day.getDay())) return capacity;

  for (const block of DEFAULT_SCHEDULE) {
    if (!isOperativeBlockRole(block.role)) continue;
    const minutes = timeToMinutes(block.end) - timeToMinutes(block.start);
    capacity[block.role] += Math.round(minutes * 0.8);
  }

  return capacity;
}

export function taskAgeDays(task: HqTask): number {
  const created = new Date(task.createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - created.getTime()) / 86_400_000));
}

export function isOpenTask(task: HqTask): boolean {
  return task.status !== 'done' && task.status !== 'dropped';
}
