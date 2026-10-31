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
  Coins
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { soundFx } from '@/lib/soundFx';

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
    <div className="space-y-6">
      {/* HUD Superior de Vigor & Estado */}
      <div
        className={`p-4 rounded-2xl border ${
          isLight
            ? 'bg-[#EAE5D9] border-stone-400 shadow-[3px_3px_0px_0px_#000]'
            : 'bg-stone-900/80 border-stone-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-stone-400">
                Vigor del Entrenador
              </div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span>{energyCharges} ⚡ Cargas</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  1 ⚡ = 1 Turno (4h)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/60 border border-stone-700/50">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Work-Lock Activo</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/60 border border-stone-700/50">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hard Cap Johto (EXP Limit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje Flotante de Feedback Dopamínico */}
      <AnimatePresence>
        {floatingPill && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold shadow-lg flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{floatingPill}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de los 4 Sectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden bg-gradient-to-br ${
                sector.accentColor
              } ${
                isLight
                  ? 'border-stone-400 shadow-[4px_4px_0px_0px_#000]'
                  : 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                    <SectorIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide">{sector.name}</h3>
                    <div className="text-xs opacity-75">{sector.primaryYield}</div>
                  </div>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-black/40 border border-white/10">
                  +{sector.expReward} EXP
                </div>
              </div>

              <p className="text-xs opacity-80 mb-4 line-clamp-2 leading-relaxed">
                {sector.description}
              </p>

              {/* Estado del Turno */}
              {activeShift ? (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      {activeShift.pokemon_name} (Nv. {activeShift.pokemon_level})
                    </span>
                    <span>
                      {isDone ? (
                        <span className="text-emerald-400 font-bold">¡Completado!</span>
                      ) : (
                        `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`
                      )}
                    </span>
                  </div>

                  {/* Barra elástica de progreso */}
                  <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500"
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
                      className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Reclamar Cosecha & EXP
                    </button>
                  ) : (
                    <div className="text-center text-[11px] opacity-60">
                      En producción continua...
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSelectedSector(sector)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    isLight
                      ? 'bg-[#E60012] hover:bg-red-600 text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Asignar Turno (4 Horas)
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Selección de Pokémon para el Turno */}
      <AnimatePresence>
        {selectedSector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border ${
                isLight
                  ? 'bg-[#F4F1EA] border-stone-400 shadow-[6px_6px_0px_0px_#000]'
                  : 'bg-stone-900 border-stone-800 shadow-2xl'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-lg">Asignar a {selectedSector.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedSector(null)}
                  className="text-stone-400 hover:text-white text-sm font-mono"
                >
                  [Cerrar]
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Work-Lock:</strong> El Pokémon asignado no podrá combatir en la ROM durante las 4 horas del turno. Consumirá <strong>1 ⚡</strong>.
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {party.length === 0 ? (
                  <div className="text-center py-6 text-sm text-stone-400">
                    No hay Pokémon en el equipo. Carga tu partida en el emulador.
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
                            ? 'opacity-40 cursor-not-allowed bg-stone-800/40 border-stone-700'
                            : 'cursor-pointer hover:border-emerald-500 bg-stone-800/60 border-stone-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-stone-700 flex items-center justify-center font-bold text-xs">
                            #{mon.speciesId || idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{mon.nickname || mon.name || 'Pokémon'}</div>
                            <div className="text-xs text-stone-400">Nivel {mon.level || 15}</div>
                          </div>
                        </div>
                        {isBusy ? (
                          <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Ocupado
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400">Asignar ⚡</span>
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
