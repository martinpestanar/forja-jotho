-- ============================================================================
-- Korat Flow HQ · TikTok stats + leads capture
-- Additive migration. Does not touch existing tables (profiles, valdr_*, etc.)
-- ============================================================================

-- 1. Integraciones (tokens OAuth). Solo service role puede leer/escribir.
CREATE TABLE IF NOT EXISTS public.hq_integrations (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Perfil de TikTok (una fila por cuenta conectada)
CREATE TABLE IF NOT EXISTS public.hq_tiktok_profile (
  open_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  follower_count BIGINT NOT NULL DEFAULT 0,
  following_count BIGINT NOT NULL DEFAULT 0,
  likes_count BIGINT NOT NULL DEFAULT 0,
  video_count BIGINT NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Videos y métricas por video
CREATE TABLE IF NOT EXISTS public.hq_tiktok_videos (
  video_id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  cover_url TEXT,
  share_url TEXT,
  duration INT NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ,
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,
  share_count BIGINT NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Serie diaria de métricas (followers, views, leads, etc.)
CREATE TABLE IF NOT EXISTS public.hq_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_on DATE NOT NULL DEFAULT CURRENT_DATE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'tiktok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hq_metric_unique UNIQUE (captured_on, metric, source)
);

-- 5. Bandeja unificada de leads
CREATE TABLE IF NOT EXISTS public.hq_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT,
  contact TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp | email | instagram | tiktok | landing | saas
  source TEXT NOT NULL DEFAULT 'tiktok',    -- tiktok | landing | saas | manual
  campaign TEXT,
  tiktok_video_id TEXT,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',        -- new | contacted | qualified | won | lost
  notes TEXT
);

CREATE INDEX IF NOT EXISTS hq_leads_created_idx ON public.hq_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS hq_leads_status_idx ON public.hq_leads (status);
CREATE INDEX IF NOT EXISTS hq_tiktok_videos_posted_idx ON public.hq_tiktok_videos (posted_at DESC);
CREATE INDEX IF NOT EXISTS hq_metrics_captured_idx ON public.hq_metric_snapshots (captured_on DESC);

-- RLS
ALTER TABLE public.hq_tiktok_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_tiktok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_integrations ENABLE ROW LEVEL SECURITY;
-- hq_integrations: sin políticas => solo service role.

DROP POLICY IF EXISTS "hq_tiktok_profile_select" ON public.hq_tiktok_profile;
CREATE POLICY "hq_tiktok_profile_select" ON public.hq_tiktok_profile
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "hq_tiktok_videos_select" ON public.hq_tiktok_videos;
CREATE POLICY "hq_tiktok_videos_select" ON public.hq_tiktok_videos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "hq_metrics_select" ON public.hq_metric_snapshots;
CREATE POLICY "hq_metrics_select" ON public.hq_metric_snapshots
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "hq_leads_select" ON public.hq_leads;
CREATE POLICY "hq_leads_select" ON public.hq_leads
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "hq_leads_update" ON public.hq_leads;
CREATE POLICY "hq_leads_update" ON public.hq_leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hq_leads_insert" ON public.hq_leads;
CREATE POLICY "hq_leads_insert" ON public.hq_leads
  FOR INSERT TO authenticated WITH CHECK (true);
