# M5 Account Intelligence — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M5 Account Intelligence/` including root docs and TDDs  
**Files reviewed:**
- `Module README-M5 Account Intelligence..md`
- `Environment Variables Registry-M5 Account Intelligence.md`
- `Sequence Diagrams for M5.md`
- `TDD/TDD — Account Boards.md`

---

## Executive Summary

The M5 Account Intelligence module documentation is highly consistent with the platform architecture. It correctly identifies **M-07 Deal and Account Management** as its architectural owner and accurately maps dependencies to M-03, M-05, and M-06. The event-driven refresh strategy is well-defined and aligned with the "fast reads, async refresh" pattern. 

**5 specific drifts** were identified, primarily involving data model naming conventions and a minor numbering confusion in adjacent module references. 

**Architectural Correction Note:** A previous audit (M4) incorrectly flagged M-10 as "Data & Compliance." This audit confirms the canonical mapping from `Module boundary document.md`: 
- **M-03**: Revenue Graph (Data / Compliance Foundation)
- **M-09**: Forecasting and Prediction
- **M-10**: Coaching and Training
M5 documentation correctly follows this mapping.

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

*(None detected for M5 core architecture)*

---

## 🟠 High Drifts

### 1. Data Model Naming Case Drift: snake_case vs lowercase
**File:** `TDD/TDD — Account Boards.md` (Section 7) vs `Module README-M5 Account Intelligence..md` (Section 7)  
**Description:** The README uses standard platform `snake_case` for tables (`account_board_configs`, `engagement_scores`, `renewal_signals`), but the TDD uses flat `lowercase` (`accountboardconfigs`, `engagementscores`, `renewalsignals`).  
**Impact:** SQL migration scripts and Prisma schemas may be generated with inconsistent naming, leading to "Table not found" errors and breaking cross-module reads.  
**Recommended Fix:** Standardize all TDD references to `snake_case` to match the platform's SQL naming convention.

### 2. Missing `account_detail_views` or similar persistent state
**File:** `TDD/TDD — Account Boards.md` (Section 6)  
**Description:** The TDD describes a rich Account Detail view with hydration logic, but there is no mention of where (or if) "Next Action" overrides or manual status flags for accounts are persisted.  
**Impact:** If a user manually marks a "Next Action" as completed or irrelevant in the Account Board, and there is no table to store this state, the change will be lost on the next async refresh.  
**Recommended Fix:** Define a `workspace_actions` or `account_status_overrides` table in M-07 to persist user-driven execution state.

---

## 🟡 Medium Drifts

### 3. API Path Ambiguity: `/boards/accounts` vs `/account-boards`
**File:** `Module README-M5 Account Intelligence..md` (Section 5)  
**Description:** The README uses `GET /api/v1/deal-management/boards/accounts`. M4 used `/boards` for deals.  
**Impact:** While functional, this path is deeply nested. If Account Intelligence eventually splits from Deal Intelligence (as noted in ADR conflict BC-003), this path will be difficult to migrate.  
**Recommended Fix:** Consider a flatter alias or ensure the `/deal-management` prefix is understood as the "Execution Surface" prefix rather than being strictly limited to deals.

### 4. Sequence Diagram Naming: `M-07 Account Boards` vs `DealAccountModule`
**File:** `Sequence Diagrams for M5.md` (Line 16)  
**Description:** The diagram refers to the actor as "M-07 Account Boards". The README refers to the implementation as `DealAccountModule`.  
**Impact:** Minor naming inconsistency between implementation (NestJS module) and documentation actors.  
**Recommended Fix:** Align actor names to the canonical module name: `M-07 Deal and Account Management`.

---

## 🟢 Low Drifts

### 5. TDD Reference to "Stage 5" vs "Execute Stage"
**File:** `TDD/TDD — Account Boards.md` (Line 11)  
**Description:** The TDD refers to "Stage 5", while the README and Boundary Doc refer primarily to "Execute Stage".  
**Impact:** Minimal; mainly a terminology preference.  
**Recommended Fix:** Standardize on stage names (Capture, Model, Understand, Analyze, Execute, Predict, Optimize) to avoid numbering confusion if stages are re-ordered.

---

## Summary of Resolved Open Questions (from TDD Section 11)

1. **How should M5 react to `email.sent`?**  
   *Decision:* M5 (M-07) consumes `email.sent` to refresh the `lastActivityAt` timestamp and recompute the `engagement_score` for the affected account.

2. **Should AI Account Briefs be mandatory?**  
   *Decision:* No. If M-06 is unavailable, the board must return a partial response with `aiContextSummary = null` and appropriate freshness metadata.

3. **Where is Saved View configuration stored?**  
   *Decision:* In `account_board_configs` owned by M-07. This table persists columns, filters, and sorting per user.

4. **Is health score recomputed on every read?**  
   *Decision:* No. To preserve M-07 as a read-heavy UI module, scores are stored in `engagement_scores` and refreshed asynchronously via BullMQ workers.
