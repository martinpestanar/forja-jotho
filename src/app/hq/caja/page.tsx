'use client';

import { Banknote, Clock, DollarSign, TrendingUp, Users, Wallet } from 'lucide-react';
import { Card, ElasticProgress, PageHeader, SectionTitle, Stat } from '@/components/hq/ui/primitives';

const CASH_SLOTS = [
  {
    title: 'Páginas monetizadas',
    detail: 'Mr. Green y afines · 30 min al final de la mañana',
    expected: '~$100/mes',
    accent: 'var(--hq-gold)',
  },
  {
    title: 'Slot de caja rápida',
    detail: 'Edición, grabación o Meta Ads para clientes locales · 1h',
    expected: 'Variable',
    accent: 'var(--hq-cmo)',
  },
];

export default function CajaPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Caja & Ingresos"
        title="El dinero como muralla"
        description="MRR, caja disponible y los slots que sostienen el flujo mientras los SaaS escalan."
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="MRR" value="$0" icon={TrendingUp} accent="var(--hq-ceo)" hint="sin datos" />
        <Stat label="Caja disponible" value="$0" icon={Banknote} accent="var(--hq-cto)" hint="sin datos" />
        <Stat label="Clientes activos" value="0" icon={Users} accent="var(--hq-cmo)" hint="Nilah AI" />
        <Stat label="Pipeline" value="0" icon={DollarSign} accent="var(--hq-gold)" hint="leads calificados" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <SectionTitle title="Slots de ingreso" hint="caja rápida" />
          <div className="space-y-2.5">
            {CASH_SLOTS.map((slot) => (
              <div key={slot.title} className="rounded-xl border border-[#E8E5DD] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-[#1F1E1B]">{slot.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#5E5C56]">{slot.detail}</p>
                  </div>
                  <span
                    className="hq-mono shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: slot.accent,
                      backgroundColor: `color-mix(in srgb, ${slot.accent} 10%, white)`,
                    }}
                  >
                    {slot.expected}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <SectionTitle title="Progreso a meta" hint="mes actual" />
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[10px] text-[#8A877E]">
                <span>Meta de caja rápida</span>
                <span className="hq-mono">$0 / $100</span>
              </div>
              <ElasticProgress value={0} accent="var(--hq-gold)" height={6} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-[#8A877E]">
                <span>MRR objetivo</span>
                <span className="hq-mono">—</span>
              </div>
              <ElasticProgress value={0} accent="var(--hq-ceo)" height={6} className="mt-1" />
            </div>
          </div>
        </Card>

        <div className="space-y-2.5">
          <Card className="p-4">
            <SectionTitle title="Registrar movimiento" hint="manual" />
            <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-3 text-[11px] leading-relaxed text-[#8A877E]">
              El registro de ingresos y gastos llega con la tabla <span className="hq-mono">hq_metrics</span>.
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle title="Próximo hito" hint="foco" />
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-semibold text-[#1F1E1B]">Cerrar caja del día</div>
                <div className="flex items-center gap-1 text-[11px] text-[#8A877E]">
                  <Clock className="h-3 w-3" />
                  19:30 · Cierre operativo
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
