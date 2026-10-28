'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Gamepad2, LogOut, Moon, Play, SlidersHorizontal, Sparkles } from 'lucide-react';
import { RoleBadge } from '@/components/hq/ui/primitives';
import { useHqStore, dayKey, getBalance } from '@/store/useHqStore';
import { useNow, formatElapsed } from '@/hooks/useNow';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import {
  BLOCK_ACCENT,
  BLOCK_KIND_LABEL,
  getScheduleState,
  isOperativeBlockRole,
  type ScheduleState,
} from '@/lib/hqSchedule';

const EMPTY: RoleKey[] = [];

export function TurnBar({
  onOpenCheckOut,
  onOpenCheckInDetail,
  onStarted,
  onToggleFocus,
}: {
  onOpenCheckOut: () => void;
  onOpenCheckInDetail: () => void;
  onStarted?: (role: RoleKey) => void;
  onToggleFocus?: () => void;
}) {
  const active = useHqStore((state) => state.activeSession);
  const startNow = useHqStore((state) => state.startNow);
  const checkouts = useHqStore((state) => state.checkouts);
  const completedBlocks = useHqStore((state) => state.completedBlocks);
  const completeBlock = useHqStore((state) => state.completeBlock);
  const ledger = useHqStore((state) => state.ledger);

  const now = useNow(1000);
  const schedule: ScheduleState | null = now ? getScheduleState(now) : null;
  const todayCheckouts = checkouts[dayKey()] ?? EMPTY;
  const doneBlocks = completedBlocks[dayKey()] ?? [];
  const balance = getBalance(ledger);

  const current = schedule?.current ?? null;
  const activeRole = active ? HQ_ROLES[active.role] : null;
  const currentOperative = current ? isOperativeBlockRole(current.role) : false;
  const blockDone = current ? doneBlocks.includes(current.id) : false;
  const scheduleRole: RoleKey | null =
    current && isOperativeBlockRole(current.role) ? current.role : null;
  const accent = activeRole?.accent ?? (scheduleRole ? BLOCK_ACCENT[scheduleRole] : 'var(--hq-ink-3)');

  const quickStart = () => {
    const role = startNow();
    onStarted?.(role);
  };

  return (
    <div className="border-b border-[#E8E5DD] bg-[#FAF9F5]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 lg:flex-nowrap lg:px-6">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: accent,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 18%, transparent)`,
          }}
        />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {active ? (
            <>
              <span className="hq-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
                En turno
              </span>
              <RoleBadge role={active.role} />
              <span className="hidden truncate text-xs font-medium text-[#1F1E1B] sm:inline">
                {active.blockLabel}
              </span>
              <span className="hq-mono shrink-0 text-[11px] tabular-nums text-[#5E5C56]">
                {formatElapsed(active.startedAt, now)}
              </span>
            </>
          ) : schedule?.isRestDay ? (
            <>
              <Moon className="h-3.5 w-3.5 text-[#8A877E]" />
              <span className="truncate text-xs font-medium text-[#5E5C56]">
                Descanso sagrado · sin turnos
              </span>
            </>
          ) : current ? (
            <>
              <span className="hq-label shrink-0">Ahora</span>
              <RoleBadge role={current.role} />
              <span className="truncate text-xs font-medium text-[#1F1E1B]">{current.label}</span>
              <span className="hq-mono hidden shrink-0 text-[10px] text-[#8A877E] sm:inline">
                {current.start}–{current.end} · {schedule?.minutesLeft ?? 0}m
              </span>
            </>
          ) : schedule?.next ? (
            <span className="truncate text-xs text-[#5E5C56]">
              Próximo: <span className="font-medium text-[#1F1E1B]">{schedule.next.label}</span>
              <span className="hq-mono text-[10px] text-[#8A877E]"> · {schedule.next.start}</span>
            </span>
          ) : (
            <span className="text-xs text-[#8A877E]">Jornada finalizada</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(['ceo', 'cto', 'cmo'] as const).map((role) => {
            const done = todayCheckouts.includes(role);
            return (
              <span
                key={role}
                title={`${HQ_ROLES[role].label}: ${done ? 'completado' : 'pendiente'}`}
                className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px]"
                style={{
                  color: done ? '#fff' : HQ_ROLES[role].accent,
                  backgroundColor: done ? HQ_ROLES[role].accent : 'transparent',
                  borderColor: done ? HQ_ROLES[role].accent : 'var(--hq-border)',
                }}
              >
                {done ? <Check className="h-3 w-3" /> : HQ_ROLES[role].label[0]}
              </span>
            );
          })}
        </div>

        <Link
          href="/hq/tiempo"
          className="hq-focus hidden items-center gap-1.5 rounded-lg border border-[#E8E5DD] bg-white px-2 py-1 text-[10px] text-[#5E5C56] transition-colors hover:bg-[#F2EFE9] sm:flex"
          title="Banco de tiempo"
        >
          <Gamepad2 className="h-3.5 w-3.5 text-[#5A7D62]" />
          <span className="hq-mono font-semibold tabular-nums text-[#1F1E1B]">{balance}m</span>
        </Link>

        {onToggleFocus && (
          <button
            type="button"
            onClick={onToggleFocus}
            title="Modo enfoque (F)"
            aria-label="Modo enfoque"
            className="hq-focus hidden rounded-lg border border-[#E8E5DD] bg-white p-1.5 text-[#8A877E] transition-colors hover:text-[#1F1E1B] sm:block"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        )}

        {active ? (
          <button
            type="button"
            onClick={onOpenCheckOut}
            className="hq-btn shrink-0 py-1.5 text-white"
            style={{ backgroundColor: accent }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Check-Out
          </button>
        ) : current && !currentOperative ? (
          current.role === 'game' ? (
            <Link href="/hq/tiempo" className="hq-btn hq-btn-primary shrink-0 py-1.5">
              <Gamepad2 className="h-3.5 w-3.5" />
              Abrir juego
            </Link>
          ) : current.role === 'rest' ? (
            <span className="hq-chip shrink-0">
              <Moon className="h-3 w-3" />
              Descanso
            </span>
          ) : (
            <button
              type="button"
              onClick={() => completeBlock(current.id)}
              disabled={blockDone}
              className="hq-btn hq-btn-ghost shrink-0 py-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {blockDone
                ? 'Bloque hecho'
                : current.role === 'exercise'
                  ? 'Registrar ejercicio'
                  : `Marcar ${BLOCK_KIND_LABEL[current.kind].toLowerCase()}`}
            </button>
          )
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={quickStart}
              className="hq-btn shrink-0 py-1.5 text-white"
              style={{ backgroundColor: scheduleRole ? BLOCK_ACCENT[scheduleRole] : 'var(--hq-ceo)' }}
            >
              <Play className="h-3.5 w-3.5" />
              {scheduleRole ? `Iniciar ${HQ_ROLES[scheduleRole].label}` : 'Iniciar turno'}
            </button>
            <button
              type="button"
              onClick={onOpenCheckInDetail}
              title="Check-In detallado"
              aria-label="Check-In detallado"
              className="hq-focus rounded-lg border border-[#E8E5DD] bg-white p-1.5 text-[#8A877E] transition-colors hover:text-[#1F1E1B]"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
