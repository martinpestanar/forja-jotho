'use client';

import React from 'react';
import clsx from 'clsx';
import { soundFx } from '@/lib/soundFx';

interface DateRibbonProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateKey: string) => void;
  dayStats?: Record<string, { allDone: boolean; count: number }>;
}

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function DateRibbon({ selectedDate, onSelectDate, dayStats = {} }: DateRibbonProps) {
  const today = new Date();
  
  // Obtener lunes de esta semana
  const currentDayOfWeek = today.getDay(); // 0 es domingo, 1 es lunes
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${dayNum}`;

    const isToday =
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate();

    const isSelected = selectedDate === key;
    const stats = dayStats[key];

    return {
      date: d,
      key,
      dayLetter: DAY_LETTERS[i],
      dayNumber: String(d.getDate()),
      isToday,
      isSelected,
      allDone: stats?.allDone,
    };
  });

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex items-center justify-between gap-1.5 p-1 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000]">
        {days.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(8);
              }
              soundFx.playClick();
              onSelectDate(item.key);
            }}
            className={clsx(
              'flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all relative select-none',
              item.isSelected
                ? 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_#000]'
                : item.isToday
                ? 'bg-amber-100 text-neutral-900 font-bold border border-amber-300'
                : 'hover:bg-neutral-100 text-neutral-600'
            )}
          >
            <span className="text-[10px] font-mono font-bold uppercase opacity-80">
              {item.dayLetter}
            </span>
            <span className="text-sm font-black font-mono mt-0.5">
              {item.dayNumber}
            </span>

            {/* Punto de cumplimiento */}
            <span
              className={clsx(
                'mt-1 h-1.5 w-1.5 rounded-full',
                item.allDone
                  ? 'bg-emerald-500 ring-2 ring-emerald-300'
                  : item.isSelected
                  ? 'bg-amber-400'
                  : 'bg-transparent'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
