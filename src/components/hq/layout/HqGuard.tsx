'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Waves } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function HqGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        setStatus('anonymous');
        router.replace('/login');
        return;
      }

      // Blindaje de Seguridad: Verificar si es Administrador / Fundador
      try {
        const { data: profile } = await supabase
          .from('valdr_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!mounted) return;

        // Si no es admin, expulsar al dashboard de jugador
        if (!profile?.is_admin) {
          router.replace('/dashboard');
          return;
        }

        setStatus('authenticated');
      } catch {
        // En caso de fallo o perfil de usuario normal, expulsar a dashboard
        if (!mounted) return;
        router.replace('/dashboard');
      }
    };

    checkAccess();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setStatus('anonymous');
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  if (status !== 'authenticated') {
    return (
      <div className="hq-shell flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
            <Waves className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <span className="hq-mono text-[11px] uppercase tracking-widest text-[#8A877E]">
            {status === 'anonymous' ? 'Redirigiendo al acceso…' : 'Verificando credenciales de fundador…'}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
