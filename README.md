# Revenue Intelligence

Runnable **backend + frontend** per module. **Docker** = Postgres + Redis only. **pnpm** = all APIs and UIs.

## Repository layout

```text
r-revenue-intelligence-monorepo/          ← git root (push this folder)
├── docker-compose.yml                    # Postgres :5433, Redis :6379
├── .env.example                          # copy → app .env (see below)
├── doc/                                  # API docs + integration contracts
└── boilerplate code/r-revenue-intelligence/   ← application (pnpm commands here)
    ├── apps/m01-api … m10-api
    ├── apps/web/src/modules/m01 … m10
    ├── modules/m01 … m10
    └── packages/database
```

## Quick start

**1. Start database (from this folder — repo root)**

```powershell
docker compose up -d
```

**2. Install app dependencies**

```powershell
cd "boilerplate code\r-revenue-intelligence"
pnpm install
pnpm run db:generate
```

**3. Environment**

```powershell
copy ..\..\.env.example .env
# Or merge into existing .env — must use port 5433
```

**4. Run a module (example M01)**

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm run dev:m01-api
pnpm run dev:m01-web
```

| Doc | Path |
|-----|------|
| All module ports & commands | [boilerplate code/r-revenue-intelligence/RUNBOOK.md](./boilerplate%20code/r-revenue-intelligence/RUNBOOK.md) |
| DB per module, API layout | [boilerplate code/r-revenue-intelligence/ARCHITECTURE.md](./boilerplate%20code/r-revenue-intelligence/ARCHITECTURE.md) |
| Legacy `/api/v1` routes | [doc/execution/api-docs/](./doc/execution/api-docs/) |

## Rules

| Do | Don't |
|----|--------|
| `docker compose` from **repo root** | Old parent `final_product/` compose (not in this repo) |
| `pnpm run dev:mXX-api` + `dev:mXX-web` | Monolith `apps/api` and `m01-api` both on **3001** |
| `DATABASE_URL` with port **5433** | Port 5432 from stale examples |

Dev headers (when JWT not wired): `x-tenant-id: 00000000-0000-0000-0000-000000000001`, `x-user-id: 00000000-0000-0000-0000-000000000002`

**Prisma `EPERM` on generate:** stop dev servers → `.\scripts\free_ports_all.ps1` → `pnpm run db:generate`
