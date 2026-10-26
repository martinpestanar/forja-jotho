'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  Package, 
  Layers, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Heart,
  Crown,
  Eye,
  Filter
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { 
  POKEMON_ASSETS, 
  JOHTO_POKEDEX_CATALOG, 
  HNS_ITEMS_CATALOG, 
  PokemonAssetMetadata, 
  ItemAssetMetadata 
} from '@/lib/pokemonAssets';
import { triggerGbaPokemonInjection, triggerGbaItemInjection } from '@/lib/gba/PokemonMemoryBridge';
import confetti from 'canvas-confetti';

export const PokedexBagViewer: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  // Estándar 100% Light Mode Claude Oficial
  const isLight = true;

  const [activeSection, setActiveSection] = useState<'party' | 'pokedex' | 'bag'>('party');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonAssetMetadata>(JOHTO_POKEDEX_CATALOG[3]); // Cyndaquil por defecto
  const [isShinyPreview, setIsShinyPreview] = useState(false);
  const [viewBackSprite, setViewBackSprite] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemAssetMetadata>(HNS_ITEMS_CATALOG[0]);
  const [notification, setNotification] = useState<string | null>(null);

  const party = profile?.gba_party_json && profile.gba_party_json.length > 0
    ? profile.gba_party_json
    : [
        { name: 'Cyndaquil', speciesId: 155, level: 5, hp: 20, maxHp: 20, isShiny: false },
      ];

  const filteredPokemon = JOHTO_POKEDEX_CATALOG.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.types.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredItems = HNS_ITEMS_CATALOG.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInjectPokemon = (dest: 'party' | 'pc') => {
    soundFx.playCoin();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#E60012'],
    });

    triggerGbaPokemonInjection({
      speciesId: selectedPokemon.id,
      level: 15,
      nickname: selectedPokemon.name.toUpperCase(),
      isShiny: isShinyPreview,
      perfectIVs: true,
      targetDestination: dest,
    });

    showToast(`¡${selectedPokemon.name} inyectado con éxito a ${dest === 'pc' ? 'PC Box 1' : 'tu Equipo'}!`);
  };

  const handleInjectItem = () => {
    soundFx.playCoin();
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
    });

    const pocket = selectedItem.category === 'ball' ? 'POKEBALLS' : 'ITEMS';
    triggerGbaItemInjection(selectedItem.gbaItemId, 3, pocket, selectedItem.name);
    showToast(`¡3x ${selectedItem.name} agregados a tu Mochila GBA!`);
  };

  return (
    <div className="h-full flex flex-col gap-3 font-mono">
      {/* Toast Notificación */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-6 z-50 px-4 py-2 rounded-xl text-xs font-black shadow-2xl border-2 flex items-center gap-2 ${
              isLight
                ? 'bg-amber-300 text-slate-900 border-black shadow-[3px_3px_0_#000]'
                : 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Header con Pestañas de Navegación Visual */}
      <div className="p-2.5 rounded-2xl border border-[#E8E5DD] bg-white shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSection('party');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSection === 'party'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MI EQUIPO ({party.length}/6)</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSection('pokedex');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSection === 'pokedex'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>POKÉDEX 3D</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveSection('bag');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSection === 'bag'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>MOCHILA GBA</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        {activeSection !== 'party' && (
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8A877E]" />
            <input
              type="text"
              placeholder="Buscar por nombre o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E8E5DD] outline-none font-sans bg-[#FAF9F5] text-[#1F1E1B] focus:border-[#D97043]"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: MI EQUIPO ACTUAL (Sprites 3D Animados de la partida real) */}
      {/* ========================================================================= */}
      {activeSection === 'party' && (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
          {party.map((pkmn: any, idx: number) => {
            const speciesId = pkmn.speciesId || (pkmn.name.toLowerCase() === 'cyndaquil' ? 155 : 25);
            const isShiny = !!pkmn.isShiny;
            const hpPct = Math.round(((pkmn.hp || 35) / (pkmn.maxHp || 35)) * 100);

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                className="p-3.5 rounded-2xl border border-[#E8E5DD] bg-white flex flex-col justify-between transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E8E5DD] text-[#706E66]">
                      SLOT #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                        isShiny
                          ? 'bg-[#D4A359]/20 text-[#A6752C]'
                          : 'bg-[#FAF9F5] text-[#D97043] border border-[#D97043]/20'
                      }`}
                    >
                      {isShiny ? '✨ SHINY' : `NV. ${pkmn.level || 12}`}
                    </span>
                  </div>

                  {/* Escenario 3D del Sprite */}
                  <div className="h-32 w-full flex items-center justify-center relative my-2 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD] overflow-hidden">
                    <img
                      src={POKEMON_ASSETS.getAnimatedSprite(speciesId, isShiny)}
                      alt={pkmn.name}
                      className="h-24 w-24 object-contain filter drop-shadow-sm transition-transform hover:scale-125"
                      loading="lazy"
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="font-editorial font-semibold text-sm tracking-tight text-[#1F1E1B]">{pkmn.name}</h3>
                  </div>
                </div>

                {/* Barra de Salud Elástica */}
                <div className="mt-3 pt-2 border-t border-[#F2EFE9]">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-[#706E66]">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                      <span>PS</span>
                    </span>
                    <span className="font-medium text-[#1F1E1B]">{pkmn.hp || 35} / {pkmn.maxHp || 35}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[#EAE7DF]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        hpPct > 50 ? 'bg-[#6E8B68]' : hpPct > 20 ? 'bg-[#D97043]' : 'bg-rose-500'
                      }`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: POKÉDEX 3D (Explorador + Inyección Guiada) */}
      {/* ========================================================================= */}
      {activeSection === 'pokedex' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
          {/* Lista de Pokémon (7 columnas) */}
          <div className="lg:col-span-7 overflow-y-auto space-y-2 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
              {filteredPokemon.map((pkmn) => {
                const isSelected = selectedPokemon.id === pkmn.id;
                return (
                  <button
                    key={pkmn.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedPokemon(pkmn);
                    }}
                    className={`min-h-[110px] p-2.5 rounded-xl border text-left flex flex-col items-center justify-between transition-all cursor-pointer shadow-[0_2px_0_0_#000] active:translate-y-0.5 ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-100 border-2 border-black shadow-[3px_3px_0_#000]'
                          : 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                        : isLight
                        ? 'bg-[#FFFFFF] border-2 border-black/30 hover:border-black'
                        : 'bg-[#18181b]/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-bold font-mono">
                      <span className="text-slate-400">#{pkmn.id.toString().padStart(3, '0')}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 text-slate-300">Gen {pkmn.generation}</span>
                    </div>

                    <div className="w-12 h-12 flex items-center justify-center my-1">
                      <img
                        src={POKEMON_ASSETS.getPixelSprite(pkmn.id)}
                        alt={pkmn.name}
                        className="w-11 h-11 object-contain filter drop-shadow-sm transition-transform hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback automático al box icon si falla
                          (e.target as HTMLImageElement).src = POKEMON_ASSETS.getBoxIcon(pkmn.id);
                        }}
                      />
                    </div>

                    <div className="w-full text-center px-0.5">
                      <span 
                        className="font-black text-xs text-[#E2E8F0] block truncate w-full tracking-wide"
                        title={pkmn.name}
                      >
                        {pkmn.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visor 3D Detallado (5 columnas) */}
          <div
            className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between overflow-y-auto ${
              isLight
                ? 'bg-[#FFFFFF] border-3 border-black shadow-[4px_4px_0_#000]'
                : 'bg-[#121214] border-2 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400">
                    N.º {selectedPokemon.id.toString().padStart(3, '0')}
                  </span>
                  <h2 className="text-lg font-black uppercase tracking-wider">{selectedPokemon.name}</h2>
                </div>
                <div className="flex gap-1">
                  {selectedPokemon.types.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Escaparate 3D Interactivo */}
              <div className="h-44 w-full flex items-center justify-center relative my-3 bg-gradient-to-b from-transparent via-emerald-500/5 to-emerald-500/10 rounded-2xl border border-dashed border-emerald-500/30">
                <img
                  src={
                    viewBackSprite
                      ? POKEMON_ASSETS.getAnimatedBackSprite(selectedPokemon.id, isShinyPreview)
                      : POKEMON_ASSETS.getAnimatedSprite(selectedPokemon.id, isShinyPreview)
                  }
                  alt={selectedPokemon.name}
                  className="h-32 w-32 object-contain filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.5)] transition-all hover:scale-110"
                />

                {/* Controles del Visor 3D */}
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setIsShinyPreview(!isShinyPreview);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      isShinyPreview
                        ? 'bg-amber-400 text-black border-black shadow-[1px_1px_0_#000]'
                        : 'bg-black/50 text-white border-white/20 hover:bg-black'
                    }`}
                    title="Alternar Forma Shiny"
                  >
                    ✨ Shiny
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setViewBackSprite(!viewBackSprite);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      viewBackSprite
                        ? 'bg-cyan-500 text-black border-black shadow-[1px_1px_0_#000]'
                        : 'bg-black/50 text-white border-white/20 hover:bg-black'
                    }`}
                    title="Ver de Espalda"
                  >
                    🔄 Giro
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic mb-3">"{selectedPokemon.flavor}"</p>

              {/* Radar de Estadísticas Base */}
              <div className="space-y-1 text-[10px] font-bold">
                <div className="flex items-center justify-between">
                  <span>PS ({selectedPokemon.baseHp})</span>
                  <div className="w-32 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${(selectedPokemon.baseHp / 160) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ataque ({selectedPokemon.baseAtk})</span>
                  <div className="w-32 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(selectedPokemon.baseAtk / 160) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Defensa ({selectedPokemon.baseDef})</span>
                  <div className="w-32 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(selectedPokemon.baseDef / 160) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Velocidad ({selectedPokemon.baseSpd})</span>
                  <div className="w-32 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(selectedPokemon.baseSpd / 160) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Inyección Directa */}
            <div className="mt-4 pt-3 border-t border-black/10 flex gap-2">
              <button
                onClick={() => handleInjectPokemon('party')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#E60012] hover:bg-[#c5000f] text-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>AL EQUIPO (RAM)</span>
              </button>

              <button
                onClick={() => handleInjectPokemon('pc')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>A PC BOX 1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 3: MOCHILA GBA (Catálogo de Ítems e Inyección Quirúrgica) */}
      {/* ========================================================================= */}
      {activeSection === 'bag' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
          {/* Grid de Ítems (7 columnas) */}
          <div className="lg:col-span-7 overflow-y-auto space-y-2 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredItems.map((item) => {
                const isSelected = selectedItem.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedItem(item);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-amber-100 border-2 border-black shadow-[3px_3px_0_#000]'
                          : 'bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : isLight
                        ? 'bg-[#FFFFFF] border-2 border-black/30 hover:border-black'
                        : 'bg-[#18181b]/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-bold">
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/10 uppercase">
                        {item.category}
                      </span>
                    </div>

                    <img
                      src={POKEMON_ASSETS.getItemSprite(item.slug)}
                      alt={item.name}
                      className="w-12 h-12 object-contain my-2 filter drop-shadow-md"
                      loading="lazy"
                    />

                    <span className="font-black text-xs text-center truncate w-full">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle del Ítem & Inyección a Mochila (5 columnas) */}
          <div
            className={`lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between ${
              isLight
                ? 'bg-[#FFFFFF] border-3 border-black shadow-[4px_4px_0_#000]'
                : 'bg-[#121214] border-2 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black uppercase">{selectedItem.name}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  {selectedItem.category}
                </span>
              </div>

              {/* Escaparate de Ítem */}
              <div className="h-40 w-full flex items-center justify-center my-3 bg-black/10 rounded-2xl border border-dashed border-amber-500/30">
                <img
                  src={POKEMON_ASSETS.getItemSprite(selectedItem.slug)}
                  alt={selectedItem.name}
                  className="w-20 h-20 object-contain filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-transform hover:scale-125"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/5 border border-black/10 text-xs text-slate-300 leading-relaxed">
                {selectedItem.description}
              </div>

              <div className="mt-3 text-[11px] text-slate-400">
                <span className="font-bold text-amber-400">Offset GBA:</span> 0x
                {selectedItem.gbaItemId.toString(16).toUpperCase().padStart(4, '0')} · Bolsillo{' '}
                {selectedItem.category === 'ball' ? 'Poké Balls' : 'Objetos'}
              </div>
            </div>

            <button
              onClick={handleInjectItem}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 ${
                isLight
                  ? 'bg-[#F59E0B] hover:bg-[#d97706] text-black border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>INYECTAR A MOCHILA (x3)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
