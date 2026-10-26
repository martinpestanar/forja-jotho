'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Sun, Settings, Compass, Gamepad2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export type MobileTab = 'vigor' | 'templanza' | 'settings' | 'vault' | 'game';

interface MobileFloatingDockProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenGrimoire?: () => void;
}

export function MobileFloatingDock({ activeTab, onTabChange }: MobileFloatingDockProps) {
  const tabs = [
    { id: 'vigor' as MobileTab, label: 'Mareas', icon: Waves, color: '#D97043' },
    { id: 'templanza' as MobileTab, label: 'Solsticio', icon: Sun, color: '#4A8B99' },
    { id: 'vault' as MobileTab, label: 'Santuario', icon: Compass, color: '#D4A359' },
    { id: 'game' as MobileTab, label: 'Cartucho', icon: Gamepad2, color: '#6E8B68' },
    { id: 'settings' as MobileTab, label: 'Ajustes', icon: Settings, color: '#969894' },
  ];

  const handleSelect = (tab: MobileTab) => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-[#E8E5DD] rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={`flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all select-none cursor-pointer ${
              isActive
                ? 'text-[#1F1E1B] font-semibold'
                : 'text-[#8A877E] hover:text-[#1F1E1B]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="floatingDockActiveIndicator"
                className="absolute inset-0 bg-[#D97043]/10 border border-[#D97043]/20 rounded-xl"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <Icon
              strokeWidth={isActive ? 2.3 : 1.7}
              className={`w-5 h-5 relative z-10 transition-transform ${
                isActive ? 'scale-105' : ''
              }`}
              style={{ color: isActive ? t.color : undefined }}
            />
            <span
              className={`text-[10px] tracking-tight mt-1 relative z-10 truncate ${
                isActive ? 'font-semibold' : 'font-normal'
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
