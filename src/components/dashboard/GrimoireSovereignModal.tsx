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
  HeartHandshake,
  Skull,
  Mountain,
  Axe,
  Waves
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

  const chapters = [
    {
      id: 1,
      title: 'I. La Fuerza Involuntaria: El Dios Oculto en tu Sangre',
      subtitle: 'La energía primordial que hace latir tu corazón sin pedir permiso',
      tag: 'EL INCONSCIENTE VIVO',
      content: [
        'El jefe tribal no cree en el pensamiento ansioso ni en los laberintos mentales de la duda. Él observa su pecho y siente algo demoledor: hay una fuerza salvaje e involuntaria que hace latir su corazón 100,000 veces al día sin que él tenga que mover un solo dedo.',
        'Esa misma energía que mueve las mareas del océano y empuja a los árboles a romper la roca está dentro de tus venas en este mismo instante. La ansiedad moderna no es más que esa tremenda fuerza vital estancada por la inmovilidad y el exceso de pantalla.',
        'El jefe no analiza la vida: se funde con ella. Deja que esa corriente inconsciente tome el control. Cuando sientes miedo, solo es poder acumulado esperando que lo transformes en acción, en danza, en entrenamiento o en creación pura.'
      ],
      quote: '"No le temas al rugido interno; témale a convertirte en una jaula que lo sofoca."',
    },
    {
      id: 2,
      title: 'II. La Expresión del Cuerpo: La Danza del Bárbaro Sabio',
      subtitle: 'Cómo el jefe tribal disuelve el miedo moviendo su fisonomía',
      tag: 'VIGOR TRIBAL',
      content: [
        'Un vikingo de barba espesa y músculos curtidos por el viento no se sienta a rumiar inseguridades. Cuando la tensión aparece, le da expresión inmediata a su cuerpo: golpea el suelo, danza bajo la luna, ríe a carcajadas o levanta peso hasta que sus músculos arden de vida.',
        'El cuerpo lidera y la mente obedece. Si tu postura es de derrota, tus pensamientos serán de escasez. Si extiendes los brazos, abres el pecho y te mueves con la fiereza de un cazador a las 9:30 PM, la química de tu sangre muta al instante de víctima a soberano.',
        'Divertirte con tus sentidos es tu derecho ancestral: el sudor fresco, el sabor del agua limpia, el aire de la noche en tu rostro. La disciplina no es un castigo austero; es la celebración animal de estar vivo.'
      ],
      quote: '"La mente tiembla en el silencio quieto; el cuerpo despierta en el fuego del movimiento."',
    },
    {
      id: 3,
      title: 'III. El Reto como Juego: La Vida como Gran Arena',
      subtitle: 'El jefe tribal no busca la comodidad blanda; busca la emoción del combate',
      tag: 'EL JUEGO SAGRADO',
      content: [
        'El hombre domesticado teme a los problemas: se asusta de que un cliente no responda, de que un video no tenga reproducciones o de que el cansancio llegue. El jefe tribal mira esos mismos obstáculos y sonríe con colmillos afilados: "¿Eso es todo lo que tienes para ofrecerme?".',
        'La existencia no es una sala de espera segura; es una expedición salvaje. Grabar tu video diario, prospectar salones desconocidos y construir tu software vegano no son "obligaciones pesadas", son los monstruos que has elegido cazar para alimentar a tu clan.',
        'Abraza el peligro y la incertidumbre con la curiosidad de un niño y la fuerza de un gigante. Cuando dejas de huir de la dificultad y la encaras como una partida épica, la ansiedad se evapora y se convierte en entusiasmo feroz.'
      ],
      quote: '"Quien busca la paz huyendo de la tormenta jamás conocerá el poder de sus alas."',
    },
    {
      id: 4,
      title: 'IV. La Sonrisa ante la Muerte: Morir con los Brazos Abiertos',
      subtitle: 'El desapego absoluto de quien lo entregó todo por su tribu',
      tag: 'AMOR FATI & VALHALLA',
      content: [
        'El guerrero antiguo no le teme a la muerte porque sabe que el fin es inevitable. La mira de frente con una sonrisa serena. Sabe que cuando llegue su última hora, correrá hacia ella con los brazos abiertos, no con cobardía, sino con el orgullo de quien se vació por completo.',
        'No importa si dentro de mil años recuerdan tu nombre o si el cosmos se apaga en ceniza. Lo que importa es que mientras respiraste, no fuiste un espectador tibio. Protegiste a tu gente, defendiste tu causa ética vegana, cuidaste la tierra de tus tomates y dejaste una huella indeleble de honor.',
        'Pensar en la muerte a diario destruye toda pereza. ¿Vas a desperdiciar esta noche en placeres mediocres cuando tu tiempo en este reino es un soplo fugaz? Sal al combate y entrega tu mejor golpe hoy.'
      ],
      quote: '"Morir no es la pérdida; la verdadera tragedia es llegar al final dándote cuenta de que nunca viviste despierto."',
    },
    {
      id: 5,
      title: 'V. La Raíz Silenciosa: Los 10 Tomates y la Paciencia del Clan',
      subtitle: 'La conexión con la tierra que neutraliza la histeria de la prisa',
      tag: 'CONEXIÓN CON LA TIERRA',
      content: [
        'El jefe tribal conoce el lenguaje del suelo y del bosque. Sabe que un árbol milenario no crece en una noche de desesperación. En tu terraza, tus 10 plantas de tomate Río Grande en baldes de 20 litros y tus gatos descansando al sol son tu ancla con la realidad.',
        'El mundo digital te intoxica con velocidad falsa y resultados instantáneos. La naturaleza te enseña la verdad: siembras, riegas, proteges del viento y confías en la fuerza silenciosa de la vida. Tus negocios, tus seguidores y tu estabilidad financiera florecen bajo esa misma ley cósmica.',
        'Toca la tierra húmeda, siente el ronroneo de tus gatos y respira. Todo lo que necesitas para vencer ya está dentro de ti. Eres el líder de tu destino y esta noche la forja te pertenece.'
      ],
      quote: '"El roble más fuerte de la montaña es aquel que no tuvo prisa por desafiar al cielo."',
    },
    {
      id: 6,
      title: 'VI. La Templanza del Alfa: Transmutar el Fuego Salvaje',
      subtitle: 'La retención seminal y el dominio del instinto creador',
      tag: 'FUEGO PRIMORDIAL',
      content: [
        'El bárbaro débil es esclavo de sus impulsos más bajos: ve una presa fácil y se abalanza, ve una pantalla brillante y se hipnotiza, siente una pulsión sexual y la derrocha en la soledad de una habitación oscura.',
        'El jefe tribal sabe que esa energía es fuego divino. No la desperdicia en placeres baratos de 3 segundos. La retiene en sus entrañas, la hace subir por su columna y la convierte en carisma magnético, en código indestructible para sus restaurantes y en una mirada que nadie puede desviar.',
        '30 días invicto no son un sacrificio de dolor; son la forja de tu armadura dorada. Eres el guardián de tu propia soberanía.'
      ],
      quote: '"El fuego que no consume la madera es el que ilumina el camino del clan."',
    },
    {
      id: 7,
      title: 'VII. El Manifiesto Vegano: La Fuerza al Servicio de la Vida',
      subtitle: 'El verdadero guerrero no tiraniza al débil; protege a los inocentes',
      tag: 'EL PACTO COMPASIVO',
      content: [
        'En los mitos antiguos, el guerrero más respetado no era el que aplastaba a los seres vulnerables, sino el que usaba su espada y su sabiduría para defender a quienes no tenían voz. Tu misión con el software de restaurantes no es solo ganar $150 mensuales: es hacer que la alimentación basada en plantas triunfe.',
        'Al darle herramientas a negocios éticos, estás librando una batalla silenciosa contra el sufrimiento innecesario de millones de seres vivos. Estás alineando tu fuerza tribal con la preservación del planeta.',
        'Esa es tu causa sagrada. Cuando te levantes cada día a picar código y a vender, recuerda que tu esfuerzo tiene un eco que trasciende tu propio plato. Peleas por la vida, y por eso eres invencible.'
      ],
      quote: '"La verdadera grandeza del guerrero se mide por la cantidad de vidas que supo proteger."',
    },
    {
      id: 8,
      title: 'VIII. El Escudo de Oro: El Dinero como Muralla Auténtica',
      subtitle: 'El capital noble nacido de dar valor real a otros seres humanos',
      tag: 'SOBERANÍA & PROSPERIDAD',
      content: [
        'El dinero no es vanidad ni avaricia hueca; para el líder tribal es la muralla defensiva del clan. El dinero resuelve la incertidumbre, compra medicinas y alimento para tus gatos, respalda a tu familia y te da la libertad de decir "no" a lo que comprometa tu dignidad.',
        'Pero hay una ley inquebrantable: ese oro debe nacer de tu más pura autenticidad. No se trata de manipular ni engañar por unas monedas, sino de pararte con carácter frente a otro ser humano (el dueño del salón, el restaurantero) y ofrecerle una solución real que mejore su vida y su negocio.',
        'Cuando interiorizas que cada dólar ganado es un testimonio de valor entregado con tu propia esencia sin vender tu alma, el dinero deja de ser tabú y se convierte en fuego de paz. Quieres riqueza porque quieres proteger, expandir y construir un legado invulnerable.'
      ],
      quote: '"El oro del líder no se mendiga ni se roba; se forja entregando valor con honor inquebrantable."',
    }
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
    }, 32000);
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600/30 via-rose-700/20 to-[#14171C] border border-[#C5A059]/60 flex items-center justify-center text-[#C5A059] shadow-[0_2px_12px_rgba(197,160,89,0.35)]">
              <Axe className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-sm tracking-widest text-[#E2E8F0] uppercase">
                  EL CÓDICE DEL JEFE TRIBAL
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#C5A059] font-mono font-bold">
                  {leaderName.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-mono">
                La mente salvaje, la fiesta de los sentidos y la sonrisa ante el destino
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
            <span>Códice</span>
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

        {/* CONTENIDO 1: EL LIBRO DE LOS 7 CAPÍTULOS TRIBALES */}
        {activeTab === 'chapters' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="bg-[#14171C] border border-[#C5A059]/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono font-bold tracking-wider">
                  {chapters[currentChapter].tag} • CAPÍTULO {currentChapter + 1}/{chapters.length}
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
                  <p key={idx} className="border-l-2 border-amber-500/40 pl-2.5">
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 bg-[#0B0C0E]/50 rounded-xl p-2.5 text-center">
                <p className="text-[11px] font-serif italic text-amber-300">
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

              <div className="flex gap-1.5 overflow-x-auto py-1">
                {chapters.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentChapter(i);
                    }}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                      currentChapter === i ? 'bg-amber-400 scale-125' : 'bg-white/20'
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
