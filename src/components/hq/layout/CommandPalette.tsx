'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, LogOut, Play, Search, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { HQ_NAV } from '@/lib/hqNav';
import { soundFx } from '@/lib/soundFx';

type PaletteAction = 'checkin' | 'checkout' | 'focus';

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  kind: 'action' | 'nav';
  action?: PaletteAction;
  href?: string;
}

const ACTIONS: PaletteItem[] = [
  {
    id: 'action-checkin',
    label: 'Check-In ahora',
    description: 'Inicia el turno del bloque actual en un toque',
    icon: Play,
    kind: 'action',
    action: 'checkin',
  },
  {
    id: 'action-checkout',
    label: 'Check-Out',
    description: 'Cierra el turno activo y deja el relevo',
    icon: LogOut,
    kind: 'action',
    action: 'checkout',
  },
  {
    id: 'action-focus',
    label: 'Modo enfoque',
    description: 'Oculta sidebars y deja solo el turno',
    icon: SlidersHorizontal,
    kind: 'action',
    action: 'focus',
  },
];

export function CommandPalette({
  open,
  onClose,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: PaletteAction) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const allItems = useMemo<PaletteItem[]>(
    () => [
      ...ACTIONS,
      ...HQ_NAV.map((item) => ({
        id: item.href,
        label: item.label,
        description: item.description,
        icon: item.icon,
        kind: 'nav' as const,
        href: item.href,
      })),
    ],
    []
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
  }, [allItems, query]);

  const safeIndex = Math.min(index, Math.max(0, results.length - 1));

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = () => {
    setQuery('');
    setIndex(0);
    onClose();
  };

  const run = (item: PaletteItem) => {
    soundFx.playClick();
    if (item.kind === 'nav' && item.href) {
      router.push(item.href);
    } else if (item.action) {
      onAction(item.action);
    }
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIndex(Math.min(results.length - 1, safeIndex + 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setIndex(Math.max(0, safeIndex - 1));
      }
      if (event.key === 'Enter' && results[safeIndex]) {
        event.preventDefault();
        run(results[safeIndex]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, safeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar buscador"
            onClick={close}
            className="absolute inset-0 bg-[#1F1E1B]/30 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscador y acciones de Korat Flow HQ"
            initial={{ y: -8, scale: 0.99, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E8E5DD] bg-[#FAF9F5] shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-[#E8E5DD] px-4 py-3">
              <Search className="h-4 w-4 text-[#8A877E]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setIndex(0);
                }}
                placeholder="Buscar módulo o ejecutar acción..."
                className="w-full bg-transparent text-sm text-[#1F1E1B] outline-none placeholder:text-[#8A877E]"
              />
              <kbd className="hq-mono rounded border border-[#E8E5DD] bg-white px-1.5 py-0.5 text-[9px] text-[#8A877E]">
                ESC
              </kbd>
            </div>

            <ul className="hq-scroll max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-[#8A877E]">
                  Sin resultados para “{query}”.
                </li>
              )}
              {results.map((item, itemIndex) => {
                const Icon = item.icon;
                const active = itemIndex === safeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setIndex(itemIndex)}
                      onClick={() => run(item)}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-white shadow-sm ring-1 ring-[#E8E5DD]' : 'hover:bg-white/60'
                      )}
                    >
                      <span
                        className={clsx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                          item.kind === 'action'
                            ? 'border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]'
                            : active
                              ? 'border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]'
                              : 'border-[#E8E5DD] bg-white text-[#8A877E]'
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[#1F1E1B]">
                          {item.label}
                        </span>
                        <span className="block truncate text-[11px] text-[#8A877E]">
                          {item.description}
                        </span>
                      </span>
                      {item.kind === 'action' && (
                        <span className="hq-chip shrink-0 text-[9px]">acción</span>
                      )}
                      {active && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[#8A877E]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-[#E8E5DD] px-4 py-2 text-[10px] text-[#8A877E]">
              <span className="hq-mono">↑↓ navegar · ↵ ejecutar</span>
              <span className="hq-mono">esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
