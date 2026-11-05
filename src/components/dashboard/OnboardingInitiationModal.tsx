'use client';

import React, { useState } from 'react';
import { 
  Dumbbell, 
  Briefcase, 
  GraduationCap, 
  Brain, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X,
  Compass,
  Plus,
  ChevronLeft,
  Edit3
} from 'lucide-react';
import { DopamineHoldButton } from '@/components/ui/DopamineHoldButton';
import { soundFx } from '@/lib/soundFx';

export interface OnboardingPresetHabit {
  pilar: 'vigor' | 'oficio' | 'maestria' | 'claridad';
  pilarName: string;
  title: string;
  subtitle: string;
  gold: number;
  battery: number;
}

export interface OnboardingPactData {
  title: string;
  vow: string;
  durationDays: number;
  signature: string;
}

interface OnboardingInitiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName?: string;
  onCompleteInitiation: (data: {
    habits: OnboardingPresetHabit[];
    pact: OnboardingPactData;
  }) => Promise<void>;
}

// Opciones recomendadas adaptadas a tu rutina real + opción de personalizar
const PILAR_OPTIONS = [
  {
    pilar: 'oficio' as const,
    name: '1. Oficio & Negocio (Monetización)',
    tag: 'FRENTE TRABAJO',
    color: '#2D68C4',
    bg: 'bg-[#2D68C4]/8 border-[#2D68C4]/20 text-[#2D68C4]',
    icon: Briefcase,
    presets: [
      {
        title: 'Control Monetización IA / Programar (30 min)',
        subtitle: 'Revisar páginas web de ingresos y contenido automatizado',
        gold: 150,
        battery: 15,
      },
      {
        title: 'Proyectos Nuevos de Ingresos a Futuro (1 hora)',
        subtitle: 'Construcción enfocada de nuevos flujos de capital',
        gold: 250,
        battery: 25,
      },
      {
        title: 'Marca Personal & Creación de Contenido (1 hora)',
        subtitle: 'Posicionamiento, videos y autoridad profesional',
        gold: 250,
        battery: 25,
      },
    ],
  },
  {
    pilar: 'vigor' as const,
    name: '2. Vigor & Físico',
    tag: 'FRENTE VIGOR',
    color: '#D9383A',
    bg: 'bg-[#D9383A]/8 border-[#D9383A]/20 text-[#D9383A]',
    icon: Dumbbell,
    presets: [
      {
        title: 'Actividad Física & Salud (30 min)',
        subtitle: 'Pesas, cardio o calistenia para despertar el cuerpo',
        gold: 150,
        battery: 15,
      },
      {
        title: 'Sesión de Fuerza Intensa (45-60 min)',
        subtitle: 'Entrenamiento duro en gimnasio sin celular',
        gold: 180,
        battery: 20,
      },
      {
        title: '10,000 Pasos + 2.5L Agua',
        subtitle: 'Movimiento continuo e hidratación activa',
        gold: 100,
        battery: 15,
      },
    ],
  },
  {
    pilar: 'maestria' as const,
    name: '3. Maestría & Empleabilidad',
    tag: 'FRENTE SABIDURÍA',
    color: '#C59B46',
    bg: 'bg-[#C59B46]/10 border-[#C59B46]/25 text-[#9A7025]',
    icon: GraduationCap,
    presets: [
      {
        title: 'Aprender y Practicar sobre mi Profesión (1 hora)',
        subtitle: 'Estudio técnico profundo y maestría en mi oficio',
        gold: 200,
        battery: 20,
      },
      {
        title: 'Actualizar LinkedIn & Oportunidades Laborales (30 min)',
        subtitle: 'Networking, perfil optimizado y búsqueda de empleo',
        gold: 120,
        battery: 15,
      },
      {
        title: 'Lectura Estratégica (20 págs)',
        subtitle: 'Libros de desarrollo, negocio o filosofía',
        gold: 100,
        battery: 10,
      },
    ],
  },
  {
    pilar: 'claridad' as const,
    name: '4. Claridad & Orden del Hogar',
    tag: 'FRENTE PAZ',
    color: '#2E8555',
    bg: 'bg-[#2E8555]/10 border-[#2E8555]/25 text-[#2E8555]',
    icon: Brain,
    presets: [
      {
        title: 'Meditación & Calma Mental (20 min)',
        subtitle: 'Silencio absoluto, respiración profunda y reset dopamínico',
        gold: 100,
        battery: 10,
      },
      {
        title: 'Limpieza Diaria & Orden del Hogar (30 min)',
        subtitle: 'Barrer, ordenar el cuarto y dejar el entorno impecable',
        gold: 100,
        battery: 10,
      },
      {
        title: 'Planificación & Cierre Nocturno',
        subtitle: 'Agendar las 3 prioridades del día siguiente antes de dormir',
        gold: 80,
        battery: 10,
      },
    ],
  },
];

const TEMPERANCE_OPTIONS = [
  {
    id: 'nofap',
    title: 'No Fap & Cero Masturbación',
    tag: 'Transmutación Sexual de Acero',
    vow: 'Transmuto mi energía sexual en enfoque, músculo y proyectos de alto valor. Cero pornografía ni masturbación.',
    icon: '🛡️',
  },
  {
    id: 'nicotine',
    title: 'Cero Nicotina & Vape',
    tag: 'Pulmones Limpios',
    vow: 'Respiración consciente frente al estrés. No volveré al humo ni al vaper.',
    icon: '🚭',
  },
  {
    id: 'junk_dopamine',
    title: 'Cero Redes / Gaming Chatarra',
    tag: 'Foco Absoluto',
    vow: 'Cero scroll infinito compulsivo en redes sociales ni juegos basura antes de cumplir mis metas.',
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

export function OnboardingInitiationModal({
  isOpen,
  onClose,
  trainerName = 'Marty',
  onCompleteInitiation,
}: OnboardingInitiationModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Paso 1: 4 Misiones | Paso 2: Pacto Templanza
  
  // Selección de hábitos: almacena índice o objeto personalizado
  const [selectedHabits, setSelectedHabits] = useState<{ [key: string]: number }>({
    oficio: 0,
    vigor: 0,
    maestria: 0,
    claridad: 0,
  });

  // Hábitos personalizados escritos por el usuario
  const [customHabits, setCustomHabits] = useState<{ [key: string]: { title: string; subtitle: string; gold: number; battery: number } }>({});
  const [editingCustomPilar, setEditingCustomPilar] = useState<string | null>(null);
  const [customInputTitle, setCustomInputTitle] = useState('');
  const [customInputSubtitle, setCustomInputSubtitle] = useState('');

  // Datos del Pacto de Templanza
  const [selectedCompulsion, setSelectedCompulsion] = useState(TEMPERANCE_OPTIONS[0]);
  const [customPactTitle, setCustomPactTitle] = useState('');
  const [customPactVow, setCustomPactVow] = useState('');
  const [pactDays, setPactDays] = useState(30); // 30 DÍAS POR DEFECTO
  const [signature, setSignature] = useState(trainerName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (pilar: string, index: number) => {
    soundFx.playClick();
    setSelectedHabits((prev) => ({ ...prev, [pilar]: index }));
    setEditingCustomPilar(null);
  };

  const handleSaveCustomHabit = (pilar: string) => {
    if (!customInputTitle.trim()) return;
    soundFx.playLevelUp();
    setCustomHabits((prev) => ({
      ...prev,
      [pilar]: {
        title: customInputTitle.trim(),
        subtitle: customInputSubtitle.trim() || 'Hábito personalizado de alta disciplina',
        gold: 150,
        battery: 15,
      },
    }));
    setSelectedHabits((prev) => ({ ...prev, [pilar]: 999 })); // 999 indica personalizado
    setEditingCustomPilar(null);
    setCustomInputTitle('');
    setCustomInputSubtitle('');
  };

  const handleNextStep = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    setStep(2);
  };

  const handleFinalInitiation = async () => {
    setIsSubmitting(true);
    try {
      const finalHabits: OnboardingPresetHabit[] = PILAR_OPTIONS.map((p) => {
        const selectedIdx = selectedHabits[p.pilar] ?? 0;
        if (selectedIdx === 999 && customHabits[p.pilar]) {
          return {
            pilar: p.pilar,
            pilarName: p.name,
            title: customHabits[p.pilar].title,
            subtitle: customHabits[p.pilar].subtitle,
            gold: customHabits[p.pilar].gold,
            battery: customHabits[p.pilar].battery,
          };
        }
        const preset = p.presets[selectedIdx] || p.presets[0];
        return {
          pilar: p.pilar,
          pilarName: p.name,
          title: preset.title,
          subtitle: preset.subtitle,
          gold: preset.gold,
          battery: preset.battery,
        };
      });

      const finalPactTitle = selectedCompulsion.id === 'custom' ? customPactTitle : selectedCompulsion.title;
      const finalPactVow = selectedCompulsion.id === 'custom' ? customPactVow : selectedCompulsion.vow;

      const finalPact: OnboardingPactData = {
        title: finalPactTitle.trim() || 'Pacto Sagrado de Templanza (30 Días)',
        vow: finalPactVow.trim() || 'Transmuto mi energía sexual en disciplina de acero.',
        durationDays: pactDays,
        signature: signature.trim() || trainerName,
      };

      await onCompleteInitiation({
        habits: finalHabits,
        pact: finalPact,
      });

      onClose();
    } catch {
      // Error manejado en parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="relative rounded-2xl bg-[#FAF9F5] max-w-md w-full p-5 space-y-4 border border-[#E4E1D8] shadow-[0_20px_48px_rgba(26,25,21,0.2)] animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Cabecera Editorial Retro-Premium */}
        <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D9383A] text-white flex items-center justify-center shadow-[0_2px_0px_#B22B2D]">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-sm font-bold text-[#1C1B18]">
                  Ceremonia de Iniciación
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FAF4E8] text-[#9A7025] border border-[#C59B46]/30">
                  {step === 1 ? 'PASO 1 DE 2' : 'PASO 2 DE 2'}
                </span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#706E66]">
                {step === 1 ? 'Tus 4 Pilares de Alto Rendimiento' : 'Pacto de Templanza 30 Días No Fap'}
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
        {/* PASO 1: SELECCIONAR O PERSONALIZAR LAS 4 MISIONES                  */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="rounded-xl bg-white border border-[#E4E1D8] p-3 text-xs text-[#706E66] leading-relaxed shadow-[0_1px_2px_rgba(26,25,21,0.02)]">
              Elige tu <strong className="text-[#1C1B18]">misión insignia</strong> para cada pilar o toca en <strong className="text-[#2D68C4]">+ Personalizar</strong> si deseas escribir tu propia tarea exacta.
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {PILAR_OPTIONS.map((p) => {
                const IconComponent = p.icon;
                const activeIndex = selectedHabits[p.pilar] ?? 0;
                const isCustomSelected = activeIndex === 999;
                const isEditingThis = editingCustomPilar === p.pilar;

                return (
                  <div key={p.pilar} className="rounded-xl bg-white border border-[#E4E1D8] p-3 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${p.bg}`}>
                          <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-bold text-[#1C1B18] tracking-tight">{p.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#706E66] uppercase">{p.tag}</span>
                    </div>

                    {/* Chips de hábitos del pilar */}
                    <div className="grid grid-cols-1 gap-1.5">
                      {p.presets.map((preset, idx) => {
                        const isSelected = activeIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPreset(p.pilar, idx)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-[#FAF9F5] border-[#1C1B18] shadow-[0_2px_0px_#1C1B18]'
                                : 'bg-white border-[#E8E5DD] hover:bg-[#F7F5F0]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold leading-snug truncate ${isSelected ? 'text-[#1C1B18]' : 'text-[#706E66]'}`}>
                                {preset.title}
                              </p>
                              <p className="text-[10px] text-[#8C887E] line-clamp-1 leading-tight font-mono">
                                {preset.subtitle}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono font-bold text-[#9A7025] bg-[#C59B46]/10 px-1.5 py-0.5 rounded border border-[#C59B46]/20">
                                +{preset.gold} ₽
                              </span>
                              <span className="text-[9px] font-mono font-bold text-[#2D68C4] bg-[#2D68C4]/10 px-1.5 py-0.5 rounded border border-[#2D68C4]/20">
                                +{preset.battery}m
                              </span>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${isSelected ? 'bg-[#1C1B18] text-white border-[#1C1B18]' : 'border-[#DCD8CD] text-transparent'}`}>
                                ✓
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* Opción Personalizada Guardada */}
                      {customHabits[p.pilar] && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedHabits((prev) => ({ ...prev, [p.pilar]: 999 }));
                          }}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isCustomSelected
                              ? 'bg-[#FAF9F5] border-[#2D68C4] shadow-[0_2px_0px_#2D68C4]'
                              : 'bg-white border-[#E8E5DD] hover:bg-[#F7F5F0]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#2D68C4] truncate">
                              ✍️ {customHabits[p.pilar].title}
                            </p>
                            <p className="text-[10px] text-[#706E66] font-mono">
                              {customHabits[p.pilar].subtitle}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${isCustomSelected ? 'bg-[#2D68C4] text-white border-[#2D68C4]' : 'border-[#DCD8CD] text-transparent'}`}>
                            ✓
                          </div>
                        </button>
                      )}

                      {/* Botón para abrir el input de personalización */}
                      {!isEditingThis ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setEditingCustomPilar(p.pilar);
                          }}
                          className="py-1.5 px-2 rounded-lg border border-dashed border-[#DCD8CD] hover:border-[#1C1B18] text-[10px] font-mono font-semibold text-[#706E66] hover:text-[#1C1B18] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Escribir hábito personalizado para este pilar</span>
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] space-y-2 animate-in fade-in duration-100">
                          <input
                            type="text"
                            value={customInputTitle}
                            onChange={(e) => setCustomInputTitle(e.target.value)}
                            placeholder="Nombre exacto del hábito (ej. 30 min LinkedIn)"
                            className="w-full bg-white border border-[#E4E1D8] rounded-lg p-2 text-xs text-[#1C1B18] focus:outline-none focus:border-[#2D68C4]"
                          />
                          <input
                            type="text"
                            value={customInputSubtitle}
                            onChange={(e) => setCustomInputSubtitle(e.target.value)}
                            placeholder="Descripción breve de 1 línea"
                            className="w-full bg-white border border-[#E4E1D8] rounded-lg p-2 text-xs text-[#706E66] focus:outline-none focus:border-[#2D68C4]"
                          />
                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingCustomPilar(null)}
                              className="px-2.5 py-1 text-xs font-mono text-[#706E66] hover:text-[#1C1B18]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveCustomHabit(p.pilar)}
                              disabled={!customInputTitle.trim()}
                              className="flex-1 py-1 px-3 rounded-lg bg-[#2D68C4] text-white text-xs font-mono font-bold disabled:opacity-50"
                            >
                              Guardar y Seleccionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Siguiente Paso */}
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3 rounded-xl bg-[#1C1B18] hover:bg-[#2C2A25] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <span>Continuar al Pacto de Templanza (No Fap)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PASO 2: SELLAR EL PACTO DE TEMPLANZA (NO FAP / 30 DÍAS)            */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="rounded-xl bg-[#D9383A]/8 border border-[#D9383A]/20 p-3 text-xs text-[#706E66] leading-relaxed">
              El <strong className="text-[#D9383A]">Pacto de Templanza</strong> cuida tu energía vital. Mantén la pureza mental por <strong className="text-[#1C1B18]">30 días inmutables</strong> para potenciar tu vida laboral, física y personal.
            </div>

            {/* 1. Compulsión a erradicar */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold text-[#706E66] block uppercase tracking-wider">
                1. Némesis a derrotar:
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {TEMPERANCE_OPTIONS.map((opt) => {
                  const isSelected = selectedCompulsion.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedCompulsion(opt);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-white border-[#D9383A] shadow-[0_2px_8px_rgba(217,56,58,0.1)] ring-1 ring-[#D9383A]'
                          : 'bg-white border-[#E8E5DD] hover:bg-[#F2EFE9] text-[#706E66]'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1C1B18] truncate leading-tight">
                          {opt.title}
                        </p>
                        <p className="text-[10px] font-mono text-[#706E66]">
                          {opt.tag}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedCompulsion.id === 'custom' && (
                <div className="pt-1.5 space-y-1.5 animate-in fade-in duration-100">
                  <input
                    type="text"
                    value={customPactTitle}
                    onChange={(e) => setCustomPactTitle(e.target.value)}
                    placeholder="Título del pacto (ej. Cero Apuestas / Alcohol)"
                    className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2 text-xs text-[#1C1B18] focus:outline-none focus:border-[#D9383A]"
                  />
                  <input
                    type="text"
                    value={customPactVow}
                    onChange={(e) => setCustomPactVow(e.target.value)}
                    placeholder="Tu voto o compromiso en una frase..."
                    className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2 text-xs text-[#1C1B18] focus:outline-none focus:border-[#D9383A]"
                  />
                </div>
              )}
            </div>

            {/* 2. Días de Bloqueo Inmutable */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold text-[#706E66] block uppercase tracking-wider">
                2. Duración del Bloqueo:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[7, 15, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPactDays(d);
                    }}
                    className={`py-2 rounded-xl text-center border font-mono transition-all cursor-pointer ${
                      pactDays === d
                        ? 'bg-[#1C1B18] border-[#1C1B18] text-white shadow-[0_2px_0px_#000]'
                        : 'bg-white border-[#E8E5DD] text-[#1C1B18] hover:bg-[#F2EFE9]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{d} Días</span>
                    <span className="text-[9px] opacity-75">{d === 7 ? 'Prueba' : d === 15 ? 'Firme' : 'Oro / Acero'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Firma */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold text-[#706E66] block uppercase tracking-wider">
                3. Firma Rúnica:
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Tu alias de honor"
                className="w-full bg-white border border-[#E4E1D8] rounded-xl p-2.5 text-xs font-mono font-bold text-[#D9383A] focus:outline-none focus:border-[#D9383A]"
              />
            </div>

            {/* Botón Dopamínico de Sellado Final */}
            <div className="pt-2 space-y-2">
              <DopamineHoldButton
                holdDurationMs={3000}
                label="MANTÉN PRESIONADO 3S PARA ACTIVAR PACTO"
                holdingLabelPrefix="SELLANDO PACTO NO FAP"
                completedLabel="¡PACTO SELLADO Y BLOQUEADO 30 DÍAS!"
                colorScheme="red"
                onComplete={handleFinalInitiation}
                disabled={isSubmitting || !signature.trim()}
              />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-[10px] font-mono text-[#706E66] hover:text-[#1C1B18] flex items-center justify-center gap-1 cursor-pointer py-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Volver a editar mis hábitos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
