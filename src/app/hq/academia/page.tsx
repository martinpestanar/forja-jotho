'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Crown,
  Flame,
  Lock,
  Megaphone,
  Play,
  Sparkles,
  Trophy,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Card, ElasticProgress, PageHeader, SectionTitle, Stat } from '@/components/hq/ui/primitives';
import { LessonPlayer } from '@/components/hq/academia/LessonPlayer';
import {
  ACADEMY_LESSONS,
  ACADEMY_TRACKS,
  BADGE_LABELS,
  isLessonUnlocked,
  lessonsForTrack,
  levelFromXp,
  nextAcademyLesson,
  trackMeta,
  type AcademyLesson,
  type AcademyTrackKey,
} from '@/lib/academy';
import { useAcademyStore, academyStreak } from '@/store/useAcademyStore';
import { soundFx } from '@/lib/soundFx';

const TRACK_ICON: Record<AcademyTrackKey, LucideIcon> = {
  fundamentos: BookOpen,
  ceo: Crown,
  cto: Wrench,
  cmo: Megaphone,
};

export default function AcademiaPage() {
  const completed = useAcademyStore((state) => state.completed);
  const xp = useAcademyStore((state) => state.xp);
  const badges = useAcademyStore((state) => state.badges);
  const activity = useAcademyStore((state) => state.activity);

  const levelInfo = levelFromXp(xp);
  const streak = academyStreak(activity);
  const completedCount = Object.keys(completed).length;
  const nextLesson = nextAcademyLesson(completed);

  const [track, setTrack] = useState<AcademyTrackKey>(nextLesson?.track ?? 'fundamentos');
  const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);

  const trackLessons = useMemo(() => lessonsForTrack(track), [track]);
  const meta = trackMeta(track);
  const trackDone = trackLessons.filter((lesson) => completed[lesson.id]).length;
  const trackPercent = trackLessons.length > 0 ? Math.round((trackDone / trackLessons.length) * 100) : 0;

  const openLesson = (lesson: AcademyLesson) => {
    if (!isLessonUnlocked(lesson, completed)) {
      soundFx.playWarning();
      return;
    }
    soundFx.playClick();
    setActiveLesson(lesson);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academia del fundador"
        title="Aprende haciendo"
        description="Cápsulas de 3 minutos, un quiz y una micro-acción real. Empieza desde cero: no necesitas saberlo todo hoy."
        actions={
          nextLesson ? (
            <button type="button" className="hq-btn hq-btn-primary" onClick={() => openLesson(nextLesson)}>
              <Play className="h-4 w-4" />
              <span className="sm:hidden">Continuar</span>
              <span className="hidden sm:inline">Continuar: {nextLesson.title}</span>
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="Nivel" value={levelInfo.level} icon={Sparkles} accent="var(--hq-gold)" hint={`${xp} XP`} />
        <Stat label="Racha de estudio" value={`${streak}d`} icon={Flame} accent="var(--hq-ceo)" hint="días seguidos" />
        <Stat label="Cápsulas" value={`${completedCount}/${ACADEMY_LESSONS.length}`} icon={BookOpen} accent="var(--hq-cto)" hint="completadas" />
        <Stat label="Insignias" value={badges.length} icon={Trophy} accent="var(--hq-cmo)" hint="desbloqueadas" />
      </div>

      <Card className="relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--hq-gold) 20%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="hq-chip">
              <Sparkles className="h-3 w-3 text-[#C49347]" />
              Por qué esto importa
            </span>
            <h2 className="hq-title mt-2 text-xl leading-snug text-[#1F1E1B] sm:text-2xl">
              Dos clientes no son un techo. Son la primera prueba de que tu SaaS puede crecer.
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5E5C56]">
              Un SaaS se construye con retención, tiempo y confianza. Cada cápsula te da una
              decisión o una acción para que Nilah y Vegi dejen de ser ideas y se vuelvan un negocio
              que te da estabilidad y libertad. Además, cada cápsula suma <strong className="text-[#1F1E1B]">+10m</strong> a tu tiempo de juego.
            </p>
          </div>
          <div className="shrink-0">
            <div className="hq-label mb-1">Progreso del nivel</div>
            <div className="w-40">
              <ElasticProgress value={levelInfo.progress} accent="var(--hq-gold)" />
            </div>
            <div className="hq-mono mt-1 text-right text-[10px] text-[#8A877E]">
              {xp} / {levelInfo.nextAt} XP
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {ACADEMY_TRACKS.map((item) => {
          const Icon = TRACK_ICON[item.key];
          const done = lessonsForTrack(item.key).filter((lesson) => completed[lesson.id]).length;
          const total = lessonsForTrack(item.key).length;
          const active = track === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTrack(item.key);
              }}
              className={clsx(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all',
                active ? 'bg-white font-semibold shadow-sm' : 'bg-white/60 text-[#5E5C56] hover:bg-white'
              )}
              style={{
                borderColor: active ? item.accent : 'var(--hq-border)',
                color: active ? item.accent : undefined,
              }}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
              <span className="hq-mono text-[9px] text-[#8A877E]">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="p-4 sm:p-5">
          <SectionTitle
            title={meta.label}
            hint={`${trackDone}/${trackLessons.length} completadas`}
            action={
              <span className="hq-mono text-[10px]" style={{ color: meta.accent }}>
                {trackPercent}%
              </span>
            }
          />
          <p className="mb-3 text-[11px] text-[#8A877E]">{meta.tagline}</p>

          <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-[#E8E5DD]">
            {trackLessons.map((lesson, index) => {
              const done = Boolean(completed[lesson.id]);
              const unlocked = isLessonUnlocked(lesson, completed);
              const result = completed[lesson.id];
              return (
                <li key={lesson.id} className="relative flex items-start gap-3">
                  <span
                    className="z-10 mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#FAF9F5] text-[10px] font-bold"
                    style={{
                      backgroundColor: done ? meta.accent : unlocked ? '#FFFFFF' : '#F2EFE9',
                      color: done ? '#FFFFFF' : unlocked ? meta.accent : '#8A877E',
                      boxShadow: `0 0 0 1px ${done ? meta.accent : 'var(--hq-border)'}`,
                    }}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : unlocked ? index + 1 : <Lock className="h-3 w-3" />}
                  </span>

                  <button
                    type="button"
                    onClick={() => openLesson(lesson)}
                    disabled={!unlocked}
                    className={clsx(
                      'hq-card-interactive flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-all sm:flex-row sm:items-center sm:justify-between',
                      unlocked ? 'bg-white' : 'cursor-not-allowed bg-[#FAF9F5] opacity-65'
                    )}
                    style={{ borderColor: done ? meta.accent : 'var(--hq-border)' }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#1F1E1B]">{lesson.title}</span>
                        <span className="hq-chip text-[9px]">{lesson.minutes} min</span>
                        <span className="hq-chip text-[9px]">{lesson.tag}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#5E5C56]">{lesson.subtitle}</p>
                      {!unlocked && (
                        <p className="hq-mono mt-1 text-[9px] text-[#8A877E]">
                          Completa la cápsula anterior para abrir
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {done ? (
                        <span className="hq-mono text-[10px]" style={{ color: meta.accent }}>
                          {result.correct}/{result.total} · hecha
                        </span>
                      ) : (
                        <span className="hq-mono text-[10px] text-[#8A877E]">+{lesson.xp} XP</span>
                      )}
                      {unlocked && <ArrowRight className="h-4 w-4 text-[#8A877E]" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {nextLesson && nextLesson.track === track && (
            <button
              type="button"
              onClick={() => openLesson(nextLesson)}
              className="hq-btn hq-btn-primary mt-4 w-full text-white"
              style={{ backgroundColor: meta.accent }}
            >
              <Play className="h-4 w-4" />
              Siguiente: {nextLesson.title}
            </button>
          )}
        </Card>

        <div className="space-y-2.5">
          <Card className="p-4">
            <SectionTitle title="Ruta recomendada" hint="desde cero" />
            {nextLesson ? (
              <button
                type="button"
                onClick={() => openLesson(nextLesson)}
                className="w-full rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-3 text-left transition-colors hover:bg-[#F2EFE9]"
              >
                <span className="hq-label">{trackMeta(nextLesson.track).label}</span>
                <p className="mt-0.5 text-xs font-semibold text-[#1F1E1B]">{nextLesson.title}</p>
                <p className="mt-0.5 text-[11px] text-[#8A877E]">
                  {nextLesson.minutes} min · +{nextLesson.xp} XP
                </p>
              </button>
            ) : (
              <div className="rounded-xl border border-[#5A7D62]/25 bg-[#5A7D62]/5 p-3 text-[11px] leading-relaxed text-[#4C6151]">
                Completaste toda la Academia. Ahora vuelve a operar y aplica lo aprendido.
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle title="Insignias" hint={`${badges.length} de ${Object.keys(BADGE_LABELS).length}`} />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(BADGE_LABELS).map(([key, badge]) => {
                const unlocked = badges.includes(key);
                return (
                  <span
                    key={key}
                    title={badge.description}
                    className={clsx('hq-chip text-[9px]', !unlocked && 'opacity-45')}
                    style={unlocked ? { color: 'var(--hq-gold)' } : undefined}
                  >
                    {unlocked ? <Trophy className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {badge.label}
                  </span>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="Cómo estudiar" hint="3 pasos" />
            <ol className="space-y-2 text-[11px] leading-relaxed text-[#5E5C56]">
              <li>
                <span className="hq-mono text-[10px] font-bold text-[#D97043]">01</span> Lee la
                cápsula sin apuro: 3 minutos.
              </li>
              <li>
                <span className="hq-mono text-[10px] font-bold text-[#D97043]">02</span> Responde el
                quiz: ganas XP y <strong className="text-[#1F1E1B]">+10m de juego</strong>.
              </li>
              <li>
                <span className="hq-mono text-[10px] font-bold text-[#D97043]">03</span> Ejecuta la
                micro-acción en tu negocio hoy.
              </li>
              <li>
                <span className="hq-mono text-[10px] font-bold text-[#D97043]">04</span> Si estudias
                de noche, activa <strong className="text-[#1F1E1B]">Modo noche</strong> dentro de la
                cápsula.
              </li>
            </ol>
          </Card>
        </div>
      </div>

      {activeLesson && (
        <LessonPlayer lesson={activeLesson} onClose={() => setActiveLesson(null)} />
      )}
    </div>
  );
}
