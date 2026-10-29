'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { DEFAULT_SCHEDULE, getScheduleState, timeToMinutes } from '@/lib/hqSchedule';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';

async function claimHqWorkReward(claimKey: string, kind: 'block_checkout' | 'daily_bonus', minutes: number, label: string) {
  try {
    const { data } = await supabase.rpc('rpc_hq_claim_work_reward', {
      p_claim_key: claimKey,
      p_kind: kind,
      p_minutes: minutes,
      p_label: label,
    });
    if (typeof window !== 'undefined' && (data as any)?.success) {
      window.dispatchEvent(new CustomEvent('syndex:economy-updated', { detail: data }));
    }
  } catch {}
}

export interface ActiveSession {
  id: string;
  role: RoleKey;
  blockId: string;
  blockLabel: string;
  startedAt: string;
  focus: string;
  energy: number;
  date: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  role: RoleKey;
  blockId: string;
  blockLabel: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  focus: string;
  wins: string;
  handoff: string;
  energy: number;
  late?: boolean;
}

export interface Handoff {
  fromRole: RoleKey;
  text: string;
  date: string;
  at: string;
}

export type LedgerReason = 'base' | 'task' | 'academy' | 'bonus' | 'redeem' | 'play' | 'manual';

export interface LedgerEntry {
  id: string;
  date: string;
  at: string;
  delta: number;
  reason: LedgerReason;
  label: string;
}

interface CheckOutInput {
  wins: string;
  handoff: string;
  energy: number;
}

interface LateSessionInput {
  role: RoleKey;
  blockId: string;
  blockLabel: string;
  minutes: number;
  focus: string;
  wins: string;
  handoff: string;
  energy: number;
}

interface HqStore {
  activeSession: ActiveSession | null;
  sessions: Record<string, SessionRecord[]>;
  checkouts: Record<string, RoleKey[]>;
  baseCredited: Record<string, boolean>;
  bonusAwarded: Record<string, boolean>;
  closedDays: Record<string, boolean>;
  handoffs: Record<string, Handoff>;
  completedBlocks: Record<string, string[]>;
  ledger: LedgerEntry[];
  focusMode: boolean;
  startSession: (input: {
    role: RoleKey;
    blockId: string;
    blockLabel: string;
    focus: string;
    energy: number;
  }) => void;
  startNow: () => RoleKey;
  endSession: (input: CheckOutInput) => { session: SessionRecord; bonus: number; taskMinutes: number } | null;
  logLateSession: (
    input: LateSessionInput
  ) => { session: SessionRecord; bonus: number; taskMinutes: number } | null;
  spendMinutes: (minutes: number, label: string) => boolean;
  addMinutes: (minutes: number, label: string, reason?: LedgerReason) => void;
  consumeMinute: () => number;
  ensureDailyBase: () => void;
  completeBlock: (blockId: string) => void;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  activeSession: null as ActiveSession | null,
  sessions: {} as Record<string, SessionRecord[]>,
  checkouts: {} as Record<string, RoleKey[]>,
  baseCredited: {} as Record<string, boolean>,
  bonusAwarded: {} as Record<string, boolean>,
  closedDays: {} as Record<string, boolean>,
  handoffs: {} as Record<string, Handoff>,
  completedBlocks: {} as Record<string, string[]>,
  ledger: [] as LedgerEntry[],
  focusMode: false,
};

export function dayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getBalance(ledger: LedgerEntry[]): number {
  return ledger.reduce((total, entry) => total + entry.delta, 0);
}

function resolveNowRole(): { role: RoleKey; blockId: string; blockLabel: string } {
  const state = getScheduleState(new Date());
  const operative = (role: string): role is RoleKey =>
    role === 'ceo' || role === 'cto' || role === 'cmo';

  if (state.current && operative(state.current.role)) {
    return {
      role: state.current.role,
      blockId: state.current.id,
      blockLabel: state.current.label,
    };
  }

  const next = DEFAULT_SCHEDULE.find(
    (block) =>
      operative(block.role) && timeToMinutes(block.start) > state.nowMinutes
  );

  if (next && operative(next.role)) {
    return { role: next.role, blockId: next.id, blockLabel: next.label };
  }

  return { role: 'ceo', blockId: 'manual', blockLabel: 'Turno manual' };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useHqStore = create<HqStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: ({ role, blockId, blockLabel, focus, energy }) => {
        const current = get();
        if (current.activeSession) return;

        const date = dayKey();
        const id = makeId('session');
        const now = new Date();

        set((state) => {
          const ledger = [...state.ledger];
          const baseCredited = { ...state.baseCredited };
          const closedDays = { ...state.closedDays };

          if (!baseCredited[date]) {
            baseCredited[date] = true;
            closedDays[date] = false;
            ledger.push({
              id: makeId('ledger'),
              date,
              at: now.toISOString(),
              delta: 120,
              reason: 'base',
              label: '2h diarias gratis',
            });
          } else {
            const baseTotal = ledger
              .filter((entry) => entry.date === date && entry.reason === 'base')
              .reduce((total, entry) => total + entry.delta, 0);
            if (baseTotal < 120) {
              ledger.push({
                id: makeId('ledger'),
                date,
                at: now.toISOString(),
                delta: 120 - baseTotal,
                reason: 'base',
                label: 'Ajuste a 2h diarias',
              });
            }
          }

          return {
            activeSession: {
              id,
              role,
              blockId,
              blockLabel,
              startedAt: now.toISOString(),
              focus,
              energy,
              date,
            },
            baseCredited,
            closedDays,
            ledger,
          };
        });

        soundFx.playLevelUp();
      },

      startNow: () => {
        const role = resolveNowRole();
        get().startSession({
          role: role.role,
          blockId: role.blockId,
          blockLabel: role.blockLabel,
          focus: '',
          energy: 4,
        });
        return role.role;
      },

      endSession: ({ wins, handoff, energy }) => {
        const state = get();
        const active = state.activeSession;
        if (!active) return null;

        const date = active.date;
        const endedAt = new Date();
        const minutes = Math.max(
          1,
          Math.round((endedAt.getTime() - new Date(active.startedAt).getTime()) / 60000)
        );

        const session: SessionRecord = {
          id: active.id,
          date,
          role: active.role,
          blockId: active.blockId,
          blockLabel: active.blockLabel,
          startedAt: active.startedAt,
          endedAt: endedAt.toISOString(),
          minutes,
          focus: active.focus,
          wins,
          handoff,
          energy,
        };

        const todaySessions = [...(state.sessions[date] ?? []), session];
        const previousCheckouts = state.checkouts[date] ?? [];
        const nextCheckouts = previousCheckouts.includes(active.role)
          ? previousCheckouts
          : [...previousCheckouts, active.role];

        let bonus = 0;
        let taskMinutes = 0;
        const bonusAwarded = { ...state.bonusAwarded };
        const closedDays = { ...state.closedDays };
        const ledger = [...state.ledger];

        if (!previousCheckouts.includes(active.role)) {
          taskMinutes = 15;
          ledger.push({
            id: makeId('ledger'),
            date,
            at: endedAt.toISOString(),
            delta: 15,
            reason: 'task',
            label: `Tarea cumplida: ${HQ_ROLES[active.role].label}`,
          });
          void claimHqWorkReward(
            `hq_checkout:${date}:${active.role}`,
            'block_checkout',
            minutes,
            `Bloque ${HQ_ROLES[active.role].label} cerrado`
          );
        }

        if (nextCheckouts.length >= 3 && !bonusAwarded[date]) {
          bonusAwarded[date] = true;
          closedDays[date] = true;
          bonus = 60;
          ledger.push({
            id: makeId('ledger'),
            date,
            at: endedAt.toISOString(),
            delta: 60,
            reason: 'bonus',
            label: 'Bonus 3 check-outs',
          });
          void claimHqWorkReward(
            `hq_daily_bonus:${date}`,
            'daily_bonus',
            60,
            'Tríada diaria HQ (CEO + CTO + CMO)'
          );
        }

        const handoffs = { ...state.handoffs };
        if (handoff.trim()) {
          handoffs[date] = {
            fromRole: active.role,
            text: handoff.trim(),
            date,
            at: endedAt.toISOString(),
          };
        }

        set({
          activeSession: null,
          sessions: { ...state.sessions, [date]: todaySessions },
          checkouts: { ...state.checkouts, [date]: nextCheckouts },
          bonusAwarded,
          closedDays,
          ledger,
          handoffs,
        });

        if (bonus > 0) {
          soundFx.playCoin();
        } else {
          soundFx.playClick();
        }

        return { session, bonus, taskMinutes };
      },

      logLateSession: ({ role, blockId, blockLabel, minutes, focus, wins, handoff, energy }) => {
        const state = get();
        const date = dayKey();
        const endedAt = new Date();
        const safeMinutes = Math.max(1, Math.round(minutes));
        const startedAt = new Date(endedAt.getTime() - safeMinutes * 60000);

        const session: SessionRecord = {
          id: makeId('session'),
          date,
          role,
          blockId,
          blockLabel,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          minutes: safeMinutes,
          focus,
          wins,
          handoff,
          energy,
          late: true,
        };

        const todaySessions = [...(state.sessions[date] ?? []), session];
        const previousCheckouts = state.checkouts[date] ?? [];
        const isNewCheckout = !previousCheckouts.includes(role);
        const nextCheckouts = isNewCheckout ? [...previousCheckouts, role] : previousCheckouts;

        let bonus = 0;
        let taskMinutes = 0;
        const bonusAwarded = { ...state.bonusAwarded };
        const closedDays = { ...state.closedDays };
        const ledger = [...state.ledger];

        if (isNewCheckout) {
          taskMinutes = 15;
          ledger.push({
            id: makeId('ledger'),
            date,
            at: endedAt.toISOString(),
            delta: 15,
            reason: 'task',
            label: `Tarea registrada: ${HQ_ROLES[role].label}`,
          });
          void claimHqWorkReward(
            `hq_checkout:${date}:${role}`,
            'block_checkout',
            safeMinutes,
            `Bloque ${HQ_ROLES[role].label} registrado`
          );
        }

        if (nextCheckouts.length >= 3 && !bonusAwarded[date]) {
          bonusAwarded[date] = true;
          closedDays[date] = true;
          bonus = 60;
          ledger.push({
            id: makeId('ledger'),
            date,
            at: endedAt.toISOString(),
            delta: 60,
            reason: 'bonus',
            label: 'Bonus 3 check-outs',
          });
          void claimHqWorkReward(
            `hq_daily_bonus:${date}`,
            'daily_bonus',
            60,
            'Tríada diaria HQ (CEO + CTO + CMO)'
          );
        }

        const handoffs = { ...state.handoffs };
        if (handoff.trim()) {
          handoffs[date] = {
            fromRole: role,
            text: handoff.trim(),
            date,
            at: endedAt.toISOString(),
          };
        }

        const doneBlocks = state.completedBlocks[date] ?? [];
        const nextBlocks = doneBlocks.includes(blockId) ? doneBlocks : [...doneBlocks, blockId];

        set({
          sessions: { ...state.sessions, [date]: todaySessions },
          checkouts: { ...state.checkouts, [date]: nextCheckouts },
          bonusAwarded,
          closedDays,
          ledger,
          handoffs,
          completedBlocks: { ...state.completedBlocks, [date]: nextBlocks },
        });

        if (bonus > 0 || taskMinutes > 0) {
          soundFx.playCoin();
        } else {
          soundFx.playClick();
        }

        return { session, bonus, taskMinutes };
      },

      spendMinutes: (minutes, label) => {
        const state = get();
        if (getBalance(state.ledger) < minutes) return false;

        set({
          ledger: [
            ...state.ledger,
            {
              id: makeId('ledger'),
              date: dayKey(),
              at: new Date().toISOString(),
              delta: -Math.abs(minutes),
              reason: 'redeem',
              label,
            },
          ],
        });
        soundFx.playCoin();
        return true;
      },

      addMinutes: (minutes, label, reason = 'manual') => {
        if (minutes <= 0) return;
        const state = get();
        set({
          ledger: [
            ...state.ledger,
            {
              id: makeId('ledger'),
              date: dayKey(),
              at: new Date().toISOString(),
              delta: Math.abs(minutes),
              reason,
              label,
            },
          ],
        });
        soundFx.playCoin();
      },

      consumeMinute: () => {
        const state = get();
        if (getBalance(state.ledger) <= 0) return 0;

        const date = dayKey();
        const ledger = [...state.ledger];
        const last = ledger[ledger.length - 1];

        if (last && last.reason === 'play' && last.date === date) {
          ledger[ledger.length - 1] = {
            ...last,
            delta: last.delta - 1,
            at: new Date().toISOString(),
          };
        } else {
          ledger.push({
            id: makeId('ledger'),
            date,
            at: new Date().toISOString(),
            delta: -1,
            reason: 'play',
            label: 'Minutos de juego',
          });
        }

        set({ ledger: [...ledger] });
        return getBalance(ledger);
      },

      ensureDailyBase: () => {
        const date = dayKey();
        const state = get();
        const baseTotal = state.ledger
          .filter((entry) => entry.date === date && entry.reason === 'base')
          .reduce((total, entry) => total + entry.delta, 0);

        if (state.baseCredited[date] && baseTotal >= 120) return;

        const delta = state.baseCredited[date] ? 120 - baseTotal : 120;

        set({
          baseCredited: { ...state.baseCredited, [date]: true },
          closedDays: { ...state.closedDays, [date]: false },
          ledger: [
            ...state.ledger,
            {
              id: makeId('ledger'),
              date,
              at: new Date().toISOString(),
              delta,
              reason: 'base',
              label: state.baseCredited[date] ? 'Ajuste a 2h diarias' : '2h diarias gratis',
            },
          ],
        });
      },

      completeBlock: (blockId) => {
        const date = dayKey();
        const state = get();
        const current = state.completedBlocks[date] ?? [];
        if (current.includes(blockId)) return;

        set({
          completedBlocks: {
            ...state.completedBlocks,
            [date]: [...current, blockId],
          },
        });
        soundFx.playCoin();
      },

      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      setFocusMode: (value) => set({ focusMode: value }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'korat-hq-v1',
      skipHydration: true,
      partialize: (state) => ({
        activeSession: state.activeSession,
        sessions: state.sessions,
        checkouts: state.checkouts,
        baseCredited: state.baseCredited,
        bonusAwarded: state.bonusAwarded,
        closedDays: state.closedDays,
        handoffs: state.handoffs,
        completedBlocks: state.completedBlocks,
        ledger: state.ledger,
        focusMode: state.focusMode,
      }),
    }
  )
);

