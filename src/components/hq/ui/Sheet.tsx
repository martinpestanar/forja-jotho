'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { X } from 'lucide-react';

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute inset-0 bg-[#1F1E1B]/35 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 32, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={clsx(
              'hq-scroll relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-[#E8E5DD] bg-[#FAF9F5] shadow-2xl sm:max-w-lg sm:rounded-3xl',
              className
            )}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E8E5DD] bg-[#FAF9F5]/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="hq-title text-lg text-[#1F1E1B]">{title}</h2>
                {description && (
                  <p className="mt-1 text-xs leading-relaxed text-[#5E5C56]">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hq-focus rounded-lg border border-[#E8E5DD] bg-white p-1.5 text-[#5E5C56] transition-colors hover:bg-[#F2EFE9]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer && (
              <div className="sticky bottom-0 border-t border-[#E8E5DD] bg-[#FAF9F5]/95 px-5 py-3 backdrop-blur">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
