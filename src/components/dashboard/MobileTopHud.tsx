'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Waves,
  Coins, 
  Sun,
  Flame, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';

interface MobileTopHudProps {
  profileData: any;
  timeUntilMidnight: string;
  completionPercent: number;
}

export function MobileTopHud({
  profileData,
  timeUntilMidnight,
  completionPercent,
}: MobileTopHudProps) {
  const wallet = useTrainerStore((s) => s.profile?.pokedollars);
  const gold = wallet ?? profileData?.sovereignty_gold ?? 0;
  const battery = Math.max(120, profileData?.battery_minutes ?? 120);
  const extraMinutes = Math.max(0, battery - 120);
  const streak = profileData?.streak_fire_days ?? 0;
  const totem = profileData?.guide_totem?.toUpperCase() || 'GUARDIÁN';

  // Proporción de batería: 120m base + hasta 120m extras (240m total)
  const batteryPercent = Math.min(100, Math.round((battery / 240) * 100));

  return (
    <div className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-xl border-b border-[#E8E5DD] relative overflow-hidden">
      {/* 🌊 Onda Marina Sutil de Fondo (Ambient Ocean Swell) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-25 overflow-hidden h-7">
        <motion.svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute w-[200%] h-full text-[#4A8B99]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M0,40 C150,80 350,0 500,40 C650,80 850,0 1000,40 C1150,80 1350,0 1500,40 C1650,80 1850,0 2000,40 L2000,120 L0,120 Z" />
        </motion.svg>
      </div>

      {/* 1. Header Minimalista Editorial Anthropic x Johto Surf */}
      <header className="px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="w-9 h-9 rounded-xl bg-[#D97043]/10 border border-[#D97043]/30 flex items-center justify-center text-[#D97043] shadow-sm"
          >
            <Waves className="w-5 h-5" strokeWidth={2.2} />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-sm font-semibold tracking-tight text-[#1F1E1B]">
                Johto Solstice
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A8B99]/10 border border-[#4A8B99]/30 text-[#3B7582] font-mono font-medium">
                {totem}
              </span>
            </div>
            <span className="text-[11px] text-[#706E66] block font-mono">
              {profileData?.leader_name || 'Entrenador'} • En Marea
            </span>
          </div>
        </div>

        {/* Recursos: Pokédólares & Racha en cápsulas limpias */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Pokédólares / Conchas */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#A6752C] shadow-sm"
          >
            <Coins className="w-4 h-4" />
            <span className="font-bold text-xs tabular-nums">{gold}</span>
          </motion.div>

          {/* Racha / Fuego de Solsticio */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#D97043] shadow-sm"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span className="font-bold text-xs tabular-nums">{streak}d</span>
          </motion.div>
        </div>
      </header>

      {/* 2. Barra de Flujo Solar (Minutos de Expansión/Juego) */}
      <div className="px-4 pb-3 pt-1 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[#5B7855] font-medium">
            <Sun className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="tracking-wide">FLUJO SOLAR (2H BASE)</span>
          </div>
          <span className="text-[#706E66]">
            <strong className="text-[#1F1E1B] font-semibold">{battery}m</strong> total
            {extraMinutes > 0 && (
              <span className="text-[#3B7582] font-semibold ml-1.5">(+{extraMinutes}m extra)</span>
            )}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#EAE7DF] overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${batteryPercent}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="h-full rounded-full bg-gradient-to-r from-[#6E8B68] via-[#4A8B99] to-[#D97043]"
          />
        </div>
      </div>

      {/* 3. Marea & Tensión Diaria */}
      <div className="bg-[#F2EFE9] border-t border-[#E8E5DD] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#706E66]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#D97043]" />
            <span>Marea Cierra:</span>
            <span className="text-[#1F1E1B] font-semibold tabular-nums">{timeUntilMidnight}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span>ALINEACIÓN:</span>
          <span
            className={`font-bold text-xs tabular-nums ${
              completionPercent === 100
                ? 'text-[#5B7855]'
                : completionPercent >= 70
                ? 'text-[#A6752C]'
                : 'text-[#D9534F]'
            }`}
          >
            {completionPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
