'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { 
  SUPPORTED_COUNTRIES, 
  CountryInfo, 
  validateWhatsAppNumber 
} from '@/lib/phoneValidation';
import { 
  X, 
  User, 
  Lock, 
  Phone, 
  Sparkles, 
  LogIn, 
  ShieldAlert, 
  CheckCircle2, 
  Gamepad2, 
  Radio,
  Zap,
  Trash2,
  UserCheck,
  Crown
} from 'lucide-react';

interface SavedStudentAccount {
  username: string;
  email: string;
  label: string;
  isAdmin?: boolean;
  lastUsed: number;
}

export interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const STORAGE_SAVED_STUDENTS_KEY = 'syndex_remembered_accounts';

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
}) => {
  const router = useRouter();
  const theme = useTrainerStore((s) => s.theme);
  const setProfile = useTrainerStore((s) => s.setProfile);
  const isLight = theme === 'light_gbc';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedStudentAccount[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(SUPPORTED_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar cuentas recordadas del navegador
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_STUDENTS_KEY);
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading remembered accounts:', e);
    }
  }, [isOpen]);

  const saveRememberedAccount = (cleanUsername: string, email: string, label: string, isAdmin = false) => {
    try {
      const existingStr = localStorage.getItem(STORAGE_SAVED_STUDENTS_KEY);
      const existing: SavedStudentAccount[] = existingStr ? JSON.parse(existingStr) : [];
      const filtered = existing.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
      const updated: SavedStudentAccount[] = [
        {
          username: cleanUsername,
          email,
          label,
          isAdmin,
          lastUsed: Date.now(),
        },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem(STORAGE_SAVED_STUDENTS_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {
      console.warn('Error saving remembered account:', e);
    }
  };

  const removeRememberedAccount = (email: string) => {
    try {
      soundFx.playClick();
      const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem(STORAGE_SAVED_STUDENTS_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {}
  };

  if (!isOpen) return null;

  // Validación reactiva de WhatsApp en modo registro
  const phoneValidation = validateWhatsAppNumber(phoneNumber, selectedCountry);

  const handleTabChange = (nextMode: 'login' | 'signup') => {
    soundFx.playClick();
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      soundFx.playDamage();
      setErrorMsg('El usuario debe tener al menos 3 caracteres (solo letras y números).');
      return;
    }

    if (!password || password.length < 6) {
      soundFx.playDamage();
      setErrorMsg('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    const syntheticEmail = `${cleanUsername}@syndex.edu`;

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!phoneValidation.isValid) {
          soundFx.playDamage();
          setErrorMsg(phoneValidation.errorMessage || 'El número de WhatsApp es inválido.');
          setIsSubmitting(false);
          return;
        }

        // 1. Registro con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: password,
          options: {
            data: {
              trainer_name: username.trim(),
              parent_whatsapp: phoneValidation.e164,
            },
          },
        });

        if (authError) {
          // Si el usuario ya existe, sugerir inicio de sesión
          if (authError.message.includes('already registered')) {
            setErrorMsg('Este alias ya está en uso. ¡Prueba iniciando sesión!');
          } else {
            setErrorMsg(`Error de registro: ${authError.message}`);
          }
          soundFx.playDamage();
          setIsSubmitting(false);
          return;
        }

        const userId = authData.user?.id;
        if (userId) {
          // 2. Crear o verificar perfil inicial en public.profiles y public.valdr_profiles
          await supabase.from('profiles').upsert({
            id: userId,
            trainer_name: username.trim(),
            starter_pokemon: 'cyndaquil',
            nature_role: 'fuego_ui',
            parent_whatsapp: phoneValidation.e164,
            pokedollars: 150,
            battery_minutes: 0,
            streak_days: 1,
            egg_steps: 0,
            current_level: 1,
            xp: 0,
            is_admin: false,
          });

          await supabase.from('valdr_profiles').upsert({
            id: userId,
            leader_name: username.trim(),
            guide_totem: 'oso',
            sovereignty_gold: 150,
            battery_minutes: 0,
            streak_fire_days: 1,
            temperance_status: 'invictus',
            temperance_streak_days: 1,
            business_regime: 'cazador_informal',
            credit_score: 'B',
            is_admin: false,
          });
        }

        soundFx.playLevelUp();
        setSuccessMsg('¡Cuenta de Aspirante creada con éxito! Cargando academia...');
        setTimeout(() => {
          onClose();
          router.push('/dashboard');
        }, 1200);

      } else {
        // Modo Login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: password,
        });

        if (loginError) {
          soundFx.playDamage();
          setErrorMsg('Usuario o contraseña incorrectos.');
          setIsSubmitting(false);
          return;
        }

        // Cargar perfil del alumno
        if (loginData.user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', loginData.user.id)
            .single();

          if (profData) {
            setProfile(profData as any);
            if (rememberMe) {
              saveRememberedAccount(
                cleanUsername,
                syntheticEmail,
                profData.trainer_name || cleanUsername,
                !!profData.is_admin
              );
            }
          }
        }

        soundFx.playCoin();
        setSuccessMsg('¡Bienvenido de vuelta, entrenador!');
        setTimeout(() => {
          onClose();
          router.push('/dashboard');
        }, 900);
      }
    } catch (err: any) {
      console.error('[StudentAuthModal] Error:', err);
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
      soundFx.playDamage();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border-4 overflow-hidden shadow-2xl transition-all ${
          isLight
            ? 'bg-[#F4F1EA] border-black text-slate-900 shadow-[8px_8px_0_#000]'
            : 'bg-[#0f172a] border-emerald-500/70 text-slate-100 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
        }`}
      >
        {/* Cabecera Tipo Game Boy */}
        <div
          className={`px-5 py-3.5 border-b-4 flex items-center justify-between ${
            isLight
              ? 'bg-[#E60012] border-black text-white'
              : 'bg-[#18233c] border-emerald-500/50 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 animate-pulse" />
            <span className="font-mono font-black text-sm uppercase tracking-wider">
              {mode === 'signup' ? 'Registro de Aspirante' : 'Terminal de Alumno'}
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className={`p-1 rounded-lg border-2 border-black transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Selección */}
        <div className="flex border-b-2 border-black/40 font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'signup'
                ? isLight
                  ? 'bg-amber-300 text-black border-b-4 border-black'
                  : 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                : isLight
                  ? 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'login'
                ? isLight
                  ? 'bg-amber-300 text-black border-b-4 border-black'
                  : 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                : isLight
                  ? 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 font-mono">
          {/* Mensaje de Error / Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border-2 border-rose-500/80 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Cuentas Recordadas en este Navegador (Modo Login) */}
          {mode === 'login' && savedAccounts.length > 0 && (
            <div className="p-3 rounded-xl bg-black/15 border-2 border-black/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" /> Cuentas Recordadas:
                </span>
                <span className="text-[10px] text-slate-400">Clic para rellenar</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/25 border border-black/10 hover:border-amber-400/50 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setUsername(acc.username || acc.email.split('@')[0]);
                        if (acc.email === 'admin@syndex.edu') {
                          setPassword('1234567');
                        }
                      }}
                      className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                    >
                      {acc.isAdmin ? (
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate">
                          {acc.label} {acc.isAdmin && <span className="text-[9px] text-amber-400 font-bold">(ADMIN)</span>}
                        </span>
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

          {/* Campo Usuario / Alias Gaming */}
          <div className="space-y-1">
            <label className="text-xs font-bold flex items-center gap-1.5 uppercase">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Usuario / Alias de Entrenador:</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: AshKetchum, RedGamer99 o admin"
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none transition-all ${
                isLight
                  ? 'bg-white border-black text-black shadow-[2px_2px_0_#000] focus:border-[#E60012]'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100 focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)]'
              }`}
            />
            <p className="text-[10px] text-slate-400">
              {mode === 'signup' ? 'Tu alias visible en rankings y salas de combate.' : 'Tu nombre de usuario registrado.'}
            </p>
          </div>

          {/* Campo WhatsApp con selector de país (Solo en Signup) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold flex items-center gap-1.5 uppercase">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Celular WhatsApp (Alumno o Apoderado):</span>
              </label>

              <div className="flex gap-2">
                {/* Selector de País */}
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = SUPPORTED_COUNTRIES.find((c) => c.code === e.target.value);
                    if (found) {
                      soundFx.playClick();
                      setSelectedCountry(found);
                    }
                  }}
                  className={`px-2 py-2.5 rounded-xl border-2 text-xs font-bold outline-none cursor-pointer shrink-0 ${
                    isLight
                      ? 'bg-white border-black text-black shadow-[2px_2px_0_#000]'
                      : 'bg-slate-900/90 border-slate-700 text-slate-100'
                  }`}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
                      {c.flag} {c.dialCode} ({c.name})
                    </option>
                  ))}
                </select>

                {/* Input de Número */}
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={selectedCountry.samplePlaceholder}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none transition-all ${
                    isLight
                      ? 'bg-white border-black text-black shadow-[2px_2px_0_#000] focus:border-[#E60012]'
                      : 'bg-slate-900/90 border-slate-700 text-slate-100 focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  }`}
                />
              </div>

              {/* Banner de Validación de WhatsApp */}
              {phoneNumber.length > 3 && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] font-bold transition-all ${
                    phoneValidation.isValid
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 shrink-0 ${phoneValidation.isValid ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  <span>
                    {phoneValidation.isValid
                      ? `✅ WhatsApp válido (${phoneValidation.e164}) para carnet de aspirante.`
                      : phoneValidation.errorMessage}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-emerald-400/90 font-medium leading-tight">
                ⚠️ Requisito: Debe ser un número con WhatsApp activo para recibir reportes de progreso y carnet digital.
              </p>
            </div>
          )}

          {/* Campo Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold flex items-center gap-1.5 uppercase">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contraseña:</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none transition-all ${
                isLight
                  ? 'bg-white border-black text-black shadow-[2px_2px_0_#000] focus:border-[#E60012]'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100 focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)]'
              }`}
            />
          </div>

          {/* Casilla Recordar en este Navegador */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none pt-0.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-emerald-500 accent-emerald-500 cursor-pointer"
            />
            <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
              Recordar esta cuenta para iniciar sesión rápido
            </span>
          </label>

          {/* Botón de Envío Táctil Nintendo */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
              isLight
                ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-black shadow-[0_0_20px_rgba(34,197,94,0.5)] active:scale-95'
            } ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isSubmitting ? (
              <span>SINCRONIZANDO CON JOHTO...</span>
            ) : mode === 'signup' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>INICIAR MI AVENTURA (CREAR CUENTA)</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>ENTRAR A LA ACADEMIA</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
