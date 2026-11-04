'use client';

import React from 'react';
import { 
  Check, 
  ChevronRight, 
  Waves, 
  Dumbbell, 
  Video, 
  Brain, 
  Code2, 
  Battery, 
  Coins 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '@/lib/soundFx';

export interface HabitVisualData {
  id: string;
  title: string;
  subtitle: string;
  front_type: 'vigor' | 'templanza' | 'expansion';
  duration_minutes?: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  is_custom?: boolean;
  completed?: boolean;
}

interface RunicHabitCardProps {
  habit: HabitVisualData;
  onSeal: (habit: HabitVisualData, e: React.MouseEvent) => void;
}

// Clasificación temática Johto Heritage (Minimalista Editorial)
function getHabitTheme(h: HabitVisualData) {
  const text = (h.title + ' ' + (h.subtitle || '')).toLowerCase();

  // 1. Físico / Entrenamiento (Rojo Ho-Oh Editorial)
  if (text.match(/(pesas|gym|gimnasio|correr|calistenia|cuerda|crossfit|boxeo|cardio|entrenar|ejercicio|flexiones|burpees|frente físico|físico)/)) {
    return {
      type: 'physical',
      icon: Dumbbell,
      badgeText: 'FÍSICO',
      badgeColor: 'text-[#D9383A] bg-[#D9383A]/8 border-[#D9383A]/20',
      iconBg: 'bg-[#D9383A]/8 text-[#D9383A] border-[#D9383A]/20',
      accentColor: '#D9383A',
    };
  }

  // 2. Negocio / Trabajo / Ventas (Oro Campana Clara)
  if (text.match(/(tiktok|video|grabar|editar|guion|leads|prospectar|saas|ventas|publicar|cliente|negocio|trabajo)/)) {
    return {
      type: 'business',
      icon: Video,
      badgeText: 'NEGOCIO',
      badgeColor: 'text-[#9A7025] bg-[#C59B46]/10 border-[#C59B46]/25',
      iconBg: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
      accentColor: '#C59B46',
    };
  }

  // 3. Mental / Lectura / Paz (Azul Zafiro Lugia)
  if (text.match(/(medit|leer|lectura|estudi|libro|enfoque|filosofia|santuario|mente)/)) {
    return {
      type: 'mind',
      icon: Brain,
      badgeText: 'MENTE',
      badgeColor: 'text-[#2D68C4] bg-[#2D68C4]/8 border-[#2D68C4]/20',
      iconBg: 'bg-[#2D68C4]/8 text-[#2D68C4] border-[#2D68C4]/20',
      accentColor: '#2D68C4',
    };
  }

  // 4. Idiomas / Skills / Expansión (Verde Pueblo Primavera)
  if (text.match(/(duolingo|ingles|idioma|codigo|programar|antigravity|skill|curso|expansion|expansión)/)) {
    return {
      type: 'expansion',
      icon: Code2,
      badgeText: 'EXPANSIÓN',
      badgeColor: 'text-[#2E8555] bg-[#2E8555]/10 border-[#2E8555]/25',
      iconBg: 'bg-[#2E8555]/10 text-[#2E8555] border-[#2E8555]/25',
      accentColor: '#2E8555',
    };
  }

  // 5. Default Vigor (Rojo Ho-Oh Editorial)
  return {
    type: 'default',
    icon: Waves,
    badgeText: 'DISCIPLINA',
    badgeColor: 'text-[#D9383A] bg-[#D9383A]/8 border-[#D9383A]/20',
    iconBg: 'bg-[#D9383A]/8 text-[#D9383A] border-[#D9383A]/20',
    accentColor: '#D9383A',
  };
}

export function RunicHabitCard({ habit, onSeal }: RunicHabitCardProps) {
  const theme = getHabitTheme(habit);
  const MainIcon = theme.icon;

  const triggerCompletion = (e?: React.MouseEvent) => {
    if (habit.completed) return;
    
    // 1. Audio analógico sutil
    soundFx.playLevelUp();

    // 2. Micro-vibración háptica
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 20]);
    }

    // 3. Confetti editorial sobrio
    confetti({
      particleCount: 28,
      spread: 55,
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
                className={`text-[9px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeColor}`}
              >
                {theme.badgeText}
              </span>

              {habit.is_custom && (
                <span className="text-[9px] font-mono font-medium tracking-wider px-1.5 py-0.5 bg-[#FAF9F5] border border-[#E4E1D8] rounded-md text-[#706E66]">
                  ORÁCULO
                </span>
              )}

              {habit.requires_proof && !habit.completed && (
                <span className="text-[9px] font-mono font-medium tracking-wider px-1.5 py-0.5 bg-[#2D68C4]/8 border border-[#2D68C4]/20 rounded-md text-[#2D68C4]">
                  COMPROBANTE
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

            {/* Píldoras de Recompensa Refinadas */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {/* Monedas 💰 */}
              <div className="text-xs font-mono font-medium px-2 py-0.5 rounded-lg bg-[#C59B46]/10 text-[#9A7025] border border-[#C59B46]/25 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#C59B46]" />
                <span className="tabular-nums">+{habit.gold_reward} 💰</span>
              </div>

              {/* Batería 🔋 */}
              {habit.game_battery_reward > 0 && (
                <div className="text-xs font-mono font-medium px-2 py-0.5 rounded-lg bg-[#2D68C4]/8 text-[#2D68C4] border border-[#2D68C4]/20 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span className="tabular-nums">+{habit.game_battery_reward}m 🔋</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Botón de Sellado Táctil de Precisión (48x48px ergonómico) */}
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
              className="w-12 h-12 rounded-xl bg-[#2D68C4] text-white border border-[#2D68C4] shadow-[0_2px_6px_rgba(45,104,196,0.25)] hover:bg-[#255BB0] active:scale-[0.96] flex flex-col items-center justify-center cursor-pointer transition-all select-none"
              title="Subir comprobante"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[7px] font-mono font-bold uppercase tracking-wider">PRUEBA</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              aria-label="Sellar hábito de inmediato"
              className="w-12 h-12 rounded-xl bg-[#D9383A] text-white border border-[#D9383A] shadow-[0_2px_6px_rgba(217,56,58,0.25)] hover:bg-[#C92F31] active:scale-[0.96] flex flex-col items-center justify-center cursor-pointer transition-all select-none"
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
