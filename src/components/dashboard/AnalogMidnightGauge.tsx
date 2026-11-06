'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface AnalogMidnightGaugeProps {
  timeUntilMidnight: string;
  completionPercent: number;
}

export function AnalogMidnightGauge({
  timeUntilMidnight,
  completionPercent,
}: AnalogMidnightGaugeProps) {
  // Parsear HH:MM:SS para calcular el porcentaje restante de las 24 horas del día
  const [hours, minutes, seconds] = (timeUntilMidnight || '00:00:00')
    .split(':')
    .map((v) => parseInt(v, 10) || 0);

  const totalRemainingSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalDaySeconds = 86400;
  // 1 = Medianoche completa, 0 = Fin del día
  const remainingFraction = Math.max(0, Math.min(1, totalRemainingSeconds / totalDaySeconds));

  // Geometría del Dial Circular SVG (radio 16, circunferencia ~100.5)
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - remainingFraction * circumference;

  return (
    <div className="flex items-center gap-4 select-none">
      {/* 1. Cronógrafo Circular Analógico de Precisión (Teenage Engineering Style) */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#E4E1D8] shadow-[0_2px_6px_rgba(26,25,21,0.03)]">
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            {/* Pista de fondo */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="#EAE7DF"
              strokeWidth="2.5"
            />
            {/* Arco de Cuenta Regresiva de Medianoche */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="#C59B46"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Icono de Reloj en el centro del dial */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="w-3 h-3 text-[#9A7025]" />
          </div>
        </div>

        <div className="text-left">
          <span className="text-[9px] font-mono font-bold text-[#706E66] uppercase tracking-wider block leading-none">
            Asedio Medianoche
          </span>
          <span className="text-xs font-mono font-bold text-[#1C1B18] tabular-nums mt-0.5 block leading-none">
            {timeUntilMidnight || '00:00:00'}
          </span>
        </div>
      </div>

      {/* 2. VU-Meter de Disciplina Global Segmentado */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-[#E4E1D8] shadow-[0_2px_6px_rgba(26,25,21,0.03)] min-w-[190px]">
        <div className="flex-1">
          <div className="flex justify-between items-center text-[9.5px] font-mono font-bold text-[#706E66] mb-1 leading-none">
            <span className="uppercase tracking-wider">Carga Disciplina</span>
            <span className="text-[#1C1B18]">{completionPercent}%</span>
          </div>

          {/* Barra segmentada tipo LED Analógico (10 celdas) */}
          <div className="grid grid-cols-10 gap-1 h-2 w-full">
            {Array.from({ length: 10 }, (_, i) => {
              const segmentThreshold = (i + 1) * 10;
              const isFilled = completionPercent >= segmentThreshold;
              // Color de advertencia o victoria Johto
              const activeColor =
                i < 3
                  ? 'bg-[#D9383A]'
                  : i < 7
                  ? 'bg-[#C59B46]'
                  : 'bg-[#2E8555]';

              return (
                <div
                  key={i}
                  className={`h-full rounded-xs transition-all duration-300 ${
                    isFilled
                      ? `${activeColor} shadow-xs`
                      : 'bg-[#EAE7DF]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
