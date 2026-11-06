'use client';

import React from 'react';
import { 
  Coins, 
  Zap, 
  Clock, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Lock,
  Package
} from 'lucide-react';
import { POKEMON_ASSETS } from '@/lib/pokemonAssets';
import { soundFx } from '@/lib/soundFx';

interface GoldenrodVaultChestProps {
  pendingGold: number;
  pendingBattery: number;
  completedTasks: number;
  totalTasks: number;
  timeUntilMidnight: string;
  party: any[];
  onOpenVault: () => void;
}

export function GoldenrodVaultChest({
  pendingGold,
  pendingBattery,
  completedTasks,
  totalTasks,
  timeUntilMidnight,
  party,
  onOpenVault,
}: GoldenrodVaultChestProps) {
  return (
    <aside className="w-[320px] shrink-0 space-y-4 select-none">
      {/* 1. Módulo Acorazado: Caja Fuerte del Banco de Trigal (Alijo de Medianoche) */}
      <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_3px_0_#DCD8CD] space-y-3 relative overflow-hidden">
        {/* Cabecera del Banco */}
        <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#C59B46]/10 border border-[#C59B46]/25 text-[#9A7025]">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <span className="font-mono text-xs font-bold text-[#1C1B18] tracking-tight block leading-none">
                Caja Fuerte de Trigal
              </span>
              <span className="text-[9.5px] font-mono text-[#706E66]">Alijo Diario de Medianoche</span>
            </div>
          </div>

          <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF4E8] text-[#9A7025] border border-[#C59B46]/30">
            BOVEDA ACTIVA
          </span>
        </div>

        {/* Acumulador de Recursos Ganados Hoy */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Ficha de Pokédólares */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#FAF4E8] to-[#FFFDF7] border border-[#C59B46]/30 shadow-2xs">
            <div className="flex items-center justify-between text-[#9A7025] mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Oro Botín</span>
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-mono font-bold text-[#1C1B18] tabular-nums block">
              +{pendingGold.toLocaleString('es-CO')} ₽
            </span>
            <span className="text-[9px] font-mono text-[#706E66] block mt-0.5">Pendiente de cierre</span>
          </div>

          {/* Celda de Batería de Flujo */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#EEF4FB] to-[#FAF9F5] border border-[#2D68C4]/25 shadow-2xs">
            <div className="flex items-center justify-between text-[#2D68C4] mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Batería</span>
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-lg font-mono font-bold text-[#1C1B18] tabular-nums block">
              +{pendingBattery} min
            </span>
            <span className="text-[9px] font-mono text-[#706E66] block mt-0.5">Tiempo desbloqueado</span>
          </div>
        </div>

        {/* Reloj de Liquidación de Medianoche */}
        <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E1D8] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#706E66]">
            <Clock className="w-3.5 h-3.5 text-[#C59B46]" />
            <span className="text-[10.5px]">Liquidación en:</span>
          </div>
          <span className="font-bold text-[#1C1B18] tabular-nums">
            {timeUntilMidnight || '00:00:00'}
          </span>
        </div>

        {/* Barra de sellado del día */}
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between text-[10px] font-mono text-[#706E66]">
            <span>Misiones consumadas</span>
            <span className="font-bold text-[#1C1B18]">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-1.5 w-full bg-[#EAE7DF] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2E8555] rounded-full transition-all duration-500"
              style={{
                width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Vitrina Técnica del Equipo de Heart & Soul */}
      <div className="bg-white border border-[#E4E1D8] rounded-2xl p-4 shadow-[0_3px_0_#DCD8CD] space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#C59B46]" />
            <span className="text-xs font-mono font-bold text-[#1C1B18]">
              Equipo en ROM ({party.length}/6)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenVault();
            }}
            className="text-[10px] font-mono font-bold text-[#2D68C4] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver PC Box 1</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {party.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-dashed border-[#E4E1D8] text-center text-[10.5px] font-mono text-[#706E66]">
            Captura en la ROM de Pokémon Heart & Soul para sincronizar tu equipo en vivo.
          </div>
        ) : (
          <div className="space-y-2">
            {party.slice(0, 6).map((pkmn: any, idx: number) => {
              const maxHp = pkmn.maxHp || 35;
              const curHp = pkmn.hp || 35;
              const hpPct = Math.min(100, Math.round((curHp / maxHp) * 100));

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#E4E1D8] flex items-center gap-2.5 transition-all shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={POKEMON_ASSETS.getBoxIcon(pkmn.speciesId || 179)}
                    alt={pkmn.name || 'Pokemon'}
                    className="h-7 w-7 object-contain shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#1C1B18] truncate uppercase">
                        {pkmn.name || 'Pokemon'}
                      </span>
                      <span className="font-mono text-[9.5px] text-[#706E66] font-bold">
                        NV. {pkmn.level || 1}
                      </span>
                    </div>
                    {/* Barra de PS */}
                    <div className="h-1 w-full bg-[#EAE7DF] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${hpPct}%`,
                          backgroundColor:
                            hpPct > 50 ? '#2E8555' : hpPct > 20 ? '#C59B46' : '#D9383A',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
