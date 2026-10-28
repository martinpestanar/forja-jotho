'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  Layers, 
  ArrowRightLeft, 
  Database,
  Gamepad2,
  Package,
  Search,
  Zap,
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS, JOHTO_POKEDEX_CATALOG, HNS_ITEMS_CATALOG, ItemAssetMetadata } from '@/lib/pokemonAssets';
import confetti from 'canvas-confetti';

interface BoxedPokemon {
  slot: number;
  speciesId: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  isShiny: boolean;
  types: string[];
}

type ActiveSection = 'party' | 'pc' | 'bag';

export const PartyPcManager: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const updateProfile = useTrainerStore((s) => s.updateProfile);
  // Estándar 100% Light Mode Claude
  const isLight = true;

  const [activeSection, setActiveSection] = useState<ActiveSection>('party');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // ── Bag state ──
  const [bagSearch, setBagSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemAssetMetadata>(HNS_ITEMS_CATALOG[0]);

  // Obtener equipo real del perfil: starter nivel 5 si está recién creada
  const rawParty = profile?.gba_party_json && profile.gba_party_json.length > 0
    ? profile.gba_party_json
    : [
        { name: 'Cyndaquil', speciesId: 155, level: 5, hp: 20, maxHp: 20, isShiny: false },
      ];

  // Formatear party a estructura homogénea
  const party: BoxedPokemon[] = rawParty.map((p: any, idx: number) => {
    const meta = JOHTO_POKEDEX_CATALOG.find((m) => m.id === p.speciesId || m.name.toLowerCase() === p.name?.toLowerCase());
    return {
      slot: idx,
      speciesId: p.speciesId || meta?.id || 155,
      name: p.name || meta?.name || 'POKÉMON',
      level: p.level || 5,
      hp: p.hp || 20,
      maxHp: p.maxHp || 20,
      isShiny: !!p.isShiny,
      types: meta?.types || ['Fuego'],
    };
  });

  // PC Box 1 (30 slots) comienza limpio en producción
  const [pcBox, setPcBox] = useState<(BoxedPokemon | null)[]>(
    Array(30).fill(null)
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Mover Pokémon de PC al Equipo
  const handleDepositOrWithdraw = (from: 'party' | 'pc', index: number) => {
    soundFx.playCoin();
    if (from === 'pc') {
      const mon = pcBox[index];
      if (!mon) return;
      if (party.length >= 6) {
        soundFx.playDamage();
        showToast('⚠️ Tu equipo ya tiene 6 Pokémon. Deposita uno primero.');
        return;
      }
      const updatedParty = [...party, { ...mon, slot: party.length }];
      const updatedPc = [...pcBox];
      updatedPc[index] = null;
      setPcBox(updatedPc);
      updateProfile({ gba_party_json: updatedParty });
      showToast(`¡${mon.name} transferido a tu equipo!`);
      confetti({ particleCount: 20, spread: 40 });
    } else {
      if (party.length <= 1) {
        soundFx.playDamage();
        showToast('⚠️ Debes llevar al menos 1 Pokémon en tu equipo.');
        return;
      }
      const mon = party[index];
      const emptyPcIndex = pcBox.findIndex((slot) => slot === null);
      if (emptyPcIndex === -1) {
        soundFx.playDamage();
        showToast('⚠️ PC Box 1 está lleno (30/30).');
        return;
      }
      const updatedParty = party.filter((_, i) => i !== index);
      const updatedPc = [...pcBox];
      updatedPc[emptyPcIndex] = { ...mon, slot: emptyPcIndex };
      setPcBox(updatedPc);
      updateProfile({ gba_party_json: updatedParty });
      showToast(`¡${mon.name} depositado en PC Box 1!`);
    }
  };

  // Inyectar ítem a la mochila GBA desde la Bóveda (nunca gratis)
  const handleInjectItem = async () => {
    soundFx.playClick();
    const snapshot = useEconomyStore.getState().snapshot;
    const vaultItem = snapshot?.vault?.find(
      (v) =>
        v.item_type === 'item' &&
        Number(v.payload_json?.gba_item_id) === selectedItem.gbaItemId
    );

    if (!vaultItem) {
      soundFx.playDamage();
      showToast(`🔒 No tienes ${selectedItem.name} en la Bóveda. Cómpralo en el Bazar.`);
      return;
    }

    const result = await useEconomyStore.getState().dispatchVaultItem(vaultItem.id);
    if (!result.success) {
      soundFx.playDamage();
      showToast(`⚠️ ${result.error}`);
      return;
    }

    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
    showToast(`🎒 ${vaultItem.display_name} despachado. Pulsa CONTINUAR en el cartucho.`);
  };

  const filteredItems = HNS_ITEMS_CATALOG.filter(
    (i) =>
      i.name.toLowerCase().includes(bagSearch.toLowerCase()) ||
      i.category.toLowerCase().includes(bagSearch.toLowerCase())
  );

  const currentSelectedMon =
    activeSection === 'party' ? party[selectedSlot ?? 0] : pcBox[selectedSlot ?? 0];

  // ── TAB BUTTON STYLES ──────────────────────────────────────────────────
  const tabBtn = (section: ActiveSection, colorActive: string, colorActiveDark: string) =>
    `px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
      activeSection === section
        ? 'bg-[#1F1E1B] text-white shadow-sm'
        : 'bg-[#F2EFE9] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
    }`;

  return (
    <div className="h-full flex flex-col gap-3 font-mono">
      {/* Toast Notificación */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`p-2.5 rounded-xl font-black text-xs flex items-center gap-2 border-2 shadow-[3px_3px_0_#000] ${
              isLight
                ? 'bg-amber-300 text-slate-950 border-black'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selector de Sección ── */}
      <div className="flex items-center justify-between gap-2 border-b-2 pb-2.5 border-black/20 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { soundFx.playClick(); setActiveSection('party'); setSelectedSlot(0); }}
            className={tabBtn('party', 'bg-[#E60012] text-white', 'bg-emerald-500 text-slate-950')}
          >
            <Users className="w-4 h-4" />
            <span>Equipo ({party.length}/6)</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveSection('pc'); setSelectedSlot(0); }}
            className={tabBtn('pc', 'bg-amber-400 text-black', 'bg-amber-500 text-slate-950')}
          >
            <Database className="w-4 h-4" />
            <span>PC Box 1 ({pcBox.filter(Boolean).length}/30)</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveSection('bag'); }}
            className={tabBtn('bag', 'bg-[#F59E0B] text-black', 'bg-orange-500 text-slate-950')}
          >
            <Package className="w-4 h-4" />
            <span>🎒 Mochila GBA</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
          <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sincronizado con GBA ROM</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 1 & 2: Mi Equipo / PC Box
      ══════════════════════════════════════════════════════════════ */}
      {(activeSection === 'party' || activeSection === 'pc') && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Lista */}
          <div className="lg:col-span-7 h-full overflow-y-auto pr-1 space-y-2">
            {activeSection === 'party' ? (
              <div className="space-y-2">
                {party.map((mon, idx) => {
                  const isSelected = selectedSlot === idx;
                  const hpPct = Math.round((mon.hp / mon.maxHp) * 100);
                  return (
                    <div
                      key={idx}
                      onClick={() => { soundFx.playClick(); setSelectedSlot(idx); }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#D97043] shadow-sm'
                          : 'bg-white border-[#E8E5DD] hover:border-[#D5D1C5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 flex items-center justify-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={POKEMON_ASSETS.getAnimatedSprite(mon.speciesId, mon.isShiny)}
                            alt={mon.name}
                            className="max-h-11 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-editorial font-semibold text-sm text-[#1F1E1B] tracking-tight">{mon.name}</span>
                            {mon.isShiny && (
                              <span className="px-1 py-0.5 bg-[#D4A359]/20 text-[#A6752C] text-[9px] font-mono rounded flex items-center gap-0.5 shrink-0">
                                <Sparkles className="w-2.5 h-2.5" /> SHINY
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#706E66] flex items-center gap-1.5 font-mono">
                            <span className="font-semibold text-[#D97043]">Nv. {mon.level}</span>
                            <span>·</span>
                            <span className="text-[#706E66]">{mon.types.join(' / ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1 shrink-0 pl-2">
                        <div className="text-[10px] text-[#706E66] font-mono">
                          HP: <span className="text-[#5B7855] font-semibold">{mon.hp}</span>/{mon.maxHp}
                        </div>
                        <div className="w-16 sm:w-20 h-1.5 bg-[#EAE7DF] rounded-full overflow-hidden ml-auto">
                          <div
                            className={`h-full ${hpPct > 50 ? 'bg-[#6E8B68]' : hpPct > 20 ? 'bg-[#D97043]' : 'bg-rose-500'}`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDepositOrWithdraw('party', idx); }}
                          className="text-[10px] text-[#D97043] hover:underline font-mono cursor-pointer block ml-auto pt-0.5"
                        >
                          Depositar en PC →
                        </button>
                      </div>
                    </div>
                  );
                })}
                {Array(6 - party.length).fill(null).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-3 rounded-xl border border-dashed border-[#E8E5DD] flex items-center justify-center text-[#8A877E] text-xs gap-2 bg-[#FAF9F5]"
                  >
                    <Users className="w-4 h-4 opacity-40" />
                    <span className="font-mono text-[11px]">Espacio Disponible (#{party.length + i + 1})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pb-2">
                {pcBox.map((slotMon, idx) => {
                  const isSelected = selectedSlot === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { soundFx.playClick(); setSelectedSlot(idx); }}
                      className={`min-h-[92px] rounded-2xl border-2 flex flex-col items-center justify-between p-2 cursor-pointer transition-all relative select-none shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none ${
                        isSelected
                          ? isLight
                            ? 'bg-amber-200 border-black ring-2 ring-[#C5A059]'
                            : 'bg-gradient-to-b from-[#C5A059]/25 to-[#14171C] border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.4)] ring-1 ring-[#C5A059]'
                          : slotMon
                            ? isLight
                              ? 'bg-white border-black/40 hover:border-black'
                              : 'bg-[#14171C] border-white/10 hover:border-[#C5A059]/60'
                            : isLight
                              ? 'bg-slate-100 border-dashed border-slate-300 opacity-60'
                              : 'bg-[#0B0C0E]/70 border-dashed border-white/5 opacity-40 hover:opacity-70'
                      }`}
                    >
                      {slotMon ? (
                        <>
                          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span>#{idx + 1}</span>
                            {slotMon.isShiny && (
                              <span className="text-amber-400 font-bold drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]">★</span>
                            )}
                          </div>
                          <div className="w-9 h-9 flex items-center justify-center my-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={POKEMON_ASSETS.getBoxIcon(slotMon.speciesId)}
                              alt={slotMon.name}
                              className="w-9 h-9 object-contain [image-rendering:pixelated]"
                            />
                          </div>
                          <div className="w-full text-center">
                            <span 
                              className="text-[11px] font-black tracking-tight text-[#E2E8F0] block truncate w-full"
                              title={slotMon.name}
                            >
                              {slotMon.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-[#C5A059] block -mt-0.5">
                              Nv.{slotMon.level}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-2 text-slate-600">
                          <span className="text-[11px] font-mono font-black">#{idx + 1}</span>
                          <span className="text-[8px] font-mono uppercase tracking-wider text-slate-700">VACÍO</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspector Derecho */}
          <div className="lg:col-span-5 rounded-2xl p-4 border border-[#E8E5DD] bg-white flex flex-col justify-between shadow-sm">
            {currentSelectedMon ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-editorial font-semibold text-lg flex items-center gap-2 flex-wrap text-[#1F1E1B]">
                      <span className="truncate">{currentSelectedMon.name}</span>
                      {currentSelectedMon.isShiny && (
                        <span className="text-xs px-1.5 py-0.5 bg-[#D4A359]/20 text-[#A6752C] font-mono rounded shrink-0">★ SHINY</span>
                      )}
                    </h3>
                    <p className="text-xs text-[#D97043] font-mono font-medium">
                      Nivel {currentSelectedMon.level} · {currentSelectedMon.types.join(' / ')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#8A877E] shrink-0">
                    {activeSection === 'party' ? `Slot #${(selectedSlot ?? 0) + 1}` : `PC #${(selectedSlot ?? 0) + 1}`}
                  </span>
                </div>
                <div className="relative flex flex-col items-center justify-center p-6 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD] overflow-hidden">
                  {/* Sprite con balanceo flotante orgánico (Idle Bobbing) */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="relative z-10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={POKEMON_ASSETS.getAnimatedSprite(currentSelectedMon.speciesId, currentSelectedMon.isShiny)}
                      alt={currentSelectedMon.name}
                      className="h-28 object-contain drop-shadow-sm"
                    />
                  </motion.div>
                  {/* Sombra elástica en el suelo */}
                  <motion.div
                    animate={{ scaleX: [1, 0.85, 1], opacity: [0.2, 0.12, 0.2] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="w-16 h-2 bg-[#1F1E1B] rounded-full filter blur-[1px] -mt-1"
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#706E66]">Puntos de Salud (HP):</span>
                    <span className="text-[#5B7855] font-semibold">{currentSelectedMon.hp} / {currentSelectedMon.maxHp}</span>
                  </div>
                  <div className="w-full h-2 bg-[#EAE7DF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6E8B68]"
                      style={{ width: `${Math.round((currentSelectedMon.hp / currentSelectedMon.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (activeSection === 'party') {
                      handleDepositOrWithdraw('party', selectedSlot ?? 0);
                    } else {
                      handleDepositOrWithdraw('pc', selectedSlot ?? 0);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                    activeSection === 'party'
                      ? 'bg-[#D97043] hover:bg-[#CC6437] text-white'
                      : 'bg-[#4A8B99] hover:bg-[#3B7582] text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{activeSection === 'party' ? 'Mover a PC Box 1' : 'Sacar al Equipo de Batalla'}</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A877E] space-y-2">
                <Layers className="w-8 h-8 opacity-40 animate-pulse" />
                <p className="text-xs font-mono">Selecciona un Pokémon para ver sus estadísticas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 3: MOCHILA GBA (Catálogo de Ítems + Inyección)
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'bag' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Catálogo de Ítems */}
          <div className="lg:col-span-7 flex flex-col gap-2 min-h-0">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ítem o categoría..."
                value={bagSearch}
                onChange={(e) => setBagSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none font-sans ${
                  isLight
                    ? 'bg-slate-50 border-black/30 text-slate-900 focus:border-black'
                    : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Grid de ítems */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { soundFx.playClick(); setSelectedItem(item); }}
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
                      <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className={`px-1.5 py-0.5 rounded uppercase text-[9px] font-black ${
                          item.category === 'ball'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.category === 'medicine'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.category === 'berry'
                            ? 'bg-lime-500/20 text-lime-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={POKEMON_ASSETS.getItemSprite(item.slug)}
                        alt={item.name}
                        className="w-12 h-12 object-contain my-1 filter drop-shadow-md"
                        loading="lazy"
                      />
                      <span className="font-black text-xs text-center truncate w-full">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Detalle del Ítem */}
          <div
            className={`lg:col-span-5 rounded-xl p-4 border-2 flex flex-col justify-between ${
              isLight
                ? 'bg-[#FFFFFF] border-black shadow-[4px_4px_0_#000]'
                : 'bg-[#121214] border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black uppercase">{selectedItem.name}</h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                  selectedItem.category === 'ball'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : selectedItem.category === 'medicine'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {selectedItem.category}
                </span>
              </div>

              {/* Escaparate del Ítem */}
              <div className={`h-40 w-full flex items-center justify-center my-3 rounded-2xl border border-dashed ${
                isLight
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-black/20 border-amber-500/30'
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POKEMON_ASSETS.getItemSprite(selectedItem.slug)}
                  alt={selectedItem.name}
                  className="w-24 h-24 object-contain filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-transform hover:scale-125"
                />
              </div>

              <div className={`p-3 rounded-xl text-xs leading-relaxed mb-3 ${
                isLight ? 'bg-slate-100 text-slate-700 border border-black/10' : 'bg-black/20 text-slate-300 border border-slate-800'
              }`}>
                {selectedItem.description}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                <span className="font-bold text-amber-400">Offset GBA: </span>
                0x{selectedItem.gbaItemId.toString(16).toUpperCase().padStart(4, '0')}
                {' · Bolsillo '}
                {selectedItem.category === 'ball' ? 'Poké Balls' : 'Objetos'}
              </div>
            </div>

            {/* Botón Inyectar */}
            <button
              onClick={handleInjectItem}
              className={`w-full py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 ${
                isLight
                  ? 'bg-[#F59E0B] hover:bg-[#d97706] text-black border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>INYECTAR A MOCHILA (x3)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
