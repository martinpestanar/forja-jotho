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
  ShieldAlert,
  Coins,
  Egg,
  Shield,
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
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
    description: 'Cosecha bayas medicinales de combate y semillas raras para el mercado.',
    accentColor: 'from-emerald-500/20 to-green-600/10 border-emerald-500/40 text-emerald-400',
  },
  {
    id: 'QUARRY',
    name: 'Cantera y Mina',
    icon: Pickaxe,
    allowedTypes: ['Roca', 'Tierra', 'Acero', 'Lucha'],
    durationHours: 4,
    expReward: 6000,
    primaryYield: 'Pepitas de Oro & Fósiles',
    description: 'Excavaciones profundas en busca de minerales nobles y piedras evolutivas.',
    accentColor: 'from-amber-500/20 to-yellow-600/10 border-amber-500/40 text-amber-400',
  },
  {
    id: 'SAWMILL',
    name: 'Aserradero Forestal',
    icon: TreePine,
    allowedTypes: ['Bicho', 'Volador', 'Planta'],
    durationHours: 4,
    expReward: 4000,
    primaryYield: 'Madera Noble de Encinar',
    description: 'Tala sustentable para fabricar infraestructura y mejoras para el rancho.',
    accentColor: 'from-amber-700/20 to-orange-800/10 border-amber-700/40 text-amber-500',
  },
  {
    id: 'GENERATOR',
    name: 'Generador Central',
    icon: Zap,
    allowedTypes: ['Eléctrico', 'Acero'],
    durationHours: 4,
    expReward: 3000,
    primaryYield: 'Baterías & Células ⚡',
    description: 'Alimenta las instalaciones y reduce pasivamente el tiempo de los demás trabajos.',
    accentColor: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/40 text-cyan-400',
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
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';
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
  const [selectedMonSlot, setSelectedMonSlot] = useState<number | null>(null);
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
      alert('¡Energía insuficiente! Completa hábitos en la vida real para recargar Cargas de Vigor (⚡).');
      return;
    }

    soundFx.playCoin();
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
    setSelectedMonSlot(null);
    triggerFloatingPill('-1 ⚡ Carga de Vigor');
  };

  const handleClaim = (shift: Shift) => {
    soundFx.playFanfare();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    triggerFloatingPill(`+${SECTORS.find((s) => s.id === shift.sector_id)?.expReward || 2000} EXP & Cosecha`);
    setShifts((prev) => prev.filter((s) => s.id !== shift.id));
  };

  return (
    <div className="space-y-4">
      {/* HUD Superior de Vigor & Estado */}
      <div className="p-4 rounded-2xl border border-[#E8E5DD] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A359]/15 border border-[#D4A359]/30 flex items-center justify-center text-[#D4A359]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#706E66]">
                Vigor del Entrenador
              </div>
              <div className="text-base font-editorial font-semibold flex items-center gap-2 text-[#1F1E1B]">
                <span>{energyCharges} Cargas ⚡</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5A7D62]/10 text-[#5A7D62]">
                  1 ⚡ = 1 Turno (4h)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#706E66]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
              <Lock className="w-3.5 h-3.5 text-[#D97043]" />
              <span>Work-Lock</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#4A8B99]" />
              <span>Cap Johto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje Flotante de Feedback Dopamínico */}
      <AnimatePresence>
        {floatingPill && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 px-4 py-2.5 rounded-2xl bg-[#1F1E1B] text-white font-medium shadow-lg flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-4 h-4 text-[#D4A359]" />
            <span>{floatingPill}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de los 4 Sectores */}
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
              className="p-4 rounded-2xl border border-[#E8E5DD] bg-white shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-[#D97043]">
                      <SectorIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-editorial font-semibold text-sm text-[#1F1E1B]">{sector.name}</h3>
                      <div className="text-[11px] text-[#706E66]">{sector.primaryYield}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5A7D62]/10 text-[#5A7D62]">
                    +{sector.expReward} EXP
                  </div>
                </div>

                <p className="text-xs text-[#5E5C56] mb-3 leading-relaxed">
                  {sector.description}
                </p>
              </div>

              {/* Estado del Turno */}
              {activeShift ? (
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#D97043] font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      {activeShift.pokemon_name} (Nv. {activeShift.pokemon_level})
                    </span>
                    <span className="text-[#706E66]">
                      {isDone ? (
                        <span className="text-[#5A7D62] font-semibold">¡Completado!</span>
                      ) : (
                        `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`
                      )}
                    </span>
                  </div>

                  {/* Barra elástica de progreso */}
                  <div className="w-full h-1.5 rounded-full bg-[#E8E5DD] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#5A7D62]"
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
                      onClick={() => handleClaim(activeShift)}
                      className="w-full py-2 rounded-xl bg-[#5A7D62] hover:bg-[#4E6D55] text-white font-medium text-xs transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reclamar Cosecha & EXP</span>
                    </button>
                  ) : (
                    <div className="text-center text-[10px] text-[#8A877E] font-mono">
                      Produciendo en el rancho...
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSelectedSector(sector)}
                  className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#D97043] hover:bg-[#CC6437] text-white shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
                >
                  <Clock className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-5 rounded-2xl border border-[#E8E5DD] bg-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F2EFE9]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D97043]" />
                  <h3 className="font-editorial font-semibold text-base text-[#1F1E1B]">Asignar a {selectedSector.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedSector(null)}
                  className="text-xs text-[#706E66] hover:text-[#1F1E1B] font-mono px-2 py-1 rounded-lg hover:bg-[#FAF9F5] transition-colors"
                >
                  Cerrar
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs text-[#5E5C56] mb-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97043] shrink-0 mt-0.5" />
                <span>
                  <strong>Work-Lock:</strong> El Pokémon asignado trabajará durante las 4 horas del turno y consumirá <strong>1 ⚡</strong>.
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-2 pr-1">
                {party.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#8A877E] font-mono">
                    No hay Pokémon en el equipo.
                  </div>
                ) : (
                  party.map((mon, idx) => {
                    const isBusy = shifts.some((s) => s.pokemon_name === (mon.nickname || mon.name));
                    return (
                      <div
                        key={idx}
                        onClick={() => !isBusy && handleStartShift(selectedSector, mon)}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isBusy
                            ? 'opacity-40 cursor-not-allowed bg-[#FAF9F5] border-[#E8E5DD]'
                            : 'cursor-pointer hover:border-[#D97043] bg-white border-[#E8E5DD] shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center">
                            {brokenImages[`ranch_mon_${mon.speciesId || idx}`] ? (
                              <Shield className="w-4 h-4 text-[#D97043]" />
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
                            <div className="font-editorial font-semibold text-xs text-[#1F1E1B]">{mon.nickname || mon.name || 'Pokémon'}</div>
                            <div className="text-[10px] text-[#706E66] font-mono">Nivel {mon.level || 15}</div>
                          </div>
                        </div>
                        {isBusy ? (
                          <span className="text-[11px] font-mono text-[#D97043] flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Ocupado
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#5A7D62]">Asignar ⚡</span>
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
