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
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

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

  const handleStartShift = (sector: RanchSector, mon: any) => {
    if (energyCharges < 1) {
      soundFx.playWarning();
      alert('Energía insuficiente. Cumple hábitos en la vida real para recargar Cargas de Vigor (⚡).');
      return;
    }

    soundFx.playCoin();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }

    const newShift: Shift = {
      id: Math.random().toString(36).substring(2, 9),
      sector_id: sector.id,
      pokemon_name: mon.nickname || mon.name || 'Pokémon',
      pokemon_level: mon.level || 15,
      species_id: mon.speciesId || 25,
      finishes_at: Date.now() + sector.durationHours * 3600 * 1000,
      claimed: false,
    };

    setShifts((prev) => [...prev, newShift]);
    setSelectedSector(null);
    triggerFloatingPill('-1 ⚡ Carga de Vigor');
  };

  const handleClaim = (shift: Shift) => {
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

    triggerFloatingPill(`+${SECTORS.find((s) => s.id === shift.sector_id)?.expReward || 2000} EXP & Cosecha`);
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
                    <span className="flex items-center gap-1.5 text-[#D9383A] font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      {activeShift.pokemon_name} (Nv. {activeShift.pokemon_level})
                    </span>
                    <span className="text-[#1C1B18] font-semibold tabular-nums">
                      {isDone ? (
                        <span className="text-[#2E8555]">¡Cosecha Lista!</span>
                      ) : (
                        `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`
                      )}
                    </span>
                  </div>

                  {/* Barra elástica de progreso */}
                  <div className="w-full h-1.5 rounded-full bg-white border border-[#E4E1D8] p-0.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#2E8555]"
                      initial={{ width: 0 }}
                      animate={{
                        width: isDone
                          ? '100%'
                          : `${Math.min(
                              100,
                              ((sector.durationHours * 3600 - timeLeftSec) /
                                (sector.durationHours * 3600)) *
                                100
                            )}%`,
                      }}
                      transition={{ ease: 'easeOut', duration: 0.5 }}
                    />
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
                    <div className="text-center text-[10px] text-[#706E66] font-mono font-medium">
                      Trabajando en el rancho...
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

      {/* Modal de Selección de Pokémon para el Turno */}
      <AnimatePresence>
        {selectedSector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1B18]/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="w-full max-w-md p-5 rounded-2xl border border-[#E4E1D8] bg-white shadow-[0_12px_40px_rgba(26,25,21,0.12)] text-[#1C1B18]"
            >
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E4E1D8]">
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

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] mb-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D9383A] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Work-Lock:</strong> El Pokémon trabajará durante 4h y consumirá <strong>1 ⚡</strong>.
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-2 pr-1">
                {party.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#706E66] font-mono">
                    No hay Pokémon en el equipo.
                  </div>
                ) : (
                  party.map((mon, idx) => {
                    const isBusy = shifts.some((s) => s.pokemon_name === (mon.nickname || mon.name));
                    return (
                      <div
                        key={idx}
                        onClick={() => !isBusy && handleStartShift(selectedSector, mon)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isBusy
                            ? 'opacity-40 cursor-not-allowed bg-[#FAF9F5] border-[#E4E1D8]'
                            : 'cursor-pointer border-[#E4E1D8] bg-white hover:border-[#D5D1C5] shadow-[0_1px_3px_rgba(26,25,21,0.03)] active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center">
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
                            <div className="font-semibold text-xs text-[#1C1B18]">{mon.nickname || mon.name || 'Pokémon'}</div>
                            <div className="text-[10px] text-[#706E66] font-mono">Nivel {mon.level || 15}</div>
                          </div>
                        </div>
                        {isBusy ? (
                          <span className="text-[10px] font-mono font-medium text-[#D9383A] flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Ocupado
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#2E8555] flex items-center gap-1">
                            Asignar ⚡
                          </span>
                        )}
                      </div>
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
