'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Battery, Coins } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

interface VigorHeaderSummaryProps {
  totalCount: number;
  completedCount: number;
  earnedGoldToday: number;
  earnedBatteryToday: number;
  journeyStartDate?: string;
  onOpenOracle: () => void;
  onOpenDatePicker?: () => void;
}

export function VigorHeaderSummary({
  totalCount,
  completedCount,
  earnedGoldToday,
  earnedBatteryToday,
  journeyStartDate,
  onOpenOracle,
  onOpenDatePicker,
}: VigorHeaderSummaryProps) {
  const profile = useTrainerStore((state) => state.profile);
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = percent === 100 && totalCount > 0;

  // Mapa de iniciales y pokémon shiny de bienvenida
  const starterSpeciesMap: Record<string, number> = {
    chikorita: 152,
    cyndaquil: 155,
    totodile: 158,
    bulbasaur: 1,
    charmander: 4,
    squirtle: 7,
    treecko: 252,
    torchic: 255,
    mudkip: 258,
    growlithe: 58,
    houndour: 228,
    ponyta: 77,
    wooper: 194,
    marill: 183,
    horsea: 116,
    larvitar: 246,
    mareep: 179,
    teddiursa: 216,
    eevee: 133,
    dratini: 147,
  };
  const firstPartyMon = profile?.gba_party_json?.[0]?.speciesId;
  const isFirstPartyShiny = profile?.gba_party_json?.[0]?.isShiny ?? false;

  // Extraer shiny si fue elegido en el sintonizador Silph (ej. "shiny_mareep")
  let accessoryShinyId: number | null = null;
  let isAccessoryShiny = false;
  if (profile?.equipped_accessory) {
    const cleanAcc = profile.equipped_accessory.toLowerCase().replace('shiny_', '');
    if (starterSpeciesMap[cleanAcc]) {
      accessoryShinyId = starterSpeciesMap[cleanAcc];
      isAccessoryShiny = profile.equipped_accessory.startsWith('shiny_');
    }
  }
  
  // Revisar si hay un shiny reclamado en tránsito en localStorage
  let pendingShinySpeciesId: number | null = null;
  if (typeof window !== 'undefined' && profile?.id) {
    try {
      const pendingRaw = localStorage.getItem(`syndex_pending_shiny_${profile.id}`);
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (parsed.species_id) pendingShinySpeciesId = parsed.species_id;
      }
    } catch {}
  }

  const hasPokemon = Boolean(
    firstPartyMon ||
    pendingShinySpeciesId ||
    accessoryShinyId ||
    profile?.equipped_pokemon_cosmetics?.targetPokemonId ||
    (profile?.starter_pokemon && starterSpeciesMap[profile.starter_pokemon])
  );

  // PRIORIDAD DE COMPAÑERO:
  // 1. Primer Pokémon del equipo GBA
  // 2. Shiny ganado en el sintonizador Silph (pending o en perfil)
  // 3. Inicial clásico de la historia
  const speciesId =
    firstPartyMon ||
    pendingShinySpeciesId ||
    accessoryShinyId ||
    (profile?.starter_pokemon && starterSpeciesMap[profile.starter_pokemon]) ||
    profile?.equipped_pokemon_cosmetics?.targetPokemonId ||
    null;

  const isShiny = firstPartyMon
    ? isFirstPartyShiny
    : Boolean(pendingShinySpeciesId || isAccessoryShiny);
  const spriteUrl = speciesId ? POKEMON_ASSETS.getAnimatedSprite(speciesId, isShiny) : POKEMON_ASSETS.getEggSprite();

  // Matriz de reactividad sobria de Johto
  const getCompanionMood = () => {
    if (!hasPokemon) {
      return {
        mood: 'En Incubación',
        badgeColor: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
        spriteAnimation: { rotate: [-2, 2, -2, 2, 0], scale: [1, 1.02, 1] },
        dialogue: 'Esperando señal del cartucho. Inicia tu aventura en la consola para despertar a tu compañero.',
        multiplier: '1.0x',
        multiplierBg: 'bg-[#FAF9F5] text-[#706E66]',
        statusEmoji: '🥚',
      };
    }
    if (completedCount === 0) {
      return {
        mood: 'En Reposo',
        badgeColor: 'bg-[#706E66]/10 text-[#706E66] border-[#706E66]/20',
        spriteAnimation: { y: [0, 2, 0], opacity: 0.92 },
        dialogue: 'Zzz... ¿arrancamos el día con hidratación y foco, Entrenador?',
        multiplier: '1.0x',
        multiplierBg: 'bg-[#FAF9F5] text-[#706E66]',
        statusEmoji: '💤',
      };
    }
    if (completedCount >= 1 && completedCount <= 2 && !isAllDone) {
      return {
        mood: 'Animado',
        badgeColor: 'bg-[#2D68C4]/10 text-[#2D68C4] border-[#2D68C4]/25',
        spriteAnimation: { y: [0, -3, 0] },
        dialogue: 'Buen ritmo. Siento el incremento de energía y foco de Johto.',
        multiplier: '1.0x',
        multiplierBg: 'bg-[#2D68C4]/8 text-[#2D68C4]',
        statusEmoji: '✨',
      };
    }
    if (completedCount >= 3 && !isAllDone) {
      return {
        mood: 'Foco Alto',
        badgeColor: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
        spriteAnimation: { y: [0, -5, 0], scale: [1, 1.03, 1] },
        dialogue: 'Disciplina impecable. Casi listos para sellar el día.',
        multiplier: '1.1x Batería',
        multiplierBg: 'bg-[#C59B46]/10 text-[#9A7025]',
        statusEmoji: '⚡',
      };
    }
    // 100% de cumplimiento
    return {
      mood: 'En Fuego',
      badgeColor: 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/25',
      spriteAnimation: { y: [0, -6, 0] },
      dialogue: 'Día perfecto conquistado. La sesión de GBA está más que ganada.',
      multiplier: '1.2x EXP',
      multiplierBg: 'bg-[#D9383A]/10 text-[#D9383A]',
      statusEmoji: '🔥',
    };
  };

  const companion = getCompanionMood();

  const todayStr = new Date().toISOString().split('T')[0];
  const isPendingStart = journeyStartDate && journeyStartDate > todayStr;

  const handleSpriteTap = () => {
    soundFx.playLevelUp();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 25]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Banner de Calibración si la fecha de inicio es futura */}
      {isPendingStart && (
        <div className="rounded-2xl bg-[#FFFBF0] border border-[#C59B46]/30 p-3 flex items-center justify-between gap-2 shadow-[0_2px_6px_rgba(197,155,70,0.06)]">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase text-[#9A7025] tracking-wider flex items-center gap-1 font-mono">
              <span>🌅</span> PERIODO DE VIGILIA & CALIBRACIÓN
            </span>
            <p className="text-xs text-[#706E66] truncate font-mono">
              Inicio oficial: <strong className="text-[#1C1B18]">{journeyStartDate}</strong>
            </p>
          </div>
          {onOpenDatePicker && (
            <button
              onClick={onOpenDatePicker}
              className="px-2.5 py-1 rounded-xl bg-[#C59B46]/15 hover:bg-[#C59B46]/25 text-[#9A7025] border border-[#C59B46]/30 text-[10px] font-mono font-semibold uppercase active:scale-95 transition-all cursor-pointer"
            >
              Cambiar
            </button>
          )}
        </div>
      )}

      {/* HERO COMPONENT: Widget de Arte Digital Pokémon (Display Analogue Pocket) */}
      <div className="rounded-2xl bg-white border border-[#E4E1D8] p-4 space-y-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
        {/* Cabecera del Hero: Sprite en display de hardware + Diálogo teletipo de 1 línea */}
        <div className="flex items-center gap-3.5">
          {/* Sprite con marco display mate */}
          <motion.div
            onClick={handleSpriteTap}
            animate={companion.spriteAnimation}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            title="Toca a tu compañero Pokémon"
            className="w-16 h-16 rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_1px_3px_rgba(26,25,21,0.03)] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all relative overflow-hidden"
          >
            <img
              src={spriteUrl}
              alt="Compañero Pokémon"
              style={{ imageRendering: 'pixelated' }}
              className="max-h-12 max-w-12 object-contain select-none"
              onError={(e) => {
                if (speciesId) {
                  (e.target as HTMLImageElement).src = POKEMON_ASSETS.getBoxIcon(speciesId);
                }
              }}
            />
            <span className="absolute bottom-1 right-1 text-xs select-none">
              {companion.statusEmoji}
            </span>
          </motion.div>

          {/* Diálogo conciso y badges sobrias */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[9px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${companion.badgeColor}`}>
                {companion.mood}
              </span>
              <span className={`text-[9px] font-mono font-medium tracking-wider px-1.5 py-0.5 rounded-md border border-[#E4E1D8] ${companion.multiplierBg}`}>
                {companion.multiplier}
              </span>
            </div>

            {/* Bocadillo de diálogo estilo teletipo editorial */}
            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] leading-snug font-medium">
              "{companion.dialogue}"
            </div>
          </div>
        </div>

        {/* Barra Técnica de Vínculo & Disciplina */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#706E66] font-medium tracking-wider uppercase">VÍNCULO & DISCIPLINA</span>
            <span className={`font-semibold tabular-nums ${isAllDone ? 'text-[#2E8555]' : 'text-[#1C1B18]'}`}>
              {completedCount}/{totalCount} ({percent}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#FAF9F5] border border-[#E4E1D8] p-0.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              className={`h-full rounded-full transition-colors ${
                isAllDone
                  ? 'bg-[#2E8555]'
                  : percent >= 60
                  ? 'bg-[#C59B46]'
                  : 'bg-[#D9383A]'
              }`}
            />
          </div>
        </div>

        {/* Fila de Recompensas Cosechadas + Botón Primario de Nuevo Reto */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E4E1D8]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
            <div className="px-2 py-0.5 rounded-lg bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025] flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[#C59B46]" />
              <span className="tabular-nums">+{earnedGoldToday} 💰</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-[#2D68C4]/8 border border-[#2D68C4]/20 text-[#2D68C4] flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="tabular-nums">+{earnedBatteryToday}m 🔋</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOracle}
            className="bg-[#D9383A] text-white font-semibold text-xs tracking-wider uppercase py-2 px-3.5 rounded-xl shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
            title="Forjar un nuevo hábito o reto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo Reto</span>
          </button>
        </div>
      </div>
    </div>
  );
}
