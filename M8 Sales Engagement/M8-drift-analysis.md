# M8 Sales Engagement — Drift Analysis

**Prepared by:** Architecture Review  
**Date:** 2026-05-05  
**Scope:** All files in `M8 Sales Engagement/` including root docs, TDDs, and Sequence Diagrams  
**Files reviewed:**
- `Module README M8 Sales Engagement.md`
- `Environment Variables Registry-M8.md`
- `Sequence Diagrams M8 flows.md`
- `TDD/TDD-Email Composer.md`
- `TDD/TDD-Engage To-Do.md`
- `TDD/TDD-Orchestrate.md`
- `TDD/TDD-Workflow Automation.md`

---

## Executive Summary

The M8 Sales Engagement folder acts as a **product grouping** rather than a unified architectural module. The documentation correctly identifies and works around a known architectural boundary conflict: M8 product features are split between two distinct backend modules—**M-02 Sales Engagement** (Email Composer, Engage To-Do) and **M-08 Execution and Automation** (Orchestrate, Workflow Automation).

The documentation is highly detailed and enforces strict event-driven boundaries, idempotency, and API contracts. However, **3 specific drifts** were identified, primarily regarding schema naming conventions, pending architecture decisions (ADRs), and unresolved product/architecture taxonomy.

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

*(None detected — the README safely mitigates the M-02/M-08 ownership conflict by explicitly warning developers, though the underlying ADR remains pending.)*

---

## 🟠 High Drifts

### 1. Database Schema Naming Convention Drift
**File:** All TDDs (`TDD-Email Composer.md`, `TDD-Engage To-Do.md`, `TDD-Orchestrate.md`, `TDD-Workflow Automation.md`)  
**Description:** All tables across both M-02 and M-08 are defined in flat `lowercase`. Examples include `emaildrafts`, `emailsends`, `linkedinactivities`, `salesplays`, `playenrollments`, and `workflowruns`. The platform standard for PostgreSQL schemas is `snake_case`.  
**Impact:** If developers generate Prisma/SQL schemas based on these documents, they will violate platform naming standards.  
**Recommended Fix:** Rename all PostgreSQL table references to `snake_case`:
- **M-02 Tables:** `email_drafts`, `email_sends`, `email_templates`, `email_flows`, `email_flow_enrollments`, `tasks`, `linkedin_activities`.
- **M-08 Tables:** `sales_plays`, `play_enrollments`, `play_step_completions`, `workflows`, `workflow_runs`.

---

## 🟡 Medium Drifts

### 2. Missing ADR for Product-to-Architecture Module Conflict
**File:** `Module README M8 Sales Engagement.md` (Section: Open architecture note)  
**Description:** The README explicitly states that the M-02 vs M-08 overlap is a "critical conflict" identified in the SAD that requires exact feature boundary definitions, canonical naming updates, and an ADR documenting the decision. The TDDs currently act as a band-aid.  
**Impact:** While engineers are currently warned by the README, the formal platform canonical naming and SAD updates are still pending, which maintains long-term structural debt.  
**Recommended Fix:** Formalize the split. Draft and approve the ADR to officially recognize "M8" as a pure frontend/product grouping, permanently cementing M-02 and M-08 as independent microservice boundaries.

### 3. Missing ADR for External Slack Integration
**File:** `Environment Variables Registry-M8.md` (Alerting and notification variables)  
**Description:** The registry includes variables for Slack integration (`SLACK_BOT_TOKEN`, `M08_SLACK_DEFAULT_CHANNEL`), but notes that "Any newly introduced external dependency should be backed by an ADR." No such ADR currently exists for the notification transport strategy.  
**Impact:** Developers might implement Slack API integrations without an approved platform abstraction layer for notifications.  
**Recommended Fix:** Draft an ADR defining the Platform Notification Service abstraction before allowing M-08 to send direct Slack API calls.

---

## 🟢 Low Drifts

*(None detected)*

---

## Summary of Resolved Architectural Decisions

1. **Idempotency Enforcement:** All TDDs explicitly mandate idempotency keys (`tasks` use `sourceId`, `workflowruns` use `idempotencyKey`) because BullMQ retries are an expected part of the architecture.
2. **Delegated Email Only:** Confirmed that `Email Composer` relies solely on delegated OAuth2 (Gmail/Outlook API). Relanto does not act as the origin SMTP server.
3. **No Cross-Module Database Reads:** The boundary between M-02 and M-03 is strictly maintained. M-02 uses the M-03 public API for real-time deal/contact lookup during email generation, avoiding direct table queries.
4. **AI Processing Layer:** Confirmed that AI prompt execution (for Email Drafts) remains in the Python AI Services Layer, and is not embedded in the TypeScript NestJS codebase.
