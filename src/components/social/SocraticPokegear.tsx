'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Bot, 
  HelpCircle, 
  Zap, 
  ChevronRight,
  BatteryCharging
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';

export const SocraticPokegear: React.FC = () => {
  const grantRewardRpc = useTrainerStore((s) => s.grantActivityRewardRpc);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [currentHint, setCurrentHint] = useState<string>(
    '¿Qué error te reporta la consola de tu navegador o el terminal?'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasResolved, setHasResolved] = useState<boolean>(false);
  const [floatingReward, setFloatingReward] = useState<boolean>(false);

  const handleAskPokegear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    soundFx.playClick();
    setIsLoading(true);
    const query = inputQuery;
    setInputQuery('');
    setHasResolved(false);

    try {
      const res = await fetch('/api/ai-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: 'Tutoría socrática para resolver bugs',
          persona: 'pokegear',
        }),
      });
      const data = await res.json();
      if (data?.message) {
        soundFx.playDialogBeep();
        setCurrentHint(data.message);
      }
    } catch {
      setCurrentHint('Verifica tu conexión y revisa los tipos de datos en TypeScript.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimResolved = async () => {
    if (hasResolved) return;
    soundFx.playCoin();
    setHasResolved(true);
    setFloatingReward(true);

    // Otorgar recompensa atómica en Supabase RPC por arreglar error con el tutor
    await grantRewardRpc('pokegear_fix');

    setTimeout(() => {
      setFloatingReward(false);
    }, 2000);
  };

  return (
    <div className="w-full bg-[#0d1424] border-2 border-amber-500/60 rounded-xl p-3 shadow-xl font-mono text-slate-100 flex flex-col gap-3 relative overflow-hidden">
      {/* Cabecera del Pokégear */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              CANAL DE AYUDA (LUN - VIE)
            </span>
            <span className="text-xs font-bold text-slate-100">Pokégear Socrático</span>
          </div>
        </div>
        <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
          SOCRATIC IA
        </span>
      </div>

      {/* Pista Socrática Actual en Cuadro RPG */}
      <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-lg min-h-[52px] flex items-center gap-2.5 relative">
        <Bot className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-xs text-slate-200 font-bold leading-relaxed line-clamp-2">
          &ldquo;{currentHint}&rdquo;
        </p>

        {/* Recompensa Flotante */}
        {floatingReward && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: -40 }}
            transition={{ duration: 1.8 }}
            className="absolute right-3 top-0 z-30 font-black text-xs text-amber-300 flex items-center gap-1 bg-amber-950/90 border border-amber-400 px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)]"
          >
            <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
            <span>+25 ₽ · +15m 🔋</span>
          </motion.div>
        )}
      </div>

      {/* Botón de Confirmación: "¡Solucioné mi error gracias a la pista!" */}
      <button
        onClick={handleClaimResolved}
        disabled={hasResolved}
        className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
          hasResolved
            ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 cursor-default'
            : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:border-amber-400'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>
          {hasResolved ? '✓ ¡Error Resuelto! Recompensa Cobrada' : '¡Solucioné mi error con esta pista!'}
        </span>
      </button>

      {/* Formulario de Consulta */}
      <form onSubmit={handleAskPokegear} className="flex gap-1.5 pt-1">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Pide una pista conceptual a Oak-AI..."
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
