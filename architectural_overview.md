# Architectural Overview — Revenue Intelligence Monorepo

This monorepo contains the end-to-end codebase for the **Revenue Intelligence Platform**. It is structured to support clean separation of concerns, modularized domain backends, and a unified responsive Next.js frontend.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    UI[Next.js Frontend: Port 3000] -->|HTTP Request Proxy| API[NestJS Unified API: Port 3001]
    
    subgraph Backend Monorepo [NestJS Application Layout]
        API --> Modules[Domain Modules: modules/m01 ... m10]
        Modules --> Prisma[Prisma ORM Client]
    end

    subgraph Data & Services [Infrastructure Services]
        Prisma --> DB[(PostgreSQL 16 + pgvector: Port 5433)]
        Modules --> Cache[(Redis Cache / Queues: Port 6379)]
        Modules -->|Optional| AI[AI APIs: OpenAI, Groq, Gemini]
    end
```

---

## 2. Technology Stack

| Layer | Component | Details / Tech |
|---|---|---|
| **Frontend** | **Next.js UI** | Next.js `16.2.6`, React `19.2.4`, Lucide Icons, TailwindCSS v4, Recharts |
| **Backend** | **NestJS API** | NestJS modular api backend with TypeScript support |
| **Database** | **PostgreSQL** | Postgres v16 with `pgvector` extension for semantic embedding storing |
| **ORM** | **Prisma** | Centralized database schema and client generator at `packages/database` |
| **Cache & Queue** | **Redis** | Redis v7 for caching, queues (used in sales engagement modules) |
| **Orchestration** | **Docker & scripts** | Docker compose for local DB/Cache setup, PowerShell script orchestration |

---

## 3. Monorepo Layout & Conventions

The workspace is organized into two main workspaces:
1. [unified-ui](file:///c:/Users/Relanto/OneDrive%20-%20Relanto/Downloads/Integration-107/r-revenue-intelligence-monorepo/unified-ui/): Next.js UI frontend.
2. [boilerplate code/r-revenue-intelligence](file:///c:/Users/Relanto/OneDrive%20-%20Relanto/Downloads/Integration-107/r-revenue-intelligence-monorepo/boilerplate%20code/r-revenue-intelligence/): NestJS backend modules.

```text
r-revenue-intelligence-monorepo/
├── docker-compose.yml                      # Infrastructure (Postgres:5433, Redis:6379)
├── start-demo.ps1, stop-demo.ps1           # Demo orchestration scripts
├── unified-ui/                             # Next.js Frontend UI (:3000)
│   └── src/features/                       # Domain components (engage, calls, forecasting, etc.)
└── boilerplate code/r-revenue-intelligence/ # NestJS Backend Monorepo (:3001)
    ├── apps/                               # Slim NestJS bootstrap entrypoints
    │   └── unified-api/                    # The main unified backend API
    ├── modules/                            # Domain-specific logical modules
    │   ├── m01-capture-transcription/      # Transcript upload, processing
    │   ├── m02-conversation-intelligence/   # Conversation reviews, tracker logic
    │   ├── m06-forecasting-prediction/     # Revenue predictor, forecast boards backend
    │   ├── m08-sales-engagement/           # Tasks list, emails, phone integration, snooze
    │   └── m09-coaching-training/          # AI trainer review modules
    └── packages/                           # Shared utility packages
        └── database/                       # Prisma Schema and migrations
```

---

## 4. Logical Flow & Authentication

1. **User Request & Roles**:
   - The user opens the frontend which serves a multi-tenant client.
   - Roles are managed via user session cookies (`sales_manager` or `sales_rep`). Switching a role updates the view states.
2. **Next.js Proxy Routing**:
   - Requests made to `/api/v1/...` in Next.js are proxied directly to the NestJS Unified API running at port `3001`.
   - Tenant headers (`x-tenant-id` and `x-user-id`) are automatically injected by the Next.js middleware for local developer convenience when JWT is bypassed.
3. **Domain & Data Access**:
   - The controllers in NestJS delegate database queries to domain-level services.
   - Data access is handled by the shared `@rri/database` package containing the single Prisma client configuration.

---

## 5. Domain Modules Breakdown

- **M01 Capture & Transcription**: Extracts speaker segments and logs transcripts. Uses `pgvector` to enable semantic searches over conversations.
- **M02 Conversation CI**: Extracts business trackers (pricing objections, timeline comments) using keywords and regex engines.
- **M06 Forecasting & Prediction**: Tracks forecast boards (reps submitting estimates) and runs prediction calculations for manager overrides.
- **M08 Sales Engagement (Engage)**: Supports multi-channel tasks (Calls, Emails, LinkedIn, Custom ToDos) for sales reps, and performance monitoring dashboards for managers.
- **M09 Coaching & Training**: Allows managers to audit calls, insert coaching notes, and compile AI Trainer reports.
- **M10 Data & Compliance**: Audits data access logs and registers PII masking patterns.
