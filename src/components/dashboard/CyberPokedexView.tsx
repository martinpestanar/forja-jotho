'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  HelpCircle, 
  Award, 
  Zap, 
  Layers, 
  Filter,
  Gamepad2
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { 
  POKEMON_ASSETS, 
  JOHTO_POKEDEX_CATALOG, 
  PokemonAssetMetadata 
} from '@/lib/pokemonAssets';
import { triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';
import confetti from 'canvas-confetti';

export const CyberPokedexView: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonAssetMetadata>(JOHTO_POKEDEX_CATALOG[3]); // Cyndaquil por defecto
  const [filterType, setFilterType] = useState<string>('all');
  const [isShinyView, setIsShinyView] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Determinar qué Pokémon posee o ha visto el alumno
  const capturedIds = new Set<number>([
    155, // Cyndaquil
    25,  // Pikachu
    ...(profile?.gba_party_json?.map((p: any) => p.speciesId || p.id).filter(Boolean) || [])
  ]);

  const seenIds = new Set<number>([
    ...Array.from(capturedIds),
    152, 158, 161, 163, 165, 175, 179, 137, 243, 244, 245, 249, 250 // Vistos en eventos/demos
  ]);

  const totalCatalog = JOHTO_POKEDEX_CATALOG.length;
  const capturedCount = JOHTO_POKEDEX_CATALOG.filter((p) => capturedIds.has(p.id)).length;
  const seenCount = JOHTO_POKEDEX_CATALOG.filter((p) => seenIds.has(p.id)).length;
  const completionPct = Math.round((capturedCount / totalCatalog) * 100);

  const filteredCatalog = JOHTO_POKEDEX_CATALOG.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toString().includes(searchQuery);
    const matchesFilter = filterType === 'all' 
      ? true 
      : filterType === 'captured' 
        ? capturedIds.has(p.id) 
        : filterType === 'seen' 
          ? seenIds.has(p.id) 
          : p.types.some(t => t.toLowerCase() === filterType.toLowerCase());
    return matchesQuery && matchesFilter;
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClaimReward = () => {
    soundFx.playCoin();
    confetti({ particleCount: 35, spread: 60 });
    showToast(`¡Insignia de Explorador Johto registrada por tu avance del ${completionPct}%!`);
  };

  return (
    <div className="h-full flex flex-col gap-3 font-mono">
      {/* Notificación Toast */}
      {notification && (
        <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#000] animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cabecera Clásica Estilo Pokédex Roja */}
      <div
        className={`p-3.5 rounded-xl border-2 flex flex-wrap items-center justify-between gap-3 ${
          isLight
            ? 'bg-[#E60012] border-black text-white shadow-[4px_4px_0_#000]'
            : 'bg-[#1a0f18] border-rose-500/60 text-slate-100 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_#22d3ee] flex items-center justify-center text-slate-900 shrink-0 animate-pulse">
            <BookOpen className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-wider">
              Cyber-Pokédex Nacional (Johto & Kanto)
            </h2>
            <p className="text-[11px] opacity-90">
              Enciclopedia Oficial de Especies & Lore de Ingeniería de Software
            </p>
          </div>
        </div>

        {/* Barra de Progreso de Completitud */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-black">
              {capturedCount} / {totalCatalog} ({completionPct}%)
            </div>
            <div className="text-[9px] opacity-80 uppercase">
              {seenCount} Vistos · {capturedCount} Capturados
            </div>
          </div>

          <div className="w-24 h-3 bg-black/40 rounded-full border border-white/40 overflow-hidden">
            <div
              className="h-full bg-amber-300 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por # o Nombre (ej: Pikachu, 155)..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border-2 font-bold outline-none ${
              isLight
                ? 'bg-white border-black text-black shadow-[2px_2px_0_#000]'
                : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-rose-400'
            }`}
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'captured', label: '🔴 Capturados' },
            { id: 'seen', label: '👁️ Vistos' },
            { id: 'Fuego', label: 'Fuego' },
            { id: 'Agua', label: 'Agua' },
            { id: 'Planta', label: 'Planta' },
            { id: 'Eléctrico', label: 'Eléctrico' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                soundFx.playClick();
                setFilterType(f.id);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                filterType === f.id
                  ? isLight
                    ? 'bg-black text-white'
                    : 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                  : isLight
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: Lista Pokédex + Ficha Técnica Lore */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Catálogo de Celdas (7 Cols) */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredCatalog.map((pkmn) => {
              const isCaptured = capturedIds.has(pkmn.id);
              const isSeen = seenIds.has(pkmn.id);
              const isSelected = selectedPokemon.id === pkmn.id;

              return (
                <div
                  key={pkmn.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedPokemon(pkmn);
                  }}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-rose-100 border-black shadow-[3px_3px_0_#000]'
                        : 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : isLight
                        ? 'bg-white border-black/30 hover:border-black'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        isSeen || isCaptured
                          ? POKEMON_ASSETS.getPixelSprite(pkmn.id)
                          : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'
                      }
                      alt={pkmn.name}
                      className={`max-h-12 object-contain ${
                        !isSeen && !isCaptured ? 'brightness-0 opacity-30' : ''
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">
                        #{pkmn.id.toString().padStart(3, '0')}
                      </span>
                      {isCaptured ? (
                        <span className="text-[10px] text-rose-500" title="Capturado">🔴</span>
                      ) : isSeen ? (
                        <span className="text-[10px] text-cyan-400" title="Visto">👁️</span>
                      ) : (
                        <span className="text-[10px] text-slate-600">❓</span>
                      )}
                    </div>
                    <div className="font-bold text-xs truncate">
                      {isSeen || isCaptured ? pkmn.name : '??????'}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      {isSeen || isCaptured ? pkmn.types.join('/') : 'Desconocido'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ficha Técnica & Lore de Ingeniería de Software (5 Cols) */}
        <div
          className={`lg:col-span-5 rounded-xl p-4 border-2 flex flex-col justify-between overflow-y-auto ${
            isLight
              ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
              : 'bg-[#0f172a] border-slate-700'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/15">
              <div>
                <span className="text-xs text-slate-400 font-bold">
                  REGISTRO #{selectedPokemon.id.toString().padStart(3, '0')}
                </span>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <span>{selectedPokemon.name}</span>
                  {capturedIds.has(selectedPokemon.id) && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 text-black font-black rounded">
                      CAPTURADO
                    </span>
                  )}
                </h3>
              </div>

              {/* Botón Switch Shiny */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsShinyView(!isShinyView);
                }}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-all ${
                  isShinyView
                    ? 'bg-amber-400 text-black border-black font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Alternar vista normal / variocolor"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px]">SHINY</span>
              </button>
            </div>

            {/* Display 3D Holográfico */}
            <div className="flex items-center justify-center p-6 bg-slate-950/50 rounded-xl border border-slate-800 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={POKEMON_ASSETS.getAnimatedSprite(selectedPokemon.id, isShinyView)}
                alt={selectedPokemon.name}
                className="h-28 object-contain"
              />
            </div>

            {/* Cuadro de Diálogo Lore de Programación */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1">
              <div className="text-[10px] text-amber-400 font-black flex items-center gap-1 uppercase">
                <Zap className="w-3.5 h-3.5" />
                <span>Concepto de Ingeniería Asociado:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedPokemon.flavor}
              </p>
            </div>

            {/* Estadísticas Base */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">HP BASE</span>
                <span className="font-bold text-emerald-400">{selectedPokemon.baseHp}</span>
              </div>
              <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">ATAQUE</span>
                <span className="font-bold text-amber-400">{selectedPokemon.baseAtk}</span>
              </div>
              <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">VELOCIDAD</span>
                <span className="font-bold text-cyan-400">{selectedPokemon.baseSpd}</span>
              </div>
            </div>
          </div>

          {/* Botón Recompensa de Pokédex */}
          <div className="pt-3">
            <button
              onClick={handleClaimReward}
              className={`w-full py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-black shadow-[2px_2px_0_#000]'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-black shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Ver Recompensas de la Pokédex ({completionPct}%)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
