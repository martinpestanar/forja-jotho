---
name: syndex-mcp-connection
description: >-
  Configuración permanente de los MCPs del proyecto SynDex (Supabase, GitHub, n8n-mcp):
  cómo están conectados, dónde viven los secretos, cómo diagnosticar si un MCP no carga
  y qué herramientas usar para cada tipo de tarea (BD, repo, automatización).
---

# 🔌 SynDex MCP Connection Runbook

Referencia obligatoria para que **cualquier agente/sesión/pestaña** de este proyecto use las conexiones externas correctamente. **Este archivo va al repo: NUNCA escribir tokens aquí.**

---

## 🗺️ 1. Los 3 MCPs del proyecto

Definidos en `opencode.json` (raíz del repo, **rastreado por git** → solo referencias `{env:VAR}`, jamás valores crudos).

| MCP | Sirve para | Secretos que necesita |
|---|---|---|
| `supabase` (`@supabase/mcp-server-supabase`, project-ref `wquuhycqbdeysqxzwlun`) | SQL directo, introspección de esquema, migraciones, logs, storage del backend de producción | `SUPABASE_ACCESS_TOKEN` |
| `github` (`@modelcontextprotocol/server-github`) | Issues, PRs, commits, búsqueda de código del repo | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| `n8n-mcp` (script local en `Korat_MVP/_ai_tools/n8n-mcp`) | Nodos y plantillas de n8n para automatizaciones de la agencia | `N8N_API_KEY`, `N8N_API_URL` |

---

## 🚀 2. Git Push y Operaciones de Repositorio Remoto

Para hacer push sin depender de credenciales interactivas de Git en Windows, utiliza directamente el token disponible en el entorno del proceso:

```powershell
git push https://$($env:GITHUB_PERSONAL_ACCESS_TOKEN)@github.com/martinpestanar/forja-jotho.git <rama>
git fetch origin
```
**Regla:** Jamás pedir el token al usuario; siempre está cargado en `$env:GITHUB_PERSONAL_ACCESS_TOKEN`.

---

## 🔑 2. Dónde viven los secretos (cadena de resolución)

```
opencode.json          →  "env": { "SUPABASE_ACCESS_TOKEN": "{env:SUPABASE_ACCESS_TOKEN}" }
                                │  {env:...} lee del PROCESO de Windows
                                ▼
Variables de usuario   →  setx SUPABASE_ACCESS_TOKEN <valor>   (persistente, HKCU\Environment)
                                ▲
.env (git-ignored)     →  SOLO lo lee Next.js en runtime (npm run dev/build),
                          NO lo lee OpenCode al lanzar los MCPs
```

**Reglas:**
1. Para dar acceso permanente a un nuevo MCP: agregar el secret con `setx NOMBRE_VAR "valor"` (variables de usuario de Windows) **y** dejar la referencia `{env:NOMBRE_VAR}` en `opencode.json`.
2. `.env` es para runtime de la app (Next.js), no para los MCPs.
3. Si un secret está solo en `.env`, el MCP que lo necesita **no arrancará**.

## 🚑 3. Diagnóstico: "un MCP no carga"

Síntoma: las tools del MCP no aparecen en el catálogo del agente (p. ej. no hay `tools.supabase.*`).

1. Verificar presencia en el proceso: `Get-Item "Env:SUPABASE_ACCESS_TOKEN"` → si no existe, la variable solo está en `.env`.
2. Fix: leer el valor desde `.env` y registrarlo con `setx` (sin imprimirlo en el chat).
3. **Reiniciar OpenCode** — `setx` solo afecta procesos nuevos.
4. Verificación rápida: en la sesión nueva, `search({ query: 'supabase' })` en Code Mode debe devolver las tools del MCP.

## 🧭 4. Qué herramienta usar para cada tarea

- **Consultar/mutar la BD de producción** (tablas, RPCs, RLS, datos): MCP `supabase` (`execute_sql`, introspección). Alternativa read-only sin MCP: API REST de Supabase (`{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, OpenAPI en la raíz enumera tablas y RPCs; el spec `/rest/v1/` lista todas las RPCs existentes).
- **Diferencias repo ↔ producción**: las migraciones en `supabase/migrations/` NO están garantizadas como aplicadas. Antes de asumir que algo existe en producción, verificar contra la BD real (histórico: `rpc_grant_activity_reward` y `missions_progress` están en una migración del repo pero NO en producción).
- **Repo (issues, PRs, código en GitHub)**: MCP `github`.
- **Automatizaciones de la agencia (workflows n8n)**: MCP `n8n-mcp`.

## 🔐 5. Pendientes de seguridad

- [ ] **Rotar** el `SUPABASE_ACCESS_TOKEN` (dashboard Supabase → Access Tokens) — quedó expuesto en chats.
- [ ] **Rotar** el `GITHUB_PERSONAL_ACCESS_TOKEN` (GitHub → Settings → Developer settings) — quedó expuesto en chats.
- [ ] Al rotar, repetir el `setx` con el valor nuevo (la referencia en `opencode.json` no cambia).
- [ ] Recordar: jamás pegar tokens en `opencode.json`, skills, docs o código — el repo es git.
