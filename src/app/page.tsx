'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudentAuthModal } from '@/components/auth/StudentAuthModal';
import { 
  ShieldCheck, 
  Flame, 
  Zap, 
  Lock, 
  ChevronRight, 
  Gamepad2, 
  Coins, 
  Clock, 
  Sparkles,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E2E8F0] flex flex-col justify-between selection:bg-[#C5A059] selection:text-black">
      {/* 1. Header Táctico Superior */}
      <header className="border-b border-white/5 bg-[#14171C]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059]">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-widest text-[#E2E8F0] uppercase block">
              FORJA JOHTO
            </span>
            <span className="text-[10px] text-[#C5A059] block -mt-0.5">
              Autodominio & Cartucho RPG
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs font-mono font-bold text-[#C5A059] hover:text-[#E5C158] transition-colors"
        >
          Entrar →
        </Link>
      </header>

      {/* 2. Cuerpo Principal Mobile-First Estoico */}
      <main className="max-w-lg mx-auto w-full px-4 py-8 space-y-6 my-auto">
        {/* Badge de Estatus */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-mono">
          <Flame className="w-3.5 h-3.5 fill-current text-[#D93829]" />
          <span>PACTO DE SOBERANÍA PERSONAL</span>
        </div>

        {/* Título de Marca Oficial */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-[#E2E8F0] leading-tight">
            Domina la bestia interior. <br />
            <span className="text-[#C5A059]">Forja tu legado.</span>
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Plataforma estoica de hábitos reales y contratos inviolables sincronizada con tu partida de 
            <span className="text-[#E2E8F0] font-semibold"> Pokémon Heart & Soul</span>. Gana minutos de juego y suministros de élite mediante victorias en la vida real.
          </p>
        </div>

        {/* Tarjetas de los Dos Frentes */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="valdr-card p-3.5 space-y-1.5 border-l-2 border-l-[#C5A059]">
            <span className="text-[10px] font-mono text-[#C5A059] font-bold uppercase block">
              Frente de Vigor
            </span>
            <h4 className="text-xs font-bold text-[#E2E8F0]">Hábitos & Negocio</h4>
            <p className="text-[11px] text-[#64748B]">
              Genera Oro de la Forja y hasta 120m diarios de juego.
            </p>
          </div>

          <div className="valdr-card p-3.5 space-y-1.5 border-l-2 border-l-[#4E9F9F] valdr-glacial-glow">
            <span className="text-[10px] font-mono text-[#4E9F9F] font-bold uppercase block">
              Frente Templanza
            </span>
            <h4 className="text-xs font-bold text-[#E2E8F0]">Retención & Foco</h4>
            <p className="text-[11px] text-[#64748B]">
              30 días invicto para eclosionar Shinies de 6 IVs perfectos.
            </p>
          </div>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="space-y-2.5 pt-4">
          <button
            onClick={() => openAuth('signup')}
            className="w-full py-3 valdr-button-bronze text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Prestar Juramento / Crear Cuenta</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAuth('login')}
            className="w-full py-3 bg-[#14171C] hover:bg-[#1a1f26] border border-white/10 text-[#E2E8F0] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Lock className="w-4 h-4 text-[#C5A059]" />
            <span>Acceder a la Forja</span>
          </button>
        </div>

        {/* Resumen de Integración HackROM */}
        <div className="valdr-card p-3 flex items-center justify-between text-[11px] font-mono text-[#64748B]">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-[#C5A059]" />
            <span>mGBA WebAssembly .SAV</span>
          </div>
          <span className="text-emerald-400 font-bold">100% Sincronizado</span>
        </div>
      </main>

      {/* 3. Footer Sobrio */}
      <footer className="border-t border-white/5 py-4 px-4 text-center text-[10px] font-mono text-[#64748B] max-w-lg mx-auto w-full flex items-center justify-between">
        <span>© 2026 FORJA JOHTO // VALDR</span>
        <Link href="/admin/login" className="hover:text-[#C5A059] transition-colors">
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
