# M9 Coaching & Training

## 1. Overview

M9 Coaching & Training is the product-facing module that helps develop every rep’s skills through two core features: **Sales Coaching Insights** and **AI Trainer**.   
In the system architecture, this package is physically and logically unified under **M9 Coaching & Training**, which sits in the **Optimize** stage of the Revenue Intelligence Lifecycle. 

M9 is responsible for benchmarking rep behavior, generating coaching recommendations, exposing performance views, and running AI-simulated training conversations. 

---

## 2. Document Control & Governance

| Field | Value |
|---|---|
| **Document Title** | Module README - M9 Coaching & Training |
| **Product Module Name** | M9 Coaching & Training |
| **Architecture Owner** | Technical Architecture Team & Relanto Engineering |
| **Lifecycle Stage** | Optimize |
| **Version** | v3.0 |
| **Status** | Approved |
| **Last Updated** | 2026-05-18 |
| **File Path** | `modules/m09-coaching-training/README.md` |

---

## 3. What This Module Includes

M9 Coaching & Training includes exactly two product features:
- **Sales Coaching Insights**
- **AI Trainer**

### 3.1 Sales Coaching Insights
Sales Coaching Insights analyzes rep and team performance across calls and emails to identify coaching needs and best practices.   
Inside M9, this is implemented using coaching snapshots, coaching benchmarks, and coaching recommendations that transform behavior metrics into coaching guidance. 

### 3.2 AI Trainer
AI Trainer provides a simulated training environment where reps practice customer conversations with AI personas based on real R-Revenue Intelligence interactions.   
Inside M9, this is implemented using trainer scenarios, trainer sessions, message history, and scorecard-based session results. 

---

## 4. Lifecycle Position

M9 belongs to the **Optimize** stage (Stage 7) of the Revenue Intelligence Lifecycle.   
At this stage, the platform uses data from earlier stages to help leaders and reps improve team performance through dashboards, coaching outputs, and training tools. 

Unlike earlier modules that generate signals for downstream modules, M9 is a **terminal module** in the lifecycle. That means it consumes upstream outputs but does **not** emit further lifecycle events for downstream product modules. 

---

## 5. Why This Module Exists

The goal of M9 Coaching & Training is simple: help every rep get better using real performance data and practice environments. Instead of only showing raw call or deal data, this module converts upstream signals into:
- Rep behavior benchmarks
- Coaching recommendations
- Manager coaching views
- Realistic AI practice sessions
- Scorecard-based feedback 

In simple language:
- **Sales Coaching Insights** tells the rep what to improve. 
- **AI Trainer** gives the rep a safe place to practice improvement. 

---

## 6. Upstream Dependencies

M9 does not work in isolation. It depends on outputs from prior modules and stages. 

### 6.1 Required Upstream Modules

The system architecture explicitly defines the following upstream dependencies:

| Upstream Module | What M9 uses | Why it matters |
|---|---|---|
| **M10 Data & Compliance** | Deal outcomes, win rates, activity volumes, account and deal context via API | Gives coaching and performance features the business context needed to interpret rep behavior. |
| **M2 Conversation Intelligence** | Call scores, topic tag distributions, scorecards | Provides the call behavior signals used by coaching snapshots and linked trainer scorecards. |
| **M6 Forecasting & Prediction** | Forecast submissions and forecast history | Supports forecast-accuracy tracking and performance metrics over time. |

### 6.2 Event Dependencies

M9 consumes the following public platform events:
- `call.scored` (from **M2 Conversation Intelligence**): Triggers both AI scorecard scoring and keyword tracking runs.
- `forecast.submitted` (from **M6 Forecasting & Prediction**): Triggers forecast accuracy evaluation pipelines.

### 6.3 Read-Path Dependencies

M9 reads upstream data through approved REST APIs rather than directly crossing module boundaries in PostgreSQL. The architecture rule is clear: if the data is owned by another module, call that module’s API rather than querying its schema namespace directly.

---

## 7. What This Module Produces

At a product level, M9 Coaching & Training produces:
- Coaching insights for reps and managers
- AI practice conversations
- Scorecard-based training feedback 

At an engineering level, M9 produces:
- Coaching snapshots
- Coaching benchmarks
- Coaching recommendations
- Trainer scenarios
- Trainer sessions
- Trainer messages
- Trainer results

---

## 8. Core User Flows

The most important user flows in this module are:

### 8.1 Rep Coaching Flow
1. A scored call arrives from upstream conversation intelligence (**M2**).
2. M9 updates the rep’s coaching snapshot in `m09_coaching_training.coaching_snapshots`.
3. The system compares the rep to peer benchmarks in `m09_coaching_training.coaching_benchmarks`.
4. Coaching recommendations are generated if the sample size is reliable (`callCount >= 5`). 

### 8.2 Manager Coaching Flow
1. A manager opens the team coaching page.
2. RBAC checks the manager’s team scope.
3. M9 returns snapshots and recommendations only for reps on that team. 

### 8.3 AI Trainer Flow
1. Admin creates a trainer scenario linked to a scorecard.
2. Rep starts a practice session.
3. Each rep turn is sent with full history, persona, and context to the AI service.
4. The AI returns a persona reply.
5. Session completion triggers scorecard-based feedback generation. 

---

## 9. Data Model Summary

The architecture defines a dedicated PostgreSQL schema **`m09_coaching_training`** owned strictly by the M9 module. 

### 9.1 Sales Coaching Insights Tables
- `m09_coaching_training.coaching_snapshots` stores per-rep behavior metric snapshots by period. 
- `m09_coaching_training.coaching_benchmarks` stores role-based benchmark values by metric. 
- `m09_coaching_training.coaching_recommendations` stores coaching guidance per rep and period. 

### 9.2 AI Trainer Tables
- `m09_coaching_training.trainer_scenarios` stores AI Trainer scenario definitions with linked scorecards. 
- `m09_coaching_training.trainer_sessions` stores practice session records. 
- `m09_coaching_training.trainer_messages` stores message-level session conversation logs. 
- `m09_coaching_training.trainer_results` stores scorecard-based feedback for completed sessions. 

*(Note: Dashboard configs and snapshots belong strictly to **M7 R-Revenue Dashboards** under the `m07_revenue_dashboards` namespace).*

---

## 10. APIs

The canonical API prefix is strictly:
```text
/api/v1/m09-coaching-training
```

### 10.1 Coaching Endpoints
- `GET /api/v1/m09-coaching-training/insights/:userId` - Fetches rep coaching snapshot and recommendations. 
- `GET /api/v1/m09-coaching-training/insights/team` - Fetches manager team coaching view. 

### 10.2 AI Trainer Endpoints
- `GET /api/v1/m09-coaching-training/trainer/scenarios` - Lists scenarios. 
- `POST /api/v1/m09-coaching-training/trainer/scenarios` - Creates a scenario (Admin only). 
- `POST /api/v1/m09-coaching-training/trainer/sessions` - Starts a session. 
- `POST /api/v1/m09-coaching-training/trainer/sessions/:id/turn` - Processes a turn. 
- `GET /api/v1/m09-coaching-training/trainer/sessions/:id/result` - Fetches completed feedback. 

---

## 11. RBAC Rules

M9 handles sensitive coaching and training data, so RBAC must be enforced strictly on the server side. 

### 11.1 Coaching Access Rules
- Reps can only view their own coaching data. 
- Managers can only view reps on their own team. 
- Admins and RevOps can view all coaching data. 

### 11.2 Trainer Access Rules
- Admins create and manage scenarios. 
- Reps start and use their own sessions. 
- Session and result access stays tenant-scoped and role-checked. 

### 11.3 Tenant Isolation
Every table in the module must include `tenant_id`, consistent with the platform’s multi-tenant Row-Level Security (RLS) model. Cross-tenant data access is strictly forbidden. 

---

## 12. AI and Service Design

The platform enforces a strict separation of concerns:
- **TypeScript (NestJS)** is the Product Brain: Business logic, API orchestration, RBAC, and persistence stay in TypeScript.
- **Python (FastAPI)** is the AI Brain: AI persona simulation and scorecard-based feedback enrichment happen in Python AI services. 
- **Standard Boundary Rule:** No model SDK logic (`openai`, `langchain`) is permitted in NestJS code. All AI operations are made via private HTTP interfaces to the Python FastAPI microservices.

---

## 13. Terminal Module Rule

M9 is a terminal module in the lifecycle. This has key implications for developers:
- M9 consumes upstream data via BullMQ and public APIs.
- M9 stores and exposes user-facing outputs.
- M9 does **not** publish public lifecycle events for downstream product modules. 

---

## 14. Engineering & Validation Checklist

Developers must respect these guidelines during implementation:
- **Module Boundary:** No direct cross-module imports. Query peer data via REST APIs or BullMQ.
- **Secrets:** Managed exclusively by Doppler. Never commit secrets to source code or environment files.
- **Tenant Redundancy:** Ensure all database queries filter by `tenant_id` at the service layer, acting as a redundant guard alongside PostgreSQL RLS.
- **Idempotency:** Queue-event consumers must track processed `eventId` values in Redis or check database state to prevent duplicate delivery side effects.
- **Low-Sample Safeguard:** Recommendations must not be generated when `callCount < 5`. The UI must suppress recommendations and display the friendly status: *"Not enough scored calls yet to generate reliable coaching recommendations."*

---

## 15. Repository Structure

```text
modules/m09-coaching-training/
  prisma/
    schema.prisma          # M9-specific DB Schema
  src/
    insights/              # Sales Coaching Insights Feature
    trainer/               # AI Trainer Feature
    common/                # Shared utilities & guards
  README.md                # This file
```