'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { DuoCustomizerCanvas } from './DuoCustomizerCanvas';
import { 
  TRAINER_SKINS_CATALOG, 
  POKEMON_COSTUMES_CATALOG, 
  TuningTarget, 
  TrainerSkin, 
  PokemonCostumeItem 
} from '@/types/cosmetics';
import { JOHTO_POKEDEX_CATALOG } from '@/lib/pokemonAssets';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  User, 
  Zap, 
  Crown, 
  Check, 
  RotateCcw,
  ShoppingBag,
  Flame,
  ShieldCheck,
  Package,
  Coins,
  Lock,
  LockOpen
} from 'lucide-react';

export const TrainerTuningStudio: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const setTrainerSkin = useTrainerStore((s) => s.setTrainerSkin);
  const setPokemonCostume = useTrainerStore((s) => s.setPokemonCostume);
  const setActiveTab = useTrainerStore((s) => s.setActiveTab);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [tuningTarget, setTuningTarget] = useState<TuningTarget>('pokemon');
  const [selectedTrainerCategory, setSelectedTrainerCategory] = useState<'all' | 'classic' | 'cyber' | 'leader' | 'special'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Skins y Disfraces equipados actualmente
  const equippedSkinId = profile?.equipped_trainer_skin || (
    profile?.trainer_name.toLowerCase().includes('oak') ? 'SKIN_OAK_PROFESSOR' : 'SKIN_ETHAN_GOLD'
  );
  const equippedCostumes = profile?.equipped_pokemon_costumes || {};

  // Resolver Pokémon Acompañante
  // Si la partida tiene a Pikachu o lo elegimos, podemos lucir las gorras de Ash
  const starterMap: Record<string, { id: number; name: string }> = {
    cyndaquil: { id: 155, name: 'Cyndaquil' },
    totodile: { id: 158, name: 'Totodile' },
    chikorita: { id: 152, name: 'Chikorita' },
  };
  const defaultStarter = starterMap[profile?.starter_pokemon || 'cyndaquil'] || { id: 155, name: 'Cyndaquil' };

  // Conjunto de especies que el alumno posee actualmente en su inventario / equipo / starter
  const starterSpeciesId = defaultStarter.id;
  const partySpeciesIds = (profile?.gba_party_json || [])
    .map((p: any) => Number(p?.speciesId))
    .filter((id: number) => !isNaN(id) && id > 0);

  const ownedSpeciesIds = new Set<number>([
    starterSpeciesId,
    ...partySpeciesIds,
  ]);

  // Extraer dinámicamente todas las especies del catálogo con su conteo de equipamientos/armaduras
  const candidatePartners = Array.from(
    POKEMON_COSTUMES_CATALOG.reduce((map, costume) => {
      const existing = map.get(costume.applicableSpeciesId);
      if (!existing) {
        map.set(costume.applicableSpeciesId, {
          speciesId: costume.applicableSpeciesId,
          name: costume.speciesName,
          count: 1,
        });
      } else {
        existing.count += 1;
      }
      return map;
    }, new Map<number, { speciesId: number; name: string; count: number }>()).values()
  ).map((item) => ({
    speciesId: item.speciesId,
    baseName: item.name,
    isOwned: ownedSpeciesIds.has(item.speciesId),
    name: `${item.name} (${item.count} ${item.count === 1 ? 'armadura' : 'armaduras'})`,
  }));

  // Inicializar en el starter o en la primera especie que posea el usuario
  const [activePartnerSpeciesId, setActivePartnerSpeciesId] = useState<number>(starterSpeciesId);
  const activePartner = candidatePartners.find((p) => p.speciesId === activePartnerSpeciesId) || candidatePartners[0];
  const isCurrentPartnerOwned = ownedSpeciesIds.has(activePartnerSpeciesId);

  const currentEquippedCostumeId = equippedCostumes[activePartnerSpeciesId] || null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // ── Equipar Skin al Entrenador ──
  const handleSelectTrainerSkin = (skin: TrainerSkin) => {
    soundFx.playCoin();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#06B6D4', '#E60012'],
    });
    setTrainerSkin(skin.id);
    showToast(`👑 ¡Skin equipada: ${skin.name} (${skin.title})!`);
  };

  // ── Equipar Gorra o Traje Oficial al Pokémon ──
  const handleSelectPokemonCostume = (costume: PokemonCostumeItem) => {
    // Validar que el alumno tenga este Pokémon en su inventario o equipo
    if (!ownedSpeciesIds.has(costume.applicableSpeciesId)) {
      soundFx.playDamage();
      showToast(`🔒 Bloqueado: necesitas capturar o tener a ${costume.speciesName} en tu equipo para usar su equipamiento.`);
      return;
    }

    soundFx.playLevelUp();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#10B981', '#E60012'],
    });

    if (currentEquippedCostumeId === costume.id) {
      // Quitar disfraz y volver al original
      setPokemonCostume(activePartnerSpeciesId, null);
      showToast(`Forma restablecida a clásico.`);
    } else {
      setPokemonCostume(activePartnerSpeciesId, costume.id);
      showToast(`✨ ¡${activePartner.baseName} ahora viste: ${costume.name}!`);
    }
  };

  // Filtrar disfraces válidos para el Pokémon seleccionado
  const availableCostumes = POKEMON_COSTUMES_CATALOG.filter(
    (c) => c.applicableSpeciesId === activePartnerSpeciesId
  );

  // Filtrar skins de entrenador por categoría
  const filteredTrainerSkins = selectedTrainerCategory === 'all'
    ? TRAINER_SKINS_CATALOG
    : TRAINER_SKINS_CATALOG.filter((s) => s.category === selectedTrainerCategory);

  return (
    <div className="h-full flex flex-col gap-3 font-mono select-none">
      {/* Toast Notificación con Sonido */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2 border-2 shadow-[4px_4px_0_#000] z-20 ${
              isLight
                ? 'bg-amber-300 text-slate-950 border-black'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{feedbackMsg}</span>
            </div>
            <span className="text-[10px] opacity-75">ACTUALIZADO EN TIEMPO REAL</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header del Taller Profesional */}
      <div
        className={`p-3 rounded-xl border-2 flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight
            ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
            : 'bg-[#121214] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border-2 flex items-center justify-center ${
              isLight
                ? 'bg-amber-400 text-black border-black shadow-[2px_2px_0_#000]'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
            }`}
          >
            <Crown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10">
                CYBER-JOHTO ATELIER & VAULT
              </span>
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500" /> Ilustraciones & Gorras Oficiales
              </span>
            </div>
            <h2 className="text-base font-black tracking-tight uppercase">
              Taller de Skins & Gorras Oficiales
            </h2>
          </div>
        </div>

        {/* Saldo de Pokédólares */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">SALDO POKÉDÓLARES:</span>
            <span className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>₽{(profile?.pokedollars ?? 0).toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Escaparate Dúo + Selector de Skins & Gorras */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Lado Izquierdo: Escaparate en Vivo (5 Columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
          <DuoCustomizerCanvas
            trainerName={profile?.trainer_name || 'Profesor Oak'}
            trainerSkinId={equippedSkinId}
            partnerSpeciesId={activePartnerSpeciesId}
            partnerPokemonName={activePartner.name}
            equippedCostumeId={currentEquippedCostumeId}
            activeHighlight={tuningTarget}
            interactive={true}
            onSelectTarget={(t) => {
              soundFx.playClick();
              setTuningTarget(t);
            }}
            size="md"
          />

          {/* Selector de Pokémon Objetivo (Pikachu, Raichu, etc.) */}
          <div
            className={`p-2.5 rounded-xl border-2 flex flex-col gap-1.5 ${
              isLight ? 'bg-white border-black shadow-[2px_2px_0_#000]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Seleccionar Pokémon para Tunear:</span>
              <span className="text-amber-500">
                {availableCostumes.length} {availableCostumes.length === 1 ? 'traje disponible' : 'trajes disponibles'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {candidatePartners.map((cand) => {
                const isSelected = cand.speciesId === activePartnerSpeciesId;
                const isOwned = cand.isOwned;

                return (
                  <button
                    key={cand.speciesId}
                    onClick={() => {
                      soundFx.playClick();
                      setActivePartnerSpeciesId(cand.speciesId);
                      setTuningTarget('pokemon');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 border whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-[#E60012] text-white border-black shadow-[2px_2px_0_#000]'
                          : 'bg-emerald-500 text-slate-950 border-black font-black'
                        : isOwned
                        ? isLight
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
                        : 'bg-black/10 text-slate-400 border-transparent hover:border-black/30 opacity-70'
                    }`}
                  >
                    {isOwned ? (
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    <span>{cand.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Catálogo de Trajes & Skins Reales (7 Columnas) */}
        <div
          className={`lg:col-span-7 rounded-2xl p-4 border-2 flex flex-col justify-between min-h-0 ${
            isLight
              ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
              : 'bg-[#0f172a] border-slate-700'
          }`}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {/* Interruptor: ¿A quién quieres tunear? */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-400">TUNEAR:</span>
              <div className="flex rounded-xl p-1 bg-black/10 border border-black/20 flex-1">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setTuningTarget('pokemon');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    tuningTarget === 'pokemon'
                      ? isLight
                        ? 'bg-[#2563EB] text-white shadow-[2px_2px_0_#000]'
                        : 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Gorras & Trajes Pokémon ({activePartner.name})</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setTuningTarget('trainer');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    tuningTarget === 'trainer'
                      ? isLight
                        ? 'bg-[#E60012] text-white shadow-[2px_2px_0_#000]'
                        : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Skins de Entrenador (16)</span>
                </button>
              </div>
            </div>

            {/* Sub-Filtros si estamos en Entrenador */}
            {tuningTarget === 'trainer' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-black/10 text-[11px]">
                {[
                  { id: 'all', label: 'Todos (16)' },
                  { id: 'classic', label: 'Clásicos' },
                  { id: 'cyber', label: 'Cyber & Hackers' },
                  { id: 'leader', label: 'Líderes & Campeones' },
                  { id: 'special', label: 'Especiales' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedTrainerCategory(cat.id as any);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                      selectedTrainerCategory === cat.id
                        ? isLight
                          ? 'bg-black text-white'
                          : 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-black/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Cuadrícula de Ítems / Trajes Disponibles */}
            <div className="flex-1 overflow-y-auto py-1 pr-1 min-h-0">
              {tuningTarget === 'pokemon' ? (
                /* ── LISTA DE GORRAS Y TRAJES POKÉMON ── */
                availableCostumes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableCostumes.map((costume) => {
                      const isEquipped = currentEquippedCostumeId === costume.id;
                      const isPokemonOwned = ownedSpeciesIds.has(costume.applicableSpeciesId);

                      return (
                        <div
                          key={costume.id}
                          onClick={() => handleSelectPokemonCostume(costume)}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all relative ${
                            !isPokemonOwned
                              ? 'opacity-65 bg-black/5 border-slate-700/50'
                              : isEquipped
                              ? isLight
                                ? 'bg-amber-100 border-black shadow-[3px_3px_0_#000]'
                                : 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                              : isLight
                              ? 'bg-white border-black/30 hover:border-black'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-lg bg-black/10 flex items-center justify-center shrink-0 border border-black/10 overflow-hidden relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={costume.costumeSpriteUrl}
                                alt={costume.name}
                                className={`h-12 w-12 object-contain filter drop-shadow-md ${!isPokemonOwned ? 'grayscale-40' : ''}`}
                              />
                              {!isPokemonOwned && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-rose-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase text-amber-500 block truncate">
                                {costume.badge}
                              </span>
                              <h4 className="text-xs font-black truncate leading-snug">{costume.name}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {!isPokemonOwned ? (
                                  <span className="text-rose-400 font-bold">🔒 Requiere capturar a {costume.speciesName}</span>
                                ) : (
                                  costume.description
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isEquipped ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3 stroke-3" /> PUESTO
                              </span>
                            ) : !isPokemonOwned ? (
                              <span className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-600/40 text-[10px] font-black flex items-center gap-1">
                                <Lock className="w-3 h-3" /> BLOQUEADO
                              </span>
                            ) : (
                              <button className="px-2.5 py-1 rounded-lg bg-black/10 text-xs font-black hover:bg-black/20">
                                Equipar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <Package className="w-8 h-8 opacity-40 animate-pulse text-amber-500" />
                    <p className="text-xs font-bold text-slate-400">
                      {activePartner.name} actualmente viste su forma oficial estándar.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Selecciona a <strong>Pikachu</strong> arriba para probar sus 12 gorras oficiales de Ash y disfraces de Showdown.
                    </p>
                  </div>
                )
              ) : (
                /* ── LISTA DE SKINS DE ENTRENADOR ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredTrainerSkins.map((skin) => {
                    const isEquipped = equippedSkinId === skin.id;
                    return (
                      <div
                        key={skin.id}
                        onClick={() => handleSelectTrainerSkin(skin)}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          isEquipped
                            ? isLight
                              ? 'bg-amber-100 border-black shadow-[3px_3px_0_#000]'
                              : 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : isLight
                            ? 'bg-white border-black/30 hover:border-black'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-black/10 flex items-center justify-center shrink-0 border border-black/10 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={skin.spriteUrl}
                              alt={skin.name}
                              className="h-12 object-contain filter drop-shadow-md"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-amber-500 block truncate">
                              {skin.badge}
                            </span>
                            <h4 className="text-xs font-black truncate leading-snug">{skin.name}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{skin.title}</p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isEquipped ? (
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
                              <Check className="w-3 h-3 stroke-3" /> ACTIVO
                            </span>
                          ) : (
                            <button className="px-2.5 py-1 rounded-lg bg-black/10 text-xs font-black hover:bg-black/20">
                              Usar Skin
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer de Acciones Rápidas */}
          <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>✨ Todos los trajes y gorras son oficiales de la saga Pokémon.</span>
            {tuningTarget === 'pokemon' && currentEquippedCostumeId && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setPokemonCostume(activePartnerSpeciesId, null);
                  showToast('Forma restablecida a clásico.');
                }}
                className="flex items-center gap-1 hover:text-rose-400 font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Quitar Gorra / Disfraz</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
