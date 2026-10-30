'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HabitItem, INITIAL_HABITS, PillarKey } from '@/lib/pillars';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';

export function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface EggProgress {
  stage: 'egg' | 'cracking' | 'hatched';
  daysCompleted: number;
  targetDays: number;
  dominantPillar: PillarKey;
  hatchedSpecies?: string;
  hatchedAt?: string;
}

interface HabitsStore {
  habits: HabitItem[];
  egg: EggProgress;
  onboardingCompleted: boolean;
  
  // Actions
  completeOnboarding: (selectedHabits: HabitItem[], dominantPillar: PillarKey) => void;
  toggleHabit: (habitId: string, dateKey?: string, proof?: string) => { completed: boolean; minutesEarned: number; moneyEarned: number };
  addHabit: (habit: Omit<HabitItem, 'id' | 'history' | 'createdAt'>) => void;
  deleteHabit: (habitId: string) => void;
}

export const useHabitsStore = create<HabitsStore>()(
  persist(
    (set, get) => ({
      habits: INITIAL_HABITS,
      egg: {
        stage: 'egg',
        daysCompleted: 0,
        targetDays: 5,
        dominantPillar: 'cuerpo',
      },
      onboardingCompleted: false,

      completeOnboarding: (selectedHabits, dominantPillar) => {
        set({
          habits: selectedHabits,
          dominantPillar,
          egg: {
            stage: 'egg',
            daysCompleted: 0,
            targetDays: 5,
            dominantPillar,
          },
          onboardingCompleted: true,
        } as any);
      },

      toggleHabit: (habitId, dateKey = getTodayKey(), proof) => {
        const today = dateKey;
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { completed: false, minutesEarned: 0, moneyEarned: 0 };

        const currentlyDone = Boolean(habit.history[today]?.completed);
        const willBeDone = !currentlyDone;

        // Sound + Haptic
        if (willBeDone) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([15, 30, 20]);
          }
          soundFx.playCoin();
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#E60012', '#2563EB', '#22C55E', '#F59E0B'],
          });
        } else {
          soundFx.playClick();
        }

        const newHistory = {
          ...habit.history,
          [today]: {
            completed: willBeDone,
            completedAt: willBeDone ? new Date().toISOString() : '',
            proof: proof ?? habit.history[today]?.proof,
          },
        };

        const updatedHabits = state.habits.map((h) =>
          h.id === habitId ? { ...h, history: newHistory } : h
        );

        // Calculate if today all habits are completed
        const activeToday = updatedHabits.filter((h) => h.active);
        const allDoneToday = activeToday.length > 0 && activeToday.every((h) => h.history[today]?.completed);

        let eggUpdate = { ...state.egg };
        if (allDoneToday && eggUpdate.stage !== 'hatched') {
          const nextDays = eggUpdate.daysCompleted + 1;
          if (nextDays >= eggUpdate.targetDays) {
            eggUpdate.stage = 'hatched';
            eggUpdate.daysCompleted = nextDays;
            eggUpdate.hatchedAt = new Date().toISOString();
            // Determine species
            const speciesMap: Record<PillarKey, string> = {
              cuerpo: 'Riolu',
              mente: 'Beldum',
              conciencia: 'Eevee',
              dinero: 'Meowth',
            };
            eggUpdate.hatchedSpecies = speciesMap[eggUpdate.dominantPillar] || 'Eevee';
            soundFx.playFanfare();
          } else {
            eggUpdate.daysCompleted = nextDays;
            if (nextDays >= 3) {
              eggUpdate.stage = 'cracking';
            }
          }
        }

        set({
          habits: updatedHabits,
          egg: eggUpdate,
        });

        // Earn rewards: 15-25 min + Pokédollars
        const minutesEarned = willBeDone ? Math.round(habit.targetMinutes * 0.35) : 0;
        const moneyEarned = willBeDone ? 50 : 0;

        return {
          completed: willBeDone,
          minutesEarned,
          moneyEarned,
        };
      },

      addHabit: (newHabitData) => {
        const newHabit: HabitItem = {
          ...newHabitData,
          id: `habit_${Date.now()}`,
          history: {},
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      deleteHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
        }));
      },
    }),
    {
      name: 'syndex-habits-v2',
    }
  )
);
