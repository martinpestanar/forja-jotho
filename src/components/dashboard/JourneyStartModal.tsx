'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sunrise, Sparkles, X, Check } from 'lucide-react';
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
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([15, 25]);
      }
      onUpdated(targetDate);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/40 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="max-w-sm w-full bg-white rounded-2xl border border-[#E4E1D8] p-5 space-y-4 shadow-[0_12px_40px_rgba(26,25,21,0.12)] text-[#1C1B18]"
      >
        {/* Cabecera Pop-up Minimalista */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 flex items-center justify-center text-[#9A7025]">
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B18]">
                Apertura de la Forja
              </h3>
              <span className="text-[10px] text-[#9A7025] font-mono font-medium block">
                Fecha de Inicio de Marea
              </span>
            </div>
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

        {/* Diálogo conciso */}
        <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] font-medium leading-relaxed italic">
          "Fija el día en que tu marea de hábitos comienza formalmente para calibrar tu cartucho."
        </div>

        {/* Opciones con Tarjetas Limpias */}
        <div className="space-y-2">
          {/* Opción 1: Mañana con el alba */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('tomorrow'); }}
            className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none active:scale-[0.98] ${
              selectedOption === 'tomorrow'
                ? 'bg-[#C59B46]/10 border-[#C59B46]/40 text-[#1C1B18] shadow-[0_2px_6px_rgba(197,155,70,0.08)]'
                : 'bg-[#FAF9F5] border-[#E4E1D8] text-[#706E66] hover:border-[#D5D1C5] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sunrise className="w-4 h-4 text-[#C59B46]" />
              <div className="text-left">
                <span className="text-xs font-semibold block text-[#1C1B18]">Mañana con el Alba</span>
                <span className="text-[10px] text-[#706E66] block font-mono font-medium">{tomorrowStr} (Recomendado)</span>
              </div>
            </div>
            {selectedOption === 'tomorrow' && <Check className="w-4 h-4 text-[#9A7025] stroke-[2.5]" />}
          </button>

          {/* Opción 2: Hoy mismo */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('today'); }}
            className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none active:scale-[0.98] ${
              selectedOption === 'today'
                ? 'bg-[#2E8555]/10 border-[#2E8555]/30 text-[#1C1B18] shadow-[0_2px_6px_rgba(46,133,85,0.08)]'
                : 'bg-[#FAF9F5] border-[#E4E1D8] text-[#706E66] hover:border-[#D5D1C5] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#2E8555]" />
              <div className="text-left">
                <span className="text-xs font-semibold block text-[#1C1B18]">Comenzar Hoy de Inmediato</span>
                <span className="text-[10px] text-[#706E66] block font-mono font-medium">{todayStr}</span>
              </div>
            </div>
            {selectedOption === 'today' && <Check className="w-4 h-4 text-[#2E8555] stroke-[2.5]" />}
          </button>

          {/* Opción 3: Elegir fecha específica */}
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setSelectedOption('custom'); }}
            className={`w-full p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all select-none active:scale-[0.98] ${
              selectedOption === 'custom'
                ? 'bg-[#2D68C4]/10 border-[#2D68C4]/30 text-[#1C1B18] shadow-[0_2px_6px_rgba(45,104,196,0.08)]'
                : 'bg-[#FAF9F5] border-[#E4E1D8] text-[#706E66] hover:border-[#D5D1C5] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#2D68C4]" />
                <span className="text-xs font-semibold text-[#1C1B18]">Elegir Otra Fecha</span>
              </div>
              {selectedOption === 'custom' && <Check className="w-4 h-4 text-[#2D68C4] stroke-[2.5]" />}
            </div>

            {selectedOption === 'custom' && (
              <input
                type="date"
                min={todayStr}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2 text-xs font-mono font-medium text-[#1C1B18] focus:outline-none focus:border-[#2D68C4]"
              />
            )}
          </button>
        </div>

        {/* Botón Primario de Consagración */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-[#D9383A] text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all disabled:opacity-50"
        >
          {loading ? 'Sellando...' : 'Consagrar Fecha de Inicio'}
        </button>
      </motion.div>
    </div>
  );
};
