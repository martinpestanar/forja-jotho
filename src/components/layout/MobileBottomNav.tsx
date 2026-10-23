'use client';

import React from 'react';
import { Gamepad2, LayoutDashboard, Trophy } from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';

export type MobileTab = 'gba' | 'center' | 'social';

interface MobileBottomNavProps {
  currentTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const theme = useTrainerStore((s) => s.theme);
  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);
  const isLight = theme === 'light_gbc';

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around z-50 px-2 font-mono transition-colors duration-200 ${
        isLight
          ? 'bg-[#F4F1EA] border-t-4 border-black text-slate-900 shadow-[0_-4px_0_#000]'
          : 'bg-[#0d1322] border-t-2 border-slate-800 text-slate-100'
      }`}
    >
      <button
        onClick={() => openArcadeRoom()}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          isLight
            ? 'text-[#E60012] font-black'
            : 'text-amber-400 font-bold'
        }`}
      >
        <Gamepad2 className="w-5 h-5 mb-0.5 animate-pulse" />
        <span className="text-[10px]">SALA ARCADE</span>
      </button>

      <button
        onClick={() => onSelectTab('center')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'center'
            ? isLight
              ? 'text-[#E60012] font-black'
              : 'text-amber-400 font-bold'
            : isLight
              ? 'text-slate-600'
              : 'text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">MISIÓN / ZONA</span>
      </button>

      <button
        onClick={() => onSelectTab('social')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          currentTab === 'social'
            ? isLight
              ? 'text-[#E60012] font-black'
              : 'text-amber-400 font-bold'
            : isLight
              ? 'text-slate-600'
              : 'text-slate-400'
        }`}
      >
        <Trophy className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">TUTOR & RANGO</span>
      </button>
    </nav>
  );
};
