'use client';

import React, { useState } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { executeStudentOverride } from '@/lib/adminService';
import { 
  X, 
  Crown, 
  BatteryCharging, 
  Award, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  Zap
} from 'lucide-react';

interface AdminStudentGodModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    trainer_name: string;
    current_level: number;
    pokedollars: number;
    battery_minutes: number;
    xp: number;
    nature_role: string;
    parent_whatsapp?: string | null;
  } | null;
  onUpdated?: () => void;
}

export const AdminStudentGodModal: React.FC<AdminStudentGodModalProps> = ({
  isOpen,
  onClose,
  student,
  onUpdated,
}) => {
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleAction = async (action: 'grant_battery' | 'grant_pokedollars' | 'set_level' | 'inject_item', payload: any, label: string) => {
    soundFx.playClick();
    setIsLoading(true);
    setFeedback(null);

    const result = await executeStudentOverride(student.id, action, payload);
    setIsLoading(false);

    if (result) {
      soundFx.playLevelUp();
      setFeedback(`¡Éxito! ${label}`);
      setTimeout(() => {
        setFeedback(null);
        onUpdated?.();
      }, 1800);
    } else {
      soundFx.playDamage();
      setFeedback('Error al procesar la acción en Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div
        className={`w-full max-w-md rounded-2xl border-4 overflow-hidden shadow-2xl transition-all ${
          isLight
            ? 'bg-[#F4F1EA] border-black text-slate-900 shadow-[8px_8px_0_#000]'
            : 'bg-[#0f172a] border-amber-500/80 text-slate-100 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
        }`}
      >
        {/* Cabecera Modo Dios */}
        <div
          className={`px-4 py-3 border-b-4 flex items-center justify-between ${
            isLight
              ? 'bg-amber-300 border-black text-black'
              : 'bg-[#18233c] border-amber-500/50 text-amber-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span className="font-black text-xs uppercase tracking-wider">
              Control Rápido de Profesor (Modo Dios)
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className={`p-1 rounded-lg border-2 border-black transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-black shadow-[2px_2px_0_#000]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta Resumen del Alumno */}
        <div className="p-4 space-y-3">
          <div
            className={`p-3 rounded-xl border-2 flex items-center justify-between ${
              isLight
                ? 'bg-white border-black shadow-[2px_2px_0_#000]'
                : 'bg-slate-900/80 border-slate-700'
            }`}
          >
            <div>
              <div className="font-black text-sm text-amber-500">
                {student.trainer_name}
              </div>
              <div className="text-[11px] text-slate-400">
                Rol: {student.nature_role} · Nv. {student.current_level}
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold flex items-center gap-1 justify-end text-emerald-400">
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>{student.battery_minutes}m</span>
              </div>
              <div className="font-bold flex items-center gap-1 justify-end text-amber-400">
                <Coins className="w-3.5 h-3.5" />
                <span>{student.pokedollars} 💰</span>
              </div>
            </div>
          </div>

          {/* Feedback de estado */}
          {feedback && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Botones de Acción de 1 Clic */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Acciones de Soporte Inmediato en Clase:
            </div>

            {/* +30 min Batería */}
            <button
              disabled={isLoading}
              onClick={() => handleAction('grant_battery', { amount: 30 }, '+30 min de Batería acreditados')}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-between border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-emerald-200 hover:bg-emerald-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-500" />
                <span>Recargar Batería (+30 min)</span>
              </span>
              <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded">
                1-CLIC
              </span>
            </button>

            {/* +100 Pokédólares */}
            <button
              disabled={isLoading}
              onClick={() => handleAction('grant_pokedollars', { amount: 100 }, '+100 Pokédólares entregados')}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-between border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-200 hover:bg-amber-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Premiar con +100 Pokédólares</span>
              </span>
              <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded">
                +100 💰
              </span>
            </button>

            {/* Subir Nivel Inmediato (+1) */}
            <button
              disabled={isLoading}
              onClick={() => handleAction('set_level', { amount: student.current_level + 1 }, `Nivel subido a ${student.current_level + 1}`)}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-between border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-purple-200 hover:bg-purple-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Aprobar Nivel / Medalla (+1 Nivel)</span>
              </span>
              <span className="text-[10px] bg-purple-500 text-white font-black px-1.5 py-0.5 rounded">
                MEDALLA
              </span>
            </button>

            {/* Inyectar Caramelo Raro GBA */}
            <button
              disabled={isLoading}
              onClick={() => handleAction('inject_item', { item_key: 'GBA_RARE_CANDY', gba_item_id: 68, gba_pocket: 'ITEMS', quantity: 1 }, 'Caramelo Raro enviado al inventario GBA')}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase flex items-center justify-between border-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-rose-200 hover:bg-rose-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/60'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Inyectar Caramelo Raro a GBA</span>
              </span>
              <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded">
                GBA ITEM
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
