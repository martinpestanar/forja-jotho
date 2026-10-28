import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { buildTikTokAuthUrl, tiktokConfigured } from '@/lib/tiktok';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const redirectBase = new URL('/hq/redes', request.url);

  if (!tiktokConfigured()) {
    redirectBase.searchParams.set('tiktok', 'missing_config');
    return NextResponse.redirect(redirectBase);
  }

  const state = crypto.randomUUID();
  const store = await cookies();
  store.set('tiktok_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });

  return NextResponse.redirect(buildTikTokAuthUrl(state));
}
