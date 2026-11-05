'use client';

import React, { useState } from 'react';
import { 
  Check, 
  ChevronRight, 
  Waves, 
  Dumbbell, 
  Briefcase, 
  GraduationCap, 
  Brain, 
  Battery, 
  Coins,
  Edit2,
  Trash2,
  Lock,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '@/lib/soundFx';

export interface HabitVisualData {
  id: string;
  title: string;
  subtitle: string;
  front_type: 'vigor' | 'templanza' | 'expansion' | 'oficio' | 'maestria' | 'claridad';
  duration_minutes?: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  is_custom?: boolean;
  completed?: boolean;
  edit_count?: number;
}

interface RunicHabitCardProps {
  habit: HabitVisualData;
  onSeal: (habit: HabitVisualData, e: React.MouseEvent) => void;
  onEdit?: (habit: HabitVisualData) => void;
  onDelete?: (habit: HabitVisualData) => void;
}

// Clasificación de los 4 Pilares del Alto Rendimiento Johto Heritage
function getHabitTheme(h: HabitVisualData) {
  const text = (h.title + ' ' + (h.subtitle || '')).toLowerCase();

  // 1. Vigor & Físico (Rojo Ho-Oh Editorial)
  if (text.match(/(pesas|gym|gimnasio|correr|calistenia|cuerda|crossfit|boxeo|cardio|entrenar|ejercicio|flexiones|burpees|físico|agua|dormir|nutricion)/) || h.front_type === 'vigor') {
    return {
      type: 'vigor',
      icon: Dumbbell,
      badgeText: 'VIGOR',
      badgeColor: 'text-[#D9383A] bg-[#D9383A]/8 border-[#D9383A]/20',
      iconBg: 'bg-[#D9383A]/8 text-[#D9383A] border-[#D9383A]/20',
      accentColor: '#D9383A',
    };
  }

  // 2. Oficio & Negocio (Azul Zafiro Lugia)
  if (text.match(/(trabajo|agencia|oficio|negocio|prospectar|cliente|ventas|codigo|programar|tiktok|video|grabar|editar|leads|monetizacion|ingresos)/) || h.front_type === 'oficio' || h.front_type === 'expansion') {
    return {
      type: 'oficio',
      icon: Briefcase,
      badgeText: 'OFICIO',
      badgeColor: 'text-[#2D68C4] bg-[#2D68C4]/8 border-[#2D68C4]/20',
      iconBg: 'bg-[#2D68C4]/8 text-[#2D68C4] border-[#2D68C4]/20',
      accentColor: '#2D68C4',
    };
  }

  // 3. Maestría & Estudio (Oro Campana Clara)
  if (text.match(/(leer|lectura|estudi|libro|curso|modulo|capacitacion|ingles|idioma|aprendizaje|linkedin|profesion)/) || h.front_type === 'maestria') {
    return {
      type: 'maestria',
      icon: GraduationCap,
      badgeText: 'MAESTRÍA',
      badgeColor: 'text-[#9A7025] bg-[#C59B46]/10 border-[#C59B46]/25',
      iconBg: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
      accentColor: '#C59B46',
    };
  }

  // 4. Claridad & Salud Mental (Verde Pueblo Primavera)
  if (text.match(/(medit|paz|journaling|planificar|orden|mente|respiracion|reflexion|limpieza|hogar|barrer)/) || h.front_type === 'claridad') {
    return {
      type: 'claridad',
      icon: Brain,
      badgeText: 'CLARIDAD',
      badgeColor: 'text-[#2E8555] bg-[#2E8555]/10 border-[#2E8555]/25',
      iconBg: 'bg-[#2E8555]/10 text-[#2E8555] border-[#2E8555]/25',
      accentColor: '#2E8555',
    };
  }

  // Fallback Vigor
  return {
    type: 'default',
    icon: Waves,
    badgeText: 'DISCIPLINA',
    badgeColor: 'text-[#D9383A] bg-[#D9383A]/8 border-[#D9383A]/20',
    iconBg: 'bg-[#D9383A]/8 text-[#D9383A] border-[#D9383A]/20',
    accentColor: '#D9383A',
  };
}

export function RunicHabitCard({ habit, onSeal, onEdit, onDelete }: RunicHabitCardProps) {
  const theme = getHabitTheme(habit);
  const MainIcon = theme.icon;

  const currentEdits = habit.edit_count || 0;
  const remainingEdits = Math.max(0, 2 - currentEdits);
  const canEdit = remainingEdits > 0 && !habit.completed;

  const triggerCompletion = (e?: React.MouseEvent) => {
    if (habit.completed) return;
    
    soundFx.playLevelUp();

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 20]);
    }

    confetti({
      particleCount: 26,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#C59B46', '#D9383A', '#2E8555', '#2D68C4', '#FAF9F5'],
    });

    onSeal(habit, e as any);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (habit.completed) return;
    if (habit.requires_proof) {
      soundFx.playClick();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
      onSeal(habit, e);
    } else {
      triggerCompletion(e);
    }
  };

  return (
    <div
      onClick={handleActionClick}
      className={`group relative overflow-hidden rounded-2xl border border-[#E4E1D8] transition-all select-none p-3.5 sm:p-4 cursor-pointer active:scale-[0.99] ${
        habit.completed
          ? 'bg-[#FAF9F5]/70 opacity-75 shadow-none'
          : 'bg-[#FFFFFF] shadow-[0_2px_8px_rgba(26,25,21,0.04)] hover:border-[#D5D1C5] hover:shadow-[0_4px_12px_rgba(26,25,21,0.06)]'
      }`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Icono + Título + Recompensas */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Contenedor del Icono estilo Hardware Analogue */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
              habit.completed
                ? 'bg-[#2E8555]/10 text-[#2E8555] border-[#2E8555]/20'
                : `${theme.iconBg} shadow-[0_1px_2px_rgba(26,25,21,0.03)]`
            }`}
          >
            {habit.completed ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <MainIcon className="w-5 h-5 stroke-[2]" />
            )}
          </div>

          {/* Textos y Badges */}
          <div className="space-y-1 flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeColor}`}
              >
                {theme.badgeText}
              </span>

              {/* Indicador de Ediciones Restantes (Máximo 2) */}
              {remainingEdits > 0 ? (
                <span className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 bg-[#FAF9F5] border border-[#E4E1D8] rounded-md text-[#706E66]">
                  {remainingEdits} {remainingEdits === 1 ? 'edición restante' : 'ediciones restantes'}
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 bg-[#F7F5F0] border border-[#DCD8CD] rounded-md text-[#8C887E] flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  INMUTABLE
                </span>
              )}
            </div>

            <h3
              className={`text-sm font-semibold tracking-tight truncate leading-snug ${
                habit.completed ? 'text-[#706E66] line-through' : 'text-[#1C1B18]'
              }`}
            >
              {habit.title}
            </h3>

            {habit.subtitle && (
              <p className="text-xs font-mono text-[#706E66] leading-tight line-clamp-1">
                {habit.subtitle}
              </p>
            )}

            {/* Píldoras de Recompensa + Botones CRUD */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                {/* Monedas 💰 */}
                <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#C59B46]/10 text-[#9A7025] border border-[#C59B46]/25 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#C59B46]" />
                  <span className="tabular-nums">+{habit.gold_reward} ₽</span>
                </div>

                {/* Batería 🔋 */}
                {habit.game_battery_reward > 0 && (
                  <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#2D68C4]/8 text-[#2D68C4] border border-[#2D68C4]/20 flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span className="tabular-nums">+{habit.game_battery_reward}m GBA</span>
                  </div>
                )}
              </div>

              {/* Acciones CRUD Discretas */}
              <div className="flex items-center gap-1">
                {canEdit && onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playClick();
                      onEdit(habit);
                    }}
                    className="p-1 rounded-md text-[#706E66] hover:text-[#1C1B18] hover:bg-[#FAF9F5] transition-colors"
                    title={`Editar hábito (${remainingEdits} de 2 disponibles)`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDelete && !habit.completed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playWarning();
                      onDelete(habit);
                    }}
                    className="p-1 rounded-md text-[#706E66] hover:text-[#D9383A] hover:bg-rose-50 transition-colors"
                    title="Eliminar hábito"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Botón de Sellado Táctil de Precisión (48x48px) */}
        <div className="shrink-0 flex items-center">
          {habit.completed ? (
            <div className="w-12 h-12 rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/25 flex flex-col items-center justify-center text-[#2E8555] select-none">
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider mt-0.5">LISTO</span>
            </div>
          ) : habit.requires_proof ? (
            <button
              type="button"
              onClick={handleActionClick}
              aria-label="Subir comprobante para sellar hábito"
              className="w-12 h-12 rounded-xl bg-[#2D68C4] text-white border border-[#1F4E99] shadow-[0_2px_0px_#1A407E] hover:bg-[#255BB0] active:translate-y-[1px] active:shadow-none flex flex-col items-center justify-center cursor-pointer transition-all select-none"
              title="Subir comprobante"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">PRUEBA</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              aria-label="Sellar hábito a 1-tap"
              className="w-12 h-12 rounded-xl bg-[#D9383A] text-white border border-[#B22B2D] shadow-[0_2px_0px_#A02426] hover:bg-[#C92F31] active:translate-y-[1px] active:shadow-none flex flex-col items-center justify-center cursor-pointer transition-all select-none"
              title="Sellar hábito a 1-tap"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider mt-0.5">
                SELLAR
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
