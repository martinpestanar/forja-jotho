'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, ShieldCheck, Zap } from 'lucide-react';
import clsx from 'clsx';
import { HabitItem, PILLARS } from '@/lib/pillars';

interface HabitItemCardProps {
  habit: HabitItem;
  dateKey: string;
  onToggle: (habitId: string) => void;
}

export function HabitItemCard({ habit, dateKey, onToggle }: HabitItemCardProps) {
  const isDone = Boolean(habit.history[dateKey]?.completed);
  const pillar = PILLARS[habit.pillar];
  const Icon = pillar.icon;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'group relative flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 transition-all select-none',
        isDone
          ? 'border-black bg-white/95 shadow-[2px_2px_0px_0px_#000]'
          : 'border-black bg-white shadow-[4px_4px_0px_0px_#000] hover:translate-y-[-1px]'
      )}
    >
      {/* Indicador del pilar e información */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]"
          style={{ backgroundColor: isDone ? '#E5E7EB' : pillar.bgLight }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: isDone ? '#6B7280' : pillar.color }}
            strokeWidth={2.4}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border border-black/20"
              style={{ backgroundColor: pillar.bgLight, color: pillar.color }}
            >
              {pillar.label.split('&')[0]}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
              <Clock className="h-3 w-3" />
              {habit.targetMinutes}m
            </span>
            {habit.requiresProof && (
              <span className="flex items-center gap-0.5 text-[9px] text-amber-700 bg-amber-100 px-1 rounded font-mono font-bold">
                <ShieldCheck className="h-2.5 w-2.5" /> Candado
              </span>
            )}
          </div>

          <h4
            className={clsx(
              'text-xs sm:text-sm font-bold font-mono tracking-tight truncate mt-0.5',
              isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
            )}
          >
            {habit.title}
          </h4>
        </div>
      </div>

      {/* Botón de Check Táctil Grande */}
      <button
        type="button"
        onClick={() => onToggle(habit.id)}
        className={clsx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-black transition-all active:scale-90',
          isDone
            ? 'bg-emerald-500 text-white shadow-none translate-x-0.5 translate-y-0.5'
            : 'bg-[#FAF9F5] hover:bg-neutral-100 shadow-[3px_3px_0px_0px_#000]'
        )}
        aria-label={isDone ? 'Marcar incompleto' : 'Marcar completado'}
      >
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="checked"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-6 w-6 stroke-[3]" />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-4 w-4 rounded-full border-2 border-neutral-300"
            />
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
