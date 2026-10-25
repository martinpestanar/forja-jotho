'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Gamepad2, 
  BookOpen, 
  Feather, 
  ShieldCheck, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface SovereignTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderName?: string;
}

export function SovereignTutorialModal({
  isOpen,
  onClose,
  leaderName = 'Martín',
}: SovereignTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '¡Bienvenido a tu Forja, Martín!',
      tag: 'PASO 1 / 4',
      badge: 'PROPÓSITO & PACTO',
      icon: Flame,
      color: 'from-amber-500/20 to-[#14171C]',
      iconColor: 'text-[#C5A059]',
      borderColor: 'border-[#C5A059]/50',
      description: 'Esta no es una app de tareas aburrida. Es tu muralla de disciplina de 30 días. Aquí tu esfuerzo en la vida real te da Oro de Johto y batería para jugar Pokémon GBA.',
      tips: [
        'Tienes 5 Pilares Sagrados (Vigor, TikTok + Leads, SaaS Vegano + Salones, Terraza y Templanza).',
        'Tus horarios son 100% flexibles: fluye a tu propio ritmo a lo largo del día.'
      ]
    },
    {
      title: 'Tus Dos Compañeros Diarios',
      tag: 'PASO 2 / 4',
      badge: 'INSPIRACIÓN & RESCATE',
      icon: BookOpen,
      color: 'from-pink-500/20 to-[#14171C]',
      iconColor: 'text-pink-400',
      borderColor: 'border-pink-500/50',
      description: 'En la barra superior siempre tendrás 2 accesos directos vitales para tu mente:',
      tips: [
        '📖 Grimorio: Tu Ebook interactivo con tu manifiesto, el botón SOS para calmar la mente y el Modo Terraza para tus 10 tomates Río Grande.',
        '✍️ Diario (12:00 AM): 10 minutos para vaciar tus victorias, desahogarte y recibir el consejo terapéutico del Oráculo.'
      ]
    },
    {
      title: 'El Sello Rúnico & Las Recompensas',
      tag: 'PASO 3 / 4',
      badge: 'DOPAMINA REAL',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-[#14171C]',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/50',
      description: 'Cada vez que cumplas un pilar en tu día a día:',
      tips: [
        'Toca "Sellar Runa": si requiere prueba, pega tu link o un reporte rápido de 1 línea.',
        'Verás números flotantes (+Oro 💰 y +Batería GBA 🔋) subir hacia tu HUD.',
        'Los minutos ganados encienden tu cartucho de Pokémon GBA para jugar con la mente tranquila.'
      ]
    },
    {
      title: 'El Gran Veredicto & Medianoche',
      tag: 'PASO 4 / 4',
      badge: 'HONOR INVICTO',
      icon: ShieldCheck,
      color: 'from-cyan-500/20 to-[#14171C]',
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      description: 'Al llegar la noche antes de las 2:00 AM:',
      tips: [
        'Sella tu día invicto en Templanza y llena tu Diario de Medianoche.',
        'A las 12:00 AM tu cofre temático se abre y recibes el botín del clan.',
        '¡Apaga la pantalla y duerme con la paz de haber sido un verdadero jefe tribal!'
      ]
    }
  ];

  if (!isOpen) return null;

  const stepData = steps[currentStep];
  const StepIcon = stepData.icon;

  const handleNext = () => {
    soundFx.playClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      soundFx.playFanfare();
      onClose();
    }
  };

  const handlePrev = () => {
    soundFx.playClick();
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-[#0F1115] border-2 border-[#C5A059]/40 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-mono font-bold">
              {stepData.tag}
            </span>
            <span className="text-[11px] font-mono text-[#94A3B8] font-bold">
              {stepData.badge}
            </span>
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

        {/* Contenido del Paso */}
        <div className="space-y-3.5 text-left py-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stepData.color} border ${stepData.borderColor} flex items-center justify-center ${stepData.iconColor} shadow-md`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm text-[#E2E8F0]">
                {stepData.title}
              </h3>
              <p className="text-[10px] text-[#64748B] font-mono">
                Guía Rápida para {leaderName}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            {stepData.description}
          </p>

          <div className="space-y-2 bg-[#14171C] border border-white/5 rounded-2xl p-3">
            {stepData.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-[#94A3B8] leading-tight">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores de bolitas */}
        <div className="flex items-center justify-center gap-2 py-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                currentStep === i ? 'w-6 bg-[#C5A059]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-1">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#94A3B8] flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs text-[#64748B] hover:text-white font-mono"
            >
              Omitir Guía
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1"
          >
            <span>{currentStep === steps.length - 1 ? '¡Empezar la Forja!' : 'Siguiente'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
