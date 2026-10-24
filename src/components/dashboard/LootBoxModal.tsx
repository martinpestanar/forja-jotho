'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, Zap, Coins, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';
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

  const tierColors = {
    1: { border: 'border-[#78716C]', bg: 'from-[#292524] to-[#1C1917]', text: 'text-[#A8A29E]', badge: 'bg-[#44403C]' },
    2: { border: 'border-[#F59E0B]', bg: 'from-[#78350F] to-[#451A03]', text: 'text-[#F59E0B]', badge: 'bg-[#B45309]' },
    3: { border: 'border-[#06B6D4]', bg: 'from-[#164E63] to-[#083344]', text: 'text-[#06B6D4]', badge: 'bg-[#0E7490]' },
    4: { border: 'border-[#A855F7]', bg: 'from-[#581C87] to-[#1E1B4B]', text: 'text-[#C084FC]', badge: 'bg-[#7E22CE]' },
  }[box.tier] || { border: 'border-[#C5A059]', bg: 'from-[#14171C] to-[#0B0C0E]', text: 'text-[#C5A059]', badge: 'bg-[#C5A059]' };

  // Ritual de Apertura con Presión Sostenida (1.5 segundos)
  const startHold = () => {
    if (opening || openedResult) return;
    clearInterval(holdIntervalRef.current);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        executeOpenBox();
      }
    }, 120);
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
        alert(error.message);
      } else {
        // Dopamina visual masiva
        soundFx.playLevelUp();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#A855F7', '#22C55E', '#FFFFFF'],
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className={`max-w-sm w-full bg-[#14171C] rounded-2xl border-2 ${tierColors.border} p-5 space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.95)] text-[#E2E8F0] relative overflow-hidden`}
      >
        {/* Halo resplandeciente */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded text-white ${tierColors.badge}`}>
              TIER {box.tier}
            </span>
            <h3 className={`text-xs font-black uppercase tracking-wider ${tierColors.text}`}>
              {box.box_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#E2E8F0] p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO: FASE 1 (Cofre Cerrado) o FASE 2 (Recompensas Reveladas) */}
        {!openedResult ? (
          <div className="space-y-4 text-center py-2 relative z-10">
            {/* Ilustración Arcade del Cofre */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-b ${tierColors.bg} border-2 ${tierColors.border} flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.3)] relative`}
            >
              <Gift className={`w-14 h-14 ${tierColors.text} drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]`} />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              </div>
            </motion.div>

            <div>
              <h4 className="text-sm font-black text-[#E2E8F0]">
                Cofre Sagrado de Bienvenida
              </h4>
              <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                Otorgado por el Oráculo al sonar la medianoche (12:01 AM).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B0C0E] border border-white/5 text-xs text-[#94A3B8] leading-relaxed font-mono">
              💎 Rompe el sello sagrado para recibir tus recompensas de rango Diamante.
            </div>

            {/* Botón Mantener Presionado */}
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              className={`w-full relative overflow-hidden py-3.5 bg-[#0B0C0E] border-2 ${tierColors.border} ${tierColors.text} text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer shadow-[0_4px_0_0_#000] active:scale-95 transition-all`}
            >
              <div
                className="absolute inset-0 bg-purple-500/30 transition-all duration-100"
                style={{ width: `${holdProgress}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>
                  {holdProgress > 0 ? `ROMPIENDO SELLO (${holdProgress}%)` : 'MANTÉN PRESIONADO PARA ABRIR'}
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-2 relative z-10">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest font-mono">
                ¡SELLO ROTO CON ÉXITO!
              </span>
              <h4 className="text-base font-black text-[#E2E8F0]">
                Recompensas Desbloqueadas
              </h4>
            </div>

            {/* Grid de Recompensas Dopamínicas */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#C5A059]/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#C5A059]">
                  <Coins className="w-5 h-5" />
                  <span>ORO:</span>
                </div>
                <span className="text-base font-black text-amber-300">+{openedResult.gold || 1000} 💰</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Zap className="w-5 h-5 fill-current" />
                  <span>BATERÍA:</span>
                </div>
                <span className="text-base font-black text-emerald-400">+{openedResult.battery || 60}m 🔋</span>
              </div>
            </div>

            {/* Carta del Pokémon Shiny si lo incluye */}
            {openedResult.pokemon_shiny && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-transparent border border-purple-500/50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-black font-black rounded uppercase">
                    ★ SHINY DESBLOQUEADO
                  </span>
                  <h5 className="font-black text-sm text-[#E2E8F0] mt-0.5 truncate">
                    {openedResult.species_name || 'Totodile Shiny'} (Nv. 15)
                  </h5>
                  <span className="text-[10px] text-purple-300 block font-mono">
                    Transferido a tu equipo de batalla
                  </span>
                </div>
              </div>
            )}

            {/* Ítems entregados */}
            {openedResult.items && (
              <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-white/5 space-y-1 text-[11px] font-mono text-[#94A3B8]">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Suministros:</span>
                {openedResult.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#C5A059] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-black shadow-[0_3px_0_0_#000] active:translate-y-0.5"
            >
              ¡Reclamar y Continuar!
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
