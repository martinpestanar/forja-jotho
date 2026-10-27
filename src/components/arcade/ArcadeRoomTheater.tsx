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
  Gamepad2, 
  ShieldCheck, 
  Layers, 
  ArrowLeft,
  Coins
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
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    desc: '+1 Nivel instantáneo (x3)',
    cost: 50,
    gbaItemId: HNS_ITEM_IDS.RARE_CANDY,
    pocket: 'ITEMS' as const,
    quantity: 3,
  },
  {
    id: 'master_ball',
    name: 'Master Ball',
    icon: <Crown className="w-5 h-5 text-purple-400" />,
    desc: 'Captura 100% infalible (x1)',
    cost: 120,
    gbaItemId: HNS_ITEM_IDS.MASTER_BALL,
    pocket: 'POKEBALLS' as const,
    quantity: 1,
  },
  {
    id: 'max_potion',
    name: 'Poción Máxima',
    icon: <Heart className="w-5 h-5 text-rose-400" />,
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

export const ArcadeRoomTheater: React.FC = () => {
  const isArcadeOpen = useTrainerStore((s) => s.isArcadeOpen);
  const closeArcadeRoom = useTrainerStore((s) => s.closeArcadeRoom);
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const purchaseShopItemRpc = useTrainerStore((s) => s.purchaseShopItemRpc);
  const isLight = theme === 'light_gbc';

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

  const handleInjectItem = async (item: typeof QUICK_ITEMS[0]) => {
    const currentPokedollars = profile?.pokedollars ?? 0;
    if (currentPokedollars < item.cost) {
      soundFx.playWarning();
      setInjectedNotification(`⚠️ Necesitas ₽${item.cost} (Tienes ₽${currentPokedollars})`);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    const purchase = await purchaseShopItemRpc(item.id, item.cost);
    if (!purchase.success && purchase.error) {
      soundFx.playWarning();
      setInjectedNotification(`⚠️ ${purchase.error}`);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    triggerGbaItemInjection(item.gbaItemId, item.quantity, item.pocket, item.name);
    soundFx.playCoin();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    setInjectedNotification(`🎒 ¡${item.name} x${item.quantity} inyectado! -₽${item.cost}`);
    setTimeout(() => setInjectedNotification(null), 2800);
  };

  const handleInjectPokemonReward = async (pkmn: typeof QUICK_POKEMON_REWARDS[0]) => {
    const currentPokedollars = profile?.pokedollars ?? 0;
    if (currentPokedollars < pkmn.cost) {
      soundFx.playWarning();
      setInjectedNotification(`⚠️ Necesitas ₽${pkmn.cost} (Tienes ₽${currentPokedollars})`);
      setTimeout(() => setInjectedNotification(null), 3000);
      return;
    }

    const purchase = await purchaseShopItemRpc(pkmn.id, pkmn.cost);
    if (!purchase.success && purchase.error) {
      soundFx.playWarning();
      setInjectedNotification(`⚠️ ${purchase.error}`);
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
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.5 },
    });
    const destLabel = pokemonDestination === 'pc' ? 'tu PC Box 1 (Almacenamiento)' : 'tu Equipo Pokémon';
    setInjectedNotification(`✨ ¡${pkmn.name} enviado a ${destLabel}! -₽${pkmn.cost}`);
    setTimeout(() => setInjectedNotification(null), 3500);
  };

  const party = profile?.gba_party_json && profile.gba_party_json.length > 0
    ? profile.gba_party_json
    : [
        { name: profile?.starter_pokemon || 'Cyndaquil', level: 12, hp: 35, maxHp: 35, type: 'fire' },
      ];

  const batteryMinutes = profile?.battery_minutes ?? 42;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col font-mono transition-all duration-300 ${
        isArcadeOpen
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      } ${
        isLight
          ? 'bg-[#F4F1EA] text-slate-900'
          : 'bg-[#090d16]/95 backdrop-blur-md text-slate-100'
      }`}
    >
      {/* 1. Header de la Cabina Arcade */}
      <header
        className={`px-4 py-2.5 flex items-center justify-between border-b select-none shrink-0 ${
          isLight
            ? 'bg-[#FFFFFF] border-black shadow-[0_3px_0_#000]'
            : 'bg-[#121214] border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              closeArcadeRoom();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 active:scale-95'
            }`}
            title="Volver al taller de código (ESC)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">VOLVER AL TALLER</span>
            <span className="sm:hidden">SALIR</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#E60012] animate-bounce" />
              <span>SALA ARCADE GBA</span>
            </span>
            <span className="text-[10px] hidden md:inline px-2 py-0.5 rounded bg-black/10 font-bold border border-black/20">
              Presiona [ESC] para salir
            </span>
          </div>
        </div>

        {/* Telemetría Central / Batería */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-bold text-xs ${
              batteryMinutes > 0
                ? isLight
                  ? 'bg-emerald-100 border-black text-emerald-950 shadow-[2px_2px_0_#000]'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                : 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
            }`}
          >
            <BatteryCharging className="w-4 h-4" />
            <span>{batteryMinutes} MINUTOS DE JUEGO</span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              closeArcadeRoom();
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-[#E60012] text-white border-black hover:bg-[#cc0010] shadow-[2px_2px_0_#000]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Cerrar sala"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Selector de Vistas en Mobile (Barra Superior Táctil) */}
      <div
        className={`md:hidden flex items-center justify-around border-b px-2 py-1.5 text-xs font-bold ${
          isLight ? 'bg-[#EAE6DD] border-black' : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <button
          onClick={() => setMobileTab('game')}
          className={`px-3 py-1 rounded-md transition-all ${
            mobileTab === 'game'
              ? isLight
                ? 'bg-[#E60012] text-white border border-black'
                : 'bg-emerald-500 text-black font-black'
              : 'text-slate-400'
          }`}
        >
          CONSOLA
        </button>
        <button
          onClick={() => setMobileTab('party')}
          className={`px-3 py-1 rounded-md transition-all ${
            mobileTab === 'party'
              ? isLight
                ? 'bg-[#E60012] text-white border border-black'
                : 'bg-emerald-500 text-black font-black'
              : 'text-slate-400'
          }`}
        >
          EQUIPO ({party.length})
        </button>
        <button
          onClick={() => setMobileTab('bag')}
          className={`px-3 py-1 rounded-md transition-all ${
            mobileTab === 'bag'
              ? isLight
                ? 'bg-[#E60012] text-white border border-black'
                : 'bg-emerald-500 text-black font-black'
              : 'text-slate-400'
          }`}
        >
          MOCHILA
        </button>
      </div>

      {/* Notificación de Inyección Flotante */}
      {injectedNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-black font-black text-xs rounded-xl border-2 border-black shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-bounce flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-4 h-4" />
          <span>{injectedNotification}</span>
        </div>
      )}

      {/* 3. Contenedor Principal Desktop-First (Grid de 3 Columnas) */}
      <div className="flex-1 overflow-hidden p-3 md:p-4 grid grid-cols-1 md:grid-cols-12 gap-4 max-w-7xl mx-auto w-full">
        {/* Columna Izquierda: Tu Equipo Pokémon en Vivo (3 columnas en desktop) */}
        <section
          className={`md:col-span-3 flex-col gap-3 overflow-y-auto ${
            mobileTab === 'party' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between shadow-md ${
              isLight
                ? 'bg-[#FFFFFF] border-3 border-black shadow-[3px_3px_0_#000]'
                : 'bg-[#121214] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider">Tu Equipo GBA</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              EN VIVO (RAM)
            </span>
          </div>

          {/* Lista de Pokémon en el equipo */}
          <div className="space-y-2.5 overflow-y-auto pr-1">
            {party.map((pkmn: any, idx: number) => {
              const hpPct = Math.round(((pkmn.hp || 35) / (pkmn.maxHp || 35)) * 100);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isLight
                      ? 'bg-[#FFFFFF] border-2 border-black shadow-[3px_3px_0_#000]'
                      : 'bg-[#18181b]/90 border-slate-700/80 shadow-md hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={POKEMON_ASSETS.getBoxIcon(pkmn.speciesId || 155)}
                        alt={pkmn.name}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="font-black text-xs uppercase">
                        {pkmn.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        isLight ? 'bg-amber-200 text-black border border-black' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      NV. {pkmn.level || 12}
                    </span>
                  </div>

                  {/* Vista 3D del sprite animado */}
                  <div className="h-16 w-full flex items-center justify-center my-1 bg-black/5 rounded-lg">
                    <img
                      src={POKEMON_ASSETS.getAnimatedSprite(pkmn.speciesId || 155, !!pkmn.isShiny)}
                      alt={pkmn.name}
                      className="h-14 w-14 object-contain filter drop-shadow-md"
                    />
                  </div>

                  {/* Barra de Vida elástica */}
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>PS:</span>
                    <div
                      className={`flex-1 h-2 rounded-full overflow-hidden border ${
                        isLight ? 'bg-slate-200 border-black' : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div
                        className={`h-full transition-all duration-300 ${
                          hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                    <span>{pkmn.hp || 35}/{pkmn.maxHp || 35}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-auto p-2.5 rounded-xl border text-[11px] text-center ${
              isLight
                ? 'bg-amber-100 border-2 border-black text-amber-950 shadow-[2px_2px_0_#000]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            ⚡ Al capturar o subir de nivel dentro del juego, se sincroniza automáticamente aquí.
          </div>
        </section>

        {/* Columna Centro: Consola GBA Central de Alta Definición (6 columnas en desktop) */}
        <section
          className={`md:col-span-6 flex flex-col h-full min-h-0 ${
            mobileTab === 'game' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div
            className={`w-full h-full rounded-none md:rounded-2xl p-0 md:p-2.5 flex flex-col border-0 md:border shadow-none md:shadow-2xl overflow-hidden transition-colors ${
              isLight
                ? 'bg-transparent md:bg-[#EAE6DD] md:border-4 md:border-black md:shadow-[6px_6px_0_#000]'
                : 'bg-transparent md:bg-[#121214] md:border-2 md:border-emerald-500/40 md:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
            }`}
          >
            {isArcadeOpen && <GbaPanel />}
          </div>
        </section>

        {/* Columna Derecha: Mochila e Inyección en Tiempo Real (3 columnas en desktop) */}
        <section
          className={`md:col-span-3 flex-col gap-3 overflow-y-auto ${
            mobileTab === 'bag' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between shadow-md ${
              isLight
                ? 'bg-[#FFFFFF] border-3 border-black shadow-[3px_3px_0_#000]'
                : 'bg-[#121214] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider">Mochila & Premios</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-400">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>₽{profile?.pokedollars ?? 150}</span>
            </div>
          </div>

          {/* Selector de Sub-pestañas: Suministros vs Pokémon */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/20 border border-slate-700/40">
            <button
              onClick={() => {
                soundFx.playClick();
                setShopSubTab('items');
              }}
              className={`py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                shopSubTab === 'items'
                  ? isLight
                    ? 'bg-blue-600 text-white shadow-[1px_1px_0_#000]'
                    : 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎒 Suministros ({QUICK_ITEMS.length})
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setShopSubTab('pokemon');
              }}
              className={`py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                shopSubTab === 'pokemon'
                  ? isLight
                    ? 'bg-amber-500 text-slate-950 shadow-[1px_1px_0_#000]'
                    : 'bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ Pokémon ({QUICK_POKEMON_REWARDS.length})
            </button>
          </div>

          {/* Lista de Ítems inyectables */}
          {shopSubTab === 'items' ? (
            <div className="space-y-2 overflow-y-auto pr-1">
              {QUICK_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    isLight
                      ? 'bg-[#FFFFFF] border-2 border-black shadow-[3px_3px_0_#000]'
                      : 'bg-[#18181b]/90 border-slate-700/80 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isLight ? 'bg-amber-100 border-black' : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-black text-xs">{item.name}</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      ₽{item.cost}
                    </span>
                  </div>

                  <button
                    onClick={() => handleInjectItem(item)}
                    className={`w-full py-1 px-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isLight
                        ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 active:scale-95'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>INYECTAR A LA MOCHILA</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {/* Selector de Destino de Inyección */}
              <div
                className={`p-2 rounded-xl border flex flex-col gap-1.5 ${
                  isLight
                    ? 'bg-slate-100 border-2 border-black/30'
                    : 'bg-slate-900/90 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-slate-400">Destino de Entrega:</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {pokemonDestination === 'pc' ? 'PC Box 1 (Seguro / 30 ranuras)' : 'Equipo Activo (Máx 6)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setPokemonDestination('pc');
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      pokemonDestination === 'pc'
                        ? isLight
                          ? 'bg-cyan-500 text-black border border-black shadow-[1px_1px_0_#000]'
                          : 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : isLight
                        ? 'bg-white text-slate-700 border border-slate-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>💻 PC Box 1</span>
                    <span className="text-[8px] opacity-75">(Recomendado)</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setPokemonDestination('party');
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      pokemonDestination === 'party'
                        ? isLight
                          ? 'bg-amber-400 text-black border border-black shadow-[1px_1px_0_#000]'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : isLight
                        ? 'bg-white text-slate-700 border border-slate-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>🎒 Al Equipo</span>
                    <span className="text-[8px] opacity-75">(Máx 6)</span>
                  </button>
                </div>
              </div>

              {QUICK_POKEMON_REWARDS.map((pkmn) => (
                <div
                  key={pkmn.id}
                  className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    isLight
                      ? 'bg-[#FFFFFF] border-2 border-black shadow-[3px_3px_0_#000]'
                      : 'bg-[#18181b]/90 border-slate-700/80 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={POKEMON_ASSETS.getAnimatedSprite(pkmn.speciesId, pkmn.isShiny)}
                        alt={pkmn.name}
                        className="w-10 h-10 object-contain"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs">{pkmn.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {pkmn.badge}
                          </span>
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {pkmn.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      ₽{pkmn.cost}
                    </span>
                  </div>

                  <button
                    onClick={() => handleInjectPokemonReward(pkmn)}
                    className={`w-full py-1 px-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isLight
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 active:scale-95'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>
                      {pokemonDestination === 'pc' ? 'GUARDAR EN PC BOX 1' : 'INYECTAR AL EQUIPO'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`mt-auto p-2.5 rounded-xl border text-[10px] text-center ${
              isLight
                ? 'bg-blue-50 border-2 border-black text-blue-950 shadow-[2px_2px_0_#000]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            ⚡ Economía cruzada: Las tiendas del juego son ultra-caras. ¡Gana Pokédólares con tus tareas para abastecerte!
          </div>
        </section>
      </div>
    </div>
  );
};
