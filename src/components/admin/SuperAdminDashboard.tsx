'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Shield,
  Zap,
  Users,
  Sliders,
  BatteryCharging,
  Coins,
  Sparkles,
  Award,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Package,
  Save,
  RotateCcw,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import {
  getAdminGameRules,
  updateAdminGameRules,
  getAdminStudents,
  executeStudentOverride
} from '@/lib/adminService';
import { AdminGameRules, StudentAdminRow, LevelRequirement } from '@/types/trainer';

export const SuperAdminDashboard: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [activeTab, setActiveTab] = useState<'students' | 'gyms' | 'economy'>('students');
  const [rules, setRules] = useState<AdminGameRules | null>(null);
  const [students, setStudents] = useState<StudentAdminRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Cargar reglas y estudiantes iniciales
  const loadData = async () => {
    setIsLoading(true);
    const [fetchedRules, fetchedStudents] = await Promise.all([
      getAdminGameRules(),
      getAdminStudents(),
    ]);
    if (fetchedRules) setRules(fetchedRules);
    setStudents(fetchedStudents);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Cambiar modo de operación (Automático / Manual / Híbrido)
  const handleModeChange = async (newMode: 'automatic' | 'manual' | 'hybrid') => {
    if (!rules) return;
    soundFx.playClick();
    const updated = { ...rules, mode: newMode };
    setRules(updated);
    const res = await updateAdminGameRules(newMode, rules.levels_requirements, rules.economy_settings);
    if (res) {
      soundFx.playCoin();
      showFeedback(`⚡ Modo cambiado a: ${newMode.toUpperCase()}`);
    }
  };

  // Guardar configuración de gimnasios / niveles
  const handleSaveGyms = async () => {
    if (!rules) return;
    setIsSaving(true);
    soundFx.playClick();
    const res = await updateAdminGameRules(rules.mode, rules.levels_requirements, rules.economy_settings);
    setIsSaving(false);
    if (res) {
      soundFx.playLevelUp();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      showFeedback('💾 ¡Reglas de Gimnasios Guardadas Exitosamente!');
    }
  };

  // Toggle de desbloqueo manual de un gimnasio
  const toggleGymUnlock = (gymKey: string) => {
    if (!rules) return;
    soundFx.playClick();
    const current = rules.levels_requirements[gymKey];
    const updatedGyms = {
      ...rules.levels_requirements,
      [gymKey]: {
        ...current,
        is_unlocked: !current.is_unlocked,
        manual_unlocked: !current.manual_unlocked,
      },
    };
    setRules({ ...rules, levels_requirements: updatedGyms });
  };

  // Modificar XP mínima de un gimnasio
  const handleGymXpChange = (gymKey: string, minXp: number) => {
    if (!rules) return;
    const current = rules.levels_requirements[gymKey];
    setRules({
      ...rules,
      levels_requirements: {
        ...rules.levels_requirements,
        [gymKey]: { ...current, min_xp: minXp },
      },
    });
  };

  // Acción rápida sobre un estudiante
  const handleStudentAction = async (
    student: StudentAdminRow,
    action: 'grant_battery' | 'set_battery' | 'set_level' | 'grant_pokedollars' | 'grant_xp' | 'inject_item',
    payload: Record<string, any>,
    label: string
  ) => {
    soundFx.playClick();
    const res = await executeStudentOverride(student.id, action, payload);
    if (res.success) {
      soundFx.playCoin();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showFeedback(`✨ ${label} aplicado a ${student.trainer_name}`);
      // Actualizar estado local
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, ...res.data } : s))
      );
    } else {
      soundFx.playWarning();
      showFeedback(`⚠️ Error: ${res.error || 'No se pudo aplicar'}`);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.starter_pokemon?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-full h-full flex flex-col font-mono select-none overflow-hidden transition-colors ${
        isLight ? 'bg-[#F4F1EA] text-slate-900' : 'bg-[#0d121f] text-slate-100'
      }`}
    >
      {/* 1. Header Superior del SuperAdmin */}
      <div
        className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b-4 shrink-0 transition-all ${
          isLight
            ? 'bg-[#FFFFFF] border-black shadow-[0_3px_0_#000]'
            : 'bg-[#121829] border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black border-2 ${
              isLight
                ? 'bg-amber-400 text-black border-black shadow-[2px_2px_0_#000]'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
            }`}
          >
            <Crown className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider uppercase">
                Torre de Control SuperAdmin
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                LIVE DB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gestor de Requisitos Johto, Economía y Control de Alumnos
            </p>
          </div>
        </div>

        {/* Selector de Modo de Control (Automático / Manual / Híbrido) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-black/20">
          {(['automatic', 'hybrid', 'manual'] as const).map((m) => {
            const isSelected = rules?.mode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-[#E60012] text-white border-2 border-black shadow-[2px_2px_0_#000]'
                      : 'bg-emerald-500 text-black border border-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'automatic' && '🤖 AUTO'}
                {m === 'hybrid' && '⚡ HÍBRIDO'}
                {m === 'manual' && '🕹️ MANUAL'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Barra de Pestañas del Panel */}
      <div
        className={`px-4 pt-2 flex items-center justify-between border-b shrink-0 ${
          isLight ? 'bg-[#EAE6DD] border-black' : 'bg-[#0f172a] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('students');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
              activeTab === 'students'
                ? isLight
                  ? 'bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_#000]'
                  : 'bg-[#182238] text-cyan-300 border-cyan-500/50 border-b-0'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alumnos en Vivo ({students.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('gyms');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
              activeTab === 'gyms'
                ? isLight
                  ? 'bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_#000]'
                  : 'bg-[#182238] text-amber-300 border-amber-500/50 border-b-0'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Gimnasios & Niveles</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('economy');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer border-t-2 border-x-2 ${
              activeTab === 'economy'
                ? isLight
                  ? 'bg-white text-black border-black border-b-0 shadow-[2px_-2px_0_#000]'
                  : 'bg-[#182238] text-emerald-300 border-emerald-500/50 border-b-0'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Economía & Batería</span>
          </button>
        </div>

        <button
          onClick={loadData}
          title="Refrescar lista y reglas"
          className="p-1.5 mb-1 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notificación Flotante */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-400 text-black font-black text-xs border-2 border-black shadow-[3px_3px_0_#000] flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-4 h-4" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Contenido Principal Dinámico */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* PESTAÑA 1: GESTOR DE ALUMNOS (1-CLICK OVERRIDES) */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            {/* Buscador */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre o starter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl font-mono border transition-all outline-none ${
                    isLight
                      ? 'bg-white border-black text-black shadow-[2px_2px_0_#000]'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                  }`}
                />
              </div>
              <span className="text-xs text-slate-400">
                {filteredStudents.length} de {students.length}
              </span>
            </div>

            {/* Roster de Tarjetas de Alumnos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-white border-black shadow-[3px_3px_0_#000]'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/50 shadow-lg'
                  }`}
                >
                  {/* Encabezado del Alumno */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          st.starter_pokemon === 'cyndaquil'
                            ? 'bg-rose-500 text-white'
                            : st.starter_pokemon === 'totodile'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {st.starter_pokemon === 'cyndaquil' && '🔥'}
                        {st.starter_pokemon === 'totodile' && '🌊'}
                        {st.starter_pokemon === 'chikorita' && '🌿'}
                        {!st.starter_pokemon && '⚡'}
                      </div>
                      <div>
                        <span className="font-bold text-xs">{st.trainer_name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>Nivel {st.current_level}</span>
                          <span>•</span>
                          <span>{st.xp} XP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border ${
                          st.battery_minutes > 15
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                            : 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                        }`}
                      >
                        <BatteryCharging className="w-3 h-3" />
                        <span>{st.battery_minutes}m</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-950/80 border border-amber-500 text-amber-300">
                        <Coins className="w-3 h-3" />
                        <span>₽{st.pokedollars}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas de 1 Clic */}
                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                    {/* Batería */}
                    <button
                      onClick={() =>
                        handleStudentAction(st, 'grant_battery', { amount: 30 }, '+30 min Batería')
                      }
                      title="Otorgar +30 minutos de juego en GBA"
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/50'
                      }`}
                    >
                      🔋 +30m
                    </button>

                    {/* Nivel / Gimnasio */}
                    <button
                      onClick={() =>
                        handleStudentAction(
                          st,
                          'set_level',
                          { amount: Math.min(12, st.current_level + 1) },
                          `Nivel ${st.current_level + 1}`
                        )
                      }
                      title="Desbloquear siguiente nivel de Johto"
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-cyan-200 hover:bg-cyan-300 text-cyan-950 border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                          : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-600/50'
                      }`}
                    >
                      🏅 +1 Nivel
                    </button>

                    {/* Pokédólares */}
                    <button
                      onClick={() =>
                        handleStudentAction(st, 'grant_pokedollars', { amount: 100 }, '+₽100')
                      }
                      title="Bonificar 100 Pokédólares"
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-amber-200 hover:bg-amber-300 text-amber-950 border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                          : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/50'
                      }`}
                    >
                      💰 +₽100
                    </button>

                    {/* Inyectar Caramelo Raro */}
                    <button
                      onClick={() =>
                        handleStudentAction(
                          st,
                          'inject_item',
                          { item_key: 'GBA_RARE_CANDY', gba_item_id: 68, gba_pocket: 'ITEMS', quantity: 3 },
                          'Caramelos Raros x3'
                        )
                      }
                      title="Inyectar 3 Caramelos Raros en su mochila GBA"
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-purple-200 hover:bg-purple-300 text-purple-950 border-black shadow-[1px_1px_0_#000]'
                          : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border-purple-600/50'
                      }`}
                    >
                      🍬 Raro x3
                    </button>

                    {/* Inyectar Master Ball */}
                    <button
                      onClick={() =>
                        handleStudentAction(
                          st,
                          'inject_item',
                          { item_key: 'GBA_MASTER_BALL', gba_item_id: 1, gba_pocket: 'POKEBALLS', quantity: 1 },
                          'Master Ball'
                        )
                      }
                      title="Inyectar Master Ball en su bolsillo de Poké Balls"
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-indigo-200 hover:bg-indigo-300 text-indigo-950 border-black shadow-[1px_1px_0_#000]'
                          : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-600/50'
                      }`}
                    >
                      👑 Master Ball
                    </button>

                    {/* Reset de Emergencia */}
                    <button
                      onClick={() =>
                        handleStudentAction(st, 'set_battery', { amount: 0 }, 'Batería Agotada')
                      }
                      title="Bloquear batería (pausa forzada en clase)"
                      className="px-2 py-1 rounded text-[10px] font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/50 transition-all cursor-pointer ml-auto"
                    >
                      ⛔ Pausar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: REQUISITOS DE GIMNASIOS JOHTO */}
        {activeTab === 'gyms' && rules && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wide">
                  Configuración de Gimnasios & Candados Pedagógicos
                </h3>
                <p className="text-xs text-slate-400">
                  Establece el umbral de XP y desbloquea manualmente cualquier nivel para toda la clase.
                </p>
              </div>

              <button
                onClick={handleSaveGyms}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR REGLAS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Object.entries(rules.levels_requirements).map(([key, gym]) => {
                const isUnlocked = gym.is_unlocked;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? isLight
                          ? 'bg-white border-black shadow-[3px_3px_0_#000]'
                          : 'bg-slate-900/90 border-cyan-500/50 shadow-md'
                        : isLight
                        ? 'bg-slate-100 border-slate-300 opacity-80'
                        : 'bg-slate-900/40 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-400 text-black font-black text-xs flex items-center justify-center">
                          {gym.level}
                        </span>
                        <div>
                          <span className="font-bold text-xs">{gym.title}</span>
                          <p className="text-[10px] text-amber-400 font-bold">{gym.badge}</p>
                        </div>
                      </div>

                      {/* Botón de Desbloqueo Manual */}
                      <button
                        onClick={() => toggleGymUnlock(key)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{isUnlocked ? 'ABIERTO' : 'CERRADO'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3">
                      Líder: <span className="text-slate-200 font-bold">{gym.leader}</span>
                    </p>

                    {/* Slider de XP Mínima */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">XP Requerido:</span>
                        <span className="font-black text-cyan-400">{gym.min_xp} XP</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={3500}
                        step={50}
                        value={gym.min_xp}
                        onChange={(e) => handleGymXpChange(key, parseInt(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* Recompensa */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recompensa:</span>
                      <span className="font-bold text-emerald-400">{gym.reward_item}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: ECONOMÍA & BATERÍA */}
        {activeTab === 'economy' && rules && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wide">
                  Parámetros Económicos & Batería "Code-to-Play"
                </h3>
                <p className="text-xs text-slate-400">
                  Controla la velocidad con la que los alumnos ganan tiempo de emulador y Pokédólares.
                </p>
              </div>

              <button
                onClick={handleSaveGyms}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-2 border-black shadow-[3px_3px_0_#000]'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR PARÁMETROS'}</span>
              </button>
            </div>

            <div
              className={`p-4 rounded-2xl border space-y-4 ${
                isLight ? 'bg-white border-black shadow-[3px_3px_0_#000]' : 'bg-slate-900/90 border-slate-700'
              }`}
            >
              {/* Minutos por reto superado */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">Minutos de Batería por Misión:</span>
                  <span className="font-black text-emerald-400">
                    +{rules.economy_settings.battery_minutes_per_mission} min
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={rules.economy_settings.battery_minutes_per_mission}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      economy_settings: {
                        ...rules.economy_settings,
                        battery_minutes_per_mission: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Multiplicador de Pokédólares */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">Multiplicador de Pokédólares:</span>
                  <span className="font-black text-amber-400">
                    {rules.economy_settings.pokedollars_reward_multiplier}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.5}
                  value={rules.economy_settings.pokedollars_reward_multiplier}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      economy_settings: {
                        ...rules.economy_settings,
                        pokedollars_reward_multiplier: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Multiplicador Shiny de Fin de Semana */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">Shiny Boost de Fin de Semana:</span>
                  <span className="font-black text-cyan-400">
                    {rules.economy_settings.shiny_rate_weekend_multiplier}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={5.0}
                  step={0.5}
                  value={rules.economy_settings.shiny_rate_weekend_multiplier}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      economy_settings: {
                        ...rules.economy_settings,
                        shiny_rate_weekend_multiplier: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
