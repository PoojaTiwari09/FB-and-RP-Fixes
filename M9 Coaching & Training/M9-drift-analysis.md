# M9 Coaching & Training — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M9 Coaching & Training/` including root docs, Sequence Diagrams, and TDDs  
**Files reviewed:**
- `Module README-M9 Coaching Training.md`
- `Environment Variables Registry M9.md`
- `Sequence Diagrams-M9 flows.md`
- `TDD/TDD-AI Trainer.md`
- `TDD/TDD-Sales Coaching Insights.md`

---

## Executive Summary

The M9 Coaching & Training folder operates as the product-facing grouping for the architecture module **M-10 Performance and Coaching** (recently standardized to **M-10 Coaching and Training** in prior audits). The documentation is highly detailed and accurately positions M-10 as a **terminal module** in the Optimize stage, meaning it consumes lifecycle events (`call.scored`, `forecast.submitted`) but does not emit them.

Overall, the architectural boundaries regarding AI inference (Python) vs. product orchestration (TypeScript) are strictly respected. However, **3 drifts** were identified, specifically around database schema naming, API path taxonomy, and feature flag naming inconsistencies.

---

## Severity Legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Blocks implementation or creates structural architectural ambiguity |
| 🟠 High | Will cause confusion or bugs; should be fixed before dev begins |
| 🟡 Medium | Inconsistency creating documentation or schema debt |
| 🟢 Low | Minor quality, naming, or formatting issue |

---

## 🔴 Critical Drifts

*(None detected — the terminal module boundary and AI layer separation are correctly documented.)*

---

## 🟠 High Drifts

### 1. Database Schema Naming Convention Drift
**File:** All TDDs (`TDD-AI Trainer.md`, `TDD-Sales Coaching Insights.md`), README  
**Description:** All tables across the M-10 schema are documented using flat `lowercase` formatting (e.g., `coachingsnapshots`, `trainerscenarios`, `trainerresults`). The platform standard for PostgreSQL databases is `snake_case`.  
**Impact:** Developers generating Prisma schemas directly from these TDDs will violate platform database naming standards.  
**Recommended Fix:** Rename all PostgreSQL tables to `snake_case` in the documentation:
- `coachingsnapshots` ➡️ `coaching_snapshots`
- `coachingbenchmarks` ➡️ `coaching_benchmarks`
- `coachingrecommendations` ➡️ `coaching_recommendations`
- `trainerscenarios` ➡️ `trainer_scenarios`
- `trainersessions` ➡️ `trainer_sessions`
- `trainermessages` ➡️ `trainer_messages`
- `trainerresults` ➡️ `trainer_results`

---

## 🟡 Medium Drifts

### 2. Feature Flag Naming Ambiguity (M9 vs M10)
**File:** `Environment Variables Registry M9.md`  
**Description:** The feature flags mix product-level prefixes (`FF_M9_COACHING_ENABLED`, `FF_M9_AI_TRAINER_ENABLED`) with architecture-level prefixes (`FF_M10_TEAM_COACHING_VIEW_ENABLED`, `FF_M10_TRAINER_SCENARIO_ADMIN_ENABLED`). The rest of the registry correctly standardizes on `M10_` for queues, cache TTLs, and configuration.  
**Impact:** Mixing product and architecture prefixes in runtime environment variables creates confusion for DevOps and backend engineers managing deployments.  
**Recommended Fix:** Standardize all backend configuration and feature flags on the architecture owner (`M10_`). Rename `FF_M9_COACHING_ENABLED` to `FF_M10_COACHING_ENABLED` and `FF_M9_AI_TRAINER_ENABLED` to `FF_M10_AI_TRAINER_ENABLED`.

### 3. API Route Prefix Taxonomy Conflict
**File:** `README`, `TDDs`, `Env Registry`  
**Description:** The documentation defines the M-10 API prefix as `/api/v1/performance`. However, a prior architecture review (M7 audit) standardized the canonical name of M-10 from "Performance and Coaching" to "Coaching and Training" to unify product and architecture terminology.  
**Impact:** The API path `/performance` is a legacy artifact of the old naming convention.  
**Recommended Fix:** Update the API route prefix in all M-10/M9 documentation to `/api/v1/coaching` to align with the canonical module name. Ensure this is reflected in the `API_PREFIX` environment variable.

---

## 🟢 Low Drifts

*(None detected)*

---

## Summary of Maintained Architectural Standards

1. **Terminal Module Boundaries:** Correctly asserts that M-10 consumes upstream events (`call.scored`, `forecast.submitted`) but explicitly does not emit lifecycle events downstream.
2. **AI Layer Isolation:** Explicitly defines that all AI logic (persona simulation, scoring) must live in Python services (`/internal/simulate-turn`), and product logic (session state, RBAC) must live in TypeScript.
3. **Idempotency & Sample Size Gating:** Correctly requires idempotent consumer writes and enforces a statistical reliability gate (`callCount < 5`) before generating coaching recommendations.
4. **Tenant Isolation:** Enforces `tenantid` across all queries and restricts Manager RBAC via team scope resolution.
