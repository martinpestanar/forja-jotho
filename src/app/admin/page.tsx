'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { soundFx } from '@/lib/soundFx';
import { useTrainerStore } from '@/store/useTrainerStore';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const theme = useTrainerStore((s) => s.theme);
  const profile = useTrainerStore((s) => s.profile);
  const setProfile = useTrainerStore((s) => s.setProfile);
  const isLight = theme === 'light_gbc';

  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      // 1. Si el perfil en store ya es admin verificado
      if (profile?.is_admin) {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }

      // 2. Comprobar sesión de Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profData?.is_admin) {
        setProfile(profData as any);
        setIsAuthorized(true);
      } else {
        router.push('/admin/login');
      }
      setIsVerifying(false);
    }

    checkAdminAuth();
  }, [profile, router, setProfile]);

  if (isVerifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-mono ${
        isLight ? 'bg-[#F4F1EA] text-black' : 'bg-[#080c14] text-amber-400'
      }`}>
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-500/50 bg-slate-900/60 animate-pulse">
          <ShieldAlert className="w-5 h-5 animate-spin" />
          <span className="text-sm font-bold">Verificando credenciales de SuperAdmin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      data-theme={theme}
      className={`min-h-screen h-screen flex flex-col font-mono select-none overflow-hidden ${
        isLight ? 'bg-[#F4F1EA] text-slate-900' : 'bg-[#080c14] text-slate-100'
      }`}
    >
      {/* Botón flotante para regresar al Taller / Dashboard */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-[#FFFFFF] border-black' : 'bg-[#121829] border-slate-800'
        }`}
      >
        <Link
          href="/"
          onClick={() => soundFx.playClick()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
            isLight
              ? 'bg-slate-200 hover:bg-slate-300 text-black border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER AL TALLER</span>
        </Link>

        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          🔐 Acceso Restringido a Profesores
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <SuperAdminDashboard />
      </div>
    </div>
  );
}
