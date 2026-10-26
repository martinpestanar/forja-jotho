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
      {/* Botón flotante estilo Claude Pill */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          soundFx.playClick();
          setIsOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 px-3.5 py-2 rounded-full bg-white border border-[#E8E5DD] text-[#1F1E1B] shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer flex items-center gap-2 hover:border-[#D97043]/40 transition-all active:scale-95"
        title="Consultar al Oráculo de Johto"
      >
        <BrainCircuit className="w-4 h-4 text-[#D97043]" />
        <span className="font-mono text-xs font-semibold text-[#1F1E1B]">Oráculo</span>
      </motion.button>

      {/* Modal / Cuadro de Diálogo Estilo Claude Warm Light */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="max-w-sm w-full bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] text-[#1F1E1B]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DD]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#D97043]/10 text-[#D97043]">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-sm font-semibold tracking-tight text-[#1F1E1B]">
                      El Oráculo de Johto
                    </h3>
                    <span className="text-[10px] text-[#706E66] font-mono block">
                      Tótem {totem} • Memoria Activa
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8A877E] hover:text-[#1F1E1B] p-1 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cuadro de Diálogo Estilo Carta Claude */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs text-[#1F1E1B] leading-relaxed font-editorial min-h-[70px] flex items-center">
                {loading ? (
                  <div className="flex items-center gap-2 text-[#D97043] font-mono">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>El Oráculo está meditando...</span>
                  </div>
                ) : (
                  <span>
                    {oracleReply
                      ? `"${oracleReply}"`
                      : `"${profileData?.leader_name || 'Entrenador'}, el Tótem ${totem} observa tu marcha. ¿Qué duda o marea inquieta hoy tu disciplina?"`}
                  </span>
                )}
              </div>

              {/* Formulario de Consulta */}
              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej. ¿Cómo entro en la zona de flujo hoy?"
                  disabled={loading}
                  className="flex-1 bg-[#FAF9F5] border border-[#E8E5DD] rounded-xl px-3 py-2 text-xs text-[#1F1E1B] focus:outline-none focus:border-[#D97043] font-sans"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white font-semibold text-xs cursor-pointer disabled:opacity-40 transition-all shadow-sm active:scale-95"
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
