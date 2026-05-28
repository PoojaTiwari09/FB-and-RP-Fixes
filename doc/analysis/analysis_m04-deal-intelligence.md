# Module Analysis — `m04-deal-intelligence`

> Order #6 in the lifecycle (per your chart): "Manages deals board, detects deal risk, updates deal stages". Depends on M03 (`call.summary.generated`) + M05 (`tracker.detection.created`).
>
> ⚠ **Currently disabled in `apps/api/src/app.module.ts`**. Use this file to plan the re-enablement.

---

## 1. Purpose

The deepest module in the platform: the deal board itself (Kanban + warnings + AI scoring + playbooks + summaries + analytics + exports + HubSpot sync). 177 TypeScript files. Effectively an internal SaaS product.

Maps to TDDs:

* `M4 Deal Intelligence/TDD/TDD- Deals Boards.md`
* `M4 Deal Intelligence/TDD/TDD - View Deal Drivers.md`
* `M4 Deal Intelligence/M4-drift-analysis.md`

---

## 2. Layout (high level)

```
modules/m04-deal-intelligence/
├── m04-deal-intelligence.module.ts                ⚠ TypeORM-based
├── prisma/schema.prisma                           extensive — M04Deal, M04DealWarning, …
├── entities/                                      TypeORM entity classes (parallel to Prisma)
│   ├── deal.entity.ts, deal-warning.entity.ts, deal-playbook.entity.ts, …
│   └── 15+ entity files
├── controllers/  (~35)
│   ├── deal-board.controller.ts                   deals/boards CRUD
│   ├── deal.controller.ts
│   ├── deal-summary.controller.ts                 + SummaryManagementController
│   ├── deal-warning.controller.ts                 + WarningManagementController
│   ├── deal-playbook.controller.ts
│   ├── deal-task.controller.ts                    + TaskManagementController
│   ├── deal-comment.controller.ts
│   ├── deal-activity.controller.ts
│   ├── risk-escalation.controller.ts
│   ├── ai-score.controller.ts
│   ├── coaching.controller.ts
│   ├── export.controller.ts
│   ├── webhook.controller.ts                      HubSpot inbound
│   ├── analytics.controller.ts
│   ├── settings.controller.ts
│   ├── sync.controller.ts                         CRM sync
│   ├── auth.controller.ts                         JWT login (overlaps with M09 auth)
│   └── …
├── services/  (~43)
│   ├── deal-board.service.ts
│   ├── deal.service.ts
│   ├── hubspot-client.service.ts
│   ├── ai-client.service.ts
│   ├── crm-sync.service.ts
│   ├── deal-sync.service.ts
│   ├── ai-score.service.ts
│   ├── deal-warning.service.ts
│   ├── deal-summary.service.ts
│   ├── deal-drivers.service.ts
│   ├── deal-playbook.service.ts
│   ├── deal-task.service.ts
│   ├── deal-comment.service.ts
│   ├── deal-activity.service.ts
│   ├── coaching.service.ts
│   ├── export.service.ts
│   ├── notifications.service.ts
│   ├── analytics.service.ts
│   ├── audit-log.service.ts / audit.service.ts
│   ├── webhook.service.ts
│   ├── settings.service.ts
│   ├── teams.service.ts, targets.service.ts, users.service.ts
│   └── …
├── repositories/
│   ├── deal-board.repository.ts
│   ├── deal-drivers.repository.ts
│   └── deal.repository.ts
├── database/database.module.ts                    ⚠ TypeORM DataSource
├── middleware/, decorators/, guards/, dto/, schemas/, seeds/, events/, queues/, migrations/
└── *.spec.ts                                      5 Jest specs (only module with tests)
```

---

## 3. Frontend (vendored Vite app)

`apps/web/src/modules/m04-deal-intelligence/` is its own Vite + Zustand app:

* `package.json`, `vite.config.js`, `index.html`, `main.tsx`, `App.tsx`, `index.css`.
* `api/`, `components/`, `layouts/`, `lib/`, `pages/`, `src/`, `stores/`.
* Uses Zustand stores for deal board state, filters, board permissions.

Top-level Next routes for M04 do not exist yet (`apps/web/src/app/` has no `deals/` folder). The vendored app would need to be either rebuilt as part of `apps/web` or iframed in.

---

## 4. API surface (representative)

Base path is per-controller (`/deals`, `/boards`, `/analytics`, `/sync`, `/auth`, …). Notable endpoints:

* `GET /boards`, `POST /boards`, `PATCH /boards/:id`, `GET /boards/:id/columns`, `POST /boards/:id/columns`.
* `GET /deals`, `POST /deals`, `PATCH /deals/:id`, `DELETE /deals/:id`.
* `POST /deals/:id/warnings/dismiss`, `GET /warnings/definitions`.
* `POST /sync/hubspot/full`, `POST /sync/hubspot/incremental`.
* `POST /webhooks/hubspot` (HMAC).
* `GET /analytics/snapshots?period=...`.
* `POST /exports/deals.csv`.

These paths are **not** prefixed with `/api/v1/...` like other modules — see `API Design Standards.md` mismatch.

---

## 5. Database (unified schema mapping)

The unified `schema.prisma` covers most M04 concepts:

| Unified model | M04 entity |
| ------------- | ---------- |
| `Deals` | `Deal`, `M04Deal` |
| `DealActivities` | `DealActivity` |
| `DealComments` | `DealComment` |
| `DealTasks` | `DealTask` |
| `DealWarnings` | `DealWarning` |
| `DealSummaries` | `DealSummary` |
| `DealPlaybooks` | `DealPlaybook` |
| `AnalyticsSnapshots` | `AnalyticsSnapshot` |
| `AuditLogs` | `AuditLog` |
| `SyncLog` | `SyncLog` |
| `User`, `Session`, `UserPreference` | M04-local but should consolidate with platform-wide `Users` |

> See `implementation_changes.md` §C5 for the TypeORM → Prisma migration.

---

## 6. Async / queues

`modules/m04-deal-intelligence/queues/` (declared) defines BullMQ workers for:

* CRM sync (full + incremental).
* AI score recompute (when warning rules change).
* Notification fan-out (deal stage changed → email/slack via M08).

No queue is registered at the root because M04 is disabled.

---

## 7. Events

| Direction | Event |
| --------- | ----- |
| IN  | `call.summary.generated` (M03) | refresh deal brief |
| IN  | `tracker.detection.created` (M02) | bump warning score |
| OUT | `deal.stage.changed` | M08 (workflows), M06 (forecasts) |
| OUT | `deal.risk.flagged` | M09 (coaching) |

---

## 8. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| CRITICAL | TypeORM + Prisma both declared. Pick one (Prisma, per the unification goal). |
| HIGH | Module commented out of `AppModule`. Until the TypeORM → Prisma migration is done, M04 endpoints are unreachable. |
| HIGH | `User`, `Session`, `UserPreference` defined locally — collide with the cross-module `Users` table. |
| HIGH | `AuthController` here ships its own JWT issuer; overlaps with M09 `AuthController`. Need a single auth module in `platform-core`. |
| MEDIUM | Vendored frontend is a separate Vite app — not part of `pnpm dev`. |
| MEDIUM | No `m04.controller.ts`-style umbrella — 35 controllers fanned out by feature, each registering its own routes. Some paths overlap. |
| LOW | `notifications.service.ts` references Slack/email but the platform has no notification service (see Reference ADR-002 in M8). |

---

## 9. Re-enablement plan

1. Remove `@nestjs/typeorm` + `typeorm` from `apps/api/package.json` (already done in §A4) and from `modules/m04-deal-intelligence/package.json`.
2. Delete `entities/*.entity.ts` after porting any business logic into Prisma model usage.
3. Replace `DatabaseModule` (`database/database.module.ts`) with `PrismaModule` imported from `@rri/database`.
4. Rewrite `repositories/deal*.repository.ts` to use `PrismaService` (use existing M01 `call.repository.ts` as the reference pattern).
5. Uncomment `M04DealIntelligenceModule` in `apps/api/src/app.module.ts`.
6. Run the existing Jest specs (`*.spec.ts`) — keep them green.

---

## 10. Smoke checklist (post-reenable)

* `GET /api/v1/deals` returns `[]`.
* `POST /api/v1/deals` creates a deal; `aiScore` defaults to 0.
* `POST /api/v1/sync/hubspot/incremental` returns 202 (with valid `HUBSPOT_*` env).
* `POST /api/v1/webhooks/hubspot` with valid HMAC signature returns 200.
* `GET /api/v1/analytics/snapshots?period=2026Q2` returns array.
* Jest: `pnpm --filter "@r-revenue/m04-deal-intelligence" test` green.
