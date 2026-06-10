# M10 Data & Compliance — standalone dev stack

Run M10 (Revenue Graph + Data Cloud) without the monolith.

## Ports

| Service  | URL |
|----------|-----|
| m10-api  | http://localhost:4011 |
| m10-web  | http://localhost:5178 |

API base: `http://localhost:4011/api/v1/m10-data-compliance`

## Prerequisites

Postgres (`DATABASE_URL` in monorepo `.env`). Redis optional (Bull queues lazy-connect).

```powershell
pnpm install
```

## Start

**Terminal 1 — API**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run dev:m10-api
```

**Terminal 2 — UI**

```powershell
pnpm run dev:m10-web
```

Or both:

```powershell
pnpm run dev:m10
```

## UI

| View | Description |
|------|-------------|
| Revenue Graph | Accounts, deals, CRM sync, entity linking |
| Data Cloud | Export connections, run history, replay |

Open http://localhost:5178

## Auth (standalone)

`M10_STANDALONE_AUTH=true` uses header auth (no JWT):

- `x-tenant-id`: `00000000-0000-0000-0000-000000000001`
- `x-user-id`: `00000000-0000-0000-0000-000000000002`

The Vite app sends these automatically.

## Health & smoke

- `GET http://localhost:4011/api/v1/m10-data-compliance/test/health`
- `GET http://localhost:4011/api/v1/m10-data-compliance/test/accounts`
- Root: http://localhost:4011/

## Seed demo data (Revenue Graph + Data Cloud)

Populates `m10_accounts`, `m10_deals`, `m10_contacts`, activities, CRM sync state, export connections, and export runs for the demo tenant.

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence?schema=public"
pnpm run seed:m10
```

Or via API (restart m10-api after first adding the route):

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4011/api/v1/m10-data-compliance/test/seed"
```

Refresh http://localhost:5178 — Revenue Graph and Data Cloud load from Postgres (not UI mocks).

## Free ports

```powershell
.\scripts\free_ports_m10.ps1
```

## Postgres tables (M10)

Revenue Graph uses `m10_accounts`, `m10_deals`, `m10_contacts`, etc. (see `packages/database/prisma/schema.prisma`). If empty, the UI falls back to rich mock data until CRM sync or seeds run.
