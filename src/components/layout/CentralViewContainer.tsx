'use client';

import React, { useState } from 'react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { ActiveTab } from '@/types/trainer';
import { Map, Gamepad, Swords, ShoppingBag, Crown, Layers, Users, BookOpen, Sparkles, Award } from 'lucide-react';
import { JohtoMap } from '@/components/dashboard/JohtoMap';
import { PartyPcManager } from '@/components/dashboard/PartyPcManager';
import { CyberPokedexView } from '@/components/dashboard/CyberPokedexView';
import { TrainerTuningStudio } from '@/components/tuning/TrainerTuningStudio';
import { BattleTrivia } from '@/components/minigames/BattleTrivia';
import { AiRivalFace } from '@/components/rival/AiRivalFace';
import { LiveArena } from '@/components/arena/LiveArena';
import { GoldenrodShop } from '@/components/shop/GoldenrodShop';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { MissionSubmitModal } from '@/components/dashboard/MissionSubmitModal';
import { GymBadgeShowcase } from '@/components/dashboard/GymBadgeShowcase';
import { soundFx } from '@/lib/soundFx';

const TABS: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'map', label: 'Mapa Johto', icon: Map },
  { id: 'party', label: 'Mi Equipo & PC', icon: Users },
  { id: 'pokedex', label: 'Cyber-Pokédex', icon: BookOpen },
  { id: 'tuning', label: 'Taller Tuning', icon: Sparkles },
  { id: 'minigames', label: 'Combate Trivia', icon: Gamepad },
  { id: 'arena', label: 'Arena Rival', icon: Swords },
  { id: 'shop', label: 'Tienda Poké', icon: ShoppingBag },
  { id: 'admin', label: 'SuperAdmin', icon: Crown },
];

export const CentralViewContainer: React.FC = () => {
  const activeTab = useTrainerStore((s) => s.activeTab);
  const setActiveTab = useTrainerStore((s) => s.setActiveTab);
  const theme = useTrainerStore((s) => s.theme);
  const isLight = theme === 'light_gbc';

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [activeMission, setActiveMission] = useState<{ id: string; title: string }>({
    id: 'LVL1_ZEPHYR_GYM',
    title: 'Gimnasio Malva - Medalla Céfiro',
  });

  const handleTabChange = (tab: ActiveTab) => {
    soundFx.playClick();
    setActiveTab(tab);
  };

  const handleSelectMissionFromMap = (node: any) => {
    setActiveMission({ id: node.id, title: node.title });
    setIsModalOpen(true);
  };

  return (
    <div
      className={`w-full h-full flex flex-col rounded-xl overflow-hidden font-mono transition-colors duration-250 ${
        isLight
          ? 'bg-[#FFFFFF] border-4 border-black shadow-[4px_4px_0_#000] text-slate-900'
          : 'bg-[#0b101d] border-2 border-slate-700/80 shadow-2xl text-slate-100'
      }`}
    >
      {/* Navegación por Pestañas Centrales */}
      <div
        className={`flex items-center justify-between px-2 pt-2 gap-1 transition-colors duration-200 ${
          isLight ? 'bg-[#EAE6DD] border-b-2 border-black' : 'bg-[#0d1424] border-b-2 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all cursor-pointer border-t-2 border-x-2 ${
                  isActive
                    ? isLight
                      ? 'bg-[#FFFFFF] border-black text-[#E60012] font-black -mb-[2px] z-10 shadow-[2px_-2px_0_#000]'
                      : 'bg-[#0b101d] border-amber-500/80 text-amber-300 shadow-[0_-2px_10px_rgba(245,158,11,0.15)] -mb-[2px] z-10'
                    : isLight
                      ? 'bg-transparent border-transparent text-slate-700 hover:text-black hover:bg-black/5'
                      : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? isLight
                        ? 'text-[#E60012]'
                        : 'text-amber-400'
                      : isLight
                        ? 'text-slate-500'
                        : 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Acceso Rápido al Medallero Oficial */}
        <button
          onClick={() => {
            soundFx.playCoin();
            setIsBadgesModalOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 mb-1 mr-1 rounded-lg text-xs font-black transition-all cursor-pointer border shrink-0 ${
            isLight
              ? 'bg-amber-400 hover:bg-amber-500 text-black border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95'
          }`}
          title="Ver Estuche de Medallas Oficial"
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Medallas</span>
        </button>
      </div>

      {/* Contenedor de Vistas Dinámicas */}
      <div className="flex-1 p-3 sm:p-5 overflow-y-auto">
        {/* Pestaña 1: Mapa Visual de Johto */}
        {activeTab === 'map' && (
          <div className="h-full flex flex-col">
            <JohtoMap onSelectMission={handleSelectMissionFromMap} />
          </div>
        )}

        {/* Pestaña 2: Mi Equipo Activo & PC Box 1 */}
        {activeTab === 'party' && (
          <div className="h-full flex flex-col">
            <PartyPcManager />
          </div>
        )}

        {/* Pestaña 3: Cyber-Pokédex Nacional */}
        {activeTab === 'pokedex' && (
          <div className="h-full flex flex-col">
            <CyberPokedexView />
          </div>
        )}

        {/* Pestaña 4: Taller de Tuning Dúo (Entrenador + Pokémon) */}
        {activeTab === 'tuning' && (
          <div className="h-full flex flex-col">
            <TrainerTuningStudio />
          </div>
        )}

        {/* Pestaña 5: Combate de Trivia Visual */}
        {activeTab === 'minigames' && (
          <div className="h-full flex flex-col">
            <BattleTrivia />
          </div>
        )}

        {/* Pestaña 5: Arena de Sábados y Sincronización de 3 Cables */}
        {activeTab === 'arena' && (
          <div className="h-full flex flex-col gap-4">
            <LiveArena roomPin="JOHT" squadId="squad_1" />
            <AiRivalFace
              initialSeconds={1500}
              initialMessage="¡El Raid de los Sábados ha comenzado! Conecten sus 3 cables antes de que sobrecargue el sistema."
            />
          </div>
        )}

        {/* Pestaña 6: Tienda Poké de Ciudad Trigal */}
        {activeTab === 'shop' && (
          <div className="h-full flex flex-col">
            <GoldenrodShop />
          </div>
        )}

        {/* Pestaña 7: Torre de Control SuperAdmin */}
        {activeTab === 'admin' && (
          <div className="h-full flex flex-col">
            <SuperAdminDashboard />
          </div>
        )}
      </div>

      {/* Modal de Entrega con Medidor de Maestría */}
      <MissionSubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missionId={activeMission.id}
        missionTitle={activeMission.title}
      />

      {/* Modal Interactivo de Medallas */}
      {isBadgesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <GymBadgeShowcase onClose={() => setIsBadgesModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
