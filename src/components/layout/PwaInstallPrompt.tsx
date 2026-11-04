'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, X, Share, Gamepad2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Detección de iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      const dismissed = localStorage.getItem('forja_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    // 2. Evento nativo para Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('forja_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    soundFx.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        soundFx.playLevelUp();
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    soundFx.playClick();
    localStorage.setItem('forja_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 bg-[#FFFFFF] border-2 border-[#1A1915] rounded-2xl p-4 shadow-[4px_4px_0px_0px_#1A1915] text-[#1A1915] font-sans select-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E60012] border-2 border-[#1A1915] shadow-[1.5px_1.5px_0px_0px_#1A1915] flex items-center justify-center text-white shrink-0">
              <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-[#1A1915] tracking-tight uppercase">
                  Instalar SynDex
                </h4>
                <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-[#E60012]/10 text-[#E60012] border border-[#E60012]/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[#706E66] font-medium leading-tight mt-0.5">
                Modo pantalla completa tipo consola portátil Game Boy
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#706E66] hover:text-[#1A1915] p-1 rounded-lg hover:bg-[#F2EFE9] border border-transparent hover:border-[#1A1915] cursor-pointer transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {isIos ? (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FAF9F5] border-2 border-[#1A1915] text-[11px] text-[#1A1915] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#E60012]">
              <Share className="w-3.5 h-3.5" />
              <span>En iPhone (Safari):</span>
            </div>
            <p className="text-[10px] text-[#706E66]">
              Toca el botón <span className="font-bold text-[#1A1915]">Compartir</span> y selecciona <span className="font-bold text-[#1A1915]">"Añadir a pantalla de inicio"</span>.
            </p>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-bold text-[#706E66] bg-[#F2EFE9] border-2 border-[#1A1915] shadow-[2px_2px_0px_0px_#1A1915] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider text-white bg-[#E60012] hover:bg-[#cc0010] border-2 border-[#1A1915] shadow-[2px_2px_0px_0px_#1A1915] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar App</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
