'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TurnBar } from './TurnBar';
import { BottomDock } from './BottomDock';
import { RightRail } from './RightRail';
import { CommandPalette } from './CommandPalette';
import { CheckInSheet, type CheckInPayload } from '@/components/hq/ui/CheckInSheet';
import { CheckOutSheet } from '@/components/hq/ui/CheckOutSheet';
import { RPGDialog } from '@/components/hq/ui/RPGDialog';
import { HQ_ROLES, type RoleKey } from '@/lib/hqRoles';
import { getScheduleState, isOperativeBlockRole } from '@/lib/hqSchedule';
import { useHqStore } from '@/store/useHqStore';
import { useAcademyStore } from '@/store/useAcademyStore';
import { useHqTasksStore } from '@/store/useHqTasksStore';
import { useDiaCeroStore } from '@/store/useDiaCeroStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [dialogRole, setDialogRole] = useState<RoleKey>('ceo');

  const focusMode = useHqStore((state) => state.focusMode);
  const toggleFocusMode = useHqStore((state) => state.toggleFocusMode);
  const startSession = useHqStore((state) => state.startSession);
  const startNow = useHqStore((state) => state.startNow);
  const activeSession = useHqStore((state) => state.activeSession);

  useEffect(() => {
    useHqStore.persist.rehydrate();
    useAcademyStore.persist.rehydrate();
    useHqTasksStore.persist.rehydrate();
    useDiaCeroStore.persist.rehydrate();
    const timer = window.setTimeout(() => {
      useHqStore.getState().ensureDailyBase();
    }, 60);
    return () => window.clearTimeout(timer);
  }, []);

  const activeRole = activeSession?.role ?? null;
  const accent = activeRole ? HQ_ROLES[activeRole].accent : 'var(--hq-ceo)';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (!typing && !event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggleFocusMode]);

  const showStartDialog = (role: RoleKey) => {
    setDialogRole(role);
    setDialogLines([
      `Turno ${HQ_ROLES[role].label} iniciado.`,
      'Un solo rol, una sola dirección. El HQ ya tiñó la interfaz con tu piel.',
    ]);
    setDialogOpen(true);
  };

  const quickStart = () => {
    const schedule = getScheduleState(new Date());
    if (schedule.current && !isOperativeBlockRole(schedule.current.role)) {
      setDialogRole('ceo');
      setDialogLines([
        'Este bloque no requiere rol.',
        'Si es ejercicio, ritual o descanso, márcalo directamente desde Hoy.',
      ]);
      setDialogOpen(true);
      return;
    }

    const role = startNow();
    showStartDialog(role);
  };

  const handleDetailedCheckIn = (payload: CheckInPayload) => {
    const schedule = getScheduleState(new Date());
    const block =
      schedule.current && schedule.current.role === payload.role ? schedule.current : null;

    startSession({
      role: payload.role,
      blockId: block?.id ?? 'manual',
      blockLabel: block?.label ?? 'Turno manual',
      focus: payload.focus,
      energy: payload.energy,
    });
    showStartDialog(payload.role);
  };

  const handlePaletteAction = (action: 'checkin' | 'checkout' | 'focus') => {
    if (action === 'checkin') quickStart();
    if (action === 'checkout') setCheckOutOpen(true);
    if (action === 'focus') toggleFocusMode();
  };

  const skin = useMemo(
    () => ({
      '--hq-accent': accent,
      '--hq-accent-soft': activeRole ? HQ_ROLES[activeRole].soft : 'var(--hq-ceo-soft)',
    }) as React.CSSProperties,
    [accent, activeRole]
  );

  return (
    <div className="hq-shell min-h-screen" style={skin}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            'radial-gradient(900px 320px at 50% -40%, color-mix(in srgb, var(--hq-accent) 14%, transparent), transparent 70%)',
        }}
      />

      <div className="flex">
        {!focusMode && <Sidebar />}
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-xl">
            <TopBar onOpenPalette={() => setPaletteOpen(true)} />
            <TurnBar
              onOpenCheckOut={() => setCheckOutOpen(true)}
              onOpenCheckInDetail={() => setCheckInOpen(true)}
              onStarted={showStartDialog}
              onToggleFocus={toggleFocusMode}
            />
          </div>

          <div className="mx-auto flex w-full max-w-[1500px] items-start gap-6 px-4 pb-28 pt-4 lg:px-6 lg:pb-8">
            <main className="hq-fade-up min-w-0 flex-1">{children}</main>
            {!focusMode && (
              <RightRail
                onCheckIn={() => setCheckInOpen(true)}
                onCheckOut={() => setCheckOutOpen(true)}
                className="hidden xl:flex"
              />
            )}
          </div>
        </div>
      </div>

      {focusMode && (
        <button
          type="button"
          onClick={toggleFocusMode}
          className="fixed bottom-20 right-4 z-50 hidden items-center gap-1.5 rounded-full border border-[#E8E5DD] bg-white px-3 py-2 text-[11px] font-medium text-[#5E5C56] shadow-lg transition-colors hover:text-[#1F1E1B] lg:flex"
        >
          <X className="h-3.5 w-3.5" />
          Salir de enfoque
        </button>
      )}

      <BottomDock />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={handlePaletteAction}
      />
      <CheckInSheet
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onConfirm={handleDetailedCheckIn}
      />
      <CheckOutSheet
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        onDone={(session, bonus, taskMinutes) => {
          setDialogRole(session.role);
          setDialogLines(
            bonus > 0
              ? [
                  'Tres roles completados. Día conquistado.',
                  `+${taskMinutes + bonus} min al banco: ${taskMinutes}m por tarea + ${bonus}m bonus.`,
                ]
              : [
                  `Turno ${HQ_ROLES[session.role].label} cerrado con ${session.minutes} min.`,
                  taskMinutes > 0
                    ? `+${taskMinutes}m añadidos al banco por la tarea cumplida.`
                    : 'El relevo quedó guardado para el siguiente rol.',
                ]
          );
          setDialogOpen(true);
        }}
      />
      <RPGDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`Check-In · ${HQ_ROLES[dialogRole].label}`}
        lines={dialogLines}
        accent={HQ_ROLES[dialogRole].accent}
      />
    </div>
  );
}
