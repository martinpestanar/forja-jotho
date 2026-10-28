'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  BLOCK_ACCENT,
  DEFAULT_SCHEDULE,
  formatMinutes,
  getScheduleState,
  timeToMinutes,
} from '@/lib/hqSchedule';
import { useNow } from '@/hooks/useNow';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 92;

function polar(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function arcPath(startMinute: number, endMinute: number, radius: number) {
  const startAngle = (startMinute / 1440) * 360;
  const endAngle = (endMinute / 1440) * 360;
  const start = polar(radius, startAngle);
  const end = polar(radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function DayDial({ className }: { className?: string }) {
  const now = useNow(30000);
  const state = useMemo(() => (now ? getScheduleState(now) : null), [now]);
  const currentId = state?.current?.id ?? null;

  const centerPrimary = now ? formatMinutes(now.getHours() * 60 + now.getMinutes()) : 'HQ';
  const centerSecondary = state?.isRestDay
    ? 'Descanso'
    : state?.current
      ? state.current.label
      : 'Sin bloque';

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[240px]"
        role="img"
        aria-label="Reloj de roles del día"
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#EAE7DF" strokeWidth={14} />

        {DEFAULT_SCHEDULE.map((block) => {
          const active = block.id === currentId;
          const accent = BLOCK_ACCENT[block.role];
          return (
            <motion.path
              key={block.id}
              d={arcPath(timeToMinutes(block.start), timeToMinutes(block.end), RADIUS)}
              fill="none"
              stroke={accent}
              strokeWidth={active ? 16 : 12}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.32 }}
              transition={{ duration: 0.4 }}
              style={active ? { filter: `drop-shadow(0 0 6px ${accent})` } : undefined}
            >
              <title>{`${block.label} · ${block.start}–${block.end}`}</title>
            </motion.path>
          );
        })}

        {[0, 6, 12, 18].map((hour) => {
          const angle = (hour / 24) * 360;
          const inner = polar(RADIUS - 26, angle);
          const outer = polar(RADIUS - 16, angle);
          const label = polar(RADIUS - 38, angle);
          return (
            <g key={hour}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#D5D1C5"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
          className="hq-mono"
          fontSize={9}
          fill="#8A877E"
        >
                {hour.toString().padStart(2, '0')}h
              </text>
            </g>
          );
        })}

        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          className="hq-title"
          fontSize={22}
          fill="#1F1E1B"
        >
          {centerPrimary}
        </text>
        <text
          x={CENTER}
          y={CENTER + 13}
          textAnchor="middle"
          className="hq-mono"
          fontSize={9}
          fill="#8A877E"
        >
          {centerSecondary.length > 22 ? `${centerSecondary.slice(0, 21)}…` : centerSecondary}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {(['ceo', 'cto', 'cmo'] as const).map((role) => (
          <span key={role} className="hq-chip text-[9px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: BLOCK_ACCENT[role] }}
            />
            {role.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
