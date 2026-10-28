'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface MobileControlsProps {
  onButton: (button: string, isDown: boolean) => void;
  activeKeys: Set<string>;
}

function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8);
  }
}

function ActionButton({
  action,
  label,
  onButton,
  active,
  variant = 'primary',
  className,
}: {
  action: string;
  label: string;
  onButton: (button: string, isDown: boolean) => void;
  active: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const press = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onButton(action, true);
    haptic();
  };

  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onButton(action, false);
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      className={clsx(
        'flex h-[62px] w-[62px] touch-none select-none items-center justify-center rounded-full text-lg font-semibold transition-transform duration-75',
        variant === 'primary'
          ? 'border border-[#C05A34] bg-[#D97043] text-white shadow-[0_5px_0_0_#B4542F]'
          : 'border border-[#4C6B53] bg-[#5A7D62] text-white shadow-[0_5px_0_0_#46634D]',
        active ? 'translate-y-[3px] shadow-none' : 'active:translate-y-[3px] active:shadow-none',
        className
      )}
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </button>
  );
}

function PillButton({
  action,
  label,
  onButton,
  active,
}: {
  action: string;
  label: string;
  onButton: (button: string, isDown: boolean) => void;
  active: boolean;
}) {
  const press = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onButton(action, true);
    haptic();
  };

  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onButton(action, false);
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      className={clsx(
        'h-9 w-[58px] touch-none select-none rounded-full border text-[8px] font-bold tracking-wider transition-transform duration-75',
        active
          ? 'translate-y-[2px] border-[#C8C2B6] bg-[#E4DED2] text-[#1F1E1B]'
          : 'border-[#D5D1C5] bg-white text-[#5E5C56] shadow-[0_2px_0_0_#D5D1C5]'
      )}
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </button>
  );
}

function Dpad({
  onButton,
  activeKeys,
}: {
  onButton: (button: string, isDown: boolean) => void;
  activeKeys: Set<string>;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const pressedRef = useRef<Set<string>>(new Set());
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const releaseAll = () => {
    pressedRef.current.forEach((direction) => onButton(direction, false));
    pressedRef.current = new Set();
    setKnob({ x: 0, y: 0 });
  };

  const updateFromPointer = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 26;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setKnob({ x: dx, y: dy });

    const threshold = rect.width * 0.13;
    const next = new Set<string>();
    if (dx < -threshold) next.add('Left');
    if (dx > threshold) next.add('Right');
    if (dy < -threshold) next.add('Up');
    if (dy > threshold) next.add('Down');

    pressedRef.current.forEach((direction) => {
      if (!next.has(direction)) onButton(direction, false);
    });
    next.forEach((direction) => {
      if (!pressedRef.current.has(direction)) onButton(direction, true);
    });
    pressedRef.current = next;
  };

  const press = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
    haptic();
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    updateFromPointer(event.clientX, event.clientY);
  };

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    releaseAll();
  };

  return (
    <div
      ref={padRef}
      role="group"
      aria-label="D-pad"
      onPointerDown={press}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      className="relative flex h-[128px] w-[128px] touch-none select-none items-center justify-center rounded-full border border-[#E0DBD0] bg-[#F2EFE9] shadow-inner"
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-2 -ml-[1px] h-[34px] w-[2px] rounded bg-[#D5D1C5]"
      />
      <span
        aria-hidden
        className="absolute bottom-2 left-1/2 -ml-[1px] h-[34px] w-[2px] rounded bg-[#D5D1C5]"
      />
      <span
        aria-hidden
        className="absolute left-2 top-1/2 -mt-[1px] h-[2px] w-[34px] rounded bg-[#D5D1C5]"
      />
      <span
        aria-hidden
        className="absolute right-2 top-1/2 -mt-[1px] h-[2px] w-[34px] rounded bg-[#D5D1C5]"
      />

      <ChevronUp
        className={clsx('absolute top-2 h-4 w-4', activeKeys.has('Up') ? 'text-[#D97043]' : 'text-[#8A877E]')}
      />
      <ChevronDown
        className={clsx('absolute bottom-2 h-4 w-4', activeKeys.has('Down') ? 'text-[#D97043]' : 'text-[#8A877E]')}
      />
      <ChevronLeft
        className={clsx('absolute left-2 h-4 w-4', activeKeys.has('Left') ? 'text-[#D97043]' : 'text-[#8A877E]')}
      />
      <ChevronRight
        className={clsx('absolute right-2 h-4 w-4', activeKeys.has('Right') ? 'text-[#D97043]' : 'text-[#8A877E]')}
      />

      <div
        className="pointer-events-none absolute flex h-12 w-12 items-center justify-center rounded-full border border-[#D5D1C5] bg-white shadow-[0_3px_8px_rgba(31,30,27,0.12)] transition-transform duration-75"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      >
        <span className="h-2 w-2 rounded-full bg-[#D97043]/70" />
      </div>
    </div>
  );
}

export function MobileControls({ onButton, activeKeys }: MobileControlsProps) {
  return (
    <div
      className="shrink-0 select-none touch-none border-t border-[#E8E5DD] bg-[#FAF9F5] px-2 pt-2.5 lg:hidden landscape:pointer-events-none landscape:absolute landscape:inset-0 landscape:z-20 landscape:border-0 landscape:bg-transparent landscape:p-0"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mb-3 flex items-center justify-between landscape:pointer-events-auto landscape:absolute landscape:inset-x-3 landscape:top-16 landscape:z-20 landscape:mb-0 landscape:opacity-95">
        <PillButton action="L" label="L" onButton={onButton} active={activeKeys.has('L')} />
        <span className="hq-mono text-[9px] uppercase tracking-widest text-[#8A877E]">
          Controles táctiles
        </span>
        <PillButton action="R" label="R" onButton={onButton} active={activeKeys.has('R')} />
      </div>

      <div className="flex items-end justify-between gap-2 landscape:pointer-events-auto landscape:absolute landscape:inset-x-3 landscape:bottom-3 landscape:z-20 landscape:opacity-95">
        <Dpad onButton={onButton} activeKeys={activeKeys} />

        <div className="flex flex-col items-center gap-2 pb-1">
          <PillButton action="Start" label="START" onButton={onButton} active={activeKeys.has('Start')} />
          <PillButton action="Select" label="SELECT" onButton={onButton} active={activeKeys.has('Select')} />
        </div>

        <div className="flex -rotate-12 items-center gap-2.5 pb-1">
          <ActionButton
            action="B"
            label="B"
            onButton={onButton}
            active={activeKeys.has('B')}
            variant="secondary"
            className="mt-7"
          />
          <ActionButton
            action="A"
            label="A"
            onButton={onButton}
            active={activeKeys.has('A')}
            className="-mt-1"
          />
        </div>
      </div>
    </div>
  );
}
