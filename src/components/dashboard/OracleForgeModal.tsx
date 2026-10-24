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

  if (!isOpen) return null;

  // Consultar y Forjar a través del Cerebro del Oráculo
  const handleConsultAndForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setEvaluating(true);
    soundFx.playClick();

    try {
      const { data, error } = await supabase.rpc('rpc_valdr_oracle_forge_habit', {
        p_title: title.trim(),
        p_description: description.trim() || 'Hábito consagrado ante la Forja',
        p_category: category,
        p_estimated_minutes: durationMinutes,
      });

      if (error) {
        alert(error.message);
      } else if (data) {
        soundFx.playLevelUp();
        setOracleResult(data);
      }
    } catch (err: any) {
      alert(err.message || 'El Oráculo no pudo conectar con la Forja.');
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl bg-[#14171C] border border-[#C5A059]/60 p-5 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-[#E2E8F0]"
      >
        {/* Cabecera del Oráculo */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-widest text-[#E2E8F0] uppercase">
                EL ORÁCULO DE JOHTO
              </h3>
              <span className="text-[10px] text-[#C5A059] font-mono block -mt-0.5">
                Cerebro de Tasación Rúnica • {totemName}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#E2E8F0] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DIÁLOGO RPG O RESULTADO DEL ORÁCULO */}
        {oracleResult ? (
          <div className="space-y-4">
            {/* Cuadro de Diálogo Estilo Nintendo RPG (Máximo 2 líneas) */}
            <div className="rounded-xl bg-[#0B0C0E] border-2 border-[#C5A059] p-3 shadow-[0_4px_0_0_#000]">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C5A059] font-black uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>DICTAMEN DEL ORÁCULO:</span>
              </div>
              <p className="text-xs text-[#E2E8F0] font-sans leading-relaxed italic">
                "{oracleResult.oracle_judgment}"
              </p>
            </div>

            {/* Veredicto de Tasación */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-[#C5A059]/40">
                <span className="text-[10px] text-[#64748B] block">ORO ASIGNADO</span>
                <span className="text-sm font-black text-[#C5A059]">
                  +{oracleResult.gold_reward} 💰
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-emerald-500/40">
                <span className="text-[10px] text-[#64748B] block">BATERÍA GBA</span>
                <span className="text-sm font-black text-emerald-400">
                  +{oracleResult.battery_reward}m 🔋
                </span>
              </div>
            </div>

            {oracleResult.requires_proof && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 font-mono text-center">
                ⚖️ El Oráculo exigirá comprobante al sellar esta tarea.
              </div>
            )}

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-[#C5A059] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_3px_0_0_#000] active:translate-y-0.5 cursor-pointer"
            >
              Consagrar y Volver a la Forja
            </button>
          </div>
        ) : (
          /* FORMULARIO DE CONSULTA: CERO VALORES NUMÉRICOS MANUALES */
          <form onSubmit={handleConsultAndForge} className="space-y-3.5">
            <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-white/5 text-[11px] text-[#64748B] leading-tight">
              🏛️ <em>El usuario no fija su recompensa.</em> Describe tu batalla; el Oráculo auditará su valor real y equilibrará la economía.
            </div>

            {/* Categoría Rúnica */}
            <div>
              <label className="text-[10px] font-mono text-[#64748B] block mb-1">
                FRENTE DE BATALLA:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {[
                  { id: 'fisico', label: '🏋️ Físico / Vigor' },
                  { id: 'negocio', label: '📹 Negocio / SaaS' },
                  { id: 'mente', label: '🧘 Mente / Lectura' },
                  { id: 'expansion', label: '🦉 Idiomas / Skill' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      category === cat.id
                        ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059] font-bold shadow-[0_2px_0_0_#000]'
                        : 'bg-[#0B0C0E] border-white/10 text-[#64748B]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Título de la disciplina */}
            <div>
              <label className="text-[10px] font-mono text-[#64748B] block mb-1">
                ACCIÓN O DISCIPLINA CONCRETA:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. 45 min pesas intensas, 1 video TikTok..."
                className="w-full bg-[#0B0C0E] border border-white/10 rounded-xl p-2.5 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Tiempo estimado */}
            <div>
              <label className="text-[10px] font-mono text-[#64748B] block mb-1">
                DURACIÓN ESTIMADA:
              </label>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-1.5 rounded-xl border cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-[#C5A059] text-black font-black shadow-[0_2px_0_0_#000]'
                        : 'bg-[#0B0C0E] border-white/10 text-[#64748B]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Supremo de Consulta */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={evaluating || !title.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-amber-500 hover:from-amber-400 hover:to-[#C5A059] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#000] active:translate-y-0.5 active:shadow-[0_2px_0_0_#000] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{evaluating ? 'El Oráculo Pesa tu Alma...' : 'Someter al Oráculo Rúnico'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
