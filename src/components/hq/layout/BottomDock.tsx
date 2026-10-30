'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Menu } from 'lucide-react';
import { HQ_DOCK, HQ_NAV, NAV_GROUPS, isNavActive } from '@/lib/hqNav';
import { Sheet } from '@/components/hq/ui/Sheet';
import { soundFx } from '@/lib/soundFx';

export function BottomDock() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreOpen || !HQ_DOCK.some((item) => isNavActive(pathname, item.href));

  const closeMore = () => setMoreOpen(false);

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-[#E8E5DD] bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(31,30,27,0.14)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <ul className="flex items-center justify-between">
          {HQ_DOCK.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    soundFx.playClick();
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'hq-focus relative flex flex-col items-center justify-center rounded-xl px-1 py-2 active:scale-95 transition-all',
                    active ? 'text-[#1F1E1B]' : 'text-[#8A877E]'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="hq-dock-active"
                      className="absolute inset-0 rounded-xl border border-[#D97043]/20 bg-[#D97043]/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={clsx('relative z-10 h-5 w-5', active && 'text-[#D97043]')}
                    strokeWidth={active ? 2.3 : 1.7}
                  />
                  <span
                    className={clsx(
                      'relative z-10 mt-1 max-w-full truncate text-[10px]',
                      active ? 'font-semibold' : 'font-normal'
                    )}
                  >
                    {item.short}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setMoreOpen(true);
              }}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={clsx(
                'hq-focus relative flex w-full flex-col items-center justify-center rounded-xl px-1 py-2 transition-colors',
                moreActive ? 'text-[#1F1E1B]' : 'text-[#8A877E]'
              )}
            >
              {moreActive && (
                <span className="absolute inset-0 rounded-xl border border-[#D97043]/20 bg-[#D97043]/10" />
              )}
              <Menu
                className={clsx('relative z-10 h-5 w-5', moreActive && 'text-[#D97043]')}
                strokeWidth={moreActive ? 2.3 : 1.7}
              />
              <span
                className={clsx(
                  'relative z-10 mt-1 text-[10px]',
                  moreActive ? 'font-semibold' : 'font-normal'
                )}
              >
                Más
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet
        open={moreOpen}
        onClose={closeMore}
        title="Todos los módulos"
        description="Accede a la jornada, academia, agentes, caja y ajustes desde el móvil."
      >
        <div className="space-y-4 pb-1">
          {NAV_GROUPS.map((group) => {
            const items = HQ_NAV.filter((item) => item.group === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <div className="hq-label mb-1.5">{group.label}</div>
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
                          aria-current={active ? 'page' : undefined}
                          className={clsx(
                            'hq-focus flex h-full flex-col gap-1.5 rounded-xl border p-3 transition-colors',
                            active
                              ? 'border-[#D97043]/30 bg-[#D97043]/10'
                              : 'border-[#E8E5DD] bg-white hover:bg-[#F2EFE9]'
                          )}
                        >
                          <span
                            className={clsx(
                              'flex h-8 w-8 items-center justify-center rounded-lg border',
                              active
                                ? 'border-[#D97043]/25 bg-white text-[#D97043]'
                                : 'border-[#E8E5DD] bg-[#FAF9F5] text-[#5E5C56]'
                            )}
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span className="text-xs font-semibold text-[#1F1E1B]">
                            {item.label}
                          </span>
                          <span className="text-[10px] leading-snug text-[#8A877E]">
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
