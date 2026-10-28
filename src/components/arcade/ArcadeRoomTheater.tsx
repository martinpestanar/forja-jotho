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
import { triggerGbaItemInjection, triggerGbaPokemonInjection } from '@/lib/gba/PokemonMemoryBridge';
import { HNS_ITEM_IDS } from '@/lib/gba/gbaSaveEngine';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

// Ítems inyectables para la mochila del alumno
const QUICK_ITEMS = [
  {
    id: 'rare_candy',
    name: 'Raro Caramelo',
    icon: <Sparkles className="h-4 w-4 text-[#C49347]" />,
    desc: '+1 Nivel instantáneo (x3)',
    cost: 50,
    gbaItemId: HNS_ITEM_IDS.RARE_CANDY,
    pocket: 'ITEMS' as const,
    quantity: 3,
  },
  {
    id: 'master_ball',
    name: 'Master Ball',
    icon: <Crown className="h-4 w-4 text-[#7E6AA6]" />,
    desc: 'Captura 100% infalible (x1)',
    cost: 120,
    gbaItemId: HNS_ITEM_IDS.MASTER_BALL,
    pocket: 'POKEBALLS' as const,
    quantity: 1,
  },
  {
    id: 'max_potion',
    name: 'Poción Máxima',
    icon: <Heart className="h-4 w-4 text-[#D9534F]" />,
    desc: 'Restaura 100% PS (x5)',
    cost: 30,
    gbaItemId: 0x0014,
    pocket: 'ITEMS' as const,
    quantity: 5,
  },
];

// Pokémon de recompensa para inyectar al equipo
const QUICK_POKEMON_REWARDS = [
  {
    id: 'pikachu_cyber',
    name: 'PIKACHU',
    speciesId: 25,
    level: 15,
    cost: 80,
    isShiny: true,
    desc: 'Eléctrico · Shiny Oro (Nv. 15)',
    badge: 'SHINY ⚡',
  },
  {
    id: 'totodile_reward',
    name: 'TOTODILE',
    speciesId: 158,
    level: 12,
    cost: 70,
    isShiny: false,
    desc: 'Agua · Naturaleza Alegre (Nv. 12)',
    badge: 'INICIAL 🌊',
  },
  {
    id: 'celebi_reward',
    name: 'CELEBI',
    speciesId: 251,
    level: 30,
    cost: 150,
    isShiny: true,
    desc: 'Planta/Psíquico · Guardián (Nv. 30)',
    badge: 'MÍTICO 🌿',
  },
];

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
      : [
          {
            name: profile?.starter_pokemon || 'Cyndaquil',
            level: 12,
            hp: 35,
            maxHp: 35,
            type: 'fire',
          },
        ];

  const batteryMinutes = profile?.battery_minutes ?? 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-[#FAF9F5] text-[#1F1E1B] transition-all duration-300 ${
        isArcadeOpen
          ? 'visible opacity-100'
          : 'invisible pointer-events-none opacity-0'
      }`}
    >
      {/* Cabecera */}
      <header className="shrink-0 border-b border-[#E8E5DD] bg-[#FAF9F5]/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                closeArcadeRoom();
              }}
              className="hq-btn hq-btn-ghost shrink-0 py-1.5 text-[11px]"
              title="Volver al HQ (ESC)"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al HQ</span>
            </button>

            <div className="min-w-0">
              <span className="hq-label">Sala arcade</span>
              <h1 className="hq-title truncate text-lg leading-tight sm:text-xl">
                Pokémon Heart & Soul
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className="hq-chip"
              style={{
                color: batteryMinutes > 0 ? 'var(--hq-cto)' : 'var(--hq-danger)',
                borderColor:
                  batteryMinutes > 0 ? 'rgba(90,125,98,0.35)' : 'rgba(217,83,79,0.35)',
                backgroundColor:
                  batteryMinutes > 0 ? 'rgba(90,125,98,0.08)' : 'rgba(217,83,79,0.08)',
              }}
            >
              <BatteryCharging className="h-3.5 w-3.5" />
              <span className="tabular-nums">{batteryMinutes} min</span>
            </span>
            <span className="hq-chip hidden lg:inline">ESC para salir</span>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                closeArcadeRoom();
              }}
              className="hq-focus rounded-lg border border-[#E8E5DD] bg-white p-2 text-[#5E5C56] transition-colors hover:text-[#1F1E1B]"
              aria-label="Cerrar sala"
            >
              <X className="h-4 w-4" />
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
            <Sparkles className="h-4 w-4 text-[#5A7D62]" />
            <span>{injectedNotification}</span>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-12 lg:p-4">
        {/* Equipo */}
        <section
          className={`lg:col-span-3 flex-col gap-2.5 overflow-y-auto ${
            mobileTab === 'party' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="hq-card flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#5A7D62]" />
              <span className="hq-title text-sm">Tu equipo</span>
            </div>
            <span className="hq-chip text-[9px]">en vivo</span>
          </div>

          <div className="space-y-2.5">
            {party.map((pkmn, idx) => {
              const hpPct = Math.round(
                ((pkmn.hp || 35) / (pkmn.maxHp || 35)) * 100
              );
              return (
                <div key={idx} className="hq-card p-3">
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
                    <span className="hq-mono text-[10px] text-[#8A877E]">
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
                    <span className="hq-mono text-[#8A877E]">PS</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7DF]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${hpPct}%`,
                          backgroundColor:
                            hpPct > 50
                              ? 'var(--hq-cto)'
                              : hpPct > 20
                                ? 'var(--hq-gold)'
                                : 'var(--hq-danger)',
                        }}
                      />
                    </div>
                    <span className="hq-mono text-[#5E5C56]">
                      {pkmn.hp || 35}/{pkmn.maxHp || 35}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hq-panel p-3 text-[11px] leading-relaxed text-[#5E5C56]">
            Al capturar o subir de nivel dentro del juego, el equipo se sincroniza aquí.
          </div>
        </section>

        {/* Consola */}
        <section
          className={`lg:col-span-6 flex h-full min-h-0 flex-col ${
            mobileTab === 'game' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E8E5DD] bg-[#F2EFE9] p-2 shadow-sm lg:p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="hq-label">Consola</span>
              <span className="hq-mono text-[10px] text-[#8A877E]">
                {batteryMinutes} min disponibles
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0F1112]">
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
          <div className="hq-card flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C49347]" />
              <span className="hq-title text-sm">Mochila</span>
            </div>
            <span className="hq-mono flex items-center gap-1 text-[11px] text-[#C49347]">
              <Coins className="h-3.5 w-3.5" />
              ₽{profile?.pokedollars ?? 150}
            </span>
          </div>

          <div className="flex gap-1 rounded-xl border border-[#E8E5DD] bg-[#F2EFE9] p-1">
            {[
              { id: 'items' as const, label: `Suministros (${QUICK_ITEMS.length})` },
              { id: 'pokemon' as const, label: `Pokémon (${QUICK_POKEMON_REWARDS.length})` },
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
                <div key={item.id} className="hq-card p-3">
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
                    <span className="hq-mono text-[11px] font-semibold text-[#C49347]">
                      ₽{item.cost}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInjectItem(item)}
                    className="hq-btn hq-btn-ghost mt-2 w-full py-1.5 text-[10px]"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#C49347]" />
                    Inyectar a la mochila
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hq-panel p-2.5">
                <div className="hq-label mb-1.5">Destino de entrega</div>
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
                <div key={pkmn.id} className="hq-card p-3">
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
                          <span className="hq-mono rounded-full bg-[#C49347]/10 px-1.5 py-0.5 text-[8px] text-[#A6752C]">
                            {pkmn.badge}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8A877E]">
                          {pkmn.desc}
                        </div>
                      </div>
                    </div>
                    <span className="hq-mono text-[11px] font-semibold text-[#C49347]">
                      ₽{pkmn.cost}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInjectPokemonReward(pkmn)}
                    className="hq-btn hq-btn-primary mt-2 w-full py-1.5 text-[10px]"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {pokemonDestination === 'pc' ? 'Guardar en PC Box 1' : 'Inyectar al equipo'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="hq-panel p-3 text-[10px] leading-relaxed text-[#8A877E]">
            Las tiendas del juego son caras. Gana Pokédólares con tus tareas para abastecerte.
          </div>
        </section>
      </div>
    </div>
  );
};
