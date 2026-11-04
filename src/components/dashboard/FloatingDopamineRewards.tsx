'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingReward {
  id: string;
  text: string;
  type: 'gold' | 'battery' | 'streak';
  x?: number;
  y?: number;
}

interface FloatingDopamineRewardsProps {
  rewards: FloatingReward[];
  onComplete: (id: string) => void;
}

export function FloatingDopamineRewards({ rewards, onComplete }: FloatingDopamineRewardsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {rewards.map((r) => {
          // Neo-Arcade Johto Light Palette para números flotantes
          const colorClass =
            r.type === 'gold'
              ? 'text-[#855B14] border-2 border-[#1A1915] bg-[#FFF8E7] shadow-[2px_2px_0px_0px_#1A1915]'
              : r.type === 'battery'
              ? 'text-[#2563EB] border-2 border-[#1A1915] bg-[#EFF6FF] shadow-[2px_2px_0px_0px_#1A1915]'
              : 'text-[#E60012] border-2 border-[#1A1915] bg-[#FEF2F2] shadow-[2px_2px_0px_0px_#1A1915]';

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: r.y ?? 250, x: r.x ?? 160, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: (r.y ?? 250) - 100,
                scale: [0.6, 1.25, 1, 0.9],
              }}
              transition={{ duration: 1.3, ease: 'easeOut' }}
              onAnimationComplete={() => onComplete(r.id)}
              className={`absolute px-3 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 select-none ${colorClass}`}
            >
              {r.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
