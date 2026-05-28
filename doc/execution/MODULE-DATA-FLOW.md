# Module data flow and integration guide

This document explains **how data should move across M01–M10**, what is wrong with the current standalone setup (per-module seeds), and **what to implement** so clicking from one module opens the next with real continuity.

**Related docs**

| Doc | Purpose |
|-----|---------|
| [standalone/STANDALONE-MODULE-COMMANDS.md](./standalone/STANDALONE-MODULE-COMMANDS.md) | Ports, `pnpm` commands, free-port scripts |
| [../reference/docs/markdown documents/Event Schema registry.md](../reference/docs/markdown%20documents/Event%20Schema%20registry.md) | Canonical event names and payloads |
| [../reference/docs/markdown documents/complete_codebase_knowledge_base.md](../reference/docs/markdown%20documents/complete_codebase_knowledge_base.md) | Per-module emit/consume matrix |
| [../analysis/m01_downstream_dependency_report.md](../analysis/m01_downstream_dependency_report.md) | M01 contracts and M02–M10 compatibility |

---

## 1. Problem today vs target

| Today (standalone dev) | Target (integrated product) |
|------------------------|-----------------------------|
| Each module has its **own seed** (demo companies, calls, boards) | **One Postgres**; M01 writes, others **read the same rows** |
| Nav buttons only change **port/URL** (`localhost:5179` → `5178`) | Nav passes **`tenantId`, `callId`, `accountId`, `dealId`** in the query string |
| Events may fire inside one API process but **do not cross** separate standalone APIs | **Redis/BullMQ** (or single monolith API) delivers events to all consumers |
| User sees unrelated demo data in each module | User sees **the call they just captured** in M02, M03, M05, etc. |

**Rule:** Navigation is UI; **truth is the database + event bus**.

---

## 2. Platform stages (lifecycle)

| Stage | Modules | Role |
|-------|---------|------|
| 1 — Capture | **M01** | Ingest calls/meetings/email; transcribe (Whisper ASR) |
| 2 — Model | **M10** | Revenue Graph: link interaction → Account, Contact, Deal |
| 3 — Understand | **M02** | Score, topics, themes, trackers, conversation library |
| 4 — Analyze | **M03** | Summaries, Ask Anything, Deep Researcher |
| 5 — Execute | **M04**, **M05**, **M08** | Deals board, account boards, email/workflows |
| 6 — Predict | **M06** | Forecast boards, AI revenue predictor |
| 7 — Optimize | **M07**, **M09** | Dashboards, coaching |

### Common naming mistake

| Wrong assumption | Correct |
|------------------|---------|
| M05 = searchable conversation library | **M02** = conversation library / trackers |
| **M05** = Account Intelligence boards | Consumes summaries and trackers; does not emit `call.scored` |

---

## 3. Diagrams (high-contrast)

Mermaid uses a light node background and dark text so labels stay readable in most themes.

### 3.1 End-to-end pipeline

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor':'#ffffff','primaryTextColor':'#111111','primaryBorderColor':'#333333','lineColor':'#333333','secondaryColor':'#f0f0f0','tertiaryColor':'#e8e8e8'}}}%%
flowchart TB
  subgraph S1["Stage 1 — Capture"]
    M01["M01 Capture and Transcription"]
  end

  subgraph S2["Stage 2 — Model"]
    M10["M10 Data and Compliance — Revenue Graph"]
  end

  subgraph S3["Stage 3 — Understand"]
    M02["M02 Conversation Intelligence"]
  end

  subgraph S4["Stage 4 — Analyze"]
    M03["M03 AI Summaries and GenAI"]
  end

  subgraph S5["Stage 5 — Execute"]
    M04["M04 Deal Intelligence"]
    M05["M05 Account Intelligence"]
    M08["M08 Sales Engagement"]
  end

  subgraph S6["Stage 6 — Predict"]
    M06["M06 Forecasting and Prediction"]
  end

  subgraph S7["Stage 7 — Optimize"]
    M07["M07 Revenue Dashboards"]
    M09["M09 Coaching and Training"]
  end

  M01 --> M10
  M10 --> M02
  M10 --> M03
  M02 --> M03
  M02 --> M04
  M02 --> M05
  M02 --> M08
  M02 --> M09
  M03 --> M04
  M03 --> M05
  M03 --> M08
  M03 --> M10
  M04 --> M10
  M10 --> M04
  M10 --> M08
  M10 --> M06
  M06 --> M07
  M06 --> M09
  M02 -.-> M07
  M04 -.-> M07
  M05 -.-> M07
```

Solid arrows = primary processing order. Dotted = read aggregated data (M07).

### 3.2 Event bus (canonical names)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor':'#ffffff','primaryTextColor':'#111111','primaryBorderColor':'#333333','lineColor':'#333333'}}}%%
flowchart TB
  M01["M01"]

  E1["call.transcription.completed"]
  E2["revenue_graph.entity.linked"]
  E3["call.scored"]
  E4["tracker.detection.created"]
  E6["call.summary.generated"]
  E7["deal.stage.changed"]
  E8["forecast.submitted"]

  M10n["M10"]
  M02n["M02"]
  M03n["M03"]
  M04n["M04"]
  M05n["M05"]
  M08n["M08"]
  M06n["M06"]
  M09n["M09"]

  M01 --> E1
  E1 --> M10n
  E1 --> M03n

  M10n --> E2
  E2 --> M02n
  E2 --> M04n
  E2 --> M05n

  M02n --> E3
  M02n --> E4
  E3 --> M09n
  E4 --> M03n
  E4 --> M04n
  E4 --> M05n
  E4 --> M08n

  M03n --> E6
  E6 --> M04n
  E6 --> M05n
  E6 --> M08n
  E6 --> M10n

  M04n --> M10n
  M10n --> E7
  E7 --> M04n
  E7 --> M08n
  E7 --> M06n

  M06n --> E8
  E8 --> M09n
```

**Minimum critical chain**

```text
call.transcription.completed
  → revenue_graph.entity.linked
  → call.scored + tracker.detection.created
  → call.summary.generated
  → deal.stage.changed
  → forecast.submitted
```

### 3.3 Processing order (1 → 10)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor':'#ffffff','primaryTextColor':'#111111','primaryBorderColor':'#333333'}}}%%
flowchart TD
  O1["1. M01 — Capture and transcribe"]
  O2["2. M10 — Link call to Account, Contact, Deal"]
  O3a["3a. M02 — Score, topics, trackers"]
  O3b["3b. M03 — Summaries — parallel with M02 after M10"]
  O5["5. M05 — Account boards"]
  O6["6. M04 — Deals board"]
  O7["7. M08 — Email and workflows"]
  O8["8. M06 — Forecast"]
  O9["9. M07 — Dashboards"]
  O10["10. M09 — Coaching"]

  O1 --> O2
  O2 --> O3a
  O2 --> O3b
  O3a --> O5
  O3b --> O5
  O3a --> O6
  O3b --> O6
  O6 --> O7
  O7 --> O8
  O8 --> O9
  O8 --> O10
  O3a --> O10
```

### 3.4 User click + shared database

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorTextColor':'#111111','actorBkg':'#ffffff','actorBorder':'#333333','signalColor':'#333333','noteTextColor':'#111111','noteBkgColor':'#f5f5f5'}}}%%
sequenceDiagram
  participant Rep as Sales rep
  participant M01 as M01 UI/API
  participant Bus as Event bus
  participant M10 as M10
  participant DB as PostgreSQL
  participant M02 as M02 UI

  Rep->>M01: Finish call
  M01->>DB: call_records + transcripts
  M01->>Bus: call.transcription.completed
  Bus->>M10: Entity resolution
  M10->>DB: Revenue graph links
  Bus->>M02: Score and track

  Rep->>M01: Click Open in M02
  Note over M01,M02: ?tenantId=...&callId=...&dealId=...
  M02->>DB: Read same call — not a new seed
```

### 3.5 ASCII backup (always readable)

```text
M01 (capture)
  │
  ▼ call.transcription.completed
M10 (revenue graph link)
  ├──────────────────┬──────────────────┐
  ▼                  ▼                  │
M02 (score/track)   M03 (summaries)     │
  │                  │                  │
  ├────────┬─────────┤                  │
  ▼        ▼         ▼                  │
M05      M04       M08 ◄── deal.stage.changed (M10)
(account) (deals)  (engage)
                  │
                  ▼
                 M06 (forecast)
                  │
          ┌───────┴───────┐
          ▼               ▼
         M07            M09
    (dashboards)    (coaching)
```

---

## 4. Module reference table

| Order | Module | Waits for (events) | Produces | Standalone API | Standalone web |
|------:|--------|-------------------|----------|----------------|----------------|
| 1 | **M01** | — | `call.transcription.completed`, `crm.fields.extracted` | 3001 | 5174 |
| 2 | **M10** | M01 | `revenue_graph.entity.linked`, `deal.stage.changed` | 4011 | 5178 |
| 3 | **M02** | M01 + M10 linked | `call.scored`, `tracker.detection.created`, `call.topics.tagged` | 3002 | 5175 |
| 4 | **M03** | M01; enriched by M02 trackers/topics | `call.summary.generated` | 4010 | 5177 |
| 5 | **M05** | M03 summary, M02 tracker | (UI read-model) | 4012 | 5179 |
| 6 | **M04** | M10, M02, M03 | (UI; stage via M10) | monolith / disabled standalone | — |
| 7 | **M08** | M03, M10 `deal.stage.changed` | `email.sent` | monolith | — |
| 8 | **M06** | M10 `deal.stage.changed` | `forecast.submitted` | monolith 3001 | 3005 `/forecasting` |
| 9 | **M07** | Aggregates from PG / ClickHouse | (read-only widgets) | 4013 | 5180 |
| 10 | **M09** | M02 `call.scored`, M06 `forecast.submitted` | (coaching metrics) | 4009 | 5176 |

**M02 context rule:** Final call scoring must wait for **`revenue_graph.entity.linked`** from M10 (CRM/deal context for the scorecard template).

**M04 stage rule:** UI publishes **`deal.stage.update.requested`** internally; **M10** syncs CRM and publishes public **`deal.stage.changed`**. M04 must not write CRM directly.

---

## 5. Shared context contract (IDs)

Every cross-module link and API call should carry:

| Field | Required | Used by |
|-------|----------|---------|
| `tenantId` | Yes | All modules |
| `callId` | When coming from a call | M01, M02, M03, M09 |
| `accountId` | Account journey | M05, M07, M10 |
| `dealId` | Deal journey | M04, M08, M06, M10 |
| `contactId` | Outreach | M08 |
| `userId` | Coaching | M09 |

**URL example (M01 → M02)**

```text
http://localhost:5175/?tenantId=00000000-0000-0000-0000-000000000001&callId=<uuid>&dealId=<uuid>
```

**Headers (standalone dev)**

```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id:   00000000-0000-0000-0000-000000000002
```

Do **not** pass full transcripts or PII in query strings.

---

## 6. Three integration layers (what to build)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor':'#ffffff','primaryTextColor':'#111111','primaryBorderColor':'#333333'}}}%%
flowchart LR
  L1["Layer 1 — Deep links<br/>query params on nav"]
  L2["Layer 2 — Shared DB<br/>one DATABASE_URL"]
  L3["Layer 3 — Event bus<br/>Redis / BullMQ"]

  L1 --> L2 --> L3
```

### Layer 1 — Contextual navigation (quick win)

**Goal:** Clicking a module button opens the right screen with the right entity.

| Task | Where | Action |
|------|-------|--------|
| Build URL helper | Each module `lib/api-env.ts` | `buildModuleUrl(base, { tenantId, callId, accountId, dealId })` |
| Update nav components | `ModuleNavLinks.tsx`, M02 `ConversationLibraryView.tsx`, M10 `App.tsx`, etc. | Append query params before `window.location.href` |
| Read params on load | Each module root page / layout | Parse `searchParams`; pass to first API fetch |
| Fallback | Same files | If params missing → show “pick a call” or dev seed (temporary) |

**Modules with nav today (extend with params):** M01↔M02, M02↔M03/M09, M05↔M07↔M10.

### Layer 2 — Shared database (stop duplicate seeds)

**Goal:** M02–M10 load rows M01/M10 already wrote.

| Task | Action |
|------|--------|
| One `DATABASE_URL` | Same value in boilerplate `.env` for all standalone APIs (see [STANDALONE-MODULE-COMMANDS.md](./standalone/STANDALONE-MODULE-COMMANDS.md)) |
| Prisma client | Use `@rri/database` / `packages/database` — not isolated in-memory stores for production paths |
| Seed once | Run M01 seed + M10 graph seed; remove conflicting per-module fictional accounts that do not exist in `call_records` / `accounts` |
| Read APIs | M02: `GET` by `callId`; M05: board by `accountId`; M03: summary by `callId` |
| Tenant guard | Every query filters `tenant_id` |

**Schema reference:** [database-tools/schema.prisma](./database-tools/schema.prisma) (unified design); runtime schema: `boilerplate code/r-revenue-intelligence/packages/database/prisma/schema.prisma`.

### Layer 3 — Event bus (async pipeline)

**Goal:** Background processing runs without manual re-seed when user moves to the next module.

| Task | Action |
|------|--------|
| Producer | M01 standalone API publishes `call.transcription.completed` to **Redis/BullMQ** (not only `EventEmitter2` in-process) |
| M10 worker | Consume transcription event → write graph → emit `revenue_graph.entity.linked` |
| M02 worker | Consume linked + transcription → score → emit `call.scored`, `tracker.detection.created` |
| M03 worker | Consume transcription (+ trackers when ready) → emit `call.summary.generated` |
| Bridge gap | Today M10 worker expects BullMQ job name `call.transcription.completed`; wire dispatcher in `platform-core/events` (see [m01_downstream_dependency_report.md](../analysis/m01_downstream_dependency_report.md) §3) |
| Idempotency | Consumers dedupe by `eventId` |
| Contracts | Import payloads from shared Zod package per [Event Schema registry](../reference/docs/markdown%20documents/Event%20Schema%20registry.md) |

**Dev shortcut:** Run single `apps/api` (monolith) so EventEmitter2 + BullMQ share one process; keep separate frontends on different ports.

---

## 7. Implementation phases (recommended order)

### Phase A — Deep links only (1–2 days)

- [ ] Add `buildCrossModuleUrl()` in shared util or per-module `api-env.ts`
- [ ] M01 call detail → M02, M03 with `callId`
- [ ] M02 → M01, M03, M09 with context
- [ ] M05 board → M07, M10 with `accountId`
- [ ] M07 → M05 with `accountId`
- [ ] Document param contract in each `INTEGRATION-M*.md`

**Verify:** Open M01 call → click M02 → URL contains same `callId`; M02 API request includes that id.

### Phase B — Shared DB reads (3–5 days)

- [ ] Align all standalone APIs on `@rri/database`
- [ ] M01: single seed script for tenant + sample call with known UUIDs
- [ ] M02/M03: load transcript by `callId` (404 if not found)
- [ ] M05: load account by `accountId` from graph tables, not only `m05-data.store.ts`
- [ ] M10: graph links reference same `callId`
- [ ] Reduce reliance on `POST .../test/seed` except empty DB bootstrap

**Verify:** Create call in M01 only; open M02 with link — transcript appears without running M02 seed.

### Phase C — Event bridge (5–10 days)

- [ ] Redis + BullMQ running (docker-compose from `final_product/`)
- [ ] Dispatcher: in-process event → queue job with canonical envelope
- [ ] M10 `revenue-graph-linking` worker consumes M01 jobs
- [ ] M02 subscribers on `revenue_graph.entity.linked` before final score
- [ ] M03 auto-summary on `call.transcription.completed`
- [ ] Logging/metrics per event name

**Verify:** Upload call in M01; within N seconds M10 graph and M02 score exist in DB without manual seed POST.

### Phase D — Product shell (later)

- [ ] Single origin / API gateway
- [ ] One login; modules as routes not ports
- [ ] Optional: ClickHouse sync for M07

---

## 8. Suggested user journey (click path)

| Step | User action | Module | URL context |
|------|-------------|--------|-------------|
| 1 | Record / upload call | M01 | — |
| 2 | (auto) CRM link | M10 | `callId` |
| 3 | Review score and search | M02 | `callId`, `dealId` |
| 4 | Read AI summary | M03 | `callId` |
| 5 | Account health | M05 | `accountId` |
| 6 | Deal board | M04 | `dealId` |
| 7 | Send follow-up | M08 | `dealId`, `contactId` |
| 8 | Forecast | M06 | `periodId` |
| 9 | Executive view | M07 | `accountId` / filters |
| 10 | Rep coaching | M09 | `userId`, `callId` |

---

## 9. Per-module integration checklist

### M01 → downstream

| Consumer | Mechanism | M01 provides |
|----------|-----------|--------------|
| M10 | Event `call.transcription.completed` | `callId`, `transcriptId`, `tenantId`, CRM hints |
| M02 | Event + DB read | `CallRecord`, `Transcript` |
| M03 | Event + DB read | `Transcript.fullText`, utterances |
| M05 | DB / graph | `accountId` on call when linked |

### M10 → downstream

| Consumer | Event | Notes |
|----------|-------|-------|
| M02 | `revenue_graph.entity.linked` | Unblocks scoring template |
| M04, M05 | same | Refresh boards |
| M06, M08 | `deal.stage.changed` | After CRM sync |

### M02 → downstream

| Consumer | Event |
|----------|-------|
| M03, M04, M05, M08 | `tracker.detection.created` |
| M09, M07 | `call.scored` |

### M03 → downstream

| Consumer | Event |
|----------|-------|
| M04, M05, M08, M10 | `call.summary.generated` |

---

## 10. Local dev commands (integration testing)

From boilerplate root:

```powershell
cd "c:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence"

# Free ports before restart
.\scripts\free_ports_all.ps1

# Typical chain (separate terminals)
pnpm run dev:m01-api
pnpm run dev:m01-web
pnpm run dev:m10-api
pnpm run dev:m10-web
pnpm run dev:m02-api
pnpm run dev:m02-web
# ... etc.
```

Postgres:

```powershell
$env:DATABASE_URL="postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
```

Smoke scripts: [../test_result/test_case/README.md](../test_result/test_case/README.md).

---

## 11. What not to do

| Anti-pattern | Why |
|--------------|-----|
| Pass transcript JSON in URL | Size, security, caching |
| Independent seeds per module with different `accountId`s | Breaks continuity |
| M04 writes CRM directly | Violates ADR-005; use M10 |
| Commands as events (`generate.summary`) | Use facts: `call.summary.generated` |
| Skip `tenantId` on cross-module APIs | Tenant isolation failure |

---

## 12. Current codebase gaps (honest)

| Gap | Status | Fix in phase |
|-----|--------|--------------|
| Nav without query params | Partial | A |
| M05 in-memory store vs PG | Partial | B |
| M10 BullMQ bridge from M01 standalone | Open | C |
| M04 disabled in monolith `AppModule` | Open | B/C |
| M07 reads ClickHouse; may fallback PG | Documented | D |
| Event publisher was mock (stdout only) | Improved in monolith | C for standalone |

---

## 13. Success criteria (integration done)

1. **One call** created in M01 appears in M02 and M03 without module-specific seed POSTs.
2. **M10** links that call to an account/deal visible on M05/M04 boards.
3. **Nav links** preserve `tenantId` + entity ids across ports.
4. **Events** listed in §3.2 fire in order on a test call (observable in logs or DB side effects).
5. **M09** shows coaching for the same rep after M02 scored and M06 submitted forecast.

---

*Last updated: integration planning doc for standalone → connected modules. Update this file when a phase is completed.*
