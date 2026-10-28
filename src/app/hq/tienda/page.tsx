'use client';

import { PageHeader } from '@/components/hq/ui/primitives';
import { EconomySanctuary } from '@/components/economy/EconomySanctuary';

export default function TiendaPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Bazar de Ciudad Trigal"
        title="Todo entra por el Bazar"
        description="Compras aquí, se guarda en la Bóveda y desde ahí viaja al cartucho. Una sola moneda: Pokédólares."
      />

      <EconomySanctuary initialTab="bazar" />
    </div>
  );
}
