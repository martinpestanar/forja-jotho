'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Plus, Timer } from 'lucide-react';
import clsx from 'clsx';
import { RoleBadge } from '@/components/hq/ui/primitives';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { TASK_PROJECTS, taskDayKey, type HqTask } from '@/lib/hqTasks';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { soundFx } from '@/lib/soundFx';

export function RoleTaskList({ role }: { role: RoleKey }) {
  const tasks = useHqTasksStore((state) => state.tasks);
  const addTask = useHqTasksStore((state) => state.addTask);
  const completeTask = useHqTasksStore((state) => state.completeTask);

  const [title, setTitle] = useState('');
  const [project, setProject] = useState<string>('Nilah AI');
  const [minutes, setMinutes] = useState(30);

  const today = taskDayKey();
  const list = useMemo(() => {
    const priority = (task: HqTask) => {
      if (task.day === today) return 0;
      if (!task.day) return 1;
      return 2;
    };
    return tasks
      .filter(
        (task) =>
          task.role === role && task.status !== 'done' && task.status !== 'dropped'
      )
      .sort((a, b) => priority(a) - priority(b) || b.carry - a.carry)
      .slice(0, 8);
  }, [tasks, role, today]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addTask({
      title,
      role,
      project,
      minutes,
      lane: 'arrastre',
      day: today,
    });
    soundFx.playCoin();
    setTitle('');
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="hq-label">Tareas del turno</span>
        <Link href="/hq/pendientes" className="hq-focus text-[10px] font-medium text-[#3B7A87] hover:underline">
          Ver cola
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-3 text-[11px] leading-relaxed text-[#8A877E]">
          Sin tareas para {HQ_ROLES[role].label}. Crea una aquí o ciérralas desde el Check-Out.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((task) => (
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
                <p className="text-[11px] font-medium leading-snug text-[#1F1E1B]">{task.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-[#8A877E]">
                  <span>{task.project ?? 'Sin proyecto'}</span>
                  <span className="hq-mono inline-flex items-center gap-0.5">
                    <Timer className="h-2.5 w-2.5" />
                    {task.minutes}m
                  </span>
                  {task.day === today && <span className="text-[#3B7A87]">hoy</span>}
                  {task.lane === 'vision' && <span className="text-[#3B7A87]">visión</span>}
                  {task.lane === 'decision' && <span className="text-[#8A6524]">decisión</span>}
                  {task.carry > 0 && <span className="text-[#8A6524]">×{task.carry}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-2 space-y-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-2">
        <div className="flex items-center gap-1.5">
          <RoleBadge role={role} />
          <span className="hq-mono text-[9px] text-[#8A877E]">nueva tarea</span>
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`Algo concreto para ${HQ_ROLES[role].label}…`}
          className="hq-input py-1.5 text-[11px]"
          maxLength={120}
        />
        <div className="flex items-center gap-1.5">
          <select
            value={project}
            onChange={(event) => setProject(event.target.value)}
            className="hq-input min-w-0 flex-1 py-1 text-[10px]"
          >
            {TASK_PROJECTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {[15, 30, 45, 60].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMinutes(value)}
              className={clsx(
                'hq-focus rounded-md border px-1.5 py-1 text-[10px] font-semibold',
                minutes === value
                  ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                  : 'border-[#E8E5DD] bg-white text-[#5E5C56]'
              )}
            >
              {value}
            </button>
          ))}
          <button
            type="submit"
            disabled={!title.trim()}
            className="hq-focus shrink-0 rounded-md border border-[#1F1E1B] bg-[#1F1E1B] p-1.5 text-white disabled:opacity-40"
            aria-label="Añadir tarea"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      <Link
        href="/hq/pendientes"
        className="hq-focus mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#3B7A87] hover:underline"
      >
        Clasificar pendientes
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
