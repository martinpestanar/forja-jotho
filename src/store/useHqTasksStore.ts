'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundFx } from '@/lib/soundFx';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { DEFAULT_SCHEDULE } from '@/lib/hqSchedule';
import {
  MAX_CARRY,
  nextWorkdayKey,
  taskDayKey,
  type BlockRelay,
  type HqTask,
  type TaskLane,
  type TaskStatus,
} from '@/lib/hqTasks';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface NewTaskInput {
  title: string;
  role?: RoleKey | null;
  project?: string | null;
  minutes?: number;
  lane?: TaskLane;
  day?: string | null;
  blockId?: string | null;
  note?: string;
  origin?: string | null;
}

export interface RelayTaskOutcome {
  id: string;
  outcome: 'done' | 'carry' | 'dropped';
}

export interface RecordRelayInput {
  sessionId: string;
  date: string;
  role: RoleKey;
  blockId: string;
  blockLabel: string;
  wins: string;
  nextRoleNote: string;
  visionLine: string;
  decisionRole: RoleKey | null;
  decisionNote: string;
  energy: number;
  tasks: RelayTaskOutcome[];
}

export interface RelayResult {
  relay: BlockRelay;
  done: number;
  carried: number;
  vision: boolean;
  decision: boolean;
}

export interface DayClosure {
  date: string;
  at: string;
  carried: number;
  done: number;
  decisions: number;
}

interface HqTasksStore {
  tasks: HqTask[];
  relays: BlockRelay[];
  closures: DayClosure[];
  addTask: (input: NewTaskInput) => HqTask | null;
  updateTask: (id: string, patch: Partial<HqTask>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;
  dropTask: (id: string) => void;
  parkTask: (id: string) => void;
  sendToDay: (id: string, day: string, blockId?: string | null) => void;
  sendToTomorrow: (id: string) => void;
  recordRelay: (input: RecordRelayInput) => RelayResult;
  closeDay: (date: string) => DayClosure;
  reset: () => void;
}

const initialState = {
  tasks: [] as HqTask[],
  relays: [] as BlockRelay[],
  closures: [] as DayClosure[],
};

function buildTask(input: NewTaskInput): HqTask | null {
  const title = input.title.trim();
  if (!title) return null;
  const now = new Date().toISOString();
  const lane = input.lane ?? 'arrastre';

  return {
    id: makeId('task'),
    title,
    lane,
    status: input.role ? 'planned' : 'inbox',
    role: input.role ?? null,
    project: input.project ?? null,
    minutes: input.minutes ?? 30,
    day: input.day ?? (input.role ? nextWorkdayKey() : null),
    blockId: input.blockId ?? null,
    carry: 0,
    note: input.note ?? '',
    origin: input.origin ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export const useHqTasksStore = create<HqTasksStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTask: (input) => {
        const task = buildTask(input);
        if (!task) return null;
        set((state) => ({ tasks: [task, ...state.tasks] }));
        soundFx.playClick();
        return task;
      },

      updateTask: (id, patch) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...patch,
                  status:
                    patch.role !== undefined && patch.status === 'inbox' && patch.role
                      ? 'planned'
                      : (patch.status ?? task.status),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      setTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, status, updatedAt: new Date().toISOString() } : task
          ),
        }));
        if (status === 'done') soundFx.playCoin();
        else soundFx.playClick();
      },

      completeTask: (id) => get().setTaskStatus(id, 'done'),
      dropTask: (id) => get().setTaskStatus(id, 'dropped'),
      parkTask: (id) => get().setTaskStatus(id, 'parked'),

      sendToDay: (id, day, blockId = null) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: 'planned',
                  day,
                  blockId,
                  lane: task.lane === 'vision' || task.lane === 'decision' ? task.lane : 'arrastre',
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
        soundFx.playClick();
      },

      sendToTomorrow: (id) => get().sendToDay(id, nextWorkdayKey()),

      recordRelay: (input) => {
        const nextDay = nextWorkdayKey();
        const now = new Date().toISOString();
        const state = get();
        const outcomes = new Map(input.tasks.map((task) => [task.id, task.outcome]));

        let done = 0;
        let carried = 0;

        const updated = state.tasks.map((task) => {
          const outcome = outcomes.get(task.id);
          if (!outcome) return task;

          if (outcome === 'done') {
            done += 1;
            return { ...task, status: 'done' as TaskStatus, updatedAt: now };
          }
          if (outcome === 'dropped') {
            return { ...task, status: 'dropped' as TaskStatus, updatedAt: now };
          }

          carried += 1;
          return {
            ...task,
            status: 'planned' as TaskStatus,
            day: nextDay,
            blockId: null,
            lane: 'arrastre' as TaskLane,
            carry: task.carry + 1,
            updatedAt: now,
          };
        });

        const created: HqTask[] = [];
        const blockProject =
          DEFAULT_SCHEDULE.find((block) => block.id === input.blockId)?.project ?? null;

        const visionLine = input.visionLine.trim();
        if (visionLine) {
          created.push({
            id: makeId('task'),
            title: visionLine,
            lane: 'vision',
            status: 'planned',
            role: input.role,
            project: blockProject,
            minutes: 30,
            day: nextDay,
            blockId: null,
            carry: 0,
            note: '',
            origin: `Visión de ${HQ_ROLES[input.role].label} · ${input.blockLabel}`,
            createdAt: now,
            updatedAt: now,
          });
        }

        const decisionNote = input.decisionNote.trim();
        if (input.decisionRole && decisionNote) {
          created.push({
            id: makeId('task'),
            title: decisionNote,
            lane: 'decision',
            status: 'planned',
            role: input.decisionRole,
            project: blockProject,
            minutes: 15,
            day: nextDay,
            blockId: null,
            carry: 0,
            note: `Desbloquea a ${HQ_ROLES[input.role].label}`,
            origin: `Decisión pedida por ${HQ_ROLES[input.role].label}`,
            createdAt: now,
            updatedAt: now,
          });
        }

        const relay: BlockRelay = {
          id: makeId('relay'),
          sessionId: input.sessionId,
          date: input.date,
          role: input.role,
          blockId: input.blockId,
          blockLabel: input.blockLabel,
          at: now,
          wins: input.wins.trim(),
          nextRoleNote: input.nextRoleNote.trim(),
          visionLine,
          decisionRole: input.decisionRole,
          decisionNote,
          energy: input.energy,
          done,
          carried,
        };

        set({
          tasks: [...created, ...updated],
          relays: [relay, ...state.relays].slice(0, 200),
        });

        if (carried > MAX_CARRY) {
          soundFx.playClick();
        }

        return {
          relay,
          done,
          carried,
          vision: Boolean(visionLine),
          decision: Boolean(input.decisionRole && decisionNote),
        };
      },

      closeDay: (date) => {
        const nextDay = nextWorkdayKey();
        const now = new Date().toISOString();
        const state = get();

        let carried = 0;
        let decisions = 0;
        const done = state.tasks.filter(
          (task) => task.status === 'done' && task.updatedAt.startsWith(date)
        ).length;

        const tasks = state.tasks.map((task) => {
          const open = task.status !== 'done' && task.status !== 'dropped' && task.status !== 'parked';
          if (!open) return task;
          if (task.status === 'inbox') return task;
          if (!task.day || task.day > date) return task;

          carried += 1;
          if (task.lane === 'decision') decisions += 1;

          return {
            ...task,
            status: 'planned' as TaskStatus,
            day: nextDay,
            blockId: null,
            carry: task.carry + 1,
            updatedAt: now,
          };
        });

        const closure: DayClosure = { date, at: now, carried, done, decisions };
        set({
          tasks,
          closures: [closure, ...state.closures.filter((item) => item.date !== date)],
        });

        if (carried > 0) soundFx.playClick();
        else soundFx.playCoin();

        return closure;
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'korat-tasks-v1',
      skipHydration: true,
      partialize: (state) => ({
        tasks: state.tasks,
        relays: state.relays,
        closures: state.closures,
      }),
    }
  )
);

/** Tareas abiertas de un rol para un día concreto (incluye las del día sin bloque asignado). */
export function tasksForRoleDay(tasks: HqTask[], role: RoleKey, day: string): HqTask[] {
  return tasks.filter(
    (task) => task.role === role && task.day === day && task.status !== 'done' && task.status !== 'dropped'
  );
}

export function openTasksForDay(tasks: HqTask[], day: string): HqTask[] {
  return tasks.filter(
    (task) => task.status !== 'done' && task.status !== 'dropped' && (!task.day || task.day <= day)
  );
}

export function tasksByLane(tasks: HqTask[], lane: TaskLane): HqTask[] {
  return tasks.filter(
    (task) => task.lane === lane && task.status !== 'done' && task.status !== 'dropped'
  );
}

export function inboxTasks(tasks: HqTask[]): HqTask[] {
  return tasks.filter((task) => task.status === 'inbox' || !task.role);
}

export function todayTaskKey(): string {
  return taskDayKey();
}
