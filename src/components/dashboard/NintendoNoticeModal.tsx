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
    onClose();
  };

  const typeConfig = {
    error: {
      border: 'border-[#E60012]',
      bgHeader: 'bg-[#E60012]/15 text-[#E60012]',
      btnBg: 'bg-[#E60012] hover:bg-[#cc0010] text-white',
      icon: AlertTriangle,
      defaultTitle: 'Aviso de la Forja',
    },
    warning: {
      border: 'border-[#F59E0B]',
      bgHeader: 'bg-[#F59E0B]/15 text-[#F59E0B]',
      btnBg: 'bg-[#F59E0B] hover:bg-[#d97706] text-black',
      icon: AlertTriangle,
      defaultTitle: 'Advertencia',
    },
    info: {
      border: 'border-[#06B6D4]',
      bgHeader: 'bg-[#06B6D4]/15 text-[#06B6D4]',
      btnBg: 'bg-[#06B6D4] hover:bg-[#0891b2] text-black',
      icon: Info,
      defaultTitle: 'Oráculo',
    },
    success: {
      border: 'border-[#22C55E]',
      bgHeader: 'bg-[#22C55E]/15 text-[#22C55E]',
      btnBg: 'bg-[#22C55E] hover:bg-[#16a34a] text-black',
      icon: CheckCircle2,
      defaultTitle: '¡Conquista Lograda!',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`max-w-sm w-full bg-[#14171C] rounded-2xl border-2 ${typeConfig.border} p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.85)] text-[#E2E8F0] font-sans`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${typeConfig.bgHeader}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {title || typeConfig.defaultTitle}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-[#64748B] hover:text-[#E2E8F0] p-1 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dialog Box RPG Nintendo */}
          <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-white/5 text-xs text-[#CBD5E1] leading-relaxed font-mono">
            {message}
          </div>

          {/* Botón táctil */}
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border-2 border-black shadow-[0_3px_0_0_#000] active:translate-y-0.5 active:shadow-none ${typeConfig.btnBg}`}
          >
            Entendido
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
