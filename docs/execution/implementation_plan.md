# Implementation Plan: Comprehensive Reference Documents Audit & Fixes

## Goal Description
This document outlines the strategy for a comprehensive audit of the codebase against all 22 reference markdown documents located in `docs\reference\Detialled product level docs\markdown documents`. It includes a phase-by-phase execution plan for the audit, followed by the specific deviations already discovered and their fixes.

> **Last Verified:** 2026-06-10 — Full `pnpm build` passed (24/24 packages). `prisma validate` passed.

---

## Phase-by-Phase Audit Execution Plan

### [COMPLETED ✅] Phase 1: Architecture & Structural Compliance

**Documents reviewed:**
- `Architecture Decision Records.md`
- `Module boundary document.md`
- `System_architecture.md`
- `mermaid-system-design.md`

**Findings:**
- ✅ **ADRs Implemented:** LiteLLM is used correctly as the LLM gateway (no direct `openai` SDK usage in Python services). The unified-api is used as the single backend entry point.
- ✅ **Module Boundaries Respected:** No direct cross-module imports (e.g., importing `../m01` from `m04`) were found. The codebase correctly isolates modules.
- ✅ **Port Configurations:** Next.js correctly proxies API requests to `http://localhost:3001` (unified-api) as specified in the docs.

**Status:** FULLY COMPLIANT. No deviations found. No changes required.

---

### [COMPLETED ✅] Phase 2: Database & Event Schema Compliance

**Documents reviewed:**
- `Database Schema.md`
- `Event Schema registry.md`

**Original Findings (all fixed):**
- ~~❌ Schema-per-Module Naming/Isolation~~ → ✅ **FIXED:** `schema.prisma` now declares `schemas = ["dashboards", "public", "ingestion", "revenuegraph"]`. All models are mapped to their correct schemas via `@@schema(...)`.
- ~~❌ UUID Primary Keys~~ → ✅ **FIXED:** All PKs converted to `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`.
- ~~❌ Tenant ID Column Type/Naming~~ → ✅ **FIXED:** All `tenantId String` renamed to `tenantid String @db.Uuid`. Injected into `Widget` and `LiveCallSummary`.
- ~~❌ Tenant Indices~~ → ✅ **FIXED:** `@@index([tenantid, <lookup_col>])` added to 11 tenant-scoped tables.
- ~~❌ Event Envelope / Schema Registry~~ → ✅ **FIXED:** Versioned Zod schemas in `packages/shared-types/src/events/index.ts`. `EventPublisherService` uses BullMQ `platform-events` queue with canonical envelope (`eventId`, `eventName`, `eventVersion`, `schemaId`, `tenantId`, `producer`, `occurredAt`, `publishedAt`, `payload`).

> [!NOTE]
> **Action 4.6 (Live Migration):** `prisma validate` ✅ passes. `pnpm db:migrate` requires a live PostgreSQL instance — must be run in the target deployment environment.

**Status:** ✅ FULLY RESOLVED (pending live DB migration in deployment)

---

### [COMPLETED ✅] Phase 3: Security & Operational Compliance

**Documents reviewed:**
- `Security architecture.md`
- `Non-Functional Requirements (NFR) Specification.md`

**Original Findings (all fixed):**
- ~~❌ Rate Limiting missing~~ → ✅ **FIXED:** `TenantThrottlerGuard` implemented and registered globally in `apps/api/src/main.ts`. `ThrottlerModule.forRoot` configured in `app.module.ts`.
- ~~❌ JWT Guards scattered~~ → ✅ **FIXED:** Global `JwtAuthGuard` registered in `main.ts` via `useGlobalGuards`. Per-module guard usage confirmed cleaned in m07, m09, m10.

  > [!WARNING]
  > **Residual:** `m07.controller.ts` still has per-route `@UseGuards(JwtAuthGuard, RolesGuard)` decorators on 14 methods (lines 59–196). These are redundant for JWT (already global) but kept because `RolesGuard` is a separate concern. The JWT portion is technically redundant but not harmful. Should be cleaned up to `@UseGuards(RolesGuard)` only.
  > A duplicate `jwt.guard.ts` file also exists in `modules/m04-deal-intelligence/interfaces/` — this should be deleted.

- ~~❌ File Upload Malware Scanning missing~~ → ✅ **FIXED:** `MalwareScannerService` (`modules/m01-capture-transcription/services/malware-scanner.service.ts`) integrated into `M01FrontendUploadController`. Infected files are rejected and deleted.
- ~~❌ Traceability missing~~ → ✅ **FIXED:** `TraceAndTenantMiddleware` (`apps/api/src/trace-tenant.middleware.ts`) registered globally in `main.ts`. Injects `traceId` and `tenantId` into request and response headers (`x-trace-id`, `x-tenant-id`).
- ~~❌ `dotenv` in `main.ts` and `app.module.ts`~~ → ✅ **FIXED:** `main.ts` contains no `dotenv` import. `app.module.ts` uses `ConfigModule.forRoot({ isGlobal: true })` without `envFilePath` — Doppler provides env vars at runtime.

**Status:** ✅ SUBSTANTIALLY RESOLVED (minor RolesGuard cleanup and m04 duplicate jwt.guard.ts deletion outstanding)

---

### [PARTIALLY RESOLVED ⚠️] Phase 4: Boilerplate & Developer Guidelines Compliance

**Documents reviewed:**
- `boilerplate-architecture-and-contribution-guide.md`
- `boilerplate-development-guide.md`
- `developer-and-lead-playbook.md`
- `git-branching-strategy.md`

**Original Findings:**

**Module Directory Structure:**
- ~~❌ Unauthorized subdirs in module roots~~ → ⚠️ **PARTIALLY FIXED:**
  - `m10-data-compliance/data-cloud/` → ✅ Removed; consolidated into standard dirs.
  - Remaining non-standard dirs found via verification:
    - `m04-deal-intelligence/`: has `database/`, `entities/`, `repositories/` (acceptable NestJS patterns, not in boilerplate spec but functionally valid)
    - `m06-forecasting-prediction/`: still has `python-service/` subdirectory
    - `m07-revenue-dashboards/`: still has `analytics/` and `auth/` subdirectories
    - `m09-coaching-training/`: still has `frontend-api/`, `system design/`, `postman/` subdirectories
    - `m10-data-compliance/`: still has `revenue-graph/` subdirectory

**Git Commit Messages:**
- ❌ **NOT FIXED:** Recent commits still violate `feat(mXX): description` convention:
  - `"RBAC basic updated"` (1d767da)
  - `"updated revenue dashboard"` (e52d105)
  - `"fixed errors"` (a0e5433)
  - `"Updated codebase"` (fcf7e54)
  - `"copy of 115"` (85a8d7a)
  - Note: `husky` + `commitlint` hooks were installed to enforce going forward — history cannot be rewritten.

**Git Branching Naming:**
- ❌ **NOT FIXED:** Branches still use non-compliant names:
  - Active: `117`, `Backend-development-and-integration`, `Integration_102`, `module/m1-capture` (missing ticket ID), `module/m7-dashboards`, etc.
  - Remote: `Checked-modules`, `Backend-development-and-integration`
  - The `husky` pre-commit hook enforces naming on **new branches** only — existing branches are unchanged.

> [!IMPORTANT]
> **Action Required:** The following non-standard subdirectories should be removed or relocated:
> - `modules/m06-forecasting-prediction/python-service/` → move to `services/python/`
> - `modules/m07-revenue-dashboards/analytics/` → consolidate into `services/`
> - `modules/m07-revenue-dashboards/auth/` → should be in `platform-core/guards/`
> - `modules/m09-coaching-training/frontend-api/` → delete (BFF remnant)
> - `modules/m09-coaching-training/system design/` → delete (docs don't belong in module)
> - `modules/m09-coaching-training/postman/` → move to `docs/postman/`
> - `modules/m10-data-compliance/revenue-graph/` → consolidate into `repositories/`

**Status:** ⚠️ PARTIALLY RESOLVED — git hooks configured for future commits; stale branches and non-standard module dirs need cleanup.

---

### [PARTIALLY RESOLVED ⚠️] Phase 5: Documentation & Tooling Alignment

**Documents reviewed:**
- `complete_codebase_knowledge_base.md`
- `tooling-and-services-inventory.md`
- `team-handover-launchpad.md`
- `Local-Dev-Setup-Guide.md`

**Original Findings — Verification Results:**

| Deviation | Status | Evidence |
|---|---|---|
| `groq-sdk` in `apps/web` | ❌ **STILL PRESENT** | `apps/web/package.json` line: `"groq-sdk": "^1.2.1"` |
| Missing `@tanstack/react-query` in web | ✅ **FIXED** | `"@tanstack/react-query": "^5.101.0"` present |
| Missing `zustand` in web | ✅ **FIXED** | `"zustand": "^5.0.14"` present |
| Missing `react-hook-form` in web | ✅ **FIXED** | `"react-hook-form": "^7.78.0"` present |
| No `@supabase/supabase-js` in backend | ✅ **FIXED** | `"@supabase/supabase-js": "^2.106.2"` in `apps/api/package.json` |
| `passport`/`passport-jwt` in backend | ⚠️ **STILL PRESENT** | `apps/api`, `platform-core`, `m07`, `m09` still depend on passport |
| `groq-sdk` in module packages | ❌ **STILL PRESENT** | `m02`, `m09`, `m11` still have `groq-sdk` in their `package.json` |
| `Next.js 16.2.6` (mandated: 15) | ⚠️ **KNOWN DEVIATION** | ADR needed; `Next.js 16` ships working build — downgrade is risky |
| `Tailwind CSS v4` (mandated: v3) | ⚠️ **KNOWN DEVIATION** | ADR needed; v4 is installed and working |

> [!CAUTION]
> **Still Requires Action:**
> 1. **`groq-sdk` in `apps/web`:** Remove `groq-sdk` from `apps/web/package.json` and delete or migrate any files using it to call the backend AI proxy instead.
> 2. **`groq-sdk` in `m02`, `m09`, `m11`:** These modules should route LLM calls through LiteLLM gateway — remove direct `groq-sdk` usage.
> 3. **`passport`/`passport-jwt` in `platform-core`, `m07`, `m09`:** Long-term migration to Supabase Auth; in the interim, passport is acceptable as an implementation detail of the `JwtAuthGuard` strategy but should not be exposed in module-level packages.

**Status:** ⚠️ PARTIALLY RESOLVED — State management libs installed, Supabase SDK added. `groq-sdk` still in frontend and 3 backend modules. `passport` still in module packages.

---

## Prioritized Execution Plan

### [COMPLETED ✅] Phase 1: BFF Mock Layer Removal & Structural Alignment
- ✅ **Action 1.1:** M08 Sales Engagement BFF removed, real endpoints live at `/api/v1/sales-engagement`.
- ✅ **Action 1.3:** M02 Conversation Intelligence routes standardized.
- ✅ **Action 1.4:** M01 Capture & Transcription frontend rewired.
- ✅ **Action 1.5:** Module structure enforcement (m10 consolidated).
- ✅ **Action 1.6:** Tooling & Git hooks — `@tanstack/react-query`, `zustand`, `react-hook-form`, `@supabase/supabase-js` installed. `husky` + `commitlint` configured.

### [COMPLETED ✅] Phase 2: Global API & Security Standards
- ✅ **Action 2.1:** Route standardization — all controllers use `api/v1/{module-prefix}`.
- ✅ **Action 2.2:** `ResponseTransformInterceptor`, `FrontendApiExceptionFilter`, `ZodExceptionFilter` global.
- ✅ **Action 2.3:** `TenantThrottlerGuard` + global `JwtAuthGuard` in `main.ts`.
- ✅ **Action 2.4:** `TraceAndTenantMiddleware` injecting `traceId`/`tenantId`; `dotenv` removed.
- ✅ **Action 2.5:** `MalwareScannerService` integrated in M01 upload controller.

### [COMPLETED ✅] Phase 3: Event Bus & Strict Typing
- ✅ **Action 3.1:** Versioned Zod event schemas in `packages/shared-types/src/events/index.ts`.
- ✅ **Action 3.2:** `EventPublisherService` wraps events in canonical envelope + BullMQ queue.
- ✅ **Action 3.3:** `PlatformEventsWorker` bridges BullMQ → `EventEmitter2`.
- ✅ **Action 3.4:** All DTO `type` aliases converted to `interface`. `any` replaced with `unknown`.

### [COMPLETED ✅] Phase 4: Database Schema Restructuring
- ✅ **Action 4.1:** `$queryRawUnsafe` → `$queryRaw` in m09.controller.ts.
- ✅ **Action 4.2:** Multi-schema mapping (`ingestion`, `revenuegraph`, `public`, `dashboards`).
- ✅ **Action 4.3:** All PKs → `dbgenerated("gen_random_uuid()") @db.Uuid`.
- ✅ **Action 4.4:** `tenantId` → `tenantid @db.Uuid`; injected into `Widget`, `LiveCallSummary`.
- ✅ **Action 4.5:** Composite `@@index([tenantid, ...])` on 11 tables.
- ⏳ **Action 4.6:** `pnpm db:migrate` — **DEFERRED** (requires live PostgreSQL; run in deployment env).

---

### [NEW — NOT STARTED ❌] Phase 5: PostgreSQL Row-Level Security (RLS) — HIGH PRIORITY

*Goal: Implement database-level tenant isolation via `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and `CREATE POLICY` for all 94+ tenant-scoped tables. Mandated by ADR-008 and 6 architecture reference documents. Currently only 2 of 94+ tables have RLS policies.*

> **Critical Gap:** The app-layer `WHERE tenantid = ...` in Prisma queries is a compensating control but insufficient on its own. Architecture requires defense-in-depth: both app-layer AND DB-layer enforcement.

- **Action 5.1 (Prisma Middleware):** Add `SET LOCAL app.tenantid = '<uuid>'` via a Prisma `$use()` middleware in `PrismaService` so the PostgreSQL session variable is set before every query. All RLS policies read `current_setting('app.tenantid', true)::UUID` — without this, policies block all rows.
- **Action 5.2 (RLS Migration — `ingestion` schema):** `ENABLE ROW LEVEL SECURITY` + `FORCE` + `CREATE POLICY` for 12 tables: `CallRecord`, `Transcript`, `Utterance`, `CallNote`, `CallShare`, `AuditLog`, `Integration`, `AiExtractionField`, `AiExtractionResult`, `LiveCallSession`, `LiveCallSummary`, `CallReview`.
- **Action 5.3 (RLS Migration — `revenuegraph` schema):** Same pattern for 25+ tables: `Account`, `Deal`, `Dataset*`, `DataSource*`, `Team`, `DashboardAccess`, `Widget`, `AiBrief`, `AiChatHistory`, `SalesPlay`, `Play*`, `Task`, `Workflow*`, `Engage*`, `EmailDraft`, `EmailTemplate`.
- **Action 5.4 (RLS Migration — `public` schema):** Same pattern for 40+ tables: `User`, `Dashboard`, `coaching*`, `ForecastPeriod`, `Forecast*`, `M06*`, `Pipeline*`, `CrmDeal`, `ForecastBoard`, `Board*`, `M10*`, `M02*`, `Manager*`, `DealMeddpicc`, `M04DealDriver`, `Deal*`.
- **Action 5.5 (Fix `dashboards` — standardize session var):** Update existing `20260527120000_m09_dashboards_rls` migration — change `app.current_tenant` → `app.tenantid`. Add RLS for `Dashboard` and `DashboardSnapshot`.
- **Action 5.6 (Verification):** Write test that sets `app.tenantid` to Tenant A UUID and confirms Tenant B rows are invisible with no `WHERE` clause. Run in staging.

> **Deployment Gate:** All Phase 5 actions require live PostgreSQL connection. Apply AFTER Action 4.6 (`pnpm db:migrate`) succeeds.

---

## Remaining Outstanding Actions

| # | Action | Priority | Owner |
|---|---|---|---|
| R-01 | Remove `groq-sdk` from `apps/web/package.json` and migrate callers to backend proxy | HIGH | Frontend |
| R-02 | Remove `groq-sdk` from `m02`, `m09`, `m11` modules — route via LiteLLM | HIGH | Backend |
| R-03 | Delete `modules/m04-deal-intelligence/interfaces/jwt.guard.ts` (duplicate) | MEDIUM | Backend |
| R-04 | Clean `m07.controller.ts`: remove redundant `JwtAuthGuard` from `@UseGuards` (keep only `RolesGuard`) | MEDIUM | Backend |
| R-05 | Remove non-standard dirs: `m09/frontend-api/`, `m09/system design/`, `m09/postman/`, `m06/python-service/`, `m10/revenue-graph/` | MEDIUM | Backend |
| R-06 | Run `pnpm db:migrate` in deployment environment with live PostgreSQL | HIGH | DevOps |
| R-07 | **[NEW]** Implement Phase 5 RLS (5.1–5.6) — Prisma middleware + 4 schema RLS migrations | CRITICAL | Backend + DevOps |
| R-08 | File an ADR for `Next.js 16` and `Tailwind CSS v4` deviations from approved tooling | LOW | Lead |
| R-09 | Rename/delete non-compliant git branches per `feature/mX-<desc>` convention | LOW | Team |

## Verification Plan

### Automated Tests
- `prisma validate` ✅ (passing)
- `pnpm build` ✅ (passing — 24/24 packages)
- Run NestJS e2e tests against `/api/v1/` routes.
- Enable `@typescript-eslint/no-explicit-any` to enforce type safety.

### Manual Verification
- `GET /api/v1/deal-management/deals` → verify `{ success: true, data: ..., meta: { requestId, timestamp } }` envelope.
- Trigger a 422 validation error → verify `{ success: false, error: { code, message, details } }`.
- Upload an audio file → verify `x-trace-id` and `x-tenant-id` response headers are set.
- Upload EICAR test file → verify `400 Malware detected` rejection and file deletion.
- Publish a `call.transcription.completed` event → verify it appears in BullMQ `platform-events` queue with full canonical envelope.
