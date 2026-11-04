'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, X, Coins, Battery } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export interface LootBoxData {
  id: string;
  tier: number; // 1: Hierro, 2: Ámbar, 3: Zafiro, 4: Diamante
  box_name: string;
  source_reason: string;
  is_opened: boolean;
  available_at: string;
  rewards_payload: {
    gold?: number;
    battery?: number;
    pokemon_shiny?: boolean;
    species_name?: string;
    items?: string[];
  };
}

interface LootBoxModalProps {
  box: LootBoxData;
  isOpen: boolean;
  onClose: () => void;
  onOpened: () => void;
}

export const LootBoxModal: React.FC<LootBoxModalProps> = ({
  box,
  isOpen,
  onClose,
  onOpened,
}) => {
  const [opening, setOpening] = useState(false);
  const [openedResult, setOpenedResult] = useState<any | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  if (!isOpen) return null;

  // Paleta Johto Heritage para tiers
  const tierThemes = {
    1: { badge: 'bg-[#706E66]/10 text-[#706E66] border-[#706E66]/20' },
    2: { badge: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25' },
    3: { badge: 'bg-[#2D68C4]/10 text-[#2D68C4] border-[#2D68C4]/20' },
    4: { badge: 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/20' },
  }[box.tier] || { badge: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25' };

  // Ritual de Apertura con Presión Sostenida (1.2 segundos)
  const startHold = () => {
    if (opening || openedResult) return;
    clearInterval(holdIntervalRef.current);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        executeOpenBox();
      }
    }, 110);
  };

  const cancelHold = () => {
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const executeOpenBox = async () => {
    setOpening(true);
    soundFx.playCoin();

    try {
      const { data, error } = await supabase.rpc('rpc_valdr_open_loot_box', {
        p_box_id: box.id,
      });

      if (error) {
        soundFx.playDamage();
        alert(error.message);
      } else {
        soundFx.playLevelUp();
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.5 },
          colors: ['#C59B46', '#D9383A', '#2E8555', '#2D68C4', '#FAF9F5'],
        });

        setOpenedResult(data?.rewards || box.rewards_payload);
        onOpened();
      }
    } catch (err: any) {
      alert(err.message || 'Error al abrir el cofre');
    } finally {
      setOpening(false);
      setHoldProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/40 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="max-w-sm w-full bg-white rounded-2xl border border-[#E4E1D8] p-5 space-y-4 shadow-[0_12px_40px_rgba(26,25,21,0.12)] text-[#1C1B18] relative overflow-hidden"
      >
        {/* Cabecera Pop-up Minimalista */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md border ${tierThemes.badge}`}>
              TIER {box.tier}
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B18]">
              {box.box_name}
            </h3>
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

        {/* CONTENIDO: FASE 1 (Cerrado) o FASE 2 (Recompensas) */}
        {!openedResult ? (
          <div className="space-y-4 text-center py-1">
            {/* Ilustración de Hardware del Cofre */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-20 h-20 mx-auto rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-center relative"
            >
              <Gift className="w-10 h-10 text-[#D9383A] stroke-[1.9]" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-[#C59B46] fill-[#C59B46]" />
              </div>
            </motion.div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#1C1B18]">
                Cofre de Disciplina Johto
              </h4>
              <p className="text-xs text-[#706E66] font-mono">
                Otorgado por consistencia diaria completada.
              </p>
            </div>

            {/* Cuadro de texto conciso */}
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] font-medium leading-snug">
              🎁 Mantén presionado el botón para abrir el botín y transferir tus recompensas.
            </div>

            {/* Botón Mantener Presionado Refinado */}
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
                  {holdProgress > 0 ? `ABRIENDO (${holdProgress}%)` : 'MANTÉN PULSADO PARA ABRIR'}
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-mono font-medium uppercase text-[#2E8555] tracking-widest">
                ¡COFRE ABIERTO!
              </span>
              <h4 className="text-sm font-semibold text-[#1C1B18]">
                Recompensas Desbloqueadas
              </h4>
            </div>

            {/* Grid de Recompensas */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-medium">
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-between shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#9A7025]">
                  <Coins className="w-4 h-4 text-[#C59B46]" />
                  <span>ORO:</span>
                </div>
                <span className="text-sm font-semibold text-[#9A7025] tabular-nums">+{openedResult.gold || 500} 💰</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-between shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#2D68C4]">
                  <Battery className="w-4 h-4 stroke-[2.2]" />
                  <span>GBA:</span>
                </div>
                <span className="text-sm font-semibold text-[#2D68C4] tabular-nums">+{openedResult.battery || 30}m 🔋</span>
              </div>
            </div>

            {/* Recompensa Shiny si existe */}
            {openedResult.pokemon_shiny && (
              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#C59B46]/30 shadow-[0_2px_6px_rgba(197,155,70,0.08)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E1D8] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#C59B46] fill-[#C59B46]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#C59B46]/15 text-[#9A7025] font-mono font-medium rounded uppercase">
                    ★ SHINY DESBLOQUEADO
                  </span>
                  <h5 className="font-semibold text-xs text-[#1C1B18] mt-0.5 truncate">
                    {openedResult.species_name || 'Totodile Shiny'}
                  </h5>
                </div>
              </div>
            )}

            {/* Botón Reclamar Recompensas */}
            <button
              onClick={() => {
                soundFx.playLevelUp();
                onClose();
              }}
              className="w-full py-3 bg-[#D9383A] text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all"
            >
              Reclamar Recompensas
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
