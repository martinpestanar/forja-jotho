import React, { useState, useEffect } from 'react';
import { Trophy, Radio, ChevronRight, ChevronDown, Award, Crown, Zap } from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { SocraticPokegear } from '@/components/social/SocraticPokegear';
import { HolographicGradCard } from '@/components/social/HolographicGradCard';
import { AdminStudentGodModal } from '@/components/admin/AdminStudentGodModal';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

interface LeaderboardUser {
  id?: string;
  rank: number;
  name: string;
  level: number;
  xp: number;
  pokedollars?: number;
  battery_minutes?: number;
  role: 'fuego_ui' | 'agua_data' | 'planta_bots';
  is_admin?: boolean;
}

const FALLBACK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: 'Red Master', level: 14, xp: 2450, role: 'fuego_ui' },
  { rank: 2, name: 'Blue Cyber', level: 12, xp: 1980, role: 'agua_data' },
  { rank: 3, name: 'Crystal AI', level: 11, xp: 1720, role: 'planta_bots' },
  { rank: 4, name: 'Silver Neo', level: 9, xp: 1350, role: 'agua_data' },
];

export const RightPanel: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [showPokegearWidget, setShowPokegearWidget] = useState<boolean>(true);
  const [showGradCard, setShowGradCard] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(FALLBACK_LEADERBOARD);
  const [selectedStudentForGodMode, setSelectedStudentForGodMode] = useState<any | null>(null);

  const fetchRealLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        const mapped: LeaderboardUser[] = data.map((p, idx) => ({
          id: p.id,
          rank: idx + 1,
          name: p.trainer_name,
          level: p.current_level,
          xp: p.xp,
          pokedollars: p.pokedollars,
          battery_minutes: p.battery_minutes,
          role: (p.nature_role as any) || 'fuego_ui',
          is_admin: !!p.is_admin,
        }));
        setLeaderboard(mapped);
      }
    } catch {
      // Usar fallback si la consulta falla
    }
  };

  useEffect(() => {
    fetchRealLeaderboard();
  }, [profile]);

  return (
    <aside className="w-full h-full flex flex-col gap-3 font-mono">
      {/* Módulo Socrático Desplegable */}
      <div>
        <div
          onClick={() => {
            soundFx.playClick();
            setShowPokegearWidget((prev) => !prev);
          }}
          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all mb-2 ${
            isLight
              ? 'bg-[#F59E0B]/20 border-2 border-black shadow-[3px_3px_0_#000] text-slate-900'
              : 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border-2 border-amber-500/60 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 animate-pulse ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                isLight ? 'text-amber-950' : 'text-amber-300'
              }`}
            >
              Pokégear Socrático
            </span>
          </div>
          {showPokegearWidget ? (
            <ChevronDown className={`w-4 h-4 ${isLight ? 'text-slate-800' : 'text-amber-400'}`} />
          ) : (
            <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-800' : 'text-amber-400'}`} />
          )}
        </div>

        {showPokegearWidget && <SocraticPokegear />}
      </div>

      {/* Mini-Ranking en Vivo */}
      <div
        className={`flex-1 rounded-xl p-3 flex flex-col transition-colors duration-250 ${
          isLight
            ? 'bg-[#FFFFFF] border-4 border-black shadow-[4px_4px_0_#000] text-slate-900'
            : 'bg-[#0f172a] border-2 border-slate-700/80 shadow-xl text-slate-100'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-2 border-b ${
            isLight ? 'border-black/15' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-slate-200'
              }`}
            >
              Liga Johto (Live)
            </span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isLight ? 'bg-slate-200 text-slate-800 border border-black/20' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Top 4
          </span>
        </div>

        {/* Lista de Ranking */}
        <div className="flex-1 mt-2.5 space-y-2 overflow-y-auto pr-1">
          {leaderboard.map((user) => {
            const isTeacher = user.is_admin;
            const canAdminInteract = profile?.is_admin && user.id && user.id !== profile.id;

            return (
              <div
                key={user.id || user.rank}
                onClick={() => {
                  if (canAdminInteract) {
                    soundFx.playClick();
                    setSelectedStudentForGodMode({
                      id: user.id,
                      trainer_name: user.name,
                      current_level: user.level,
                      pokedollars: user.pokedollars || 0,
                      battery_minutes: user.battery_minutes || 0,
                      xp: user.xp,
                      nature_role: user.role,
                    });
                  }
                }}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                  canAdminInteract ? 'cursor-pointer hover:scale-[1.02] hover:border-amber-400' : ''
                } ${
                  isTeacher
                    ? isLight
                      ? 'bg-amber-100 border-2 border-black text-amber-950 font-bold shadow-[2px_2px_0_#000]'
                      : 'bg-amber-950/40 border-2 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : user.rank === 1
                      ? isLight
                        ? 'bg-amber-100 border-2 border-black text-amber-950 font-bold shadow-[2px_2px_0_#000]'
                        : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : isLight
                        ? 'bg-[#F4F1EA] border border-black/20 text-slate-900'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
                title={canAdminInteract ? 'Modo Dios: Clic para recargar batería, premiar o subir nivel' : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[11px] ${
                      isTeacher
                        ? 'bg-amber-400 text-black border border-black'
                        : user.rank === 1
                          ? isLight
                            ? 'bg-amber-400 text-black border border-black'
                            : 'bg-amber-500 text-black'
                          : isLight
                            ? 'bg-slate-300 text-slate-900 border border-black/30'
                            : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isTeacher ? '👑' : `#${user.rank}`}
                  </span>
                  <div>
                    <div
                      className={`font-bold truncate max-w-[120px] flex items-center gap-1 ${
                        isLight ? 'text-slate-950' : 'text-slate-200'
                      }`}
                    >
                      <span>{user.name}</span>
                      {isTeacher && (
                        <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-black font-black rounded">
                          LÍDER
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] uppercase ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                      Nv. {user.level} · {user.role.split('_')[0]}
                      {canAdminInteract && (
                        <span className="text-amber-400 font-bold ml-1 text-[9px]">[MODO DIOS]</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{user.xp}</div>
                  <div className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>XP</div>
                </div>
              </div>
            );
          })}

          {/* Posición del usuario actual */}
          {profile && (
            <div className={`mt-4 pt-2 border-t ${isLight ? 'border-black/15' : 'border-slate-800'}`}>
              <div className={`text-[10px] mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                TU POSICIÓN:
              </div>
              <div
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  profile.is_admin
                    ? isLight
                      ? 'bg-amber-200 border-2 border-black text-amber-950 font-black shadow-[2px_2px_0_#000]'
                      : 'bg-amber-500/20 border-2 border-amber-500 text-amber-300 font-bold'
                    : isLight
                      ? 'bg-cyan-50 border-2 border-black text-cyan-950 font-bold shadow-[2px_2px_0_#000]'
                      : 'bg-cyan-950/20 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{profile.is_admin ? '👑 #1' : '#1'}</span>
                  <span className="font-bold truncate max-w-[110px]">{profile.trainer_name}</span>
                </div>
                <div className="font-bold">{profile.xp} XP</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón Acceso Rápido a Carta TCG Holográfica */}
      <button
        onClick={() => {
          soundFx.playClick();
          setShowGradCard(true);
        }}
        className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isLight
            ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            : 'bg-gradient-to-r from-purple-900/40 to-amber-900/40 border-2 border-amber-500/70 hover:border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
        }`}
      >
        <Award className="w-4 h-4 text-amber-400" />
        <span>Mi Carta Holográfica TCG</span>
      </button>

      {/* Modal de Carta Holográfica TCG */}
      {showGradCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-md rounded-2xl p-4 shadow-2xl ${
              isLight ? 'bg-[#FFFFFF] border-4 border-black' : 'bg-[#0a0f1d] border-2 border-amber-500'
            }`}
          >
            <button
              onClick={() => setShowGradCard(false)}
              className={`absolute top-3 right-3 text-xs px-2 py-1 rounded cursor-pointer ${
                isLight
                  ? 'bg-slate-200 text-black border border-black hover:bg-slate-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              ✕ Cerrar
            </button>
            <HolographicGradCard />
          </div>
        </div>
      )}

      {/* Modal Modo Dios para Profesores (Acción Rápida de 1 Clic sobre Alumnos) */}
      <AdminStudentGodModal
        isOpen={!!selectedStudentForGodMode}
        student={selectedStudentForGodMode}
        onClose={() => setSelectedStudentForGodMode(null)}
        onUpdated={() => {
          fetchRealLeaderboard();
        }}
      />
    </aside>
  );
};
