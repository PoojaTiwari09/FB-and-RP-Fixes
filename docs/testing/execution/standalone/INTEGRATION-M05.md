# M05 Account Intelligence — standalone dev stack

Run M05 without the monolith API or Next.js web app.

## Ports

| Service  | URL |
|----------|-----|
| m05-api  | http://localhost:4012 |
| m05-web  | http://localhost:5179 |

API base: `http://localhost:4012/api/v1/account-intelligence`

## Prerequisites

Optional: Postgres (`DATABASE_URL` in monorepo `.env`). M05 uses an **in-memory demo store** by default (board slug `demo`).

```powershell
pnpm install
```

## Start

**Terminal 1 — API**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm run dev:m05-api
```

**Terminal 2 — UI**

```powershell
pnpm run dev:m05-web
```

Or both:

```powershell
pnpm run dev:m05
```

Open http://localhost:5179 — redirects to http://localhost:5179/board/demo

## Health

- `GET http://localhost:4012/api/v1/account-intelligence/test/health`
- `GET http://localhost:4012/api/v1/account-intelligence/boards`
- Root: http://localhost:4012/

## Free ports

```powershell
.\scripts\free_ports_m05.ps1
```

## Demo seed (local UI)

Loads on API boot and via `POST /test/seed`:

| Board | URL |
|-------|-----|
| demo | http://localhost:5179/board/demo |
| commercial | http://localhost:5179/board/commercial |

Includes **5 accounts** (4 on `demo`, 1 on `commercial`), **14+ activities**, **6 deals**, **contacts**, **todos/notes**, **3 board tabs** (All / High ARR / At Risk), engagement-gap seed (Umbrella Corp), role permissions (rep/manager/admin).

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4012/api/v1/account-intelligence/test/seed"
Invoke-RestMethod -Uri "http://localhost:4012/api/v1/account-intelligence/test/verification"
```

**Full verification table:** `M05-VERIFICATION.md`

## HubSpot live sync

Set `HUBSPOT_ACCESS_TOKEN` and `HUBSPOT_PORTAL_ID` in `.env`, restart **m05-api**.

1. Open board UI → switch role to **admin**
2. Click **Sync now** (or `POST /api/v1/account-intelligence/sync/trigger` with `{"role":"admin"}`)

Pulls real companies, contacts, and deals from your HubSpot portal into the store.

Do not commit tokens to git; rotate the PAT if exposed.
