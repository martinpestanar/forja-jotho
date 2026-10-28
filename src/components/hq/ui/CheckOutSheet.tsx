'use client';

import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, CornerDownRight, Eye, LogOut, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { Sheet } from './Sheet';
import { RoleBadge } from './primitives';
import { useHqStore, type SessionRecord } from '@/store/useHqStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { openTasksForDay, todayTaskKey } from '@/store/useHqTasksStore';
import { taskAgeDays, visionTemplates } from '@/lib/hqTasks';
import { formatElapsed, useNow } from '@/hooks/useNow';
import { soundFx } from '@/lib/soundFx';

type TaskOutcome = 'done' | 'carry' | 'dropped';

const OUTCOME_META: { key: TaskOutcome; label: string; icon: typeof Check }[] = [
  { key: 'done', label: 'Hecha', icon: Check },
  { key: 'carry', label: 'Queda', icon: CornerDownRight },
  { key: 'dropped', label: 'Fuera', icon: X },
];

export function CheckOutSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: (session: SessionRecord, bonus: number, taskMinutes: number) => void;
}) {
  const active = useHqStore((state) => state.activeSession);
  const endSession = useHqStore((state) => state.endSession);
  const tasks = useHqTasksStore((state) => state.tasks);
  const recordRelay = useHqTasksStore((state) => state.recordRelay);
  const now = useNow(1000);

  const [wins, setWins] = useState('');
  const [handoff, setHandoff] = useState('');
  const [vision, setVision] = useState('');
  const [energy, setEnergy] = useState(active?.energy ?? 4);
  const [outcomes, setOutcomes] = useState<Record<string, TaskOutcome>>({});
  const [showDecision, setShowDecision] = useState(false);
  const [decisionRole, setDecisionRole] = useState<RoleKey>('ceo');
  const [decisionNote, setDecisionNote] = useState('');

  const today = todayTaskKey();
  const blockTasks = useMemo(() => {
    if (!active) return [];
    return openTasksForDay(tasks, today).filter((task) => task.role === active.role);
  }, [tasks, active, today]);

  if (!active) return null;

  const role = HQ_ROLES[active.role];
  const otherRoles = (['ceo', 'cto', 'cmo'] as RoleKey[]).filter((key) => key !== active.role);

  const outcomeFor = (id: string): TaskOutcome => outcomes[id] ?? 'carry';

  const submit = () => {
    const relayTasks = blockTasks.map((task) => ({ id: task.id, outcome: outcomeFor(task.id) }));
    const outcome = endSession({ wins: wins.trim(), handoff: handoff.trim(), energy });
    if (!outcome) return;

    recordRelay({
      sessionId: active.id,
      date: active.date,
      role: active.role,
      blockId: active.blockId,
      blockLabel: active.blockLabel,
      wins: wins.trim(),
      nextRoleNote: handoff.trim(),
      visionLine: vision.trim(),
      decisionRole: showDecision && decisionNote.trim() ? decisionRole : null,
      decisionNote: showDecision ? decisionNote.trim() : '',
      energy,
      tasks: relayTasks,
    });

    if (outcome.bonus > 0) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#D97043', '#5A7D62', '#3B7A87', '#C49347'],
      });
    }

    setWins('');
    setHandoff('');
    setVision('');
    setOutcomes({});
    setShowDecision(false);
    setDecisionNote('');
    onDone?.(outcome.session, outcome.bonus, outcome.taskMinutes);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Check-Out · ${role.label}`}
      description={`${active.blockLabel} · ${formatElapsed(active.startedAt, now)} en turno`}
    >
      <div className="space-y-4">
        <div
          className="flex items-center justify-between rounded-xl border px-3 py-2"
          style={{ borderColor: 'var(--hq-border)', backgroundColor: role.soft }}
        >
          <span className="hq-mono text-[10px] uppercase tracking-wide" style={{ color: role.accent }}>
            En turno desde{' '}
            {new Date(active.startedAt).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="hq-mono text-sm font-semibold tabular-nums" style={{ color: role.accent }}>
            {formatElapsed(active.startedAt, now)}
          </span>
        </div>

        {/* Cierre de tareas del bloque */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="hq-label">Tareas del bloque</span>
            <span className="hq-mono text-[9px] text-[#8A877E]">
              {blockTasks.length === 0 ? 'sin tareas' : `${blockTasks.length} en juego`}
            </span>
          </div>

          {blockTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-3 py-2.5 text-[11px] leading-relaxed text-[#8A877E]">
              No había tareas asignadas. Deja al menos una línea de visión para mañana.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {blockTasks.map((task) => {
                const current = outcomeFor(task.id);
                const age = taskAgeDays(task);
                return (
                  <li
                    key={task.id}
                    className="rounded-xl border border-[#E8E5DD] bg-white p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={clsx(
                          'min-w-0 text-xs font-medium leading-snug',
                          current === 'done' && 'text-[#8A877E] line-through',
                          current === 'dropped' && 'text-[#A8A59C] line-through',
                          current === 'carry' && 'text-[#1F1E1B]'
                        )}
                      >
                        {task.title}
                      </p>
                      <span className="hq-mono shrink-0 text-[9px] text-[#8A877E]">{task.minutes}m</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {OUTCOME_META.map((meta) => {
                        const Icon = meta.icon;
                        const selected = current === meta.key;
                        return (
                          <button
                            key={meta.key}
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setOutcomes((prev) => ({ ...prev, [task.id]: meta.key }));
                            }}
                            className={clsx(
                              'hq-focus inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] font-semibold transition-colors',
                              selected
                                ? meta.key === 'done'
                                  ? 'border-[#5A7D62] bg-[#5A7D62] text-white'
                                  : meta.key === 'carry'
                                    ? 'border-[#C49347] bg-[#C49347] text-white'
                                    : 'border-[#8A877E] bg-[#8A877E] text-white'
                                : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56] hover:bg-[#F2EFE9]'
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                    {current === 'carry' && age > 0 && (
                      <p className="mt-1.5 text-[10px] text-[#B07B2E]">
                        Se arrastra hace {age} día{age === 1 ? '' : 's'}. Si llega a 3, el HQ te pedirá
                        partirla o descartarla.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <label className="hq-label mb-1.5 block" htmlFor="hq-wins">
            Una victoria del bloque
          </label>
          <input
            id="hq-wins"
            className="hq-input"
            value={wins}
            onChange={(event) => setWins(event.target.value)}
            placeholder="Ej. Onboarding cerrado y cliente avisada"
          />
        </div>

        <div>
          <label className="hq-label mb-1.5 block" htmlFor="hq-vision">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              ¿Qué debe existir mañana por visión?
            </span>
          </label>
          <input
            id="hq-vision"
            className="hq-input"
            value={vision}
            onChange={(event) => setVision(event.target.value)}
            placeholder="Una sola línea. Se convertirá en tarea de visión."
            maxLength={140}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {visionTemplates(active.role).map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setVision(template);
                }}
                className="hq-focus rounded-full border border-[#E8E5DD] bg-[#FAF9F5] px-2 py-0.5 text-[10px] text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="hq-label mb-1.5 block" htmlFor="hq-handoff-out">
            Relevo para el siguiente rol
          </label>
          <textarea
            id="hq-handoff-out"
            className="hq-input min-h-[70px] resize-y"
            value={handoff}
            onChange={(event) => setHandoff(event.target.value)}
            placeholder="Un pendiente y una advertencia. Breve."
          />
        </div>

        {/* Decisión cruzada */}
        {showDecision ? (
          <div className="rounded-xl border border-[#E8E5DD] bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="hq-label inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Decisión que necesitas de otro rol
              </span>
              <button
                type="button"
                onClick={() => setShowDecision(false)}
                className="hq-focus rounded-md p-1 text-[#8A877E] hover:text-[#1F1E1B]"
                aria-label="Quitar decisión"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-1.5">
              {otherRoles.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDecisionRole(key)}
                  className={clsx(
                    'hq-focus flex-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors',
                    decisionRole === key
                      ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                      : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                  )}
                >
                  {HQ_ROLES[key].label}
                </button>
              ))}
            </div>
            <input
              className="hq-input mt-2"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={`¿Qué debe decidir ${HQ_ROLES[decisionRole].label}?`}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDecision(true)}
            className="hq-focus inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3B7A87] hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Me bloqueó otro rol
          </button>
        )}

        <div>
          <span className="hq-label mb-1.5 block">Energía al cerrar</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setEnergy(level);
                }}
                className={clsx(
                  'h-8 flex-1 rounded-lg border font-mono text-xs transition-all',
                  energy >= level
                    ? 'border-[#5A7D62] bg-[#5A7D62]/10 text-[#4C6151]'
                    : 'border-[#E8E5DD] bg-white text-[#8A877E]'
                )}
                aria-label={`Energía ${level} de 5`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DD] pt-3">
          <RoleBadge role={active.role} />
          <div className="flex items-center gap-2">
            <button type="button" className="hq-btn hq-btn-ghost" onClick={onClose}>
              Seguir
            </button>
            <button type="button" className="hq-btn hq-btn-primary" onClick={submit}>
              <LogOut className="h-4 w-4" />
              Cerrar turno
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
