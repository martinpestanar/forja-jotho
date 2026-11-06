'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';
import { ArcadeRoomTheater } from '@/components/arcade/ArcadeRoomTheater';
import { PartyPcManager } from '@/components/dashboard/PartyPcManager';
import { EconomySanctuary } from '@/components/economy/EconomySanctuary';
import { RanchSection } from '@/components/economy/RanchSection';
import { MobileTopHud } from '@/components/dashboard/MobileTopHud';
import { RunicHabitCard } from '@/components/dashboard/RunicHabitCard';
import { MobileFloatingDock, MobileTab } from '@/components/dashboard/MobileFloatingDock';
import { MobileDashboardLayout } from '@/components/dashboard/MobileDashboardLayout';
import { DesktopDashboardLayout } from '@/components/dashboard/DesktopDashboardLayout';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { OracleForgeModal } from '@/components/dashboard/OracleForgeModal';
import { OracleConsultWidget } from '@/components/dashboard/OracleConsultWidget';
import { JourneyStartModal } from '@/components/dashboard/JourneyStartModal';
import { StarterSelectionModal } from '@/components/dashboard/StarterSelectionModal';
import { SilphFrequencyTunerModal } from '@/components/dashboard/SilphFrequencyTunerModal';
import { LootBoxModal, LootBoxData } from '@/components/dashboard/LootBoxModal';
import { VigorHeaderSummary } from '@/components/dashboard/VigorHeaderSummary';
import { NintendoNoticeModal, NoticeType } from '@/components/dashboard/NintendoNoticeModal';
import { GrimoireSovereignModal } from '@/components/dashboard/GrimoireSovereignModal';
import { FlexibleCompanionBar } from '@/components/dashboard/FlexibleCompanionBar';
import { MidnightJournalModal } from '@/components/dashboard/MidnightJournalModal';
import { SovereignTutorialModal } from '@/components/dashboard/SovereignTutorialModal';
import { LockedPactBanner } from '@/components/dashboard/LockedPactBanner';
import { TemperanceSanctuaryModal } from '@/components/dashboard/TemperanceSanctuaryModal';
import { OnboardingInitiationModal, OnboardingPresetHabit, OnboardingPactData } from '@/components/dashboard/OnboardingInitiationModal';
import { EditHabitModal } from '@/components/dashboard/EditHabitModal';
import { DailyVaultBar } from '@/components/dashboard/DailyVaultBar';
import { MidnightSettlementModal, MidnightSettlementData } from '@/components/dashboard/MidnightSettlementModal';
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
  Calendar,
  Package,
  Sprout,
  Users,
  Sparkles
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface HabitItem {
  id: string;
  front_type: 'vigor' | 'templanza' | 'expansion' | 'oficio' | 'maestria' | 'claridad';
  title: string;
  subtitle: string;
  duration_minutes?: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  is_custom?: boolean;
  completed?: boolean;
  edit_count?: number;
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
  const isDesktop = useMediaQuery('(min-width: 1024px)');
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
  const [onboardingInitiationOpen, setOnboardingInitiationOpen] = useState(false);
  const [editHabitModalTarget, setEditHabitModalTarget] = useState<HabitItem | null>(null);
  const [journeyModalOpen, setJourneyModalOpen] = useState(false);
  const [starterModalOpen, setStarterModalOpen] = useState(false);
  const [silphTunerOpen, setSilphTunerOpen] = useState(false);
  const [grimoireModalOpen, setGrimoireModalOpen] = useState(false);
  const [midnightJournalModalOpen, setMidnightJournalModalOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);

  // Estado del Cofre Rúnico de Recompensas
  const [activeLootBox, setActiveLootBox] = useState<LootBoxData | null>(null);
  const [lootBoxModalOpen, setLootBoxModalOpen] = useState(false);

  // Estado del Alijo de Medianoche (Settlement)
  const [midnightSettlement, setMidnightSettlement] = useState<MidnightSettlementData | null>(null);
  const [midnightSettlementOpen, setMidnightSettlementOpen] = useState(false);

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

  // Sub-sección del Santuario
  const [sanctuaryTab, setSanctuaryTab] = useState<'boveda' | 'rancho' | 'equipo'>('boveda');

  // Estado para marcar victoria diaria de Templanza
  const [temperanceConfirmedToday, setTemperanceConfirmedToday] = useState(false);
  const [editingInnerBeast, setEditingInnerBeast] = useState(false);
  const [innerBeastInput, setInnerBeastInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);
  const walletPokedollars = useTrainerStore((s) => s.profile?.pokedollars ?? 0);

  // 1. Contador de Asedio (Medianoche) con Detección Automática de Cruce de Día
  const lastKnownDateRef = useRef<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // CRUCE DE MEDIANOCHE DETECTADO (00:00 AM)
      if (todayStr !== lastKnownDateRef.current) {
        lastKnownDateRef.current = todayStr;
        soundFx.playLevelUp();
        // Recargar datos para que las tareas amanezcan desmarcadas
        loadValdrData();
      }

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
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Chequeo de Recarga Diaria de 2 Horas (120 min)
      // Si la fecha de última recarga es anterior a hoy o no existe, restaurar a mínimo 120 minutos
      const lastResetDate = localStorage.getItem(`syndex_battery_reset_${user.id}`);
      if (lastResetDate !== todayStr) {
        const currentBattery = prof.battery_minutes ?? 0;
        const newBattery = Math.max(currentBattery, 120);
        try {
          await supabase
            .from('valdr_profiles')
            .update({ battery_minutes: newBattery })
            .eq('id', user.id);
          prof.battery_minutes = newBattery;
          localStorage.setItem(`syndex_battery_reset_${user.id}`, todayStr);
        } catch (e) {
          console.warn('Battery daily reset update failed:', e);
        }
      }

      setProfileData(prof);
      const currentProf = useTrainerStore.getState().profile;
      if (
        currentProf?.id !== prof.id ||
        currentProf?.battery_minutes !== (prof.battery_minutes ?? 120) ||
        currentProf?.pokedollars !== (prof.sovereignty_gold ?? 250)
      ) {
        useTrainerStore.getState().setProfile({
          ...currentProf,
          id: prof.id,
          battery_minutes: prof.battery_minutes ?? 120,
          pokedollars: prof.sovereignty_gold ?? 250,
        } as any);
      }

      if (prof.temperance_last_date === todayStr) {
        setTemperanceConfirmedToday(true);
      }
    }

    // Sincronizar starter_pokemon, equipped_accessory y gba_party_json desde tabla profiles
    try {
      const { data: trainerProf } = await supabase
        .from('profiles')
        .select('starter_pokemon, gba_party_json, equipped_accessory')
        .eq('id', user.id)
        .maybeSingle();

      if (trainerProf) {
        const curProf = useTrainerStore.getState().profile;
        if (
          curProf?.starter_pokemon !== trainerProf.starter_pokemon ||
          curProf?.equipped_accessory !== trainerProf.equipped_accessory
        ) {
          useTrainerStore.getState().updateProfile({
            starter_pokemon: trainerProf.starter_pokemon,
            gba_party_json: trainerProf.gba_party_json || [],
            equipped_accessory: trainerProf.equipped_accessory,
          });
        }

        const hasChosenStarter = Boolean(
          trainerProf.starter_pokemon ||
          (trainerProf.gba_party_json && trainerProf.gba_party_json.length > 0) ||
          trainerProf.equipped_accessory
        );

        const alreadyTuned =
          (typeof window !== 'undefined' && localStorage.getItem(`syndex_shiny_tuned_${user.id}`) === 'true') ||
          hasChosenStarter;

        // Si ya tiene un Pokémon o ya sintonizó, marcar en localStorage para que no se reabra
        if (hasChosenStarter && typeof window !== 'undefined') {
          localStorage.setItem(`syndex_shiny_tuned_${user.id}`, 'true');
        }

        // Solo abrir si realmente es un usuario 100% virgen sin Pokémon
        if (!alreadyTuned && !hasChosenStarter) {
          setSilphTunerOpen(true);
        }
      } else {
        const alreadyTuned = typeof window !== 'undefined' && localStorage.getItem(`syndex_shiny_tuned_${user.id}`) === 'true';
        if (!alreadyTuned) {
          setSilphTunerOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error al verificar perfil de entrenador:', e);
    }

    // Catálogo y hábitos guardados en Supabase (valdr_habits)
    let dbCustomHabits: any[] = [];
    try {
      const { data } = await supabase
        .from('valdr_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (data) dbCustomHabits = data;
    } catch {}

    let catalog: any[] = [];

    // Recuperar también hábitos locales de contingencia
    let localCustomHabits: any[] = [];
    try {
      localCustomHabits = JSON.parse(localStorage.getItem(`syndex_custom_habits_${user.id}`) || '[]');
    } catch {}

    const todayStr = new Date().toISOString().split('T')[0];
    let logs: any[] = [];
    try {
      const { data } = await supabase
        .from('valdr_daily_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('log_date', todayStr);
      if (data) logs = data;
    } catch {}

    const completedIds = new Set((logs || []).map((l: any) => l.habit_id));

    // Combinar hábitos de BD + catálogo + locales
    const allHabitsMap = new Map();
    (catalog || []).forEach((h: any) => allHabitsMap.set(h.id, h));
    (dbCustomHabits || []).forEach((h: any) => allHabitsMap.set(h.id, h));
    localCustomHabits.forEach((h: any) => allHabitsMap.set(h.id, h));

    const combinedHabits = Array.from(allHabitsMap.values());

    setHabits(
      combinedHabits.map((h: any) => ({
        ...h,
        completed: completedIds.has(h.id),
      }))
    );

    // Juramentos
    try {
      const { data: oathsData } = await supabase
        .from('valdr_oaths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (oathsData) setOaths(oathsData);
    } catch {}

    // Chequeo de Liquidación de Medianoche del día anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const settlementKey = `syndex_midnight_settled_${user.id}_${yesterdayStr}`;

    if (typeof window !== 'undefined' && localStorage.getItem(settlementKey) !== 'claimed') {
      // Consultar cuántas tareas se sellaron ayer
      const { data: yLogs } = await supabase
        .from('valdr_daily_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('log_date', yesterdayStr);

      const yCount = (yLogs || []).length;
      if (yCount > 0) {
        // Calcular el oro y batería acumulada de ayer
        const yHabits = combinedHabits.filter((h: any) =>
          yLogs?.some((l: any) => l.habit_id === h.id)
        );
        const yGold = yHabits.reduce((acc: number, curr: any) => acc + (curr.gold_reward || 0), 0);
        const yBatt = yHabits.reduce((acc: number, curr: any) => acc + (curr.game_battery_reward || 0), 0);

        setMidnightSettlement({
          yesterdayDate: yesterdayStr,
          goldSettled: yGold,
          batterySettled: yBatt,
          tasksCompleted: yCount,
          totalTasks: combinedHabits.filter((h: any) => h.front_type !== 'templanza').length || 4,
          allPillarsBonus: yCount >= 4,
          streakDays: prof?.streak_fire_days ?? 1,
        });
        setMidnightSettlementOpen(true);
      }
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
            // Sincronizar billetera inmediatamente en useTrainerStore para unificar
            const updatedGold = (payload.new as any).sovereignty_gold;
            const currentProfile = useTrainerStore.getState().profile;
            if (typeof updatedGold === 'number' && currentProfile) {
              useTrainerStore.getState().setProfile({
                ...currentProfile,
                pokedollars: updatedGold,
              });
            }
          }
        }
      )
      .subscribe();

    // 4. Listener global para sincronización de economía en todo el frontend
    const handleEconomyEvent = () => {
      loadValdrData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('syndex:economy-updated', handleEconomyEvent);
      window.addEventListener('syndex:battery-updated', handleEconomyEvent);
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('syndex:economy-updated', handleEconomyEvent);
        window.removeEventListener('syndex:battery-updated', handleEconomyEvent);
      }
    };
  }, []);

  // Filtro de pilar activo en el módulo de Vigor
  const [pillarFilter, setPillarFilter] = useState<'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad'>('todos');

  // Calcular porcentaje de cumplimiento diario
  const activeHabitsList = habits.filter(
    (h) => h.front_type === 'vigor' || h.front_type === 'expansion'
  );
  const completedHabitsCount = activeHabitsList.filter((h) => h.completed).length;
  const completionPercent =
    activeHabitsList.length > 0
      ? Math.round((completedHabitsCount / activeHabitsList.length) * 100)
      : 100;

  // Handler de Deshacer: elimina el log del día para un hábito (optimista)
  const handleUndoHabitSeal = async (habit: HabitItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase
        .from('valdr_daily_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('habit_id', habit.id)
        .eq('log_date', todayStr);
      // Revertir el wallet de forma optimista (si hay RPC disponible)
      try {
        await supabase.rpc('rpc_valdr_unseal_habit_log', {
          p_habit_id: habit.id,
          p_gold_reward: habit.gold_reward,
          p_battery_reward: habit.game_battery_reward,
        });
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syndex:economy-updated'));
      }
      await loadValdrData();
    } catch (err) {
      console.warn('[undo seal]', err);
    }
  };

  // Sellar Hábito con Stored Procedure RPC Atómico
  const handleHabitSeal = (habit: HabitItem, e?: React.MouseEvent) => {
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
      // 1. Intentar registrar a través de RPC seguro de servidor
      let rpcSuccess = false;
      const habitObj = habits.find((h) => h.id === habitId);
      const goldVal = habitObj?.gold_reward || 100;
      const battVal = habitObj?.game_battery_reward || 15;

      try {
        const { error: logRpcErr } = await supabase.rpc('rpc_valdr_seal_habit_log', {
          p_habit_id: habitId,
          p_gold_reward: goldVal,
          p_battery_reward: battVal,
        });

        if (!logRpcErr) {
          rpcSuccess = true;
        } else {
          // Intentar el RPC alternativo
          const { error: altErr } = await supabase.rpc('seal_daily_habit', {
            p_habit_id: habitId,
            p_proof_text: proof,
          });
          if (!altErr) rpcSuccess = true;
        }
      } catch (rpcErr) {
        console.warn('[seal habit rpc catch]:', rpcErr);
      }

      // 2. Si el RPC falló, registramos en valdr_daily_logs directamente
      if (!rpcSuccess) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const todayStr = new Date().toISOString().split('T')[0];
          await supabase.from('valdr_daily_logs').upsert({
            user_id: user.id,
            habit_id: habitId,
            log_date: todayStr,
            created_at: new Date().toISOString(),
          }, { onConflict: 'user_id,habit_id,log_date' });
        }
      }

      // 3. Refrescar la economía global (impuestos, deuda, wallet)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syndex:economy-updated'));
      }

      // Disparar números flotantes de dopamina
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

  const handleConfirmTemperance = async (e?: React.MouseEvent) => {
    if (temperanceConfirmedToday || submitting) return;
    setSubmitting(true);
    soundFx.playLevelUp();

    const clientX = e?.clientX || window.innerWidth / 2;
    const clientY = e?.clientY || window.innerHeight / 2;

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

  // Ceremonia de Iniciación Onboarding: Guardar los 4 Retos + Pacto de Templanza en Supabase
  const handleCompleteInitiation = async ({
    habits: initialHabits,
    pact: initialPact,
  }: {
    habits: OnboardingPresetHabit[];
    pact: OnboardingPactData;
  }) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Entrenador no autenticado.');

      // 1. Guardar los 4 hábitos en Supabase (tabla valdr_habits)
      const habitsToInsert = initialHabits.map((h) => ({
        user_id: user.id,
        title: h.title,
        subtitle: h.subtitle,
        front_type: h.pilar,
        gold_reward: h.gold,
        game_battery_reward: h.battery,
        requires_proof: false,
        is_custom: true,
      }));

      const { data: insertedHabits, error: habitsErr } = await supabase
        .from('valdr_habits')
        .insert(habitsToInsert)
        .select();

      if (habitsErr) {
        console.warn('Error insertando en valdr_habits, guardando copia de respaldo:', habitsErr);
      }

      // También respaldo en localStorage para inmutabilidad inmediata
      const existingLocal = JSON.parse(localStorage.getItem(`syndex_custom_habits_${user.id}`) || '[]');
      const backupHabits = initialHabits.map((h, i) => ({
        id: `init-${h.pilar}-${Date.now()}-${i}`,
        title: h.title,
        subtitle: h.subtitle,
        front_type: h.pilar,
        gold_reward: h.gold,
        game_battery_reward: h.battery,
        requires_proof: false,
        is_custom: true,
      }));
      localStorage.setItem(
        `syndex_custom_habits_${user.id}`,
        JSON.stringify([...existingLocal, ...(insertedHabits || backupHabits)])
      );

      // 2. Sellar el Pacto de Templanza
      await handleSealTemperanceOath({
        title: initialPact.title,
        vow: initialPact.vow,
        durationDays: initialPact.durationDays,
        signature: initialPact.signature,
      });

      soundFx.playLevelUp();
      showNotice(
        '¡Ceremonia de Iniciación completada! Tus 4 pilares y tu Pacto de Templanza están listos.',
        'Iniciación Conquistada',
        'success'
      );
      await loadValdrData();
    } catch (err: any) {
      showNotice(err.message || 'Error durante la iniciación', 'Error', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };
  // Modificar Hábito (Máximo 2 veces de edición estricta)
  const handleSaveEditedHabit = async (
    habitId: string,
    updatedData: {
      title: string;
      subtitle: string;
      front_type: string;
      gold_reward: number;
      game_battery_reward: number;
    }
  ) => {
    setSubmitting(true);
    try {
      // 1. Intentar vía RPC atómico de Supabase
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_valdr_edit_habit', {
        p_habit_id: habitId,
        p_title: updatedData.title,
        p_subtitle: updatedData.subtitle,
        p_front_type: updatedData.front_type,
        p_gold_reward: updatedData.gold_reward,
        p_battery_reward: updatedData.game_battery_reward,
      });

      if (rpcErr) {
        // Fallback directo a valdr_habits
        const { data: currentHabit } = await supabase
          .from('valdr_habits')
          .select('edit_count')
          .eq('id', habitId)
          .single();

        const currentEdits = currentHabit?.edit_count || 0;
        if (currentEdits >= 2) {
          throw new Error('Límite alcanzado: este hábito ya ha sido editado 2 veces (inmutable).');
        }

        const { error: updateErr } = await supabase
          .from('valdr_habits')
          .update({
            title: updatedData.title,
            subtitle: updatedData.subtitle,
            front_type: updatedData.front_type,
            gold_reward: updatedData.gold_reward,
            game_battery_reward: updatedData.game_battery_reward,
            edit_count: currentEdits + 1,
          })
          .eq('id', habitId);

        if (updateErr) throw updateErr;
      }

      showNotice('Hábito actualizado exitosamente.', 'Ajuste Forjado', 'success');
      await loadValdrData();
    } catch (err: any) {
      showNotice(err.message || 'Error al actualizar hábito', 'Aviso', 'warning');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar Hábito de la lista
  const handleDeleteHabit = async (habitObj: HabitItem) => {
    if (!confirm(`¿Eliminar la misión "${habitObj.title}"?`)) return;
    setSubmitting(true);
    try {
      await supabase.rpc('rpc_valdr_delete_habit', { p_habit_id: habitObj.id });
      await supabase.from('valdr_habits').delete().eq('id', habitObj.id);

      // Limpiar también en localStorage de contingencia
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const local = JSON.parse(localStorage.getItem(`syndex_custom_habits_${user.id}`) || '[]');
        const filtered = local.filter((h: any) => h.id !== habitObj.id);
        localStorage.setItem(`syndex_custom_habits_${user.id}`, JSON.stringify(filtered));
      }

      soundFx.playDamage();
      showNotice('Misión eliminada.', 'Registro Actualizado', 'info');
      await loadValdrData();
    } catch (err: any) {
      showNotice(err.message || 'Error al eliminar', 'Aviso', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSealTemperanceOath = async ({
    title,
    vow,
    durationDays,
    signature,
  }: {
    title: string;
    vow: string;
    durationDays: number;
    signature: string;
  }) => {
    setSubmitting(true);
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + durationDays);
      const todayStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 1. Intentar vía RPC
      const { error: rpcError } = await supabase.rpc('rpc_valdr_seal_oath', {
        p_title: title.trim(),
        p_duration_days: durationDays,
        p_front_vow: vow.trim(),
        p_runic_signature: signature.trim(),
      });

      if (rpcError) {
        // Fallback directo con usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Entrenador no autenticado.');

        const { error: insertError } = await supabase.from('valdr_oaths').insert({
          user_id: user.id,
          title: title.trim(),
          duration_days: durationDays,
          front_vow: vow.trim(),
          runic_signature: signature.trim(),
          start_date: todayStr,
          end_date: endDateStr,
          status: 'locked_active',
        });

        if (insertError) throw insertError;
      }

      soundFx.playLevelUp();
      showNotice(
        `¡Pacto de Templanza de ${durationDays} días sellado y bloqueado! Mantén la pureza y foco mental.`,
        'Pacto Inquebrantable',
        'success'
      );
      await loadValdrData();
    } catch (err: any) {
      showNotice(err.message || 'Error al sellar el pacto de templanza', 'Pacto Fallido', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar victoria diaria de templanza
  const handleConfirmDailyVictory = async () => {
    soundFx.playLevelUp();
    showNotice(
      '¡Día victorioso registrado! Vínculo con tu Pokémon fortalecido y multiplicador 1.25x activo.',
      'Templanza Defendida',
      'success'
    );
  };

  // Declarar recaída
  const handleDeclareRelapse = async () => {
    try {
      const activeOath = oaths.find((o) => o.status === 'locked_active' || o.status === 'active');
      if (activeOath) {
        await supabase
          .from('valdr_oaths')
          .update({ status: 'broken' })
          .eq('id', activeOath.id);
      }
      soundFx.playDamage();
      showNotice(
        'Has registrado tu recaída con valentía. Respira, limpia tu mente y vuelve a forjar tu pacto cuando estés listo.',
        'Honor & Resiliencia',
        'warning'
      );
      await loadValdrData();
    } catch (err: any) {
      showNotice(err.message || 'Error al registrar recaída', 'Error', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1F1E1B] font-sans select-none antialiased">
      {isDesktop ? (
        <DesktopDashboardLayout
          profileData={profileData}
          habits={habits}
          oaths={oaths}
          timeUntilMidnight={timeUntilMidnight}
          completionPercent={completionPercent}
          walletPokedollars={walletPokedollars}
          batteryMinutes={profileData?.battery_minutes ?? 120}
          pillarFilter={pillarFilter}
          setPillarFilter={setPillarFilter}
          temperanceConfirmedToday={temperanceConfirmedToday}
          submitting={submitting}
          onHabitSeal={(h, e) => handleHabitSeal(h, e)}
          onEditHabit={(h) => setEditHabitModalTarget(h as HabitItem)}
          onConfirmTemperance={handleConfirmTemperance}
          onUpdateInnerBeast={handleUpdateInnerBeast}
          onOpenCreateHabit={() => setCreateHabitModalOpen(true)}
          onOpenCreateOath={() => setCreateOathModalOpen(true)}
          onOpenDatePicker={() => setJourneyModalOpen(true)}
          onOpenGrimoire={() => setGrimoireModalOpen(true)}
          onOpenJournal={() => setMidnightJournalModalOpen(true)}
          onOpenSilphTuner={() => setSilphTunerOpen(true)}
          onOpenTutorial={() => setTutorialModalOpen(true)}
          onOpenOracle={() => setCreateHabitModalOpen(true)}
          onOpenTheater={openArcadeRoom}
        />
      ) : (
        <MobileDashboardLayout
          profileData={profileData}
          habits={habits}
          oaths={oaths}
          timeUntilMidnight={timeUntilMidnight}
          completionPercent={completionPercent}
          walletPokedollars={walletPokedollars}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sanctuaryTab={sanctuaryTab}
          setSanctuaryTab={setSanctuaryTab}
          pillarFilter={pillarFilter}
          setPillarFilter={setPillarFilter}
          temperanceConfirmedToday={temperanceConfirmedToday}
          submitting={submitting}
          onHabitSeal={(h, e) => handleHabitSeal(h, e)}
          onUndoHabitSeal={(h) => handleUndoHabitSeal(h as HabitItem)}
          onEditHabit={(h) => setEditHabitModalTarget(h as HabitItem)}
          onDeleteHabit={(h) => handleDeleteHabit(h as HabitItem)}
          onConfirmTemperance={handleConfirmTemperance}
          onUpdateInnerBeast={handleUpdateInnerBeast}
          onOpenCreateHabit={() => setCreateHabitModalOpen(true)}
          onOpenCreateOath={() => setCreateOathModalOpen(true)}
          onOpenDatePicker={() => setJourneyModalOpen(true)}
          onOpenGrimoire={() => setGrimoireModalOpen(true)}
          onOpenOnboardingInitiation={() => setOnboardingInitiationOpen(true)}
          onOpenArcadeRoom={openArcadeRoom}
          showNotice={showNotice}
        />
      )}

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

      {/* Modal 1.5: Ceremonia de Iniciación Onboarding (4 Retos + Templanza) */}
      <OnboardingInitiationModal
        isOpen={onboardingInitiationOpen}
        onClose={() => setOnboardingInitiationOpen(false)}
        trainerName={profileData?.leader_name || 'Marty'}
        onCompleteInitiation={handleCompleteInitiation}
      />

      {/* Modal 2: Santuario del Pacto de Templanza (Dopamínico & Editorial) */}
      <TemperanceSanctuaryModal
        isOpen={createOathModalOpen}
        onClose={() => setCreateOathModalOpen(false)}
        activeOath={oaths.find((o) => o.status === 'locked_active' || o.status === 'active') || null}
        onSealOath={handleSealTemperanceOath}
        onConfirmDailyVictory={handleConfirmDailyVictory}
        onDeclareRelapse={handleDeclareRelapse}
      />

      {/* Modal 2.5: Edición Rúnica de Hábito (Máximo 2 veces) */}
      <EditHabitModal
        habit={editHabitModalTarget}
        isOpen={Boolean(editHabitModalTarget)}
        onClose={() => setEditHabitModalTarget(null)}
        onSave={handleSaveEditedHabit}
      />

      {/* Modal 3: Comprobante Proof-of-Work (Línea Gráfica Editorial Serena) */}
      {proofModalHabit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-2xl bg-white max-w-sm w-full p-5 space-y-4 border border-[#E8E5DD] shadow-[0_12px_32px_rgba(31,30,27,0.12)] animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="font-editorial text-sm font-semibold text-[#1F1E1B]">
                Registro de Conquista
              </h3>
              <p className="text-xs text-[#D97043] font-semibold">
                {proofModalHabit.title}
              </p>
              <p className="text-[11px] text-[#706E66]">
                Ingresa el enlace del video, leads contactados o evidencia de 1 línea:
              </p>
            </div>

            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Ej. Sesión completada con éxito..."
              className="w-full h-24 bg-[#FAF9F5] border border-[#E8E5DD] rounded-xl p-2.5 text-xs text-[#1F1E1B] focus:outline-none focus:border-[#D97043] focus:bg-white transition-all"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setProofModalHabit(null)}
                className="w-1/2 py-2.5 border border-[#E4E1D8] rounded-xl text-xs font-bold text-[#1C1B18] bg-[#FAF9F5] hover:bg-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={submitting || !proofText.trim()}
                onClick={(e) => executeHabitSubmit(proofModalHabit.id, proofText, e)}
                className="w-1/2 py-2.5 bg-[#1C1B18] hover:bg-[#2C2B28] text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all cursor-pointer border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none"
              >
                {submitting ? 'Sellando...' : 'Sellar Registro'}
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

      {/* Modal de Liquidación de Medianoche (Alijo Nocturno) */}
      {midnightSettlement && (
        <MidnightSettlementModal
          data={midnightSettlement}
          isOpen={midnightSettlementOpen}
          onClose={() => setMidnightSettlementOpen(false)}
          onClaim={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const key = `syndex_midnight_settled_${user.id}_${midnightSettlement.yesterdayDate}`;
              localStorage.setItem(key, 'claimed');
            }
            await loadValdrData();
          }}
        />
      )}

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

      {/* Sintonizador de Frecuencia Silph (Regalo Shiny Inicial Onboarding) */}
      <SilphFrequencyTunerModal
        isOpen={silphTunerOpen}
        onClose={() => setSilphTunerOpen(false)}
        onClaimed={() => {
          soundFx.playLevelUp();
          loadValdrData();
        }}
      />

      {/* Modal de Elección de 3 Iniciales Shinies (1 Kanto, 1 Johto, 1 Hoenn) - Accesible como fallback opcional */}
      <StarterSelectionModal
        isOpen={starterModalOpen}
        onClose={() => setStarterModalOpen(false)}
        onSelected={() => {
          soundFx.playLevelUp();
          loadValdrData();
        }}
      />

      {/* Widget Interactivo del Oráculo de Johto (Gemini 2.5 Flash + Supabase) */}
      <OracleConsultWidget profileData={profileData} />

      {/* Consola mGBA en background */}
      <ArcadeRoomTheater />
    </div>
  );
}
