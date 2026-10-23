'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { 
  TRAINER_SKINS_CATALOG, 
  POKEMON_COSTUMES_CATALOG, 
  TrainerSkin, 
  PokemonCostumeItem 
} from '@/types/cosmetics';
import { Sparkles, Crown, ShieldCheck } from 'lucide-react';

interface DuoCustomizerCanvasProps {
  trainerName?: string;
  trainerSkinId?: string | null;
  partnerSpeciesId?: number;
  partnerPokemonName?: string;
  equippedCostumeId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  activeHighlight?: 'trainer' | 'pokemon' | 'both';
  interactive?: boolean;
  onSelectTarget?: (target: 'trainer' | 'pokemon') => void;
}

export const DuoCustomizerCanvas: React.FC<DuoCustomizerCanvasProps> = ({
  trainerName = 'Entrenador',
  trainerSkinId = 'SKIN_OAK_PROFESSOR',
  partnerSpeciesId = 25, // Pikachu por defecto para lucir trajes y gorras
  partnerPokemonName = 'Pikachu',
  equippedCostumeId = null,
  size = 'md',
  activeHighlight = 'both',
  interactive = false,
  onSelectTarget,
}) => {
  const containerDimensions = {
    sm: 'h-56 min-w-[280px]',
    md: 'h-80 w-full',
    lg: 'h-96 w-full',
  }[size];

  // Resolver Skin del Entrenador
  const activeSkin: TrainerSkin = 
    TRAINER_SKINS_CATALOG.find((s) => s.id === trainerSkinId) || 
    (trainerName.toLowerCase().includes('oak') || trainerName.toLowerCase().includes('profesor')
      ? TRAINER_SKINS_CATALOG[0]
      : TRAINER_SKINS_CATALOG[1]);

  // Resolver Disfraz / Gorra Oficial del Pokémon
  const activeCostume: PokemonCostumeItem | undefined = 
    equippedCostumeId ? POKEMON_COSTUMES_CATALOG.find((c) => c.id === equippedCostumeId) : undefined;

  // Si tiene gorra o disfraz equipado, usar su sprite oficial; si no, el Showdown animado normal
  const pokemonSpriteUrl = activeCostume 
    ? activeCostume.costumeSpriteUrl 
    : POKEMON_ASSETS.getAnimatedSprite(partnerSpeciesId, false);

  return (
    <div
      className={`relative ${containerDimensions} rounded-2xl overflow-hidden border-3 border-black bg-gradient-to-b from-[#0b1325] via-[#080d1a] to-[#04070e] flex items-end justify-center px-4 pb-6 select-none font-mono shadow-[4px_4px_0_#000]`}
    >
      {/* ── Retícula Arcade Cyber-Johto ── */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:16px_16px]" />
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      {/* ── Tarima Neón de Batalla ── */}
      <div className="absolute bottom-3 w-[92%] h-16 bg-gradient-to-r from-emerald-500/20 via-cyan-500/30 to-amber-500/20 rounded-full border-2 border-cyan-400/40 blur-[1px] shadow-[0_0_30px_rgba(6,182,212,0.35)]" />

      {/* ══════════════════════════════════════════════════════════════
          LADO IZQUIERDO: ENTRENADOR ILUSTRADO (SKIN OFICIAL)
      ══════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        onClick={() => interactive && onSelectTarget?.('trainer')}
        className={`relative z-10 flex flex-col items-center justify-end mx-4 pb-1 ${
          interactive ? 'cursor-pointer group' : ''
        } ${
          activeHighlight === 'trainer' || activeHighlight === 'both'
            ? 'opacity-100 scale-100'
            : 'opacity-50 scale-95'
        } transition-all duration-200`}
      >
        {/* Aura de Neón según categoría de la Skin */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.08, 1] }}
          transition={{
            rotate: { repeat: Infinity, duration: 12, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
          }}
          className="absolute -inset-6 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${activeSkin.glowColor}40 0%, transparent 70%)`,
            filter: 'blur(16px)',
          }}
        />

        {/* Marco con Sprite Real HD del Entrenador */}
        <div className="relative w-36 h-48 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSkin.spriteUrl}
            alt={activeSkin.name}
            className="h-full object-contain filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.85)]"
          />

          <div className="absolute top-1 right-1 p-1 bg-black/60 rounded-full border border-white/20">
            <Crown className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Insignia / Nombre y Rol de la Skin */}
        <div className="mt-1 flex flex-col items-center">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-black/90 text-amber-300 border-2 border-black shadow-[2px_2px_0_#000] flex items-center gap-1">
            <span>{activeSkin.name}</span>
          </span>
          <span className="text-[9px] text-slate-400 font-bold mt-0.5 max-w-[140px] truncate text-center">
            {activeSkin.title}
          </span>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
          LADO DERECHO: POKÉMON CON GORRA O TRAJE OFICIAL ILUSTRADO
      ══════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.2 }}
        onClick={() => interactive && onSelectTarget?.('pokemon')}
        className={`relative z-10 flex flex-col items-center justify-end mx-4 pb-1 ${
          interactive ? 'cursor-pointer group' : ''
        } ${
          activeHighlight === 'pokemon' || activeHighlight === 'both'
            ? 'opacity-100 scale-100'
            : 'opacity-50 scale-95'
        } transition-all duration-200`}
      >
        {/* Aura del Pokémon */}
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{
            rotate: { repeat: Infinity, duration: 9, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          }}
          className="absolute -inset-6 rounded-full pointer-events-none"
          style={{
            background: activeCostume 
              ? 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
        />

        {/* Contenedor del Sprite Pokémon Oficial */}
        <div className="relative w-36 h-48 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pokemonSpriteUrl} // Forzar re-render suave al cambiar de gorra
            src={pokemonSpriteUrl}
            alt={partnerPokemonName}
            className="h-32 w-32 object-contain filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.85)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = POKEMON_ASSETS.getPixelSprite(partnerSpeciesId);
            }}
          />

          {/* Insignia si lleva gorra o traje equipado */}
          {activeCostume && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-md flex items-center gap-1 border border-black shadow-[1px_1px_0_#000]">
              <Sparkles className="w-2.5 h-2.5 fill-black" />
              <span>EQUIPADO</span>
            </div>
          )}
        </div>

        {/* Insignia / Nombre del Pokémon y su Atuendo */}
        <div className="mt-1 flex flex-col items-center">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-950/90 text-emerald-300 border-2 border-black shadow-[2px_2px_0_#000] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>{partnerPokemonName}</span>
          </span>
          <span className="text-[9px] text-amber-400 font-bold mt-0.5 max-w-[150px] truncate text-center">
            {activeCostume ? activeCostume.name : 'Forma Clásica'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
