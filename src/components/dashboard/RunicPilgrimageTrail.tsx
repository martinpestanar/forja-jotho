'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Crown, 
  Gift, 
  Check, 
  Lock, 
  Calendar 
} from 'lucide-react';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { soundFx } from '@/lib/soundFx';

interface RunicPilgrimageTrailProps {
  currentStreak: number;
  journeyStartDate?: string;
  confirmedToday: boolean;
  submitting: boolean;
  onConfirmVictory: () => void;
  onOpenDatePicker?: () => void;
}

export function RunicPilgrimageTrail({
  currentStreak,
  journeyStartDate,
  confirmedToday,
  submitting,
  onConfirmVictory,
  onOpenDatePicker,
}: RunicPilgrimageTrailProps) {
  const totalDays = 30;
  const progressPercent = Math.min(100, Math.round((currentStreak / totalDays) * 100));

  // Hitos clave de recompensa oficial en Pokémon Heart & Soul
  const milestoneRewards: Record<number, { title: string; reward: string; icon: any; isMajor?: boolean }> = {
    7: {
      title: 'Hito 1 · Sello de Bronce',
      reward: 'Pack de Superpociones (x3) + 500 ₽',
      icon: Gift,
    },
    14: {
      title: 'Hito 2 · Sello de Plata',
      reward: 'Ultra Ball (x5) + 1,000 ₽',
      icon: Gift,
    },
    21: {
      title: 'Hito 3 · Sello de Oro',
      reward: 'Caramelo Raro + 2,500 ₽',
      icon: Crown,
    },
    30: {
      title: 'Consagración Cumbre · Día 30',
      reward: 'Huevo Místico de 6 IVs Perfectos (ROM Injected)',
      icon: Sparkles,
      isMajor: true,
    },
  };

  return (
    <div className="bg-white border border-[#E4E1D8] rounded-2xl p-6 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-6 select-none">
      {/* 1. Encabezado Topográfico */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F2EFE9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2D68C4]/10 border border-[#2D68C4]/25 text-[#2D68C4]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="font-editorial text-lg font-bold text-[#1C1B18] tracking-tight">
              Sendero de Templanza & Purificación
            </h3>
          </div>
          <p className="text-xs text-[#706E66] mt-0.5">
            Peregrinaje de 30 días invicto. La disciplina forja tu carácter y nutre el huevo místico.
          </p>
        </div>

        {/* Contador Rúnico */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#706E66] block leading-none">
              Progreso de Campaña
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-mono font-bold text-[#1C1B18] tabular-nums">
                {currentStreak}
              </span>
              <span className="text-xs font-mono text-[#706E66]">/ 30 DÍAS</span>
            </div>
          </div>

          <div className="h-10 w-10 rounded-xl bg-[#FAF4E8] border border-[#C59B46]/35 flex items-center justify-center text-[#9A7025] font-mono font-bold text-xs shadow-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* 2. Cuadrícula de 30 Hitos Rúnicos (5 Filas x 6 Columnas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#706E66]">
          <span>Mapa de los 30 Pasos de Johto</span>
          <span className="text-[10px] text-[#9A7025] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C59B46]" />
            Hito Final: Huevo 6 IVs
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2.5 sm:gap-3 p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8]">
          {Array.from({ length: totalDays }, (_, i) => {
            const dayNum = i + 1;
            const isCompleted = dayNum <= currentStreak;
            const isCurrent = dayNum === currentStreak + 1 && !confirmedToday;
            const milestone = milestoneRewards[dayNum];

            return (
              <div
                key={dayNum}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-200 group ${
                  isCompleted
                    ? 'bg-[#EBF7EE] border-[#2E8555]/35 text-[#1E603B] shadow-xs'
                    : isCurrent
                    ? 'bg-white border-[#2D68C4] text-[#2D68C4] ring-2 ring-[#2D68C4]/20 shadow-sm animate-pulse'
                    : milestone?.isMajor
                    ? 'bg-white border-[#C59B46]/40 text-[#9A7025]'
                    : 'bg-white/80 border-[#E4E1D8] text-[#8C887E]'
                }`}
                title={milestone ? `${milestone.title}: ${milestone.reward}` : `Día ${dayNum}`}
              >
                {/* Indicador de Día */}
                <span className="text-[10px] font-mono font-bold leading-none">
                  {dayNum}
                </span>

                {/* Ícono de Estado */}
                <div className="mt-1">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3] text-[#2E8555]" />
                  ) : isCurrent ? (
                    <Flame className="w-3.5 h-3.5 text-[#2D68C4] fill-current" />
                  ) : milestone?.isMajor ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#C59B46]" />
                  ) : milestone ? (
                    <Gift className="w-3 h-3 text-[#C59B46]" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#DCD8CD]" />
                  )}
                </div>

                {/* Marcador de Hito Especial */}
                {milestone && (
                  <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
                    milestone.isMajor 
                      ? 'bg-[#C59B46] text-white shadow-xs' 
                      : 'bg-[#2D68C4] text-white'
                  }`}>
                    ★
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Vitrina del Huevo Místico del Día 30 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF4E8] via-[#FFFDF7] to-[#FAF4E8] border border-[#C59B46]/35 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white border border-[#C59B46]/30 flex items-center justify-center shrink-0 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POKEMON_ASSETS.getEggSprite()}
              alt="Huevo Místico"
              className="h-9 w-9 object-contain drop-shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-[#1C1B18]">
                Huevo Rúnico de Consagración
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#C59B46]/15 text-[#9A7025] border border-[#C59B46]/25">
                RECOMPENSA DÍA 30
              </span>
            </div>
            <p className="text-[11px] text-[#706E66] mt-0.5">
              Al completar los 30 días se inyecta directamente a la Caja 1 de tu PC Box con IVs perfectos.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-[#706E66] block">Faltan</span>
          <span className="text-sm font-mono font-bold text-[#9A7025]">
            {Math.max(0, 30 - currentStreak)} días
          </span>
        </div>
      </div>

      {/* 4. Botón Mecánico de Victoria Diaria */}
      <div className="pt-1 space-y-3">
        <button
          disabled={confirmedToday || submitting}
          onClick={onConfirmVictory}
          className={`w-full py-4 px-6 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
            confirmedToday
              ? 'bg-[#EBF7EE] text-[#1E603B] border border-[#2E8555]/30 cursor-default opacity-90'
              : 'bg-[#2D68C4] hover:bg-[#255BB0] text-white border border-[#1F4E96] shadow-[0_3px_0_#173B72] active:translate-y-[2px] active:shadow-none'
          }`}
        >
          <ShieldCheck className="w-4 h-4 fill-current" />
          <span>
            {confirmedToday
              ? '✓ Victoria Diaria Registrada (Permaneciste Invicto)'
              : 'Marcar Victoria: Hoy No Caí (+100 ₽ & +1 Día)'}
          </span>
        </button>

        {/* Acceso a modificar fecha de inicio */}
        {journeyStartDate && onOpenDatePicker && (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#706E66] px-1">
            <span>Fecha oficial de consagración: <strong>{journeyStartDate}</strong></span>
            <button
              type="button"
              onClick={onOpenDatePicker}
              className="text-[#2D68C4] hover:underline font-semibold cursor-pointer"
            >
              Cambiar fecha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
