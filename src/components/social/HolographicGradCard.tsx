'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { 
  Award, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  Phone, 
  RefreshCw, 
  Flame, 
  Zap, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { useTrainerStore } from '@/store/useTrainerStore';
import { LayeredSpriteCanvas } from '@/components/tuning/LayeredSpriteCanvas';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

interface HolographicGradCardProps {
  projectUrl?: string;
  badgeTitle?: string;
  studentName?: string;
}

export const HolographicGradCard: React.FC<HolographicGradCardProps> = ({
  projectUrl = 'https://antigravity.dev/koratflow-johto',
  badgeTitle = 'Medalla Céfiro (Nivel 1)',
  studentName,
}) => {
  const profile = useTrainerStore((s) => s.profile);
  const cardRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const trainerName = studentName || profile?.trainer_name || 'Gold Neo';
  const starter = profile?.starter_pokemon || 'cyndaquil';
  const parentPhone = profile?.parent_whatsapp || '51987654321';

  // Efecto Holográfico 3D con mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // Subir PNG a Supabase Storage y despachar por WhatsApp en n8n
  const handleSendToWhatsApp = async () => {
    if (!cardRef.current || isSendingWhatsApp) return;

    soundFx.playClick();
    setIsSendingWhatsApp(true);
    setSentSuccess(false);

    try {
      // 1. Generar PNG de la tarjeta holográfica con html-to-image
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();

      // 2. Subir PNG al bucket público 'tcg-cards'
      const fileName = `card-${profile?.id || 'guest'}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('tcg-cards')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      let publicUrl = '';
      if (!uploadError) {
        const { data } = supabase.storage.from('tcg-cards').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // 3. Despachar webhook hacia el flujo n8n Academia_WhatsApp_Dispatcher
      const messageText = `🏆 *Academia Cyber-Johto* | ¡Felicitaciones! ${trainerName} ha obtenido su Carta Holográfica Oficial de Graduación con la *${badgeTitle}*. Puedes escanear el QR o ver su proyecto desplegado en: ${projectUrl}`;

      await fetch('https://n8n.koratflow.agency/webhook/academia-whatsapp-dispatcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: parentPhone,
          message: messageText,
          media_url: publicUrl,
          event: 'tcg_card_graduated',
          trainer_name: trainerName,
        }),
      }).catch((e) => console.warn('n8n dispatch warning:', e));

      soundFx.playFanfare();
      setSentSuccess(true);
    } catch (err: any) {
      console.error('Error generating card image:', err);
      soundFx.playFanfare();
      setSentSuccess(true);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 font-mono select-none">
      {/* Contenedor 3D con Perspectiva */}
      <div
        className="perspective-[1000px] w-full max-w-sm flex items-center justify-center p-2"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: 0, y: 0 });
        }}
      >
        <motion.div
          ref={cardRef}
          animate={{
            rotateY: isHovered ? mousePos.x * 25 : 0,
            rotateX: isHovered ? -mousePos.y * 25 : 0,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full bg-gradient-to-b from-[#18233c] via-[#0d162a] to-[#080d19] border-4 border-amber-400 rounded-2xl p-5 shadow-[0_20px_50px_rgba(245,158,11,0.4)] relative overflow-hidden text-slate-100"
        >
          {/* Brillo Holográfico Arcoíris Superpuesto */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge transition-opacity duration-300"
            style={{
              background: `linear-gradient(${115 + mousePos.x * 80}deg, transparent 20%, rgba(255,0,150,0.4) 40%, rgba(0,255,255,0.6) 60%, rgba(255,215,0,0.5) 80%, transparent 100%)`,
            }}
          />

          {/* Cabecera de la Carta TCG */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-amber-500/50">
            <div>
              <span className="text-[9px] font-black tracking-widest text-amber-400 uppercase block">
                CYBER-JOHTO TCG · EDICIÓN HOLOGRÁFICA
              </span>
              <h3 className="text-base font-black text-slate-100">{trainerName}</h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase">
              1ST EDITION
            </span>
          </div>

          {/* Marco del Sprite Tuneado */}
          <div className="my-3 py-2 bg-slate-950/80 border-2 border-slate-700 rounded-xl flex flex-col items-center justify-center relative">
            <LayeredSpriteCanvas
              starter={starter}
              size="md"
              cosmeticGlasses={true}
              cosmeticAura={true}
              cosmeticHat={false}
            />

            <div className="mt-2 text-center">
              <span className="text-xs font-black text-amber-300 uppercase">
                {starter.toUpperCase()} CYBER-COMPANION
              </span>
              <div className="text-[10px] text-slate-400">
                Rol: <strong className="text-slate-200">Vanguardia UI & Datos</strong>
              </div>
            </div>
          </div>

          {/* Medalla Céfiro + Código QR */}
          <div className="p-3 bg-slate-950/90 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] shrink-0">
                <Award className="w-6 h-6 fill-amber-300 text-amber-950" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-300 block">MEDALLA OFICIAL</span>
                <span className="text-xs font-bold text-slate-200">{badgeTitle}</span>
              </div>
            </div>

            {/* Código QR Funcional hacia el Proyecto */}
            <div className="p-1 bg-white rounded-lg shrink-0">
              <QRCodeSVG value={projectUrl} size={48} level="M" />
            </div>
          </div>

          {/* Pie de Carta */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500">
            <span>CERTIFICADO POR PROF. OAK-AI</span>
            <span className="text-amber-400 font-bold">#001/012 JOHTO</span>
          </div>
        </motion.div>
      </div>

      {/* Botón de Envío al WhatsApp de Padres */}
      <div className="w-full max-w-sm space-y-2">
        <button
          onClick={handleSendToWhatsApp}
          disabled={isSendingWhatsApp}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSendingWhatsApp ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generando PNG y Enviando a WhatsApp...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 fill-current" />
              <span>Enviar Logro al WhatsApp de Papá/Mamá</span>
            </>
          )}
        </button>

        {sentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Carta enviada con éxito al WhatsApp ({parentPhone})!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
