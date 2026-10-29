'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { RoleKey } from '@/lib/hqRoles';

interface SurfAvatarProps {
  role: RoleKey;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

export function SurfAvatar({ role, size = 'md', active = false, className = '' }: SurfAvatarProps) {
  const sizeMap = {
    sm: { box: 64, boardW: 56, scale: 0.75 },
    md: { box: 96, boardW: 84, scale: 1 },
    lg: { box: 136, boardW: 118, scale: 1.35 },
  };

  const currentSize = sizeMap[size];

  // Configuración de estilo visual y vibras (Kenney geometry + Lottie animation)
  const config = {
    ceo: {
      name: 'The Wave Captain',
      aura: 'from-amber-400/25 via-orange-500/10 to-transparent',
      shadowColor: '#F59E0B',
      boardColor: '#D97706',
      boardStripe: '#FDE68A',
      boardFin: '#B45309',
      skin: '#FBBF24',
      shirt: '#EA580C',
      glasses: '#18181B',
      boardAngle: -12,
      sparkle: '✨',
      badge: '👑',
    },
    cto: {
      name: 'The Cyber-Surfer',
      aura: 'from-cyan-400/25 via-blue-500/10 to-transparent',
      shadowColor: '#06B6D4',
      boardColor: '#0284C7',
      boardStripe: '#38BDF8',
      boardFin: '#0369A1',
      skin: '#FED7AA',
      shirt: '#0F172A',
      glasses: '#22D3EE',
      boardAngle: 10,
      sparkle: '⚡',
      badge: '🛠️',
    },
    cmo: {
      name: 'The Horizon Rider',
      aura: 'from-rose-400/25 via-pink-500/10 to-transparent',
      shadowColor: '#F43F5E',
      boardColor: '#E11D48',
      boardStripe: '#FDA4AF',
      boardFin: '#9F1239',
      skin: '#FDE047',
      shirt: '#BE123C',
      glasses: '#F43F5E',
      boardAngle: -8,
      sparkle: '🌸',
      badge: '📢',
    },
  }[role];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: currentSize.box, height: currentSize.box }}
    >
      {/* Halo de Energía / Vibe Aura */}
      <motion.div
        animate={{
          scale: active ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: active ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${config.aura} blur-md`}
      />

      {/* Ola Dinámica Flotante (Water Ripple Lottie Style) */}
      <motion.svg
        animate={{ x: [-4, 4, -4], opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        viewBox="0 0 100 24"
        className="absolute -bottom-2 w-full h-5 pointer-events-none text-sky-400/50"
        fill="currentColor"
      >
        <path d="M0 12 C 20 4, 30 18, 50 10 C 70 2, 80 16, 100 8 L 100 24 L 0 24 Z" />
      </motion.svg>

      {/* Contenedor del Avatar y Tabla con Animación de Surf Flotante */}
      <motion.div
        animate={{
          y: [-3, 4, -3],
          rotate: [config.boardAngle - 2, config.boardAngle + 3, config.boardAngle - 2],
        }}
        transition={{
          duration: role === 'cto' ? 2 : role === 'ceo' ? 3 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.12, rotate: 0 }}
        className="relative z-10 cursor-pointer flex flex-col items-center"
      >
        {/* Personaje Flat-LowPoly Estilo Kenney */}
        <div className="relative">
          {/* Cabeza / Gafas de Sol de Surfista */}
          <div className="relative flex items-center justify-center">
            {/* Cabello Playero / Gorra */}
            {role === 'ceo' && (
              <div className="absolute -top-3 w-8 h-4 bg-amber-700 rounded-t-full border-2 border-black" />
            )}
            {role === 'cto' && (
              <div className="absolute -top-3 w-7 h-4 bg-slate-900 rounded-t-md border-2 border-black" />
            )}
            {role === 'cmo' && (
              <div className="absolute -top-3 w-8 h-4 bg-pink-600 rounded-t-full border-2 border-black" />
            )}

            {/* Cabeza / Rostro */}
            <div
              className="w-8 h-8 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]"
              style={{ backgroundColor: config.skin }}
            >
              {/* Lentes de sol surf vintage */}
              <div className="mt-2 flex items-center justify-center gap-1">
                <div
                  className="w-2.5 h-2 rounded-sm border border-black shadow-sm"
                  style={{ backgroundColor: config.glasses }}
                />
                <div className="w-1 h-0.5 bg-black" />
                <div
                  className="w-2.5 h-2 rounded-sm border border-black shadow-sm"
                  style={{ backgroundColor: config.glasses }}
                />
              </div>
              {/* Sonrisa Chill */}
              <div className="mx-auto mt-0.5 w-2 h-1 border-b-2 border-black rounded-full" />
            </div>

            {/* Insignia Flotante de Rol */}
            <span
              className="absolute -right-2 -top-1 text-xs select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
              role="img"
              aria-label="Rol badge"
            >
              {config.badge}
            </span>
          </div>

          {/* Torso / Camisa Tropical */}
          <div
            className="mx-auto -mt-1 w-7 h-5 rounded-md border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
            style={{ backgroundColor: config.shirt }}
          >
            {/* Detalle de Camisa / Collar */}
            {role === 'ceo' && (
              <div className="w-1.5 h-full bg-amber-200 border-x border-black/30" />
            )}
            {role === 'cto' && (
              <div className="text-[7px] text-cyan-400 font-mono font-bold">&lt;/&gt;</div>
            )}
            {role === 'cmo' && (
              <div className="w-3 h-1 bg-yellow-300 rounded-full border border-black/40" />
            )}
          </div>
        </div>

        {/* Tabla de Surf (Kenney Neo-Arcade Style) */}
        <div
          className="relative mt-0.5 h-3 rounded-full border-2 border-black flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_#000]"
          style={{
            width: currentSize.boardW,
            backgroundColor: config.boardColor,
          }}
        >
          {/* Franja de Velocidad de la Tabla */}
          <div
            className="w-full h-1"
            style={{ backgroundColor: config.boardStripe }}
          />
          {/* Quilla / Fin */}
          <div
            className="absolute right-1 -bottom-1 w-1.5 h-2 rounded-sm"
            style={{ backgroundColor: config.boardFin }}
          />
        </div>
      </motion.div>

      {/* Partículas de Éxito / Estrellita */}
      <motion.span
        animate={{ y: [-1, -6, -1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1 -right-1 text-xs select-none pointer-events-none"
      >
        {config.sparkle}
      </motion.span>
    </div>
  );
}
