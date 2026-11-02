'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, ShieldCheck, Sparkles, UserPlus, Gamepad2, Flame, User } from 'lucide-react';
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

      if (profile?.is_admin) {
        router.replace('/hq');
      } else {
        router.replace('/dashboard');
      }
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

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Ingresa tu nombre de entrenador');
      setLoading(false);
      return;
    }

    const email = formatEmailFromUsername(cleanUsername);

    if (tab === 'login') {
      // INICIAR SESIÓN
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        soundFx.playDamage();
        setError(authError.message === 'Invalid login credentials' 
          ? 'Entrenador o contraseña incorrectos.' 
          : authError.message);
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
      // REGISTRO RÁPIDO DE NUEVO ENTRENADOR
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
        // Inicializar perfil en valdr_profiles si no existe
        try {
          await supabase.from('valdr_profiles').upsert({
            id: newUserId,
            leader_name: displayLeaderName,
            guide_totem: 'lobo',
            sovereignty_gold: 250,
            battery_minutes: 120, // 2 Horas garantizadas por defecto
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
      setSuccessMsg('¡Registro completado! Entrando al juego...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1F1E1B] flex flex-col justify-between select-none">
      {/* Top Banner Neo-Arcade */}
      <header className="border-b-2 border-black bg-white px-5 py-3.5 flex items-center justify-between shadow-[0_2px_0_0_#000]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E60012] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000]">
            <Gamepad2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-mono text-xs font-black tracking-wider uppercase text-black block">
              SYNDEX POKÉ-DISCIPLINA
            </span>
            <span className="text-[10px] text-[#706E66] block font-mono">
              mGBA Web · Johto Core
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#166534] text-[10px] font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span>2H BATERÍA DIARIA</span>
        </div>
      </header>

      {/* Main Container Mobile-First */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_#000] space-y-5">
          
          {/* Selector de Pestañas Nintendo Style */}
          <div className="grid grid-cols-2 p-1 bg-[#EAE7DF] border-2 border-black rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTab('login');
                setError(null);
              }}
              className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#E60012]'
                  : 'text-[#5E5C56] hover:text-black'
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
              className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#E60012] text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'text-[#5E5C56] hover:text-black'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Cartelito de estado / Beneficios */}
          <div className="p-3 bg-[#F4F1EA] border-2 border-black rounded-xl flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#F59E0B]/20 text-[#B45309] border border-[#F59E0B]/40 shrink-0">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <p className="text-[11px] font-mono leading-tight text-[#44403C]">
              {tab === 'login' 
                ? 'Conecta tu cartucho para continuar tus pactos y reclamar tus horas.' 
                : 'Nuevo Entrenador: 2 Horas diarias de emulador + 250₽ iniciales de regalo.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1">
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
                  className="w-full bg-[#FAF9F5] border-2 border-black rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-black focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
                />
                <User className="w-4 h-4 text-[#8A877E] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1">
                  Nombre de Líder (Opcional)
                </label>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="ej. Red o Tu Nombre"
                  className="w-full bg-[#FAF9F5] border-2 border-black rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-black focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-black mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF9F5] border-2 border-black rounded-xl px-3 py-2.5 text-xs font-mono font-medium text-black focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
                />
                <Lock className="w-4 h-4 text-[#8A877E] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl border-2 border-[#E60012] bg-[#FEE2E2] text-[#991B1B] text-[11px] font-mono font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl border-2 border-[#22C55E] bg-[#DCFCE7] text-[#166534] text-[11px] font-mono font-semibold flex items-center gap-2">
                <span>⭐</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 ${
                tab === 'login'
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                  : 'bg-[#E60012] hover:bg-[#B91C1C]'
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
          <div className="pt-2 border-t border-[#EAE7DF] flex items-center justify-around text-[10px] font-mono text-[#706E66]">
            <span>🛡️ Cero Multitasking</span>
            <span>⚡ Guardado Cloud</span>
            <span>🔋 120 Minutos</span>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="py-3 text-center text-[10px] font-mono text-[#8A877E]">
        SYNDEX PLATFORM · NINTENDO VISUAL UI ENGINE © 2026
      </footer>
    </div>
  );
}
