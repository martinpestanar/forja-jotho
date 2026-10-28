'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Compass, Sparkles, Timer } from 'lucide-react';
import { Card, RoleBadge, SectionTitle } from '@/components/hq/ui/primitives';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { taskDayKey } from '@/lib/hqTasks';
import { useHqTasksStore } from '@/store/useHqTasksStore';

const LANE_PRIORITY: Record<string, number> = { decision: 3, vision: 2, arrastre: 1 };

export function NextActionCard({
  role,
  minutesLeft,
}: {
  role: RoleKey | null;
  minutesLeft?: number;
}) {
  const tasks = useHqTasksStore((state) => state.tasks);
  const completeTask = useHqTasksStore((state) => state.completeTask);

  if (!role) return null;

  const today = taskDayKey();
  const candidates = tasks
    .filter(
      (task) =>
        task.role === role &&
        (task.status === 'planned' || task.status === 'doing') &&
        (!task.day || task.day <= today)
    )
    .sort((a, b) => {
      const lane = (LANE_PRIORITY[b.lane] ?? 0) - (LANE_PRIORITY[a.lane] ?? 0);
      if (lane !== 0) return lane;
      if (b.carry !== a.carry) return b.carry - a.carry;
      return a.minutes - b.minutes;
    });

  const next = candidates[0] ?? null;
  const tight = minutesLeft !== undefined && next ? next.minutes > minutesLeft : false;

  return (
    <Card className="p-4">
      <SectionTitle title="Qué hacer ahora" hint={HQ_ROLES[role].label} />

      {next ? (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-[#E8E5DD] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <RoleBadge role={role} />
              <span className="hq-mono inline-flex items-center gap-1 text-[10px] text-[#8A877E]">
                <Timer className="h-3 w-3" />
                {next.minutes}m
              </span>
            </div>
            <p className="mt-1.5 text-xs font-medium leading-snug text-[#1F1E1B]">{next.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-[#8A877E]">
              <span>{next.project ?? 'Sin proyecto'}</span>
              {next.lane === 'decision' && <span className="text-[#8A6524]">decisión</span>}
              {next.lane === 'vision' && <span className="text-[#3B7A87]">visión</span>}
              {next.carry > 0 && (
                <span className={next.carry >= 3 ? 'text-[#A33A36]' : 'text-[#8A6524]'}>
                  arrastre ×{next.carry}
                </span>
              )}
            </div>
          </div>

          {tight && (
            <p className="text-[10px] leading-relaxed text-[#A33A36]">
              No cabe completa en lo que queda del bloque. Pártela o elige otra.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => completeTask(next.id)}
              className="hq-btn hq-btn-primary flex-1 py-1.5 text-[11px]"
            >
              <Check className="h-3.5 w-3.5" />
              Completar
            </button>
            <Link
              href="/hq/pendientes"
              className="hq-focus inline-flex items-center gap-1 rounded-lg border border-[#E8E5DD] bg-white px-2 py-1.5 text-[11px] text-[#5E5C56]"
            >
              Cola
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] leading-relaxed text-[#5E5C56]">
            Sin tareas para {HQ_ROLES[role].label}. Captura un pendiente o toma una cápsula de
            Academia.
          </p>
          <div className="flex items-center gap-2">
            <Link href="/hq/pendientes" className="hq-btn hq-btn-ghost flex-1 py-1.5 text-[11px]">
              <Compass className="h-3.5 w-3.5" />
              Capturar
            </Link>
            <Link href="/hq/academia" className="hq-btn hq-btn-ghost flex-1 py-1.5 text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              Academia
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
