'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  ChevronRight,
  Award
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';

export interface LeaderboardTrainer {
  id: string;
  rank: number;
  name: string;
  division: 'Masterball' | 'Ultraball' | 'Superball' | 'Pokéball';
  streakDays: number;
  xp: number;
  pokedollars: number;
  party: {
    nickname: string;
    level: number;
    speciesId: number;
    isShiny: boolean;
  }[];
}

const MOCK_TRAINERS: LeaderboardTrainer[] = [
  {
    id: 'tr-1',
    rank: 1,
    name: 'Red Neo Master',
    division: 'Masterball',
    streakDays: 14,
    xp: 3450,
    pokedollars: 980,
    party: [
      { nickname: 'Typhlosion', level: 36, speciesId: 157, isShiny: true },
      { nickname: 'Ampharos', level: 34, speciesId: 181, isShiny: false },
      { nickname: 'Gengar', level: 32, speciesId: 94, isShiny: false },
      { nickname: 'Steelix', level: 31, speciesId: 208, isShiny: false },
      { nickname: 'Heracross', level: 30, speciesId: 214, isShiny: false },
      { nickname: 'Lugia', level: 40, speciesId: 249, isShiny: true },
    ],
  },
  {
    id: 'tr-2',
    rank: 2,
    name: 'Blue Cyber Guardian',
    division: 'Masterball',
    streakDays: 11,
    xp: 2980,
    pokedollars: 640,
    party: [
      { nickname: 'Feraligatr', level: 35, speciesId: 160, isShiny: false },
      { nickname: 'Alakazam', level: 33, speciesId: 65, isShiny: false },
      { nickname: 'Scizor', level: 32, speciesId: 212, isShiny: true },
      { nickname: 'Umbreon', level: 30, speciesId: 197, isShiny: false },
    ],
  },
  {
    id: 'tr-3',
    rank: 3,
    name: 'Crystal AI Connector',
    division: 'Ultraball',
    streakDays: 9,
    xp: 2420,
    pokedollars: 450,
    party: [
      { nickname: 'Meganium', level: 31, speciesId: 154, isShiny: false },
      { nickname: 'Espeon', level: 29, speciesId: 196, isShiny: true },
      { nickname: 'Kingdra', level: 28, speciesId: 230, isShiny: false },
    ],
  },
  {
    id: 'tr-4',
    rank: 4,
    name: 'Silver Code Hunter',
    division: 'Superball',
    streakDays: 7,
    xp: 1850,
    pokedollars: 320,
    party: [
      { nickname: 'Crobat', level: 28, speciesId: 169, isShiny: false },
      { nickname: 'Sneasel', level: 26, speciesId: 215, isShiny: false },
    ],
  },
];

export const LiveLeaderboard: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);

  const getDivisionBadge = (division: LeaderboardTrainer['division']) => {
    switch (division) {
      case 'Masterball':
        return 'bg-purple-950/80 border-purple-500/80 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
      case 'Ultraball':
        return 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'Superball':
        return 'bg-blue-950/80 border-blue-500/80 text-blue-300';
      case 'Pokéball':
        return 'bg-rose-950/80 border-rose-500/80 text-rose-300';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 font-mono text-slate-100 select-none">
      {/* Cabecera de la Liga Duolingo */}
      <div className="p-4 bg-slate-900/90 border-2 border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border-2 border-amber-500/60 rounded-xl text-amber-400">
            <Trophy className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              TABLA DE CLASIFICACIÓN SEMANAL
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-100">
              Liga Johto: División Masterball
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-700 text-slate-400">
            Cierre en: <strong className="text-amber-400">2d 14h</strong>
          </span>
        </div>
      </div>

      {/* Lista de Entrenadores del Ranking */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {MOCK_TRAINERS.map((trainer) => {
          const isTop3 = trainer.rank <= 3;
          return (
            <motion.div
              key={trainer.id}
              whileHover={{ scale: 1.01 }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                trainer.rank === 1
                  ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              {/* Posición, Avatar y Racha */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    trainer.rank === 1
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                      : trainer.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : trainer.rank === 3
                      ? 'bg-amber-700 text-slate-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{trainer.rank}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-100">{trainer.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${getDivisionBadge(trainer.division)}`}>
                      {trainer.division}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-orange-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{trainer.streakDays} DÍAS</span>
                    </span>
                    <span>·</span>
                    <span className="text-amber-300 font-bold">₽{trainer.pokedollars}</span>
                    <span>·</span>
                    <span className="text-cyan-300 font-bold">{trainer.xp} XP</span>
                  </div>
                </div>
              </div>

              {/* Los 6 Mini-Sprites del Equipo GBA */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                {trainer.party.map((pkmn, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                      pkmn.isShiny
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                    title={`${pkmn.nickname} (Nv. ${pkmn.level})`}
                  >
                    <span>{pkmn.nickname}</span>
                    <span className="text-slate-500 text-[9px]">L{pkmn.level}</span>
                    {pkmn.isShiny && <Sparkles className="w-3 h-3 text-amber-400" />}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Fila del Alumno Autenticado Actual */}
        {profile && (
          <div className="mt-4 pt-3 border-t-2 border-slate-800">
            <div className="text-xs text-slate-400 mb-2 font-bold">TU POSICIÓN EN LA LIGA:</div>
            <div className="p-4 rounded-xl border-2 bg-cyan-950/30 border-cyan-500/60 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-600 text-slate-950 flex items-center justify-center font-black text-xs">
                  #18
                </span>
                <div>
                  <div className="font-black text-sm text-cyan-300">{profile.trainer_name}</div>
                  <div className="text-[11px] text-slate-400">
                    Racha: {profile.streak_days} días · {profile.xp} XP
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Equipo Sincronizado en .SAV:</span>
                <span className="text-cyan-300">
                  {profile.starter_pokemon.toUpperCase()} (Nv. {profile.current_level})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
