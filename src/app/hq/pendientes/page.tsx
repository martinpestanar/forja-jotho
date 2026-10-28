'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CornerDownRight,
  Eye,
  Inbox,
  Moon,
  Plus,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  Card,
  PageHeader,
  RoleBadge,
  SectionTitle,
  Stat,
} from '@/components/hq/ui/primitives';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import {
  TASK_LANE_META,
  TASK_MINUTES,
  TASK_PROJECTS,
  isOpenTask,
  nextWorkday,
  nextWorkdayKey,
  roleCapacity,
  taskAgeDays,
  taskDayKey,
  type HqTask,
  type TaskLane,
} from '@/lib/hqTasks';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { soundFx } from '@/lib/soundFx';
import type { DayClosure } from '@/store/useHqTasksStore';

const ROLES = ['ceo', 'cto', 'cmo'] as const;
const LANES: TaskLane[] = ['decision', 'arrastre', 'vision'];
const TOMORROW = nextWorkdayKey();
const TODAY = taskDayKey();
const TOMORROW_LABEL = nextWorkday().toLocaleDateString('es-PE', {
  weekday: 'long',
  day: 'numeric',
});

function QuickCapture() {
  const addTask = useHqTasksStore((state) => state.addTask);
  const [title, setTitle] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addTask({ title });
    setTitle('');
  };

  return (
    <Card className="p-4">
      <SectionTitle title="Captura rápida" hint="sin clasificar" />
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Se me ocurrió algo para mañana…"
          className="hq-input flex-1"
          maxLength={120}
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="hq-btn hq-btn-primary shrink-0 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Añadir</span>
        </button>
      </form>
      <p className="mt-2 text-[10px] leading-relaxed text-[#8A877E]">
        Captura en 5 segundos. Clasificar viene después: rol, proyecto y minutos.
      </p>
    </Card>
  );
}

function InboxRow({ task }: { task: HqTask }) {
  const updateTask = useHqTasksStore((state) => state.updateTask);
  const dropTask = useHqTasksStore((state) => state.dropTask);

  const [role, setRole] = useState<RoleKey | null>(null);
  const [project, setProject] = useState<string>('Nilah AI');
  const [minutes, setMinutes] = useState(30);
  const [lane, setLane] = useState<TaskLane>('arrastre');

  const save = () => {
    if (!role) return;
    updateTask(task.id, {
      role,
      project,
      minutes,
      lane,
      status: 'planned',
      day: TOMORROW,
    });
    soundFx.playCoin();
  };

  return (
    <li className="rounded-xl border border-[#E8E5DD] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium leading-snug text-[#1F1E1B]">{task.title}</p>
        <button
          type="button"
          onClick={() => dropTask(task.id)}
          className="hq-focus shrink-0 rounded-md p-1 text-[#A8A59C] transition-colors hover:text-[#D9534F]"
          aria-label="Descartar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="hq-mono w-14 shrink-0 text-[9px] uppercase text-[#8A877E]">Rol</span>
          {ROLES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={clsx(
                'hq-focus rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors',
                role === key
                  ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                  : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
              )}
            >
              {HQ_ROLES[key].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hq-mono w-14 shrink-0 text-[9px] uppercase text-[#8A877E]">Tipo</span>
          {LANES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLane(key)}
              className={clsx(
                'hq-focus rounded-lg border px-2 py-1 text-[10px] transition-colors',
                lane === key
                  ? 'border-[#C49347] bg-[#C49347]/10 font-semibold text-[#8A6524]'
                  : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
              )}
              title={TASK_LANE_META[key].hint}
            >
              {TASK_LANE_META[key].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hq-mono w-14 shrink-0 text-[9px] uppercase text-[#8A877E]">Min</span>
          {TASK_MINUTES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMinutes(value)}
              className={clsx(
                'hq-focus flex-1 rounded-lg border px-1 py-1 text-[10px] font-semibold transition-colors',
                minutes === value
                  ? 'border-[#3B7A87] bg-[#3B7A87] text-white'
                  : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hq-mono w-14 shrink-0 text-[9px] uppercase text-[#8A877E]">Proyecto</span>
          <select
            value={project}
            onChange={(event) => setProject(event.target.value)}
            className="hq-input flex-1 py-1 text-[11px]"
          >
            {TASK_PROJECTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!role}
        className="hq-btn hq-btn-primary mt-2.5 w-full py-1.5 text-[11px] disabled:opacity-40"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Clasificar y enviar a mañana
      </button>
    </li>
  );
}

function TaskRow({ task }: { task: HqTask }) {
  const completeTask = useHqTasksStore((state) => state.completeTask);
  const sendToTomorrow = useHqTasksStore((state) => state.sendToTomorrow);
  const sendToDay = useHqTasksStore((state) => state.sendToDay);
  const parkTask = useHqTasksStore((state) => state.parkTask);
  const dropTask = useHqTasksStore((state) => state.dropTask);

  const age = taskAgeDays(task);
  const laneAccent = TASK_LANE_META[task.lane].accent;
  const isTomorrow = task.day === TOMORROW;
  const isToday = task.day === TODAY;

  return (
    <li className="rounded-xl border border-[#E8E5DD] bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: laneAccent }} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-[#1F1E1B]">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.role && <RoleBadge role={task.role} />}
            <span className="hq-chip text-[9px]">{task.project ?? 'Sin proyecto'}</span>
            <span className="hq-mono inline-flex items-center gap-0.5 text-[9px] text-[#8A877E]">
              <Timer className="h-2.5 w-2.5" />
              {task.minutes}m
            </span>
            {task.carry > 0 && (
              <span
                className={clsx(
                  'hq-mono rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                  task.carry >= 3
                    ? 'bg-[#D9534F]/10 text-[#A33A36]'
                    : 'bg-[#C49347]/15 text-[#8A6524]'
                )}
                title="Veces que se ha arrastrado"
              >
                ×{task.carry}
              </span>
            )}
            {isTomorrow && <span className="hq-mono text-[9px] text-[#5A7D62]">mañana</span>}
            {isToday && <span className="hq-mono text-[9px] text-[#3B7A87]">hoy</span>}
          </div>
          {task.origin && (
            <p className="mt-1 truncate text-[9px] text-[#A8A59C]">{task.origin}</p>
          )}
          {age >= 3 && task.carry >= 3 && (
            <p className="mt-1 text-[10px] leading-relaxed text-[#A33A36]">
              Lleva {task.carry} arrastres. Decídela: partirla, descartarla o escalarla.
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => completeTask(task.id)}
          className="hq-focus inline-flex items-center gap-1 rounded-lg border border-[#5A7D62]/30 bg-[#5A7D62]/10 px-2 py-1 text-[10px] font-semibold text-[#4C6151]"
        >
          <Check className="h-3 w-3" />
          Hecha
        </button>
        {!isToday && (
          <button
            type="button"
            onClick={() => sendToDay(task.id, TODAY)}
            className="hq-focus rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] px-2 py-1 text-[10px] text-[#5E5C56]"
          >
            Traer a hoy
          </button>
        )}
        {!isTomorrow && (
          <button
            type="button"
            onClick={() => sendToTomorrow(task.id)}
            className="hq-focus rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] px-2 py-1 text-[10px] text-[#5E5C56]"
          >
            A mañana
          </button>
        )}
        <button
          type="button"
          onClick={() => parkTask(task.id)}
          className="hq-focus inline-flex items-center gap-1 rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] px-2 py-1 text-[10px] text-[#8A877E]"
        >
          <Moon className="h-3 w-3" />
          Algún día
        </button>
        <button
          type="button"
          onClick={() => dropTask(task.id)}
          className="hq-focus ml-auto rounded-lg p-1 text-[#A8A59C] hover:text-[#D9534F]"
          aria-label="Descartar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function DayClosePanel() {
  const tasks = useHqTasksStore((state) => state.tasks);
  const closures = useHqTasksStore((state) => state.closures);
  const closeDay = useHqTasksStore((state) => state.closeDay);
  const [fresh, setFresh] = React.useState<DayClosure | null>(null);

  const closure = fresh ?? closures.find((item) => item.date === TODAY) ?? null;
  const openToday = tasks.filter(
    (task) =>
      isOpenTask(task) &&
      task.status !== 'inbox' &&
      task.role &&
      task.day &&
      task.day <= TODAY
  ).length;

  const handleClose = () => {
    const result = closeDay(TODAY);
    setFresh(result);
  };

  return (
    <Card className={closure ? 'p-4' : 'border-[#D97043]/30 bg-[#D97043]/5 p-4'}>
      <SectionTitle title="Cierre del día" hint={closure ? 'cerrado' : `${openToday} abiertas`} />
      {closure ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#5A7D62]">
            <CalendarCheck className="h-4 w-4" />
            <span className="text-xs font-semibold">Día consolidado</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg bg-white px-2 py-1.5">
              <div className="hq-mono text-sm font-semibold text-[#1F1E1B]">{closure.done}</div>
              <div className="text-[9px] text-[#8A877E]">hechas</div>
            </div>
            <div className="rounded-lg bg-white px-2 py-1.5">
              <div className="hq-mono text-sm font-semibold text-[#8A6524]">{closure.carried}</div>
              <div className="text-[9px] text-[#8A877E]">a mañana</div>
            </div>
            <div className="rounded-lg bg-white px-2 py-1.5">
              <div className="hq-mono text-sm font-semibold text-[#A33A36]">{closure.decisions}</div>
              <div className="text-[9px] text-[#8A877E]">decisiones</div>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-[#8A877E]">
            Lo que quedó ya está en la cola de mañana con su contador de arrastre.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-[#5E5C56]">
            Consolida el día: lo abierto pasa a mañana y suma un arrastre. La bandeja se queda
            contigo para clasificarla.
          </p>
          <button
            type="button"
            onClick={handleClose}
            disabled={openToday === 0}
            className="hq-btn hq-btn-primary w-full py-1.5 text-[11px] disabled:opacity-40"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            {openToday === 0 ? 'Nada abierto hoy' : `Cerrar el día · ${openToday}`}
          </button>
        </div>
      )}
    </Card>
  );
}

function CapacityPanel() {  const tasks = useHqTasksStore((state) => state.tasks);
  const capacity = roleCapacity(nextWorkday());
  const planned = useMemo(() => {
    const load: Record<RoleKey, number> = { ceo: 0, cto: 0, cmo: 0 };
    for (const task of tasks) {
      if (!isOpenTask(task) || !task.role) continue;
      if (task.day !== TOMORROW) continue;
      load[task.role] += task.minutes;
    }
    return load;
  }, [tasks]);

  return (
    <Card className="p-4">
      <SectionTitle title="Capacidad de mañana" hint={TOMORROW_LABEL} />
      <div className="space-y-3">
        {ROLES.map((role) => {
          const cap = capacity[role];
          const used = planned[role];
          const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 100;
          const over = used > cap;
          return (
            <div key={role}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-[#1F1E1B]">{HQ_ROLES[role].label}</span>
                <span className={clsx('hq-mono tabular-nums', over ? 'text-[#A33A36]' : 'text-[#8A877E]')}>
                  {used}/{cap}m
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EAE7DF]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: over ? '#D9534F' : HQ_ROLES[role].accent,
                    opacity: over ? 1 : 0.75,
                  }}
                />
              </div>
              {over && (
                <p className="mt-1 text-[10px] text-[#A33A36]">
                  No entra: sobran {used - cap}m. Mueve algo a la caja rápida o a otro día.
                </p>
              )}
            </div>
          );
        })}
      </div>
      {capacity.ceo === 0 && (
        <p className="mt-3 rounded-lg border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-2.5 py-2 text-[10px] text-[#8A877E]">
          Mañana es día de descanso. Lo pendiente pasa al siguiente día hábil.
        </p>
      )}
    </Card>
  );
}

function LaneSection({ lane, tasks }: { lane: TaskLane; tasks: HqTask[] }) {
  const meta = TASK_LANE_META[lane];
  const Icon = lane === 'decision' ? Sparkles : lane === 'vision' ? Eye : CornerDownRight;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
            style={{ color: meta.accent, borderColor: 'var(--hq-border)' }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-[#1F1E1B]">{meta.label}</h3>
            <p className="text-[10px] text-[#8A877E]">{meta.hint}</p>
          </div>
        </div>
        <span className="hq-mono text-[10px] text-[#8A877E]">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#D5D1C5] bg-[#FAF9F5] px-2.5 py-3 text-[11px] text-[#8A877E]">
          Sin pendientes en este carril.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function RelayTape() {
  const relays = useHqTasksStore((state) => state.relays);
  const todayRelays = relays.filter((relay) => relay.date === TODAY).slice(0, 6);

  if (todayRelays.length === 0) return null;

  return (
    <Card className="p-4">
      <SectionTitle title="Relevos de hoy" hint={`${todayRelays.length} bloques`} />
      <ol className="space-y-2">
        {todayRelays.map((relay) => (
          <li key={relay.id} className="rounded-xl border border-[#E8E5DD] bg-white p-2.5">
            <div className="flex items-center justify-between gap-2">
              <RoleBadge role={relay.role} />
              <span className="hq-mono text-[9px] text-[#8A877E]">{relay.blockLabel}</span>
            </div>
            {relay.wins && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#1F1E1B]">✓ {relay.wins}</p>
            )}
            {relay.visionLine && (
              <p className="mt-1 text-[10px] leading-relaxed text-[#3B7A87]">◎ {relay.visionLine}</p>
            )}
            {relay.decisionNote && relay.decisionRole && (
              <p className="mt-1 text-[10px] leading-relaxed text-[#8A6524]">
                ⇢ {HQ_ROLES[relay.decisionRole].label}: {relay.decisionNote}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function PendientesPage() {
  const tasks = useHqTasksStore((state) => state.tasks);

  const inbox = useMemo(
    () => tasks.filter((task) => isOpenTask(task) && (!task.role || task.status === 'inbox')),
    [tasks]
  );

  const lanes = useMemo(
    () =>
      LANES.map((lane) => ({
        lane,
        tasks: tasks.filter(
          (task) =>
            isOpenTask(task) &&
            task.role &&
            task.status !== 'inbox' &&
            task.lane === lane &&
            (task.day === null || task.day <= TOMORROW)
        ),
      })),
    [tasks]
  );

  const decisions = lanes.find((entry) => entry.lane === 'decision')?.tasks.length ?? 0;
  const carried = lanes.find((entry) => entry.lane === 'arrastre')?.tasks.length ?? 0;
  const vision = lanes.find((entry) => entry.lane === 'vision')?.tasks.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Relevos"
        title="Cola de mañana"
        description="Lo que quedó a medias y lo que debe existir. Nada entra a la jornada sin rol, proyecto y minutos."
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="Bandeja" value={`${inbox.length}`} icon={Inbox} accent="var(--hq-ink-2)" hint="sin rol" />
        <Stat label="Decisiones" value={`${decisions}`} icon={Sparkles} accent="var(--hq-ceo)" hint="desbloquean" />
        <Stat label="Arrastre" value={`${carried}`} icon={CornerDownRight} accent="var(--hq-gold)" hint="por cerrar" />
        <Stat label="Visión" value={`${vision}`} icon={Eye} accent="var(--hq-cto)" hint="deben existir" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <QuickCapture />

          {inbox.length > 0 && (
            <Card className="p-4">
              <SectionTitle title="Bandeja" hint="clasifica para mañana" />
              <ul className="space-y-2">
                {inbox.map((task) => (
                  <InboxRow key={task.id} task={task} />
                ))}
              </ul>
            </Card>
          )}

          {LANES.map((lane) => {
            const entry = lanes.find((item) => item.lane === lane);
            return <LaneSection key={lane} lane={lane} tasks={entry?.tasks ?? []} />;
          })}
        </div>

        <div className="space-y-4">
          <DayClosePanel />
          <CapacityPanel />
          <RelayTape />
        </div>
      </div>
    </div>
  );
}
