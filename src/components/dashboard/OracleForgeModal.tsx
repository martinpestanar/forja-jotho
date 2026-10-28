'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ShieldAlert, Check, Flame, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

interface OracleForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForged: () => void;
  totemName?: string;
}

export function OracleForgeModal({
  isOpen,
  onClose,
  onForged,
  totemName = 'OSO',
}: OracleForgeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'fisico' | 'negocio' | 'mente' | 'expansion'>('fisico');
  const [durationMinutes, setDurationMinutes] = useState(30);
  
  const [evaluating, setEvaluating] = useState(false);
  const [oracleResult, setOracleResult] = useState<{
    gold_reward: number;
    battery_reward: number;
    requires_proof: boolean;
    oracle_judgment: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Consultar y Forjar a través del Cerebro del Oráculo (Gemini 2.5 Flash + Supabase)
  const handleConsultAndForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setEvaluating(true);
    soundFx.playClick();

    try {
      // 1. Obtener contexto del usuario desde Supabase
      const { data: { user } } = await supabase.auth.getUser();
      let userContext = {};
      if (user) {
        const { data: prof } = await supabase
          .from('valdr_profiles')
          .select('leader_name, guide_totem, sovereignty_gold, battery_minutes, streak_fire_days, temperance_streak_days')
          .eq('id', user.id)
          .single();
        if (prof) userContext = prof;
      }

      // 2. Tasación en tiempo real con Gemini 2.5 Flash
      const aiResponse = await fetch('/api/ai-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_habit',
          habitData: {
            title: title.trim(),
            description: description.trim(),
            category,
            durationMinutes,
          },
          userContext,
        }),
      });

      const aiData = await aiResponse.json();
      const evaluation = aiData?.data || {
        gold_reward: category === 'negocio' ? 100 : category === 'fisico' ? 70 : 40,
        battery_reward: category === 'negocio' ? 30 : category === 'fisico' ? 45 : 15,
        requires_proof: category === 'negocio',
        oracle_judgment: `El Tótem ${totemName} aprueba tu voto rúnico.`,
      };

      // 3. Registrar el hábito evaluado en Supabase
      if (user) {
        const habitId = `custom_${Date.now()}`;
        await supabase.from('valdr_habits_catalog').insert({
          id: habitId,
          user_id: user.id,
          front_type: 'vigor',
          title: title.trim(),
          subtitle: description.trim() || 'Hábito sellado ante el Oráculo',
          duration_minutes: durationMinutes,
          gold_reward: evaluation.gold_reward,
          game_battery_reward: evaluation.battery_reward,
          requires_proof: evaluation.requires_proof,
          is_custom: true,
          sort_order: 99,
        });
      }

      soundFx.playLevelUp();
      setErrorMessage(null);
      setOracleResult(evaluation);
    } catch (err: any) {
      soundFx.playDamage();
      setErrorMessage(err.message || 'El Oráculo no pudo conectar con la Forja.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinish = () => {
    setOracleResult(null);
    setTitle('');
    setDescription('');
    onClose();
    onForged();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl bg-white border border-[#E8E5DD] p-5 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] text-[#1F1E1B]"
      >
        {/* Cabecera del Creador de Retos */}
        <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043]">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-sm font-semibold tracking-tight text-[#1F1E1B]">
                Nuevo Reto Semanal
              </h3>
              <span className="text-[10px] text-[#706E66] font-mono block -mt-0.5">
                Personalizado para tu semana • {totemName}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8A877E] hover:text-[#1F1E1B] cursor-pointer p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje de error / aviso nativo */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-600 hover:text-rose-800 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* DIÁLOGO RESULTADO */}
        {oracleResult ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D97043] font-semibold uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Dictamen del Reto:</span>
              </div>
              <p className="font-editorial text-xs text-[#1F1E1B] leading-relaxed italic">
                "{oracleResult.oracle_judgment}"
              </p>
            </div>

            {/* Veredicto de Tasación */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
                <span className="text-[10px] text-[#706E66] block">POKÉDÓLARES</span>
                <span className="text-sm font-semibold text-[#A6752C] tabular-nums">
                  +{oracleResult.gold_reward} ₽
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
                <span className="text-[10px] text-[#706E66] block">BATERÍA GBA</span>
                <span className="text-sm font-semibold text-[#5B7855] tabular-nums">
                  +{oracleResult.battery_reward}m 🔋
                </span>
              </div>
            </div>

            {oracleResult.requires_proof && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-mono text-center">
                ⚖️ Se solicitará comprobante al marcar este reto.
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[#D97043] hover:bg-[#CC6437] text-white font-semibold text-xs tracking-wide rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Activar Reto en mi Semana
            </button>
          </div>
        ) : (
          /* FORMULARIO DE CONSULTA INTUITIVO */
          <form onSubmit={handleConsultAndForge} className="space-y-3.5">
            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-[11px] text-[#706E66] leading-relaxed">
              Describe lo que quieres cumplir esta semana. La IA equilibrará automáticamente los minutos de juego y conchas.
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[10px] font-mono text-[#706E66] block mb-1">
                ÁREA DEL RETO:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {[
                  { id: 'fisico', label: '🏋️ Físico / Gym' },
                  { id: 'negocio', label: '📹 Negocio / Trabajo' },
                  { id: 'mente', label: '🧘 Mente / Lectura' },
                  { id: 'expansion', label: '🦉 Idioma / Skill' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      category === cat.id
                        ? 'bg-[#D97043]/10 border-[#D97043] text-[#D97043] font-semibold'
                        : 'bg-[#FAF9F5] border-[#E8E5DD] text-[#706E66]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Título de la disciplina */}
            <div>
              <label className="text-[10px] font-mono text-[#706E66] block mb-1">
                ¿QUÉ ACCIÓN VAS A REALIZAR?
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. 45 min de gym, grabar 1 video, leer 20 min..."
                className="w-full bg-[#FAF9F5] border border-[#E8E5DD] rounded-xl p-2.5 text-xs text-[#1F1E1B] focus:outline-none focus:border-[#D97043] font-sans"
              />
            </div>

            {/* Tiempo estimado */}
            <div>
              <label className="text-[10px] font-mono text-[#706E66] block mb-1">
                TIEMPO APROXIMADO:
              </label>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-1.5 rounded-xl border cursor-pointer transition-all ${
                      durationMinutes === mins
                        ? 'bg-[#D97043] text-white font-semibold shadow-sm'
                        : 'bg-[#FAF9F5] border-[#E8E5DD] text-[#706E66]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de Guardar */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={evaluating || !title.trim()}
                className="w-full py-3 bg-[#D97043] hover:bg-[#CC6437] text-white font-semibold text-xs tracking-wide rounded-xl shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{evaluating ? 'Equilibrando tu Reto...' : 'Guardar y Activar Reto'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
