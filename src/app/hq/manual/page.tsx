'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  Compass,
  Crown,
  Megaphone,
  Sparkles,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Zap,
  Flame,
  Layers,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/hq/ui/primitives';
import { soundFx } from '@/lib/soundFx';

export default function ManualPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Encabezado elegante estilo Anthropic */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E5DD] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="hq-mono text-[11px] font-semibold tracking-wider text-[#D97043] uppercase bg-[#D97043]/10 px-2.5 py-0.5 rounded-full border border-[#D97043]/20">
              Manual de Operaciones
            </span>
          </div>
          <h1 className="hq-title text-2xl sm:text-3xl font-semibold text-[#1F1E1B] tracking-tight">
            Guía Diaria de Martín & SynDex
          </h1>
          <p className="text-sm text-[#5E5C56] mt-1 max-w-2xl leading-relaxed">
            Arquitectura de foco diario entre CTO, CMO y CEO. Máxima claridad mental con estímulos de progreso.
          </p>
        </div>

        {/* Botón Rojo Nintendo Tactile */}
        <Link
          href="/hq"
          onClick={() => soundFx.playClick()}
          className="nintendo-btn-red self-start sm:self-auto shrink-0"
        >
          <Zap className="h-4 w-4" fill="currentColor" />
          <span>Iniciar Turno Hoy</span>
          <ArrowRight className="h-4 w-4 ml-0.5" />
        </Link>
      </div>

      {/* Regla de Oro: Banner Anthropic cálido con acento rojo sutil */}
      <div className="rounded-2xl border border-[#E8E5DD] bg-white p-6 shadow-[0_2px_8px_rgba(31,30,27,0.04)] relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#E60012]" />
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E60012] border border-red-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <span className="hq-mono text-xs font-bold tracking-wide text-[#E60012] uppercase">
              La Regla de Oro del Fundador Solitario
            </span>
            <p className="text-sm text-[#383733] font-medium leading-relaxed">
              No intentes hacer todo a la vez. Cuando eres <strong className="text-[#1F1E1B]">CTO</strong>, apagas las redes y programas. Cuando eres <strong className="text-[#1F1E1B]">CMO</strong>, cierras el código y vendes. Cuando eres <strong className="text-[#1F1E1B]">CEO</strong>, miras los números y dejas el terreno preparado para mañana.
            </p>
          </div>
        </div>
      </div>

      {/* Caso de estudio: Simulación en Vivo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[#E60012] animate-pulse" />
            <h2 className="text-sm font-semibold tracking-wide uppercase hq-mono text-[#1F1E1B]">
              Simulación en Vivo · Un Día Típico (11:00 AM a 5:00 PM)
            </h2>
          </div>
          <span className="text-xs text-[#8A877E] hq-mono">
            4 Bloques de Alta Densidad
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bloque 1: Llegada */}
          <div className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_2px_6px_rgba(31,30,27,0.03)] hover:border-[#D5D1C5] hover:shadow-[0_6px_16px_rgba(31,30,27,0.06)] transition-all space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="hq-mono text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" /> 11:00 AM · Llegada
              </span>
              <span className="hq-mono text-[10px] font-semibold text-neutral-500 bg-[#F2EFE9] px-2 py-0.5 rounded-md border border-[#E8E5DD]">
                60 segundos
              </span>
            </div>

            <p className="text-xs text-[#5E5C56]">
              Llegas a la oficina, abres SynDex y vas directo a <Link href="/hq" className="font-semibold text-emerald-800 hover:underline">/hq (Hoy)</Link>.
            </p>

            <div className="bg-[#FAF9F5] rounded-xl p-3 border border-[#E8E5DD] space-y-2 text-xs text-[#383733]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Miras la tarjeta <strong>"Bloque Activo"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Presionas <strong>"Check-In ahora"</strong> para iniciar tu turno</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Tu batería de energía se activa para la primera sesión</span>
              </div>
            </div>
          </div>

          {/* Bloque 2: CTO */}
          <div className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_2px_6px_rgba(31,30,27,0.03)] hover:border-[#D5D1C5] hover:shadow-[0_6px_16px_rgba(31,30,27,0.06)] transition-all space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="hq-mono text-xs font-bold text-blue-700 flex items-center gap-1.5 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full">
                <Wrench className="h-3.5 w-3.5" /> 11:05 AM - 1:00 PM · CTO
              </span>
              <span className="hq-mono text-[10px] font-semibold text-neutral-500 bg-[#F2EFE9] px-2 py-0.5 rounded-md border border-[#E8E5DD]">
                2h Desarrollo
              </span>
            </div>

            <p className="text-xs text-[#5E5C56]">
              Cambias al rol técnico en <Link href="/hq/roles/cto" className="font-semibold text-blue-800 hover:underline">/hq/roles (CTO)</Link>. Eres el arquitecto.
            </p>

            <div className="bg-[#FAF9F5] rounded-xl p-3 border border-[#E8E5DD] space-y-2 text-xs text-[#383733]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Programas o ajustas Nilah AI y agentes de n8n</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Redes sociales cerradas. 100% código y foco continuo</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DD]/60">
                <span className="text-[11px] text-neutral-500 font-medium">Recompensa al completar:</span>
                <span className="hq-mono text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  +100 XP · +50 💰
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 3: CMO */}
          <div className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_2px_6px_rgba(31,30,27,0.03)] hover:border-[#D5D1C5] hover:shadow-[0_6px_16px_rgba(31,30,27,0.06)] transition-all space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="hq-mono text-xs font-bold text-amber-800 flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
                <Megaphone className="h-3.5 w-3.5" /> 2:00 PM - 4:00 PM · CMO
              </span>
              <span className="hq-mono text-[10px] font-semibold text-neutral-500 bg-[#F2EFE9] px-2 py-0.5 rounded-md border border-[#E8E5DD]">
                2h Marketing
              </span>
            </div>

            <p className="text-xs text-[#5E5C56]">
              Cambias de sombrero en <Link href="/hq/roles/cmo" className="font-semibold text-amber-800 hover:underline">/hq/roles (CMO)</Link>. Cierras el editor de código.
            </p>

            <div className="bg-[#FAF9F5] rounded-xl p-3 border border-[#E8E5DD] space-y-2 text-xs text-[#383733]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span>Revisas <Link href="/hq/redes" className="font-semibold underline">/hq/redes</Link> para ver leads de WhatsApp y métricas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span>Creas o programas el video de TikTok/Reel del día</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span>Supervisas prospectos de Maps-Hunter en <Link href="/hq/agentes" className="font-semibold underline">/hq/agentes</Link></span>
              </div>
            </div>
          </div>

          {/* Bloque 4: CEO */}
          <div className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_2px_6px_rgba(31,30,27,0.03)] hover:border-[#D5D1C5] hover:shadow-[0_6px_16px_rgba(31,30,27,0.06)] transition-all space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="hq-mono text-xs font-bold text-purple-700 flex items-center gap-1.5 bg-purple-50 border border-purple-200/60 px-2.5 py-1 rounded-full">
                <Crown className="h-3.5 w-3.5" /> 4:00 PM - 4:30 PM · CEO
              </span>
              <span className="hq-mono text-[10px] font-semibold text-neutral-500 bg-[#F2EFE9] px-2 py-0.5 rounded-md border border-[#E8E5DD]">
                30m Cierre
              </span>
            </div>

            <p className="text-xs text-[#5E5C56]">
              Cierre de oficina en <Link href="/hq/pendientes" className="font-semibold text-purple-800 hover:underline">/hq/pendientes (Cola)</Link>.
            </p>

            <div className="bg-[#FAF9F5] rounded-xl p-3 border border-[#E8E5DD] space-y-2 text-xs text-[#383733]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span>Mueves tareas pendientes para que no se pierdan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span>Anotas la tarea #1 prioritaria con la que arrancas mañana</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span>Haces <strong>Check-Out</strong> en /hq y apagas la laptop con satisfacción</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directorio de todos los módulos: Tarjetas refinadas con hover táctil */}
      <div className="rounded-2xl border border-[#E8E5DD] bg-white p-6 shadow-[0_2px_8px_rgba(31,30,27,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase hq-mono text-[#1F1E1B] flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#D97043]" />
            Directorio Rápido de Módulos
          </h2>
          <span className="text-xs text-[#8A877E] hq-mono">9 Módulos Activos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/hq', title: '/hq (Hoy)', desc: 'Centro neurálgico: check-in, bloque actual y racha.' },
            { href: '/hq/roles', title: '/hq/roles', desc: 'Cambio de piel entre CEO, CTO y CMO.' },
            { href: '/hq/pendientes', title: '/hq/pendientes', desc: 'Cola de tareas, relevos y prioridades de mañana.' },
            { href: '/hq/jornada', title: '/hq/jornada', desc: 'Calendario maestro y estructura de tus 8 horas.' },
            { href: '/hq/redes', title: '/hq/redes', desc: 'Redes sociales, TikTok y leads entrantes.' },
            { href: '/hq/agentes', title: '/hq/agentes', desc: 'Bots y agentes de IA trabajando en segundo plano.' },
            { href: '/hq/tiempo', title: '/hq/tiempo', desc: 'Cartucho Pokémon Heart & Soul y canje de tiempo.' },
            { href: '/hq/tienda', title: '/hq/tienda', desc: 'Bazar y recompensas canjeables con Pokédólares.' },
            { href: '/hq/caja', title: '/hq/caja', desc: 'Cuentas, facturación y MRR de la agencia.' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => soundFx.playClick()}
              className="group p-3.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5]/60 hover:bg-white hover:border-[#D5D1C5] hover:shadow-[0_4px_12px_rgba(31,30,27,0.05)] transition-all space-y-1 block"
            >
              <div className="flex items-center justify-between">
                <span className="hq-mono text-xs font-bold text-[#1F1E1B] group-hover:text-[#D97043] transition-colors">
                  {item.title}
                </span>
                <ArrowRight className="h-3 w-3 text-[#8A877E] group-hover:text-[#D97043] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-[#5E5C56] leading-snug">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
