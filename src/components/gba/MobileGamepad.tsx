'use client';

import React, { useRef, useCallback, useState } from 'react';
import { triggerGbaButton, GbaButtonName } from '@/lib/gba/virtualGamepad';

interface MobileGamepadProps {
  isLight?: boolean;
}

export const MobileGamepad: React.FC<MobileGamepadProps> = ({ isLight = false }) => {
  const [activeDirections, setActiveDirections] = useState<Set<string>>(new Set());
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  const dpadRef = useRef<HTMLDivElement>(null);

  // Manejo del D-Pad Táctil Analógico / Digital con Detección de Posición
  const updateDpadFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!dpadRef.current) return;
      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Zona muerta central de 12px
      if (distance < 12) {
        ['Up', 'Down', 'Left', 'Right'].forEach((dir) => {
          if (activeDirections.has(dir)) {
            triggerGbaButton(dir as GbaButtonName, false, false);
          }
        });
        setActiveDirections(new Set());
        return;
      }

      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // -180 a 180
      const newDirs = new Set<string>();

      // Determinar cuadrantes con soporte diagonal
      if (angle >= -157.5 && angle <= -22.5) newDirs.add('Up');
      if (angle >= 22.5 && angle <= 157.5) newDirs.add('Down');
      if (angle >= 112.5 || angle <= -112.5) newDirs.add('Left');
      if (angle >= -67.5 && angle <= 67.5) newDirs.add('Right');

      ['Up', 'Down', 'Left', 'Right'].forEach((dir) => {
        if (activeDirections.has(dir) && !newDirs.has(dir)) {
          triggerGbaButton(dir as GbaButtonName, false, false);
        }
      });

      newDirs.forEach((dir) => {
        if (!activeDirections.has(dir)) {
          triggerGbaButton(dir as GbaButtonName, true, true);
        }
      });

      setActiveDirections(newDirs);
    },
    [activeDirections]
  );

  const handleDpadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateDpadFromTouch(e.clientX, e.clientY);
  };

  const handleDpadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.buttons === 1 || e.pointerType === 'touch') {
      updateDpadFromTouch(e.clientX, e.clientY);
    }
  };

  const handleDpadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    ['Up', 'Down', 'Left', 'Right'].forEach((dir) => {
      if (activeDirections.has(dir)) {
        triggerGbaButton(dir as GbaButtonName, false, false);
      }
    });
    setActiveDirections(new Set());
  };

  // Manejo de botones de acción individuales
  const handleButtonPress = (btn: GbaButtonName) => {
    setActiveActions((prev) => new Set(prev).add(btn));
    triggerGbaButton(btn, true, true);
  };

  const handleButtonRelease = (btn: GbaButtonName) => {
    setActiveActions((prev) => {
      const next = new Set(prev);
      next.delete(btn);
      return next;
    });
    triggerGbaButton(btn, false, false);
  };

  return (
    <div className="w-full flex flex-col justify-end select-none touch-none px-4 pt-1 pb-2">
      {/* Zona Principal: D-Pad a la izquierda (con gatillo L) y Botones A/B a la derecha (con gatillo R) */}
      <div className="w-full flex items-center justify-between">
        {/* Columna Izquierda: Gatillo L + D-Pad */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleButtonPress('L');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleButtonRelease('L');
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleButtonRelease('L');
            }}
            className={`w-28 h-7 rounded-lg font-mono font-black text-[11px] flex items-center justify-center transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-300 text-slate-900 border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5'
                : 'bg-slate-800 text-emerald-400 border border-slate-700 active:translate-y-0.5'
            } ${activeActions.has('L') ? 'scale-95 brightness-90' : ''}`}
          >
            [ L ]
          </button>

          {/* D-Pad Nintendo */}
          <div
            ref={dpadRef}
            onPointerDown={handleDpadPointerDown}
            onPointerMove={handleDpadPointerMove}
            onPointerUp={handleDpadPointerUp}
            onPointerCancel={handleDpadPointerUp}
            className={`w-32 h-32 relative rounded-full flex items-center justify-center touch-none cursor-pointer ${
              isLight ? 'bg-slate-300/40' : 'bg-slate-800/30'
            }`}
          >
            {/* Brazo Vertical */}
            <div
              className={`w-10 h-28 absolute rounded-xl flex flex-col justify-between items-center py-1 transition-all ${
                isLight
                  ? 'bg-slate-800 text-slate-100 border-2 border-black shadow-[2px_2px_0_#000]'
                  : 'bg-slate-900 text-slate-200 border border-slate-700 shadow-md'
              }`}
            >
              <span
                className={`text-[11px] font-black transition-transform ${
                  activeDirections.has('Up') ? 'text-amber-400 scale-125' : ''
                }`}
              >
                ▲
              </span>
              <span
                className={`text-[11px] font-black transition-transform ${
                  activeDirections.has('Down') ? 'text-amber-400 scale-125' : ''
                }`}
              >
                ▼
              </span>
            </div>

            {/* Brazo Horizontal */}
            <div
              className={`w-28 h-10 absolute rounded-xl flex justify-between items-center px-1 transition-all ${
                isLight
                  ? 'bg-slate-800 text-slate-100 border-2 border-black shadow-[2px_2px_0_#000]'
                  : 'bg-slate-900 text-slate-200 border border-slate-700 shadow-md'
              }`}
            >
              <span
                className={`text-[11px] font-black transition-transform ${
                  activeDirections.has('Left') ? 'text-amber-400 scale-125' : ''
                }`}
              >
                ◀
              </span>
              <span
                className={`text-[11px] font-black transition-transform ${
                  activeDirections.has('Right') ? 'text-amber-400 scale-125' : ''
                }`}
              >
                ▶
              </span>
            </div>

            {/* Círculo Central */}
            <div
              className={`w-5 h-5 rounded-full z-10 pointer-events-none ${
                isLight ? 'bg-slate-700' : 'bg-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Centro Inferior: SELECT y START */}
        <div className="flex flex-col items-center justify-end gap-2.5 pb-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleButtonPress('Select');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleButtonRelease('Select');
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleButtonRelease('Select');
            }}
            className={`w-14 h-4.5 -rotate-12 rounded-full font-mono text-[9px] font-black transition-all flex items-center justify-center cursor-pointer ${
              isLight
                ? 'bg-slate-400 text-slate-900 border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            } ${activeActions.has('Select') ? 'scale-90 brightness-90' : ''}`}
          >
            SELECT
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleButtonPress('Start');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleButtonRelease('Start');
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleButtonRelease('Start');
            }}
            className={`w-14 h-4.5 -rotate-12 rounded-full font-mono text-[9px] font-black transition-all flex items-center justify-center cursor-pointer ${
              isLight
                ? 'bg-slate-400 text-slate-900 border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            } ${activeActions.has('Start') ? 'scale-90 brightness-90' : ''}`}
          >
            START
          </button>
        </div>

        {/* Columna Derecha: Gatillo R + Botones A/B */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleButtonPress('R');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleButtonRelease('R');
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleButtonRelease('R');
            }}
            className={`w-28 h-7 rounded-lg font-mono font-black text-[11px] flex items-center justify-center transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-300 text-slate-900 border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5'
                : 'bg-slate-800 text-emerald-400 border border-slate-700 active:translate-y-0.5'
            } ${activeActions.has('R') ? 'scale-95 brightness-90' : ''}`}
          >
            [ R ]
          </button>

          {/* Botonera de Acción A y B */}
          <div className="flex items-center gap-3 -rotate-12 h-32 items-center">
            {/* Botón B */}
            <div className="flex flex-col items-center">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPress('B');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('B');
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  handleButtonRelease('B');
                }}
                className={`w-13 h-13 rounded-full font-black font-mono text-sm flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#E60012] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                    : 'bg-[#E60012] text-white border border-rose-400 shadow-[0_0_12px_rgba(230,0,18,0.4)] active:scale-95'
                } ${activeActions.has('B') ? 'scale-90 brightness-90' : ''}`}
              >
                B
              </button>
              <span className="text-[9px] font-mono font-bold mt-0.5 text-slate-400">CORRER</span>
            </div>

            {/* Botón A */}
            <div className="flex flex-col items-center -mt-5">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPress('A');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('A');
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  handleButtonRelease('A');
                }}
                className={`w-13 h-13 rounded-full font-black font-mono text-sm flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#E60012] text-white border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                    : 'bg-[#E60012] text-white border border-rose-400 shadow-[0_0_12px_rgba(230,0,18,0.4)] active:scale-95'
                } ${activeActions.has('A') ? 'scale-90 brightness-90' : ''}`}
              >
                A
              </button>
              <span className="text-[9px] font-mono font-bold mt-0.5 text-slate-400">HABLAR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
