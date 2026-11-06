'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const GbaConsoleWorker = dynamic(
  () => import('@/components/gba/GbaConsoleWorker').then((mod) => mod.GbaConsoleWorker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center bg-[#FAF9F5] border border-[#E4E1D8] text-[#1C1B18] font-mono text-xs p-6 rounded-2xl shadow-[0_2px_8px_rgba(26,25,21,0.04)] select-none">
        <div className="w-10 h-10 rounded-xl bg-[#2D68C4]/10 border border-[#2D68C4]/20 text-[#2D68C4] flex items-center justify-center mb-2.5">
          <span className="text-base animate-pulse">⚡</span>
        </div>
        <span className="font-bold tracking-wider uppercase text-[11px] text-[#1C1B18]">Iniciando Núcleo mGBA</span>
        <span className="text-[10px] text-[#706E66] mt-0.5">Sintonizando cartucho WebAssembly...</span>
      </div>
    ),
  }
);

/**
 * Panel contenedor del emulador GBA en la columna izquierda del layout Desktop-First.
 * Este componente NUNCA se desmonta del DOM al cambiar de pestaña central,
 * garantizando que el Web Worker con OffscreenCanvas, el audio y los 60 FPS
 * se mantengan intactos e independientes del hilo principal de React.
 */
interface GbaPanelProps {
  standaloneScreen?: boolean;
}

export const GbaPanel: React.FC<GbaPanelProps> = ({ standaloneScreen = false }) => {
  return (
    <div className="w-full h-full">
      <GbaConsoleWorker standaloneScreen={standaloneScreen} />
    </div>
  );
};
