# M10 Data & Compliance — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M10 Data & Compliance/` including root docs, Sequence Diagrams, Env Registry, and TDDs  
**Files reviewed:**
- `Module README-M10 Data Compliance.md`
- `Environment Variables Registry-M10.md`
- `Sequence Diagrams-M10 flows.md`
- `TDD/TDD-Configure Compliance Settings.md`
- `TDD/TDD-Data Cloud or Data Export.md`
- `TDD/TDD-Revenue Graph.md`

---

## Executive Summary

The M10 Data & Compliance folder correctly documents itself as a **product grouping** and intentionally avoids the "monolithic TDD" anti-pattern. It rightfully splits the architecture ownership between **M-03 Revenue Graph / Data Platform** (for Revenue Graph and Data Cloud) and **Platform Core** (for cross-cutting Compliance governance).

The boundaries for tenant isolation, idempotent processing, and AI separation are extremely well documented. However, **3 drifts** were identified across schema naming, environment variable prefixes, and event naming consistency.

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

### 1. Database Schema Naming Convention Drift (Compliance Schema)
**File:** `TDD/TDD-Configure Compliance Settings.md`  
**Description:** While the Data Cloud and Revenue Graph TDDs correctly use `snake_case` for their tables, the Compliance Settings TDD defines core tables using flat `lowercase` (e.g., `consentlogs`, `crmoptouts`, `compliancepolicies`, `policyversions`).  
**Impact:** Generates schema inconsistency and violates the platform-wide PostgreSQL standard.  
**Recommended Fix:** Rename all PostgreSQL tables in the Compliance TDD to `snake_case`:
- `consentlogs` ➡️ `consent_logs`
- `crmoptouts` ➡️ `crm_opt_outs` (or `crm_optouts`)
- `compliancepolicies` ➡️ `compliance_policies`
- `policyversions` ➡️ `policy_versions`
- `complianceevaluationevents` ➡️ `compliance_evaluation_events`

---

## 🟡 Medium Drifts

### 2. Environment Variable Prefix Architecture Misalignment
**File:** `Environment Variables Registry-M10.md`  
**Description:** The registry introduces new arbitrary prefixes based on feature names (`RG_` for Revenue Graph, `CMP_` for Compliance, `DC_` for Data Cloud). However, previous architecture audits have strictly enforced that environment variables must use the **architecture owner module prefix** (e.g., `M03_`, `M10_`, `CORE_`).  
**Impact:** Since M-03 owns Revenue Graph and Data Cloud, using `RG_` and `DC_` breaks the platform configuration standard and obscures module ownership for DevOps.  
**Recommended Fix:** Align prefixes with their true architecture owners:
- Replace `RG_` and `DC_` prefixes with `M03_` (e.g., `M03_ENTITY_RESOLUTION_MIN_CONFIDENCE`, `M03_EXPORT_QUEUE_NAME`).
- Replace `CMP_` prefix with a core platform prefix like `CORE_COMPLIANCE_` or `M10_` depending on final platform naming decisions.

---

## 🟢 Low Drifts

### 3. Event Naming Typo / Inconsistency
**File:** `TDD/TDD-Revenue Graph.md`  
**Description:** The primary event emitted by Revenue Graph is referred to as `revenuegraph.entity.linked` in the TDD text, but correctly referenced as `revenue_graph.entity.linked` in the Sequence Diagrams and Env Registry.  
**Impact:** Minor discrepancy, but could lead to bugs if developers copy/paste the event name from the TDD.  
**Recommended Fix:** Globally standardize the event name to `revenue_graph.entity.linked` in the Revenue Graph TDD to adhere to the `noun.verb` or `noun.stage.verb` platform standard.

---

## Summary of Maintained Architectural Standards

1. **Clear Modular Boundaries:** M10 correctly delegates ownership to M-03 (Data/Model) and Platform Core (Governance), avoiding building a monolithic "M10 service".
2. **Idempotency & Replayability:** Strongly enforces idempotency for Data Cloud exports and Revenue Graph event consumers.
3. **Data Ownership & Tenant Isolation:** Explicitly defines that Data Cloud exports belong to the customer, and enforces `tenant_id` scoping for all compliance, graph, and export operations.
