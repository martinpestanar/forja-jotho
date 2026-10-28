'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleKey } from '@/lib/hqRoles';

export interface Priorities {
  nilah: number;
  vegi: number;
  farmacia: number;
}

interface DiaCeroStore {
  completed: boolean;
  completedAt: string | null;
  answers: Record<string, RoleKey>;
  priorities: Priorities;
  setAnswer: (id: string, role: RoleKey) => void;
  setPriority: (key: keyof Priorities, value: number) => void;
  complete: () => void;
  reset: () => void;
}

const DEFAULT_PRIORITIES: Priorities = { nilah: 80, vegi: 15, farmacia: 5 };

export const useDiaCeroStore = create<DiaCeroStore>()(
  persist(
    (set) => ({
      completed: false,
      completedAt: null,
      answers: {},
      priorities: DEFAULT_PRIORITIES,

      setAnswer: (id, role) =>
        set((state) => ({ answers: { ...state.answers, [id]: role } })),

      setPriority: (key, value) =>
        set((state) => ({
          priorities: {
            ...state.priorities,
            [key]: Math.max(0, Math.min(100, Math.round(value))),
          },
        })),

      complete: () => set({ completed: true, completedAt: new Date().toISOString() }),

      reset: () =>
        set({
          completed: false,
          completedAt: null,
          answers: {},
          priorities: DEFAULT_PRIORITIES,
        }),
    }),
    {
      name: 'korat-diacero-v1',
      skipHydration: true,
      partialize: (state) => ({
        completed: state.completed,
        completedAt: state.completedAt,
        answers: state.answers,
        priorities: state.priorities,
      }),
    }
  )
);

export { DEFAULT_PRIORITIES };
