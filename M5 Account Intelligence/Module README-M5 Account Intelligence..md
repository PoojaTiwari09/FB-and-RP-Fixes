# M5 Account Intelligence — Module README

## 1. Module Overview

### What this module does

M5 Account Intelligence helps teams manage customer accounts strategically through a unified workspace centered on **Account Boards**.   
The module brings together CRM account data, engagement activity, conversation-derived signals, and AI-generated account context so users can understand account status and take action from one place. 

### Why this module matters

Without a unified account workspace, teams must jump between CRM records, call tools, email activity, and notes to understand account health, renewal risk, or expansion potential.   
M5 reduces that fragmentation and helps Sales, Customer Success, and RevOps teams manage renewals, expansions, prioritization, and account health faster and with better context. 

### Lifecycle stage

This module belongs to the **Execute** stage of the Revenue Intelligence Lifecycle, where upstream AI insights are surfaced into operational workflows used by reps and managers.   
In the architecture, the implementation owner is **M-07 Deal and Account Management**, which serves both Deals Boards and Account Boards as workflow-facing execution surfaces. 

### Core outputs

The main output of M5 is the **Account Board workspace**, including:
- Account board rows for portfolio review. 
- Account detail views with contacts, deals, activities, and AI brief context. 
- Account health and engagement indicators. 
- Renewal and prioritization signals. 
- Recommended next actions shown in the account workspace. 

### Naming note

There are two valid names used in docs:
- **M5 Account Intelligence** = product-facing module name used in planning and packaging. 
- **M-07 Deal and Account Management** = engineering and architecture owner module. 

If you are a fresher, remember this simple rule: **M5 is the product name, M-07 is the implementation owner**. 

---

## 2. Features in This Module

### Primary feature

This module currently contains one main feature:

- **Account Boards** — a centralized workspace that gives go-to-market teams a unified view of customer accounts by combining CRM data, engagement activity, conversation insights, and AI-generated context into one structured board. 

### What Account Boards supports

Account Boards is designed for:
- Sales teams managing renewals and expansions. 
- Customer Success teams tracking account health and customer engagement. 
- RevOps teams monitoring portfolio coverage, saved views, and account prioritization workflows. 

---

## 3. Module Boundaries

### What M5 owns as a product module

At product level, M5 owns the **account intelligence user experience** for strategic account management.   
That includes:
- Account portfolio board views. 
- Account detail workspace views. 
- Account health and engagement presentation. 
- Prioritization and next-action presentation. 
- User-facing account filters, saved board config, and workspace refresh behavior. 

### What M5 does not own

M5 does **not** own:
- CRM ingestion and CRM entity sync. 
- Revenue Graph linking logic. 
- Raw conversation intelligence generation. 
- Smart Tracker detection logic. 
- AI summary generation and account brief creation. 
- Forecasting logic and forecast board behavior. 
- Workflow orchestration and automation logic. 
- Deal-board-specific pipeline stage management except where deal data appears as supporting account context. 

### Upstream dependencies

M5 depends on upstream modules to produce the account-linked data it needs.   
The most important dependency is **M-06 Insight Generation**, because Account Boards uses upstream AI-generated account context and account briefs inside the workspace. 

#### Key upstream modules

| Upstream Module | What M5 Uses | Why It Matters |
|---|---|---|
| M-03 Revenue Graph | Linked accounts, contacts, deals, activities, CRM context  | Provides the connected account data foundation required to build the board.  |
| M-05 Smart Tracking and Search | Tracker detections and conversation-derived signals  | Helps identify account health issues, engagement patterns, and warning signals.  |
| M-06 Insight Generation | Account briefs and AI-generated account context  | Supplies the AI summary layer visible in account rows and account detail views.  |
| M-02 Sales Engagement | Email activity signals such as `email.sent` updates  | Contributes to engagement recency and activity rollups.  |

### Adjacent modules

M5 is closely related to other execution and prediction modules, but it must stay within its own boundaries. 

| Adjacent Module | Relationship to M5 |
|---|---|
| Deals Boards | Also owned under M-07, but focused on pipeline/deal execution rather than account-centric workspace.  |
| Forecasting | Uses downstream execution data and belongs to M-09 Predict stage, not M5.  |
| Orchestrate | Lives in M-08 and turns insights into guided workflows; M5 may show next actions, but does not own orchestration logic.  |

---

## 4. Architecture Snapshot

### Main components

The M5 product experience is implemented using the **M-07 DealAccountModule** in the modular monolith architecture.   
The main components involved are:
- Frontend account board UI. 
- `DealAccountModule` in NestJS with API prefix `/api/v1/deal-management`. 
- M-07-owned tables such as `account_board_configs`, `engagement_scores`, and `renewal_signals`. 
- Public upstream APIs from M-03 and M-06. 
- Platform Core for tenant context, auth, and RBAC. 

### Account board read path

The normal read path is:
1. Frontend calls `GET /api/v1/deal-management/account-boards`. 
2. M-07 loads the user’s board config from `account_board_configs`. 
3. M-07 assembles rows using account-linked CRM data, contacts, deals, activities, latest engagement scores, and renewal signals. 
4. M-07 returns a read-optimized board response for the frontend. 

This is a **read-heavy UI-serving path**, so the module should prefer stored or precomputed account signals instead of expensive synchronous recomputation on every request. 

### AI context refresh path

AI-generated context for account views comes from **M-06 Insight Generation**, especially account briefs.   
When upstream summaries or account signals change, M5 should mark relevant account rows or detail sections stale and refresh the displayed AI context through async or next-read refresh behavior rather than tightly coupling the board to M-06 internals. 

### CRM and engagement data dependencies

Account Boards depends on:
- CRM-linked account and contact data. 
- Linked deals and activity records. 
- Engagement scoring artifacts in M-07. 
- Renewal/account signals derived from upstream stages. 
- AI-generated account context from M-06. 

The board is only as good as its upstream chain, so M5 should not be treated as independently usable unless M-03 and M-06 outputs are flowing correctly. 

---

## 5. APIs

### Account board listing endpoints

| Method | Endpoint | Auth | Caller | Purpose |
|---|---|---|---|---|
| GET | `/api/v1/deal-management/account-boards` | JWT  | Frontend  | Returns Account Board rows with engagement scores and renewal signals.  |

### Account detail endpoints

| Method | Endpoint | Auth | Caller | Purpose |
|---|---|---|---|---|
| GET | `/api/v1/deal-management/account-boards/:id` | JWT  | Frontend  | Returns account detail including contacts, deals, activities, and brief context.  |

### Saved view or filter endpoints

The SAD explicitly lists config endpoints for Deals Board and a persisted config table for Account Board, so the recommended M5 contract is to expose account config endpoints using the same pattern.   
Recommended endpoints for Account Boards:
- `GET /api/v1/deal-management/account-boards/config` 
- `PATCH /api/v1/deal-management/account-boards/config` 

These endpoints should read and write user-level saved config from `account_board_configs`, including visible columns and saved filters. 

### Auth model and caller types

All Account Board endpoints require **JWT-based authentication** and are called by the frontend application.   
Access is tenant-scoped and enforced through Platform Core tenant injection, user identity, and RBAC rules. 

---

## 6. Events

### Events consumed from upstream modules

M5 is implemented inside M-07, which is mainly a read-heavy UI-serving module and does not publish standard platform events for Account Boards.   
It consumes or reacts to upstream changes indirectly through stored data, public APIs, and selected upstream events. 

Relevant upstream events and effects include:

| Event | Produced By | Relevance to M5 |
|---|---|---|
| `email.sent` | M-02  | Updates activity recency and engagement-related account context.  |
| `tracker.detection.created` | M-05  | Can contribute to account-level signals or stale markers for refresh.  |
| `call.summary.generated` | M-06  | Indicates AI-generated summary context may be newer and account brief-related data may need refresh.  |

### Recompute or refresh triggers

Account Boards should refresh or mark data stale on:
- User-requested board load. 
- User-requested detail load. 
- Manual refresh action. 
- New activity or engagement-affecting input such as email activity updates. 
- New or changed upstream AI insight context. 
- Scheduled stale-signal recomputation windows. 

### Event ownership and retry notes

M5 does not own the upstream event contracts it reacts to. Event contracts are owned by the publisher module, and M5 must handle schema evolution safely as a consumer.   
Any async refresh process introduced for Account Boards must be idempotent and follow platform retry patterns using BullMQ-style retries and DLQ handling where applicable. 

---

## 7. Data Ownership

### Records and cached views owned here

At engineering level, M-07 owns the main data artifacts used by M5:
- `account_board_configs` 
- `engagement_scores` 
- `renewal_signals` 

These are the M5-facing data artifacts that support account board rendering, saved user views, and account health presentation. 

### Account health and engagement artifacts

M5 relies on M-07-owned engagement and renewal artifacts rather than recomputing everything at request time.   
This keeps the board fast and stable for large account portfolios while still allowing refresh on upstream changes. 

### Tenant isolation

All records must be tenant-scoped using the shared multi-tenant PostgreSQL model with row-level security.   
Every read and write must include tenant context, and no board config, score, or signal may leak across tenants. 

### Retention and lifecycle

Retention rules are inherited from platform data governance patterns described in the SAD, while M5-specific cached artifacts should be safe to recompute if needed from upstream data sources.   
This means configs are user-owned persistent preferences, while engagement and signal artifacts are refreshable read models tied to account activity and AI context freshness. 

---

## 8. Local Development

### Prerequisites

Before working on M5 locally, you should have:
- The main modular monolith running in local dev mode. 
- Access to PostgreSQL with tenant-scoped seed data. 
- Platform Core auth working or mocked. 
- Access to upstream mock or seeded data for accounts, contacts, deals, activities, engagement scores, and AI account brief context. 
- Basic understanding of NestJS, TypeScript, JWT auth, and tenant-based access patterns. 

### Setup steps

1. Start the core backend application that includes the `DealAccountModule`.   
2. Run database migrations for M-07-owned tables including `account_board_configs`, `engagement_scores`, and `renewal_signals`.   
3. Seed one or more tenants with:
   - accounts
   - contacts
   - account-contact links
   - deals
   - activities
   - engagement scores
   - renewal signals
   - mock or real account brief payloads   
4. Start frontend and sign in with a tenant-scoped test user.   
5. Validate board listing, account detail, filters, and stale-state handling. 

### Recommended seed data

For useful local development, seed at least:
- 10 to 20 accounts across multiple owners. 
- Mixed health states: healthy, watch, at-risk. 
- Activities across calls, emails, and meetings. 
- At least 3 accounts with renewal signals. 
- At least 3 accounts with linked AI brief content. 
- At least 1 tenant boundary test case to confirm RLS and auth behavior. 

### Run and test commands

Use the standard backend and frontend commands defined by the platform repository and local service conventions.   
At minimum, developers should be able to:
- run backend server
- run frontend server
- run unit tests
- run integration tests
- run linting
- run seed scripts

Recommended generic command placeholders:
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm test
pnpm test:integration
pnpm lint
```

Adjust exact commands to the repository standard if they differ. 

---

## 9. Configuration

### Required env vars

M5 depends on standard platform configuration plus module-specific board refresh and auth configuration.   
The exact variable list should live in the dedicated **M5 Environment Variables Registry** document, but likely required categories include:
- database connection
- JWT/auth config
- tenant enforcement config
- Redis/queue config for refresh jobs
- feature flags for Account Boards
- upstream service base URLs for M-06 access if service-separated 

### Optional env vars

Optional configuration may include:
- board default page size
- score freshness thresholds
- AI brief TTL
- refresh debounce values
- stale badge visibility
- debug logging flags 

### Secret sources

The SAD references managed secret handling patterns such as Doppler/API-key-managed service secrets for external systems, and tenant-safe configuration should follow the same secret management approach used across the platform.   
Do not hardcode credentials, tokens, or service secrets in local source files. 

### Link to env registry

See: **Doc #18 — Environment Variables Registry: M5 Account Intelligence**. 

---

## 10. Operational Notes

### Common failure modes

Common M5 issues include:
- missing CRM-linked account records. 
- missing activity joins. 
- stale engagement scores. 
- stale or unavailable AI account briefs. 
- account rows missing due to tenant/RBAC mismatch. 
- board config load failures for a user. 

### Troubleshooting stale boards

If a board looks stale:
1. Check whether upstream account brief or signal timestamps are older than freshness thresholds. 
2. Confirm latest activities were linked to the correct account in upstream data. 
3. Verify `engagement_scores` has a recent row for the affected account. 
4. Verify `renewal_signals` exists and is tenant-scoped correctly. 
5. Confirm the frontend is not reading an outdated saved filter or view config. 

### Replay and refresh guidance

For account-level refresh issues:
- re-run account score recomputation for the affected tenant/account pair. 
- re-fetch latest account brief from M-06 or mark it stale and reload on next request. 
- replay relevant upstream signal events only if event ownership and idempotency rules are preserved. 

Do not patch another module’s internal tables directly to “fix” M5 output, because the architecture explicitly forbids bypassing module ownership boundaries. 

### Support ownership

Primary support ownership sits with the **M-07 Deal and Account Management engineering owner**, with coordination from:
- M-03 owner for linked entity issues. 
- M-05 owner for tracker-derived signals. 
- M-06 owner for AI brief/account context issues. 
- Platform Core owner for auth, tenant context, and RBAC issues. 

---

## 11. Related Docs

Use these documents together:

- **System Architecture Document (SAD)** — platform-wide architecture, boundaries, lifecycle stages, module ownership, and integration rules. 
- **TDD — Account Boards** — feature-level design for the Account Boards implementation in M5/M-07. 
- **Sequence Diagrams — M5 complex flows** — request/read/refresh flows for Account Boards. 
- **API docs** — request/response payloads and endpoint details for account board and account detail APIs. 
- **Runbooks** — operational support notes for stale data, refresh failures, and tenant-scoped troubleshooting. 

---

## Quick summary for new engineers

If you remember only five things, remember these:
1. M5 has one main feature: **Account Boards**. 
2. M5 is product-facing, but the engineering owner is **M-07 Deal and Account Management**. 
3. M5 is in the **Execute** stage and depends heavily on **M-06 outputs** plus linked CRM and engagement context. 
4. M5 must consume upstream data only through approved APIs/events and never by bypassing module boundaries. 
5. Every account read and write must remain tenant-scoped under RLS and RBAC rules. 
