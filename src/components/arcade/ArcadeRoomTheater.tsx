'use client';

import React, { useState, useEffect } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { GbaPanel } from '@/components/layout/GbaPanel';
import {
  X,
  BatteryCharging,
  Sparkles,
  Crown,
  Heart,
  Zap,
  ShieldCheck,
  Layers,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { triggerGbaItemInjection, triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';
import { HNS_ITEM_IDS } from '@/lib/gba/gbaSaveEngine';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

// Ítems inyectables para la mochila del alumno
const QUICK_ITEMS = [
  {
    id: 'potion',
    name: 'Poción (x3)',
    icon: <Heart className="h-4 w-4 text-[#2E8555]" />,
    desc: 'Restaura 20 PS',
    cost: 300,
    gbaItemId: 0x0013,
    pocket: 'ITEMS' as const,
    quantity: 3,
  },
  {
    id: 'super_potion',
    name: 'Superpoción (x2)',
    icon: <Heart className="h-4 w-4 text-[#2D68C4]" />,
    desc: 'Restaura 50 PS',
    cost: 700,
    gbaItemId: 0x0014,
    pocket: 'ITEMS' as const,
    quantity: 2,
  },
  {
    id: 'pokeball',
    name: 'Poké Ball (x5)',
    icon: <Sparkles className="h-4 w-4 text-[#D9383A]" />,
    desc: 'Captura estándar',
    cost: 1000,
    gbaItemId: HNS_ITEM_IDS.POKE_BALL,
    pocket: 'POKEBALLS' as const,
    quantity: 5,
  },
  {
    id: 'antidote',
    name: 'Antídoto (x2)',
    icon: <Zap className="h-4 w-4 text-[#C59B46]" />,
    desc: 'Cura el envenenamiento',
    cost: 200,
    gbaItemId: 0x0016,
    pocket: 'ITEMS' as const,
    quantity: 2,
  },
];

// Pokémon de recompensa para inyectar al equipo
const QUICK_POKEMON_REWARDS: any[] = [];

interface PartyMember {
  name: string;
  level?: number;
  hp?: number;
  maxHp?: number;
  speciesId?: number;
  isShiny?: boolean;
  type?: string;
}

export const ArcadeRoomTheater: React.FC = () => {
  const isArcadeOpen = useTrainerStore((s) => s.isArcadeOpen);
  const closeArcadeRoom = useTrainerStore((s) => s.closeArcadeRoom);
  const profile = useTrainerStore((s) => s.profile);
  const purchaseShopItemRpc = useTrainerStore((s) => s.purchaseShopItemRpc);

  const [mobileTab, setMobileTab] = useState<'game' | 'party' | 'bag'>('game');
  const [shopSubTab, setShopSubTab] = useState<'items' | 'pokemon'>('items');
  const [pokemonDestination, setPokemonDestination] = useState<'pc' | 'party'>('pc');
  const [injectedNotification, setInjectedNotification] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const handleQuickRestoreSession = async () => {
    setIsRestoringSession(true);
    soundFx.playClick();
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.otp) throw new Error(data.error || 'Error al conectar');
      const { error } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'magiclink',
      });
      if (error) throw error;
      soundFx.playLevelUp();
      window.location.reload();
    } catch (e: any) {
      soundFx.playDamage();
      console.error(e);
      alert('Error restaurando sesión: ' + (e.message || 'Desconocido'));
      setIsRestoringSession(false);
    }
  };

  // Escuchar tecla ESC para salir de la sala arcade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isArcadeOpen) {
        soundFx.playClick();
        closeArcadeRoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArcadeOpen, closeArcadeRoom]);

  const handleInjectItem = async (item: (typeof QUICK_ITEMS)[0]) => {
    if (party.length === 0) {
      soundFx.playWarning();
      setInjectedNotification("⚠️ Inicia tu partida y elige a tu inicial antes de inyectar suministros.");
      setTimeout(() => setInjectedNotification(null), 3500);
      return;
    }
    const currentPokedollars = profile?.pokedollars ?? 0;
    if (currentPokedollars < item.cost) {
      soundFx.playWarning();
      setInjectedNotification(`Necesitas ₽${item.cost} (tienes ₽${currentPokedollars})`);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    const purchase = await purchaseShopItemRpc(item.id, item.cost);
    if (!purchase.success && purchase.error) {
      soundFx.playWarning();
      setInjectedNotification(purchase.error);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    triggerGbaItemInjection(item.gbaItemId, item.quantity, item.pocket, item.name);
    soundFx.playCoin();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    setInjectedNotification(`${item.name} x${item.quantity} inyectado · -₽${item.cost}`);
    setTimeout(() => setInjectedNotification(null), 2800);
  };

  const handleInjectPokemonReward = async (pkmn: (typeof QUICK_POKEMON_REWARDS)[0]) => {
    const currentPokedollars = profile?.pokedollars ?? 0;
    if (currentPokedollars < pkmn.cost) {
      soundFx.playWarning();
      setInjectedNotification(`Necesitas ₽${pkmn.cost} (tienes ₽${currentPokedollars})`);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    const purchase = await purchaseShopItemRpc(pkmn.id, pkmn.cost);
    if (!purchase.success && purchase.error) {
      soundFx.playWarning();
      setInjectedNotification(purchase.error);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    triggerGbaPokemonInjection({
      speciesId: pkmn.speciesId,
      level: pkmn.level,
      nickname: pkmn.name,
      isShiny: pkmn.isShiny,
      perfectIVs: true,
      targetDestination: pokemonDestination,
    });
    soundFx.playLevelUp();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
    const destLabel =
      pokemonDestination === 'pc' ? 'PC Box 1 (almacenamiento)' : 'tu equipo Pokémon';
    setInjectedNotification(`${pkmn.name} enviado a ${destLabel} · -₽${pkmn.cost}`);
    setTimeout(() => setInjectedNotification(null), 3500);
  };

  const party: PartyMember[] =
    profile?.gba_party_json && profile.gba_party_json.length > 0
      ? (profile.gba_party_json as PartyMember[])
      : [];

  const batteryMinutes = profile?.battery_minutes ?? 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-[#FAF9F5] text-[#1F1E1B] transition-all duration-300 ${
        isArcadeOpen
          ? 'visible opacity-100'
          : 'invisible pointer-events-none opacity-0'
      }`}
    >
      {/* Cabecera Limpia & Editorial Mobile-First */}
      <header className="shrink-0 border-b border-[#E8E5DD] bg-[#FAF9F5] px-4 py-2.5">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
          {/* Botón Atrás + Título */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                closeArcadeRoom();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E5DD] bg-white text-[#1F1E1B] shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.2]" />
            </button>

            <div className="min-w-0">
              <span className="font-editorial block truncate text-sm font-semibold tracking-tight text-[#1F1E1B]">
                Pokémon Heart & Soul
              </span>
              <span className="font-mono block text-[10px] text-[#706E66]">
                mGBA Johto Edition
              </span>
            </div>
          </div>

          {/* Batería & Cerrar */}
          <div className="flex shrink-0 items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono font-medium ${
                batteryMinutes > 0
                  ? 'border-[#5A7D62]/30 bg-[#5A7D62]/10 text-[#4C6151]'
                  : 'border-[#D9534F]/30 bg-[#D9534F]/10 text-[#B2403C]'
              }`}
            >
              <BatteryCharging className="h-3.5 w-3.5" />
              <span className="tabular-nums font-semibold">{batteryMinutes} min</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                closeArcadeRoom();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E5DD] bg-white text-[#706E66] shadow-sm transition-all hover:text-[#1F1E1B] active:scale-95 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Selector móvil */}
      <div className="shrink-0 border-b border-[#E8E5DD] bg-[#FAF9F5] px-3 py-2 lg:hidden">
        <div className="mx-auto flex max-w-md gap-1 rounded-xl border border-[#E8E5DD] bg-[#F2EFE9] p-1">
          {[
            { id: 'game' as const, label: 'Consola' },
            { id: 'party' as const, label: `Equipo (${party.length})` },
            { id: 'bag' as const, label: 'Mochila' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundFx.playClick();
                setMobileTab(tab.id);
              }}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
                mobileTab === tab.id
                  ? 'bg-white text-[#1F1E1B] shadow-sm'
                  : 'text-[#8A877E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notificación */}
      {injectedNotification && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl border border-[#5A7D62]/30 bg-white px-4 py-2 text-xs font-medium text-[#4C6151] shadow-lg">
            <Sparkles className="h-4 w-4 text-[#2E8555]" />
            <span>{injectedNotification}</span>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-0 sm:gap-3 overflow-hidden p-0 sm:p-4 lg:grid-cols-12">
        {/* Equipo */}
        <section
          className={`lg:col-span-3 flex-col gap-2.5 overflow-y-auto ${
            mobileTab === 'party' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-white border border-[#E4E1D8] rounded-2xl flex items-center justify-between p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] select-none">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2E8555]" />
              <span className="text-sm font-semibold tracking-tight text-[#1C1B18]">Tu equipo</span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] border border-[#2E8555]/25">En Vivo</span>
          </div>

          <div className="space-y-2.5">
            {party.length === 0 ? (
              <div className="bg-white border border-[#E4E1D8] rounded-2xl p-5 text-center shadow-sm">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-[#C59B46] opacity-75" />
                <p className="text-xs font-semibold text-[#1C1B18]">Esperando inicial</p>
                <p className="text-[10px] mt-1 text-[#706E66] font-mono leading-relaxed">
                  Visita al Prof. Elm en la consola, elige tu inicial y guarda la partida para sincronizarlo.
                </p>
              </div>
            ) : (
              party.map((pkmn, idx) => {
              const hpPct = Math.round(
                ((pkmn.hp || 35) / (pkmn.maxHp || 35)) * 100
              );
              return (
                <div key={idx} className="bg-white border border-[#E4E1D8] rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2 select-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={POKEMON_ASSETS.getBoxIcon(pkmn.speciesId || 155)}
                        alt={pkmn.name}
                        className="h-6 w-6 object-contain"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {pkmn.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-[#706E66]">
                      NV. {pkmn.level || 12}
                    </span>
                  </div>

                  <div className="my-2 flex h-16 items-center justify-center rounded-lg bg-[#FAF9F5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={POKEMON_ASSETS.getAnimatedSprite(
                        pkmn.speciesId || 155,
                        !!pkmn.isShiny
                      )}
                      alt={pkmn.name}
                      className="h-14 w-14 object-contain drop-shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono text-[10px] font-bold text-[#706E66]">PS</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7DF]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${hpPct}%`,
                          backgroundColor:
                            hpPct > 50
                              ? '#2E8555'
                              : hpPct > 20
                                ? '#C59B46'
                                : '#D9383A',
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-[#1C1B18]">
                      {pkmn.hp || 35}/{pkmn.maxHp || 35}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          </div>

          <div className="p-3 bg-white border border-[#E4E1D8] rounded-2xl text-[11px] leading-relaxed text-[#706E66] font-mono shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
            Al capturar o subir de nivel dentro del juego, el equipo se sincroniza aquí.
          </div>
        </section>

        {/* Consola */}
        <section
          className={`lg:col-span-6 flex h-full min-h-0 flex-col ${
            mobileTab === 'game' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border sm:border-[#E8E5DD] bg-transparent sm:bg-[#F2EFE9] p-0 sm:p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#706E66]">Consola</span>
              <span className="font-mono text-[10px] font-semibold text-[#706E66]">
                {batteryMinutes} min disponibles
              </span>
            </div>
            {(!profile || profile.id === 'guest-trainer-id') && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[#C59B46]/40 bg-[#FFFDF7] p-2.5 text-xs text-[#8C6B1B] shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-semibold text-[#1C1B18] text-[11px]">Modo Invitado (Sesión no iniciada)</p>
                    <p className="text-[10px] text-[#706E66]">Carga tu partida de Marty en la nube con tu Shiny Mareep y ₽1,550.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickRestoreSession}
                  disabled={isRestoringSession}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#C59B46] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#B38A3B] active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isRestoringSession ? 'Cargando...' : 'Restaurar Partida'}</span>
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-hidden rounded-none sm:rounded-xl bg-[#0F1112]">
              {isArcadeOpen && <GbaPanel />}
            </div>
          </div>
        </section>

        {/* Mochila */}
        <section
          className={`lg:col-span-3 flex-col gap-2.5 overflow-y-auto ${
            mobileTab === 'bag' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-white border border-[#E4E1D8] rounded-2xl flex items-center justify-between p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] select-none">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C49347]" />
              <span className="text-sm font-semibold tracking-tight text-[#1C1B18]">Bazar Suministros</span>
            </div>
            <span className="font-mono flex items-center gap-1 text-xs font-bold text-[#9A7025] px-2 py-0.5 rounded-lg bg-[#C59B46]/10 border border-[#C59B46]/25">
              <Coins className="h-3.5 w-3.5" />
              ₽{profile?.pokedollars ?? 150}
            </span>
          </div>

          <div className="flex gap-1 rounded-xl border border-[#E8E5DD] bg-[#F2EFE9] p-1">
            {[
              { id: 'items' as const, label: `Suministros (${QUICK_ITEMS.length})` },
              
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShopSubTab(tab.id);
                }}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
                  shopSubTab === tab.id
                    ? 'bg-white text-[#1F1E1B] shadow-sm'
                    : 'text-[#8A877E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {shopSubTab === 'items' ? (
            <div className="space-y-2">
              {QUICK_ITEMS.map((item) => (
                <div key={item.id} className="bg-white border border-[#E4E1D8] rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2 select-none">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E5DD] bg-[#FAF9F5]">
                        {item.icon}
                      </span>
                      <div>
                        <div className="text-xs font-semibold">{item.name}</div>
                        <div className="text-[10px] text-[#8A877E]">{item.desc}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#9A7025] px-2 py-0.5 rounded-lg bg-[#C59B46]/10 border border-[#C59B46]/25 tabular-nums">
                      ₽{item.cost}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInjectItem(item)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-[#2D68C4] text-white text-xs font-mono font-semibold hover:bg-[#255BB0] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_0px_#1F4E99]"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#C49347]" />
                    Inyectar a la mochila
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#706E66] mb-1.5">Destino de entrega</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPokemonDestination('pc');
                    }}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all ${
                      pokemonDestination === 'pc'
                        ? 'border-[#3B7A87] bg-[#3B7A87]/10 text-[#3B7A87]'
                        : 'border-[#E8E5DD] bg-white text-[#5E5C56]'
                    }`}
                  >
                    PC Box 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPokemonDestination('party');
                    }}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-all ${
                      pokemonDestination === 'party'
                        ? 'border-[#C49347] bg-[#C49347]/10 text-[#A6752C]'
                        : 'border-[#E8E5DD] bg-white text-[#5E5C56]'
                    }`}
                  >
                    Al equipo
                  </button>
                </div>
              </div>

              {QUICK_POKEMON_REWARDS.map((pkmn) => (
                <div key={pkmn.id} className="bg-white border border-[#E4E1D8] rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2 select-none">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={POKEMON_ASSETS.getAnimatedSprite(
                          pkmn.speciesId,
                          pkmn.isShiny
                        )}
                        alt={pkmn.name}
                        className="h-10 w-10 object-contain"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{pkmn.name}</span>
                          <span className="font-mono rounded-md bg-[#C59B46]/10 px-1.5 py-0.5 text-[8px] font-bold text-[#9A7025]">
                            {pkmn.badge}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8A877E]">
                          {pkmn.desc}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#9A7025] px-2 py-0.5 rounded-lg bg-[#C59B46]/10 border border-[#C59B46]/25 tabular-nums">
                      ₽{pkmn.cost}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInjectPokemonReward(pkmn)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-[#D9383A] text-white text-xs font-mono font-bold hover:bg-[#C92F31] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_0px_#B22B2D]"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {pokemonDestination === 'pc' ? 'Guardar en PC Box 1' : 'Inyectar al equipo'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl text-[10px] text-[#706E66] font-mono leading-relaxed">
            🛡️ <strong>Regla de la Liga:</strong> Los Pokémon legendarios están protegidos y no se venden. Se capturan en la historia de la ROM. Los suministros tienen precios oficiales de Johto.
          </div>
        </section>
      </div>
    </div>
  );
};




