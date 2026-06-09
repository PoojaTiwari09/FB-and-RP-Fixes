# M09 Coaching & Training — standalone dev stack

Run the M09 backend and Next.js UI without the monolith.

## Ports

| Service   | URL |
|-----------|-----|
| m09-api   | http://localhost:4009 |
| m09-web   | http://localhost:5176 |
| Postgres  | `DATABASE_URL` in monorepo `.env` (typically `127.0.0.1:5433`) |

API base path (matches frontend `NEXT_PUBLIC_API_BASE_URL`):

`http://localhost:4009/api/v1/coaching-training`

## Prerequisites

1. Postgres running and `DATABASE_URL` set in monorepo root `.env`
2. Optional LLM: `GROQ_API_KEY` in the same `.env` (coaching AI features)

From the monorepo root:

```powershell
pnpm install
```

## Start

**Terminal 1 — API**

```powershell
pnpm run dev:m09-api
```

**Terminal 2 — UI**

```powershell
pnpm run dev:m09-web
```

Or both (PowerShell):

```powershell
pnpm run dev:m09
```

## Demo login

On boot, `M09_AUTO_SEED=true` seeds in-memory users (password for both: `password123`):

| Role    | Email |
|---------|-------|
| Manager | `manager@example.com` |
| Rep     | `rep@example.com` |

Open http://localhost:5176/login

## Health / seed

- `GET http://localhost:4009/api/v1/coaching-training/test/health`
- `POST http://localhost:4009/api/v1/coaching-training/test/seed` (re-seed)
- Swagger: http://localhost:4009/api/v1/coaching-training/docs
- Root info: http://localhost:4009/

## Free ports (Windows)

```powershell
.\scripts\free_ports_m09.ps1
```

## Env files

| File | Purpose |
|------|---------|
| `apps/m09-api/.env` | `M09_API_PORT`, CORS, auto-seed |
| `apps/web/src/modules/m09-coaching-training/.env.local` | `NEXT_PUBLIC_API_BASE_URL` |
