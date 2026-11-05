'use client';

import React, { useState } from 'react';
import { ShieldCheck, Flame, X, Sparkles, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { DopamineHoldButton } from '@/components/ui/DopamineHoldButton';
import { soundFx } from '@/lib/soundFx';

export interface OathData {
  id?: string;
  title: string;
  duration_days: number;
  front_vow: string;
  start_date: string;
  end_date: string;
  status: string;
  runic_signature: string;
}

interface TemperanceSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOath: OathData | null;
  onSealOath: (data: {
    title: string;
    vow: string;
    durationDays: number;
    signature: string;
  }) => Promise<void>;
  onConfirmDailyVictory?: () => Promise<void>;
  onDeclareRelapse?: () => Promise<void>;
}

const PRESET_COMPULSIONS = [
  {
    id: 'pmo',
    title: 'Cero Pornografía & PMO',
    tag: 'Pureza Mental',
    vow: 'No consumiré contenido para adultos ni cederé al impulso compulsivo. Transmutaré mi energía en disciplina física y mental.',
    icon: '🛡️',
  },
  {
    id: 'nicotine',
    title: 'Cero Nicotina & Vape',
    tag: 'Pulmón Limpio',
    vow: 'No fumaré ni usaré vaporizadores. Respiro aire puro y gobierno mi ansiedad con respiración consciente.',
    icon: '🚭',
  },
  {
    id: 'gaming_junk',
    title: 'Cero Redes & Gaming Tóxico',
    tag: 'Foco de Acero',
    vow: 'Cero scroll infinito ni videojuegos compulsivos antes de terminar mis misiones del día. Mi tiempo es oro.',
    icon: '📵',
  },
  {
    id: 'custom',
    title: 'Pacto Personalizado',
    tag: 'Voto Libre',
    vow: '',
    icon: '⚔️',
  },
];

const DURATION_PRESETS = [
  { days: 7, label: '7 Días', tier: 'Cobre', desc: 'Prueba Táctica' },
  { days: 15, label: '15 Días', tier: 'Plata', desc: 'Hábito Firme' },
  { days: 30, label: '30 Días', tier: 'Oro', desc: 'Temple de Acero' },
  { days: 90, label: '90 Días', tier: 'Zafiro', desc: 'Transmutación Total' },
];

export function TemperanceSanctuaryModal({
  isOpen,
  onClose,
  activeOath,
  onSealOath,
  onConfirmDailyVictory,
  onDeclareRelapse,
}: TemperanceSanctuaryModalProps) {
  const [selectedCompulsion, setSelectedCompulsion] = useState(PRESET_COMPULSIONS[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customVow, setCustomVow] = useState('');
  const [selectedDays, setSelectedDays] = useState(15);
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRelapseConfirm, setShowRelapseConfirm] = useState(false);

  if (!isOpen) return null;

  const titleToSeal = selectedCompulsion.id === 'custom' ? customTitle : selectedCompulsion.title;
  const vowToSeal = selectedCompulsion.id === 'custom' ? customVow : selectedCompulsion.vow;

  // Calcular métricas si hay pacto activo
  const today = new Date();
  const endDate = activeOath ? new Date(activeOath.end_date) : null;
  const diffTime = endDate ? endDate.getTime() - today.getTime() : 0;
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysCompleted = activeOath ? Math.max(0, activeOath.duration_days - diffDays) : 0;
  const progressPercent = activeOath
    ? Math.min(100, Math.round((daysCompleted / activeOath.duration_days) * 100))
    : 0;

  const handleSeal = async () => {
    if (!titleToSeal.trim() || !signature.trim()) {
      soundFx.playWarning();
      return;
    }
    setIsSubmitting(true);
    try {
      await onSealOath({
        title: titleToSeal.trim(),
        vow: vowToSeal.trim() || 'Pacto de templanza y soberanía inquebrantable',
        durationDays: selectedDays,
        signature: signature.trim(),
      });
      onClose();
    } catch {
      // Error manejado arriba
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVictory = async () => {
    if (!onConfirmDailyVictory) return;
    setIsSubmitting(true);
    try {
      await onConfirmDailyVictory();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelapse = async () => {
    if (!onDeclareRelapse) return;
    setIsSubmitting(true);
    try {
      await onDeclareRelapse();
      setShowRelapseConfirm(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="relative rounded-2xl bg-[#FAF9F5] max-w-sm w-full p-5 space-y-4 border border-[#E4E1D8] shadow-[0_16px_40px_rgba(26,25,21,0.16)] animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Cabecera Editorial */}
        <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D9383A]/10 border border-[#D9383A]/20 flex items-center justify-center text-[#D9383A]">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-editorial text-sm font-bold text-[#1C1B18] tracking-tight">
                Cámara de Templanza
              </h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#706E66]">
                El Frente Interno · Autodominio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#706E66] hover:text-[#1C1B18] hover:bg-[#EAE7DF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* CASO A: TIENE UN PACTO ACTIVO (MODO GUARDIÁN)                       */}
        {/* ------------------------------------------------------------------ */}
        {activeOath ? (
          <div className="space-y-4">
            {/* Tarjeta de Estatus de Templanza */}
            <div className="rounded-xl bg-white border border-[#E4E1D8] p-3.5 space-y-2.5 shadow-[0_2px_8px_rgba(26,25,21,0.03)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#D9383A] bg-[#D9383A]/10 px-2 py-0.5 rounded-md border border-[#D9383A]/20">
                      Pacto Inquebrantable
                    </span>
                    <span className="font-mono text-[9px] text-[#706E66]">
                      {activeOath.duration_days} días
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1C1B18] truncate">
                    {activeOath.title}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-bold text-[#1C1B18] block leading-none">
                    Día {daysCompleted}
                  </span>
                  <span className="font-mono text-[9px] text-[#706E66]">
                    de {activeOath.duration_days}
                  </span>
                </div>
              </div>

              {/* Barra de Conquista Milimétrica */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-[#706E66]">
                  <span>Firma: <strong className="text-[#1C1B18]">{activeOath.runic_signature}</strong></span>
                  <span className="font-bold text-[#2E8555]">{progressPercent}% Conquistado</span>
                </div>
                <div className="h-2 w-full bg-[#FAF9F5] border border-[#E4E1D8] rounded-full p-0.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C59B46] to-[#2E8555] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, progressPercent)}%` }}
                  />
                </div>
              </div>

              {activeOath.front_vow && (
                <p className="text-[11px] text-[#706E66] italic bg-[#FAF9F5] p-2 rounded-lg border border-[#E8E5DD] leading-relaxed">
                  "{activeOath.front_vow}"
                </p>
              )}
            </div>

            {/* Recompensas de Vínculo Activas */}
            <div className="rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#C59B46]/20 flex items-center justify-center text-[#C59B46]">
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#1C1B18] uppercase tracking-wider block">
                    Vínculo & Claridad
                  </span>
                  <span className="text-[10px] text-[#706E66] block">
                    Multiplicador activo: <strong className="text-[#C59B46]">1.25x EXP & Pokédólares</strong>
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#C59B46] bg-white px-2 py-1 rounded-md border border-[#C59B46]/30">
                Limpio
              </span>
            </div>

            {/* Botón Dopamínico de Victoria Diaria */}
            <div className="space-y-1.5 pt-1">
              <label className="font-mono text-[10px] font-semibold text-[#706E66] block uppercase tracking-wider">
                Guardia Nocturna (Check-in del día):
              </label>
              <DopamineHoldButton
                holdDurationMs={2000}
                label="CONFIRMAR DÍA VICTORIOSO (2S)"
                holdingLabelPrefix="CONFIRMANDO VICTORIA"
                completedLabel="¡DÍA DEFENDIDO CON HONOR!"
                colorScheme="green"
                onComplete={handleVictory}
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-[#706E66] text-center font-mono">
                Mantén presionado para registrar tu día libre de compulsión.
              </p>
            </div>

            {/* Declarar Recaída */}
            <div className="pt-2 border-t border-[#E4E1D8]">
              {!showRelapseConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowRelapseConfirm(true)}
                  className="w-full text-center text-[11px] font-mono text-[#A02426] hover:underline cursor-pointer py-1.5"
                >
                  Declarar Recaída (Reiniciar con Honor)
                </button>
              ) : (
                <div className="rounded-xl bg-[#D9383A]/10 border border-[#D9383A]/30 p-3 space-y-2 text-center animate-in fade-in duration-100">
                  <div className="flex items-center justify-center gap-1.5 text-[#D9383A]">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold">¿Deseas registrar una recaída?</span>
                  </div>
                  <p className="text-[11px] text-[#706E66] leading-snug">
                    Caer no borra lo aprendido. Se reiniciará el pacto actual para que vuelvas a forjarlo más fuerte.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRelapseConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg bg-white border border-[#E4E1D8] text-xs font-mono font-semibold text-[#1C1B18]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleRelapse}
                      disabled={isSubmitting}
                      className="flex-1 py-1.5 rounded-lg bg-[#D9383A] text-white text-xs font-mono font-bold shadow-[0_2px_0px_#A02426]"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------ */
          /* CASO B: SIN PACTO ACTIVO (SELLAR NUEVO PACTO)                      */
          /* ------------------------------------------------------------------ */
          <div className="space-y-3.5">
            <p className="text-xs text-[#706E66] leading-relaxed">
              Elige tu batalla de autodominio. Una vez sellado con tu firma, quedará
              <strong> bloqueado</strong> por los días elegidos.
            </p>

            {/* 1. Selección de Compulsión */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold text-[#706E66] block uppercase tracking-wider">
                1. Selecciona tu Némesis:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_COMPULSIONS.map((c) => {
                  const isSelected = selectedCompulsion.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedCompulsion(c);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#D9383A] shadow-[0_2px_8px_rgba(217,56,58,0.1)] ring-1 ring-[#D9383A]'
                          : 'bg-white border-[#E4E1D8] hover:bg-[#F2EFE9] text-[#706E66]'
                      }`}
                    >
                      <div className="text-sm mb-0.5">{c.icon}</div>
                      <div className="text-[11px] font-bold text-[#1C1B18] leading-tight truncate">
                        {c.title}
                      </div>
                      <div className="text-[9px] font-mono text-[#706E66] mt-0.5">{c.tag}</div>
                    </button>
                  );
                })}
              </div>

              {selectedCompulsion.id === 'custom' && (
                <div className="pt-1.5 space-y-1.5">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ej. Cero Apuestas / Alcohol"
                    className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2 text-xs text-[#1C1B18] focus:outline-none focus:border-[#D9383A]"
                  />
                  <input
                    type="text"
                    value={customVow}
                    onChange={(e) => setCustomVow(e.target.value)}
                    placeholder="Tu regla inviolable en una frase..."
                    className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2 text-xs text-[#1C1B18] focus:outline-none focus:border-[#D9383A]"
                  />
                </div>
              )}
            </div>

            {/* 2. Duración del Bloqueo */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold text-[#706E66] block uppercase tracking-wider">
                2. Plazo de Bloqueo Inmutable:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {DURATION_PRESETS.map((d) => {
                  const isSelected = selectedDays === d.days;
                  return (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedDays(d.days);
                      }}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1C1B18] border-[#1C1B18] text-white shadow-[0_2px_0px_#000]'
                          : 'bg-white border-[#E4E1D8] text-[#1C1B18] hover:bg-[#F2EFE9]'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold block">{d.days}d</span>
                      <span className="text-[9px] font-mono block opacity-75">{d.tier}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Firma de Honor */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold text-[#706E66] block uppercase tracking-wider">
                3. Firma Rúnica de Líder:
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Escribe tu alias de compromiso (ej. RED-01)"
                className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2.5 text-xs font-mono text-[#D9383A] font-bold focus:outline-none focus:border-[#D9383A] shadow-inner"
              />
            </div>

            {/* 4. Botón Dopamínico de Sellado */}
            <div className="pt-2">
              <DopamineHoldButton
                holdDurationMs={3000}
                label="MANTÉN PRESIONADO 3S PARA SELLAR"
                holdingLabelPrefix="SELLANDO PACTO"
                completedLabel="¡PACTO SELLADO Y BLOQUEADO!"
                colorScheme="red"
                onComplete={handleSeal}
                disabled={isSubmitting || !titleToSeal.trim() || !signature.trim()}
              />
              <p className="text-[10px] text-[#706E66] text-center font-mono mt-1.5">
                Feedback háptico y sonoro activo. Sin marcha atrás.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
