'use client';

import React from 'react';
import { CalendarDays, Coffee, Moon, Sunrise } from 'lucide-react';
import { Card, ElasticProgress, PageHeader, RoleBadge, SectionTitle, Stat } from '@/components/hq/ui/primitives';
import { DayDial } from '@/components/hq/ui/DayDial';
import {
  BLOCK_ACCENT,
  DEFAULT_SCHEDULE,
  timeToMinutes,
} from '@/lib/hqSchedule';
import { useHqStore, dayKey, type SessionRecord } from '@/store/useHqStore';

const EMPTY_SESSIONS: SessionRecord[] = [];

export default function JornadaPage() {
  const workDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves'];
  const restDays = ['Viernes', 'Sábado'];

  const sessions = useHqStore((store) => store.sessions);
  const todaySessions = sessions[dayKey()] ?? EMPTY_SESSIONS;

  const actualByBlock: Record<string, number> = {};
  todaySessions.forEach((session) => {
    actualByBlock[session.blockId] = (actualByBlock[session.blockId] ?? 0) + session.minutes;
  });

  const plannedWork = DEFAULT_SCHEDULE.filter((block) => ['ceo', 'cto', 'cmo'].includes(block.role)).reduce(
    (total, block) => total + (timeToMinutes(block.end) - timeToMinutes(block.start)),
    0
  );
  const actualWork = todaySessions
    .filter((session) => ['ceo', 'cto', 'cmo'].includes(session.role))
    .reduce((total, session) => total + session.minutes, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Jornada"
        title="Ocho horas con forma"
        description="La jornada base del fundador: bloques de rol, cortes sagrados y recompensa. Compara lo planificado con lo real."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
            <Sunrise className="h-4 w-4" />
          </span>
          <div>
            <div className="hq-label">Inicio</div>
            <div className="text-sm font-semibold text-[#1F1E1B]">11:00</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C49347]/25 bg-[#C49347]/10 text-[#C49347]">
            <Coffee className="h-4 w-4" />
          </span>
          <div>
            <div className="hq-label">Corte sagrado</div>
            <div className="text-sm font-semibold text-[#1F1E1B]">15:00 – 17:00</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3B7A87]/25 bg-[#3B7A87]/10 text-[#3B7A87]">
            <Moon className="h-4 w-4" />
          </span>
          <div>
            <div className="hq-label">Cierre flexible</div>
            <div className="text-sm font-semibold text-[#1F1E1B]">23:30</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Stat label="Planificado (roles)" value={`${Math.round(plannedWork / 60 * 10) / 10}h`} accent="var(--hq-ink-2)" hint={`${plannedWork} min`} />
        <Stat label="Real hoy" value={`${actualWork}m`} accent="var(--hq-cto)" hint={`${todaySessions.length} turnos`} />
        <Stat
          label="Cumplimiento"
          value={`${plannedWork > 0 ? Math.round((actualWork / plannedWork) * 100) : 0}%`}
          accent="var(--hq-ceo)"
          hint="plan vs real"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Plantilla del día" hint={`${DEFAULT_SCHEDULE.length} bloques`} />
          <ol className="relative space-y-2 before:absolute before:bottom-2 before:left-[42px] before:top-2 before:w-px before:bg-[#E8E5DD]">
            {DEFAULT_SCHEDULE.map((block) => {
              const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
              const actual = actualByBlock[block.id] ?? 0;
              const accent = BLOCK_ACCENT[block.role];
              const ratio = duration > 0 ? Math.min(100, Math.round((actual / duration) * 100)) : 0;
              return (
                <li key={block.id} className="relative flex items-start gap-3 py-1.5">
                  <span className="hq-mono z-10 w-10 shrink-0 rounded bg-[#FAF9F5] pt-1 text-right text-[10px] text-[#8A877E]">
                    {block.start}
                  </span>
                  <span
                    className="z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#FAF9F5]"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="min-w-0 flex-1 rounded-xl border border-[#E8E5DD] bg-white px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-[#1F1E1B]">{block.label}</span>
                      {block.project && <span className="hq-chip text-[9px]">{block.project}</span>}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-[#8A877E]">
                        <span className="hq-mono">Plan {duration}m</span>
                        <span className="hq-mono" style={{ color: actual > 0 ? accent : undefined }}>
                          Real {actual}m
                        </span>
                      </div>
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-[#EAE7DF]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full opacity-25"
                          style={{ width: '100%', backgroundColor: accent }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${ratio}%`, backgroundColor: accent }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 pt-1 sm:flex">
                    <RoleBadge role={block.role} />
                    <span className="hq-mono w-14 text-right text-[9px] text-[#8A877E]">{duration} min</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-2.5">
          <Card className="p-4">
            <SectionTitle title="Reloj de roles" hint="hoy" />
            <DayDial />
          </Card>
          <Card className="p-4">
            <SectionTitle title="Plan vs real" hint="roles" />
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-[#8A877E]">
                  <span>Planificado</span>
                  <span className="hq-mono">{plannedWork}m</span>
                </div>
                <ElasticProgress value={100} accent="var(--hq-border-strong)" height={6} className="mt-1" />
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-[#8A877E]">
                  <span>Real</span>
                  <span className="hq-mono">{actualWork}m</span>
                </div>
                <ElasticProgress
                  value={plannedWork > 0 ? (actualWork / plannedWork) * 100 : 0}
                  accent="var(--hq-cto)"
                  height={6}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[#8A877E]">
              Cierra turnos desde el mando superior para llenar la barra real.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <SectionTitle title="Días laborales" hint="5 días" />
          <div className="flex flex-wrap gap-1.5">
            {workDays.map((day) => (
              <span key={day} className="hq-chip">
                <CalendarDays className="h-3 w-3" />
                {day}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionTitle title="Descanso sagrado" hint="sin check-ins" />
          <div className="flex flex-wrap gap-1.5">
            {restDays.map((day) => (
              <span key={day} className="hq-chip" style={{ color: 'var(--hq-ink-2)' }}>
                <Moon className="h-3 w-3" />
                {day}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#8A877E]">
            El HQ no exige turnos estos días: solo canje de tiempo y descanso.
          </p>
        </Card>
      </div>
    </div>
  );
}
