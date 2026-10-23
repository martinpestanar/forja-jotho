'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Zap, 
  MapPin, 
  Play, 
  ShieldAlert,
  ChevronRight,
  Gamepad2,
  Swords
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';
import { getAdminGameRules } from '@/lib/adminService';
import { LevelRequirement } from '@/types/trainer';
import { GymBadgeShowcase } from '@/components/dashboard/GymBadgeShowcase';

interface RouteNode {
  id: string;
  level: number;
  title: string;
  badgeName: string;
  leader: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  coords: { x: number; y: number }; // Porcentaje sobre el mapa
  islandName: string;
}

// 4 Islas/Nodos del Nivel 1 (Gimnasio Malva / Medalla Céfiro) + Niveles 2 al 12 bloqueados
const ROUTE_NODES: RouteNode[] = [
  // Nivel 1 - 4 Nodos Activos interconectados
  {
    id: 'node-1-1',
    level: 1,
    title: 'Pueblo Primavera: Bootstrapping',
    badgeName: 'Terminal Shell',
    leader: 'Profesor Elm',
    isUnlocked: true,
    isCompleted: true,
    coords: { x: 15, y: 75 },
    islandName: 'Isla Raíz',
  },
  {
    id: 'node-1-2',
    level: 1,
    title: 'Ruta 29: Variables y Lógica',
    badgeName: 'Algoritmos I',
    leader: 'Joven Chano',
    isUnlocked: true,
    isCompleted: true,
    coords: { x: 30, y: 55 },
    islandName: 'Sendero Verde',
  },
  {
    id: 'node-1-3',
    level: 1,
    title: 'Ciudad Cerezo: Supabase DB & SQL',
    badgeName: 'Guardián Tabular',
    leader: 'Guía Turístico Cyber',
    isUnlocked: true,
    isCompleted: false,
    coords: { x: 50, y: 65 },
    islandName: 'Bahía de Datos',
  },
  {
    id: 'node-1-4',
    level: 1,
    title: 'Gimnasio Malva: Medalla Céfiro',
    badgeName: 'Medalla Céfiro',
    leader: 'Pegaso (Líder IA)',
    isUnlocked: true,
    isCompleted: false,
    coords: { x: 68, y: 40 },
    islandName: 'Torre Bellsprout / Gimnasio',
  },
  // Niveles 2 al 12 Bloqueados
  {
    id: 'lvl-2',
    level: 2,
    title: 'Ciudad Azalea: Medalla Colmena',
    badgeName: 'Medalla Colmena',
    leader: 'Antón (Bugs & Parsers)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 85, y: 50 },
    islandName: 'Pozo Slowpoke',
  },
  {
    id: 'lvl-3',
    level: 3,
    title: 'Ciudad Trigal: Medalla Planicie',
    badgeName: 'Medalla Planicie',
    leader: 'Blanca (State Machines)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 82, y: 22 },
    islandName: 'Metrópolis Trigal',
  },
  {
    id: 'lvl-4',
    level: 4,
    title: 'Ciudad Iris: Medalla Niebla',
    badgeName: 'Medalla Niebla',
    leader: 'Morti (Ghost APIs)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 55, y: 18 },
    islandName: 'Torre Quemada',
  },
  {
    id: 'lvl-5',
    level: 5,
    title: 'Ciudad Olivo: Medalla Mineral',
    badgeName: 'Medalla Mineral',
    leader: 'Jazmín (Microservicios)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 32, y: 20 },
    islandName: 'Faro Cyber',
  },
  {
    id: 'lvl-6',
    level: 6,
    title: 'Ciudad Orquídea: Medalla Tormenta',
    badgeName: 'Medalla Tormenta',
    leader: 'Aníbal (Stress Testing)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 12, y: 35 },
    islandName: 'Remolinos',
  },
  {
    id: 'lvl-7',
    level: 7,
    title: 'Pueblo Caoba: Medalla Glaciar',
    badgeName: 'Medalla Glaciar',
    leader: 'Fredo (Cold Storage)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 38, y: 40 },
    islandName: 'Lago de la Furia',
  },
  {
    id: 'lvl-8',
    level: 8,
    title: 'Ciudad Endrino: Medalla Dragón',
    badgeName: 'Medalla Dragón',
    leader: 'Débora (High Concurrency)',
    isUnlocked: false,
    isCompleted: false,
    coords: { x: 50, y: 42 },
    islandName: 'Guarida Dragón',
  },
];

interface JohtoMapProps {
  onSelectMission?: (node: RouteNode) => void;
}

export const JohtoMap: React.FC<JohtoMapProps> = ({ onSelectMission }) => {
  const [nodes, setNodes] = useState<RouteNode[]>(ROUTE_NODES);
  const [selectedNode, setSelectedNode] = useState<RouteNode | null>(ROUTE_NODES[2]);
  const theme = useTrainerStore((s) => s.theme);
  const openArcadeRoom = useTrainerStore((s) => s.openArcadeRoom);
  const isLight = theme === 'light_gbc';
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);

  // Sincronización en tiempo real con las reglas del SuperAdmin (/admin)
  useEffect(() => {
    const applyLevels = (levels: Record<string, LevelRequirement>) => {
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (levels[n.id]) {
            return {
              ...n,
              isUnlocked: Boolean(levels[n.id].is_unlocked),
            };
          }
          if (n.id === 'node-1-4' && levels['lvl-1']) {
            return {
              ...n,
              isUnlocked: Boolean(levels['lvl-1'].is_unlocked),
            };
          }
          return n;
        })
      );
    };

    getAdminGameRules().then((rules) => {
      if (rules?.levels_requirements) {
        applyLevels(rules.levels_requirements);
      }
    });

    const channel = supabase
      .channel('realtime_admin_game_rules')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_game_rules' },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow?.levels_requirements) {
            applyLevels(newRow.levels_requirements);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mantener actualizado el nodo seleccionado cuando el profesor abra/cierre gimnasios
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find((n) => n.id === selectedNode.id);
      if (updated && updated.isUnlocked !== selectedNode.isUnlocked) {
        setSelectedNode(updated);
      }
    }
  }, [nodes]);

  const handleNodeClick = (node: RouteNode) => {
    soundFx.playClick();
    setSelectedNode(node);
  };

  const handleStartMission = (node: RouteNode) => {
    soundFx.playCoin();
    if (onSelectMission) {
      onSelectMission(node);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col font-mono select-none ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Barra de Contexto del Nivel Activo */}
      <div
        className={`flex items-center justify-between p-3 border-b rounded-t-xl transition-colors ${
          isLight
            ? 'bg-[#FFFFFF] border-black text-slate-900 shadow-sm'
            : 'bg-slate-900/80 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Medalla Céfiro Dorada Giratoria con Framer Motion (Clicable para abrir Medallero) */}
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            onClick={() => {
              soundFx.playCoin();
              setShowBadgesModal(true);
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center justify-center text-slate-950 font-black text-xs cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            title="Ver Estuche Oficial de Medallas"
          >
            <Award className="w-5 h-5 fill-amber-300 text-amber-900" />
          </motion.div>
          <div>
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              <span>Nivel 1 Activo: Gimnasio Malva</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${isLight ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
                Medalla Céfiro
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Conecta los 4 nodos de la red para desbloquear la batalla de gimnasio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <div className={`text-xs font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              2/4 NODOS COMPLETOS
            </div>
            <div className={`w-28 h-1.5 rounded-full mt-1 overflow-hidden border ${isLight ? 'bg-slate-200 border-black' : 'bg-slate-800 border-slate-700'}`}>
              <div className="w-1/2 h-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            </div>
          </div>

          {/* Botón Acceso al Medallero 3D */}
          <button
            onClick={() => {
              soundFx.playCoin();
              setShowBadgesModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isLight
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] active:scale-95'
            }`}
            title="Abrir Estuche de Medallas Oficial"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span className="hidden xs:inline">MEDALLERO</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              openArcadeRoom();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isLight
                ? 'bg-[#E60012] hover:bg-[#cc0010] text-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(34,197,94,0.6)] active:scale-95'
            }`}
            title="Entrar a la Sala Arcade GBA"
          >
            <Gamepad2 className="w-4 h-4 animate-bounce" />
            <span>SALA ARCADE</span>
          </button>
        </div>
      </div>

      {/* Lienzo del Mapa Visual Interactivo */}
      <div className="flex-1 relative bg-[#090e1a] overflow-hidden min-h-[380px] p-4 flex items-center justify-center border-x border-slate-800">
        {/* Grilla Cibernética de Fondo */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#06b6d4 1px, transparent 1px), radial-gradient(#22c55e 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px'
          }}
        />

        {/* Cables de Neón SVG entre los 4 Nodos del Nivel 1 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="lockedCable" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Cable 1 -> 2 (Completado: Neón verde encendido) */}
          <line
            x1="15%" y1="75%" x2="30%" y2="55%"
            stroke="url(#neonGreen)"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Cable 2 -> 3 (Completado: Neón verde encendido) */}
          <line
            x1="30%" y1="55%" x2="50%" y2="65%"
            stroke="url(#neonGreen)"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Cable 3 -> 4 (En progreso: Cable brillante cian) */}
          <line
            x1="50%" y1="65%" x2="68%" y2="40%"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeDasharray="4 2"
          />

          {/* Conexión al resto bloqueado (Gris apagado) */}
          <line x1="68%" y1="40%" x2="85%" y2="50%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="85%" y1="50%" x2="82%" y2="22%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="82%" y1="22%" x2="55%" y2="18%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="55%" y1="18%" x2="32%" y2="20%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="32%" y1="20%" x2="12%" y2="35%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="12%" y1="35%" x2="38%" y2="40%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="38%" y1="40%" x2="50%" y2="42%" stroke="url(#lockedCable)" strokeWidth="2" strokeDasharray="3 3" />
        </svg>

        {/* Nodos Interactivos con Framer Motion */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isLocked = !node.isUnlocked;

          return (
            <div
              key={node.id}
              style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              {isLocked ? (
                // Silueta Oscura con Candado Metálico Brillante (Niveles 2 al 12)
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleNodeClick(node)}
                  className={`w-10 h-10 rounded-xl bg-slate-950/80 border-2 border-slate-800 flex flex-col items-center justify-center shadow-lg cursor-not-allowed group relative ${
                    isSelected ? 'ring-2 ring-slate-500' : ''
                  }`}
                  title={`${node.title} (Bloqueado)`}
                >
                  <Lock className="w-4 h-4 text-slate-500 group-hover:text-amber-400/80 transition-colors" />
                  <span className="text-[8px] font-bold text-slate-600 mt-0.5">Lv.{node.level}</span>
                </motion.div>
              ) : (
                // Pin Interactivo del Nivel 1 con Rebote Framer Motion
                <motion.button
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    isSelected
                      ? { y: [0, -6, 0] }
                      : node.isCompleted
                      ? {}
                      : { y: [0, -4, 0] }
                  }
                  transition={{ repeat: Infinity, duration: isSelected ? 1.5 : 2.5 }}
                  onClick={() => handleNodeClick(node)}
                  className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                    node.isCompleted
                      ? 'bg-gradient-to-tr from-emerald-700 to-emerald-500 border-2 border-emerald-300 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                      : isSelected
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-2 border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                      : 'bg-slate-900 border-2 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  }`}
                >
                  {node.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-400 text-slate-950" />
                  ) : node.id === 'node-1-4' ? (
                    <Award className="w-5 h-5 text-amber-300 animate-pulse" />
                  ) : (
                    <Zap className="w-5 h-5 fill-current" />
                  )}

                  {/* Corona de selección */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                  )}
                </motion.button>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel Inferior: Información del Nodo Seleccionado */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-3.5 bg-slate-900 border-t border-slate-800 rounded-b-xl flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                selectedNode.isUnlocked
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                {selectedNode.isUnlocked ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{selectedNode.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    selectedNode.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : selectedNode.isUnlocked
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {selectedNode.isCompleted ? '✓ COMPLETADO' : selectedNode.isUnlocked ? 'ACTIVO' : 'BLOQUEADO'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Zona: <strong className="text-slate-300">{selectedNode.islandName}</strong> · Oponente:{' '}
                  <strong className="text-slate-300">{selectedNode.leader}</strong>
                </div>
              </div>
            </div>

            {selectedNode.isUnlocked ? (
              <button
                onClick={() => handleStartMission(selectedNode)}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                {selectedNode.level > 1 || selectedNode.id === 'node-1-4' ? (
                  <>
                    <Swords className="w-4 h-4 fill-current" />
                    <span>Desafiar Líder (6 Pokémon) (+15m 🔋)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Misión (+15m 🔋)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2 max-w-md">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <span>
                  <strong>GIMNASIO CERRADO POR EL PROFESOR:</strong> El acceso a este combate está restringido en el aula. Resuelve tus ejercicios de código para que el docente autorice el desafío.
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Interactivo del Estuche de Medallas (Nintendo Visual UI) */}
      <AnimatePresence>
        {showBadgesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <GymBadgeShowcase onClose={() => setShowBadgesModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
