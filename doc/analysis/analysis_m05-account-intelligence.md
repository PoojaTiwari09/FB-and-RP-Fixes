# Module Analysis — `m05-account-intelligence`

> Order #4 in the lifecycle (per your chart): "Detects intent-based signals, tracks keywords, builds searchable conversation library". Depends on M02 (`call.scored`) + M10 (`revenue_graph.entity.linked`).

---

## 1. Purpose

Account-level intelligence: 360° account view, account boards, AI briefs cache, account-level todos and edit history, HubSpot sync, opt-in/out preferences.

Maps to TDDs:

* `M5 Account Intelligence/TDD/TDD - Account Boards.md`
* `M5 Account Intelligence/M5-drift-analysis.md`

---

## 2. Layout

```
modules/m05-account-intelligence/
├── m05-account-intelligence.module.ts
├── prisma/schema.prisma
├── controllers/
│   ├── m05.controller.ts                  base CRUD
│   ├── accounts.controller.ts             account list + detail
│   ├── activities.controller.ts           activity timeline (cross-call + cross-email)
│   ├── ai.controller.ts                   AI brief endpoint (cached via AiBriefsCache)
│   ├── boards.controller.ts               account board (Kanban-like)
│   ├── edits.controller.ts                audit trail of manual account edits
│   ├── preferences.controller.ts          user board preferences (filters/columns)
│   ├── sync.controller.ts                 HubSpot pull
│   ├── todos.controller.ts                follow-ups on accounts
│   └── webhook.controller.ts              HubSpot inbound (HMAC)
├── services/  (10)
│   ├── m05.service.ts, accounts.service.ts, activities.service.ts,
│   │ ai.service.ts, boards.service.ts, edits.service.ts,
│   │ preferences.service.ts, sync.service.ts, todos.service.ts, prisma.service.ts
├── repositories/m05.repository.ts
├── seeds/, schemas/, interfaces/, events/, database/, migrations/
└── (no workers — relies on M01 + M02 events)
```

---

## 3. Frontend

`apps/web/src/modules/m05-account-intelligence/`:

* `components/` (14 files) — AccountBoard view, AccountDetailPanel, BriefCard, BoardFilters, Todos list, ActivityTimeline, etc.

Top-level Next route: `apps/web/src/app/m05/page.tsx`.

---

## 4. API surface

Base path: `/api/v1/account-intelligence`.

| Method | Path |
| ------ | ---- |
| GET    | `/accounts`, `/accounts/:id` |
| GET    | `/accounts/:id/activities` |
| GET    | `/accounts/:id/ai/brief` (cached by `AiBriefsCache`) |
| POST   | `/accounts/:id/ai/regenerate-brief` |
| GET    | `/boards`, `/boards/:id` |
| POST   | `/boards/:id/columns/reorder` |
| GET    | `/preferences` (per-user board prefs) |
| POST   | `/preferences` |
| GET    | `/edits` |
| POST   | `/sync/hubspot` |
| GET/POST/DELETE | `/todos`, `/todos/:id` |
| POST   | `/webhooks/hubspot` |

---

## 5. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `Accounts` | Shared with M04, M10. |
| `AccountContacts` | Many-to-many account ↔ contact. |
| `Activities` | Shared event stream from M01 + connectors. |
| `AiBriefsCache` | Account brief cache (`companyHubspotId + scope + periodDays`). |
| `AccountBriefs` | Persisted long-form briefs. |
| `UserBoardPreferences` | Per-user filter/sort/columns. |
| `AccountEdits` (new) | If you need an immutable edit log just for accounts; otherwise reuse `AuditLogs`. |

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `revenue_graph.entity.linked` (M10) |
| IN  | `tracker.detection.created` (M02) — refresh account health signals |
| OUT | `account.health.updated` |
| OUT | `account.brief.refreshed` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | `Accounts` model carries duplicate-purpose columns (`assignedRepId`, `hubspotOwnerId`, `ownerUserId`). Pick one. |
| MEDIUM | `Accounts.healthscore` (lowercase, no `@map`) vs the more "correct" mapped names — see §B2 of `implementation_changes.md`. |
| MEDIUM | `webhook.controller.ts` HMAC secret env name is undocumented; align with `doc/reference/M5 Account Intelligence/Environment Variables Registry-M5*.md`. |
| LOW | `m05.controller.ts` overlaps with `accounts.controller.ts` (mock list/create). |

---

## 8. Smoke checklist

* `GET /api/v1/account-intelligence/accounts` returns `[]`.
* `GET /api/v1/account-intelligence/accounts/:id/ai/brief` returns 404 (or cached body) without errors.
* `POST /api/v1/account-intelligence/sync/hubspot` returns 202 with valid `HUBSPOT_ACCESS_TOKEN`.
* `POST /api/v1/account-intelligence/webhooks/hubspot` with valid HMAC returns 200.
