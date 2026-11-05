'use client';

import React from 'react';
import { ShieldCheck, ChevronRight, Award, Flame, Lock } from 'lucide-react';
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
  onOpenSanctuary: () => void;
}

export function LockedPactBanner({ oaths, onOpenSanctuary }: LockedPactBannerProps) {
  // Buscar el pacto activo más reciente
  const activeOath = oaths.find((o) => o.status === 'locked_active' || o.status === 'active') || null;

  if (!activeOath) {
    return (
      <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#D9383A]/10 border border-[#D9383A]/20 flex items-center justify-center text-[#D9383A] shrink-0">
            <Flame className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#D9383A]">
                Pacto de Templanza
              </span>
              <span className="text-[9px] text-[#706E66] font-mono">· Sin Desafío Activo</span>
            </div>
            <p className="text-xs font-bold text-[#1C1B18] truncate mt-0.5">
              Cero Porno/PMO, Vicios: Bloquea 7, 15 o 30 días
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(20);
            }
            onOpenSanctuary();
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#D9383A] hover:bg-[#C92F31] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_2px_0px_#B22B2D] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <span>Sellar Pacto</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>
    );
  }

  // Calcular días restantes y avance del pacto de templanza
  const today = new Date();
  const endDate = new Date(activeOath.end_date);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysCompleted = Math.max(0, activeOath.duration_days - diffDays);
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round(((activeOath.duration_days - diffDays) / activeOath.duration_days) * 100))
  );

  return (
    <div
      onClick={() => {
        soundFx.playClick();
        onOpenSanctuary();
      }}
      className="rounded-2xl bg-white border border-[#E4E1D8] p-3.5 shadow-[0_2px_8px_rgba(26,25,21,0.04)] space-y-2.5 select-none hover:border-[#D9383A]/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/20 flex items-center justify-center text-[#2E8555] shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#2E8555]">
                Pacto Activo ({activeOath.duration_days}D)
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#2E8555]/10 text-[#2E8555] text-[9px] font-mono font-bold border border-[#2E8555]/20 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                INMUTABLE
              </span>
            </div>
            <h4 className="text-xs font-bold text-[#1C1B18] truncate mt-0.5">
              {activeOath.title}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono text-xs font-bold text-[#1C1B18] block tabular-nums">
            Día {daysCompleted} / {activeOath.duration_days}
          </span>
          <span className="font-mono text-[9px] text-[#2E8555] block font-bold uppercase">
            {diffDays}d restantes
          </span>
        </div>
      </div>

      {/* Barra de Progreso Milimétrica */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[#706E66]">
          <span>Firma: <strong className="text-[#1C1B18]">{activeOath.runic_signature}</strong></span>
          <span className="font-bold text-[#2E8555]">{progressPercent}% defendido</span>
        </div>
        <div className="h-1.5 w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-full p-0.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C59B46] to-[#2E8555] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono text-[#706E66]">
        <span className="flex items-center gap-1 text-[#C59B46] font-bold">
          <span>⚡</span> Multiplicador Vínculo 1.25x
        </span>
        <span className="text-[#2D68C4] group-hover:underline flex items-center gap-0.5">
          <span>Abrir Santuario</span>
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
