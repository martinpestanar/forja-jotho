'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Crown, Megaphone, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, ElasticProgress, PageHeader, Stat } from '@/components/hq/ui/primitives';
import { CheckInSheet, type CheckInPayload } from '@/components/hq/ui/CheckInSheet';
import { RPGDialog } from '@/components/hq/ui/RPGDialog';
import { HQ_ROLES, HQ_ROLE_LIST, type RoleKey } from '@/lib/hqRoles';
import { DEFAULT_SCHEDULE } from '@/lib/hqSchedule';
import { useHqStore, dayKey } from '@/store/useHqStore';
import { SurfAvatar } from '@/components/hq/ui/SurfAvatar';

const ROLE_ICON: Record<RoleKey, LucideIcon> = {
  ceo: Crown,
  cto: Wrench,
  cmo: Megaphone,
};

export default function RolesPage() {
  const [role, setRole] = useState<RoleKey>('ceo');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);

  const active = useHqStore((store) => store.activeSession);
  const checkouts = useHqStore((store) => store.checkouts);
  const startSession = useHqStore((store) => store.startSession);
  const todayCheckouts = checkouts[dayKey()] ?? [];

  const openCheckIn = (nextRole: RoleKey) => {
    setRole(nextRole);
    setSheetOpen(true);
  };

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
      `Turno ${HQ_ROLES[payload.role].label} iniciado con energía ${payload.energy}/5.`,
      payload.focus ? `Foco único: ${payload.focus}` : 'El puesto está abierto. Un solo rol manda.',
    ]);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Cambio de piel"
        title="Un puesto, un bloque"
        description="Elige el rol que asume el control. El HQ prohíbe el multitasking: los otros dos quedan en pausa."
        actions={
          <button type="button" className="hq-btn hq-btn-primary" onClick={() => openCheckIn('ceo')}>
            <Check className="h-4 w-4" />
            Check-In
          </button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {HQ_ROLE_LIST.map((item) => {
          const Icon = ROLE_ICON[item.key];
          const blocks = DEFAULT_SCHEDULE.filter((block) => block.role === item.key);
          const minutes = blocks.reduce((total, block) => {
            const [startH, startM] = block.start.split(':').map(Number);
            const [endH, endM] = block.end.split(':').map(Number);
            return total + (endH * 60 + endM - (startH * 60 + startM));
          }, 0);

          return (
            <Card key={item.key} interactive className="relative overflow-hidden p-5">
              <span
                aria-hidden
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: item.accent }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <SurfAvatar role={item.key} size="md" active={active?.role === item.key} />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: item.accent }}>
                      Vibe Surf
                    </span>
                    <h2 className="hq-title text-xl text-[#1F1E1B]">{item.label}</h2>
                  </div>
                </div>
                <span className="hq-chip text-[9px]">{minutes} min/día</span>
              </div>

              <p className="mt-2 text-[11px] font-medium" style={{ color: item.accent }}>
                {item.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#5E5C56]">{item.mission}</p>

              <div className="mt-4 space-y-2">
                {item.metrics.map((metric) => (
                  <div key={metric.key}>
                    <div className="flex items-center justify-between text-[10px] text-[#8A877E]">
                      <span>{metric.label}</span>
                      <span className="hq-mono">—</span>
                    </div>
                    <ElasticProgress value={0} accent={item.accent} height={4} className="mt-1" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCheckIn(item.key)}
                  disabled={active !== null && active.role !== item.key}
                  className="hq-btn flex-1 text-white"
                  style={{ backgroundColor: item.accent }}
                >
                  {active?.role === item.key
                    ? 'En turno'
                    : todayCheckouts.includes(item.key)
                      ? 'Repetir turno'
                      : active
                        ? 'Otro rol activo'
                        : 'Iniciar turno'}
                </button>
                <Link
                  href={`/hq/roles/${item.key}`}
                  className="hq-btn hq-btn-ghost"
                  aria-label={`Abrir ${item.label}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="hq-title text-base text-[#1F1E1B]">Cómo funciona el cambio de piel</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { step: '01', title: 'Check-In', text: 'Declaras rol, energía y un foco único.' },
            { step: '02', title: 'Ejecutas', text: 'Solo tareas de ese puesto durante el bloque.' },
            { step: '03', title: 'Check-Out', text: 'Dejas victorias y handoff para el siguiente rol.' },
          ].map((item) => (
            <div key={item.step} className="hq-panel p-3">
              <span className="hq-mono text-[10px] font-bold text-[#D97043]">{item.step}</span>
              <h3 className="mt-1 text-xs font-semibold text-[#1F1E1B]">{item.title}</h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Turnos abiertos" value="0" hint="hoy" />
        <Stat label="Handoffs pendientes" value="0" hint="sin notas" />
        <Stat label="XP por check-out" value="+15" accent="var(--hq-gold)" hint="al cerrar" />
        <Stat label="Bonus 3 roles" value="+60m" accent="var(--hq-cto)" hint="Time Engine" />
      </div>

      <CheckInSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultRole={role}
        onConfirm={handleCheckIn}
      />
      <RPGDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Turno iniciado"
        lines={dialogLines}
        accent={HQ_ROLES[role].accent}
      />
    </div>
  );
}
