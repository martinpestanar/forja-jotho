'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Coins, BatteryCharging, Trophy, Sparkles } from 'lucide-react';

interface VigorHeaderSummaryProps {
  totalCount: number;
  completedCount: number;
  earnedGoldToday: number;
  earnedBatteryToday: number;
  onOpenOracle: () => void;
}

export function VigorHeaderSummary({
  totalCount,
  completedCount,
  earnedGoldToday,
  earnedBatteryToday,
  onOpenOracle,
}: VigorHeaderSummaryProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const isAllDone = percent === 100 && totalCount > 0;

  return (
    <div className="space-y-3">
      {/* Altar de Batalla Bento Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#14171C] via-[#101318] to-[#0B0C0E] border border-[#C5A059]/40 p-4 space-y-3 shadow-[0_4px_0_0_#000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059]">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-widest text-[#E2E8F0] uppercase">
                CAMPAÑA DE VIGOR
              </h2>
              <span className="text-[10px] text-[#C5A059] font-mono">
                {completedCount} de {totalCount} disciplinas forjadas
              </span>
            </div>
          </div>

          {/* Botón Consultar al Oráculo */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenOracle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_2px_0_0_#000] active:translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Consultar</span>
          </motion.button>
        </div>

        {/* Barra de Progreso de Batalla */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-[#64748B]">AVANCE DIARIO</span>
            <span
              className={
                isAllDone
                  ? 'text-emerald-400 font-black'
                  : percent >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {isAllDone ? '👑 100% VICTORIA' : `${percent}% VIGOR`}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#0B0C0E] border border-white/10 overflow-hidden relative p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className={`h-full rounded-full ${
                isAllDone
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.8)]'
                  : 'bg-gradient-to-r from-[#C5A059] to-amber-500'
              }`}
            />
          </div>
        </div>

        {/* Resumen de Recursos Cosechados Hoy */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono font-black">
          <div className="p-2 rounded-xl bg-[#0B0C0E] border border-[#C5A059]/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#C5A059]">
              <Coins className="w-4 h-4" />
              <span>ORO HOY:</span>
            </div>
            <span className="text-[#E2E8F0]">+{earnedGoldToday}</span>
          </div>

          <div className="p-2 rounded-xl bg-[#0B0C0E] border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <BatteryCharging className="w-4 h-4" />
              <span>GBA EXTRA:</span>
            </div>
            <span className="text-[#E2E8F0]">+{earnedBatteryToday}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
