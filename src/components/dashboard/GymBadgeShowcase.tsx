'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Droplet, 
  Wind, 
  Layers, 
  Eye, 
  Check, 
  X,
  Volume2,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';

export interface GymBadgeData {
  id: string;
  name: string;
  region: 'johto' | 'kanto';
  slot: number;
  requiredLevel: number;
  leader: string;
  city: string;
  type: string;
  bonus: string;
  badgeColor: string;
  glowColor: string;
  svgShape: 'wing' | 'hive' | 'diamond' | 'fog' | 'mineral' | 'storm' | 'glacier' | 'dragon' | 'boulder' | 'cascade' | 'thunder' | 'rainbow' | 'soul' | 'marsh' | 'volcano' | 'earth';
}

export const GYM_BADGES: GymBadgeData[] = [
  // --- JOHTO (8 MEDALLAS) ---
  {
    id: 'badge_zephyr',
    name: 'Medalla Céfiro',
    region: 'johto',
    slot: 1,
    requiredLevel: 1,
    leader: 'Pegaso (Falkner)',
    city: 'Ciudad Malva',
    type: 'Volador',
    bonus: 'Control Pokémon hasta Nv. 20 y +10% Ataque Volador',
    badgeColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    svgShape: 'wing',
  },
  {
    id: 'badge_hive',
    name: 'Medalla Colmena',
    region: 'johto',
    slot: 2,
    requiredLevel: 2,
    leader: 'Antón (Bugsy)',
    city: 'Pueblo Azalea',
    type: 'Bicho',
    bonus: 'Control Pokémon hasta Nv. 30 y uso de Corte fuera de combate',
    badgeColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    svgShape: 'hive',
  },
  {
    id: 'badge_plain',
    name: 'Medalla Planicie',
    region: 'johto',
    slot: 3,
    requiredLevel: 3,
    leader: 'Blanca (Whitney)',
    city: 'Ciudad Trigal',
    type: 'Normal',
    bonus: '+10% Velocidad en combate y uso de Fuerza',
    badgeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.7)',
    svgShape: 'diamond',
  },
  {
    id: 'badge_fog',
    name: 'Medalla Niebla',
    region: 'johto',
    slot: 4,
    requiredLevel: 4,
    leader: 'Morti (Morty)',
    city: 'Ciudad Iris',
    type: 'Fantasma',
    bonus: 'Control Pokémon hasta Nv. 50 y uso de Surf en rutas',
    badgeColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    svgShape: 'fog',
  },
  {
    id: 'badge_mineral',
    name: 'Medalla Mineral',
    region: 'johto',
    slot: 5,
    requiredLevel: 5,
    leader: 'Jazmín (Jasmine)',
    city: 'Ciudad Olivo',
    type: 'Acero',
    bonus: '+10% Defensa y resistencia a Tormentas de Arena',
    badgeColor: '#94A3B8',
    glowColor: 'rgba(148, 163, 184, 0.7)',
    svgShape: 'mineral',
  },
  {
    id: 'badge_storm',
    name: 'Medalla Tormenta',
    region: 'johto',
    slot: 6,
    requiredLevel: 6,
    leader: 'Aníbal (Chuck)',
    city: 'Ciudad Orquídea',
    type: 'Lucha',
    bonus: 'Control Pokémon hasta Nv. 70 y uso de Vuelo rápido',
    badgeColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.7)',
    svgShape: 'storm',
  },
  {
    id: 'badge_glacier',
    name: 'Medalla Glaciar',
    region: 'johto',
    slot: 7,
    requiredLevel: 7,
    leader: 'Fredo (Pryce)',
    city: 'Pueblo Caoba',
    type: 'Hielo',
    bonus: '+10% Ataque Especial y resistencia a Granizo helado',
    badgeColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    svgShape: 'glacier',
  },
  {
    id: 'badge_rising',
    name: 'Medalla Dragón',
    region: 'johto',
    slot: 8,
    requiredLevel: 8,
    leader: 'Débora (Clair)',
    city: 'Ciudad Endrino',
    type: 'Dragón',
    bonus: 'Todos los Pokémon obedecen siempre y uso de Cascada',
    badgeColor: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.8)',
    svgShape: 'dragon',
  },

  // --- KANTO (8 MEDALLAS) ---
  {
    id: 'badge_boulder',
    name: 'Medalla Roca',
    region: 'kanto',
    slot: 9,
    requiredLevel: 9,
    leader: 'Brock',
    city: 'Ciudad Plateada',
    type: 'Roca',
    bonus: '+12% Ataque Físico y uso de Destello en cuevas',
    badgeColor: '#78716C',
    glowColor: 'rgba(120, 113, 108, 0.7)',
    svgShape: 'boulder',
  },
  {
    id: 'badge_cascade',
    name: 'Medalla Cascada',
    region: 'kanto',
    slot: 10,
    requiredLevel: 10,
    leader: 'Misty',
    city: 'Ciudad Celeste',
    type: 'Agua',
    bonus: 'Control Pokémon hasta Nv. 80 en torneos Kanto',
    badgeColor: '#0284C7',
    glowColor: 'rgba(2, 132, 199, 0.7)',
    svgShape: 'cascade',
  },
  {
    id: 'badge_thunder',
    name: 'Medalla Trueno',
    region: 'kanto',
    slot: 11,
    requiredLevel: 11,
    leader: 'Lt. Surge',
    city: 'Ciudad Carmín',
    type: 'Eléctrico',
    bonus: '+12% Velocidad y reflejo estático anti-parálisis',
    badgeColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    svgShape: 'thunder',
  },
  {
    id: 'badge_rainbow',
    name: 'Medalla Arcoíris',
    region: 'kanto',
    slot: 12,
    requiredLevel: 12,
    leader: 'Erika',
    city: 'Ciudad Azulona',
    type: 'Planta',
    bonus: 'Control Pokémon hasta Nv. 85 y regeneración leve de PS',
    badgeColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    svgShape: 'rainbow',
  },
  {
    id: 'badge_soul',
    name: 'Medalla Alma',
    region: 'kanto',
    slot: 13,
    requiredLevel: 13,
    leader: 'Sachiko (Janine)',
    city: 'Ciudad Fucsia',
    type: 'Veneno',
    bonus: '+12% Defensa y protección contra Envenenamiento severo',
    badgeColor: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.7)',
    svgShape: 'soul',
  },
  {
    id: 'badge_marsh',
    name: 'Medalla Pantano',
    region: 'kanto',
    slot: 14,
    requiredLevel: 14,
    leader: 'Sabrina',
    city: 'Ciudad Azafrán',
    type: 'Psíquico',
    bonus: '+12% Ataque Especial y resistencia a Confusión',
    badgeColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    svgShape: 'marsh',
  },
  {
    id: 'badge_volcano',
    name: 'Medalla Volcán',
    region: 'kanto',
    slot: 15,
    requiredLevel: 15,
    leader: 'Blaine',
    city: 'Isla Canela',
    type: 'Fuego',
    bonus: '+12% Defensa Especial y resistencia a Quemaduras',
    badgeColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    svgShape: 'volcano',
  },
  {
    id: 'badge_earth',
    name: 'Medalla Tierra',
    region: 'kanto',
    slot: 16,
    requiredLevel: 16,
    leader: 'Azul (Blue)',
    city: 'Ciudad Verde',
    type: 'Tierra / Todos',
    bonus: 'Maestría Absoluta: Acceso abierto al Monte Plateado',
    badgeColor: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.8)',
    svgShape: 'earth',
  },
];

// Renderizador Pixel-Art SVG para cada tipo de medalla
const BadgeShapeIcon: React.FC<{ shape: GymBadgeData['svgShape']; color: string; isUnlocked: boolean }> = ({
  shape,
  color,
  isUnlocked,
}) => {
  const fillColor = isUnlocked ? color : '#475569';
  const strokeColor = isUnlocked ? '#FFFFFF' : '#1e293b';

  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-md">
      <defs>
        <radialGradient id={`grad-${shape}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="45%" stopColor={fillColor} />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {shape === 'wing' && (
        <path
          d="M24 6 C14 14 10 24 12 38 C18 42 30 42 36 38 C38 24 34 14 24 6 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'hive' && (
        <polygon
          points="24,6 40,15 40,33 24,42 8,33 8,15"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'diamond' && (
        <polygon
          points="24,6 42,24 24,42 6,24"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'fog' && (
        <circle
          cx="24"
          cy="24"
          r="16"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'mineral' && (
        <path
          d="M14 10 L34 10 L40 22 L34 38 L14 38 L8 22 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'storm' && (
        <path
          d="M24 6 L30 18 L42 20 L32 30 L34 42 L24 36 L14 42 L16 30 L6 20 L18 18 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'glacier' && (
        <path
          d="M24 4 L38 24 L24 44 L10 24 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'dragon' && (
        <path
          d="M24 6 C32 10 40 20 38 34 C30 44 18 44 10 34 C8 20 16 10 24 6 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'boulder' && (
        <polygon
          points="18,8 30,8 38,18 36,36 24,40 12,36 10,18"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'cascade' && (
        <path
          d="M24 6 C24 6 38 22 38 32 C38 40 32 44 24 44 C16 44 10 40 10 32 C10 22 24 6 24 6 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'thunder' && (
        <polygon
          points="24,6 38,20 28,20 32,42 14,24 22,24"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'rainbow' && (
        <path
          d="M8 38 C8 22 16 10 24 10 C32 10 40 22 40 38 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'soul' && (
        <path
          d="M24 8 C32 14 36 24 32 34 C28 42 20 42 16 34 C12 24 16 14 24 8 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'marsh' && (
        <circle
          cx="24"
          cy="24"
          r="17"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'volcano' && (
        <polygon
          points="24,6 40,38 8,38"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {shape === 'earth' && (
        <path
          d="M10 12 L38 12 L42 36 L6 36 Z"
          fill={`url(#grad-${shape})`}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}

      {/* Brillo reflectivo interior si está desbloqueada */}
      {isUnlocked && (
        <ellipse cx="20" cy="16" rx="6" ry="3" fill="#FFFFFF" opacity="0.6" />
      )}
    </svg>
  );
};

export const GymBadgeShowcase: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const equipCosmetic = useTrainerStore((s) => s.equipCosmetic);
  const isLight = theme === 'light_gbc';

  const [regionTab, setRegionTab] = useState<'johto' | 'kanto'>('johto');
  const [selectedBadge, setSelectedBadge] = useState<GymBadgeData>(GYM_BADGES[0]);
  const [justEquipped, setJustEquipped] = useState<boolean>(false);

  // Nivel del jugador (si no hay perfil, asumimos nivel 1 para visualización)
  const playerLevel = profile?.current_level ?? 1;
  const equippedBadgeId = profile?.equipped_trainer_cosmetics?.badge ?? null;

  // Filtrar según la región activa
  const badgesInRegion = GYM_BADGES.filter((b) => b.region === regionTab);
  const unlockedCount = GYM_BADGES.filter((b) => playerLevel >= b.requiredLevel).length;
  const regionUnlockedCount = badgesInRegion.filter((b) => playerLevel >= b.requiredLevel).length;

  const handleSelectBadge = (badge: GymBadgeData) => {
    soundFx.playClick();
    setSelectedBadge(badge);

    const isUnlocked = playerLevel >= badge.requiredLevel;
    if (isUnlocked) {
      soundFx.playCoin();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.65 },
        colors: [badge.badgeColor, '#F59E0B', '#FFFFFF'],
      });
    }
  };

  const handleEquipBadge = (badge: GymBadgeData) => {
    soundFx.playFanfare();
    equipCosmetic('trainer', 'badge', badge.id);
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 2500);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#E60012', '#22C55E', '#F59E0B', '#38BDF8'],
    });
  };

  const isSelectedUnlocked = playerLevel >= selectedBadge.requiredLevel;
  const isCurrentlyEquipped = equippedBadgeId === selectedBadge.id;

  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-2xl overflow-hidden font-mono border-4 select-none transition-all duration-200 ${
        isLight
          ? 'bg-[#F4F1EA] border-black shadow-[6px_6px_0px_0px_#000] text-slate-900'
          : 'bg-[#121214] border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-slate-100'
      }`}
    >
      {/* Cabecera Tipo Estuche de Medallas Nintendo */}
      <div
        className={`flex items-center justify-between px-5 py-4 border-b-4 ${
          isLight
            ? 'bg-[#E60012] border-black text-white shadow-sm'
            : 'bg-[#1a1c23] border-slate-700 text-amber-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className={`p-2 rounded-xl border-2 ${
              isLight ? 'bg-white/20 border-white text-white' : 'bg-amber-500/20 border-amber-400 text-amber-300'
            }`}
          >
            <Award className="w-6 h-6" />
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase flex items-center gap-2">
              <span>Estuche Oficial de Medallas</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black border ${
                isLight ? 'bg-black text-yellow-300 border-white' : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
              }`}>
                {unlockedCount}/16
              </span>
            </h2>
            <p className={`text-[11px] font-bold ${isLight ? 'text-red-100' : 'text-slate-400'}`}>
              Liga Pokémon Johto & Kanto • Academia SynDex
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className={`p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
              isLight
                ? 'bg-black text-white border-black hover:bg-slate-800 active:translate-x-0.5 active:translate-y-0.5'
                : 'bg-slate-800 text-slate-300 border-slate-600 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selector de Región (Pestañas Físicas Game Boy) */}
      <div className={`flex border-b-2 ${isLight ? 'bg-[#E5E0D5] border-black' : 'bg-[#181a20] border-slate-800'}`}>
        <button
          onClick={() => {
            soundFx.playClick();
            setRegionTab('johto');
            setSelectedBadge(GYM_BADGES[0]);
          }}
          className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-r-2 ${
            isLight ? 'border-black' : 'border-slate-800'
          } ${
            regionTab === 'johto'
              ? isLight
                ? 'bg-[#F4F1EA] text-[#E60012] font-black shadow-inner border-b-2 border-b-transparent'
                : 'bg-[#121214] text-amber-400 border-b-2 border-b-amber-400'
              : isLight
                ? 'text-slate-600 hover:bg-black/5'
                : 'text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>8 Medallas Johto ({GYM_BADGES.filter(b => b.region === 'johto' && playerLevel >= b.requiredLevel).length}/8)</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setRegionTab('kanto');
            setSelectedBadge(GYM_BADGES[8]);
          }}
          className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            regionTab === 'kanto'
              ? isLight
                ? 'bg-[#F4F1EA] text-[#2563EB] font-black shadow-inner border-b-2 border-b-transparent'
                : 'bg-[#121214] text-cyan-400 border-b-2 border-b-cyan-400'
              : isLight
                ? 'text-slate-600 hover:bg-black/5'
                : 'text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>8 Medallas Kanto ({GYM_BADGES.filter(b => b.region === 'kanto' && playerLevel >= b.requiredLevel).length}/8)</span>
        </button>
      </div>

      {/* Contenido Principal: Vitrina Aterciopelada + Panel de Inspección */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Vitrina de Medallas (Estilo Forro de Terciopelo Azul Marino) */}
        <div
          className={`md:col-span-7 p-4 sm:p-5 rounded-xl border-3 transition-colors ${
            isLight
              ? 'bg-[#1E293B] border-black shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]'
              : 'bg-[#0a0c10] border-slate-800 shadow-[inset_0_4px_15px_rgba(0,0,0,0.8)]'
          }`}
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/60">
            <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Vitrina de Honor • Región {regionTab === 'johto' ? 'Johto' : 'Kanto'}
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
              {regionUnlockedCount} Conquistadas
            </span>
          </div>

          {/* Grilla 4x2 de Medallas */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {badgesInRegion.map((badge) => {
              const isUnlocked = playerLevel >= badge.requiredLevel;
              const isSelected = selectedBadge.id === badge.id;
              const isEquipped = equippedBadgeId === badge.id;

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectBadge(badge)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                      : isUnlocked
                        ? 'border-slate-600/60 bg-slate-800/80 hover:border-slate-400'
                        : 'border-slate-800 bg-slate-900/60 opacity-60'
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? `0 0 15px ${badge.glowColor}`
                      : isUnlocked
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
                        : 'none',
                  }}
                >
                  {/* Pin Joya SVG */}
                  <div className="relative">
                    <BadgeShapeIcon
                      shape={badge.svgShape}
                      color={badge.badgeColor}
                      isUnlocked={isUnlocked}
                    />

                    {/* Insignia de Bloqueado */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-400 drop-shadow" />
                      </div>
                    )}

                    {/* Insignia de Equipado */}
                    {isEquipped && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-black flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold mt-1 text-center truncate max-w-full ${
                    isUnlocked ? 'text-slate-100' : 'text-slate-500'
                  }`}>
                    {badge.name.replace('Medalla ', '')}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Panel de Inspección de la Medalla Seleccionada */}
        <div
          className={`md:col-span-5 p-4 rounded-xl border-3 flex flex-col justify-between ${
            isLight
              ? 'bg-white border-black shadow-[4px_4px_0_#000]'
              : 'bg-[#181a20] border-slate-700 shadow-lg'
          }`}
        >
          <div>
            {/* Cabecera del Detalle */}
            <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]"
                  style={{ backgroundColor: isSelectedUnlocked ? selectedBadge.badgeColor : '#475569' }}
                >
                  <BadgeShapeIcon
                    shape={selectedBadge.svgShape}
                    color="#FFFFFF"
                    isUnlocked={isSelectedUnlocked}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{selectedBadge.name}</span>
                  </h3>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${
                    isSelectedUnlocked
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 border-rose-500 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isSelectedUnlocked ? 'OBTENIDA EN COMBATE' : `BLOQUEADA (REQ: NIVEL ${selectedBadge.requiredLevel})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos Técnicos Breves (Zero Paredes de Texto) */}
            <div className="space-y-2 mb-4">
              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className="text-slate-500 font-bold">Líder Oficial:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{selectedBadge.leader}</span>
              </div>

              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className="text-slate-500 font-bold">Ubicación:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBadge.city}</span>
              </div>

              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className="text-slate-500 font-bold">Elemento Táctico:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{selectedBadge.type}</span>
              </div>
            </div>

            {/* Diálogo RPG Clásico de 2 Líneas (Typewriter Style) */}
            <div className={`p-3 rounded-lg border-2 mb-4 relative ${
              isLight
                ? 'bg-[#F4F1EA] border-black text-slate-900 shadow-[2px_2px_0_#000]'
                : 'bg-[#0f1117] border-amber-500/50 text-amber-200'
            }`}>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-500" />
                <span>Efecto en Partida:</span>
              </div>
              <p className="text-xs font-bold leading-snug">
                {selectedBadge.bonus}
              </p>
            </div>
          </div>

          {/* Acciones Tácticas: Equipar en Pechera de Entrenador */}
          <div className="space-y-2 pt-2">
            {isSelectedUnlocked ? (
              <button
                onClick={() => handleEquipBadge(selectedBadge)}
                disabled={isCurrentlyEquipped}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                  isCurrentlyEquipped
                    ? 'bg-emerald-600 text-white border-black opacity-80 cursor-default'
                    : isLight
                      ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] active:scale-95'
                }`}
              >
                {isCurrentlyEquipped ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>EQUIPADA EN PECHERA</span>
                  </>
                ) : justEquipped ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>¡MEDALLA FIJADA!</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>EXHIBIR EN PERFIL</span>
                  </>
                )}
              </button>
            ) : (
              <div className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                isLight ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}>
                Derrota a {selectedBadge.leader} para desbloquear este pin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
