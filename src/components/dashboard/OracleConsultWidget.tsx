'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface OracleConsultWidgetProps {
  profileData?: any;
}

export const OracleConsultWidget: React.FC<OracleConsultWidgetProps> = ({ profileData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [oracleReply, setOracleReply] = useState<string | null>(null);

  const totem = profileData?.guide_totem?.toUpperCase() || 'OSO';

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    soundFx.playClick();
    const query = prompt.trim();
    setPrompt('');

    try {
      const res = await fetch('/api/ai-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dialogue',
          prompt: query,
          userContext: {
            leader_name: profileData?.leader_name || 'Guerrero',
            guide_totem: totem,
            streak_fire_days: profileData?.streak_fire_days ?? 0,
            temperance_streak_days: profileData?.temperance_streak_days ?? 0,
            battery_minutes: profileData?.battery_minutes ?? 0,
          },
        }),
      });

      const data = await res.json();
      if (data?.message) {
        soundFx.playLevelUp();
        setOracleReply(data.message);
      }
    } catch {
      soundFx.playDamage();
      setOracleReply('La señal rúnica vacila. Mantén tu disciplina y vuelve a consultar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante estilo Pokégear Nintendo */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          soundFx.playClick();
          setIsOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 p-3 rounded-full bg-[#14171C] border-2 border-[#C5A059] text-[#C5A059] shadow-[0_4px_15px_rgba(197,160,89,0.4)] cursor-pointer flex items-center gap-2 group active:translate-y-0.5"
        title="Consultar al Oráculo de Johto"
      >
        <BrainCircuit className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline text-xs font-mono font-black uppercase text-[#E2E8F0]">
          Oráculo
        </span>
      </motion.button>

      {/* Modal / Cuadro de Diálogo RPG */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="max-w-sm w-full bg-[#14171C] rounded-2xl border-2 border-[#C5A059] p-5 space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-[#E2E8F0]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059]">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#E2E8F0]">
                      El Oráculo de Johto
                    </h3>
                    <span className="text-[10px] text-[#C5A059] font-mono block">
                      Tótem {totem} • Memoria Activa
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#64748B] hover:text-[#E2E8F0] p-1 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cuadro de Diálogo Estilo Nintendo RPG (Máximo 2 líneas teletipo) */}
              <div className="p-3.5 rounded-xl bg-[#0B0C0E] border-2 border-[#C5A059]/40 text-xs text-[#CBD5E1] leading-relaxed font-mono shadow-inner min-h-[70px] flex items-center">
                {loading ? (
                  <div className="flex items-center gap-2 text-[#C5A059] animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>El Oráculo está consultando las runas...</span>
                  </div>
                ) : (
                  <span>
                    {oracleReply
                      ? `"${oracleReply}"`
                      : `"${profileData?.leader_name || 'Guerrero'}, el Tótem ${totem} observa tu marcha. ¿Qué duda o asedio inquieta hoy tu disciplina?"`}
                  </span>
                )}
              </div>

              {/* Formulario de Consulta */}
              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej. ¿Cómo resisto el cansancio hoy?"
                  disabled={loading}
                  className="flex-1 bg-[#0B0C0E] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059] font-sans"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4b069] text-black font-black text-xs cursor-pointer disabled:opacity-40 transition-all border border-black shadow-[0_2px_0_0_#000] active:translate-y-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
