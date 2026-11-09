'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  CheckCircle2,
  Send,
  X,
  RefreshCw,
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useEconomyStore, VaultItem } from '@/store/useEconomyStore';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS, JOHTO_POKEDEX_CATALOG, HNS_ITEMS_CATALOG, ItemAssetMetadata } from '@/lib/pokemonAssets';
import { ALL_STARTERS } from '@/lib/starterCatalog';
import { supabase } from '@/lib/supabase';
import { GbaSaveManipulator } from '@/lib/gba/gbaSaveEngine';
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
      types: meta?.types || ['Normal'],
    };
  });

  // PC Box 1 (30 slots) sincronizado con la partida GBA
  const [pcBox, setPcBox] = useState<(BoxedPokemon | null)[]>(
    Array(30).fill(null)
  );
  const [loadingPc, setLoadingPc] = useState(false);
  const [injectModalVaultItem, setInjectModalVaultItem] = useState<VaultItem | null>(null);
  const [targetDestination, setTargetDestination] = useState<'pc' | 'party'>('pc');
  const [isInjecting, setIsInjecting] = useState(false);

  const snapshot = useEconomyStore((s) => s.snapshot);
  const dispatchVaultItem = useEconomyStore((s) => s.dispatchVaultItem);

  const vaultPokemon = useMemo(() => {
    return (snapshot?.vault ?? []).filter(
      (v) => (v.item_type === 'pokemon' || v.item_type === 'egg') && v.status === 'in_vault'
    );
  }, [snapshot]);

  // Sincronizar PC Box 1 real desde el archivo .sav en la nube
  const refreshPcBox = async () => {
    try {
      setLoadingPc(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/gba/save-sync?slot=slot_1.sav&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length < 0x1C000) return;

      const manip = new GbaSaveManipulator(bytes);
      if (!manip.isValid()) return;

      const rawPc = manip.extractPcBox1();
      const mapped: (BoxedPokemon | null)[] = rawPc.map((p, idx) => {
        if (!p) return null;
        const meta = JOHTO_POKEDEX_CATALOG.find((m) => m.id === p.speciesId);
        return {
          slot: idx,
          speciesId: p.speciesId,
          name: p.nickname || meta?.name || 'POKÉMON',
          level: p.level,
          hp: 20,
          maxHp: 20,
          isShiny: p.isShiny,
          types: meta?.types || ['Normal'],
        };
      });
      setPcBox(mapped);
    } catch (e) {
      console.warn('[PartyPcManager] Error leyendo PC Box 1:', e);
    } finally {
      setLoadingPc(false);
    }
  };

  useEffect(() => {
    refreshPcBox();
  }, []);

  const handleConfirmInjectionFromManager = async () => {
    if (!injectModalVaultItem) return;
    setIsInjecting(true);
    soundFx.playClick();
    try {
      const res = await dispatchVaultItem(injectModalVaultItem.id, targetDestination);
      if (res.success) {
        soundFx.playLevelUp();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D9383A', '#C59B46', '#2D68C4', '#2E8555'],
        });
        const loc = (res.inPcBox || targetDestination === 'pc') ? 'las Cajas de la PC (Box 1)' : 'tu Equipo de Batalla';
        showToast(`✨ ¡${injectModalVaultItem.display_name} inyectado con éxito a ${loc}!`);
        setInjectModalVaultItem(null);
        refreshPcBox();
      } else {
        soundFx.playDamage();
        showToast(res.error || 'No se pudo inyectar el Pokémon.');
      }
    } finally {
      setIsInjecting(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Mover Pokémon de PC al Equipo (sincronización real con el cartucho .sav)
  const handleDepositOrWithdraw = async (from: 'party' | 'pc', index: number) => {
    soundFx.playClick();

    if (from === 'pc') {
      const mon = pcBox[index];
      if (!mon) return;
      if (party.length >= 6) {
        soundFx.playDamage();
        showToast('⚠️ Tu equipo ya tiene 6 Pokémon. Deposita uno primero.');
        return;
      }

      // Caso A: Emulador mGBA en ejecución
      const isEmulatorReady = typeof window !== 'undefined' && (window as any).__SYNDEX_GBA_READY__ === true;
      if (isEmulatorReady) {
        showToast(`Transfiriendo ${mon.name} al equipo en el cartucho...`);
        window.dispatchEvent(
          new CustomEvent('syndex:move-pokemon', {
            detail: {
              action: 'withdraw',
              slotIndex: index,
              callback: (res: any) => {
                if (res?.success) {
                  refreshPcBox();
                  confetti({ particleCount: 30, spread: 50 });
                } else {
                  soundFx.playDamage();
                  showToast(res?.error || 'Error al retirar de la PC');
                }
              },
            },
          })
        );
        return;
      }

      // Caso B: Emulador cerrado -> manipulación offline del .sav en la nube
      try {
        setLoadingPc(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No hay sesión de usuario activa.');

        const res = await fetch(`/api/gba/save-sync?slot=slot_1.sav&t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('No se pudo descargar la partida del servidor.');

        const savBytes = new Uint8Array(await res.arrayBuffer());
        const manip = new GbaSaveManipulator(savBytes);
        if (!manip.isValid()) throw new Error('Partida .sav no válida.');

        const withdrawRes = manip.withdrawPcMonToParty(index);
        if (!withdrawRes.success || !withdrawRes.updatedSav) {
          throw new Error(withdrawRes.error || 'Fallo al retirar Pokémon');
        }

        const uploadRes = await fetch('/api/gba/save-sync?slot=slot_1.sav', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: new Blob([withdrawRes.updatedSav.buffer as ArrayBuffer]),
        });
        if (!uploadRes.ok) throw new Error('No se pudo guardar la partida modificada en la nube.');

        // Actualizar perfil local y PC Box
        const updatedProfile = manip.extractPlayerProfileAndTeam();
        updateProfile({ gba_party_json: updatedProfile.party as any });
        refreshPcBox();

        soundFx.playLevelUp();
        confetti({ particleCount: 35, spread: 55 });
        showToast(`✨ ¡${mon.name} transferido a tu equipo de batalla!`);
      } catch (err: any) {
        console.error('[PartyPcManager] Error withdrawing pokemon:', err);
        soundFx.playDamage();
        showToast(`⚠️ ${err.message || 'Error al sincronizar con el cartucho'}`);
      } finally {
        setLoadingPc(false);
      }
    } else {
      // Depositar al PC Box 1
      if (party.length <= 1) {
        soundFx.playDamage();
        showToast('⚠️ Debes llevar al menos 1 Pokémon en tu equipo.');
        return;
      }
      const mon = party[index];
      if (!mon) return;

      // Caso A: Emulador mGBA en ejecución
      const isEmulatorReady = typeof window !== 'undefined' && (window as any).__SYNDEX_GBA_READY__ === true;
      if (isEmulatorReady) {
        showToast(`Depositando ${mon.name} en PC Box 1 del cartucho...`);
        window.dispatchEvent(
          new CustomEvent('syndex:move-pokemon', {
            detail: {
              action: 'deposit',
              slotIndex: index + 1, // slotNumber 1..6
              callback: (res: any) => {
                if (res?.success) {
                  refreshPcBox();
                  soundFx.playCoin();
                } else {
                  soundFx.playDamage();
                  showToast(res?.error || 'Error al depositar en PC');
                }
              },
            },
          })
        );
        return;
      }

      // Caso B: Emulador cerrado -> manipulación offline del .sav en la nube
      try {
        setLoadingPc(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No hay sesión de usuario activa.');

        const res = await fetch(`/api/gba/save-sync?slot=slot_1.sav&t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('No se pudo descargar la partida del servidor.');

        const savBytes = new Uint8Array(await res.arrayBuffer());
        const manip = new GbaSaveManipulator(savBytes);
        if (!manip.isValid()) throw new Error('Partida .sav no válida.');

        const depositRes = manip.depositPartyMonToPc(index + 1);
        if (!depositRes.success || !depositRes.updatedSav) {
          throw new Error(depositRes.error || 'Fallo al depositar en PC');
        }

        const uploadRes = await fetch('/api/gba/save-sync?slot=slot_1.sav', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: new Blob([depositRes.updatedSav.buffer as ArrayBuffer]),
        });
        if (!uploadRes.ok) throw new Error('No se pudo guardar la partida modificada en la nube.');

        // Actualizar perfil local y PC Box
        const updatedProfile = manip.extractPlayerProfileAndTeam();
        updateProfile({ gba_party_json: updatedProfile.party as any });
        refreshPcBox();

        soundFx.playCoin();
        showToast(`📥 ¡${mon.name} depositado en PC Box 1 del cartucho!`);
      } catch (err: any) {
        console.error('[PartyPcManager] Error depositing pokemon:', err);
        soundFx.playDamage();
        showToast(`⚠️ ${err.message || 'Error al sincronizar con el cartucho'}`);
      } finally {
        setLoadingPc(false);
      }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E4E1D8] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('party'); setSelectedSlot(0); }}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              activeSection === 'party'
                ? 'bg-white text-[#D9383A] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.2] shrink-0" />
            <span>Equipo ({party.length}/6)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('pc'); setSelectedSlot(0); }}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              activeSection === 'pc'
                ? 'bg-white text-[#2D68C4] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 stroke-[2.2] shrink-0" />
            <span>PC Box ({pcBox.filter(Boolean).length}/30)</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playClick(); setActiveSection('bag'); }}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              activeSection === 'bag'
                ? 'bg-white text-[#9A7025] shadow-[0_1px_3px_rgba(26,25,21,0.06)] border border-[#E4E1D8]'
                : 'text-[#706E66] hover:text-[#1C1B18] border border-transparent'
            }`}
          >
            <Package className="w-4 h-4 stroke-[2.2] shrink-0" />
            <span>Mochila Suministros</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#706E66] font-mono font-medium shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); refreshPcBox(); }}
            disabled={loadingPc}
            title="Recargar datos de PC Box desde el cartucho"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] text-[#706E66] hover:text-[#1C1B18] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loadingPc ? 'animate-spin text-[#2D68C4]' : ''}`} />
            <span className="text-[10px]">Actualizar</span>
          </button>
          <span className="w-2 h-2 rounded-full bg-[#2E8555] animate-pulse" />
          <Gamepad2 className="w-3.5 h-3.5 text-[#2E8555]" />
          <span>Sincronizado con Cartucho GBA</span>
        </div>
      </div>

      {/* ── Banner de Pokémon en Bóveda listos para Inyectar al Cartucho ── */}
      {vaultPokemon.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#C59B46]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#C59B46]/35 flex items-center justify-center text-[#9A7025] shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#C59B46] animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-bold text-xs sm:text-sm text-[#1C1B18] block">
                {vaultPokemon.length} {vaultPokemon.length === 1 ? 'Pokémon disponible' : 'Pokémon disponibles'} en tu Bóveda
              </span>
              <p className="text-[11px] text-[#706E66] font-mono mt-0.5">
                Inyéctalo directamente a las cajas de la PC o a tu equipo de batalla
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            {vaultPokemon.map((vp) => (
              <button
                key={vp.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setInjectModalVaultItem(vp);
                  setTargetDestination('pc');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1C1B18] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3 h-3 text-[#C59B46]" />
                <span>Inyectar {vp.display_name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 1 & 2: Mi Equipo / PC Box
      ══════════════════════════════════════════════════════════════ */}
      {(activeSection === 'party' || activeSection === 'pc') && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
          {/* Lista de Pokémon (Equipo o PC) */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-2.5 overflow-y-auto pr-1">
            {activeSection === 'party' ? (
              <div className="space-y-2.5">
                {party.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E4E1D8] bg-[#FAF9F5] flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E4E1D8] flex items-center justify-center text-[#C59B46] mb-3 shadow-sm">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-semibold text-sm text-[#1C1B18]">Esperando señal del cartucho</h4>
                    <p className="text-xs text-[#706E66] mt-1 mb-4 max-w-sm leading-relaxed">
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
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF9F5] border-[#D9383A] shadow-sm ring-1 ring-[#D9383A]/25'
                            : 'bg-white border-[#E4E1D8] hover:border-[#D5D1C5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Sprite + Identidad */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-13 h-13 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0 p-1 shadow-xs">
                              {brokenImages[`party_${idx}_${mon.speciesId}`] ? (
                                <span className="text-sm font-mono font-bold text-[#D9383A]">
                                  {mon.name.charAt(0).toUpperCase()}
                                </span>
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={POKEMON_ASSETS.getAnimatedSprite(mon.speciesId, mon.isShiny)}
                                  alt={mon.name}
                                  className="max-h-11 max-w-11 object-contain"
                                  onError={() => markImageBroken(`party_${idx}_${mon.speciesId}`)}
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-sans font-bold text-sm sm:text-base text-[#1C1B18] tracking-tight truncate">
                                  {mon.name}
                                </span>
                                {mon.isShiny && (
                                  <span className="px-2 py-0.5 bg-[#C59B46]/15 text-[#9A7025] text-[10px] font-mono rounded font-semibold flex items-center gap-1 shrink-0">
                                    <Sparkles className="w-2.5 h-2.5" /> SHINY
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#706E66] font-mono flex items-center gap-2 mt-1">
                                <span className="font-semibold text-[#D9383A]">Nv. {mon.level}</span>
                                <span>·</span>
                                <span className="truncate">{mon.types.join(' / ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* HP Status y Acción */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-xs text-[#706E66] font-mono whitespace-nowrap">
                                HP <strong className="text-[#2E8555] font-semibold">{mon.hp}</strong>/{mon.maxHp}
                              </span>
                              <div className="w-16 sm:w-20 h-2 bg-[#EAE7DF] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${hpPct > 50 ? 'bg-[#2E8555]' : hpPct > 20 ? 'bg-[#C59B46]' : 'bg-[#D9383A]'}`}
                                  style={{ width: `${hpPct}%` }}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDepositOrWithdraw('party', idx); }}
                              className="text-xs font-mono font-medium text-[#706E66] hover:text-[#D9383A] bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Depositar en PC →
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
                    className="p-3.5 rounded-2xl border border-dashed border-[#E4E1D8] flex items-center justify-center text-xs gap-2 bg-[#FAF9F5]/70"
                  >
                    <Users className="w-4 h-4 opacity-40 text-[#706E66]" />
                    <span className="font-mono text-xs text-[#706E66]">Ranura Disponible (#{party.length + i + 1})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pb-2">
                {pcBox.map((slotMon, idx) => {
                  const isSelected = selectedSlot === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { soundFx.playClick(); setSelectedSlot(idx); }}
                      className={`min-h-[96px] rounded-2xl border flex flex-col items-center justify-between p-2.5 cursor-pointer transition-all relative select-none ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#2D68C4] shadow-sm ring-1 ring-[#2D68C4]/25'
                          : slotMon
                            ? 'bg-white border-[#E4E1D8] hover:border-[#D5D1C5]'
                            : 'bg-[#FAF9F5]/60 border-dashed border-[#E4E1D8] opacity-60'
                      }`}
                    >
                      {slotMon ? (
                        <>
                          <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#706E66]">
                            <span>#{idx + 1}</span>
                            {slotMon.isShiny && (
                              <span className="text-[#9A7025] font-semibold">★</span>
                            )}
                          </div>
                          <div className="w-10 h-10 flex items-center justify-center my-0.5">
                            {brokenImages[`pc_${idx}_${slotMon.speciesId}`] ? (
                              <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center text-[#2D68C4] font-bold text-xs">
                                {slotMon.name.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={POKEMON_ASSETS.getBoxIcon(slotMon.speciesId)}
                                alt={slotMon.name}
                                className="w-10 h-10 object-contain [image-rendering:pixelated]"
                                onError={() => markImageBroken(`pc_${idx}_${slotMon.speciesId}`)}
                              />
                            )}
                          </div>
                          <div className="w-full text-center">
                            <span 
                              className="text-xs font-semibold tracking-tight text-[#1C1B18] block truncate w-full"
                              title={slotMon.name}
                            >
                              {slotMon.name}
                            </span>
                            <span className="text-[10px] font-mono font-medium text-[#2D68C4] block">
                              Nv.{slotMon.level}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-2 text-[#706E66]">
                          <span className="text-xs font-mono font-medium">#{idx + 1}</span>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#A09D94]">VACÍO</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspector Lateral (Detalle Completo del Pokémon) */}
          <div className="md:col-span-5 lg:col-span-4 rounded-2xl p-4 sm:p-5 border border-[#E4E1D8] bg-white flex flex-col justify-between shadow-sm sticky top-16">
            {currentSelectedMon ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-lg flex items-center gap-2 flex-wrap text-[#1C1B18]">
                      <span>{currentSelectedMon.name}</span>
                      {currentSelectedMon.isShiny && (
                        <span className="text-[10px] px-2 py-0.5 bg-[#C59B46]/15 text-[#9A7025] font-mono rounded font-semibold shrink-0 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> SHINY
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#D9383A] font-mono font-medium mt-1">
                      Nivel {currentSelectedMon.level} · {currentSelectedMon.types.join(' / ')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#706E66] shrink-0 bg-[#FAF9F5] border border-[#E4E1D8] px-2.5 py-1 rounded-lg">
                    {activeSection === 'party' ? `Slot #${(selectedSlot ?? 0) + 1}` : `PC #${(selectedSlot ?? 0) + 1}`}
                  </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-6 bg-[#FAF9F5] rounded-2xl border border-[#E4E1D8] overflow-hidden min-h-[160px]">
                  {/* Sprite con balanceo flotante orgánico (Idle Bobbing) */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    {brokenImages[`detail_${currentSelectedMon.speciesId}`] ? (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-[#E4E1D8] flex flex-col items-center justify-center text-[#D9383A] gap-1 shadow-sm">
                        <Shield className="w-8 h-8 text-[#D9383A]" />
                        <span className="text-xs font-bold text-[#1C1B18]">{currentSelectedMon.name}</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={POKEMON_ASSETS.getAnimatedSprite(currentSelectedMon.speciesId, currentSelectedMon.isShiny)}
                        alt={currentSelectedMon.name}
                        className="h-32 object-contain drop-shadow-sm"
                        onError={() => markImageBroken(`detail_${currentSelectedMon.speciesId}`)}
                      />
                    )}
                  </motion.div>
                  {/* Sombra elástica en el suelo */}
                  <motion.div
                    animate={{ scaleX: [1, 0.85, 1], opacity: [0.15, 0.08, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                    className="w-20 h-2.5 bg-[#1C1B18] rounded-full filter blur-[1px] -mt-1"
                  />
                </div>

                <div className="space-y-2 text-xs bg-[#FAF9F5] border border-[#E4E1D8] p-3.5 rounded-xl font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#706E66]">Puntos de Salud (HP):</span>
                    <span className="text-[#2E8555] font-semibold">{currentSelectedMon.hp} / {currentSelectedMon.maxHp}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#E4E1D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2E8555] rounded-full"
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
                  className={`w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
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
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#706E66] space-y-2 min-h-[240px]">
                <Layers className="w-8 h-8 opacity-40 animate-pulse" />
                <p className="text-xs font-mono">Selecciona un Pokémon de la lista para ver su ficha técnica.</p>
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

      {/* ── Modal de Inyección de Pokémon desde el Gestor ── */}
      <AnimatePresence>
        {injectModalVaultItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_8px_30px_rgba(26,25,21,0.12)] p-5 space-y-4"
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E4E1D8] flex items-center justify-center text-[#2D68C4] shadow-xs">
                    <Database className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1C1B18] tracking-tight">
                      Inyectar Pokémon a Partida GBA
                    </h3>
                    <p className="text-[11px] text-[#706E66] font-mono">
                      Selecciona el destino en tu cartucho
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInjectModalVaultItem(null)}
                  disabled={isInjecting}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-[#F2EFE9] border border-[#E4E1D8] flex items-center justify-center text-[#706E66] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ficha del Pokémon */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E4E1D8] flex items-center gap-3.5 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-center shrink-0">
                  {injectModalVaultItem.is_shiny ? (
                    <Sparkles className="w-6 h-6 text-[#C59B46] animate-pulse" />
                  ) : (
                    <Package className="w-6 h-6 text-[#2D68C4]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#1C1B18] truncate">
                      {injectModalVaultItem.display_name}
                    </span>
                    {injectModalVaultItem.is_shiny && (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#C59B46]/15 text-[#9A7025] uppercase">
                        Shiny
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#706E66] font-mono mt-0.5">
                    {injectModalVaultItem.item_type === 'egg' ? 'Huevo Especial de Guardería' : 'Listo para transferir al cartucho'}
                  </p>
                </div>
              </div>

              {/* Selector de Destino */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1C1B18] block">
                  ¿A dónde deseas inyectarlo?
                </label>

                {/* Opción 1: PC Box 1 (Recomendado) */}
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setTargetDestination('pc'); }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    targetDestination === 'pc'
                      ? 'bg-white border-[#2D68C4] ring-2 ring-[#2D68C4]/20 shadow-xs'
                      : 'bg-white/60 border-[#E4E1D8] hover:border-[#D5D1C5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        targetDestination === 'pc' ? 'bg-[#2D68C4] text-white' : 'bg-[#FAF9F5] text-[#706E66]'
                      }`}>
                        <Database className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#1C1B18]">
                            Cajas de la PC (Almacenamiento)
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#2D68C4]/15 text-[#2D68C4] uppercase">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[11px] text-[#706E66] leading-relaxed mt-1">
                          Se deposita en PC Box 1 del juego. Rápido y seguro: no se bloquea si tu equipo ya tiene 6 Pokémon. Retíralo en cualquier Centro Pokémon.
                        </p>
                      </div>
                    </div>
                    {targetDestination === 'pc' && (
                      <CheckCircle2 className="w-4 h-4 text-[#2D68C4] shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>

                {/* Opción 2: Equipo de Batalla */}
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setTargetDestination('party'); }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    targetDestination === 'party'
                      ? 'bg-white border-[#D9383A] ring-2 ring-[#D9383A]/20 shadow-xs'
                      : 'bg-white/60 border-[#E4E1D8] hover:border-[#D5D1C5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        targetDestination === 'party' ? 'bg-[#D9383A] text-white' : 'bg-[#FAF9F5] text-[#706E66]'
                      }`}>
                        <Users className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#1C1B18] block">
                          Equipo Activo de Batalla
                        </span>
                        <p className="text-[11px] text-[#706E66] leading-relaxed mt-1">
                          Entra directamente en tu equipo de 6 Pokémon. Si tu equipo está lleno (6/6), se redirigirá automáticamente a la PC.
                        </p>
                      </div>
                    </div>
                    {targetDestination === 'party' && (
                      <CheckCircle2 className="w-4 h-4 text-[#D9383A] shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInjectModalVaultItem(null)}
                  disabled={isInjecting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#E4E1D8] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-[#706E66] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInjectionFromManager}
                  disabled={isInjecting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1C1B18] hover:bg-black text-xs font-semibold text-white shadow-[0_2px_4px_rgba(26,25,21,0.1)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isInjecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C59B46]" />
                      <span>Inyectando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#C59B46]" />
                      <span>Confirmar Inyección</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
