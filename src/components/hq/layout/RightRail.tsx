'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Check, Clock, Gamepad2, LogOut, Sparkles } from 'lucide-react';
import { Card, ElasticProgress, RoleBadge, SectionTitle } from '@/components/hq/ui/primitives';
import {
  getScheduleState,
  isOperativeBlockRole,
  BLOCK_ACCENT,
  BLOCK_KIND_LABEL,
  type ScheduleState,
} from '@/lib/hqSchedule';
import { useHqStore, dayKey, getBalance } from '@/store/useHqStore';
import { HQ_ROLES } from '@/lib/hqRoles';
import { formatElapsed, useNow } from '@/hooks/useNow';

export function RightRail({
  onCheckIn,
  onCheckOut,
  className = '',
}: {
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  className?: string;
}) {
  const [state, setState] = useState<ScheduleState | null>(null);
  const active = useHqStore((store) => store.activeSession);
  const ledger = useHqStore((store) => store.ledger);
  const handoffs = useHqStore((store) => store.handoffs);
  const checkouts = useHqStore((store) => store.checkouts);
  const completedBlocks = useHqStore((store) => store.completedBlocks);
  const completeBlock = useHqStore((store) => store.completeBlock);
  const now = useNow(1000);

  useEffect(() => {
    const update = () => setState(getScheduleState());
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const current = state?.current ?? null;
  const accent = current ? BLOCK_ACCENT[current.role] : 'var(--hq-ink-3)';
  const balance = getBalance(ledger);
  const todayHandoff = handoffs[dayKey()] ?? null;
  const todayCheckouts = checkouts[dayKey()] ?? [];
  const doneBlocks = completedBlocks[dayKey()] ?? [];
  const activeRole = active ? HQ_ROLES[active.role] : null;
  const operativeBlock = current ? isOperativeBlockRole(current.role) : false;
  const blockDone = current ? doneBlocks.includes(current.id) : false;

  return (
    <aside className={`sticky top-[104px] flex h-fit w-[320px] shrink-0 flex-col gap-3 ${className}`}>
      <Card className="p-4">
        <SectionTitle
          title={active ? 'Turno activo' : operativeBlock ? 'Foco actual' : 'Bloque actual'}
          hint={active ? 'en curso' : operativeBlock ? 'un rol a la vez' : 'sin rol'}
        />
        {active && activeRole ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RoleBadge role={active.role} />
              <span className="hq-mono text-[10px] text-[#8A877E]">{active.blockLabel}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="hq-mono text-2xl font-semibold tabular-nums" style={{ color: activeRole.accent }}>
                {formatElapsed(active.startedAt, now)}
              </span>
              <span className="text-[10px] text-[#8A877E]">desde {new Date(active.startedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button
              type="button"
              onClick={onCheckOut}
              className="hq-btn hq-btn-primary w-full"
              style={{ backgroundColor: activeRole.accent }}
            >
              <LogOut className="h-4 w-4" />
              Check-Out
            </button>
          </div>
        ) : state?.isRestDay ? (
          <p className="text-xs leading-relaxed text-[#5E5C56]">
            Hoy es día de descanso sagrado. El HQ no exige check-ins.
          </p>
        ) : current ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RoleBadge role={current.role} />
              <span className="hq-mono text-[10px] text-[#8A877E]">
                {current.start}–{current.end}
              </span>
            </div>
            <p className="text-sm font-medium text-[#1F1E1B]">{current.label}</p>
            <ElasticProgress value={state?.progress ?? 0} accent={accent} />
            <div className="flex items-center justify-between text-[11px] text-[#8A877E]">
              <span className="hq-mono">{state?.progress ?? 0}%</span>
              <span>{state?.minutesLeft ?? 0} min restantes</span>
            </div>

            {operativeBlock ? (
              <button type="button" onClick={onCheckIn} className="hq-btn hq-btn-primary w-full">
                <Check className="h-4 w-4" />
                Hacer Check-In
              </button>
            ) : current.role === 'game' ? (
              <Link href="/hq/tiempo" className="hq-btn hq-btn-primary w-full">
                <Gamepad2 className="h-4 w-4" />
                Abrir Time Engine
              </Link>
            ) : current.role === 'rest' ? (
              <p className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-3 py-2 text-[11px] text-[#8A877E]">
                Descanso sin check-in: suelta la pantalla y vuelve con energía.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => completeBlock(current.id)}
                disabled={blockDone}
                className="hq-btn hq-btn-ghost w-full"
              >
                <Check className="h-4 w-4" />
                {blockDone
                  ? 'Bloque completado'
                  : current.role === 'exercise'
                    ? 'Registrar ejercicio'
                    : `Marcar ${BLOCK_KIND_LABEL[current.kind].toLowerCase()} hecho`}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#5E5C56]">
              {state?.next ? `Siguiente bloque: ${state.next.label}` : 'La jornada de hoy terminó.'}
            </p>
            {state?.next && (
              <span className="hq-chip">
                <Clock className="h-3 w-3" />
                {state.next.start}–{state.next.end}
              </span>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle title="Banco de tiempo" hint="2h + tareas" />
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-[#1F1E1B]">{balance}m</div>
            <div className="text-[11px] text-[#8A877E]">
              {balance >= 60 ? 'disponibles para canjear' : 'acumulando'}
            </div>
          </div>
          <Gamepad2 className="h-6 w-6 text-[#5A7D62]" strokeWidth={1.8} />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5E5C56]">Check-outs de hoy</span>
            <span className="hq-mono text-[#8A877E]">{todayCheckouts.length}/3</span>
          </div>
          <ElasticProgress value={(todayCheckouts.length / 3) * 100} accent="var(--hq-cto)" height={6} />
        </div>
        <Link
          href="/hq/tiempo"
          className="hq-focus mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#3B7A87] hover:underline"
        >
          Abrir Time Engine
        </Link>
      </Card>

      <Card className="p-4">
        <SectionTitle title="Relevo" hint={todayHandoff ? `de ${HQ_ROLES[todayHandoff.fromRole].label}` : 'paso de mando'} />
        {todayHandoff ? (
          <div className="rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-3">
            <p className="text-[11px] leading-relaxed text-[#1F1E1B]">{todayHandoff.text}</p>
            <p className="hq-mono mt-2 text-[9px] text-[#8A877E]">
              {new Date(todayHandoff.at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-3 text-[11px] leading-relaxed text-[#8A877E]">
            Sin notas todavía. Al cerrar un turno aparecerá aquí para el siguiente rol.
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle title="Agentes" hint="segundo plano" />
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs text-[#1F1E1B]">
              <Bot className="h-4 w-4 text-[#5A7D62]" />
              Korat-Dev
            </span>
            <span className="hq-chip text-[10px]">en espera</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs text-[#1F1E1B]">
              <Sparkles className="h-4 w-4 text-[#3B7A87]" />
              Maps-Hunter
            </span>
            <span className="hq-chip text-[10px]">en espera</span>
          </li>
        </ul>
        <Link
          href="/hq/agentes"
          className="hq-focus mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#3B7A87] hover:underline"
        >
          Ver agentes
        </Link>
      </Card>
    </aside>
  );
}
