'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Scroll, Archive, Gamepad2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export type MobileTab = 'vigor' | 'templanza' | 'oaths' | 'vault' | 'game';

interface MobileFloatingDockProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileFloatingDock({ activeTab, onTabChange }: MobileFloatingDockProps) {
  const tabs = [
    { id: 'vigor' as MobileTab, label: 'Vigor', icon: Zap, color: '#C5A059' },
    { id: 'templanza' as MobileTab, label: 'Templanza', icon: ShieldCheck, color: '#4E9F9F' },
    { id: 'oaths' as MobileTab, label: 'Pactos', icon: Scroll, color: '#F59E0B' },
    { id: 'vault' as MobileTab, label: 'Bóveda', icon: Archive, color: '#8B5CF6' },
    { id: 'game' as MobileTab, label: 'GBA', icon: Gamepad2, color: '#22C55E' },
  ];

  const handleSelect = (tab: MobileTab) => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto bg-[#14171C]/90 backdrop-blur-lg border border-[#C5A059]/30 rounded-2xl p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.7)] flex items-center justify-around">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all select-none cursor-pointer ${
              isActive
                ? 'text-[#E2E8F0] font-black'
                : 'text-[#64748B] hover:text-[#E2E8F0]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="floatingDockActiveIndicator"
                className="absolute inset-0 bg-[#C5A059]/15 border border-[#C5A059]/50 rounded-xl"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <Icon
              className={`w-5 h-5 relative z-10 transition-transform ${
                isActive ? 'scale-110' : ''
              }`}
              style={{ color: isActive ? t.color : undefined }}
            />
            <span
              className={`text-[10px] font-mono mt-0.5 relative z-10 ${
                isActive ? 'font-bold' : ''
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
