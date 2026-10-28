'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  Crown,
  Flame,
  Gamepad2,
  Megaphone,
  Moon,
  Play,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  ElasticProgress,
  PageHeader,
  RoleBadge,
  SectionTitle,
  Stat,
} from '@/components/hq/ui/primitives';
import { DayDial } from '@/components/hq/ui/DayDial';
import { CheckInSheet, type CheckInPayload } from '@/components/hq/ui/CheckInSheet';
import { CheckOutSheet } from '@/components/hq/ui/CheckOutSheet';
import { LateLogSheet, type LateLogTarget } from '@/components/hq/ui/LateLogSheet';
import { NextActionCard } from '@/components/hq/ui/NextActionCard';
import { RPGDialog } from '@/components/hq/ui/RPGDialog';
import { HQ_ROLES } from '@/lib/hqRoles';
import {
  BLOCK_ACCENT,
  BLOCK_KIND_LABEL,
  DEFAULT_SCHEDULE,
  type ScheduleState,
  getScheduleState,
  getTodayLabel,
  isOperativeBlockRole,
} from '@/lib/hqSchedule';
import { useHqStore, dayKey, getBalance } from '@/store/useHqStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { useDiaCeroStore } from '@/store/useDiaCeroStore';
import { useAcademyStore } from '@/store/useAcademyStore';
import { levelFromXp, nextAcademyLesson, trackMeta } from '@/lib/academy';
import { formatElapsed, useNow } from '@/hooks/useNow';

const ROLE_ICON: Record<'ceo' | 'cto' | 'cmo', LucideIcon> = {
  ceo: Crown,
  cto: Wrench,
  cmo: Megaphone,
};

const EMPTY: Array<'ceo' | 'cto' | 'cmo'> = [];

export default function HqTodayPage() {
  const [state, setState] = useState<ScheduleState | null>(null);
  const [today, setToday] = useState('');
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [lateTarget, setLateTarget] = useState<LateLogTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [dialogRole, setDialogRole] = useState<'ceo' | 'cto' | 'cmo'>('ceo');

  const active = useHqStore((store) => store.activeSession);
  const checkouts = useHqStore((store) => store.checkouts);
  const ledger = useHqStore((store) => store.ledger);
  const handoffs = useHqStore((store) => store.handoffs);
  const closedDays = useHqStore((store) => store.closedDays);
  const completedBlocks = useHqStore((store) => store.completedBlocks);
  const completeBlock = useHqStore((store) => store.completeBlock);
  const startSession = useHqStore((store) => store.startSession);
  const startNow = useHqStore((store) => store.startNow);
  const academyCompleted = useAcademyStore((store) => store.completed);
  const academyXp = useAcademyStore((store) => store.xp);
  const taskList = useHqTasksStore((store) => store.tasks);
  const completeTask = useHqTasksStore((store) => store.completeTask);
  const diaCeroDone = useDiaCeroStore((store) => store.completed);
  const now = useNow(1000);

  const academyLevel = levelFromXp(academyXp).level;
  const nextCapsule = nextAcademyLesson(academyCompleted);

  useEffect(() => {
    const update = () => {
      setState(getScheduleState());
      setToday(getTodayLabel());
    };
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const current = state?.current ?? null;
  const activeRole = active ? HQ_ROLES[active.role] : null;
  const accent = activeRole?.accent ?? (current ? BLOCK_ACCENT[current.role] : 'var(--hq-ink-3)');
  const todayCheckouts = checkouts[dayKey()] ?? EMPTY;
  const doneBlocks = completedBlocks[dayKey()] ?? [];
  const balance = getBalance(ledger);
  const todayHandoff = handoffs[dayKey()] ?? null;
  const currentOperative = current ? isOperativeBlockRole(current.role) : false;
  const blockDone = current ? doneBlocks.includes(current.id) : false;
  const focusRole = active?.role ?? (current && isOperativeBlockRole(current.role) ? current.role : null);
  const roleTasks = focusRole
    ? taskList
        .filter(
          (task) =>
            task.role === focusRole &&
            task.status !== 'done' &&
            task.status !== 'dropped' &&
            task.status !== 'parked' &&
            (!task.day || task.day <= dayKey())
        )
        .slice(0, 4)
    : [];
  const carriedTasks = roleTasks.filter((task) => task.carry >= 3);

  let streak = 0;
  const cursor = new Date();
  if (!closedDays[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (closedDays[dayKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const showDialog = (role: 'ceo' | 'cto' | 'cmo', lines: string[]) => {
    setDialogRole(role);
    setDialogLines(lines);
    setDialogOpen(true);
  };

  const quickStart = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    const role = startNow();
    showDialog(role, [
      `Turno ${HQ_ROLES[role].label} iniciado.`,
      'La interfaz ya cambió de piel. Un solo rol manda.',
    ]);
  };

  const handleCheckIn = (payload: CheckInPayload) => {
    const block =
      state?.current && state.current.role === payload.role ? state.current : null;
    startSession({
      role: payload.role,
      blockId: block?.id ?? 'manual',
      blockLabel: block?.label ?? 'Turno manual',
      focus: payload.focus,
      energy: payload.energy,
    });
    showDialog(payload.role, [
      `Turno ${HQ_ROLES[payload.role].label} iniciado. Energía ${payload.energy}/5.`,
      payload.focus ? `Foco: ${payload.focus}` : 'Un solo rol, una sola dirección.',
    ]);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hoy"
        title="Tu HQ operativo"
        description={
          today ? `${today} · un rol a la vez, sin multitasking.` : 'Un rol a la vez, sin multitasking.'
        }
        actions={
          active ? (
            <button type="button" className="hq-btn hq-btn-primary" onClick={() => setCheckOutOpen(true)}>
              <Check className="h-4 w-4" />
              Check-Out
            </button>
          ) : current && !currentOperative ? (
            current.role === 'game' ? (
              <Link href="/hq/tiempo" className="hq-btn hq-btn-primary">
                <Gamepad2 className="h-4 w-4" />
                Abrir juego
              </Link>
            ) : current.role === 'rest' ? (
              <span className="hq-chip">
                <Moon className="h-3 w-3" />
                Descanso
              </span>
            ) : (
              <button
                type="button"
                className="hq-btn hq-btn-primary"
                onClick={() => completeBlock(current.id)}
                disabled={blockDone}
              >
                <Check className="h-4 w-4" />
                {blockDone
                  ? 'Bloque completado'
                  : current.role === 'exercise'
                    ? 'Registrar ejercicio'
                    : `Marcar ${BLOCK_KIND_LABEL[current.kind].toLowerCase()}`}
              </button>
            )
          ) : (
            <button type="button" className="hq-btn hq-btn-primary" onClick={quickStart}>
              <Play className="h-4 w-4" />
              Check-In ahora
            </button>
          )
        }
      />

      {/* Día Cero pendiente */}
      {!diaCeroDone && (
        <Card className="flex flex-col gap-3 border-[#D97043]/30 bg-[#D97043]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D97043]/25 bg-white text-[#D97043]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#1F1E1B]">Empieza por el Día Cero</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">
                15 minutos para entender CEO, CTO y CMO y salir con tu primera cola real.
              </p>
            </div>
          </div>
          <Link href="/hq/dia-cero" className="hq-btn hq-btn-primary shrink-0">
            Empezar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      {/* Bloque actual / turno activo */}
      <Card className="relative overflow-hidden p-5">
        <span aria-hidden className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accent }} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hq-label">{active ? 'En turno' : 'Ahora'}</span>
              {active ? (
                <RoleBadge role={active.role} />
              ) : state?.isRestDay ? (
                <span className="hq-chip">
                  <Moon className="h-3 w-3" />
                  Descanso sagrado
                </span>
              ) : current ? (
                <RoleBadge role={current.role} />
              ) : (
                <span className="hq-chip">{state?.next ? 'Próximo bloque' : 'Jornada cerrada'}</span>
              )}
            </div>

            <h2 className="hq-title mt-2 text-2xl text-[#1F1E1B]">
              {active
                ? active.blockLabel
                : state?.isRestDay
                  ? 'Hoy no se trabaja. Se descansa.'
                  : current
                    ? current.label
                    : state?.next
                      ? state.next.label
                      : 'Día terminado'}
            </h2>

            <p className="mt-1 text-xs text-[#5E5C56]">
              {active
                ? `${activeRole?.label} · ${formatElapsed(active.startedAt, now)} en turno · ${active.focus || 'sin foco declarado'}`
                : state?.isRestDay
                  ? 'Viernes y sábado son días de descanso sagrado.'
                  : current
                    ? `${current.start}–${current.end} · ${BLOCK_KIND_LABEL[current.kind]}${current.project ? ` · ${current.project}` : ''}`
                    : state?.next
                      ? `Comienza a las ${state.next.start} · ${state.next.end}`
                      : 'Sin bloques pendientes.'}
            </p>

            {current && !active && (
              <div className="mt-4 max-w-md space-y-1.5">
                <ElasticProgress value={state?.progress ?? 0} accent={accent} />
                <div className="flex items-center justify-between text-[11px] text-[#8A877E]">
                  <span className="hq-mono">{state?.progress ?? 0}% del bloque</span>
                  <span>{state?.minutesLeft ?? 0} min restantes</span>
                </div>
              </div>
            )}

            {todayHandoff && (
              <div className="mt-4 flex max-w-xl gap-2 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97043]" />
                <div className="min-w-0">
                  <span className="hq-label">
                    Relevo de {HQ_ROLES[todayHandoff.fromRole].label}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#1F1E1B]">
                    {todayHandoff.text}
                  </p>
                </div>
              </div>
            )}

            {roleTasks.length > 0 && (
              <div className="mt-4 max-w-xl">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="hq-label">Tareas de este bloque</span>
                  <Link
                    href="/hq/pendientes"
                    className="hq-focus text-[10px] font-medium text-[#3B7A87] hover:underline"
                  >
                    Ver cola
                  </Link>
                </div>
                <ul className="space-y-1.5">
                  {roleTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 rounded-xl border border-[#E8E5DD] bg-white px-2.5 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => completeTask(task.id)}
                        className="hq-focus mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#D5D1C5] text-transparent transition-colors hover:border-[#5A7D62] hover:text-[#5A7D62]"
                        aria-label={`Completar ${task.title}`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium leading-snug text-[#1F1E1B]">
                          {task.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-[#8A877E]">
                          <span>{task.project ?? 'Sin proyecto'}</span>
                          <span className="hq-mono">{task.minutes}m</span>
                          {task.lane === 'vision' && <span className="text-[#3B7A87]">visión</span>}
                          {task.lane === 'decision' && (
                            <span className="text-[#8A6524]">decisión</span>
                          )}
                          {task.carry > 0 && (
                            <span className={task.carry >= 3 ? 'text-[#A33A36]' : 'text-[#8A6524]'}>
                              ×{task.carry}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {carriedTasks.length > 0 && (
                  <p className="mt-1.5 text-[10px] leading-relaxed text-[#A33A36]">
                    Hay tareas con 3+ arrastres. Decídelas antes de que se vuelvan ruido.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="hq-mono text-[11px] text-[#8A877E]">Check-outs hoy</span>
            <div className="flex items-center gap-1.5">
              {(['ceo', 'cto', 'cmo'] as const).map((role) => {
                const done = todayCheckouts.includes(role);
                return (
                  <span
                    key={role}
                    title={`${HQ_ROLES[role].label}: ${done ? 'completado' : 'pendiente'}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border"
                    style={{
                      color: done ? '#fff' : HQ_ROLES[role].accent,
                      backgroundColor: done ? HQ_ROLES[role].accent : '#fff',
                      borderColor: done ? HQ_ROLES[role].accent : 'var(--hq-border)',
                    }}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="hq-mono text-[10px]">{HQ_ROLES[role].label[0]}</span>}
                  </span>
                );
              })}
            </div>
            <span className="text-[10px] text-[#8A877E]">{todayCheckouts.length} de 3 completados</span>
            {todayCheckouts.length >= 3 && (
              <button
                type="button"
                onClick={() => showDialog('ceo', ['Día conquistado.', '+60m añadidos al banco de tiempo.']) }
                className="hq-chip text-[#5A7D62]"
              >
                <Gamepad2 className="h-3 w-3" />
                Recompensa lista: {balance}m
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="XP del fundador" value={`${academyXp} XP`} icon={Sparkles} accent="var(--hq-gold)" hint={`nivel ${academyLevel}`} />
        <Stat label="Racha operativa" value={`${streak}d`} icon={Flame} accent="var(--hq-ceo)" hint="días conquistados" />
        <Stat label="Foco del día" value={`${Math.round((todayCheckouts.length / 3) * 100)}%`} icon={Target} accent="var(--hq-cto)" hint="check-outs" />
        <Stat label="Banco de tiempo" value={`${balance}m`} icon={Gamepad2} accent="var(--hq-cmo)" hint="disponible" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Timeline */}
        <Card className="p-4 sm:p-5">
          <SectionTitle
            title="Jornada de hoy"
            hint={state?.isRestDay ? 'descanso' : '8 horas'}
            action={
              <Link href="/hq/jornada" className="hq-focus text-[11px] font-medium text-[#3B7A87] hover:underline">
                Ver completa
              </Link>
            }
          />
          <ol className="space-y-1.5">
            {DEFAULT_SCHEDULE.map((block) => {
              const isCurrent = active ? block.id === active.blockId : current?.id === block.id;
              const endMinutes = Number(block.end.split(':')[0]) * 60 + Number(block.end.split(':')[1]);
              const isPast = state ? state.nowMinutes >= endMinutes : false;
              const blockAccent = BLOCK_ACCENT[block.role];
              const blockOperative = isOperativeBlockRole(block.role);
              const blockComplete =
                doneBlocks.includes(block.id) ||
                (isOperativeBlockRole(block.role) && todayCheckouts.includes(block.role));
              const canLogLate = isPast && !isCurrent && !blockComplete;
              return (
                <li
                  key={block.id}
                  className={
                    isCurrent
                      ? 'flex items-center gap-3 rounded-xl border border-[#D5D1C5] bg-[#F2EFE9] px-3 py-2'
                      : 'flex items-center gap-3 rounded-xl px-3 py-2'
                  }
                >
                  <span className="hq-mono w-9 shrink-0 text-[10px] text-[#8A877E]">{block.start}</span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: isCurrent ? blockAccent : `${blockAccent}80` }}
                  />
                  <span
                    className={
                      isPast && !isCurrent
                        ? 'min-w-0 flex-1 truncate text-xs text-[#8A877E]'
                        : 'min-w-0 flex-1 truncate text-xs font-medium text-[#1F1E1B]'
                    }
                  >
                    {block.label}
                  </span>
                  <span className="hq-mono hidden shrink-0 text-[9px] uppercase tracking-wide text-[#8A877E] sm:block">
                    {BLOCK_KIND_LABEL[block.kind]}
                  </span>
                  {isCurrent && (
                    <span
                      className="hq-mono shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{ color: blockAccent, backgroundColor: 'rgba(31,30,27,0.06)' }}
                    >
                      {active ? 'en turno' : 'ahora'}
                    </span>
                  )}
                  {blockComplete && !isCurrent && (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      title="Bloque completado"
                      style={{ color: blockAccent, borderColor: `${blockAccent}55`, backgroundColor: `${blockAccent}14` }}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  {canLogLate && blockOperative && (
                    <button
                      type="button"
                      onClick={() =>
                        setLateTarget({
                          id: block.id,
                          label: block.label,
                          role: block.role as 'ceo' | 'cto' | 'cmo',
                          start: block.start,
                          end: block.end,
                        })
                      }
                      className="hq-focus shrink-0 rounded-full border border-[#D5D1C5] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
                    >
                      Registrar
                    </button>
                  )}
                  {canLogLate && !blockOperative && block.role !== 'rest' && (
                    <button
                      type="button"
                      onClick={() => completeBlock(block.id)}
                      className="hq-focus shrink-0 rounded-full border border-[#D5D1C5] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
                    >
                      Hecho
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Right column: dial + roles + capsule */}
        <div className="space-y-2.5">
          <NextActionCard role={focusRole} minutesLeft={active ? undefined : state?.minutesLeft} />

          <Card className="p-4">
            <SectionTitle title="Reloj de roles" hint="24h" />
            <DayDial />
          </Card>

          <SectionTitle title="Salud de los roles" hint="hoy" />
          {(['ceo', 'cto', 'cmo'] as const).map((roleKey) => {
            const role = HQ_ROLES[roleKey];
            const Icon = ROLE_ICON[roleKey];
            const done = todayCheckouts.includes(roleKey);
            const dimmed = active !== null && active.role !== roleKey;
            return (
              <Card key={role.key} interactive className={`p-4 transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                    style={{ color: role.accent, borderColor: 'var(--hq-border)', backgroundColor: role.soft }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#1F1E1B]">{role.label}</span>
                      <span
                        className="hq-mono text-[9px] uppercase"
                        style={{ color: done ? role.accent : '#8A877E' }}
                      >
                        {done ? 'check-out hecho' : active?.role === roleKey ? 'en turno' : 'sin turno'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#5E5C56]">{role.mission}</p>
                  </div>
                </div>
                <Link
                  href={`/hq/roles/${roleKey}`}
                  className="hq-focus mt-3 inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
                  style={{ color: role.accent }}
                >
                  Entrar al puesto
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Card>
            );
          })}

          <Card className="p-4">
            <SectionTitle title="Cápsula de hoy" hint={nextCapsule ? `${nextCapsule.minutes} min` : 'completado'} />
            {nextCapsule ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-[#8A877E]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1F1E1B]">{nextCapsule.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#8A877E]">
                      {trackMeta(nextCapsule.track).label} · +{nextCapsule.xp} XP
                    </p>
                  </div>
                </div>
                <Link
                  href="/hq/academia"
                  className="hq-focus mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#3B7A87] hover:underline"
                >
                  Empezar cápsula
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <p className="text-[11px] leading-relaxed text-[#5E5C56]">
                Completaste toda la Academia. Aplica lo aprendido en el siguiente bloque.
              </p>
            )}
          </Card>
        </div>
      </div>

      <CheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} onConfirm={handleCheckIn} />
      <CheckOutSheet
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        onDone={(session, bonus, taskMinutes) => {
          setDialogRole(session.role);
          setDialogLines(
            bonus > 0
              ? [
                  'Tres roles completados. Día conquistado.',
                  `+${taskMinutes + bonus} min al banco: ${taskMinutes}m por tarea + ${bonus}m bonus.`,
                ]
              : [
                  `Turno ${HQ_ROLES[session.role].label} cerrado con ${session.minutes} min.`,
                  taskMinutes > 0
                    ? `+${taskMinutes}m añadidos al banco por la tarea cumplida.`
                    : 'El relevo quedó guardado para el siguiente rol.',
                ]
          );
          setDialogOpen(true);
        }}
      />
      <LateLogSheet
        target={lateTarget}
        onClose={() => setLateTarget(null)}
        onSaved={(result) => {
          setDialogRole(result.session.role);
          setDialogLines(
            result.bonus > 0
              ? [
                  'Bloque recuperado y día conquistado.',
                  `+${result.taskMinutes + result.bonus} min al banco: ${result.taskMinutes}m por tarea + ${result.bonus}m bonus.`,
                ]
              : [
                  `${result.session.blockLabel} registrado: ${result.session.minutes} min.`,
                  result.taskMinutes > 0
                    ? `+${result.taskMinutes}m añadidos al banco por la tarea.`
                    : 'El check-out de ese rol ya estaba hecho; solo se guardó el registro.',
                ]
          );
          setDialogOpen(true);
        }}
      />
      <RPGDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`Turno ${HQ_ROLES[dialogRole].label}`}
        lines={dialogLines}
        accent={HQ_ROLES[dialogRole].accent}
      />
    </div>
  );
}
