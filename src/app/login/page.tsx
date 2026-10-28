'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, ShieldCheck, Waves } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';
import { HQ_ROLE_LIST } from '@/lib/hqRoles';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/hq');
    });
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    soundFx.playClick();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      soundFx.playDamage();
      setError(authError.message);
      setLoading(false);
      return;
    }

    soundFx.playLevelUp();
    router.replace('/hq');
  };

  return (
    <div className="hq-shell flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex flex-col justify-between overflow-hidden border-b border-[#E8E5DD] bg-[#F4F1EA] px-6 py-8 lg:w-[46%] lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D97043]/25 bg-[#D97043]/10 text-[#D97043]">
            <Waves className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <span className="hq-title block text-sm font-semibold text-[#1F1E1B]">
              Korat Flow HQ
            </span>
            <span className="hq-mono block text-[10px] text-[#8A877E]">Founder Console</span>
          </div>
        </div>

        <div className="my-10 max-w-md lg:my-0">
          <span className="hq-chip">
            <ShieldCheck className="h-3 w-3 text-[#5A7D62]" />
            Acceso privado · sesión única
          </span>
          <h1 className="hq-title mt-4 text-3xl leading-tight text-[#1F1E1B] sm:text-4xl">
            Un rol a la vez.
            <br />
            <span className="italic text-[#D97043]">Cero multitasking.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#5E5C56]">
            El panel operativo del fundador: jornada, proyectos, academia y recompensas en un solo lugar.
          </p>

          <div className="mt-6 space-y-2">
            {HQ_ROLE_LIST.map((role) => (
              <div
                key={role.key}
                className="flex items-center gap-3 rounded-xl border border-[#E8E5DD] bg-white/70 px-3 py-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: role.accent }}
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#1F1E1B]">
                    {role.label} · {role.title}
                  </span>
                  <span className="block truncate text-[11px] text-[#8A877E]">{role.mission}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="hq-mono text-[10px] uppercase tracking-widest text-[#8A877E]">
          Korat Flow © 2026
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-6">
            <span className="hq-label">Entrar al HQ</span>
            <h2 className="hq-title mt-1 text-2xl text-[#1F1E1B]">Bienvenido de vuelta</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5E5C56]">
              Usa tu cuenta de fundador. No hay registro público.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="email" className="hq-label mb-1.5 block">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="hq-input"
                placeholder="founder@koratflow.agency"
              />
            </div>

            <div>
              <label htmlFor="password" className="hq-label mb-1.5 block">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="hq-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-[#D9534F]/30 bg-[#D9534F]/10 px-3 py-2 text-[11px] text-[#B2403C]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="hq-btn hq-btn-primary mt-5 w-full py-3"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Verificando…' : 'Entrar'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8A877E]">
            Si perdiste el acceso, restablece la cuenta desde Supabase Auth.
          </p>
        </form>
      </section>
    </div>
  );
}
