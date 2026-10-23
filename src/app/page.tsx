'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudentAuthModal } from '@/components/auth/StudentAuthModal';

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header móvil plano */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">SynDex Habit RPG</h1>
          <p className="text-xs text-slate-500">Gamified Habits & Commitment</p>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
          Dashboard
        </Link>
      </header>

      {/* Contenido Principal Plano */}
      <main className="my-auto py-8 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700">
            Mobile-First Habits
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            Construye hábitos. Cumple contratos. Desbloquea recompensas RPG.
          </h2>
          <p className="text-sm text-slate-600">
            Vincula tus hábitos diarios con contratos de compromiso e inyecciones de Pokémon y objetos en tu partida.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => openAuth('signup')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            Comenzar / Crear Cuenta
          </button>
          <button
            onClick={() => openAuth('login')}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </div>
      </main>

      {/* Footer Plano */}
      <footer className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
        <span>SynDex Habits & Commitment</span>
        <Link href="/admin/login" className="hover:text-slate-600">
          Admin
        </Link>
      </footer>

      {/* Modal de Autenticación */}
      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
