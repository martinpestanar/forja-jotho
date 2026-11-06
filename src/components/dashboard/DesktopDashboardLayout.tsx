'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  ShieldCheck, 
  Package, 
  Sprout, 
  Users, 
  Sparkles,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  Gamepad2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DesktopTopBar } from './DesktopTopBar';
import { DesktopCompanionDeck, DesktopLedgerTab } from './DesktopCompanionDeck';
import { RunicHabitCard } from './RunicHabitCard';
import { RunicPilgrimageTrail } from './RunicPilgrimageTrail';
import { LockedPactBanner } from './LockedPactBanner';
import { DailyVaultBar } from './DailyVaultBar';
import { GoldenrodVaultChest } from './GoldenrodVaultChest';
import { EconomySanctuary } from '@/components/economy/EconomySanctuary';
import { RanchSection } from '@/components/economy/RanchSection';
import { PartyPcManager } from './PartyPcManager';
import { soundFx } from '@/lib/soundFx';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';

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

interface DesktopDashboardLayoutProps {
  profileData: any;
  habits: HabitItem[];
  oaths: OathItem[];
  timeUntilMidnight: string;
  completionPercent: number;
  walletPokedollars: number;
  batteryMinutes: number;
  pillarFilter: 'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad';
  setPillarFilter: (filter: 'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad') => void;
  temperanceConfirmedToday: boolean;
  submitting: boolean;
  // Acciones
  onHabitSeal: (habit: HabitItem, e?: React.MouseEvent) => void;
  onEditHabit: (habit: HabitItem) => void;
  onConfirmTemperance: () => void;
  onUpdateInnerBeast: (beast: string) => void;
  onOpenCreateHabit: () => void;
  onOpenCreateOath: () => void;
  onOpenDatePicker: () => void;
  onOpenGrimoire: () => void;
  onOpenJournal: () => void;
  onOpenSilphTuner: () => void;
  onOpenTutorial: () => void;
  onOpenOracle: () => void;
  onOpenTheater: () => void;
}

export function DesktopDashboardLayout({
  profileData,
  habits,
  oaths,
  timeUntilMidnight,
  completionPercent,
  walletPokedollars,
  batteryMinutes,
  pillarFilter,
  setPillarFilter,
  temperanceConfirmedToday,
  submitting,
  onHabitSeal,
  onEditHabit,
  onConfirmTemperance,
  onUpdateInnerBeast,
  onOpenCreateHabit,
  onOpenCreateOath,
  onOpenDatePicker,
  onOpenGrimoire,
  onOpenJournal,
  onOpenSilphTuner,
  onOpenTutorial,
  onOpenOracle,
  onOpenTheater,
}: DesktopDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DesktopLedgerTab>('vigor');
  const party = profileData?.gba_party_json || [];

  // Pilares
  const pillarsList: Array<{
    key: 'todos' | 'vigor' | 'oficio' | 'maestria' | 'claridad';
    label: string;
    color: string;
    inactive: string;
  }> = [
    { key: 'todos', label: 'Todos', color: 'bg-[#1C1B18] text-white border-[#1C1B18]', inactive: 'bg-[#FAF9F5] text-[#706E66] border-[#E8E5DD] hover:bg-white' },
    { key: 'vigor', label: 'Vigor', color: 'bg-[#D9383A] text-white border-[#B22B2D]', inactive: 'bg-[#D9383A]/6 text-[#B22B2D] border-[#D9383A]/20 hover:bg-[#D9383A]/10' },
    { key: 'oficio', label: 'Oficio', color: 'bg-[#C59B46] text-white border-[#9A7025]', inactive: 'bg-[#C59B46]/8 text-[#9A7025] border-[#C59B46]/25 hover:bg-[#C59B46]/15' },
    { key: 'maestria', label: 'Maestría', color: 'bg-[#2D68C4] text-white border-[#1F4E96]', inactive: 'bg-[#2D68C4]/6 text-[#1F4E96] border-[#2D68C4]/20 hover:bg-[#2D68C4]/10' },
    { key: 'claridad', label: 'Claridad', color: 'bg-[#2E8555] text-white border-[#1E603B]', inactive: 'bg-[#2E8555]/6 text-[#1E603B] border-[#2E8555]/20 hover:bg-[#2E8555]/10' },
  ];

  const pillarTypeMap: Record<string, string[]> = {
    todos: ['vigor', 'expansion', 'oficio', 'maestria', 'claridad'],
    vigor: ['vigor'],
    oficio: ['oficio'],
    maestria: ['maestria', 'expansion'],
    claridad: ['claridad'],
  };

  const filteredHabits = habits.filter((h) => {
    return (pillarTypeMap[pillarFilter] || []).includes(h.front_type);
  });

  const activeHabitsList = habits.filter(
    (h) => h.front_type === 'vigor' || h.front_type === 'expansion'
  );
  const completedCount = activeHabitsList.filter((h) => h.completed).length;

  const earnedGoldToday = activeHabitsList
    .filter((h) => h.completed)
    .reduce((acc, curr) => acc + (curr.gold_reward || 0), 0);

  const earnedBatteryToday = activeHabitsList
    .filter((h) => h.completed)
    .reduce((acc, curr) => acc + (curr.game_battery_reward || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1F1E1B] flex flex-col font-sans select-none antialiased">
      {/* 1. Header Desktop Superior */}
      <DesktopTopBar
        profileData={profileData}
        timeUntilMidnight={timeUntilMidnight}
        completionPercent={completionPercent}
        walletPokedollars={walletPokedollars}
        batteryMinutes={batteryMinutes}
        onOpenGrimoire={onOpenGrimoire}
        onOpenJournal={onOpenJournal}
        onOpenSilphTuner={onOpenSilphTuner}
        onOpenTutorial={onOpenTutorial}
        onOpenOracle={onOpenOracle}
      />

      {/* 2. Estación Editorial en PC: Deck Izquierdo (310px) + Libro Mayor Central (flex-1) + Panel Lateral Diario (320px) */}
      <div className="max-w-7xl w-full mx-auto px-6 py-6 flex gap-6 items-start flex-1">
        {/* Columna Izquierda: Pocket Deck & Companion */}
        <DesktopCompanionDeck
          profileData={profileData}
          activeTab={activeTab}
          batteryMinutes={batteryMinutes}
          onSelectTab={setActiveTab}
          onOpenCreateHabit={onOpenCreateHabit}
          onOpenTheater={onOpenTheater}
        />

        {/* Columna Central: The Editorial Ledger */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* VISTA 1: MISIONES DIARIAS (VIGOR) */}
          {activeTab === 'vigor' && (
            <div className="space-y-4">
              {/* Encabezado Editorial del Libro Mayor */}
              <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-editorial text-base font-semibold text-[#1C1B18] tracking-tight">
                      Misiones del Soberano
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EAE7DF] text-[#706E66]">
                      {completedCount}/{activeHabitsList.length} COMPLETADAS
                    </span>
                  </div>
                  <p className="text-xs text-[#706E66] mt-0.5">
                    Ejecuta tus disciplinas físicas, de trabajo y templanza para nutrir a tu inicial.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenDatePicker}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs font-mono font-semibold text-[#1C1B18] hover:bg-white hover:border-[#D9383A]/30 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#2D68C4]" />
                    <span>Fecha Inicio</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenCreateHabit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9383A] text-white text-xs font-mono font-bold hover:bg-[#C92F31] border border-[#B22B2D] shadow-[0_2px_0px_#A02426] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Hábito</span>
                  </button>
                </div>
              </div>

              {/* Filtros de Pilares Rúnicos */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F2EFE9] border border-[#E4E1D8]">
                {pillarsList.map(({ key, label, color, inactive }) => {
                  const isActive = pillarFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setPillarFilter(key);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        isActive ? color : inactive
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Listado Bento de Hábitos Rúnicos */}
              <div className="space-y-2.5">
                {filteredHabits.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-[#E4E1D8] text-center shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2">
                    <p className="text-xs text-[#706E66] font-mono">
                      No hay misiones registradas bajo este pilar.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPillarFilter('todos')}
                      className="text-xs font-mono font-semibold text-[#D9383A] hover:underline cursor-pointer"
                    >
                      Ver todas las misiones
                    </button>
                  </div>
                ) : (
                  filteredHabits.map((h) => (
                    <RunicHabitCard
                      key={h.id}
                      habit={h}
                      onSeal={(habitObj, e) => onHabitSeal(habitObj as HabitItem, e)}
                      onEdit={(habitObj) => onEditHabit(habitObj as HabitItem)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: PASE DE TEMPLANZA (SENDERO TOPOGRAFICO 30 DIAS) */}
          {activeTab === 'templanza' && (
            <RunicPilgrimageTrail
              currentStreak={profileData?.temperance_streak_days ?? 0}
              journeyStartDate={profileData?.journey_start_date}
              confirmedToday={temperanceConfirmedToday}
              submitting={submitting}
              onConfirmVictory={onConfirmTemperance}
              onOpenDatePicker={onOpenDatePicker}
            />
          )}

          {/* VISTA 3: CARTUCHO GBA (ENTRADA INMERSIVA DEDICADA) */}
          {activeTab === 'game' && (
            <div className="bg-white border border-[#E4E1D8] rounded-2xl p-8 shadow-[0_2px_8px_rgba(26,25,21,0.04)] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2E8555]/10 border-2 border-[#2E8555]/25 flex items-center justify-center text-[#2E8555] mx-auto">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#1C1B18]">
                  Pokémon Heart & Soul (Consola mGBA)
                </h3>
                <p className="text-xs text-[#706E66] max-w-sm mx-auto mt-1">
                  Tu cartucho está listo. Abre la pantalla completa dedicada con 60 FPS, audio nítido y guardado en la nube con Supabase.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playLevelUp();
                    onOpenTheater();
                  }}
                  className="px-6 py-3 rounded-xl bg-[#2E8555] hover:bg-[#257248] text-white font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Iniciar Inmersión Total</span>
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: BÓVEDA ANCESTRAL */}
          {activeTab === 'boveda' && (
            <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
              <EconomySanctuary initialTab="boveda" />
            </div>
          )}

          {/* VISTA 5: RANCHO 4H */}
          {activeTab === 'rancho' && (
            <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
              <RanchSection />
            </div>
          )}

          {/* VISTA 6: EQUIPO & PC BOX 1 */}
          {activeTab === 'equipo' && (
            <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)]">
              <PartyPcManager />
            </div>
          )}

          {/* VISTA 7: AJUSTES & PACTOS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-3">
                <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2.5">
                  <span className="text-xs font-semibold text-[#1C1B18] uppercase tracking-wide">
                    Pactos & Contratos Activos
                  </span>
                  <button
                    onClick={onOpenCreateOath}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D9383A] text-white text-[11px] font-bold cursor-pointer border border-[#B22B2D] shadow-[0_2px_0px_#A02426]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Pacto</span>
                  </button>
                </div>

                {oaths.length === 0 ? (
                  <p className="text-xs text-[#706E66] py-3 text-center">No tienes juramentos activos.</p>
                ) : (
                  <div className="space-y-2">
                    {oaths.map((o) => (
                      <div key={o.id} className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1C1B18]">{o.title}</span>
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#2E8555]/10 text-[#2E8555]">
                            {o.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#706E66] italic mt-1">"{o.front_vow}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Columna Derecha: Caja Fuerte de Trigal & Resumen de ROM */}
        <GoldenrodVaultChest
          pendingGold={earnedGoldToday}
          pendingBattery={earnedBatteryToday}
          completedTasks={completedCount}
          totalTasks={activeHabitsList.length}
          timeUntilMidnight={timeUntilMidnight}
          party={party}
          onOpenVault={() => setActiveTab('equipo')}
        />
      </div>
    </div>
  );
}
