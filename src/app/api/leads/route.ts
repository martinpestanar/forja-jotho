import { NextResponse } from 'next/server';
import { isHqAuthorized } from '@/lib/hqAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function allowedOrigins(): string[] {
  return (process.env.HQ_LANDING_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const origins = allowedOrigins();
  const allowed = origin && origins.includes(origin) ? origin : origins[0] ?? '';
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-HQ-Secret',
    Vary: 'Origin',
  };
}

function clean(value: unknown, max = 300): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const secret = process.env.HQ_CRON_SECRET;
  const secretOk = Boolean(secret && request.headers.get('x-hq-secret') === secret);
  const originOk = Boolean(origin && allowedOrigins().includes(origin));

  if (!secretOk && !originOk) {
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const contact = clean((body as Record<string, unknown>).contact, 200);
  if (!contact) {
    return NextResponse.json({ error: 'El contacto es obligatorio.' }, { status: 400 });
  }

  const utm = (body as Record<string, unknown>).utm;
  const safeUtm =
    utm && typeof utm === 'object' && !Array.isArray(utm)
      ? (utm as Record<string, unknown>)
      : {};

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hq_leads')
    .insert({
      name: clean((body as Record<string, unknown>).name, 120),
      contact,
      channel: clean((body as Record<string, unknown>).channel, 40) ?? 'whatsapp',
      source: clean((body as Record<string, unknown>).source, 40) ?? 'landing',
      campaign: clean((body as Record<string, unknown>).campaign, 120),
      tiktok_video_id: clean((body as Record<string, unknown>).tiktok_video_id, 80),
      utm: safeUtm,
      message: clean((body as Record<string, unknown>).message, 1000),
      status: 'new',
    })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, lead: data },
    { status: 201, headers: corsHeaders(origin) }
  );
}

export async function GET(request: Request) {
  if (!(await isHqAuthorized(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hq_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data ?? [] });
}
