'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  Waves, 
  Sun, 
  Dumbbell, 
  Video, 
  Brain, 
  Code2, 
  Coins, 
  Sparkles 
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

// Clasificación refinada estilo Anthropic x Johto Surf
function getHabitTheme(h: HabitVisualData) {
  const text = (h.title + ' ' + (h.subtitle || '')).toLowerCase();

  // 1. Físico / Entrenamiento (Sol Terracota)
  if (text.match(/(pesas|gym|gimnasio|correr|calistenia|cuerda|crossfit|boxeo|cardio|entrenar|ejercicio|flexiones|burpees|frente físico)/)) {
    return {
      type: 'physical',
      icon: Dumbbell,
      badgeText: 'VIGOR FÍSICO',
      badgeColor: 'text-[#D97043] bg-[#D97043]/10 border-[#D97043]/20',
      iconBg: 'bg-[#D97043]/15 text-[#D97043] border-[#D97043]/30',
      accentColor: '#D97043',
    };
  }

  // 2. Negocio / Creación / Provisión (Campana Oleaje Dorada)
  if (text.match(/(tiktok|video|grabar|editar|guion|leads|prospectar|saas|ventas|publicar|cliente|bastión)/)) {
    return {
      type: 'business',
      icon: Video,
      badgeText: 'CREACIÓN & FLUJO',
      badgeColor: 'text-[#D4A359] bg-[#D4A359]/10 border-[#D4A359]/20',
      iconBg: 'bg-[#D4A359]/15 text-[#D4A359] border-[#D4A359]/30',
      accentColor: '#D4A359',
    };
  }

  // 3. Mental / Meditación / Santuario (Marea Pacífica Azul)
  if (text.match(/(medit|leer|lectura|estudi|libro|enfoque|filosofia|santuario)/)) {
    return {
      type: 'mind',
      icon: Brain,
      badgeText: 'SANTUARIO MENTAL',
      badgeColor: 'text-[#4A8B99] bg-[#4A8B99]/10 border-[#4A8B99]/20',
      iconBg: 'bg-[#4A8B99]/15 text-[#4A8B99] border-[#4A8B99]/30',
      accentColor: '#4A8B99',
    };
  }

  // 4. Código / Idiomas / Expansión (Verde Salvia Alola)
  if (text.match(/(duolingo|ingles|idioma|codigo|programar|antigravity|skill|curso)/)) {
    return {
      type: 'expansion',
      icon: Code2,
      badgeText: 'EXPANSIÓN',
      badgeColor: 'text-[#6E8B68] bg-[#6E8B68]/10 border-[#6E8B68]/20',
      iconBg: 'bg-[#6E8B68]/15 text-[#6E8B68] border-[#6E8B68]/30',
      accentColor: '#6E8B68',
    };
  }

  // 5. Default Vigor / Marea
  return {
    type: 'default',
    icon: Waves,
    badgeText: 'HÁBITO SOLAR',
    badgeColor: 'text-[#D97043] bg-[#D97043]/10 border-[#D97043]/20',
    iconBg: 'bg-[#D97043]/15 text-[#D97043] border-[#D97043]/30',
    accentColor: '#D97043',
  };
}

export function RunicHabitCard({ habit, onSeal }: RunicHabitCardProps) {
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  const theme = getHabitTheme(habit);
  const MainIcon = theme.icon;

  // Presión sostenida suave de flujo
  const handleTouchStart = (e: React.SyntheticEvent) => {
    if (habit.completed || habit.requires_proof) return;

    setHolding(true);
    let current = 0;
    clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      current += 10;
      setHoldProgress(current);

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }

      if (current >= 100) {
        clearInterval(holdIntervalRef.current);
        setHolding(false);
        setHoldProgress(0);
        triggerCompletion();
      }
    }, 65);
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
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D97043', '#4A8B99', '#D4A359', '#6E8B68'],
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
      whileTap={{ scale: habit.completed ? 1 : 0.99 }}
      onClick={handleClick}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden rounded-2xl border transition-all select-none p-3.5 ${
        habit.completed
          ? 'bg-[#181918]/80 border-[#6E8B68]/30 opacity-75'
          : 'bg-[#1D1E1D] border-white/[0.08] hover:border-[#D97043]/30 active:border-[#D97043]/50'
      }`}
    >
      {/* Relleno de Flujo durante la presión sostenida */}
      {holding && (
        <div
          className="absolute inset-0 bg-[#D97043]/20 pointer-events-none transition-all duration-75"
          style={{ width: `${holdProgress}%` }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Icono Minimalista + Contenido */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
              habit.completed
                ? 'bg-[#6E8B68]/15 text-[#6E8B68] border-[#6E8B68]/40'
                : theme.iconBg
            }`}
          >
            {habit.completed ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <MainIcon className="w-5 h-5 stroke-[1.9]" />
            )}
          </div>

          {/* Información y Textos */}
          <div className="space-y-1 flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-mono font-medium uppercase px-2 py-0.5 rounded-full border ${theme.badgeColor}`}
              >
                {theme.badgeText}
              </span>

              {habit.is_custom && (
                <span className="text-[8px] px-1.5 py-0.2 bg-white/5 border border-white/10 rounded text-[#D4A359] font-mono">
                  ORÁCULO
                </span>
              )}

              {habit.requires_proof && !habit.completed && (
                <span className="text-[8px] px-1.5 py-0.2 bg-[#4A8B99]/15 border border-[#4A8B99]/30 rounded text-[#4A8B99] font-mono font-medium">
                  VERIFICAR
                </span>
              )}
            </div>

            <h3
              className={`text-sm font-medium tracking-tight truncate ${
                habit.completed ? 'text-[#969894] line-through' : 'text-[#EFECE6]'
              }`}
            >
              {habit.title}
            </h3>

            <p className="text-[11px] text-[#969894] leading-tight line-clamp-1">
              {habit.subtitle}
            </p>

            {/* Recompensas Minimalistas */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141514] border border-white/[0.06] text-[#D4A359] text-[10px] font-mono">
                <Coins className="w-3 h-3" />
                <span className="tabular-nums">+{habit.gold_reward}</span>
              </div>

              {habit.game_battery_reward > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141514] border border-white/[0.06] text-[#6E8B68] text-[10px] font-mono">
                  <Sun className="w-3 h-3" strokeWidth={2} />
                  <span className="tabular-nums">+{habit.game_battery_reward}m</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Botón de Flujo / Sello Táctil */}
        <div className="shrink-0">
          {habit.completed ? (
            <div className="w-10 h-10 rounded-xl bg-[#6E8B68]/15 border border-[#6E8B68]/40 flex flex-col items-center justify-center text-[#6E8B68]">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[7px] font-mono uppercase tracking-tight mt-0.5">LISTO</span>
            </div>
          ) : habit.requires_proof ? (
            <div className="w-10 h-10 rounded-xl bg-[#141514] border border-[#4A8B99]/40 flex flex-col items-center justify-center text-[#4A8B99] cursor-pointer active:scale-95 transition-all">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[7px] font-mono uppercase">COMPROBAR</span>
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                holding
                  ? 'bg-[#D97043] border-[#D97043] text-[#141514] scale-95'
                  : 'bg-[#141514] border-white/[0.1] text-[#D97043] hover:border-[#D97043]/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[8px] font-mono font-medium leading-none mt-0.5">
                {holding ? `${holdProgress}%` : 'FLUIR'}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
