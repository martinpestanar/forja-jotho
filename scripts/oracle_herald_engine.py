#!/usr/bin/env python3
"""
Syndex Oracle & Johto Herald Engine (v7.0)
-----------------------------------------
Motor de automatización y oráculo económico determinista:
1. Lee las 21 Corporaciones y Commodities de Supabase.
2. Consulta a Google Gemini AI para redactar la edición matutina de "El Heraldo de Johto".
3. Sanitiza estrictamente el JSON retornado.
4. Ejecuta la RPC determinista `rpc_apply_market_shift_clamped` en Supabase con clamping inmutable [-25%, +25%].
5. Permite ejecución manual (CLI) o programada (Task Scheduler / Cron).
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime

# ==============================================================================
# CARGA DE VARIABLES DE ENTORNO
# ==============================================================================
def load_env():
    env_vars = {}
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

ENV = load_env()
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or ENV.get('NEXT_PUBLIC_SUPABASE_URL', '')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or ENV.get('SUPABASE_SERVICE_ROLE_KEY', '')
GEMINI_KEY = os.environ.get('GEMINI_API_KEY') or ENV.get('GEMINI_API_KEY', '')

# ==============================================================================
# SUPABASE HTTP HELPER
# ==============================================================================
def supabase_request(endpoint: str, method: str = 'GET', payload: dict = None):
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{endpoint.lstrip('/')}"
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise RuntimeError(f"Supabase HTTP {e.code}: {error_body}")

def supabase_rpc(rpc_name: str, params: dict):
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/rpc/{rpc_name}"
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    data = json.dumps(params).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            resp_text = res.read().decode('utf-8')
            return json.loads(resp_text) if resp_text else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise RuntimeError(f"Supabase RPC {rpc_name} Error {e.code}: {error_body}")

# ==============================================================================
# CONSULTA A GEMINI AI
# ==============================================================================
def call_gemini_herald(corporations: list) -> dict:
    corps_summary = "\n".join([
        f"- Ticker: {c['ticker']} | Nombre: {c['name']} | Región: {c['region']} | Sector: {c['sector']} | Precio: ${c['current_price']}"
        for c in corporations[:10]  # Mandar muestra representativa para optimizar contexto
    ])

    prompt = f"""
Eres el Editor Jefe de 'El Heraldo de Johto', el periódico financiero oficial del mundo Pokémon (GDD Hardcore v7.0).
Hoy debes seleccionar 1 o 2 corporaciones/commodities de la siguiente lista y redactar la noticia macroeconómica del día con tono periodístico RPG retro.

CORPORACIONES DISPONIBLES:
{corps_summary}

REGLAS OBLIGATORIAS:
1. Responde EXCLUSIVAMENTE un objeto JSON válido (sin backticks de markdown, sin texto antes ni después).
2. Elige 1 empresa principal afectada.
3. Propón un porcentaje de variación ('shift_pct') entre -25.00 y 25.00.
4. Sentimiento debe ser 'BULLISH', 'BEARISH' o 'NEUTRAL'.
5. El titular ('headline') no debe tener más de 12 palabras.
6. El cuerpo ('body') debe tener máximo 2 oraciones concisas de lore estilo cuadro de diálogo Pokémon.

FORMATO EXACTO:
{{
  "ticker": "$TICKER_SELECCIONADO",
  "headline": "Titular impactante y lore Pokémon",
  "body": "Oración 1 de contexto. Oración 2 de impacto en el mercado.",
  "sentiment": "BULLISH",
  "shift_pct": 14.5
}}
"""

    gemini_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }

    req = urllib.request.Request(
        gemini_endpoint,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
            # Limpiar posibles bloques markdown si los agrega
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("`").removeprefix("json").strip()
            return json.loads(raw_text)
    except Exception as e:
        print(f"[Aviso] Error al consultar Gemini API: {e}. Activando generador determinista de contingencia.")
        # Contingencia determinista de lore si la API falla
        import random
        target = random.choice(corporations)
        shifts = [-18.5, -10.0, 12.0, 22.5]
        selected_shift = random.choice(shifts)
        sentiment = 'BULLISH' if selected_shift > 0 else 'BEARISH'
        return {
            "ticker": target['ticker'],
            "headline": f"Anomalía comercial detectada en {target['name']}",
            "body": f"Informes de Radio Trigal reportan fluctuaciones inesperadas en {target['sector']}. Los analistas aconsejan precaución.",
            "sentiment": sentiment,
            "shift_pct": selected_shift
        }

# ==============================================================================
# MOTOR PRINCIPAL
# ==============================================================================
def run_oracle_tick():
    print("=" * 65)
    print("[HERALDO] INICIANDO ORÁCULO DE SUPABASE & EL HERALDO DE JOHTO (v7.0)")
    print(f"[TIME] Timestamp: {datetime.now().isoformat()}")
    print("=" * 65)

    if not SUPABASE_URL or not SERVICE_KEY:
        print("[ERROR] Error: Faltan credenciales de Supabase (URL o SERVICE_ROLE_KEY).")
        sys.exit(1)

    print("[1] 1. Consultando directorio corporativo en Supabase...")
    corps = supabase_request("market_corporations?select=*&order=ticker.asc")
    print(f"   -> {len(corps)} corporaciones cargadas exitosamente.")

    print("\n[2] 2. Redactando edición diaria con Gemini AI...")
    ai_story = call_gemini_herald(corps)
    print(f"   [Titular]: {ai_story.get('headline')}")
    print(f"   [Empresa]: {ai_story.get('ticker')} | Sentimiento: {ai_story.get('sentiment')} | Propuesta: {ai_story.get('shift_pct')}%")
    print(f"   [Cuerpo]:  {ai_story.get('body')}")

    print("\n[3] 3. Ejecutando RPC Determinista con Clamping de Seguridad...")
    result = supabase_rpc("rpc_apply_market_shift_clamped", {
        "p_ticker": ai_story.get('ticker'),
        "p_proposed_shift_pct": float(ai_story.get('shift_pct', 0)),
        "p_headline": ai_story.get('headline', 'Edición Extraordinaria de Johto'),
        "p_body": ai_story.get('body', 'Mercados en calma.'),
        "p_sentiment": ai_story.get('sentiment', 'NEUTRAL')
    })

    print("   -> Resultado del Oráculo:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("\n[OK] CICLO DEL ORÁCULO COMPLETADO CON ÉXITO.")

if __name__ == '__main__':
    run_oracle_tick()
