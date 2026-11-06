'use client';

import React from 'react';
import { Coins, Flame, BatteryCharging, Gamepad2 } from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';

interface MobileTopHudProps {
  profileData: any;
  timeUntilMidnight: string;
  completionPercent: number;
  onNavigateTab?: (tab: 'vigor' | 'templanza' | 'vault' | 'game' | 'settings') => void;
  onOpenVault?: () => void;
}

export function MobileTopHud({
  profileData,
  onNavigateTab,
  onOpenVault,
}: MobileTopHudProps) {
  const wallet = useTrainerStore((s) => s.profile?.pokedollars);
  const gold = wallet ?? profileData?.sovereignty_gold ?? 250;
  const battery = profileData?.battery_minutes ?? 120;
  const streak = profileData?.streak_fire_days ?? 1;

  const handleChipTap = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4E1D8] shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
      <header className="px-3.5 py-2.5 flex items-center justify-between max-w-md mx-auto">
        {/* Identidad / App Brand Editorial Retro-Premium Johto */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-xl bg-[#D9383A] text-white flex items-center justify-center shadow-[0_2px_6px_rgba(217,56,58,0.25)]">
            <Gamepad2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-semibold tracking-tight text-[#1C1B18]">
                SynDex
              </span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-[#FAF9F5] text-[#706E66] border border-[#E4E1D8]">
                GBA
              </span>
            </div>
            <span className="text-[10px] text-[#706E66] font-mono font-medium block mt-0.5 truncate max-w-[100px]">
              {profileData?.leader_name || 'Entrenador'}
            </span>
          </div>
        </div>

        {/* Píldoras Técnicas: Batería (Lugia), Monedas (Oro) y Racha (Ho-Oh) con navegación interactiva */}
        <div className="flex items-center gap-1.5 select-none">
          {/* Batería Emulador GBA (Azul Zafiro Lugia) -> Salta a consola GBA */}
          <button
            type="button"
            onClick={() => {
              handleChipTap();
              if (onNavigateTab) onNavigateTab('game');
            }}
            title="Minutos de batería disponibles (Toca para ir al cartucho)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2D68C4]/8 border border-[#2D68C4]/20 text-[#2D68C4] hover:bg-[#2D68C4]/15 active:scale-95 cursor-pointer transition-all"
          >
            <BatteryCharging className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="tabular-nums font-mono text-xs font-semibold">{battery}m</span>
          </button>

          {/* Monedas Johto (Oro Campana Clara) -> Salta a la Bóveda / Alijo */}
          <button
            type="button"
            onClick={() => {
              handleChipTap();
              if (onOpenVault) {
                onOpenVault();
              } else if (onNavigateTab) {
                onNavigateTab('vault');
              }
            }}
            title="Pokédólares acumulados (Toca para abrir la Bóveda)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025] hover:bg-[#C59B46]/18 active:scale-95 cursor-pointer transition-all"
          >
            <Coins className="w-3.5 h-3.5 text-[#C59B46] stroke-[2]" />
            <span className="tabular-nums font-mono text-xs font-semibold">{gold}</span>
          </button>

          {/* Racha de Fuego (Rojo Ho-Oh Editorial) -> Salta a Templanza */}
          <button
            type="button"
            onClick={() => {
              handleChipTap();
              if (onNavigateTab) onNavigateTab('templanza');
            }}
            title="Días de racha de disciplina (Toca para ir a Templanza)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#D9383A]/8 border border-[#D9383A]/20 text-[#D9383A] hover:bg-[#D9383A]/15 active:scale-95 cursor-pointer transition-all"
          >
            <Flame className="w-3.5 h-3.5 fill-current stroke-[1.5]" />
            <span className="tabular-nums font-mono text-xs font-semibold">{streak}d</span>
          </button>
        </div>
      </header>
    </div>
  );
}
