'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X, AlertTriangle, Lock } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { HabitVisualData } from './RunicHabitCard';

interface EditHabitModalProps {
  habit: HabitVisualData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, updatedData: {
    title: string;
    subtitle: string;
    front_type: string;
    gold_reward: number;
    game_battery_reward: number;
  }) => Promise<void>;
}

export function EditHabitModal({ habit, isOpen, onClose, onSave }: EditHabitModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [frontType, setFrontType] = useState('oficio');
  const [gold, setGold] = useState(150);
  const [battery, setBattery] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setSubtitle(habit.subtitle || '');
      setFrontType(habit.front_type || 'oficio');
      setGold(habit.gold_reward || 150);
      setBattery(habit.game_battery_reward || 15);
    }
  }, [habit]);

  if (!isOpen || !habit) return null;

  const currentEdits = habit.edit_count || 0;
  const remainingEdits = Math.max(0, 2 - currentEdits);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(habit.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        front_type: frontType,
        gold_reward: gold,
        game_battery_reward: battery,
      });
      soundFx.playLevelUp();
      onClose();
    } catch {
      // Manejado arriba
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/65 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="rounded-2xl bg-white max-w-sm w-full p-5 space-y-4 border border-[#E4E1D8] shadow-[0_16px_40px_rgba(26,25,21,0.16)] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2D68C4]/10 border border-[#2D68C4]/20 flex items-center justify-center text-[#2D68C4]">
              <Edit3 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-editorial text-sm font-bold text-[#1C1B18]">
                Ajustar Hábito
              </h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#706E66]">
                {remainingEdits} de 2 modificaciones disponibles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#706E66] hover:text-[#1C1B18] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Advertencia de Límite Estricto */}
        <div className="rounded-xl bg-[#FAF4E8] border border-[#C59B46]/30 p-2.5 flex items-start gap-2 text-[11px] text-[#9A7025] leading-snug">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C59B46]" />
          <span>
            Para preservar la disciplina inquebrantable, solo se permite editar cada hábito <strong>máximo 2 veces</strong>.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono font-bold text-[#706E66] block uppercase tracking-wider mb-1">
              Nombre de la Misión:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl p-2.5 text-xs text-[#1C1B18] font-medium focus:outline-none focus:border-[#2D68C4] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-[#706E66] block uppercase tracking-wider mb-1">
              Descripción / Objetivo:
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl p-2.5 text-xs text-[#1C1B18] focus:outline-none focus:border-[#2D68C4] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-[#706E66] block uppercase tracking-wider mb-1">
              Pilar de Vida:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'oficio', label: 'Oficio (Negocio)', color: 'text-[#2D68C4]' },
                { id: 'vigor', label: 'Vigor (Físico)', color: 'text-[#D9383A]' },
                { id: 'maestria', label: 'Maestría (Estudio)', color: 'text-[#9A7025]' },
                { id: 'claridad', label: 'Claridad (Mente/Casa)', color: 'text-[#2E8555]' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFrontType(p.id)}
                  className={`py-2 px-2 rounded-xl text-left border text-[11px] font-bold cursor-pointer transition-all ${
                    frontType === p.id
                      ? 'bg-white border-[#1C1B18] shadow-[0_2px_0px_#1C1B18]'
                      : 'bg-[#FAF9F5] border-[#E8E5DD] text-[#706E66]'
                  }`}
                >
                  <span className={p.color}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-mono font-bold text-[#706E66] block uppercase tracking-wider mb-1">
                Pokédólares (₽):
              </label>
              <input
                type="number"
                min={50}
                max={500}
                value={gold}
                onChange={(e) => setGold(Number(e.target.value))}
                className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl p-2 text-xs font-mono font-bold text-[#9A7025] focus:outline-none focus:border-[#2D68C4]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-[#706E66] block uppercase tracking-wider mb-1">
                Batería GBA (min):
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl p-2 text-xs font-mono font-bold text-[#2D68C4] focus:outline-none focus:border-[#2D68C4]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E4E1D8] text-xs font-mono font-semibold text-[#706E66] hover:bg-[#FAF9F5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#2D68C4] hover:bg-[#255BB0] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_2px_0px_#1F4E99] active:translate-y-[1px] disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : `Confirmar Edición (${remainingEdits}/2)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
