'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Package, 
  Sprout, 
  Users, 
  Sliders, 
  Heart, 
  Apple, 
  Flame, 
  ChevronRight, 
  Plus, 
  Gamepad2,
  Sparkles
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { useTrainerStore } from '@/store/useTrainerStore';
import confetti from 'canvas-confetti';

export type DesktopLedgerTab = 'vigor' | 'templanza' | 'boveda' | 'rancho' | 'equipo' | 'settings' | 'game';

interface DesktopCompanionDeckProps {
  profileData: any;
  activeTab: DesktopLedgerTab;
  batteryMinutes: number;
  onSelectTab: (tab: DesktopLedgerTab) => void;
  onOpenCreateHabit: () => void;
  onOpenTheater: () => void;
}

export function DesktopCompanionDeck({
  profileData,
  activeTab,
  batteryMinutes,
  onSelectTab,
  onOpenCreateHabit,
  onOpenTheater,
}: DesktopCompanionDeckProps) {
  const profile = useTrainerStore((state) => state.profile);

  const leaderName = profileData?.leader_name || profile?.trainer_name || 'Marty';
  const totem = profileData?.guide_totem?.toUpperCase() || 'LOBO';
  const streak = profileData?.temperance_streak_days ?? profile?.streak_days ?? 0;
  const level = profileData?.current_level ?? profile?.current_level ?? 1;

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
  const activeUserId = profileData?.id || profile?.id;
  if (typeof window !== 'undefined' && activeUserId) {
    try {
      const pendingRaw = localStorage.getItem(`syndex_pending_shiny_${activeUserId}`);
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (parsed.species_id) pendingShinySpeciesId = parsed.species_id;
      }
    } catch {}
  }

  // Comprobar starter_pokemon en perfil o store
  let starterKeyId: number | null = null;
  const rawStarter = profile?.starter_pokemon || profileData?.starter_pokemon;
  if (typeof rawStarter === 'string') {
    const clean = rawStarter.toLowerCase().replace('shiny_', '');
    starterKeyId = starterSpeciesMap[clean] || null;
  } else if (rawStarter && typeof rawStarter === 'object') {
    starterKeyId = (rawStarter as any).speciesId || (rawStarter as any).species_id || null;
  }

  // PRIORIDAD DE COMPAÑERO:
  // 1. Primer Pokémon del equipo en la ROM
  // 2. Shiny pendiente en localStorage
  // 3. Accesorio equipado (ej. shiny_mareep)
  // 4. Starter elegido
  // 5. Cosmético asignado
  // 6. Mareep Shiny (179)
  const speciesId =
    firstPartyMon ||
    pendingShinySpeciesId ||
    accessoryShinyId ||
    starterKeyId ||
    profile?.equipped_pokemon_cosmetics?.targetPokemonId ||
    179;

  const isShiny = firstPartyMon
    ? isFirstPartyShiny
    : Boolean(
        pendingShinySpeciesId ||
        isAccessoryShiny ||
        (typeof rawStarter === 'string' && rawStarter.startsWith('shiny_')) ||
        speciesId === 179
      );

  // Ciclo Bioclimático en Tiempo Real (Día / Atardecer / Noche)
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');

  useEffect(() => {
    const updateBiome = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) {
        setTimeOfDay('day');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('sunset');
      } else {
        setTimeOfDay('night');
      }
    };
    updateBiome();
    const interval = setInterval(updateBiome, 60000);
    return () => clearInterval(interval);
  }, []);

  const biomeTokens = {
    day: {
      bg: 'bg-gradient-to-b from-[#F5EFE4] via-[#FAF9F5] to-[#EBE4D5]',
      border: 'border-[#E0D8C8]',
      label: '☀ DÍA · PUEBLO PRIMAVERA',
      badgeClass: 'text-[#7A7467] bg-[#FAF9F5]/90 border-[#DCD5C5]',
      shadowColor: 'rgba(28, 27, 24, 0.18)',
    },
    sunset: {
      bg: 'bg-gradient-to-b from-[#FFF2DE] via-[#FAF4EA] to-[#EEDBC3]',
      border: 'border-[#DFCBB0]',
      label: '🌇 ATARDECER · RUTA 29',
      badgeClass: 'text-[#9A7025] bg-[#FFF8EE]/90 border-[#E8D0AA]',
      shadowColor: 'rgba(154, 112, 37, 0.22)',
    },
    night: {
      bg: 'bg-gradient-to-b from-[#181B26] via-[#1E2333] to-[#12141D]',
      border: 'border-[#2C3347]',
      label: '🌙 NOCHE DE ASEDIO · JOHTO',
      badgeClass: 'text-[#9BB4D9] bg-[#161A26]/90 border-[#323D57]',
      shadowColor: 'rgba(0, 0, 0, 0.45)',
    },
  }[timeOfDay];

  // Tamagotchi Companion State
  const [affectionPoints, setAffectionPoints] = useState<number>(0);
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [floatingHeart, setFloatingHeart] = useState<boolean>(false);
  const [isEating, setIsEating] = useState(false);

  // Blindaje de carga del Sprite con Fallbacks en Cadena (Anti-Broken Image)
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(POKEMON_ASSETS.getAnimatedSprite(speciesId, isShiny));
  const [fallbackLevel, setFallbackLevel] = useState<number>(0);

  useEffect(() => {
    setImgLoaded(false);
    setFallbackLevel(0);
    setImgSrc(POKEMON_ASSETS.getAnimatedSprite(speciesId, isShiny));
  }, [speciesId, isShiny]);

  const handleSpriteError = () => {
    if (fallbackLevel === 0) {
      // 1. Reintentar con el CDN jsDelivr estático de alta fidelidad
      setFallbackLevel(1);
      setImgSrc(POKEMON_ASSETS.getStaticSprite(speciesId, isShiny));
    } else if (fallbackLevel === 1) {
      // 2. Reintentar con el Box Icon oficial de Gen 7
      setFallbackLevel(2);
      setImgSrc(POKEMON_ASSETS.getBoxIcon(speciesId));
    } else if (fallbackLevel === 2) {
      // 3. Respaldo definitivo infalible: Huevo Rúnico SVG en data URI
      setFallbackLevel(3);
      setImgSrc(POKEMON_ASSETS.getEggSprite());
      setImgLoaded(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && activeUserId) {
      const stored = localStorage.getItem(`syndex_companion_affection_${activeUserId}`);
      if (stored) setAffectionPoints(parseInt(stored, 10) || 0);
    }
  }, [activeUserId]);

  const handlePetCompanion = () => {
    soundFx.playCoin();
    const nextPoints = affectionPoints + 1;
    setAffectionPoints(nextPoints);
    if (typeof window !== 'undefined' && activeUserId) {
      localStorage.setItem(`syndex_companion_affection_${activeUserId}`, nextPoints.toString());
    }

    setFloatingHeart(true);
    setTimeout(() => setFloatingHeart(false), 1200);

    const phrases = [
      '¡Tu Mareep emite un chispazo de lana dorada y satisfacción!',
      'Sientes el vínculo de disciplina inquebrantable con tu compañero.',
      'Tu Mareep brilla con orgullo por tus victorias de hoy.',
      'La llama de tu disciplina y templanza arde con fuerza.',
    ];
    setDialogue(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setDialogue(null), 3500);

    confetti({
      particleCount: 16,
      spread: 45,
      origin: { x: 0.18, y: 0.35 },
      colors: ['#D9383A', '#C59B46', '#FAF9F5'],
    });
  };

  const handleFeedCompanion = () => {
    soundFx.playLevelUp();
    setIsEating(true);
    setDialogue('¡Masticando una Baya Aranja! +3 de Vitalidad.');
    setTimeout(() => {
      setIsEating(false);
      setDialogue(null);
    }, 2800);
  };

  const navItems = [
    {
      id: 'vigor' as DesktopLedgerTab,
      label: 'Misiones Diarias',
      sub: 'Vigor, Oficio y Claridad',
      icon: Zap,
      color: 'text-[#D9383A]',
      activeBg: 'bg-[#D9383A]/8 border-[#D9383A]/30 text-[#D9383A]',
    },
    {
      id: 'templanza' as DesktopLedgerTab,
      label: 'Pase de Templanza',
      sub: `${streak}/30 días invicto`,
      icon: ShieldCheck,
      color: 'text-[#2D68C4]',
      activeBg: 'bg-[#2D68C4]/8 border-[#2D68C4]/30 text-[#2D68C4]',
    },
    {
      id: 'game' as DesktopLedgerTab,
      label: 'Cartucho GBA',
      sub: `${batteryMinutes} min disponibles`,
      icon: Gamepad2,
      color: 'text-[#2E8555]',
      activeBg: 'bg-[#2E8555]/10 border-[#2E8555]/30 text-[#2E8555]',
    },
    {
      id: 'boveda' as DesktopLedgerTab,
      label: 'Bóveda Ancestral',
      sub: 'Mochila .SAV y Suministros',
      icon: Package,
      color: 'text-[#C59B46]',
      activeBg: 'bg-[#C59B46]/10 border-[#C59B46]/35 text-[#9A7025]',
    },
    {
      id: 'rancho' as DesktopLedgerTab,
      label: 'Rancho 4h',
      sub: 'Recolección de bayas y oro',
      icon: Sprout,
      color: 'text-[#2E8555]',
      activeBg: 'bg-[#2E8555]/10 border-[#2E8555]/30 text-[#2E8555]',
    },
    {
      id: 'equipo' as DesktopLedgerTab,
      label: 'Equipo & PC Box 1',
      sub: 'Sincronización en caliente',
      icon: Users,
      color: 'text-[#4A8B99]',
      activeBg: 'bg-[#4A8B99]/10 border-[#4A8B99]/30 text-[#3B7582]',
    },
    {
      id: 'settings' as DesktopLedgerTab,
      label: 'Ajustes & Pactos',
      sub: 'Identidad y contratos',
      icon: Sliders,
      color: 'text-[#1C1B18]',
      activeBg: 'bg-[#1C1B18]/6 border-[#1C1B18]/25 text-[#1C1B18]',
    },
  ];

  return (
    <aside className="w-[310px] shrink-0 space-y-4 select-none">
      {/* 1. Tarjeta del Acompañante con Diorama Bioclimático Johto */}
      <div className="bg-white border border-[#E4E1D8] rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] relative overflow-hidden">
        {/* Encabezado del Entrenador */}
        <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2.5 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-[#1C1B18] tracking-tight">
                {leaderName}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#EAE7DF] text-[#706E66]">
                {totem}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#706E66]">Rango Nv. {level}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF4E8] border border-[#C59B46]/30 text-[#9A7025] font-mono text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-current text-[#D9383A]" />
            <span>{streak}d</span>
          </div>
        </div>

        {/* DIORAMA BIOCLIMÁTICO DINÁMICO */}
        <div 
          onClick={handlePetCompanion}
          className={`relative w-full h-44 rounded-2xl overflow-hidden border ${biomeTokens.border} ${biomeTokens.bg} flex flex-col items-center justify-center p-3 cursor-pointer group shadow-inner transition-all duration-700 active:scale-[0.98]`}
          title="Toca para acariciar a tu compañero"
        >
          {/* Badge del Micro-Clima y Hora */}
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className={`text-[8.5px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border shadow-xs backdrop-blur-xs ${biomeTokens.badgeClass}`}>
              {biomeTokens.label}
            </span>
          </div>

          {/* Insignia Shiny */}
          {isShiny && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/80 border border-[#C59B46]/30 text-[9px] font-mono font-bold text-[#9A7025] shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-[#C59B46]" />
              <span>SHINY</span>
            </div>
          )}

          {/* Estrellas nocturnas sutiles */}
          {timeOfDay === 'night' && (
            <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
              <span className="absolute top-4 right-8 text-[9px] text-[#A6C0E8] animate-pulse">✦</span>
              <span className="absolute top-10 left-6 text-[7px] text-[#A6C0E8] animate-pulse delay-100">✧</span>
              <span className="absolute bottom-6 right-10 text-[8px] text-[#A6C0E8] animate-pulse delay-200">✦</span>
            </div>
          )}

          {/* Contenedor del Sprite con Pedestal y Sombra */}
          <div className="relative flex flex-col items-center justify-center z-10 mt-3">
            {/* Placeholder de carga mientras llega el GIF */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POKEMON_ASSETS.getBoxIcon(speciesId)}
                  alt="Cargando..."
                  className="h-10 w-10 object-contain opacity-40 animate-pulse"
                />
              </div>
            )}

            {/* Sprite del Acompañante */}
            <motion.img
              src={imgSrc}
              alt="Compañero Pokémon"
              onLoad={() => setImgLoaded(true)}
              onError={handleSpriteError}
              animate={
                isEating
                  ? { y: [-2, -8, 0], scale: [1, 1.06, 1] }
                  : { y: [0, -3, 0] }
              }
              transition={{
                repeat: isEating ? 3 : Infinity,
                duration: isEating ? 0.35 : 2.6,
                ease: 'easeInOut',
              }}
              className={`h-22 w-22 object-contain drop-shadow-md z-10 transition-opacity duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Sombra de contacto de hardware en el suelo */}
            <div 
              className="w-16 h-3 rounded-full transition-all duration-300 mt-[-4px]"
              style={{
                backgroundColor: biomeTokens.shadowColor,
                filter: 'blur(1.5px)',
              }}
            />
          </div>

          {/* Corazón flotante al acariciar */}
          <AnimatePresence>
            {floatingHeart && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -28, scale: 1.35 }}
                exit={{ opacity: 0 }}
                className="absolute z-30 pointer-events-none text-[#D9383A]"
              >
                <Heart className="w-7 h-7 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Diálogo / Feedback */}
        {dialogue && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-[10.5px] font-mono text-[#706E66] text-center"
          >
            {dialogue}
          </motion.div>
        )}

        {/* Acciones de Cuidado Táctil */}
        <div className="flex items-center gap-2 mt-3 w-full justify-center">
          <button
            type="button"
            onClick={handlePetCompanion}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] shadow-[0_2px_0_#DCD8CD] active:translate-y-[1px] active:shadow-none text-[10.5px] font-mono font-semibold text-[#1C1B18] transition-all cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-[#D9383A]" />
            <span>Acariciar ({affectionPoints})</span>
          </button>

          <button
            type="button"
            onClick={handleFeedCompanion}
            disabled={isEating}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] shadow-[0_2px_0_#DCD8CD] active:translate-y-[1px] active:shadow-none text-[10.5px] font-mono font-semibold text-[#1C1B18] transition-all cursor-pointer disabled:opacity-50"
          >
            <Apple className="w-3.5 h-3.5 text-[#2E8555]" />
            <span>Alimentar</span>
          </button>
        </div>
      </div>

      {/* 2. Entrada Exclusiva a la Consola GBA Inmersiva */}
      <div className="bg-white border border-[#E4E1D8] rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/25 text-[#2E8555]">
              <Gamepad2 className="h-4 w-4" />
            </span>
            <div>
              <span className="font-mono text-xs font-bold text-[#1C1B18] tracking-tight block leading-none">
                Heart & Soul
              </span>
              <span className="text-[9.5px] font-mono text-[#706E66]">ROM GBA v2.0.6</span>
            </div>
          </div>
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
            batteryMinutes > 20
              ? 'bg-[#2E8555]/10 border-[#2E8555]/25 text-[#2E8555]'
              : 'bg-[#C59B46]/10 border-[#C59B46]/25 text-[#9A7025]'
          }`}>
            <Zap className="h-3 w-3 fill-current" />
            <span>{batteryMinutes}m</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playLevelUp();
            onOpenTheater();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#2E8555] hover:bg-[#257248] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#1E603B] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Abrir Consola Inmersiva</span>
        </button>
      </div>

      {/* 3. Menú de Navegación de la Estación */}
      <nav className="bg-white border border-[#E4E1D8] rounded-2xl p-2 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'game') {
                  soundFx.playLevelUp();
                  onOpenTheater();
                } else {
                  soundFx.playClick();
                  onSelectTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                isActive
                  ? item.activeBg
                  : 'bg-transparent border-transparent hover:bg-[#FAF9F5] hover:border-[#E8E5DD] text-[#706E66]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg ${isActive ? 'bg-white shadow-xs' : 'bg-[#FAF9F5]'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-[#706E66]'}`} />
                </span>
                <div>
                  <span className={`text-xs font-semibold block leading-tight ${isActive ? 'text-[#1C1B18]' : ''}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#706E66]">
                    {item.sub}
                  </span>
                </div>
              </div>

              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 text-[#1C1B18]' : 'text-[#706E66]/40'}`} />
            </button>
          );
        })}
      </nav>

      {/* 4. Acción Primaria: Forjar Misión / Hábito */}
      <button
        type="button"
        onClick={() => {
          soundFx.playClick();
          onOpenCreateHabit();
        }}
        className="w-full py-3 px-4 rounded-xl bg-[#D9383A] hover:bg-[#C92F31] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>Forjar Nueva Misión</span>
      </button>
    </aside>
  );
}
