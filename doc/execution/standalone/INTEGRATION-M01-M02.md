# M01 ↔ M02 decentralised integration

Each module runs its own API and frontend. They share **one Postgres** database and connect over **HTTP**.

## Frontends (canonical UI in `apps/web/src/modules`)

The real UIs live under **`apps/web/src/modules/`** — not separate dummy apps.

| Module | Source | Standalone Vite | Unified Next.js (`apps/web`) |
|--------|--------|-----------------|------------------------------|
| M01 | `m01-capture-transcription/pages/` | http://localhost:5174 | http://localhost:3005/calls |
| M02 | `m02-conversation-intelligence/components/ConversationLibraryView.tsx` | http://localhost:5175 | http://localhost:3005/conversation-intelligence |

Vite only provides a dev server + proxy; it renders the **same** React components as Next.

## Ports

| Service | URL |
|---------|-----|
| M01 API | http://localhost:3001 |
| M02 API | http://localhost:3002 |
| M01 Web (Vite) | http://localhost:5174 |
| M02 Web (Vite) | http://localhost:5175 |
| Next web (optional) | http://localhost:3005 |
| Postgres | localhost:5433 |

## Flow

1. Upload audio in **M01 Web** → M01 API stores call + runs transcription.
2. On `call.transcription.completed`, M01 API **POSTs** to M02:
   `POST /api/v1/conversation-intelligence/ingest/from-transcription`
3. M02 indexes the call (shared DB) and emits `call.scored`.
4. **M02 Web** lists the call in Conversation Library (real transcript, not demo corpus).

M10 (Revenue Graph) is **skipped** in this phase.

## Dev tenant headers

```
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
```

## Port conflict fix

The monolith `.env` sets `PORT=3002`. Split APIs **ignore** `PORT` and use:

- `M01_API_PORT` (default **3001**) — see `apps/m01-api/.env`
- `M02_API_PORT` (default **3002**) — see `apps/m02-api/.env`

If `EADDRINUSE` on 3002, stop the old `apps/api` process:

```powershell
.\scripts\free_ports_m01_m02.ps1
```

## Start stack

```powershell
cd "<repo-root>"
docker compose up -d postgres redis

cd "r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
.\test_case\free_ports_m01_m02.ps1

# Terminal 1 — binds :3001 (not PORT from .env)
pnpm --filter m01-api run dev

# Terminal 2
pnpm --filter m02-api run dev

# Terminal 3 — M01 UI (module pages)
pnpm run dev:m01-web

# Terminal 4 — M02 UI (ConversationLibraryView)
pnpm run dev:m02-web

# Optional: single Next app with rewrites to both APIs
# copy apps/web/.env.local.example → apps/web/.env.local
# pnpm --filter web run dev  → /calls and /conversation-intelligence
```

Or use `test_case\run_m01_m02_integration.ps1`.

## Env (optional)

| Variable | Purpose |
|----------|---------|
| `M02_API_URL` | M01 → M02 ingest base (default `http://localhost:3002`) |
| `INTERNAL_SERVICE_KEY` | If set, M01 must send matching `x-service-key` |
| `DISABLE_REDIS=true` | M01 transcription queue inert (upload still works if worker runs) |
| `ASSEMBLYAI_API_KEY` | Required for real ASR |

## Demo acceptance

1. Open http://localhost:5174 → upload a short audio file.
2. Wait until call status is **Transcribed**.
3. Open http://localhost:5175 → Conversation Library shows that call with transcript text.
