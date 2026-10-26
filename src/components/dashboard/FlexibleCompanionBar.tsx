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
    <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3.5 space-y-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Compass className="w-4 h-4 shrink-0 text-[#D97043]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider font-mono text-[#D97043] truncate">
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
              className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[#706E66] hover:text-[#1F1E1B] font-mono transition-colors"
            >
              📖 Guía
            </button>
          )}
          {onOpenJournal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenJournal();
              }}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[#706E66] hover:text-[#1F1E1B] font-mono transition-colors"
            >
              ✍️ Diario
            </button>
          )}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenGrimoire();
            }}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[#D97043] font-mono font-medium hover:bg-[#F2EFE9] transition-colors shrink-0"
          >
            📜 Grimorio
          </button>
        </div>
      </div>

      <p className="font-editorial text-xs text-[#1F1E1B] leading-relaxed">
        {tone.message}
      </p>

      {/* Barra de Progreso Fluida Claude */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-[#EAE7DF] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6E8B68] via-[#4A8B99] to-[#D97043]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] font-mono font-medium text-[#706E66] shrink-0">
          {completedCount}/{totalCount} ({percent}%)
        </span>
      </div>
    </div>
  );
}
