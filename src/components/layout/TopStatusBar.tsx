'use client';

import React from 'react';
import Link from 'next/link';
import { useTrainerStore } from '@/store/useTrainerStore';
import { Flame, Coins, BatteryCharging, Egg, Zap, Sun, Moon, Gamepad2, Crown } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export const TopStatusBar: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const toggleTheme = useTrainerStore((s) => s.toggleTheme);
  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);

  if (!profile) return null;

  // Cálculo de batería (máximo recomendado para visualización: 60 min)
  const batteryPct = Math.min(100, Math.round((profile.battery_minutes / 60) * 100));
  // Progreso del huevo (meta típica: 2000 pasos)
  const eggMax = 2000;
  const eggPct = Math.min(100, Math.round((profile.egg_steps / eggMax) * 100));

  const isLight = theme === 'light_gbc';

  const handleToggleTheme = () => {
    soundFx.playClick();
    toggleTheme();
  };

  return (
    <header
      className={`w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none sticky top-0 z-50 transition-colors duration-200 ${
        isLight
          ? 'bg-[#F4F1EA] text-slate-900 border-b-4 border-black shadow-[0_4px_0_#000]'
          : 'bg-[#121214] text-slate-200 border-b-2 border-emerald-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
      }`}
    >
      {/* Lado Izquierdo: Branding & Selector de Tema Nintendo */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all ${
            isLight
              ? 'bg-[#E60012] text-white shadow-[2px_2px_0_#000] border-2 border-black font-mono text-xs font-black'
              : 'bg-black/80 border border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.3)] font-mono text-xs font-black'
          }`}
        >
          <Zap className="w-4 h-4 animate-pulse" />
          <span className="tracking-widest uppercase">Cyber-Johto</span>
        </div>

        {/* Botón Selector Doble Tema Nintendo */}
        <button
          onClick={handleToggleTheme}
          title={isLight ? 'Cambiar a GBA SP (Dark Neón)' : 'Cambiar a Game Boy Color (Light Marfil)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
            isLight
              ? 'bg-[#E60012] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              : 'bg-[#18181b] text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
          }`}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px]">GBC MARFIL</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px]">GBA SP GRAFITO</span>
            </>
          )}
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Entrenador:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${
              profile.is_admin
                ? isLight
                  ? 'bg-amber-300 border-2 border-black text-black shadow-[2px_2px_0_#000]'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : isLight
                  ? 'bg-white border-2 border-black text-black shadow-[2px_2px_0_#000]'
                  : 'bg-slate-900 text-slate-100 border border-slate-700'
            }`}
          >
            {profile.is_admin && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            <span>{profile.trainer_name}</span>
            <span className="text-[10px] opacity-75">
              ({profile.is_admin ? 'LÍDER DE LIGA' : `Nv. ${profile.current_level}`})
            </span>
          </span>
        </div>
      </div>

      {/* Centro / Métricas Gamificadas */}
      <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs font-mono">
        {/* Racha de Días (Streak) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
            isLight
              ? 'bg-amber-100 border-2 border-black text-amber-900 shadow-[2px_2px_0_#000]'
              : 'bg-slate-900/90 rounded border border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)]'
          }`}
          title="Racha de días consecutivos estudiando"
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
          <span className="font-bold">{profile.streak_days}</span>
          <span className="text-[10px] hidden sm:inline">DÍAS</span>
        </div>

        {/* Saldo de Pokédólares */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
            isLight
              ? 'bg-yellow-100 border-2 border-black text-yellow-950 shadow-[2px_2px_0_#000]'
              : 'bg-slate-900/90 rounded border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
          }`}
          title="Saldo de Pokédólares para tienda y objetos"
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-bold">₽{profile.pokedollars.toLocaleString()}</span>
        </div>

        {/* Medidor visual de Batería GBA */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all ${
            isLight
              ? 'bg-cyan-100 border-2 border-black text-cyan-950 shadow-[2px_2px_0_#000]'
              : 'bg-slate-900/90 rounded border border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
          }`}
          title="Batería GBA disponible para emulador y prácticas"
        >
          <BatteryCharging className="w-4 h-4 text-cyan-500" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[10px] leading-none">
              <span>BATERÍA</span>
              <span className="font-bold ml-1">{profile.battery_minutes}m</span>
            </div>
            <div
              className={`w-16 h-1.5 rounded-full overflow-hidden border ${
                isLight ? 'bg-slate-300 border-black' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  batteryPct > 20
                    ? isLight
                      ? 'bg-cyan-600'
                      : 'bg-emerald-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${batteryPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Barra de Pasos de la Incubadora */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all ${
            isLight
              ? 'bg-emerald-100 border-2 border-black text-emerald-950 shadow-[2px_2px_0_#000]'
              : 'bg-slate-900/90 rounded border border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
          }`}
          title="Pasos para eclosionar el Huevo Pokémon"
        >
          <Egg className="w-4 h-4 text-emerald-500" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[10px] leading-none">
              <span>INCUBADORA</span>
              <span className="font-bold ml-1">
                {profile.egg_steps}/{eggMax}
              </span>
            </div>
            <div
              className={`w-16 h-1.5 rounded-full overflow-hidden border ${
                isLight ? 'bg-slate-300 border-black' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${eggPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Botón Acceso Directo a la Sala Arcade */}
        <button
          onClick={() => {
            soundFx.playClick();
            openArcadeRoom();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            profile.battery_minutes > 0
              ? isLight
                ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-black font-black shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse'
              : isLight
                ? 'bg-slate-300 text-slate-600 border-2 border-black opacity-70 cursor-not-allowed'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
          title={
            profile.battery_minutes > 0
              ? `Entrar a la Sala Arcade (${profile.battery_minutes}m disponibles)`
              : 'Batería agotada: completa retos para recargar'
          }
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{profile.battery_minutes > 0 ? 'SALA ARCADE' : 'SIN BATERÍA'}</span>
        </button>

        {/* Botón Acceso Rápido SuperAdmin (Solo visible si es Admin verificado) */}
        {profile.is_admin && (
          <Link
            href="/admin"
            onClick={() => soundFx.playClick()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              isLight
                ? 'bg-amber-300 hover:bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
            title="Panel de Control SuperAdmin (Gestión de Alumnos y Reglas)"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ADMIN</span>
          </Link>
        )}
      </div>
    </header>
  );
};
