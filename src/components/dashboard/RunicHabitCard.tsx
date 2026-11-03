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

// Clasificación refinada estilo Editorial Claro con Acentos Vivos
function getHabitTheme(h: HabitVisualData) {
  const text = (h.title + ' ' + (h.subtitle || '')).toLowerCase();

  // 1. Físico / Entrenamiento (Terracota Deportivo)
  if (text.match(/(pesas|gym|gimnasio|correr|calistenia|cuerda|crossfit|boxeo|cardio|entrenar|ejercicio|flexiones|burpees|frente físico|físico)/)) {
    return {
      type: 'physical',
      icon: Dumbbell,
      badgeText: 'FÍSICO',
      badgeColor: 'text-[#D97043] bg-[#D97043]/10 border-[#D97043]/20',
      iconBg: 'bg-[#D97043]/10 text-[#D97043] border-[#D97043]/20',
      cardBorder: 'border-[#D97043]/20 hover:border-[#D97043]/40',
      accentColor: '#D97043',
    };
  }

  // 2. Negocio / Trabajo / Ventas (Oro Cálido)
  if (text.match(/(tiktok|video|grabar|editar|guion|leads|prospectar|saas|ventas|publicar|cliente|negocio|trabajo)/)) {
    return {
      type: 'business',
      icon: Video,
      badgeText: 'NEGOCIO',
      badgeColor: 'text-[#B88728] bg-[#D4A359]/15 border-[#D4A359]/30',
      iconBg: 'bg-[#D4A359]/15 text-[#B88728] border-[#D4A359]/30',
      cardBorder: 'border-[#D4A359]/25 hover:border-[#D4A359]/50',
      accentColor: '#D4A359',
    };
  }

  // 3. Mental / Lectura / Paz (Azul Pacífico)
  if (text.match(/(medit|leer|lectura|estudi|libro|enfoque|filosofia|santuario|mente)/)) {
    return {
      type: 'mind',
      icon: Brain,
      badgeText: 'MENTE',
      badgeColor: 'text-[#3B7582] bg-[#4A8B99]/15 border-[#4A8B99]/30',
      iconBg: 'bg-[#4A8B99]/15 text-[#3B7582] border-[#4A8B99]/30',
      cardBorder: 'border-[#4A8B99]/25 hover:border-[#4A8B99]/50',
      accentColor: '#4A8B99',
    };
  }

  // 4. Idiomas / Skills / Expansión (Verde Salvia)
  if (text.match(/(duolingo|ingles|idioma|codigo|programar|antigravity|skill|curso|expansion|expansión)/)) {
    return {
      type: 'expansion',
      icon: Code2,
      badgeText: 'EXPANSIÓN',
      badgeColor: 'text-[#4C6151] bg-[#5A7D62]/15 border-[#5A7D62]/30',
      iconBg: 'bg-[#5A7D62]/15 text-[#4C6151] border-[#5A7D62]/30',
      cardBorder: 'border-[#5A7D62]/25 hover:border-[#5A7D62]/50',
      accentColor: '#5A7D62',
    };
  }

  // 5. Default Vigor
  return {
    type: 'default',
    icon: Waves,
    badgeText: 'DISCIPLINA',
    badgeColor: 'text-[#D97043] bg-[#D97043]/10 border-[#D97043]/20',
    iconBg: 'bg-[#D97043]/10 text-[#D97043] border-[#D97043]/20',
    cardBorder: 'border-[#E8E5DD] hover:border-[#D97043]/30',
    accentColor: '#D97043',
  };
}

export function RunicHabitCard({ habit, onSeal }: RunicHabitCardProps) {
  const theme = getHabitTheme(habit);
  const MainIcon = theme.icon;

  const triggerCompletion = (e?: React.MouseEvent) => {
    if (habit.completed) return;
    soundFx.playCoin();

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D97043', '#4A8B99', '#D4A359', '#5A7D62'],
    });

    onSeal(habit, e as any);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (habit.completed) return;
    if (habit.requires_proof) {
      soundFx.playClick();
      onSeal(habit, e);
    } else {
      triggerCompletion(e);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: habit.completed ? 1 : 0.98 }}
      onClick={handleActionClick}
      className={`relative overflow-hidden rounded-2xl border bg-white transition-all select-none p-3.5 shadow-xs cursor-pointer ${
        habit.completed
          ? 'border-[#5A7D62]/30 bg-[#FAF9F5]/80 opacity-70'
          : `${theme.cardBorder} hover:shadow-sm`
      }`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Icono + Título + Recompensas */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Contenedor del Icono con Color Temático */}
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
              habit.completed
                ? 'bg-[#5A7D62]/15 text-[#5A7D62] border-[#5A7D62]/30'
                : theme.iconBg
            }`}
          >
            {habit.completed ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <MainIcon className="w-5 h-5 stroke-[2]" />
            )}
          </div>

          {/* Textos y Badges */}
          <div className="space-y-1 flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${theme.badgeColor}`}
              >
                {theme.badgeText}
              </span>

              {habit.is_custom && (
                <span className="text-[8px] px-1.5 py-0.5 bg-[#FAF9F5] border border-[#E8E5DD] rounded text-[#B88728] font-mono font-medium">
                  ORÁCULO
                </span>
              )}

              {habit.requires_proof && !habit.completed && (
                <span className="text-[8px] px-1.5 py-0.5 bg-[#4A8B99]/10 border border-[#4A8B99]/25 rounded text-[#3B7582] font-mono font-semibold">
                  COMPROBANTE
                </span>
              )}
            </div>

            <h3
              className={`text-sm font-semibold tracking-tight truncate ${
                habit.completed ? 'text-[#8A877E] line-through' : 'text-[#1F1E1B]'
              }`}
            >
              {habit.title}
            </h3>

            <p className="text-[11px] text-[#706E66] leading-tight line-clamp-1">
              {habit.subtitle}
            </p>

            {/* Recompensas Claras en Píldoras Editoriales */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[#A6752C] text-[10px] font-mono font-medium">
                <Coins className="w-3 h-3" />
                <span className="tabular-nums">+{habit.gold_reward} ₽</span>
              </div>

              {habit.game_battery_reward > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[#5A7D62] text-[10px] font-mono font-medium">
                  <Sun className="w-3 h-3 stroke-[2.2]" />
                  <span className="tabular-nums">+{habit.game_battery_reward}m</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Botón de 1 Clic para Completar (Tap Directo) */}
        <div className="shrink-0">
          {habit.completed ? (
            <div className="w-10 h-10 rounded-xl bg-[#5A7D62]/15 border border-[#5A7D62]/30 flex flex-col items-center justify-center text-[#4C6151]">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[7px] font-mono font-bold uppercase mt-0.5">HECHO</span>
            </div>
          ) : habit.requires_proof ? (
            <button
              type="button"
              onClick={handleActionClick}
              className="w-10 h-10 rounded-xl bg-[#4A8B99]/10 hover:bg-[#4A8B99]/20 border border-[#4A8B99]/30 flex flex-col items-center justify-center text-[#3B7582] cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Subir comprobante"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[7px] font-mono font-bold uppercase">PRUEBA</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              className="w-10 h-10 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Toca para marcar como realizado"
            >
              <Check className="w-4 h-4 stroke-[2.8]" />
              <span className="text-[7px] font-mono font-bold uppercase mt-0.5">
                SELLAR
              </span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
