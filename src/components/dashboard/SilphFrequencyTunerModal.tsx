'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Radio, Flame, Droplets, Trees, Zap, Check, ArrowRight, X } from 'lucide-react';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';

export interface ShinyRewardCandidate {
  speciesId: number;
  name: string;
  element: 'fuego' | 'agua' | 'planta' | 'caos';
  elementLabel: string;
  badgeBg: string;
  badgeColor: string;
  accentColor: string;
  heldItemName: string;
  description: string;
}

const ELEMENTAL_CANDIDATES: Record<'fuego' | 'agua' | 'planta' | 'caos', ShinyRewardCandidate[]> = {
  fuego: [
    {
      speciesId: 58,
      name: 'Growlithe',
      element: 'fuego',
      elementLabel: 'Fuego & Vigor',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      accentColor: '#D9383A',
      heldItemName: 'Carbón',
      description: 'Leal y protector. Su pelaje dorado destella con cada hábito cumplido.',
    },
    {
      speciesId: 228,
      name: 'Houndour',
      element: 'fuego',
      elementLabel: 'Fuego / Siniestro',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      accentColor: '#D9383A',
      heldItemName: 'Moneda Amuleto',
      description: 'Estratega nocturno de Johto. Perfecto para sesiones de foco implacable.',
    },
    {
      speciesId: 77,
      name: 'Ponyta',
      element: 'fuego',
      elementLabel: 'Fuego & Pasión',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      accentColor: '#D9383A',
      heldItemName: 'Baya Zreza',
      description: 'Llamas azules espectrales en su forma Shiny. Representa la velocidad y el empuje.',
    },
  ],
  agua: [
    {
      speciesId: 194,
      name: 'Wooper',
      element: 'agua',
      elementLabel: 'Agua & Serenidad',
      badgeBg: '#DBEAFE',
      badgeColor: '#1E40AF',
      accentColor: '#2D68C4',
      heldItemName: 'Restos',
      description: 'De tono rosa pastel en su versión Shiny. Calma imperturbable frente al estrés.',
    },
    {
      speciesId: 183,
      name: 'Marill',
      element: 'agua',
      elementLabel: 'Agua / Hada',
      badgeBg: '#DBEAFE',
      badgeColor: '#1E40AF',
      accentColor: '#2D68C4',
      heldItemName: 'Huevo Suerte',
      description: 'Esfera verde esmeralda. Su cola actúa como boya de flotación emocional.',
    },
    {
      speciesId: 116,
      name: 'Horsea',
      element: 'agua',
      elementLabel: 'Agua Pura',
      badgeBg: '#DBEAFE',
      badgeColor: '#1E40AF',
      accentColor: '#2D68C4',
      heldItemName: 'Escama Dragón',
      description: 'Elegante habitante de los remolinos de Johto. Tonos turquesa radiantes.',
    },
  ],
  planta: [
    {
      speciesId: 246,
      name: 'Larvitar',
      element: 'planta',
      elementLabel: 'Roca & Disciplina',
      badgeBg: '#DCFCE7',
      badgeColor: '#166534',
      accentColor: '#2E8555',
      heldItemName: 'Piedra Dura',
      description: 'Nacido en el Monte Plateado. Construye su coraza a base de consistencia diaria.',
    },
    {
      speciesId: 179,
      name: 'Mareep',
      element: 'planta',
      elementLabel: 'Eléctrico & Foco',
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      accentColor: '#C59B46',
      heldItemName: 'Imán',
      description: 'Lana rosada brillante. Almacena la energía de tus victorias matutinas.',
    },
    {
      speciesId: 216,
      name: 'Teddiursa',
      element: 'planta',
      elementLabel: 'Normal & Fuerza',
      badgeBg: '#DCFCE7',
      badgeColor: '#166534',
      accentColor: '#2E8555',
      heldItemName: 'Baya Aranja',
      description: 'Verde brillante en su forma Shiny. Representa la disciplina del descanso reparador.',
    },
  ],
  caos: [
    {
      speciesId: 133,
      name: 'Eevee',
      element: 'caos',
      elementLabel: 'Adaptabilidad Pura',
      badgeBg: '#F3E8FF',
      badgeColor: '#6B21A8',
      accentColor: '#8B5CF6',
      heldItemName: 'Piedra Eterna',
      description: 'Plateado brillante. Capaz de moldearse según las metas que elijas conquistar.',
    },
    {
      speciesId: 147,
      name: 'Dratini',
      element: 'caos',
      elementLabel: 'Dragón Místico',
      badgeBg: '#F3E8FF',
      badgeColor: '#6B21A8',
      accentColor: '#8B5CF6',
      heldItemName: 'Colmillo Dragón',
      description: 'Mítico y de tono rosa suave. Premia la constancia de largo plazo.',
    },
  ],
};

interface SilphFrequencyTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: (reward: ShinyRewardCandidate) => void;
}

export const SilphFrequencyTunerModal: React.FC<SilphFrequencyTunerModalProps> = ({
  isOpen,
  onClose,
  onClaimed,
}) => {
  const profile = useTrainerStore((state) => state.profile);
  const updateProfile = useTrainerStore((state) => state.updateProfile);

  const [step, setStep] = useState<'tune' | 'revealing' | 'revealed'>('tune');
  const [selectedFreq, setSelectedFreq] = useState<'fuego' | 'agua' | 'planta' | 'caos'>('fuego');
  const [wonPokemon, setWonPokemon] = useState<ShinyRewardCandidate | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleTune = () => {
    soundFx.playClick();
    setStep('revealing');

    // Selección aleatoria dentro del pool de la frecuencia sintonizada
    const pool = ELEMENTAL_CANDIDATES[selectedFreq];
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      soundFx.playLevelUp();
      setWonPokemon(picked);
      setStep('revealed');
    }, 1800);
  };

  const handleClaim = async () => {
    if (!wonPokemon) return;
    setSaving(true);
    soundFx.playCoin();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const pendingPayload = {
        species_id: wonPokemon.speciesId,
        species_name: wonPokemon.name,
        is_shiny: true,
        level: 5,
        held_item: wonPokemon.heldItemName,
        claimed_at: new Date().toISOString(),
        transferred_to_sav: false,
      };

      if (user) {
        localStorage.setItem(`syndex_pending_shiny_${user.id}`, JSON.stringify(pendingPayload));
        localStorage.setItem(`syndex_shiny_tuned_${user.id}`, 'true');

        // Registrar en perfil Supabase
        await supabase
          .from('profiles')
          .update({
            // Guardamos el pending_shiny para la inyección automática al primer save
            equipped_accessory: `shiny_${wonPokemon.name.toLowerCase()}`,
          })
          .eq('id', user.id);
      }

      // Actualizar Zustand
      updateProfile({
        equipped_accessory: `shiny_${wonPokemon.name.toLowerCase()}`,
      });

      onClaimed?.(wonPokemon);
      onClose();
    } catch (e) {
      console.error('[SilphFrequencyTuner] Error claiming reward:', e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-md bg-[#FAF9F5] border border-[#E4E1D8] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Cabecera Editorial Retro-Premium */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFFBF0] border border-[#C59B46]/40 flex items-center justify-center text-[#C59B46]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#706E66] block">
                Radio Torre de Trigal • Silph Co.
              </span>
              <h2 className="text-base font-semibold text-[#1C1B18] tracking-tight">
                Sintonizador de Frecuencia Shiny
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#706E66] hover:text-[#1C1B18] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'tune' && (
            <motion.div
              key="tune-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-[#706E66] leading-relaxed mb-3">
                  Como nuevo entrenador en SynDex, la antena Silph ha captado una señal anómala.
                  Elige un canal elemental para sintonizar el radar y rescatar a tu <strong className="text-[#1C1B18]">Pokémon Shiny de bienvenida</strong>.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Fuego */}
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setSelectedFreq('fuego'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedFreq === 'fuego'
                        ? 'border-[#D9383A] bg-[#FEF2F2] shadow-sm ring-1 ring-[#D9383A]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#D9383A]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Flame className="w-4 h-4 text-[#D9383A]" />
                      <span className="text-[9px] font-mono text-[#D9383A] font-semibold">CANAL 01</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1C1B18]">Vigor (Fuego)</div>
                    <div className="text-[10px] text-[#706E66]">Growlithe, Houndour...</div>
                  </button>

                  {/* Agua */}
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setSelectedFreq('agua'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedFreq === 'agua'
                        ? 'border-[#2D68C4] bg-[#EFF6FF] shadow-sm ring-1 ring-[#2D68C4]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#2D68C4]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Droplets className="w-4 h-4 text-[#2D68C4]" />
                      <span className="text-[9px] font-mono text-[#2D68C4] font-semibold">CANAL 02</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1C1B18]">Foco (Agua)</div>
                    <div className="text-[10px] text-[#706E66]">Wooper, Marill...</div>
                  </button>

                  {/* Planta */}
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setSelectedFreq('planta'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedFreq === 'planta'
                        ? 'border-[#2E8555] bg-[#F0FDF4] shadow-sm ring-1 ring-[#2E8555]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#2E8555]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Trees className="w-4 h-4 text-[#2E8555]" />
                      <span className="text-[9px] font-mono text-[#2E8555] font-semibold">CANAL 03</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1C1B18]">Disciplina (Tierra)</div>
                    <div className="text-[10px] text-[#706E66]">Larvitar, Mareep...</div>
                  </button>

                  {/* Caos */}
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setSelectedFreq('caos'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedFreq === 'caos'
                        ? 'border-[#8B5CF6] bg-[#FAF5FF] shadow-sm ring-1 ring-[#8B5CF6]'
                        : 'border-[#E4E1D8] bg-white hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Zap className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="text-[9px] font-mono text-[#8B5CF6] font-semibold">CANAL OMEGA</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1C1B18]">Caos Misterioso</div>
                    <div className="text-[10px] text-[#706E66]">Eevee, Dratini...</div>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTune}
                className="w-full py-3 px-4 rounded-2xl bg-[#D9383A] hover:bg-[#C22E30] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Sintonizar Frecuencia & Eclosionar Señal</span>
              </button>
            </motion.div>
          )}

          {step === 'revealing' && (
            <motion.div
              key="revealing-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#C59B46]/30 border-t-[#C59B46] animate-spin flex items-center justify-center" />
                <Sparkles className="w-8 h-8 text-[#C59B46] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[#C59B46]">
                  Calibrando Oscilador de Cristal...
                </p>
                <p className="text-xs text-[#706E66] mt-1">
                  Decodificando firma genética Shiny en el cartucho
                </p>
              </div>
            </motion.div>
          )}

          {step === 'revealed' && wonPokemon && (
            <motion.div
              key="revealed-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFFBF0] border border-[#C59B46]/40 text-[#C59B46] text-[10px] font-mono font-bold">
                  <Sparkles className="w-3 h-3 fill-[#C59B46]" />
                  <span>SHINY</span>
                </div>

                <div className="my-2 flex justify-center">
                  <img
                    src={POKEMON_ASSETS.getAnimatedSprite(wonPokemon.speciesId, true)}
                    alt={wonPokemon.name}
                    className="w-24 h-24 object-contain filter drop-shadow-md"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = POKEMON_ASSETS.getBoxIcon(wonPokemon.speciesId);
                    }}
                  />
                </div>

                <h3 className="text-base font-bold text-[#1C1B18]">{wonPokemon.name}</h3>
                <span
                  className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full mt-1"
                  style={{ backgroundColor: wonPokemon.badgeBg, color: wonPokemon.badgeColor }}
                >
                  {wonPokemon.elementLabel} • Nivel 5
                </span>

                <p className="text-xs text-[#706E66] mt-3 leading-relaxed">
                  {wonPokemon.description}
                </p>

                <div className="mt-3 pt-3 border-t border-[#E4E1D8]/80 flex items-center justify-between text-xs text-[#706E66]">
                  <span>Objeto equipado:</span>
                  <strong className="text-[#1C1B18] font-mono">{wonPokemon.heldItemName}</strong>
                </div>
              </div>

              {/* Guía del punto ciego resuelto */}
              <div className="p-3 bg-[#FFFBF0] border border-[#C59B46]/30 rounded-2xl">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#C59B46] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#9A7025] leading-relaxed">
                    <strong>¿Cómo llega a tu cartucho?</strong> Inicia tu partida en el emulador, elige tu primer Pokémon con el Profesor Elm y guarda la partida. Tu {wonPokemon.name} Shiny se transferirá a la <strong>PC Box 1</strong> con tu ID de entrenador.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleClaim}
                className="w-full py-3 px-4 rounded-2xl bg-[#D9383A] hover:bg-[#C22E30] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Guardando en SynDex...' : `Vincular a ${wonPokemon.name} como Acompañante`}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
