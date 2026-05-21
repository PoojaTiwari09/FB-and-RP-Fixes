# M10 Data & Compliance — Revenue Graph

**TDD Doc #11a · v3.0 · Approved**

## Overview

The **Revenue Graph** feature is implemented within `modules/m10-data-compliance/revenue-graph/`. It is the relational mapping layer that connects raw captured interactions (calls, meetings, emails) to the correct tenant, account, contact, deal, and activity timeline.

---

## File Structure

```
modules/m10-data-compliance/
├── revenue-graph/
│   ├── controllers/
│   │   └── revenue-graph.controller.ts   # REST API — /api/v1/m10-data-compliance/*
│   ├── services/
│   │   └── revenue-graph.service.ts      # Entity linking pipeline (FR1–FR6)
│   ├── repositories/
│   │   └── revenue-graph.repository.ts   # Sole DB access layer for m10_* tables
│   ├── workers/
│   │   └── revenue-graph.worker.ts       # BullMQ worker — consumes M1 events
│   ├── events/
│   │   └── revenue-graph.events.ts       # Event name constants (M10_*)
│   ├── schemas/
│   │   └── revenue-graph.schema.ts       # Zod validation schemas
│   ├── dto/
│   │   └── response-revenue-graph.dto.ts # Response type interfaces
│   └── revenue-graph.module.ts           # NestJS sub-feature module
├── prisma/
│   └── schema.prisma                     # Full m10_data_compliance schema
├── database/                             # PrismaModule (existing boilerplate)
└── m10-data-compliance.module.ts         # Root module — imports RevenueGraphModule
```

Frontend:
```
apps/web/src/modules/m10-data-compliance/
├── api/revenue-graph.api.ts              # Typed API client
├── types/revenue-graph.types.ts          # TypeScript interfaces
├── components/RevenueGraphDashboard.tsx  # Main dashboard component
└── revenue-graph/page.tsx               # Next.js page route
```

---

## API Endpoints (TDD §7)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/m10-data-compliance/accounts` | List accounts (paginated) |
| GET | `/api/v1/m10-data-compliance/accounts/:id` | Single account |
| GET | `/api/v1/m10-data-compliance/deals` | List deals (paginated, filterable) |
| GET | `/api/v1/m10-data-compliance/deals/:id` | Single deal |
| GET | `/api/v1/m10-data-compliance/deals/:id/relationship` | Full relationship graph |
| GET | `/api/v1/m10-data-compliance/contacts/:id` | Single contact |
| POST | `/api/v1/m10-data-compliance/crm-sync` | Trigger CRM sync |
| GET | `/api/v1/m10-data-compliance/crm-sync-status` | CRM sync state |

---

## Entity Linking Pipeline (TDD §5.2)

```
M1 → call.transcription.completed
         ↓ BullMQ (M10_LINKING_QUEUE_NAME)
     RevenueGraphWorker
         ↓ validate Zod schema + tenantId guard
     RevenueGraphService.processInteractionLinking()
         ↓ 1. Exact email match → contacts
         ↓ 2. Domain → account (skip gmail/yahoo/outlook)
         ↓ 3. Open deals on account → deal
         ↓ 4. AI fallback (Python via M10_AI_SERVICE_BASE_URL) — only if ambiguous
         ↓ 5. Upsert m10_interaction_links (idempotent)
         ↓ 6. Audit log → m10_link_decision_logs
         ↓ 7. Publish revenue_graph.entity.linked (if WRITE_ENABLED)
```

---

## Environment Variables (TDD §8)

| Variable | Default | Description |
|----------|---------|-------------|
| `M10_REVENUE_GRAPH_ENABLED` | `true` | Master toggle |
| `M10_REVENUE_GRAPH_WRITE_ENABLED` | `true` | Enables DB writes |
| `M10_REVENUE_GRAPH_PUBLISH_EVENTS` | `true` | Toggles event publication |
| `M10_ENTITY_RESOLUTION_MIN_CONFIDENCE` | `0.78` | AI confidence threshold |
| `M10_AI_SERVICE_BASE_URL` | `http://localhost:8000` | Python AI service |
| `M10_CRM_CONTEXT_API_BASE_URL` | — | CRM adapter base URL |
| `M10_CRM_CONTEXT_API_KEY` | — | CRM adapter API key |
| `M10_LINKING_QUEUE_NAME` | `revenue-graph-linking` | BullMQ queue name |
| `M10_DATABASE_URL` | — | PostgreSQL connection |
| `M10_API_PORT` | `3010` | Service port |

---

## Key Architectural Rules

- **No cross-module DB access** — only `RevenueGraphRepository` touches `m10_*` tables
- **Deterministic-first** — AI resolution is called ONLY when deterministic score is insufficient
- **Idempotency** — `m10_activities.idempotencyKey` prevents duplicate rows on retry (FR-5)
- **RLS enforced** — all queries include `tenantId`; PostgreSQL RLS blocks cross-tenant reads
- **ADR-005** — deal stage changes route via M10 (not M4 directly); M10 emits `deal.stage.changed`
