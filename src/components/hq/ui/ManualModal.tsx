'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Gamepad2,
  HelpCircle,
  Megaphone,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [tab, setTab] = useState<'ejemplo' | 'flujo' | 'modulos'>('ejemplo');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border-4 border-[#121214] bg-[#F4F1EA] shadow-[8px_8px_0px_0px_#000] overflow-hidden text-[#1F1E1B]">
        {/* Header estilo Pokédex / Neo-Arcade */}
        <div className="flex items-center justify-between border-b-4 border-[#121214] bg-[#E60012] px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/40 bg-black/20 text-white font-mono font-bold text-sm">
              HQ
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase font-mono flex items-center gap-2">
                Manual del Fundador & Guía Rápida
                <span className="hidden sm:inline-block rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                  V1.0
                </span>
              </h2>
              <p className="text-[11px] text-white/90">
                Tu rutina diaria paso a paso: sin sobrecarga, un rol a la vez.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-neutral-100 transition-transform"
            aria-label="Cerrar manual"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex border-b-2 border-[#121214] bg-[#EBE7DF] p-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('ejemplo')}
            className={`flex items-center gap-2 rounded-lg border-2 border-black px-3 py-1.5 transition-all ${
              tab === 'ejemplo'
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Ejemplo de Martín (11:00 AM)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('flujo')}
            className={`flex items-center gap-2 rounded-lg border-2 border-black px-3 py-1.5 transition-all ${
              tab === 'flujo'
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Regla de los 3 Tiempos</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('modulos')}
            className={`flex items-center gap-2 rounded-lg border-2 border-black px-3 py-1.5 transition-all ${
              tab === 'modulos'
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Mapa de Módulos</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {tab === 'ejemplo' && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-xs font-semibold text-neutral-600">
                  📍 <strong className="text-black">Caso real:</strong> Cómo vive Martín un día estándar con SynDex de 11:00 AM a 5:00 PM sin abrumarse.
                </p>
              </div>

              {/* Paso 1 */}
              <div className="relative pl-6 border-l-4 border-emerald-500 space-y-2">
                <span className="absolute -left-[14px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-emerald-400 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                  1
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm sm:text-base font-black uppercase text-emerald-800">
                    11:00 AM — Llegada a la oficina
                  </h3>
                  <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    60 segundos
                  </span>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] space-y-1.5 text-xs sm:text-sm">
                  <p>
                    1. Abres la app y vas directo a <strong>/hq (Hoy)</strong>.
                  </p>
                  <p>
                    2. Miras tu tarjeta <strong>"Bloque Activo"</strong>: te dice qué puesto te toca hoy.
                  </p>
                  <p>
                    3. Presionas el botón rojo <strong className="text-[#E60012]">"Check-In ahora"</strong> y defines tu energía del día.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="relative pl-6 border-l-4 border-blue-500 space-y-2">
                <span className="absolute -left-[14px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-blue-400 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000] text-white">
                  2
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm sm:text-base font-black uppercase text-blue-800 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" /> 11:05 AM a 1:00 PM — Bloque CTO (Código)
                  </h3>
                  <span className="rounded bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                    2 horas foco
                  </span>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] space-y-1.5 text-xs sm:text-sm">
                  <p>
                    1. Vas a <strong>/hq/roles</strong> y seleccionas <strong>CTO</strong>.
                  </p>
                  <p>
                    2. Te vistes de constructor técnico: programas Nilah AI, flujos de n8n o fixes del sistema.
                  </p>
                  <p>
                    3. A la 1:00 PM marcas la tarea completada: ganas <strong>+100 XP</strong> y <strong>+50 Pokédólares</strong> 💰.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="relative pl-6 border-l-4 border-amber-500 space-y-2">
                <span className="absolute -left-[14px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-amber-400 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                  3
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm sm:text-base font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4" /> 2:00 PM a 4:00 PM — Bloque CMO (Ventas)
                  </h3>
                  <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Cambio de piel
                  </span>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] space-y-1.5 text-xs sm:text-sm">
                  <p>
                    1. Vuelves a <strong>/hq/roles</strong> y cambias a <strong>CMO</strong>. Cierras el IDE.
                  </p>
                  <p>
                    2. Revisas <strong>/hq/redes</strong>: leads de WhatsApp, contactos y grabas o subes contenido.
                  </p>
                  <p>
                    3. Chequeas <strong>/hq/agentes</strong> para ver qué prospectó el bot Maps-Hunter.
                  </p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="relative pl-6 border-l-4 border-purple-500 space-y-2">
                <span className="absolute -left-[14px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-purple-400 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000] text-white">
                  4
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm sm:text-base font-black uppercase text-purple-900 flex items-center gap-1.5">
                    <Crown className="h-4 w-4" /> 4:00 PM a 4:30 PM — Bloque CEO (Cierre)
                  </h3>
                  <span className="rounded bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                    Cierre mental
                  </span>
                </div>
                <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000] space-y-1.5 text-xs sm:text-sm">
                  <p>
                    1. Vas a <strong>/hq/pendientes</strong>. Arrastras lo no terminado y dejas anotada la prioridad #1 de mañana.
                  </p>
                  <p>
                    2. En <strong>/hq</strong> haces <strong>Check-Out</strong>: tu racha se guarda en verde 🔥.
                  </p>
                  <p>
                    3. ¿Te sobraron Pokédólares? Pasa por <strong>/hq/tienda</strong> o juega 20 min en <strong>/hq/tiempo</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'flujo' && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-black bg-amber-50 p-4 shadow-[4px_4px_0px_0px_#000]">
                <h3 className="font-mono text-sm font-black uppercase text-amber-950 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" /> La Regla Fundamental de SynDex
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-neutral-700">
                  <strong>Nunca intentes hacer de programador, vendedor y administrador al mismo tiempo.</strong> Eso satura tu cabeza. Cada bloque es un único sombrero.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
                  <div>
                    <span className="inline-block rounded bg-blue-100 border border-blue-300 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase font-mono">
                      Rol CTO
                    </span>
                    <h4 className="mt-2 font-mono font-bold text-sm text-neutral-900">Constructor</h4>
                    <p className="mt-1 text-xs text-neutral-600">
                      Nilah AI, código, n8n, bugs técnicos y arquitectura. Slack y redes apagadas.
                    </p>
                  </div>
                  <Link
                    href="/hq/roles/cto"
                    onClick={onClose}
                    className="mt-3 text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Ir a tareas CTO →
                  </Link>
                </div>

                <div className="rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
                  <div>
                    <span className="inline-block rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase font-mono">
                      Rol CMO
                    </span>
                    <h4 className="mt-2 font-mono font-bold text-sm text-neutral-900">Ventas & Redes</h4>
                    <p className="mt-1 text-xs text-neutral-600">
                      TikTok, llamadas de venta, prospección de clientes y seguimiento comercial.
                    </p>
                  </div>
                  <Link
                    href="/hq/roles/cmo"
                    onClick={onClose}
                    className="mt-3 text-[11px] font-bold text-amber-600 hover:underline inline-flex items-center gap-1"
                  >
                    Ir a tareas CMO →
                  </Link>
                </div>

                <div className="rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
                  <div>
                    <span className="inline-block rounded bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-black text-purple-800 uppercase font-mono">
                      Rol CEO
                    </span>
                    <h4 className="mt-2 font-mono font-bold text-sm text-neutral-900">Estrategia & Caja</h4>
                    <p className="mt-1 text-xs text-neutral-600">
                      Finanzas, cobros, relevo de tareas, visión y prioridades para mañana.
                    </p>
                  </div>
                  <Link
                    href="/hq/roles/ceo"
                    onClick={onClose}
                    className="mt-3 text-[11px] font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    Ir a tareas CEO →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {tab === 'modulos' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 font-semibold">
                Haz clic en cualquier módulo para ir directo:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <Link
                  href="/hq"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-emerald-100 font-bold">
                    HQ
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq (Hoy)</strong>
                    <span className="text-neutral-600 text-[11px]">Tu panel diario: bloque activo, batería y check-in.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/roles"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-blue-100 font-bold">
                    🎭
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/roles (Cambio de Piel)</strong>
                    <span className="text-neutral-600 text-[11px]">Elige si eres CEO, CTO o CMO según el horario.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/pendientes"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-purple-100 font-bold">
                    📋
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/pendientes (Cola)</strong>
                    <span className="text-neutral-600 text-[11px]">Relevos, arrastre y preparación del día siguiente.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/redes"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-amber-100 font-bold">
                    📱
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/redes (Redes & Leads)</strong>
                    <span className="text-neutral-600 text-[11px]">TikTok, métricas y contactos entrantes de la agencia.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/agentes"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-cyan-100 font-bold">
                    🤖
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/agentes (Agentes IA)</strong>
                    <span className="text-neutral-600 text-[11px]">Monitorea qué hacen Korat-Dev y Maps-Hunter.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/tiempo"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-rose-100 font-bold">
                    🎮
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/tiempo (Pokémon Time)</strong>
                    <span className="text-neutral-600 text-[11px]">Cartucho Heart & Soul y canje de minutos de juego.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/caja"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-green-100 font-bold">
                    💰
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/caja (Caja & Finanzas)</strong>
                    <span className="text-neutral-600 text-[11px]">Ingresos del mes, cobros y balance de la agencia.</span>
                  </div>
                </Link>

                <Link
                  href="/hq/manual"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black bg-neutral-200 font-bold">
                    📖
                  </div>
                  <div>
                    <strong className="block text-neutral-900 font-mono">/hq/manual (Página Completa)</strong>
                    <span className="text-neutral-600 text-[11px]">Accede a este manual con vista expandida permanente.</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#121214] bg-[#EBE7DF] px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-neutral-600 hidden sm:inline">
            SynDex OS · Sistema de Enfoque Fundador
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border-2 border-black bg-neutral-900 text-white px-4 py-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-neutral-800"
          >
            Entendido, ¡a trabajar!
          </button>
        </div>
      </div>
    </div>
  );
}
