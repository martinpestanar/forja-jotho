'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTrainerStore } from '@/store/useTrainerStore';
import { soundFx } from '@/lib/soundFx';
import { supabase } from '@/lib/supabase';
import { PokemonMemoryBridge, EmulatorInterface } from '@/lib/gba/PokemonMemoryBridge';
import { patchRomMartPrices } from '@/lib/gba/gbaSaveEngine';
import {
  Gamepad2,
  BatteryCharging,
  BatteryWarning,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Save,
  CheckCircle2,
  Cpu,
  RefreshCw,
  FolderOpen,
  Keyboard,
  RotateCcw,
  X,
  Sliders,
  Zap,
} from 'lucide-react';

const ROM_PATH_VFS = '/data/games/pokemonHnS.gba';
const SAV_PATH_VFS = '/data/saves/pokemonHnS.sav';
const SAV_BUCKET = 'gba-saves';

// Clave local para redundancia de partidas en el navegador del usuario
const LOCAL_SAV_KEY_PREFIX = 'syndex_gba_sav_';

function saveLocalBackup(slot: string, data: Uint8Array): void {
  if (typeof window === 'undefined') return;
  try {
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i += 8192) {
      binary += String.fromCharCode.apply(null, Array.from(data.subarray(i, Math.min(i + 8192, len))));
    }
    const b64 = btoa(binary);
    localStorage.setItem(`${LOCAL_SAV_KEY_PREFIX}${slot}`, b64);
    localStorage.setItem(`${LOCAL_SAV_KEY_PREFIX}time_${slot}`, new Date().toISOString());
  } catch (e) {
    console.warn('[GBA] Error en respaldo local:', e);
  }
}

function loadLocalBackup(slot: string): Uint8Array | null {
  if (typeof window === 'undefined') return null;
  try {
    const b64 = localStorage.getItem(`${LOCAL_SAV_KEY_PREFIX}${slot}`);
    if (!b64) return null;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.length >= 0x1C000 ? bytes : null;
  } catch (e) {
    console.warn('[GBA] Error cargando respaldo local:', e);
    return null;
  }
}

interface SaveSlotInfo {
  id: string;
  name: string;
  updatedAt: string;
  size: number;
}

// Configuración por defecto de controles (Game Boy Advance)
const DEFAULT_KEY_BINDINGS: Record<string, string> = {
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  A: 'KeyZ',
  B: 'KeyX',
  Start: 'Enter',
  Select: 'Space',
  L: 'KeyQ',
  R: 'KeyE',
};

const ACTION_LABELS: Record<string, string> = {
  Up: 'Mover Arriba (▲)',
  Down: 'Mover Abajo (▼)',
  Left: 'Mover Izquierda (◀)',
  Right: 'Mover Derecha (▶)',
  A: 'Botón A (Interacción / Hablar)',
  B: 'Botón B (Correr / Cancelar)',
  Start: 'Start (Menú Pokémon)',
  Select: 'Select (Bicicleta / Objeto)',
  L: 'Gatillo L',
  R: 'Gatillo R',
};

function formatKeyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code === 'Space') return 'Espacio';
  if (code === 'Enter') return 'Enter';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  return code;
}

interface GbaConsoleWorkerProps {
  standaloneScreen?: boolean;
}

export const GbaConsoleWorker: React.FC<GbaConsoleWorkerProps> = ({ standaloneScreen = false }) => {
  const profile = useTrainerStore((s) => s.profile);
  const theme = useTrainerStore((s) => s.theme);
  const consumeBatteryMinuteRpc = useTrainerStore((s) => s.consumeBatteryMinuteRpc);
  const updateProfile = useTrainerStore((s) => s.updateProfile);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moduleRef = useRef<any>(null);
  const bridgeRef = useRef<PokemonMemoryBridge | null>(null);
  const batteryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBootedRef = useRef<boolean>(false);
  // Abort flag para cancelar boot asíncrono durante cleanup de StrictMode
  const bootAbortRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  // Ref estable para currentSlot (evita que bootMgbaCore se recree al cambiar de slot)
  const currentSlotRef = useRef<string>('slot_1.sav');

  const [fps, setFps] = useState<number>(60);
  const [emuState, setEmuState] = useState<'idle' | 'loading' | 'running' | 'paused' | 'drained'>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<string | null>(null);
  const [romTitle, setRomTitle] = useState<string>('POKEMON H&S');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Gestor de Slots de Partidas Guardadas
  const [currentSlot, setCurrentSlotState] = useState<string>('slot_1.sav');
  const setCurrentSlot = useCallback((slot: string) => {
    setCurrentSlotState(slot);
    currentSlotRef.current = slot;
  }, []);
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<SaveSlotInfo[]>([]);
  const [bootCount, setBootCount] = useState<number>(0);
  const pendingSavBytesRef = useRef<Uint8Array | null>(null);

  // Reiniciar mGBA de manera limpia y determinista recreando el canvas con el SaveBlock inyectado
  const rebootEmulator = useCallback((freshSavBytes?: Uint8Array) => {
    if (freshSavBytes && freshSavBytes.length >= 0x1C000) {
      pendingSavBytesRef.current = freshSavBytes;
    }
    bootAbortRef.current.cancelled = true;
    if (moduleRef.current) {
      try {
        moduleRef.current.pauseMainLoop?.();
        moduleRef.current.pauseGame?.();
        moduleRef.current.quitGame?.();
        moduleRef.current.quitMgba?.();
      } catch {}
      moduleRef.current = null;
    }
    isBootedRef.current = false;
    setBootCount((prev) => prev + 1);
  }, []);

  // Gestor de Personalización de Teclas
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyBindings, setKeyBindings] = useState<Record<string, string>>(DEFAULT_KEY_BINDINGS);

  // Cargar configuración de teclas guardada en el cliente tras la hidratación
  useEffect(() => {
    try {
      const saved = localStorage.getItem('syndex_gba_keybindings');
      if (saved) {
        setKeyBindings(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const [rebindingAction, setRebindingAction] = useState<string | null>(null);

  // Escala de pantalla en móviles: 'fit' (relación 3:2 nativa GBA) o 'wide' (pantalla ancha sin bordes)
  const [screenScaleMode, setScreenScaleMode] = useState<'fit' | 'wide'>('wide');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('syndex_screen_scale_mode');
      if (savedMode === 'fit' || savedMode === 'wide') {
        setScreenScaleMode(savedMode);
      }
    } catch {}
  }, []);

  const toggleScreenScaleMode = () => {
    soundFx.playClick();
    setScreenScaleMode((prev) => {
      const next = prev === 'wide' ? 'fit' : 'wide';
      try {
        localStorage.setItem('syndex_screen_scale_mode', next);
      } catch {}
      return next;
    });
  };

  const batteryMinutes = profile?.battery_minutes ?? 42;
  const isDrained = batteryMinutes <= 0;
  const isLight = theme === 'light_gbc';
  const userId = profile?.id ?? 'guest-trainer-id';
  const userIdRef = useRef<string>(userId);

  useEffect(() => {
    userIdRef.current = userId;
    bridgeRef.current?.setUserId(userId);
  }, [userId]);

  const romUrl = process.env.NEXT_PUBLIC_ROM_URL || '/roms/pokemonHnS.gba';

  // Guardar configuración de teclas en LocalStorage
  const updateKeyBinding = (action: string, newCode: string) => {
    const updated = { ...keyBindings, [action]: newCode };
    setKeyBindings(updated);
    setRebindingAction(null);
    soundFx.playCoin();
    try {
      localStorage.setItem('syndex_gba_keybindings', JSON.stringify(updated));
    } catch {}
  };

  const resetKeyBindings = () => {
    soundFx.playClick();
    setKeyBindings(DEFAULT_KEY_BINDINGS);
    try {
      localStorage.setItem('syndex_gba_keybindings', JSON.stringify(DEFAULT_KEY_BINDINGS));
    } catch {}
  };

  // Adaptador para puente de memoria SRAM
  const createAdapter = useCallback((Module: any): EmulatorInterface => {
    return {
      readSaveFile: (): Uint8Array | null => {
        try {
          if (typeof Module.getSave === 'function') {
            const data = Module.getSave();
            if (data && data.length >= 0x1C000) return data;
          }
          if (Module.FS?.analyzePath(SAV_PATH_VFS).exists) {
            return Module.FS.readFile(SAV_PATH_VFS);
          }
          return null;
        } catch {
          return null;
        }
      },
      writeSaveFile: (data: Uint8Array): void => {
        try {
          Module.FS.writeFile(SAV_PATH_VFS, data);
          try {
            Module.FS.writeFile('/data/games/pokemonHnS.sav', data);
          } catch {}
          Module.FSSync?.();
        } catch (err) {
          console.error('[mGBA] Error guardando en VFS:', err);
        }
      },
      pause: (): void => {
        try {
          Module.pauseGame?.();
        } catch {}
      },
      resume: (): void => {
        try {
          Module.resumeGame?.();
        } catch {}
      },
    };
  }, []);

  // Presionar o soltar botón en mGBA
  const handleButton = useCallback((button: string, isDown: boolean) => {
    const mod = moduleRef.current;
    if (mod) {
      try {
        if (isDown) mod.buttonPress?.(button);
        else mod.buttonUnpress?.(button);
      } catch {}
    }

    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (isDown) next.add(button);
      else next.delete(button);
      return next;
    });
  }, []);

  // Listar partidas disponibles en Supabase Storage y LocalStorage
  const refreshSlotsList = useCallback(async () => {
    try {
      const currentUid = userIdRef.current;
      const { data, error } = await supabase.storage.from(SAV_BUCKET).list(currentUid);
      const slots: SaveSlotInfo[] = [];

      if (!error && data && data.length > 0) {
        data
          .filter((f) => f.name.endsWith('.sav'))
          .forEach((f) => {
            slots.push({
              id: f.name,
              name:
                f.name === 'slot_1.sav'
                  ? 'Slot 1 (Principal)'
                  : f.name === 'slot_2.sav'
                  ? 'Slot 2 (Secundario)'
                  : f.name === 'slot_3.sav'
                  ? 'Slot 3 (Reserva)'
                  : f.name.replace('.sav', ''),
              updatedAt: new Date(f.updated_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              size: f.metadata?.size || 131072,
            });
          });
      }

      // Complementar con partidas detectadas en respaldo local si no están en la lista
      ['slot_1.sav', 'slot_2.sav', 'slot_3.sav'].forEach((slotName) => {
        if (!slots.some((s) => s.id === slotName)) {
          const localTime = localStorage.getItem(`${LOCAL_SAV_KEY_PREFIX}time_${slotName}`);
          if (localTime) {
            slots.push({
              id: slotName,
              name:
                slotName === 'slot_1.sav'
                  ? 'Slot 1 (Local)'
                  : slotName === 'slot_2.sav'
                  ? 'Slot 2 (Local)'
                  : 'Slot 3 (Local)',
              updatedAt: new Date(localTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              size: 131072,
            });
          }
        }
      });

      setAvailableSlots(slots);
    } catch (err) {
      console.warn('[GBA] Error listando slots:', err);
    }
  }, []);

  // Manejador central de guardado automático (disparado por mGBA cuando el jugador guarda DENTRO del juego)
  const handleSaveDataUpdated = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) return;

    try {
      console.info('[mGBA] 💾 Evento saveDataUpdated detectado: persistiendo partida...');

      // 1. Extraer los bytes actualizados del .sav
      let savBytes: Uint8Array | null = null;
      try {
        if (typeof mod.getSave === 'function') {
          savBytes = mod.getSave();
        }
      } catch {}

      if (!savBytes || savBytes.length < 0x1C000) {
        try {
          if (mod.FS?.analyzePath(SAV_PATH_VFS).exists) {
            savBytes = mod.FS.readFile(SAV_PATH_VFS);
          }
        } catch {}
      }

      if (!savBytes || savBytes.length < 0x1C000) {
        console.warn('[mGBA] saveDataUpdated disparado pero los bytes de guardado son insuficientes.');
        return;
      }

      // 2. Sincronizar VFS con IndexedDB localmente
      try {
        await mod.FSSync?.();
      } catch (fsErr) {
        console.warn('[mGBA] FSSync warning:', fsErr);
      }

      // 3. Respaldo secundario local en LocalStorage
      const activeSlot = currentSlotRef.current;
      saveLocalBackup(activeSlot, savBytes);

      // 4. Subir a Supabase Storage (Nube)
      const currentUid = userIdRef.current;
      await supabase.storage.from(SAV_BUCKET).upload(`${currentUid}/${activeSlot}`, savBytes, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

      await supabase.storage.from(SAV_BUCKET).upload(`${currentUid}/savegame.sav`, savBytes, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

      // 5. Sincronizar equipo y dinero del cartucho al perfil Zustand y Supabase en tiempo real
      const liveData = bridgeRef.current?.readTrainerDataFromEmulator();
      if (liveData) {
        updateProfile({
          gba_party_json: liveData.party as any,
          pokedollars: liveData.money,
        });
      }

      // 6. Notificación visual estilo Nintendo + sonido retro
      soundFx.playCoin();
      setShowSaveSuccess(`💾 ¡Partida guardada en ${activeSlot.replace('.sav', '').toUpperCase()}!`);
      setTimeout(() => setShowSaveSuccess(null), 3000);
      refreshSlotsList();
    } catch (err) {
      console.error('[mGBA] Error en sincronización de guardado automático:', err);
    }
  }, [refreshSlotsList, updateProfile]);

  // Guardar partida en un slot específico (Guardado desde afuera)
  const saveToSlot = async (slotId: string) => {
    const mod = moduleRef.current;
    if (!mod || isSaving) return;

    setIsSaving(true);
    soundFx.playClick();

    try {
      // 1. Obtener bytes del save del core activo
      let savBytes: Uint8Array | null = null;
      try {
        if (typeof mod.getSave === 'function') {
          savBytes = mod.getSave();
        }
      } catch {}

      if (!savBytes || savBytes.length < 0x1C000) {
        try {
          if (mod.FS?.analyzePath(SAV_PATH_VFS).exists) {
            savBytes = mod.FS.readFile(SAV_PATH_VFS);
          }
        } catch {}
      }

      if (!savBytes || savBytes.length < 0x1C000) {
        if (bridgeRef.current) {
          savBytes = bridgeRef.current.readPartyFromEmulator() && mod.FS?.analyzePath(SAV_PATH_VFS).exists
            ? mod.FS.readFile(SAV_PATH_VFS)
            : null;
        }
      }

      if (savBytes && savBytes.length >= 0x1C000) {
        // Asegurar escritura en VFS
        try {
          mod.FS.writeFile(SAV_PATH_VFS, savBytes);
          mod.FS.writeFile(`/data/saves/${slotId}`, savBytes);
        } catch {}

        // Sincronizar con IndexedDB
        try {
          await mod.FSSync?.();
        } catch {}

        // Respaldo local en LocalStorage
        saveLocalBackup(slotId, savBytes);

        // Subir a la nube (Supabase)
        const currentUid = userIdRef.current;
        await supabase.storage.from(SAV_BUCKET).upload(`${currentUid}/${slotId}`, savBytes, {
          contentType: 'application/octet-stream',
          upsert: true,
        });

        await supabase.storage.from(SAV_BUCKET).upload(`${currentUid}/savegame.sav`, savBytes, {
          contentType: 'application/octet-stream',
          upsert: true,
        });

        setCurrentSlot(slotId);

        // Sincronizar equipo y dinero del cartucho a la web en tiempo real
        const liveData = bridgeRef.current?.readTrainerDataFromEmulator();
        if (liveData) {
          updateProfile({
            gba_party_json: liveData.party as any,
            pokedollars: liveData.money,
          });
        }

        setShowSaveSuccess(`💾 ¡Partida guardada en ${slotId.replace('.sav', '').toUpperCase()}!`);
        soundFx.playCoin();
        refreshSlotsList();

        setTimeout(() => setShowSaveSuccess(null), 2800);
      } else {
        // Si el usuario aún no ha guardado en el juego:
        soundFx.playDamage?.();
        setShowSaveSuccess('⚠️ Guarda dentro del juego con START → GUARDAR, o usa [⚡ Guardado Rápido].');
        setTimeout(() => setShowSaveSuccess(null), 3800);
      }
    } catch (err) {
      console.error('[GBA] Error guardando slot:', err);
      setShowSaveSuccess('⚠️ Error al respaldar partida.');
      setTimeout(() => setShowSaveSuccess(null), 2800);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardado Rápido Instantáneo (Save State de emulador desde afuera)
  const quickSaveState = async (slot = 1) => {
    const mod = moduleRef.current;
    if (!mod || emuState !== 'running') return;
    soundFx.playClick();

    try {
      const ok = mod.saveState?.(slot);
      if (ok) {
        try {
          await mod.FSSync?.();
        } catch {}
        soundFx.playCoin();
        setShowSaveSuccess(`⚡ ¡Guardado Rápido (Estado ${slot}) Exitoso!`);
        setTimeout(() => setShowSaveSuccess(null), 2800);
      } else {
        soundFx.playDamage?.();
        setShowSaveSuccess('⚠️ No se pudo guardar el estado.');
        setTimeout(() => setShowSaveSuccess(null), 2500);
      }
    } catch (err) {
      console.error('[GBA] Error en quickSaveState:', err);
    }
  };

  // Carga Rápida Instantánea (Load State de emulador desde afuera)
  const quickLoadState = (slot = 1) => {
    const mod = moduleRef.current;
    if (!mod) return;
    soundFx.playClick();

    try {
      const ok = mod.loadState?.(slot);
      if (ok) {
        soundFx.playCoin();
        setShowSaveSuccess(`⚡ ¡Estado Rápido ${slot} Restaurado!`);
        setTimeout(() => setShowSaveSuccess(null), 2800);
      } else {
        soundFx.playDamage?.();
        setShowSaveSuccess(`⚠️ Sin estado rápido previo en ranura ${slot}.`);
        setTimeout(() => setShowSaveSuccess(null), 2800);
      }
    } catch (err) {
      console.error('[GBA] Error en quickLoadState:', err);
    }
  };

  // Cargar una partida guardada específica
  const loadFromSlot = async (slotId: string) => {
    soundFx.playClick();
    setEmuState('loading');

    try {
      let bytes: Uint8Array | null = null;
      const currentUid = userIdRef.current;

      // 1. Intentar descargar desde Supabase Storage
      try {
        const storagePath = `${currentUid}/${slotId}`;
        const { data, error } = await supabase.storage.from(SAV_BUCKET).download(storagePath);
        if (!error && data) {
          bytes = new Uint8Array(await data.arrayBuffer());
        }
      } catch {}

      // 2. Si no está en Supabase, intentar respaldo local
      if (!bytes || bytes.length < 0x1C000) {
        bytes = loadLocalBackup(slotId);
      }

      // 3. Fallback a guest save si el usuario recién se autenticó
      if ((!bytes || bytes.length < 0x1C000) && currentUid !== 'guest-trainer-id') {
        try {
          const { data } = await supabase.storage.from(SAV_BUCKET).download(`guest-trainer-id/${slotId}`);
          if (data) {
            bytes = new Uint8Array(await data.arrayBuffer());
          }
        } catch {}
      }

      if (bytes && bytes.length >= 0x1C000) {
        setCurrentSlot(slotId);
        bridgeRef.current?.setActiveSlot(slotId);
        setShowSlotModal(false);
        soundFx.playCoin();
        setShowSaveSuccess(`📂 ¡Cargada partida ${slotId.replace('.sav', '').toUpperCase()}!`);
        setTimeout(() => setShowSaveSuccess(null), 2800);
        rebootEmulator(bytes);
      } else {
        setEmuState('running');
        soundFx.playDamage?.();
        setShowSaveSuccess(`⚠️ No hay partida guardada en ${slotId.replace('.sav', '').toUpperCase()}`);
        setTimeout(() => setShowSaveSuccess(null), 2800);
      }
    } catch (err) {
      console.error('[GBA] Error cargando slot:', err);
      setEmuState('running');
    }
  };

  // Arrancar mGBA nativo con WebAssembly (MONTAJE ÚNICO)
  // Usa bootAbortRef para cancelar si React StrictMode desmonta durante el await
  const bootMgbaCore = useCallback(async (customRomBytes?: Uint8Array, customName?: string) => {
    if (!canvasRef.current || isBootedRef.current || moduleRef.current) return;
    isBootedRef.current = true;
    setEmuState('loading');

    // Crear token de cancelación para esta sesión de boot
    const abortToken = { cancelled: false };
    bootAbortRef.current = abortToken;

    try {
      let mGBAFactory: any;
      try {
        const mod = await import('@thenick775/mgba-wasm');
        if (abortToken.cancelled) return; // StrictMode cleanup ejecutó durante el await
        mGBAFactory = mod.default || mod;
      } catch (err) {
        console.error('Error importando @thenick775/mgba-wasm:', err);
        setEmuState('idle');
        return;
      }

      if (abortToken.cancelled) return;

      // Inicializar mGBA
      const Module = await mGBAFactory({
        canvas: canvasRef.current,
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) return `/${path}`;
          return path;
        },
      });

      if (abortToken.cancelled) {
        // StrictMode ya desmontó: destruir esta instancia huérfana
        try { Module.pauseMainLoop?.(); } catch {}
        try { Module.quitMgba?.(); } catch {}
        return;
      }

      await Module.FSInit();

      if (abortToken.cancelled) {
        try { Module.pauseMainLoop?.(); } catch {}
        try { Module.quitMgba?.(); } catch {}
        return;
      }

      moduleRef.current = Module;

      // Vincular puente de memoria
      const bridge = new PokemonMemoryBridge(userId);
      bridge.setActiveSlot(currentSlotRef.current);
      bridge.bindEmulator(createAdapter(Module));
      bridgeRef.current = bridge;

      // Obtener bytes de la ROM
      let romBytes: Uint8Array;
      if (customRomBytes) {
        romBytes = customRomBytes;
        if (customName) setRomTitle(customName.replace('.gba', '').toUpperCase());
      } else {
        let resp = await fetch('/roms/pokemonHnS.gba');
        if (!resp.ok) {
          resp = await fetch(romUrl);
        }
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} al descargar ROM`);
        }
        romBytes = new Uint8Array(await resp.arrayBuffer());
      }

      // La ROM pokemonHnS.gba ya cuenta con los precios calibrados de lujo (Medicinas ₽1,200 - ₽35,000, Poké Balls ₽200)
      console.info('[mGBA] Precios calibrados de lujo activos en los Poké Marts.');

      if (abortToken.cancelled) {
        try { Module.pauseMainLoop?.(); } catch {}
        try { Module.quitMgba?.(); } catch {}
        moduleRef.current = null;
        return;
      }

      // Escribir ROM al sistema de archivos virtual
      Module.FS.writeFile(ROM_PATH_VFS, romBytes);

      // Cargar savegame previo con jerarquía de redundancia multinivel
      // 1. Si tenemos pendingSavBytesRef (recién inyectado en caliente por tienda/misión), usarlo
      const pendingSav = pendingSavBytesRef.current;
      let initialSavBytes: Uint8Array | null = null;

      if (pendingSav && pendingSav.length >= 0x1C000) {
        initialSavBytes = pendingSav;
        pendingSavBytesRef.current = null;
      } else {
        const currentUid = userIdRef.current;
        const activeSlot = currentSlotRef.current;

        // 2. Descargar desde Supabase Storage (Nube)
        try {
          const { data: savData } = await supabase.storage
            .from(SAV_BUCKET)
            .download(`${currentUid}/${activeSlot}`);
          if (savData) {
            initialSavBytes = new Uint8Array(await savData.arrayBuffer());
          } else {
            // Fallback a savegame.sav
            const { data: fallbackData } = await supabase.storage
              .from(SAV_BUCKET)
              .download(`${currentUid}/savegame.sav`);
            if (fallbackData) {
              initialSavBytes = new Uint8Array(await fallbackData.arrayBuffer());
            } else if (currentUid !== 'guest-trainer-id') {
              // Fallback a guest save si el usuario recién se logueó
              const { data: guestData } = await supabase.storage
                .from(SAV_BUCKET)
                .download('guest-trainer-id/slot_1.sav');
              if (guestData) {
                initialSavBytes = new Uint8Array(await guestData.arrayBuffer());
              }
            }
          }
        } catch (cloudErr) {
          console.warn('[mGBA] Error en descarga de nube, probando fuentes locales:', cloudErr);
        }

        // 3. Si no hay en Supabase, buscar en respaldo local del navegador (LocalStorage)
        if (!initialSavBytes || initialSavBytes.length < 0x1C000) {
          initialSavBytes = loadLocalBackup(activeSlot) || loadLocalBackup('slot_1.sav');
        }

        // 4. Si no hay en LocalStorage, verificar si ya existe en VFS (restaurado de IndexedDB por FSInit)
        if (!initialSavBytes || initialSavBytes.length < 0x1C000) {
          try {
            if (Module.FS.analyzePath(SAV_PATH_VFS).exists) {
              const vfsBytes = Module.FS.readFile(SAV_PATH_VFS);
              if (vfsBytes && vfsBytes.length >= 0x1C000) {
                initialSavBytes = vfsBytes;
              }
            }
          } catch {}
        }
      }

      // Escribir el .sav si lo encontramos; si es nuevo, inicializar Flash 128KB virgen (0xFF)
      if (initialSavBytes && initialSavBytes.length >= 0x1C000) {
        Module.FS.writeFile(SAV_PATH_VFS, initialSavBytes);
        try { Module.FS.writeFile('/data/games/pokemonHnS.sav', initialSavBytes); } catch {}
        console.info(`[mGBA] Partida previa cargada con éxito (${initialSavBytes.length} bytes).`);
      } else {
        // Inicializar archivo de 128 KB en blanco (0xFF) para que mGBA abra el descriptor O_RDWR
        const blankFlash = new Uint8Array(0x20000); // 131,072 bytes
        blankFlash.fill(0xFF);
        Module.FS.writeFile(SAV_PATH_VFS, blankFlash);
        try { Module.FS.writeFile('/data/games/pokemonHnS.sav', blankFlash); } catch {}
        console.info('[mGBA] Inicializado archivo Flash 128KB virgen (0xFF) en VFS.');
      }

      if (abortToken.cancelled) {
        try { Module.pauseMainLoop?.(); } catch {}
        try { Module.quitMgba?.(); } catch {}
        moduleRef.current = null;
        return;
      }

      // Eliminar autosaves residuales que congelan o desincronizan el juego
      try {
        Module.FS.unlink('/autosave/pokemonHnS_auto.ss');
      } catch {}

      // Desactivar la restauración obligatoria de save states automáticos que congelan el juego
      try {
        Module.setCoreSettings?.({
          autoSaveStateEnable: false,
          restoreAutoSaveStateOnLoad: false,
        });
      } catch {}

      // Arrancar juego pasando SAV_PATH_VFS explícito para carga determinista del SaveBlock
      Module.loadGame(ROM_PATH_VFS, SAV_PATH_VFS);

      // Registrar callbacks centrales para detectar cuando el jugador guarda DENTRO del juego
      try {
        Module.pauseGame?.();
        Module.addCoreCallbacks?.({
          saveDataUpdatedCallback: () => {
            console.info('[mGBA] 💾 In-game save detectado vía core callback.');
            handleSaveDataUpdated();
          },
        });
        Module.resumeGame?.();
      } catch (cbErr) {
        console.warn('[mGBA] Error registrando addCoreCallbacks:', cbErr);
      }

      setEmuState('running');
      refreshSlotsList();

      // Sincronizar el equipo y Pokédólares en vivo al store de Zustand
      try {
        const liveData = bridge.readTrainerDataFromEmulator();
        if (liveData) {
          updateProfile({
            gba_party_json: liveData.party as any,
            pokedollars: liveData.money,
          });
        }
      } catch {}
    } catch (err: any) {
      console.error('[mGBA] Error en boot:', err);
      if (!abortToken.cancelled) {
        setEmuState('idle');
      }
    }
  }, [romUrl, createAdapter, refreshSlotsList, handleSaveDataUpdated]);

  // Boot inicial y reinicios limpios al cambiar bootCount
  useEffect(() => {
    bootMgbaCore();
    return () => {
      bootAbortRef.current.cancelled = true;
      if (moduleRef.current) {
        const mod = moduleRef.current;
        try {
          // Persistir save dirty antes de destruir el core
          let savBytes: Uint8Array | null = null;
          try {
            if (typeof mod.getSave === 'function') savBytes = mod.getSave();
          } catch {}
          if (!savBytes && mod.FS?.analyzePath(SAV_PATH_VFS).exists) {
            try { savBytes = mod.FS.readFile(SAV_PATH_VFS); } catch {}
          }
          if (savBytes && savBytes.length >= 0x1C000) {
            try { mod.FSSync?.(); } catch {}
            saveLocalBackup(currentSlotRef.current, savBytes);
            const currentUid = userIdRef.current;
            supabase.storage.from(SAV_BUCKET).upload(`${currentUid}/${currentSlotRef.current}`, savBytes, { upsert: true }).catch(() => {});
          }
        } catch {}

        try {
          mod.pauseMainLoop?.();
          mod.pauseGame?.();
          mod.quitGame?.();
          mod.quitMgba?.();
        } catch {}
        moduleRef.current = null;
      }
      isBootedRef.current = false;
    };
  }, [bootCount, bootMgbaCore]);

  // Escuchar eventos de inyección en caliente desde la tienda web / misiones
  useEffect(() => {
    const onInjectItem = async (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: number; quantity: number; pocket: any; name: string }>;
      const { itemId, quantity, pocket, name } = customEvent.detail;
      const bridge = bridgeRef.current;
      const mod = moduleRef.current;
      if (!bridge || !mod) return;

      try {
        soundFx.playClick();
        const injection = await bridge.injectItemToGbaRam(itemId, quantity, pocket, true);
        if (injection.success && injection.updatedSav) {
          // Feedback audiovisual retro: sonido de moneda + confeti
          soundFx.playCoin();
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.65 },
              colors: ['#E60012', '#22C55E', '#06B6D4', '#F59E0B'],
            });
          } catch {}

          setShowSaveSuccess(`🎒 ¡${name} x${quantity} en tu Mochila! Pulsa CONTINUAR.`);
          setTimeout(() => setShowSaveSuccess(null), 4000);

          // Reinicio limpio e instantáneo del núcleo mGBA con el SaveBlock inyectado
          rebootEmulator(injection.updatedSav);
        }
      } catch (err) {
        console.error('[GBA] Error inyectando ítem:', err);
      }
    };

    const onInjectPokemon = async (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const options = customEvent.detail;
      const bridge = bridgeRef.current;
      const mod = moduleRef.current;
      if (!bridge || !mod) return;

      try {
        soundFx.playClick();
        const result = await bridge.injectPokemonToGbaParty(options, true);
        if (result && result.success && result.updatedSav) {
          // Feedback audiovisual retro: fanfarria level-up + lluvia de confeti
          soundFx.playLevelUp();
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#E60012', '#F59E0B', '#22C55E', '#06B6D4', '#2563EB'],
            });
          } catch {}

          const location = (result.slot < 0 || result.inPcBox)
            ? `en PC Box 1 (Ranura ${Math.abs(result.slot)})`
            : `en tu equipo (Ranura #${result.slot})`;
          setShowSaveSuccess(`✨ ¡${result.nickname} (Nv. ${result.level}) ${location}! Pulsa CONTINUAR.`);
          setTimeout(() => setShowSaveSuccess(null), 4500);

          if (!result.inPcBox) {
            const updatedParty = bridge.readPartyFromEmulator();
            if (updatedParty) {
              updateProfile({ gba_party_json: updatedParty as any });
            }
          }

          // Reinicio limpio e instantáneo del núcleo mGBA con el SaveBlock inyectado
          rebootEmulator(result.updatedSav);
        } else if (result?.error) {
          setShowSaveSuccess(`⚠️ ${result.error}`);
          setTimeout(() => setShowSaveSuccess(null), 3500);
        }
      } catch (err) {
        console.error('[GBA] Error inyectando Pokémon:', err);
      }
    };

    window.addEventListener('syndex:inject-item', onInjectItem);
    window.addEventListener('syndex:inject-pokemon', onInjectPokemon);
    return () => {
      window.removeEventListener('syndex:inject-item', onInjectItem);
      window.removeEventListener('syndex:inject-pokemon', onInjectPokemon);
    };
  }, [updateProfile, rebootEmulator]);

  // Escuchar botones de gamepad táctil virtual móvil
  useEffect(() => {
    const onVirtualGbaButton = (e: Event) => {
      const customEvent = e as CustomEvent<{ button: string; isDown: boolean }>;
      if (customEvent.detail && customEvent.detail.button) {
        handleButton(customEvent.detail.button, customEvent.detail.isDown);
      }
    };

    window.addEventListener('syndex:gba-button', onVirtualGbaButton);
    return () => {
      window.removeEventListener('syndex:gba-button', onVirtualGbaButton);
    };
  }, [handleButton]);

  // Escuchar teclado para reasignar teclas si el modal de controles está abierto
  useEffect(() => {
    if (!rebindingAction) return;

    const handleRebindKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateKeyBinding(rebindingAction, e.code);
    };

    window.addEventListener('keydown', handleRebindKey, { once: true });
    return () => {
      window.removeEventListener('keydown', handleRebindKey);
    };
  }, [rebindingAction]);

  // Controles por teclado físico mapeados dinámicamente
  useEffect(() => {
    // Generar mapeo inverso: e.code -> GBA Action ('Up', 'A', etc.)
    const codeToGba: Record<string, string> = {};

    // Mapear configuraciones personalizadas del usuario
    Object.entries(keyBindings).forEach(([action, code]) => {
      codeToGba[code] = action;
    });

    // Mapear teclas alternativas comunes (WASD secundario)
    if (!codeToGba['KeyW'] && keyBindings['Up'] !== 'KeyW') codeToGba['KeyW'] = 'Up';
    if (!codeToGba['KeyS'] && keyBindings['Down'] !== 'KeyS') codeToGba['KeyS'] = 'Down';
    if (!codeToGba['KeyA'] && keyBindings['Left'] !== 'KeyA') codeToGba['KeyA'] = 'Left';
    if (!codeToGba['KeyD'] && keyBindings['Right'] !== 'KeyD') codeToGba['KeyD'] = 'Right';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (rebindingAction) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const gbaBtn = codeToGba[e.code];
      if (gbaBtn) {
        e.preventDefault();
        handleButton(gbaBtn, true);
        soundFx.playClick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (rebindingAction) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const gbaBtn = codeToGba[e.code];
      if (gbaBtn) {
        e.preventDefault();
        handleButton(gbaBtn, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyBindings, handleButton, rebindingAction]);


  // Pausa / Reanudar (Sin sobreescribir la partida automáticamente)
  const togglePause = () => {
    soundFx.playClick();
    const mod = moduleRef.current;
    if (!mod) return;

    if (emuState === 'running') {
      mod.pauseGame?.();
      setEmuState('paused');
    } else if (emuState === 'paused' && batteryMinutes > 0) {
      mod.resumeGame?.();
      setEmuState('running');
    }
  };

  // Soft Reset: Reiniciar cartucho al menú de título oficial (como en un Game Boy real)
  const restartRom = () => {
    soundFx.playClick();
    setShowSaveSuccess('🔄 Consola Reiniciada (Pantalla de Título)');
    setTimeout(() => setShowSaveSuccess(null), 2500);
    rebootEmulator();
  };

  // Hard Reset: Iniciar Nueva Partida limpia sin saves atascados, sin autosaves ni capturas de pantalla
  const hardResetCleanGame = async () => {
    soundFx.playClick();
    const mod = moduleRef.current;
    try {
      setEmuState('loading');

      // 0. Limpiar VFS y sincronizarlo antes de detener el módulo para persistir estado vacío
      if (mod) {
        try {
          const wipeDir = (dir: string) => {
            try {
              const files: string[] = mod.FS.readdir(dir);
              for (const f of files) {
                if (f !== '.' && f !== '..') {
                  try { mod.FS.unlink(`${dir}/${f}`); } catch {}
                }
              }
            } catch {}
          };
          wipeDir('/data/saves');
          wipeDir('/data/states');
          wipeDir('/autosave');
          try { mod.FS.unlink(SAV_PATH_VFS); } catch {}
        } catch {}

        try { await mod.FSSync?.(); } catch {}

        // Detener el bucle actual y destruir la instancia mGBA previa
        try {
          mod.pauseMainLoop?.();
          mod.pauseGame?.();
          mod.quitGame?.();
          mod.quitMgba?.();
        } catch {}
      }

      // 1. Eliminar saves en la nube para empezar 100% virgen
      try {
        await supabase.storage.from(SAV_BUCKET).remove([
          `${userId}/${currentSlotRef.current}`,
          `${userId}/savegame.sav`,
          `${userId}/slot_1.sav`,
          `${userId}/slot_2.sav`,
          `${userId}/slot_3.sav`,
        ]);
      } catch {}

      // 2. Cancelar cualquier ciclo en vuelo y limpiar referencias
      bootAbortRef.current.cancelled = true;
      moduleRef.current = null;
      isBootedRef.current = false;

      // 3. Forzar recreación del canvas y re-arranque limpio
      setBootCount((prev) => prev + 1);
      setShowSaveSuccess('✨ ¡Nueva Partida Limpia Iniciada!');
      setTimeout(() => setShowSaveSuccess(null), 3000);
    } catch (err) {
      console.error('[GBA] Error en Hard Reset:', err);
      setEmuState('running');
    }
  };

  // Temporizador de consumo de batería
  useEffect(() => {
    if (emuState !== 'running') {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
        batteryIntervalRef.current = null;
      }
      return;
    }

    batteryIntervalRef.current = setInterval(async () => {
      if (typeof document !== 'undefined' && !document.hasFocus()) return;

      const remaining = await consumeBatteryMinuteRpc();
      if (remaining <= 0) {
        moduleRef.current?.pauseGame?.();
        setEmuState('drained');
        saveToSlot(currentSlot);
      }
    }, 60_000);

    return () => {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
        batteryIntervalRef.current = null;
      }
    };
  }, [emuState, consumeBatteryMinuteRpc, currentSlot]);

  // Si está en modo pantalla dedicada (standaloneScreen en Mobile Handheld),
  // renderizamos ÚNICAMENTE el canvas CRT de mGBA ocupando el 100% del contenedor sin controles duplicados
  if (standaloneScreen) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
        <canvas
          key={`gba-canvas-${bootCount}`}
          ref={canvasRef}
          width={240}
          height={160}
          className={`w-full h-full [image-rendering:pixelated] transition-transform duration-300 ${
            screenScaleMode === 'wide'
              ? 'object-fill scale-x-[1.08] sm:scale-100 sm:object-contain'
              : 'object-contain'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Botón flotante para alternar relación de aspecto 3:2 / Ancha */}
        <button
          onClick={toggleScreenScaleMode}
          className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded-full bg-black/75 hover:bg-black/95 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/50 backdrop-blur-sm cursor-pointer active:scale-95 transition-all shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          title="Alternar entre formato GBA original 3:2 y Pantalla Ancha (Edge-to-Edge)"
        >
          {screenScaleMode === 'wide' ? '↔ ANCHA' : '⊡ 3:2'}
        </button>

        {/* Pantalla de Carga Inicial */}
        {emuState === 'loading' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mb-2" />
            <p className="text-[11px] font-mono text-cyan-300 animate-pulse">Iniciando Pokémon Heart & Soul...</p>
          </div>
        )}

        {/* Overlay Game Boy: Batería Agotada */}
        {isDrained && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center z-30 animate-fadeIn">
            <div className="p-2 bg-rose-500/20 border border-rose-500 rounded-full mb-1">
              <BatteryWarning className="w-7 h-7 text-rose-500 animate-pulse" />
            </div>
            <span className="text-[10px] font-black font-mono text-rose-400 tracking-wider">
              🔋 BATERÍA AGOTADA
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col rounded-none sm:rounded-2xl transition-all duration-300 p-1.5 sm:p-3 relative overflow-hidden select-none ${
        isLight
          ? 'bg-[#F4F1EA] text-slate-800 border-y-2 sm:border-4 border-black shadow-[6px_6px_0px_0px_#000]'
          : 'bg-[#121214] text-slate-100 border-y sm:border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(34,197,94,0.15)]'
      }`}
    >

      {/* Modal Personalización de Controles / Teclas */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3"
          >
            <div
              className={`w-full max-w-sm max-h-[92%] flex flex-col rounded-2xl p-4 border-2 shadow-2xl overflow-hidden ${
                isLight ? 'bg-[#F4F1EA] border-black text-slate-900 shadow-[4px_4px_0_#000]' : 'bg-[#18181b] border-cyan-500/50 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40 shrink-0">
                <div className="flex items-center gap-2 font-mono font-black text-xs tracking-wider">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span>CONFIGURAR CONTROLES</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={resetKeyBindings}
                    title="Restablecer teclas por defecto"
                    className="p-1 rounded-md hover:bg-slate-700/40 text-slate-400 hover:text-amber-400 cursor-pointer transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setRebindingAction(null);
                      setShowKeyModal(false);
                    }}
                    className="p-1 rounded-md hover:bg-slate-700/40 cursor-pointer text-slate-400 hover:text-white transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {rebindingAction ? (
                <div className="mb-2 p-2 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-mono text-[11px] text-center font-bold animate-pulse">
                  ⚡ Pulsa cualquier tecla para: <span className="underline">{ACTION_LABELS[rebindingAction]}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-mono mb-2 shrink-0">
                  Toca una tecla para personalizarla a tu gusto:
                </p>
              )}

              {/* Lista de Acciones remapeables */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {Object.keys(DEFAULT_KEY_BINDINGS).map((action) => {
                  const currentKey = keyBindings[action] || DEFAULT_KEY_BINDINGS[action];
                  const isWaitingThis = rebindingAction === action;

                  return (
                    <div
                      key={action}
                      className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                        isWaitingThis
                          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/50'
                          : isLight
                          ? 'bg-white border-black/15 shadow-[1px_1px_0_#000]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-xs font-bold">{action}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{ACTION_LABELS[action]}</p>
                      </div>

                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setRebindingAction(action);
                        }}
                        className={`min-w-[56px] px-3 py-1 font-mono text-xs font-black rounded-lg border cursor-pointer transition-all ${
                          isWaitingThis
                            ? 'bg-amber-400 text-black border-amber-500 animate-bounce'
                            : isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-600 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)] active:scale-95'
                        }`}
                      >
                        {isWaitingThis ? '...' : `[ ${formatKeyName(currentKey)} ]`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/30 text-center shrink-0">
                <span className="text-[10px] text-slate-500 font-mono">
                  Guardado automático en tu navegador local
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Visual de Partidas Guardadas */}
      <AnimatePresence>
        {showSlotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3"
          >
            <div
              className={`w-full max-w-sm rounded-2xl p-4 border-2 shadow-2xl ${
                isLight ? 'bg-[#F4F1EA] border-black text-slate-900 shadow-[4px_4px_0_#000]' : 'bg-[#18181b] border-emerald-500/50 text-slate-100 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/40">
                <div className="flex items-center gap-2 font-mono font-black text-xs tracking-wider">
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>PARTIDAS GUARDADAS EN LA NUBE</span>
                </div>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="p-1 rounded-md hover:bg-slate-700/40 cursor-pointer text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de 3 Slots Claras */}
              <div className="space-y-2">
                {[
                  { id: 'slot_1.sav', label: 'Ranura 1', desc: 'Partida Principal' },
                  { id: 'slot_2.sav', label: 'Ranura 2', desc: 'Partida Alternativa' },
                  { id: 'slot_3.sav', label: 'Ranura 3', desc: 'Copia de Respaldo' },
                ].map((slot, index) => {
                  const existing = availableSlots.find((s) => s.id === slot.id);
                  const isCurrent = currentSlot === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? isLight
                            ? 'bg-emerald-100/80 border-emerald-500 shadow-[2px_2px_0_#000]'
                            : 'bg-emerald-950/60 border-emerald-400/80 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                          : isLight
                          ? 'bg-white border-black/15 shadow-[1px_1px_0_#000]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                          <span>{slot.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({slot.desc})</span>
                          {isCurrent && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black tracking-wider">
                              EN USO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {existing ? `🕒 Guardado: ${existing.updatedAt}` : '⭕ Ranura vacía'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => loadFromSlot(slot.id)}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            isLight
                              ? 'bg-cyan-200 hover:bg-cyan-300 text-cyan-950 border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                              : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 active:scale-95'
                          }`}
                          title="Cargar esta partida"
                        >
                          ▶ Cargar
                        </button>
                        <button
                          onClick={() => {
                            saveToSlot(slot.id);
                            setShowSlotModal(false);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                            isLight
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                              : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/60 active:scale-95'
                          }`}
                          title="Guardar partida aquí"
                        >
                          💾 Guardar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sección de Guardado Rápido Instantáneo (Save State desde afuera) */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>GUARDADO RÁPIDO (ESTADO)</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">1 Clic desde afuera</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      quickSaveState(1);
                      setShowSlotModal(false);
                    }}
                    className={`py-1.5 px-2 text-[10px] font-mono font-black rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      isLight
                        ? 'bg-amber-300 hover:bg-amber-400 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 active:scale-95'
                    }`}
                    title="Guarda la posición y combate exacto del emulador desde afuera"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Guardar Estado</span>
                  </button>
                  <button
                    onClick={() => {
                      quickLoadState(1);
                      setShowSlotModal(false);
                    }}
                    className={`py-1.5 px-2 text-[10px] font-mono font-black rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      isLight
                        ? 'bg-cyan-200 hover:bg-cyan-300 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 active:scale-95'
                    }`}
                    title="Carga el último estado rápido capturado"
                  >
                    <FolderOpen className="w-3 h-3 text-cyan-400" />
                    <span>Cargar Estado</span>
                  </button>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-700/30 space-y-1 text-center">
                <p className="text-[9px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Auto-guardado activo: guarda en el menú START de Pokémon y se respalda solo.</span>
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Sincronizado en Supabase e IndexedDB local.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación Flotante de Partida Guardada */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-slate-950 font-black font-mono text-[11px] px-3.5 py-1.5 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.7)] flex items-center gap-1.5 border-2 border-black pointer-events-none"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{showSaveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra Superior Ergonómica Estilo GBA SP */}
      <div className="flex justify-between items-center px-1 mb-2">
        {/* Gatillo L (Hombrera Izquierda) */}
        <button
          onMouseDown={() => {
            soundFx.playClick();
            handleButton('L', true);
          }}
          onMouseUp={() => handleButton('L', false)}
          onTouchStart={(e) => {
            e.preventDefault();
            soundFx.playClick();
            handleButton('L', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButton('L', false);
          }}
          className={`px-3 py-1 font-mono font-black text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            isLight
              ? 'bg-slate-300 hover:bg-slate-400 text-slate-900 border-2 border-black border-b-0 shadow-[2px_0_0_#000] active:translate-y-0.5'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 border-b-0 active:translate-y-0.5'
          }`}
          title={`Gatillo L (Tecla ${formatKeyName(keyBindings['L'] || 'KeyQ')})`}
        >
          <span>L</span>
          <span className="text-[9px] opacity-60 font-sans">[{formatKeyName(keyBindings['L'] || 'KeyQ')}]</span>
        </button>

        {/* Clúster Central: Estado, Partidas y Controles */}
        <div className="flex items-center gap-1.5">
          {/* Badge de FPS */}
          <div className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{emuState === 'running' ? '60 FPS' : emuState.toUpperCase()}</span>
          </div>

          {/* Botón Partidas Guardadas */}
          <button
            onClick={() => {
              soundFx.playClick();
              refreshSlotsList();
              setShowSlotModal(true);
            }}
            title="Elegir o gestionar partidas guardadas"
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              isLight
                ? 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(34,197,94,0.15)] active:scale-95'
            }`}
          >
            <Save className="w-3 h-3 text-emerald-400" />
            <span>Partidas</span>
          </button>

          {/* Botón Configurar Controles */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowKeyModal(true);
            }}
            title="Personalizar controles del teclado"
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              isLight
                ? 'bg-cyan-200 hover:bg-cyan-300 text-cyan-950 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.15)] active:scale-95'
            }`}
          >
            <Gamepad2 className="w-3 h-3 text-cyan-400" />
            <span>Controles</span>
          </button>

          {/* Botón Reiniciar ROM (Soft Reset a la pantalla de título) */}
          <button
            onClick={restartRom}
            title="Reiniciar a la pantalla de título de Pokémon (Soft Reset oficial)"
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.15)] active:scale-95'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset</span>
          </button>

          {/* Botón Nueva Partida (Hard Reset: borra partida atascada y arranca de cero) */}
          <button
            onClick={hardResetCleanGame}
            title="Borrar partida atascada y arrancar Nueva Partida limpia desde la intro"
            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
              isLight
                ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.15)] active:scale-95'
            }`}
          >
            <RefreshCw className="w-3 h-3 text-rose-400" />
            <span>Nueva Partida</span>
          </button>
        </div>

        {/* Gatillo R (Hombrera Derecha) */}
        <button
          onMouseDown={() => {
            soundFx.playClick();
            handleButton('R', true);
          }}
          onMouseUp={() => handleButton('R', false)}
          onTouchStart={(e) => {
            e.preventDefault();
            soundFx.playClick();
            handleButton('R', true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButton('R', false);
          }}
          className={`px-3 py-1 font-mono font-black text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            isLight
              ? 'bg-slate-300 hover:bg-slate-400 text-slate-900 border-2 border-black border-b-0 shadow-[-2px_0_0_#000] active:translate-y-0.5'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 border-b-0 active:translate-y-0.5'
          }`}
          title={`Gatillo R (Tecla ${formatKeyName(keyBindings['R'] || 'KeyE')})`}
        >
          <span className="text-[9px] opacity-60 font-sans">[{formatKeyName(keyBindings['R'] || 'KeyE')}]</span>
          <span>R</span>
        </button>
      </div>

      {/* Pantalla del Emulador (Marco CRT Oficial mGBA) */}
      <div
        className={`relative flex-1 min-h-[220px] sm:min-h-[190px] rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center ${
          isLight
            ? 'bg-[#0f172a] border-2 sm:border-4 border-black shadow-inner'
            : 'bg-black border sm:border-2 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none z-10" />

        {/* Botón flotante para alternar relación de aspecto 3:2 / Ancha */}
        <button
          onClick={toggleScreenScaleMode}
          className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-black/75 hover:bg-black/90 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/50 backdrop-blur-sm cursor-pointer active:scale-95 transition-all shadow-md flex items-center gap-1"
          title="Alternar entre relación 3:2 original y Pantalla Ancha (Edge-to-Edge)"
        >
          <span>{screenScaleMode === 'wide' ? '↔ ANCHA' : '⊡ 3:2'}</span>
        </button>

        {/* Canvas oficial nativo para mGBA WebAssembly con desmontaje limpio en cada reinicio */}
        <canvas
          key={`gba-canvas-${bootCount}`}
          ref={canvasRef}
          width={240}
          height={160}
          className={`w-full h-full [image-rendering:pixelated] transition-transform duration-300 ${
            screenScaleMode === 'wide'
              ? 'object-fill scale-x-[1.08] sm:scale-100 sm:object-contain'
              : 'object-contain'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Pantalla de Carga Inicial */}
        {emuState === 'loading' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs font-mono text-cyan-300 animate-pulse">Iniciando Pokémon Heart & Soul...</p>
          </div>
        )}

        {/* Overlay Game Boy: Batería Agotada */}
        {isDrained && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn">
            <div className="p-3 bg-rose-500/20 border-2 border-rose-500 rounded-full mb-2 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
              <BatteryWarning className="w-9 h-9 text-rose-500 animate-pulse" />
            </div>
            <div className="bg-rose-500/20 border border-rose-500/40 px-3 py-1 rounded text-xs font-black font-mono text-rose-400 tracking-wider mb-2">
              🔋 BATERÍA AGOTADA
            </div>
            <p className="text-xs font-bold font-mono text-slate-200 max-w-[240px] leading-snug">
              Resuelve un reto o minijuego de IA para recargar +15 min.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>.sav respaldado en la nube</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Telemetría y Controles de Partida */}
      <div className="flex items-center justify-between py-1.5 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <BatteryCharging
            className={`w-4 h-4 ${batteryMinutes > 0 ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}
          />
          <span
            className={`font-bold text-[11px] ${
              batteryMinutes > 0
                ? isLight
                  ? 'text-emerald-700'
                  : 'text-emerald-400'
                : 'text-rose-500'
            }`}
          >
            {batteryMinutes}m Batería
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón Reiniciar ROM Rápido */}
          <button
            onClick={restartRom}
            className={`p-1 rounded-lg font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000]'
                : 'bg-slate-800 border border-slate-700 hover:border-rose-400 text-rose-400 hover:text-rose-300 active:scale-95'
            }`}
            title="Reiniciar ROM / Descongelar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePause}
            className={`p-1 rounded-lg font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-200 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000]'
                : 'bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300'
            }`}
            title={emuState === 'running' ? 'Pausar y Guardar' : 'Reanudar'}
          >
            {emuState === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setIsMuted(!isMuted);
            }}
            className={`p-1 rounded-lg font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-200 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000]'
                : 'bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Botón Guardado Rápido Instantáneo desde afuera */}
          <button
            onClick={() => quickSaveState(1)}
            className={`px-2 py-1 text-[10px] font-black rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              isLight
                ? 'bg-amber-300 hover:bg-amber-400 text-slate-950 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title="Guardar Estado Rápido: Guarda la partida desde afuera al instante con 1 clic."
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">⚡ Rápido</span>
          </button>

          {/* Botón Respaldar Partida en Supabase */}
          <button
            onClick={() => saveToSlot(currentSlot)}
            disabled={isSaving}
            className={`px-2.5 py-1 text-[10px] font-black rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              isLight
                ? 'bg-[#2563EB] text-white border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Respaldar archivo .SAV en Supabase e IndexedDB. Guarda primero dentro del juego con START -> GUARDAR."
          >
            {isSaving ? (
              <RefreshCw className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span>{isSaving ? 'Guardando...' : 'Respaldar .SAV'}</span>
          </button>
        </div>
      </div>

      {/* Controles Físicos Táctiles Estilo Game Boy Advance */}
      <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between px-1">
        {/* D-Pad */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div
            className={`w-7 h-7 rounded-sm ${
              isLight ? 'bg-slate-800' : 'bg-slate-900 border border-slate-700'
            }`}
          />

          {/* Arriba */}
          <button
            onMouseDown={() => {
              soundFx.playClick();
              handleButton('Up', true);
            }}
            onMouseUp={() => handleButton('Up', false)}
            onTouchStart={(e) => {
              e.preventDefault();
              soundFx.playClick();
              handleButton('Up', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleButton('Up', false);
            }}
            className={`absolute top-0 w-7 h-8 rounded-t-md flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
              activeKeys.has('Up') ? 'scale-95 bg-emerald-500 text-white' : ''
            } ${
              isLight
                ? 'bg-slate-800 text-slate-300 active:bg-slate-900 shadow-[0_2px_0_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-t border-x border-slate-600'
            }`}
          >
            ▲
          </button>

          {/* Abajo */}
          <button
            onMouseDown={() => {
              soundFx.playClick();
              handleButton('Down', true);
            }}
            onMouseUp={() => handleButton('Down', false)}
            onTouchStart={(e) => {
              e.preventDefault();
              soundFx.playClick();
              handleButton('Down', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleButton('Down', false);
            }}
            className={`absolute bottom-0 w-7 h-8 rounded-b-md flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
              activeKeys.has('Down') ? 'scale-95 bg-emerald-500 text-white' : ''
            } ${
              isLight
                ? 'bg-slate-800 text-slate-300 active:bg-slate-900 shadow-[0_2px_0_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-b border-x border-slate-600'
            }`}
          >
            ▼
          </button>

          {/* Izquierda */}
          <button
            onMouseDown={() => {
              soundFx.playClick();
              handleButton('Left', true);
            }}
            onMouseUp={() => handleButton('Left', false)}
            onTouchStart={(e) => {
              e.preventDefault();
              soundFx.playClick();
              handleButton('Left', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleButton('Left', false);
            }}
            className={`absolute left-0 h-7 w-8 rounded-l-md flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
              activeKeys.has('Left') ? 'scale-95 bg-emerald-500 text-white' : ''
            } ${
              isLight
                ? 'bg-slate-800 text-slate-300 active:bg-slate-900 shadow-[2px_0_0_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-l border-y border-slate-600'
            }`}
          >
            ◀
          </button>

          {/* Derecha */}
          <button
            onMouseDown={() => {
              soundFx.playClick();
              handleButton('Right', true);
            }}
            onMouseUp={() => handleButton('Right', false)}
            onTouchStart={(e) => {
              e.preventDefault();
              soundFx.playClick();
              handleButton('Right', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleButton('Right', false);
            }}
            className={`absolute right-0 h-7 w-8 rounded-r-md flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
              activeKeys.has('Right') ? 'scale-95 bg-emerald-500 text-white' : ''
            } ${
              isLight
                ? 'bg-slate-800 text-slate-300 active:bg-slate-900 shadow-[2px_0_0_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-r border-y border-slate-600'
            }`}
          >
            ▶
          </button>
        </div>

        {/* Start / Select Pills */}
        <div className="flex flex-col gap-1.5 items-center justify-center">
          <div className="flex gap-2">
            <button
              onMouseDown={() => {
                soundFx.playClick();
                handleButton('Select', true);
              }}
              onMouseUp={() => handleButton('Select', false)}
              onTouchStart={(e) => {
                e.preventDefault();
                soundFx.playClick();
                handleButton('Select', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleButton('Select', false);
              }}
              className={`w-11 h-3 -rotate-12 rounded-full text-[7px] font-black font-mono transition-all flex items-center justify-center cursor-pointer ${
                isLight
                  ? 'bg-slate-400 text-slate-900 border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              SELECT
            </button>
            <button
              onMouseDown={() => {
                soundFx.playClick();
                handleButton('Start', true);
              }}
              onMouseUp={() => handleButton('Start', false)}
              onTouchStart={(e) => {
                e.preventDefault();
                soundFx.playClick();
                handleButton('Start', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleButton('Start', false);
              }}
              className={`w-11 h-3 -rotate-12 rounded-full text-[7px] font-black font-mono transition-all flex items-center justify-center cursor-pointer ${
                isLight
                  ? 'bg-slate-400 text-slate-900 border border-black shadow-[1px_1px_0_#000] active:translate-x-0.5 active:translate-y-0.5'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              START
            </button>
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            {romTitle.slice(0, 18)}
          </span>
        </div>

        {/* Botones B y A (Nintendo Rojo) */}
        <div className="flex gap-2.5 items-center -rotate-12">
          {/* Botón B */}
          <div className="flex flex-col items-center">
            <button
              onMouseDown={() => {
                soundFx.playClick();
                handleButton('B', true);
              }}
              onMouseUp={() => handleButton('B', false)}
              onTouchStart={(e) => {
                e.preventDefault();
                soundFx.playClick();
                handleButton('B', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleButton('B', false);
              }}
              className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? 'bg-[#E60012] text-white border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                  : 'bg-[#E60012] text-white border border-rose-400/50 shadow-[0_0_10px_rgba(230,0,18,0.4)] active:scale-95'
              }`}
            >
              B
            </button>
            <span className="text-[8px] font-mono font-bold mt-0.5 text-slate-400">
              [{formatKeyName(keyBindings['B'] || 'KeyX')}]
            </span>
          </div>

          {/* Botón A */}
          <div className="flex flex-col items-center -mt-3.5">
            <button
              onMouseDown={() => {
                soundFx.playClick();
                handleButton('A', true);
              }}
              onMouseUp={() => handleButton('A', false)}
              onTouchStart={(e) => {
                e.preventDefault();
                soundFx.playClick();
                handleButton('A', true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleButton('A', false);
              }}
              className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? 'bg-[#E60012] text-white border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                  : 'bg-[#E60012] text-white border border-rose-400/50 shadow-[0_0_10px_rgba(230,0,18,0.4)] active:scale-95'
              }`}
            >
              A
            </button>
            <span className="text-[8px] font-mono font-bold mt-0.5 text-slate-400">
              [{formatKeyName(keyBindings['A'] || 'KeyZ')}]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
