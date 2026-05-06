# M4 Deal Intelligence — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M4 Deal Intelligence/` including root docs and TDDs  
**Files reviewed:**
- `Module README-M4 Deal Intelligence.md`
- `Environment Variables Registry-M4.md`
- `Sequence Diagrams for M4.md`
- `TDD/TDD — View Deal Drivers.md`
- `TDD/TDD- Deals Boards .md`

---

## Executive Summary

The M4 Deal Intelligence module is unique because it is a **Product Module** that maps to two distinct **Architectural Modules**: **M-07** (Deal and Account Management) for Deals Boards and **M-05** (Smart Tracking and Search) for View Deal Drivers. While the documentation correctly acknowledges this split, it suffers from significant naming drift regarding core platform modules (M-10 vs M-09) and event naming inconsistencies (`insight.summary.ready` vs `call.summary.generated`). 

**10 distinct drifts** were identified. The most critical involve incorrect module numbering and inconsistent event contracts that would break cross-module integrations.

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

### 1. Module Naming Drift: M-10 vs M-09
**File:** `Module README-M4 Deal Intelligence.md` (Line 48)  
**Description:** The README refers to "M-10 Performance and Coaching".  
**Impact:** Per the core architecture standards and previous audits (M2), **M-09** is "Coaching & Training" and **M-10** is "Data & Compliance". Referring to Performance/Coaching as M-10 will lead to incorrect API scoping and folder structures in the monorepo.  
**Recommended Fix:** Update all references to Performance and Coaching to **M-09**.

### 2. Event Name Inconsistency: `insight.summary.ready`
**File:** `Module README-M4 Deal Intelligence.md` (Line 82)  
**Description:** The README lists `insight.summary.ready` as the event from M-06.  
**Impact:** The canonical event name defined in M-06 (and consumed in M2/M3) is `call.summary.generated`. Using a different name in M4 documentation will lead to failed event subscriptions and broken board enrichment flows.  
**Recommended Fix:** Standardize to `call.summary.generated` across all M4 documents.

---

## 🟠 High Drifts

### 3. Missing Canonical Table: `dealdriversnapshots`
**File:** `TDD/TDD — View Deal Drivers.md` (Line 177), `Module README-M4 Deal Intelligence.md` (Section 8)  
**Description:** The TDD mentions persisting snapshots in `dealdriversnapshots`, but this table is missing from the "Data Ownership" section of the README.  
**Impact:** Database schema implementers relying on the README as the source of truth will miss this critical analytical table, causing the Deal Drivers feature to fail.  
**Recommended Fix:** Add `dealdriversnapshots` to the README Section 8 under M-05 ownership.

### 4. Sequence Diagram / README Contradiction: Event Flow
**File:** `Sequence Diagrams for M4.md` vs `Module README-M4 Deal Intelligence.md`  
**Description:** SD-01 in the Sequence Diagrams (Line 65) correctly uses `call.summary.generated`, but the README (Line 82) uses `insight.summary.ready`.  
**Impact:** Direct contradiction within the same module's documentation suite. Developers will be unsure which event to subscribe to.  
**Recommended Fix:** Align all files to use `call.summary.generated`.

### 5. Unresolved "Warning-to-Driver" Transformation Timing
**File:** `TDD/TDD — View Deal Drivers.md` (Line 141)  
**Description:** The TDD asks whether "unresolved warnings" are counted by detected date or active overlap but phrases it as a "Recommended rule" rather than a final decision.  
**Impact:** Ambiguity in the analytical logic for trend reporting. Two developers might implement the same trend chart with different mathematical bases.  
**Decision:** All deal drivers must be computed based on **Active Overlap** (warnings that were unresolved during the analysis window) to ensure consistency with the Deals Board view.  
**Recommended Fix:** Formalize this rule in TDD Section B5.

---

## 🟡 Medium Drifts

### 6. Ambiguous API Prefix for Smart Tracking
**File:** `Environment Variables Registry-M4.md` (Line 87)  
**Description:** `SMART_TRACKING_API_URL` uses `/api/v1/smart-tracking`.  
**Impact:** M-05 documentation often uses `/api/v1/search` or `/api/v1/tracking`.  
**Recommended Fix:** Verify and standardize the M-05 API prefix across M4 and M5 documentation.

### 7. Missing Env Var: `M07_RISK_SCORE_THRESHOLD`
**File:** `Environment Variables Registry-M4.md`  
**Description:** The TDD for Deals Boards (Section A7) mentions health categories changing when "score crosses a category threshold," but the Env Registry contains no variables to configure these thresholds.  
**Impact:** Hardcoded thresholds in code make it difficult for RevOps to tune the "Health" indicators without a redeploy.  
**Recommended Fix:** Add `M07_HEALTH_THRESHOLD_CRITICAL` and `M07_HEALTH_THRESHOLD_WARNING` to the registry.

### 8. Bidirectional Dependency: M4/M-07 and M-03
**File:** `Module README-M4 Deal Intelligence.md` (Section 4)  
**Description:** M-03 is listed as an upstream dependency for context, but M-03 also consumes `deal.stage.changed` (emitted by M-07) for Revenue Graph updates.  
**Impact:** While not a circular code dependency, it is a circular data flow.  
**Recommended Fix:** Explicitly document the "Event-Driven Loop" in README Section 11 (Operational Notes) to ensure developers don't attempt synchronous updates.

### 9. Incorrect Actor Label in SD-01
**File:** `Sequence Diagrams for M4.md` (Line 57)  
**Description:** Participant `M06` is labeled "Insight Generation" but the module mapping is M-06. In other docs (M2/M3), M-06 is "Insight Generation". This is correct, but line 17 of the Sequence Diagram file says M4 is served by M-07 and M-05.  
**Impact:** Minor naming consistency.  
**Recommended Fix:** Ensure actors always follow the `M-[Number] [Name]` format.

### 10. `dealriskflags` vs `deal_risk_flags`
**File:** `TDD- Deals Boards .md` vs `Database Schema.md`  
**Description:** M4 docs use camelCase `dealriskflags`. Platform standard for tables is snake_case.  
**Impact:** SQL script errors.  
**Recommended Fix:** Update TDD to use `deal_risk_flags`.

---

## Summary of Changes Needed

1. **Rename M-10** to **M-09** in README.
2. **Rename `insight.summary.ready`** to **`call.summary.generated`** everywhere.
3. **Add `dealdriversnapshots`** to README Data Ownership.
4. **Finalize "Active Overlap"** as the windowing rule for Deal Drivers.
5. **Update table names** in TDDs to snake_case (`deal_risk_flags`).
