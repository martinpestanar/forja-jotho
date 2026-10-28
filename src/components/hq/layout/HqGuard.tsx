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

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setStatus('authenticated');
      } else {
        setStatus('anonymous');
        router.replace('/login');
      }
    });

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
            {status === 'anonymous' ? 'Redirigiendo al acceso…' : 'Abriendo el HQ…'}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
