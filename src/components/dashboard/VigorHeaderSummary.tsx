'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Coins, BatteryCharging, Trophy, Sparkles, Plus } from 'lucide-react';

interface VigorHeaderSummaryProps {
  totalCount: number;
  completedCount: number;
  earnedGoldToday: number;
  earnedBatteryToday: number;
  journeyStartDate?: string;
  onOpenOracle: () => void;
  onOpenDatePicker?: () => void;
}

export function VigorHeaderSummary({
  totalCount,
  completedCount,
  earnedGoldToday,
  earnedBatteryToday,
  journeyStartDate,
  onOpenOracle,
  onOpenDatePicker,
}: VigorHeaderSummaryProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const isAllDone = percent === 100 && totalCount > 0;

  // Evaluar si estamos en periodo de consagración previo
  const todayStr = new Date().toISOString().split('T')[0];
  const isPendingStart = journeyStartDate && journeyStartDate > todayStr;

  return (
    <div className="space-y-3">
      {/* Banner de Consagración si la fecha de inicio es futura */}
      {isPendingStart && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#C5A059]/10 to-transparent border border-[#C5A059]/50 p-3 flex items-center justify-between gap-2 shadow-[0_2px_0_0_#000]">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <span>🌅</span> PERIODO DE VIGILIA & CALIBRACIÓN
            </span>
            <p className="text-[11px] text-[#CBD5E1] truncate">
              Tu forja oficial inicia: <strong className="text-[#C5A059] font-mono">{journeyStartDate}</strong>
            </p>
          </div>
          {onOpenDatePicker && (
            <button
              onClick={onOpenDatePicker}
              className="px-2.5 py-1 rounded-lg bg-[#C5A059] hover:bg-amber-400 text-black text-[10px] font-black uppercase cursor-pointer shrink-0 shadow-[0_1px_0_0_#000]"
            >
              Cambiar
            </button>
          )}
        </div>
      )}

      {/* Altar de Batalla Bento Card */}
      <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043]">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-sm font-semibold tracking-tight text-[#1F1E1B]">
                  Mareas de Vigor
                </h2>
                {onOpenDatePicker && (
                  <button
                    onClick={onOpenDatePicker}
                    className="text-[10px] font-mono text-[#D97043] hover:underline cursor-pointer"
                  >
                    {isPendingStart ? '⏳ Inicia pronto' : 'Configurar'}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-[#706E66] font-mono">
                {completedCount} de {totalCount} disciplinas en flujo
              </span>
            </div>
          </div>

          {/* Botón Claro y Directo para Agregar Retos */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenOracle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
            title="Crear un nuevo hábito o reto semanal"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Reto</span>
          </motion.button>
        </div>

        {/* Barra de Progreso de Batalla */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium">
            <span className="text-[#8A877E]">AVANCE DEL DÍA</span>
            <span
              className={
                isAllDone
                  ? 'text-[#5B7855] font-bold'
                  : percent >= 60
                  ? 'text-[#D97043] font-bold'
                  : 'text-[#D9534F] font-bold'
              }
            >
              {isAllDone ? '👑 100% CUMPLIDO' : `${percent}% VIGOR`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#EAE7DF] overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className={`h-full rounded-full ${
                isAllDone
                  ? 'bg-gradient-to-r from-[#6E8B68] via-[#4A8B99] to-[#D97043]'
                  : 'bg-gradient-to-r from-[#D97043] to-[#E07A4D]'
              }`}
            />
          </div>
        </div>

        {/* Resumen de Recursos Cosechados Hoy */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E8E5DD] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#A6752C]">
              <Coins className="w-4 h-4" />
              <span className="font-medium">CONCHAS:</span>
            </div>
            <span className="text-[#1F1E1B] font-bold tabular-nums">+{earnedGoldToday}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E8E5DD] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#5B7855]">
              <BatteryCharging className="w-4 h-4" />
              <span className="font-medium">FLUJO GBA:</span>
            </div>
            <span className="text-[#1F1E1B] font-bold tabular-nums">+{earnedBatteryToday}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
