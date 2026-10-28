'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Eye,
  Heart,
  Inbox,
  Link2,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, EmptyState, PageHeader, SectionTitle, Stat } from '@/components/hq/ui/primitives';
import { useNow } from '@/hooks/useNow';
import { supabase } from '@/lib/supabase';
import { soundFx } from '@/lib/soundFx';

interface TikTokProfileRow {
  open_id: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  synced_at: string;
}

interface TikTokVideoRow {
  video_id: string;
  title: string | null;
  description: string | null;
  cover_url: string | null;
  share_url: string | null;
  duration: number;
  posted_at: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
}

interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  contact: string;
  channel: string;
  source: string;
  campaign: string | null;
  tiktok_video_id: string | null;
  message: string | null;
  status: string;
}

const compact = new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('es-PE');

const LEAD_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'var(--hq-ceo)' },
  contacted: { label: 'Contactado', color: 'var(--hq-cmo)' },
  qualified: { label: 'Calificado', color: 'var(--hq-gold)' },
  won: { label: 'Cliente', color: 'var(--hq-cto)' },
  lost: { label: 'Perdido', color: 'var(--hq-ink-3)' },
};

export default function RedesPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<TikTokProfileRow | null>(null);
  const [videos, setVideos] = useState<TikTokVideoRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'won' | 'lost'>('all');
  const now = useNow(60000);

  const load = useCallback(async () => {
    const [profileRes, videosRes, leadsRes] = await Promise.all([
      supabase.from('hq_tiktok_profile').select('*').limit(1).maybeSingle(),
      supabase
        .from('hq_tiktok_videos')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(24),
      supabase.from('hq_leads').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setProfile((profileRes.data as TikTokProfileRow | null) ?? null);
    setVideos((videosRes.data as TikTokVideoRow[] | null) ?? []);
    setLeads((leadsRes.data as LeadRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const params = new URLSearchParams(window.location.search);
    const state = params.get('tiktok');
    if (state === 'connected') {
      setMessage({ type: 'ok', text: 'TikTok conectado. Métricas importadas.' });
      window.history.replaceState({}, '', '/hq/redes');
    } else if (state === 'denied') {
      setMessage({ type: 'error', text: 'Autorización cancelada o rechazada por TikTok.' });
      window.history.replaceState({}, '', '/hq/redes');
    } else if (state === 'missing_config') {
      setMessage({
        type: 'error',
        text: 'Faltan las credenciales de TikTok en el servidor (.env).',
      });
      window.history.replaceState({}, '', '/hq/redes');
    } else if (state) {
      setMessage({ type: 'error', text: `No se pudo conectar: ${state}` });
      window.history.replaceState({}, '', '/hq/redes');
    }
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    setMessage(null);
    soundFx.playClick();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch('/api/tiktok/sync', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: payload.error ?? 'No se pudo sincronizar.' });
        soundFx.playDamage();
      } else {
        setMessage({
          type: 'ok',
          text: `Sincronizado: ${payload.videos ?? 0} videos y ${compact.format(payload.profile?.follower_count ?? 0)} seguidores.`,
        });
        soundFx.playLevelUp();
        await load();
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de red al sincronizar TikTok.' });
      soundFx.playDamage();
    } finally {
      setSyncing(false);
    }
  };

  const updateLead = async (lead: LeadRow, status: string) => {
    const { error } = await supabase.from('hq_leads').update({ status }).eq('id', lead.id);
    if (!error) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)));
      soundFx.playCoin();
    }
  };

  const summary = useMemo(() => {
    const totalViews = videos.reduce((total, video) => total + Number(video.view_count ?? 0), 0);
    const totalLikes = videos.reduce((total, video) => total + Number(video.like_count ?? 0), 0);
    const totalComments = videos.reduce(
      (total, video) => total + Number(video.comment_count ?? 0),
      0
    );
    const sevenDaysAgo = (now?.getTime() ?? 0) - 7 * 24 * 60 * 60 * 1000;
    const recentVideos = videos.filter(
      (video) => video.posted_at && new Date(video.posted_at).getTime() >= sevenDaysAgo
    );
    const views7d = recentVideos.reduce((total, video) => total + Number(video.view_count ?? 0), 0);
    const newLeads = leads.filter((lead) => lead.status === 'new').length;
    const engagement = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    return {
      totalViews,
      views7d,
      engagement,
      newLeads,
      recentCount: recentVideos.length,
    };
  }, [videos, leads, now]);

  const filteredLeads =
    statusFilter === 'all' ? leads : leads.filter((lead) => lead.status === statusFilter);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="hq-chip animate-pulse">Cargando redes y leads…</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CMO · Redes"
        title="TikTok & Leads"
        description="Métricas de tu cuenta y una bandeja única para quienes te contactan desde el link de la bio, WhatsApp o el SaaS."
        actions={
          profile ? (
            <button type="button" className="hq-btn hq-btn-primary" onClick={sync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando…' : 'Sincronizar'}
            </button>
          ) : undefined
        }
      />

      {message && (
        <div
          className="rounded-xl border px-3 py-2 text-[11px]"
          style={{
            borderColor: message.type === 'ok' ? 'var(--hq-cto)' : 'var(--hq-danger)',
            backgroundColor:
              message.type === 'ok'
                ? 'color-mix(in srgb, var(--hq-cto) 8%, white)'
                : 'color-mix(in srgb, var(--hq-danger) 8%, white)',
            color: message.type === 'ok' ? 'var(--hq-cto)' : 'var(--hq-danger)',
          }}
        >
          {message.text}
        </div>
      )}

      {!profile ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#1F1E1B]/15 bg-[#1F1E1B] text-white">
                <Share2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="hq-title text-lg text-[#1F1E1B]">Conecta tu TikTok</h2>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#5E5C56]">
                  Autoriza tu cuenta de creador con la API oficial. Solo lectura: perfil, videos y
                  métricas. No pedimos contraseña ni acceso a mensajes.
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-2 text-[11px] leading-relaxed text-[#5E5C56]">
              <li>
                1. Crea una app en{' '}
                <a
                  href="https://developers.tiktok.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#3B7A87] underline"
                >
                  developers.tiktok.com
                </a>{' '}
                con Login Kit y Display API.
              </li>
              <li>
                2. Añade los scopes: <span className="hq-mono">user.info.basic</span>,{' '}
                <span className="hq-mono">user.info.profile</span>,{' '}
                <span className="hq-mono">user.info.stats</span>,{' '}
                <span className="hq-mono">video.list</span>.
              </li>
              <li>
                3. Configura el redirect URI a{' '}
                <span className="hq-mono">/api/tiktok/oauth/callback</span> y guarda las claves en
                el <span className="hq-mono">.env</span>.
              </li>
              <li>4. Pulsa conectar y autoriza tu cuenta.</li>
            </ol>

            <a href="/api/tiktok/oauth/start" className="hq-btn hq-btn-primary mt-4">
              <Link2 className="h-4 w-4" />
              Conectar TikTok
            </a>
          </Card>

          <Card className="p-5">
            <SectionTitle title="Mientras conectas" hint="alternativa" />
            <p className="text-[11px] leading-relaxed text-[#5E5C56]">
              TikTok no expone DMs por API. Para saber quién te contacta, usa un link en la bio con
              UTM y un formulario que envíe a <span className="hq-mono">/api/leads</span>, o un
              link de WhatsApp con un código de referencia.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#5A7D62]/25 bg-[#5A7D62]/5 p-3">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5A7D62]" />
              <p className="text-[11px] leading-relaxed text-[#4C6151]">
                Los leads se guardan aunque TikTok aún no esté conectado.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Seguidores"
              value={compact.format(profile.follower_count)}
              icon={Users}
              accent="var(--hq-cmo)"
              hint={`${full.format(profile.follower_count)} totales`}
            />
            <Stat
              label="Views 7 días"
              value={compact.format(summary.views7d)}
              icon={Eye}
              accent="var(--hq-ceo)"
              hint={`${summary.recentCount} videos recientes`}
            />
            <Stat
              label="Engagement"
              value={`${summary.engagement.toFixed(1)}%`}
              icon={Heart}
              accent="var(--hq-gold)"
              hint="likes + comentarios / views"
            />
            <Stat
              label="Leads nuevos"
              value={String(summary.newLeads)}
              icon={Inbox}
              accent="var(--hq-cto)"
              hint={`${leads.length} en total`}
            />
          </div>

          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? 'TikTok'}
                  className="h-11 w-11 rounded-full border border-[#E8E5DD] object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1F1E1B] text-sm font-bold text-white">
                  {(profile.display_name ?? 'T')[0]}
                </span>
              )}
              <div>
                <div className="text-sm font-semibold text-[#1F1E1B]">
                  {profile.display_name ?? 'Cuenta de TikTok'}
                </div>
                <div className="hq-mono text-[10px] text-[#8A877E]">
                  @{profile.open_id.slice(0, 10)} · sync{' '}
                  {new Date(profile.synced_at).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hq-chip text-[9px]">
                <Check className="h-3 w-3 text-[#5A7D62]" />
                API oficial conectada
              </span>
              <a
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noreferrer"
                className="hq-btn hq-btn-ghost"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir TikTok
              </a>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="p-4 sm:p-5">
              <SectionTitle title="Videos recientes" hint={`${videos.length} sincronizados`} />
              {videos.length === 0 ? (
                <EmptyState
                  icon={Share2}
                  title="Sin videos todavía"
                  description="Sincroniza para traer tus últimos videos y sus métricas."
                />
              ) : (
                <ul className="divide-y divide-[#E8E5DD]">
                  {videos.map((video) => (
                    <li key={video.video_id} className="flex items-center gap-3 py-2.5">
                      {video.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.cover_url}
                          alt={video.title ?? 'Video'}
                          className="h-12 w-9 shrink-0 rounded-md border border-[#E8E5DD] object-cover"
                        />
                      ) : (
                        <span className="h-12 w-9 shrink-0 rounded-md border border-[#E8E5DD] bg-[#F2EFE9]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-[#1F1E1B]">
                          {video.title || video.description || 'Video sin título'}
                        </div>
                        <div className="hq-mono mt-0.5 text-[9px] text-[#8A877E]">
                          {video.posted_at
                            ? new Date(video.posted_at).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'sin fecha'}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[10px] text-[#5E5C56]">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye className="h-3 w-3" />
                          <span className="hq-mono tabular-nums">{compact.format(video.view_count)}</span>
                        </span>
                        <span className="hidden items-center gap-1 sm:flex" title="Likes">
                          <Heart className="h-3 w-3" />
                          <span className="hq-mono tabular-nums">{compact.format(video.like_count)}</span>
                        </span>
                        <span className="hidden items-center gap-1 md:flex" title="Comentarios">
                          <MessageCircle className="h-3 w-3" />
                          <span className="hq-mono tabular-nums">
                            {compact.format(video.comment_count)}
                          </span>
                        </span>
                        {video.share_url && (
                          <a
                            href={video.share_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3B7A87] hover:underline"
                            aria-label="Abrir video en TikTok"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <SectionTitle title="Cómo llegan los leads" hint="arquitectura" />
              <ul className="space-y-2 text-[11px] leading-relaxed text-[#5E5C56]">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97043]" />
                  <span>
                    <strong className="text-[#1F1E1B]">Landing de la bio:</strong> agrega{' '}
                    <span className="hq-mono">utm_source=tiktok</span> y envía el formulario a{' '}
                    <span className="hq-mono">/api/leads</span>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A7D62]" />
                  <span>
                    <strong className="text-[#1F1E1B]">WhatsApp:</strong> link con código de video
                    (<span className="hq-mono">ref=VIDEO_ID</span>) o número con WhatsApp Cloud API
                    y webhook a n8n.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B7A87]" />
                  <span>
                    <strong className="text-[#1F1E1B]">SaaS Nilah:</strong> los 2 usuarios activos
                    son clientes, no leads. Envía un webhook de nuevos registros con{' '}
                    <span className="hq-mono">source=saas</span> para separarlos.
                  </span>
                </li>
              </ul>
              <div className="mt-3 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] p-3">
                <div className="hq-label mb-1">Endpoint de captura</div>
                <code className="hq-mono text-[10px] text-[#1F1E1B]">POST /api/leads</code>
                <p className="mt-1 text-[10px] leading-relaxed text-[#8A877E]">
                  Requiere header <span className="hq-mono">x-hq-secret</span> o un origin permitido
                  en <span className="hq-mono">HQ_LANDING_ORIGIN</span>.
                </p>
              </div>
            </Card>
          </div>

          <Card className="p-4 sm:p-5">
            <SectionTitle
              title="Bandeja de leads"
              hint={`${filteredLeads.length} visibles`}
              action={
                <div className="flex flex-wrap gap-1">
                  {(['all', 'new', 'contacted', 'qualified', 'won', 'lost'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`hq-chip text-[9px] ${statusFilter === status ? 'border-[#D97043]/40 text-[#D97043]' : ''}`}
                    >
                      {status === 'all' ? 'Todos' : LEAD_STATUS[status].label}
                    </button>
                  ))}
                </div>
              }
            />

            {filteredLeads.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Sin leads en este estado"
                description="Cuando alguien escriba desde tu landing, WhatsApp o el SaaS, aparecerá aquí."
              />
            ) : (
              <ul className="divide-y divide-[#E8E5DD]">
                {filteredLeads.map((lead) => {
                  const status = LEAD_STATUS[lead.status] ?? LEAD_STATUS.new;
                  return (
                    <li key={lead.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#1F1E1B]">
                            {lead.name || lead.contact}
                          </span>
                          <span className="hq-chip text-[9px]">{lead.channel}</span>
                          <span className="hq-chip text-[9px]">{lead.source}</span>
                          {lead.campaign && (
                            <span className="hq-chip text-[9px]">{lead.campaign}</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#5E5C56]">
                          {lead.contact}
                          {lead.message ? ` · ${lead.message}` : ''}
                        </div>
                        <div className="hq-mono mt-0.5 text-[9px] text-[#8A877E]">
                          {new Date(lead.created_at).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {lead.tiktok_video_id ? ` · video ${lead.tiktok_video_id}` : ''}
                        </div>
                      </div>
                      <select
                        value={lead.status}
                        onChange={(event) => updateLead(lead, event.target.value)}
                        className="hq-input w-full py-1.5 text-[11px] sm:w-36"
                        style={{ color: status.color }}
                      >
                        {Object.entries(LEAD_STATUS).map(([value, meta]) => (
                          <option key={value} value={value}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
