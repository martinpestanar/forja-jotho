'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sunrise, Sparkles, X, Check, ShieldCheck } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';

interface JourneyStartModalProps {
  isOpen: boolean;
  currentStartDate?: string;
  onClose: () => void;
  onUpdated: (newDate: string) => void;
}

export const JourneyStartModal: React.FC<JourneyStartModalProps> = ({
  isOpen,
  currentStartDate,
  onClose,
  onUpdated,
}) => {
  const [selectedOption, setSelectedOption] = useState<'today' | 'tomorrow' | 'custom'>('tomorrow');
  
  // Fechas calculadas
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const inTwoDays = new Date();
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  const inTwoDaysStr = inTwoDays.toISOString().split('T')[0];

  const [customDate, setCustomDate] = useState(inTwoDaysStr);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    soundFx.playClick();

    let targetDate = todayStr;
    if (selectedOption === 'tomorrow') targetDate = tomorrowStr;
    if (selectedOption === 'custom') targetDate = customDate;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('valdr_profiles')
          .update({ journey_start_date: targetDate })
          .eq('id', user.id);
      }

      soundFx.playLevelUp();
      onUpdated(targetDate);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="max-w-sm w-full bg-[#14171C] rounded-2xl border-2 border-[#C5A059] p-5 space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-[#E2E8F0]"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059]">
              <Sunrise className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#E2E8F0]">
                Apertura de la Forja
              </h3>
              <span className="text-[10px] text-[#C5A059] font-mono block">
                Pacto de Consagración
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#E2E8F0] p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diálogo RPG */}
        <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-white/5 text-xs text-[#CBD5E1] leading-relaxed font-mono">
          "Un verdadero guerrero no improvisa a mitad de la noche: fija el alba de su bautismo para iniciar con vigor pleno."
        </div>

        {/* Opciones */}
        <div className="space-y-2">
          {/* Opción 1: Mañana con el alba */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('tomorrow'); }}
            className={`w-full p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              selectedOption === 'tomorrow'
                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#E2E8F0] shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                : 'bg-[#0B0C0E] border-white/10 text-[#64748B] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="text-xs font-black block">Mañana con el Alba</span>
                <span className="text-[10px] text-[#64748B] block font-mono">{tomorrowStr} (Recomendado)</span>
              </div>
            </div>
            {selectedOption === 'tomorrow' && <Check className="w-4 h-4 text-[#C5A059]" />}
          </button>

          {/* Opción 2: Hoy mismo */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('today'); }}
            className={`w-full p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              selectedOption === 'today'
                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#E2E8F0] shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                : 'bg-[#0B0C0E] border-white/10 text-[#64748B] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="text-xs font-black block">Comenzar Hoy de Inmediato</span>
                <span className="text-[10px] text-[#64748B] block font-mono">{todayStr}</span>
              </div>
            </div>
            {selectedOption === 'today' && <Check className="w-4 h-4 text-[#C5A059]" />}
          </button>

          {/* Opción 3: Elegir fecha específica */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('custom'); }}
            className={`w-full p-3 rounded-xl border-2 flex flex-col gap-2 cursor-pointer transition-all ${
              selectedOption === 'custom'
                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#E2E8F0] shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                : 'bg-[#0B0C0E] border-white/10 text-[#64748B] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black">Elegir Otra Fecha</span>
              </div>
              {selectedOption === 'custom' && <Check className="w-4 h-4 text-[#C5A059]" />}
            </div>

            {selectedOption === 'custom' && (
              <input
                type="date"
                min={todayStr}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-white/20 rounded-lg p-2 text-xs font-mono text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
              />
            )}
          </button>
        </div>

        {/* Botón Consagrar */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-[#C5A059] hover:bg-[#d4b069] text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-black shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none"
        >
          {loading ? 'Sellando...' : 'Consagrar Fecha de Inicio'}
        </button>
      </motion.div>
    </div>
  );
};
