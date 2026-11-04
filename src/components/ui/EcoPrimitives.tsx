'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export function ElasticProgress({
  value,
  max = 100,
  accent = '#C59B46',
  className,
  height = 8,
}: {
  value: number;
  max?: number;
  accent?: string;
  className?: string;
  height?: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div
      className={clsx('w-full overflow-hidden rounded-full bg-[#E4E1D8]', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: accent }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent = '#1C1B18',
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={clsx('bg-white border border-[#E4E1D8] rounded-2xl p-3 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase text-[#706E66] truncate">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />}
      </div>
      <div className="mt-1 text-base font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-[#706E66]">{hint}</div>}
    </div>
  );
}
