'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';
import { ArcadeRoomTheater } from '@/components/arcade/ArcadeRoomTheater';
import { PartyPcManager } from '@/components/dashboard/PartyPcManager';
import { EconomySanctuary } from '@/components/economy/EconomySanctuary';
import { PokedexBagViewer } from '@/components/dashboard/PokedexBagViewer';
import { MobileTopHud } from '@/components/dashboard/MobileTopHud';
import { RunicHabitCard } from '@/components/dashboard/RunicHabitCard';
import { MobileFloatingDock, MobileTab } from '@/components/dashboard/MobileFloatingDock';
import { OracleForgeModal } from '@/components/dashboard/OracleForgeModal';
import { OracleConsultWidget } from '@/components/dashboard/OracleConsultWidget';
import { JourneyStartModal } from '@/components/dashboard/JourneyStartModal';
import { LootBoxModal, LootBoxData } from '@/components/dashboard/LootBoxModal';
import { VigorHeaderSummary } from '@/components/dashboard/VigorHeaderSummary';
import { NintendoNoticeModal, NoticeType } from '@/components/dashboard/NintendoNoticeModal';
import { GrimoireSovereignModal } from '@/components/dashboard/GrimoireSovereignModal';
import { FlexibleCompanionBar } from '@/components/dashboard/FlexibleCompanionBar';
import { MidnightJournalModal } from '@/components/dashboard/MidnightJournalModal';
import { SovereignTutorialModal } from '@/components/dashboard/SovereignTutorialModal';
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
  Zap,
  Flame,
  Edit2,
  Check,
  Settings,
  User,
  LogOut,
  Calendar
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
  const [journeyModalOpen, setJourneyModalOpen] = useState(false);
  const [grimoireModalOpen, setGrimoireModalOpen] = useState(false);
  const [midnightJournalModalOpen, setMidnightJournalModalOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);

  // Estado del Cofre Rúnico de Recompensas
  const [activeLootBox, setActiveLootBox] = useState<LootBoxData | null>(null);
  const [lootBoxModalOpen, setLootBoxModalOpen] = useState(false);

  // Modal de Aviso Nativo Nintendo
  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: NoticeType;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
  });

  const showNotice = (message: string, title?: string, type: NoticeType = 'error') => {
    soundFx.playDamage();
    setNoticeModal({ isOpen: true, title, message, type });
  };

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

  // Estado para marcar victoria diaria de Templanza
  const [temperanceConfirmedToday, setTemperanceConfirmedToday] = useState(false);
  const [editingInnerBeast, setEditingInnerBeast] = useState(false);
  const [innerBeastInput, setInnerBeastInput] = useState('');

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

    if (prof) {
      setProfileData(prof);
      const todayStr = new Date().toISOString().split('T')[0];
      if (prof.temperance_last_date === todayStr) {
        setTemperanceConfirmedToday(true);
      }
    }

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

    // Cofres Rúnicos Disponibles (ej. Drop 12:01 AM)
    const { data: boxes } = await supabase
      .from('valdr_loot_boxes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_opened', false)
      .lte('available_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (boxes && boxes.length > 0) {
      setActiveLootBox(boxes[0] as LootBoxData);
      setLootBoxModalOpen(true);
    }
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
      // 1. Intentar registrar a través de RPC seguro
      let rpcSuccess = false;
      try {
        const { error } = await supabase.rpc('seal_daily_habit', {
          p_habit_id: habitId,
          p_proof_text: proof,
        });
        if (!error) {
          rpcSuccess = true;
        } else {
          console.warn('[seal_daily_habit rpc error, intentando inserción directa]:', error);
        }
      } catch (rpcErr) {
        console.warn('[seal_daily_habit rpc catch]:', rpcErr);
      }

      // 2. Si el RPC falló, solo registramos la bitácora. Las recompensas
      //    económicas SOLO las concede el servidor (sin fallback optimista).
      if (!rpcSuccess) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const todayStr = new Date().toISOString().split('T')[0];
          await supabase.from('valdr_daily_logs').upsert({
            user_id: user.id,
            habit_id: habitId,
            log_date: todayStr,
            proof_text: proof,
            created_at: new Date().toISOString(),
          }, { onConflict: 'user_id,habit_id,log_date' });
        }
      }

      // 3. Refrescar la economía global (impuestos, deuda, wallet)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syndex:economy-updated'));
      }

      // Disparar números flotantes de dopamina
      const habitObj = habits.find((h) => h.id === habitId);
      const goldVal = habitObj?.gold_reward || 50;
      const battVal = habitObj?.game_battery_reward || 30;

      soundFx.playCoin();
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
    } catch (err: any) {
      showNotice(
        err.message || 'No se pudo sellar el hábito. Intenta nuevamente.',
        'Fallo de Sello Rúnico'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmTemperance = async (e: React.MouseEvent) => {
    if (temperanceConfirmedToday || submitting) return;
    setSubmitting(true);
    soundFx.playLevelUp();

    const clientX = e.clientX || window.innerWidth / 2;
    const clientY = e.clientY || window.innerHeight / 2;

    const currentStreak = profileData?.temperance_streak_days ?? 0;
    const newStreak = currentStreak + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase.rpc('rpc_economy_temperance_reward');
      if (error) {
        console.warn('[temperance reward]', error.message);
        return;
      }
      const reward = data as any;
      if (!reward?.success) {
        setTemperanceConfirmedToday(true);
        return;
      }

      const newStreak = reward.streak_days ?? currentStreak + 1;

      setTemperanceConfirmedToday(true);
      setProfileData((prev: any) => ({
        ...prev,
        temperance_streak_days: newStreak,
        temperance_last_date: todayStr,
        sovereignty_gold: reward.new_gold ?? prev?.sovereignty_gold,
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syndex:economy-updated'));
      }

      // Dopamina visual
      setFloatingRewards((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          text: `+1 DÍA INVICTO 🛡️ (+100 💰)`,
          type: 'gold',
          x: clientX - 60,
          y: clientY - 40,
        },
      ]);
    } catch (err: any) {
      console.warn('Error al confirmar templanza:', err);
      setTemperanceConfirmedToday(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateInnerBeast = async (newBeastName: string) => {
    if (!newBeastName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('valdr_profiles')
        .update({ inner_beast: newBeastName.trim() })
        .eq('id', user.id);
    }
    setProfileData((prev: any) => ({ ...prev, inner_beast: newBeastName.trim() }));
    setEditingInnerBeast(false);
    soundFx.playLevelUp();
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
        showNotice(error.message, 'Aviso del Oráculo');
      } else {
        soundFx.playLevelUp();
        setCreateHabitModalOpen(false);
        setNewTitle('');
        setNewSubtitle('');
        await loadValdrData();
      }
    } catch (err: any) {
      showNotice(err.message || 'Error al forjar nuevo hábito', 'Aviso de la Forja');
    } finally {
      setSubmitting(false);
    }
  };

  // Sellar Juramento
  const startOathHold = () => {
    if (!oathTitle.trim() || !oathSig.trim()) {
      showNotice('Debes ingresar el título y tu firma rúnica antes de jurar.', 'Pacto Incompleto', 'warning');
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
        showNotice(error.message, 'Pacto Fallido');
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
      showNotice(err.message || 'Error al grabar juramento', 'Pacto Fallido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1F1E1B] flex flex-col font-sans select-none pb-28">
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
            {/* Barra de Acompañamiento Flexible del Jefe Tribal */}
            <FlexibleCompanionBar
              completedCount={completedHabitsCount}
              totalCount={activeHabitsList.length}
              onOpenGrimoire={() => setGrimoireModalOpen(true)}
              onOpenJournal={() => setMidnightJournalModalOpen(true)}
              onOpenTutorial={() => setTutorialModalOpen(true)}
            />

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
              journeyStartDate={profileData?.journey_start_date}
              onOpenOracle={() => setCreateHabitModalOpen(true)}
              onOpenDatePicker={() => setJourneyModalOpen(true)}
            />

            {/* Listado Bento de Hábitos o Estado Vacío Intuitivo */}
            <div className="space-y-2.5">
              {habits.filter((h) => h.front_type === 'vigor' || h.front_type === 'expansion').length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-[#E8E5DD] text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043] mx-auto">
                    <Plus className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-base font-semibold text-[#1F1E1B]">
                      Sin retos activos esta semana
                    </h3>
                    <p className="text-xs text-[#706E66] max-w-xs mx-auto mt-1 leading-relaxed">
                      Define 2 o 3 hábitos para conquistar tus próximos 7 días y ganar minutos de cartucho.
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateHabitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Crear Mi Primer Reto Semanal</span>
                  </button>
                </div>
              ) : (
                habits
                  .filter((h) => h.front_type === 'vigor' || h.front_type === 'expansion')
                  .map((h) => (
                    <RunicHabitCard
                      key={h.id}
                      habit={h}
                      onSeal={(habitObj, e) => handleHabitSeal(habitObj, e)}
                    />
                  ))
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TEMPLANZA (30 DÍAS) */}
        {activeTab === 'templanza' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#4A8B99] pl-3 py-1">
              <h2 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight">
                Santuario de Templanza
              </h2>
              <p className="text-xs text-[#706E66]">
                Registro de Victoria Diaria: Cero Dopamina Barata & Retención.
              </p>
            </div>

            {/* Tarjeta de la Bestia Interior / Compulsión a Eliminar */}
            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 text-[#D97043]">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#D97043]">
                      Tu Compulsión a Eliminar
                    </span>
                    {!editingInnerBeast ? (
                      <h3 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight mt-0.5">
                        {profileData?.inner_beast || 'Procrastinación y Distracción Nocturna'}
                      </h3>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={innerBeastInput}
                          onChange={(e) => setInnerBeastInput(e.target.value)}
                          placeholder="Ej. Porno, Scroll en TikTok, Azúcar..."
                          className="bg-[#FAF9F5] border border-[#E8E5DD] rounded-xl px-2.5 py-1 text-xs text-[#1F1E1B] focus:outline-none focus:border-[#4A8B99]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateInnerBeast(innerBeastInput)}
                          className="p-1.5 bg-[#4A8B99] hover:bg-[#3B7582] text-white rounded-lg cursor-pointer transition-all"
                          title="Guardar compulsión"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() => setEditingInnerBeast(false)}
                          className="p-1.5 bg-[#F2EFE9] hover:bg-[#E8E5DD] text-[#706E66] rounded-lg cursor-pointer transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!editingInnerBeast && (
                  <button
                    onClick={() => {
                      setInnerBeastInput(profileData?.inner_beast || 'Procrastinación y Distracción Nocturna');
                      setEditingInnerBeast(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE9] border border-[#E8E5DD] text-[11px] font-mono text-[#706E66] hover:text-[#1F1E1B] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Personalizar</span>
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[#F2EFE9] flex flex-wrap gap-1.5">
                <span className="text-[10px] text-[#8A877E] font-mono mr-1">Sugerencias:</span>
                {[
                  'Porno & Masturbación',
                  'Scroll Infinito TikTok/Reels',
                  'Comida Chatarra / Azúcar',
                  'Videojuegos sin límite',
                  'Procrastinación Nocturna'
                ].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleUpdateInnerBeast(sug)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F5] hover:bg-[#D97043]/10 border border-[#E8E5DD] hover:border-[#D97043]/30 text-[#706E66] hover:text-[#D97043] transition-all cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-6 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#4A8B99]/10 border-2 border-[#4A8B99]/30 flex items-center justify-center text-[#4A8B99]">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <span className="text-4xl font-semibold text-[#1F1E1B] font-mono tabular-nums block">
                  {profileData?.temperance_streak_days ?? 0} / 30
                </span>
                <span className="text-xs text-[#3B7582] font-semibold uppercase tracking-wider">
                  Días Invicto en Retención
                </span>
              </div>

              {/* Barra de Progreso Visual hacia el Día 30 */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-[11px] font-mono text-[#706E66]">
                  <span>Progreso de Purificación</span>
                  <span className="text-[#3B7582] font-semibold tabular-nums">
                    {Math.min(100, Math.round(((profileData?.temperance_streak_days ?? 0) / 30) * 100))}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#EAE7DF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4A8B99] to-[#6E8B68] transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((profileData?.temperance_streak_days ?? 0) / 30) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Botón táctil para marcar la victoria de hoy */}
              <button
                disabled={temperanceConfirmedToday || submitting}
                onClick={handleConfirmTemperance}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.98] ${
                  temperanceConfirmedToday
                    ? 'bg-[#6E8B68]/15 text-[#5B7855] border border-[#6E8B68]/30 cursor-default'
                    : 'bg-[#4A8B99] hover:bg-[#3B7582] text-white border border-[#3B7582]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 fill-current" />
                <span>
                  {temperanceConfirmedToday
                    ? '✓ ¡Hoy Permaneciste Invicto!'
                    : 'Marcar Victoria: Hoy no caí (+100 Conchas)'}
                </span>
              </button>

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs text-[#706E66] leading-relaxed">
                ✨ Recompensa al Día 30: Huevo Místico con Pokémon Shiny de 6 IVs perfectos inyectado al cartucho.
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: AJUSTES, PERFIL & PACTOS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#D97043] pl-3 py-1">
              <h2 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight">
                Ajustes & Configuración del Líder
              </h2>
              <p className="text-xs text-[#706E66]">
                Gestiona tus datos de líder, tus pactos sagrados y tus preferencias.
              </p>
            </div>

            {/* Sub-Tarjeta 1: Perfil y Datos Personales */}
            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D97043]" />
                  <span className="text-xs font-semibold text-[#1F1E1B] uppercase tracking-wide">Identidad del Entrenador</span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#D97043]/10 text-[#D97043]">
                  TOTEM {profileData?.guide_totem?.toUpperCase() || 'LOBO'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
                  <span className="text-[10px] text-[#706E66] block font-mono">Nombre de Líder</span>
                  <span className="font-semibold text-[#1F1E1B] mt-0.5 block">{profileData?.leader_name || 'Martín'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
                  <span className="text-[10px] text-[#706E66] block font-mono">Pokédólares</span>
                  <span className="font-semibold text-[#A6752C] mt-0.5 block">
                    ₽{useTrainerStore.getState().profile?.pokedollars ?? profileData?.pokedollars ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4A8B99]" />
                  <div>
                    <span className="text-[10px] text-[#706E66] block font-mono">Inicio de Marea</span>
                    <span className="text-xs font-semibold text-[#1F1E1B]">
                      {profileData?.journey_start_date || 'No definida'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setJourneyModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#E8E5DD] text-[11px] font-medium text-[#1F1E1B] transition-colors cursor-pointer shadow-sm"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* Sub-Tarjeta 2: Sección de Pactos y Juramentos */}
            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2.5">
                <div className="flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-[#D97043]" />
                  <span className="text-xs font-semibold text-[#1F1E1B] uppercase tracking-wide">Pactos & Contratos</span>
                </div>
                <button
                  onClick={() => setCreateOathModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white text-[11px] font-medium cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Pacto</span>
                </button>
              </div>

              <p className="text-[11px] text-[#706E66] leading-relaxed">
                Contratos de honor no negociables (7 a 90 días) para mantener la disciplina en la marea.
              </p>

              {oaths.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-dashed border-[#E8E5DD] text-center space-y-2">
                  <p className="text-xs text-[#706E66]">No tienes juramentos activos en curso.</p>
                  <button
                    onClick={() => setCreateOathModalOpen(true)}
                    className="px-3 py-1.5 bg-[#D97043] text-white font-medium text-xs rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sellar mi primer pacto</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {oaths.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1F1E1B]">
                          {o.title}
                        </span>
                        <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-[#6E8B68]/10 text-[#5B7855]">
                          {o.status.toUpperCase()} ({o.duration_days}D)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5E5C56] italic">"{o.front_vow}"</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#706E66] pt-1 border-t border-[#E8E5DD]">
                        <span>Hasta: {o.end_date}</span>
                        <span className="text-[#D97043] font-medium">Firma: {o.runic_signature}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Tarjeta 3: Sesión & Cierre Seguro */}
            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-[#1F1E1B] block">Cerrar Sesión</span>
                <span className="text-[11px] text-[#706E66]">Salir de la cuenta en este dispositivo</span>
              </div>
              <button
                onClick={async () => {
                  soundFx.playClick();
                  await supabase.auth.signOut();
                  window.location.href = '/admin/login';
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium cursor-pointer active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: BÓVEDA ANCESTRAL */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#D4A359] pl-3 py-1">
              <h2 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight">
                Santuario & Inyección .SAV
              </h2>
              <p className="text-xs text-[#706E66]">
                Inspecciona tu equipo y despacha suministros a Pokémon Heart & Soul.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm">
              <EconomySanctuary />
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm">
              <PartyPcManager />
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm">
              <PokedexBagViewer />
            </div>
          </div>
        )}

        {/* PESTAÑA 5: EMULADOR GBA */}
        {activeTab === 'game' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#6E8B68] pl-3 py-1">
              <h2 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight">
                Cartucho Portátil (mGBA)
              </h2>
              <p className="text-xs text-[#706E66]">
                Batería de inmersión disponible: {profileData?.battery_minutes ?? 0} minutos.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E5DD] p-6 text-center space-y-4 shadow-sm">
              <Gamepad2 className="w-14 h-14 text-[#6E8B68] mx-auto opacity-90 animate-bounce" />
              <div>
                <h3 className="font-editorial text-base font-semibold text-[#1F1E1B]">Pokémon Heart & Soul</h3>
                <p className="text-xs text-[#706E66] mt-1 max-w-xs mx-auto">
                  El juego se pausará al llegar a 0m de flujo. Cumple hábitos en la vida real para expandir tu sesión.
                </p>
              </div>

              <button
                onClick={openArcadeRoom}
                className="w-full py-3.5 bg-[#6E8B68] hover:bg-[#5B7855] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all tracking-wide"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Encender Cartucho</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Dock Táctil Flotante Inferior */}
      <MobileFloatingDock
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenGrimoire={() => setGrimoireModalOpen(true)}
      />

      {/* Modal del Grimorio del Soberano (Ebook Interactivo & Rescate de Martín) */}
      <GrimoireSovereignModal
        isOpen={grimoireModalOpen}
        onClose={() => setGrimoireModalOpen(false)}
        leaderName={profileData?.leader_name || 'Martín'}
      />

      {/* Modal del Diario de Medianoche (Terapia guiada 10 min + RPC Supabase + Gemini 2.5) */}
      <MidnightJournalModal
        isOpen={midnightJournalModalOpen}
        onClose={() => setMidnightJournalModalOpen(false)}
        userId={profileData?.id}
        leaderName={profileData?.leader_name || 'Martín'}
        onJournalSaved={(goldAwarded) => {
          loadValdrData();
        }}
      />

      {/* Modal de Guía Rápida & Tutorial del Soberano */}
      <SovereignTutorialModal
        isOpen={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
        leaderName={profileData?.leader_name || 'Martín'}
      />

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

      {/* Modal de Aviso / Alerta Nativo Nintendo (Zero browser alerts) */}
      <NintendoNoticeModal
        isOpen={noticeModal.isOpen}
        title={noticeModal.title}
        message={noticeModal.message}
        type={noticeModal.type}
        onClose={() => setNoticeModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal de Apertura / Fecha de Consagración */}
      <JourneyStartModal
        isOpen={journeyModalOpen}
        currentStartDate={profileData?.journey_start_date}
        onClose={() => setJourneyModalOpen(false)}
        onUpdated={(newDate) => {
          setProfileData((prev: any) => ({ ...prev, journey_start_date: newDate }));
        }}
      />

      {/* Modal del Cofre Rúnico de Recompensas */}
      {activeLootBox && (
        <LootBoxModal
          box={activeLootBox}
          isOpen={lootBoxModalOpen}
          onClose={() => setLootBoxModalOpen(false)}
          onOpened={() => {
            loadValdrData();
          }}
        />
      )}

      {/* Widget Interactivo del Oráculo de Johto (Gemini 2.5 Flash + Supabase) */}
      <OracleConsultWidget profileData={profileData} />

      {/* Consola mGBA en background */}
      <ArcadeRoomTheater />
    </div>
  );
}
