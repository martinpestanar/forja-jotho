import React from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight, ShieldCheck, Sparkles, BatteryCharging, Trophy } from 'lucide-react';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1C1B18] flex flex-col justify-between select-none font-sans">
      {/* Top Header Johto Minimal */}
      <header className="border-b border-[#E4E1D8] bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D9383A] flex items-center justify-center text-white shadow-[0_2px_4px_rgba(217,56,58,0.25)]">
              <Gamepad2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-semibold tracking-tight text-[#1C1B18]">
                  SynDex
                </span>
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-[#FAF9F5] text-[#706E66] border border-[#E4E1D8]">
                  GBA
                </span>
              </div>
              <span className="text-[10px] text-[#706E66] block font-mono mt-0.5">
                Heart & Soul Edition
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E4E1D8] text-[#1C1B18] text-xs font-semibold hover:bg-[#FAF9F5] active:scale-95 transition-all cursor-pointer shadow-[0_1px_2px_rgba(26,25,21,0.03)]"
          >
            <span>Entrar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Welcome Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm space-y-4">
          
          {/* Tarjeta Hero Principal: Chasis Analogue Pocket */}
          <div className="bg-white border border-[#E4E1D8] rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,25,21,0.06)] text-center space-y-4">
            {/* Emblema Animado */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-center relative">
              <Gamepad2 className="w-10 h-10 text-[#D9383A] stroke-[1.9]" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-[#C59B46] fill-[#C59B46]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#D9383A] px-2.5 py-0.5 rounded-md bg-[#D9383A]/8 border border-[#D9383A]/20">
                DISCIPLINA GAMIFICADA
              </span>
              <h1 className="text-xl font-semibold text-[#1C1B18] tracking-tight pt-1">
                Tu Vida Real es el Combustible
              </h1>
              <p className="text-xs text-[#706E66] font-normal leading-relaxed max-w-xs mx-auto">
                Entrena, enfócate y conquista hábitos para desbloquear tiempo de juego real en tu cartucho de Game Boy.
              </p>
            </div>

            {/* Píldoras Técnicas de Valor */}
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#2D68C4]">
                  <BatteryCharging className="w-4 h-4 stroke-[2.2]" />
                  <span className="text-[10px] font-mono font-medium uppercase">Batería GBA</span>
                </div>
                <span className="text-xs font-semibold text-[#1C1B18] block mt-0.5 font-mono">Hasta 120 min</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
                <div className="flex items-center gap-1.5 text-[#9A7025]">
                  <Trophy className="w-4 h-4 stroke-[2]" />
                  <span className="text-[10px] font-mono font-medium uppercase">Shinies .SAV</span>
                </div>
                <span className="text-xs font-semibold text-[#1C1B18] block mt-0.5 font-mono">Inyección Real</span>
              </div>
            </div>

            {/* Botones de Entrada */}
            <div className="pt-2 space-y-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 min-h-[48px] rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#D9383A] shadow-[0_2px_0px_#B32628] active:translate-y-[1px] active:shadow-none hover:bg-[#C92F31] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <span>INSERTAR CARTUCHO</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#1C1B18] bg-white hover:bg-[#FAF9F5] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(26,25,21,0.03)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
              >
                <span>Acceso Directo al Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Micro-aviso */}
          <div className="p-3 bg-white border border-[#E4E1D8] rounded-2xl flex items-center gap-2.5 text-center justify-center shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
            <ShieldCheck className="w-4 h-4 text-[#2E8555] shrink-0" />
            <span className="text-xs font-mono font-medium text-[#706E66]">
              Sin descargas · Emulador mGBA WebAssembly integrado
            </span>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="py-3 text-center text-[10px] font-mono text-[#706E66]">
        SYNDEX PLATFORM · HARDWARE RETRO-PREMIUM ENGINE © 2026
      </footer>
    </div>
  );
}
