'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileTopHud } from './MobileTopHud';
import { MobileFloatingDock, MobileTab } from './MobileFloatingDock';
import { LockedPactBanner } from './LockedPactBanner';
import { VigorHeaderSummary } from './VigorHeaderSummary';
import { DailyVaultBar } from './DailyVaultBar';
import { RunicHabitCard } from './RunicHabitCard';
import { EconomySanctuary } from '@/components/economy/EconomySanctuary';
import { RanchSection } from '@/components/economy/RanchSection';
import { PartyPcManager } from './PartyPcManager';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Sparkles, 
  Flame, 
  Edit2, 
  Check, 
  X, 
  ShieldCheck, 
  Calendar, 
  User, 
  Scroll, 
  Gamepad2, 
  LogOut, 
  Package, 
  Sprout, 
  Users, 
  Zap 
} from 'lucide-react';

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

interface MobileDashboardLayoutProps {
  profileData: any;
  habits: HabitItem[];
  oaths: OathItem[];
  timeUntilMidnight: string;
  completionPercent: number;
  walletPokedollars: number;
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  sanctuaryTab: 'boveda' | 'rancho' | 'equipo';
  setSanctuaryTab: (tab: 'boveda' | 'rancho' | 'equipo') => void;
  pillarFilter: 'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad';
  setPillarFilter: (filter: 'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad') => void;
  temperanceConfirmedToday: boolean;
  submitting: boolean;
  // Handlers
  onHabitSeal: (habit: HabitItem, e?: React.MouseEvent) => void;
  onUndoHabitSeal: (habit: HabitItem) => void;
  onEditHabit: (habit: HabitItem) => void;
  onDeleteHabit: (habit: HabitItem) => void;
  onConfirmTemperance: () => void;
  onUpdateInnerBeast: (beast: string) => void;
  onOpenCreateHabit: () => void;
  onOpenCreateOath: () => void;
  onOpenDatePicker: () => void;
  onOpenGrimoire: () => void;
  onOpenOnboardingInitiation: () => void;
  onOpenArcadeRoom: () => void;
  showNotice: (message: string, title?: string, type?: 'info' | 'error' | 'success') => void;
}

export function MobileDashboardLayout({
  profileData,
  habits,
  oaths,
  timeUntilMidnight,
  completionPercent,
  walletPokedollars,
  activeTab,
  setActiveTab,
  sanctuaryTab,
  setSanctuaryTab,
  pillarFilter,
  setPillarFilter,
  temperanceConfirmedToday,
  submitting,
  onHabitSeal,
  onUndoHabitSeal,
  onEditHabit,
  onDeleteHabit,
  onConfirmTemperance,
  onUpdateInnerBeast,
  onOpenCreateHabit,
  onOpenCreateOath,
  onOpenDatePicker,
  onOpenGrimoire,
  onOpenOnboardingInitiation,
  onOpenArcadeRoom,
  showNotice,
}: MobileDashboardLayoutProps) {
  const [editingInnerBeast, setEditingInnerBeast] = useState(false);
  const [innerBeastInput, setInnerBeastInput] = useState('');

  const activeHabitsList = habits.filter(
    (h) => h.front_type === 'vigor' || h.front_type === 'expansion'
  );
  const completedHabitsCount = activeHabitsList.filter((h) => h.completed).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1F1E1B] flex flex-col font-sans select-none pb-28">
      {/* 1. Top HUD Móvil de Alto Impacto con Navegación Interactiva */}
      <MobileTopHud
        profileData={profileData}
        timeUntilMidnight={timeUntilMidnight}
        completionPercent={completionPercent}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'vault') setSanctuaryTab('boveda');
        }}
        onOpenVault={() => {
          setActiveTab('vault');
          setSanctuaryTab('boveda');
        }}
      />

      {/* 2. Contenedor Principal (Mobile-First / Desktop-Expansive) */}
      <main className={`flex-1 w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4 transition-all duration-200 ${
        activeTab === 'vault' ? 'max-w-4xl' : 'max-w-md'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          >
            {/* PESTAÑA 1: FRENTE DE VIGOR */}
            {activeTab === 'vigor' && (
              <div className="space-y-3">
                {/* Banner de Pacto Inquebrantable de Templanza */}
                <LockedPactBanner
                  oaths={oaths}
                  onOpenSanctuary={onOpenCreateOath}
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
                  onOpenOracle={onOpenCreateHabit}
                  onOpenDatePicker={onOpenDatePicker}
                />

                {/* Barra de Alijo Diario */}
                <DailyVaultBar
                  pendingGold={activeHabitsList
                    .filter((h) => h.completed)
                    .reduce((acc, curr) => acc + (curr.gold_reward || 0), 0)}
                  pendingBattery={activeHabitsList
                    .filter((h) => h.completed)
                    .reduce((acc, curr) => acc + (curr.game_battery_reward || 0), 0)}
                  completedTasks={completedHabitsCount}
                  totalTasks={activeHabitsList.length}
                  timeUntilMidnight={timeUntilMidnight}
                />

                {/* Chips de Filtro por Pilar */}
                {habits.filter((h) => h.front_type !== 'templanza').length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {(
                      [
                        { key: 'todos', label: 'Todos', color: 'bg-[#1C1B18] text-white border-[#1C1B18]', inactive: 'bg-white text-[#706E66] border-[#E4E1D8] hover:border-[#C5C2BA]' },
                        { key: 'vigor', label: '🏋 Vigor', color: 'bg-[#D9383A] text-white border-[#B22B2D]', inactive: 'bg-white text-[#D9383A] border-[#D9383A]/30 hover:border-[#D9383A]/60' },
                        { key: 'oficio', label: '💼 Oficio', color: 'bg-[#2D68C4] text-white border-[#1F4E99]', inactive: 'bg-white text-[#2D68C4] border-[#2D68C4]/30 hover:border-[#2D68C4]/60' },
                        { key: 'maestria', label: '📚 Maestría', color: 'bg-[#9A7025] text-white border-[#7A5A1E]', inactive: 'bg-white text-[#9A7025] border-[#C59B46]/30 hover:border-[#C59B46]/60' },
                        { key: 'claridad', label: '🧠 Claridad', color: 'bg-[#2E8555] text-white border-[#226040]', inactive: 'bg-white text-[#2E8555] border-[#2E8555]/30 hover:border-[#2E8555]/60' },
                      ] as const
                    ).map(({ key, label, color, inactive }) => {
                      const isActive = pillarFilter === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setPillarFilter(key);
                          }}
                          className={`shrink-0 px-3 py-1 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                            isActive ? color : inactive
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Listado Bento de Hábitos */}
                <div className="space-y-2">
                  {habits.filter((h) => h.front_type !== 'templanza').length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-[#E8E5DD] text-center space-y-3.5 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-[#D9383A]/10 border border-[#D9383A]/20 flex items-center justify-center text-[#D9383A] mx-auto shadow-xs">
                        <Plus className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-editorial text-base font-bold text-[#1C1B18]">
                          Sin misiones activas para hoy
                        </h3>
                        <p className="text-xs text-[#706E66] max-w-xs mx-auto mt-1 leading-relaxed">
                          Elige tus 4 hábitos esenciales (Vigor, Oficio, Maestría y Claridad) y sella tu Pacto de Templanza.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            onOpenOnboardingInitiation();
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#D9383A] hover:bg-[#C92F31] text-white text-xs font-mono font-bold tracking-wider shadow-[0_2px_0px_#B22B2D] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 stroke-[2.5]" />
                          <span>INICIAR CEREMONIA ONBOARDING (4 RETOS)</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenCreateHabit}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-[#E4E1D8] text-[#1C1B18] text-xs font-mono font-medium hover:bg-[#FAF9F5] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Crear Manual</span>
                        </button>
                      </div>
                    </div>
                  ) : (() => {
                    const pillarTypeMap: Record<string, string[]> = {
                      vigor: ['vigor'],
                      oficio: ['oficio', 'expansion'],
                      maestria: ['maestria'],
                      claridad: ['claridad'],
                    };
                    const filtered = habits.filter((h) => {
                      if (h.front_type === 'templanza') return false;
                      if (pillarFilter === 'todos') return true;
                      return (pillarTypeMap[pillarFilter] || []).includes(h.front_type);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-5 rounded-2xl bg-white border border-[#E8E5DD] text-center shadow-sm">
                          <p className="text-xs text-[#706E66] font-mono">
                            No hay misiones de este pilar todavía.
                          </p>
                          <button
                            type="button"
                            onClick={() => setPillarFilter('todos')}
                            className="mt-2 text-xs font-mono font-semibold text-[#D9383A] hover:underline cursor-pointer"
                          >
                            Ver todos
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((h) => (
                      <RunicHabitCard
                        key={h.id}
                        habit={h}
                        onSeal={(habitObj, e) => onHabitSeal(habitObj as HabitItem, e)}
                        onUndo={(habitObj) => onUndoHabitSeal(habitObj as HabitItem)}
                        onEdit={(habitObj) => onEditHabit(habitObj as HabitItem)}
                        onDelete={(habitObj) => onDeleteHabit(habitObj as HabitItem)}
                      />
                    ));
                  })()}
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
                              onClick={() => {
                                onUpdateInnerBeast(innerBeastInput);
                                setEditingInnerBeast(false);
                              }}
                              className="p-1.5 bg-[#2D68C4] hover:bg-[#255BB0] text-white rounded-lg cursor-pointer transition-all border border-[#1F4E99] active:scale-95"
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
                          setInnerBeastInput(profileData?.inner_beast || 'Porno & Masturbación');
                          setEditingInnerBeast(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE9] border border-[#E8E5DD] text-[11px] font-mono text-[#706E66] hover:text-[#1F1E1B] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Cambiar</span>
                      </button>
                    )}
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
                    <span className="text-xs text-[#3B7582] font-semibold uppercase tracking-wider block">
                      Días Invicto en Retención
                    </span>
                    {profileData?.journey_start_date && (
                      <span className="text-[10px] font-mono text-[#706E66] mt-1 inline-flex items-center gap-1 bg-[#FAF9F5] px-2 py-0.5 rounded-full border border-[#E8E5DD]">
                        <span>📅 Inicio oficial:</span>
                        <strong className="text-[#1F1E1B]">{profileData.journey_start_date}</strong>
                      </span>
                    )}
                  </div>

                  {/* Barra de Progreso */}
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

                  {/* Botón de confirmación */}
                  <button
                    disabled={temperanceConfirmedToday || submitting}
                    onClick={onConfirmTemperance}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none ${
                      temperanceConfirmedToday
                        ? 'bg-[#EBF7EE] text-[#15803D] cursor-default opacity-85'
                        : 'bg-[#2D68C4] hover:bg-[#255BB0] text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 fill-current" />
                    <span>
                      {temperanceConfirmedToday
                        ? '✓ ¡Hoy Permaneciste Invicto!'
                        : 'Marcar Victoria: Hoy no caí (+100 ₽)'}
                    </span>
                  </button>
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
                        ₽{walletPokedollars.toLocaleString('es-CO')}
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
                      onClick={onOpenDatePicker}
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
                      onClick={onOpenCreateOath}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D9383A] hover:bg-[#C92F31] text-white text-[11px] font-bold cursor-pointer border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Pacto</span>
                    </button>
                  </div>

                  {oaths.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#FAF9F5] border border-dashed border-[#E8E5DD] text-center space-y-2">
                      <p className="text-xs text-[#706E66]">No tienes juramentos activos en curso.</p>
                      <button
                        onClick={onOpenCreateOath}
                        className="px-3.5 py-2 bg-[#D9383A] hover:bg-[#C92F31] text-white font-bold text-xs rounded-xl border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none cursor-pointer inline-flex items-center gap-1.5 transition-all"
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Tarjeta 3: Cierre de Sesión */}
                <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-[#1F1E1B] block">Cerrar Sesión</span>
                    <span className="text-[11px] text-[#706E66]">Salir de la cuenta en este dispositivo</span>
                  </div>
                  <button
                    onClick={async () => {
                      soundFx.playClick();
                      await supabase.auth.signOut();
                      window.location.href = '/login';
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium cursor-pointer active:scale-95 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Salir</span>
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: SANTUARIO & BÓVEDA ANCESTRAL */}
            {activeTab === 'vault' && (
              <div className="space-y-4">
                <div className="border-l-2 border-[#D4A359] pl-3 py-1">
                  <h2 className="font-editorial text-sm font-semibold text-[#1F1E1B] tracking-tight">
                    Santuario & Inyección .SAV
                  </h2>
                  <p className="text-xs text-[#706E66]">
                    Inspecciona tu equipo, recolecta en el rancho y despacha suministros a Pokémon Heart & Soul.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD]">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSanctuaryTab('boveda');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sanctuaryTab === 'boveda'
                        ? 'bg-white text-[#1F1E1B] font-semibold shadow-sm border border-[#E8E5DD]'
                        : 'text-[#706E66] hover:text-[#1F1E1B]'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-[#D97043]" />
                    <span className="truncate">Bóveda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSanctuaryTab('rancho');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sanctuaryTab === 'rancho'
                        ? 'bg-white text-[#1F1E1B] font-semibold shadow-sm border border-[#E8E5DD]'
                        : 'text-[#706E66] hover:text-[#1F1E1B]'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5 text-[#5A7D62]" />
                    <span className="truncate">Rancho 4h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSanctuaryTab('equipo');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sanctuaryTab === 'equipo'
                        ? 'bg-white text-[#1F1E1B] font-semibold shadow-sm border border-[#E8E5DD]'
                        : 'text-[#706E66] hover:text-[#1F1E1B]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#4A8B99]" />
                    <span className="truncate">Equipo & PC</span>
                  </button>
                </div>

                {sanctuaryTab === 'boveda' && (
                  <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm">
                    <EconomySanctuary initialTab="boveda" />
                  </div>
                )}

                {sanctuaryTab === 'rancho' && (
                  <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3 shadow-sm">
                    <RanchSection />
                  </div>
                )}

                {sanctuaryTab === 'equipo' && (
                  <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3 sm:p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
                    <PartyPcManager />
                  </div>
                )}
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
                    onClick={onOpenArcadeRoom}
                    className="w-full py-3.5 bg-[#D9383A] hover:bg-[#C92F31] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none transition-all tracking-wide uppercase"
                  >
                    <Zap className="w-4 h-4 fill-current text-[#FFE600]" />
                    <span>Encender Cartucho</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Dock Táctil Flotante Inferior */}
      <MobileFloatingDock
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenGrimoire={onOpenGrimoire}
      />
    </div>
  );
}
