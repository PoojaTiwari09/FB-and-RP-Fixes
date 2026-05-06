# M6 Forecasting Prediction — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M6 Forecasting & Prediction/` including root docs and TDDs  
**Files reviewed:**
- `Module README-M6 Forecasting Prediction.md`
- `Environment Variables Registry-M6.md`
- `Sequence Diagrams for M6.md`
- `TDD/TDD-AI Revenue Predictor.md`
- `TDD/TDD-Forecast Boards.md`

---

## Executive Summary

The M6 Forecasting Prediction module documentation is exceptionally well-aligned with the platform's modular monolith standards. It correctly identifies itself as **M-09 Forecasting and Prediction** and maintains a clear boundary between "Predict" stage logic and the "Execute" stage (M-07) and "Optimize" stage (M-10). The event-driven recalculation pattern (debounced `deal.stage.changed`) is correctly implemented and documented across all files.

**3 specific drifts** were identified, primarily related to database naming conventions and minor logic clarifications.

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
**File:** `Module README-M6 Forecasting Prediction.md` (Section 7), `TDD-Forecast Boards.md` (Section 7)  
**Description:** All forecasting tables are documented in flat `lowercase` (e.g., `forecastperiods`, `forecastsubmissions`, `aiforecastsnapshots`). The platform standard for PostgreSQL schemas is `snake_case`.  
**Impact:** If developers follow the documentation literally, the generated Prisma/SQL schema will violate the platform's naming conventions, leading to inconsistent code and potential migration conflicts.  
**Recommended Fix:** Rename all table references to `snake_case`:
- `forecast_periods`
- `forecast_submissions`
- `ai_forecast_snapshots`
- `pipeline_coverage_metrics`
- `historical_conversion_rates`
- `forecast_accuracy_log`

---

## 🟡 Medium Drifts

### 2. Recalculation Debounce Window Visibility
**File:** `Environment Variables Registry-M6.md` (Line 72) vs `Module README-M6 Forecasting Prediction.md` (Line 115)  
**Description:** The documentation mandates a 60-minute debounce window for recalculations. While the Registry provides a variable (`FORECAST_RECALC_WINDOW_MINUTES`), the UI/UX documentation (TDD-Forecast Boards) does not explicitly state how this lag is communicated to the user (e.g., a "Last updated" tooltip).  
**Impact:** Users may see "stale" numbers for up to an hour after a major deal change and believe the system is broken or non-responsive.  
**Recommended Fix:** Update `TDD-Forecast Boards.md` to require a "Data Freshness" indicator in the Period Header that displays the `computed_at` timestamp from the latest coverage/snapshot record.

---

## 🟢 Low Drifts

### 3. "Predict" Stage vs "M6" Numbering
**File:** `Module README-M6 Forecasting Prediction.md` (Line 12)  
**Description:** The README refers to "Stage 6" (implied by M6), but the boundary document identifies the Predict stage as the 6th stage in the lifecycle. This is consistent, but several TDDs in other modules used different stage numbers.  
**Impact:** Minor terminology confusion during cross-module audits.  
**Recommended Fix:** Ensure all M6 documentation explicitly links "M6" to "Stage 6: Predict" and "Architecture Module M-09" to prevent any ambiguity with M-06 (AI Summaries).

---

## Summary of Resolved Architectural Decisions

1. **Submission Versioning:** Confirmed that re-submissions must create a new row with an incremented version number in `forecast_submissions`. Updates-in-place are strictly forbidden for auditability.
2. **Lock Enforcement:** Confirmed that `is_locked` enforcement happens at the API layer (M-09) and is not just a frontend UI toggle.
3. **Data Source:** M-09 remains a pure consumer of M-03 (Revenue Graph) and does not own any raw CRM sync logic.
4. **Historical Fallback:** AI Predictor must fall back to tenant-level averages when specific stage-transition samples are too small, and this fallback must be flagged in the `model_inputs` metadata.
