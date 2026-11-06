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

  // Equipo real del perfil (vacío por defecto para cuentas nuevas)
  const rawParty = profile?.gba_party_json && profile.gba_party_json.length > 0
    ? profile.gba_party_json
    : [];

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

      {/* ── Segmented Control Mobile-First (Tabs Limpias 100% integradas) ── */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E4E1D8] pb-2.5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('party'); setSelectedSlot(0); }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              activeSection === 'party'
                ? 'bg-white text-[#D9383A] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Equipo ({party.length}/6)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('pc'); setSelectedSlot(0); }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              activeSection === 'pc'
                ? 'bg-white text-[#2D68C4] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>PC Box ({pcBox.filter(Boolean).length}/30)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('bag'); }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              activeSection === 'bag'
                ? 'bg-white text-[#9A7025] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Package className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Mochila</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#706E66] font-mono font-medium shrink-0">
          <Gamepad2 className="w-3.5 h-3.5 text-[#2E8555]" />
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
                {party.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-[#E4E1D8] bg-[#FAF9F5] flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E4E1D8] flex items-center justify-center text-[#C59B46] mb-3 shadow-sm">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-semibold text-sm text-[#1C1B18]">Esperando señal del cartucho</h4>
                    <p className="text-xs text-[#706E66] mt-1 mb-4 max-w-xs leading-relaxed">
                      Abre el juego en tu consola, visita al <strong>Profesor Elm</strong> para elegir a tu inicial y guarda la partida. Tu equipo se reflejará aquí automáticamente.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#706E66] bg-white border border-[#E4E1D8] px-3 py-1.5 rounded-xl">
                        🎮 Sincronización Automática Activa
                      </span>
                    </div>
                  </div>
                ) : (
                  party.map((mon, idx) => {
                    const isSelected = selectedSlot === idx;
                    const hpPct = Math.round((mon.hp / mon.maxHp) * 100);
                    return (
                      <div
                        key={idx}
                        onClick={() => { soundFx.playClick(); setSelectedSlot(idx); }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF9F5] border-[#D9383A] shadow-sm ring-1 ring-[#D9383A]/20'
                            : 'bg-white border-[#E4E1D8] hover:border-[#D5D1C5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Sprite + Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0 p-1">
                              {brokenImages[`party_${idx}_${mon.speciesId}`] ? (
                                <span className="text-xs font-mono font-bold text-[#D9383A]">
                                  {mon.name.charAt(0).toUpperCase()}
                                </span>
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={POKEMON_ASSETS.getAnimatedSprite(mon.speciesId, mon.isShiny)}
                                  alt={mon.name}
                                  className="max-h-10 max-w-10 object-contain"
                                  onError={() => markImageBroken(`party_${idx}_${mon.speciesId}`)}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-sm text-[#1C1B18] tracking-tight truncate">
                                  {mon.name}
                                </span>
                                {mon.isShiny && (
                                  <span className="px-1.5 py-0.2 bg-[#C59B46]/15 text-[#9A7025] text-[9px] font-mono rounded font-semibold flex items-center gap-0.5 shrink-0">
                                    <Sparkles className="w-2.5 h-2.5" /> SHINY
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#706E66] font-mono flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-[#D9383A]">Nv. {mon.level}</span>
                                <span>·</span>
                                <span className="truncate">{mon.types.join(' / ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* HP Mini Status + Botón Depositar */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#706E66] font-mono">
                                HP <strong className="text-[#2E8555]">{mon.hp}</strong>/{mon.maxHp}
                              </span>
                              <div className="w-14 h-1.5 bg-[#EAE7DF] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${hpPct > 50 ? 'bg-[#2E8555]' : hpPct > 20 ? 'bg-[#C59B46]' : 'bg-[#D9383A]'}`}
                                  style={{ width: `${hpPct}%` }}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDepositOrWithdraw('party', idx); }}
                              className="text-[10px] font-mono font-medium text-[#706E66] hover:text-[#D9383A] bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] px-2 py-0.5 rounded-md transition-all active:scale-95"
                            >
                              Depositar →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {party.length > 0 && Array(6 - party.length).fill(null).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-3 rounded-2xl border border-dashed border-[#E4E1D8] flex items-center justify-center text-[#8A877E] text-xs gap-2 bg-[#FAF9F5]/60"
                  >
                    <Users className="w-3.5 h-3.5 opacity-40 text-[#706E66]" />
                    <span className="font-mono text-[11px] text-[#706E66]">Ranura Disponible (#{party.length + i + 1})</span>
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
          <div className="lg:col-span-5 rounded-2xl p-4 border border-[#E4E1D8] bg-white flex flex-col justify-between shadow-sm">
            {currentSelectedMon ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E1D8]">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2 flex-wrap text-[#1C1B18]">
                      <span className="truncate">{currentSelectedMon.name}</span>
                      {currentSelectedMon.isShiny && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#C59B46]/15 text-[#9A7025] font-mono rounded font-semibold shrink-0 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> SHINY
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#D9383A] font-mono font-medium mt-0.5">
                      Nivel {currentSelectedMon.level} · {currentSelectedMon.types.join(' / ')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#706E66] shrink-0 bg-[#FAF9F5] border border-[#E4E1D8] px-2 py-0.5 rounded-lg">
                    {activeSection === 'party' ? `Slot #${(selectedSlot ?? 0) + 1}` : `PC #${(selectedSlot ?? 0) + 1}`}
                  </span>
                </div>
                <div className="relative flex flex-col items-center justify-center p-6 bg-[#FAF9F5] rounded-2xl border border-[#E4E1D8] overflow-hidden">
                  {/* Sprite con balanceo flotante orgánico (Idle Bobbing) */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    {brokenImages[`detail_${currentSelectedMon.speciesId}`] ? (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-[#E4E1D8] flex flex-col items-center justify-center text-[#D9383A] gap-1 shadow-sm">
                        <Shield className="w-8 h-8 text-[#D9383A]" />
                        <span className="text-[11px] font-bold text-[#1C1B18]">{currentSelectedMon.name}</span>
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
                    animate={{ scaleX: [1, 0.85, 1], opacity: [0.15, 0.08, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="w-16 h-2 bg-[#1C1B18] rounded-full filter blur-[1px] -mt-1"
                  />
                </div>
                <div className="space-y-1.5 text-xs bg-[#FAF9F5] border border-[#E4E1D8] p-3 rounded-xl">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#706E66]">Puntos de Salud (HP)</span>
                    <span className="text-[#2E8555] font-semibold">{currentSelectedMon.hp} / {currentSelectedMon.maxHp}</span>
                  </div>
                  <div className="w-full h-2 bg-[#E4E1D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E8555]"
                      style={{ width: `${Math.round((currentSelectedMon.hp / currentSelectedMon.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection === 'party') {
                      handleDepositOrWithdraw('party', selectedSlot ?? 0);
                    } else {
                      handleDepositOrWithdraw('pc', selectedSlot ?? 0);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    activeSection === 'party'
                      ? 'bg-[#D9383A] text-white shadow-[0_2px_0px_#B32628] hover:bg-[#C92F31]'
                      : 'bg-[#2D68C4] text-white shadow-[0_2px_0px_#23529B] hover:bg-[#255BB0]'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
                  <span>{activeSection === 'party' ? 'Mover a PC Box 1' : 'Sacar al Equipo de Batalla'}</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#706E66] space-y-2">
                <Layers className="w-8 h-8 opacity-40 animate-pulse" />
                <p className="text-xs font-mono">Selecciona un Pokémon para ver sus estadísticas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 3: DESPACHO DE SUMINISTROS (Catálogo de Ítems + Bóveda)
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'bag' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Catálogo de Ítems */}
          <div className="lg:col-span-7 flex flex-col gap-2 min-h-0">
            {/* Aviso informativo de suministros */}
            <div className="px-3.5 py-2.5 rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5] text-xs text-[#706E66] font-mono flex items-center gap-2.5 shadow-sm">
              <Package className="w-4 h-4 text-[#C59B46] shrink-0" />
              <span>Suministros oficiales. Se adquieren en el Bazar y se envían al cartucho.</span>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#706E66]" />
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={bagSearch}
                onChange={(e) => setBagSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#E4E1D8] bg-white text-[#1C1B18] placeholder-[#706E66] outline-none font-sans focus:border-[#C59B46] transition-colors shadow-sm"
              />
            </div>

            {/* Grid de ítems mobile-first responsivo con nombres legibles */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { soundFx.playClick(); setSelectedItem(item); }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#C59B46] shadow-sm ring-1 ring-[#C59B46]/20'
                          : 'bg-white border-[#E4E1D8] hover:border-[#D5D1C5]'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0">
                        {brokenImages[`item_${item.id}`] ? (
                          <Package className="w-5 h-5 text-[#C59B46]" />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={POKEMON_ASSETS.getItemSprite(item.slug)}
                            alt={item.name}
                            className="w-8 h-8 object-contain drop-shadow-sm"
                            loading="lazy"
                            onError={() => markImageBroken(`item_${item.id}`)}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold uppercase ${
                            item.category === 'ball'
                              ? 'bg-[#D9383A]/10 text-[#D9383A]'
                              : item.category === 'medicine'
                              ? 'bg-[#2E8555]/10 text-[#2E8555]'
                              : item.category === 'berry'
                              ? 'bg-[#2E8555]/15 text-[#2E8555]'
                              : 'bg-[#C59B46]/15 text-[#9A7025]'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <span className="font-sans font-semibold text-xs text-[#1C1B18] block truncate leading-tight">
                          {item.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel Detalle del Ítem */}
          <div className="lg:col-span-5 rounded-2xl p-4 border border-[#E4E1D8] bg-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4E1D8]">
                <h2 className="font-semibold text-base text-[#1C1B18] truncate pr-2">{selectedItem.name}</h2>
                <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                  selectedItem.category === 'ball'
                    ? 'bg-[#D9383A]/10 text-[#D9383A]'
                    : selectedItem.category === 'medicine'
                    ? 'bg-[#2E8555]/10 text-[#2E8555]'
                    : 'bg-[#C59B46]/15 text-[#9A7025]'
                }`}>
                  {selectedItem.category}
                </span>
              </div>

              {/* Escaparate del Ítem */}
              <div className="h-32 w-full flex items-center justify-center my-3 rounded-2xl border border-[#E4E1D8] bg-[#FAF9F5]">
                {brokenImages[`detail_item_${selectedItem.id}`] ? (
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E4E1D8] flex items-center justify-center text-[#C59B46] shadow-sm">
                    <Package className="w-7 h-7" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={POKEMON_ASSETS.getItemSprite(selectedItem.slug)}
                    alt={selectedItem.name}
                    className="w-16 h-16 object-contain drop-shadow-sm transition-transform hover:scale-110"
                    onError={() => markImageBroken(`detail_item_${selectedItem.id}`)}
                  />
                )}
              </div>

              <div className="p-3 rounded-xl text-xs text-[#706E66] leading-relaxed mb-3 bg-[#FAF9F5] border border-[#E4E1D8] font-sans">
                {selectedItem.description}
              </div>

              <div className="text-[11px] text-[#706E66] font-mono">
                <span className="font-medium text-[#C59B46]">Offset GBA: </span>
                0x{selectedItem.gbaItemId.toString(16).toUpperCase().padStart(4, '0')}
                {' · Bolsillo '}
                {selectedItem.category === 'ball' ? 'Poké Balls' : 'Objetos'}
              </div>
            </div>

            {/* Botón Inyectar estilo Analogue Pocket */}
            <button
              type="button"
              onClick={handleInjectItem}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-[#1C1B18] hover:bg-black shadow-[0_2px_0px_#000000] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 uppercase tracking-wider"
            >
              <Zap className="w-4 h-4 fill-current text-[#C59B46]" />
              <span>Despachar a Partida GBA</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
