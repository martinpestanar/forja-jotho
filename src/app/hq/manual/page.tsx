import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  Clock,
  Compass,
  Crown,
  Gamepad2,
  HelpCircle,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Wallet,
  Wrench,
  Bot,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/hq/ui/primitives';

export default function ManualPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        eyebrow="Manual de Operaciones"
        title="Guía Diaria de Martín & SynDex"
        description="Cómo estructurar tus días entre programación, marketing y dirección sin perder el foco ni sentirte abrumado."
      />

      {/* Regla de Oro */}
      <div className="rounded-2xl border-4 border-[#121214] bg-white p-5 shadow-[6px_6px_0px_0px_#000] space-y-2">
        <div className="flex items-center gap-2 text-rose-600 font-mono font-black text-sm uppercase">
          <Sparkles className="h-5 w-5" />
          <span>La Regla de Oro del Fundador Solitario</span>
        </div>
        <p className="text-sm text-neutral-800 leading-relaxed">
          No intentes hacer todo a la vez. Cuando eres <strong>CTO</strong>, apagas las redes y programas. Cuando eres <strong>CMO</strong>, cierras el código y vendes. Cuando eres <strong>CEO</strong>, miras los números y dejas el terreno preparado para mañana.
        </p>
      </div>

      {/* Caso de estudio paso a paso */}
      <div className="rounded-2xl border-4 border-[#121214] bg-[#F4F1EA] p-5 shadow-[6px_6px_0px_0px_#000] space-y-5">
        <div className="border-b-2 border-black pb-3">
          <span className="rounded bg-black text-white font-mono text-xs px-2 py-0.5 font-bold uppercase">
            Simulación en Vivo
          </span>
          <h2 className="text-lg font-black font-mono mt-1 text-neutral-900">
            Un Día Típico de Martín (11:00 AM a 5:00 PM)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Bloque 1 */}
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-emerald-700 uppercase flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> 11:00 AM · Llegada
              </span>
              <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                60 segundos
              </span>
            </div>
            <p className="text-neutral-700">
              Llegas a la oficina, abres SynDex y vas directo a <Link href="/hq" className="font-bold underline text-emerald-800">/hq (Hoy)</Link>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Miras la tarjeta <strong>"Bloque Activo"</strong>.</li>
              <li>Presionas <strong>"Check-In ahora"</strong> para activar tu turno.</li>
              <li>Tu batería de energía se activa para la primera sesión.</li>
            </ul>
          </div>

          {/* Bloque 2 */}
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-blue-700 uppercase flex items-center gap-1.5">
                <Wrench className="h-4 w-4" /> 11:05 AM - 1:00 PM · CTO
              </span>
              <span className="rounded bg-blue-100 text-blue-800 font-bold px-2 py-0.5 text-[10px]">
                2h Desarrollo
              </span>
            </div>
            <p className="text-neutral-700">
              Vas a <Link href="/hq/roles/cto" className="font-bold underline text-blue-800">/hq/roles (CTO)</Link>. Eres el arquitecto técnico.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Programas o ajustas Nilah AI y agentes de n8n.</li>
              <li>Redes sociales cerradas. 100% código y foco.</li>
              <li>Al terminar, marcas la tarea: <strong>+100 XP</strong> y <strong>+50 Pokédólares</strong>.</li>
            </ul>
          </div>

          {/* Bloque 3 */}
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-800 uppercase flex items-center gap-1.5">
                <Megaphone className="h-4 w-4" /> 2:00 PM - 4:00 PM · CMO
              </span>
              <span className="rounded bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[10px]">
                2h Marketing
              </span>
            </div>
            <p className="text-neutral-700">
              Cambias de sombrero en <Link href="/hq/roles/cmo" className="font-bold underline text-amber-800">/hq/roles (CMO)</Link>. Cierras el editor de código.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Revisas <Link href="/hq/redes" className="underline font-semibold">/hq/redes</Link> para ver leads de WhatsApp y métricas.</li>
              <li>Creas o programas el video de TikTok/Reel del día.</li>
              <li>Revisas qué contactos recolectó Maps-Hunter en <Link href="/hq/agentes" className="underline font-semibold">/hq/agentes</Link>.</li>
            </ul>
          </div>

          {/* Bloque 4 */}
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-purple-700 uppercase flex items-center gap-1.5">
                <Crown className="h-4 w-4" /> 4:00 PM - 4:30 PM · CEO
              </span>
              <span className="rounded bg-purple-100 text-purple-800 font-bold px-2 py-0.5 text-[10px]">
                30m Cierre
              </span>
            </div>
            <p className="text-neutral-700">
              Cierre de oficina en <Link href="/hq/pendientes" className="font-bold underline text-purple-800">/hq/pendientes (Cola)</Link>.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Mueves tareas pendientes para que no se pierdan.</li>
              <li>Anotas la tarea #1 con la que vas a arrancar mañana a las 11:00 AM.</li>
              <li>Haces <strong>Check-Out</strong> en /hq y apagas la laptop con satisfacción.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Directorio de todos los módulos */}
      <div className="rounded-2xl border-4 border-[#121214] bg-white p-5 shadow-[6px_6px_0px_0px_#000] space-y-4">
        <h2 className="text-base font-black font-mono uppercase text-neutral-900 border-b-2 border-neutral-200 pb-2 flex items-center gap-2">
          <Compass className="h-5 w-5 text-neutral-800" /> Directorio Rápido de Módulos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/hq" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq (Hoy)</strong>
            <span className="text-neutral-600">Centro neurálgico: check-in, bloque actual y racha.</span>
          </Link>

          <Link href="/hq/roles" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/roles</strong>
            <span className="text-neutral-600">Cambio de piel entre CEO, CTO y CMO.</span>
          </Link>

          <Link href="/hq/pendientes" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/pendientes</strong>
            <span className="text-neutral-600">Cola de tareas, relevos y prioridades de mañana.</span>
          </Link>

          <Link href="/hq/jornada" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/jornada</strong>
            <span className="text-neutral-600">Calendario maestro y estructura de tus 8 horas.</span>
          </Link>

          <Link href="/hq/redes" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/redes</strong>
            <span className="text-neutral-600">Redes sociales, TikTok y leads entrantes.</span>
          </Link>

          <Link href="/hq/agentes" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/agentes</strong>
            <span className="text-neutral-600">Bots y agentes de IA trabajando en segundo plano.</span>
          </Link>

          <Link href="/hq/tiempo" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/tiempo</strong>
            <span className="text-neutral-600">Cartucho Pokémon Heart & Soul y canje de tiempo libre.</span>
          </Link>

          <Link href="/hq/tienda" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/tienda</strong>
            <span className="text-neutral-600">Bazar y recompensas canjeables con Pokédólares.</span>
          </Link>

          <Link href="/hq/caja" className="p-3 rounded-xl border-2 border-black hover:bg-neutral-50 shadow-[3px_3px_0px_0px_#000] transition-all">
            <strong className="block font-mono text-sm text-neutral-900">/hq/caja</strong>
            <span className="text-neutral-600">Cuentas, facturación y MRR de la agencia.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
