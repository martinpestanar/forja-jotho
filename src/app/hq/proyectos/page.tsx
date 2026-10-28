'use client';

import React from 'react';
import { ArrowUpRight, FolderKanban, Sprout, Store, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, ElasticProgress, PageHeader, SectionTitle, Stat } from '@/components/hq/ui/primitives';

interface Project {
  key: string;
  name: string;
  tagline: string;
  priority: number;
  status: string;
  focus: string;
  accent: string;
  icon: LucideIcon;
}

const PROJECTS: Project[] = [
  {
    key: 'nilah',
    name: 'Nilah AI',
    tagline: 'SaaS para salones de belleza',
    priority: 80,
    status: 'Producción activa',
    focus: 'Onboarding, soporte humano y campaña diaria de TikTok.',
    accent: 'var(--hq-ceo)',
    icon: Store,
  },
  {
    key: 'vegi',
    name: 'Vegi / Suna',
    tagline: 'SaaS para restaurantes',
    priority: 15,
    status: '80% · beta',
    focus: 'Pruebas de estrés y despliegue beta con el restaurante aliado.',
    accent: 'var(--hq-cto)',
    icon: Utensils,
  },
  {
    key: 'farmacia',
    name: 'Farmacia Familiar',
    tagline: 'App de fidelización',
    priority: 5,
    status: 'Laboratorio',
    focus: 'Cupones y fidelización por WhatsApp sin presión comercial.',
    accent: 'var(--hq-cmo)',
    icon: Sprout,
  },
];

export default function ProyectosPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Portafolio"
        title="Tres proyectos, una jerarquía"
        description="El tiempo se reparte por prioridad, no por urgencia. Nilah manda; Vegi y Farmacia tienen bloques acotados."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <Card key={project.key} interactive className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    color: project.accent,
                    borderColor: 'var(--hq-border)',
                    backgroundColor: `color-mix(in srgb, ${project.accent} 10%, white)`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <span className="hq-mono text-2xl font-semibold tabular-nums" style={{ color: project.accent }}>
                  {project.priority}%
                </span>
              </div>

              <h2 className="hq-title mt-3 text-lg text-[#1F1E1B]">{project.name}</h2>
              <p className="text-[11px] text-[#8A877E]">{project.tagline}</p>

              <div className="mt-3">
                <ElasticProgress value={project.priority} accent={project.accent} height={6} />
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8A877E]">
                  <span>Prioridad de tiempo</span>
                  <span>{project.status}</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-[#5E5C56]">{project.focus}</p>

              <div className="mt-4 flex items-center justify-between border-t border-[#E8E5DD] pt-3">
                <span className="hq-chip text-[9px]">
                  <FolderKanban className="h-3 w-3" />
                  sin tareas
                </span>
                <button type="button" className="hq-focus inline-flex items-center gap-1 text-[11px] font-medium text-[#3B7A87] hover:underline">
                  Abrir tablero
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="Tiempo Nilah" value="80%" accent="var(--hq-ceo)" hint="del foco semanal" />
        <Stat label="Tiempo Vegi" value="15%" accent="var(--hq-cto)" hint="1h diaria" />
        <Stat label="Farmacia" value="5%" accent="var(--hq-cmo)" hint="bloques semanales" />
        <Stat label="Tareas abiertas" value="0" hint="sin datos" />
      </div>

      <Card className="p-5">
        <SectionTitle title="Regla de asignación" hint="anti-multitasking" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: '80% Nilah', text: 'Caja y clientes activos primero.' },
            { title: '15% Vegi', text: 'Una hora diaria, sin invadir el cierre.' },
            { title: '5% Farmacia', text: 'Solo laboratorio, sin presión comercial.' },
          ].map((rule) => (
            <div key={rule.title} className="hq-panel p-3">
              <h3 className="text-xs font-semibold text-[#1F1E1B]">{rule.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5C5A54]">{rule.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
