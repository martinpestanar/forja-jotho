'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudentAuthModal } from '@/components/auth/StudentAuthModal';
import { 
  Waves, 
  Sun, 
  ChevronRight, 
  Compass, 
  Lock,
  Gamepad2,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1F1E1B] flex flex-col justify-between selection:bg-[#D97043] selection:text-white">
      {/* 1. Header Minimalista Editorial */}
      <header className="border-b border-[#E8E5DD] bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043]">
            <Waves className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-editorial text-xs font-semibold tracking-wide text-[#1F1E1B] block">
              JOHTO SOLSTICE
            </span>
            <span className="text-[10px] text-[#706E66] block -mt-0.5 font-mono">
              Autodominio & Cartucho RPG
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-mono font-medium text-[#D97043] hover:text-[#CC6437] transition-colors"
        >
          Entrar →
        </Link>
      </header>

      {/* 2. Cuerpo Principal Mobile-First: Warm Solarized Editorial */}
      <main className="max-w-lg mx-auto w-full px-5 py-8 space-y-6 my-auto">
        {/* Badge de Estatus / Marea Activa */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97043]/10 border border-[#D97043]/20 text-[#D97043] text-[11px] font-mono">
          <Sun className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span className="tracking-wide">MAREA COSTERA • TEMPORADA 2026</span>
        </div>

        {/* Título de Tipografía Editorial Lora */}
        <div className="space-y-3">
          <h1 className="font-editorial text-3xl font-normal tracking-tight text-[#1F1E1B] leading-snug">
            Navega la marea interior. <br />
            <span className="italic text-[#D97043]">El océano forja al maestro.</span>
          </h1>
          <p className="text-xs text-[#706E66] leading-relaxed">
            Un retiro de autodisciplina y hábitos diarios para la generación que creció con Johto.
            Sincronizado milimétricamente con tu partida en <span className="text-[#1F1E1B] font-semibold">Pokémon Heart & Soul</span>.
          </p>
        </div>

        {/* Dos Frentes: Marea & Solsticio */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="coastal-card p-4 space-y-1.5 border-l-2 border-l-[#D97043]">
            <span className="text-[10px] font-mono text-[#D97043] font-medium uppercase tracking-wider block">
              Mareas de Vigor
            </span>
            <h4 className="text-xs font-semibold text-[#1F1E1B]">Hábitos & Enfoque</h4>
            <p className="text-[11px] text-[#706E66] leading-normal">
              Gana minutos de inmersión y conchas de trueque.
            </p>
          </div>

          <div className="coastal-card p-4 space-y-1.5 border-l-2 border-l-[#4A8B99]">
            <span className="text-[10px] font-mono text-[#4A8B99] font-medium uppercase tracking-wider block">
              Santuario
            </span>
            <h4 className="text-xs font-semibold text-[#1F1E1B]">Calma & Retención</h4>
            <p className="text-[11px] text-[#706E66] leading-normal">
              30 días en calma para sincronizar especímenes de élite.
            </p>
          </div>
        </div>

        {/* Botones Táctiles Primarios */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => openAuth('signup')}
            className="w-full py-3 coastal-button-sun text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Iniciar Viaje / Crear Cuenta</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAuth('login')}
            className="w-full py-3 bg-white hover:bg-[#F2EFE9] border border-[#E8E5DD] text-[#1F1E1B] text-sm font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-sm"
          >
            <Lock className="w-4 h-4 text-[#D97043]" />
            <span>Acceder a tu Cuaderno</span>
          </button>
        </div>

        {/* Resumen del Cartucho en Vivo */}
        <div className="coastal-card p-3 flex items-center justify-between text-[11px] font-mono text-[#706E66]">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-[#6E8B68]" />
            <span>mGBA WebAssembly .SAV</span>
          </div>
          <span className="text-[#6E8B68] font-semibold">Sincronización Nativa</span>
        </div>
      </main>

      {/* 3. Footer Sobrio */}
      <footer className="border-t border-[#E8E5DD] py-4 px-5 text-center text-[10px] font-mono text-[#706E66] max-w-lg mx-auto w-full flex items-center justify-between">
        <span>© 2026 JOHTO COASTAL // ANTHROPIC VIBE</span>
        <Link href="/admin/login" className="hover:text-[#D97043] transition-colors">
          Portal Docente
        </Link>
      </footer>

      {/* Modal de Registro e Inicio de Sesión */}
      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
