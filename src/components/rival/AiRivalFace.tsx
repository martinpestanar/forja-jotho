'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, Send, Volume2, VolumeX, Sparkles, Radio } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface AiRivalFaceProps {
  initialSeconds?: number;
  initialMessage?: string;
  onTimerEnd?: () => void;
}

export const AiRivalFace: React.FC<AiRivalFaceProps> = ({
  initialSeconds = 180,
  initialMessage = '¿Crees que puedes ganarme? Demuéstralo antes de que se agote el tiempo.',
  onTimerEnd,
}) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [targetMessage, setTargetMessage] = useState<string>(initialMessage);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Temporizador Gigante Estilo Arcade
  useEffect(() => {
    if (seconds <= 0) {
      if (onTimerEnd) onTimerEnd();
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, onTimerEnd]);

  // 2. Animación de ojos parpadeantes
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // 3. Web Speech API con voz de rival
  const speakMessage = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 0.9;
      utterance.lang = 'es-ES';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  // 4. Efecto Máquina de Escribir (Typewriter) con sonido bip-bip retro y TTS
  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < targetMessage.length) {
        setDisplayedText(targetMessage.substring(0, idx + 1));
        if (idx % 2 === 0) {
          soundFx.playDialogBeep();
        }
        idx++;
      } else {
        clearInterval(interval);
        speakMessage(targetMessage);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [targetMessage, speakMessage]);

  const handleAskSilver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;

    soundFx.playClick();
    setIsLoading(true);
    const query = inputMsg;
    setInputMsg('');

    try {
      const res = await fetch('/api/ai-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: query, 
          context: `Tiempo restante: ${seconds}s`,
          persona: 'silver'
        }),
      });
      const data = await res.json();
      if (data?.message) {
        setTargetMessage(data.message);
      }
    } catch {
      setTargetMessage('¡Falla en el bus de datos! Vuelve a intentar tu consulta.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLowTime = seconds <= 60;
  const timePct = Math.max(0, Math.min(100, (seconds / initialSeconds) * 100));
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-[#0a0f1d] border-4 border-slate-900 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-mono text-slate-100 flex flex-col gap-3 relative overflow-hidden">
      {/* Barra de Tiempo Arcade con transición de color (Verde -> Rojo a 60s) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Timer className={`w-4 h-4 ${isLowTime ? 'text-rose-500 animate-spin' : 'text-emerald-400'}`} />
            <span>CRONÓMETRO DE ARENA (SÁBADOS & TIKTOK)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setVoiceEnabled((v) => !v);
                if (voiceEnabled && typeof window !== 'undefined') {
                  window.speechSynthesis?.cancel();
                }
              }}
              className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={voiceEnabled ? 'Voz activada' : 'Voz silenciada'}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <span
              className={`text-sm tracking-widest ${
                isLowTime ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400 font-bold'
              }`}
            >
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
          <motion.div
            className={`h-full transition-colors duration-500 ${
              isLowTime
                ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
            }`}
            style={{ width: `${timePct}%` }}
          />
        </div>
      </div>

      {/* Monitor Biselado de Código Silver con Ondas de Voz y Ojos Parpadeantes */}
      <div className="flex gap-3 items-center bg-slate-950/80 border-2 border-slate-800 rounded-xl p-3 shadow-inner">
        {/* Rostro Pixel-Art Reactivo */}
        <div className="w-16 h-16 shrink-0 bg-[#160d1b] border-2 border-rose-500/60 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_10px_rgba(244,63,94,0.3)]">
          {/* Cabello Rojo de Silver */}
          <div className="absolute top-1 w-10 h-3 bg-rose-600 rounded-t-sm" />

          {/* Ojos Parpadeantes */}
          <div className="flex gap-3 z-10 mt-1">
            <motion.div
              animate={{ scaleY: isBlinking ? 0.1 : 1 }}
              transition={{ duration: 0.1 }}
              className="w-2.5 h-2.5 bg-cyan-400 rounded-xs shadow-[0_0_6px_rgba(6,182,212,1)]"
            />
            <motion.div
              animate={{ scaleY: isBlinking ? 0.1 : 1 }}
              transition={{ duration: 0.1 }}
              className="w-2.5 h-2.5 bg-cyan-400 rounded-xs shadow-[0_0_6px_rgba(6,182,212,1)]"
            />
          </div>

          {/* Boca reactiva / Ondas de Voz */}
          <motion.div
            animate={isSpeaking ? { height: [2, 6, 2], scaleX: [0.8, 1.2, 0.8] } : { height: 2, scaleX: 1 }}
            transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.2 }}
            className="w-5 bg-rose-400 rounded-full mt-2.5 opacity-90 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
          />
        </div>

        {/* Cuadro de Diálogo Estilo RPG Game Boy (Máximo 2 líneas de texto) */}
        <div className="flex-1 bg-[#0b1322] border border-cyan-500/40 rounded-lg p-2.5 min-h-[64px] flex flex-col justify-center relative">
          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>CÓDIGO SILVER:</span>
              {isSpeaking && <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />}
            </span>
            <span className="text-[9px] text-slate-500">RPG DIALOG</span>
          </div>
          <p className="text-xs sm:text-[13px] font-bold text-slate-100 leading-snug line-clamp-2 min-h-[36px]">
            &ldquo;{displayedText}&rdquo;
            <span className="inline-block w-2 h-3 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </div>

      {/* Input de Consulta al Rival */}
      <form onSubmit={handleAskSilver} className="flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Desafía a Silver o pide una pista técnica..."
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-cyan-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMsg.trim()}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
