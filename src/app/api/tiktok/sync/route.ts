import { NextResponse } from 'next/server';
import { isHqAuthorized } from '@/lib/hqAuth';
import { syncTikTok, tiktokConfigured } from '@/lib/tiktok';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isHqAuthorized(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!tiktokConfigured()) {
    return NextResponse.json(
      { error: 'Faltan credenciales de TikTok en el servidor.' },
      { status: 400 }
    );
  }

  try {
    const result = await syncTikTok();
    if (!result.connected) {
      return NextResponse.json(
        { error: 'TikTok no está conectado todavía.' },
        { status: 409 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error sincronizando TikTok.' },
      { status: 500 }
    );
  }
}
