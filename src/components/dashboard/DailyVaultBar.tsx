'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Coins, Battery, Clock, Sparkles, ChevronDown, CheckCircle2, Award } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface DailyVaultBarProps {
  pendingGold: number;
  pendingBattery: number;
  completedTasks: number;
  totalTasks: number;
  timeUntilMidnight: string;
}

export function DailyVaultBar({
  pendingGold,
  pendingBattery,
  completedTasks,
  totalTasks,
  timeUntilMidnight,
}: DailyVaultBarProps) {
  const [expanded, setExpanded] = useState(false);

  // Comprobar si faltan menos de 2 horas para medianoche (modo asedio)
  const isUrgent = timeUntilMidnight.startsWith('00:') || timeUntilMidnight.startsWith('01:');
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const handleToggle = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E4E1D8] shadow-[0_2px_8px_rgba(26,25,21,0.04)] select-none overflow-hidden transition-all">
      {/* Barra Principal */}
      <div
        onClick={handleToggle}
        className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF9F5]/50 transition-colors"
      >
        {/* Lado izquierdo: Icono de Alijo + Información */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 flex items-center justify-center text-[#9A7025] shrink-0">
            <Archive className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#9A7025]">
                ALIJO DE TRIGAL
              </span>
              <span className="text-[9px] font-mono text-[#706E66]">
                · Liquidación 12:00 AM
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-[#1C1B18] truncate">
                {pendingGold > 0 || pendingBattery > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#9A7025] font-mono font-bold">+{pendingGold} ₽</span>
                    <span className="text-[#706E66]">·</span>
                    <span className="text-[#2D68C4] font-mono font-bold">+{pendingBattery}m GBA</span>
                  </span>
                ) : (
                  <span className="text-[#706E66] font-mono text-[11px]">Sella tareas para llenar el alijo</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Contador de Cuenta Regresiva de Medianoche + Flecha */}
        <div className="shrink-0 flex items-center gap-2 text-right">
          <div className="space-y-0.5">
            <div
              className={`flex items-center justify-end gap-1 px-2 py-0.5 rounded-lg border font-mono text-[11px] font-bold tabular-nums ${
                isUrgent
                  ? 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/25 animate-pulse'
                  : 'bg-[#FAF9F5] text-[#1C1B18] border-[#E4E1D8]'
              }`}
            >
              <Clock className="w-3 h-3 stroke-[2.2]" />
              <span>{timeUntilMidnight || '00:00:00'}</span>
            </div>
            <span className="text-[8.5px] font-mono text-[#706E66] block uppercase tracking-wider">
              {allCompleted ? '★ Pilares Listos' : `${completedTasks}/${totalTasks} selladas`}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#706E66] transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Barra de progreso de sellado diario */}
      <div className="w-full h-1 bg-[#FAF9F5] border-t border-[#E4E1D8]/60 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            allCompleted ? 'bg-[#2E8555]' : 'bg-[#C59B46]'
          }`}
          style={{
            width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Panel Desplegable con Desglose Rúnico */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#E4E1D8] bg-[#FAF9F5]/70 p-3 space-y-2.5 text-xs font-mono"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#706E66]">Estado de Custodia:</span>
              <span className="font-bold text-[#1C1B18]">
                {allCompleted ? 'Bolsa Completa (100%)' : `${completedTasks} de ${totalTasks} selladas`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-[#E4E1D8] space-y-0.5">
                <span className="text-[10px] text-[#706E66] block">Total en Custodia</span>
                <span className="font-bold text-[#9A7025] text-sm tabular-nums">+{pendingGold} ₽</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E4E1D8] space-y-0.5">
                <span className="text-[10px] text-[#706E66] block">Batería de Cartucho</span>
                <span className="font-bold text-[#2D68C4] text-sm tabular-nums">+{pendingBattery}m</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-[#E4E1D8] flex items-center justify-between text-[10.5px]">
              <span className="text-[#706E66] flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#C59B46]" />
                Multiplicador de Templanza:
              </span>
              <span className="font-bold text-[#2E8555]">
                {allCompleted ? '1.25x Activo ⚡' : 'Requiere 4/4 hábitos'}
              </span>
            </div>

            <p className="text-[10px] text-[#706E66] leading-relaxed pt-0.5">
              💡 A las 12:00 AM se rompe el sello nocturno y todo tu botín acumulado se acreditará en tu cuenta con la ceremonia de liquidación.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
