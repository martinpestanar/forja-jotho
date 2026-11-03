'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Flame, BatteryCharging, Gamepad2 } from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';

interface MobileTopHudProps {
  profileData: any;
  timeUntilMidnight: string;
  completionPercent: number;
}

export function MobileTopHud({
  profileData,
  completionPercent,
}: MobileTopHudProps) {
  const wallet = useTrainerStore((s) => s.profile?.pokedollars);
  const gold = wallet ?? profileData?.sovereignty_gold ?? 250;
  const battery = profileData?.battery_minutes ?? 120;
  const streak = profileData?.streak_fire_days ?? 1;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E5DD] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <header className="px-4 py-2.5 flex items-center justify-between max-w-md mx-auto">
        {/* Identidad / App Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043]">
            <Gamepad2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-editorial text-sm font-semibold tracking-tight text-[#1F1E1B] block leading-none">
              SynDex
            </span>
            <span className="text-[10px] text-[#706E66] font-mono block mt-0.5">
              {profileData?.leader_name || 'Entrenador'}
            </span>
          </div>
        </div>

        {/* Píldoras Esenciales: Monedas, Racha y 2h Batería */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {/* Batería Emulador (2H) */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#5A7D62]/10 border border-[#5A7D62]/25 text-[#4C6151] font-semibold">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span className="tabular-nums">{battery}m</span>
          </div>

          {/* Pokédólares */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-[#A6752C] font-semibold">
            <Coins className="w-3.5 h-3.5" />
            <span className="tabular-nums">{gold}</span>
          </div>

          {/* Racha */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-[#D97043] font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="tabular-nums">{streak}d</span>
          </div>
        </div>
      </header>
    </div>
  );
}
