'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { soundFx } from '@/lib/soundFx';

function DialogBody({
  lines,
  accent,
  onClose,
}: {
  lines: string[];
  accent: string;
  onClose: () => void;
}) {
  const fullText = lines.join(' ');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(fullText.slice(0, index));
      if (index % 3 === 0) soundFx.playDialogBeep();
      if (index >= fullText.length) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [fullText]);

  const isComplete = typed.length >= fullText.length;

  return (
    <div className="px-5 py-5">
      <p className="min-h-[4.5rem] text-sm leading-relaxed text-[#1F1E1B]">
        {typed}
        {!isComplete && <span className="hq-caret" />}
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="hq-btn hq-btn-primary"
          style={{ backgroundColor: accent }}
        >
          {isComplete ? 'Entendido' : 'Saltar'}
        </button>
      </div>
    </div>
  );
}

export function RPGDialog({
  open,
  title,
  lines,
  accent = 'var(--hq-ceo)',
  onClose,
}: {
  open: boolean;
  title: string;
  lines: string[];
  accent?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute inset-0 bg-[#1F1E1B]/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border-[3px] border-[#1F1E1B] bg-[#FAF9F5] shadow-[6px_6px_0_0_#1F1E1B]"
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 text-white"
              style={{ backgroundColor: accent }}
            >
              <span className="hq-mono text-[11px] font-bold uppercase tracking-widest">
                {title}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="hq-mono text-[11px] font-bold opacity-80 hover:opacity-100"
              >
                ESC
              </button>
            </div>
            <DialogBody lines={lines} accent={accent} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
