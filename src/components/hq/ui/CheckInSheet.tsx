'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { Check, LogOut } from 'lucide-react';
import { Sheet } from './Sheet';
import { HQ_ROLE_LIST, type RoleKey } from '@/lib/hqRoles';
import { soundFx } from '@/lib/soundFx';

export interface CheckInPayload {
  role: RoleKey;
  energy: number;
  focus: string;
  handoff: string;
}

function CheckInForm({
  defaultRole,
  mode,
  onConfirm,
  onClose,
}: {
  defaultRole: RoleKey;
  mode: 'in' | 'out';
  onConfirm?: (payload: CheckInPayload) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState<RoleKey>(defaultRole);
  const [energy, setEnergy] = useState(4);
  const [focus, setFocus] = useState('');
  const [handoff, setHandoff] = useState('');

  const submit = () => {
    soundFx.playLevelUp();
    onConfirm?.({ role, energy, focus: focus.trim(), handoff: handoff.trim() });
    onClose();
  };

  const isOut = mode === 'out';

  return (
    <div className="space-y-4">
      <div>
        <span className="hq-label mb-1.5 block">Rol</span>
        <div className="grid grid-cols-3 gap-2">
          {HQ_ROLE_LIST.map((item) => {
            const active = role === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setRole(item.key);
                }}
                className={clsx(
                  'rounded-xl border px-2 py-2.5 text-center transition-all',
                  active ? 'text-white shadow-sm' : 'bg-white text-[#5E5C56] hover:border-[#D5D1C5]'
                )}
                style={
                  active
                    ? { backgroundColor: item.accent, borderColor: item.accent }
                    : { borderColor: 'var(--hq-border)' }
                }
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className="mt-0.5 block truncate text-[10px] opacity-80">
                  {item.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="hq-label mb-1.5 block">Energía</span>
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
                  ? 'border-[#D97043] bg-[#D97043]/10 text-[#D97043]'
                  : 'border-[#E8E5DD] bg-white text-[#8A877E]'
              )}
              aria-label={`Energía ${level} de 5`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="hq-label mb-1.5 block" htmlFor="hq-focus">
          {isOut ? 'Victorias del bloque' : 'Foco único del bloque'}
        </label>
        <input
          id="hq-focus"
          className="hq-input"
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          placeholder={isOut ? 'Ej. Onboarding de clienta + 1 fix de billing' : 'Ej. Cerrar onboarding de Nilah'}
        />
      </div>

      <div>
        <label className="hq-label mb-1.5 block" htmlFor="hq-handoff">
          Handoff para el siguiente rol
        </label>
        <textarea
          id="hq-handoff"
          className="hq-input min-h-[84px] resize-y"
          value={handoff}
          onChange={(event) => setHandoff(event.target.value)}
          placeholder="Qué queda pendiente, qué se decidió y qué no debe romperse."
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#E8E5DD] pt-3">
        <button type="button" className="hq-btn hq-btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="hq-btn hq-btn-primary" onClick={submit}>
          {isOut ? <LogOut className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {isOut ? 'Cerrar turno' : 'Iniciar turno'}
        </button>
      </div>
    </div>
  );
}

export function CheckInSheet({
  open,
  onClose,
  defaultRole = 'ceo',
  mode = 'in',
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  defaultRole?: RoleKey;
  mode?: 'in' | 'out';
  onConfirm?: (payload: CheckInPayload) => void;
}) {
  const isOut = mode === 'out';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isOut ? 'Check-Out del turno' : 'Check-In del turno'}
      description={
        isOut
          ? 'Cierra el bloque, registra victorias y deja el mando listo para el siguiente rol.'
          : 'Entra a un solo puesto. Sin multitasking: este bloque pertenece a un rol.'
      }
    >
      {open && (
        <CheckInForm defaultRole={defaultRole} mode={mode} onConfirm={onConfirm} onClose={onClose} />
      )}
    </Sheet>
  );
}
