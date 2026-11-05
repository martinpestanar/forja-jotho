import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/dev-login
 * Genera un OTP de acceso directo para el entrenador titular (Marty)
 * Permite restaurar rápidamente la sesión de desarrollo y sincronización con Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const email = 'marty@syndex.app';

    // Generar OTP para magiclink sin enviar correo real
    const linkRes = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkRes.error || !linkRes.data?.properties?.email_otp) {
      return NextResponse.json(
        { error: linkRes.error?.message || 'No se pudo generar el token de sesión' },
        { status: 500 }
      );
    }

    const otp = linkRes.data.properties.email_otp;

    return NextResponse.json({
      success: true,
      email,
      otp,
    });
  } catch (err: any) {
    console.error('[/api/auth/dev-login] Error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
