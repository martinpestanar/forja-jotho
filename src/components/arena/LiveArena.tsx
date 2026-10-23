'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Droplets, 
  Sprout, 
  Zap, 
  Swords, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  Sparkles,
  Users,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';
import { NatureRole } from '@/types/trainer';
import { soundFx } from '@/lib/soundFx';

interface SquadMemberMission {
  role: NatureRole;
  title: string;
  badge: string;
  instruction: string;
  testQuestion: string;
  correctAnswer: string;
  options: string[];
}

const ROLE_MISSIONS: Record<NatureRole, SquadMemberMission> = {
  fuego_ui: {
    role: 'fuego_ui',
    title: 'Cable Fuego: Vanguardia UI',
    badge: 'TERMINAL VISUAL',
    instruction: 'Activa el render de la interfaz reactiva para estabilizar la pantalla de combate.',
    testQuestion: '¿Qué hook de React mantiene el estado persistente sin re-renderizar todo el árbol?',
    correctAnswer: 'useCallback / useMemo con dependencias atómicas',
    options: [
      'useCallback / useMemo con dependencias atómicas',
      'window.location.reload() constante',
      'Variables globales sin React',
      'Duplicar el componente en el DOM',
    ],
  },
  agua_data: {
    role: 'agua_data',
    title: 'Cable Agua: Guardián de Datos',
    badge: 'BLINDAJE RLS',
    instruction: 'Sincroniza la tabla arena_rooms con el canal Supabase Realtime.',
    testQuestion: '¿Qué directiva de PostgreSQL permite a los clientes escuchar cambios en tiempo real?',
    correctAnswer: 'ALTER PUBLICATION supabase_realtime ADD TABLE',
    options: [
      'ALTER PUBLICATION supabase_realtime ADD TABLE',
      'DROP DATABASE IF EXISTS arena',
      'SELECT * FROM public sin filtros',
      'DELETE FROM arena_rooms CASCADE',
    ],
  },
  planta_bots: {
    role: 'planta_bots',
    title: 'Cable Planta: Conector de APIs',
    badge: 'DISPATCHER n8n',
    instruction: 'Alinea la tubería del webhook asíncrono para notificar el ataque combinado.',
    testQuestion: '¿Qué extensión nativa de Supabase despacha POST HTTP asíncronos a n8n?',
    correctAnswer: 'pg_net (net.http_post)',
    options: [
      'pg_net (net.http_post)',
      'console.log en terminal',
      'curl manual desde bash',
      'alert() en el cliente',
    ],
  },
};

interface LiveArenaProps {
  roomPin?: string;
  squadId?: string;
}

export const LiveArena: React.FC<LiveArenaProps> = ({
  roomPin = 'JOHT',
  squadId = 'squad_1',
}) => {
  const profile = useTrainerStore((s) => s.profile);
  const userRole = (profile?.nature_role || 'fuego_ui') as NatureRole;
  const currentMission = ROLE_MISSIONS[userRole];

  const [bossHp, setBossHp] = useState<number>(100);
  const [bossName, setBossName] = useState<string>('Código Silver - Titán Cyber-Johto');
  const [status, setStatus] = useState<string>('active');
  const [cablesState, setCablesState] = useState<{
    fuego_ui: boolean;
    agua_data: boolean;
    planta_bots: boolean;
  }>({ fuego_ui: false, agua_data: false, planta_bots: false });

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCableActivated, setIsCableActivated] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [shakeBoss, setShakeBoss] = useState<boolean>(false);
  const [showComboAnimation, setShowComboAnimation] = useState<boolean>(false);

  // 1. Cargar estado inicial de la sala
  const fetchRoom = useCallback(async () => {
    const { data, error } = await supabase
      .from('arena_rooms')
      .select('*')
      .eq('room_pin', roomPin)
      .single();

    if (data && !error) {
      setBossHp(data.boss_hp);
      setBossName(data.boss_name);
      setStatus(data.status);

      const cablesJson = data.squad_cables_json || {};
      const squadData = cablesJson[squadId] || {
        fuego_ui: cablesJson.fuego_ui || false,
        agua_data: cablesJson.agua_data || false,
        planta_bots: cablesJson.planta_bots || false,
      };

      setCablesState({
        fuego_ui: !!squadData.fuego_ui,
        agua_data: !!squadData.agua_data,
        planta_bots: !!squadData.planta_bots,
      });

      if (squadData[userRole]) {
        setIsCableActivated(true);
      }
    }
  }, [roomPin, squadId, userRole]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // 2. Suscribirse a Supabase Realtime en arena_rooms
  useEffect(() => {
    const channel = supabase
      .channel(`arena-room-${roomPin}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'arena_rooms',
          filter: `room_pin=eq.${roomPin}`,
        },
        (payload) => {
          const newRoom = payload.new as any;
          if (!newRoom) return;

          // Detectar disminución de vida para disparar animación de Ataque Combinado
          setBossHp((prevHp) => {
            if (newRoom.boss_hp < prevHp) {
              soundFx.playHit();
              setShakeBoss(true);
              setShowComboAnimation(true);
              setTimeout(() => setShakeBoss(false), 600);
              setTimeout(() => setShowComboAnimation(false), 2500);

              confetti({
                particleCount: 60,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#F59E0B', '#06B6D4', '#22C55E', '#EF4444'],
              });
            }
            return newRoom.boss_hp;
          });

          setStatus(newRoom.status);
          const cablesJson = newRoom.squad_cables_json || {};
          const squadData = cablesJson[squadId] || {
            fuego_ui: cablesJson.fuego_ui || false,
            agua_data: cablesJson.agua_data || false,
            planta_bots: cablesJson.planta_bots || false,
          };

          setCablesState({
            fuego_ui: !!squadData.fuego_ui,
            agua_data: !!squadData.agua_data,
            planta_bots: !!squadData.planta_bots,
          });

          if (squadData[userRole]) {
            setIsCableActivated(true);
          } else {
            // Si el backend reseteó los cables luego de un combo exitoso
            setIsCableActivated(false);
            setSelectedOption(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomPin, squadId, userRole]);

  // 3. Activar cable atómicamente vía RPC
  const handleActivateCable = async (opt: string) => {
    if (isActivating || isCableActivated) return;
    soundFx.playClick();
    setSelectedOption(opt);

    if (opt !== currentMission.correctAnswer) {
      soundFx.playHit();
      alert('¡Señal inestable! Esa respuesta no blindará tu cable de red.');
      return;
    }

    setIsActivating(true);
    soundFx.playCoin();

    try {
      const { data, error } = await supabase.rpc('rpc_activate_squad_cable', {
        p_room_pin: roomPin,
        p_squad_id: squadId,
        p_cable_role: userRole,
      });

      if (error) {
        console.error('Error in rpc_activate_squad_cable:', error.message);
      } else {
        setIsCableActivated(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivating(false);
    }
  };

  const getRoleIcon = (role: NatureRole) => {
    switch (role) {
      case 'fuego_ui':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'agua_data':
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case 'planta_bots':
        return <Sprout className="w-5 h-5 text-emerald-400" />;
    }
  };

  const activeCablesCount = Object.values(cablesState).filter(Boolean).length;

  return (
    <div className="w-full bg-[#0a0f1d] border-2 border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl font-mono text-slate-100 flex flex-col gap-5 relative overflow-hidden">
      {/* Animación Triunfal de Ataque Combinado de 3 Cables */}
      <AnimatePresence>
        {showComboAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-cyan-400 to-emerald-400 p-1 flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(245,158,11,0.8)]"
            >
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-amber-300 fill-amber-300 animate-pulse" />
              </div>
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-300 uppercase tracking-widest">
              ¡ATAQUE COMBINADO DE 3 CABLES!
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Interfaz, Datos y Webhook sincronizados. Sobrecarga crítica: <strong className="text-rose-400">-25 HP al Titán</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera del Jefe de Arena */}
      <div className="p-4 bg-slate-950/80 border-2 border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={shakeBoss ? { x: [-12, 12, -12, 12, 0], scale: [1, 0.9, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 rounded-xl bg-rose-950/60 border-2 border-rose-500/80 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] shrink-0"
          >
            <Swords className="w-7 h-7" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider">
                JEFE DE GIMNASIO CO-OP
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40 font-bold">
                SALA {roomPin}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-100">{bossName}</h3>
          </div>
        </div>

        {/* Barra de Vida del Boss */}
        <div className="w-full sm:w-64 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">ENERGÍA DEL BOSS</span>
            <span className={bossHp <= 25 ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400'}>
              {bossHp}% HP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-inner">
            <motion.div
              animate={{ width: `${bossHp}%` }}
              transition={{ type: 'spring', damping: 15 }}
              className={`h-full ${
                bossHp <= 25
                  ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Radar de los 3 Cables del Escuadrón */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-slate-200">
              Cables del Escuadrón ({squadId.toUpperCase()}):
            </span>
          </div>
          <span className="text-xs font-black text-amber-400">
            {activeCablesCount}/3 CONECTADOS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cable Fuego */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              cablesState.fuego_ui
                ? 'bg-amber-950/40 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${cablesState.fuego_ui ? 'text-amber-400' : 'text-slate-600'}`} />
              <div>
                <div className="text-xs font-black">Cable Fuego</div>
                <div className="text-[10px] opacity-75">Vanguardia UI</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase">
              {cablesState.fuego_ui ? '⚡ ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Cable Agua */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              cablesState.agua_data
                ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Droplets className={`w-5 h-5 ${cablesState.agua_data ? 'text-cyan-400' : 'text-slate-600'}`} />
              <div>
                <div className="text-xs font-black">Cable Agua</div>
                <div className="text-[10px] opacity-75">Guardián Data</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase">
              {cablesState.agua_data ? '⚡ ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Cable Planta */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              cablesState.planta_bots
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sprout className={`w-5 h-5 ${cablesState.planta_bots ? 'text-emerald-400' : 'text-slate-600'}`} />
              <div>
                <div className="text-xs font-black">Cable Planta</div>
                <div className="text-[10px] opacity-75">Conector APIs</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase">
              {cablesState.planta_bots ? '⚡ ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Misión Asignada al Alumno Según su Rol */}
      <div className="p-4 bg-slate-900/80 border-2 border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {getRoleIcon(userRole)}
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                TU MISIÓN EN VIVO · {currentMission.badge}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-100">{currentMission.title}</h4>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
              isCableActivated
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
            }`}
          >
            {isCableActivated ? '✓ CABLE CONECTADO' : 'CABLE PENDIENTE'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {currentMission.instruction} Responde la validación para enviar tu señal a PostgreSQL:
        </p>

        {/* Tarjeta de Validación de Código */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <div className="text-xs font-bold text-slate-200">
            &ldquo;{currentMission.testQuestion}&rdquo;
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentMission.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={idx}
                  disabled={isCableActivated || isActivating}
                  onClick={() => handleActivateCable(opt)}
                  className={`p-3 rounded-lg border text-xs text-left font-bold transition-all cursor-pointer disabled:opacity-60 ${
                    isSelected
                      ? isCableActivated
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {isSelected && isCableActivated && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
