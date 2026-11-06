'use client';

import React, { useState } from 'react';
import { ShieldCheck, ChevronRight, ChevronDown, Award, Flame, Lock } from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState(true);

  // Buscar el pacto activo más reciente
  const activeOath = oaths.find((o) => o.status === 'locked_active' || o.status === 'active') || null;

  if (!activeOath) {
    return (
      <div className="rounded-2xl bg-white border border-[#E4E1D8] p-3 shadow-[0_2px_8px_rgba(26,25,21,0.04)] flex items-center justify-between gap-2.5 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#D9383A]/10 border border-[#D9383A]/20 flex items-center justify-center text-[#D9383A] shrink-0">
            <Flame className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#D9383A]">
                Pacto de Templanza
              </span>
              <span className="text-[9px] text-[#706E66] font-mono hidden sm:inline">· Sin Desafío Activo</span>
            </div>
            <p className="text-xs font-bold text-[#1C1B18] truncate mt-0.5">
              Bloquea 7, 15 o 30 días de disciplina
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D9383A] hover:bg-[#C92F31] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_2px_0px_#B22B2D] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <span>Sellar</span>
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
    <div className="rounded-2xl bg-white border border-[#E4E1D8] shadow-[0_2px_8px_rgba(26,25,21,0.04)] select-none overflow-hidden transition-all">
      {/* Barra principal compacta / modo colapsado */}
      <div className="p-3 flex items-center justify-between gap-2.5">
        <div
          onClick={() => {
            soundFx.playClick();
            onOpenSanctuary();
          }}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[#2E8555]/10 border border-[#2E8555]/20 flex items-center justify-center text-[#2E8555] shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#2E8555]">
                Pacto Activo ({activeOath.duration_days}D)
              </span>
              <span className="font-mono text-[9px] text-[#706E66]">
                Día {daysCompleted}/{activeOath.duration_days}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#1C1B18] truncate mt-0.5">
              {activeOath.title || 'Voto de Sobriedad & Enfoque'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-[#2E8555] bg-[#2E8555]/10 border border-[#2E8555]/25 px-2 py-0.5 rounded-lg">
              {diffDays === 0 ? '¡Listo!' : `${diffDays}d rest.`}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playClick();
              setCollapsed(!collapsed);
            }}
            aria-label={collapsed ? 'Ver detalles de pacto' : 'Ocultar detalles de pacto'}
            className="p-1 rounded-lg text-[#706E66] hover:bg-[#FAF9F5] hover:text-[#1C1B18] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4 -rotate-90" />
            )}
          </button>
        </div>
      </div>

      {/* Barra de progreso sutil de 2px en el borde inferior */}
      <div className="w-full h-1 bg-[#FAF9F5] border-t border-[#E4E1D8]/60 overflow-hidden">
        <div
          className="h-full bg-[#2E8555] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Detalles expandibles opcionales */}
      {!collapsed && (
        <div className="p-3 bg-[#FAF9F5]/70 border-t border-[#E4E1D8] space-y-2 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#706E66] tracking-wider block">
              Voto Inquebrantable
            </span>
            <p className="text-xs italic text-[#1C1B18] leading-relaxed bg-white border border-[#E4E1D8] p-2.5 rounded-xl">
              "{activeOath.front_vow}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[10px] text-[#706E66]">
              Firma: <strong className="text-[#1C1B18]">{activeOath.runic_signature}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSanctuary();
              }}
              className="text-[11px] font-mono font-bold text-[#D9383A] hover:underline cursor-pointer"
            >
              Ver en Santuario →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
