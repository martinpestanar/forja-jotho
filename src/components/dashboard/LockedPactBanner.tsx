'use client';

import React from 'react';
import { Lock, ShieldCheck, Flame, Plus, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export interface OathCardItem {
  id: string;
  title: string;
  duration_days: number;
  front_vow: string;
  start_date: string;
  end_date: string;
  status: string;
  runic_signature: string;
}

interface LockedPactBannerProps {
  oaths: OathCardItem[];
  onOpenNewPact: () => void;
}

export function LockedPactBanner({ oaths, onOpenNewPact }: LockedPactBannerProps) {
  // Buscar el pacto activo más reciente
  const activeOath = oaths.find((o) => o.status === 'locked_active' || o.status === 'active') || oaths[0];

  if (!activeOath) {
    return (
      <div className="rounded-2xl border-2 border-black bg-[#FAF9F5] p-3.5 shadow-[3px_3px_0px_0px_#000] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E60012]/15 border-2 border-black flex items-center justify-center text-[#E60012] shrink-0">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="font-mono text-[10px] font-black uppercase text-[#E60012] block tracking-wider">
              PACTO INQUEBRANTABLE: INACTIVO
            </span>
            <p className="text-xs font-bold text-[#1F1E1B] truncate">
              Bloquea tus hábitos por 7, 15 o 30 días
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playClick();
            onOpenNewPact();
          }}
          className="px-3 py-1.5 rounded-xl bg-[#E60012] hover:bg-[#B91C1C] text-white text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          Sellar Pacto
        </button>
      </div>
    );
  }

  // Calcular días restantes del pacto
  const today = new Date();
  const endDate = new Date(activeOath.end_date);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round(((activeOath.duration_days - diffDays) / activeOath.duration_days) * 100))
  );

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000] space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] border-2 border-black flex items-center justify-center text-white shrink-0 shadow-[2px_2px_0px_0px_#000]">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#2563EB] block">
                PACTO BLOQUEADO · {activeOath.duration_days} DÍAS
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#22C55E]/20 text-[#166534] text-[9px] font-mono font-bold">
                🔒 INMUTABLE
              </span>
            </div>
            <h4 className="text-xs font-black text-black truncate mt-0.5">
              {activeOath.title}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono text-sm font-black text-black block tabular-nums">
            {diffDays} DÍAS
          </span>
          <span className="font-mono text-[9px] text-[#706E66] block uppercase">
            RESTANTES
          </span>
        </div>
      </div>

      {/* Barra de Progreso Inquebrantable */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[#5E5C56]">
          <span>Firma: {activeOath.runic_signature}</span>
          <span className="font-bold text-[#2563EB]">{progressPercent}% Conquistado</span>
        </div>
        <div className="h-2.5 w-full bg-[#EAE7DF] border border-black rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#22C55E] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
