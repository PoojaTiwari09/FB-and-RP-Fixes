# Architecture — Backend & Frontend Only

## Stack

| Layer | Technology | Where |
|-------|------------|--------|
| Database | PostgreSQL 16 + pgvector | Docker `docker-compose.yml` at **repo root** → host **5433** |
| Cache / queues | Redis 7 | Same compose → **6379** |
| ORM | Prisma (`@rri/database`) | `packages/database/prisma/schema.prisma` |
| Backend | NestJS per module | `apps/mXX-api` → imports `modules/mXX-*` |
| Frontend | Vite or Next per module | `apps/web/src/modules/mXX-*` |
| Optional AI | FastAPI | `apps/ai-services` → **8000** (only if M03/M01 AI features needed) |

**Not used for local dev:** full-stack Docker builds (removed duplicate compose files). Meilisearch / ClickHouse are optional and disabled via `.env` (`DISABLE_MEILI=true`).

## Module map

| Module | Backend package | API app | API port | Web app | Web port | Database |
|--------|-----------------|---------|----------|---------|----------|----------|
| M01 Capture & Transcription | `modules/m01-capture-transcription` | `m01-api` | 3001 | `@rri/m01-web` | 5174 | Postgres `@rri/database` |
| M02 Conversation Intelligence | `modules/m02-conversation-intelligence` | `m02-api` | 3002 | `@rri/m02-web` | 5175 | Postgres + optional Redis |
| M03 AI Summaries & GenAI | `modules/m03-ai-summaries-genai` | `m03-api` | 4010 | `@rri/m03-web` | 5177 | Postgres |
| M04 Deal Intelligence | `modules/m04-deal-intelligence` | monolith `apps/api` | 3001 | m04 Vite | 5173 | Postgres (use monolith only) |
| M05 Account Intelligence | `modules/m05-account-intelligence` | `m05-api` | 4012 | `@rri/m05-web` | 5179 | Postgres (in-memory demo fallback) |
| M06 Forecasting | `modules/m06-forecasting-prediction` | monolith `apps/api` | 3001 | monolith `apps/web` | 3005 | Postgres `@rri/database` |
| M07 Revenue Dashboards | `modules/m07-revenue-dashboards` | `m07-api` | 4013 | `@rri/m07-web` | 5180 | Postgres (`dashboards` schema) |
| M08 Sales Engagement | `modules/m08-sales-engagement` | monolith `apps/api` | 3001 | monolith `apps/web` | 3005 | Postgres + Redis queues |
| M09 Coaching & Training | `modules/m09-coaching-training` | `m09-api` | 4009 | `@rri/m09-web` | 5176 | Postgres |
| M10 Data & Compliance | `modules/m10-data-compliance` | `m10-api` | 4011 | `@rri/m10-web` | 5178 | Postgres (`M10_DATABASE_URL` = same DB) |

## API surfaces

| UI generation | Base path | Notes |
|---------------|-----------|--------|
| Legacy standalone UI | `/api/v1/<module>/...` | Unchanged; each module’s existing controllers |
| New Figma UI | `/api/...` | Bridge controllers under `modules/*/frontend-api/` |

Do not run **monolith** `pnpm dev` (api + web on 3001/3005) at the same time as **m01-api** on 3001.

## Environment

Copy `.env.example` → `.env`. Required for backends:

```env
DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
DIRECT_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
M10_DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public
```

## Folder conventions

```text
modules/mXX-<name>/          # Domain: services, Prisma module schema, frontend-api bridges
apps/mXX-api/                # Thin Nest bootstrap (PORT, CORS, module import)
apps/web/src/modules/mXX/    # Standalone Vite/Next UI for that module
packages/database/           # Single source of truth for migrations
```

Removed from repo (do not restore): nested `Boilerplate Setup/r-ri` example monorepo, duplicate `docker-compose.yml` under this app, archived smoke/test doc trees.
