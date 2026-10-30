'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Command, HelpCircle, Waves } from 'lucide-react';
import { getTodayLabel } from '@/lib/hqSchedule';
import { ManualModal } from '@/components/hq/ui/ManualModal';

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [today, setToday] = useState('');
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    const update = () => setToday(getTodayLabel());
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <header className="relative z-40 border-b border-[#E8E5DD] bg-[#FAF9F5]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-3 px-4 py-2.5 lg:px-6">
          <Link href="/hq" className="hq-focus flex min-w-0 items-center gap-2.5 rounded-lg">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
              <Waves className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="hq-title block truncate text-xs font-semibold leading-tight text-[#1F1E1B] sm:text-sm">
                Korat Flow HQ
              </span>
              <span className="hq-mono hidden text-[10px] text-[#8A877E] sm:block">
                Founder Console
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[11px] capitalize text-[#8A877E] sm:flex">
              <CalendarDays className="h-3.5 w-3.5" />
              {today}
            </span>

            {/* Botón Guía Rápida y Manual */}
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-amber-400 px-2.5 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-amber-300 transition-all font-mono"
              title="Abrir Manual y Guía Diaria de Martín"
            >
              <HelpCircle className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
              <span>Guía Diaria</span>
            </button>

            <button
              type="button"
              onClick={onOpenPalette}
              className="hq-focus flex items-center gap-1.5 rounded-lg border border-[#E8E5DD] bg-white px-2 py-1.5 text-[11px] text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hq-mono hidden rounded border border-[#E8E5DD] bg-[#FAF9F5] px-1 text-[9px] text-[#8A877E] sm:inline">
                K
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Modal Interactivo de Guía Rápida */}
      <ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />
    </>
  );
}
