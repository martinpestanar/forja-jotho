import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';

export const TIKTOK_SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'user.info.stats',
  'video.list',
];

export interface TikTokProfile {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

export interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  share_url?: string;
  create_time?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

function getConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error(
      'Faltan TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET o TIKTOK_REDIRECT_URI en el servidor.'
    );
  }

  return { clientKey, clientSecret, redirectUri };
}

export function tiktokConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_CLIENT_KEY &&
      process.env.TIKTOK_CLIENT_SECRET &&
      process.env.TIKTOK_REDIRECT_URI
  );
}

export function buildTikTokAuthUrl(state: string): string {
  const { clientKey, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_SCOPES.join(','),
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const data = (await response.json()) as TokenResponse;

  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'TikTok rechazó la solicitud de token.');
  }

  return data;
}

export async function exchangeTikTokCode(code: string): Promise<TokenResponse> {
  const { clientKey, clientSecret, redirectUri } = getConfig();
  return postToken(
    new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })
  );
}

export async function refreshTikTokToken(refreshToken: string): Promise<TokenResponse> {
  const { clientKey, clientSecret } = getConfig();
  return postToken(
    new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  );
}

export async function fetchTikTokProfile(accessToken: string): Promise<TikTokProfile> {
  const fields = [
    'open_id',
    'union_id',
    'avatar_url',
    'display_name',
    'follower_count',
    'following_count',
    'likes_count',
    'video_count',
  ].join(',');

  const response = await fetch(`${USER_INFO_URL}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok || data?.error?.code) {
    throw new Error(data?.error?.message || 'No se pudo leer el perfil de TikTok.');
  }

  const user = data?.data?.user;
  if (!user) throw new Error('TikTok no devolvió datos del perfil.');
  return user as TikTokProfile;
}

export async function fetchTikTokVideos(accessToken: string): Promise<TikTokVideo[]> {
  const fields = [
    'id',
    'title',
    'video_description',
    'duration',
    'cover_image_url',
    'share_url',
    'create_time',
    'view_count',
    'like_count',
    'comment_count',
    'share_count',
  ].join(',');

  const videos: TikTokVideo[] = [];
  let cursor: number | undefined;

  for (let page = 0; page < 5; page += 1) {
    const response = await fetch(`${VIDEO_LIST_URL}?fields=${fields}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok || data?.error?.code) {
      throw new Error(data?.error?.message || 'No se pudo leer la lista de videos de TikTok.');
    }

    const pageVideos: TikTokVideo[] = data?.data?.videos ?? [];
    videos.push(...pageVideos);

    cursor = data?.data?.cursor;
    if (!data?.data?.has_more || !cursor) break;
  }

  return videos;
}

export async function saveTikTokTokens(tokens: TokenResponse) {
  const admin = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await admin.from('hq_integrations').upsert(
    {
      provider: 'tiktok',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      scope: tokens.scope ?? TIKTOK_SCOPES.join(','),
      metadata: { open_id: tokens.open_id, token_type: tokens.token_type ?? 'Bearer' },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider' }
  );

  if (error) throw new Error(`No se pudieron guardar los tokens: ${error.message}`);
}

export async function getValidAccessToken(): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hq_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('provider', 'tiktok')
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la integración: ${error.message}`);
  if (!data?.access_token) return null;

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const stillValid = expiresAt - Date.now() > 60_000;

  if (stillValid) return data.access_token as string;
  if (!data.refresh_token) return null;

  const refreshed = await refreshTikTokToken(data.refresh_token as string);
  if (refreshed.refresh_token === undefined && data.refresh_token) {
    refreshed.refresh_token = data.refresh_token as string;
  }
  await saveTikTokTokens(refreshed);
  return refreshed.access_token;
}

export interface TikTokSyncResult {
  connected: boolean;
  profile?: TikTokProfile;
  videos?: number;
  syncedAt?: string;
}

export async function syncTikTok(): Promise<TikTokSyncResult> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { connected: false };

  const [profile, videos] = await Promise.all([
    fetchTikTokProfile(accessToken),
    fetchTikTokVideos(accessToken),
  ]);

  const admin = getSupabaseAdmin();
  const syncedAt = new Date().toISOString();

  const { error: profileError } = await admin.from('hq_tiktok_profile').upsert(
    {
      open_id: profile.open_id,
      display_name: profile.display_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      follower_count: profile.follower_count ?? 0,
      following_count: profile.following_count ?? 0,
      likes_count: profile.likes_count ?? 0,
      video_count: profile.video_count ?? 0,
      synced_at: syncedAt,
    },
    { onConflict: 'open_id' }
  );

  if (profileError) throw new Error(`No se pudo guardar el perfil: ${profileError.message}`);

  if (videos.length > 0) {
    const rows = videos.map((video) => ({
      video_id: video.id,
      title: video.title ?? null,
      description: video.video_description ?? null,
      cover_url: video.cover_image_url ?? null,
      share_url: video.share_url ?? null,
      duration: video.duration ?? 0,
      posted_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
      view_count: video.view_count ?? 0,
      like_count: video.like_count ?? 0,
      comment_count: video.comment_count ?? 0,
      share_count: video.share_count ?? 0,
      synced_at: syncedAt,
    }));

    const { error: videosError } = await admin
      .from('hq_tiktok_videos')
      .upsert(rows, { onConflict: 'video_id' });

    if (videosError) throw new Error(`No se pudieron guardar los videos: ${videosError.message}`);
  }

  const totalViews = videos.reduce((total, video) => total + (video.view_count ?? 0), 0);
  const totalLikes = videos.reduce((total, video) => total + (video.like_count ?? 0), 0);

  await admin.from('hq_metric_snapshots').upsert(
    [
      { metric: 'followers', value: profile.follower_count ?? 0, source: 'tiktok' },
      { metric: 'likes_total', value: profile.likes_count ?? 0, source: 'tiktok' },
      { metric: 'video_views_total', value: totalViews, source: 'tiktok' },
      { metric: 'video_likes_total', value: totalLikes, source: 'tiktok' },
    ],
    { onConflict: 'captured_on,metric,source' }
  );

  return { connected: true, profile, videos: videos.length, syncedAt };
}
