# Architecture — Unified & Standalone Layouts

## Tech Stack

| Layer | Technology | Where |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 16 + pgvector | Docker `docker-compose.yml` at **repo root** → host port **5438** |
| **Cache / Queues** | Redis 7 | Same compose → host port **6379** |
| **Search Engine** | Meilisearch | Same compose → host port **7700** |
| **ORM** | Prisma (`@rri/database`) | `packages/database/prisma/schema.prisma` |
| **Backend** | NestJS modular monolith | `apps/unified-api/` (Port **3001**) imports `modules/*` |
| **Frontend** | Next.js Unified Client | `apps/web/` (Port **3000**) |
| **AI Python Microservice** | FastAPI | `apps/ai-services/` (Port **8000**) (Optional forecasting AI predictions) |

---

## Workspace Layout & Conventions

The repository uses `pnpm` workspaces for multi-package coordination:

```text
r-revenue-intelligence-monorepo/
├── apps/
│   ├── unified-api/           # Unified monolithic entrypoint (port :3001)
│   ├── web/                   # Next.js UI workspace (port :3000)
│   └── ai-services/           # Python FastAPI AI predictions service (port :8000)
├── modules/                   # Individual functional packages (imported by API & UI)
│   ├── m01-capture-transcription/
│   ├── m02-conversation-intelligence/
│   ├── m03-ai-summaries-genai/
│   ├── m04-deal-intelligence/
│   ├── m05-account-intelligence/
│   ├── m06-forecasting-prediction/
│   ├── m07-revenue-dashboards/
│   ├── m08-sales-engagement/
│   ├── m09-coaching-training/
│   ├── m10-data-compliance/
│   ├── m11-ai-deep-researcher/
│   └── platform-core/         # Common Nest configurations, filters, and providers
└── packages/                  # Shared system components
    ├── database/              # Single schema & migrations source of truth
    └── shared-types/          # Type structures shared between backend & client
```

---

## Port Allocations (Standalone vs. Unified)

In **Unified Monolith Mode** (recommended), all endpoints are served through the central frontend (`:3000`) and central backend (`:3001`). For isolated feature testing, **Standalone Mode** runs services on independent ports:

| Module | Feature Name | Backend Port (Standalone) | Frontend Port (Standalone) | Unified Routing Mapping |
| :--- | :--- | :---: | :---: | :--- |
| **M01** | Capture & Transcription | `3001` | `5174` | Unified UI: `:3000` / Unified NestJS API: `:3001` |
| **M02** | Conversation Intelligence | `3002` | `5175` | Unified UI: `:3000` / Unified NestJS API: `:3001` |
| **M03** | AI Summaries & GenAI | `4010` | `5177` | Unified UI: `:3000` / Unified NestJS API: `:3001` |
| **M05** | Account Intelligence | `4012` | `5179` | Unified UI: `:3000` / Unified NestJS API: `:3001` |
| **M07** | Revenue Dashboards | `4013` | `5180` | Unified UI: `:3000` / Unified NestJS API: `:3001` (proxied/fallback) |
| **M09** | Coaching & Training | `4009` | `5176` | Unified UI: `:3000` / Unified NestJS API: `:3001` |
| **M10** | Data & Compliance | `4011` | `5178` | Unified UI: `:3000` / Unified NestJS API: `:3001` |

---

## API Surface Gateway Routing

1. **API Bridges**: The unified client makes requests under the path `/api/...` or `/api/v1/...`. 
2. **Next.js Rewrite Engine**: The frontend `next.config.ts` proxies all API gateway requests directly to port `3001` (NestJS Unified API).
3. **Session Injector**: For local development convenience without full JWT services, development headers (`x-tenant-id` and `x-user-id`) are automatically attached to downstream requests.

---

## Database Infrastructure

The database layout is managed by a single centralized Prisma ORM schema under `packages/database/prisma/schema.prisma`. 
* All modules share the same database instance running on port `5438` (Dockerized).
* Schema changes require regenerating client binaries via `pnpm run db:generate` to verify TypeScript compile safety.
* The `directUrl` configuration supports pooling mechanics.
