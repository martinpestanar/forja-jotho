'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Moon, Sun, CheckCircle2, Circle, Compass, Sparkles, AlertCircle } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface FlexibleCompanionBarProps {
  completedCount: number;
  totalCount: number;
  onOpenGrimoire: () => void;
  onOpenJournal?: () => void;
  onOpenTutorial?: () => void;
}

export function FlexibleCompanionBar({
  completedCount,
  totalCount,
  onOpenGrimoire,
  onOpenJournal,
  onOpenTutorial,
}: FlexibleCompanionBarProps) {
  const [currentHour, setCurrentHour] = useState(12);

  useEffect(() => {
    const updateHour = () => {
      setCurrentHour(new Date().getHours());
    };
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, totalCount - completedCount);
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Frase dinámica según energía del día sin imponer horarios rígidos
  const getCompanionTone = () => {
    if (completedCount === totalCount && totalCount > 0) {
      return {
        title: '👑 EL DÍA HA SIDO CONQUISTADO',
        message: 'Has cumplido tus pilares. El botín de medianoche es tuyo.',
        color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      };
    }

    if (currentHour >= 10 && currentHour < 15) {
      return {
        title: '☀️ MAÑANA SOBERANA (ENERGÍA DE ARRANQUE)',
        message: `Llevas ${completedCount} de ${totalCount}. Fluye a tu propio ritmo, Martín.`,
        color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      };
    } else if (currentHour >= 15 && currentHour < 20) {
      return {
        title: '⚡ TARDE DEL CAZADOR (MOMENTO DE EJECUCIÓN)',
        message: `Quedan ${remaining} misiones para sellar. Recuerda tu terraza y tus tomates.`,
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      };
    } else if (currentHour >= 20 && currentHour <= 23) {
      return {
        title: '🔥 NOCHE DE JEFE TRIBAL (POTENCIA MÁXIMA)',
        message: `Ideal para tu danza tribal o cerrar tus SaaS antes de medianoche.`,
        color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      };
    } else {
      return {
        title: '🌙 LA VIGILIA NOCTURNA (CERO COMPLACENCIA)',
        message: 'Descansa o sella tu veredicto. Cuida tu energía para mañana.',
        color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      };
    }
  };

  const tone = getCompanionTone();

  return (
    <div className={`rounded-2xl border p-3.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${tone.color}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Compass className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider font-mono truncate">
            {tone.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenTutorial && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenTutorial();
              }}
              className="text-[9px] px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-mono font-bold uppercase transition-colors"
            >
              ❓ Guía
            </button>
          )}
          {onOpenJournal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenJournal();
              }}
              className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 text-indigo-300 font-mono font-bold uppercase transition-colors"
            >
              ✍️ Diario
            </button>
          )}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenGrimoire();
            }}
            className="text-[9px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-bold uppercase transition-colors shrink-0"
          >
            📖 Grimorio
          </button>
        </div>
      </div>

      <p className="text-xs text-[#CBD5E1] font-mono leading-tight mb-2.5">
        {tone.message}
      </p>

      {/* Barra de Progreso Fluida (Sin estrés de reloj) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-[#E2E8F0] shrink-0">
          {completedCount}/{totalCount} ({percent}%)
        </span>
      </div>
    </div>
  );
}
