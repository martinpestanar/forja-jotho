'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';
import { ArcadeRoomTheater } from '@/components/arcade/ArcadeRoomTheater';
import { PartyPcManager } from '@/components/dashboard/PartyPcManager';
import { PokedexBagViewer } from '@/components/dashboard/PokedexBagViewer';
import { MobileTopHud } from '@/components/dashboard/MobileTopHud';
import { RunicHabitCard } from '@/components/dashboard/RunicHabitCard';
import { MobileFloatingDock, MobileTab } from '@/components/dashboard/MobileFloatingDock';
import { OracleForgeModal } from '@/components/dashboard/OracleForgeModal';
import { VigorHeaderSummary } from '@/components/dashboard/VigorHeaderSummary';
import {
  FloatingDopamineRewards,
  FloatingReward,
} from '@/components/dashboard/FloatingDopamineRewards';
import { 
  Plus, 
  Scroll, 
  X, 
  Gamepad2, 
  ShieldCheck, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface HabitItem {
  id: string;
  front_type: 'vigor' | 'templanza' | 'expansion';
  title: string;
  subtitle: string;
  duration_minutes?: number;
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
  const [activeTab, setActiveTab] = useState<MobileTab>('vigor');
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [oaths, setOaths] = useState<OathItem[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);

  // Modales
  const [proofModalHabit, setProofModalHabit] = useState<HabitItem | null>(null);
  const [proofText, setProofText] = useState('');
  const [createHabitModalOpen, setCreateHabitModalOpen] = useState(false);
  const [createOathModalOpen, setCreateOathModalOpen] = useState(false);

  // Nuevo hábito form
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newFrontType, setNewFrontType] = useState<'vigor' | 'expansion'>('vigor');
  const [newGoldReward, setNewGoldReward] = useState(50);
  const [newBatteryReward, setNewBatteryReward] = useState(30);
  const [newRequiresProof, setNewRequiresProof] = useState(false);

  // Nuevo juramento form
  const [oathTitle, setOathTitle] = useState('');
  const [oathDays, setOathDays] = useState<number>(7);
  const [oathVow, setOathVow] = useState('');
  const [oathSig, setOathSig] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);

  // 1. Contador de Asedio (Medianoche)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilMidnight(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
          .toString()
          .padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Cargar Perfil, Hábitos y Juramentos
  const loadValdrData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Perfil
    const { data: prof } = await supabase
      .from('valdr_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) setProfileData(prof);

    // Catálogo y logs
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
      setHabits(
        catalog.map((h: any) => ({
          ...h,
          completed: completedIds.has(h.id),
        }))
      );
    }

    // Juramentos
    const { data: oathsData } = await supabase
      .from('valdr_oaths')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (oathsData) setOaths(oathsData);
  };

  useEffect(() => {
    loadValdrData();

    // 3. Suscripción Supabase Realtime para Valdr Profiles
    const channel = supabase
      .channel('valdr-profile-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'valdr_profiles' },
        (payload) => {
          if (payload.new) {
            setProfileData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calcular porcentaje de cumplimiento diario
  const activeHabitsList = habits.filter(
    (h) => h.front_type === 'vigor' || h.front_type === 'expansion'
  );
  const completedHabitsCount = activeHabitsList.filter((h) => h.completed).length;
  const completionPercent =
    activeHabitsList.length > 0
      ? Math.round((completedHabitsCount / activeHabitsList.length) * 100)
      : 100;

  // Sellar Hábito con Stored Procedure RPC Atómico
  const handleHabitSeal = (habit: HabitItem, e: React.MouseEvent) => {
    if (habit.completed) return;
    if (habit.requires_proof) {
      setProofModalHabit(habit);
      setProofText('');
    } else {
      executeHabitSubmit(habit.id, null, e);
    }
  };

  const executeHabitSubmit = async (
    habitId: string,
    proof: string | null,
    e?: React.MouseEvent
  ) => {
    setSubmitting(true);
    const clientX = e?.clientX || window.innerWidth / 2;
    const clientY = e?.clientY || window.innerHeight / 2;

    try {
      // Llamada al RPC seguro creado en Supabase
      const { data, error } = await supabase.rpc('seal_daily_habit', {
        p_habit_id: habitId,
        p_proof_text: proof,
      });

      if (error) {
        alert(error.message);
      } else {
        // Disparar números flotantes de dopamina
        const habitObj = habits.find((h) => h.id === habitId);
        const goldVal = habitObj?.gold_reward || data?.gold_awarded || 50;
        const battVal = habitObj?.game_battery_reward || data?.battery_awarded || 30;

        setFloatingRewards((prev) => [
          ...prev,
          {
            id: `gold-${Date.now()}`,
            text: `+${goldVal} 💰 ORO`,
            type: 'gold',
            x: clientX - 40,
            y: clientY - 30,
          },
          ...(battVal > 0
            ? [
                {
                  id: `batt-${Date.now() + 1}`,
                  text: `+${battVal}m 🔋 GBA`,
                  type: 'battery' as const,
                  x: clientX + 20,
                  y: clientY - 50,
                },
              ]
            : []),
        ]);

        setProofModalHabit(null);
        await loadValdrData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al sellar hábito');
    } finally {
      setSubmitting(false);
    }
  };

  const removeFloatingReward = (id: string) => {
    setFloatingRewards((prev) => prev.filter((r) => r.id !== id));
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
        p_requires_proof: newRequiresProof,
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

  // Sellar Juramento
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
        p_runic_signature: oathSig.trim(),
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
    <div className="min-h-screen bg-[#0B0C0E] text-[#E2E8F0] flex flex-col font-sans select-none pb-28">
      {/* 1. Top HUD Móvil de Alto Impacto */}
      <MobileTopHud
        profileData={profileData}
        timeUntilMidnight={timeUntilMidnight}
        completionPercent={completionPercent}
      />

      {/* 2. Contenedor Principal (Mobile-First / max-w-md centrado) */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* PESTAÑA 1: FRENTE DE VIGOR */}
        {activeTab === 'vigor' && (
          <div className="space-y-3.5">
            {/* Altar de Resumen Visual de Batalla */}
            <VigorHeaderSummary
              totalCount={activeHabitsList.length}
              completedCount={completedHabitsCount}
              earnedGoldToday={activeHabitsList
                .filter((h) => h.completed)
                .reduce((acc, curr) => acc + (curr.gold_reward || 0), 0)}
              earnedBatteryToday={activeHabitsList
                .filter((h) => h.completed)
                .reduce((acc, curr) => acc + (curr.game_battery_reward || 0), 0)}
              onOpenOracle={() => setCreateHabitModalOpen(true)}
            />

            {/* Listado Bento de Hábitos con Micro-interacciones */}
            <div className="space-y-2.5">
              {habits
                .filter((h) => h.front_type === 'vigor' || h.front_type === 'expansion')
                .map((h) => (
                  <RunicHabitCard
                    key={h.id}
                    habit={h}
                    onSeal={(habitObj, e) => handleHabitSeal(habitObj, e)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TEMPLANZA (30 DÍAS) */}
        {activeTab === 'templanza' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#4E9F9F] pl-3 py-1">
              <h2 className="text-sm font-black text-[#4E9F9F] uppercase tracking-wider">
                Santuario de Templanza
              </h2>
              <p className="text-xs text-[#64748B]">
                Voto Inviolable: 30 Días de Retención y Cero Vicios.
              </p>
            </div>

            <div className="rounded-2xl bg-[#14171C] border border-[#4E9F9F]/40 p-6 text-center space-y-4 shadow-[0_4px_0_0_#000]">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#4E9F9F]/10 border-2 border-[#4E9F9F]/50 flex items-center justify-center text-[#4E9F9F] shadow-[0_0_20px_rgba(78,159,159,0.3)] animate-pulse">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <span className="text-4xl font-black text-[#E2E8F0] font-mono block">
                  {profileData?.temperance_streak_days ?? 0} / 30
                </span>
                <span className="text-xs text-[#4E9F9F] font-bold uppercase tracking-widest">
                  Días Invicto en Retención
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0C0E] border border-white/5 text-xs text-[#64748B] leading-relaxed">
                ✨ Recompensa al Día 30: Huevo Místico con Pokémon Shiny de 6 IVs perfectos inyectado al cartucho.
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: JURAMENTOS SAGRADOS */}
        {activeTab === 'oaths' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-l-2 border-[#F59E0B] pl-3 py-1">
              <div>
                <h2 className="text-sm font-black text-[#E2E8F0] uppercase tracking-wider">
                  Juramentos Sagrados
                </h2>
                <p className="text-xs text-[#64748B]">
                  Pactos inviolables sellados con firma rúnica.
                </p>
              </div>

              <button
                onClick={() => setCreateOathModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-black cursor-pointer shadow-[0_2px_0_0_#000] active:translate-y-0.5"
              >
                <Scroll className="w-4 h-4" />
                <span>Jurar</span>
              </button>
            </div>

            {oaths.length === 0 ? (
              <div className="rounded-2xl bg-[#14171C] border border-[#C5A059]/20 p-8 text-center space-y-3 text-[#64748B]">
                <Scroll className="w-10 h-10 mx-auto opacity-40 text-[#C5A059]" />
                <p className="text-xs">No tienes juramentos activos.</p>
                <button
                  onClick={() => setCreateOathModalOpen(true)}
                  className="px-4 py-2 bg-[#C5A059] text-black font-black text-xs rounded-xl shadow-[0_3px_0_0_#000] active:translate-y-0.5 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Sellar mi primer juramento</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {oaths.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-2xl bg-[#14171C] border border-[#C5A059]/30 p-4 space-y-2 shadow-[0_3px_0_0_#000]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#E2E8F0] uppercase tracking-wide">
                        {o.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                        {o.status.toUpperCase()} ({o.duration_days} DÍAS)
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] italic">"{o.front_vow}"</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-[#64748B]">
                      <span>Hasta: {o.end_date}</span>
                      <span className="text-[#C5A059] font-bold">Firma: {o.runic_signature}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: BÓVEDA ANCESTRAL */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#8B5CF6] pl-3 py-1">
              <h2 className="text-sm font-black text-[#E2E8F0] uppercase tracking-wider">
                Bóveda Ancestral & Inyección .SAV
              </h2>
              <p className="text-xs text-[#64748B]">
                Inspecciona tu equipo y despacha suministros a Pokémon Heart & Soul.
              </p>
            </div>

            <div className="rounded-2xl bg-[#14171C] border border-white/10 p-3 overflow-x-auto shadow-[0_3px_0_0_#000]">
              <PartyPcManager />
            </div>

            <div className="rounded-2xl bg-[#14171C] border border-white/10 p-3 shadow-[0_3px_0_0_#000]">
              <PokedexBagViewer />
            </div>
          </div>
        )}

        {/* PESTAÑA 5: EMULADOR GBA */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            <div className="border-l-2 border-emerald-500 pl-3 py-1">
              <h2 className="text-sm font-black text-[#E2E8F0] uppercase tracking-wider">
                Cartucho Ancestral (mGBA)
              </h2>
              <p className="text-xs text-[#64748B]">
                Batería disponible: {profileData?.battery_minutes ?? 0} minutos.
              </p>
            </div>

            <div className="rounded-2xl bg-[#14171C] border border-emerald-500/30 p-6 text-center space-y-4 shadow-[0_4px_0_0_#000]">
              <Gamepad2 className="w-14 h-14 text-emerald-400 mx-auto opacity-90 animate-bounce" />
              <div>
                <h3 className="text-base font-black text-[#E2E8F0]">Pokémon Heart & Soul</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  El juego se pausará automáticamente al llegar a 0m de batería. Cumple hábitos en la vida real para ganar más tiempo.
                </p>
              </div>

              <button
                onClick={openArcadeRoom}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Encender Cartucho Ancestral</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Dock Táctil Flotante Inferior */}
      <MobileFloatingDock activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* 4. Feedback de Números Flotantes Dopamínicos */}
      <FloatingDopamineRewards
        rewards={floatingRewards}
        onComplete={removeFloatingReward}
      />

      {/* Modales */}
      {/* Modal 1: El Oráculo Rúnico de Johto */}
      <OracleForgeModal
        isOpen={createHabitModalOpen}
        onClose={() => setCreateHabitModalOpen(false)}
        onForged={loadValdrData}
        totemName={profileData?.guide_totem?.toUpperCase() || 'OSO'}
      />

      {/* Modal 2: Juramento */}
      {createOathModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#14171C] max-w-sm w-full p-5 space-y-4 border border-[#C5A059]/70 shadow-[0_8px_25px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-sm font-black text-[#E2E8F0] uppercase">
                  Pacto Inviolable
                </h3>
              </div>
              <button
                onClick={() => setCreateOathModalOpen(false)}
                className="text-[#64748B] hover:text-[#E2E8F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#64748B] leading-tight">
              Una vez sellado con tu firma rúnica, no podrá ser cancelado ni editado. Romperlo marcará tu perfil con deshonor.
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
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-xl p-2.5 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
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
                      className={`py-2 rounded-xl text-xs font-mono font-black cursor-pointer transition-all ${
                        oathDays === d
                          ? 'bg-[#C5A059] text-black shadow-[0_2px_0_0_#000]'
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
                  placeholder="Si fallo un solo día, acepto la penalización..."
                  className="w-full h-20 bg-[#0B0C0E] border border-white/10 rounded-xl p-2.5 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#64748B] block mb-1">Tu Firma Rúnica:</label>
                <input
                  type="text"
                  required
                  value={oathSig}
                  onChange={(e) => setOathSig(e.target.value)}
                  placeholder="Escribe tu alias de líder"
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-[#C5A059] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onMouseDown={startOathHold}
                  onMouseUp={cancelOathHold}
                  onMouseLeave={cancelOathHold}
                  onTouchStart={startOathHold}
                  onTouchEnd={cancelOathHold}
                  className="w-full relative overflow-hidden py-3.5 bg-[#14171C] border-2 border-[#C5A059] text-[#C5A059] text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-[0_4px_0_0_#000]"
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

      {/* Modal 3: Comprobante Proof-of-Work */}
      {proofModalHabit && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-[#14171C] max-w-sm w-full p-5 space-y-4 border border-[#C5A059]/60 shadow-[0_8px_25px_rgba(0,0,0,0.8)]">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#E2E8F0] uppercase">
                Registro de Conquista
              </h3>
              <p className="text-xs text-[#C5A059] font-bold">
                {proofModalHabit.title}
              </p>
              <p className="text-[11px] text-[#64748B]">
                Ingresa el enlace del video, leads contactados o evidencia de 1 línea:
              </p>
            </div>

            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Ej. Video TikTok subido día 53 + 4 leads contactados..."
              className="w-full h-24 bg-[#0B0C0E] border border-white/10 rounded-xl p-2.5 text-xs text-[#E2E8F0] focus:outline-none focus:border-[#C5A059]"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setProofModalHabit(null)}
                className="w-1/2 py-2.5 border border-white/20 rounded-xl text-xs font-semibold text-[#64748B] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={submitting || !proofText.trim()}
                onClick={(e) => executeHabitSubmit(proofModalHabit.id, proofText, e)}
                className="w-1/2 py-2.5 bg-[#C5A059] text-black rounded-xl text-xs font-black disabled:opacity-50 cursor-pointer shadow-[0_2px_0_0_#000]"
              >
                {submitting ? 'Sellando...' : 'Sellar Runa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consola mGBA en background */}
      <ArcadeRoomTheater />
    </div>
  );
}
