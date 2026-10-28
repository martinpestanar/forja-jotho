import { NextResponse } from 'next/server';
import { isHqAuthorized } from '@/lib/hqAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isHqAuthorized(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const [profile, videos, leads, metrics] = await Promise.all([
    admin.from('hq_tiktok_profile').select('*').limit(1).maybeSingle(),
    admin
      .from('hq_tiktok_videos')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(50),
    admin.from('hq_leads').select('*').order('created_at', { ascending: false }).limit(30),
    admin
      .from('hq_metric_snapshots')
      .select('*')
      .order('captured_on', { ascending: false })
      .limit(60),
  ]);

  const videoRows = videos.data ?? [];
  const totalViews = videoRows.reduce((total, row) => total + Number(row.view_count ?? 0), 0);
  const totalLikes = videoRows.reduce((total, row) => total + Number(row.like_count ?? 0), 0);
  const leadRows = leads.data ?? [];

  return NextResponse.json({
    connected: Boolean(profile.data),
    profile: profile.data ?? null,
    videos: videoRows,
    leads: leadRows,
    metrics: metrics.data ?? [],
    summary: {
      followers: profile.data?.follower_count ?? 0,
      totalViews,
      totalLikes,
      videos: videoRows.length,
      newLeads: leadRows.filter((lead) => lead.status === 'new').length,
      leads: leadRows.length,
    },
  });
}
