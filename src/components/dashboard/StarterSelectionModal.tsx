'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Shield, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { ALL_STARTERS, StarterOption } from '@/lib/starterCatalog';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';

interface StarterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelected?: (starter: StarterOption) => void;
}

export const StarterSelectionModal: React.FC<StarterSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelected,
}) => {
  const profile = useTrainerStore((state) => state.profile);
  const updateProfile = useTrainerStore((state) => state.updateProfile);

  // Generar la terna de 3 iniciales aleatorios (1 de Kanto, 1 de Johto, 1 de Hoenn, equilibrando tipos si es posible)
  const [trio, setTrio] = useState<StarterOption[]>(() => {
    const kanto = ALL_STARTERS.filter((s) => s.region === 'Kanto');
    const johto = ALL_STARTERS.filter((s) => s.region === 'Johto');
    const hoenn = ALL_STARTERS.filter((s) => s.region === 'Hoenn');

    const randKanto = kanto[Math.floor(Math.random() * kanto.length)];
    // Intentar que no repitan el mismo tipo elemental
    const availableJohto = johto.filter((s) => s.type !== randKanto.type);
    const randJohto = availableJohto.length > 0
      ? availableJohto[Math.floor(Math.random() * availableJohto.length)]
      : johto[Math.floor(Math.random() * johto.length)];

    const availableHoenn = hoenn.filter((s) => s.type !== randKanto.type && s.type !== randJohto.type);
    const randHoenn = availableHoenn.length > 0
      ? availableHoenn[Math.floor(Math.random() * availableHoenn.length)]
      : hoenn[Math.floor(Math.random() * hoenn.length)];

    return [randKanto, randJohto, randHoenn];
  });

  const [selectedStarter, setSelectedStarter] = useState<StarterOption>(trio[0]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Función para re-lanzar la terna aleatoria
  const rerollTrio = () => {
    soundFx.playClick();
    const kanto = ALL_STARTERS.filter((s) => s.region === 'Kanto');
    const johto = ALL_STARTERS.filter((s) => s.region === 'Johto');
    const hoenn = ALL_STARTERS.filter((s) => s.region === 'Hoenn');

    const randKanto = kanto[Math.floor(Math.random() * kanto.length)];
    const availableJohto = johto.filter((s) => s.type !== randKanto.type);
    const randJohto = availableJohto.length > 0
      ? availableJohto[Math.floor(Math.random() * availableJohto.length)]
      : johto[Math.floor(Math.random() * johto.length)];

    const availableHoenn = hoenn.filter((s) => s.type !== randKanto.type && s.type !== randJohto.type);
    const randHoenn = availableHoenn.length > 0
      ? availableHoenn[Math.floor(Math.random() * availableHoenn.length)]
      : hoenn[Math.floor(Math.random() * hoenn.length)];

    const nextTrio = [randKanto, randJohto, randHoenn];
    setTrio(nextTrio);
    setSelectedStarter(nextTrio[0]);
  };

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSaving(true);
    soundFx.playClick();

    try {
      // 1. Actualizar perfil local en store
      const newParty = [
        {
          name: selectedStarter.name,
          speciesId: selectedStarter.speciesId,
          level: 5,
          hp: 20,
          maxHp: 20,
          type: selectedStarter.type,
          isShiny: true,
        },
      ];

      updateProfile({
        starter_pokemon: selectedStarter.key,
        gba_party_json: newParty,
      });

      // 2. Persistir en Supabase (tabla profiles) si está logueado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({
            starter_pokemon: selectedStarter.key,
            gba_party_json: newParty,
          })
          .eq('id', user.id);
        
        localStorage.setItem(`syndex_starter_chosen_${user.id}`, 'true');
      } else {
        localStorage.setItem('syndex_starter_chosen_guest', 'true');
      }

      soundFx.playLevelUp();
      setSavedSuccess(true);

      if (onSelected) {
        onSelected(selectedStarter);
      }

      setTimeout(() => {
        setSavedSuccess(false);
        setSaving(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error al guardar inicial shiny:', err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="max-w-xl w-full bg-[#FAF9F5] rounded-3xl border border-[#E8E5DD] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera estilo Anthropic Editorial */}
        <div className="p-6 bg-white border-b border-[#E8E5DD] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="hq-mono text-[10px] font-bold tracking-wider text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                Destino Inicial · 3 Shinies Exclusivos
              </span>
            </div>
            <h2 className="hq-title text-xl sm:text-2xl font-bold text-[#1F1E1B]">
              Tu Terna de 3 Iniciales Shinies
            </h2>
            <p className="text-xs text-[#5E5C56] mt-0.5">
              Exactamente 1 de cada región (Kanto, Johto y Hoenn). Elige cuál te acompañará.
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={rerollTrio}
              title="Generar otra terna aleatoria"
              className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-[#F2EFE9] rounded-xl transition-all flex items-center gap-1 text-xs font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] hq-mono">Re-sortear</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-[#F2EFE9] rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido: Las 3 cartas únicas de la terna aleatoria */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {trio.map((starter) => {
              const isSelected = selectedStarter.key === starter.key;
              const shinyGifUrl = POKEMON_ASSETS.getAnimatedSprite(starter.speciesId, true);

              return (
                <div
                  key={starter.key}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedStarter(starter);
                  }}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border flex flex-col items-center text-center relative ${
                    isSelected
                      ? 'bg-white border-[#E60012] shadow-[0_6px_20px_rgba(230,0,18,0.15)] ring-2 ring-[#E60012]/30 scale-[1.02]'
                      : 'bg-white/80 border-[#E8E5DD] hover:border-[#D5D1C5] hover:bg-white hover:shadow-sm'
                  }`}
                >
                  {/* Badge de Región y Shiny */}
                  <div className="absolute top-2.5 left-2.5 flex items-center">
                    <span className="text-[10px] font-bold hq-mono text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                      {starter.region}
                    </span>
                  </div>

                  <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-[9px] font-black hq-mono bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                    SHINY
                  </span>

                  {/* Sprite Animado 3D Showdown */}
                  <div className="h-24 w-24 flex items-center justify-center my-1 mt-4 relative">
                    <img
                      src={shinyGifUrl}
                      alt={starter.name}
                      className="max-h-20 max-w-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                    />
                  </div>

                  {/* Nombre y tipo */}
                  <div className="w-full space-y-1">
                    <h3 className="font-bold text-sm text-[#1F1E1B]">{starter.name}</h3>
                    <span
                      className="inline-block text-[10px] font-bold hq-mono px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: starter.badgeBg,
                        color: starter.badgeColor,
                      }}
                    >
                      {starter.typeLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5E5C56] mt-2 leading-relaxed">
                    {starter.description}
                  </p>

                  {/* Indicador de Selección */}
                  <div className="mt-3 w-full pt-2 border-t border-[#E8E5DD]/50 flex items-center justify-center">
                    {isSelected ? (
                      <span className="hq-mono text-[10px] font-bold text-[#E60012] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ELEGIDO
                      </span>
                    ) : (
                      <span className="hq-mono text-[10px] font-semibold text-neutral-400">
                        Seleccionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen del Inicial Seleccionado */}
          <div className="rounded-2xl border border-[#E8E5DD] bg-white p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center p-1 relative">
                <img
                  src={POKEMON_ASSETS.getAnimatedSprite(selectedStarter.speciesId, true)}
                  alt={selectedStarter.name}
                  className="max-h-10 max-w-10 object-contain"
                />
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400 absolute top-0.5 right-0.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1E1B] flex items-center gap-1.5">
                  <span>{selectedStarter.name} Shiny</span>
                  <span className="hq-mono text-[10px] font-normal text-neutral-500">
                    (Nv. 5 · {selectedStarter.region})
                  </span>
                </p>
                <p className="text-[11px] text-[#5E5C56]">
                  Se sincronizará en tu equipo de SynDex y en tu archivo de partida GBA.
                </p>
              </div>
            </div>

            {/* BOTÓN ROJO NINTENDO TACTILE */}
            <button
              onClick={handleConfirm}
              disabled={saving || savedSuccess}
              className="nintendo-btn-red shrink-0"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Asignado!</span>
                </>
              ) : saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" fill="currentColor" />
                  <span>Confirmar Inicial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
