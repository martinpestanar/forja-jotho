'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

interface FlexibleCompanionBarProps {
  completedCount: number;
  totalCount: number;
  onOpenGrimoire: () => void;
  onOpenJournal?: () => void;
  onOpenTutorial?: () => void;
}

export function FlexibleCompanionBar({
  completedCount,
  totalCount,
  onOpenGrimoire,
  onOpenJournal,
  onOpenTutorial,
}: FlexibleCompanionBarProps) {
  const profile = useTrainerStore((state) => state.profile);
  // Resolver especie acompañante: 1. Equipo GBA, 2. Accesorio/Shiny, 3. Cosmético
  let speciesId = profile?.gba_party_json?.[0]?.speciesId;
  let isShiny = Boolean(profile?.gba_party_json?.[0]?.isShiny);

  if (!speciesId && profile?.equipped_accessory) {
    const clean = profile.equipped_accessory.toLowerCase().replace('shiny_', '');
    const map: Record<string, number> = {
      mareep: 179,
      growlithe: 58,
      houndour: 228,
      ponyta: 77,
      wooper: 194,
      marill: 183,
      horsea: 116,
      larvitar: 246,
      teddiursa: 216,
      eevee: 133,
      dratini: 147,
    };
    if (map[clean]) {
      speciesId = map[clean];
      isShiny = profile.equipped_accessory.startsWith('shiny_');
    }
  }

  if (!speciesId) {
    speciesId = profile?.equipped_pokemon_cosmetics?.targetPokemonId || 179;
  }

  const spriteUrl = POKEMON_ASSETS.getAnimatedSprite(speciesId, isShiny);

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = percent === 100 && totalCount > 0;

  // Matriz de reactividad según avance diario (Estilo Editorial Sobrio)
  const getCompanionState = () => {
    if (completedCount === 0) {
      return {
        mood: 'En Reposo',
        badge: 'bg-[#706E66]/10 text-[#706E66] border-[#706E66]/20',
        message: 'Zzz... ¿arrancamos el día con hidratación y foco, Entrenador?',
        emoji: '💤',
      };
    }
    if (completedCount >= 1 && completedCount <= 2 && !isAllDone) {
      return {
        mood: 'Animado',
        badge: 'bg-[#2D68C4]/10 text-[#2D68C4] border-[#2D68C4]/25',
        message: 'Buen ritmo. Siento el incremento de energía y foco de Johto.',
        emoji: '✨',
      };
    }
    if (completedCount >= 3 && !isAllDone) {
      return {
        mood: 'Foco Alto',
        badge: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
        message: 'Disciplina impecable. Casi listos para sellar el día.',
        emoji: '⚡',
      };
    }
    return {
      mood: 'En Fuego',
      badge: 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/25',
      message: 'Día perfecto conquistado. La sesión de GBA está más que ganada.',
      emoji: '🔥',
    };
  };

  const state = getCompanionState();

  return (
    <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3.5 space-y-3 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0">
            <img
              src={spriteUrl}
              alt="Pokémon"
              style={{ imageRendering: 'pixelated' }}
              className="max-h-6 max-w-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = POKEMON_ASSETS.getBoxIcon(speciesId);
              }}
            />
          </div>
          <span className={`text-[9px] font-mono font-medium uppercase px-2 py-0.5 rounded-md border ${state.badge}`}>
            {state.emoji} {state.mood}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenTutorial && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenTutorial();
              }}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-[#E4E1D8] text-[#1C1B18] font-mono font-medium hover:bg-[#FAF9F5] active:scale-95 transition-all shadow-[0_1px_2px_rgba(26,25,21,0.03)] cursor-pointer"
            >
              📖 Guía
            </button>
          )}
          {onOpenJournal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenJournal();
              }}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-[#E4E1D8] text-[#1C1B18] font-mono font-medium hover:bg-[#FAF9F5] active:scale-95 transition-all shadow-[0_1px_2px_rgba(26,25,21,0.03)] cursor-pointer"
            >
              ✍️ Diario
            </button>
          )}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenGrimoire();
            }}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-[#C59B46]/15 border border-[#C59B46]/30 text-[#9A7025] font-mono font-semibold hover:bg-[#C59B46]/25 active:scale-95 transition-all shadow-[0_1px_2px_rgba(26,25,21,0.03)] cursor-pointer"
          >
            📜 Grimorio
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] leading-snug font-medium">
        "{state.message}"
      </div>

      {/* Barra técnica de Vínculo */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-2 rounded-full bg-[#FAF9F5] border border-[#E4E1D8] p-0.5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              isAllDone ? 'bg-[#2E8555]' : percent >= 60 ? 'bg-[#C59B46]' : 'bg-[#D9383A]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          />
        </div>
        <span className="text-[10px] font-mono font-medium text-[#1C1B18] shrink-0 tabular-nums">
          {completedCount}/{totalCount} ({percent}%)
        </span>
      </div>
    </div>
  );
}
