'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { BLOCK_ACCENT, BLOCK_ROLE_LABEL, type BlockRole } from '@/lib/hqSchedule';

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={clsx('hq-card', interactive && 'hq-card-interactive', className)}
      {...props}
    />
  );
}

export function RoleAccentBar({ role }: { role: RoleKey }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 h-full w-1 rounded-l-[1.125rem]"
      style={{ backgroundColor: HQ_ROLES[role].accent }}
    />
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role: RoleKey | BlockRole;
  className?: string;
}) {
  const isOperative = role === 'ceo' || role === 'cto' || role === 'cmo';
  const label = isOperative ? HQ_ROLES[role as RoleKey].label : BLOCK_ROLE_LABEL[role];
  const accent = isOperative ? HQ_ROLES[role as RoleKey].accent : BLOCK_ACCENT[role];

  return (
    <span
      className={clsx(
        'hq-mono inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        className
      )}
      style={{
        color: accent,
        borderColor: accent,
        backgroundColor: 'color-mix(in srgb, ' + accent + ' 10%, white)',
      }}
    >
      {label}
    </span>
  );
}

export function ElasticProgress({
  value,
  accent = 'var(--hq-ceo)',
  className,
  height = 8,
}: {
  value: number;
  accent?: string;
  className?: string;
  height?: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={clsx('w-full overflow-hidden rounded-full bg-[#EAE7DF]', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
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
  accent = 'var(--hq-ink)',
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
    <div className={clsx('hq-panel px-3 py-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="hq-label truncate">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />}
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-[#8A877E]">{hint}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="hq-fade-up mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <span className="hq-label">{eyebrow}</span>}
        <h1 className="hq-title mt-1 text-2xl font-normal leading-tight text-[#1F1E1B] sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#5E5C56] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-[#1F1E1B]">{title}</h2>
        {hint && <span className="hq-mono text-[10px] text-[#8A877E]">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D5D1C5] bg-white/60 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E5DD] bg-white text-[#D97043]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#1F1E1B]">{title}</h3>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-[#8A877E]">{description}</p>
      </div>
      {action}
    </div>
  );
}
