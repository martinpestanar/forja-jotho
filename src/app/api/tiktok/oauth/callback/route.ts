import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeTikTokCode, saveTikTokTokens, syncTikTok } from '@/lib/tiktok';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectBase = new URL('/hq/redes', request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const store = await cookies();
  const expectedState = store.get('tiktok_oauth_state')?.value;
  store.delete('tiktok_oauth_state');

  if (oauthError || !code || !state || state !== expectedState) {
    redirectBase.searchParams.set('tiktok', 'denied');
    return NextResponse.redirect(redirectBase);
  }

  try {
    const tokens = await exchangeTikTokCode(code);
    await saveTikTokTokens(tokens);

    try {
      await syncTikTok();
    } catch {
      // La conexión queda guardada; el sync se puede reintentar desde la UI.
    }

    redirectBase.searchParams.set('tiktok', 'connected');
    return NextResponse.redirect(redirectBase);
  } catch (error) {
    redirectBase.searchParams.set(
      'tiktok',
      error instanceof Error ? error.message.slice(0, 80) : 'error'
    );
    return NextResponse.redirect(redirectBase);
  }
}
