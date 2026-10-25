'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Wind, 
  Sprout, 
  Eye, 
  Flame, 
  ChevronRight, 
  ChevronLeft,
  Cat,
  Zap,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface GrimoireSovereignModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderName?: string;
}

export function GrimoireSovereignModal({
  isOpen,
  onClose,
  leaderName = 'Martín',
}: GrimoireSovereignModalProps) {
  const [activeTab, setActiveTab] = useState<'chapters' | 'sos' | 'terrace' | 'mirror'>('chapters');
  const [currentChapter, setCurrentChapter] = useState(0);

  // Estados de SOS (Respiración Guiada 4-4-4-4)
  const [sosActive, setSosActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Retén' | 'Exhala' | 'Vacío'>('Inhala');

  // Estados del Modo Terraza (Temporizador 60m)
  const [terraceActive, setTerraceActive] = useState(false);
  const [terraceSecondsLeft, setTerraceSecondsLeft] = useState(3600);

  const chapters = [
    {
      id: 1,
      title: 'I. La Muralla del Proveedor',
      subtitle: 'Por qué cada video y cada lead protegen a tu clan',
      tag: 'MISIÓN',
      content: [
        'No estás creando contenido para alimentar un ego efímero. Cada guion que redactas, cada video que editas y cada mensaje que envías a un salón de belleza es un ladrillo en la muralla que protege tu soberanía.',
        'La pereza no es un descanso inofensivo; es una brecha abierta por la que entran la incertidumbre y la dependencia. Tu clan, tus proyectos y tu libertad dependen de tu capacidad de sentarte frente a la cámara y ejecutar.',
        '7,000 personas te siguen porque ven autoridad en ti. Tienes 54 videos como prueba de que eres capaz. La constancia no es magia; es la repetición implacable de lo que funciona.'
      ],
      quote: '"La disciplina del líder es la paz y el sustento de su tribu."',
    },
    {
      id: 2,
      title: 'II. La Ilusión de las 2:00 AM',
      subtitle: 'Cómo neutralizar la trampa de la noche y la complacencia',
      tag: 'TEMPLANZA',
      content: [
        'En la madrugada, cuando el mundo duerme, la mente fatigada se vuelve vulnerable. Te susurra que mereces un escape barato, una recompensa fácil, una satisfacción vacía que no te costó ningún esfuerzo.',
        'Es una trampa biológica. Esa gratificación instantánea te roba la energía vital de la mañana siguiente, destruye tu claridad mental y te despierta a las 10:00 AM sintiendo el peso del arrepentimiento.',
        'Cuando la noche se vuelva densa, recuerda este pacto: transmutar esa energía. Apaga la pantalla, bebe agua, respira hondo y guarda ese fuego para encender la forja del día siguiente.'
      ],
      quote: '"El guerrero que domina su noche despierta como rey de su mañana."',
    },
    {
      id: 3,
      title: 'III. La Ley de los 10 Tomates Río Grande',
      subtitle: 'La paciencia orgánica de la tierra aplicada a tus negocios',
      tag: 'SABIDURÍA',
      content: [
        'Miras tus 10 plantas de tomate Río Grande en la terraza. Sabes que no puedes forzarlas a dar frutos mañana tirando de sus tallos. Si lo intentas, las quiebras. Necesitan tierra fértil, baldes de 20 litros, agua justa y sol continuo.',
        'Tus negocios operan bajo la misma ley biológica. Tu SaaS de salones y tu SaaS de restaurantes veganos necesitan tiempo de enraizamiento. El cliente que te prometió $150 tras 30 días de prueba está observando tu solidez.',
        'No busques la cosecha apresurada. Enfócate en regar la tierra cada día: 1 video, 1 hora de leads, 1 hora de código. La cosecha vendrá sola por peso natural.'
      ],
      quote: '"Quien cuida la raíz no tiene por qué temer a la sequía."',
    },
    {
      id: 4,
      title: 'IV. El Fuego de la Transmutación',
      subtitle: 'La energía sexual como combustible de creación de software',
      tag: 'SOBERANÍA',
      content: [
        'La retención y la templanza no son castigos; son la acumulación deliberada de tu fuerza vital más potente. La energía que engendra vida es la misma que engendra imperios, código elegante y presencia magnética frente al lente.',
        'Cuando sientas la pulsión de la bestia, no luches contra ella como si fuera un enemigo. Reconócela, respira hacia el pecho y canalízala: abre tu editor de código, diseña la interfaz de tu SaaS o sal a bailar y mover tu cuerpo con vigor.',
        '30 días invicto en el Frente de Templanza forjarán una mirada impenetrable y una seguridad que ningún curso ni dinero pueden comprar.'
      ],
      quote: '"El hierro no se endurece huyendo del fuego, sino soportando el calor."',
    },
    {
      id: 5,
      title: 'V. El Manifiesto del Restaurante Vegano',
      subtitle: 'Tu granito de arena para un mundo sin sufrimiento animal',
      tag: 'PROPÓSITO',
      content: [
        'Tu segundo SaaS no es solo una línea de código ni un negocio más: es tu vehículo para transformar la gastronomía y apoyar proyectos éticos. Los restaurantes basados en plantas luchan todos los días contra la inercia del mercado tradicional.',
        'Al darles tecnología moderna, pedidos eficientes y control financiero, estás haciendo que esos negocios prosperen, que sean rentables y que más personas elijan un camino de compasión y salud.',
        'Cada vez que dedicas 1 hora a pulir ese software, estás sirviendo a una causa mayor que tú mismo. Ese es el verdadero propósito que te levantará cuando el ánimo flaquee.'
      ],
      quote: '"Trabajar por una causa justa convierte el cansancio en honor."',
    },
  ];

  // Controlador de Respiración SOS
  const handleStartBreath = () => {
    soundFx.playCoin();
    setSosActive(true);
    let step = 0;
    const phases: Array<'Inhala' | 'Retén' | 'Exhala' | 'Vacío'> = ['Inhala', 'Retén', 'Exhala', 'Vacío'];
    const timer = setInterval(() => {
      step = (step + 1) % 4;
      setBreathPhase(phases[step]);
    }, 4000);

    setTimeout(() => {
      clearInterval(timer);
      setSosActive(false);
      soundFx.playFanfare();
    }, 32000); // 2 ciclos completos de 16 segundos
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#0F1115] border-2 border-[#C5A059]/40 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera del Grimorio */}
        <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C5A059]/30 to-[#14171C] border border-[#C5A059]/60 flex items-center justify-center text-[#C5A059] shadow-[0_2px_10px_rgba(197,160,89,0.3)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-sm tracking-widest text-[#E2E8F0] uppercase">
                  GRIMORIO DEL SOBERANO
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#C5A059] font-mono font-bold">
                  GUÍA DE {leaderName.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-mono">
                Santuario de inspiración, rescate y firmeza estoica
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-[#14171C] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#14171C] border border-[#C5A059]/20 rounded-2xl mb-4 text-[11px] font-mono">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('chapters');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
              activeTab === 'chapters'
                ? 'bg-[#C5A059] text-black shadow-md'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manifiesto</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('sos');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
              activeTab === 'sos'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-rose-400/70 hover:text-rose-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS Calma</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('terrace');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
              activeTab === 'terrace'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400/70 hover:text-emerald-400'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Terraza</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('mirror');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
              activeTab === 'mirror'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-cyan-400/70 hover:text-cyan-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>El Espejo</span>
          </button>
        </div>

        {/* CONTENIDO 1: EL EBOOK INTERACTIVO (MANIFIESTO) */}
        {activeTab === 'chapters' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="bg-[#14171C] border border-[#C5A059]/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] font-mono font-bold tracking-wider">
                  {chapters[currentChapter].tag} • CAPÍTULO {currentChapter + 1}/5
                </span>
                <span className="text-xs text-[#64748B] font-mono">
                  {currentChapter + 1} de {chapters.length}
                </span>
              </div>

              <h4 className="font-serif font-black text-base text-[#E2E8F0] mb-0.5">
                {chapters[currentChapter].title}
              </h4>
              <p className="text-xs text-[#C5A059] font-mono mb-3">
                {chapters[currentChapter].subtitle}
              </p>

              <div className="space-y-2.5 text-xs text-[#CBD5E1] leading-relaxed">
                {chapters[currentChapter].content.map((p, idx) => (
                  <p key={idx} className="border-l-2 border-[#C5A059]/40 pl-2.5">
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 bg-[#0B0C0E]/50 rounded-xl p-2.5 text-center">
                <p className="text-[11px] font-serif italic text-[#C5A059]">
                  {chapters[currentChapter].quote}
                </p>
              </div>
            </div>

            {/* Controles de Capítulo */}
            <div className="flex items-center justify-between pt-1">
              <button
                disabled={currentChapter === 0}
                onClick={() => {
                  soundFx.playClick();
                  setCurrentChapter((prev) => Math.max(0, prev - 1));
                }}
                className="px-3 py-1.5 rounded-xl bg-[#14171C] border border-white/10 text-xs font-mono text-[#E2E8F0] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <div className="flex gap-1.5">
                {chapters.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentChapter(i);
                    }}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                      currentChapter === i ? 'bg-[#C5A059] scale-125' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={currentChapter === chapters.length - 1}
                onClick={() => {
                  soundFx.playClick();
                  setCurrentChapter((prev) => Math.min(chapters.length - 1, prev + 1));
                }}
                className="px-3 py-1.5 rounded-xl bg-[#14171C] border border-white/10 text-xs font-mono text-[#E2E8F0] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO 2: BOTÓN SOS / RESPIRACIÓN ANTI-FLAQUEO */}
        {activeTab === 'sos' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
              <Wind className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-serif font-black text-base text-white">
                Santuario de Calma Estoica (SOS)
              </h4>
              <p className="text-xs text-[#94A3B8] font-mono mt-1 max-w-xs">
                Cuando sientas ansiedad, ganas de procrastinar o impulso de dopamina barata: respira aquí 32 segundos.
              </p>
            </div>

            {sosActive ? (
              <div className="w-full bg-[#14171C] border border-rose-500/40 rounded-2xl p-5 space-y-3">
                <motion.div
                  key={breathPhase}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="text-2xl font-black font-serif text-rose-400 uppercase tracking-widest"
                >
                  {breathPhase} (4s)
                </motion.div>
                <p className="text-[11px] text-[#64748B] font-mono">
                  Siente la calma regresar a tu pecho. La pulsión pasajera no tiene poder sobre ti.
                </p>
              </div>
            ) : (
              <button
                onClick={handleStartBreath}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-sm tracking-wider uppercase border border-rose-400/40 shadow-[0_4px_15px_rgba(225,29,72,0.4)] active:scale-95 transition-transform"
              >
                INICIAR RESPIRACIÓN GUIADA (32s)
              </button>
            )}

            <div className="bg-[#14171C]/80 border border-white/5 rounded-xl p-3 text-left w-full text-[11px] text-[#94A3B8] space-y-1">
              <span className="font-bold text-rose-400 block font-mono">REGLA DE LOS 10 MINUTOS:</span>
              <span>Si sientes que vas a romper tu juramento, oblígate a esperar 10 minutos haciendo otra cosa. El 90% de los impulsos compulsivos se extinguen en ese tiempo.</span>
            </div>
          </div>
        )}

        {/* CONTENIDO 3: MODO TERRAZA, TOMATES & GATOS */}
        {activeTab === 'terrace' && (
          <div className="flex-1 flex flex-col justify-between p-2 space-y-3">
            <div className="bg-[#14171C] border border-emerald-500/30 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sprout className="w-5 h-5" />
                <h4 className="font-serif font-black text-sm uppercase tracking-wide">
                  Santuario de la Tierra (10 Tomates Río Grande)
                </h4>
              </div>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Tus baldes de 20L y tus 10 plantas de tomate son tu polo a tierra. En este bloque está prohibido abrir la laptop.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#94A3B8]">
                <div className="flex items-center gap-1 text-amber-400">
                  <Cat className="w-3.5 h-3.5" />
                  <span>Con tus gatos</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Tierra & Agua</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lectura al aire libre</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0C0E] border border-white/10 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] text-[#64748B] font-mono uppercase block">
                TIEMPO DE DESCONEXIÓN REGENERATIVA
              </span>
              <div className="text-3xl font-mono font-black text-emerald-400">
                60:00 MIN
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Al terminar este tiempo, volverás a tu SaaS con la mente fresca y sin fatiga visual.
              </p>
            </div>

            <button
              onClick={() => {
                soundFx.playFanfare();
                setTerraceActive(!terraceActive);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs tracking-wider uppercase border border-emerald-400/40 shadow-md active:scale-95 transition-transform"
            >
              {terraceActive ? 'EN CURSO: DISFRUTA LA TERRAZA' : 'ACTIVAR MODO TERRAZA (60 MIN)'}
            </button>
          </div>
        )}

        {/* CONTENIDO 4: EL ESPEJO DE LAS DOS LÍNEAS DE TIEMPO */}
        {activeTab === 'mirror' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left">
            <p className="text-[11px] text-[#94A3B8] font-mono text-center">
              Compara el destino de tus decisiones de hoy al llegar las 2:00 AM:
            </p>

            {/* Línea A: La Claudicación */}
            <div className="bg-[#14171C] border border-rose-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                  LÍNEA OSCURA (SI CLAUDICAS HOY)
                </span>
                <span className="text-xs text-rose-400 font-mono font-bold">Día Perdido</span>
              </div>
              <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
                <li>0 videos subidos; el algoritmo de TikTok se enfría tras 54 días.</li>
                <li>0 leads contactados; ningún cliente nuevo para tu SaaS de salones.</li>
                <li>La app entra en modo ceniza; pierdes el botín y tu racha de fuego.</li>
                <li>Despertar a las 10:00 AM con pesadez, culpa y frustración interna.</li>
              </ul>
            </div>

            {/* Línea B: El Triunfo Soberano */}
            <div className="bg-[#14171C] border border-emerald-500/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                  LÍNEA SOBERANA (SI CUMPLES HOY)
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">+450 Oro</span>
              </div>
              <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside">
                <li>Video 55 publicado; tu marca personal sigue escalando hacia 10k.</li>
                <li>Leads enviados; estás más cerca de cerrar los $150 de tu SaaS.</li>
                <li>Tus tomates crecen fuertes; 45m de Pokémon GBA jugados con honores.</li>
                <li>Dormir a las 2:00 AM con la paz profunda de un hombre que cumplió su palabra.</li>
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
