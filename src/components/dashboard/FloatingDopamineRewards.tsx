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
          const colorClass =
            r.type === 'gold'
              ? 'text-[#C5A059] border-[#C5A059]/50 bg-[#14171C]/90 shadow-[0_0_15px_rgba(197,160,89,0.5)]'
              : r.type === 'battery'
              ? 'text-emerald-400 border-emerald-500/50 bg-[#14171C]/90 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
              : 'text-rose-400 border-rose-500/50 bg-[#14171C]/90 shadow-[0_0_15px_rgba(244,63,94,0.5)]';

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
              className={`absolute px-3 py-1 rounded-full border text-xs font-mono font-black flex items-center gap-1.5 backdrop-blur-md ${colorClass}`}
            >
              {r.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
