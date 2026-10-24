'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Dumbbell, 
  Video, 
  Brain, 
  BookOpen, 
  Code2, 
  Zap, 
  ShieldCheck, 
  Coins, 
  Clock 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '@/lib/soundFx';

export interface HabitVisualData {
  id: string;
  title: string;
  subtitle: string;
  front_type: 'vigor' | 'templanza' | 'expansion';
  duration_minutes?: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  is_custom?: boolean;
  completed?: boolean;
}

interface RunicHabitCardProps {
  habit: HabitVisualData;
  onSeal: (habit: HabitVisualData, e: React.MouseEvent) => void;
}

// Helper para clasificar tema visual por palabras clave o tipo
function getHabitTheme(h: HabitVisualData) {
  const text = (h.title + ' ' + (h.subtitle || '')).toLowerCase();

  // 1. Físico / Entrenamiento (Fuego Rojo / Rubí)
  if (text.match(/(pesas|gym|gimnasio|correr|calistenia|cuerda|crossfit|boxeo|cardio|entrenar|ejercicio|flexiones|burpees|frente físico)/)) {
    return {
      type: 'physical',
      icon: Dumbbell,
      badgeText: 'VIGOR FÍSICO',
      badgeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/40',
      accentGlow: 'from-rose-500/20 via-amber-500/10 to-transparent',
      borderColor: 'border-rose-500/40 hover:border-rose-500/80',
      fillGradient: 'from-rose-600 via-amber-500 to-yellow-400',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      statBadge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    };
  }

  // 2. Negocio / TikTok / Marca / SaaS (Oro de Johto)
  if (text.match(/(tiktok|video|grabar|editar|guion|leads|prospectar|saas|ventas|publicar|cliente|bastión)/)) {
    return {
      type: 'business',
      icon: Video,
      badgeText: 'PROVISIÓN TRIBAL',
      badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
      accentGlow: 'from-amber-500/20 via-[#C5A059]/10 to-transparent',
      borderColor: 'border-[#C5A059]/50 hover:border-[#C5A059]',
      fillGradient: 'from-[#C5A059] via-amber-500 to-yellow-300',
      iconBg: 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50',
      statBadge: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    };
  }

  // 3. Mental / Meditación / Estoicismo (Azul Zafiro / Glacial)
  if (text.match(/(medit|leer|lectura|estudi|libro|enfoque|filosofia|santuario)/)) {
    return {
      type: 'mind',
      icon: Brain,
      badgeText: 'SANTUARIO MENTAL',
      badgeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
      accentGlow: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-cyan-500/40 hover:border-cyan-500/80',
      fillGradient: 'from-cyan-500 via-blue-500 to-indigo-400',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      statBadge: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    };
  }

  // 4. Código / Idiomas / Skills (Esmeralda / Jade)
  if (text.match(/(duolingo|ingles|idioma|codigo|programar|antigravity|skill|curso)/)) {
    return {
      type: 'expansion',
      icon: Code2,
      badgeText: 'EXPANSIÓN DE PODER',
      badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
      accentGlow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/40 hover:border-emerald-500/80',
      fillGradient: 'from-emerald-500 via-teal-400 to-cyan-300',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      statBadge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    };
  }

  // 5. Default Vigor
  return {
    type: 'default',
    icon: Zap,
    badgeText: 'FORJA DE CARÁCTER',
    badgeColor: 'text-[#C5A059] bg-[#C5A059]/15 border-[#C5A059]/40',
    accentGlow: 'from-[#C5A059]/20 to-transparent',
    borderColor: 'border-[#C5A059]/30 hover:border-[#C5A059]/70',
    fillGradient: 'from-[#C5A059] via-amber-500 to-yellow-400',
    iconBg: 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/40',
    statBadge: 'border-[#C5A059]/40 text-[#C5A059] bg-[#C5A059]/10',
  };
}

export function RunicHabitCard({ habit, onSeal }: RunicHabitCardProps) {
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  const theme = getHabitTheme(habit);
  const MainIcon = theme.icon;

  // Iniciar presión sostenida de bronce fundido
  const handleTouchStart = (e: React.SyntheticEvent) => {
    if (habit.completed || habit.requires_proof) return;

    setHolding(true);
    let current = 0;
    clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      current += 12;
      setHoldProgress(current);

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(28);
      }

      if (current >= 100) {
        clearInterval(holdIntervalRef.current);
        setHolding(false);
        setHoldProgress(0);
        triggerCompletion();
      }
    }, 70);
  };

  const handleTouchEnd = () => {
    if (habit.completed || habit.requires_proof) return;
    clearInterval(holdIntervalRef.current);
    setHolding(false);
    setHoldProgress(0);
  };

  const triggerCompletion = (e?: any) => {
    soundFx.playCoin();

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C5A059', '#F59E0B', '#22C55E', '#EF4444'],
    });

    onSeal(habit, e);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (habit.completed) return;
    if (habit.requires_proof) {
      soundFx.playClick();
      onSeal(habit, e);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: habit.completed ? 1 : 0.98 }}
      onClick={handleClick}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden rounded-2xl border transition-all select-none p-3.5 ${
        habit.completed
          ? 'bg-gradient-to-r from-[#12161f] to-[#0c0f14] border-emerald-500/40 opacity-80 shadow-[0_2px_0_0_#000]'
          : `bg-[#14171C] ${theme.borderColor} shadow-[0_4px_0_0_#000] active:translate-y-0.5 active:shadow-[0_2px_0_0_#000]`
      }`}
    >
      {/* Fondo de Brillo y Gradiente Rúnico */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${theme.accentGlow} opacity-60 pointer-events-none`}
      />

      {/* Relleno de Metal Fundido durante la presión sostenida */}
      {holding && (
        <div
          className={`absolute inset-0 bg-gradient-to-r ${theme.fillGradient} opacity-30 pointer-events-none transition-all duration-75`}
          style={{ width: `${holdProgress}%` }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Icono Grande Ilustrado + Detalles */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar Icono Rúnico */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${
              habit.completed
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : theme.iconBg
            }`}
          >
            {habit.completed ? (
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            ) : (
              <MainIcon className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>

          {/* Información y Textos */}
          <div className="space-y-1 flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${theme.badgeColor}`}
              >
                {theme.badgeText}
              </span>

              {habit.is_custom && (
                <span className="text-[8px] px-1.5 py-0.2 bg-white/5 border border-white/10 rounded text-[#C5A059] font-mono font-bold">
                  ORÁCULO
                </span>
              )}

              {habit.requires_proof && !habit.completed && (
                <span className="text-[8px] px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/40 rounded text-amber-400 font-mono font-bold">
                  PRUEBA
                </span>
              )}
            </div>

            <h3
              className={`text-sm font-black tracking-wide truncate ${
                habit.completed ? 'text-emerald-300 line-through' : 'text-[#E2E8F0]'
              }`}
            >
              {habit.title}
            </h3>

            <p className="text-[11px] text-[#64748B] leading-tight line-clamp-1">
              {habit.subtitle}
            </p>

            {/* Recompensas Visuales estilo RPG Badges */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0B0C0E] border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-mono font-black shadow-[0_1px_0_0_#000]">
                <Coins className="w-3 h-3" />
                <span>+{habit.gold_reward} ORO</span>
              </div>

              {habit.game_battery_reward > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0B0C0E] border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-black shadow-[0_1px_0_0_#000]">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>+{habit.game_battery_reward}m GBA</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Botón de Sello Rúnico 3D */}
        <div className="shrink-0">
          {habit.completed ? (
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 flex flex-col items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-5 h-5 fill-current" />
              <span className="text-[7px] font-black uppercase tracking-tighter">FORJADO</span>
            </div>
          ) : habit.requires_proof ? (
            <div className="w-11 h-11 rounded-2xl bg-[#0B0C0E] border-2 border-amber-500/50 flex flex-col items-center justify-center text-amber-400 shadow-[0_3px_0_0_#000] active:translate-y-0.5">
              <ChevronRight className="w-5 h-5 stroke-[3]" />
              <span className="text-[7px] font-black uppercase">REGISTRAR</span>
            </div>
          ) : (
            <div
              className={`w-11 h-11 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-[0_3px_0_0_#000] cursor-pointer ${
                holding
                  ? 'bg-gradient-to-br from-[#C5A059] to-amber-500 border-[#C5A059] text-black scale-95 shadow-none'
                  : 'bg-[#0B0C0E] border-[#C5A059]/60 text-[#C5A059] hover:border-[#C5A059]'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
              <span className="text-[8px] font-black leading-none mt-0.5">
                {holding ? `${holdProgress}%` : 'SELLAR'}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
