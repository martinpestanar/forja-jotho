'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { PokemonMemoryBridge, EmulatorInterface } from '@/lib/gba/PokemonMemoryBridge';
import { PartyPokemonSummary } from '@/lib/gba/gbaSaveEngine';
import {
  Gamepad2,
  BatteryCharging,
  Cloud,
  CloudOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

// Constantes para las rutas del sistema de archivos virtual de Emscripten
const ROM_PATH_VFS = '/data/games/pokemonHnS.gba';
const SAV_PATH_VFS = '/data/saves/pokemonHnS.sav';

type EmulatorStatus = 'idle' | 'loading' | 'running' | 'paused' | 'drained' | 'error';

export const GbaConsolePersistent: React.FC = () => {
  const profile = useTrainerStore((s) => s.profile);
  const consumeBatteryMinuteRpc = useTrainerStore((s) => s.consumeBatteryMinuteRpc);
  const updateProfile = useTrainerStore((s) => s.updateProfile);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emulatorModuleRef = useRef<any>(null);
  const bridgeRef = useRef<PokemonMemoryBridge | null>(null);
  const batteryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emuStatus, setEmuStatus] = useState<EmulatorStatus>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [partyPreview, setPartyPreview] = useState<PartyPokemonSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const batteryMinutes = profile?.battery_minutes ?? 0;
  const userId = profile?.id ?? 'guest-trainer-id';
  const romUrl = process.env.NEXT_PUBLIC_ROM_URL || '/roms/pokemonhns.gba';

  // ============================================================================
  // Adaptador del emulador → EmulatorInterface (abstracción sobre mGBA-wasm)
  // ============================================================================

  const createEmulatorAdapter = useCallback((Module: any): EmulatorInterface => {
    return {
      readSaveFile: (): Uint8Array | null => {
        try {
          return Module.FS.readFile(SAV_PATH_VFS);
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
        } catch (err) {
          console.error('[GBA] Error writing save to VFS:', err);
        }
      },
      pause: (): void => {
        try {
          Module.pauseGame?.();
        } catch { /* noop */ }
      },
      resume: (): void => {
        try {
          Module.resumeGame?.();
        } catch { /* noop */ }
      },
    };
  }, []);

  // ============================================================================
  // Boot del emulador
  // ============================================================================

  const bootEmulator = useCallback(async () => {
    if (!canvasRef.current || emulatorModuleRef.current) return;

    setEmuStatus('loading');
    setLoadError(null);

    try {
      // 1. Cargar dinámicamente el módulo mGBA-wasm (solo en cliente)
      let mGBAFactory: any;
      try {
        const mod = await import('@thenick775/mgba-wasm');
        mGBAFactory = mod.default || mod;
      } catch {
        // Si el paquete no está instalado, dejar el status como error informativo
        setEmuStatus('error');
        setLoadError(
          'El paquete @thenick775/mgba-wasm no está instalado. Ejecuta: npm install @thenick775/mgba-wasm'
        );
        return;
      }

      // 2. Inicializar el core WASM con el canvas
      const Module = await mGBAFactory({ canvas: canvasRef.current });
      await Module.FSInit();
      emulatorModuleRef.current = Module;

      // 3. Crear el puente y vincular el adaptador
      const bridge = new PokemonMemoryBridge(userId);
      const adapter = createEmulatorAdapter(Module);
      bridge.bindEmulator(adapter);
      bridgeRef.current = bridge;

      // 4. Descargar ROM e inyectar en VFS
      const romResp = await fetch(romUrl);
      if (!romResp.ok) {
        throw new Error(`No se pudo descargar la ROM desde ${romUrl} (HTTP ${romResp.status})`);
      }
      const romBuffer = new Uint8Array(await romResp.arrayBuffer());
      Module.FS.writeFile(ROM_PATH_VFS, romBuffer);

      // 5. Descargar .sav previo de Supabase e inyectar en VFS
      const cloudSav = await bridge.downloadSaveFromCloud();
      if (cloudSav) {
        Module.FS.writeFile(SAV_PATH_VFS, cloudSav);
        try {
          Module.FS.writeFile('/data/games/pokemonHnS.sav', cloudSav);
        } catch {}
      }

      // 6. Procesar inyecciones pendientes de la tienda (Buzón de Ciudad Trigal)
      await bridge.processPendingInjections();

      // 7. Arrancar la ROM pasando SAV_PATH_VFS explícito
      Module.loadGame(ROM_PATH_VFS, SAV_PATH_VFS);

      // 8. Si no hay batería, pausar inmediatamente
      if (batteryMinutes <= 0) {
        Module.pauseGame?.();
        setEmuStatus('drained');
      } else {
        setEmuStatus('running');
      }

      // 9. Extraer equipo inicial para preview
      const initialParty = bridge.readPartyFromEmulator();
      if (initialParty) {
        setPartyPreview(initialParty);
        updateProfile({ gba_party_json: initialParty });
      }
    } catch (err: any) {
      console.error('[GBA] Boot error:', err);
      setEmuStatus('error');
      setLoadError(err?.message || 'Error desconocido al iniciar el emulador');
    }
  }, [userId, romUrl, batteryMinutes, createEmulatorAdapter, updateProfile]);

  // ============================================================================
  // Intervalo de batería: cada 60s → rpc_consume_battery_minute + auto-sync
  // ============================================================================

  useEffect(() => {
    if (emuStatus !== 'running') {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
        batteryIntervalRef.current = null;
      }
      return;
    }

    batteryIntervalRef.current = setInterval(async () => {
      const remaining = await consumeBatteryMinuteRpc();

      if (remaining <= 0) {
        // Batería agotada: pausar emulador + auto-save
        emulatorModuleRef.current?.pauseGame?.();
        setEmuStatus('drained');
        await handleCloudSync();
      }
    }, 60_000); // Cada 60 segundos = 1 minuto de batería

    return () => {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
        batteryIntervalRef.current = null;
      }
    };
  }, [emuStatus, consumeBatteryMinuteRpc]);

  // Reaccionar al cambio de batería en el store (por ejemplo, al completar un reto)
  useEffect(() => {
    if (emuStatus === 'drained' && batteryMinutes > 0 && emulatorModuleRef.current) {
      emulatorModuleRef.current.resumeGame?.();
      setEmuStatus('running');
    }
  }, [batteryMinutes, emuStatus]);

  // ============================================================================
  // Handlers de UI
  // ============================================================================

  const handleCloudSync = useCallback(async () => {
    if (!bridgeRef.current || isSyncing) return;
    setIsSyncing(true);

    const party = await bridgeRef.current.syncSaveToCloud();
    if (party) {
      setPartyPreview(party);
      updateProfile({ gba_party_json: party });
    }

    setLastSyncTime(new Date().toLocaleTimeString());
    setIsSyncing(false);
  }, [isSyncing, updateProfile]);

  const handleTogglePause = useCallback(() => {
    const Module = emulatorModuleRef.current;
    if (!Module) return;

    if (emuStatus === 'running') {
      Module.pauseGame?.();
      setEmuStatus('paused');
    } else if (emuStatus === 'paused' && batteryMinutes > 0) {
      Module.resumeGame?.();
      setEmuStatus('running');
    }
  }, [emuStatus, batteryMinutes]);

  const handleToggleMute = useCallback(() => {
    // TODO: connect to actual audio control when mGBA exposes it
    setIsMuted((m) => !m);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  const statusIndicator = (() => {
    switch (emuStatus) {
      case 'running':
        return { color: 'bg-emerald-400 animate-pulse', label: 'RUNNING', textColor: 'text-emerald-400' };
      case 'paused':
        return { color: 'bg-amber-400', label: 'PAUSED', textColor: 'text-amber-400' };
      case 'drained':
        return { color: 'bg-rose-500 animate-ping', label: 'DRAINED', textColor: 'text-rose-400' };
      case 'loading':
        return { color: 'bg-cyan-400 animate-pulse', label: 'LOADING', textColor: 'text-cyan-400' };
      case 'error':
        return { color: 'bg-rose-600', label: 'ERROR', textColor: 'text-rose-400' };
      default:
        return { color: 'bg-slate-600', label: 'STANDBY', textColor: 'text-slate-400' };
    }
  })();

  return (
    <div className="w-full h-full flex flex-col bg-[#0f172a] rounded-xl border-2 border-slate-700/80 p-3 shadow-2xl relative overflow-hidden">
      {/* Cabecera de la Carcasa GBA */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span className="font-bold tracking-wider text-slate-200">GBA CYBER-CORE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusIndicator.color}`} />
          <span className={`text-[10px] font-bold ${statusIndicator.textColor}`}>
            {statusIndicator.label}
          </span>
        </div>
      </div>

      {/* Pantalla del Emulador (Canvas persistente — NUNCA se desmonta) */}
      <div className="flex-1 my-2 bg-black rounded-lg border-4 border-slate-900 shadow-inner flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent pointer-events-none z-10" />

        {/* Canvas GBA (240x160 nativo, escalado por CSS con image-rendering pixelated) */}
        <canvas
          ref={canvasRef}
          width={240}
          height={160}
          className="w-full h-full bg-black [image-rendering:pixelated] object-contain"
          style={{ display: emuStatus === 'idle' || emuStatus === 'error' ? 'none' : 'block' }}
        />

        {/* Placeholder cuando el emulador no está cargado */}
        {(emuStatus === 'idle' || emuStatus === 'error') && (
          <div className="flex flex-col items-center justify-center text-center p-4 z-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Gamepad2 className="w-7 h-7 text-cyan-400" />
            </div>
            {emuStatus === 'error' ? (
              <>
                <p className="text-sm font-bold font-mono text-rose-400">Error al iniciar</p>
                <p className="text-xs text-slate-500 font-mono mt-1 max-w-[260px]">
                  {loadError || 'Error desconocido.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold font-mono text-cyan-300">Emulador GBA Listo</p>
                <p className="text-xs text-slate-500 font-mono mt-1 max-w-[260px]">
                  {batteryMinutes > 0
                    ? 'Pulsa "Arrancar" para cargar PokemonHnS desde la nube.'
                    : 'Batería en 0m. Resuelve un reto para recargar.'}
                </p>
              </>
            )}

            <button
              onClick={bootEmulator}
              disabled={(emuStatus as EmulatorStatus) === 'loading'}
              className="mt-4 px-4 py-2 text-[11px] font-mono font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Arrancar PokemonHnS</span>
            </button>
          </div>
        )}

        {/* Pantalla de carga */}
        {emuStatus === 'loading' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs font-mono text-cyan-300 animate-pulse">
              Cargando núcleo WASM + ROM + Save...
            </p>
          </div>
        )}

        {/* Overlay de Bloqueo por Batería Agotada */}
        {emuStatus === 'drained' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-full mb-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-sm font-black font-mono text-rose-300 uppercase tracking-wider">
              🔋 Batería en 0m
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Tu partida está guardada en la nube. Resuelve un reto de código o trivia de IA para recargar <strong className="text-amber-300">+15 minutos</strong>.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <CheckCircle className="w-3 h-3" />
              <span>Auto-guardado completado</span>
            </div>
          </div>
        )}
      </div>

      {/* Controles Inferiores */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        {/* Fila 1: Controles principales */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Pausa / Reanudar */}
            <button
              onClick={handleTogglePause}
              disabled={emuStatus !== 'running' && emuStatus !== 'paused'}
              className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-800 border border-slate-700 rounded disabled:opacity-30 cursor-pointer transition-colors"
              title={emuStatus === 'running' ? 'Pausar' : 'Reanudar'}
            >
              {emuStatus === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Mute */}
            <button
              onClick={handleToggleMute}
              className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-800 border border-slate-700 rounded cursor-pointer transition-colors"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sync a nube */}
          <button
            onClick={handleCloudSync}
            disabled={isSyncing || emuStatus === 'idle' || emuStatus === 'error'}
            className="px-3 py-1.5 text-[11px] font-mono font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3" />
                <span>Guardar en Nube</span>
              </>
            )}
          </button>
        </div>

        {/* Fila 2: Indicadores de estado */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <BatteryCharging className="w-3 h-3 text-cyan-400" />
            <span className={batteryMinutes > 0 ? 'text-cyan-400' : 'text-rose-400'}>
              {batteryMinutes}m restantes
            </span>
          </div>

          {lastSyncTime && (
            <div className="flex items-center gap-1 text-emerald-400/80">
              <CheckCircle className="w-3 h-3" />
              <span>Último sync: {lastSyncTime}</span>
            </div>
          )}

          <div className="text-amber-400/60">PERSISTENT FRAME</div>
        </div>

        {/* Mini-preview del equipo */}
        {partyPreview.length > 0 && (
          <div className="pt-1.5 border-t border-slate-800/50 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400/60 shrink-0" />
            <div className="flex gap-1 overflow-x-auto">
              {partyPreview.map((mon) => (
                <div
                  key={mon.slot}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    mon.isShiny
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                  title={`${mon.nickname} Nv.${mon.level} (Species: 0x${mon.speciesId.toString(16)})`}
                >
                  {mon.nickname} Lv{mon.level}
                  {mon.isShiny && ' ✨'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
