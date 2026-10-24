'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Coins, 
  BatteryCharging, 
  Flame, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Gift, 
  Sparkles 
} from 'lucide-react';

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
  const gold = profileData?.sovereignty_gold ?? 0;
  const battery = Math.max(120, profileData?.battery_minutes ?? 120);
  const extraMinutes = Math.max(0, battery - 120);
  const streak = profileData?.streak_fire_days ?? 0;
  const totem = profileData?.guide_totem?.toUpperCase() || 'OSO';

  // Proporción de batería: 120m base + hasta 120m extras (240m total)
  const batteryPercent = Math.min(100, Math.round((battery / 240) * 100));

  // Determinar si hay tensión de asedio (pasadas las 8:00 PM y menos de 100%)
  const isHighTension = completionPercent < 100;

  return (
    <div className="sticky top-0 z-40 bg-[#0B0C0E]/95 backdrop-blur-md border-b border-[#C5A059]/25">
      {/* 1. Barra Principal de Identidad Rúnica & Recursos */}
      <header className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A059]/20 to-[#14171C] border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059] shadow-[0_2px_8px_rgba(197,160,89,0.25)]"
          >
            <Zap className="w-5 h-5 fill-current" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-widest text-[#E2E8F0] uppercase">
                FORJA JOHTO
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] font-mono font-bold">
                {totem}
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] block font-mono">
              {profileData?.leader_name || 'Guerrero'} • SOBERANÍA
            </span>
          </div>
        </div>

        {/* Recursos Dopamínicos con Feedback Táctil */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {/* Oro de la Forja */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14171C] border border-[#C5A059]/40 text-[#C5A059] shadow-[0_2px_0_0_#000]"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="font-black text-xs">{gold}</span>
          </motion.div>

          {/* Racha Fuego Sagrado */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#14171C] border border-rose-500/40 text-rose-400 shadow-[0_2px_0_0_#000]"
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span className="font-black text-xs">{streak}d</span>
          </motion.div>
        </div>
      </header>

      {/* 2. Barra Elástica de Batería de Pantalla (Cartucho GBA) */}
      <div className="px-3.5 pb-2 pt-0.5 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>VIGOR DE EXPEDICIÓN (2H LIBRES BASE)</span>
          </div>
          <span className="text-[#64748B]">
            <strong className="text-emerald-400 font-bold">{battery}m</strong> total
            {extraMinutes > 0 && (
              <span className="text-cyan-400 font-bold ml-1">(+{extraMinutes}m extras)</span>
            )}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#14171C] border border-emerald-500/30 overflow-hidden relative p-[1px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${batteryPercent}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
          />
        </div>
      </div>

      {/* 3. El Altar del Amanecer (Preview de Botín & Tensión de Asedio) */}
      <div className="bg-[#14171C]/80 border-t border-white/5 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#64748B]">
            <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>ASIEDO:</span>
            <span className="text-amber-400 font-bold">{timeUntilMidnight}</span>
          </div>
          <span className="text-[#64748B]">•</span>
          <div className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] text-[#C5A059] font-bold">BOTÍN 00:00</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#64748B]">CUMPLIDO:</span>
          <span
            className={`font-black text-xs ${
              completionPercent === 100
                ? 'text-emerald-400'
                : completionPercent >= 70
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {completionPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
