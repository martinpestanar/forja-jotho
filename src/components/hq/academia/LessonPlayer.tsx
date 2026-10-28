'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Check,
  Lightbulb,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { BADGE_LABELS, trackMeta, type AcademyLesson } from '@/lib/academy';
import { useAcademyStore } from '@/store/useAcademyStore';
import { soundFx } from '@/lib/soundFx';

type Step = 'content' | 'quiz' | 'result';

const TRACK_CONFETTI: Record<AcademyLesson['track'], string[]> = {
  fundamentos: ['#C49347', '#D97043', '#E8C98A', '#1F1E1B'],
  ceo: ['#D97043', '#E8A187', '#C49347', '#5A7D62'],
  cto: ['#5A7D62', '#8FB18F', '#C49347', '#3B7A87'],
  cmo: ['#3B7A87', '#7DB3BC', '#D97043', '#C49347'],
};

interface Palette {
  bg: string;
  surface: string;
  panel: string;
  border: string;
  ink: string;
  ink2: string;
  muted: string;
}

const LIGHT: Palette = {
  bg: '#FAF9F5',
  surface: '#FFFFFF',
  panel: '#F2EFE9',
  border: '#E8E5DD',
  ink: '#1F1E1B',
  ink2: '#5E5C56',
  muted: '#8A877E',
};

const NIGHT: Palette = {
  bg: '#141210',
  surface: '#1D1A16',
  panel: '#25211C',
  border: '#37322B',
  ink: '#F5EFE5',
  ink2: '#C9C0B2',
  muted: '#948B7E',
};

function Chip({
  children,
  palette,
  color,
}: {
  children: React.ReactNode;
  palette: Palette;
  color?: string;
}) {
  return (
    <span
      className="hq-mono inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide"
      style={{
        borderColor: palette.border,
        backgroundColor: palette.surface,
        color: color ?? palette.muted,
      }}
    >
      {children}
    </span>
  );
}

export function LessonPlayer({
  lesson,
  onClose,
}: {
  lesson: AcademyLesson;
  onClose: () => void;
}) {
  const completeLesson = useAcademyStore((state) => state.completeLesson);
  const track = trackMeta(lesson.track);

  const [night, setNight] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('korat-lesson-night') === '1';
  });
  const palette = night ? NIGHT : LIGHT;

  const [step, setStep] = useState<Step>('content');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcome, setOutcome] = useState<{
    xpGained: number;
    newBadges: string[];
    correct: number;
    total: number;
  } | null>(null);

  const question = lesson.quiz[questionIndex];
  const totalQuestions = lesson.quiz.length;

  const progress = useMemo(() => {
    if (step === 'content') return 12;
    if (step === 'result') return 100;
    return Math.round(30 + (questionIndex / totalQuestions) * 60);
  }, [step, questionIndex, totalQuestions]);

  const toggleNight = () => {
    const next = !night;
    setNight(next);
    soundFx.playClick();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('korat-lesson-night', next ? '1' : '0');
    }
  };

  const startQuiz = () => {
    soundFx.playClick();
    setStep('quiz');
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
  };

  const checkAnswer = () => {
    if (selected === null || checked) return;
    setChecked(true);
    const isCorrect = selected === question.answer;
    if (isCorrect) {
      setCorrectCount((value) => value + 1);
      soundFx.playCoin();
    } else {
      soundFx.playWarning();
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
  };

  const nextQuestion = () => {
    soundFx.playClick();
    if (questionIndex + 1 < totalQuestions) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }

    const finalCorrect = correctCount;
    const result = completeLesson(lesson.id, finalCorrect, totalQuestions);
    setOutcome({
      xpGained: result.xpGained,
      newBadges: result.newBadges,
      correct: finalCorrect,
      total: totalQuestions,
    });
    setStep('result');

    if (result.firstTime) {
      soundFx.playFanfare();
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: TRACK_CONFETTI[lesson.track],
      });
    }
  };

  const restart = () => {
    setStep('content');
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
    setOutcome(null);
  };

  const softBackground = `color-mix(in srgb, ${track.accent} ${night ? 16 : 10}%, ${palette.surface})`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[95] overflow-y-auto"
        style={{ backgroundColor: palette.bg, color: palette.ink }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="mx-auto w-full max-w-3xl px-4 sm:px-6"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          <header
            className="sticky top-0 z-10 -mx-4 mb-3 flex items-start justify-between gap-3 border-b px-4 py-3 sm:-mx-6 sm:px-6"
            style={{ backgroundColor: palette.bg, borderColor: palette.border }}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip palette={palette} color={track.accent}>
                  {track.label}
                </Chip>
                <Chip palette={palette}>Nivel {lesson.level}</Chip>
                <Chip palette={palette}>{lesson.minutes} min</Chip>
                <Chip palette={palette}>+{lesson.xp} XP</Chip>
              </div>
              <h1 className="hq-title mt-2 text-xl leading-tight sm:text-3xl" style={{ color: palette.ink }}>
                {lesson.title}
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>
                {lesson.subtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={toggleNight}
                className="hq-focus flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-medium transition-colors"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  color: palette.ink2,
                }}
                aria-label={night ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
              >
                {night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="hidden sm:inline">{night ? 'Día' : 'Noche'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="hq-focus rounded-xl border p-2 transition-colors"
                style={{
                  borderColor: palette.border,
                  backgroundColor: palette.surface,
                  color: palette.ink2,
                }}
                aria-label="Cerrar lección"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            className="mb-4 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: palette.panel }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: track.accent }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>

          {step === 'content' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3.5"
            >
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: palette.border, backgroundColor: softBackground }}
              >
                <div className="hq-label mb-1" style={{ color: track.accent }}>
                  Mentor {track.short}
                </div>
                <p className="hq-title text-base leading-snug sm:text-lg" style={{ color: palette.ink }}>
                  “{lesson.mentorLine}”
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {lesson.blocks.map((block, index) => (
                  <div
                    key={block.title}
                    className="rounded-xl border p-4"
                    style={{ borderColor: palette.border, backgroundColor: palette.surface }}
                  >
                    <span className="hq-mono text-[10px] font-bold" style={{ color: track.accent }}>
                      0{index + 1}
                    </span>
                    <h2 className="mt-1 text-sm font-semibold" style={{ color: palette.ink }}>
                      {block.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.ink2 }}>
                      {block.body}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: palette.border, backgroundColor: palette.surface }}
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#C49347]" />
                  <div>
                    <div className="hq-label">Idea clave</div>
                    <p className="mt-0.5 text-sm leading-relaxed" style={{ color: palette.ink }}>
                      {lesson.keyIdea}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: night ? 'rgba(90,125,98,0.4)' : 'rgba(90,125,98,0.3)',
                    backgroundColor: night ? 'rgba(90,125,98,0.12)' : 'rgba(90,125,98,0.06)',
                  }}
                >
                  <div className="hq-label text-[#7FA57F]">Ejemplo real</div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.ink2 }}>
                    {lesson.example}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: night ? 'rgba(217,83,79,0.4)' : 'rgba(217,83,79,0.25)',
                    backgroundColor: night ? 'rgba(217,83,79,0.12)' : 'rgba(217,83,79,0.05)',
                  }}
                >
                  <div className="hq-label text-[#D98C88]">Error de principiante</div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.ink2 }}>
                    {lesson.mistake}
                  </p>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: palette.border, backgroundColor: palette.surface }}
              >
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0" style={{ color: track.accent }} />
                  <div>
                    <div className="hq-label">Micro-acción de hoy</div>
                    <p className="mt-0.5 text-sm leading-relaxed" style={{ color: palette.ink }}>
                      {lesson.action}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startQuiz}
                className="hq-btn w-full py-3.5 text-white"
                style={{ backgroundColor: track.accent }}
              >
                Empezar quiz
                <span className="hq-mono text-[10px] opacity-80">{totalQuestions} preguntas</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {step === 'quiz' && question && (
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="hq-label">
                  Pregunta {questionIndex + 1} de {totalQuestions}
                </span>
                <span className="hq-mono text-[10px]" style={{ color: palette.muted }}>
                  {correctCount} correctas
                </span>
              </div>

              <h2 className="hq-title text-xl leading-snug sm:text-2xl" style={{ color: palette.ink }}>
                {question.question}
              </h2>

              <div className="space-y-2">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  const isCorrect = checked && index === question.answer;
                  const isWrong = checked && isSelected && index !== question.answer;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={checked}
                      onClick={() => {
                        soundFx.playClick();
                        setSelected(index);
                      }}
                      className="flex min-h-[48px] w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all"
                      style={{
                        borderColor: isCorrect
                          ? '#5A7D62'
                          : isWrong
                            ? '#D9534F'
                            : isSelected
                              ? track.accent
                              : palette.border,
                        backgroundColor: isCorrect
                          ? night
                            ? 'rgba(90,125,98,0.18)'
                            : 'rgba(90,125,98,0.10)'
                          : isWrong
                            ? night
                              ? 'rgba(217,83,79,0.18)'
                              : 'rgba(217,83,79,0.10)'
                            : palette.surface,
                        color: palette.ink,
                      }}
                    >
                      <span
                        className="hq-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold"
                        style={{
                          borderColor: isSelected || isCorrect ? track.accent : palette.border,
                          color: isSelected || isCorrect ? track.accent : palette.muted,
                        }}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                      {isCorrect && <Check className="ml-auto h-4 w-4 shrink-0 text-[#5A7D62]" />}
                    </button>
                  );
                })}
              </div>

              {checked && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-3"
                  style={{ borderColor: palette.border, backgroundColor: palette.panel }}
                >
                  <div className="hq-label">
                    {selected === question.answer ? 'Correcto' : 'Para recordar'}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.ink }}>
                    {question.explanation}
                  </p>
                </motion.div>
              )}

              {!checked ? (
                <button
                  type="button"
                  onClick={checkAnswer}
                  disabled={selected === null}
                  className="hq-btn w-full py-3.5 text-white"
                  style={{ backgroundColor: track.accent }}
                >
                  Comprobar respuesta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="hq-btn w-full py-3.5 text-white"
                  style={{ backgroundColor: track.accent }}
                >
                  {questionIndex + 1 < totalQuestions ? 'Siguiente pregunta' : 'Ver resultado'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          )}

          {step === 'result' && outcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div
                className="rounded-2xl border p-6 text-center"
                style={{ borderColor: palette.border, backgroundColor: palette.surface }}
              >
                <span
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: softBackground, color: track.accent }}
                >
                  <Trophy className="h-7 w-7" />
                </span>
                <h2 className="hq-title mt-3 text-2xl" style={{ color: palette.ink }}>
                  {outcome.correct === outcome.total ? 'Perfecto' : 'Cápsula completada'}
                </h2>
                <p className="mt-1 text-xs" style={{ color: palette.ink2 }}>
                  {outcome.correct} de {outcome.total} correctas · {lesson.title}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border p-3" style={{ borderColor: palette.border, backgroundColor: palette.panel }}>
                    <div className="hq-label">XP ganado</div>
                    <div className="mt-1 text-xl font-semibold" style={{ color: track.accent }}>
                      +{outcome.xpGained}
                    </div>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: palette.border, backgroundColor: palette.panel }}>
                    <div className="hq-label">Precisión</div>
                    <div className="mt-1 text-xl font-semibold" style={{ color: palette.ink }}>
                      {Math.round((outcome.correct / outcome.total) * 100)}%
                    </div>
                  </div>
                </div>

                {outcome.xpGained > 0 && (
                  <div className="mt-3 flex justify-center">
                    <span
                      className="hq-chip text-[10px]"
                      style={{ color: track.accent, borderColor: palette.border, backgroundColor: palette.panel }}
                    >
                      +10m al banco de tiempo de juego
                    </span>
                  </div>
                )}

                {outcome.newBadges.length > 0 && (
                  <div className="mt-4 text-left">
                    <div className="hq-label mb-1.5">Nuevas insignias</div>
                    <div className="flex flex-wrap gap-1.5">
                      {outcome.newBadges.map((badge) => (
                        <span
                          key={badge}
                          className="hq-chip"
                          style={{
                            color: track.accent,
                            borderColor: palette.border,
                            backgroundColor: palette.panel,
                          }}
                          title={BADGE_LABELS[badge]?.description}
                        >
                          <Sparkles className="h-3 w-3" />
                          {BADGE_LABELS[badge]?.label ?? badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={restart} className="hq-btn hq-btn-ghost flex-1">
                  <RotateCcw className="h-4 w-4" />
                  Repetir quiz
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="hq-btn flex-1 py-3.5 text-white"
                  style={{ backgroundColor: track.accent }}
                >
                  Volver a la Academia
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
