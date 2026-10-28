import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface MarketRow {
  item_id?: string;
  display_name?: string;
  buy_price?: number;
  sell_price?: number;
  change_pct?: number;
}

interface OracleRequest {
  action?: 'bulletin' | 'greeting';
  market?: MarketRow[];
  wallet?: number;
  debt?: number;
  daysLeft?: number;
  inGrace?: boolean;
}

function bogotaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function deterministicCopy(action: string, req: OracleRequest): string {
  const market = Array.isArray(req.market) ? req.market : [];
  const cheapest = [...market]
    .filter((m) => (m.buy_price ?? 0) > 0)
    .sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))[0];
  const priciest = [...market]
    .filter((m) => (m.sell_price ?? 0) > 0)
    .sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))[0];

  if (action === 'greeting') {
    if (req.debt && req.debt > 0) {
      return `El Bazar te mira con respeto, pero la Liga cobra ${req.debt} ₽. Vende una baya y respira: la deuda se paga caminando.`;
    }
    if (req.daysLeft && req.daysLeft > 0) {
      return `Faltan ${req.daysLeft} días para el Dratini. Compra barato, vende caro y no toques la tienda del cartucho.`;
    }
    return 'El Bazar abrió sus puertas. Hoy se negocia con paciencia, no con prisa.';
  }

  if (cheapest && priciest) {
    return `${cheapest.display_name ?? 'Una baya'} está barata hoy; ${priciest.display_name ?? 'otra'} paga mejor al vender. Compra en la mañana y vuelve cuando el mercado respire.`;
  }
  return 'Sequía en la Ruta 34: las bayas escasean y el precio sube. El Oráculo aconseja guardar para mañana.';
}

async function askGemini(action: string, req: OracleRequest): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const market = Array.isArray(req.market) ? req.market : [];
  const marketLines = market
    .slice(0, 12)
    .map((m) => `${m.display_name ?? m.item_id}: compra ${m.buy_price ?? '?'} ₽, venta ${m.sell_price ?? '?'} ₽, cambio ${m.change_pct ?? 0}%`)
    .join('\n');

  const prompt = `Eres "EL ORÁCULO DEL BAZAR DE CIUDAD TRIGAL", un mercader sabio de Johto.
Habla en español con tono RPG clásico, cálido y breve.

DATOS REALES DEL MERCADO DE HOY:
${marketLines || 'Sin datos de mercado.'}

CONTEXTO DEL JUGADOR:
- Pokédólares: ${req.wallet ?? 0} ₽
- Deuda con la Liga: ${req.debt ?? 0} ₽
- Días estimados para el Dratini shiny: ${req.daysLeft ?? 0}
- Días de gracia: ${req.inGrace ? 'sí' : 'no'}

REGLAS ESTRICTAS:
1. Máximo 2 oraciones cortas (menos de 190 caracteres).
2. NO inventes precios ni objetos que no estén en los datos.
3. ${action === 'greeting' ? 'Da la bienvenida al Bazar y una sola recomendación.' : 'Resume el mercado del día y una oportunidad clara.'}
4. Sin markdown, sin listas, sin comillas.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 120 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const clean = text?.replace(/[*_`#"]/g, '').trim();
    return clean && clean.length > 0 ? clean.slice(0, 220) : null;
  } catch (err) {
    console.warn('[economy/oracle] Gemini error:', err);
    return null;
  }
}

export async function POST(req: Request) {
  let body: OracleRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = body.action === 'greeting' ? 'greeting' : 'bulletin';
  const today = bogotaToday();
  const cacheKey = `${action}:${today}`;

  try {
    const admin = getSupabaseAdmin();
    const { data: cached } = await admin
      .from('economy_oracle_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (cached?.payload?.text) {
      return NextResponse.json({ ...cached.payload, cached: true });
    }

    const text = (await askGemini(action, body)) || deterministicCopy(action, body);
    const payload = {
      text,
      action,
      date: today,
      source: text === deterministicCopy(action, body) ? 'deterministic' : 'gemini',
    };

    await admin.from('economy_oracle_cache').upsert(
      { cache_key: cacheKey, payload },
      { onConflict: 'cache_key' }
    );

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error('[economy/oracle]', err);
    return NextResponse.json({
      text: deterministicCopy(action, body),
      action,
      date: today,
      source: 'deterministic',
    });
  }
}

export async function GET() {
  const today = bogotaToday();
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from('economy_oracle_cache')
      .select('payload')
      .eq('cache_key', `bulletin:${today}`)
      .maybeSingle();
    if (data?.payload) return NextResponse.json({ ...data.payload, cached: true });
  } catch {}
  return NextResponse.json({
    text: deterministicCopy('bulletin', {}),
    action: 'bulletin',
    date: today,
    source: 'deterministic',
  });
}
