'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';
import { ArcadeRoomTheater } from '@/components/arcade/ArcadeRoomTheater';
import { PartyPcManager } from '@/components/dashboard/PartyPcManager';
import { PokedexBagViewer } from '@/components/dashboard/PokedexBagViewer';
import { 
  Flame, 
  Coins, 
  BatteryCharging, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Gamepad2,
  ChevronRight,
  Zap,
  Plus,
  Scroll,
  X,
  AlertTriangle,
  Award
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

type ValdrTab = 'vigor' | 'templanza' | 'oaths' | 'vault' | 'game';

interface HabitItem {
  id: string;
  front_type: 'vigor' | 'templanza' | 'expansion';
  title: string;
  subtitle: string;
  duration_minutes: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  is_custom?: boolean;
  completed?: boolean;
}

interface OathItem {
  id: string;
  title: string;
  duration_days: number;
  front_vow: string;
  start_date: string;
  end_date: string;
  status: string;
  runic_signature: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ValdrTab>('vigor');
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [oaths, setOaths] = useState<OathItem[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Modales
  const [proofModalHabit, setProofModalHabit] = useState<HabitItem | null>(null);
  const [proofText, setProofText] = useState('');
  const [createHabitModalOpen, setCreateHabitModalOpen] = useState(false);
  const [createOathModalOpen, setCreateOathModalOpen] = useState(false);
  
  // Estado para nuevo hábito
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newFrontType, setNewFrontType] = useState<'vigor' | 'expansion'>('vigor');
  const [newGoldReward, setNewGoldReward] = useState(50);
  const [newBatteryReward, setNewBatteryReward] = useState(30);
  const [newRequiresProof, setNewRequiresProof] = useState(false);

  // Estado para nuevo juramento
  const [oathTitle, setOathTitle] = useState('');
  const [oathDays, setOathDays] = useState<number>(7);
  const [oathVow, setOathVow] = useState('');
  const [oathSig, setOathSig] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);

  // Contador de Asedio (Medianoche)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilMidnight(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar Perfil, Hábitos y Juramentos
  const loadValdrData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Perfil
    const { data: prof } = await supabase
      .from('valdr_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) setProfileData(prof);

    // 2. Hábitos
    const { data: catalog } = await supabase
      .from('valdr_habits_catalog')
      .select('*')
      .order('sort_order', { ascending: true });

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('valdr_daily_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('log_date', todayStr);

    const completedIds = new Set((logs || []).map((l: any) => l.habit_id));

    if (catalog) {
      setHabits(catalog.map((h: any) => ({
        ...h,
        completed: completedIds.has(h.id)
      })));
    }

    // 3. Juramentos
    const { data: oathsData } = await supabase
      .from('valdr_oaths')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (oathsData) setOaths(oathsData);
  };

  useEffect(() => {
    loadValdrData();
  }, []);

  // Sellar Hábito
  const handleHabitClick = (habit: HabitItem) => {
    if (habit.completed) return;
    if (habit.requires_proof) {
      setProofModalHabit(habit);
      setProofText('');
    } else {
      executeHabitSubmit(habit.id, null);
    }
  };

  const executeHabitSubmit = async (habitId: string, proof: string | null) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('rpc_valdr_submit_habit_check', {
        p_habit_id: habitId,
        p_proof: proof
      });

      if (error) {
        alert(error.message);
      } else {
        soundFx.playCoin();
        setProofModalHabit(null);
        await loadValdrData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al sellar hábito');
    } finally {
      setSubmitting(false);
    }
  };

  // Crear Nuevo Hábito
  const handleCreateCustomHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('rpc_valdr_create_custom_habit', {
        p_title: newTitle.trim(),
        p_subtitle: newSubtitle.trim(),
        p_front_type: newFrontType,
        p_gold_reward: Number(newGoldReward),
        p_battery_reward: Number(newBatteryReward),
        p_requires_proof: newRequiresProof
      });

      if (error) {
        alert(error.message);
      } else {
        soundFx.playLevelUp();
        setCreateHabitModalOpen(false);
        setNewTitle('');
        setNewSubtitle('');
        await loadValdrData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al forjar nuevo hábito');
    } finally {
      setSubmitting(false);
    }
  };

  // Mantener presionado para sellar Juramento (3 segundos)
  const startOathHold = () => {
    if (!oathTitle.trim() || !oathSig.trim()) {
      alert('Debes ingresar el título y tu firma rúnica antes de jurar.');
      return;
    }

    clearInterval(holdIntervalRef.current);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        executeSealOath();
      }
    }, 150);
  };

  const cancelOathHold = () => {
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const executeSealOath = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('rpc_valdr_seal_oath', {
        p_title: oathTitle.trim(),
        p_duration_days: oathDays,
        p_front_vow: oathVow.trim() || 'Pacto de autodominio y disciplina inquebrantable',
        p_runic_signature: oathSig.trim()
      });

      if (error) {
        alert(error.message);
      } else {
        soundFx.playLevelUp();
        setCreateOathModalOpen(false);
        setOathTitle('');
        setOathVow('');
        setOathSig('');
        setHoldProgress(0);
        await loadValdrData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al grabar juramento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E2E8F0] flex flex-col font-sans select-none pb-20">
      {/* 1. Header Táctico de Forja Johto */}
      <header className="sticky top-0 z-40 bg-[#14171C]/95 backdrop-blur-md border-b border-[#C5A059]/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-[#E2E8F0] uppercase block">
              FORJA JOHTO
            </span>
            <span className="text-[10px] text-[#C5A059] block -mt-0.5">
              {profileData?.leader_name || 'Guerrero'} // {profileData?.guide_totem?.toUpperCase() || 'OSO'}
            </span>
          </div>
        </div>

        {/* Telemetría: Oro, Batería GBA y Racha de Fuego */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[#C5A059]">
            <Coins className="w-3.5 h-3.5" />
            <span className="font-bold">{profileData?.sovereignty_gold ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span className="font-bold">{profileData?.battery_minutes ?? 0}m</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{profileData?.streak_fire_days ?? 0}d</span>
          </div>
        </div>
      </header>

      {/* 2. Barra de Asedio & Cuenta Regresiva a Medianoche */}
      <div className="bg-[#0B0C0E] border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>ASIEDO:</span>
          <span className="text-amber-400 font-bold">{timeUntilMidnight}</span>
        </div>
        <div className="text-[10px] text-[#64748B]">
          ESTATUS: <span className="text-emerald-400 font-bold">INVICTUS</span>
        </div>
      </div>

      {/* 3. Navegación Táctil Móvil */}
      <nav className="bg-[#14171C] border-b border-white/5 px-2 flex items-center gap-1 overflow-x-auto text-xs font-semibold py-1">
        <button
          onClick={() => setActiveTab('vigor')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'vigor'
              ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Frente Vigor
        </button>
        <button
          onClick={() => setActiveTab('templanza')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'templanza'
              ? 'bg-[#4E9F9F]/15 text-[#4E9F9F] border border-[#4E9F9F]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Templanza (30d)
        </button>
        <button
          onClick={() => setActiveTab('oaths')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'oaths'
              ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Juramentos
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'vault'
              ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Bóveda .SAV
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'game'
              ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Cartucho GBA
        </button>
      </nav>

      {/* 4. Contenedor Principal (Mobile-First / max-w-lg) */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* PESTAÑA 1: FRENTE DE VIGOR */}
        {activeTab === 'vigor' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-l-2 border-[#C5A059] pl-3 py-1">
              <div>
                <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                  Frente del Vigor
                </h2>
                <p className="text-xs text-[#64748B]">
                  Gana Oro y Batería de Cartucho en la vida real.
                </p>
              </div>

              <button
                onClick={() => setCreateHabitModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/40 text-xs font-bold cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {habits
                .filter((h) => h.front_type === 'vigor' || h.front_type === 'expansion')
                .map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleHabitClick(h)}
                    className={`valdr-card p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      h.completed
                        ? 'opacity-60 bg-[#10141a] border-emerald-500/30'
                        : 'hover:border-[#C5A059]/60'
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#E2E8F0]">{h.title}</span>
                        {h.is_custom && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded text-[#C5A059] font-mono">
                            Personal
                          </span>
                        )}
                        {h.requires_proof && !h.completed && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-white/5 border border-white/10 rounded text-[#C5A059]">
                            Comprobante
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] leading-tight">{h.subtitle}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#C5A059]">
                        <span>+{h.gold_reward} Oro</span>
                        {h.game_battery_reward > 0 && (
                          <span className="text-cyan-400">+{h.game_battery_reward}m GBA</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {h.completed ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[#64748B] hover:text-[#C5A059] hover:border-[#C5A059]">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TEMPLANZA (30 DÍAS) */}
        {activeTab === 'templanza' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#4E9F9F] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#4E9F9F] uppercase tracking-wider">
                Santuario Mayor de Templanza
              </h2>
              <p className="text-xs text-[#64748B]">
                Voto Inviolable: 30 Días de Retención Seminal y Cero Vicios.
              </p>
            </div>

            <div className="valdr-card valdr-glacial-glow p-5 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#4E9F9F]/10 border border-[#4E9F9F]/40 flex items-center justify-center text-[#4E9F9F]">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="text-3xl font-black text-[#E2E8F0] font-mono block">
                  {profileData?.temperance_streak_days ?? 0} / 30
                </span>
                <span className="text-xs text-[#4E9F9F] font-bold uppercase tracking-widest">
                  Días Invicto en Retención
                </span>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
                Recompensa al Día 30: Huevo Místico eclosionado con Pokémon Shiny de 6 IVs perfectos inyectado al cartucho.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: JURAMENTOS SAGRADOS */}
        {activeTab === 'oaths' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-l-2 border-[#C5A059] pl-3 py-1">
              <div>
                <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                  Juramentos Sagrados
                </h2>
                <p className="text-xs text-[#64748B]">
                  Pactos inviolables sellados con firma rúnica.
                </p>
              </div>

              <button
                onClick={() => setCreateOathModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/40 text-xs font-bold cursor-pointer transition-all"
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Jurar</span>
              </button>
            </div>

            {oaths.length === 0 ? (
              <div className="valdr-card p-6 text-center space-y-2 text-[#64748B]">
                <Scroll className="w-8 h-8 mx-auto opacity-40 text-[#C5A059]" />
                <p className="text-xs">No tienes juramentos activos.</p>
                <button
                  onClick={() => setCreateOathModalOpen(true)}
                  className="px-3 py-1.5 valdr-button-bronze text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sellar mi primer juramento</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {oaths.map((o) => (
                  <div key={o.id} className="valdr-card p-4 space-y-2 border-[#C5A059]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wide">
                        {o.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                        {o.status.toUpperCase()} ({o.duration_days} DÍAS)
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] italic">"{o.front_vow}"</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-[#64748B]">
                      <span>Hasta: {o.end_date}</span>
                      <span className="text-[#C5A059]">Firma: {o.runic_signature}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: BÓVEDA ANCESTRAL & EQUIPO GBA */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#C5A059] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                Bóveda Ancestral & Inyección .SAV
              </h2>
              <p className="text-xs text-[#64748B]">
                Inspecciona tu equipo y despacha suministros a Pokémon Heart & Soul.
              </p>
            </div>

            <div className="valdr-card p-3 overflow-x-auto">
              <PartyPcManager />
            </div>

            <div className="valdr-card p-3">
              <PokedexBagViewer />
            </div>
          </div>
        )}

        {/* PESTAÑA 5: EMULADOR GBA */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#C5A059] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                Cartucho Ancestral (mGBA WebAssembly)
              </h2>
              <p className="text-xs text-[#64748B]">
                Batería disponible: {profileData?.battery_minutes ?? 0} minutos de juego.
              </p>
            </div>

            <div className="valdr-card p-6 text-center space-y-4">
              <Gamepad2 className="w-12 h-12 text-[#C5A059] mx-auto opacity-80" />
              <div>
                <h3 className="text-base font-bold text-[#E2E8F0]">Pokémon Heart & Soul</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  El juego se apagará automáticamente si la batería llega a 0m. Cumple tus hábitos reales para desbloquear tiempo de juego.
                </p>
              </div>

              <button
                onClick={openArcadeRoom}
                className="w-full py-3 valdr-button-bronze text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Encender Cartucho Ancestral</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Crear Hábito Personalizado */}
      {createHabitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="valdr-card max-w-sm w-full p-5 space-y-4 border-[#C5A059]/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#E2E8F0] uppercase">
                Forjar Hábito Personalizado
              </h3>
              <button 
                onClick={() => setCreateHabitModalOpen(false)}
                className="text-[#64748B] hover:text-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomHabit} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Nombre del Hábito:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Lectura 20 mins, Ducha fría..."
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Descripción / Regla:</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Ej. Cero distracciones, enfoque total"
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#64748B] block mb-1">Oro (+):</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={newGoldReward}
                    onChange={(e) => setNewGoldReward(Number(e.target.value))}
                    className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748B] block mb-1">Batería GBA (+m):</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={newBatteryReward}
                    onChange={(e) => setNewBatteryReward(Number(e.target.value))}
                    className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresProofCheck"
                  checked={newRequiresProof}
                  onChange={(e) => setNewRequiresProof(e.target.checked)}
                  className="rounded border-white/20"
                />
                <label htmlFor="requiresProofCheck" className="text-xs text-[#E2E8F0] cursor-pointer">
                  Exigir prueba / evidencia para sellar
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateHabitModalOpen(false)}
                  className="w-1/2 py-2 border border-white/20 rounded-lg text-xs font-semibold text-[#64748B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim()}
                  className="w-1/2 py-2 valdr-button-bronze rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Forjando...' : 'Crear Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Sellar Juramento Sagrado con Presión Mantenida (3s) */}
      {createOathModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="valdr-card max-w-sm w-full p-5 space-y-4 border-[#C5A059]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#E2E8F0] uppercase">
                  Pacto Inviolable (Juramento)
                </h3>
              </div>
              <button 
                onClick={() => setCreateOathModalOpen(false)}
                className="text-[#64748B] hover:text-[#E2E8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#64748B] leading-tight">
              Una vez sellado con tu firma rúnica, no podrá ser pausado, editado ni eliminado. Romperlo marcará tu perfil como desertor.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Título del Pacto:</label>
                <input
                  type="text"
                  required
                  value={oathTitle}
                  onChange={(e) => setOathTitle(e.target.value)}
                  placeholder="Ej. Pacto de Hierro: Cero Procrastinación"
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Duración del Sol:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[7, 14, 30, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setOathDays(d)}
                      className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition-all ${
                        oathDays === d
                          ? 'bg-[#C5A059] text-black font-black'
                          : 'bg-white/5 border border-white/10 text-[#64748B]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Voto Específico:</label>
                <textarea
                  value={oathVow}
                  onChange={(e) => setOathVow(e.target.value)}
                  placeholder="Ej. Si fallo un solo día de entrenamiento o retención, acepto el peaje del 50% de oro y el silencio del clan..."
                  className="w-full h-18 bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Tu Firma Rúnica:</label>
                <input
                  type="text"
                  required
                  value={oathSig}
                  onChange={(e) => setOathSig(e.target.value)}
                  placeholder="Escribe tu nombre o alias de líder"
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg p-2 text-xs font-mono text-[#C5A059] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Botón de Presión Sostenida (3s) */}
              <div className="pt-2">
                <button
                  type="button"
                  onMouseDown={startOathHold}
                  onMouseUp={cancelOathHold}
                  onMouseLeave={cancelOathHold}
                  onTouchStart={startOathHold}
                  onTouchEnd={cancelOathHold}
                  className="w-full relative overflow-hidden py-3 bg-[#14171C] border border-[#C5A059] text-[#C5A059] text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                >
                  <div
                    className="absolute inset-0 bg-[#C5A059]/30 transition-all duration-150"
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span className="relative z-10">
                    {holdProgress > 0 ? `GRABANDO RUNA (${holdProgress}%)` : 'MANTÉN PRESIONADO 3S PARA SELLAR'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Comprobante de Hábito */}
      {proofModalHabit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="valdr-card max-w-sm w-full p-5 space-y-4 border-[#C5A059]/60">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#E2E8F0] uppercase">
                Registro de Conquista
              </h3>
              <p className="text-xs text-[#C5A059]">
                {proofModalHabit.title}
              </p>
              <p className="text-[11px] text-[#64748B]">
                Ingresa el enlace del video, leads contactados o evidencia de 1 línea:
              </p>
            </div>

            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Ej. Video TikTok subido día 53 + 4 leads respondidos..."
              className="w-full h-24 bg-[#0B0C0E] border border-white/10 rounded-lg p-2.5 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setProofModalHabit(null)}
                className="w-1/2 py-2 border border-white/20 rounded-lg text-xs font-semibold text-[#64748B] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={submitting || !proofText.trim()}
                onClick={() => executeHabitSubmit(proofModalHabit.id, proofText)}
                className="w-1/2 py-2 valdr-button-bronze rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Sellando...' : 'Sellar Runa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consola mGBA permanente en background */}
      <ArcadeRoomTheater />
    </div>
  );
}
