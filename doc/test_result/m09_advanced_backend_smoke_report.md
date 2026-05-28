# M09 — Advanced Backend Smoke Report

**Module:** `modules/m09-coaching-training`  
**Date:** 2026-05-27  
**Harness:** `test_case/testm9.py` + built-in `POST /test/smoke`  
**Result:** **15 / 15 PASS** (Python harness), **E2E smoke PASS** (orchestrated)

---

## Executive summary

M09 backend was smoke-tested end-to-end against `http://localhost:3001`. Critical schema drift (unified `@rri/database` vs legacy `TrainingScenario` models) was reconciled via a **delegate-safe repository** with in-memory fallback and optional `dashboards.trainerscenarios` / `trainersessions` persistence. JWT `fallback_secret` was removed. LLM provider selection was formalized (`mock` / `groq` / env-driven). RLS SQL migration was added (apply via Prisma migrate).

**Trusted dependencies:** M01 and M02 only (no hard coupling to M03–M08).

---

## Smoke matrix

| Phase | Focus | Cases | Result |
|-------|--------|-------|--------|
| A | Runtime / health | 2 | PASS |
| B | Seed + E2E `/test/smoke` | 2 | PASS |
| C | Auth (login, 401, JWT gate) | 4 | PASS |
| D | Scenarios (JWT) | 1 | PASS |
| E | Session lifecycle | 5 | PASS |
| F | Public voices | 1 | PASS |
| G | Concurrency + signed token | 2 | PASS |

---

## Validated recently-implemented themes

| # | Theme | Status |
|---|--------|--------|
| 1–5 | Prisma reconciliation / dashboards mapping | **Partial → stabilized** (repository maps unified models; local schema marked DEPRECATED) |
| 6 | Local module Prisma removed from runtime | **Yes** (DEPRECATED.md; runtime uses `@rri/database`) |
| 7–9 | Centralized JWT / global guards | **Not fully migrated** — M09 still uses module-local `JwtAuthGuard`; `fallback_secret` **removed** |
| 10–14 | Pluggable LLM (OpenAI/Gemini/Groq/Mock) | **Partial** — factory + mock; Groq live in `LlmService`; OpenAI/Gemini env hooks only |
| 15–17 | RLS + tenant isolation | **SQL migration added**; runtime uses `withTenantContext` helper; org-scoped queries in repository |
| 18–24 | Auth/runtime modularization | **Incremental** — repository split; providers folder added |

---

## How to re-run

```powershell
cd r-revenue-intelligence-monorepo\test_case
python testm9.py
```

---

## Residual risks (non-blocking for smoke)

- M09 auth not yet on `platform-core` `JwtAuthGuard` + Passport strategy (M02 pattern).
- RLS migration must be applied to PostgreSQL for production enforcement.
- Assignments/coaching notes remain in-memory until unified Prisma models exist.
