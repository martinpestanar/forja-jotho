'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, X, Share } from 'lucide-react';
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
    localStorage.setItem('forja_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 bg-white border border-[#E8E5DD] rounded-2xl p-4 shadow-[0_12px_32px_rgba(0,0,0,0.1)] text-[#1F1E1B] font-sans"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97043]/10 border border-[#D97043]/20 flex items-center justify-center text-[#D97043] shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-editorial text-xs font-semibold text-[#1F1E1B] tracking-tight">
                Instalar Johto Solstice
              </h4>
              <p className="text-[11px] text-[#706E66]">
                Accede desde la pantalla de inicio como app nativa
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#8A877E] hover:text-[#1F1E1B] p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIos ? (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-[11px] text-[#5E5C56] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#D97043]">
              <Share className="w-3.5 h-3.5" />
              <span>En iPhone/Safari:</span>
            </div>
            <p>
              Toca el botón <strong>Compartir</strong> en la barra inferior y luego <strong>"Agregar a pantalla de inicio"</strong>.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDismiss}
              className="w-1/3 py-2 rounded-xl border border-[#E8E5DD] hover:bg-[#F2EFE9] text-xs font-medium text-[#706E66] cursor-pointer transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="w-2/3 py-2 rounded-xl bg-[#D97043] hover:bg-[#CC6437] text-white text-xs font-semibold tracking-wide cursor-pointer shadow-sm transition-all active:scale-[0.98]"
            >
              Instalar App
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
