'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sprout,
  Pickaxe,
  TreePine,
  Zap,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Egg,
  Shield,
  X
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { triggerGbaPokemonExtraction, triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';

interface RanchSector {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedTypes: string[];
  durationHours: number;
  expReward: number;
  primaryYield: string;
  description: string;
  accentBg: string;
  accentColor: string;
}

const SECTORS: RanchSector[] = [
  {
    id: 'ORCHARD',
    name: 'Huerto de Bayas',
    icon: Sprout,
    allowedTypes: ['Agua', 'Planta', 'Fuego'],
    durationHours: 4,
    expReward: 2000,
    primaryYield: 'Bayas Zidra / Caqui',
    description: 'Cultivo de bayas medicinales de combate y semillas raras para el mercado.',
    accentBg: 'bg-[#2E8555]/10 border-[#2E8555]/20',
    accentColor: '#2E8555',
  },
  {
    id: 'QUARRY',
    name: 'Cantera y Mina',
    icon: Pickaxe,
    allowedTypes: ['Roca', 'Tierra', 'Acero', 'Lucha'],
    durationHours: 4,
    expReward: 6000,
    primaryYield: 'Pepitas de Oro & Fósiles',
    description: 'Excavaciones en busca de minerales nobles y piedras evolutivas.',
    accentBg: 'bg-[#C59B46]/10 border-[#C59B46]/25',
    accentColor: '#9A7025',
  },
  {
    id: 'SAWMILL',
    name: 'Aserradero Forestal',
    icon: TreePine,
    allowedTypes: ['Bicho', 'Volador', 'Planta'],
    durationHours: 4,
    expReward: 4000,
    primaryYield: 'Madera Noble de Encinar',
    description: 'Tala sustentable para fabricar infraestructura y mejoras para la guardería.',
    accentBg: 'bg-[#C59B46]/10 border-[#C59B46]/25',
    accentColor: '#9A7025',
  },
  {
    id: 'GENERATOR',
    name: 'Generador Central',
    icon: Zap,
    allowedTypes: ['Eléctrico', 'Acero'],
    durationHours: 4,
    expReward: 3000,
    primaryYield: 'Baterías & Células ⚡',
    description: 'Alimenta las instalaciones y genera horas de flujo para el cartucho.',
    accentBg: 'bg-[#2D68C4]/10 border-[#2D68C4]/20',
    accentColor: '#2D68C4',
  },
];

interface Shift {
  id: string;
  sector_id: string;
  pokemon_name: string;
  pokemon_level: number;
  species_id: number;
  is_shiny?: boolean;
  raw_bytes_b64?: string;
  source_slot?: number;
  finishes_at: number; // timestamp ms
  claimed: boolean;
}

export function RanchSection() {
  const profile = useTrainerStore((s) => s.profile);
  const party = (profile?.gba_party_json as any[]) || [];

  // Estado local sincronizado en memoria para simular los turnos del rancho
  const [shifts, setShifts] = useState<Shift[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('syndex_ranch_shifts');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedSector, setSelectedSector] = useState<RanchSector | null>(null);
  const [floatingPill, setFloatingPill] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const markImageBroken = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('syndex_ranch_shifts', JSON.stringify(shifts));
    }
  }, [shifts]);

  // Actualizador de reloj de turnos cada segundo
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const energyCharges = (profile as any)?.energy_charges ?? 3;

  const triggerFloatingPill = (msg: string) => {
    setFloatingPill(msg);
    setTimeout(() => setFloatingPill(null), 3000);
  };

  const handleStartShift = (sector: RanchSector, mon: any, slotIdx: number) => {
    if (energyCharges < 1) {
      soundFx.playWarning();
      alert('Energía insuficiente. Cumple hábitos en la vida real para recargar Cargas de Vigor (⚡).');
      return;
    }

    if (party.length <= 1) {
      soundFx.playWarning();
      alert('Debes mantener al menos 1 Pokémon en tu equipo para explorar Johto.');
      return;
    }

    const gbaSlot = (mon.slot !== undefined) ? mon.slot : (slotIdx + 1);

    // Disparar extracción atómica del emulador GBA
    triggerGbaPokemonExtraction(gbaSlot, async (res) => {
      if (!res.success) {
        soundFx.playWarning();
        alert(res.error || 'No se pudo retirar el Pokémon del juego.');
        return;
      }

      let rawB64 = '';
      if (res.raw100Bytes) {
        const binStr = Array.from(res.raw100Bytes).map((b) => String.fromCharCode(b)).join('');
        rawB64 = btoa(binStr);
      }

      const newShift: Shift = {
        id: Math.random().toString(36).substring(2, 9),
        sector_id: sector.id,
        pokemon_name: res.nickname || mon.nickname || mon.name || 'Pokémon',
        pokemon_level: res.level || mon.level || 15,
        species_id: res.speciesId || mon.speciesId || 25,
        is_shiny: res.isShiny ?? mon.isShiny,
        raw_bytes_b64: rawB64,
        source_slot: gbaSlot,
        finishes_at: Date.now() + sector.durationHours * 3600 * 1000,
        claimed: false,
      };

      setShifts((prev) => [...prev, newShift]);
      setSelectedSector(null);
      triggerFloatingPill(`🌿 ${newShift.pokemon_name} asignado al ${sector.name}. Retirado del cartucho.`);

      // Registrar también en Supabase valdr_vault como criatura trabajando
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('valdr_vault').insert({
            user_id: user.id,
            item_type: 'pokemon',
            item_id_or_species: String(newShift.species_id),
            display_name: `${newShift.pokemon_name} (En Rancho: ${sector.name})`,
            quantity: 1,
            is_shiny: Boolean(newShift.is_shiny),
            status: 'ranch_working',
            payload_json: {
              shift_id: newShift.id,
              sector: sector.id,
              level: newShift.pokemon_level,
              nickname: newShift.pokemon_name,
            },
          });
        }
      } catch (e) {
        console.warn('[ranch start shift db]', e);
      }
    });
  };

  const handleClaim = async (shift: Shift) => {
    soundFx.playFanfare();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#C59B46', '#D9383A', '#2E8555', '#2D68C4', '#FAF9F5'],
      });
    } catch {}

    const sector = SECTORS.find((s) => s.id === shift.sector_id);
    const expReward = sector?.expReward || 2000;
    const levelUpBonus = Math.floor(expReward / 2000); // Sube 1 nivel por turno completado
    const newLevel = Math.min(100, shift.pokemon_level + Math.max(1, levelUpBonus));

    // Reinyectar el Pokémon de vuelta al cartucho GBA (al equipo o a la PC)
    triggerGbaPokemonInjection({
      speciesId: shift.species_id,
      level: newLevel,
      nickname: shift.pokemon_name,
      isShiny: shift.is_shiny,
      targetDestination: 'auto',
    });

    // Conectar cosecha con la Bóveda en Supabase (valdr_vault)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let itemId = 'BERRY_SITRUS';
        let displayName = 'Baya Zidra (Cosecha Rancho)';
        if (shift.sector_id === 'QUARRY') {
          itemId = 'NUGGET';
          displayName = 'Pepita de Oro (Mina)';
        } else if (shift.sector_id === 'SAWMILL') {
          itemId = 'HARD_STONE';
          displayName = 'Madera Noble / Piedra';
        } else if (shift.sector_id === 'GENERATOR') {
          itemId = 'CELL_BATTERY';
          displayName = 'Célula Eléctrica GBA';
        }

        // Insertar producto cosechado
        await supabase.from('valdr_vault').insert({
          user_id: user.id,
          item_type: 'item',
          item_id_or_species: itemId,
          display_name: displayName,
          quantity: 1,
          status: 'in_vault',
          payload_json: { source: 'ranch_shift', sector: shift.sector_id, pokemon: shift.pokemon_name },
        });

        // Actualizar registro en valdr_vault si existía como ranch_working
        await supabase
          .from('valdr_vault')
          .update({ status: 'dispatched' })
          .eq('user_id', user.id)
          .eq('status', 'ranch_working')
          .contains('payload_json', { shift_id: shift.id });

        // Refrescar economía global
        useEconomyStore.getState().loadEconomy();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('syndex:economy-updated'));
        }
      }
    } catch (e) {
      console.warn('[ranch claim vault error]', e);
    }

    triggerFloatingPill(`✨ ¡${shift.pokemon_name} subió a Nv. ${newLevel} y volvió al juego!`);
    setShifts((prev) => prev.filter((s) => s.id !== shift.id));
  };

  return (
    <div className="space-y-3.5 select-none font-sans">
      {/* HUD Superior de Vigor & Guardería */}
      <div className="p-3.5 rounded-2xl border border-[#E4E1D8] bg-white shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D9383A]/10 border border-[#D9383A]/20 flex items-center justify-center text-[#D9383A]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#706E66]">
                Vigor de Guardería
              </div>
              <div className="text-sm font-semibold flex items-center gap-2 text-[#1C1B18]">
                <span className="font-mono">{energyCharges} Cargas ⚡</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] border border-[#2E8555]/20">
                  1 ⚡ = 1 Turno (4h)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-[#1C1B18]">
              <Lock className="w-3.5 h-3.5 text-[#D9383A]" />
              <span>Work-Lock</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025]">
              <Egg className="w-3.5 h-3.5 text-[#C59B46]" />
              <span>Guardería Johto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación Flotante */}
      <AnimatePresence>
        {floatingPill && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 px-3.5 py-2 rounded-xl bg-white text-[#1C1B18] border border-[#E4E1D8] font-mono font-medium shadow-[0_4px_16px_rgba(26,25,21,0.08)] flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-4 h-4 text-[#C59B46]" />
            <span>{floatingPill}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de los 4 Sectores de Trabajo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTORS.map((sector) => {
          const SectorIcon = sector.icon;
          const activeShift = shifts.find((s) => s.sector_id === sector.id);
          const isDone = activeShift ? nowMs >= activeShift.finishes_at : false;
          const timeLeftSec = activeShift
            ? Math.max(0, Math.floor((activeShift.finishes_at - nowMs) / 1000))
            : 0;
          const hoursLeft = Math.floor(timeLeftSec / 3600);
          const minutesLeft = Math.floor((timeLeftSec % 3600) / 60);
          const secondsLeft = timeLeftSec % 60;

          return (
            <div
              key={sector.id}
              className="p-4 rounded-2xl border border-[#E4E1D8] bg-white shadow-[0_2px_8px_rgba(26,25,21,0.04)] hover:border-[#D5D1C5] flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-[#1C1B18]">
                      <SectorIcon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1C1B18] leading-tight">{sector.name}</h3>
                      <div className="text-[10px] text-[#706E66] font-mono mt-0.5">{sector.primaryYield}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] border border-[#2E8555]/20">
                    +{sector.expReward} EXP
                  </div>
                </div>

                <p className="text-xs text-[#706E66] mb-3 leading-snug line-clamp-2">
                  {sector.description}
                </p>
              </div>

              {/* Estado del Turno */}
              {activeShift ? (
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#D9383A] font-semibold truncate max-w-[150px]">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeShift.pokemon_name} (Nv. {activeShift.pokemon_level})</span>
                    </span>
                    <span className="text-[#1C1B18] font-semibold tabular-nums shrink-0">
                      {isDone ? (
                        <span className="text-[#2E8555] font-bold">¡Cosecha Lista!</span>
                      ) : (
                        `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`
                      )}
                    </span>
                  </div>

                  {/* Indicador Segmentado Analógico estilo Reloj Casio / Game Boy */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-8 gap-1 py-0.5">
                      {Array.from({ length: 8 }).map((_, segmentIdx) => {
                        const totalDuration = sector.durationHours * 3600;
                        const elapsed = Math.max(0, totalDuration - timeLeftSec);
                        const segmentThreshold = (totalDuration / 8) * (segmentIdx + 1);
                        const isSegmentFilled = isDone || elapsed >= segmentThreshold;

                        return (
                          <div
                            key={segmentIdx}
                            className={`h-1.5 rounded-sm transition-all duration-300 ${
                              isSegmentFilled
                                ? isDone
                                  ? 'bg-[#2E8555] shadow-[0_0_3px_rgba(46,133,85,0.4)]'
                                  : 'bg-[#C59B46] shadow-[0_0_3px_rgba(197,155,70,0.3)]'
                                : 'bg-[#E4E1D8]/60'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {isDone ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(activeShift)}
                      className="w-full py-2.5 rounded-xl bg-[#2E8555] hover:bg-[#256e47] text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_2px_0px_#215c3c] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                      <span>Reclamar Cosecha & EXP</span>
                    </button>
                  ) : (
                    <div className="text-center text-[10px] text-[#706E66] font-mono font-medium flex items-center justify-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C59B46] animate-pulse" />
                      <span>Trabajando en el rancho...</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedSector(sector)}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase bg-[#2E8555] hover:bg-[#256e47] text-white shadow-[0_2px_0px_#215c3c] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
                >
                  <Clock className="w-4 h-4 stroke-[2]" />
                  <span>Asignar Turno (4 Horas)</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal / Bottom Sheet Mobile-First de Selección de Pokémon para el Turno */}
      <AnimatePresence>
        {selectedSector && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1B18]/50 backdrop-blur-sm p-0 sm:p-4">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setSelectedSector(null)} 
            />

            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) {
                  setSelectedSector(null);
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                }
              }}
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E4E1D8] bg-white p-5 pb-8 sm:pb-5 shadow-[0_-8px_30px_rgba(26,25,21,0.12)] text-[#1C1B18] max-h-[85vh] flex flex-col"
            >
              {/* Barra de arrastre táctil para móvil */}
              <div className="w-10 h-1 bg-[#DCD8CD] rounded-full mx-auto mb-3 shrink-0 sm:hidden" />

              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E4E1D8] shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2E8555] stroke-[2.2]" />
                  <h3 className="font-semibold text-sm text-[#1C1B18]">Asignar a {selectedSector.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSector(null)}
                  className="w-7 h-7 rounded-lg border border-[#E4E1D8] bg-[#FAF9F5] text-[#706E66] hover:text-[#1C1B18] hover:bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] mb-3 flex items-start gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-[#D9383A] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Work-Lock Real:</strong> El Pokémon se retira temporalmente de tu cartucho GBA, trabajará 4h en el Rancho y subirá de nivel al volver.
                </span>
              </div>

              {/* Subtítulo de Dock de Cartuchos */}
              <div className="flex items-center justify-between text-[10px] font-mono font-medium text-[#706E66] uppercase tracking-wider mb-2 shrink-0">
                <span>Ranuras de tu Equipo GBA ({party.length}/6)</span>
                <span>Desliza para cerrar ↓</span>
              </div>

              <div className="space-y-2 overflow-y-auto mb-2 pr-1 overscroll-contain flex-1">
                {party.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#706E66] font-mono">
                    No hay Pokémon en el equipo.
                  </div>
                ) : (
                  party.map((mon, idx) => {
                    const isBusy = shifts.some((s) => s.pokemon_name === (mon.nickname || mon.name));
                    const isLastMon = party.length <= 1;

                    return (
                      <motion.div
                        key={idx}
                        whileTap={!isBusy && !isLastMon ? { scale: 0.97 } : undefined}
                        onClick={() => {
                          if (isLastMon) {
                            soundFx.playWarning();
                            alert('Debes mantener al menos 1 Pokémon en tu equipo para explorar Johto.');
                            return;
                          }
                          if (!isBusy) handleStartShift(selectedSector, mon, idx);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all select-none ${
                          isBusy || isLastMon
                            ? 'opacity-50 cursor-not-allowed bg-[#FAF9F5] border-[#E4E1D8]'
                            : 'cursor-pointer border-[#E4E1D8] bg-white hover:border-[#2E8555]/50 hover:bg-[#2E8555]/[0.02] shadow-[0_1px_3px_rgba(26,25,21,0.03)] active:border-[#2E8555]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0">
                            {brokenImages[`ranch_mon_${mon.speciesId || idx}`] ? (
                              <Shield className="w-4 h-4 text-[#D9383A]" />
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={POKEMON_ASSETS.getBoxIcon(mon.speciesId || 155)}
                                alt={mon.name}
                                className="w-8 h-8 object-contain [image-rendering:pixelated]"
                                onError={() => markImageBroken(`ranch_mon_${mon.speciesId || idx}`)}
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#1C1B18] flex items-center gap-1.5">
                              <span>{mon.nickname || mon.name || 'Pokémon'}</span>
                              {mon.isShiny && (
                                <span className="text-[9px] text-[#C59B46]">★</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#706E66] font-mono">
                              Ranura #{idx + 1} · Nivel {mon.level || 15}
                            </div>
                          </div>
                        </div>

                        {isBusy ? (
                          <span className="text-[10px] font-mono font-medium text-[#D9383A] flex items-center gap-1 px-2 py-1 rounded-md bg-[#D9383A]/8 border border-[#D9383A]/20">
                            <Lock className="w-3 h-3" /> En Turno
                          </span>
                        ) : isLastMon ? (
                          <span className="text-[10px] font-mono font-medium text-[#706E66] px-2 py-1 rounded-md bg-[#FAF9F5] border border-[#E4E1D8]">
                            Único Pokémon
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#2E8555] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2E8555]/10 border border-[#2E8555]/25 hover:bg-[#2E8555]/20">
                            Asignar ⚡
                          </span>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
