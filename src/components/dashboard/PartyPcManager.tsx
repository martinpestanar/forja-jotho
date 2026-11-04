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
  Shield,
  Egg,
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore } from '@/store/useEconomyStore';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS, JOHTO_POKEDEX_CATALOG, HNS_ITEMS_CATALOG, ItemAssetMetadata } from '@/lib/pokemonAssets';
import { ALL_STARTERS } from '@/lib/starterCatalog';
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

interface PartyPcManagerProps {
  onOpenStarterModal?: () => void;
}

export const PartyPcManager: React.FC<PartyPcManagerProps> = ({ onOpenStarterModal }) => {
  const profile = useTrainerStore((s) => s.profile);
  const updateProfile = useTrainerStore((s) => s.updateProfile);
  // Estándar 100% Light Mode Claude
  const isLight = true;

  const [activeSection, setActiveSection] = useState<ActiveSection>('party');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const markImageBroken = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  // ── Bag state ──
  const [bagSearch, setBagSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemAssetMetadata>(HNS_ITEMS_CATALOG[0]);

  // Obtener equipo real del perfil o fallback al starter elegido
  const currentStarterOption = ALL_STARTERS.find((s) => s.key === profile?.starter_pokemon);
  const fallbackStarter = currentStarterOption
    ? {
        name: currentStarterOption.name,
        speciesId: currentStarterOption.speciesId,
        level: 5,
        hp: 20,
        maxHp: 20,
        isShiny: true,
      }
    : { name: 'Cyndaquil', speciesId: 155, level: 5, hp: 20, maxHp: 20, isShiny: false };

  const rawParty = profile?.gba_party_json && profile.gba_party_json.length > 0
    ? profile.gba_party_json
    : [fallbackStarter];

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
            className="p-3 rounded-xl font-editorial font-semibold text-xs flex items-center gap-2 border border-[#E8E5DD] bg-white text-[#1F1E1B] shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#D4A359] animate-spin" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selector de Sección ── */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E5DD] pb-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { soundFx.playClick(); setActiveSection('party'); setSelectedSlot(0); }}
            className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'party'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <Users className="w-4 h-4 text-[#D97043]" />
            <span>Equipo ({party.length}/6)</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveSection('pc'); setSelectedSlot(0); }}
            className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'pc'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <Database className="w-4 h-4 text-[#4A8B99]" />
            <span>PC Box 1 ({pcBox.filter(Boolean).length}/30)</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveSection('bag'); }}
            className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'bag'
                ? 'bg-[#1F1E1B] text-white shadow-sm'
                : 'bg-[#FAF9F5] text-[#706E66] hover:text-[#1F1E1B] border border-[#E8E5DD]'
            }`}
          >
            <Package className="w-4 h-4 text-[#D4A359]" />
            <span>Mochila GBA</span>
          </button>

          {onOpenStarterModal && (
            <button
              onClick={() => { soundFx.playClick(); onOpenStarterModal(); }}
              className="px-2.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer"
              title="Cambiar o elegir terna de iniciales shinies"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Iniciales Shinies</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#706E66] font-mono">
          <Gamepad2 className="w-3.5 h-3.5 text-[#5A7D62]" />
          <span>Sincronizado con ROM</span>
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
                          {brokenImages[`party_${idx}_${mon.speciesId}`] ? (
                            <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center text-[#D97043] font-editorial font-bold text-xs">
                              {mon.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={POKEMON_ASSETS.getAnimatedSprite(mon.speciesId, mon.isShiny)}
                              alt={mon.name}
                              className="max-h-11 object-contain"
                              onError={() => markImageBroken(`party_${idx}_${mon.speciesId}`)}
                            />
                          )}
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
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { soundFx.playClick(); setSelectedSlot(idx); }}
                      className={`min-h-[92px] rounded-2xl border flex flex-col items-center justify-between p-2 cursor-pointer transition-all relative select-none ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#D97043] shadow-sm'
                          : slotMon
                            ? 'bg-white border-[#E8E5DD] hover:border-[#D5D1C5]'
                            : 'bg-[#FAF9F5]/60 border-dashed border-[#E8E5DD] opacity-60'
                      }`}
                    >
                      {slotMon ? (
                        <>
                          <div className="w-full flex items-center justify-between text-[9px] font-mono text-[#8A877E]">
                            <span>#{idx + 1}</span>
                            {slotMon.isShiny && (
                              <span className="text-[#A6752C] font-semibold">★</span>
                            )}
                          </div>
                          <div className="w-9 h-9 flex items-center justify-center my-0.5">
                            {brokenImages[`pc_${idx}_${slotMon.speciesId}`] ? (
                              <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center text-[#D97043] font-editorial font-bold text-[10px]">
                                {slotMon.name.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={POKEMON_ASSETS.getBoxIcon(slotMon.speciesId)}
                                alt={slotMon.name}
                                className="w-9 h-9 object-contain [image-rendering:pixelated]"
                                onError={() => markImageBroken(`pc_${idx}_${slotMon.speciesId}`)}
                              />
                            )}
                          </div>
                          <div className="w-full text-center">
                            <span 
                              className="text-[11px] font-editorial font-semibold tracking-tight text-[#1F1E1B] block truncate w-full"
                              title={slotMon.name}
                            >
                              {slotMon.name}
                            </span>
                            <span className="text-[9px] font-mono font-medium text-[#D97043] block -mt-0.5">
                              Nv.{slotMon.level}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-2 text-[#8A877E]">
                          <span className="text-[11px] font-mono font-medium">#{idx + 1}</span>
                          <span className="text-[8px] font-mono uppercase tracking-wider text-[#B8B4A8]">VACÍO</span>
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
                    className="relative z-10 flex items-center justify-center"
                  >
                    {brokenImages[`detail_${currentSelectedMon.speciesId}`] ? (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-[#E8E5DD] flex flex-col items-center justify-center text-[#D97043] gap-1 shadow-sm">
                        <Shield className="w-8 h-8 text-[#D97043]" />
                        <span className="text-[11px] font-editorial font-bold text-[#1F1E1B]">{currentSelectedMon.name}</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={POKEMON_ASSETS.getAnimatedSprite(currentSelectedMon.speciesId, currentSelectedMon.isShiny)}
                        alt={currentSelectedMon.name}
                        className="h-28 object-contain drop-shadow-sm"
                        onError={() => markImageBroken(`detail_${currentSelectedMon.speciesId}`)}
                      />
                    )}
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A877E]" />
              <input
                type="text"
                placeholder="Buscar ítem o categoría..."
                value={bagSearch}
                onChange={(e) => setBagSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E5DD] bg-white text-[#1F1E1B] placeholder-[#8A877E] outline-none font-sans focus:border-[#D97043] transition-colors"
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
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#D97043] shadow-sm'
                          : 'bg-white border-[#E8E5DD] hover:border-[#D5D1C5]'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          item.category === 'ball'
                            ? 'bg-[#D97043]/10 text-[#D97043]'
                            : item.category === 'medicine'
                            ? 'bg-[#5A7D62]/10 text-[#5A7D62]'
                            : item.category === 'berry'
                            ? 'bg-[#6E8B68]/10 text-[#5B7855]'
                            : 'bg-[#D4A359]/10 text-[#A6752C]'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center my-1">
                        {brokenImages[`item_${item.id}`] ? (
                          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center text-[#D97043]">
                            <Package className="w-4 h-4" />
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={POKEMON_ASSETS.getItemSprite(item.slug)}
                            alt={item.name}
                            className="w-10 h-10 object-contain drop-shadow-sm"
                            loading="lazy"
                            onError={() => markImageBroken(`item_${item.id}`)}
                          />
                        )}
                      </div>
                      <span className="font-editorial font-semibold text-xs text-[#1F1E1B] text-center truncate w-full">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Detalle del Ítem */}
          <div className="lg:col-span-5 rounded-2xl p-4 border border-[#E8E5DD] bg-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F2EFE9]">
                <h2 className="font-editorial text-base font-semibold text-[#1F1E1B]">{selectedItem.name}</h2>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full uppercase ${
                  selectedItem.category === 'ball'
                    ? 'bg-[#D97043]/10 text-[#D97043]'
                    : selectedItem.category === 'medicine'
                    ? 'bg-[#5A7D62]/10 text-[#5A7D62]'
                    : 'bg-[#D4A359]/10 text-[#A6752C]'
                }`}>
                  {selectedItem.category}
                </span>
              </div>

              {/* Escaparate del Ítem */}
              <div className="h-36 w-full flex items-center justify-center my-3 rounded-2xl border border-[#E8E5DD] bg-[#FAF9F5]">
                {brokenImages[`detail_item_${selectedItem.id}`] ? (
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#E8E5DD] flex items-center justify-center text-[#D97043] shadow-sm">
                    <Package className="w-8 h-8" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={POKEMON_ASSETS.getItemSprite(selectedItem.slug)}
                    alt={selectedItem.name}
                    className="w-20 h-20 object-contain drop-shadow-sm transition-transform hover:scale-110"
                    onError={() => markImageBroken(`detail_item_${selectedItem.id}`)}
                  />
                )}
              </div>

              <div className="p-3 rounded-xl text-xs text-[#5E5C56] leading-relaxed mb-3 bg-[#FAF9F5] border border-[#E8E5DD]">
                {selectedItem.description}
              </div>

              <div className="text-[11px] text-[#706E66] font-mono">
                <span className="font-medium text-[#D97043]">Offset GBA: </span>
                0x{selectedItem.gbaItemId.toString(16).toUpperCase().padStart(4, '0')}
                {' · Bolsillo '}
                {selectedItem.category === 'ball' ? 'Poké Balls' : 'Objetos'}
              </div>
            </div>

            {/* Botón Inyectar */}
            <button
              onClick={handleInjectItem}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-[#D97043] hover:bg-[#CC6437] flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 shadow-sm active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              <span>Inyectar a Mochila GBA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
