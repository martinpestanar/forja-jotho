'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Crown, Megaphone, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, ElasticProgress, PageHeader, RoleBadge, SectionTitle, Stat } from '@/components/hq/ui/primitives';
import { CheckInSheet, type CheckInPayload } from '@/components/hq/ui/CheckInSheet';
import { RoleTaskList } from '@/components/hq/roles/RoleTaskList';
import { RPGDialog } from '@/components/hq/ui/RPGDialog';
import { HQ_ROLES, isRoleKey, type RoleKey } from '@/lib/hqRoles';
import { BLOCK_KIND_LABEL, DEFAULT_SCHEDULE } from '@/lib/hqSchedule';
import { useHqStore } from '@/store/useHqStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { taskDayKey } from '@/lib/hqTasks';

const ROLE_ICON: Record<RoleKey, LucideIcon> = {
  ceo: Crown,
  cto: Wrench,
  cmo: Megaphone,
};

export default function RoleDetailPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);

  const active = useHqStore((store) => store.activeSession);
  const startSession = useHqStore((store) => store.startSession);
  const relays = useHqTasksStore((store) => store.relays);
  const lastRelay = relays[0] ?? null;
  const relayIsToday = lastRelay?.date === taskDayKey();

  const roleParam = params?.role ?? '';
  const valid = isRoleKey(roleParam);

  useEffect(() => {
    if (!valid) router.replace('/hq/roles');
  }, [valid, router]);

  if (!valid) return null;

  const role = HQ_ROLES[roleParam as RoleKey];
  const Icon = ROLE_ICON[role.key];
  const blocks = DEFAULT_SCHEDULE.filter((block) => block.role === role.key);

  const handleCheckIn = (payload: CheckInPayload) => {
    const block = DEFAULT_SCHEDULE.find((item) => item.role === payload.role);
    startSession({
      role: payload.role,
      blockId: block?.id ?? 'manual',
      blockLabel: block?.label ?? 'Turno manual',
      focus: payload.focus,
      energy: payload.energy,
    });
    setDialogLines([
      `Turno ${HQ_ROLES[payload.role].label} iniciado.`,
      payload.focus ? `Foco: ${payload.focus}` : 'El puesto está abierto. Un solo rol manda.',
    ]);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <Link
        href="/hq/roles"
        className="hq-focus inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8A877E] hover:text-[#1F1E1B]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Cambio de Piel
      </Link>

      <PageHeader
        eyebrow={`Rol ${role.label}`}
        title={role.title}
        description={role.mission}
        actions={
          <button
            type="button"
            className="hq-btn text-white"
            style={{ backgroundColor: role.accent }}
            onClick={() => setSheetOpen(true)}
            disabled={active !== null && active.role !== role.key}
          >
            <Check className="h-4 w-4" />
            {active?.role === role.key ? 'En turno' : active ? 'Otro rol activo' : 'Iniciar turno'}
          </button>
        }
      />

      <Card className="relative overflow-hidden p-5">
        <span aria-hidden className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: role.accent }} />
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{ color: role.accent, borderColor: 'var(--hq-border)', backgroundColor: role.soft }}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <RoleBadge role={role.key} />
              <span className="hq-mono text-[10px] text-[#8A877E]">{blocks.length} bloques asignados</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5E5C56]">
              Métricas del puesto y foco del bloque. Los datos se conectarán en la siguiente fase.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {role.metrics.map((metric) => (
          <Stat key={metric.key} label={metric.label} value="—" accent={role.accent} hint="sin datos" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <SectionTitle title="Bloques de este rol" hint="jornada base" />
          {blocks.length === 0 ? (
            <p className="text-xs text-[#8A877E]">Este rol no tiene bloques fijos en la plantilla.</p>
          ) : (
            <ol className="space-y-1.5">
              {blocks.map((block) => (
                <li key={block.id} className="flex items-center gap-3 rounded-xl border border-[#E8E5DD] bg-white px-3 py-2.5">
                  <span className="hq-mono w-10 shrink-0 text-[10px] text-[#8A877E]">{block.start}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.accent }} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#1F1E1B]">
                    {block.label}
                  </span>
                  <span className="hq-mono shrink-0 text-[9px] uppercase text-[#8A877E]">
                    {BLOCK_KIND_LABEL[block.kind]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-2.5">
          <Card className="p-4">
            <RoleTaskList role={role.key} />
          </Card>
          <Card className="p-4">
            <SectionTitle title="Relevo recibido" hint="último bloque" />
            {lastRelay ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RoleBadge role={lastRelay.role} />
                  <span className="hq-mono text-[9px] text-[#8A877E]">
                    {relayIsToday ? 'hoy' : lastRelay.date} · {lastRelay.blockLabel}
                  </span>
                </div>
                {lastRelay.nextRoleNote ? (
                  <p className="text-[11px] leading-relaxed text-[#1F1E1B]">
                    {lastRelay.nextRoleNote}
                  </p>
                ) : (
                  <p className="text-[11px] leading-relaxed text-[#8A877E]">
                    Sin nota de relevo. Solo el estado de las tareas.
                  </p>
                )}
                {lastRelay.visionLine && (
                  <p className="rounded-lg bg-[#3B7A87]/10 px-2 py-1.5 text-[10px] leading-relaxed text-[#2F6772]">
                    ◎ {lastRelay.visionLine}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-3 text-[11px] leading-relaxed text-[#8A877E]">
                Sin relevos todavía. Se crean al cerrar un bloque.
              </div>
            )}
          </Card>
          <Card className="p-4">
            <SectionTitle title="Foco del puesto" hint="una cosa" />
            <ElasticProgress value={0} accent={role.accent} />
            <p className="mt-2 text-[11px] text-[#8A877E]">
              Define tu foco único al hacer Check-In.
            </p>
          </Card>
        </div>
      </div>

      <CheckInSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultRole={role.key}
        onConfirm={handleCheckIn}
      />
      <RPGDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`Check-In · ${role.label}`}
        lines={dialogLines}
        accent={role.accent}
      />
    </div>
  );
}
