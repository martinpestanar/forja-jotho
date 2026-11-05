import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const SAV_BUCKET = 'gba-saves';
const MIN_SAV_BYTES = 0x1C000; // 114,688 bytes (Flash 128KB mínimo requerido por Pokémon Emerald/HnS)

/**
 * Extrae y valida el usuario autenticado a partir del encabezado Authorization: Bearer <token>
 */
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

/**
 * GET /api/gba/save-sync?slot=slot_1.sav
 * Descarga el archivo .sav del usuario autenticado desde Supabase Storage
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot') || 'slot_1.sav';
    // Sanitizar slot
    const safeSlot = slot.replace(/[^a-zA-Z0-9_.-]/g, '');

    const admin = getSupabaseAdmin();

    // Intentar descargar el slot específico
    let downloadRes = await admin.storage
      .from(SAV_BUCKET)
      .download(`${user.id}/${safeSlot}`);

    // Si falló el slot específico, intentar fallback a savegame.sav
    if (!downloadRes.data && safeSlot !== 'savegame.sav') {
      downloadRes = await admin.storage
        .from(SAV_BUCKET)
        .download(`${user.id}/savegame.sav`);
    }

    if (!downloadRes.data) {
      return NextResponse.json(
        { error: 'No se encontró archivo de guardado en la nube' },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await downloadRes.data.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[/api/gba/save-sync GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/gba/save-sync?slot=slot_1.sav
 * Recibe los bytes del archivo .sav (application/octet-stream o multipart) y los persiste en Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot') || 'slot_1.sav';
    const safeSlot = slot.replace(/[^a-zA-Z0-9_.-]/g, '');

    // Leer bytes del cuerpo
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < MIN_SAV_BYTES) {
      return NextResponse.json(
        { error: `Tamaño inválido de .sav (${buffer.length} bytes, se requieren al menos ${MIN_SAV_BYTES})` },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 1. Subir al slot específico
    const uploadSlot = await admin.storage
      .from(SAV_BUCKET)
      .upload(`${user.id}/${safeSlot}`, buffer, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (uploadSlot.error) {
      console.error('[/api/gba/save-sync POST] Error subiendo slot:', uploadSlot.error);
      return NextResponse.json({ error: uploadSlot.error.message }, { status: 500 });
    }

    // 2. Subir también a savegame.sav como respaldo principal
    if (safeSlot !== 'savegame.sav') {
      await admin.storage
        .from(SAV_BUCKET)
        .upload(`${user.id}/savegame.sav`, buffer, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
    }

    // 3. Actualizar updated_at en tabla profiles
    await admin
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      bytes: buffer.length,
      slot: safeSlot,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[/api/gba/save-sync POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
