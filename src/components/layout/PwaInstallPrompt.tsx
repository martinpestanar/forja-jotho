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
        className="fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 bg-[#14171C] border-2 border-[#C5A059] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.9)] text-[#E2E8F0] font-sans"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-[#E2E8F0] tracking-wider">
                Instalar Forja Johto
              </h4>
              <p className="text-[11px] text-[#64748B]">
                Accede desde la pantalla de inicio como app nativa
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#64748B] hover:text-[#E2E8F0] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIos ? (
          <div className="mt-3 p-2.5 rounded-xl bg-[#0B0C0E] border border-white/5 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
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
              className="w-1/3 py-2 rounded-xl border border-white/10 text-xs font-bold text-[#64748B] cursor-pointer"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="w-2/3 py-2 rounded-xl bg-[#C5A059] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer border border-black shadow-[0_2px_0_0_#000] active:translate-y-0.5"
            >
              Instalar App
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
