# M7 Revenue Dashboards — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M7 Revenue Dashboards/` including root docs, TDDs, and Sequence Diagrams  
**Files reviewed:**
- `Module-README M7 R-Revenue Dashboards.md`
- `env-registry.md`
- `TDD/Revenue Dashboards.md`
- `sequence diagrams/sequence-clickhouse-fallback.md`
- `sequence diagrams/sequence-dashboard-read-flow.md`
- `sequence diagrams/sequence-save-dashboard-config.md`

---

## Executive Summary

The M7 Revenue Dashboards module documentation presents a robust, read-optimized architecture heavily reliant on ClickHouse with a well-defined PostgreSQL fallback mechanism. The boundaries correctly position this module as an analytics consumer of upstream data (M-03, M-04, M-09) without incorrectly assuming ownership of core transactional records. 

**4 specific drifts** were identified. The primary issues involve database naming conventions (flat lowercase vs platform standard `snake_case`) and legacy terminology for the M-10 architecture module name.

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

*(None detected)*

---

## 🟠 High Drifts

### 1. Database Schema Naming Convention Drift
**File:** `Module-README M7 R-Revenue Dashboards.md` (Section 2.2), `TDD/Revenue Dashboards.md` (Section 4.1)  
**Description:** All configuration and snapshot tables are documented in flat `lowercase` (e.g., `dashboardconfigs`, `custommetrics`, `dashboardsnapshots`). The platform standard for PostgreSQL schemas is `snake_case`.  
**Impact:** If developers generate Prisma/SQL schemas based on these documents, they will violate platform naming standards and potentially cause integration issues with cross-module reporting.  
**Recommended Fix:** Rename all PostgreSQL table references to `snake_case`:
- `dashboard_configs`
- `custom_metrics`
- `dashboard_snapshots`

---

## 🟡 Medium Drifts

### 2. Canonical Architecture Module Name
**File:** `Module-README M7 R-Revenue Dashboards.md` (Section 1), `TDD/Revenue Dashboards.md` (Section 1.1)  
**Description:** The documentation refers to the architectural owner module as **M-10 Performance and Coaching**. However, the updated `Module boundary document.md` establishes the canonical name as **M-10 Coaching and Training** (resolving older SAD terminology).  
**Impact:** Continued use of "Performance and Coaching" creates naming fragmentation and confusion during cross-module audits.  
**Recommended Fix:** Update all references from "M-10 Performance and Coaching" to the canonical "M-10 Coaching and Training". 

### 3. API Path Base Consistency
**File:** `TDD/Revenue Dashboards.md` (Section 4.2), `sequence-dashboard-read-flow.md`  
**Description:** The defined API endpoints use the `/performance/` prefix (e.g., `/api/v1/performance/dashboards`).   
**Impact:** Given the canonical module name is now "Coaching and Training" (M-10) and the product module is "Revenue Dashboards" (M7), the `/performance/` prefix is a legacy holdover.  
**Recommended Fix:** Consider updating the API base path to `/api/v1/coaching/dashboards` or simply `/api/v1/dashboards` to better align with the canonical module identity and avoid orphaned terminology.

---

## 🟢 Low Drifts

### 4. ClickHouse Table Naming
**File:** `Module-README M7 R-Revenue Dashboards.md` (Section 6.1), `TDD/Revenue Dashboards.md` (Section 8.1)  
**Description:** ClickHouse event tables are also defined in flat lowercase (`callevents`, `activityevents`, `callscoreevents`, `forecastsubmissionevents`).  
**Impact:** While ClickHouse is separate from Postgres, maintaining `snake_case` (`call_events`) is highly recommended for consistency across the data lake.  
**Recommended Fix:** Standardize ClickHouse table names to `snake_case` to mirror their PostgreSQL source equivalents.

---

## Summary of Resolved Architectural Decisions

1. **Read-Only Posture:** M7 is strictly a consumer of upstream data. It does not own transactional logic for deals, calls, or forecasts. 
2. **ClickHouse vs PostgreSQL:** The failover strategy is clearly defined. ClickHouse is the primary analytics engine. PostgreSQL serves as a slower, but highly available, fallback layer to guarantee dashboard uptime.
3. **Multi-Tenancy:** The documentation explicitly enforces that all dashboard queries—both PostgreSQL and ClickHouse—must be isolated by `tenant_id`.
