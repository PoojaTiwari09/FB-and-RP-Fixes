# Drift Analysis: M9 Coaching & Training

**Date:** 2026-05-18  
**Scope:** All files in `/doc/reference/M9 Coaching & Training/` vs. `complete_codebase_knowledge_base.md` (SSOT v3.0)  
**Status:** 100% Compliant (Resolved & Fixed)  

---

## 1. Overview of Audit Findings

An architectural and technical documentation audit was performed on all files in this directory to identify alignment discrepancies with the official **v3.0 Single Source of Truth (SSOT)** document. 

A total of **8 deviations** were found in the legacy files. The main areas of drift included:
- Separation of product views (`M9 Coaching Training`) and architectural boundaries (`M-10 Coaching and Training`).
- Outdated API paths (`/api/v1/coaching/...` instead of `/api/v1/m09-coaching-training`).
- Outdated table schemas (`coaching` instead of `m09_coaching_training`) and inclusion of M7 Dashboard tables (`dashboardconfigs`).
- Incorrect configurations and feature flags using legacy prefixes (`M10_` and `FF_M10_` instead of `M09_`).
- Inconsistent and draft-level version metadata.

---

## 2. Master Matrix of Deviations & Remediation

| ID | Category | Current State (Legacy) | v3.0 SSOT Requirement | Resolution Details | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D-01** | **API Prefix** | `/api/v1/coaching/...` | `/api/v1/m09-coaching-training` | All endpoints changed to use the unified prefix across all features. | **RESOLVED** |
| **D-02** | **Module Workspace** | Splits M9 and M-10 | `/modules/m09-coaching-training/` | Workspace unified under a single physical package directory. | **RESOLVED** |
| **D-03** | **Module Mappings** | Outdated peer module IDs (M-03, M-04, etc.) | Decoupled M1–M10 standard IDs and names | References to conversation scoring mapped to M2; CRM context to M10; Forecasting to M6. | **RESOLVED** |
| **D-04** | **DB Table Names** | Includes Dashboard tables | `snake_case` under schema namespace | Removed M7 Dashboard tables; mapped only core M9 coaching/trainer tables. | **RESOLVED** |
| **D-05** | **DB Schema Namespace** | `coaching` / `M-10` | `m09_coaching_training` | Prefix all database tables with `m09_coaching_training.` | **RESOLVED** |
| **D-06** | **Low-Sample Safeguard** | Stated, but lacked display rules | `callCount < 5` suppresses recommendations | Mapped exact behavior: snapshot stored, text suppressed, UI friendly status shown. | **RESOLVED** |
| **D-07** | **Global Module Flag** | `M10_` and `FF_M10_` prefixes | `M09_` prefix | Replaced all occurrences with standard `M09_` prefixing. | **RESOLVED** |
| **D-08** | **Document Metadata** | Version 1.0 Draft | Version v3.0 Approved | Updated all document headers and control tables. | **RESOLVED** |

---

## 3. Verified Clean Slate

As of **2026-05-18**, all files inside `/doc/reference/M9 Coaching & Training/` have been successfully aligned to the v3.0 SSOT, bringing this module to **100% architectural compliance**.
