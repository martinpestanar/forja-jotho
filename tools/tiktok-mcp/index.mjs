#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = (process.env.HQ_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const SECRET = process.env.HQ_CRON_SECRET || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(SECRET ? { 'x-hq-secret': SECRET } : {}),
  };
}

async function callApi(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
    cache: 'no-store',
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function text(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function failure(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
  };
}

const server = new McpServer({
  name: 'tiktok-hq',
  version: '1.0.0',
});

server.tool(
  'tiktok_overview',
  'Devuelve el perfil de TikTok, videos recientes, métricas y leads de Korat Flow HQ.',
  {},
  async () => {
    try {
      const data = await callApi('/api/tiktok/overview', { method: 'GET' });
      return text(data);
    } catch (error) {
      return failure(error);
    }
  }
);

server.tool(
  'tiktok_sync',
  'Sincroniza el perfil y los videos de TikTok hacia Supabase. Usa los tokens guardados.',
  {},
  async () => {
    try {
      const data = await callApi('/api/tiktok/sync', { method: 'POST' });
      return text(data);
    } catch (error) {
      return failure(error);
    }
  }
);

server.tool(
  'leads_list',
  'Lista los leads capturados (landing, WhatsApp, SaaS) con su estado.',
  {
    status: z
      .enum(['all', 'new', 'contacted', 'qualified', 'won', 'lost'])
      .optional()
      .describe('Filtra por estado del lead.'),
  },
  async ({ status }) => {
    try {
      const data = await callApi('/api/leads', { method: 'GET' });
      const leads = Array.isArray(data?.leads) ? data.leads : [];
      const filtered =
        !status || status === 'all' ? leads : leads.filter((lead) => lead.status === status);
      return text({
        total: filtered.length,
        leads: filtered,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.tool(
  'lead_create',
  'Crea un lead nuevo. Útil para pruebas o capturas manuales.',
  {
    contact: z.string().min(3).describe('Teléfono, email o usuario de contacto.'),
    name: z.string().optional(),
    channel: z.string().optional(),
    source: z.string().optional(),
    campaign: z.string().optional(),
    tiktok_video_id: z.string().optional(),
    message: z.string().optional(),
  },
  async (input) => {
    try {
      const data = await callApi('/api/leads', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return text(data);
    } catch (error) {
      return failure(error);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[tiktok-hq-mcp] conectado · API ${API_BASE}`);
