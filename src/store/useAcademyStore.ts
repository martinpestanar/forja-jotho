'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ACADEMY_LESSONS,
  lessonsForTrack,
  type AcademyTrackKey,
} from '@/lib/academy';
import { useHqStore } from '@/store/useHqStore';

export interface AcademyResult {
  correct: number;
  total: number;
  completedAt: string;
}

interface CompleteOutcome {
  firstTime: boolean;
  xpGained: number;
  newBadges: string[];
}

interface AcademyStore {
  completed: Record<string, AcademyResult>;
  xp: number;
  badges: string[];
  activity: Record<string, number>;
  completeLesson: (lessonId: string, correct: number, total: number) => CompleteOutcome;
  reset: () => void;
}

function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const initialState = {
  completed: {} as Record<string, AcademyResult>,
  xp: 0,
  badges: [] as string[],
  activity: {} as Record<string, number>,
};

function trackIsComplete(
  track: AcademyTrackKey,
  completed: Record<string, AcademyResult>
): boolean {
  return lessonsForTrack(track).every((lesson) => Boolean(completed[lesson.id]));
}

export const useAcademyStore = create<AcademyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLesson: (lessonId, correct, total) => {
        const lesson = ACADEMY_LESSONS.find((item) => item.id === lessonId);
        if (!lesson) return { firstTime: false, xpGained: 0, newBadges: [] };

        const state = get();
        const previous = state.completed[lessonId];
        const firstTime = !previous;
        const xpGained = firstTime ? lesson.xp : 0;

        const completed: Record<string, AcademyResult> = {
          ...state.completed,
          [lessonId]: {
            correct: Math.max(previous?.correct ?? 0, correct),
            total,
            completedAt: new Date().toISOString(),
          },
        };

        const badges = new Set(state.badges);
        const newBadges: string[] = [];

        const addBadge = (badge: string) => {
          if (!badges.has(badge)) {
            badges.add(badge);
            newBadges.push(badge);
          }
        };

        if (Object.keys(completed).length >= 1) addBadge('first-lesson');
        if (total > 0 && correct === total) addBadge('perfect-quiz');
        if (Object.keys(completed).length >= 5) addBadge('five-lessons');
        if (trackIsComplete(lesson.track, completed)) addBadge(`track-${lesson.track}`);

        const date = todayKey();
        const activity = {
          ...state.activity,
          [date]: (state.activity[date] ?? 0) + (firstTime ? 1 : 0),
        };

        set({
          completed,
          xp: state.xp + xpGained,
          badges: Array.from(badges),
          activity,
        });

        if (firstTime) {
          useHqStore.getState().addMinutes(10, 'Cápsula de Academia', 'academy');
        }

        return { firstTime, xpGained, newBadges };
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'korat-academy-v1',
      skipHydration: true,
      partialize: (state) => ({
        completed: state.completed,
        xp: state.xp,
        badges: state.badges,
        activity: state.activity,
      }),
    }
  )
);

export function academyStreak(activity: Record<string, number>): number {
  let streak = 0;
  const cursor = new Date();
  if (!activity[todayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);

  while (activity[todayKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
