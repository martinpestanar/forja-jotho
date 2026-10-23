'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const GbaConsoleWorker = dynamic(
  () => import('@/components/gba/GbaConsoleWorker').then((mod) => mod.GbaConsoleWorker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121214] border-4 border-black text-[#F59E0B] font-mono text-xs p-4 rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <span className="animate-pulse">⚡ INICIANDO NÚCLEO mGBA...</span>
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
