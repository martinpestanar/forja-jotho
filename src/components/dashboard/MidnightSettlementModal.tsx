'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Archive, Sparkles, X, Coins, Battery, Award, Flame, ArrowRight } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';

export interface MidnightSettlementData {
  yesterdayDate: string;
  goldSettled: number;
  batterySettled: number;
  tasksCompleted: number;
  totalTasks: number;
  allPillarsBonus: boolean;
  streakDays: number;
}

interface MidnightSettlementModalProps {
  data: MidnightSettlementData;
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
}

export function MidnightSettlementModal({
  data,
  isOpen,
  onClose,
  onClaim,
}: MidnightSettlementModalProps) {
  const [opening, setOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  if (!isOpen) return null;

  // Ritual de Mantener Pulsado estilo Analogue Pocket
  const startHold = () => {
    if (opening || isOpened) return;
    clearInterval(holdIntervalRef.current);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(18);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        executeOpen();
      }
    }, 90);
  };

  const cancelHold = () => {
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const executeOpen = () => {
    setOpening(true);
    soundFx.playLevelUp();

    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.55 },
      colors: ['#C59B46', '#D9383A', '#2E8555', '#2D68C4', '#FAF9F5'],
    });

    setIsOpened(true);
    setOpening(false);
    setHoldProgress(0);
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/40 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="max-w-sm w-full bg-white rounded-2xl border border-[#E4E1D8] p-5 space-y-4 shadow-[0_16px_48px_rgba(26,25,21,0.14)] text-[#1C1B18] relative overflow-hidden"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#C59B46]/10 text-[#9A7025] border border-[#C59B46]/25">
              12:00 AM SETTLEMENT
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1B18]">
              Alijo Nocturno
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-lg border border-[#E4E1D8] bg-[#FAF9F5] text-[#706E66] hover:text-[#1C1B18] hover:bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* FASE 1: Cofre cerrado - Mantener presionado */}
        {!isOpened ? (
          <div className="space-y-4 text-center py-1">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-20 h-20 mx-auto rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-center relative"
            >
              <Archive className="w-10 h-10 text-[#C59B46] stroke-[1.9]" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-[#C59B46] fill-[#C59B46]" />
              </div>
            </motion.div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#1C1B18]">
                Liquidación de Medianoche Lista
              </h4>
              <p className="text-xs text-[#706E66] font-mono leading-relaxed">
                Tus misiones de ayer fueron auditadas por la Torre Bellsprout.
              </p>
            </div>

            {/* Resumen preliminar */}
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-[#706E66]">
                <span>Misiones completadas:</span>
                <strong className="text-[#1C1B18]">
                  {data.tasksCompleted}/{data.totalTasks}
                </strong>
              </div>
              <div className="flex justify-between text-[#706E66]">
                <span>Racha sostenida:</span>
                <strong className="text-[#D9383A] flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" />
                  {data.streakDays} días
                </strong>
              </div>
            </div>

            {/* Botón táctil de presión sostenida */}
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              className="w-full relative overflow-hidden py-3 bg-[#C59B46] text-white font-semibold text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-[0_2px_0px_#A07828] active:translate-y-[1px] active:shadow-none hover:bg-[#B78E3C] transition-all select-none"
            >
              <div
                className="absolute inset-0 bg-[#D9383A]/30 transition-all duration-100"
                style={{ width: `${holdProgress}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>
                  {holdProgress > 0 ? `ROMPIENDO SELLO (${holdProgress}%)` : 'MANTÉN PULSADO PARA ABRIR'}
                </span>
              </span>
            </button>
          </div>
        ) : (
          /* FASE 2: Botín liberado */
          <div className="space-y-4 py-1">
            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-mono font-medium uppercase text-[#2E8555] tracking-widest">
                ¡ALIJO LIQUIDADO CON ÉXITO!
              </span>
              <h4 className="text-sm font-semibold text-[#1C1B18]">
                Botín Acreditado a tu Cuenta
              </h4>
            </div>

            {/* Grid de Recompensas Acreditadas */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-medium">
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-between shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#9A7025]">
                  <Coins className="w-4 h-4 text-[#C59B46]" />
                  <span>ORO:</span>
                </div>
                <span className="text-sm font-semibold text-[#9A7025] tabular-nums">
                  +{data.goldSettled} ₽
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-between shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#2D68C4]">
                  <Battery className="w-4 h-4 stroke-[2.2]" />
                  <span>GBA:</span>
                </div>
                <span className="text-sm font-semibold text-[#2D68C4] tabular-nums">
                  +{data.batterySettled}m
                </span>
              </div>
            </div>

            {/* Bonus de 4 Pilares si cumplió todos */}
            {data.allPillarsBonus && (
              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#C59B46]/30 shadow-[0_2px_6px_rgba(197,155,70,0.08)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E4E1D8] flex items-center justify-center shrink-0 text-[#C59B46]">
                  <Award className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#C59B46]/15 text-[#9A7025] font-mono font-bold rounded uppercase">
                    ★ 4 PILARES CONQUISTADOS
                  </span>
                  <p className="text-[11px] font-mono text-[#1C1B18] mt-0.5">
                    Multiplicador 1.25x de Templanza aplicado.
                  </p>
                </div>
              </div>
            )}

            {/* Botón Comenzar Nuevo Día */}
            <button
              type="button"
              onClick={() => {
                soundFx.playLevelUp();
                onClose();
              }}
              className="w-full py-3 bg-[#D9383A] text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all flex items-center justify-center gap-1.5"
            >
              <span>INICIAR NUEVO DÍA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
