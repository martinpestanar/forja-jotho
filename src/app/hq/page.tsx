'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Flame,
  Gamepad2,
  HelpCircle,
  Plus,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DateRibbon } from '@/components/habits/DateRibbon';
import { MysteryEggCard } from '@/components/habits/MysteryEggCard';
import { HabitItemCard } from '@/components/habits/HabitItemCard';
import { useHabitsStore, getTodayKey } from '@/store/useHabitsStore';
import { useHqStore, getBalance } from '@/store/useHqStore';
import { useTrainerStore } from '@/store/useTrainerStore';
import { PILLARS, PillarKey } from '@/lib/pillars';
import { soundFx } from '@/lib/soundFx';

export default function HqTodayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const habits = useHabitsStore((state) => state.habits);
  const egg = useHabitsStore((state) => state.egg);
  const toggleHabit = useHabitsStore((state) => state.toggleHabit);
  const addHabit = useHabitsStore((state) => state.addHabit);

  // Economía y Batería
  const ledger = useHqStore((state) => state.ledger);
  const batteryMinutes = getBalance(ledger);
  const addMinutes = useHqStore((state) => state.addMinutes);
  const trainerProfile = useTrainerStore((state) => state.profile);

  const todayKey = getTodayKey();
  const isViewingToday = selectedDate === todayKey;

  // Filtrar hábitos activos
  const activeHabits = habits.filter((h) => h.active);
  const completedCount = activeHabits.filter((h) => h.history[selectedDate]?.completed).length;
  const progressPercent = activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0;

  // Acción de marcar hábito
  const handleToggle = async (habitId: string) => {
    const res = await toggleHabit(habitId, selectedDate);
    if (res.completed && res.minutesEarned > 0) {
      addMinutes(res.minutesEarned, 'Hábito cumplido en SynDex');
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10">
      {/* 1. Header Compacto de Estado (Estilo Pokédex) */}
      <div className="rounded-2xl border-2 border-black bg-[#FAF9F5] p-3 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
        {/* Racha */}
        <div className="flex items-center gap-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-rose-500 text-white shadow-[2px_2px_0px_0px_#000]">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block leading-tight">
              Racha
            </span>
            <span className="text-sm font-black font-mono text-neutral-900">
              {egg.daysCompleted} DÍAS 🔥
            </span>
          </div>
        </div>

        {/* Batería de Juego */}
        <Link
          href="/hq/tiempo"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black bg-emerald-400 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-emerald-300 transition-all"
        >
          <Gamepad2 className="h-4 w-4 text-black" />
          <div className="text-left">
            <span className="text-[9px] font-mono font-black uppercase text-black block leading-tight">
              Batería
            </span>
            <span className="text-xs font-black font-mono text-black">
              {batteryMinutes}m
            </span>
          </div>
        </Link>

        {/* Pokédólares */}
        <Link
          href="/hq/tienda"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black bg-amber-400 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-amber-300 transition-all"
        >
          <span className="text-xs font-black font-mono text-black">
            ${trainerProfile?.pokedollars ?? 150} 💰
          </span>
        </Link>
      </div>

      {/* 2. Ribbon Semanal (Date Selector) */}
      <DateRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        dayStats={{
          [todayKey]: {
            allDone: progressPercent === 100,
            count: completedCount,
          },
        }}
      />

      {/* 3. Tarjeta del Huevo Misterioso (Onboarding Gamificado) */}
      <MysteryEggCard
        daysCompleted={egg.daysCompleted}
        targetDays={egg.targetDays}
        stage={egg.stage}
        dominantPillar={egg.dominantPillar}
        hatchedSpecies={egg.hatchedSpecies}
      />

      {/* 4. Barra de Progreso del Día */}
      <div className="flex items-center justify-between px-1 font-mono text-xs font-bold text-neutral-700">
        <span className="flex items-center gap-1.5 uppercase">
          <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
          Progreso del Día ({completedCount}/{activeHabits.length})
        </span>
        <span className="rounded bg-neutral-900 text-white px-2 py-0.5 text-[10px]">
          {progressPercent}%
        </span>
      </div>

      {/* 5. Lista de Hábitos por Pilares */}
      <div className="space-y-3">
        {(['cuerpo', 'mente', 'conciencia', 'dinero'] as PillarKey[]).map((pillarKey) => {
          const pillarHabits = activeHabits.filter((h) => h.pillar === pillarKey);
          if (pillarHabits.length === 0) return null;
          const p = PILLARS[pillarKey];

          return (
            <div key={pillarKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-[11px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: p.color }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.label}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {p.rewardsSummary.split(',')[0]}
                </span>
              </div>

              <div className="space-y-2">
                {pillarHabits.map((habit) => (
                  <HabitItemCard
                    key={habit.id}
                    habit={habit}
                    dateKey={selectedDate}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Banner Acceso Rápido al Emulador */}
      <div className="rounded-2xl border-4 border-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 text-white shadow-[6px_6px_0px_0px_#000] flex items-center justify-between">
        <div>
          <span className="rounded bg-black text-amber-400 font-mono text-[10px] font-black px-2 py-0.5 uppercase">
            Cartucho mGBA Heart & Soul
          </span>
          <h3 className="text-sm font-black font-mono mt-1">
            ¿Listo para tu sesión de juego?
          </h3>
          <p className="text-[11px] text-white/90">
            Tienes {batteryMinutes} minutos de batería acumulada.
          </p>
        </div>
        <Link
          href="/hq/tiempo"
          className="rounded-xl border-2 border-black bg-white px-3.5 py-2 font-mono text-xs font-black text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 hover:bg-neutral-100 flex items-center gap-1.5 shrink-0"
        >
          <Gamepad2 className="h-4 w-4" />
          <span>Jugar Ahora</span>
        </Link>
      </div>
    </div>
  );
}
