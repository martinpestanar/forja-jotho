'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  CalendarX2,
  Check,
  Gamepad2,
  Gift,
  Play,
  ShoppingBag,
  Sparkles,
  Timer,
  Wallet,
  Zap,
} from 'lucide-react';
import { Card, ElasticProgress, PageHeader, SectionTitle, Stat } from '@/components/hq/ui/primitives';
import { useTrainerStore } from '@/store/useTrainerStore';
import { useHqStore, dayKey, getBalance } from '@/store/useHqStore';
import { soundFx } from '@/lib/soundFx';

const ArcadeRoomTheater = dynamic(
  () => import('@/components/arcade/ArcadeRoomTheater').then((mod) => mod.ArcadeRoomTheater),
  { ssr: false }
);

const REASON_LABEL: Record<string, string> = {
  base: '2h diarias gratis',
  task: 'Tarea cumplida',
  academy: 'Cápsula de Academia',
  bonus: 'Bonus 3 roles',
  redeem: 'Canje',
  play: 'Minutos de juego',
  manual: 'Ajuste',
};

const EMPTY_CHECKOUTS: Array<'ceo' | 'cto' | 'cmo'> = [];

export default function TiempoPage() {
  const openArcadeRoom = useTrainerStore((state) => state.openArcadeRoom);
  const ledger = useHqStore((state) => state.ledger);
  const checkouts = useHqStore((state) => state.checkouts);
  const closedDays = useHqStore((state) => state.closedDays);
  const baseCredited = useHqStore((state) => state.baseCredited);
  const spendMinutes = useHqStore((state) => state.spendMinutes);
  const addMinutes = useHqStore((state) => state.addMinutes);

  const today = dayKey();
  const balance = getBalance(ledger);
  const todayCheckouts = checkouts[today] ?? EMPTY_CHECKOUTS;
  const todayClosed = Boolean(closedDays[today]);
  const todayBase = Boolean(baseCredited[today]);
  const todayTasks = ledger
    .filter((entry) => entry.date === today && entry.reason === 'task')
    .reduce((total, entry) => total + entry.delta, 0);
  const todayAcademy = ledger
    .filter((entry) => entry.date === today && entry.reason === 'academy')
    .reduce((total, entry) => total + entry.delta, 0);
  const recentLedger = [...ledger].reverse().slice(0, 8);

  const openCartridge = () => {
    if (balance <= 0) {
      soundFx.playWarning();
      return;
    }
    useTrainerStore.getState().updateProfile({ battery_minutes: balance });
    soundFx.playLevelUp();
    openArcadeRoom();
  };

  const redeem = (minutes: number) => {
    const ok = spendMinutes(minutes, `Canje de ${minutes} min`);
    if (ok) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D97043', '#5A7D62', '#3B7A87', '#C49347'],
      });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Pokémon Time Engine"
        title="La recompensa se gana"
        description="2 horas diarias gratis al iniciar tu primer turno. Después sumas minutos con tareas, check-outs y cápsulas de Academia."
        actions={
          <>
            <Link href="/hq/tienda" className="hq-btn hq-btn-ghost">
              <ShoppingBag className="h-4 w-4" />
              Bazar
            </Link>
            <button
              type="button"
              className="hq-btn hq-btn-primary"
              onClick={openCartridge}
              disabled={balance <= 0}
            >
              <Play className="h-4 w-4" />
              {balance > 0 ? 'Abrir cartucho' : 'Sin minutos'}
            </button>
          </>
        }
      />

      {/* Wallet */}
      <Card className="relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--hq-cto) 18%, transparent), transparent 70%)' }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="hq-label">Banco de tiempo</span>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-5xl font-semibold tabular-nums text-[#1F1E1B]">{balance}</span>
              <span className="hq-mono mb-1.5 text-xs text-[#8A877E]">minutos disponibles</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="hq-chip">
                <Wallet className="h-3 w-3" />
                {todayBase ? '2h diarias acreditadas (+120m)' : '2h pendientes de acreditar'}
              </span>
              {todayClosed && (
                <span className="hq-chip" style={{ color: 'var(--hq-cto)' }}>
                  <Check className="h-3 w-3" />
                  día conquistado
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => redeem(minutes)}
                disabled={balance < minutes}
                className="hq-btn hq-btn-ghost"
              >
                <Gift className="h-4 w-4" />
                Canjear {minutes}m
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="2h gratis" value={todayBase ? '120m' : '—'} icon={Timer} accent="var(--hq-cto)" hint="base del día" />
        <Stat label="Extra por tareas" value={`+${todayTasks}m`} icon={Zap} accent="var(--hq-cto)" hint="check-outs" />
        <Stat label="Bonus 3 roles" value={todayClosed ? '+60m' : '+60m'} icon={Sparkles} accent="var(--hq-gold)" hint={todayClosed ? 'acreditado' : 'por ganar'} />
        <Stat label="Academia" value={`+${todayAcademy}m`} icon={CalendarX2} accent="var(--hq-cmo)" hint={`${todayCheckouts.length}/3 roles`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <SectionTitle title="Reglas del Time Engine" hint="v3.4" />
          <div className="space-y-3">
            {[
              {
                title: '2 horas diarias gratis',
                text: 'Se acreditan al iniciar el primer turno del día. Son tuyas aunque el día se complique.',
                accent: 'var(--hq-cto)',
              },
              {
                title: '+15m por cada check-out',
                text: 'Cada rol cerrado cuenta como una tarea cumplida. Máximo 45m extra al día.',
                accent: 'var(--hq-gold)',
              },
              {
                title: '+60m por cerrar los 3 roles',
                text: 'Solo si CEO, CTO y CMO cerraron turno el mismo día.',
                accent: 'var(--hq-ceo)',
              },
              {
                title: '+10m por cápsula de Academia',
                text: 'Aprender también suma tiempo de juego. Una cápsula completada, 10 minutos extra.',
                accent: 'var(--hq-cmo)',
              },
              {
                title: 'Banco acumulable',
                text: 'Los minutos no usados entre semana quedan guardados para el fin de semana.',
                accent: 'var(--hq-cto)',
              },
              {
                title: 'Canje de fin de semana',
                text: 'Viernes y sábado se puede gastar el banco sin culpa: hackroms, anime o código por placer.',
                accent: 'var(--hq-ceo)',
              },
            ].map((rule) => (
              <div key={rule.title} className="flex gap-3 rounded-xl border border-[#E8E5DD] bg-white p-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: rule.accent }} />
                <div>
                  <h3 className="text-xs font-semibold text-[#1F1E1B]">{rule.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#E8E5DD] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-[#1F1E1B]">Sumar tiempo por tarea</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">
                  Para tareas que no pasan por un check-out: un fix, una llamada o un video extra.
                </p>
              </div>
              <Zap className="h-4 w-4 shrink-0 text-[#C49347]" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addMinutes(15, 'Tarea rápida', 'task')}
                className="hq-btn hq-btn-ghost"
              >
                <Zap className="h-4 w-4 text-[#C49347]" />
                Tarea rápida +15m
              </button>
              <button
                type="button"
                onClick={() => addMinutes(30, 'Bloque de foco', 'task')}
                className="hq-btn hq-btn-ghost"
              >
                <Zap className="h-4 w-4 text-[#C49347]" />
                Bloque de foco +30m
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-2.5">
          <Card className="p-4">
            <SectionTitle title="Progreso del bonus" hint="hoy" />
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold tabular-nums text-[#1F1E1B]">
                  {Math.min(3, todayCheckouts.length)}/3
                </div>
                <div className="text-[11px] text-[#8A877E]">check-outs completados</div>
              </div>
              <span className="hq-chip text-[9px]">{todayClosed ? 'acreditado' : 'en curso'}</span>
            </div>
            <ElasticProgress
              value={(Math.min(3, todayCheckouts.length) / 3) * 100}
              accent="var(--hq-gold)"
              className="mt-3"
            />
          </Card>

          <Card className="p-4">
            <SectionTitle title="Ledger del banco" hint="últimos movimientos" />
            {recentLedger.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-3 text-[11px] leading-relaxed text-[#8A877E]">
                Aún no hay movimientos. El primer ingreso aparece al iniciar tu primer turno.
              </div>
            ) : (
              <ul className="divide-y divide-[#E8E5DD]">
                {recentLedger.map((entry) => {
                  const positive = entry.delta > 0;
                  return (
                    <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-medium text-[#1F1E1B]">{entry.label}</div>
                        <div className="hq-mono text-[9px] text-[#8A877E]">
                          {new Date(entry.at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} ·{' '}
                          {REASON_LABEL[entry.reason] ?? entry.reason}
                        </div>
                      </div>
                      <span
                        className="hq-mono shrink-0 text-xs font-semibold tabular-nums"
                        style={{ color: positive ? 'var(--hq-cto)' : 'var(--hq-danger)' }}
                      >
                        {positive ? '+' : ''}
                        {entry.delta}m
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle title="Cartucho" hint="mGBA" />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5A7D62]/25 bg-[#5A7D62]/10 text-[#5A7D62]">
                <Gamepad2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1F1E1B]">Pokémon Heart & Soul</div>
                <div className="text-[11px] text-[#8A877E]">se abre en pantalla completa</div>
              </div>
            </div>
            <button
              type="button"
              className="hq-btn hq-btn-primary mt-3 w-full"
              onClick={openCartridge}
              disabled={balance <= 0}
            >
              <Play className="h-4 w-4" />
              {balance > 0 ? `Encender (${balance}m)` : 'Gana minutos con tareas'}
            </button>
          </Card>
        </div>
      </div>

      <ArcadeRoomTheater />
    </div>
  );
}
