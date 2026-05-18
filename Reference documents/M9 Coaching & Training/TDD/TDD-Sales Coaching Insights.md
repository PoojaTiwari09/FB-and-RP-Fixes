# TDD: Sales Coaching Insights

## 1. Document Control

| Field | Value |
|---|---|
| **Document Title** | TDD - Sales Coaching Insights |
| **Product Module Name** | M9 Coaching & Training |
| **Feature Name** | Sales Coaching Insights |
| **Workspace Directory** | `modules/m09-coaching-training/` |
| **Lifecycle Stage** | Optimize |
| **Document Type** | Technical Design Document |
| **Version** | v3.0 |
| **Status** | Approved |
| **Primary Owners** | Backend Lead, AI Lead, Tech Lead |
| **Primary Consumers** | Backend Engineers, AI/ML Engineers, Frontend Engineers, QA Engineers, Product Managers |
| **Source References** | System Architecture Document (SAD), Revenue Intelligence Modules and Feature Mapping |
| **File Path** | `modules/m09-coaching-training/src/insights/tdd-sales-coaching-insights.md` |

---

## 2. Purpose

Sales Coaching Insights analyzes rep and team performance across calls and emails to identify coaching needs and best practices.   
Within the platform architecture, this feature belongs to the **M9 Coaching & Training** module in the **Optimize** stage (Stage 7), where the system benchmarks rep behavior using outputs from prior lifecycle stages. 

This document explains the internal technical design for Sales Coaching Insights so engineers can build it consistently and freshers can understand what data comes in, what gets computed, where results are stored, and how users are allowed to view the outputs. 

---

## 3. Scope

This TDD covers:
- Rep-level coaching snapshot computation.
- Team and role benchmark generation.
- Recommendation generation based on behavior gaps.
- Access control for reps, managers, admins, and RevOps.
- Event-driven update flows from upstream modules.
- Storage design for snapshots, benchmarks, and recommendations.
- API design for reading coaching outputs.
- Observability, NFRs, and test strategy. 

This TDD does not cover:
- Revenue Dashboards implementation (owned by **M7 R-Revenue Dashboards**).
- AI Trainer implementation.
- Raw call transcription, topic tagging, or tracker detection logic (owned by **M1** / **M2**).
- UI visual design.
- Generic platform auth implementation. 

---

## 4. Upstream Dependencies

Sales Coaching Insights is an Optimize-stage feature and depends on outputs from prior lifecycle stages. 

### 4.1 Module Dependencies

| Upstream Module | What is consumed | Why it is needed |
|---|---|---|
| **M2 Conversation Intelligence** | `call.scored` event, call review metrics | Core input for behavior metrics such as talk ratio, question rate, interactivity score, and call count. |
| **M6 Forecasting & Prediction** | `forecast.submitted` event, forecast history | Used to update forecast-accuracy-related coaching metrics over time. |
| **M8 Sales Engagement** | Email activity volumes | Used for broader activity-based coaching context. |
| **M10 Data & Compliance** | Deal outcomes, win/loss context, accounts | Supports outcome-aware coaching interpretation and trend analysis. |
| **Platform Core / Auth** | User identity, role, team hierarchy, tenant context | Required for RBAC and tenant isolation. |

### 4.2 Event Dependencies

M9 consumes the following public events:
- `call.scored` (published by **M2**)
- `forecast.submitted` (published by **M6**)

---

## 5. Entry Points

Sales Coaching Insights can be entered through three paths:

### 5.1 Event-Driven Entry Points
- `call.scored` event consumer: Updates rep coaching state after a scored call arrives.
- `forecast.submitted` event consumer: Updates forecast-accuracy-related coaching metrics.

### 5.2 Scheduled Entry Points
- Periodic recomputation jobs: Rebuilds snapshots and benchmarks for rolling windows (weekly, monthly, quarterly).
- Backfill jobs: Rebuilds historical coaching state when logic changes.

### 5.3 API Entry Points
- Rep self-view: `GET /api/v1/m09-coaching-training/insights/me`
- Manager team view: `GET /api/v1/m09-coaching-training/insights/team`
- Rep detail view: `GET /api/v1/m09-coaching-training/insights/users/:userId`
- Recompute snapshot: `POST /api/v1/m09-coaching-training/insights/recompute` (Admin/RevOps only)

---

## 6. Functional & Computational Design

Sales Coaching Insights transforms transactional records into snapshots, benchmarks, and actionable recommendations.

### 6.1 Snapshot Computation Period Logic
Snapshots are computed for rolling periods, anchored to current processing time in the tenant's timezone.
Supported periods:
- `last_30_days` (rolling)
- `current_month` (calendar-based)

Aggregated metrics computed:
- `talkRatio`: Average rep speak time ratio across calls.
- `questionRate`: Average question frequency per minute.
- `interactivityScore`: Rate of conversational turn-taking.
- `callCount`: Total scored calls during the period.
- `longestMonologueSeconds`: Maximum single-monologue length.
- `fillerWordRate`: Average filler words count per segment.

### 6.2 Low-Sample Safeguard (CRITICAL ARCHITECTURAL BOUNDARY)
The system enforces a strict low-sample check:
- **Rule:** If `callCount < 5`, no coaching recommendations may be generated. 
- **Rationale:** Gaps generated from too few calls are statistically invalid and trigger AI hallucinations.
- **Enforcement:** The database row is saved with `is_low_sample = true`, but no recommendation text is written to `coaching_recommendations`.
- **UI Behavior:** The frontend will suppress all recommendation panels, showing the standard friendly message: *"Not enough scored calls yet to generate reliable coaching recommendations."*

### 6.3 Benchmark Generation
Benchmarks are compiled by grouping active, non-low-sample rep snapshots by role and period within a tenant. The system computes two values:
- `medianValue`: Middle-point rep value.
- `topQuartileValue`: 75th-percentile mark representing stellar performance.

### 6.4 Recommendation Generation Rules
When `callCount >= 5`, the engine evaluates gaps between the rep snapshot and role benchmarks:
- **Objection Monologues:** If Monologue seconds are above top quartile, generate a "Monologue Reduction" recommendation.
- **Discovery Depth:** If question rate is below median by 15%+, generate a "Curiosity Depth" recommendation.
- **Interactivity Gap:** If interactivity is below median, generate a "Dialogue Interactivity" recommendation.
- **Validation:** Recommended items carry a confidence score. If `confidenceScore < 0.70`, the item is suppressed and not published.

---

## 7. Data Model

All tables reside within the PostgreSQL **`m09_coaching_training`** schema namespace.

### 7.1 `m09_coaching_training.coaching_snapshots`
- `snapshot_id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id` UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE
- `user_id` UUID NOT NULL
- `period` VARCHAR(20) NOT NULL  # last_30_days, current_month
- `talk_ratio` DECIMAL(4, 3) NOT NULL
- `longest_monologue_seconds` INTEGER NOT NULL
- `question_rate` DECIMAL(5, 4) NOT NULL
- `filler_word_rate` DECIMAL(5, 4) NOT NULL
- `interactivity_score` DECIMAL(4, 3) NOT NULL
- `call_count` INTEGER NOT NULL
- `forecast_submission_count` INTEGER DEFAULT 0
- `forecast_accuracy_trend` DECIMAL(4, 3) DEFAULT NULL
- `is_low_sample` BOOLEAN DEFAULT false
- `computed_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 7.2 `m09_coaching_training.coaching_benchmarks`
- `benchmark_id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id` UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE
- `role` VARCHAR(50) NOT NULL  # AE, SDR, CSM
- `period` VARCHAR(20) NOT NULL
- `metric_name` VARCHAR(50) NOT NULL
- `median_value` DECIMAL(6, 4) NOT NULL
- `top_quartile_value` DECIMAL(6, 4) NOT NULL
- `sample_size` INTEGER NOT NULL
- `computed_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 7.3 `m09_coaching_training.coaching_recommendations`
- `rec_id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `snapshot_id` UUID NOT NULL REFERENCES m09_coaching_training.coaching_snapshots(snapshot_id) ON DELETE CASCADE
- `tenant_id` UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE
- `user_id` UUID NOT NULL
- `period` VARCHAR(20) NOT NULL
- `category` VARCHAR(50) NOT NULL  # Discovery, Talk Balance, Engagement
- `priority` VARCHAR(10) NOT NULL  # high, medium, low
- `recommendation_text` TEXT NOT NULL
- `metric_name` VARCHAR(50) NOT NULL
- `metric_value` DECIMAL(6, 4) NOT NULL
- `benchmark_value` DECIMAL(6, 4) NOT NULL
- `gap_value` DECIMAL(6, 4) NOT NULL
- `confidence_score` DECIMAL(3, 2) NOT NULL
- `status` VARCHAR(20) NOT NULL DEFAULT 'published'  # published, suppressed
- `generated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### 7.4 Keys and Indexes
- `CREATE INDEX idx_snapshots_tenant_user_period ON m09_coaching_training.coaching_snapshots(tenant_id, user_id, period);`
- `CREATE INDEX idx_benchmarks_lookup ON m09_coaching_training.coaching_benchmarks(tenant_id, role, metric_name, period);`
- `CREATE INDEX idx_recs_user_period ON m09_coaching_training.coaching_recommendations(tenant_id, user_id, period, generated_at desc);`

---

## 8. RBAC and Access Validation Rules

- **Authentication:** All requests must carry a valid JWT with verified `tenant_id` and `user_id` claims.
- **Authorization Guard:**
  - **Rep Self-View (`/insights/me`):** Restricts query strictly to matching JWT `user_id`.
  - **Rep Detail View (`/insights/users/:userId`):** 
    - Allowed if `userId == JWT.userId` (self).
    - Allowed if manager and rep is on manager's direct team (M9 calls **M10 Data & Compliance** org endpoint to verify).
    - Allowed if user is Admin or RevOps.
  - **Manager Team View (`/insights/team`):** Resolves manager's direct reports and queries snapshots only for those IDs.
- **Tenant Scope:** Every query must enforce a `tenant_id` filter at the service layer, acting as a redundant guard alongside PostgreSQL RLS.
- **Audit Trails:** Denied attempts and all accesses to recommendations are recorded in the security audit log.
