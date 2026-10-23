'use client';

import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

type ValdrTab = 'vigor' | 'templanza' | 'vault' | 'game' | 'market';

interface HabitItem {
  id: string;
  front_type: 'vigor' | 'templanza' | 'expansion';
  title: string;
  subtitle: string;
  duration_minutes: number;
  gold_reward: number;
  game_battery_reward: number;
  requires_proof: boolean;
  completed?: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ValdrTab>('vigor');
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [proofModalHabit, setProofModalHabit] = useState<HabitItem | null>(null);
  const [proofText, setProofText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);

  // Contador regresivo hasta la medianoche (Reloj de Asedio)
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

  // Cargar Perfil y Hábitos desde Supabase
  const loadValdrData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Perfil Valdr
    const { data: prof } = await supabase
      .from('valdr_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) setProfileData(prof);

    // Catálogo de Hábitos y Registros de hoy
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
  };

  useEffect(() => {
    loadValdrData();
  }, []);

  // Completar Hábito
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
          <span>CIERRE DEL DÍA:</span>
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
          Frente de Vigor
        </button>
        <button
          onClick={() => setActiveTab('templanza')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'templanza'
              ? 'bg-[#4E9F9F]/15 text-[#4E9F9F] border border-[#4E9F9F]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Templanza (Retención)
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-3 py-2 rounded-md whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'vault'
              ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Bóveda Ancestral
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
        {/* PESTAÑA: FRENTE DE VIGOR */}
        {activeTab === 'vigor' && (
          <div className="space-y-3">
            <div className="border-l-2 border-[#C5A059] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                Frente del Vigor & Creación
              </h2>
              <p className="text-xs text-[#64748B]">
                Conquista tus bloques diarios para ganar Oro de Forja y Batería de Cartucho.
              </p>
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

        {/* PESTAÑA: FRENTE DE TEMPLANZA */}
        {activeTab === 'templanza' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#4E9F9F] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#4E9F9F] uppercase tracking-wider">
                Santuario Mayor de Templanza
              </h2>
              <p className="text-xs text-[#64748B]">
                Voto Inviolable: 30 Días de Retención Seminal y Cero Vicios de Dopamina Barata.
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

              <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                <button
                  onClick={() => alert('¡Honor al clan! Mantente firme.')}
                  className="w-full py-2.5 rounded-lg bg-[#4E9F9F]/20 text-[#4E9F9F] border border-[#4E9F9F]/40 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Confirmar Victoria de Hoy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: BÓVEDA ANCESTRAL & EQUIPO GBA */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[#C5A059] pl-3 py-1">
              <h2 className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">
                Bóveda Ancestral & Inyección .SAV
              </h2>
              <p className="text-xs text-[#64748B]">
                Revisa tu equipo y despacha suministros ganados directamente a Pokémon Heart & Soul.
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

        {/* PESTAÑA: EMULADOR GBA */}
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
                  El juego se apagará automáticamente si la batería llega a 0m. Gana más vigor cumpliendo tus hábitos reales.
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

      {/* Modal de Comprobante / Registro de Batalla */}
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
