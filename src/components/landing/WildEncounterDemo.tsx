'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Timer, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Database, 
  Swords, 
  MessageCircle, 
  ArrowRight, 
  RefreshCw,
  Trophy,
  AlertTriangle
} from 'lucide-react';

interface BlockItem {
  id: string;
  order: number;
  label: string;
  desc: string;
  iconName: 'event' | 'db' | 'attack';
  color: string;
}

const AVAILABLE_BLOCKS: BlockItem[] = [
  {
    id: 'block-attack',
    order: 3,
    label: '3. Lanzar Ataque Cyber-Llamarada',
    desc: 'Ejecuta el pipeline ofensivo en el servidor del rival',
    iconName: 'attack',
    color: 'from-amber-600 to-rose-600 border-amber-500/60 text-amber-300'
  },
  {
    id: 'block-event',
    order: 1,
    label: '1. Evento de Botón (Click Handler)',
    desc: 'Captura la pulsación del entrenador y valida la señal',
    iconName: 'event',
    color: 'from-cyan-600 to-blue-600 border-cyan-500/60 text-cyan-300'
  },
  {
    id: 'block-db',
    order: 2,
    label: '2. Guardar en Base de Datos (Supabase)',
    desc: 'Persiste el estado en tiempo real con seguridad RLS',
    iconName: 'db',
    color: 'from-emerald-600 to-teal-600 border-emerald-500/60 text-emerald-300'
  }
];

export const WildEncounterDemo: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [availableBlocks, setAvailableBlocks] = useState<BlockItem[]>(AVAILABLE_BLOCKS);
  const [slottedBlocks, setSlottedBlocks] = useState<(BlockItem | null)[]>([null, null, null]);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [circuitError, setCircuitError] = useState<string | null>(null);

  // Temporizador de 180 segundos (3 minutos)
  useEffect(() => {
    if (!isRunning || timeLeft <= 0 || isVictory) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isVictory]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Asignar bloque al primer slot libre o al hacer click
  const handleSelectBlock = (block: BlockItem) => {
    if (isVictory) return;
    const emptyIndex = slottedBlocks.findIndex((b) => b === null);
    if (emptyIndex === -1) return;

    const newSlotted = [...slottedBlocks];
    newSlotted[emptyIndex] = block;
    setSlottedBlocks(newSlotted);
    setAvailableBlocks((prev) => prev.filter((b) => b.id !== block.id));
    setCircuitError(null);
  };

  // Quitar bloque del slot
  const handleRemoveFromSlot = (index: number) => {
    if (isVictory) return;
    const block = slottedBlocks[index];
    if (!block) return;

    const newSlotted = [...slottedBlocks];
    newSlotted[index] = null;
    setSlottedBlocks(newSlotted);
    setAvailableBlocks((prev) => [...prev, block]);
    setCircuitError(null);
  };

  // Verificar circuito
  const handleVerifyCircuit = () => {
    if (slottedBlocks.some((b) => b === null)) {
      setCircuitError('Debes colocar los 3 bloques en los terminales del circuito.');
      return;
    }

    const isCorrect = 
      slottedBlocks[0]?.order === 1 &&
      slottedBlocks[1]?.order === 2 &&
      slottedBlocks[2]?.order === 3;

    if (isCorrect) {
      setIsVictory(true);
      setIsRunning(false);
      setCircuitError(null);
    } else {
      setCircuitError('¡Secuencia inestable! El orden lógico es: Evento -> Base de Datos -> Ataque.');
    }
  };

  const handleReset = () => {
    setTimeLeft(180);
    setIsRunning(true);
    setAvailableBlocks(AVAILABLE_BLOCKS);
    setSlottedBlocks([null, null, null]);
    setIsVictory(false);
    setCircuitError(null);
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '51999999999';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hola!%20Venci%20el%20reto%20de%20Codigo%20Silver%20y%20quiero%20inscribirme%20al%20Basico%201`;

  const renderIcon = (type: BlockItem['iconName']) => {
    switch (type) {
      case 'event': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'db': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'attack': return <Flame className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="w-full bg-[#0c1220] border-2 border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden font-mono text-slate-100">
      {/* Header del Reto con Temporizador */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-400">
            <Swords className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wide">
              Circuito de Batalla: Hackea al Rival
            </h3>
            <p className="text-[11px] text-slate-400">
              Conecta los 3 bloques lógicos en el orden exacto para disparar la sobrecarga.
            </p>
          </div>
        </div>

        {/* Temporizador */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm shadow-inner ${
          timeLeft <= 30 
            ? 'bg-rose-950/60 border-rose-500 text-rose-400 animate-pulse' 
            : 'bg-slate-900 border-amber-500/40 text-amber-300'
        }`}>
          <Timer className="w-4 h-4 text-amber-400" />
          <span>{formatTime(timeLeft)}</span>
          <span className="text-[10px] text-slate-500">RESTANTE</span>
        </div>
      </div>

      {!isVictory ? (
        <div className="mt-5 space-y-6">
          {/* Circuito Ranurado (Slots 1, 2, 3) */}
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Terminales del Circuito de Ataque:</span>
              <span className="text-[10px] text-amber-400/80">Haz click en un bloque para insertarlo/removerlo</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[0, 1, 2].map((idx) => {
                const item = slottedBlocks[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => handleRemoveFromSlot(idx)}
                    className={`min-h-[90px] rounded-xl border-2 border-dashed p-3 flex flex-col justify-between transition-all cursor-pointer ${
                      item
                        ? `bg-slate-900/90 border-slate-600 hover:border-rose-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 items-center justify-center text-center'
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-amber-400">
                            Terminal #{idx + 1}
                          </span>
                          {renderIcon(item.iconName)}
                        </div>
                        <div className="font-bold text-xs text-slate-200 mt-1">{item.label}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.desc}</div>
                      </>
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center">
                        <span className="text-xs font-bold font-mono">Terminal #{idx + 1}</span>
                        <span className="text-[10px] text-slate-500">Vacío (Click en bloque abajo)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloques Disponibles para Seleccionar */}
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              Bloques Disponibles en Memoria:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block)}
                  className={`p-3 rounded-xl border text-left bg-gradient-to-r ${block.color} bg-opacity-10 hover:scale-[1.02] transition-transform cursor-pointer shadow-md`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {renderIcon(block.iconName)}
                    <span className="text-xs font-black">{block.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 opacity-90">{block.desc}</p>
                </button>
              ))}

              {availableBlocks.length === 0 && (
                <div className="sm:col-span-3 text-center py-2 text-xs text-slate-500 italic">
                  Todos los bloques han sido insertados. ¡Verifica el circuito!
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de error o feedback */}
          {circuitError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{circuitError}</span>
            </div>
          )}

          {/* Botón de Ejecutar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Reto</span>
            </button>

            <button
              onClick={handleVerifyCircuit}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Cerrar Circuito y Atacar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Estado de Victoria / Pase de Aspirante */
        <div className="mt-5 space-y-6 animate-fade-in text-center">
          <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <div className="w-12 h-12 mx-auto mb-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-emerald-300 uppercase tracking-wider">
              ¡Circuito Reparado! Sobrecarga Crítica Exitosa
            </h4>
            <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1">
              Código Silver no pudo contener tu flujo de lógica. Has demostrado la chispa de un verdadero desarrollador Cyber-Johto.
            </p>
          </div>

          {/* Tarjeta del Pase de Aspirante */}
          <div className="max-w-md mx-auto bg-gradient-to-b from-[#131d33] to-[#0c1424] border-2 border-amber-500/80 rounded-2xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.25)] text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest">
                  Pase de Aspirante Oficial
                </span>
              </div>
              <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded font-bold">
                BECA ACTIVA
              </span>
            </div>

            <div className="py-4 space-y-2">
              <div className="text-[11px] text-slate-400">CÓDIGO DE BECA GENERADO:</div>
              <div className="p-3 bg-black/60 rounded-xl border border-slate-700 font-mono text-center text-base sm:text-lg font-black tracking-widest text-amber-400 select-all">
                SILVER-HACK-JOHTO-2026
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Válido para ingreso prioritario al módulo intensivo <strong className="text-slate-200">Básico 1</strong> de la Academia.
              </p>
            </div>

            {/* Botón WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Canjear Beca por WhatsApp</span>
            </a>
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
          >
            Volver a intentar el circuito
          </button>
        </div>
      )}
    </div>
  );
};
