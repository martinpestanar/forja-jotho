'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export type NoticeType = 'error' | 'warning' | 'info' | 'success';

interface NintendoNoticeModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: NoticeType;
  onClose: () => void;
}

export const NintendoNoticeModal: React.FC<NintendoNoticeModalProps> = ({
  isOpen,
  title,
  message,
  type = 'error',
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    onClose();
  };

  const typeConfig = {
    error: {
      bgHeader: 'bg-[#D9383A]/10 text-[#D9383A] border-[#D9383A]/20',
      btnBg: 'bg-[#D9383A] text-white shadow-[0_2px_0px_#B32628] hover:bg-[#C92F31]',
      icon: AlertTriangle,
      defaultTitle: 'Aviso del Sistema',
    },
    warning: {
      bgHeader: 'bg-[#C59B46]/10 text-[#9A7025] border-[#C59B46]/25',
      btnBg: 'bg-[#C59B46] text-white shadow-[0_2px_0px_#A07828] hover:bg-[#B78E3C]',
      icon: AlertTriangle,
      defaultTitle: 'Atención Entrenador',
    },
    info: {
      bgHeader: 'bg-[#2D68C4]/10 text-[#2D68C4] border-[#2D68C4]/20',
      btnBg: 'bg-[#2D68C4] text-white shadow-[0_2px_0px_#23529B] hover:bg-[#255BB0]',
      icon: Info,
      defaultTitle: 'Mensaje Pokédex',
    },
    success: {
      bgHeader: 'bg-[#2E8555]/10 text-[#2E8555] border-[#2E8555]/20',
      btnBg: 'bg-[#2E8555] text-white shadow-[0_2px_0px_#246E46] hover:bg-[#27744A]',
      icon: CheckCircle2,
      defaultTitle: 'Conquista Lograda',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#1C1B18]/40 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="max-w-sm w-full bg-white rounded-2xl border border-[#E4E1D8] p-5 space-y-4 shadow-[0_12px_40px_rgba(26,25,21,0.12)] text-[#1C1B18]"
        >
          {/* Header Pop-up Minimalista */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E1D8]">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${typeConfig.bgHeader}`}>
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B18]">
                {title || typeConfig.defaultTitle}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg border border-[#E4E1D8] bg-[#FAF9F5] text-[#706E66] hover:text-[#1C1B18] hover:bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Caja de Diálogo */}
          <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] text-xs text-[#1C1B18] leading-relaxed font-mono">
            {message}
          </div>

          {/* Botón Táctil Refinado */}
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer active:translate-y-[1px] active:shadow-none transition-all ${typeConfig.btnBg}`}
          >
            Entendido
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
