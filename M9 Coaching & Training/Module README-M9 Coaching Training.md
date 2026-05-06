# M9 Coaching Training

## 1. Overview

M9 Coaching Training is the product-facing module that helps develop every rep’s skills through two features: **Sales Coaching Insights** and **AI Trainer**.   
In the system architecture, this product package maps to **M-10 Coaching and Training**, which sits in the **Optimize** stage of the Revenue Intelligence Lifecycle. 

This means the customer-facing commercial name is **M9 Coaching Training**, while the engineering and architecture owner is **M-10 Coaching and Training**.   
M-10 is responsible for benchmarking rep behavior, generating coaching recommendations, exposing performance views, and running AI-simulated training conversations. 

## 2. What This Module Includes

M9 Coaching Training includes exactly two product features:
- Sales Coaching Insights. 
- AI Trainer. 

### 2.1 Sales Coaching Insights

Sales Coaching Insights analyzes rep and team performance across calls and emails to identify coaching needs and best practices.   
Inside M-10, this is implemented using coaching snapshots, coaching benchmarks, and coaching recommendations that transform behavior metrics into coaching guidance. 

### 2.2 AI Trainer

AI Trainer provides a simulated training environment where reps practice customer conversations with AI personas based on real R-Revenue Intelligence interactions.   
Inside M-10, this is implemented using trainer scenarios, trainer sessions, message history, and scorecard-based session results. 

## 3. Lifecycle Position

M-10 belongs to the **Optimize** stage of the Revenue Intelligence Lifecycle.   
At this stage, the platform uses data from earlier stages to help leaders and reps improve team performance through dashboards, coaching outputs, and training tools. 

Unlike earlier modules that generate signals for downstream modules, M-10 is a **terminal module** in the lifecycle.   
That means it consumes upstream outputs but does **not** emit further lifecycle events for downstream product modules. 

## 4. Why This Module Exists

The goal of M9 Coaching Training is simple: help every rep get better using real performance data and practice environments.   
Instead of only showing raw call or deal data, this module converts upstream signals into:
- rep behavior benchmarks
- coaching recommendations
- manager coaching views
- realistic AI practice sessions
- scorecard-based feedback 

In simple language:
- Sales Coaching Insights tells the rep what to improve. 
- AI Trainer gives the rep a safe place to practice improvement. 

## 5. Architecture Mapping

| Product view | Architecture view |
|---|---|
| M9 Coaching Training | M-10 Coaching and Training  |
| Feature 1 | Sales Coaching Insights  |
| Feature 2 | AI Trainer  |
| Lifecycle stage | Optimize  |
| Module role | Terminal consumer of upstream lifecycle outputs  |

This mapping is important so product naming stays simple for users while engineering documents stay aligned with the architecture. 

## 6. Upstream Dependencies

M-10 does not work in isolation. It depends on outputs from prior modules and stages. 

### 6.1 Required upstream module families

The README should clearly show that M-10 depends on upstream data sources including **M-03**, **M-04**, and **M-09**. 

| Upstream Module | What M9 / M-10 uses | Why it matters |
|---|---|---|
| M-03 Revenue Graph | Deal outcomes, win rates, activity volumes, account and deal context via API | Gives coaching and performance features the business context needed to interpret rep behavior.  |
| M-04 Conversation Intelligence | Call scores, topic tag distributions, scorecards | Provides the call behavior signals used by coaching snapshots and linked trainer scorecards.  |
| M-09 Forecasting | Forecast submissions and forecast history | Supports forecast-accuracy tracking and performance metrics over time.  |

### 6.2 Event dependencies

The architecture explicitly states that M-10 consumes:
- `call.scored` from M-04. 
- `forecast.submitted` from M-09. 

These are core event-driven inputs used to refresh coaching state and performance metrics. 

### 6.3 Read-path dependencies

M-10 also reads upstream data through approved APIs rather than directly crossing module boundaries in application code.   
The architecture rule is clear: if the data is owned by another module, call that module’s API rather than querying its schema directly. 

## 7. What This Module Produces

At a product level, M9 Coaching Training produces:
- coaching insights for reps and managers
- AI practice conversations
- scorecard-based training feedback 

At an engineering level, M-10 produces:
- coaching snapshots
- coaching benchmarks
- coaching recommendations
- trainer scenarios
- trainer sessions
- trainer messages
- trainer results
- performance dashboard data 

## 8. Core User Flows

The most important user flows in this module are:

### 8.1 Rep coaching flow
1. A scored call arrives from upstream conversation intelligence.
2. M-10 updates the rep’s coaching snapshot.
3. The system compares the rep to peer benchmarks.
4. Coaching recommendations are generated if the sample size is reliable. 

### 8.2 Manager coaching flow
1. A manager opens the team coaching page.
2. RBAC checks the manager’s team scope.
3. M-10 returns snapshots and recommendations only for reps on that team. 

### 8.3 AI Trainer flow
1. Admin creates a trainer scenario linked to a scorecard.
2. Rep starts a practice session.
3. Each rep turn is sent with full history, persona, and context to the AI service.
4. The AI returns a persona reply.
5. Session completion triggers scorecard-based feedback generation. 

## 9. Data Model Summary

The architecture defines a dedicated **coaching** schema owned by M-10 Coaching and Training. 

### 9.1 Sales Coaching Insights tables

- `coaching_snapshots` stores per-rep behavior metric snapshots by period. 
- `coaching_benchmarks` stores role-based benchmark values by metric. 
- `coaching_recommendations` stores coaching guidance per rep and period. 

### 9.2 AI Trainer tables

- `trainer_scenarios` stores AI Trainer scenario definitions with linked scorecards. 
- `trainer_sessions` stores practice session records. 
- `trainer_messages` stores message-level session conversation logs. 
- `trainer_results` stores scorecard-based feedback for completed sessions. 

### 9.3 Dashboard-related M-10 tables

The broader M-10 module also owns dashboard-related tables such as:
- `dashboardconfigs`
- `dashboardsnapshots`
- `custommetrics` 

These are part of the architecture owner module, even though M9 Coaching Training itself is focused on Sales Coaching Insights and AI Trainer. 

## 10. APIs

The architecture defines the M-10 API prefix as:

```text
/api/v1/coaching
```

### 10.1 Coaching endpoints

Key coaching endpoints include:
- `GET /api/v1/coaching/coaching/:userId` for rep coaching snapshot and recommendations. 
- `GET /api/v1/coaching/coaching/team` for manager team coaching view. 

### 10.2 AI Trainer endpoints

Key trainer endpoints include:
- `GET /api/v1/coaching/trainer/scenarios` to list scenarios. 
- `POST /api/v1/coaching/trainer/scenarios` to create a scenario. 
- `POST /api/v1/coaching/trainer/sessions` to start a session. 
- `POST /api/v1/coaching/trainer/sessions/:id/turn` to process a turn. 
- `GET /api/v1/coaching/trainer/sessions/:id/result` to fetch completed feedback. 

## 11. RBAC Rules

This module handles sensitive coaching and training data, so RBAC must be enforced strictly. 

### 11.1 Coaching access rules

The architecture states:
- Reps can only view their own coaching data. 
- Managers can only view reps on their own team. 
- Admins and RevOps can view all coaching data. 

### 11.2 Trainer access rules

Recommended trainer access rules:
- Admins create and manage scenarios. 
- Reps start and use their own sessions. 
- Session and result access stays tenant-scoped and role-checked. 

### 11.3 Tenant isolation

Every table in the module must include `tenantid`, consistent with the platform’s multi-tenant RLS model.   
Cross-tenant data access is never allowed. 

## 12. AI and Service Design

The architecture requires a strict split:
- **TypeScript** for product services and business logic. 
- **Python** for AI and ML inference. 

For M9 Coaching Training, that means:
- Coaching business rules, API orchestration, RBAC, and persistence stay in TypeScript. 
- AI persona simulation and optional recommendation or scoring enrichment happen in Python AI services. 

The architecture also requires product services to call AI services over internal APIs rather than embedding model logic directly into product code. 

## 13. Terminal Module Rule

M-10 is a terminal module in the lifecycle.   
This is important for developers because it changes how they think about outputs.

What it means:
- M-10 consumes upstream data.
- M-10 stores and exposes user-facing outputs.
- M-10 does not publish lifecycle events for downstream product modules. 

So when building M9:
- do not design new downstream dependencies from M-10 to future product modules
- do not assume other lifecycle modules will consume coaching or trainer events
- treat this module as the final optimization layer for user-facing improvement workflows 

## 14. Engineering Rules

These implementation rules come directly from the architecture and must be followed:

### 14.1 Module boundary rule
If M-10 needs data from another module, it must use the published event or public API, not direct internal imports or cross-schema writes. 

### 14.2 AI boundary rule
Do not embed AI logic in TypeScript product code. AI inference belongs in Python services. 

### 14.3 Business logic rule
Keep coaching rules, recommendation thresholds, session lifecycle logic, and RBAC in TypeScript product services. 

### 14.4 Tenant rule
Every write must include `tenantid`, and queries must remain tenant-scoped. 

### 14.5 Reliability rule
Event consumers must be idempotent because duplicate deliveries can happen. 

## 15. Low-Sample and Reliability Notes

For Sales Coaching Insights, the architecture explicitly warns that coaching recommendations should not be generated when `callCount < 5`, because the sample is statistically unreliable.   
This is one of the most important implementation safeguards in the module. 

For AI Trainer, the most important reliability rule is that the full conversation history must be sent on each turn, while session state itself stays in M-10 storage. 

## 16. Suggested Repository Structure

```text
docs/
  modules/
    m09/
      README.md
      tdd-sales-coaching-insights.md
      tdd-ai-trainer.md
      sequence-call-score-to-coaching-update.md
      sequence-manager-coaching-view.md
      sequence-ai-trainer-session.md
      sequence-create-trainer-scenario.md
      env-registry.md
```

These file names align with the recommended documentation structure for M9 Coaching Training. 

## 17. Who Should Read This Module README

This README is useful for:
- freshers who need to understand what M9 is and where it fits
- backend engineers building APIs and event consumers
- AI engineers integrating persona simulation and feedback generation
- QA engineers validating coaching and trainer flows
- product managers reviewing module boundaries and dependencies 

## 18. Quick Summary for Freshers

If you are new to the project, remember this:

- **M9 Coaching Training** is the product name. 
- **M-10 Coaching and Training** is the architecture owner. 
- It has only **two features**: Sales Coaching Insights and AI Trainer. 
- It depends mainly on **M-03 Revenue Graph**, **M-04 Conversation Intelligence**, and **M-09 Forecasting**. 
- It is a **terminal Optimize-stage module**, so it consumes upstream signals but does not feed later lifecycle modules. 
- Coaching outputs must respect RBAC and low-sample reliability rules. 
- AI logic stays in Python, while product logic stays in TypeScript. 