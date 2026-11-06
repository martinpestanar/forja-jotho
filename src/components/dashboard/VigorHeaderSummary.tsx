'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Battery, Coins, Heart, Sparkles, Apple } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import confetti from 'canvas-confetti';

const EMPTY_VAULT: any[] = [];

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
  const snapshot = useEconomyStore((state) => state.snapshot);
  const vaultItems = snapshot?.vault || EMPTY_VAULT;

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = percent === 100 && totalCount > 0;

  // Estado del Tamagotchi Moderno
  const [affectionPoints, setAffectionPoints] = React.useState<number>(0);
  const [floatingReaction, setFloatingReaction] = React.useState<string | null>(null);
  const [isEating, setIsEating] = React.useState(false);
  const [tamagotchiDialogue, setTamagotchiDialogue] = React.useState<string | null>(null);
  const [isPressing, setIsPressing] = React.useState(false);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cargar y persistir puntos de afecto locales del entrenador
  React.useEffect(() => {
    if (typeof window !== 'undefined' && profile?.id) {
      const stored = localStorage.getItem(`syndex_companion_affection_${profile.id}`);
      if (stored) {
        setAffectionPoints(parseInt(stored, 10) || 0);
      }
    }
  }, [profile?.id]);

  const addAffection = (pts: number) => {
    setAffectionPoints((prev) => {
      const next = Math.min(100, prev + pts);
      if (typeof window !== 'undefined' && profile?.id) {
        localStorage.setItem(`syndex_companion_affection_${profile.id}`, next.toString());
      }
      return next;
    });
  };

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

  // PRIORIDAD DE COMPAÑERO
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
  const fallbackIconUrl = speciesId ? POKEMON_ASSETS.getBoxIcon(speciesId) : POKEMON_ASSETS.getEggSprite();

  const [imgLoaded, setImgLoaded] = React.useState(false);

  // Resetear estado de carga si cambia de especie
  React.useEffect(() => {
    setImgLoaded(false);
  }, [speciesId, isShiny]);

  // Verificar si hay alguna baya en el Alijo / Vault
  const berryItemInVault = React.useMemo(() => {
    return vaultItems.find((v: any) => 
      v.status === 'stored' &&
      (v.item_id_or_species?.toLowerCase().includes('berry') ||
       v.item_id_or_species?.toLowerCase().includes('baya') ||
       v.display_name?.toLowerCase().includes('baya'))
    );
  }, [vaultItems]);

  // Obtener mensaje según hora del día para el Pokéwalker
  const getTimeDialogue = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      return 'Silencio en Johto. El descanso forja el vigor de mañana.';
    }
    if (hour >= 6 && hour < 12) {
      return 'El sol ilumina Trigal. Una sesión de ejercicio temprano forjará el día.';
    }
    if (hour >= 12 && hour < 19) {
      return 'Enfoque constante en tu oficio. El cartucho espera por tu disciplina.';
    }
    return 'Asedio de medianoche cerca. Protege la templanza antes del cierre de ciclo.';
  };

  // Matriz de reactividad sobria de Johto
  const getCompanionMood = () => {
    if (!hasPokemon) {
      return {
        mood: 'En Incubación',
        badgeColor: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
        spriteAnimation: { rotate: [-2, 2, -2, 2, 0], scale: [1, 1.02, 1] },
        dialogue: 'Inicia tu aventura en la consola para despertar a tu Pokémon.',
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
        dialogue: getTimeDialogue(),
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
        dialogue: 'Buen ritmo. Siento el incremento de energía y foco.',
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
      dialogue: 'Día perfecto conquistado. La sesión de GBA está ganada.',
      multiplier: '1.2x EXP',
      multiplierBg: 'bg-[#D9383A]/10 text-[#D9383A]',
      statusEmoji: '🔥',
    };
  };

  const companion = getCompanionMood();

  const todayStr = new Date().toISOString().split('T')[0];
  const isPendingStart = journeyStartDate && journeyStartDate > todayStr;

  // Caricia táctil háptica (Tap rápido)
  const handleSpriteTap = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 20]);
    }
    setFloatingReaction('❤️');
    addAffection(1);
    const petDialogues = [
      '¡Siente tu determinación y se llena de entusiasmo!',
      'Da un pequeño salto de confianza a tu lado.',
      'Aprecia tu disciplina diaria en Johto.',
      'Siente la sintonía entre su cartucho y tu esfuerzo.'
    ];
    setTamagotchiDialogue(petDialogues[Math.floor(Math.random() * petDialogues.length)]);
    setTimeout(() => setFloatingReaction(null), 1200);
  };

  // Caricia prolongada (Press & Hold)
  const handleTouchStart = () => {
    setIsPressing(true);
    pressTimerRef.current = setTimeout(() => {
      soundFx.playFanfare();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 50]);
      }
      setFloatingReaction('✨');
      addAffection(3);
      setTamagotchiDialogue('¡Un lazo inquebrantable se fortalece entre ambos!');
      confetti({
        particleCount: 22,
        spread: 45,
        origin: { y: 0.3, x: 0.2 },
        colors: ['#D9383A', '#C59B46', '#2D68C4'],
      });
      setTimeout(() => setFloatingReaction(null), 1500);
    }, 1000);
  };

  const handleTouchEnd = () => {
    setIsPressing(false);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Ofrecer Baya al Pokémon
  const handleFeedBerry = async () => {
    if (!berryItemInVault || isEating) return;
    setIsEating(true);
    soundFx.playCoin();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20, 30]);
    }
    setFloatingReaction('🍒');
    setTamagotchiDialogue(`¡Saboreó una ${berryItemInVault.display_name}! Vigor renovado.`);
    addAffection(5);

    confetti({
      particleCount: 18,
      spread: 35,
      origin: { y: 0.35, x: 0.2 },
      colors: ['#2E8555', '#C59B46', '#FAF9F5'],
    });

    setTimeout(() => {
      setIsEating(false);
      setFloatingReaction(null);
    }, 1600);
  };

  // Nivel de vínculo total (mezcla de rachas + caricias diarias)
  const currentStreak = profile?.streak_days ?? 0;
  const totalBondPercent = Math.min(100, (currentStreak * 10) + affectionPoints);

  return (
    <div className="space-y-2.5">
      {/* Banner de Calibración si la fecha de inicio es futura */}
      {isPendingStart && (
        <div className="rounded-xl bg-[#FFFBF0] border border-[#C59B46]/30 px-3 py-2 flex items-center justify-between gap-2 shadow-[0_2px_6px_rgba(197,155,70,0.06)]">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[9px] font-semibold uppercase text-[#9A7025] tracking-wider flex items-center gap-1 font-mono">
              <span>🌅</span> PERIODO DE VIGILIA
            </span>
            <p className="text-xs text-[#706E66] truncate font-mono">
              Inicio oficial: <strong className="text-[#1C1B18]">{journeyStartDate}</strong>
            </p>
          </div>
          {onOpenDatePicker && (
            <button
              onClick={onOpenDatePicker}
              className="px-2 py-0.5 rounded-lg bg-[#C59B46]/15 hover:bg-[#C59B46]/25 text-[#9A7025] border border-[#C59B46]/30 text-[10px] font-mono font-semibold uppercase active:scale-95 transition-all cursor-pointer"
            >
              Cambiar
            </button>
          )}
        </div>
      )}

      {/* HERO COMPONENT COMPACTO: Display Mate Analogue Pocket */}
      <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3 sm:p-3.5 space-y-2.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
        {/* Cabecera: Sprite + Diálogo e Indicador de Vínculo */}
        <div className="flex items-center gap-3">
          {/* Sprite con marco display mate interactivo (Tap & Press) */}
          <div className="relative shrink-0">
            <motion.div
              onClick={handleSpriteTap}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              animate={
                isEating
                  ? { y: [0, -6, 0, -4, 0], scale: [1, 1.1, 1] }
                  : isPressing
                  ? { scale: 0.94 }
                  : companion.spriteAnimation
              }
              transition={{
                repeat: isEating || isPressing ? 0 : Infinity,
                duration: isEating ? 0.8 : 2.4,
                ease: 'easeInOut',
              }}
              title="Toca o mantén presionado para acariciar a tu compañero"
              className="w-13 h-13 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_1px_3px_rgba(26,25,21,0.03)] flex items-center justify-center cursor-pointer active:scale-95 transition-all relative overflow-hidden select-none"
            >
              {/* 1. Placeholder estático instantáneo ultra-liviano */}
              {speciesId && !imgLoaded && (
                <img
                  src={fallbackIconUrl}
                  alt="Mini Sprite"
                  style={{ imageRendering: 'pixelated' }}
                  className="max-h-8 max-w-8 object-contain opacity-60 absolute"
                />
              )}

              {/* 2. GIF animado principal Showdown */}
              <img
                src={spriteUrl}
                alt="Compañero Pokémon"
                style={{ imageRendering: 'pixelated' }}
                onLoad={() => setImgLoaded(true)}
                className={`max-h-10 max-w-10 object-contain select-none transition-opacity duration-200 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  if (speciesId) {
                    (e.target as HTMLImageElement).src = fallbackIconUrl;
                    setImgLoaded(true);
                  }
                }}
              />
              <span className="absolute bottom-0.5 right-0.5 text-[10px] select-none leading-none">
                {companion.statusEmoji}
              </span>
            </motion.div>

            {/* Reacción flotante de emoción al interactuar */}
            <AnimatePresence>
              {floatingReaction && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -24, scale: 1.2 }}
                  exit={{ opacity: 0, y: -32, scale: 0.8 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none text-sm z-20"
                >
                  {floatingReaction}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Diálogo conciso y badges sobrias */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[8.5px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${companion.badgeColor}`}>
                {companion.mood}
              </span>
              
              <div className="flex items-center gap-1">
                {/* Botón Alimentar Baya si tiene en el alijo */}
                {berryItemInVault && (
                  <button
                    type="button"
                    onClick={handleFeedBerry}
                    disabled={isEating}
                    title={`Ofrecer ${berryItemInVault.display_name} al compañero`}
                    className="flex items-center gap-1 text-[8.5px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] border border-[#2E8555]/25 hover:bg-[#2E8555]/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Apple className="w-2.5 h-2.5" />
                    <span>Dar Baya</span>
                  </button>
                )}

                <span className={`text-[8.5px] font-mono font-medium tracking-wider px-1.5 py-0.5 rounded-md border border-[#E4E1D8] ${companion.multiplierBg}`}>
                  {companion.multiplier}
                </span>
              </div>
            </div>

            <div className="px-2 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E4E1D8] text-[11px] text-[#1C1B18] leading-tight font-medium truncate">
              "{tamagotchiDialogue || companion.dialogue}"
            </div>
          </div>
        </div>

        {/* Barra Técnica de Vínculo & Disciplina Integrada */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#706E66] font-medium tracking-wider uppercase flex items-center gap-1">
              <span>VÍNCULO POKÉWALKER</span>
              <Heart className="w-2.5 h-2.5 text-[#D9383A] fill-[#D9383A]" />
            </span>
            <span className={`font-bold tabular-nums ${isAllDone ? 'text-[#2E8555]' : 'text-[#1C1B18]'}`}>
              {completedCount}/{totalCount} tareas ({percent}%) · Lazo {totalBondPercent}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#FAF9F5] border border-[#E4E1D8] overflow-hidden">
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

        {/* Recompensas de Hoy + Botón Nuevo Reto */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E4E1D8]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
            <div className="px-2 py-0.5 rounded-lg bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025] flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#C59B46]" />
              <span className="tabular-nums">+{earnedGoldToday} ₽</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-[#2D68C4]/8 border border-[#2D68C4]/20 text-[#2D68C4] flex items-center gap-1">
              <Battery className="w-3 h-3 stroke-[2.2]" />
              <span className="tabular-nums">+{earnedBatteryToday}m</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOracle}
            className="bg-[#D9383A] text-white font-bold text-[10.5px] tracking-wider uppercase py-1.5 px-3 rounded-xl shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
            title="Forjar un nuevo hábito o reto"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Nuevo Reto</span>
          </button>
        </div>
      </div>
    </div>
  );
}
