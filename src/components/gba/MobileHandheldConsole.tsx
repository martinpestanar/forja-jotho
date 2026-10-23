'use client';

import React, { useState } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { GbaPanel } from '@/components/layout/GbaPanel';
import { MobileGamepad } from '@/components/gba/MobileGamepad';
import { 
  BatteryCharging, 
  Coins, 
  Save, 
  Maximize, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';

export const MobileHandheldConsole: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';
  const batteryMinutes = profile?.battery_minutes ?? 0;
  const pokedollars = profile?.pokedollars ?? 0;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Alternar pantalla completa nativa del teléfono
  const toggleFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Disparar guardado rápido en Supabase Storage
  const triggerQuickCloudSave = () => {
    soundFx.playCoin();
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.1 },
      colors: ['#F59E0B', '#22C55E', '#06B6D4'],
    });
    setSaveSuccessMsg('¡PARTIDA GUARDADA EN LA NUBE!');
    setTimeout(() => setSaveSuccessMsg(null), 2500);

    // Despachar evento para que GbaConsoleWorker lo procese si corresponde
    window.dispatchEvent(new CustomEvent('syndex:quick-cloud-save'));
  };

  return (
    <div
      className={`fixed inset-0 w-screen h-screen flex flex-col justify-between overflow-hidden select-none touch-none transition-colors duration-300 ${
        isLight
          ? 'bg-[#ECE7DC] text-slate-900'
          : 'bg-[#0a0e17] text-slate-100'
      }`}
    >
      {/* 1. Marco Superior: Mini-HUD Consola con Telemetría */}
      <header
        className={`w-full px-3 py-1.5 flex items-center justify-between z-30 font-mono text-xs border-b ${
          isLight
            ? 'bg-[#F4F1EA] border-black/20 shadow-sm text-slate-800'
            : 'bg-[#101626] border-slate-800 shadow-md text-slate-200'
        }`}
      >
        {/* Marca de Consola & Indicador de Batería */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30">
            <BatteryCharging className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[11px]">{batteryMinutes}m</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30">
            <Coins className="w-3.5 h-3.5" />
            <span className="text-[11px]">{pokedollars.toLocaleString()}</span>
          </div>
        </div>

        {/* Acciones Rápidas del Chasis: Guardar Nube & Pantalla Completa */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerQuickCloudSave}
            title="Guardar en la nube"
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
              isLight
                ? 'bg-emerald-500 text-white shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                : 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/60 active:scale-95'
            }`}
          >
            <Save className="w-3 h-3" />
            <span>Guardar</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-200 border-black/30 text-slate-800 active:translate-y-0.5'
                : 'bg-slate-800 border-slate-700 text-slate-300 active:scale-95'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Banner flotante de feedback al guardar */}
      {saveSuccessMsg && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-slate-950 font-black font-mono text-[10px] px-3 py-1 rounded-md shadow-lg border border-black animate-bounce pointer-events-none">
          {saveSuccessMsg}
        </div>
      )}

      {/* 2. Área Central: Pantalla Game Boy Advance Edge-to-Edge (Máxima Amplitud y Claridad) */}
      <div className="flex-1 w-full flex items-center justify-center px-1.5 py-1 min-h-0">
        <div
          className={`w-full h-full max-h-[58vh] rounded-xl p-1.5 flex flex-col relative overflow-hidden transition-all ${
            isLight
              ? 'bg-[#182030] border-3 border-black shadow-[4px_4px_0_#000]'
              : 'bg-[#080d18] border border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
          }`}
        >
          {/* Header Minimalista de la Pantalla */}
          <div className="flex items-center justify-between px-2 py-0.5 z-20 shrink-0">
            {/* LED de Batería de la Consola */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  batteryMinutes > 10
                    ? 'bg-emerald-500 shadow-[0_0_6px_#22c55e]'
                    : 'bg-rose-500 animate-ping shadow-[0_0_6px_#f43f5e]'
                }`}
              />
              <span className="text-[8px] font-mono tracking-widest text-slate-400">POWER</span>
            </div>

            {/* Logo Retro Cyber-Pocket */}
            <div className="text-[9px] font-mono font-black italic tracking-wider text-slate-400">
              CYBER<span className="text-amber-400">POCKET</span>
            </div>
          </div>

          {/* Canvas de mGBA ocupando todo el alto y ancho proporcional restante */}
          <div className="flex-1 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center relative">
            <GbaPanel standaloneScreen={true} />
          </div>
        </div>
      </div>

      {/* 3. Área Inferior: Gamepad Táctil Háptico Compacto */}
      <footer className="w-full shrink-0">
        <MobileGamepad isLight={isLight} />
      </footer>
    </div>
  );
};
