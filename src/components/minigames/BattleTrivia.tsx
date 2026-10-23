'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Droplets, 
  Sprout, 
  Zap, 
  Swords, 
  Heart, 
  Sparkles, 
  RotateCcw,
  BatteryCharging 
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';

interface AttackOption {
  id: string;
  name: string;
  type: 'fire' | 'water' | 'grass' | 'electric';
  powerText: string;
  isCorrect: boolean;
  explanation: string;
}

const TRIVIA_ATTACKS: AttackOption[] = [
  {
    id: 'opt-1',
    name: 'Row Level Security',
    type: 'water',
    powerText: 'Blindar Base de Datos',
    isCorrect: true,
    explanation: '¡Golpe Crítico! RLS restringe el acceso fila por fila en PostgreSQL.',
  },
  {
    id: 'opt-2',
    name: 'Hardcodear API Key',
    type: 'fire',
    powerText: 'Exponer Secreto Público',
    isCorrect: false,
    explanation: '¡El ataque falló! Las llaves maestras jamás deben ir al frontend.',
  },
  {
    id: 'opt-3',
    name: 'Drop Schema Sin Backup',
    type: 'grass',
    powerText: 'Destrucción Masiva',
    isCorrect: false,
    explanation: '¡Autodaño! Borraste la persistencia de toda la Academia.',
  },
  {
    id: 'opt-4',
    name: 'Ignorar Políticas RLS',
    type: 'electric',
    powerText: 'Lectura Abierta Global',
    isCorrect: false,
    explanation: '¡El rival lo esquivó! Cualquier usuario podría robar los datos.',
  },
];

export const BattleTrivia: React.FC = () => {
  const grantRewardRpc = useTrainerStore((s) => s.grantActivityRewardRpc);
  const profile = useTrainerStore((s) => s.profile);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [rivalHp, setRivalHp] = useState<number>(100);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [shakeEnemy, setShakeEnemy] = useState<boolean>(false);
  const [floatingBattery, setFloatingBattery] = useState<boolean>(false);
  const [battleFeedback, setBattleFeedback] = useState<string>(
    '¿Qué mecanismo de Supabase asegura que cada alumno solo lea sus propios datos?'
  );

  const handleSelectAttack = async (opt: AttackOption) => {
    if (isAttacking || rivalHp <= 0) return;

    soundFx.playClick();
    setIsAttacking(true);

    if (opt.isCorrect) {
      // 1. Sonido de impacto y screen-shake en rival
      soundFx.playHit();
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 500);

      // 2. Reducir vida elástica del rival a 0
      setRivalHp(0);
      setBattleFeedback(opt.explanation);

      // 3. Estrellas doradas con canvas-confetti
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#06B6D4', '#22C55E'],
      });

      // 4. Invocar RPC para otorgar recompensa atómica
      soundFx.playCoin();
      setFloatingBattery(true);
      await grantRewardRpc('trivia_win');
    } else {
      // Daño al jugador por opción incorrecta
      soundFx.playHit();
      setPlayerHp((hp) => Math.max(20, hp - 40));
      setBattleFeedback(opt.explanation);
    }

    setTimeout(() => {
      setIsAttacking(false);
    }, 1200);
  };

  const handleResetBattle = () => {
    soundFx.playClick();
    setPlayerHp(100);
    setRivalHp(100);
    setFloatingBattery(false);
    setBattleFeedback('¿Qué mecanismo de Supabase asegura que cada alumno solo lea sus propios datos?');
  };

  const getAttackTypeStyle = (type: AttackOption['type']) => {
    switch (type) {
      case 'fire':
        return 'from-orange-600/30 to-amber-600/20 border-orange-500/50 text-orange-300 hover:border-orange-400';
      case 'water':
        return 'from-blue-600/30 to-cyan-600/20 border-cyan-500/50 text-cyan-300 hover:border-cyan-400';
      case 'grass':
        return 'from-emerald-600/30 to-green-600/20 border-emerald-500/50 text-emerald-300 hover:border-emerald-400';
      case 'electric':
        return 'from-yellow-600/30 to-amber-600/20 border-yellow-500/50 text-yellow-300 hover:border-yellow-400';
    }
  };

  return (
    <div className="w-full bg-[#0a101f] border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl font-mono text-slate-100 flex flex-col gap-4 relative overflow-hidden">
      {/* HUD de Combate Estilo Game Boy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-800 text-xs">
        {/* Info Rival al Frente */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between font-bold">
            <span className="text-rose-400">RIVAL: CÓDIGO SILVER</span>
            <span className="text-slate-400">Lv. 12</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-400">PS</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                animate={{ width: `${rivalHp}%` }}
                transition={{ type: 'spring', damping: 15 }}
                className={`h-full ${rivalHp > 30 ? 'bg-emerald-400' : 'bg-rose-500'}`}
              />
            </div>
            <span className="text-[10px] font-bold">{rivalHp}/100</span>
          </div>
        </div>

        {/* Info Tu Pokémon de Espaldas */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between font-bold">
            <span className="text-cyan-400 uppercase">
              TU {profile?.starter_pokemon || 'CYNDAQUIL'}
            </span>
            <span className="text-slate-400">Lv. {profile?.current_level || 5}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-400">PS</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                animate={{ width: `${playerHp}%` }}
                transition={{ type: 'spring', damping: 15 }}
                className={`h-full ${playerHp > 30 ? 'bg-emerald-400' : 'bg-rose-500'}`}
              />
            </div>
            <span className="text-[10px] font-bold">{playerHp}/100</span>
          </div>
        </div>
      </div>

      {/* Escenario Visual de Batalla */}
      <div className="h-44 bg-gradient-to-b from-[#060a14] via-[#0d1628] to-[#12203a] rounded-xl border border-slate-800/80 relative flex items-center justify-between px-8 sm:px-16 overflow-hidden">
        {/* Efecto Neón de Arena */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Tu Pokémon (De Espaldas) */}
        <motion.div
          animate={isAttacking ? { x: [0, 40, 0] } : { y: [0, -4, 0] }}
          transition={{ repeat: isAttacking ? 1 : Infinity, duration: isAttacking ? 0.3 : 2 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-500 border-2 border-amber-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <Flame className="w-10 h-10 fill-amber-300 text-amber-900" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 mt-1">TU INICIAL</span>
        </motion.div>

        {/* Número Flotante +15m Batería */}
        {floatingBattery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: -50 }}
            transition={{ duration: 1.5 }}
            className="absolute z-30 font-black text-sm text-cyan-300 flex items-center gap-1 bg-cyan-950/80 border border-cyan-400 px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          >
            <BatteryCharging className="w-4 h-4 text-cyan-400" />
            <span>+15m BATERÍA</span>
          </motion.div>
        )}

        {/* Pokémon Oponente (Al Frente) */}
        <motion.div
          animate={
            shakeEnemy
              ? { x: [-10, 10, -10, 10, 0], scale: [1, 0.9, 1] }
              : rivalHp <= 0
              ? { opacity: 0.3, y: 10 }
              : { y: [0, 4, 0] }
          }
          transition={{ duration: shakeEnemy ? 0.4 : 2, repeat: shakeEnemy ? 0 : Infinity }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-900 to-purple-800 border-2 border-rose-500 flex items-center justify-center text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            <Swords className="w-10 h-10" />
          </div>
          <span className="text-[10px] font-bold text-rose-300 mt-1">GLIGAR IA</span>
        </motion.div>
      </div>

      {/* Cuadro de Texto de Batalla */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-200">
        &ldquo;{battleFeedback}&rdquo;
      </div>

      {/* 4 Botones Grandes Estilo Ataques Pokémon */}
      {rivalHp > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TRIVIA_ATTACKS.map((atk) => (
            <motion.button
              key={atk.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAttacking}
              onClick={() => handleSelectAttack(atk)}
              className={`p-3.5 rounded-xl border bg-gradient-to-r ${getAttackTypeStyle(
                atk.type
              )} text-left shadow-md transition-all cursor-pointer disabled:opacity-50`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm">{atk.name}</span>
                <span className="text-[10px] px-2 py-0.5 bg-black/40 rounded border border-white/10 uppercase">
                  {atk.type}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-1">{atk.powerText}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>¡Victoria de Trivia! +15 min de batería y Pokédólares acreditados.</span>
          </div>
          <button
            onClick={handleResetBattle}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Otra Batalla</span>
          </button>
        </div>
      )}
    </div>
  );
};
