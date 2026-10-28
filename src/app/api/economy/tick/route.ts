import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Tick diario de la economía de Johto.
 * Ejecutado por Vercel Cron a las 05:05 UTC (00:05 Bogotá).
 * También puede lanzarse a mano con el secreto:
 *   curl -H "Authorization: Bearer $HQ_CRON_SECRET" https://.../api/economy/tick
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.HQ_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get('authorization') || '';
  const headerSecret = req.headers.get('x-cron-secret') || '';
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret') || '';

  return (
    auth === `Bearer ${secret}` ||
    headerSecret === secret ||
    querySecret === secret
  );
}

async function runTick() {
  const admin = getSupabaseAdmin();

  const market = await admin.rpc('rpc_economy_market_tick');
  if (market.error) throw new Error(`market_tick: ${market.error.message}`);

  const taxes = await admin.rpc('rpc_economy_daily_tick', { p_user_id: null });
  if (taxes.error) throw new Error(`daily_tick: ${taxes.error.message}`);

  return {
    success: true,
    market: market.data,
    taxes: taxes.data,
    ran_at: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runTick());
  } catch (err: any) {
    console.error('[economy/tick]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Error en el tick' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json(await runTick());
  } catch (err: any) {
    console.error('[economy/tick]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Error en el tick' }, { status: 500 });
  }
}
