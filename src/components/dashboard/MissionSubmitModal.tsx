'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  X, 
  Award, 
  Sparkles, 
  Link as LinkIcon, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { triggerGbaItemInjection } from '@/lib/gba/PokemonMemoryBridge';
import { HNS_ITEM_IDS } from '@/lib/gba/gbaSaveEngine';

interface QuickCard {
  id: number;
  question: string;
  options: { text: string; isCorrect: boolean }[];
}

const QUICK_CARDS: QuickCard[] = [
  {
    id: 1,
    question: '¿Qué método de autenticación protege las consultas del frontend?',
    options: [
      { text: 'Supabase JWT + Row Level Security', isCorrect: true },
      { text: 'Guardar la contraseña en localStorage', isCorrect: false },
    ],
  },
  {
    id: 2,
    question: '¿Dónde se ejecuta la lógica matemática de saldo y batería?',
    options: [
      { text: 'En PostgreSQL mediante funciones RPC seguras', isCorrect: true },
      { text: 'En una variable de estado en el navegador', isCorrect: false },
    ],
  },
  {
    id: 3,
    question: '¿Cómo se notifica el avance del alumno a WhatsApp?',
    options: [
      { text: 'Trigger pg_net en Supabase -> Dispatcher n8n', isCorrect: true },
      { text: 'Un popup manual de alerta en pantalla', isCorrect: false },
    ],
  },
];

interface MissionSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId?: string;
  missionTitle?: string;
}

export const MissionSubmitModal: React.FC<MissionSubmitModalProps> = ({
  isOpen,
  onClose,
  missionId = 'LVL1_ZEPHYR_GYM',
  missionTitle = 'Gimnasio Malva - Medalla Céfiro',
}) => {
  const grantRewardRpc = useTrainerStore((s) => s.grantActivityRewardRpc);

  const [projectUrl, setProjectUrl] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<boolean[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectOption = (isCorrect: boolean) => {
    soundFx.playClick();
    const updated = [...selectedAnswers, isCorrect];
    setSelectedAnswers(updated);

    if (currentStep + 1 < QUICK_CARDS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Verificar si aprobó las 3 tarjetas
      const allPassed = updated.every(Boolean);
      if (allPassed) {
        completeMission();
      } else {
        soundFx.playHit();
        alert('Una o más respuestas no fueron correctas. ¡Repasa la arquitectura y reintenta!');
        setCurrentStep(0);
        setSelectedAnswers([]);
      }
    }
  };

  const completeMission = async () => {
    setIsSubmitting(true);
    soundFx.playFanfare();

    // Lluvia de confeti triunfal en toda la pantalla
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#F59E0B', '#10B981', '#06B6D4', '#EC4899'],
    });

    try {
      await grantRewardRpc('mission_complete', missionId, projectUrl);
      
      // DROP MÉDICO ACADÉMICO: Inyección directa de medicinas a la mochila GBA
      // El alumno gana 1x Poción y 1x Superpoción (ahorrando ₽4,700 de las tiendas)
      triggerGbaItemInjection(HNS_ITEM_IDS.POTION, 1, 'ITEMS', 'Poción de Código');
      triggerGbaItemInjection(HNS_ITEM_IDS.SUPER_POTION, 1, 'ITEMS', 'Superpoción de Maestría');

      setIsSuccess(true);
    } catch (err) {
      console.error('Error al completar misión:', err);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCard = QUICK_CARDS[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono text-slate-100">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-[#0e1526] border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative overflow-hidden"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div className="space-y-5">
            {/* Cabecera */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Entrega de Misión & Sello de Medalla
                </span>
                <h3 className="text-base font-black text-slate-100">{missionTitle}</h3>
              </div>
            </div>

            {/* Input URL del Proyecto */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                <span>URL de tu Proyecto en Antigravity:</span>
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://antigravity.dev/mi-proyecto"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold focus:outline-none"
              />
            </div>

            {/* 3 Tarjetas Interactivas de Opción Rápida */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>TEST DE MAESTRÍA RÁPIDA:</span>
                <span className="font-bold text-amber-400">
                  TARJETA {currentStep + 1} DE {QUICK_CARDS.length}
                </span>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                <p className="text-xs sm:text-sm font-bold text-slate-100 mb-3 leading-relaxed">
                  &ldquo;{currentCard.question}&rdquo;
                </p>

                <div className="space-y-2">
                  {currentCard.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt.isCorrect)}
                      className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 rounded-lg text-xs text-left font-bold text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <span>{opt.text}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sello de Medalla con Impacto 3D */
          <div className="text-center py-6 space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.8)] flex items-center justify-center text-slate-950"
            >
              <Award className="w-14 h-14 fill-amber-300 text-amber-950" />
            </motion.div>

            <div>
              <h3 className="text-xl font-black text-amber-300 uppercase tracking-widest">
                ¡MEDALLA CÉFIRO SELLADA!
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                Has demostrado dominio en la arquitectura de la red. Recompensas acreditadas en tu perfil:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto text-center font-bold text-xs">
              <div className="p-2 bg-slate-900 border border-amber-500/40 rounded-lg text-amber-300">
                +100 ₽
              </div>
              <div className="p-2 bg-slate-900 border border-cyan-500/40 rounded-lg text-cyan-300">
                +15m 🔋
              </div>
              <div className="p-2 bg-slate-900 border border-emerald-500/40 rounded-lg text-emerald-300">
                +50 🥚
              </div>
            </div>

            {/* Drop Médico Académico Prohibitivo */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-2 border-emerald-500/70 rounded-xl text-left max-w-sm mx-auto shadow-lg">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs uppercase">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                <span>🎁 Drop Médico Académico:</span>
              </div>
              <div className="text-[11px] font-bold text-slate-200 mt-1 flex items-center justify-between">
                <span>• 1x Poción + 1x Superpoción</span>
                <span className="text-amber-400 font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Ahorro: ₽4,700
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Inyectado directamente a tu Mochila GBA. ¡Úsalas con sabiduría táctica!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all cursor-pointer"
            >
              Continuar la Aventura
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
