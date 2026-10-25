'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Feather, 
  X, 
  Trophy, 
  HeartHandshake, 
  Target, 
  Sparkles, 
  Coins, 
  Send, 
  Moon, 
  CheckCircle2,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';

interface MidnightJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  leaderName?: string;
  onJournalSaved?: (goldAwarded: number) => void;
}

export function MidnightJournalModal({
  isOpen,
  onClose,
  userId,
  leaderName = 'Martín',
  onJournalSaved,
}: MidnightJournalModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [victories, setVictories] = useState('');
  const [challenges, setChallenges] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [moodRating, setMoodRating] = useState<number>(4);

  const [saving, setSaving] = useState(false);
  const [oracleFeedback, setOracleFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    soundFx.playClick();
    setStep((prev) => (Math.min(4, prev + 1) as any));
  };

  const handlePrev = () => {
    soundFx.playClick();
    setStep((prev) => (Math.max(1, prev - 1) as any));
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);
    soundFx.playClick();

    try {
      // 1. Obtener la devolución terapéutica de Gemini 2.5 Flash
      let feedback = '';
      try {
        const res = await fetch('/api/ai-companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'midnight_journal',
            journalData: {
              victories,
              challenges,
              tomorrow_focus: tomorrowFocus,
              mood_rating: moodRating,
            },
            userContext: {
              leader_name: leaderName,
              guide_totem: 'lobo',
            },
          }),
        });
        const data = await res.json();
        feedback = data?.oracle_feedback || '';
      } catch (err) {
        console.warn('Fallback to local oracle feedback');
        feedback = `Martín, lo que sembraste hoy no se pierde. Descansa sin culpa y mañana continúa forjando tu legado.`;
      }

      setOracleFeedback(feedback);

      // 2. Ejecutar RPC en Supabase para persistir y dar el bono de 50 de oro
      const { data: rpcRes, error: rpcError } = await supabase.rpc('save_midnight_journal', {
        p_user_id: userId,
        p_victories: victories,
        p_challenges: challenges,
        p_tomorrow_focus: tomorrowFocus,
        p_mood: moodRating,
        p_oracle_feedback: feedback,
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
      } else {
        soundFx.playFanfare();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#EC4899', '#38BDF8'],
        });

        if (onJournalSaved) {
          onJournalSaved(rpcRes?.gold_awarded || 50);
        }
      }

      setStep(4);
    } catch (e) {
      console.error('Error submitting journal:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#0F1115] border-2 border-[#C5A059]/40 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-[#14171C] border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-[0_2px_10px_rgba(99,102,241,0.3)]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-black text-sm tracking-wider text-[#E2E8F0] uppercase">
                  DIARIO DE MEDIANOCHE
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  TERAPIA
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] font-mono">
                10 min para vaciar la mente y estructurar tus ideas
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-xl bg-[#14171C] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de pasos */}
        {step < 4 && (
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex gap-2 w-full">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= s ? 'bg-[#C5A059]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* PASO 1: VICTORIAS */}
        {step === 1 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold">
                <Trophy className="w-4 h-4" />
                <span>PASO 1 / 3: LA COSECHA DE VICTORIAS</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#E2E8F0]">
                ¿Qué fue lo mejor que hiciste o lograste hoy?
              </h4>
              <p className="text-xs text-[#94A3B8]">
                Tu mente tiende a olvidar tus triunfos. Escribe tu video subido, tus leads, el avance de tu SaaS o tu tiempo en la terraza.
              </p>
              <textarea
                value={victories}
                onChange={(e) => setVictories(e.target.value)}
                placeholder="Ej. Grabé mi video #55 en TikTok con fluidez, trasplanté 3 tomates Río Grande a baldes de 20L y cumplí mi meditación..."
                className="w-full h-32 bg-[#14171C] border border-[#C5A059]/40 rounded-2xl p-3 text-xs text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="flex justify-end">
              <button
                disabled={!victories.trim()}
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#C5A059] text-black font-black text-xs uppercase tracking-wider disabled:opacity-40"
              >
                Siguiente Paso →
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: DESAHOGO TERAPÉUTICO & ESTADO DE ÁNIMO */}
        {step === 2 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-bold">
                <HeartHandshake className="w-4 h-4" />
                <span>PASO 2 / 3: DESAHOGO SIN FILTRO (TERAPIA)</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#E2E8F0]">
                ¿Qué te frustró, te pesó o te dio pereza hoy?
              </h4>
              <p className="text-xs text-[#94A3B8]">
                Saca la carga mental de tu pecho. Si tuviste ganas de procrastinar o miedo con tus ventas, escríbelo aquí para soltarlo.
              </p>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Ej. Sentí flojera de mandar leads a los salones, pero luego recordé mi meta de $150. A veces me da miedo que no me respondan..."
                className="w-full h-28 bg-[#14171C] border border-rose-500/40 rounded-2xl p-3 text-xs text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-rose-400"
              />

              {/* Selector de Estado de Ánimo */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                  ¿Cómo calificarías tu energía interior hoy?
                </span>
                <div className="flex gap-2">
                  {[
                    { val: 1, label: 'Pesada', icon: Frown },
                    { val: 3, label: 'Neutra', icon: Meh },
                    { val: 5, label: 'Soberana', icon: Smile },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.val}
                        onClick={() => setMoodRating(m.val)}
                        className={`flex-1 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-mono transition-all ${
                          moodRating === m.val
                            ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300'
                            : 'border-white/10 text-[#64748B]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#94A3B8]"
              >
                ← Volver
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#C5A059] text-black font-black text-xs uppercase tracking-wider"
              >
                Siguiente Paso →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: FOCO DE MAÑANA */}
        {step === 3 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold">
                <Target className="w-4 h-4" />
                <span>PASO 3 / 3: LA DIRECTRIZ DE MAÑANA</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#E2E8F0]">
                ¿Cuál es la PRIMERA cosa con la que arrancarás mañana?
              </h4>
              <p className="text-xs text-[#94A3B8]">
                Decídelo ahora para que a las 10:00 AM no tengas dudas ni parálisis por decisión.
              </p>
              <textarea
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder="Ej. Grabar el guion sobre la funcionalidad estrella del SaaS para restaurantes veganos..."
                className="w-full h-28 bg-[#14171C] border border-cyan-500/40 rounded-2xl p-3 text-xs text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#94A3B8]"
              >
                ← Volver
              </button>
              <button
                disabled={saving}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>{saving ? 'Consultando al Oráculo...' : 'Sellar y Escuchar al Oráculo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: DICTAMEN TERAPÉUTICO DEL ORÁCULO */}
        {step === 4 && (
          <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
            <div className="bg-[#14171C] border border-indigo-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  DEVOLUCIÓN DEL ORÁCULO DE JOHTO
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> +50 Oro
                </span>
              </div>

              <p className="text-xs text-[#E2E8F0] leading-relaxed italic border-l-2 border-indigo-400 pl-3">
                &ldquo;{oracleFeedback || 'Has sellado tu día con verdad, Martín. Suelta el peso del mundo y reposa.'}&rdquo;
              </p>

              <div className="pt-2 border-t border-white/5 text-[11px] text-[#94A3B8] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entrada guardada en tu libro sagrado de Supabase.</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md"
            >
              Apagar la Pantalla y Reposar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
