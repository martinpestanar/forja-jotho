'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LogOut, Waves } from 'lucide-react';
import { HQ_NAV, NAV_GROUPS, isNavActive } from '@/lib/hqNav';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, []);

  const signOut = async () => {
    soundFx.playClick();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#E8E5DD] bg-[#FAF9F5]/95 px-3 py-4 backdrop-blur lg:flex">
      <Link href="/hq" className="hq-focus mb-5 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
          <Waves className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0">
          <span className="hq-title block text-sm font-semibold leading-tight text-[#1F1E1B]">
            Korat Flow HQ
          </span>
          <span className="hq-mono block text-[10px] text-[#8A877E]">Founder Console</span>
        </span>
      </Link>

      <nav className="hq-scroll flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => {
          const items = HQ_NAV.filter((item) => item.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key}>
              <div className="hq-label mb-1.5 px-2">{group.label}</div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => soundFx.playClick()}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'hq-focus group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-colors',
                          active
                            ? 'bg-white font-semibold text-[#1F1E1B] shadow-sm ring-1 ring-[#E8E5DD]'
                            : 'text-[#5E5C56] hover:bg-white/70 hover:text-[#1F1E1B]'
                        )}
                      >
                        <Icon
                          className={clsx('h-4 w-4 shrink-0', active ? 'text-[#D97043]' : 'text-[#8A877E]')}
                          strokeWidth={active ? 2.2 : 1.7}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-[#E8E5DD] pt-3">
        <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F1E1B] text-[11px] font-bold text-[#FAF9F5]">
            {(email?.[0] ?? 'K').toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-medium text-[#1F1E1B]">
              {email ?? 'Fundador'}
            </span>
            <span className="hq-mono block text-[10px] text-[#8A877E]">sesión única</span>
          </span>
          <button
            type="button"
            onClick={signOut}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="hq-focus rounded-lg border border-[#E8E5DD] bg-white p-1.5 text-[#8A877E] transition-colors hover:text-[#D9534F]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
