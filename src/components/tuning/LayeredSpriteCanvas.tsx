'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StarterPokemon } from '@/types/trainer';
import { Flame, Droplets, Sprout, Sparkles } from 'lucide-react';

interface LayeredSpriteCanvasProps {
  starter: StarterPokemon;
  cosmeticGlasses?: boolean;
  cosmeticAura?: boolean;
  cosmeticHat?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LayeredSpriteCanvas: React.FC<LayeredSpriteCanvasProps> = ({
  starter = 'cyndaquil',
  cosmeticGlasses = true,
  cosmeticAura = true,
  cosmeticHat = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
  }[size];

  const getStarterStyle = () => {
    switch (starter) {
      case 'cyndaquil':
        return {
          bg: 'from-amber-600 via-orange-500 to-amber-700',
          border: 'border-amber-400',
          icon: <Flame className="w-1/2 h-1/2 fill-amber-300 text-amber-950" />,
          auraColor: 'rgba(245, 158, 11, 0.6)',
          label: 'Cyndaquil Neo',
        };
      case 'totodile':
        return {
          bg: 'from-blue-600 via-cyan-500 to-blue-700',
          border: 'border-cyan-400',
          icon: <Droplets className="w-1/2 h-1/2 fill-cyan-300 text-blue-950" />,
          auraColor: 'rgba(6, 182, 212, 0.6)',
          label: 'Totodile Cyber',
        };
      case 'chikorita':
        return {
          bg: 'from-emerald-600 via-green-500 to-emerald-700',
          border: 'border-emerald-400',
          icon: <Sprout className="w-1/2 h-1/2 fill-emerald-300 text-emerald-950" />,
          auraColor: 'rgba(34, 197, 94, 0.6)',
          label: 'Chikorita Bot',
        };
    }
  };

  const style = getStarterStyle();

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center select-none font-mono`}>
      {/* Capa 1: Aura de Neón Giratoria */}
      {cosmeticAura && (
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.08, 1] }}
          transition={{
            rotate: { repeat: Infinity, duration: 8, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${style.auraColor} 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Capa 2: Base del Sprite del Pokémon */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className={`w-full h-full rounded-2xl bg-gradient-to-tr ${style.bg} border-2 ${style.border} shadow-xl flex items-center justify-center relative overflow-hidden`}
      >
        {/* Grilla interna pixel */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:8px_8px]" />

        {/* Ícono Principal del Pokémon */}
        {style.icon}

        {/* Capa 3: Gafas Cyberpunk Superpuestas */}
        {cosmeticGlasses && (
          <div className="absolute top-[28%] w-[68%] h-[20%] bg-cyan-400/90 border border-black rounded-xs shadow-[0_0_10px_#06b6d4] flex items-center justify-between px-1 z-20">
            <span className="w-1 h-1 bg-white rounded-full animate-ping" />
            <span className="text-[7px] font-black text-black tracking-tighter">HUD</span>
            <span className="w-1 h-1 bg-white rounded-full animate-ping" />
          </div>
        )}

        {/* Capa 4: Gorra de Entrenador Pokémon */}
        {cosmeticHat && (
          <div className="absolute top-0 w-3/4 h-3 bg-red-600 border-b border-black rounded-t-sm flex items-center justify-center z-20">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}

        {/* Brillo reflectivo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};
