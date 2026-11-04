'use client';

import React from 'react';
import { ShieldCheck, ChevronRight, Award } from 'lucide-react';
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
  // Buscar el pase/pacto activo más reciente
  const activeOath = oaths.find((o) => o.status === 'locked_active' || o.status === 'active') || oaths[0];

  if (!activeOath) {
    return (
      <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2D68C4]/10 border border-[#2D68C4]/20 flex items-center justify-center text-[#2D68C4] shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-[#2D68C4]">
                Pase de Entrenador
              </span>
              <span className="text-[9px] text-[#706E66] font-mono">· Sin Desafío Activo</span>
            </div>
            <p className="text-xs font-semibold text-[#1C1B18] truncate mt-0.5">
              Pacto de Gimnasio: Bloquea 7, 15 o 30 días
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(15);
            }
            onOpenNewPact();
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#2D68C4] hover:bg-[#255BB0] text-white text-xs font-semibold uppercase tracking-wider shadow-[0_2px_0px_#23529B] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <span>Activar Pase</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>
    );
  }

  // Calcular días restantes del pase de entrenador
  const today = new Date();
  const endDate = new Date(activeOath.end_date);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round(((activeOath.duration_days - diffDays) / activeOath.duration_days) * 100))
  );

  return (
    <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2.5 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/20 flex items-center justify-center text-[#2E8555] shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-[#2E8555]">
                Pase de Gimnasio ({activeOath.duration_days}D)
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] text-[9px] font-mono font-medium border border-[#2E8555]/20">
                INMUTABLE
              </span>
            </div>
            <h4 className="text-xs font-semibold text-[#1C1B18] truncate mt-0.5">
              {activeOath.title}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono text-xs font-semibold text-[#1C1B18] block tabular-nums">
            {diffDays} días
          </span>
          <span className="font-mono text-[9px] text-[#706E66] block uppercase font-medium">
            Restantes
          </span>
        </div>
      </div>

      {/* Barra de Progreso Milimétrica */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[#706E66]">
          <span>Firma: <strong className="text-[#1C1B18]">{activeOath.runic_signature}</strong></span>
          <span className="font-semibold text-[#2E8555]">{progressPercent}% conquistado</span>
        </div>
        <div className="h-1.5 w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C59B46] to-[#2E8555] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
