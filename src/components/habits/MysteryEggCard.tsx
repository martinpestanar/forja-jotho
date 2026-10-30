'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Egg, Sparkles } from 'lucide-react';
import { PILLARS, PillarKey } from '@/lib/pillars';

interface MysteryEggCardProps {
  daysCompleted: number;
  targetDays: number;
  stage: 'egg' | 'cracking' | 'hatched';
  dominantPillar: PillarKey;
  hatchedSpecies?: string;
}

export function MysteryEggCard({
  daysCompleted,
  targetDays,
  stage,
  dominantPillar,
  hatchedSpecies,
}: MysteryEggCardProps) {
  const pillarInfo = PILLARS[dominantPillar];
  const percent = Math.min(100, Math.round((daysCompleted / targetDays) * 100));

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000] relative overflow-hidden">
      {/* Etiqueta superior */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-neutral-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Huevo del Onboarding</span>
        </div>
        <span className="rounded-md border border-black bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-black text-black">
          {daysCompleted}/{targetDays} DÍAS
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Gráfico del Huevo con animación de pulso / sacudida */}
        <motion.div
          animate={
            stage === 'cracking'
              ? { rotate: [-4, 4, -4, 4, 0], scale: [1, 1.05, 1] }
              : { scale: [1, 1.02, 1] }
          }
          transition={{ repeat: Infinity, duration: stage === 'cracking' ? 1.5 : 3 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-black bg-amber-50 shadow-[2px_2px_0px_0px_#000] relative"
        >
          {stage === 'hatched' ? (
            <span className="text-2xl">✨🐣</span>
          ) : (
            <Egg
              className="h-8 w-8"
              style={{ color: pillarInfo.color }}
              strokeWidth={2.2}
            />
          )}
          {stage === 'cracking' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border border-black">
              !
            </span>
          )}
        </motion.div>

        {/* Detalles y barra de progreso */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-neutral-900 font-mono">
            {stage === 'hatched'
              ? `¡Eclosionó en ${hatchedSpecies || 'tu inicial'}!`
              : stage === 'cracking'
              ? '¡El huevo se está agitando!'
              : `Incubando con energía de ${pillarInfo.label}`}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
            {stage === 'hatched'
              ? 'Tu compañero de disciplina ya está listo en tu equipo.'
              : 'Eclosiona al completar 5 días de hábitos en la vida real.'}
          </p>

          {/* Barra elástica */}
          <div className="mt-2 h-2.5 w-full rounded-full border border-black bg-neutral-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
