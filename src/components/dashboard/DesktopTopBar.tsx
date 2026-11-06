'use client';

import React from 'react';
import { 
  Zap, 
  Coins, 
  Flame, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Moon, 
  Radio, 
  LogOut, 
  User,
  ShieldCheck
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';
import { AnalogMidnightGauge } from './AnalogMidnightGauge';

interface DesktopTopBarProps {
  profileData: any;
  timeUntilMidnight: string;
  completionPercent: number;
  walletPokedollars: number;
  batteryMinutes: number;
  onOpenGrimoire: () => void;
  onOpenJournal: () => void;
  onOpenSilphTuner: () => void;
  onOpenTutorial: () => void;
  onOpenOracle: () => void;
}

export function DesktopTopBar({
  profileData,
  timeUntilMidnight,
  completionPercent,
  walletPokedollars,
  batteryMinutes,
  onOpenGrimoire,
  onOpenJournal,
  onOpenSilphTuner,
  onOpenTutorial,
  onOpenOracle,
}: DesktopTopBarProps) {
  const leaderName = profileData?.leader_name || 'Entrenador';
  const totem = profileData?.guide_totem?.toUpperCase() || 'LOBO';
  const streak = profileData?.temperance_streak_days ?? 0;

  const handleLogout = async () => {
    soundFx.playClick();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E4E1D8] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Badge Editorial */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-[#D9383A] text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
              SX
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-widest text-sm text-[#1C1B18]">
                  SYNDEX
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EAE7DF] text-[#706E66] border border-[#DCD8CD]">
                  ESTACIÓN JOHTO v2.0
                </span>
              </div>
              <p className="text-[10.5px] font-serif text-[#706E66] leading-none mt-0.5">
                Pueblo Primavera · Consola de Soberanía
              </p>
            </div>
          </div>
        </div>

        {/* Centro: Cronógrafo Analógico & VU-Meter de Disciplina */}
        <AnalogMidnightGauge
          timeUntilMidnight={timeUntilMidnight}
          completionPercent={completionPercent}
        />

        {/* Derecha: Recursos, Estado del Líder & Herramientas */}
        <div className="flex items-center gap-3">
          {/* Balances */}
          <div className="flex items-center gap-2">
            {/* Pokédólares */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025] font-mono font-bold text-xs">
              <Coins className="w-3.5 h-3.5" />
              <span>₽{walletPokedollars.toLocaleString('es-CO')}</span>
            </div>

            {/* Batería */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D68C4]/10 border border-[#2D68C4]/25 text-[#2D68C4] font-mono font-bold text-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{batteryMinutes} min</span>
            </div>
          </div>

          {/* Separador vertical */}
          <div className="h-6 w-[1px] bg-[#E4E1D8]" />

          {/* Botones de Utilidades Rápidas */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenOracle();
              }}
              title="Consultar Oráculo Rúnico"
              className="p-2 rounded-xl bg-white border border-[#E4E1D8] text-[#706E66] hover:text-[#D9383A] hover:border-[#D9383A]/30 hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenJournal();
              }}
              title="Diario de Medianoche"
              className="p-2 rounded-xl bg-white border border-[#E4E1D8] text-[#706E66] hover:text-[#2D68C4] hover:border-[#2D68C4]/30 hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Moon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenGrimoire();
              }}
              title="Grimorio del Soberano"
              className="p-2 rounded-xl bg-white border border-[#E4E1D8] text-[#706E66] hover:text-[#C59B46] hover:border-[#C59B46]/30 hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSilphTuner();
              }}
              title="Sintonizador Silph (Inicial Shiny)"
              className="p-2 rounded-xl bg-white border border-[#E4E1D8] text-[#706E66] hover:text-[#2E8555] hover:border-[#2E8555]/30 hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Radio className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-white border border-[#E4E1D8] text-[#706E66] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
