'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Sparkles, UserPlus, Gamepad2, Flame, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper para convertir username limpio en correo seguro de Auth
  const formatEmailFromUsername = (user: string) => {
    const clean = user.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (clean.includes('@')) return clean;
    return `${clean}@syndex.app`;
  };

  const handleRouteRedirect = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('valdr_profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      // Toda la experiencia unificada SynDex vive en /dashboard (Editorial Retro-Premium)
      router.replace('/dashboard');
    } catch {
      router.replace('/dashboard');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        handleRouteRedirect(data.session.user.id);
      }
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    soundFx.playClick();

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Ingresa tu nombre de entrenador');
      setLoading(false);
      return;
    }

    const email = formatEmailFromUsername(cleanUsername);

    if (tab === 'login') {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        soundFx.playDamage();
        const msg = authError.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          setError('Entrenador o contraseña incorrectos.');
        } else if (msg.includes('email not confirmed')) {
          setError('Entrenador pendiente de activación.');
        } else {
          setError(authError.message.replace(/email/gi, 'entrenador'));
        }
        setLoading(false);
        return;
      }

      soundFx.playLevelUp();
      if (data.user) {
        await handleRouteRedirect(data.user.id);
      } else {
        router.replace('/dashboard');
      }
    } else {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        soundFx.playDamage();
        setLoading(false);
        return;
      }

      const displayLeaderName = leaderName.trim() || cleanUsername;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            leader_name: displayLeaderName,
          },
        },
      });

      if (signUpError) {
        soundFx.playDamage();
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const newUserId = data.user?.id;
      if (newUserId) {
        try {
          await supabase.from('valdr_profiles').upsert({
            id: newUserId,
            leader_name: displayLeaderName,
            guide_totem: 'lobo',
            sovereignty_gold: 250,
            battery_minutes: 120, // 2 Horas garantizadas
            streak_fire_days: 1,
            temperance_status: 'invictus',
            temperance_streak_days: 1,
            is_admin: false,
          });
        } catch (e) {
          console.warn('Auto-init profile fallback:', e);
        }
      }

      soundFx.playLevelUp();
      setSuccessMsg('¡Registro completado! Entrando a Johto...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1C1B18] flex flex-col justify-between select-none font-sans">
      {/* Top Header Johto Minimal */}
      <header className="border-b border-[#E4E1D8] bg-white/95 backdrop-blur-md px-4 py-2.5 sm:px-6 shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
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
                  Johto
                </span>
              </div>
              <span className="text-[10px] text-[#706E66] block font-mono mt-0.5">
                Heart & Soul Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/20 text-[#2E8555] text-[10px] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2E8555] animate-pulse" />
            <span>2H BATERÍA</span>
          </div>
        </div>
      </header>

      {/* Main Container: Tarjeta de Acceso de Hardware Analogue Pocket */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm bg-white border border-[#E4E1D8] rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(26,25,21,0.06)] space-y-4">
          
          {/* Emblema & Bienvenida */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFFBF0] border border-[#C59B46]/30 flex items-center justify-center text-[#C59B46] shadow-[0_2px_6px_rgba(197,155,70,0.08)] mb-2">
              <Sparkles className="w-6 h-6 fill-[#C59B46]" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-[#1C1B18] tracking-tight">
              {tab === 'login' ? 'Conecta tu Cartucho' : 'Inicia tu Aventura'}
            </h1>
            <p className="text-xs text-[#706E66] font-mono">
              Convierte tus hábitos reales en batería de juego.
            </p>
          </div>

          {/* Selector de Pestañas Editorial */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF9F5] border border-[#E4E1D8] rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTab('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 ${
                tab === 'login'
                  ? 'bg-[#1C1B18] text-white shadow-[0_1px_3px_rgba(26,25,21,0.15)]'
                  : 'text-[#706E66] hover:text-[#1C1B18] hover:bg-white/60'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTab('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 ${
                tab === 'register'
                  ? 'bg-[#D9383A] text-white shadow-[0_1px_3px_rgba(217,56,58,0.25)]'
                  : 'text-[#706E66] hover:text-[#1C1B18] hover:bg-white/60'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Cartelito RPG Conciso */}
          <div className="p-3 bg-[#FAF9F5] border border-[#E4E1D8] rounded-2xl flex items-center gap-2.5 shadow-[0_1px_3px_rgba(26,25,21,0.02)]">
            <div className="p-1.5 rounded-xl bg-[#C59B46]/10 text-[#9A7025] border border-[#C59B46]/25 shrink-0">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs font-medium leading-snug text-[#1C1B18]">
              {tab === 'login' 
                ? 'Accede para sincronizar tu partida .sav y reclamar tus minutos de hoy.' 
                : 'Nuevo Entrenador: 2 Horas diarias de emulador + 250₽ de bono de bienvenida.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1C1B18] mb-1 font-mono">
                Entrenador / Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. ash_ketchum o martin"
                  className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-[#1C1B18] placeholder:text-[#8A877E] focus:outline-none focus:border-[#1C1B18] focus:bg-white transition-all"
                />
                <User className="w-4 h-4 text-[#706E66] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1C1B18] mb-1 font-mono">
                  Nombre de Líder (Opcional)
                </label>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="ej. Red o Tu Nombre"
                  className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-[#1C1B18] placeholder:text-[#8A877E] focus:outline-none focus:border-[#1C1B18] focus:bg-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1C1B18] mb-1 font-mono">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-[#1C1B18] placeholder:text-[#8A877E] focus:outline-none focus:border-[#1C1B18] focus:bg-white transition-all"
                />
                <Lock className="w-4 h-4 text-[#706E66] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl border border-[#D9383A]/30 bg-[#FEE2E2]/60 text-[#991B1B] text-[11px] font-mono font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl border border-[#2E8555]/30 bg-[#DCFCE7]/60 text-[#166534] text-[11px] font-mono font-medium flex items-center gap-2">
                <span>⭐</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 min-h-[48px] rounded-xl text-xs font-semibold uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 select-none active:translate-y-[1px] active:shadow-none ${
                tab === 'login'
                  ? 'bg-[#D9383A] shadow-[0_2px_0px_#B32628] hover:bg-[#C92F31]'
                  : 'bg-[#2D68C4] shadow-[0_2px_0px_#23529B] hover:bg-[#255BB0]'
              }`}
            >
              {loading ? (
                <span>Sincronizando con Johto...</span>
              ) : tab === 'login' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Entrar al Juego</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta y Empezar</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Micro-píldoras informativas */}
          <div className="pt-3 border-t border-[#E4E1D8] flex items-center justify-around text-[10px] font-mono text-[#706E66]">
            <span>🛡️ Cero Multitask</span>
            <span>⚡ Guardado Cloud</span>
            <span>🔋 120 Minutos</span>
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
