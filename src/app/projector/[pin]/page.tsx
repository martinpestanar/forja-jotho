'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Swords, 
  Zap, 
  ShieldAlert, 
  Pause, 
  Play, 
  Radio, 
  Sparkles, 
  Award, 
  RefreshCw,
  Flame,
  Droplets,
  Sprout,
  Volume2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

interface SquadStatus {
  fuego_ui: boolean;
  agua_data: boolean;
  planta_bots: boolean;
}

interface ProjectorPageProps {
  params: Promise<{ pin: string }>;
}

export default function ProjectorPage({ params }: ProjectorPageProps) {
  const resolvedParams = use(params);
  const roomPin = (resolvedParams?.pin || 'JOHT').toUpperCase();

  const [bossHp, setBossHp] = useState<number>(100);
  const [bossName, setBossName] = useState<string>('Código Silver - Titán Cyber-Johto');
  const [timerSeconds, setTimerSeconds] = useState<number>(1500);
  const [status, setStatus] = useState<string>('active');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [shakeBoss, setShakeBoss] = useState<boolean>(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);

  const [squads, setSquads] = useState<Record<string, SquadStatus>>({
    squad_1: { fuego_ui: false, agua_data: false, planta_bots: false },
    squad_2: { fuego_ui: false, agua_data: false, planta_bots: false },
    squad_3: { fuego_ui: false, agua_data: false, planta_bots: false },
    squad_4: { fuego_ui: false, agua_data: false, planta_bots: false },
  });

  // 1. Cargar estado inicial de la sala desde Supabase
  const loadRoom = useCallback(async () => {
    const { data, error } = await supabase
      .from('arena_rooms')
      .select('*')
      .eq('room_pin', roomPin)
      .single();

    if (data && !error) {
      setBossHp(data.boss_hp);
      setBossName(data.boss_name);
      setTimerSeconds(data.timer_seconds);
      setStatus(data.status);

      const json = data.squad_cables_json || {};
      setSquads({
        squad_1: json.squad_1 || { fuego_ui: json.fuego_ui || false, agua_data: json.agua_data || false, planta_bots: json.planta_bots || false },
        squad_2: json.squad_2 || { fuego_ui: false, agua_data: false, planta_bots: false },
        squad_3: json.squad_3 || { fuego_ui: false, agua_data: false, planta_bots: false },
        squad_4: json.squad_4 || { fuego_ui: false, agua_data: false, planta_bots: false },
      });
    }
  }, [roomPin]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // 2. Suscribirse a Supabase Realtime para recibir ataques en vivo
  useEffect(() => {
    const channel = supabase
      .channel(`projector-room-${roomPin}`)
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

          setBossHp((prev) => {
            if (newRoom.boss_hp < prev) {
              soundFx.playHit();
              setShakeBoss(true);
              setTimeout(() => setShakeBoss(false), 800);

              confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#F59E0B', '#EF4444', '#06B6D4', '#10B981'],
              });
            }
            return newRoom.boss_hp;
          });

          setStatus(newRoom.status);
          const json = newRoom.squad_cables_json || {};
          setSquads({
            squad_1: json.squad_1 || { fuego_ui: json.fuego_ui || false, agua_data: json.agua_data || false, planta_bots: json.planta_bots || false },
            squad_2: json.squad_2 || { fuego_ui: false, agua_data: false, planta_bots: false },
            squad_3: json.squad_3 || { fuego_ui: false, agua_data: false, planta_bots: false },
            squad_4: json.squad_4 || { fuego_ui: false, agua_data: false, planta_bots: false },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomPin]);

  // Temporizador de sala sincronizado
  useEffect(() => {
    if (isPaused || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, timerSeconds]);

  // Controles del Profesor
  const handleTogglePause = () => {
    soundFx.playClick();
    setIsPaused((p) => !p);
  };

  const handleBroadcastHint = () => {
    soundFx.playCoin();
    setGlobalAnnouncement('¡PISTA GLOBAL: Revisen la política RLS antes de emitir la señal!');
    setTimeout(() => setGlobalAnnouncement(null), 7000);
  };

  const handleResetBoss = async () => {
    soundFx.playClick();
    await supabase
      .from('arena_rooms')
      .update({
        boss_hp: 100,
        status: 'active',
        squad_cables_json: {
          squad_1: { fuego_ui: false, agua_data: false, planta_bots: false },
          squad_2: { fuego_ui: false, agua_data: false, planta_bots: false },
          squad_3: { fuego_ui: false, agua_data: false, planta_bots: false },
          squad_4: { fuego_ui: false, agua_data: false, planta_bots: false },
        },
      })
      .eq('room_pin', roomPin);

    setBossHp(100);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
  const qrUrl = `${currentOrigin}/dashboard?room=${roomPin}`;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-mono p-4 sm:p-8 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Barra Superior del Proyector */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 border-2 border-rose-500/80 rounded-xl text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            <Swords className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-rose-400 font-black tracking-widest uppercase">
              MODO PROYECTOR // CLASE EN VIVO SÁBADO
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">{bossName}</h1>
          </div>
        </div>

        {/* PIN de 4 Letras & Temporizador Gigante */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-900 border-2 border-amber-500/80 rounded-xl text-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <span className="text-[10px] text-slate-400 font-bold block">PIN DE SALA</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-widest">{roomPin}</span>
          </div>

          <div className={`px-4 py-2 rounded-xl border-2 text-center shadow-inner ${
            timerSeconds <= 180 ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-cyan-500/80 text-cyan-300'
          }`}>
            <span className="text-[10px] text-slate-400 font-bold block">CRONÓMETRO</span>
            <span className="text-2xl sm:text-3xl font-black tracking-widest">{formatTime(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Pista Global Transmitida por el Profesor */}
      <AnimatePresence>
        {globalAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="my-3 p-3 bg-amber-500/20 border-2 border-amber-500 rounded-xl text-amber-300 text-center font-bold text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
          >
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{globalAnnouncement}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cuerpo Principal: Radar de Escuadrones + Barra de Vida del Titán */}
      <main className="my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Lado QR & Controles de Profesor (3 Columnas) */}
        <div className="lg:col-span-3 bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xl">
          <div className="p-3 bg-white rounded-xl shadow-lg mb-3">
            <QRCodeSVG value={qrUrl} size={150} level="H" />
          </div>
          <span className="text-xs font-bold text-amber-300 uppercase">ESCANEA PARA UNIRTE</span>
          <span className="text-[10px] text-slate-500 mt-0.5">{qrUrl}</span>

          {/* Panel de Mandos del Profesor */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Controles de Profesor
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTogglePause}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>

              <button
                onClick={handleResetBoss}
                className="py-2 px-3 bg-slate-900 border border-slate-700 hover:border-rose-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Boss</span>
              </button>
            </div>

            <button
              onClick={handleBroadcastHint}
              className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 rounded-lg text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Enviar Pista Global</span>
            </button>
          </div>
        </div>

        {/* Centro y Radar: 4 Escuadrones (9 Columnas) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Barra Gigante de Vida del Titán */}
          <div className="bg-slate-950/90 border-2 border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between text-sm sm:text-base font-black mb-2">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 uppercase tracking-wider">ENERGÍA DEL TITÁN</span>
                <span className="text-xs text-slate-500">(12 Alumnos Máx.)</span>
              </div>
              <span className={`text-xl font-mono font-black ${bossHp <= 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {bossHp}% HP
              </span>
            </div>

            <div className="w-full h-6 bg-slate-900 rounded-full border-2 border-slate-700 overflow-hidden shadow-inner">
              <motion.div
                animate={{ width: `${bossHp}%` }}
                transition={{ type: 'spring', damping: 15 }}
                className={`h-full ${
                  bossHp <= 25
                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(34,197,94,0.7)]'
                }`}
              />
            </div>
          </div>

          {/* Tablero Radar de los 4 Escuadrones (Hasta 12 alumnos en vivo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['squad_1', 'squad_2', 'squad_3', 'squad_4'].map((sqId, idx) => {
              const sq = squads[sqId] || { fuego_ui: false, agua_data: false, planta_bots: false };
              const connected = [sq.fuego_ui, sq.agua_data, sq.planta_bots].filter(Boolean).length;
              const isCombo = connected === 3;

              return (
                <div
                  key={sqId}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    isCombo
                      ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.35)]'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="font-black text-sm text-slate-200 uppercase">
                      Escuadrón {idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isCombo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {connected}/3 Cables
                    </span>
                  </div>

                  {/* Visual de los 3 Cables */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px] font-bold">
                    <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                      sq.fuego_ui ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-900/60 border-slate-800 text-slate-600'
                    }`}>
                      <Flame className="w-4 h-4" />
                      <span>FUEGO UI</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                      sq.agua_data ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-600'
                    }`}>
                      <Droplets className="w-4 h-4" />
                      <span>AGUA DATA</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                      sq.planta_bots ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-600'
                    }`}>
                      <Sprout className="w-4 h-4" />
                      <span>PLANTA BOTS</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer del Proyector */}
      <footer className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>CANAL SUPABASE REALTIME: ARENA_ROOMS ACTIVE</span>
        </div>
        <div className="text-amber-400/80 font-bold">ACADEMIA CYBER-JOHTO // SATURDAY LIVE RAID</div>
      </footer>
    </div>
  );
}
