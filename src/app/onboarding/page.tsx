'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTrainerStore } from '@/store/useTrainerStore';
import { StarterPokemon, NatureRole } from '@/types/trainer';
import { 
  Bot, 
  Flame, 
  Droplets, 
  Sprout, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  User, 
  Terminal,
  Zap,
  Phone
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    role: NatureRole;
    starter: StarterPokemon;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Tu equipo está a punto de desplegar en producción y hay una falla crítica en la pantalla. ¿Cuál es tu primer impulso?',
    options: [
      {
        label: 'Tomar el control del frontend, corregir los estilos y asegurar que la experiencia visual sea impecable.',
        role: 'fuego_ui',
        starter: 'cyndaquil'
      },
      {
        label: 'Revisar la base de datos, validar la consistencia de los datos y blindar las políticas RLS.',
        role: 'agua_data',
        starter: 'totodile'
      },
      {
        label: 'Conectar un webhook de alerta automática y armar un bot que diagnostique el error al instante.',
        role: 'planta_bots',
        starter: 'chikorita'
      }
    ]
  },
  {
    id: 2,
    text: 'En una noche de hackathon, ¿qué tipo de proyecto te apasiona construir desde cero?',
    options: [
      {
        label: 'Un videojuego retro interactivo en Canvas o una interfaz cyber con animaciones fluidas.',
        role: 'fuego_ui',
        starter: 'cyndaquil'
      },
      {
        label: 'Un panel de analíticas en tiempo real con millones de registros sincronizados al segundo.',
        role: 'agua_data',
        starter: 'totodile'
      },
      {
        label: 'Un ejército de bots autónomos que se comunican entre sí mediante APIs de IA.',
        role: 'planta_bots',
        starter: 'chikorita'
      }
    ]
  },
  {
    id: 3,
    text: 'Cuando te enfrentas a un jefe de código desconocido en la Arena, ¿cuál es tu filosofía?',
    options: [
      {
        label: 'Agilidad y vanguardia: atacar primero con prototipado rápido y feedback visual.',
        role: 'fuego_ui',
        starter: 'cyndaquil'
      },
      {
        label: 'Estructura inquebrantable: construir cimientos sólidos y esquemas que nunca caigan.',
        role: 'agua_data',
        starter: 'totodile'
      },
      {
        label: 'Ecosistema simbiótico: conectar todas las herramientas existentes para ganar con ingenio.',
        role: 'planta_bots',
        starter: 'chikorita'
      }
    ]
  }
];

const STARTERS_INFO = {
  cyndaquil: {
    name: 'Cyndaquil',
    element: 'Fuego',
    role: 'fuego_ui' as NatureRole,
    roleTitle: 'Vanguardia / Interfaces & Juegos',
    desc: 'Especialista en la capa visible, microinteracciones, renderizado en canvas y experiencia del usuario.',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/80 text-amber-300',
    icon: Flame
  },
  totodile: {
    name: 'Totodile',
    element: 'Agua',
    role: 'agua_data' as NatureRole,
    roleTitle: 'Guardián de Datos / Supabase',
    desc: 'Especialista en persistencia, esquemas relacionales, seguridad RLS y sincronización en tiempo real.',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/80 text-cyan-300',
    icon: Droplets
  },
  chikorita: {
    name: 'Chikorita',
    element: 'Planta',
    role: 'planta_bots' as NatureRole,
    roleTitle: 'Conector / Bots & APIs',
    desc: 'Especialista en webhooks, orquestación de agentes con IA y tuberías de automatización para eventos.',
    color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/80 text-emerald-300',
    icon: Sprout
  }
};

export default function OnboardingPage() {
  const router = useRouter();
  const updateProfile = useTrainerStore((s) => s.updateProfile);

  const [userId, setUserId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string>('Aspirante Gold');
  const [parentWhatsapp, setParentWhatsapp] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<NatureRole[]>([]);
  const [recommendedStarter, setRecommendedStarter] = useState<StarterPokemon>('cyndaquil');
  const [selectedStarter, setSelectedStarter] = useState<StarterPokemon>('cyndaquil');
  const [isTestCompleted, setIsTestCompleted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Verificar sesión de Supabase
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (user.user_metadata?.full_name) {
          setTrainerName(user.user_metadata.full_name);
        }

        // Si ya tiene perfil con starter seleccionado, ir a dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('starter_pokemon, parent_whatsapp')
          .eq('id', user.id)
          .single();

        if (profile?.starter_pokemon) {
          router.push('/dashboard');
        }
      }
    }
    checkUser();
  }, [router]);

  // Manejar respuesta
  const handleSelectOption = (role: NatureRole, starter: StarterPokemon) => {
    const updated = [...answers, role];
    setAnswers(updated);

    if (currentQuestionIndex + 1 < QUESTIONS.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calcular rol más frecuente
      const counts: Record<NatureRole, number> = { fuego_ui: 0, agua_data: 0, planta_bots: 0 };
      updated.forEach((r) => counts[r]++);

      let topRole: NatureRole = 'fuego_ui';
      let maxCount = -1;
      (Object.keys(counts) as NatureRole[]).forEach((r) => {
        if (counts[r] > maxCount) {
          maxCount = counts[r];
          topRole = r;
        }
      });

      const recStarter: StarterPokemon = 
        topRole === 'fuego_ui' ? 'cyndaquil' :
        topRole === 'agua_data' ? 'totodile' : 'chikorita';

      setRecommendedStarter(recStarter);
      setSelectedStarter(recStarter);
      setIsTestCompleted(true);
    }
  };

  // Guardar en Supabase y activar triggers automáticos
  const handleConfirmStarter = async () => {
    setIsSubmitting(true);
    const chosenRole = STARTERS_INFO[selectedStarter].role;
    const cleanParentPhone = parentWhatsapp.trim() ? parentWhatsapp.trim() : null;

    try {
      if (userId) {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            trainer_name: trainerName,
            starter_pokemon: selectedStarter,
            nature_role: chosenRole,
            parent_whatsapp: cleanParentPhone,
            pokedollars: 50,
            battery_minutes: 30,
            streak_days: 1,
            egg_steps: 0,
            current_level: 1,
            xp: 0
          });
      }

      // Actualizar estado en Zustand
      updateProfile({
        trainer_name: trainerName,
        starter_pokemon: selectedStarter,
        nature_role: chosenRole,
        parent_whatsapp: cleanParentPhone,
        pokedollars: 50,
        battery_minutes: 30,
        streak_days: 1,
        egg_steps: 0,
        current_level: 1,
        xp: 0
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = QUESTIONS[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-mono flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#0e1526] border-2 border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Cabecera del Test */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Evaluación de Naturaleza Técnica</span>
                <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.2 rounded">Código Silver</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                Ceremonia de Iniciación Cyber-Johto
              </h2>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-bold">
            {!isTestCompleted ? `PREGUNTA ${currentQuestionIndex + 1}/${QUESTIONS.length}` : 'ELECCIÓN FINAL'}
          </div>
        </div>

        {/* Fase 1: Preguntas del Test */}
        {!isTestCompleted ? (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Terminal className="w-4 h-4" />
                <span>DIAGNÓSTICO PSICOTÉCNICO:</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                &ldquo;{currentQ.text}&rdquo;
              </p>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt.role, opt.starter)}
                  className="w-full text-left p-4 bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 rounded-xl text-xs sm:text-sm text-slate-300 hover:text-white transition-all flex items-start gap-3 cursor-pointer group"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Fase 2: Formulario & Elección de Inicial */
          <div className="mt-6 space-y-5">
            {/* Inputs Nombre y WhatsApp de Padres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Tu Nombre de Entrenador:</span>
                </label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 px-3 py-2 rounded-lg text-sm text-amber-300 font-bold focus:outline-none"
                  placeholder="Ej. Red Neo"
                />
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Padre/Madre (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={parentWhatsapp}
                  onChange={(e) => setParentWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 px-3 py-2 rounded-lg text-sm text-emerald-300 font-bold focus:outline-none"
                  placeholder="Ej. 51987654321"
                />
              </div>
            </div>

            {/* Sugerencia de Código Silver */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Según tus reflejos, tu naturaleza resuena con{' '}
                <strong className="uppercase underline">{STARTERS_INFO[recommendedStarter].name} ({STARTERS_INFO[recommendedStarter].element})</strong>:
              </span>
            </div>

            {/* Tarjetas de Selección de Iniciales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(STARTERS_INFO) as StarterPokemon[]).map((key) => {
                const info = STARTERS_INFO[key];
                const Icon = info.icon;
                const isSelected = selectedStarter === key;
                const isRecommended = recommendedStarter === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedStarter(key)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? `bg-slate-900 ${info.color} shadow-[0_0_20px_rgba(245,158,11,0.2)]`
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full uppercase">
                        RECOMENDADO
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase">{info.element}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-100">{info.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{info.roleTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{info.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span>{isSelected ? '✓ SELECCIONADO' : 'Click para elegir'}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recompensas de Bienvenida */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Pack de Iniciación:</span>
              </span>
              <span className="font-bold text-amber-300">₽50 Pokédólares + 30m Batería GBA</span>
            </div>

            {/* Botón de Confirmación */}
            <button
              onClick={handleConfirmStarter}
              disabled={isSubmitting || !trainerName.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>
                {isSubmitting
                  ? 'Guardando perfil y notificando a la Liga...'
                  : `Ingresar a la Academia con ${STARTERS_INFO[selectedStarter].name}`}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
