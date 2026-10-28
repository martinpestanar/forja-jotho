import { Bot, CheckCircle2, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '@/components/hq/ui/primitives';

const AGENTS = [
  {
    key: 'korat-dev',
    name: 'Korat-Dev',
    icon: Bot,
    accent: 'var(--hq-cto)',
    role: 'QA & diagnóstico de código',
    description:
      'Monitorea errores en Supabase, detecta cuellos de botella y prepara resúmenes con soluciones para el CTO.',
    tools: ['Supabase', 'Logs', 'MCP'],
  },
  {
    key: 'maps-hunter',
    name: 'Maps-Hunter',
    icon: MapPin,
    accent: 'var(--hq-cmo)',
    role: 'Prospección & calificación de leads',
    description:
      'Limpia listas de Google Maps, clasifica negocios y redacta el primer mensaje personalizado para el CMO.',
    tools: ['Google Maps', 'n8n', 'WhatsApp'],
  },
];

export default function AgentesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Agentes IA"
        title="Trabajo en segundo plano"
        description="Los agentes no atienden clientes: preparan diagnóstico y prospección para que el fundador decida."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.key} interactive className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    color: agent.accent,
                    borderColor: 'var(--hq-border)',
                    backgroundColor: `color-mix(in srgb, ${agent.accent} 10%, white)`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <span className="hq-chip text-[9px]">
                  <CheckCircle2 className="h-3 w-3" />
                  en espera
                </span>
              </div>

              <h2 className="hq-title mt-3 text-lg text-[#1F1E1B]">{agent.name}</h2>
              <p className="text-[11px] font-medium" style={{ color: agent.accent }}>
                {agent.role}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#5E5C56]">{agent.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <span key={tool} className="hq-chip text-[9px]">
                    {tool}
                  </span>
                ))}
              </div>

              <button type="button" className="hq-btn hq-btn-ghost mt-4 w-full" disabled>
                <Sparkles className="h-4 w-4" />
                Lanzar agente (próximamente)
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <SectionTitle title="Registro de ejecuciones" hint="runs" />
        <div className="rounded-xl border border-dashed border-[#D5D1C5] bg-[#FAF9F5] p-4 text-[11px] leading-relaxed text-[#8A877E]">
          Sin ejecuciones todavía. Cuando un agente corra, verás aquí su entrada, salida y si requiere aprobación humana.
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Regla de oro" hint="human in the loop" />
        <div className="flex gap-3 rounded-xl border border-[#5A7D62]/25 bg-[#5A7D62]/5 p-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#5A7D62]" />
          <p className="text-[11px] leading-relaxed text-[#4C6151]">
            Ningún agente envía mensajes a clientes activos. Todo output pasa por revisión del rol responsable.
          </p>
        </div>
      </Card>
    </div>
  );
}
