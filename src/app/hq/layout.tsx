import { HqGuard } from '@/components/hq/layout/HqGuard';
import { AppShell } from '@/components/hq/layout/AppShell';

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return (
    <HqGuard>
      <AppShell>{children}</AppShell>
    </HqGuard>
  );
}
