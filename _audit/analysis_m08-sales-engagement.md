# Module Analysis — `m08-sales-engagement`

> Order #7 in the lifecycle (per your chart): "Sends emails, automates sales plays, triggers outreach workflows". Depends on M03 (`call.summary.generated`) + M04 (`deal.stage.changed`).

---

## 1. Purpose

Workflow automation & outreach:

* **Email Composer** — drafts emails grounded in deal/account context.
* **Engage To-Do** — engagement queue per rep.
* **Orchestrate (Sales Plays)** — multi-step sequences (call → email → wait → email).
* **Workflow Automation** — generic event-driven workflow engine (trigger → branches → actions).

Maps to TDDs:

* `M8 Sales Engagement/TDD/TDD-Email Composer.md`
* `M8 Sales Engagement/TDD/TDD-Engage To-Do.md`
* `M8 Sales Engagement/TDD/TDD-Orchestrate.md`
* `M8 Sales Engagement/TDD/TDD-Workflow Automation.md`
* `M8 Sales Engagement/ADR-001-M8-Product-vs-Architecture-Boundary.md` — declares M-08 (architecture) vs M8 (product).
* `M8 Sales Engagement/ADR-002-Platform-Notification-Service.md` — calls for a shared notification service.

---

## 2. Layout

```
modules/m08-sales-engagement/
├── m08-sales-engagement.module.ts
├── prisma/schema.prisma
├── controllers/
│   ├── m08.controller.ts
│   ├── task.controller.ts
│   └── workflow.controller.ts
├── services/
│   ├── m08.service.ts
│   ├── task.service.ts
│   ├── workflow.service.ts
│   └── prisma.service.ts
├── repositories/
│   ├── m08.repository.ts
│   ├── task.repository.ts
│   └── workflow.repository.ts
└── seeds/, schemas/, interfaces/, events/, database/, migrations/
```

---

## 3. Frontend

`apps/web/src/modules/m08-sales-engagement/` contains only **1 file** today (an `.gitkeep` or stub). All UI for M08 (Email Composer, Sales Play composer, Engage To-Do queue) is missing in the codebase — only TDDs exist.

> See `implementation_changes.md` §F4.

---

## 4. API surface

Base path: `/api/v1/sales-engagement`.

| Method | Path | Handler |
| ------ | ---- | ------- |
| GET    | `/` | `m08` umbrella |
| GET    | `/workflows`, `/workflows/:id` |
| POST   | `/workflows` |
| PATCH  | `/workflows/:id` |
| POST   | `/workflows/:id/trigger` |
| GET    | `/workflows/:id/runs` |
| GET    | `/tasks`, `/tasks/:id` |
| POST   | `/tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` |
| POST   | `/emails/draft` (generates a draft from deal/account context) |

---

## 5. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `Workflows` | trigger type/conditions, definition (JSON), versions. ⚠ Duplicate `triggerevent` (lowercase) — see §B2. |
| `WorkflowRuns` | per-execution state, variables, logs. |
| `WorkflowAuditLogs` | per-step audit trail. |
| `WorkflowExceptions` | failure records with stack trace. |
| `Tasks` (engagement to-dos) | persist per-rep queue. |
| `EmailDrafts` (new) | not in unified yet — add. |
| `SalesPlays` (new) | declared in TDD; not in unified yet — add. |

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `call.summary.generated` (M03) — triggers email draft generation |
| IN  | `deal.stage.changed` (M04) — kicks orchestration step transitions |
| OUT | `workflow.run.started`, `workflow.run.completed`, `workflow.run.failed` |
| OUT | `engagement.task.created` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| CRITICAL | Frontend is essentially empty — none of the four product surfaces have UI yet. |
| HIGH | `Workflows` model has duplicate trigger fields. |
| HIGH | No notification service backend (per ADR-002). Email delivery integration is undefined. |
| MEDIUM | No worker registered — workflow execution must run on a queue (`m08-workflow-runs-queue`) but only the queue NAME is implied in TDDs. |
| LOW | `task.controller.ts` overlaps with M04 `deal-task.controller.ts`. Decide single ownership. |

---

## 8. Smoke checklist

* `GET /api/v1/sales-engagement/workflows` returns `[]`.
* `POST /api/v1/sales-engagement/workflows` returns 201 with `version: 1`.
* `POST /api/v1/sales-engagement/workflows/:id/trigger` returns 202.
* `GET /api/v1/sales-engagement/workflows/:id/runs` returns the run with `status:'started'`.
* `GET /api/v1/sales-engagement/tasks` returns `[]`.
