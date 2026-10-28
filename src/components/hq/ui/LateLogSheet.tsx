'use client';

import React, { useState } from 'react';
import { CornerDownRight, Eye, PartyPopper, Timer } from 'lucide-react';
import { Sheet } from '@/components/hq/ui/Sheet';
import { RoleBadge } from '@/components/hq/ui/primitives';
import { useHqStore, type SessionRecord } from '@/store/useHqStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { DEFAULT_SCHEDULE, timeToMinutes } from '@/lib/hqSchedule';
import { nextWorkdayKey, visionTemplates } from '@/lib/hqTasks';

export interface LateLogTarget {
  id: string;
  label: string;
  role: RoleKey;
  start: string;
  end: string;
}

const MINUTE_OPTIONS = [15, 30, 45, 60];

function LateLogForm({
  target,
  onClose,
  onSaved,
}: {
  target: LateLogTarget;
  onClose: () => void;
  onSaved?: (result: { session: SessionRecord; bonus: number; taskMinutes: number }) => void;
}) {
  const logLateSession = useHqStore((state) => state.logLateSession);
  const addTask = useHqTasksStore((state) => state.addTask);
  const blockMinutes = Math.max(15, timeToMinutes(target.end) - timeToMinutes(target.start));
  const [minutes, setMinutes] = useState(blockMinutes >= 60 ? 60 : blockMinutes);
  const [wins, setWins] = useState('');
  const [pending, setPending] = useState('');
  const [vision, setVision] = useState('');

  const blockProject = DEFAULT_SCHEDULE.find((block) => block.id === target.id)?.project ?? null;

  const handleSave = () => {
    const result = logLateSession({
      role: target.role,
      blockId: target.id,
      blockLabel: target.label,
      minutes,
      focus: '',
      wins: wins.trim(),
      handoff: '',
      energy: 4,
    });

    if (pending.trim()) {
      addTask({
        title: pending.trim(),
        role: target.role,
        project: blockProject,
        minutes: 30,
        lane: 'arrastre',
        day: nextWorkdayKey(),
        origin: `Quedó del bloque ${target.label}`,
      });
    }

    if (vision.trim()) {
      addTask({
        title: vision.trim(),
        role: target.role,
        project: blockProject,
        minutes: 30,
        lane: 'vision',
        day: nextWorkdayKey(),
        origin: `Visión de ${HQ_ROLES[target.role].label} · ${target.label}`,
      });
    }

    if (result) onSaved?.(result);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E8E5DD] bg-white p-3">
        <div className="flex items-center gap-2">
          <RoleBadge role={target.role} />
          <span className="hq-mono text-[10px] text-[#8A877E]">
            {target.start}–{target.end}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-medium text-[#1F1E1B]">{target.label}</p>
      </div>

      <div>
        <span className="hq-label">¿Cuánto tiempo le diste?</span>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {MINUTE_OPTIONS.map((value) => {
            const active = minutes === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMinutes(value)}
                className={`hq-focus flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#1F1E1B] bg-[#1F1E1B] text-white'
                    : 'border-[#E8E5DD] bg-white text-[#5E5C56] hover:bg-[#F2EFE9]'
                }`}
              >
                <Timer className="h-3 w-3" />
                {value}m
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="late-wins" className="hq-label">
          ¿Qué lograste?
        </label>
        <textarea
          id="late-wins"
          value={wins}
          onChange={(event) => setWins(event.target.value)}
          rows={3}
          placeholder={`Una victoria concreta del rol ${HQ_ROLES[target.role].label}…`}
          className="mt-2 w-full resize-none rounded-xl border border-[#E8E5DD] bg-white px-3 py-2 text-sm text-[#1F1E1B] placeholder:text-[#A8A59C] focus:border-[#3B7A87] focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8A877E]">
          Si ya tenías el check-out de este rol, guardar aquí no lo duplica: solo deja el registro.
        </p>
      </div>

      <div>
        <label htmlFor="late-pending" className="hq-label">
          <span className="inline-flex items-center gap-1.5">
            <CornerDownRight className="h-3 w-3" />
            ¿Qué quedó a medias?
          </span>
        </label>
        <input
          id="late-pending"
          value={pending}
          onChange={(event) => setPending(event.target.value)}
          placeholder="Opcional. Se convierte en arrastre para mañana."
          className="mt-2 w-full rounded-xl border border-[#E8E5DD] bg-white px-3 py-2 text-sm text-[#1F1E1B] placeholder:text-[#A8A59C] focus:border-[#3B7A87] focus:outline-none"
          maxLength={120}
        />
      </div>

      <div>
        <label htmlFor="late-vision" className="hq-label">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            ¿Qué debe existir mañana por visión?
          </span>
        </label>
        <input
          id="late-vision"
          value={vision}
          onChange={(event) => setVision(event.target.value)}
          placeholder="Una línea. Se convierte en tarea de visión."
          className="mt-2 w-full rounded-xl border border-[#E8E5DD] bg-white px-3 py-2 text-sm text-[#1F1E1B] placeholder:text-[#A8A59C] focus:border-[#3B7A87] focus:outline-none"
          maxLength={140}
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {visionTemplates(target.role).map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => setVision(template)}
              className="hq-focus rounded-full border border-[#E8E5DD] bg-white px-2 py-0.5 text-[10px] text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="hq-btn hq-btn-ghost flex-1">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} className="hq-btn hq-btn-primary flex-1">
          <PartyPopper className="h-4 w-4" />
          Guardar registro
        </button>
      </div>
    </div>
  );
}

export function LateLogSheet({
  target,
  onClose,
  onSaved,
}: {
  target: LateLogTarget | null;
  onClose: () => void;
  onSaved?: (result: { session: SessionRecord; bonus: number; taskMinutes: number }) => void;
}) {
  return (
    <Sheet
      open={Boolean(target)}
      onClose={onClose}
      title="Registrar bloque pasado"
      description="Cierra el bloque con honestidad. Cuenta para tu check-out y tu banco de tiempo."
    >
      {target && (
        <LateLogForm key={target.id} target={target} onClose={onClose} onSaved={onSaved} />
      )}
    </Sheet>
  );
}
