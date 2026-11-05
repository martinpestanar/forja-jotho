'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { soundFx } from '@/lib/soundFx';

interface DopamineHoldButtonProps {
  onComplete: () => void;
  holdDurationMs?: number;
  label?: string;
  completedLabel?: string;
  holdingLabelPrefix?: string;
  disabled?: boolean;
  colorScheme?: 'red' | 'gold' | 'sapphire' | 'green';
  className?: string;
}

export function DopamineHoldButton({
  onComplete,
  holdDurationMs = 3000,
  label = 'MANTÉN PRESIONADO PARA SELLAR',
  completedLabel = '¡COMPROMISO SELLADO!',
  holdingLabelPrefix = 'SELLANDO',
  disabled = false,
  colorScheme = 'red',
  className = '',
}: DopamineHoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastVibeRef = useRef<number>(0);

  // Paleta de colores según "Johto Heritage"
  const colorStyles = {
    red: {
      bg: 'bg-[#D9383A] hover:bg-[#C92F31]',
      border: 'border-[#B22B2D]',
      shadow: 'shadow-[0_2px_0px_#A02426]',
      fill: 'bg-black/25',
      ripple: 'bg-white/20',
    },
    gold: {
      bg: 'bg-[#C59B46] hover:bg-[#B38B38]',
      border: 'border-[#9E7728]',
      shadow: 'shadow-[0_2px_0px_#8A661F]',
      fill: 'bg-black/20',
      ripple: 'bg-white/25',
    },
    sapphire: {
      bg: 'bg-[#2D68C4] hover:bg-[#255BB0]',
      border: 'border-[#1F4E99]',
      shadow: 'shadow-[0_2px_0px_#1A407E]',
      fill: 'bg-black/25',
      ripple: 'bg-white/20',
    },
    green: {
      bg: 'bg-[#2E8555] hover:bg-[#257347]',
      border: 'border-[#1E613B]',
      shadow: 'shadow-[0_2px_0px_#185030]',
      fill: 'bg-black/25',
      ripple: 'bg-white/20',
    },
  }[colorScheme];

  const triggerHaptic = useCallback((progressPercent: number) => {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    const now = Date.now();
    // Aumentar la frecuencia de vibración conforme avanza la barra
    const interval = progressPercent > 80 ? 60 : progressPercent > 50 ? 110 : 180;
    if (now - lastVibeRef.current > interval) {
      lastVibeRef.current = now;
      navigator.vibrate(progressPercent > 85 ? 40 : 20);
    }
  }, []);

  const startHold = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || isCompleted) return;
      e.preventDefault();
      setIsHolding(true);
      startTimeRef.current = Date.now();
      soundFx.playClick();

      const loop = () => {
        if (!startTimeRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const currentPercent = Math.min(100, Math.round((elapsed / holdDurationMs) * 100));
        setProgress(currentPercent);
        triggerHaptic(currentPercent);

        // Micro sonido de bip analógico cada 25%
        if (currentPercent > 0 && currentPercent % 25 === 0 && currentPercent < 100) {
          soundFx.playDialogBeep();
        }

        if (currentPercent >= 100) {
          setIsHolding(false);
          setIsCompleted(true);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 60, 100]);
          }
          soundFx.playFanfare();
          onComplete();
          return;
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    },
    [disabled, isCompleted, holdDurationMs, triggerHaptic, onComplete]
  );

  const cancelHold = useCallback(() => {
    if (isCompleted) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, [isCompleted]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled || isCompleted}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className={`relative w-full overflow-hidden select-none py-3.5 px-4 rounded-xl text-white font-mono text-xs font-bold tracking-wider border cursor-pointer transition-all duration-75 active:scale-[0.99] ${
        colorStyles.bg
      } ${colorStyles.border} ${colorStyles.shadow} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Barra de progreso de llenado fluido */}
      <div
        className={`absolute inset-0 ${colorStyles.fill} transition-[width] ease-linear duration-75`}
        style={{ width: `${progress}%` }}
      />

      {/* Brillo sutil al presionar */}
      {isHolding && (
        <div className={`absolute inset-0 ${colorStyles.ripple} animate-pulse pointer-events-none`} />
      )}

      {/* Contenido del Botón */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isCompleted ? (
          <span className="flex items-center gap-1.5 text-white">
            <span>✓</span> {completedLabel}
          </span>
        ) : isHolding ? (
          <span className="flex items-center gap-1.5 tabular-nums tracking-widest animate-pulse">
            <span>●</span> {holdingLabelPrefix} ({progress}%)
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] opacity-75">▶</span>
            {label}
          </span>
        )}
      </div>
    </button>
  );
}
