'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Megaphone,
  Plus,
  Sparkles,
  Target,
  Timer,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import {
  DIA_CERO_CARDS,
  DIA_CERO_QUIZ,
  DIA_CERO_RULES,
  DIA_CERO_STEPS,
} from '@/lib/diaCero';
import { roleCapacity, TASK_MINUTES, nextWorkdayKey } from '@/lib/hqTasks';
import { useDiaCeroStore } from '@/store/useDiaCeroStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { soundFx } from '@/lib/soundFx';

const ROLE_ICON: Record<RoleKey, LucideIcon> = { ceo: Crown, cto: Wrench, cmo: Megaphone };
const ROLES = ['ceo', 'cto', 'cmo'] as const;
const TOMORROW = nextWorkdayKey();

type ClassifyDraft = { role: RoleKey | null; lane: 'arrastre' | 'vision' | 'decision'; minutes: number };

export default function DiaCeroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dump, setDump] = useState('');
  const [drafts, setDrafts] = useState<Record<string, ClassifyDraft>>({});

  const answers = useDiaCeroStore((state) => state.answers);
  const setAnswer = useDiaCeroStore((state) => state.setAnswer);
  const priorities = useDiaCeroStore((state) => state.priorities);
  const setPriority = useDiaCeroStore((state) => state.setPriority);
  const complete = useDiaCeroStore((state) => state.complete);

  const tasks = useHqTasksStore((state) => state.tasks);
  const addTask = useHqTasksStore((state) => state.addTask);
  const updateTask = useHqTasksStore((state) => state.updateTask);

  useEffect(() => {
    useDiaCeroStore.persist.rehydrate();
    useHqTasksStore.persist.rehydrate();
  }, []);

  const inbox = useMemo(
    () => tasks.filter((task) => task.status === 'inbox' || !task.role).slice(0, 6),
    [tasks]
  );

  const answered = DIA_CERO_QUIZ.filter((item) => answers[item.id]).length;
  const correct = DIA_CERO_QUIZ.filter((item) => answers[item.id] === item.answer).length;
  const totalPriority = priorities.nilah + priorities.vegi + priorities.farmacia;

  const tomorrowLoad = useMemo(() => {
    const load: Record<RoleKey, number> = { ceo: 0, cto: 0, cmo: 0 };
    for (const task of tasks) {
      if (!task.role || task.day !== TOMORROW) continue;
      if (task.status === 'done' || task.status === 'dropped') continue;
      load[task.role] += task.minutes;
    }
    return load;
  }, [tasks]);

  const capacity = roleCapacity(new Date(`${TOMORROW}T12:00:00`));

  const addDump = () => {
    if (!dump.trim()) return;
    addTask({ title: dump });
    soundFx.playClick();
    setDump('');
  };

  const updateDraft = (id: string, patch: Partial<ClassifyDraft>) =>
    setDrafts((prev) => {
      const base: ClassifyDraft = prev[id] ?? { role: null, lane: 'arrastre', minutes: 30 };
      return { ...prev, [id]: { ...base, ...patch } };
    });

  const applyClassification = () => {
    for (const task of inbox) {
      const draft = drafts[task.id];
      if (!draft?.role) continue;
      updateTask(task.id, {
        role: draft.role,
        lane: draft.lane,
        minutes: draft.minutes,
        status: 'planned',
        day: TOMORROW,
      });
    }
  };

  const next = () => {
    if (step === 3) {
      applyClassification();
    }
    soundFx.playClick();
    setStep((value) => Math.min(DIA_CERO_STEPS.length - 1, value + 1));
  };

  const finish = () => {
    complete();
    soundFx.playLevelUp();
    router.push('/hq');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Progreso */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="hq-label">Día Cero · {step + 1} de {DIA_CERO_STEPS.length}</span>
            <h1 className="hq-title mt-1 text-2xl text-[#1F1E1B]">{DIA_CERO_STEPS[step]}</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push('/hq')}
            className="hq-focus shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-[#8A877E] hover:text-[#1F1E1B]"
          >
            Salir
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {DIA_CERO_STEPS.map((label, index) => (
            <span
              key={label}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: index <= step ? 'var(--hq-ink)' : 'var(--hq-border)',
                opacity: index <= step ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* Acto 0: sombreros */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {DIA_CERO_CARDS.map((card) => {
              const role = HQ_ROLES[card.key];
              const Icon = ROLE_ICON[card.key];
              return (
                <div key={card.key} className="hq-card p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl border"
                      style={{ color: role.accent, borderColor: 'var(--hq-border)', backgroundColor: role.soft }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1F1E1B]">{role.label}</p>
                      <p className="text-[10px] text-[#8A877E]">{card.hat}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium leading-snug text-[#1F1E1B]">“{card.question}”</p>
                  <dl className="mt-3 space-y-2 text-[11px] leading-relaxed">
                    <div>
                      <dt className="hq-label">Decide</dt>
                      <dd className="text-[#5E5C56]">{card.decides}</dd>
                    </div>
                    <div>
                      <dt className="hq-label">Nunca hace</dt>
                      <dd className="text-[#5E5C56]">{card.never}</dd>
                    </div>
                    <div>
                      <dt className="hq-label">Métrica</dt>
                      <dd className="text-[#5E5C56]">{card.metric}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 rounded-lg bg-[#F2EFE9] px-2.5 py-2 text-[10px] leading-relaxed text-[#5E5C56]">
                    Ejemplo: {card.example}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="hq-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F1E1B]">¿Quién decide?</p>
                <p className="text-[11px] text-[#8A877E]">Ponle el sombrero a cada tarea.</p>
              </div>
              <span className="hq-mono text-[10px] text-[#8A877E]">
                {correct}/{DIA_CERO_QUIZ.length}
              </span>
            </div>
            <ul className="space-y-2">
              {DIA_CERO_QUIZ.map((item) => {
                const chosen = answers[item.id];
                const isCorrect = chosen === item.answer;
                return (
                  <li key={item.id} className="rounded-xl border border-[#E8E5DD] bg-white p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 text-xs font-medium text-[#1F1E1B]">{item.text}</p>
                      <div className="flex gap-1">
                        {ROLES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setAnswer(item.id, role);
                              soundFx.playClick();
                            }}
                            className={clsx(
                              'hq-focus rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors',
                              chosen === role
                                ? isCorrect
                                  ? 'border-[#5A7D62] bg-[#5A7D62] text-white'
                                  : 'border-[#D9534F] bg-[#D9534F] text-white'
                                : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                            )}
                          >
                            {HQ_ROLES[role].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {chosen && (
                      <p
                        className={clsx(
                          'mt-1.5 text-[10px] leading-relaxed',
                          isCorrect ? 'text-[#4C6151]' : 'text-[#A33A36]'
                        )}
                      >
                        {isCorrect ? '✓ ' : `Era ${HQ_ROLES[item.answer].label}. `}
                        {item.why}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Acto 1: jerarquía */}
      {step === 1 && (
        <div className="hq-card p-5">
          <p className="text-sm font-semibold text-[#1F1E1B]">¿Cuánto pesa cada proyecto?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#5E5C56]">
            El tiempo se reparte por prioridad, no por urgencia. Nilah manda.
          </p>
          <div className="mt-4 space-y-4">
            {(
              [
                { key: 'nilah', label: 'Nilah AI', accent: 'var(--hq-ceo)' },
                { key: 'vegi', label: 'Vegi / Suna', accent: 'var(--hq-cto)' },
                { key: 'farmacia', label: 'Farmacia Familiar', accent: 'var(--hq-cmo)' },
              ] as const
            ).map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1F1E1B]">{item.label}</span>
                  <span className="hq-mono tabular-nums" style={{ color: item.accent }}>
                    {priorities[item.key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={priorities[item.key]}
                  onChange={(event) => setPriority(item.key, Number(event.target.value))}
                  className="mt-1.5 w-full accent-[#1F1E1B]"
                  aria-label={`Prioridad de ${item.label}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] px-3 py-2">
            <span className="text-[11px] text-[#5E5C56]">Total</span>
            <span
              className={clsx(
                'hq-mono text-sm font-semibold tabular-nums',
                totalPriority > 100 ? 'text-[#A33A36]' : 'text-[#5A7D62]'
              )}
            >
              {totalPriority}%
            </span>
          </div>
          {totalPriority > 100 && (
            <p className="mt-1.5 text-[10px] text-[#A33A36]">
              Suma más de 100%. Algo va a quedar sin tiempo: decide qué no.
            </p>
          )}
        </div>
      )}

      {/* Acto 2: descarga mental */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="hq-card p-5">
            <p className="text-sm font-semibold text-[#1F1E1B]">Vacía la cabeza</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5E5C56]">
              Todo lo pendiente, sin filtro y sin rol. Clasificar viene después.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={dump}
                onChange={(event) => setDump(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addDump();
                  }
                }}
                placeholder="Ej. Llamar a la clienta del salón"
                className="hq-input flex-1"
                maxLength={120}
              />
              <button type="button" onClick={addDump} className="hq-btn hq-btn-primary shrink-0">
                <Plus className="h-4 w-4" />
                Añadir
              </button>
            </div>

            <ul className="mt-3 space-y-1.5">
              {inbox.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-xl border border-[#E8E5DD] bg-white px-3 py-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C49347]" />
                  <span className="min-w-0 flex-1 truncate text-xs text-[#1F1E1B]">{task.title}</span>
                  <button
                    type="button"
                    onClick={() =>
                      useHqTasksStore.getState().setTaskStatus(task.id, 'dropped')
                    }
                    className="hq-focus text-[10px] text-[#A8A59C] hover:text-[#D9534F]"
                  >
                    quitar
                  </button>
                </li>
              ))}
              {inbox.length === 0 && (
                <li className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-3 py-3 text-[11px] text-[#8A877E]">
                  Escribe al menos una tarea real para practicar la clasificación.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Acto 3: clasificación */}
      {step === 3 && (
        <div className="hq-card p-5">
          <p className="text-sm font-semibold text-[#1F1E1B]">Dale rol a cada pendiente</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#5E5C56]">
            Si sale bien, ¿qué cambia? Dinero → CEO. Producto → CTO. Audiencia → CMO.
          </p>

          {inbox.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-3 py-4 text-[11px] text-[#8A877E]">
              No hay pendientes en la bandeja. Puedes continuar.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {inbox.map((task) => {
                const draft: ClassifyDraft = drafts[task.id] ?? {
                  role: null,
                  lane: 'arrastre',
                  minutes: 30,
                };
                return (
                  <li key={task.id} className="rounded-xl border border-[#E8E5DD] bg-white p-3">
                    <p className="text-xs font-medium text-[#1F1E1B]">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => updateDraft(task.id, { role })}
                          className={clsx(
                            'hq-focus rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors',
                            draft.role === role
                              ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                              : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                          )}
                        >
                          {HQ_ROLES[role].label}
                        </button>
                      ))}
                      <span className="mx-1 h-4 w-px bg-[#E8E5DD]" />
                      {(['arrastre', 'vision', 'decision'] as const).map((lane) => (
                        <button
                          key={lane}
                          type="button"
                          onClick={() => updateDraft(task.id, { lane })}
                          className={clsx(
                            'hq-focus rounded-lg border px-2 py-1 text-[10px] transition-colors',
                            draft.lane === lane
                              ? 'border-[#C49347] bg-[#C49347]/10 font-semibold text-[#8A6524]'
                              : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                          )}
                        >
                          {lane === 'arrastre' ? 'Quedó' : lane === 'vision' ? 'Visión' : 'Decisión'}
                        </button>
                      ))}
                      <span className="ml-auto flex items-center gap-1">
                        <Timer className="h-3 w-3 text-[#8A877E]" />
                        {TASK_MINUTES.slice(0, 4).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateDraft(task.id, { minutes: value })}
                            className={clsx(
                              'hq-focus rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
                              draft.minutes === value
                                ? 'border-[#3B7A87] bg-[#3B7A87] text-white'
                                : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Acto 4: primer día */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="hq-card p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#D97043]" />
              <p className="text-sm font-semibold text-[#1F1E1B]">Tu primer día</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5E5C56]">
              Así queda la carga de mañana. El 20% de cada bloque queda libre para imprevistos.
            </p>
            <div className="mt-4 space-y-3">
              {ROLES.map((role) => {
                const cap = capacity[role];
                const used = tomorrowLoad[role];
                const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
                const over = used > cap;
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#1F1E1B]">{HQ_ROLES[role].label}</span>
                      <span className={clsx('hq-mono', over ? 'text-[#A33A36]' : 'text-[#8A877E]')}>
                        {used}/{cap}m
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EAE7DF]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? '#D9534F' : HQ_ROLES[role].accent,
                          opacity: over ? 1 : 0.75,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.values(tomorrowLoad).every((value) => value === 0) && (
              <p className="mt-3 rounded-lg border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-2.5 py-2 text-[10px] text-[#8A877E]">
                Aún no clasificaste tareas. Puedes hacerlo luego desde Pendientes.
              </p>
            )}
          </div>

          <div className="hq-card p-5">
            <p className="text-sm font-semibold text-[#1F1E1B]">Las tres reglas</p>
            <ol className="mt-3 space-y-2">
              {DIA_CERO_RULES.map((rule, index) => (
                <li key={rule} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#5E5C56]">
                  <span className="hq-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F1E1B] text-[10px] text-[#FAF9F5]">
                    {index + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between gap-2 border-t border-[#E8E5DD] pt-4">
        <button
          type="button"
          onClick={() => (step === 0 ? router.push('/hq') : setStep(step - 1))}
          className="hq-btn hq-btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? 'Salir' : 'Atrás'}
        </button>

        {step === DIA_CERO_STEPS.length - 1 ? (
          <button type="button" onClick={finish} className="hq-btn hq-btn-primary">
            <Check className="h-4 w-4" />
            Entrar al HQ
          </button>
        ) : (
          <button type="button" onClick={next} className="hq-btn hq-btn-primary">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {step === 0 && answered === DIA_CERO_QUIZ.length && correct < DIA_CERO_QUIZ.length && (
        <p className="flex items-center justify-start gap-1.5 text-[10px] text-[#8A877E]">
          <Sparkles className="h-3 w-3" />
          Puedes seguir aunque falles: la regla es la pregunta, no la respuesta.
        </p>
      )}
    </div>
  );
}
