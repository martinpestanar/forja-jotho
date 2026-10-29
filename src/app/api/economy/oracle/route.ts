import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface MarketRow {
  item_id?: string;
  display_name?: string;
  buy_price?: number;
  sell_price?: number;
  change_pct?: number;
  base_price?: number;
}

interface VaultRow {
  item_id_or_species?: string;
  display_name?: string;
  quantity?: number;
}

interface OracleRequest {
  action?: 'bulletin' | 'greeting' | 'director';
  market?: MarketRow[];
  vault?: VaultRow[];
  wallet?: number;
  debt?: number;
  daysLeft?: number;
  inGrace?: boolean;
}

interface AiMarketDecision {
  regime: 'CRASH' | 'BULL_RUN' | 'SQUEEZE' | 'ROCKET_MANIPULATION' | 'CYCLE';
  headline: string;
  rumor: string;
  crash_item_id: string;
  boom_item_id: string;
  bot_buy_reason: string;
  bot_sell_reason: string;
}

const VALID_BONGURIS = [
  'BONGURI_RED',
  'BONGURI_BLUE',
  'BONGURI_YELLOW',
  'BONGURI_GREEN',
  'BONGURI_PINK',
  'BONGURI_WHITE',
  'BONGURI_BLACK',
];

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
    .sort((a, b) => (a.change_pct ?? 0) - (b.change_pct ?? 0))[0];
  const priciest = [...market]
    .filter((m) => (m.sell_price ?? 0) > 0)
    .sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))[0];

  if (action === 'greeting') {
    if (req.debt && req.debt > 0) {
      return `El Bazar te mira con respeto, pero Bill reclama ${req.debt} ₽. Haz una tarea o vende al Bot para liberar tu Bóveda.`;
    }
    if (req.daysLeft && req.daysLeft > 0) {
      return `Faltan ${req.daysLeft} días para tu Shiny Leyenda de 50.000 ₽. Acumula Bonguris en caída y revéndelos al Bot Silph Co.`;
    }
    return 'El Bazar de Ciudad Trigal abrió sus puertas. Hoy se negocia con inteligencia, no con prisa.';
  }

  if (cheapest && priciest) {
    return `${cheapest.display_name ?? 'Un Bonguri'} cayó fuerte hoy (${cheapest.change_pct ?? 0}%); ${priciest.display_name ?? 'otro'} lidera las alzas. Compra en descuento y espera el rebote semanal.`;
  }
  return 'César reporta cosecha volátil de Bonguris en Azalea. Aprovecha las órdenes relámpago del Bot de Silph Co.';
}

async function askGeminiMarketDirector(req: OracleRequest): Promise<AiMarketDecision | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const vaultSummary = (req.vault || [])
    .slice(0, 8)
    .map((v) => `${v.item_id_or_species} x${v.quantity}`)
    .join(', ');

  const prompt = `Eres el "AGENTE IA DIRECTOR DEL MERCADO DE JOHTO" (Wall Street Pokémon).
Tu misión es crear un ciclo de mercado dinámico, estratégico y ligeramente impredecible para hoy.
El jugador tiene en su Wallet: ${req.wallet ?? 0} ₽ y en su Bóveda: ${vaultSummary || 'vacía'}.

Activos Bonguri disponibles: BONGURI_RED, BONGURI_BLUE, BONGURI_YELLOW, BONGURI_GREEN, BONGURI_PINK, BONGURI_WHITE, BONGURI_BLACK.

Devuelve ÚNICAMENTE un JSON válido (sin bloques markdown) con esta estructura exacta:
{
  "regime": "CRASH" | "BULL_RUN" | "SQUEEZE" | "ROCKET_MANIPULATION" | "CYCLE",
  "headline": "Noticia de máximo 150 caracteres explicando qué Bonguri cayó hoy -45% y cuál subió +50%.",
  "rumor": "Rumor insider de máximo 140 caracteres dando una pista de qué Bonguri subirá fuerte en los próximos días.",
  "crash_item_id": "UNO_DE_LOS_BONGURI",
  "boom_item_id": "OTRO_BONGURI_DISTINTO",
  "bot_buy_reason": "Frase corta del Bot Silph Co. explicando por qué compra hoy el boom_item_id con +65% de prima.",
  "bot_sell_reason": "Frase corta del Bot Mercader explicando por qué remata hoy 15 unidades del crash_item_id a mitad de precio."
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 450,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiMarketDecision;
    if (
      !VALID_BONGURIS.includes(parsed.crash_item_id) ||
      !VALID_BONGURIS.includes(parsed.boom_item_id) ||
      parsed.crash_item_id === parsed.boom_item_id
    ) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[economy/oracle director] Gemini error:', err);
    return null;
  }
}

async function askGeminiCopy(action: string, req: OracleRequest): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const market = Array.isArray(req.market) ? req.market : [];
  const marketLines = market
    .slice(0, 14)
    .map(
      (m) =>
        `${m.display_name ?? m.item_id}: compra ${m.buy_price ?? '?'} ₽, venta ${m.sell_price ?? '?'} ₽ (${m.change_pct ?? 0}%)`
    )
    .join('\n');

  const prompt = `Eres "EL ORÁCULO FINANCIERO DE CIUDAD TRIGAL", un estratega de mercados Pokémon en Johto.
Habla en español con tono RPG de Nintendo, sagaz y directo.

DATOS REALES DEL MERCADO DE HOY:
${marketLines || 'Sin datos de mercado.'}

CONTEXTO DEL ENTRENADOR:
- Pokédólares: ${req.wallet ?? 0} ₽
- Deuda con Bill/Liga: ${req.debt ?? 0} ₽
- Días estimados para el Shiny de 50.000 ₽: ${req.daysLeft ?? 0}

REGLAS ESTRICTAS:
1. Máximo 2 oraciones cortas (menos de 190 caracteres).
2. Recomienda qué Bonguri o Baya comprar barato hoy o vender caro al Bot.
3. Sin markdown, sin listas, sin comillas.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'MAX_TOKENS') return null;
    const text: string | undefined = candidate?.content?.parts?.[0]?.text;
    const clean = text?.replace(/[*_`#"]/g, '').trim();
    return clean && clean.length > 20 ? clean.slice(0, 220) : null;
  } catch {
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

  const action = body.action || 'bulletin';
  const today = bogotaToday();
  const cacheKey = `v3:${action}:${today}`;

  try {
    const admin = getSupabaseAdmin();

    // Si aún no hay evento IA hoy o se pide 'director', dejamos que Gemini dirija el mercado 1 vez al día
    const directorCacheKey = `v3:director_applied:${today}`;
    const { data: directorDone } = await admin
      .from('economy_oracle_cache')
      .select('cache_key')
      .eq('cache_key', directorCacheKey)
      .maybeSingle();

    let marketUpdated = false;
    if (!directorDone || action === 'director') {
      const decision = await askGeminiMarketDirector(body);
      if (decision) {
        // Insertar el evento semanal dirigido por la IA y recalcular el tick de mercado
        await admin.from('economy_market_events').insert({
          week_key: `AI-${today}`,
          regime: decision.regime || 'CYCLE',
          headline: decision.headline.slice(0, 220),
          rumor: decision.rumor.slice(0, 220),
          crash_item_id: decision.crash_item_id,
          boom_item_id: decision.boom_item_id,
          crash_discount_pct: -45,
          boom_surge_pct: 52,
          active_from: today,
          active_until: today,
          source: 'gemini_director',
        });

        // Recalcular precios de hoy con la decisión del Agente IA
        await admin.rpc('rpc_economy_market_tick');

        // Actualizar textos de las órdenes del Bot de hoy
        await admin
          .from('economy_bot_orders')
          .update({ reason: decision.bot_buy_reason.slice(0, 180) })
          .eq('trade_date', today)
          .eq('order_side', 'BUY_FROM_USER');

        await admin
          .from('economy_bot_orders')
          .update({ reason: decision.bot_sell_reason.slice(0, 180) })
          .eq('trade_date', today)
          .eq('order_side', 'SELL_TO_USER');

        await admin.from('economy_oracle_cache').upsert(
          {
            cache_key: directorCacheKey,
            payload: { decision, date: today },
          },
          { onConflict: 'cache_key' }
        );
        marketUpdated = true;
      }
    }

    if (action !== 'director') {
      const { data: cached } = await admin
        .from('economy_oracle_cache')
        .select('payload')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (cached?.payload?.text && !marketUpdated) {
        return NextResponse.json({ ...cached.payload, cached: true, marketUpdated });
      }
    }

    const text = (await askGeminiCopy(action, body)) || deterministicCopy(action, body);
    const payload = {
      text,
      action,
      date: today,
      source: text === deterministicCopy(action, body) ? 'deterministic' : 'gemini',
      marketUpdated,
    };

    await admin.from('economy_oracle_cache').upsert(
      { cache_key: cacheKey, payload },
      { onConflict: 'cache_key' }
    );

    return NextResponse.json(payload);
  } catch (err) {
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
      .eq('cache_key', `v3:bulletin:${today}`)
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
