'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Database, GitBranch, LogOut, Network, RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '@/components/hq/ui/primitives';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';
import { useHqStore } from '@/store/useHqStore';

const INTEGRATIONS = [
  {
    name: 'Supabase',
    detail: 'hywlytsbogbassecflbw',
    icon: Database,
    accent: 'var(--hq-cto)',
  },
  {
    name: 'GitHub',
    detail: 'MCP conectado',
    icon: GitBranch,
    accent: 'var(--hq-ink)',
  },
  {
    name: 'n8n',
    detail: 'n8n.koratflow.agency',
    icon: Network,
    accent: 'var(--hq-ceo)',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetHq = useHqStore((state) => state.reset);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    soundFx.playClick();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ajustes"
        title="Tu HQ, tus reglas"
        description="Sesión única de fundador. Integraciones, apariencia y control de acceso."
      />

      <Card className="p-5">
        <SectionTitle title="Cuenta" hint="fundador" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1F1E1B] text-sm font-bold text-[#FAF9F5]">
              {(email?.[0] ?? 'K').toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#1F1E1B]">{email ?? 'Fundador'}</div>
              <div className="flex items-center gap-1 text-[11px] text-[#8A877E]">
                <ShieldCheck className="h-3 w-3" />
                Acceso privado · sin registro público
              </div>
            </div>
          </div>
          <button type="button" onClick={signOut} className="hq-btn hq-btn-ghost text-[#B2403C]">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Integraciones" hint="MCP" />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.name}
                className="flex items-center gap-3 rounded-xl border border-[#E8E5DD] bg-white p-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    color: integration.accent,
                    borderColor: 'var(--hq-border)',
                    backgroundColor: 'var(--hq-muted)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#1F1E1B]">{integration.name}</div>
                  <div className="truncate text-[10px] text-[#8A877E]">{integration.detail}</div>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5A7D62]" />
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#8A877E]">
          Los tokens viven en <span className="hq-mono">.env</span> y se inyectan a los servidores MCP al iniciar opencode.
        </p>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Apariencia" hint="Anthropic Coastal" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="hq-chip">Crema #FAF9F5</span>
          <span className="hq-chip">Terracota #D97043</span>
          <span className="hq-chip">Salvia #5A7D62</span>
          <span className="hq-chip">Turquesa #3B7A87</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A877E]">
          El HQ usa un solo tema cálido. El modo oscuro queda reservado para la gamificación.
        </p>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Datos del HQ" hint="persistencia local" />
        <p className="text-[11px] leading-relaxed text-[#5E5C56]">
          Turnos, check-outs, relevos y banco de tiempo se guardan en este navegador. La
          sincronización con Supabase llega en la siguiente fase. Los datos de Pokémon no se tocan.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                soundFx.playWarning();
                return;
              }
              resetHq();
              setConfirmReset(false);
              soundFx.playLevelUp();
            }}
            className="hq-btn hq-btn-ghost text-[#B2403C]"
          >
            <RotateCcw className="h-4 w-4" />
            {confirmReset ? 'Confirmar borrado' : 'Borrar datos locales'}
          </button>
          {confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="hq-btn hq-btn-ghost"
            >
              Cancelar
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
