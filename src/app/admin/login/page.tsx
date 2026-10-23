'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  Mail, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Crown,
  Sparkles,
  Zap,
  Trash2,
  KeyRound,
  UserCheck
} from 'lucide-react';

interface SavedAccount {
  email: string;
  label: string;
  role: 'admin' | 'student';
  lastUsed: number;
}

const STORAGE_SAVED_ACCOUNTS_KEY = 'syndex_remembered_accounts';

export default function AdminLoginPage() {
  const router = useRouter();
  const theme = useTrainerStore((s) => s.theme);
  const setProfile = useTrainerStore((s) => s.setProfile);
  const isLight = theme === 'light_gbc';

  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar cuentas recordadas del navegador
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedAccount[];
        setSavedAccounts(parsed);
      }
    } catch (e) {
      console.warn('Error reading remembered accounts:', e);
    }
  }, []);

  const saveRememberedAccount = (accountEmail: string, label: string) => {
    try {
      const existingStr = localStorage.getItem(STORAGE_SAVED_ACCOUNTS_KEY);
      const existing: SavedAccount[] = existingStr ? JSON.parse(existingStr) : [];
      const filtered = existing.filter((a) => a.email.toLowerCase() !== accountEmail.toLowerCase());
      const newEntry: SavedAccount = {
        email: accountEmail,
        label,
        role: 'admin',
        lastUsed: Date.now(),
      };
      const updated: SavedAccount[] = [newEntry, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {
      console.warn('Error saving remembered account:', e);
    }
  };

  const removeRememberedAccount = (accountEmail: string) => {
    try {
      soundFx.playClick();
      const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== accountEmail.toLowerCase());
      localStorage.setItem(STORAGE_SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {}
  };

  const performLogin = async (targetEmail: string, targetPass: string, label?: string) => {
    soundFx.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const email = targetEmail.includes('@')
        ? targetEmail.trim()
        : `${targetEmail.trim().toLowerCase()}@syndex.edu`;

      // 1. Iniciar sesión con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: targetPass,
      });

      if (authError) {
        soundFx.playDamage();
        setErrorMsg('Credenciales inválidas de administrador.');
        setIsSubmitting(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        soundFx.playDamage();
        setErrorMsg('Error de autenticación con el servidor.');
        setIsSubmitting(false);
        return;
      }

      // 2. Verificar rol is_admin en public.profiles
      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profError || !profileData || !profileData.is_admin) {
        soundFx.playDamage();
        setErrorMsg('Acceso Denegado: Esta cuenta no posee permisos de SuperAdministrador.');
        setIsSubmitting(false);
        return;
      }

      // Guardar en cuentas recordadas si la casilla está activa o si es quick login
      if (rememberMe) {
        saveRememberedAccount(email, label || profileData.trainer_name || 'Profesor Oak');
      }

      // Actualizar perfil de administrador en el store
      setProfile(profileData as any);
      soundFx.playLevelUp();
      setSuccessMsg(`¡Bienvenido de vuelta, ${profileData.trainer_name}! Entrando a Consola Maestra...`);

      setTimeout(() => {
        router.push('/admin');
      }, 700);
    } catch (err: any) {
      console.error('[AdminLogin] Error:', err);
      soundFx.playDamage();
      setErrorMsg(err.message || 'Error en la conexión con la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(emailOrUser, password);
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen flex flex-col items-center justify-center p-4 font-mono select-none ${
        isLight ? 'bg-[#F4F1EA] text-slate-900' : 'bg-[#080c14] text-slate-100'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Enlace de Regreso a la Portada */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => soundFx.playClick()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-black border-2 border-black shadow-[2px_2px_0_#000]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLVER AL INICIO</span>
          </Link>

          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            <span>ACCESO OCULTO</span>
          </span>
        </div>

        {/* Tarjeta de Login Admin */}
        <div
          className={`rounded-2xl border-4 overflow-hidden shadow-2xl transition-all ${
            isLight
              ? 'bg-[#FFFFFF] border-black text-slate-900 shadow-[8px_8px_0_#000]'
              : 'bg-[#0f172a] border-amber-500/70 text-slate-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
          }`}
        >
          {/* Header */}
          <div
            className={`p-5 border-b-4 flex items-center gap-3 ${
              isLight
                ? 'bg-[#E60012] border-black text-white'
                : 'bg-[#18233c] border-amber-500/50 text-amber-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-black/30 border border-black/40 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-base uppercase tracking-wider">
                Consola Maestra
              </h1>
              <p className="text-[11px] opacity-80">
                Acceso Exclusivo de Profesores & SuperAdmin
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border-2 border-rose-500/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/80 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Sección de Acceso Rápido con Cuentas Recordadas */}
            {savedAccounts.length > 0 && (
              <div className="p-3 rounded-xl bg-black/10 border-2 border-black/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-500 uppercase">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-500" /> Cuentas Recordadas en este Navegador:
                  </span>
                  <span className="text-[10px] text-slate-400">Clic para rellenar</span>
                </div>
                <div className="space-y-1.5">
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-black/10 hover:border-amber-400/50 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setEmailOrUser(acc.email);
                          if (acc.email === 'admin@syndex.edu') {
                            setPassword('1234567');
                          }
                        }}
                        className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-black block truncate">{acc.label}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{acc.email}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRememberedAccount(acc.email)}
                        className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                        title="Olvidar esta cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón Acceso Rápido SuperAdmin Oficial */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <div className="text-[11px]">
                  <span className="font-bold text-amber-300 block">Profesor Oak (SuperAdmin)</span>
                  <span className="text-[10px] text-slate-400">admin@syndex.edu</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => performLogin('admin@syndex.edu', '1234567', 'Profesor Oak (SuperAdmin)')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg border border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Entrar Rápido</span>
              </button>
            </div>

            {/* Email o Usuario Admin */}
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1.5 uppercase">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email o Alias de Profesor:</span>
              </label>
              <input
                type="text"
                required
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder="profesor@syndex.edu o martinenrique.pe@gmail.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-black text-black shadow-[2px_2px_0_#000] focus:border-[#E60012]'
                    : 'bg-slate-900/90 border-slate-700 text-slate-100 focus:border-amber-400'
                }`}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label className="text-xs font-bold flex items-center gap-1.5 uppercase">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Llave Criptográfica / Contraseña:</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-black text-black shadow-[2px_2px_0_#000] focus:border-[#E60012]'
                    : 'bg-slate-900/90 border-slate-700 text-slate-100 focus:border-amber-400'
                }`}
              />
            </div>

            {/* Casilla Recordar en este Navegador */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="text-slate-300">Recordar esta cuenta en este navegador para inicio rápido</span>
            </label>

            {/* Botón de Acceso Admin */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 mt-2 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-400 hover:bg-amber-500 text-black border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-black shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95'
              } ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isSubmitting ? (
                <span>VALIDANDO CREDENCIALES...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTORIZAR ACCESO MAESTRO</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
