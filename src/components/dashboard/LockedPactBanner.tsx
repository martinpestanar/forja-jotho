'use client';

import React from 'react';
import { Lock, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
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
      <div className="rounded-2xl bg-white border border-[#E8E5DD] p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043] shrink-0">
            <Lock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#D97043]">
                Pacto Inquebrantable
              </span>
              <span className="text-[10px] text-[#8A877E]">· Inactivo</span>
            </div>
            <p className="text-xs font-semibold text-[#1F1E1B] truncate mt-0.5">
              Bloquea tus hábitos por 7, 15 o 30 días
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playClick();
            onOpenNewPact();
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <span>Sellar Pacto</span>
          <ChevronRight className="w-3.5 h-3.5" />
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
    <div className="rounded-2xl bg-white border border-[#E8E5DD] p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#5A7D62]/10 border border-[#5A7D62]/20 flex items-center justify-center text-[#5A7D62] shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5A7D62]">
                Pacto Bloqueado ({activeOath.duration_days} días)
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#5A7D62]/15 text-[#4C6151] text-[9px] font-mono font-medium">
                Inmutable
              </span>
            </div>
            <h4 className="text-xs font-semibold text-[#1F1E1B] truncate mt-0.5">
              {activeOath.title}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono text-sm font-semibold text-[#1F1E1B] block tabular-nums">
            {diffDays} días
          </span>
          <span className="font-mono text-[9px] text-[#8A877E] block uppercase">
            Restantes
          </span>
        </div>
      </div>

      {/* Barra de Progreso Minimalista & Serena */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[#706E66]">
          <span>Firma: {activeOath.runic_signature}</span>
          <span className="font-semibold text-[#5A7D62]">{progressPercent}% conquistado</span>
        </div>
        <div className="h-2 w-full bg-[#EAE7DF] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D97043] to-[#5A7D62] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
