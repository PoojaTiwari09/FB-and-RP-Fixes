# TDD: Sales Coaching Insights

## 1. Document Control

| Field | Value |
|---|---|
| Document Title | TDD - Sales Coaching Insights |
| Product Module Name | M9 Coaching Training |
| Feature Name | Sales Coaching Insights |
| Architecture Owner Module | M-10 Coaching and Training |
| Lifecycle Stage | Optimize |
| Document Type | Technical Design Document |
| Version | v1.0 |
| Status | Draft for implementation |
| Primary Owners | Backend Lead, AI Lead, Tech Lead |
| Primary Consumers | Backend Engineers, AI/ML Engineers, Frontend Engineers, QA Engineers, Product Managers |
| Source References | System Architecture Document (SAD), Revenue Intelligence Modules and Feature Mapping |
| File Path | `docs/modules/m09/tdd-sales-coaching-insights.md` |

## 2. Purpose

Sales Coaching Insights analyzes rep and team performance across calls and emails to identify coaching needs and best practices.   
Within the platform architecture, this feature belongs to M-10 Coaching and Training in the Optimize stage, where the system benchmarks rep behavior using outputs from prior lifecycle stages. 

This document explains the internal technical design for Sales Coaching Insights so engineers can build it consistently and freshers can understand what data comes in, what gets computed, where results are stored, and how users are allowed to view the outputs. 

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
- Revenue Dashboards implementation.
- AI Trainer implementation.
- Raw call transcription, topic tagging, or tracker detection logic.
- UI visual design.
- Generic platform auth implementation. 

## 4. Feature Summary

Sales Coaching Insights is the coaching analytics feature inside M9 Coaching Training.   
Its job is to transform platform outputs such as call scores, deal outcomes, activity volumes, and forecast submissions into coaching snapshots, peer benchmarks, and coaching recommendations that help reps improve communication quality and selling behavior over time. 

In simple terms:
1. The platform listens to upstream events.
2. It updates per-rep metrics for a selected period.
3. It compares each rep against peers in the same role.
4. It generates coaching recommendations when the data is reliable.
5. It exposes the results through read APIs with strict RBAC. 

## 5. Users

The main users are:
- Sales reps, who can view only their own coaching insights. 
- Managers, who can view coaching insights for reps on their team only. 
- Admins and RevOps users, who can view all coaching data across the tenant. 

Secondary users:
- Frontend applications rendering coaching dashboards and recommendation panels.
- Internal reporting and analytics surfaces inside M-10. 

## 6. Upstream Dependencies

Sales Coaching Insights is an Optimize-stage feature and depends on outputs from prior lifecycle stages. 

### 6.1 Module dependencies

| Upstream Module | What is consumed | Why it is needed |
|---|---|---|
| M-04 Conversation Intelligence | `call.scored` event, call review metrics | Core input for behavior metrics such as talk ratio, question rate, interactivity score, and call count.  |
| M-09 Forecasting | `forecast.submitted` event, forecast submission history | Used to update forecast-accuracy-related coaching metrics over time.  |
| M-02 Sales Engagement | Email activity volumes where available | Used for broader activity-based coaching context.  |
| M-07 Deal and Account Management / deal outcomes sources | Deal outcomes and win/loss context | Supports outcome-aware coaching interpretation and trend analysis.  |
| Platform Core / Auth | User identity, role, team hierarchy, tenant context | Required for RBAC and tenant isolation.  |

### 6.2 Event dependencies

The architecture explicitly states that M-10 consumes:
- `call.scored` 
- `forecast.submitted` 

Additional supporting reads may come from persisted tables for activities, deals, and forecast history where permitted by the architecture. 

## 7. Downstream Consumers

This feature is a terminal Optimize-stage capability. The architecture notes that M-10 consumes upstream outputs but does not emit further lifecycle events for downstream product modules. 

Primary downstream consumers are:
- Coaching UI pages for reps and managers.
- Internal analytics widgets in M-10.
- Operational users such as RevOps and admins reviewing team performance. 

## 8. Entry Points

Sales Coaching Insights can be entered through three paths:

### 8.1 Event-driven entry points
- `call.scored` event consumer updates rep coaching state after a scored call arrives. 
- `forecast.submitted` event consumer updates forecast-accuracy-related coaching metrics. 

### 8.2 Scheduled entry points
- Periodic recomputation jobs rebuild snapshots and benchmarks for rolling windows such as weekly, monthly, and quarterly periods.
- Backfill jobs rebuild historical coaching state when logic changes or when a tenant is onboarded.

### 8.3 API entry points
- Rep self-view endpoint.
- Manager team view endpoint.
- Admin / RevOps tenant-wide reporting endpoint.
- Recommendation detail endpoint.

## 9. Functional Requirements

The feature shall:
- Compute rep behavior snapshots for a defined period. 
- Store outputs in `coaching_snapshots`. 
- Generate benchmark values by role and metric and store them in `coaching_benchmarks`. 
- Generate recommendations and store them in `coaching_recommendations`. 
- Use metrics such as talk ratio, question rate, interactivity score, and call count. 
- Suppress recommendations when call count is below 5 because the sample is statistically unreliable. 
- Enforce RBAC so reps see only their own data, managers see only their team, and admins/RevOps see all. 
- Support tenant-level isolation with RLS-compatible access patterns. 

## 10. High-Level Flow

### 10.1 End-to-end summary

1. M-04 publishes `call.scored`.
2. M-10 consumes the event.
3. M-10 reads supporting context for the rep and period.
4. M-10 updates or recomputes the rep snapshot.
5. If enough reliable data exists, M-10 recalculates benchmarks and recommendations.
6. Results are stored in coaching tables.
7. Frontend reads data through M-10 APIs with RBAC checks. 

### 10.2 Plain-English explanation

Think of this feature as a report card builder:
- Each new scored call adds evidence.
- The system rolls evidence into a time-boxed snapshot.
- The snapshot is compared against peers in the same role.
- The gap becomes a recommendation only if there is enough sample size to trust it. 

## 11. Snapshot Computation Inputs and Period Logic

### 11.1 Snapshot purpose

A coaching snapshot is the system’s per-rep summary for a time period. The architecture stores this in `coaching_snapshots`, including fields such as period, talk ratio, longest monologue seconds, question rate, filler word rate, interactivity score, call count, and computed timestamp. 

### 11.2 Snapshot inputs

Primary inputs:
- Call review metrics from `call.scored`. 
- Activity volume signals from activities data used by M-10. 
- Deal outcomes and performance context used by M-10 dashboard/coaching analytics. 
- Forecast submission history from forecasting data and `forecast.submitted`. 

### 11.3 Initial supported metrics

The first version shall support:
- `talkRatio`
- `questionRate`
- `interactivityScore`
- `callCount`
- `longestMonologueSeconds`
- `fillerWordRate`
- `forecastSubmissionCount`
- `forecastAccuracyTrend` (derived over time, where supporting data exists)

The architecture explicitly mentions talk ratio, question rate, interactivity score, and call count as coaching metrics. 

### 11.4 Period model

A snapshot is computed for a normalized period key.

Recommended period values:
- `7d_rolling`
- `30d_rolling`
- `90d_rolling`
- `current_month`
- `current_quarter`

Minimum implementation requirement:
- `30d_rolling` for rep coaching.
- `current_month` for manager operational review.

### 11.5 Period rules

- Rolling periods are anchored to current processing time.
- Calendar periods are anchored to tenant timezone.
- Every snapshot row must be uniquely identifiable by tenant, user, and period.
- Recomputations overwrite metric fields for the same logical snapshot rather than creating uncontrolled duplicates.

### 11.6 Computation logic

For each rep and period:
1. Fetch all scored calls within the period.
2. Compute aggregate metrics:
   - average talk ratio
   - average question rate
   - average interactivity score
   - max longest monologue seconds
   - average filler word rate
   - total call count
3. Fetch supporting activity and forecast data for the same period.
4. Add derived fields needed for coaching interpretation.
5. Persist one snapshot row per rep and period. 

### 11.7 Reliability rules

- If `callCount < 5`, mark the snapshot as low-sample for recommendation purposes.
- Snapshot data may still be stored and displayed with a reliability flag, but recommendation generation must be suppressed. 

### 11.8 Idempotency

If the same source event is delivered twice, recomputation must produce the same snapshot state for the same tenant, user, and period. Event consumers must be idempotent because the architecture requires duplicate-safe event handling. 

## 12. Benchmark Generation by Role and Metric

### 12.1 Purpose

Benchmarks let the system compare a rep’s performance to peers in the same role. The architecture stores benchmark values in `coaching_benchmarks` with role, metric name, median value, and top quartile value. 

### 12.2 Benchmark dimensions

Benchmarks are grouped by:
- `tenantId`
- `role`
- `metricName`
- `period`

Example roles:
- SDR
- AE
- CSM
- Manager

### 12.3 Benchmark inputs

Benchmark jobs read:
- Eligible snapshots for the tenant and period.
- User role assignments from the auth/user domain.
- Reliability eligibility rules.

### 12.4 Eligibility rules

A rep snapshot is included in benchmark computation only if:
- The user is active.
- The snapshot belongs to the same tenant.
- The snapshot has enough sample size for that metric family.
- The rep role is populated and mapped to a valid benchmark segment.

### 12.5 Benchmark outputs

For each `(tenant, role, metric, period)` compute:
- `medianValue`
- `topQuartileValue`
- optional internal support fields such as `sampleSize` and `computedAt`

Only `medianValue` and `topQuartileValue` are required by the current architecture table. 

### 12.6 Metric-by-metric examples

- `talkRatio`: compare rep average talk ratio vs role median and top quartile.
- `questionRate`: compare rep curiosity/discovery behavior vs peers.
- `interactivityScore`: compare quality of back-and-forth engagement.
- `callCount`: compare activity sufficiency, but do not use low count as quality proof by itself.

### 12.7 Refresh strategy

Benchmarks should be recomputed:
- On a schedule, at least daily.
- After bulk backfills.
- Optionally after enough new snapshots arrive to cross a configured threshold.

### 12.8 Freshness policy

- Snapshot computation may be near-real-time after events.
- Benchmark computation may be batched because it is aggregate-heavy.
- UI should display `computedAt` to indicate freshness.

## 13. Recommendation Generation Rules and Confidence Thresholds

### 13.1 Purpose

Recommendations convert behavior gaps into actionable coaching advice. The architecture stores them in `coaching_recommendations` with recommendation text, category, priority, confidence score, and generated timestamp. 

### 13.2 Recommendation inputs

A recommendation engine reads:
- Rep snapshot.
- Matching role benchmark rows.
- Optional trend signals across prior snapshots.
- Reliability and low-sample checks.

### 13.3 Baseline recommendation categories

Recommended categories:
- Discovery
- Talk Balance
- Engagement
- Communication Clarity
- Activity Consistency
- Forecast Discipline

### 13.4 Rule model

A recommendation is generated when:
1. There is a valid snapshot.
2. There is a valid benchmark for the same role and period.
3. The metric gap exceeds a configured threshold.
4. The sample is reliable.
5. The generated recommendation passes a confidence threshold.

### 13.5 Example rules

#### Rule A: Talk balance
- If rep talk ratio is materially above role top quartile threshold, generate a recommendation to improve customer airtime balance.
- Category: `Talk Balance`
- Priority: `high`

#### Rule B: Discovery quality
- If question rate is below role median by more than the configured gap threshold, generate a recommendation to ask more discovery questions.
- Category: `Discovery`
- Priority: `high`

#### Rule C: Interactivity weakness
- If interactivity score is below role median and trend is declining, generate a recommendation to improve dialogue flow and customer engagement.
- Category: `Engagement`
- Priority: `medium`

#### Rule D: Insufficient evidence
- If call count is below 5, do not generate recommendations.
- Instead expose a status such as `insufficient_sample`. 

### 13.6 Confidence thresholds

Each recommendation shall have a `confidenceScore` between 0 and 1.

Recommended interpretation:
- `>= 0.85` high confidence
- `0.70 - 0.84` medium confidence
- `< 0.70` do not publish to end users by default

The exact thresholds are implementation-owned within M-10, but confidence gating must exist because recommendation quality should be controlled and low-sample outputs should be suppressed. 

### 13.7 Recommendation text generation

Version 1 recommendation text should be template-based in TypeScript for predictability, auditability, and easier QA.

Example template:
- "Your question rate is below the benchmark for your role this period. Focus on asking more open-ended discovery questions early in the conversation."

Optional future enhancement:
- Use Python AI service to enrich recommendation phrasing, but final business rules and publish decisions must remain in TypeScript because business logic belongs in product services, not AI services. 

### 13.8 Recommendation lifecycle

Status model:
- `draft`
- `published`
- `suppressed`
- `expired`

Version 1 may persist only published rows, but the internal pipeline should support suppression decisions cleanly.

## 14. Manager Versus Rep Access Rules

### 14.1 RBAC requirements

The architecture states:
- Reps can only view their own coaching data. 
- Managers can only view reps on their team. 
- Admins or RevOps can view all coaching data. 

### 14.2 Access matrix

| User Role | Allowed scope |
|---|---|
| Rep | Self only |
| Manager | Direct reports and permitted team hierarchy only |
| Admin | All users in tenant |
| RevOps | All users in tenant |

### 14.3 Enforcement model

RBAC must be enforced in both:
- API authorization layer.
- Data query filter layer.

Never rely on frontend filtering alone.

### 14.4 Team-scope resolution

Manager access requires:
- verified tenant match
- verified manager role
- team membership lookup from approved org hierarchy source
- filtering queries by allowed user IDs only

### 14.5 Forbidden access examples

- A rep cannot request another rep’s snapshot ID directly.
- A manager cannot view reps outside assigned hierarchy.
- Cross-tenant access is always blocked.

### 14.6 Auditability

Sensitive coaching-data access should be audit logged with:
- actor user ID
- tenant ID
- target user ID or team scope
- endpoint
- timestamp
- result (allowed or denied)

## 15. Low-Sample Protection

### 15.1 Why it matters

The architecture explicitly states that recommendations should not be generated when call count is below 5 because the sample is statistically unreliable. 

### 15.2 Required rules

- Store the snapshot even if sample size is low.
- Mark the snapshot with a low-sample indicator.
- Suppress recommendation generation when `callCount < 5`.
- UI should display a plain message such as: "Not enough scored calls yet to generate reliable coaching recommendations."

### 15.3 Optional display behavior

The frontend may still show raw metrics for transparency, but it must visually distinguish:
- informational metrics
- benchmarked metrics
- recommendation-ready metrics

### 15.4 Benchmark inclusion caution

Low-sample snapshots should generally be excluded from benchmark generation unless there is a deliberate metric-specific exception approved by the Tech Lead.

## 16. Data Model

The architecture defines the coaching schema for M-10. 

### 16.1 `coaching_snapshots`

Purpose: per-rep behavior metric snapshot per time period. 

Recommended fields:
- `snapshotid`
- `tenantid`
- `userid`
- `period`
- `periodstart`
- `periodend`
- `talkratio`
- `longestmonologueseconds`
- `questionrate`
- `fillerwordrate`
- `interactivityscore`
- `callcount`
- `forecastsubmissioncount`
- `forecastaccuracytrend`
- `islowsample`
- `computedat`
- `createdat`
- `updatedat`

### 16.2 `coaching_benchmarks`

Purpose: team-level benchmark values per metric and role for peer comparison. 

Recommended fields:
- `benchmarkid`
- `tenantid`
- `role`
- `period`
- `metricname`
- `medianvalue`
- `topquartilevalue`
- `samplesize`
- `computedat`
- `createdat`
- `updatedat`

### 16.3 `coaching_recommendations`

Purpose: AI-generated or rule-generated coaching recommendations per rep per period. 

Recommended fields:
- `recid`
- `snapshotid`
- `tenantid`
- `userid`
- `period`
- `category`
- `priority`
- `recommendationtext`
- `metricname`
- `metricvalue`
- `benchmarkvalue`
- `gapvalue`
- `confidencescore`
- `status`
- `generatedat`
- `createdat`
- `updatedat`

### 16.4 Keys and indexes

Recommended indexes:
- `coaching_snapshots (tenantid, userid, period)`
- `coaching_snapshots (tenantid, period, computedat desc)`
- `coaching_benchmarks (tenantid, role, metricname, period)`
- `coaching_recommendations (tenantid, userid, period, generatedat desc)`

### 16.5 RLS

All rows must carry `tenantid`, aligned with the platform’s multi-tenant isolation rules. 

## 17. Storage and Compute Design

### 17.1 Transactional store

PostgreSQL is the source of truth for coaching snapshots, benchmarks, and recommendations. 

### 17.2 Analytical support

The architecture notes that ClickHouse is used for heavy analytics queries and explicitly mentions Sales Coaching Insights as a feature that benefits from analytical workloads such as averages and percentiles over large datasets. 

Recommended pattern:
- Raw and authoritative coaching entities remain in PostgreSQL.
- Large-scale aggregate analytics may read from analytical replicas or event-derived stores where approved.

### 17.3 Compute split

- TypeScript/NestJS handles API endpoints, event consumers, orchestration, business rules, and persistence. 
- Python AI services handle AI inference where needed. 
- Final recommendation publish decisions remain in TypeScript. 

## 18. Event Flow

### 18.1 `call.scored` consumer flow

1. Receive `call.scored`.
2. Validate tenant and payload.
3. Resolve rep user ID and scoring timestamp.
4. Identify affected snapshot periods.
5. Recompute snapshot metrics for the rep.
6. Queue benchmark refresh if needed.
7. Run recommendation evaluation if sample is sufficient.
8. Upsert snapshot and recommendation rows.
9. Emit internal observability logs.

The architecture states that `call.scored` is published by M-04 and consumed by M-10. 

### 18.2 `forecast.submitted` consumer flow

1. Receive `forecast.submitted`.
2. Validate tenant and submitter.
3. Update forecast-submission-related coaching metrics.
4. Recompute affected snapshots.
5. Refresh recommendations only if rule families use forecast discipline metrics.

The architecture states that `forecast.submitted` is consumed by M-10. 

### 18.3 Retry behavior

Following platform rules:
- Consumers must be idempotent.
- Duplicate deliveries must not create duplicate business state.
- Failed jobs should retry with backoff through BullMQ-compatible patterns. 

## 19. AI Flow

### 19.1 AI usage boundaries

The platform architecture requires every module to include an AI processing step where appropriate, and it assigns AI inference to Python services while business logic stays in TypeScript. 

### 19.2 Sales Coaching Insights AI responsibilities

For this feature, AI may be used to:
- normalize interpretation of behavior patterns
- enrich recommendation phrasing
- assign category confidence
- generate short coaching rationale text

### 19.3 Sales Coaching Insights non-AI responsibilities

These must stay in TypeScript:
- sample-size gating
- threshold comparisons
- benchmark selection
- RBAC decisions
- recommendation publish/suppress decision
- persistence and API response shaping 

### 19.4 AI invocation pattern

Recommended async pattern:
1. Snapshot computed in TypeScript.
2. Rule engine decides whether AI enrichment is needed.
3. If needed, enqueue an async job to Python AI service.
4. AI service returns structured JSON only.
5. TypeScript validates the response and persists final output. 

## 20. API Design

The architecture lists M-10 API prefix as `api/v1/performance`. 

### 20.1 Read APIs

#### GET `/api/v1/coaching/coaching/me`
Returns current user’s latest coaching snapshot, benchmarks, and recommendations.

#### GET `/api/v1/coaching/coaching/users/:userId`
Returns a specific rep’s coaching data.
- Allowed for self.
- Allowed for manager if rep is on team.
- Allowed for admin/RevOps.

#### GET `/api/v1/coaching/coaching/team`
Returns team coaching overview for a manager-scoped user set.

#### GET `/api/v1/coaching/coaching/benchmarks`
Returns benchmark values filtered by role, period, and metric.

#### GET `/api/v1/coaching/coaching/recommendations`
Returns recommendations for a user and period.

### 20.2 Admin or internal APIs

#### POST `/api/v1/coaching/coaching/recompute`
Triggers snapshot recomputation for a tenant, team, or user.
- Admin/RevOps only.

#### POST `/api/v1/coaching/coaching/backfill`
Triggers historical backfill.
- Admin/RevOps only.

### 20.3 Response shape example

```json
{
  "userId": "usr_123",
  "period": "30d_rolling",
  "snapshot": {
    "talkRatio": 0.68,
    "questionRate": 0.07,
    "interactivityScore": 0.59,
    "callCount": 12,
    "isLowSample": false,
    "computedAt": "2026-05-04T08:30:00Z"
  },
  "benchmarks": [
    {
      "metricName": "talkRatio",
      "role": "AE",
      "medianValue": 0.54,
      "topQuartileValue": 0.60
    }
  ],
  "recommendations": [
    {
      "category": "Talk Balance",
      "priority": "high",
      "confidenceScore": 0.91,
      "recommendationText": "Reduce monologue time and create more customer airtime in discovery calls."
    }
  ]
}
```

### 20.4 Error semantics

- `401` unauthenticated
- `403` forbidden by RBAC
- `404` user or snapshot not found in allowed scope
- `409` recomputation already running
- `422` invalid period or invalid query filters

## 21. RBAC and Security

### 21.1 Authentication

M-10 APIs require authenticated tenant-scoped users through platform auth. 

### 21.2 Authorization

Authorization happens before data fetch completion whenever possible.

Rules:
- Rep: `requestedUserId == authUserId`
- Manager: `requestedUserId in managedUserIds`
- Admin/RevOps: tenant-wide access

### 21.3 Tenant isolation

Every query must filter by `tenantid`. The platform architecture requires tenant-level isolation and RLS-backed design. 

### 21.4 Sensitive data handling

Coaching text can affect performance reviews, so:
- do not expose internal confidence-calculation internals to unauthorized users
- log access
- avoid returning hidden recommendation drafts
- redact internal debug payloads from API responses

## 22. Observability

### 22.1 Logging

Structured logs should include:
- event name
- tenant ID
- user ID
- snapshot period
- processing duration
- recommendation count
- low-sample status
- retry count

### 22.2 Metrics

Recommended metrics:
- snapshot recompute job count
- snapshot recompute success rate
- recommendation publish count
- low-sample suppression count
- benchmark recompute duration
- API latency by endpoint
- RBAC denied request count

### 22.3 Tracing

Trace boundaries:
- event consumer receive
- snapshot recompute
- benchmark lookup
- recommendation engine
- DB write
- API response

### 22.4 Alerting

Alert on:
- repeated consumer failures
- benchmark job backlog
- recommendation generation failure spikes
- abnormal growth in RBAC denials
- stale snapshots beyond freshness SLA

## 23. Non-Functional Requirements

### 23.1 Performance

- Rep self-view API should return within acceptable dashboard latency for a normal tenant workload.
- Team coaching view may use pagination and summary-first loading.
- Benchmark generation should be batched to avoid request-path heavy computation.

### 23.2 Scalability

The design must support:
- many tenants
- large call volumes
- repeated recomputation
- future module extraction to an independent service, as the platform plans for module independence in Phase 3. 

### 23.3 Reliability

- Event consumers must be idempotent. 
- Reprocessing the same event must not corrupt state.
- Partial writes must be avoided using transactional boundaries around snapshot and recommendation updates when appropriate.

### 23.4 Maintainability

- Business thresholds must be configuration-driven.
- Metric formulas must be implemented in clear service classes.
- Recommendation templates must be centrally versioned.

### 23.5 Auditability

- Access to coaching data should be traceable.
- Recommendation generation should be reproducible from stored snapshot and benchmark inputs.

## 24. Failure Modes and Recovery

| Failure | Impact | Recovery |
|---|---|---|
| `call.scored` consumer fails | Snapshot not refreshed | Retry job with backoff; alert on repeated failure.  |
| Duplicate event delivery | Risk of duplicate recompute | Idempotent upsert logic prevents duplicate business state.  |
| Benchmark job fails | Recommendations may use stale benchmark | Mark benchmark stale, retry batch, expose freshness timestamp. |
| AI enrichment fails | Recommendation phrasing unavailable | Fall back to template-only recommendation text. |
| User hierarchy lookup fails | Manager scope uncertain | Deny access safely and return authorization error or temporary failure depending on cause. |
| Low sample size | Unreliable outputs | Suppress recommendations when call count is below 5.  |

## 25. Implementation Notes

### 25.1 Service split

TypeScript services:
- event consumers
- snapshot calculator
- benchmark calculator orchestration
- recommendation rules engine
- RBAC guard
- REST APIs

Python services:
- optional recommendation enrichment
- optional narrative explanation generation

This follows the platform rule that product business logic stays in TypeScript and AI inference stays in Python. 

### 25.2 Suggested internal components

- `CoachingEventConsumer`
- `CoachingSnapshotService`
- `CoachingBenchmarkService`
- `CoachingRecommendationService`
- `CoachingAccessService`
- `CoachingQueryService`

### 25.3 Suggested configuration knobs

- snapshot periods enabled
- minimum call count threshold
- metric gap thresholds
- confidence publish threshold
- benchmark recompute cadence
- feature flags for AI enrichment

## 26. Test Strategy

### 26.1 Unit tests

Test:
- snapshot metric calculation
- period resolution
- low-sample detection
- benchmark percentile calculations
- recommendation threshold logic
- RBAC access evaluation

### 26.2 Integration tests

Test:
- `call.scored` event updates snapshot
- `forecast.submitted` event updates forecast-related coaching state
- manager team endpoint filters by allowed reps only
- low-sample snapshots produce no recommendations
- duplicate event delivery does not create duplicates

### 26.3 API tests

Test:
- rep self-view allowed
- rep cross-user view denied
- manager valid team view allowed
- manager external-team view denied
- admin full-tenant view allowed

### 26.4 Data tests

Test:
- `tenantid` present on all rows
- benchmark rows are role-scoped
- recommendation rows link to valid snapshot rows
- stale or missing benchmarks are handled safely

### 26.5 Performance tests

Test:
- self-view latency under realistic tenant load
- team coaching page pagination behavior
- batch benchmark recomputation at larger tenant scale

### 26.6 QA sample scenarios

1. Rep has 3 scored calls in period:
   - snapshot stored
   - recommendations suppressed

2. Rep has 12 scored calls and low question rate:
   - recommendation generated in Discovery category

3. Manager requests rep outside hierarchy:
   - request denied

4. Duplicate `call.scored` event received:
   - no duplicate snapshot side effects

## 27. Open Decisions

The following items should be confirmed during implementation:
- Exact list of email-derived coaching metrics for v1.
- Whether benchmark jobs run hourly or daily.
- Whether recommendation text is fully template-based in v1 or AI-enriched from launch.
- Whether trend analysis across multiple periods is included in v1 or deferred.
- Whether manager dashboards need aggregate team heatmaps in this TDD or only raw team lists.

## 28. Final Build Rules

- Do not generate recommendations when call count is below 5. 
- Keep business logic in TypeScript. 
- Keep optional AI inference in Python AI services. 
- Enforce RBAC strictly for rep, manager, admin, and RevOps scopes. 
- Treat M9 as the product-facing package name and M-10 as the architecture owner module. 
- Build this feature as an Optimize-stage terminal consumer of upstream lifecycle data. 
