# Non-Functional Requirements (NFR) Specification

| Property        | Value                                       |
|-----------------|---------------------------------------------|
| Product         | R-Revenue Intelligence                      |
| Organization    | Relanto.ai                                  |
| Document Type   | Non-Functional Requirements Specification   |
| Version         | 0.1                                         |
| Status          | Draft                                       |
| Last Updated    | May 2026                                    |
| Owner           | Tech Lead — R-Revenue Intelligence          |
| Review Cadence  | Every 3 months, or after any major incident |

---

## 1. Overview

### 1.1 Purpose

This document defines the measurable quality targets that R-Revenue Intelligence must meet
in production across performance, reliability, security, compliance, and operations.
These are **contractual targets** — not best-effort guidelines.
Every NFR in this document has a defined target value, a measurement method, a tooling
owner, and a breach response. If a target is breached in production, the on-call engineer
must open an incident ticket, investigate the root cause, and post a resolution within the
defined SLA window.

> **Impact Assessment Rule:** Any architectural change, new feature deployment, or
> infrastructure scaling event that is expected to affect any of these targets **must**
> include an NFR impact assessment in the pull request or ADR before merging.

---

### 1.2 Scope

This document applies to the entire R-Revenue Intelligence platform built by Relanto.ai.
It covers all 10 platform modules (M-01 through M-10), all environments where production
traffic runs, and all shared infrastructure components.

**In scope:**

- All 10 platform modules — M-01 Data Ingestion through M-10 Performance Coaching
- Core API layer (NestJS — `api/v1/**`)
- AI/ML services layer (FastAPI — transcription, summarization, agent flows)
- Background job processing (BullMQ queues and workers)
- Data stores (PostgreSQL via Supabase, Redis via Upstash, Meilisearch, pgvector, ClickHouse)
- Webhook ingestion endpoints (Zoom, Microsoft Teams, Google Meet, CRM integrations)
- Authentication and authorization layer (Supabase Auth, RBAC)
- Infrastructure and deployment (Railway — Phase 1/2; AWS ECS — Phase 3)
- All external integration points (Salesforce, HubSpot, Dynamics 365, Gmail, Outlook)

**Out of scope:**

- Internal business logic of individual features — covered in each feature's TDD
- UI/UX interaction design — covered in Product Design Specifications (Figma)
- API endpoint contracts and payload schemas — covered in API Design Documents
- Test cases and QA checklists — covered in QA Test Plans

---

### 1.3 References

The following documents are referenced throughout this specification.
If there is any conflict between this document and a referenced document on a
platform-level NFR, this document takes precedence. Feature-level specifics defer to
their respective TDDs.

| Document ID | Title                              | Description                                                                                           |
|-------------|------------------------------------|-------------------------------------------------------------------------------------------------------|
| SAD         | [System Architecture Document v1.0](./System_architecture.md)  | Primary architecture reference. NFRs originate from SAD §15. Security from SAD §14.                  |
| T-07        | [Security Architecture Document](./Security_Architecture.md)     | Full threat model, pen test scope, incident response playbook, GDPR and CCPA implementation detail.   |
| T-08        | [Data Retention Policy](./Data_Retention_Policy.md)              | Per-entity data retention schedules, deletion cascade rules, audit log retention by plan.             |
| T-09        | [Compliance Controls Matrix](./Compliance_Controls_Matrix.md)         | SOC 2 Type II control mapping, GDPR Article compliance mapping, CCPA compliance mapping.              |
| T-10        | [Incident Response Playbook](./Incident_Response_Playbook.md)         | Severity classification, escalation path, communication templates, post-incident review process.      |
| TDD-*       | Feature Technical Design Documents | Feature-level implementation details. Each TDD must reference this document for platform-level NFRs.  |

---


## 2. NFR Principles and Governance

### 2.1 Principles

These principles apply to every NFR in this document. Every engineer, QA, and PM working
on R-Revenue Intelligence must understand and follow them.

**1. Every NFR must be measurable.**
A quality target that cannot be measured is not an NFR — it is a wish. Every NFR in this
document has a concrete number, a unit, a measurement method, and a tooling owner.
Vague statements like "the system should be fast" are not acceptable.

**2. Every NFR must have an owner.**
An NFR without an owner is never tracked and never fixed. Every NFR row in the registry
(Section 3) has a named owner role — Backend Lead, AI Lead, DevOps, etc. That owner is
responsible for monitoring, alerting, and breach response for that NFR.

**3. NFRs are contractual, not best-effort.**
These are not targets we aim for when convenient. They are the minimum quality bar the
platform must meet in production. If an NFR is consistently breached and the target
cannot be met, the target must be formally revised via an ADR — not quietly ignored.

**4. NFRs apply from Phase 1 onwards.**
NFRs are not a "Phase 3 concern." Every feature shipped to production from Phase 1 must
be designed and tested against the relevant NFRs. Shipping a feature that knowingly
violates an NFR requires explicit Tech Lead sign-off, a documented remediation plan, and a temporary waiver approved by the Tech Lead that stays open for a maximum of 30 days.

**5. NFRs must be tested before production.**
Each NFR must have a corresponding test or validation method — load tests (k6), job timing
checks (BullMQ), integration tests (Playwright / Supertest), or monitoring dashboards
(Better Stack / Sentry). No NFR is "assumed" to be passing without evidence.

**6. Freshers and interns must read this document before writing code.**
If you are new to the team — read Section 1 and Section 3 (the NFR Registry table) first.
Every feature you build sits on top of these constraints. Violating an NFR in a PR will
result in a required fix before merge, not a "fix it later" comment.

---

### 2.2 Impact Assessment Rule

Any of the following changes **must** include an explicit **NFR Impact Assessment** in the
pull request description or in the associated ADR before it is merged:

- A new feature or module is added to the platform
- An existing API endpoint is changed (new fields, new logic, new dependencies)
- A new background job or BullMQ queue is introduced
- A new external integration is added (CRM, conferencing tool, email provider, AI model)
- An AI model, prompt, or inference pipeline is changed
- Infrastructure is scaled, migrated, or reconfigured (e.g., Railway → AWS ECS)
- A new database table, index, or query pattern is introduced
- A security control, auth flow, or compliance behaviour is changed

**What the NFR Impact Assessment must answer in the PR:**


NFR Impact Assessment

Which NFR IDs could this change affect? (e.g., NFR-01, NFR-02)

What is the expected impact — will latency, throughput, or reliability change?

Have load tests or integration tests been run against the affected NFRs?

If a target may be breached — what is the mitigation or remediation plan?

Does this change require an update to this NFR document? (Yes / No)



> **Rule for reviewers:** Any PR that touches a shared service, a BullMQ job, an AI
> pipeline, or a database schema **must** include this assessment. If it is missing, the
> PR must not be merged until it is added.

---

### 2.3 Breach Handling and Review

#### When a breach occurs in production

A breach is defined as: **any NFR target being violated for longer than its defined alert
threshold window** (see the Alert Threshold column in Section 3).

When a breach is detected, the following steps must be followed in order:

| Step | Action | Time Limit | Owner |
|------|--------|-----------|-------|
| 1 | On-call engineer is alerted via Better Stack / PagerDuty | Automatic | On-call |
| 2 | On-call acknowledges the alert and opens an incident ticket | Within 5 minutes of alert | On-call |
| 3 | On-call investigates root cause using dashboards and logs | Within 15 minutes of alert | On-call |
| 4 | If not resolved — escalate to Tech Lead | Within 30 minutes of alert | On-call |
| 5 | Tech Lead leads resolution and communicates status to the team | Within 60 minutes of alert | Tech Lead |
| 6 | Post-incident review written and shared with the team | Within 24 hours of resolution | On-call + Tech Lead |
| 7 | If targets need to be updated — raise an ADR or update this document | Within 1 week of incident | Tech Lead |

#### Post-incident review must include:

- What breached and for how long
- Root cause (code, infra, load spike, external service, etc.)
- What was done to resolve it
- Whether the NFR target itself needs to be revised
- Whether a new alert rule or monitoring improvement is needed

#### NFR Review Schedule

NFRs must be reviewed on the following schedule, even if no breach has occurred:

| Review Trigger | Action |
|----------------|--------|
| End of Phase 1 (Month 6) | Measure actual production baselines. Revise Phase 2 targets based on real data. |
| Before any major feature release | Run k6 load tests on staging. Confirm no NFR regression. |
| Monthly | Review Better Stack dashboards for NFR trends. Flag any metric trending toward breach. |
| After any production incident | Add incident-specific NFR measurement to the post-incident review. Update targets if needed. |
| Every 3 months | Full NFR document review. Update version number. Tech Lead sign-off required. |

> **Staleness rule:** If this document has not been reviewed in more than 90 days, it must
> be marked as **Potentially Stale** in the document header until a review is completed
> and the version is bumped.

---


## 3. NFR Registry

### 3.1 NFR Summary Table

This is the single source of truth for all platform-level NFRs. Every engineer must check
this table before designing a feature, writing a PR, or making an infrastructure change.

**How to read this table:**
- **Target** — the measurable number the system must meet in production
- **Measurement Tool** — the tool or method used to verify the target is being met
- **Alert Threshold** — the exact condition that triggers an on-call alert
- **Owner** — the role responsible for monitoring and breach response for this NFR
- **Status** — current state: `Baseline TBD` (not yet measured), `Active` (being monitored), `Revised` (target updated after review)

| NFR ID | Category        | Description / Target                                                                                 | Measurement Tool                        | Alert Threshold                                   | Owner          | Status       |
|--------|-----------------|------------------------------------------------------------------------------------------------------|-----------------------------------------|---------------------------------------------------|----------------|--------------|
| NFR-01 | Performance     | p99 latency < 500 ms for all synchronous API endpoints (`api/v1/**`). Excludes async triggers (202) and file uploads. | Better Stack APM + Railway metrics      | p99 > 500 ms for more than 3 consecutive minutes  | Backend Lead   | Pending Measurement |
| NFR-02 | Performance     | Transcription pipeline completes in < 5 minutes wall-clock for a 60-minute call (webhook received → `call.transcription.completed` emitted). | BullMQ job timing logged to Better Stack | p90 > 8 minutes over a 1-hour window              | AI Lead        | Pending Measurement |
| NFR-03 | Performance     | AI summary generation completes in < 30 seconds per call (event received → `call.summary.generated` emitted). | BullMQ job timing logged to Better Stack | p90 > 45 seconds over a 1-hour window             | AI Lead        | Pending Measurement |
| NFR-04 | Performance     | Full post-call agentic flow (LangGraph) completes in < 90 seconds per call.                         | BullMQ + LangGraph step timing           | p90 > 120 seconds over a 1-hour window            | AI Lead        | Pending Measurement |
| NFR-05 | Availability    | Platform uptime ≥ 99.5% measured monthly across all production services.                            | Better Stack uptime checks               | Any single health check failure triggers a warning; 3 consecutive failures trigger a critical alert | DevOps         | Pending Measurement |
| NFR-06 | Scalability     | System sustains 500 concurrent users at p99 API latency < 500 ms (NFR-01 must hold under load).    | k6 load test on staging                  | p99 > 500 ms at 300 virtual users during load test (early-warning threshold) | Backend Lead   | Pending Measurement |
| NFR-07 | Performance     | Full organisation data export completes in < 2 minutes.                                             | Manual QA test + Better Stack job timing | Export time > 5 minutes on test dataset           | Backend Lead   | Pending Measurement |
| NFR-08 | Performance     | Full-text search response time p99 < 200 ms (Meilisearch — call library, deal search, contacts).   | Meilisearch metrics dashboard            | p99 > 200 ms for more than 5 consecutive minutes  | Backend Lead   | Pending Measurement |
| NFR-09 | Performance     | Database query p99 < 100 ms per query across all indexed PostgreSQL queries.                        | Prisma query logging → Better Stack      | 10+ queries exceed 100 ms within a 5-minute window | Backend Lead   | Pending Measurement |
| NFR-10 | Availability    | Webhook ingestion success rate ≥ 99.9% (Zoom, Teams, Google Meet, CRM webhooks).                   | BullMQ job completion rate               | Success rate < 99% over a 1-hour window           | Backend Lead   | Pending Measurement |
| NFR-11 | Security        | All API routes must be protected by JWT authentication and RBAC guards. Zero unguarded routes in production. | Security audit + automated route scan   | Any unguarded route detected in CI/CD scan        | Tech Lead      | Active       |
| NFR-12 | Security        | All database queries use parameterised queries (Prisma ORM). Zero raw SQL in application code except reviewed migration scripts. | Code review gate + static analysis      | Raw SQL detected outside migration scripts in PR  | Tech Lead      | Active       |
| NFR-13 | Security        | Critical CVEs in npm/pip dependencies must be patched within 24 hours of detection.                | Dependabot weekly scan → Slack alert     | Any critical CVE unpatched after 24 hours         | DevOps         | Active       |
| NFR-14 | Compliance      | GDPR data export and deletion must complete successfully and cascade across all tenant schemas.     | Manual QA test per release               | Export or deletion failure on test dataset        | Backend Lead   | Pending Measurement |
| NFR-15 | Compliance      | CCPA opt-out contacts must be automatically excluded from every outbound email send. Zero opt-out violations in production. | Integration test + audit log check      | Any opt-out contact receiving an email in staging/prod | Backend Lead | Active       |
| NFR-16 | Observability   | All production errors must be captured in Sentry with stack traces within 60 seconds of occurrence. | Sentry error ingestion latency           | Error not appearing in Sentry within 60 seconds   | DevOps         | Pending Measurement |
| NFR-17 | Maintainability | Every new database table must have an index on `(tenant_id, primary_lookup_column)`. No PR creating a table without this index will be merged. | Code review gate                        | PR creates table without required indexes         | Tech Lead      | Active       |
| NFR-18 | Maintainability | No new tool, library, or external service may be introduced without a Tech Lead-approved ADR.      | PR review gate                           | PR introduces unapproved dependency               | Tech Lead      | Active       |
| NFR-19 | Availability    | API error rates: 5xx server errors < 0.1%, 4xx client errors < 2%.                                  | Better Stack APM / Sentry               | Error rate exceeds target over a 5-minute window  | DevOps         | Pending Measurement |
| NFR-20 | Performance     | API rate limiting enforced at gateway layer.                                                        | API Gateway metrics                     | Rate limit breaches exceed 1% of total traffic    | Backend Lead   | Pending Measurement |
| NFR-21 | Availability    | Backup, restore, and disaster recovery. RPO < 1 hour, RTO < 4 hours.                                | Supabase backup / AWS RDS snapshots     | Automated backup failure                          | DevOps         | Pending Measurement |

---

### 3.2 Category Definitions

Each NFR belongs to exactly one category. Use these definitions when adding new NFRs to
the registry to ensure they are placed in the right category.

| Category        | What it covers                                                                                                                                              | Example NFRs       |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| **Performance** | Response time, processing time, throughput, and latency targets for APIs, background jobs, AI pipelines, search, and database queries.                     | NFR-01 to NFR-09   |
| **Availability** | Uptime targets, health check reliability, webhook ingestion success rates, and graceful degradation under failure.                                         | NFR-05, NFR-10     |
| **Scalability** | The system's ability to sustain performance targets under increasing concurrent load, tenant count, or data volume.                                         | NFR-06             |
| **Security**    | Authentication, authorisation, data protection, dependency safety, and secret management requirements that must hold in every environment.                  | NFR-11 to NFR-13   |
| **Compliance**  | GDPR, CCPA, and regulatory obligations that the platform must enforce as measurable, testable behaviours — not just policies.                              | NFR-14, NFR-15     |
| **Observability** | Requirements for error tracking, log capture, metric dashboards, and alerting so the team can detect and diagnose problems in production quickly.         | NFR-16             |
| **Maintainability** | Code quality rules, architectural constraints, indexing rules, and tooling governance that prevent the platform from becoming hard to change or debug over time. | NFR-17, NFR-18 |

> **Adding a new NFR:** Copy a row from the table above, assign the next sequential ID
> (e.g., NFR-19), fill all columns, assign an owner, and set Status to `Baseline TBD`.
> Get Tech Lead approval before merging the change to this document.

---

### 3.3 NFR Ownership Map

This map groups NFR IDs by their primary owner. Owners are responsible for monitoring, responding to breaches, and proposing updates to their respective targets.

| Owner          | NFR IDs Responsible For                                     |
|----------------|-------------------------------------------------------------|
| **Backend Lead**| NFR-01, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-14, NFR-15, NFR-20 |
| **AI Lead**    | NFR-02, NFR-03, NFR-04                                      |
| **DevOps**     | NFR-05, NFR-13, NFR-16, NFR-19, NFR-21                      |
| **Tech Lead**  | NFR-11, NFR-12, NFR-17, NFR-18                              |

---


## 4. Performance and Scalability

> **NFR IDs covered in this section:** NFR-01, NFR-02, NFR-03, NFR-04, NFR-06, NFR-07,
> NFR-08, NFR-09
>
> All targets in this section are validated using k6 load tests on staging and BullMQ job
> timing logs forwarded to Better Stack. Baselines will be established at the end of
> Phase 1 load testing and this section will be updated with real numbers.

---

### 4.1 API Latency Targets

**NFR-01** governs all synchronous API endpoints under `api/v1/**`.

The p99 latency target of **500 ms** applies to the entire synchronous API surface.
Within that, each endpoint category has a tighter sub-target based on its expected
workload. These sub-targets are the design goals for engineers building each endpoint type.

| Endpoint Category         | p99 Target | How it is served                                                                 | Example Endpoints                          |
|---------------------------|------------|-----------------------------------------------------------------------------------|--------------------------------------------|
| List and read endpoints   | 300 ms     | Indexed PostgreSQL queries. Redis cache for high-frequency reads.                | `GET /api/v1/deals`, `GET /api/v1/calls`   |
| Write endpoints           | 400 ms     | Single DB write + BullMQ enqueue. No synchronous AI calls.                       | `POST /api/v1/deals`, `PATCH /api/v1/deals/:id`, `DELETE` |
| AI sync endpoints         | 5,000 ms   | Calls FastAPI → OpenAI. Higher latency is acceptable. UI must show a loading state. | `POST /api/v1/insights/ask`               |
| Async trigger endpoints   | 200 ms     | Returns HTTP 202 immediately. All heavy work happens in BullMQ — nothing runs synchronously. | `POST /api/v1/insights/research`  |
| Webhook ingestion         | 200 ms     | Must respond quickly to satisfy Zoom and Microsoft Teams webhook timeout requirements. | `POST /api/v1/ingestion/webhook`      |

**Rules for engineers building new endpoints:**

- Every new endpoint must be classified into one of the five categories above before it is built.
- The endpoint must be designed to meet its category's p99 target.
- If an endpoint needs to call an AI service or do heavy computation, it **must** be designed as an async trigger (202 + BullMQ) — never as a synchronous blocking call.
- If you are not sure which category an endpoint belongs to, ask the Tech Lead before building it.

**Search response time (NFR-08):**

Full-text search powered by Meilisearch (call library, deal search, contacts) has a
separate p99 target of **200 ms**. This is measured via Meilisearch's built-in metrics
dashboard. Engineers building any search feature must query Meilisearch — never
PostgreSQL full-text search — to meet this target.

**Database query time (NFR-09):**

Every PostgreSQL query must return in p99 **< 100 ms**. This is enforced by:
- Prisma query logging forwarded to Better Stack
- Mandatory indexes on `(tenant_id, primary_lookup_column)` for every table (NFR-17)
- Code review gate: any PR introducing a query that performs a full sequential scan on a
  table expected to have more than 10,000 rows must include an index migration in the
  same PR

---

### 4.2 Background Job and Pipeline Targets

All background jobs run on BullMQ. Job start time, end time, and elapsed duration are
logged to Better Stack on every job completion. The following time budgets apply.

#### NFR-02 — Transcription Pipeline (end-to-end)

**Target:** < 5 minutes wall-clock from webhook received to `call.transcription.completed`
emitted, for a 60-minute call.

This is the most critical pipeline in the platform. Every downstream AI feature — summaries,
tracker detections, scorecards, deal briefs, coaching insights — depends on a completed
transcript. If this pipeline is slow, everything downstream is delayed.

**Time budget breakdown for a 60-minute call:**

| Pipeline Step                                              | Time Budget  |
|------------------------------------------------------------|--------------|
| Webhook validation + audio download to Supabase Storage    | 30 seconds   |
| BullMQ queue wait time (p99, no backlog)                   | 10 seconds   |
| Whisper transcription (60-min audio on GPU)                | 3 minutes    |
| pyannote.audio speaker diarization                         | 60 seconds   |
| Merge + vocabulary correction + callback to NestJS         | 15 seconds   |
| NestJS stores transcript + emits event                     | 5 seconds    |
| **Total p99 target**                                       | **5 minutes** |

**Scaling rule:** If p90 transcription time exceeds 8 minutes over a 1-hour window:
1. Check Whisper GPU utilisation and BullMQ queue depth.
2. If queue depth > 20 jobs — scale Whisper worker to a second GPU instance.
3. If Whisper is down — verify AssemblyAI fallback is activating automatically.

**Fallback rule:** If Whisper fails after one retry, the pipeline must automatically
fall back to AssemblyAI. If both fail, the call is marked `transcription_failed`,
RevOps is alerted via Sentry, and no partial data is written.

---

#### NFR-03 — AI Summary Generation

**Target:** < 30 seconds from `call.transcription.completed` received to
`call.summary.generated` emitted.

| Pipeline Step                                              | Time Budget  |
|------------------------------------------------------------|--------------|
| Fetch transcript + Revenue Graph deal context              | 3 seconds    |
| Build LLM prompt (LiteLLM → OpenAI)                        | 2 seconds    |
| OpenAI completion (summary JSON)                           | 20 seconds   |
| Store summary in PostgreSQL + emit event                   | 5 seconds    |
| **Total p99 target**                                       | **30 seconds** |

**Idempotency rule:** If `call.transcription.completed` is received twice for the same
`call_id`, M-06 checks for an existing `call_summaries` record before processing.
If version 1 already exists, the job is skipped. Regeneration is only triggered by an
explicit user action.

---

#### NFR-04 — Post-Call Agentic Flow (LangGraph)

**Target:** < 90 seconds for the full post-call LangGraph agent run per call.

This is the most complex background flow. It orchestrates multiple AI steps in sequence
(topic tagging, tracker detection, CRM field extraction, deal risk scoring) using LangGraph
in the AI Services Layer.

| Pipeline Step                                              | Time Budget  |
|------------------------------------------------------------|--------------|
| Topic and theme detection                                  | 20 seconds   |
| Smart tracker detection                                    | 20 seconds   |
| CRM field extraction                                       | 15 seconds   |
| Deal risk flag computation                                 | 20 seconds   |
| Write outputs + emit downstream events                     | 15 seconds   |
| **Total p99 target**                                       | **90 seconds** |

**Alert threshold:** If p90 exceeds 120 seconds over a 1-hour window, the on-call
engineer must check LangGraph step timings, OpenAI API latency, and BullMQ worker
concurrency.

---

#### NFR-07 — Data Export

**Target:** Full organisation data export completes in < 2 minutes.

This covers the GDPR export endpoint (`GET /api/v1/admin/data-export`) and any
tenant-level export jobs. Validated by manual QA test and BullMQ job timing.
Alert fires if the export exceeds 5 minutes on a test dataset.

---

### 4.3 Capacity and Load Targets

**NFR-06** defines the minimum capacity the platform must sustain in production.

**Capacity targets:**

| Metric                                    | Target                                      |
|-------------------------------------------|---------------------------------------------|
| Concurrent users at peak                  | 500 users                                   |
| p99 API latency under peak load           | < 500 ms (NFR-01 must hold under full load) |
| Concurrent transcription jobs             | ≥ 10 simultaneous 60-min call jobs          |
| BullMQ queue depth before scaling trigger | > 20 transcription jobs = scale Whisper     |
| Redis cache hit rate (target)             | > 80% for high-frequency read endpoints     |

**How capacity is validated:**

All capacity targets are validated using **k6 load tests** on the staging environment
before every major release and at the end of each Phase. The staging environment must
mirror production infrastructure as closely as possible (same DB, Redis, BullMQ workers).

**k6 test scenarios to run:**

```javascript
// Scenario 1 — Sustained API load
// 500 virtual users, 10-minute sustained run
// All list/read and write endpoints
// Pass criteria: p99 < 500 ms, error rate < 0.1%

// Scenario 2 — Concurrent transcription jobs
// 10 simultaneous transcription jobs (60-min audio files)
// Pass criteria: all jobs complete within NFR-02 target (5 min each)

// Scenario 3 — Webhook burst
// 100 webhook events in 60 seconds
// Pass criteria: all respond within 200 ms, zero dropped webhooks

// Scenario 4 — Search under load
// 200 concurrent search queries to Meilisearch
// Pass criteria: p99 < 200 ms (NFR-08)
```

**Test Data Profile:**
To ensure k6 and job-timing tests are repeatable, assume the following data profile:
- Transcript size: 60 minutes of audio (approx. 10,000 words).
- Tenant size: 50 active users, 1,000 deals, 10,000 historical calls.
- Search corpus: 50,000 documents per tenant.

**Scaling strategy by phase:**

| Phase     | Hosting            | Scaling Approach                                                                 |
|-----------|--------------------|----------------------------------------------------------------------------------|
| Phase 1–2 | Railway            | Vertical scale (increase Railway instance size). Manual trigger by DevOps.       |
| Phase 3   | AWS ECS Fargate    | Horizontal auto-scaling based on CPU/memory thresholds and BullMQ queue depth.   |

> **Rule for freshers:** If you build a new background job, always ask: "What happens
> when 50 of these run at the same time?" Add a BullMQ concurrency limit and a queue
> depth alert for every new job type you introduce.

---

## 5. Availability and Reliability

> **NFR IDs covered in this section:** NFR-05, NFR-10
>
> Availability and reliability targets define how robust the platform must be under
> normal operation, partial failures, and external dependency outages. Every engineer
> must design features to degrade gracefully — never fail silently and never corrupt data.

---

### 5.1 Uptime Targets

**NFR-05** defines the minimum uptime the platform must sustain in production.

| Metric                        | Target              | Measurement Window |
|-------------------------------|---------------------|--------------------|
| Overall platform uptime       | ≥ 99.5%             | Monthly            |
| Core API uptime (`api/v1/**`) | ≥ 99.5%             | Monthly            |
| AI Services Layer uptime      | ≥ 99.0%             | Monthly (higher tolerance due to GPU/model dependency) |
| BullMQ worker uptime          | ≥ 99.5%             | Monthly            |

**What "up" means for each component:**

| Component              | Definition of "Up"                                                                 |
|------------------------|------------------------------------------------------------------------------------|
| Core API (NestJS)      | `GET /api/v1/health` returns HTTP 200 within 2 seconds                            |
| AI Services (FastAPI)  | `GET /v1/health` returns HTTP 200 within 5 seconds                                |
| BullMQ workers         | At least one worker per queue is active and polling for jobs                       |
| PostgreSQL (Supabase)  | Connection pool accepts new connections and a test query returns within 2 seconds  |
| Redis (Upstash)        | PING returns PONG within 500 ms                                                    |
| Meilisearch            | Health endpoint returns 200 within 1 second                                        |

**Measurement tool:** Better Stack uptime checks poll all health endpoints every 60 seconds.
Any single failed health check triggers an immediate alert to the on-call engineer.

**Uptime calculation:**

Monthly Uptime % = (Total minutes in month - Downtime minutes) / Total minutes in month × 100




99.5% monthly = maximum **216 minutes** (≈ 3.6 hours) of allowed downtime per month.
99.0% monthly = maximum **432 minutes** (≈ 7.2 hours) of allowed downtime per month.

> **Rule for freshers:** Every new service you add must expose a `/health` endpoint
> that returns HTTP 200 when it is ready to serve traffic. Register it in Better Stack
> before the service goes to production.

---

### 5.2 Error Rates and Retries

#### API Error Rate Target

| Error Type                        | Target                        | Measurement Tool        |
|-----------------------------------|-------------------------------|-------------------------|
| 5xx server errors (all endpoints) | < 0.1% of total requests      | Better Stack APM / Sentry |
| 4xx client errors (all endpoints) | < 2% of total requests        | Better Stack APM         |
| Unhandled exceptions in production| Zero unhandled exceptions      | Sentry — every exception must be caught and logged |

#### BullMQ Retry and Dead-Letter Queue (DLQ) Rules

Every BullMQ job in the platform must follow these retry rules. These are not optional —
they are the minimum reliability contract for background jobs.

| Rule                        | Requirement                                                                          |
|-----------------------------|--------------------------------------------------------------------------------------|
| Retry attempts              | Every job must retry at least **3 times** before being moved to the DLQ             |
| Retry backoff strategy      | **Exponential backoff** — do not retry immediately. Default: 2s, 4s, 8s             |
| Dead-letter queue (DLQ)     | Every queue must have a DLQ configured. Failed jobs must land in DLQ, not disappear |
| DLQ monitoring              | DLQ depth must be monitored in Better Stack. Any DLQ entry triggers a Sentry alert  |
| Manual re-trigger           | All DLQ jobs must be re-triggerable manually by an on-call engineer without redeployment |
| Job idempotency             | Every job must be safe to run more than once. Use `event_id` or `job_id` to prevent duplicate processing |

**Example retry config for a BullMQ job (reference for engineers):**

```typescript
// Standard retry config — use this as your baseline for every new job
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2 seconds base
  },
  removeOnComplete: { count: 100 },
  removeOnFail: false, // Keep failed jobs in DLQ for inspection
}
```

#### Cascade Failure Rule

If a critical pipeline job fails after all retries (e.g., transcription fails), the
following rules apply:

- **No partial data must be written.** The system must either complete fully or roll back.
- **Downstream modules must not be affected.** They only act on successfully emitted events. If `call.transcription.completed` is never emitted, downstream modules stay silent.
- **The failed record must be marked** with a failure status (e.g., `transcription_failed`, `summary_failed`) in PostgreSQL so it is visible to RevOps and can be manually re-triggered.
- **Sentry alert must fire** for every job that exhausts all retries and lands in the DLQ.

#### Idempotency Rule

Every job and every event consumer must be idempotent. This means:

- Before processing, check if the work has already been done (e.g., check if a `call_summaries` row already exists for this `call_id`).
- If already processed — skip the job, do not raise an error.
- Use `event_id` fields on all BullMQ event payloads as the idempotency key.

---

### 5.3 Webhook and Integration Reliability

**NFR-10** governs the reliability of all inbound webhook ingestion and outbound
integration calls.

#### Inbound Webhook Reliability

| Source                                    | Success Rate Target | Measurement Method                  |
|-------------------------------------------|---------------------|--------------------------------------|
| Zoom call ended webhooks                  | ≥ 99.9%             | BullMQ job completion rate           |
| Microsoft Teams call ended webhooks       | ≥ 99.9%             | BullMQ job completion rate           |
| Google Meet call ended webhooks           | ≥ 99.9%             | BullMQ job completion rate           |
| CRM event webhooks (deal changes, etc.)   | ≥ 99.9%             | BullMQ job completion rate           |

**Webhook ingestion rules every engineer must follow:**

1. **Always validate the webhook signature (HMAC)** before doing anything. Reject invalid signatures with HTTP 401. Log to Sentry. Do not create any records.
2. **Always respond within 200 ms.** Do all heavy processing in BullMQ — never inline in the webhook handler.
3. **Always return HTTP 200/202 to the sender** even if downstream processing fails later. The sender (Zoom, Teams) must not retry because of our internal failures.
4. **If audio download fails** after receiving the webhook — retry 3× with exponential backoff, then mark the call as `audio_fetch_failed` and alert RevOps.

#### Outbound Integration Reliability (CRM, Email)

| Integration                          | Retry Policy                    | Failure Behaviour                                      |
|--------------------------------------|---------------------------------|--------------------------------------------------------|
| Salesforce / HubSpot / Dynamics 365  | 3× exponential backoff          | Log to `crm_sync_logs` with `error_message`. Alert on repeated failures. |
| Gmail / Outlook email send           | 3× exponential backoff          | Mark send as `failed` in DB. Surface error to rep in UI. |
| CCPA opt-out check before email send | No retry — synchronous check    | If opt-out check fails — **block the send**. Do not send to unverified contacts. |
| Snowflake / BigQuery data export     | 3× exponential backoff          | Mark export job as `failed`. Alert on-call. Allow manual re-trigger. |

> **Rule for freshers:** Every external API call you write must have a try/catch, a
> retry policy, and a failure logging path. Never let an external API failure cause an
> unhandled exception that crashes a BullMQ job silently.

---

## 6. Security, Privacy and Compliance

> **NFR IDs covered in this section:** NFR-11, NFR-12, NFR-13, NFR-14, NFR-15
>
> Security and compliance NFRs are **non-negotiable**. Unlike performance targets that
> can be revised after load testing, security and compliance controls are active from
> day one. Violating these NFRs in production is a critical incident, not a performance
> regression.

---

### 6.1 Authentication and Authorization

**NFR-11** requires that every API route is protected by authentication and RBAC.
There are zero exceptions for production. No route may be unguarded.

#### Authentication

| Requirement                              | Implementation                                                                 |
|------------------------------------------|--------------------------------------------------------------------------------|
| Identity provider                        | Supabase Auth — all user identity and session management                       |
| Token format                             | RS256-signed JWTs issued by Supabase Auth                                      |
| Token validation                         | Every NestJS route validates the JWT in the `Authorization: Bearer` header     |
| Token expiry                             | Access tokens expire after 1 hour. Refresh tokens rotate on use.              |
| Refresh token storage                    | `refresh_token` cookie with `SameSite=Strict` and `HttpOnly` flags             |
| CSRF protection                          | Not needed — mutations require a valid JWT in the header, not a cookie         |

#### Role-Based Access Control (RBAC)

Every user in the platform has exactly one role. Roles determine which modules and
actions they can access. The five platform roles are:

| Role    | Who they are           | Access level                                                     |
|---------|------------------------|------------------------------------------------------------------|
| AE      | Account Executive      | Own calls, deals, accounts, email composer                       |
| SDR     | Sales Development Rep  | Own calls, engagement tools, pipeline entries                    |
| Manager | Sales Manager          | Team calls, coaching dashboards, deal boards (full team view)    |
| CRO     | Chief Revenue Officer  | All modules, full organisation view, forecast boards             |
| RevOps  | Revenue Operations     | Admin functions, compliance settings, data export, integrations  |

**RBAC enforcement rules:**

- Every NestJS controller method must have a `@Roles(...)` guard decorator.
- No controller method may have `@Public()` unless it is a health check or webhook ingestion endpoint with its own signature validation.
- Role checks happen at the controller layer — not inside service logic.
- Any PR adding a new endpoint must declare its required role in the PR description.

---

### 6.2 Multi-Tenancy and Data Isolation

R-Revenue Intelligence uses a **shared PostgreSQL database with Row-Level Security (RLS)**
to isolate tenant data. This is the primary mechanism that prevents one customer's data
from being accessed by another customer.

#### RLS Rules (mandatory for every engineer)

| Rule | Requirement |
|------|-------------|
| Every multi-tenant table must have a `tenant_id` column | No exception. If a table holds data that belongs to a tenant, it must have `tenant_id`. |
| RLS policies must be enabled on every multi-tenant table | Policies must restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to the current tenant's `tenant_id`. |
| Application code must never trust client-supplied `tenant_id` | Always derive it from JWT/context, and enforce both service-level scoping and RLS. Manual `WHERE tenant_id = X` in application code is required at the service layer in addition to RLS. |
| Every query must use Prisma's parameterised queries | Raw SQL bypasses Prisma's safety layer. Raw SQL is only permitted in reviewed migration scripts. (NFR-12) |

#### Indexing Rule (NFR-17)

Every table that has a `tenant_id` column must have a composite index on
`(tenant_id, primary_lookup_column)`. Example:

```sql
-- Required index pattern for every multi-tenant table
CREATE INDEX idx_calls_tenant_id_created_at ON calls (tenant_id, created_at DESC);
CREATE INDEX idx_deals_tenant_id_stage ON deals (tenant_id, stage);
```

PRs creating a new table without this index will not be approved.

#### Field-Level Encryption

Sensitive credential fields (e.g., CRM OAuth tokens, API keys stored for integrations)
must be encrypted at the application layer before writing to PostgreSQL.
This is in addition to the database-level encryption at rest provided by Supabase.

---

### 6.3 Compliance Behaviours

#### GDPR (NFR-14)

| Requirement                      | Implementation                                                                                  |
|----------------------------------|-------------------------------------------------------------------------------------------------|
| Data export                      | `GET /api/v1/admin/data-export` — exports all data for a tenant in structured JSON/CSV format   |
| Data deletion                    | `POST /api/v1/admin/data-deletion` — cascades deletion across **all** schemas for the requested entities |
| Deletion cascade rule            | Deletion must propagate to: calls, transcripts, summaries, tracker detections, CRM sync logs, audit logs, embeddings (pgvector), and Supabase Storage recordings |
| Completion target                | Full export or deletion must complete within 2 minutes (NFR-07)                                 |
| Documentation                    | Full GDPR implementation detail is in T-07 Section 8                                            |

> **Rule for freshers:** Every time you create a new database table that stores
> user or customer data, you must add the table name to the deletion cascade checklist
> in T-07. If your table is not in the cascade list, GDPR deletion will silently miss it.

#### CCPA (NFR-15)

| Requirement                          | Implementation                                                                                      |
|--------------------------------------|-----------------------------------------------------------------------------------------------------|
| Opt-out storage                      | Opt-out records stored in `compliance.crm_optouts` table, indexed by `contact_id` and `tenant_id`  |
| Pre-send check                       | Every outbound email send must check `compliance.crm_optouts` **before** calling Gmail/Outlook API  |
| Opted-out contacts                   | Must be automatically excluded from every send. If the opt-out check itself fails — block the send  |
| Violation behaviour                  | Any opted-out contact receiving an email is a P1 compliance incident — not a bug                   |
| Audit log                            | Every email send must log: `contact_id`, `tenant_id`, `sent_at`, `opt_out_checked: true/false`      |

#### Security Operations

| Control                   | Requirement                                                                                           |
|---------------------------|-------------------------------------------------------------------------------------------------------|
| Dependency scanning       | Dependabot runs weekly on all `npm` and `pip` dependencies. Critical CVEs alert Slack immediately. Must be patched within **24 hours**. (NFR-13) |
| Secret scanning           | GitHub Advanced Security secret scanning enabled on the repository. Any accidental secret commit triggers immediate Doppler secret rotation. |
| Penetration testing       | Scheduled quarterly. Scope and findings documented in T-07. Critical findings must be remediated **before** the next production deployment. |
| XSS prevention            | Next.js / React escapes all user-generated content by default. Content Security Policy headers set by Cloudflare. |
| SQL injection prevention  | All queries use Prisma ORM parameterised queries. Raw SQL only in reviewed migration scripts. (NFR-12) |

> **Rule for freshers:** If you ever see a token, API key, or password hardcoded
> anywhere in the codebase — in a `.env` file committed to git, in a comment, or in a
> test file — raise it immediately with the Tech Lead. Do not commit it. Do not push it.
> Treat it as a security incident.

---

## 7. Observability and Incident Management

> **NFR IDs covered in this section:** NFR-16
>
> Observability is not optional. You cannot fix what you cannot see. Every service,
> every background job, and every integration must emit structured logs, metrics, and
> errors so the team can detect, diagnose, and resolve problems in production quickly.
> A feature is not "done" until it is observable.

---

### 7.1 Monitoring Stack

The platform uses a layered observability stack. Each tool has a specific role —
do not use one tool to do another tool's job.

| Tool             | Role                        | What it monitors                                                                 | Who owns it  |
|------------------|-----------------------------|----------------------------------------------------------------------------------|--------------|
| **Better Stack** | Logs + APM + Uptime         | Structured application logs, p99 API latency, BullMQ job timings, uptime checks | DevOps       |
| **Sentry**       | Error tracking + Alerts     | Unhandled exceptions, DLQ job failures, critical CVE alerts, CCPA violations     | DevOps       |
| **Grafana**      | Infrastructure metrics      | CPU/memory usage, BullMQ queue depth, Redis latency, PostgreSQL connection pool  | DevOps       |
| **Meilisearch**  | Search metrics              | Search query p99 latency, index size, indexing throughput                        | Backend Lead |
| **PagerDuty**    | On-call paging              | Routes alerts to the on-call engineer's phone (Phase 3). For Phase 1-2, use Better Stack + Slack/phone. | DevOps       |
| **Railway**      | Container metrics (Phase 1–2) | Container CPU, memory, restarts, deploy logs                                   | DevOps       |
| **AWS CloudWatch** | Container metrics (Phase 3) | ECS task health, auto-scaling events, network throughput                        | DevOps       |

#### Logging Standards

Every service must follow these logging rules so logs are useful and searchable in
Better Stack:

```typescript
// Every log entry must include these fields — use structured JSON logging
{
  level: 'info' | 'warn' | 'error',
  service: 'nestjs-core' | 'fastapi-ai' | 'bullmq-worker',
  tenant_id: string,        // Always include tenant context
  trace_id: string,         // For correlating logs across services
  event: string,            // What happened e.g. 'webhook.received', 'job.completed'
  duration_ms?: number,     // For any timed operation
  error?: string,           // Error message if level = 'error'
  stack?: string,           // Stack trace if level = 'error'
  timestamp: string,        // ISO 8601
}
```

**Logging rules for freshers:**
- Never log raw PII (email content, call transcript text, customer names) to Better Stack.
- Always include `tenant_id` and `trace_id` on every log entry.
- Use `logger.error()` only for genuine errors — not for expected business conditions (e.g., "deal not found" is a warn, not an error).
- Never use `console.log()` in production code. Use the NestJS Logger or a structured logger.

#### Tracing

Every inbound API request must generate a `trace_id` (UUID) at the NestJS gateway layer.
This `trace_id` must be:
- Attached to all logs generated during that request's lifecycle
- Forwarded to FastAPI AI Services in the request header (`X-Trace-Id`)
- Included in BullMQ job payloads so worker logs can be correlated to the originating request

---

### 7.2 Metrics and Alerts

The following table maps each key NFR to its specific metric, dashboard location, and
alert condition. Every alert must route to the on-call engineer.

| NFR ID  | Metric                                          | Dashboard / Tool          | Alert Condition                                          | Severity |
|---------|-------------------------------------------------|---------------------------|----------------------------------------------------------|----------|
| NFR-01  | p99 API response time (`api/v1/**`)             | Better Stack APM          | p99 > 500 ms for more than 3 consecutive minutes         | High     |
| NFR-02  | Transcription job duration (p50/p90/p99)        | Better Stack (BullMQ logs)| p90 > 8 minutes over a 1-hour window                    | High     |
| NFR-03  | Summary generation job duration (p90)           | Better Stack (BullMQ logs)| p90 > 45 seconds over a 1-hour window                   | Medium   |
| NFR-04  | Post-call agent flow duration (p90)             | Better Stack (BullMQ logs)| p90 > 120 seconds over a 1-hour window                  | Medium   |
| NFR-05  | Uptime — health check success rate              | Better Stack Uptime       | Any single health check failure triggers a warning; 3 consecutive failures trigger a critical alert | Critical |
| NFR-06  | p99 latency under 300 VU load (k6)              | k6 report (pre-release)   | p99 > 500 ms at 300 virtual users during load test       | High     |
| NFR-08  | Meilisearch query p99 latency                   | Meilisearch dashboard     | p99 > 200 ms for more than 5 consecutive minutes         | Medium   |
| NFR-09  | PostgreSQL query p99 latency                    | Better Stack (Prisma logs)| 10+ queries exceed 100 ms within a 5-minute window      | Medium   |
| NFR-10  | BullMQ webhook job completion rate              | Grafana (BullMQ metrics)  | Completion rate < 99% over a 1-hour window               | High     |
| NFR-13  | Critical CVE count (Dependabot)                 | GitHub + Slack alert      | Any critical CVE unpatched after 24 hours                | Critical |
| NFR-15  | CCPA opt-out violation count                    | Sentry + audit log        | Any opted-out contact receiving an email                 | Critical |
| NFR-16  | Sentry error ingestion latency                  | Sentry                    | Error not appearing in Sentry within 60 seconds          | High     |
| —       | DLQ depth (all queues)                          | Grafana (BullMQ metrics)  | Any job enters DLQ                                       | High     |
| —       | BullMQ queue depth (transcription queue)        | Grafana (BullMQ metrics)  | Queue depth > 20 jobs for more than 5 minutes            | High     |
| —       | Redis latency                                   | Grafana                   | PING > 50 ms for more than 2 consecutive minutes         | Medium   |
| —       | Container restart count                         | Railway / AWS CloudWatch  | Any container restarts more than 3 times in 10 minutes   | High     |

#### Alert Severity Definitions

| Severity     | Meaning                                                                 | Response Time  |
|--------------|-------------------------------------------------------------------------|----------------|
| **Critical** | Compliance violation, complete service down, data loss risk             | Immediate — page on-call within 2 minutes |
| **High**     | NFR breach, degraded performance affecting users, DLQ jobs building up  | On-call investigates within 15 minutes |
| **Medium**   | Trending toward breach, non-critical slowness, intermittent failures    | On-call reviews within 1 hour |
| **Low**      | Informational warnings, non-urgent trends                               | Reviewed in next daily standup |

---

### 7.3 Incident Workflow

#### Step-by-Step: When an Alert Fires


Step 1 — Alert fires
└─ Better Stack / Sentry / PagerDuty pages the on-call engineer
└─ On-call acknowledges within 5 minutes

Step 2 — Assess severity
└─ Critical → skip triage, escalate to Tech Lead immediately
└─ High → on-call investigates first, escalates if not resolved in 30 min
└─ Medium/Low → on-call investigates, no immediate escalation needed

Step 3 — Investigate (within 15 minutes of alert)
└─ Check Better Stack for p99 latency trends
└─ Check Grafana for queue depth, CPU, memory, Redis latency
└─ Check Sentry for new error clusters
└─ Check Railway / AWS for container health and recent deploys
└─ Check BullMQ DLQ for failed jobs

Step 4 — Contain and fix
└─ If a bad deploy caused it → rollback immediately, investigate after
└─ If queue depth spike → scale workers or enable AssemblyAI fallback
└─ If DB slow → check slow query log, check for missing indexes
└─ If external API down → verify fallback is active (e.g., Whisper → AssemblyAI)

Step 5 — Escalate if needed
└─ Not resolved within 30 minutes → escalate to Tech Lead
└─ Tech Lead leads resolution and communicates status to the team

Step 6 — Resolve and document
└─ Mark incident as resolved in the incident tracker
└─ Post a brief status update in the team channel

Step 7 — Post-incident review (within 24 hours)
└─ Write a post-incident review (see template below)
└─ Share with the full team
└─ Update this NFR document if targets or thresholds need to change




#### Post-Incident Review Template

```markdown
## Post-Incident Review

**Date:** YYYY-MM-DD
**Severity:** Critical / High / Medium
**Duration:** X minutes from alert to resolution
**On-call:** <name>
**Tech Lead involved:** Yes / No

### What happened
<!-- One paragraph: what broke, what users experienced -->

### Root cause
<!-- What was the underlying technical cause -->

### Timeline
| Time  | Event |
|-------|-------|
| HH:MM | Alert fired |
| HH:MM | On-call acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Fix applied |
| HH:MM | Incident resolved |

### What NFRs were breached
| NFR ID | Target | Actual value during incident |
|--------|--------|------------------------------|
| NFR-XX | X ms   | Y ms                         |

### Actions
| Action | Owner | Due date |
|--------|-------|----------|
| Fix the root cause permanently | <name> | YYYY-MM-DD |
| Add/improve alert rule | <name> | YYYY-MM-DD |
| Update NFR target if needed | Tech Lead | YYYY-MM-DD |
```

> **Rule for freshers:** If you are on shadow on-call, your job is to watch and learn —
> not to fix things unsupervised. Always ping the senior on-call before making any
> production change. The post-incident review is not a blame exercise — it is how
> the whole team gets smarter.

---

## 8. Maintainability and Evolvability

> **NFR IDs covered in this section:** NFR-17, NFR-18
>
> A platform that is fast today but impossible to change next month is not a good
> platform. Maintainability NFRs ensure the codebase stays clean, the architecture
> stays intentional, and new engineers can contribute without breaking things.

---

### 8.1 Architectural Constraints

#### Architecture Style by Phase

| Phase     | Architecture Style       | Rule                                                                                      |
|-----------|--------------------------|-------------------------------------------------------------------------------------------|
| Phase 1–2 | Modular Monolith         | All product modules (M-01 to M-10) live in a single NestJS application as NestJS modules. No separate services. |
| Phase 3   | Selective Microservices  | Individual modules may be extracted into separate services **only** after a Tech Lead-approved ADR. Not before. |

**Why modular monolith first:**
- Easier for freshers and interns to understand and navigate
- Simpler local development (one `docker-compose up`)
- Faster to ship Phase 1 features without cross-service complexity
- Refactoring to microservices later is straightforward because modules are already isolated

#### Module Boundary Rules

Every NestJS module must follow these rules to stay truly independent:

- A module must **not** import another module's internal services directly.
  Communication between modules happens via **BullMQ events only**.
- A module must **not** write directly to another module's database tables.
  If module A needs data from module B's table — it calls module B's service via an event or a well-defined internal API.
- A module must **not** share a database schema with another module.
  Each module owns its own tables. Shared reference data lives in a `shared` schema.
- If you are about to import a service from a different module — stop and raise it with
  the Tech Lead first. This is an architecture boundary violation.

#### AI Services Layer Constraints

- The AI Services Layer (FastAPI) is a **separate service** from the NestJS core.
  NestJS never calls FastAPI synchronously in a user-facing request (except AI sync endpoints like `/insights/ask`). This is an exception by design, not a violation of the monolith rule.
- All AI processing for post-call flows must be triggered via BullMQ jobs — never inline.
- LLM provider calls must go through **LiteLLM** — never call OpenAI SDK directly.
  This ensures fallback routing, provider switching, and cost monitoring work correctly.
- LangGraph is the only approved orchestration framework for multi-step AI agent flows.
  Do not build custom step orchestration logic.

---

### 8.2 Database and Indexing Rules

These rules are enforced at code review. Any PR violating them will not be merged.

#### Mandatory Index Rule (NFR-17)

Every table that stores multi-tenant data **must** have a composite index on
`(tenant_id, primary_lookup_column)` created in the same migration that creates the table.

```sql
-- Template: replace table_name and lookup_column with your values
-- Add this to the migration file that creates the table

CREATE INDEX idx_{table_name}_tenant_lookup
  ON {table_name} (tenant_id, {lookup_column} DESC);

-- Examples:
CREATE INDEX idx_calls_tenant_created ON calls (tenant_id, created_at DESC);
CREATE INDEX idx_deals_tenant_stage ON deals (tenant_id, stage);
CREATE INDEX idx_transcripts_tenant_call ON transcripts (tenant_id, call_id);
```

#### Sequential Scan Rule

Any query that performs a full sequential scan (`Seq Scan`) on a table expected to have
more than **10,000 rows** must include an index migration in the same PR.

To check if your query does a seq scan:
```sql
EXPLAIN ANALYZE SELECT * FROM your_table WHERE tenant_id = 'xxx' AND your_column = 'yyy';
-- Look for "Seq Scan" in the output — that means no index is being used
-- You want to see "Index Scan" or "Index Only Scan"
```

#### Migration Rules

| Rule | Requirement |
|------|-------------|
| Every schema change must be a Prisma migration | No manual `ALTER TABLE` in production. All changes go through `prisma migrate dev` → `prisma migrate deploy`. |
| Migrations must be reversible where possible | Write a `down` migration for every `up` migration that drops or renames columns. |
| Never delete a column without a deprecation period | Mark the column as deprecated in code for one full sprint before removing it. |
| Never rename a column directly | Add the new column, migrate data, deprecate the old column, remove it in a later sprint. |
| Raw SQL in migrations must be reviewed by Tech Lead | Any migration using raw SQL (not Prisma schema changes) requires explicit Tech Lead approval. |

---

### 8.3 Tech Stack and Tooling Constraints

#### Approved Stack (summary)

The full stack is defined in SAD §16 (Technology Stack Summary). The table below is
a quick-reference summary for daily decisions.

| Layer               | Approved Technology                                           |
|---------------------|---------------------------------------------------------------|
| Frontend            | Next.js 14, React 18, Tailwind CSS, ShadCN UI                |
| Backend (core)      | NestJS, TypeScript, Prisma, Zod, BullMQ                      |
| AI/ML services      | FastAPI, Python, LiteLLM, LangGraph, Whisper, pyannote.audio |
| Primary database    | PostgreSQL (Supabase), pgvector, Prisma ORM                  |
| Cache / Queue       | Redis (Upstash), BullMQ                                      |
| Search              | Meilisearch                                                   |
| Analytics           | ClickHouse                                                    |
| Auth                | Supabase Auth                                                 |
| Object storage      | Supabase Storage                                              |
| Hosting (Phase 1–2) | Railway (backend), Vercel (frontend)                          |
| Hosting (Phase 3)   | AWS ECS Fargate                                               |
| Secrets management  | Doppler                                                       |
| Monitoring          | Better Stack, Sentry, Grafana                                 |
| CDN / Edge          | Cloudflare                                                    |
| CI/CD               | GitHub Actions                                                |

#### Tooling Governance Rule (NFR-18)

> **No new tool, library, framework, API, or external service may be introduced into
> the codebase or infrastructure without a Tech Lead-approved ADR.**

This rule exists because:
- Every new tool creates maintenance cost and upgrade burden
- Every new vendor creates cost, legal review, and reliability risk
- Every new AI provider creates prompt, evaluation, and fallback complexity
- Unreviewed tools make onboarding harder for freshers and interns

**What counts as a "new tool":**
- A new `npm` or `pip` package not already in `package.json` / `requirements.txt`
- A new external API or SaaS integration
- A new AI model provider or inference endpoint
- A new infrastructure service or managed platform
- A new database, cache, or search engine

**What to do if you want to use a new tool:**


Check the approved stack table above first.
→ If it is already approved — use it.

If not approved — write a short ADR proposal:

What problem does this tool solve?

Why can't the existing approved stack solve it?

What is the cost model (free / paid / usage-based)?

What is the fallback if this tool goes down or we need to remove it?

Does it introduce any security or compliance concerns?

Share the ADR with the Tech Lead for review.
→ Approved → add to the stack, update SAD §16, update Tooling Inventory.
→ Rejected → use the existing approved alternative.

Never add a new dependency to the codebase before the ADR is approved.




> **Rule for freshers:** If you find a cool library on npm and want to use it —
> do not `npm install` it before asking. Write two sentences explaining what it does
> and why you need it, and send it to the Tech Lead in Slack. It takes 2 minutes and
> saves a lot of cleanup later.

---

## 9. Using This Document in Daily Work

This section tells every role on the team exactly how to use this document in their
day-to-day work. Read the subsection for your role before starting any feature, review,
or incident response.

---

### 9.1 For Feature Design (TDDs)

Every feature on R-Revenue Intelligence has a Technical Design Document (TDD).
Every TDD must reference this NFR document. Here is exactly how to do that.

#### Step 1 — Identify which NFRs your feature touches

Before writing a single line of TDD, read the NFR Registry (Section 3) and ask:


For the feature I am building:

Does it add or change an API endpoint? → NFR-01 (latency)

Does it add a BullMQ job? → NFR-02/03/04 (job timing)

Does it add a new database table or query? → NFR-09, NFR-17 (query time, indexes)

Does it add a webhook handler? → NFR-10 (webhook reliability)

Does it call an external API or CRM? → NFR-10 (integration reliability)

Does it send emails? → NFR-15 (CCPA opt-out check)

Does it store or export user data? → NFR-14 (GDPR export/deletion)

Does it add a new route? → NFR-11 (auth/RBAC guard required)

Does it use raw SQL? → NFR-12 (parameterised queries only)

Does it introduce a new tool or library? → NFR-18 (ADR required first)



#### Step 2 — Add an NFR Impact section to your TDD

Every TDD must include this section. Copy and fill it in:

```markdown
## NFR Impact Assessment

| NFR ID  | How this feature affects it                          | Mitigation / Design decision             |
|---------|------------------------------------------------------|------------------------------------------|
| NFR-01  | Adds GET /api/v1/deals/:id/brief endpoint            | Served from indexed PostgreSQL — target: p99 < 300 ms |
| NFR-09  | New query joins deals + transcripts tables           | Composite index on (tenant_id, deal_id) added in migration |
| NFR-14  | Stores deal brief in new `deal_briefs` table         | Table added to GDPR deletion cascade in T-07 |
| NFR-17  | Creates `deal_briefs` table                          | Index on (tenant_id, deal_id) in same migration |

**Load test required before release:** Yes / No
**New NFR required:** Yes (NFR-XX added to registry) / No
```

If your feature does not touch any NFR — write "No NFR impact" and explain why in one sentence. This is rare. Most features touch at least NFR-01 or NFR-17.

#### Step 3 — If your feature needs a new NFR

If you are building something that introduces a new measurable quality target not
already in the registry (e.g., a new pipeline with its own timing requirement), add
a new row to Section 3.1:

1. Assign the next sequential ID (e.g., NFR-19)
2. Fill all columns: category, target, measurement tool, alert threshold, owner, status
3. Get Tech Lead approval before merging the change to this document
4. Reference the new NFR ID in your TDD

---

### 9.2 For Code Reviews

When reviewing a PR, use this checklist. Every item marked ❌ is a required fix
before the PR can be merged. Items marked ⚠️ require a comment and discussion.

#### NFR Code Review Checklist

**Performance**
- [ ] ❌ Does any new synchronous endpoint call an AI service or do heavy computation inline? (Must be async — use BullMQ)
- [ ] ❌ Does any new BullMQ job lack a retry policy and DLQ config?
- [ ] ⚠️ Does any new query look like it could be slow? Run `EXPLAIN ANALYZE` and check for Seq Scans.
- [ ] ❌ Does any new table lack the mandatory `(tenant_id, lookup_column)` composite index?

**Security**
- [ ] ❌ Does any new NestJS controller method lack a `@Roles(...)` guard?
- [ ] ❌ Does any new code contain raw SQL outside a reviewed migration script?
- [ ] ❌ Does any new code contain a hardcoded secret, token, API key, or password?
- [ ] ❌ Does any new code log PII (email content, transcript text, customer names) to Better Stack?

**Reliability**
- [ ] ❌ Does any new external API call lack a try/catch, retry logic, and failure logging?
- [ ] ❌ Does any new BullMQ job lack idempotency logic (check before processing)?
- [ ] ❌ Does any new email send lack a CCPA opt-out check before the send?

**Observability**
- [ ] ❌ Does any new service or background job lack structured logging with `tenant_id` and `trace_id`?
- [ ] ❌ Does any new BullMQ job fail to log job duration to Better Stack on completion?
- [ ] ⚠️ Does the new feature need a new alert rule in Better Stack or Sentry?

**Compliance and Data**
- [ ] ⚠️ Does any new table storing user/customer data need to be added to the GDPR deletion cascade in T-07?
- [ ] ❌ Does any new migration rename or drop a column without a deprecation period?
- [ ] ❌ Does any new migration use raw SQL without Tech Lead approval?

**Tooling**
- [ ] ❌ Does the PR introduce a new `npm` or `pip` package that does not have an approved ADR?

#### How to use this checklist

- **For reviewers:** Go through every ❌ item. If any are violated, request changes.
  Do not approve the PR until all ❌ items are resolved.
- **For authors:** Run through this checklist yourself before opening the PR.
  Add a comment in the PR description: "NFR checklist self-reviewed ✅" to confirm you have done this.
- **For freshers:** If you are unsure about any checklist item — ask before pushing,
  not after. It is faster for everyone.

---

### 9.3 For Incidents and Post-Mortems

After every production incident that involves an NFR breach, the following steps
must be completed before the incident is fully closed.

#### During the incident

- Open an incident ticket immediately when the alert fires.
- Record the exact metric values that breached the NFR (e.g., "p99 latency hit 1,200 ms at 14:32 IST").
- Do not change NFR targets during an active incident. Focus on resolution first.

#### After the incident — Post-Mortem actions

**Step 1 — Write the post-incident review** using the template in Section 7.3.
Include the NFR IDs that were breached and the actual metric values.

**Step 2 — Decide if the NFR target needs to change.**
Ask these three questions:


Q1. Was the breach caused by a bug or misconfiguration that has now been fixed?
→ If yes: keep the existing target. No change needed.

Q2. Was the breach caused by genuine load growth that the current target
does not account for?
→ If yes: revise the target upward (make it more lenient) via ADR.

Q3. Was the breach caused by a design flaw that needs architectural change?
→ If yes: create an ADR for the architectural fix. Keep the target.
→ The target must still be met after the fix is shipped.


**Step 3 — Update this document if targets change.**

If the answer to Q2 is yes:
1. Update the relevant row in the NFR Summary Table (Section 3.1)
2. Update the detailed target in the relevant section (4, 5, 6, 7)
3. Update the alert threshold in Better Stack / Sentry to match
4. Bump the document version (e.g., v0.2 → v0.3)
5. Add a row to the Revision History (Section 10) with the change summary
6. Get Tech Lead sign-off before merging

**Step 4 — Add new alert rules if needed.**

If the incident revealed a gap in monitoring (e.g., an alert did not fire when it
should have), add a new alert rule to the table in Section 7.2 and configure it in
Better Stack or Sentry before the incident ticket is closed.

> **Rule for freshers:** You are not expected to update this document alone after an
> incident. Do it together with the Tech Lead or senior on-call. But you are expected
> to flag it — if you spot that an NFR target needs changing, say so in the
> post-incident review. That is how the platform gets better over time.

---

## 10. Revision History

Every change to this document must be recorded here. Include the version number, date,
author, and a one-line summary of what changed and why.

**Version numbering rules:**
- `v0.x` — Draft versions before Tech Lead sign-off
- `v1.0` — First Tech Lead-approved production version
- `v1.x` — Minor updates (new NFR rows, threshold adjustments, wording fixes)
- `v2.0` — Major structural changes (new sections, significant target revisions after Phase review)

| Version | Date       | Author        | Summary of Changes                                                  |
|---------|------------|---------------|---------------------------------------------------------------------|
| v0.1    | 2026-05-13 | TBD      | Initial draft created from SAD §15 NFRs and SAD §14 Security Architecture. |
| v0.2    | 2026-05-13 | TBD      | Applied feedback: cleanup placeholders, tenant-isolation wording, error rate NFRs, paging info, test data profile, backup NFR. |

> **Release Rule:** No content changes after sign-off without a version bump.

---

*End of R-Revenue Intelligence Non-Functional Requirements Specification v0.2*

---

> **Document sign-off**
>
> This document becomes v1.0 and the active production NFR specification once the
> Tech Lead has reviewed and approved it. Until then, it is a working draft.
>
> | Role       | Name       | Sign-off Date |
> |------------|------------|---------------|
> | Tech Lead  | Pending    | Pending       |
> | Backend Lead | Pending  | Pending       |
> | AI Lead    | Pending    | Pending       |
> | DevOps     | Pending    | Pending       |

## 11. Glossary

- **p99 / p90:** Percentiles representing the value below which 99% or 90% of the observations fall.
- **DLQ:** Dead-Letter Queue. A holding queue for messages/jobs that failed to process.
- **RLS:** Row-Level Security. Database feature to restrict data access per tenant.
- **ADR:** Architecture Decision Record. A document capturing important architectural decisions.
- **RPO / RTO:** Recovery Point Objective / Recovery Time Objective. Data loss tolerance and downtime tolerance in disaster recovery.