'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  CalendarDays,
  Compass,
  Dumbbell,
  Gamepad2,
  Menu,
  ShoppingBag,
  User,
  Sparkles,
} from 'lucide-react';
import { Sheet } from '@/components/hq/ui/Sheet';
import { soundFx } from '@/lib/soundFx';
import { HQ_NAV, NAV_GROUPS, isNavActive } from '@/lib/hqNav';

// Navegación principal Mobile-First 2.0
export const MOBILE_DOCK_ITEMS = [
  {
    href: '/hq',
    label: 'Hábitos',
    short: 'Hoy',
    icon: Dumbbell,
  },
  {
    href: '/hq/tiempo',
    label: 'Jugar Pokémon',
    short: 'Juego',
    icon: Gamepad2,
  },
  {
    href: '/hq/tienda',
    label: 'Mochila / Bazar',
    short: 'Bazar',
    icon: ShoppingBag,
  },
  {
    href: '/hq/manual',
    label: 'Guía & Biblia',
    short: 'Guía',
    icon: Compass,
  },
];

export function BottomDock() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isCurrent = (href: string) => {
    if (href === '/hq') return pathname === '/hq';
    return pathname.startsWith(href);
  };

  const closeMore = () => setMoreOpen(false);

  return (
    <>
      <nav
        aria-label="Navegación principal táctil"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border-2 border-[#121214] bg-[#FAF9F5]/98 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <ul className="flex items-center justify-between">
          {MOBILE_DOCK_ITEMS.map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate(12);
                    }
                    soundFx.playClick();
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'hq-focus relative flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all active:scale-95 active:translate-y-0.5',
                    active ? 'text-[#1F1E1B] font-bold' : 'text-[#8A877E]'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-dock-active"
                      className="absolute inset-0 rounded-xl border-2 border-black bg-amber-400/20 shadow-[2px_2px_0px_0px_#000]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={clsx('relative z-10 h-5 w-5', active ? 'text-[#E60012]' : 'text-[#8A877E]')}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span className="relative z-10 mt-1 max-w-full truncate text-[10px] font-mono tracking-tight">
                    {item.short}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Botón Más Módulos / Admin */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate(10);
                }
                soundFx.playClick();
                setMoreOpen(true);
              }}
              aria-expanded={moreOpen}
              className={clsx(
                'hq-focus relative flex w-full flex-col items-center justify-center rounded-xl py-2 px-1 transition-all active:scale-95',
                moreOpen ? 'text-[#1F1E1B] font-bold' : 'text-[#8A877E]'
              )}
            >
              <Menu className="relative z-10 h-5 w-5" strokeWidth={1.8} />
              <span className="relative z-10 mt-1 text-[10px] font-mono">Más</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Sheet deslizante con todos los módulos secundarios */}
      <Sheet
        open={moreOpen}
        onClose={closeMore}
        title="Módulos & Herramientas"
        description="Explora el resto de módulos de SynDex y el modo fundador."
      >
        <div className="space-y-4 pb-4">
          {NAV_GROUPS.map((group) => {
            const items = HQ_NAV.filter((item) => item.group === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <div className="hq-label mb-2 px-1 font-mono uppercase text-neutral-500 text-xs">
                  {group.label}
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {items.map((item) => {
                    const active = isNavActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            soundFx.playClick();
                            closeMore();
                          }}
                          className={clsx(
                            'hq-focus flex h-full flex-col gap-1.5 rounded-xl border-2 p-3 transition-all active:scale-95',
                            active
                              ? 'border-black bg-amber-400/20 shadow-[2px_2px_0px_0px_#000]'
                              : 'border-[#E8E5DD] bg-white hover:border-black'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-7 w-7 items-center justify-center rounded-lg border',
                              active
                                ? 'border-black bg-amber-400 text-black'
                                : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                          </span>
                          <span className="text-xs font-bold text-[#1F1E1B] font-mono">
                            {item.label}
                          </span>
                          <span className="text-[10px] leading-tight text-[#8A877E] line-clamp-2">
                            {item.description}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
