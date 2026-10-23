'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el usuario está accediendo desde un dispositivo móvil o tablet pequeña.
 * Utiliza tanto el ancho de pantalla (< 768px) como la detección de capacidades táctiles
 * para evitar falsos positivos en ventanas redimensionadas de escritorio.
 */
export function useIsMobileDevice(breakpointPx: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

      const isNarrow = window.innerWidth < breakpointPx;

      setIsMobile(isNarrow && isTouch);
    };

    // Evaluación inicial
    checkMobile();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [breakpointPx]);

  return isMobile;
}
