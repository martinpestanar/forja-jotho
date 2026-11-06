'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Backpack, Gamepad2, Sliders } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export type MobileTab = 'vigor' | 'templanza' | 'settings' | 'vault' | 'game';

interface MobileFloatingDockProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenGrimoire?: () => void;
}

export function MobileFloatingDock({ activeTab, onTabChange }: MobileFloatingDockProps) {
  const tabs = [
    { 
      id: 'vigor' as MobileTab, 
      label: 'Misiones', 
      fullLabel: 'Misiones Diarias', 
      icon: Zap, 
      color: '#D9383A', // Ho-Oh Editorial Red
      activeBg: 'bg-[#D9383A]/8 border-[#D9383A]/25 text-[#D9383A]'
    },
    { 
      id: 'templanza' as MobileTab, 
      label: 'Pase', 
      fullLabel: 'Pase Entrenador', 
      icon: ShieldCheck, 
      color: '#2D68C4', // Lugia Sapphire Blue
      activeBg: 'bg-[#2D68C4]/8 border-[#2D68C4]/25 text-[#2D68C4]'
    },
    { 
      id: 'vault' as MobileTab, 
      label: 'Mochila', 
      fullLabel: 'Guardería & Mochila', 
      icon: Backpack, 
      color: '#C59B46', // Clear Bell Gold
      activeBg: 'bg-[#C59B46]/10 border-[#C59B46]/30 text-[#9A7025]'
    },
    { 
      id: 'game' as MobileTab, 
      label: 'GBA', 
      fullLabel: 'Cartucho GBA', 
      icon: Gamepad2, 
      color: '#2E8555', // Pueblo Primavera Green
      activeBg: 'bg-[#2E8555]/10 border-[#2E8555]/25 text-[#2E8555]'
    },
    { 
      id: 'settings' as MobileTab, 
      label: 'Ajustes', 
      fullLabel: 'Ajustes del Sistema', 
      icon: Sliders, 
      color: '#1C1B18', // Warm Carbon
      activeBg: 'bg-[#1C1B18]/6 border-[#1C1B18]/20 text-[#1C1B18]'
    },
  ];

  const handleSelect = (tab: MobileTab) => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onTabChange(tab);
  };

  return (
    <nav 
      aria-label="Navegación principal de consola"
      className="fixed bottom-3 inset-x-3 z-40 max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-[#E4E1D8] rounded-2xl p-1.5 shadow-[0_4px_20px_rgba(26,25,21,0.08),0_1px_3px_rgba(26,25,21,0.04)] flex items-center justify-between gap-1"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            type="button"
            title={t.fullLabel}
            onClick={() => handleSelect(t.id)}
            className={`min-h-[48px] min-w-[48px] flex-1 relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all select-none cursor-pointer border active:scale-[0.96] ${
              isActive
                ? `${t.activeBg} font-semibold shadow-[0_1px_2px_rgba(26,25,21,0.04)]`
                : 'border-transparent text-[#706E66] hover:text-[#1C1B18] hover:bg-[#FAF9F5]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="floatingDockActiveIndicator"
                className="absolute inset-0 rounded-xl pointer-events-none"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}

            <Icon
              strokeWidth={isActive ? 2.3 : 1.9}
              className={`w-5 h-5 relative z-10 transition-transform ${
                isActive ? 'scale-105' : ''
              }`}
              style={{ color: isActive ? t.color : undefined }}
            />
            <span
              className={`text-[10px] tracking-tight mt-0.5 relative z-10 truncate ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}
              style={{ color: isActive ? t.color : undefined }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
