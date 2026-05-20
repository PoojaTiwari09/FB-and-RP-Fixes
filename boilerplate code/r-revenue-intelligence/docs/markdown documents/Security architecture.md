# Security Architecture Document
### R-Revenue Intelligence | Relanto.ai | Document ID: T-07

---

## 1. Document Control

| Property            | Value                                                                 |
|---------------------|-----------------------------------------------------------------------|
| **Document Title**  | Security Architecture Document                                        |
| **Document ID**     | T-07                                                                  |
| **Version**         | 0.1 — Draft                                                           |
| **Status**          | Draft — Pending Tech Lead sign-off before v1.0 finalisation           |
| **Product**         | R-Revenue Intelligence                                                |
| **Organization**    | Relanto.ai                                                            |
| **Owner**           | Tech Lead — R-Revenue Intelligence Platform                           |
| **Reviewers**       | Backend Lead, AI/ML Lead, Frontend Lead, DevOps Lead                  |
| **Last Updated**    | April 2026                                                            |
| **Next Review Date**| July 2026                                                             |
| **Review Cadence**  | Every 3 months, OR immediately after any major security event, new integration, infrastructure change, or compliance requirement |

### 1.1 Approval History

| Version | Date       | Author     | Status   | Notes                                         |
|---------|------------|------------|----------|-----------------------------------------------|
| 0.1     | April 2026 | Tech Lead  | Draft    | Initial draft — Sections 1–4 written          |
| —       | —          | —          | Pending  | Full Tech Lead review and sign-off required for v1.0 |

### 1.2 How to Update This Document

- Every change to this document — even a small correction — must add a new row to the Approval History table before the pull request is merged.
- Branch naming convention: `sec-arch-update/<short-description>` (e.g., `sec-arch-update/add-pen-test-scope`)
- All changes require Tech Lead approval before merging.
- After merge, notify the team in the project Slack channel.
- Version increment rules:
  - `v0.x` — Draft, incomplete, under active review
  - `v1.0` — First approved version, all sections complete, Tech Lead signed off
  - `v1.x` — Minor update: corrections, clarifications, new controls
  - `v2.0` — Major revision: new threat model, infrastructure change, compliance framework added

> **Rule:** If any information in this document conflicts with the SAD (T-01), the SAD is correct for architecture decisions. If any information here conflicts with the Compliance Controls Matrix (T-09) or Incident Response Playbook (T-10), raise a discrepancy with the Tech Lead immediately and update whichever document is out of date.

---

## 2. Purpose and Scope

### 2.1 Document Purpose

This document is the **Security Architecture Document (SAD)** for the R-Revenue Intelligence platform — an AI-powered revenue intelligence platform built by Relanto.ai.

This document defines:
- How the platform protects customer data, conversation recordings, CRM credentials, and AI-generated outputs
- How the platform enforces identity, authentication, and access control across all modules
- How tenant isolation is implemented and enforced at every layer
- The platform's threat model, attack surface, and security controls
- Compliance obligations (GDPR, CCPA) and how they are implemented
- Incident response, key rotation, and vulnerability management procedures

This document is the **single source of truth** for all platform-level security decisions.  
Feature-specific security considerations belong in the relevant Technical Design Document (TDD), not here.

---

### 2.2 In-Scope Systems

The following systems are covered by this document:

| System                        | Technology                        | Notes                                      |
|-------------------------------|------------------------------------|--------------------------------------------|
| Frontend Web Application      | Next.js 15, Vercel                | User-facing application                    |
| NestJS API (Modular Monolith) | NestJS v11, TypeScript, Railway   | Core business logic and API layer          |
| FastAPI AI Services           | FastAPI, Python 3.12, Railway     | All AI/ML inference and processing         |
| Whisper Transcription Service | Whisper large-v3, Railway GPU     | Speech-to-text pipeline                    |
| BullMQ Workers                | NestJS workers, Railway           | Async job processing                       |
| PostgreSQL (Supabase)         | Supabase Pro, managed             | Primary relational data store              |
| Redis (Upstash)               | Upstash managed Redis             | Queue backing store and cache              |
| Meilisearch                   | Railway Docker                    | Full-text search index                     |
| ClickHouse                    | Railway Docker                    | Analytical data store                      |
| Cloudflare                    | Cloudflare Pro                    | CDN, DDoS protection, WAF, TLS termination |
| Doppler                       | Doppler managed                   | Secrets management                         |
| Supabase Auth                 | Supabase managed                  | Authentication and JWT issuance            |
| CI/CD Pipeline                | GitHub Actions                    | Build, test, and deployment pipeline       |

---

### 2.3 Out-of-Scope Systems

The following are explicitly out of scope for this document:

| Out of Scope                        | Where It Is Covered                               |
|-------------------------------------|---------------------------------------------------|
| CRM platforms (Salesforce, HubSpot, Dynamics 365) | Integration security covered in Section 21 of this document. CRM-internal security is the CRM vendor's responsibility. |
| Conferencing tools (Zoom, Teams, Google Meet) | Webhook security covered in Section 17. Tool-internal security is the vendor's responsibility. |
| Customer-owned data warehouses (Snowflake, BigQuery) | Export security covered in Section 21. Warehouse-internal security is the customer's responsibility. |
| Email providers (Gmail, Outlook/Office 365) | OAuth integration security covered in Section 21. Email server security is the provider's responsibility. |
| Internal Relanto.ai corporate IT and network security | Covered by Relanto.ai's corporate security policy |
| Feature-specific business logic security | Covered in the relevant feature's TDD |
| UI/UX security flows | Covered in product design specifications |

---

### 2.4 Intended Audience

| Reader                | How They Use This Document                                                            | Start Here          |
|-----------------------|---------------------------------------------------------------------------------------|---------------------|
| Backend Engineers     | Understand security controls they must implement or preserve in every PR              | Sections 2, 9, 10, 11 |
| Frontend Engineers    | Understand session security, token handling, and CSP rules                            | Sections 2, 9, 13   |
| AI/ML Engineers       | Understand secure AI service boundaries, prompt handling, and data privacy in AI flows| Sections 2, 20      |
| QA Engineers          | Write security test cases from the threat model and control definitions               | Sections 7, 8, 28   |
| Tech Lead             | Governing reference for all security decisions across the platform                    | All sections        |
| New Team Members      | Read before writing any code that touches authentication, data, or integrations       | Sections 1, 2, 3, 4 |
| DevOps / Infrastructure | Understand secrets management, infrastructure hardening, and deployment security     | Sections 12, 18, 19 |

> **Mandatory read:** Every engineer must read this document before their first production-affecting pull request. Re-read the relevant sections whenever a new version is released.

---

### 2.5 How to Use This Document

- **Before building any feature:** Read Sections 1–4 in full. Understand which security controls your feature must implement or interact with.
- **Before writing authentication or session code:** Read Section 9 (Identity and Authentication) and Section 10 (Authorization and Access Control) in full.
- **Before building any integration:** Read Section 21 (Integration Security) for the relevant integration type.
- **Before deploying to production:** Read Section 26 (Business Continuity) and Section 18 (Infrastructure Security).
- **After a security incident:** Follow Section 25 (Incident Response). Post-incident, update Section 29 (Risks and Exceptions) if a new accepted risk is identified.
- **When reviewing a PR:** Use this document to validate that the implementation does not remove, bypass, or weaken any security control defined here.

---

### 2.6 Relationship with Other Documents

| Document ID | Document Name                      | Relationship                                                                                     |
|-------------|------------------------------------|--------------------------------------------------------------------------------------------------|
| T-01 (SAD)  | System Architecture Document       | Parent architecture document. T-07 expands the security summary in SAD Section 14 into full specification. If there is a conflict, the SAD governs architecture; T-07 governs security. |
| T-08        | Data Retention Policy              | Defines per-entity retention schedules, deletion cascade rules, and audit log retention by plan. T-07 references T-08 for data lifecycle security. |
| T-09        | Compliance Controls Matrix         | SOC 2 Type II control mapping, GDPR Article compliance mapping, CCPA compliance mapping. T-07 references T-09 for control evidence. |
| T-10        | Incident Response Playbook         | Severity classification, escalation path, communication templates, post-incident review. T-07 Section 25 summarises; T-10 is the operational reference during an incident. |
| Feature TDDs| Feature-specific Technical Design Docs | Feature-level security considerations live in TDDs. T-07 governs platform-wide controls that all TDDs must respect. |
| NFR Document (SAD Section 15) | Non-Functional Requirements | Security NFRs (availability, response time under load, audit logging SLAs) are defined in the NFR registry and referenced here. |

---

## 3. Security Objectives

### 3.1 Confidentiality Goals

The platform must ensure that:
- Customer conversation data (call recordings, transcripts, email content) is **only accessible to the tenant that owns it** — never to other tenants, Relanto.ai staff (except under controlled access procedures), or any unauthenticated party.
- CRM credentials, OAuth tokens, and integration secrets are **encrypted at the field level** before storage, in addition to disk-level encryption.
- AI-generated outputs (summaries, deal briefs, scoring results) are **scoped to the generating tenant** and never leaked across tenant boundaries.
- Internal service APIs (FastAPI AI services, BullMQ workers) are **never exposed to the public internet** — accessible only over the internal Docker network.

### 3.2 Integrity Goals

The platform must ensure that:
- All data written to PostgreSQL, ClickHouse, and Meilisearch is **validated by Zod schemas** at the API layer before reaching any business logic — no unvalidated input reaches the database.
- All CRM sync operations (write-back to Salesforce, HubSpot, Dynamics 365) are **idempotent and auditable** — every sync event is logged with tenant ID, user ID, timestamp, and payload hash.
- AI-generated outputs marked as **low-confidence are not auto-written to CRM** — they are held for human review.
- Webhook events from external systems (Zoom, Teams, Google Meet) are **verified using HMAC-SHA256** before processing — no unverified webhook payload reaches business logic.
- Database schema migrations are **reviewed and approved** before running against production — no unapproved migration reaches the production database.

### 3.3 Availability Goals

The platform must ensure that:
- The NestJS API maintains **99.5% monthly uptime** (measured by Better Stack).
- A single component failure (Redis, Whisper, OpenAI API) does **not cause full platform outage** — fallback paths and queue-based retry logic preserve core functionality.
- DDoS attacks are absorbed by **Cloudflare** before reaching Railway origin servers — Railway origin IPs are never exposed in DNS.
- **Application-Layer Rate Limiting** is implemented in the NestJS API (using Redis) scoped by `tenant_id` and `user_id` to prevent authenticated API abuse and financial exhaustion attacks. 
- **AI Feature Quotas** are enforced to prevent Denial-of-Wallet attacks through excessive AI usage. 
- BullMQ dead-letter queues (DLQ) preserve failed jobs for **manual replay** — no customer data is lost due to transient infrastructure failures.
- The platform performs **automated rollback** if a production deployment fails health checks within 5 minutes.

### 3.4 Privacy Goals

The platform must ensure that:
- **PII (Personally Identifiable Information)** in transcripts and emails is handled in accordance with GDPR and CCPA requirements.
- Customer data is **never sent to third-party AI providers** (OpenAI, AssemblyAI) without being governed by a Data Processing Agreement (DPA).
- Tenants can **request full data export** (`GET /api/v1/admin/data-export`) and **full data deletion** (`POST /api/v1/admin/data-deletion`) — deletion cascades across all schemas for the requested entities.
- **Conversation recording opt-out** preferences are enforced at the ingestion layer — recordings are not processed for tenants or users who have opted out.
- **Session Retention:** AI query sessions and chat history (e.g. Ask Anything) are retained for 90 days by default, configurable by tenant policy up to a hard maximum of 365 days.
- Logs and traces are **redacted of PII** before being sent to Sentry and Better Stack.

### 3.5 Tenant Isolation Goals

The platform must ensure that:
- Every database query is **scoped to the authenticated tenant** using PostgreSQL Row-Level Security (RLS) — no query can return data from another tenant, even if the application layer has a bug.
- The **defense-in-depth principle** is enforced: JWT guard → TenantInterceptor → Prisma middleware → PostgreSQL RLS all independently enforce tenant isolation. A bug in any single layer is caught by the others. No layer is ever removed, even if another layer appears to make it redundant.
- Tenant isolation is **verified by automated tests** — a test suite exists that attempts cross-tenant data access and asserts it is rejected at every layer.
- Multi-tenant **session limits** are configurable per plan (Enterprise: max 3 concurrent sessions by default; Starter/Growth/Pro: unlimited).

### 3.6 Compliance Goals

The platform must ensure that:
- **GDPR Article 17 (Right to Erasure):** Data deletion is implemented and cascades across all schemas for the requested data subject or tenant.
- **Comprehensive "Right to be Forgotten" Runbook:** Data deletion must explicitly include flushing tenant data from Redis caches, Meilisearch indexes, ClickHouse analytics, and documenting the timeline for backup rotation (e.g., "data will naturally age out of PITR backups in 30 days"). 
- **GDPR Article 20 (Right to Data Portability):** Data export is implemented and produces a structured, machine-readable output.
- **CCPA:** Opt-out records are stored and enforced at the ingestion layer.
- **SOC 2 Type II (planned Phase 2):** All controls in the Compliance Controls Matrix (T-09) are implemented and evidence is continuously collected.
- **Penetration testing** is conducted quarterly. Scope and findings are documented in this document (Section 24). Critical findings must be remediated before the next production deployment.

### 3.7 Operational Security Goals

The platform must ensure that:
- **No secrets are stored in code, `.env` files, Docker images, or version control** — all secrets are injected at runtime by Doppler.
- **Doppler Fallback Mechanism:** Define a fallback mechanism or local caching strategy for Doppler secrets (e.g., Doppler's native encrypted local fallback) to ensure the application can survive a Doppler control-plane outage. 
- **Secret rotation** is performed every 90 days for field-level encryption keys, and immediately upon suspected compromise — runbook documented in Section 30.
- **Dependency scanning** runs weekly (Dependabot). Critical CVEs trigger an immediate Slack alert and must be patched within 24 hours.
- **Secret scanning** is enabled on the GitHub repository (GitHub Advanced Security). Any accidental secret commit triggers an immediate alert and automatic Doppler secret rotation.
- All production deployments require **Tech Lead approval** via a manual GitHub Actions approval gate.
- Every engineer reads this document **before their first production deployment** — this is a mandatory requirement, not a recommendation.

---

## 4. System Context

### 4.1 Platform Security Boundary

R-Revenue Intelligence operates as a **multi-tenant SaaS platform**. The security boundary is defined as follows:

[ Public Internet]
↓
[ Cloudflare — TLS termination, DDoS protection, WAF, rate limiting]
↓
[ Vercel — Next.js Frontend] ←→ [ Railway — NestJS API]
↓
[ Internal Docker Network — Railway]
┌─────────────────────────────────┐
│ FastAPI AI Services │
│ Whisper Transcription Service │
│ BullMQ Workers │
└─────────────────────────────────┘
↓
[ Data Layer]
┌─────────────────────────────────┐
│ Supabase PostgreSQL │
│ Upstash Redis │
│ Meilisearch │
│ ClickHouse │
│ Supabase Storage (audio files) │
└─────────────────────────────────┘



- **Everything above the Cloudflare layer** is public internet — untrusted.
- **Cloudflare to Railway** is a private, TLS-encrypted channel — Cloudflare Full Strict mode.
- **Internal Docker network** (FastAPI AI services, Whisper, workers) is **never exposed to the public internet** — no public port, no public URL.
- **Data layer** (Supabase, Upstash, ClickHouse, Meilisearch) is only accessible from within the Railway internal network — no direct public access.

---

### 4.2 Internal Components

| Component                  | Technology            | Trust Level        | Security Notes                                                       |
|----------------------------|-----------------------|--------------------|----------------------------------------------------------------------|
| Next.js Frontend           | Vercel, Next.js 15    | Untrusted (browser)| All business logic lives in backend. Frontend is presentation-only.  |
| NestJS API                 | Railway, NestJS v11   | Trusted (internal) | Owns business logic, auth enforcement, tenant isolation              |
| FastAPI AI Services        | Railway, Python 3.12  | Trusted (internal) | Internal only — no public route. Communicates via internal Docker network |
| Whisper Transcription      | Railway GPU           | Trusted (internal) | Internal only — audio never leaves infrastructure                    |
| BullMQ Workers             | Railway               | Trusted (internal) | Async job execution — all jobs are tenant-scoped and idempotent      |
| PostgreSQL                 | Supabase managed      | Trusted (data)     | RLS enforced at the database layer for all tenant data               |
| Redis                      | Upstash managed       | Trusted (data)     | Queue state and cache — encrypted at rest and in transit             |
| Meilisearch                | Railway Docker        | Trusted (internal) | Search index — tenant-scoped indexes, internal access only           |
| ClickHouse                 | Railway Docker        | Trusted (internal) | Analytical store — internal access only                              |
| Supabase Auth              | Supabase managed      | Trusted (external) | JWT issuance and session management                                  |
| Doppler                    | Doppler managed       | Trusted (external) | Secrets management — audit-logged access                             |
| Cloudflare                 | Cloudflare managed    | Trusted (edge)     | CDN, WAF, DDoS, TLS — first line of defence                         |
| GitHub Actions (CI/CD)     | GitHub managed        | Trusted (internal) | Build, test, deploy pipeline — production requires manual approval gate |

---

### 4.3 External Dependencies

| Dependency         | Type                        | Data Sent                              | Risk Level | Mitigation                                                               |
|--------------------|-----------------------------|----------------------------------------|------------|--------------------------------------------------------------------------|
| OpenAI API         | LLM inference               | Transcript text, email content, prompts| High       | DPA in place. PII redacted before sending. Fallback to Ollama (Phase 2). |
| AssemblyAI         | ASR fallback                | Raw audio (fallback only)              | High       | DPA in place. Used only when Whisper self-hosted fails.                  |
| Supabase Auth      | Authentication              | User email, password hash, OAuth tokens| Medium     | Managed service. DPA in place. OAuth tokens scoped minimally.            |
| Salesforce         | CRM integration             | Deal, contact, account data (read/write)| Medium    | OAuth 2.0. Scoped to minimum required permissions. Tokens encrypted at rest. |
| HubSpot            | CRM integration             | Deal, contact, account data (read/write)| Medium    | OAuth 2.0. Scoped to minimum required permissions. Tokens encrypted at rest. |
| Microsoft Dynamics | CRM integration             | Deal, contact, account data (read/write)| Medium    | OAuth 2.0. Scoped to minimum required permissions. Tokens encrypted at rest. |
| Zoom               | Webhook + OAuth             | Meeting metadata, recording webhooks   | Medium     | HMAC-SHA256 webhook verification. OAuth scoped minimally.                |
| Microsoft Teams    | Webhook + OAuth             | Meeting metadata, recording webhooks   | Medium     | HMAC-SHA256 webhook verification. OAuth scoped minimally.                |
| Google Meet        | Webhook + OAuth             | Meeting metadata, recording webhooks   | Medium     | HMAC-SHA256 webhook verification. OAuth scoped minimally.                |
| Gmail API          | Email integration           | Email content (read/send)              | High       | OAuth 2.0. Scoped to minimum required permissions. DPA required.         |
| Outlook/Office 365 | Email integration           | Email content (read/send)              | High       | OAuth 2.0. Scoped to minimum required permissions. DPA required.         |
| Snowflake/BigQuery | Data export (customer-owned)| Structured analytics exports           | Low        | Customer-owned warehouse. Export authenticated by warehouse credentials stored encrypted. |
| Upstash Redis      | Managed Redis               | Queue payloads, cache                  | Low        | Managed service. Encrypted at rest and in transit.                       |
| Sentry             | Error monitoring            | Stack traces, error context            | Medium     | PII redacted before sending to Sentry.                                   |
| Better Stack       | Uptime monitoring           | Health check pings, alert payloads     | Low        | No customer data sent.                                                   |

---

### 4.4 Trust Boundaries

| Boundary                                  | Direction         | Trust Rule                                                                   |
|-------------------------------------------|-------------------|------------------------------------------------------------------------------|
| Public Internet → Cloudflare              | Inbound           | Untrusted. Cloudflare applies WAF, DDoS protection, and rate limiting.       |
| Cloudflare → NestJS API                   | Inbound           | TLS 1.3 enforced. Cloudflare Full Strict mode. JWT required on all routes.   |
| Browser → Next.js Frontend                | Inbound           | Untrusted. All sensitive operations go through authenticated API calls.      |
| NestJS → FastAPI AI Services              | Internal          | Internal Docker network only. `INTERNAL_SERVICE_SECRET` header required. **mTLS authentication required for production deployments.**      |
| NestJS → Supabase PostgreSQL              | Internal          | TLS 1.3 enforced. Prisma ORM with parameterised queries. RLS enforced.       |
| NestJS → Upstash Redis                    | Internal          | TLS 1.3 enforced (`rediss://`). No direct public access.                     |
| NestJS → External CRM / Email APIs        | Outbound          | OAuth 2.0 with minimally scoped tokens. Tokens encrypted at rest.            |
| Webhook Sources (Zoom, Teams, Meet) → NestJS | Inbound        | HMAC-SHA256 verified. JWT validation bypassed on webhook routes — HMAC is the only auth mechanism. |
| NestJS → OpenAI / AssemblyAI              | Outbound          | PII redacted. DPA in place. No raw audio sent to OpenAI.                     |

---

### 4.5 User Types

| User Type         | Description                                                                 | Access Level                                                          |
|-------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------|
| AE (Account Exec) | Sales rep — primary user of call intelligence, deal boards, email composer  | Own calls, own deals, own accounts only                               |
| SDR               | Sales development rep — uses call intelligence and email composer           | Own calls, own outreach only                                          |
| Sales Manager     | Manages a team — uses coaching, team dashboards, forecast rollups           | Own calls + reports' calls, team-level pipeline and forecast          |
| VP Sales          | Revenue leadership — uses forecast boards, pipeline health, team analytics  | Org-wide pipeline, forecast, and coaching views                       |
| CRO               | Executive — uses revenue dashboards, Data Cloud, top-line forecast          | Full org-level visibility, read-only on most modules                  |
| RevOps            | Operations — configures compliance settings, CRM mapping, playbooks         | Configuration access across modules, no direct rep data manipulation  |
| Tenant Admin      | IT/Ops administrator — manages integrations, user provisioning, billing     | Tenant-level admin settings, user management, integration credentials |
| Relanto.ai Support| Internal support — controlled, logged access under break-glass procedure    | Read-only, time-limited, audit-logged — no standing production access |

---

### 4.6 Admin and Operator Roles

| Role                   | Access Scope                                                                          | Security Controls                                                        |
|------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| Tenant Admin           | User provisioning, integration setup, compliance settings, billing for own tenant     | JWT-authenticated. RBAC-enforced. All admin actions are audit-logged.    |
| Relanto.ai Tech Lead   | Production deployment approval, architecture sign-off, emergency access              | GitHub Actions approval gate. All production actions are logged.         |
| Relanto.ai Support     | Break-glass read-only access to tenant data under documented support procedure        | Time-limited token. Access requires incident ticket. All queries logged. |
| Bull Board (Queue UI)  | Queue monitoring — production access restricted to whitelisted Relanto.ai IPs         | Cloudflare Access-protected. Google SSO required. IP allowlist enforced. |
| Swagger / API Docs     | API documentation — production access restricted to whitelisted Relanto.ai IPs        | Cloudflare Access-protected. Not exposed to public internet.             |
| Database Admin         | Direct PostgreSQL access — emergency only, via Supabase dashboard                    | Supabase dashboard access controlled by Relanto.ai account SSO. All queries logged. |

---

### 4.7 Third-Party Integration Surface

The following integration points represent the external attack surface that must be hardened:

| Integration Point            | Protocol         | Auth Mechanism                          | Security Control                                              |
|------------------------------|------------------|-----------------------------------------|---------------------------------------------------------------|
| Salesforce inbound/outbound  | REST API         | OAuth 2.0 (authorization code)          | Tokens encrypted at rest (AES-256-GCM). Scoped to minimum permissions. |
| HubSpot inbound/outbound     | REST API         | OAuth 2.0 (authorization code)          | Tokens encrypted at rest. Scoped to minimum permissions.      |
| Microsoft Dynamics inbound/outbound | REST API  | OAuth 2.0 (authorization code)          | Tokens encrypted at rest. Scoped to minimum permissions.      |
| Zoom webhooks                | HTTPS Webhook    | HMAC-SHA256 (`X-Webhook-Signature`)     | Signature verified before processing. Replay protection via timestamp validation. |
| Microsoft Teams webhooks     | HTTPS Webhook    | HMAC-SHA256 (`X-Webhook-Signature`)     | Signature verified before processing. Replay protection.      |
| Google Meet webhooks         | HTTPS Webhook    | HMAC-SHA256 (`X-Webhook-Signature`)     | Signature verified before processing. Replay protection.      |
| Gmail API                    | REST API         | OAuth 2.0 (authorization code)          | Scoped to `gmail.readonly` + `gmail.send`. Tokens encrypted at rest. |
| Outlook / Office 365 API     | REST / Graph API | OAuth 2.0 (Microsoft identity platform) | Scoped to minimum Graph API permissions. Tokens encrypted at rest. |
| OpenAI API                   | REST API         | API key (Bearer token)                  | Key stored in Doppler. Rotated every 90 days. PII redacted before sending. |
| AssemblyAI API               | REST API         | API key (Bearer token)                  | Key stored in Doppler. Used as fallback only. Audio never stored by AssemblyAI long-term (DPA enforced). |
| Snowflake / BigQuery export  | Direct connector | Customer-provided warehouse credentials | Credentials encrypted at rest (AES-256-GCM in `data_cloud_exports.warehouse_config_encrypted`). |

> **Security rule:** Every new third-party integration must be reviewed and approved by the Tech Lead before being added. No new external dependency may be used in production without being documented in this table and the Tooling and Services Inventory (T-02).

---

## 5. Architecture Overview

### 5.1 High-Level Security Architecture

The security architecture of R-Revenue Intelligence follows a **layered, defense-in-depth model** across the edge, application, data, AI, and integration layers. The platform is a **multi-tenant SaaS system** built as a modular monolith in NestJS for product services, with separate internal FastAPI services for AI and transcription workloads. Tenant isolation is enforced at multiple layers using JWT validation, request-scoped tenant resolution, Prisma safeguards, and PostgreSQL Row-Level Security (RLS). Public traffic is terminated and filtered at Cloudflare before reaching application services, while internal AI services are restricted to the internal Docker network and are never exposed directly to the public internet. 

At a high level, the security model is:

```text
[User / Browser / External Systems]
              |
              v
[Cloudflare: TLS, WAF, DDoS, rate limiting, bot filtering]
              |
              v
[Next.js Frontend on Vercel] <--> [NestJS API on Railway]
                                         |
                                         v
                     [Internal Docker Network / Private Service Layer]
                     [FastAPI AI Services] [Whisper Service] [BullMQ Workers]
                                         |
                                         v
                [Supabase PostgreSQL + RLS] [Upstash Redis] [Meilisearch] [ClickHouse]
                                         |
                                         v
               [External Integrations: CRM, Email, Meeting, Warehouse, AI Providers]
```

Security responsibilities are intentionally split by boundary:
- **Edge layer:** Cloudflare handles TLS termination, DDoS absorption, outer rate limits, bot filtering, and access protection for internal admin surfaces.
- **Frontend layer:** The frontend is presentation-focused and must not contain business logic, direct DB access, or direct AI provider calls.
- **Application layer:** NestJS owns authentication enforcement, RBAC, input validation, tenant context propagation, API authorization, and orchestration.
- **AI layer:** All AI and ML logic stays in Python services, isolated from product business logic.
- **Data layer:** PostgreSQL RLS enforces tenant separation even if the application layer has a bug.
- **Integration layer:** OAuth scopes, encrypted credentials, HMAC webhook verification, and tenant-scoped sync rules protect external connections. 

---

### 5.2 Security Design Principles

The platform follows these core security design principles:

#### 5.2.1 Multi-layer tenant isolation
Tenant isolation must never depend on a single guardrail. The platform enforces tenant isolation through multiple independent controls: JWT guard, tenant interceptor, Prisma query scoping, and PostgreSQL RLS. If one control fails, the remaining controls still block cross-tenant access. 

#### 5.2.2 Separation of concerns
Product business logic lives in TypeScript services, while AI/ML logic lives in Python services. This is both an engineering rule and a security rule because it limits blast radius, reduces accidental credential sprawl, and keeps AI provider access away from the main product codepath. 

#### 5.2.3 Secure centralization of sensitive operations
Authentication, secret handling, integration credentials, and outbound provider access are centralized rather than duplicated across modules. This reduces inconsistent implementations and makes auditing easier. Supabase Auth handles authentication, Doppler handles secrets, and LiteLLM centralizes LLM provider routing. 

#### 5.2.4 Minimal trust across boundaries
Every boundary is treated as a security checkpoint: public traffic is untrusted, browser state is untrusted, webhook payloads are untrusted until HMAC verification passes, and even internal service-to-service traffic requires explicit shared-secret validation where defined. 

#### 5.2.5 Async isolation for heavy and risky workflows
Long-running, expensive, or externally dependent workflows such as transcription, AI summarization, tracker detection, and export jobs must run asynchronously through BullMQ rather than inline in request handlers. This improves resilience, reduces denial-of-service risk, and gives better retry and failure isolation. 

#### 5.2.6 No secret-in-code rule
Secrets must never live in source code, committed `.env` files, container images, or ad hoc local config that can leak into version control. All production secrets are injected via Doppler, with per-service and per-environment scoping. 

---

### 5.3 Defense-in-Depth Model

The platform explicitly adopts a **defense-in-depth** model. No single control is treated as sufficient on its own. This is a hard architectural rule, not an optional guideline. 

#### 5.3.1 Identity and access layers
A typical authenticated request passes through several independent checks:
1. Cloudflare filters and rate-limits traffic at the edge.
2. Supabase-issued JWT is validated by NestJS guards.
3. RBAC checks verify role permissions.
4. Tenant context is attached via request interceptor or middleware.
5. Prisma queries are scoped using tenant-aware access patterns.
6. PostgreSQL RLS enforces final tenant-level isolation at the database layer. 

#### 5.3.2 Integration entry-point layers
For external inbound events such as meeting or recording webhooks:
1. Cloudflare applies outer rate limiting and bot filtering.
2. Webhook endpoint bypasses JWT but requires HMAC verification.
3. Timestamp and replay checks prevent duplicate or delayed abuse.
4. Validated payloads are queued, not processed synchronously.
5. Downstream consumers operate on idempotent event contracts. 

#### 5.3.3 Data protection layers
Sensitive data is protected by:
- Encryption at rest on managed data stores.
- TLS in transit between services and managed dependencies.
- Additional application-layer encryption for especially sensitive credential fields.
- Role-based access restrictions.
- Audit logging for admin and critical actions.
- Retention and deletion controls for raw audio and customer data. 

#### 5.3.4 AI safety and governance layers
AI outputs are not automatically trusted. The architecture expects structured outputs, confidence scoring, fallback handling, and human review for low-confidence or higher-risk workflows such as CRM write-back. This prevents a single bad model response from becoming a production data-integrity incident. 

---

### 5.4 Shared Responsibility Model

Security in this platform is shared across platform components, managed providers, customers, and internal teams. Clear responsibility boundaries reduce confusion during incidents and during implementation. 

| Area | Relanto.ai Responsibility | Managed Provider Responsibility | Customer Responsibility |
|------|---------------------------|---------------------------------|-------------------------|
| Authentication flow | App auth integration, RBAC, route protection, secure session handling  | Supabase Auth service availability, token issuance, managed identity infrastructure  | User lifecycle decisions, tenant admin role assignment, internal access governance  |
| Edge protection | Cloudflare configuration, WAF rules, rate limits, protected admin surfaces  | Cloudflare global edge delivery, DDoS infrastructure  | Safe usage patterns, authorized source systems for integrations  |
| Application security | Input validation, authorization, tenant scoping, auditability, secure coding  | Railway/Vercel managed runtime and infra primitives  | Proper role provisioning and admin hygiene within tenant  |
| Data protection | Schema design, RLS, field encryption, deletion/export logic, retention rules  | Supabase/Upstash managed encryption at rest and service operations  | Correct configuration of customer-owned export destinations  |
| Integrations | OAuth flow design, secure credential storage, webhook verification  | CRM/email/meeting provider service-side security  | Granting least-privilege scopes, revoking unused integrations  |
| Data warehouse exports | Tenant-scoped export jobs, encrypted connector config handling  | Snowflake/BigQuery/Databricks platform security  | Warehouse-side access control, downstream data governance  |

Operational ownership inside Relanto.ai is also split:
- **Tech Lead:** Final owner of security architecture decisions and production approval gates. 
- **Backend Lead:** Owner of API security, RBAC, tenant scoping, and secure service boundaries. 
- **AI Lead:** Owner of AI service security, provider routing discipline, confidence gating, and human review workflow design. 
- **DevOps Lead / Security Owner:** Owner of Doppler, Cloudflare, CI gates, logs, metrics, and operational security controls. 

---

### 5.5 Secure-by-Default Rules

The platform adopts **secure-by-default** rules so new code starts from a safe baseline instead of relying on every engineer to remember security manually. This is especially important in a mixed-experience team. 

The following defaults are mandatory:

- All API routes are protected unless explicitly marked public, and public routes must be minimal and documented. 
- All request bodies and event payloads are validated with Zod before reaching business logic. 
- All database access uses Prisma with tenant-aware patterns; no ad hoc cross-tenant reads are allowed. 
- All mutating actions require authenticated authorization checks and role validation. 
- All internal AI calls go through the approved Python service boundary; TypeScript product services must not call AI providers directly. 
- All webhook endpoints must use HMAC verification and idempotent handling. 
- All secrets are read from Doppler-injected environment variables, not from committed config files. 
- All async heavy operations must go through BullMQ so retries, DLQ handling, and observability remain consistent. 
- All new integrations must be reviewed and documented before production use. 
- All critical changes must pass CI gates before merge; broken tests or failed security checks block merge. 
- **All file and audio uploads must be scanned for malware before storage** and validated for MIME type and size limits at the API gateway. 

---

### 5.6 Least Privilege Approach

Least privilege is enforced across users, services, secrets, and integrations. No actor should have broader access than required for its job. 

#### 5.6.1 User privileges
RBAC maps product roles such as AE, SDR, Sales Manager, VP Sales, CRO, RevOps, and Tenant Admin to clearly bounded permissions. Reps should not see unrelated tenant data, and admin settings should not be available to standard users. 

#### 5.6.2 Service privileges
Doppler tokens are scoped per service and per environment. For example, the NestJS API should not be able to read every secret owned by AI services, and non-production services should not inherit production credentials. 

#### 5.6.3 Integration privileges
OAuth integrations must request the smallest workable scope. CRM, Gmail, Outlook, and meeting integrations should not ask for broad write permissions unless the feature explicitly requires them. Warehouse export credentials are customer-owned and limited to export use cases. 

#### 5.6.4 Data privileges
Only data needed for a workflow should be exposed to that workflow. The platform already distinguishes raw audio, transcripts, structured insights, analytics exports, and customer-owned warehouse syncs. This supports minimization and reduces unnecessary exposure. 

#### 5.6.5 Operational privileges
Production admin interfaces such as Bull Board and Swagger are not public convenience tools. They are Cloudflare Access-protected and limited to authorized Relanto.ai users and approved IPs. 

---

### 5.7 Zero Trust Considerations

The platform does not implement a branded “full enterprise zero trust platform,” but many of its practical controls follow **zero-trust principles**: never trust by location alone, always verify identity and request context, and assume compromise is possible. 

Key zero-trust-aligned practices include:
- The browser is always treated as untrusted; sensitive logic stays server-side. 
- Webhooks are treated as hostile until signature verification succeeds. 
- Internal services are not trusted simply because they are internal; they use defined contracts, health checks, and internal secret-based access patterns where required. 
- Database trust is reduced by RLS so application mistakes do not automatically become tenant-data breaches. 
- Managed providers are used, but the platform still adds its own controls such as field encryption, secret rotation, role enforcement, and audit logging. 
- AI outputs are not inherently trusted; confidence gating and human review remain part of the control model. 

Zero trust in this document should be interpreted as an **operating mindset**:
- verify every request,
- scope every permission,
- isolate every tenant,
- log every critical action,
- and never rely on one control alone. 

---

## 6. Assets and Data Classification

### 6.1 Classification Model

R-Revenue Intelligence uses a four-level classification model so engineers, QA, DevOps, and support staff can make consistent security decisions. The classification level determines storage rules, transmission rules, logging restrictions, and access controls. 

| Classification | Meaning | Examples | Handling Rule |
|----------------|---------|----------|---------------|
| **Public** | Safe for public disclosure | Marketing copy, public docs, non-sensitive product metadata  | No special restrictions beyond integrity controls |
| **Internal** | Internal company data, low sensitivity | Architecture notes, non-sensitive operational docs, synthetic test data  | Internal access only; not for public sharing |
| **Confidential** | Sensitive tenant or business data | Transcripts, CRM-linked records, analytics exports, operational logs with tenant context  | Access only to authorized users and services; encrypted in transit and at rest |
| **Restricted** | Highest sensitivity; compromise has severe impact | OAuth credentials, API keys, field encryption keys, warehouse credentials, refresh tokens, raw audio, deletion/export bundles  | Strongest controls: encryption, least privilege, redaction, tight auditability, no casual access |

---

### 6.2 Critical Assets

The following are considered **critical platform assets** because compromise would directly impact confidentiality, integrity, availability, or tenant trust. 

| Asset | Why It Is Critical | Classification |
|-------|--------------------|----------------|
| Customer conversation transcripts | Core product data and source for downstream AI insights  | Confidential |
| Raw call recordings / meeting audio | Highly sensitive content and privacy-sensitive media  | Restricted |
| CRM-linked account, contact, opportunity, and deal data | Revenue-critical tenant business context  | Confidential |
| OAuth credentials and integration tokens | Can grant direct access to external customer systems  | Restricted |
| JWT signing / auth secrets and session tokens | Control user identity and session trust  | Restricted |
| Field encryption key | Protects encrypted credential fields in PostgreSQL  | Restricted |
| Data export connector configs | Can expose customer warehouse destinations and access paths  | Restricted |
| AI-generated summaries, briefs, scores, trackers | User-facing derived intelligence that can influence workflow decisions  | Confidential |
| Audit logs and admin action logs | Needed for forensics, accountability, and incident response  | Confidential |
| Queue payloads and async job metadata | Drive internal processing and can contain sensitive references  | Confidential |

---

### 6.3 Sensitive Business Data

Sensitive business data includes any tenant-owned information that reveals pipeline health, buyer intent, customer objections, execution gaps, forecast assumptions, or internal sales strategy. This category is broader than classic PII and must be protected even when no personal identifier is present. 

Examples include:
- Deal stage history and forecast submissions. 
- Objection signals, pricing discussions, next steps, and call scores extracted from conversations. 
- Account briefs, deal briefs, coaching outputs, and rep performance trends. 
- Customer-specific analytics exports delivered through Data Cloud connectors. 
- Email content and thread context used to generate drafts or workflow recommendations. 

Classification rule:
- Default to **Confidential**.
- Upgrade to **Restricted** if the data package also contains credentials, export bundles, raw audio, or legal/compliance records. 

---

### 6.4 PII Categories

The platform processes multiple forms of PII because it works with calls, meetings, emails, CRM records, and user accounts. PII handling must align with GDPR and CCPA obligations already referenced by the architecture. 

PII categories include:
- **Identity data:** Name, email address, job title, company role, internal user ID, external CRM contact ID. 
- **Communication data:** Email content, call transcripts, meeting metadata, calendar event metadata. 
- **Behavioral and operational data:** Login history, session metadata, product usage events, role assignments, export requests. 
- **Voice-derived data:** Audio recordings and speaker-segmented transcript data. 
- **Potential inferred sensitive data:** Sentiment, objection patterns, confidence scores, risk flags, or role inferences generated by AI. 

Handling rule:
- All PII is at least **Confidential**.
- Raw audio and identity-linked export bundles are **Restricted**. 

---

### 6.5 Authentication Secrets

Authentication and identity-related secrets are among the most sensitive assets in the platform. The architecture uses Supabase Auth and explicitly separates access tokens, refresh tokens, and internal auth secrets. 

Examples:
- `SUPABASE_JWT_SECRET`
- Supabase service role key
- Access tokens issued to frontend sessions
- Refresh tokens stored in httpOnly secure cookies
- Session invalidation and token rotation metadata
- Internal service shared secrets used for service-to-service protection where applicable 

Handling rules:
- Never log token values.
- Never store access tokens in localStorage or sessionStorage.
- Refresh tokens must remain in httpOnly secure cookies.
- **Refresh Token Rotation (RTR)** must be implemented: a new refresh token is issued on every use, invalidating the old one. 
- **Absolute Session Lifetime** must be enforced (e.g., 7 days maximum) regardless of activity to prevent session hijacking. 
- Rotation and revocation events must be supported.
- All such assets are **Restricted**. 

---

### 6.6 API Keys and Tokens

The platform depends on multiple external services and therefore stores several kinds of machine credentials. The tooling inventory and architecture explicitly list these secrets under Doppler-managed configuration. 

Examples include:
- `OPENAI_API_KEY`
- `ASSEMBLYAI_API_KEY`
- CRM client IDs and client secrets
- Google OAuth client credentials
- Microsoft OAuth client credentials
- Webhook secrets for Zoom, Teams, and Google Meet
- Meilisearch master key
- ClickHouse credentials
- Redis URL with auth
- Database URL
- Sentry DSN
- Better Stack source token
- `INTERNAL_SERVICE_SECRET` 

Classification:
- All provider secrets, OAuth secrets, and system credentials are **Restricted**. 

Control expectations:
- Stored only in Doppler or approved managed secret stores.
- Scoped per service and environment.
- Rotated on compromise and on defined cadence where applicable.
- Never embedded in frontend bundles or public config. 

---

### 6.7 Logs and Audit Data

Logs and audit records are essential operational assets, but they can also become a data-leak channel if not handled correctly. The architecture explicitly uses Better Stack for logs and Sentry for exception tracking. 

Types of log and audit data:
- Application logs from frontend, NestJS, AI services, and workers. 
- Security event logs such as failed login attempts, admin actions, webhook verification failures, and permission denials. 
- Audit logs for user management, integration configuration, export requests, deletion requests, and support access. 
- Queue and event logs for job retries, DLQ movement, and event processing state. 

Classification rules:
- Generic infrastructure health logs without tenant detail can be **Internal**.
- Logs containing tenant IDs, user IDs, endpoint metadata, or workflow traces are **Confidential**.
- Any log that accidentally captures secrets, tokens, or raw sensitive payloads becomes an immediate security incident and must be purged and rotated where required. 

Logging rules:
- Never log secrets or raw tokens.
- Redact PII before sending data to Sentry or centralized logging.
- Use structured logs to reduce accidental oversharing and improve investigation quality. 

---

### 6.8 AI-Generated Outputs

AI outputs are a distinct data class because they are derived from sensitive inputs and may influence sales decisions, CRM updates, or performance reviews. The architecture treats AI outputs as governed artifacts rather than casual text blobs. 

Examples:
- Call summaries
- Deal briefs
- Account briefs
- Natural language answers from retrieval workflows
- Tracker detections
- Theme and topic labels
- Scorecards and coaching outputs
- Suggested CRM fields and next steps
- Generated email drafts 

Classification:
- Default classification is **Confidential** because these outputs are tenant-owned, business-sensitive, and often derived from confidential source data. 
- Upgrade to **Restricted** if the output package contains embedded raw content excerpts, regulated content, or is bundled for external export. 

Governance rules:
- Low-confidence outputs must be flagged for review.
- High-risk outputs should not auto-write to CRM without a control point.
- Outputs must remain tenant-scoped and access-controlled like source data. 

---

### 6.9 Data Classification Rules by Asset Type

| Asset Type | Default Classification | Notes |
|------------|------------------------|-------|
| Public marketing or public documentation | Public  | No tenant data |
| Internal engineering docs, synthetic test fixtures | Internal  | Must not contain live customer data |
| Transcripts, CRM-linked records, analytics signals | Confidential  | Core tenant business data |
| AI summaries, tracker outputs, rep insights | Confidential  | Derived but still tenant-sensitive |
| Audit logs with user or tenant context | Confidential  | Needed for accountability |
| Raw audio recordings | Restricted  | Sensitive voice data |
| OAuth secrets, API keys, encryption keys | Restricted  | Credential compromise risk |
| Export bundles and warehouse connector config | Restricted  | Can expose large data sets or downstream systems |
| Refresh tokens, session secrets, service-role secrets | Restricted  | Identity compromise risk |

Classification enforcement rules:
- When in doubt, classify upward.
- Derived data inherits the minimum sensitivity of its most sensitive source unless explicitly transformed and approved otherwise.
- Test data must never quietly become “less sensitive” if it was copied from real tenant data. 

---

## 7. Threat Model

### 7.1 Threat Modeling Approach

The platform uses a pragmatic, architecture-driven threat modeling approach focused on **assets, trust boundaries, entry points, abuse cases, and blast radius**. This is more useful for the team than a purely academic model because the system has many integration points, async workflows, and external providers. 

The threat model is built around:
1. Identify critical assets.
2. Identify trust boundaries and exposed entry points.
3. Identify likely threat actors.
4. Identify abuse paths and failure scenarios.
5. Rank threats by impact and likelihood.
6. Map each high-priority threat to one or more concrete controls. 

This threat model must be revisited when:
- a new integration is added,
- a new public endpoint is introduced,
- a new AI provider or data export path is added,
- a major infrastructure migration happens,
- or a real incident reveals a missed risk. 

---

### 7.2 Assumptions

The threat model is based on the following assumptions:

- Public internet traffic is untrusted by default. 
- Browser-side code and user-controlled input are untrusted. 
- Managed providers are useful but not perfect; additional platform controls are still required. 
- Webhook sources can be spoofed or replayed unless cryptographically verified. 
- Application-layer bugs are possible; therefore database-layer RLS must remain in place. 
- External AI providers may be unavailable, rate-limited, or return low-quality output; product safety must not depend on perfect model behavior. 
- Engineers can make mistakes; therefore CI gates, code review, secret scanning, and structured operational controls are mandatory. 
- Tenants are mutually untrusted from a data-isolation perspective. One tenant must never be able to infer or access another tenant’s data. 

---

### 7.3 Threat Actors

The platform’s threat model considers both malicious and accidental actors. 

| Threat Actor | Description | Typical Goal |
|-------------|-------------|--------------|
| External attacker | Internet-based attacker probing public endpoints, auth flows, or webhook routes  | Account takeover, API abuse, data exfiltration, service disruption |
| Malicious tenant user | Authorized user within one tenant abusing access or trying cross-tenant access  | Data theft, privilege escalation, unauthorized export |
| Compromised integration source | External system or webhook source sending forged or replayed events  | Queue flooding, fake ingestion, downstream corruption |
| Insider with excessive access | Internal operator or support user with more access than necessary  | Unauthorized support access, accidental leakage |
| Credential thief | Actor who obtains OAuth token, API key, or refresh token  | Impersonation, unauthorized sync, provider abuse |
| Bot / automated scraper | High-volume automated traffic source  | Auth brute force, endpoint abuse, cost amplification |
| Unreliable external provider | AI, CRM, email, or infra dependency failing or degrading  | Indirect integrity or availability failure |
| Negligent internal developer | Non-malicious but risky engineering behavior  | Secret leakage, weak logging hygiene, bypassed controls |

---

### 7.4 Abuse Cases

Important abuse cases for this platform include:

- A tenant user attempts to access another tenant’s transcript or deal data by modifying IDs in API requests. 
- An attacker floods webhook endpoints with forged meeting events to trigger queue overload and unnecessary processing cost. 
- A stolen CRM OAuth token is used to read or modify customer CRM records outside intended workflows. 
- A leaked OpenAI or AssemblyAI key is used to generate external cost or infer platform behavior. 
- A support engineer uses standing access instead of audited break-glass access to inspect tenant data. 
- A low-confidence AI output is auto-written into CRM and damages data integrity or user trust. 
- A bad deployment weakens RLS or tenant scoping and creates accidental cross-tenant exposure. 
- A public admin surface such as Swagger or Bull Board is exposed without Cloudflare Access controls. 
- A data export connector is misconfigured and writes tenant data to the wrong external destination. 
- Logs accidentally capture secrets, refresh tokens, or sensitive prompt payloads. 

---

### 7.5 Entry Points

The main entry points considered by the threat model are:

- Public web application routes served by the frontend. 
- Public API endpoints on the NestJS API domain. 
- Authentication endpoints including sign-in, sign-out, token refresh, and OAuth callback flows. 
- Webhook endpoints for Zoom, Teams, Google Meet, and similar integrations. 
- File upload or recording ingestion paths. 
- Admin endpoints and internal operational interfaces. 
- Outbound integration calls that can become data-exfiltration channels if credentials are compromised. 
- CI/CD pipeline and secrets delivery pipeline as privileged operational paths. 

---

### 7.6 Trust Boundary Violations

The threat model pays special attention to **trust boundary violations**, because many severe incidents happen when data crosses a boundary without proper verification. 

Key boundary-violation scenarios include:
- Public request crossing into protected API paths without valid auth.
- Webhook payload crossing into business logic without HMAC verification.
- Tenant context crossing from application layer into database queries incorrectly.
- Internal service request reaching AI services without internal authorization checks.
- Sensitive prompt or transcript data crossing into third-party providers without appropriate controls.
- Export data crossing from platform storage into customer warehouses with wrong tenant mapping.
- Log data crossing into observability platforms without redaction. 

The control philosophy is simple:
- every boundary crossing must have a verification step,
- every privileged action must be attributable,
- and every high-risk path must fail closed where possible. 

---

### 7.7 Top Platform Threats

The highest-priority platform threats are:

| Threat | Why It Matters | Primary Controls |
|--------|----------------|------------------|
| Cross-tenant data exposure | This is the most severe trust-breaking event in a multi-tenant SaaS platform.  | JWT guard, tenant interceptor, Prisma scoping, PostgreSQL RLS, automated tenancy tests  |
| Account takeover / session abuse | Exposes tenant data and admin capabilities.  | Supabase Auth, httpOnly refresh cookies, session rotation, failed login lockout, RBAC  |
| Webhook forgery or replay | Can trigger false ingestion, queue overload, or data corruption.  | HMAC verification, replay checks, idempotency, Cloudflare rate limiting  |
| Secret leakage | Enables provider abuse, external access, or downstream compromise.  | Doppler, secret scanning, no-secret-in-code rule, rotation workflows  |
| Unauthorized admin interface exposure | Can reveal docs, queue state, or internal operations.  | Cloudflare Access, IP allowlists, SSO gating  |
| AI output integrity failure | Can silently damage CRM data or user trust.  | Structured outputs, confidence gating, human review, async control flow  |
| Export path misrouting or overexposure | Large-scale tenant data leak risk.  | Tenant-scoped export jobs, encrypted connector config, connector governance  |
| Queue and async processing abuse | Can degrade availability and amplify cost.  | BullMQ isolation, DLQ, rate limits, monitored queue depth, idempotent workers  |
| Dependency or supply-chain vulnerability | Affects all layers quickly in a fast-moving stack.  | Dependabot, CI checks, vulnerability remediation SLAs  |

---

### 7.8 Threat Prioritization Method

Threats are prioritized using a simple engineering-friendly model based on:
- **Impact** — data loss, tenant breach, downtime, regulatory impact, cost impact.
- **Likelihood** — how exposed the path is, how common the failure mode is, how easy the attack is.
- **Detectability** — how quickly the issue would be noticed if it occurred.
- **Blast radius** — one user, one tenant, many tenants, or whole platform. 

Priority guidance:
- **Critical:** Cross-tenant exposure, auth bypass, major secret compromise, export misrouting of tenant data.
- **High:** Webhook forgery, admin surface exposure, OAuth token misuse, severe queue abuse.
- **Medium:** Logging oversharing, non-critical dependency CVEs, low-risk automation misuse.
- **Low:** Internal documentation exposure without tenant data, non-sensitive metadata leakage. 

A threat is considered **architecturally blocking** if:
- it can impact more than one tenant,
- it weakens a foundational security control,
- or it creates a regulatory or contractual breach path. 

---

## 8. Attack Surface Analysis

### 8.1 Overview

The platform has a moderate but meaningful attack surface because it combines:
- browser-based product access,
- public APIs,
- OAuth-based integrations,
- webhook ingestion,
- file and media handling,
- internal AI services,
- and outbound export capabilities. 

The design goal is not to eliminate all exposure — that is impossible in an integration-heavy SaaS platform — but to minimize exposed surfaces, harden unavoidable ones, and keep the highest-risk systems off the public internet wherever possible. 

---

### 8.2 Public Endpoints

Publicly reachable endpoints include the web application domain and approved API routes behind Cloudflare. These endpoints are the first line of attack for anonymous probing, auth abuse, and scraping. 

Public endpoint categories:
- Frontend application routes
- Public health checks where explicitly allowed
- Authentication endpoints
- OAuth callback endpoints
- Webhook endpoints
- Minimal public status or readiness routes 

Security controls:
- Cloudflare TLS termination and HTTPS enforcement
- WAF and bot filtering
- Outer IP-based rate limiting
- Minimal number of public unauthenticated routes
- JWT required on all protected APIs 

---

### 8.3 Auth Endpoints

Authentication endpoints are high-value targets because they control session establishment and token refresh. The architecture explicitly uses Supabase Auth, access tokens in memory, refresh tokens in httpOnly cookies, and lockout/rate-limiting rules. 

Attack surface includes:
- Sign-in
- Sign-out
- Token refresh
- OAuth initiation and callback flows
- Password reset or invitation flows if enabled 

Primary threats:
- Brute-force login attempts
- Token theft
- Session fixation
- CSRF attempts against refresh flow
- OAuth misconfiguration 

Primary controls:
- httpOnly secure refresh cookie
- SameSite=Strict
- access token stored in memory only
- failed login lockout after repeated failures
- HTTPS-only transport
- strict route protection and RBAC after authentication 

---

### 8.4 Webhook Endpoints

Webhook endpoints are one of the most sensitive public entry points because they are machine-to-machine, often high-volume, and easy to target if not well protected. The architecture explicitly calls conferencing and recording webhooks mission-critical. 

Webhook surfaces include:
- Zoom
- Microsoft Teams
- Google Meet
- Potential future telephony or recording provider callbacks 

Threats:
- Forged payloads
- Replay attacks
- Queue flooding
- Abuse of unauthenticated processing paths
- Duplicate event storms 

Required protections:
- HMAC-SHA256 signature verification
- timestamp validation
- idempotent event handling
- Cloudflare outer rate limiting
- queue-based ingestion, not synchronous heavy processing
- rejection/error monitoring 

---

### 8.5 Admin Interfaces

Admin and operational interfaces are a very small but high-impact attack surface. Examples include Swagger documentation, Bull Board queue UI, and any tenant or support admin consoles. The architecture says production admin surfaces must be Cloudflare Access-protected and limited to approved users and IPs. 

Threats:
- accidental public exposure
- stolen admin identity
- support misuse
- information disclosure through operational dashboards 

Controls:
- Cloudflare Access
- Google SSO for internal users
- IP allowlisting for restricted admin paths
- audit logging of admin actions
- no standing anonymous access in production 

---

### 8.6 Internal Service APIs

Internal service APIs include the FastAPI AI services and transcription service. These are intentionally separated from the public product API and should never be directly internet-exposed. 

Surface characteristics:
- Internal-only endpoints such as summarize, answer-query, embed, score-call, and transcription processing. 
- Called by NestJS over the internal Docker network. 
- Protected by network isolation and internal service secret patterns where required. 

Threats:
- accidental public exposure during deployment
- weak service authentication
- oversized payload abuse from internal callers
- unsafe contract drift between services 

Controls:
- no public DNS exposure
- internal-only networking
- strict contract validation
- timeout and payload limits
- health checks and observability
- approved single ingress from product services only 

---

### 8.7 File Upload Paths

The platform handles large artifacts such as recordings, uploaded files, and export bundles, so file-related paths must be treated as risky. The architecture already separates large files from the main relational database and uses storage services for binary artifacts. 

Threats:
- oversized upload abuse
- malformed media files
- malware in uploaded artifacts
- path traversal logic bugs
- storage bucket overexposure
- retention failures for sensitive audio 

Controls expected:
- file size limits
- MIME and extension validation
- storage outside PostgreSQL
- private-by-default object access
- retention enforcement for raw audio
- no direct public write access to storage buckets 

---

### 8.8 CRM Integration Paths

CRM integrations are a major outward-facing attack surface because they combine tenant authorization, external API trust, and write-back capability. Supported CRM paths include Salesforce, HubSpot, and Microsoft Dynamics 365. 

Threats:
- stolen OAuth credentials
- excessive OAuth scopes
- misrouted tenant sync
- replayed or duplicated sync operations
- data integrity issues from incorrect write-back 

Controls:
- OAuth 2.0 authorization code flows
- encrypted credential storage
- tenant-scoped integration records
- audit logs for sync operations
- idempotent write-back patterns
- least-privilege scopes 

---

### 8.9 Email Integration Paths

Email integration paths cover Gmail and Outlook/Office 365 workflows used for draft generation, send support, or message context ingestion. Because email contains rich business and personal data, this surface is high sensitivity. 

Threats:
- over-broad mailbox access
- accidental processing of sensitive email content
- unauthorized draft/send actions
- token theft
- data leakage through prompt construction or logging 

Controls:
- tenant-scoped OAuth
- minimum required scopes
- encrypted token storage
- strict backend-only provider interaction
- prompt hygiene and redaction rules where applicable
- auditability for send-related actions 

---

### 8.10 Meeting and Telephony Integrations

Meeting and telephony integrations are critical ingestion surfaces because they deliver metadata, recordings, and event notifications that trigger downstream workflows. These include Zoom, Google Meet, Microsoft Teams, and future dialer or telephony connectors. 

Threats:
- spoofed event notifications
- ingestion floods
- attachment or recording abuse
- incorrect tenant association
- processing of calls without valid consent or compliance policy 

Controls:
- HMAC-verified webhooks
- queue-based processing
- compliance setting enforcement
- tenant-aware entity linking through Revenue Graph
- auditability of recording ingestion decisions 

---

### 8.11 AI Service Exposure

AI services are deliberately not part of the public attack surface, but they remain a sensitive internal surface because they process transcripts, prompts, embeddings, and retrieval inputs. 

Threats:
- accidental public exposure
- prompt injection through untrusted user text
- oversized prompt payloads
- low-confidence output misuse
- provider outage or fallback confusion
- leaking sensitive context to third-party providers beyond approved scope 

Controls:
- internal-only service exposure
- prompt and payload discipline
- LiteLLM central routing
- structured outputs
- confidence gating
- human review for flagged outputs
- no direct AI provider calls from frontend or product TypeScript services 

---

### 8.12 Data Export Interfaces

Data export is one of the highest-sensitivity outward paths because it can move large tenant-owned datasets into customer-owned warehouses. The tooling inventory explicitly treats Data Cloud export and warehouse connectors as high-sensitivity integration surfaces. 

Surfaces include:
- `GET /api/v1/admin/data-export`
- warehouse connector configuration
- export jobs to Snowflake, BigQuery, Databricks, Amazon S3/Redshift-style targets
- deletion/export bundle generation 

Threats:
- unauthorized bulk export
- export to wrong destination
- leaked connector credentials
- excessive privilege on warehouse destination
- incomplete audit trail for compliance-related exports 

Controls:
- admin-only and tenant-scoped authorization
- encrypted warehouse credentials
- connector governance and approval
- audit logs for all export requests
- export job isolation and observability
- explicit ownership that exported data is tenant-owned and destination-controlled by the customer 

---

## 9. Identity and Authentication

### 9.1 Identity Providers

R-Revenue Intelligence uses **Supabase Auth** as the primary identity provider for user authentication, session issuance, refresh-token rotation, and OAuth exchange. NestJS does not store passwords, sign tokens, or implement identity flows directly; it delegates those responsibilities to Supabase Auth and validates the resulting JWTs on every protected request. This keeps identity management centralized and reduces the risk of implementing custom auth incorrectly. 

The supported identity methods are:
- **Email + password** for standard sign-in. Password storage and hashing are handled by Supabase Auth. 
- **OAuth with Google and Microsoft** for tenant users who prefer enterprise identity or delegated login flows. Supabase performs the token exchange and session issuance. 
- **Magic-link style login**, if enabled later, must still remain under Supabase Auth governance rather than a custom in-app identity implementation. 

Identity design rules:
- NestJS is a **consumer of verified identity**, not the owner of password storage. 
- JWTs are treated as the canonical proof of identity for API requests. 
- The mapping from identity to platform authorization is performed by looking up the active user record and tenant context in the application database after authentication succeeds. 

---

### 9.2 User Authentication Flow

The user authentication flow is intentionally simple and secure so even new engineers can follow it correctly. The flow is:

1. The user submits credentials to `POST /api/v1/auth/signin`. 
2. NestJS forwards the credential verification request to Supabase Auth using the approved auth client. 
3. If authentication succeeds, Supabase returns an **access token** and **refresh token**. 
4. NestJS resolves the authenticated user’s `tenantId`, `userId`, and `role` from the platform database using the Supabase user identity. 
5. NestJS returns:
   - the **access token** in the response body for in-memory storage,
   - and the **refresh token** in a `HttpOnly`, `Secure`, `SameSite=Strict` cookie. 
6. On future requests, the frontend sends the access token in the `Authorization: Bearer <token>` header. 

Authentication request handling rules:
- Every request except explicitly public routes must pass JWT validation. 
- If the access token is expired, the backend returns `401 TOKEN_EXPIRED`, and the frontend triggers the refresh flow rather than forcing immediate logout. 
- If the token is invalid or the session is revoked, the user is redirected back to login. 

This model keeps the user experience smooth while reducing exposure to XSS token theft because the long-lived refresh token is never readable by JavaScript. 

---

### 9.3 OAuth Flows

OAuth is used for two distinct categories of identity and access:

#### 9.3.1 User login OAuth
Supabase Auth supports **Google** and **Microsoft** OAuth sign-in for user identity. In this flow:
- the user is redirected to the provider,
- the provider authenticates the user,
- Supabase completes the token exchange,
- and the application receives the resulting session material from Supabase. 

#### 9.3.2 Integration OAuth
Separate OAuth flows are used for tenant-level integrations such as:
- Salesforce,
- HubSpot,
- Microsoft Dynamics 365,
- Gmail,
- Outlook / Office 365,
- and meeting platforms where applicable. 

Important distinction:
- **User login OAuth** proves who the human user is. 
- **Integration OAuth** grants the platform limited access to an external tenant-owned system. 

OAuth security rules:
- Use the **authorization code flow** for all production-grade integrations. 
- Request only the **minimum scopes** required for the actual feature. 
- Store client secrets and integration tokens only in approved secure stores, never in frontend code or source control. 
- Treat integration OAuth credentials as **Restricted** data because they can grant access to third-party customer systems. 

---

### 9.4 Session Model

The platform uses a **split session model**:
- a short-lived **access token** for API access,
- and a longer-lived **refresh token** for silent session renewal. 

This model exists for one reason: it reduces the blast radius of token theft without forcing users to sign in repeatedly during a normal working session. 

Session design characteristics:
- **Access token**: used on every protected API call; short lifetime; stored only in memory. 
- **Refresh token**: used only to obtain a new access token; stored only in a `HttpOnly` secure cookie; invisible to JavaScript. 
- **Role and tenant context** are resolved and enforced server-side when the request is processed. 

Session rules:
- The frontend must never rely on localStorage or sessionStorage for durable auth state. 
- A page refresh clears the in-memory access token, after which the frontend silently uses the refresh token to restore the session if still valid. 
- The refresh token is single-use and rotates on each refresh, so replay of an old refresh token should fail. 

---

### 9.5 Access Tokens

Access tokens are JWTs issued by Supabase Auth and sent in the `Authorization` header as Bearer tokens for protected API calls. They are short-lived by design and should be treated as ephemeral proof of user identity. 

Rules for access tokens:
- Storage location: **in memory only**. 
- Never store in:
  - `localStorage`,
  - `sessionStorage`,
  - non-httpOnly cookies,
  - URL query strings,
  - logs or error payloads. 
- Used for:
  - route authentication,
  - role and tenant context bootstrap,
  - protected module access. 

Why memory-only matters:
- JavaScript-readable browser storage is accessible to injected scripts during an XSS incident.
- A memory-only token disappears on page refresh and is therefore harder to persistently steal. 

Operational rule:
- Any PR that stores access tokens in browser storage must be rejected immediately as a security violation. 

---

### 9.6 Refresh Tokens

Refresh tokens are long-lived session credentials used only to obtain a fresh access token without forcing the user to log in again. In this platform, refresh tokens are stored only in a `HttpOnly`, `Secure`, `SameSite=Strict` cookie. 

Refresh flow:
1. The frontend receives `401 TOKEN_EXPIRED` from a protected API. 
2. The frontend sends `POST /api/v1/auth/refresh`; the browser automatically includes the refresh cookie. 
3. NestJS reads the refresh token from the cookie and forwards it to Supabase Auth. 
4. Supabase validates the token and returns a new access token, and rotates the refresh token. 
5. The frontend stores the new access token in memory and retries the original request. 

Refresh-token rules:
- **Single-use rotation** is mandatory. Every successful refresh invalidates the old refresh token. 
- Refresh tokens must never be accepted from the request body or query params. They come only from the secure cookie. 
- Refresh tokens are inaccessible to JavaScript, which reduces XSS-based exfiltration risk. 
- SameSite=Strict reduces CSRF risk against the refresh endpoint. 

---

### 9.7 Token Expiry Rules

The architecture defines the following token lifetimes:

| Token | Issued By | Lifetime | Storage |
|------|-----------|----------|---------|
| Access token | Supabase Auth  | 1 hour  | In-memory only  |
| Refresh token | Supabase Auth  | 30 days  | `HttpOnly`, `Secure`, `SameSite=Strict` cookie  |

Expiry design rationale:
- **1 hour access token lifetime** limits the window for misuse if an access token is stolen. 
- **30 day refresh token lifetime** balances usability and security, while single-use rotation reduces replay risk. 

Rules:
- Expiry values are centrally configured in Supabase Auth settings, not hardcoded in the frontend. 
- Any future change to token TTLs must be reviewed for its impact on user experience, support burden, and incident blast radius. 

---

### 9.8 Session Invalidation

Session invalidation must be immediate for refresh-token-based continuity and practical for access-token-based exposure. The platform uses the following model:

- `POST /api/v1/auth/signout` calls Supabase Auth sign-out and revokes the refresh token server-side immediately. 
- Existing access tokens remain short-lived and expire naturally because server-side access-token revocation is not the primary mechanism in this architecture. 
- If a refresh attempt fails because the refresh token was revoked, expired, or rotated away, the frontend must clear in-memory session state and redirect the user to login. 

Operational triggers for session invalidation include:
- User sign-out. 
- Account deactivation. 
- Password reset or forced re-authentication event. 
- Suspected session compromise. 
- Admin-enforced account or tenant offboarding actions. 

Rule:
- Session invalidation logic must fail safe. If session state is ambiguous or refresh fails unexpectedly, the system must force re-authentication rather than guessing. 

---

### 9.9 Failed Login Protections

The platform explicitly enables brute-force protection on login flows through Supabase Auth configuration. The documented rule is:

- **5 consecutive failed login attempts**
- followed by a **15-minute account lockout**. 

This lockout exists to reduce credential-stuffing and password-guessing attacks. It must remain enabled in all production environments. 

Additional protections:
- HTTPS is enforced on all endpoints through Cloudflare redirect behavior. 
- Access tokens are not persisted in browser storage, reducing damage from browser compromise. 
- Protected routes require valid JWTs on every request. 
- Rate limiting exists at both Cloudflare and application layers to reduce high-volume abuse. 

Engineering rule:
- Do not build custom login retry logic in the frontend that hides or bypasses account lockout behavior. The security control must remain visible and effective. 

---

### 9.10 SSO Considerations

The current architecture already supports enterprise-friendly identity patterns through Google and Microsoft OAuth under Supabase Auth. This gives a practical path toward SSO-style onboarding without building a separate enterprise identity stack in Phase 1. 

SSO considerations for current and future states:
- Google and Microsoft OAuth already cover common business identity providers for many tenants. 
- Tenant-specific enterprise SSO extensions must still preserve the same downstream model: Supabase issues the verified session, NestJS validates JWTs, and application RBAC remains unchanged. 
- Future SSO enhancements must not bypass tenant and role resolution in the application database. Identity proof alone is not enough; the platform still needs an active user, role, and tenant mapping. 

SSO design rule:
- Even if enterprise SSO expands later, the platform should keep one authorization model after identity resolution:
  - authenticate with the identity provider,
  - map to platform user and tenant,
  - enforce RBAC and tenant controls server-side. 

---

## 10. Authorization and Access Control

### 10.1 RBAC Model

R-Revenue Intelligence uses **Role-Based Access Control (RBAC)** at the API layer to decide which users may reach which endpoints. Every protected endpoint must declare its allowed roles, and the NestJS RBAC guard checks those roles before the route handler executes. 

RBAC is not the same as data scoping:
- RBAC answers: **Can this role call this endpoint at all?** 
- Data scoping answers: **Which records is this user allowed to see within that endpoint?** 

Both are mandatory. RBAC without record scoping is not enough, and record scoping without RBAC leads to unclear and unsafe APIs. 

---

### 10.2 Permission Boundaries

Permission boundaries exist at multiple levels:

1. **Route boundary** — enforced by JWT guard + RBAC guard. 
2. **Record boundary** — enforced in services using owner/team/tenant rules. 
3. **Tenant boundary** — enforced by tenant interceptor, Prisma scoping, and PostgreSQL RLS. 
4. **Operational boundary** — admin interfaces and support tools are separately restricted with Cloudflare Access and internal controls. 

This means a user may:
- be allowed to open a module,
- but still be blocked from a specific record,
- and even if a service bug occurs, the database must still reject cross-tenant access. 

Permission design rule:
- Never rely on a single permission layer for a sensitive workflow. 

---

### 10.3 Role Definitions

The architecture defines the following core platform roles:

| Role | Description | Access Shape |
|------|-------------|--------------|
| **AE** | Account Executive  | Own deals, own calls, own emails, own tasks  |
| **SDR** | Sales Development Representative  | Own outreach tasks and own email flows; limited shared account/contact visibility where applicable  |
| **Manager** | Sales Manager  | Team-level access to calls, deals, coaching, and forecast views for direct reports  |
| **RevOps** | Revenue Operations  | Broad tenant-level operational access: integrations, play config, compliance, workflow controls  |
| **Admin** | Tenant administrator  | All RevOps access plus user management and billing/admin controls  |

The broader business context also includes VP Sales and CRO usage patterns in the architecture, but the main API enforcement examples center around AE, SDR, Manager, RevOps, and Admin. Any extension of role vocabulary must be documented centrally rather than introduced ad hoc in one module. 

---

### 10.4 Module-Level Access

Each module exposes its own API prefix and access policy. Module separation is part of the architecture and is important for both maintainability and security. The canonical API prefixes are defined centrally and no module may create endpoints under another module’s prefix. 

Examples of module-level access patterns:
- **Deal Management** endpoints are typically available to AE, Manager, RevOps, and Admin. 
- **Performance Coaching team views** are typically restricted to Manager, RevOps, and Admin. 
- **Execution play configuration** is typically restricted to RevOps and Admin. 
- **Admin user management** is restricted to Admin. 

Module access rules:
- Route access must be explicit via a roles decorator. 
- Shared modules do not mean shared permissions. Each endpoint still needs a defined allowed-role list. 
- Public endpoints are the exception and must be minimal, such as health checks and specific auth routes. 

---

### 10.5 Admin-Only Operations

Admin-only operations are those that can materially affect tenant configuration, user access, billing, integration credentials, export scope, or compliance behavior. These operations must be restricted to the highest-trust tenant roles and fully audit-logged. 

Admin-only examples include:
- user creation and user management under `/api/v1/admin/users`. 
- tenant-level billing and plan management. 
- integration credential setup and rotation. 
- compliance settings management where legal or privacy effects are involved. 
- data export and deletion administration. 

Rules:
- Admin-only operations must never be reachable by AE or SDR roles. 
- If an operation changes security posture, access scope, compliance posture, or integration credentials, default it to Admin or RevOps review rather than broad role access. 

---

### 10.6 Support Access Model

Internal Relanto.ai support access must be **controlled, minimal, time-bound, and auditable**. The platform must not rely on standing unrestricted production access for support workflows. This principle is also reflected in the broader operational and admin access restrictions documented in the architecture and tooling inventory. 

Support access model:
- Default support posture is **no standing tenant-data access**. 
- If support access is required, it must be:
  - tied to a specific support or incident ticket,
  - limited in time,
  - read-only unless an approved exception exists,
  - and fully audit-logged. 

Rules:
- Support access must not bypass tenant boundaries. 
- Support tooling such as Swagger or Bull Board must remain Cloudflare Access-protected and not publicly reachable. 
- Any privileged internal support access must be attributable to a named operator. 

---

### 10.7 Just-in-Time Access

Just-in-time (JIT) access is the preferred model for elevated internal access. Even if the first implementation is lightweight, the operating principle should be:

- no permanent elevated production access unless operationally unavoidable,
- elevation only when needed,
- automatic expiry after the approved time window,
- and mandatory audit trails. 

JIT access applies especially to:
- tenant support investigations,
- production debugging,
- direct database inspection,
- queue or admin console access,
- emergency operational remediation. 

JIT access rule:
- If a task can be done without elevated access, elevated access must not be granted. 
- If elevated access is granted, the time window, approver, reason, and actions taken must be captured. 

---

### 10.8 Least Privilege Enforcement

Least privilege is enforced across user roles, admin operations, services, secrets, and integrations. This is not just a design preference; it is a core platform security requirement. 

Enforcement practices include:
- route-level RBAC decorators on every protected endpoint. 
- service-level record scoping by owner, team, or tenant. 
- tenant-scoped query injection through Prisma middleware. 
- RLS in PostgreSQL as a final tenant guardrail. 
- minimum OAuth scopes for external systems. 
- per-service Doppler secret scoping so one service cannot casually read all secrets. 

Code review rule:
- Any PR that broadens role access, increases OAuth scopes, weakens scoping checks, or bypasses guards requires explicit review from the responsible lead and should be assumed risky until proven otherwise. 

---

### 10.9 Access Review Process

Access review must be treated as an ongoing governance process, not a one-time setup task. The platform’s role model, tenant admin model, and internal privileged surfaces make periodic review necessary. 

Minimum review expectations:
- Tenant admins should periodically review who has Admin, RevOps, and Manager access inside their tenant. 
- Internal teams should review access to:
  - Cloudflare-protected admin surfaces,
  - Doppler environments,
  - GitHub deployment workflows,
  - Supabase dashboards,
  - and production observability tools. 

Recommended review cadence:
- **Quarterly** for privileged internal access and high-sensitivity tenant roles, aligning with the general architecture review cadence. 
- Immediately after:
  - team member role changes,
  - offboarding,
  - incident response,
  - or suspicious access activity. 

Review rule:
- If access ownership is unclear, treat it as a governance failure and resolve ownership before the next release. 

---

## 11. Tenant Isolation

### 11.1 Multi-Tenant Model

The platform uses a **shared PostgreSQL multi-tenant model with Row-Level Security (RLS)**, where all tenant data lives in shared infrastructure but every record is scoped by `tenantId`. This is the approved architecture for Phase 1 and Phase 2 and is explicitly treated as non-negotiable for platform safety. 

Why this model is used:
- It keeps the platform operationally simple early on. 
- It supports modular product growth without managing one database per tenant. 
- It preserves strong data separation when combined with application-layer and database-layer controls. 

Core rule:
- Every data model that stores tenant-owned data must carry tenant context, and every read/write path must respect it. 

---

### 11.2 Tenant Boundary Rules

Tenant boundaries define what may never happen in the platform:
- No tenant may read another tenant’s records. 
- No tenant may write into another tenant’s records. 
- No tenant-scoped job, export, webhook, or AI workflow may operate without a valid tenant context. 
- Tenant identity must never be accepted from untrusted user input such as body or query params when it should come from the authenticated session context. 

Tenant boundary rules:
- `tenantId` must be derived from verified auth/session context, not trusted from the client. 
- If a request lacks tenant context, it must fail. 
- If a background job loses tenant context, it must fail or be quarantined rather than guessing. 

---

### 11.3 Application-Layer Isolation

Application-layer isolation is enforced before any database query returns data. The main controls are:

1. **JWT validation** establishes the authenticated user identity. 
2. **TenantInterceptor** injects verified `tenantId`, `userId`, and role context into the request. 
3. **RBAC guard** checks route permissions. 
4. **Service-layer record scoping** restricts which records within the tenant the user can access, such as own records vs team records. 
5. **Prisma middleware** automatically injects `tenantId` constraints into database operations. 

This layered application isolation protects against common developer mistakes, especially forgetting to add a tenant filter manually. The architecture explicitly says the Prisma middleware is the “last line of defense” at the application layer and must never be disabled or bypassed. 

---

### 11.4 Database-Layer Isolation

Database-layer isolation is provided by PostgreSQL Row-Level Security. This is critical because application code can contain bugs, but the database must still prevent unauthorized cross-tenant record access. 

Database isolation expectations:
- RLS policies must exist for tenant-owned tables. 
- Queries without valid tenant context must not be able to read arbitrary rows. 
- Tenant enforcement must remain independent of route-level logic. 

Why database isolation matters:
- If a service bug forgets to apply a tenant filter, RLS still blocks cross-tenant leakage. 
- If an engineer accidentally widens an API response, the database guard remains a final safety barrier. 

---

### 11.5 RLS Strategy

The platform’s RLS strategy is based on:
- shared database infrastructure,
- row-level policy enforcement by `tenantId`,
- and application context aligned with those policies. 

RLS strategy rules:
- All tenant-owned records must have `tenantId`. 
- All write paths must attach `tenantId` at creation time. 
- RLS policies must restrict access so only rows belonging to the active tenant are visible. 
- Privileged exceptions must be extremely limited and documented. 

Engineering rule:
- No engineer may “temporarily disable” RLS for convenience in production or shared environments. If a workflow struggles with RLS, the workflow must be redesigned properly. 

---

### 11.6 Cross-Tenant Access Prevention

Cross-tenant access prevention is achieved by combining several independent controls:

- JWT-authenticated user identity. 
- Request-scoped tenant injection through TenantInterceptor. 
- Role checks for route access. 
- Service-level ownership/team filtering. 
- Prisma middleware adding tenant-aware query constraints. 
- PostgreSQL RLS enforcing final row visibility. 

Additional cross-tenant prevention rules:
- `tenantId` must not be accepted from frontend request bodies for protected data access. 
- Async jobs must carry tenant context explicitly in job payloads or metadata. 
- Export jobs must remain tenant-scoped from request to final destination. 
- Internal AI calls should include tenant context headers such as `X-Tenant-Id` so downstream processing remains tenant-aware. 

---

### 11.7 Isolation Verification

Tenant isolation must be continuously verified, not assumed. The tooling inventory and architecture both emphasize integration tests, RLS validation scripts, and realistic infrastructure-backed testing for tenant safety. 

Verification methods include:
- integration tests against real PostgreSQL with RLS enabled. 
- API tests that attempt unauthorized cross-tenant record access and expect rejection. 
- Prisma and RLS validation scripts in CI. 
- code review of any changes touching auth middleware, tenant interceptors, Prisma middleware, or RLS policies. 

Release rule:
- A change that weakens tenant isolation or bypasses its checks is a release blocker. 

---

### 11.8 Defense-in-Depth Controls

The architecture explicitly states that tenant isolation must be preserved through **defense in depth** and that no one layer should ever be treated as redundant. The documented layers are:

| Layer | Mechanism | What It Prevents |
|------|-----------|------------------|
| Network / DB layer | PostgreSQL RLS  | Direct or accidental cross-tenant row access  |
| Application layer | Prisma middleware  | Missing tenant filters in query code  |
| API layer | TenantInterceptor  | Requests without verified tenant context  |
| Route layer | RBAC guard  | Role-based misuse and unauthorized endpoint access  |
| Session layer | Memory-only access token + httpOnly refresh token  | Session abuse and XSS-assisted token theft  |

Non-negotiable rule:
- The JWT guard, TenantInterceptor, Prisma middleware, and PostgreSQL RLS must all remain in place. A bug in one is supposed to be caught by the others. This is intentional and must be preserved. 

---

## 12. Secrets and Key Management

### 12.1 Secret Classes

The platform handles several classes of secrets, all of which require governance. The main classes are:

- **Authentication secrets** — Supabase JWT secret, service-role key, session-related config. 
- **Database and infrastructure credentials** — `DATABASE_URL`, `REDIS_URL`, ClickHouse credentials, Meilisearch master key. 
- **Provider API keys** — OpenAI, AssemblyAI, Sentry, Better Stack. 
- **OAuth client credentials** — Salesforce, HubSpot, Google, Microsoft, and similar provider secrets. 
- **Webhook shared secrets** — Zoom, Teams, Google Meet webhook HMAC secrets. 
- **Internal service secrets** — `INTERNAL_SERVICE_SECRET` used to secure internal AI service calls where defined. 
- **Encryption keys** — field-level encryption keys and other application-managed cryptographic material. 

Classification rule:
- All secrets are **Restricted** by default. 

---

### 12.2 Secret Storage

The approved secret-management system is **Doppler**. The architecture explicitly states that no secrets are stored in committed `.env` files, Docker images, Railway environment UI as the source of truth, or any ad hoc unmanaged location. Secrets are injected at runtime through Doppler-managed environment delivery. 

Why Doppler is used:
- Central secret governance. 
- Per-environment values for local, development, staging, and production. 
- Secret rotation without code changes. 
- Access scoping per service and per environment. 
- Audit trail for who accessed which secret and when. 

Storage rules:
- Secrets live in Doppler as the source of truth. 
- Applications read secrets from environment variables injected at deploy/runtime. 
- Secrets must never be hardcoded in repositories, copied into docs casually, or embedded in frontend bundles. 

---

### 12.3 Secret Access Rules

Access to secrets must follow least privilege. Not every service and not every engineer should be able to read every secret. The architecture explicitly notes that Doppler tokens are scoped per service and environment. 

Secret access rules:
- Service A must not automatically inherit Service B’s secrets. 
- Development environments must not casually receive production secrets. 
- Frontend code must never receive backend-only or provider-only secrets. 
- Secret access should be granted only to the people and services that truly need it. 

Operational examples:
- The NestJS API can access the secrets required for auth, CRM sync, and internal service calls. 
- AI services should only access AI/provider credentials and service-specific config they require. 
- Webhook secrets are only needed by webhook-verification paths, not the whole stack. 

---

### 12.4 Key Rotation Policy

The architecture states that rotating a secret in Doppler updates it across services on the next deploy or restart, and operational guidance in the security sections expects regular rotation as a core control. 

Minimum rotation policy:
- Rotate secrets immediately upon suspected compromise. 
- Rotate high-impact keys and provider credentials on a defined operational cadence, typically every 90 days unless the provider or control plan requires something stricter. 
- Rotate webhook secrets when a source system is reconfigured or trust is in doubt. 
- Rotate internal shared secrets if a service token, deployment environment, or team-access boundary is compromised. 

Rotation rule:
- Rotation must be planned so dependent services restart safely and old credentials are invalidated. 
- Rotation events should be auditable and linked to change management or incident records. 

---

### 12.5 API Credential Rotation

API credentials include OpenAI keys, AssemblyAI keys, CRM client secrets, email-provider secrets, observability tokens, and warehouse connector credentials. These should not remain static forever. 

API credential rotation guidelines:
- Use Doppler as the update point for centrally managed keys. 
- Replace compromised or leaked credentials immediately. 
- Review unused or stale credentials and delete them rather than rotating forever. 
- Keep provider-specific credentials scoped to the smallest reasonable permission set. 

Practical rule for the team:
- If a credential was posted in a chat, committed to git, pasted into a ticket, or shown in a screenshot, treat it as compromised and rotate it. 

---

### 12.6 Encryption Key Ownership

Application-managed encryption keys are among the most sensitive assets in the platform because they protect credentials and other encrypted fields stored in the database. 

Key ownership rules:
- Encryption keys are owned at the platform security / infrastructure level, not by individual feature teams. 
- Feature teams may use approved encryption utilities, but they must not invent custom key-storage patterns. 
- Key custody must remain centralized, documented, and auditable. 

Operational implication:
- If field encryption is used for OAuth tokens or warehouse credentials, the encryption key must be treated as a platform secret with the highest protection level. 

---

### 12.7 BYOK Considerations

Bring Your Own Key (BYOK) is not described as a current-phase default architecture requirement, so it should be treated as a **future enterprise consideration**, not assumed baseline functionality. 

If BYOK is introduced later, it must answer:
- Who owns the root key material? 
- How is tenant-specific key mapping stored safely? 
- What is the impact on backup, export, deletion, and recovery workflows? 
- How are key rotation and key-loss incidents handled? 

BYOK rule:
- Do not promise BYOK behavior in product, security, or sales documentation until the lifecycle, recovery, and operational burden are fully designed and approved. 

---

### 12.8 Compromise Response for Secrets

A suspected secret compromise must trigger immediate containment actions. The exact runbook belongs in the operational runbooks and incident-response sections, but the architecture already provides enough guidance to define the required behavior. 

Minimum compromise response:
1. Identify which secret or secret class is affected. 
2. Assess blast radius: which services, environments, tenants, or providers could be impacted. 
3. Rotate or revoke the secret immediately in Doppler and, where applicable, at the provider. 
4. Restart or redeploy dependent services safely so they consume the new secret. 
5. Review logs and audit data for misuse indicators. 
6. Open an incident if customer data, admin access, or third-party system access may have been affected. 

Response rule:
- Never delay rotation because “it might break something.” Containment comes first; coordinated recovery comes second. 

---

### 12.9 Developer Handling Rules

Developer discipline is one of the biggest real-world controls in a fast-moving engineering team. The tooling inventory and architecture both emphasize that secrets must not leak through source control, images, local files, or casual experimentation. 

Developer handling rules:
- Never commit secrets to git. 
- Never paste production secrets into tickets, docs, screenshots, or chat messages. 
- Never hardcode API keys in frontend or backend code. 
- Never use real tenant secrets in example code or training material. 
- Use local development secrets through approved local environment workflows, not copied production values. 
- Do not send sensitive tenant data to unapproved free online AI tools during experiments. 
- If a secret is exposed, report it immediately and rotate it. 

Freshers rule:
- If you are not sure whether something is a secret, assume it is sensitive and ask before sharing. That default is safer than guessing wrong. 
---


## 13. Data Protection

### 13.1 Encryption in Transit

All external production traffic to and from R-Revenue Intelligence must use encrypted transport. The architecture states that HTTPS is enforced at the Cloudflare layer, TLS 1.2 is the absolute minimum accepted version, TLS 1.0 and 1.1 are disabled, and any new external integration must support at least TLS 1.2 or it cannot be onboarded. 

The documented transport paths include:
- Browser to frontend/API through Cloudflare: HTTPS with TLS enforced. 
- NestJS to Supabase Auth: HTTPS/TLS 1.3. 
- NestJS to Cloudflare APIs: HTTPS/TLS 1.3. 
- FastAPI to OpenAI API: HTTPS/TLS 1.3. 
- FastAPI to AssemblyAI fallback: HTTPS/TLS 1.3. 
- NestJS to CRM APIs such as Salesforce, HubSpot, and Dynamics: HTTPS/TLS 1.3. 

For internal service-to-service traffic, the AI Services Layer communicates with NestJS over Railway’s private internal network, and the architecture treats that path as private internal traffic that does not leave the provider’s internal network. Even so, that path is still protected logically using internal shared-secret headers and strict non-public exposure of the AI service. 

Transport protection rules:
- No plain HTTP is allowed for external production traffic. 
- Webhook endpoints must be reachable over HTTPS only. 
- New vendors that do not meet TLS minimums are rejected during integration review. 

---

### 13.2 Encryption at Rest

The platform relies on managed infrastructure and approved storage services that provide encryption at rest for primary storage layers, while especially sensitive credentials and tokens receive additional application-level protection where required. The architecture places PostgreSQL, Redis, object storage, search, analytics, and integration-secret handling inside the managed data platform and secrets-management model. 

Encryption-at-rest expectations:
- Supabase PostgreSQL stores tenant data, transcripts, audit logs, and core entities in managed encrypted storage. 
- Supabase Storage or equivalent object storage is used for file and binary artifacts rather than raw file blobs inside PostgreSQL. 
- Upstash Redis or Redis infrastructure is part of the managed runtime and must not be treated as a plaintext dumping ground for long-lived sensitive data. 
- Credentials and sensitive integration material are governed through Doppler and, where persisted, must use encrypted-field handling. 

Design rule:
- Managed encryption at rest is the baseline, not the full control model. Highly sensitive values such as integration tokens and encryption keys must also follow stricter storage and access rules at the application and secrets-management layers. 

---

### 13.3 Sensitive Field Protection

Not all stored data has the same sensitivity. The platform must apply additional safeguards to fields that could expose customer systems, private user identity, or regulated data if leaked. The architecture explicitly highlights OAuth tokens, API keys, webhook secrets, warehouse credentials, and authentication-related material as high-sensitivity assets. 

Sensitive field protection requirements:
- OAuth access and refresh tokens for third-party integrations must be stored securely and treated as Restricted. 
- API keys and service credentials must never be stored in source code or exposed to the frontend. 
- Webhook shared secrets must live in Doppler and only be read by the services that actually verify webhook signatures. 
- Database rows containing especially sensitive connection details should use application-managed encryption where defined, with centralized key ownership rather than custom per-feature implementations. 

PII-specific protection also exists in the transcription pipeline. The architecture states that raw transcript output is redacted for structured PII before persistence, and the unredacted transcript is never written to PostgreSQL or any other store. 

---

### 13.4 Token and Cookie Protection

The platform’s token and cookie model is one of its most important data-protection controls. The architecture explicitly requires:
- **access token** stored in memory only,
- **refresh token** stored only in a `HttpOnly`, `Secure`, `SameSite=Strict` cookie. 

Protection rationale:
- In-memory access tokens reduce exposure to persistent XSS theft because they are not stored in `localStorage` or `sessionStorage`. 
- `HttpOnly` refresh cookies are not readable by JavaScript. 
- `Secure` ensures the cookie is only sent over HTTPS. 
- `SameSite=Strict` reduces CSRF risk against the refresh endpoint. 

Rules:
- Access tokens must never be placed in browser storage, logs, URLs, or non-httpOnly cookies. 
- Refresh tokens must only be accepted from the cookie, never from request body or query parameters. 
- Token expiry and rotation must remain managed centrally through Supabase Auth settings. 

---

### 13.5 Backup Protection

Backup protection matters because backups contain the same customer data, tenant data, audit records, and AI outputs as the live system. The tooling and data-layer documentation note that Supabase PostgreSQL is used with PITR-oriented managed operations in early phases, which means backup security must be treated as part of the primary data-protection boundary, not an afterthought. 

Backup protection requirements:
- Backups must inherit the same tenant-data confidentiality expectations as production storage. 
- Access to backup-capable systems must be restricted to authorized infrastructure and security operators only. 
- Backup restoration procedures must preserve tenant isolation and must never be used as an informal way to inspect unrelated customer data. 
- Export bundles and backup-like snapshots must not be left in unsecured temporary storage. 

Operational rule:
- If backup access is not audited and restricted, the platform is effectively bypassing its own production security model. 

---

### 13.6 Export Protection

The architecture clearly states that customer data exports are sent to **customer-owned destinations** such as Snowflake, BigQuery, Databricks, Amazon S3, and Redshift, and that Relanto.ai owns the export pipeline rather than the destination infrastructure. Client-provided credentials are used for these connectors, and the platform must not treat exported customer warehouses as internal Relanto.ai storage. 

Export protection rules:
- Every export job must remain tenant-scoped from request to destination. 
- Destination credentials are client-provided and must be stored and handled securely. 
- Export jobs should be idempotent and auditable. 
- Exports must include only the data the tenant is entitled to receive. 
- The platform must not directly operate customer warehouse data beyond the approved export boundary. 

Data ownership rule:
- Export is a customer-right and customer-control feature, not a way for the platform to take ownership of downstream analytics systems. 

---

### 13.7 Data Masking

The architecture includes explicit data masking through transcript PII redaction before storage. The redaction layer replaces detected sensitive patterns with labeled placeholders and logs the redaction event without storing the original secret value. 

The documented automatically redacted categories include:
- credit card numbers, stored as `CREDITCARD`, 
- social security numbers, stored as `SSN`, 
- bank account numbers, stored as `BANKACCOUNT`, 
- passport numbers, stored as `PASSPORT`, 
- national ID numbers, stored as `NATIONALID`, 
- and spoken passwords, stored as `PASSWORD`. 

Important nuance:
- Names, phone numbers, email addresses, and company names are **not** automatically redacted by default because they are core revenue-intelligence data in this product. Tenants can configure additional custom redaction patterns if their policies require stricter handling. 

Masking rule:
- Redaction logs must record only the type and count of redactions, not the original sensitive value. 

---

### 13.8 Data Minimization

The platform follows data-minimization principles by design, especially around raw audio, direct ownership boundaries, and service separation. The architecture explicitly states that the platform does **not** own long-term raw call audio, does **not** become the CRM system of record, does **not** become the customer data warehouse, and does **not** own email infrastructure. 

Examples of minimization in practice:
- Raw audio is retained only temporarily and auto-deleted after the configured retention window, with 7 days as the default rule. 
- Only redacted transcripts are persisted; the raw unredacted transcript is never stored. 
- CRM updates are limited to approved AI enrichment fields rather than broad arbitrary writes to customer CRM systems. 
- Data export goes to customer-owned destinations rather than copying customer analytics workloads into Relanto-managed systems. 

Minimization rule:
- If a data element is not required for a feature, compliance need, support investigation, or controlled retention requirement, it should not be collected or kept. 

---

### 13.9 Secure Deletion

Secure deletion is an explicit architecture concern. The system documents a default raw-audio deletion rule, data-deletion endpoints for compliance handling, and deletion cascades across schemas for requested entities. 

Secure deletion requirements:
- Raw audio files must be auto-deleted after the configured retention window, with 7 days as the default. 
- Deletion workflows exposed through admin/compliance endpoints must cascade across relevant schemas for the requested entities. 
- If a sensitive artifact is no longer required, retention should end by policy rather than by storage convenience. 
- Deleted data must not remain silently accessible through shadow copies, stale exports, or ungoverned temporary files. 

Operational rule:
- Deletion is only trustworthy if downstream storage, exports, and backups are also covered by a defined deletion or expiry process. 

---

## 14. Privacy and Compliance Controls

### 14.1 GDPR Controls

The architecture explicitly references GDPR-related capabilities, including data export and data deletion endpoints, transcript redaction, retention controls, and auditability. These controls support core GDPR expectations such as data minimization, access/export handling, deletion handling, and accountable processing. 

Documented GDPR-aligned controls include:
- `GET /api/v1/admin/data-export` for export handling. 
- `POST /api/v1/admin/data-deletion` for deletion workflows. 
- Redaction of structured high-risk PII in transcripts before storage. 
- Retention controls for raw audio and audit logs. 
- Immutable audit logging for write operations. 

Privacy rule:
- GDPR compliance is not just a legal note; it must be reflected in actual product endpoints, retention behavior, logging discipline, and deletion workflows. 

---

### 14.2 CCPA Controls

The architecture explicitly mentions **CCPA compliance** and records that opt-out records are part of the compliance data model. This means the platform expects operational enforcement of opt-out choices rather than treating them as manual notes. 

CCPA-aligned controls in this design include:
- customer data export capability, 
- data deletion capability, 
- opt-out record handling in compliance data, 
- auditability of user and system actions affecting customer data. 

CCPA rule:
- If a tenant or contact has a valid opt-out state recorded, downstream workflows that would violate that state must enforce it automatically rather than relying on human memory. 

---

### 14.3 Consent Handling

Consent handling is part of the platform’s compliance posture, especially for transcript redaction events, integration-driven data flows, and communication workflows. The architecture notes that consent and redaction events are recorded in compliance-related logs, and that tenant policies can drive stricter redaction behavior. 

Consent handling requirements:
- Consent- or compliance-relevant actions should be recorded in auditable logs. 
- Tenant-specific policy settings may change what is redacted or retained. 
- Customer data must not be used for shared model training without explicit written consent. 
- Integration features must respect the legal and policy context under which the data was collected and may be processed. 

Practical rule:
- If the platform cannot prove when and how a compliance-relevant action happened, operational trust is weak even if the code path was technically correct. 

---

### 14.4 Opt-Out Enforcement

Opt-out enforcement is required, not optional. The architecture explicitly notes CCPA opt-out records and also frames communication and workflow outputs as subject to governance. 

Opt-out enforcement expectations:
- Opt-out status must be stored in a durable, queryable way. 
- Communication workflows must check that status before sending or scheduling actions that the platform controls. 
- AI-assisted suggestions must not override a compliance-enforced opt-out state. 
- Enforcement must happen in code, not only in process documentation. 

Rule for engineers:
- If a workflow can produce outreach, reminders, or follow-up actions, it should have a clear compliance gate before execution. 

---

### 14.5 Regional Communication Controls

The architecture and tooling guidance highlight that external communications, integrations, and privacy obligations vary by context, which means regional communication controls must be supported at the policy and workflow layer even if the exact regional matrix evolves later. The platform already has the right building blocks: tenant policy settings, compliance logs, OAuth-based delegated communications, and workflow-level access controls. 

Regional communication controls should cover:
- tenant-specific communication rules, 
- region-specific opt-out or consent interpretation, 
- restrictions on when automated communications may be sent, 
- and policy-aware enforcement in delegated email and workflow modules. 

Governance rule:
- If a communication rule varies by region or tenant policy, encode it in controlled configuration and service logic rather than relying on ad hoc operator judgment. 

---

### 14.6 Data Subject Rights Handling

The platform’s documented export and deletion endpoints provide the foundation for handling data subject rights requests. In practical terms, the system must be able to find, export, and delete relevant customer-linked data while preserving the required audit trail of the action itself. 

Data subject rights handling requirements:
- Support export of relevant data for the requester or authorized tenant admin. 
- Support deletion workflows with cascading behavior across schemas where applicable. 
- Keep audit records of the request and its execution. 
- Ensure downstream processing and retention policies are aligned with the outcome of the request. 

Important rule:
- Rights handling must be identity-verified and authorization-checked. Export and deletion are privacy rights, but they are also sensitive security operations. 

---

### 14.7 Retention Obligations

Retention is explicitly documented in multiple places in the architecture:
- raw audio defaults to 7-day auto-deletion, 
- audit logs have plan-based retention windows, 
- and Enterprise audit retention may extend up to 7 years for regulated industries. 

The documented audit-log retention table is:
- Starter: 90 days, 
- Growth: 180 days, 
- Pro: 1 year, 
- Enterprise: configurable up to 7 years. 

Retention rule:
- Data should not be retained forever by default. Each class of data needs a reasoned retention window tied to product value, compliance needs, or forensic requirements. 

---

### 14.8 Auditability Requirements

Auditability is a major compliance control in this platform. The architecture states that every `INSERT`, `UPDATE`, and `DELETE` is logged to `public.auditlogs`, and that audit log records are immutable except for controlled retention expiry. 

Auditability requirements include:
- immutable audit records enforced by database trigger, 
- actor and entity tracking, 
- payload capture appropriate to the action type, 
- IP address and user-agent tracking for relevant requests, 
- and AI action logging that stores model, token count, and prompt hash instead of raw prompt text. 

Why this matters:
- It supports forensic review after incidents. 
- It supports privacy and compliance investigations. 
- It reduces ambiguity around who changed what and when. 

---

### 14.9 Customer Data Ownership Rules

The tooling and architecture documents repeatedly treat **customer data ownership** as a core trust rule. The customer owns its CRM data, warehouse environment, communication infrastructure, and exported data destinations; the platform provides enrichment, orchestration, and export paths within clearly defined boundaries. 

Ownership rules include:
- The platform is **not** the CRM system of record. 
- The platform is **not** the customer data warehouse. 
- Warehouse credentials are client-provided for export-only patterns. 
- The platform must not use customer data for shared model training without explicit written consent. 
- Exporting customer data to customer-owned destinations is part of the product boundary, not a transfer of ownership to Relanto.ai. 

Simple rule for the team:
- We help customers use their data; we do not become the owner of it. 

---

## 15. Application Security Controls

### 15.1 Input Validation

The architecture explicitly states that **all API request bodies** are validated by **Zod** in NestJS before reaching business logic, and the same validation approach is used for event payloads and contract enforcement. Invalid requests are rejected at the controller layer. 

Input-validation rules:
- Every request body must have a schema. 
- Event payloads must also be validated, not just public HTTP requests. 
- No unvalidated request should reach service-layer business logic. 
- Validation failures return structured error responses rather than partial processing. 

Engineering rule:
- Skipping schema validation to “move faster” usually creates slower debugging and bigger security risk later. 

---

### 15.2 Output Encoding

The frontend uses Next.js and React, and the architecture notes that React escapes user-generated content by default. That gives a strong baseline for output safety when rendering ordinary dynamic content in the UI. 

Output-encoding rules:
- Prefer standard React rendering paths so automatic escaping remains active. 
- Avoid unsafe HTML rendering unless there is a reviewed and sanitized need. 
- Do not assume AI-generated content is safe to inject as raw HTML. 
- Keep structured outputs structured; do not turn them into executable or unsanitized markup in the browser. 

Rule for juniors:
- If content came from users, integrations, or AI, treat it as untrusted until it is safely rendered. 

---

### 15.3 XSS Prevention

The architecture explicitly lists two core XSS protections:
- React’s default escaping of user-generated content in the Next.js frontend,
- and Content Security Policy headers set by Cloudflare. 

Additional XSS resistance comes from the auth model:
- the access token is not stored in `localStorage` or `sessionStorage`, 
- the refresh token is `HttpOnly`, 
- so even if UI content handling is flawed, token theft is harder than in many browser apps. 

XSS prevention rules:
- Do not use `dangerouslySetInnerHTML` unless there is a strong reviewed reason. 
- Keep CSP enabled and reviewed when new third-party scripts are introduced. 
- Never weaken token-storage rules to “make auth easier.” 

---

### 15.4 SQL Injection Prevention

The architecture explicitly states that database access uses **Prisma ORM with parameterized queries**, and that raw SQL is restricted to specific migration or reviewed cases. This is the main SQL injection defense in the application layer. 

SQL injection prevention rules:
- Use Prisma query builders and typed access paths for application queries. 
- Avoid raw SQL in feature code unless there is a reviewed and justified reason. 
- Combine query parameterization with tenant scoping and RLS so injection is not the only data-risk concern being addressed. 

Rule:
- If raw SQL is introduced, it must receive higher review scrutiny because it bypasses some of the safety rails juniors rely on. 

---

### 15.5 CSRF Protections

The architecture explicitly documents CSRF protections in the session model:
- the refresh-token cookie uses `SameSite=Strict`, 
- mutating API requests require a valid JWT in the `Authorization` header, 
- and the architecture therefore states that separate CSRF tokens are not needed for this model. 

Why this works here:
- The main API auth mechanism is bearer-token based, not ambient cookie auth. 
- The only important cookie-bound auth flow is refresh, and that cookie is protected by `SameSite=Strict`. 

CSRF rule:
- If future features start depending on broad cookie-based auth for state-changing actions, the CSRF posture must be re-evaluated rather than assuming current protections still cover everything. 

---

### 15.6 SSRF Protections

The documents do not describe a dedicated SSRF product feature, but the architecture still gives clear practical SSRF guardrails through service-boundary discipline and integration governance. External calls are limited to approved providers, AI calls are centralized through Python services, and new tools or providers require review before adoption. 

SSRF-oriented controls in this design include:
- no arbitrary user-supplied outbound fetch feature in the approved stack, 
- approved integration endpoints and reviewed provider configurations, 
- centralized service clients for AI and provider communication, 
- and Tech Lead review for new external tools, APIs, or services. 

Practical rule:
- Never build “fetch any URL the user provides” features without explicit security review, allowlisting, and network-boundary controls. 

---

### 15.7 File Upload Validation

The platform handles recordings, uploaded files, and large artifacts through dedicated storage and processing paths rather than shoving arbitrary file blobs into application logic. The architecture also documents supported audio formats and retention rules in the transcription flow. 

Documented validation-related controls include:
- approved/supported audio formats such as MP4, M4A, MP3, WAV, OGG, and WEBM for transcription workflows, 
- bounded operational expectations around audio duration, 
- object storage rather than direct DB blob misuse, 
- and downstream processing through controlled AI/transcription services rather than arbitrary runtime execution. 

File-upload rules:
- Accept only approved content types and formats. 
- Validate metadata and size limits before heavy processing. 
- Never trust filename, extension, or client-declared MIME type alone. 
- Apply retention and cleanup rules to uploaded sensitive media. 

---

### 15.8 Rate Limiting

Rate limiting is explicitly implemented at both the edge and application layers. The architecture states that Cloudflare provides edge rate limiting and that the API layer also enforces per-tenant rate limits using Redis with a sliding-window algorithm. 

The documented plan tiers are:

| Tier | Requests / Minute | Requests / Day | AI Endpoint Limit |
|------|-------------------|----------------|-------------------|
| Starter | 60 rpm  | 5,000/day  | 20 AI requests/hour  |
| Growth | 200 rpm  | 20,000/day  | 100 AI requests/hour  |
| Pro | 500 rpm  | 100,000/day  | 500 AI requests/hour  |
| Enterprise | 2,000 rpm  | Unlimited  | Unlimited  |

Rate-limiting rules:
- Limits are tenant-aware, not just IP-based. 
- AI-heavy endpoints receive additional quotas beyond general API limits. 
- Webhook entry points also rely on Cloudflare rate controls and HMAC verification. 

---

### 15.9 Secure Headers

The architecture explicitly mentions **Content Security Policy** delivered via Cloudflare, HTTPS enforcement, and secure cookie flags. Together these form the core secure-header posture described in the current design. 

Relevant header and browser-surface protections include:
- CSP for script/content restrictions, 
- HTTPS-only transport and secure cookies, 
- `Authorization: Bearer` for explicit API auth rather than hidden browser session behavior, 
- and `SameSite=Strict` on the refresh cookie. 

Rule:
- Secure-header posture should be treated as a living baseline. If new browser features, embedded content, or third-party scripts are added, the header configuration must be reviewed as part of the change. 

---

### 15.10 Dependency Security

Dependency security is explicitly addressed in the architecture. The documents state that:
- Dependabot runs weekly on npm and pip dependencies, 
- critical CVEs trigger immediate Slack alerts and must be patched within 24 hours, 
- CI should run vulnerability checks such as `npm audit` and `pip-audit`, 
- and major version upgrades require review and ownership. 

Dependency-security rules:
- Pin versions rather than relying on floating `latest` tags. 
- Assign ownership for production dependencies. 
- Prioritize security fixes over feature-driven upgrades. 
- Do not introduce new libraries casually, especially in auth, AI, infra, or data paths. 

Simple team rule:
- Every dependency is a trust decision, not just an import statement. 

---

### 15.11 Supply Chain Controls

The platform includes several practical supply-chain controls:
- GitHub Advanced Security secret scanning is enabled, 
- accidental secret commits trigger immediate alerts and automatic Doppler secret rotation, 
- dependency scanning is automated, 
- quarterly penetration testing is scheduled, and critical findings must be fixed before the next production deployment. 

Additional supply-chain governance comes from the tooling inventory:
- no new shared tool should be added without review, 
- versions must be pinned and governed, 
- and high-impact changes require Tech Lead approval and validation evidence. 

Supply-chain rule:
- A secure application is not only about runtime code; it also depends on the trustworthiness, review, and maintenance of everything brought into the build and deployment path. 
---


## 16. API Security

### 16.1 API Authentication

The platform uses **Bearer JWT authentication** for nearly all API routes. The architecture explicitly states that every request to every endpoint, except a small public set such as sign-in, sign-up, refresh, and health, requires a valid JWT in the `Authorization` header. 

Authentication source and handling rules:
- JWTs are issued by **Supabase Auth**, not by custom NestJS auth code. 
- NestJS validates JWT signature and expiry on every protected request through the global auth guard. 
- Access tokens are short-lived and stored in memory only, while refresh tokens are held in `HttpOnly`, `Secure`, `SameSite=Strict` cookies. 

API authentication rule:
- No new protected endpoint may be merged without the JWT guard unless it is explicitly documented as a public or webhook-only route. 

---

### 16.2 API Authorization

Authentication proves identity; authorization decides what the authenticated caller may do. The architecture enforces API authorization using **RBAC**, tenant context injection, service-level record scoping, and PostgreSQL RLS as a final data-layer control. 

Authorization layers:
- **RBAC guard** decides which roles may call an endpoint. 
- **TenantInterceptor** derives tenant context from verified identity rather than trusting client input. 
- **Service-layer scoping** determines whether the user can see their own data, their team’s data, or all tenant data. 
- **RLS** prevents cross-tenant data exposure even if application logic is wrong. 

Authorization rule:
- A valid JWT is never enough by itself. Every protected endpoint must also define role access and data-scope behavior. 

---

### 16.3 Request Validation

The architecture explicitly requires **Zod validation** for all API request bodies and event payloads before business logic runs. Invalid input returns structured error responses instead of partial execution. 

Validation requirements:
- Every request body must be validated against an explicit schema. 
- Query parameters for list endpoints follow standard rules such as `page`, `pageSize`, `sortBy`, and `sortOrder`. 
- `tenantId` must never be accepted from request body or query parameters when it should come from the verified JWT context. 

Validation rule:
- If an endpoint has no schema validation or Swagger contract update, it is not ready for review. 

---

### 16.4 Response Hardening

The platform hardens responses through a **standard response envelope**, controlled error codes, and avoidance of raw internal exceptions leaking directly to clients. The architecture explicitly states that no endpoint may return a raw object or raw array outside the standard envelope. 

Standard response protections include:
- consistent `success`, `data`, and `meta` structure for successful responses, 
- standardized `error.code`, `message`, `details`, `requestId`, and timestamp for error responses, 
- explicit status codes such as `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOTFOUND`, `429 RATELIMITED`, and `503 SERVICEUNAVAILABLE`. 

Response-hardening rule:
- Client responses should reveal enough to debug safely, but not enough to expose internal secrets, raw stack traces, or hidden infrastructure details. 

---

### 16.5 Idempotency Controls

Idempotency matters because this platform handles retries, async jobs, webhook duplication, and integration bursts. The architecture repeatedly states that queue and event workflows must be **idempotent**, especially for ingestion, transcription, and downstream event processing. 

Documented idempotency patterns include:
- duplicate transcription jobs are skipped by checking for an existing `callId` before reprocessing, 
- BullMQ workflows are designed with retry-safe behavior, 
- event consumers are expected to tolerate repeated delivery without corrupting state. 

Idempotency rule:
- Any endpoint or consumer that can be retried by a client, provider, queue, or worker must be designed so the same request does not create duplicate business effects. 

---

### 16.6 Pagination and Abuse Prevention

The architecture defines standard pagination parameters and also enforces rate limiting to reduce scraping, accidental heavy scans, and tenant-level abuse. List endpoints must use predictable pagination behavior rather than unbounded result sets. 

Pagination rules:
- `page` default is 1. 
- `pageSize` default is 25 and is constrained to 1–100. 
- `sortBy` and `sortOrder` are standardized across list endpoints. 
- Paginated responses include total counts and next/previous indicators. 

Abuse-prevention controls include:
- Cloudflare edge rate limiting, 
- NestJS tenant-aware throttling backed by Redis, 
- plan-tier quotas for general API usage and AI-heavy endpoints. 

Rule:
- Never ship an unpaginated high-cardinality list endpoint in a multi-tenant SaaS platform unless there is a reviewed, bounded reason. 

---

### 16.7 Sensitive Endpoint Protections

Some endpoints need stricter handling because they can change security posture, trigger expensive workflows, or expose highly sensitive data. The architecture already identifies admin routes, auth flows, AI-heavy endpoints, export flows, and integration-management paths as higher-risk surfaces. 

Sensitive-endpoint protections include:
- stricter role restrictions such as RevOps or Admin only, 
- rate limiting and AI-specific quotas for cost-sensitive endpoints, 
- Cloudflare Access protection for internal tools such as Swagger and Bull Board, 
- auditability for critical state-changing operations. 

Examples of sensitive routes:
- `/api/v1/admin/*` admin operations, 
- `/api/v1/auth/*` authentication/session endpoints, 
- AI generation and research endpoints under `/api/v1/insights/*` and related modules, 
- export and compliance endpoints. 

---

### 16.8 Internal API Trust Rules

The platform has a strict trust boundary between public APIs and internal service APIs. The architecture explicitly states that the FastAPI AI Services Layer is **never exposed to the public internet** and only accepts authorized calls from NestJS over the internal network. 

Internal trust rules:
- NestJS calls FastAPI using `X-Internal-Secret`, `X-Tenant-Id`, and `X-Request-Id` headers. 
- FastAPI validates the shared secret and rejects requests without it using HTTP 401. 
- AI services do not accept direct browser or arbitrary external traffic. 
- Internal endpoints are versioned and contract-controlled like any other important API boundary. 

Trust rule:
- “Internal” does not mean “implicitly trusted.” Internal services still require explicit authentication, bounded callers, and traceable requests. 

---

### 16.9 Versioning Security Rules

The architecture uses explicit endpoint versioning, including examples such as `v1` AI endpoints and canonical API prefixes. It also states that when an output schema changes, a new version should be created rather than silently mutating the old contract. 

Versioning security rules:
- Breaking output-schema changes require a new version such as `v2`. 
- Old versions remain live for a deprecation window instead of disappearing immediately. 
- Versioning protects clients from unexpected contract drift that could lead to unsafe parsing, authorization mistakes, or incorrect automation. 

Rule:
- Never make a security-relevant behavior change silently under an existing stable endpoint version. 

---

## 17. Webhook Security

### 17.1 Webhook Threat Model

Webhook endpoints are unusual because they are intentionally reachable from external systems but do not use normal JWT-based user authentication. The architecture explicitly treats these endpoints as a special attack surface and secures them with HMAC verification, replay protections, rate limiting, and queue-based isolation. 

Main webhook risks include:
- forged provider requests, 
- replayed valid payloads, 
- duplicate deliveries from conferencing platforms, 
- burst traffic causing queue or cost spikes, 
- malformed payloads that attempt to poison downstream processing. 

Threat-model rule:
- Webhook traffic is untrusted until authenticity, freshness, and processing-safety checks all pass. 

---

### 17.2 HMAC Verification

The architecture explicitly states that webhook endpoints such as meeting-ingestion webhooks use **HMAC-SHA256 signature verification** instead of JWT authentication. NestJS verifies the signature header on every webhook request and rejects invalid signatures immediately with HTTP 401. 

HMAC verification rules:
- Shared webhook secrets are stored in **Doppler**, never in code or plain environment files. 
- The signature is computed from the incoming payload and compared using a timing-safe comparison. 
- Requests with invalid signatures are rejected before any business logic executes. 

Simple rule:
- If signature verification fails, nothing downstream should happen. No queue write, no partial parse, no silent fallback. 

---

### 17.3 Replay Protection

The architecture explicitly includes replay checks as part of the webhook defense-in-depth model. Replay protection exists because a valid signed payload can still be maliciously resent later if freshness is not enforced. 

Replay-protection expectations:
- Webhook handlers should reject duplicate or stale events once identified. 
- Replay logic should work together with idempotency keys or provider event identifiers where available. 
- Replayed events must not create repeated business side effects such as duplicate transcript jobs or repeated sync actions. 

Rule:
- Signature validation alone is not enough for webhooks; a captured valid payload must still fail if replayed outside the acceptable window or after prior processing. 

---

### 17.4 Timestamp Validation

The architecture specifically mentions **timestamp and replay checks** for inbound events. Timestamp validation helps ensure that a signed event is recent enough to be trusted and not an old captured payload replayed later. 

Timestamp-validation rules:
- Check provider-supplied timestamp metadata where available. 
- Reject requests that fall outside the permitted freshness window. 
- Use server-side validation logic, not client hints, to determine acceptable clock skew. 

Rule:
- If timestamp validation is missing, webhook HMAC becomes weaker because old intercepted messages may still be accepted. 

---

### 17.5 Idempotency Handling

Webhook sources often retry aggressively, and the same event may arrive more than once even when nothing is wrong. The architecture explicitly states that ingestion and transcription paths must be idempotent and that duplicate jobs should be skipped rather than reprocessed. 

Examples of idempotency handling:
- duplicate `audioUrl` / `callId` processing is prevented by checking for an existing transcription record before work starts, 
- BullMQ consumers are expected to tolerate repeated event delivery safely, 
- duplicate webhook-driven work should not cause duplicate billing, duplicate CRM updates, or duplicate audit noise. 

Rule:
- Build webhook consumers assuming “at least once delivery,” not “exactly once delivery.” 

---

### 17.6 Rate Limiting

Webhook endpoints are protected by outer rate limiting at Cloudflare, and the broader platform rate-limiting model helps prevent a single inbound source from overwhelming shared infrastructure. The architecture explicitly places Cloudflare in front of public traffic and includes webhook-specific defense-in-depth controls. 

Rate-limiting controls for webhooks include:
- Cloudflare edge rate limiting, 
- bot filtering and WAF at the edge, 
- queue-based decoupling so burst traffic does not force synchronous heavy processing. 

Rule:
- Webhooks should accept, validate, enqueue, and return quickly. They should not become long-running request handlers that are easy to exhaust under burst traffic. 

---

### 17.7 Queue Isolation

The webhook pipeline is intentionally queue-driven. The architecture states that validated payloads are queued rather than processed synchronously, and downstream consumers work on idempotent event contracts. This isolates public ingress from heavy work such as transcription, enrichment, and AI processing. 

Queue-isolation benefits:
- reduced timeout risk at the public endpoint, 
- better retry behavior and dead-letter handling, 
- less direct denial-of-service impact on application request threads, 
- cleaner observability around ingestion success vs downstream processing success. 

Rule:
- Public webhook handlers should stay thin. Heavy work belongs in BullMQ workers and downstream services. 

---

### 17.8 Failure Handling

The architecture documents failure modes and mitigations for ingestion and downstream processing, including retries, fallback behavior, and dead-letter patterns. A failed downstream workflow must not make the webhook endpoint itself behave unpredictably. 

Failure-handling expectations:
- invalid signatures return immediate 401. 
- downstream processing failures are retried in workers where appropriate. 
- duplicate deliveries should be safely skipped. 
- queue overflow, timeout, or external-provider failure should surface through logs and alerts rather than silent data loss. 

Rule:
- Failure handling must distinguish clearly between authentication failure, validation failure, duplicate delivery, and downstream processing failure. 

---

### 17.9 Monitoring and Alerting

Webhook pipelines are mission-critical because they are upstream of transcription and many later platform workflows. The architecture documents Better Stack, Sentry, structured logging, queue metrics, and non-functional reliability targets such as webhook-ingestion success rates. 

Monitoring and alerting expectations include:
- structured logs with request and tenant context where applicable, 
- queue-depth and completion monitoring via BullMQ-related observability, 
- Sentry alerts for errors and timeout conditions, 
- Better Stack uptime and service-health checks, 
- tracking against the documented webhook reliability NFR. 

The architecture’s NFR table sets **Webhook Reliability** at **99.9% successfully ingested**, with alerting when success rate drops below the threshold window. 

---

## 18. Infrastructure Security

### 18.1 Hosting Security Model

The platform uses a split hosting model in early phases:
- **Vercel** for the Next.js frontend,
- **Railway** for the NestJS API, FastAPI AI Services Layer, and transcription services,
- with Cloudflare at the edge for security and delivery controls. 

This model separates presentation, application logic, AI workloads, and edge protection, while still keeping the deployment footprint simple for a fast-moving team. The tooling inventory also documents AWS ECS/Fargate as the approved future-scale migration target rather than an immediate requirement. 

Hosting-security rule:
- Managed hosting reduces operational burden, but it does not replace application security, environment separation, secret governance, or runtime monitoring. 

---

### 18.2 Network Segmentation

The architecture clearly distinguishes public-facing traffic from private service traffic. Public requests terminate at Cloudflare and flow to frontend/API surfaces, while internal FastAPI services communicate over the internal Docker or Railway private network and are not exposed directly to the public internet. 

Segmentation boundaries:
- Browser and external systems interact only with approved public endpoints. 
- NestJS is the main orchestrating public application layer. 
- AI Services Layer and Transcription Service are isolated internal workloads. 
- Internal service calls require explicit shared-secret validation in addition to network placement. 

Segmentation rule:
- A service being on the same platform network is not a reason to expose it publicly or bypass caller verification. 

---

### 18.3 Container Security

The platform is container-first. The architecture states that all services run as containers, local development uses Docker Compose, and deployable services are packaged in containerized form. This standardization helps keep runtime behavior more consistent across local, CI, and production environments. 

Container-security expectations:
- each service has its own runtime boundary, 
- service-specific dependencies stay isolated instead of polluting one large shared runtime, 
- secrets are injected at runtime through Doppler rather than baked into images. 
- AI and transcription workloads stay in separate Python containers from the NestJS monolith. 

Rule:
- Containers are packaging and isolation tools, not security guarantees by themselves. Secure images, runtime config, and secrets handling still matter. 

---

### 18.4 Image Hardening

The tooling inventory stresses version pinning, dependency governance, and avoiding uncontrolled `latest` tags. Those are core image-hardening controls because insecure or drifting base images create avoidable production risk. 

Image-hardening expectations:
- pin runtime and dependency versions in manifests and build config, 
- avoid floating `latest` image tags for production dependencies, 
- review major version upgrades with migration and rollback planning, 
- keep secrets out of container images entirely. 

Rule:
- If a production image cannot be reproduced predictably, it is harder to secure, debug, and roll back safely. 

---

### 18.5 Runtime Isolation

Runtime isolation is one of the main reasons the platform extracts the AI Services Layer and Transcription Service from the NestJS modular monolith on Day 1. The architecture explicitly says these workloads have different memory, CPU, scaling, and dependency profiles, and isolating them prevents one runtime from destabilizing another. 

Runtime-isolation benefits include:
- Whisper GPU and memory load does not crash the main API process, 
- AI inference dependency trees do not pollute the Node.js application runtime, 
- failures in AI or transcription paths are easier to contain and observe separately. 

Rule:
- Heavy compute and complex dependency workloads should stay isolated from user-facing application runtimes unless there is a very strong architectural reason not to. 

---

### 18.6 CDN and WAF Protections

Cloudflare is the platform’s edge-security layer and provides several important protections before requests ever reach application services. The architecture explicitly lists **TLS termination, WAF, DDoS protection, rate limiting, bot filtering, and access protection for internal admin surfaces** as Cloudflare responsibilities. 

CDN and WAF protections include:
- HTTPS enforcement and TLS handling, 
- Web Application Firewall filtering, 
- bot filtering, 
- rate limiting at the edge, 
- Cloudflare Access for internal tools like Swagger and Bull Board. 

Rule:
- Edge controls reduce attack load and noise, but they do not replace JWT auth, RBAC, validation, tenant isolation, or secure coding. 

---

### 18.7 TLS Enforcement

TLS enforcement is explicit in the architecture:
- HTTPS is forced by Cloudflare redirects, 
- TLS 1.2 is the minimum accepted version, 
- TLS 1.0 and 1.1 are disabled, 
- and new external integrations must support TLS 1.2 or higher. 

Why this matters:
- it protects credentials and tokens in transit, 
- it reduces session hijacking risk, 
- it keeps browser and integration traffic aligned with modern baseline security expectations. 

Rule:
- Any production endpoint discovered serving plain HTTP or deprecated TLS must be treated as a security incident, not a cosmetic issue. 

---

### 18.8 DDoS Protections

The architecture explicitly assigns **DDoS absorption and outer traffic filtering** to Cloudflare. This matters because the platform exposes public APIs, auth endpoints, and webhooks that could otherwise be abused to create availability incidents or downstream cost spikes. 

DDoS protection posture includes:
- Cloudflare edge absorption of abusive traffic, 
- rate limits and bot filtering before requests hit the origin, 
- queue-based decoupling for heavy async workflows such as transcription and AI processing. 

Rule:
- Availability protection is part of security. If the system can be cheaply overwhelmed, it is not secure enough for production SaaS use. 

---

### 18.9 Environment Separation

The platform separates local, development, staging, and production concerns through Doppler-managed environment scoping, per-service secrets, and controlled deployment pipelines. The architecture explicitly states that non-production services should not inherit production credentials and that secret access is scoped by service and environment. 

Environment-separation rules:
- Production secrets must not be reused in development casually. 
- Service A’s environment should not automatically contain Service B’s secrets. 
- CI and deployment gates must run before merge and release. 
- Environment drift should be reduced by explicit version pinning and documented runtime versions. 

Rule:
- A weak dev/prod boundary is often a shortcut to a production incident. 

---

### 18.10 Backup and Restore Security

Backup and restore security is part of infrastructure security because backup systems can bypass normal application controls if poorly governed. The tooling inventory documents managed PostgreSQL operations with PITR support, while the broader security sections require restricted access, auditability, and secure handling of backup-like exports or restores. 

Backup-and-restore requirements:
- backup-capable systems must be limited to authorized operators, 
- restored environments must preserve tenant isolation controls, 
- temporary restore environments must not become long-lived shadow production copies, 
- backup access and recovery actions should be auditable. 

Rule:
- Restore capability is essential for resilience, but restore access without governance becomes a data-exposure risk. 
---

## 19. Database Security

### 19.1 Database Access Model

The platform uses **shared PostgreSQL with tenant isolation**, not database-per-tenant, and treats PostgreSQL as the system of record for users, accounts, deals, transcripts, detections, AI outputs, audits, and sync state. Access to the database is mediated primarily through **NestJS + Prisma**, with tenant context injected from verified JWT claims before queries execute. 

Database access rules:
- Application code accesses PostgreSQL through Prisma ORM as the standard path. 
- `tenantId` comes from verified Supabase Auth JWT claims, not from user-controlled request input. 
- Prisma middleware sets a session-local tenant variable before queries run. 
- RLS remains the database-level defense even if application-layer scoping is bypassed. 

Rule:
- No feature should depend on manual developer discipline like remembering to add `WHERE tenantid = ?` everywhere; tenant scoping must be automatic and enforced. 

---

### 19.2 Schema Ownership Boundaries

The architecture uses strong **schema ownership boundaries** so modules do not write into each other’s data directly. Each module owns its own schema and may write only to its own tables, while cross-module access must happen through documented APIs, events, or explicitly approved read contracts. 

Ownership rules:
- Platform Core owns the `public` schema and other modules treat it as read-only. 
- M-01 owns `transcription`, M-02 owns `engagement`, M-03 owns `accounts`, M-04 owns `conversation`, M-06 owns `summaries`, M-07 owns `deals`, and so on. 
- Direct cross-schema writes are forbidden. 
- Unlisted cross-schema reads are not permitted without documentation and review. 

Rule:
- If Module X needs Module Y data, the safe default is “call Y’s API or consume Y’s event,” not “query Y’s tables directly.” 

---

### 19.3 RLS Policies

**Row Level Security (RLS)** is one of the most important security controls in the whole platform. The architecture states that RLS is enabled on **every table in every schema**, and every table must include `tenantid UUID NOT NULL`, usually as the second column after the primary key. 

RLS enforcement pattern:
- `ENABLE ROW LEVEL SECURITY` is required on every table. 
- `FORCE ROW LEVEL SECURITY` is also required so even privileged connections cannot bypass tenant isolation casually. 
- Policies exist for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. 
- Policies compare row tenant ownership to the session-local tenant variable set by the application. 

Rule:
- RLS must never be disabled casually. Any migration that weakens or removes RLS needs explicit Tech Lead review and written justification. 

---

### 19.4 Migration Security

All schema changes use **Prisma Migrate**, and migration discipline is treated as a security and stability control, not just a developer convenience. The architecture defines strict rules for migration scope, naming, review, and safe evolution. 

Migration security rules:
- One migration per module per PR. 
- A migration may touch only the schema owned by that module. 
- New tables must include UUID primary key, `tenantid`, timestamps, and at least one tenant-first composite index. 
- New tables must include RLS setup in the migration. 
- All migrations require Tech Lead review before merge. 

Additional safeguard:
- The architecture explicitly says **never drop a column directly in production**; unused columns should be deprecated first and removed in a controlled future version. 

---

### 19.5 Backup Security

The primary database is documented as **Supabase PostgreSQL with PITR**, which means managed backup and restore capability exists in the early-phase operating model. Backup security is not only about having backups; it is also about controlling who can restore, where restored data goes, and whether tenant isolation remains intact after recovery. 

Backup security expectations:
- Backup-capable systems should remain limited to authorized operators only. 
- Restored environments must preserve tenant isolation controls like RLS and schema boundaries. 
- Backup copies or restored datasets must not become unmanaged shadow environments. 
- Recovery actions should be auditable. 

Rule:
- A backup that restores data without the same security boundaries becomes a new data exposure path. 

---

### 19.6 Audit Logging

The database layer supports **auditability** through immutable-style audit logging in Platform Core, and the architecture explicitly includes `public.auditlogs` for write-operation traceability across the platform. PostgreSQL is also described as storing audit logs as part of the source-of-truth data layer. 

Audit log design points:
- `public.auditlogs` records action, entity type, entity ID, payload, actor, tenant, and timestamp context. 
- Audit records support compliance, debugging, and investigation of high-impact changes. 
- Critical operations such as configuration changes, role changes, exports, or integration changes should be traceable back to an actor and time. 

Rule:
- If an operation changes customer-visible or security-relevant state, there should be a durable audit trail for it. 

---

### 19.7 Query Safety Rules

The architecture is explicit that Prisma is the standard access layer and that raw SQL should not become the casual default in product services. Query safety comes from Prisma type safety, automatic tenant scoping, RLS, and module-boundary discipline working together. 

Query safety rules:
- Prefer Prisma ORM for read/write operations. 
- Do not rely on ad hoc raw SQL in services unless there is a strong reviewed reason. 
- Tenant scoping must be automatic through middleware, not handwritten everywhere. 
- Cross-schema queries that violate ownership rules are rejected in review. 
- Every table must have tenant-first indexes to avoid unsafe, slow full scans across tenant data. 

Rule:
- “It works” is not enough for a database query in a multi-tenant product; it must also be tenant-safe, reviewable, and aligned with schema ownership rules. 

---

### 19.8 Admin Access Restrictions

Administrative access is intentionally narrow because the database contains high-sensitivity data such as transcripts, AI outputs, audit logs, integration state, and user-role mappings. The architecture separates normal user permissions from high-privilege platform functions and treats admin capabilities as governed actions. 

Admin-access restrictions include:
- only authorized platform roles can access admin surfaces and audit views, 
- role changes and sensitive admin operations are written through controlled APIs, 
- session and role claims come from signed Supabase tokens, reducing spoofing risk. 
- privileged changes require auditability and should not happen through direct uncontrolled DB access. 

Rule:
- Database superuser-style access should be rare, tightly held, and never treated as a normal support workflow. 

---

## 20. AI and ML Security

### 20.1 AI Service Boundary

The architecture is very strict about the **AI service boundary**: all model inference, embeddings, NLP pipelines, prompt workflows, and agent behavior belong only in the **Python FastAPI AI Services Layer**, not in the TypeScript product services. The NestJS layer may orchestrate AI features, but it must not call model providers directly. 

Boundary rules:
- AI inference runs only in the FastAPI AI Services Layer. 
- TypeScript product services must not import or use direct AI inference libraries. 
- The AI service exposes internal structured endpoints such as summarize, detect, embed, answer, and generate-email. 
- The AI service does not perform business logic or database writes. 

Rule:
- This separation limits blast radius, keeps AI dependencies isolated, and makes the system easier for freshers and senior engineers to reason about. 

---

### 20.2 Model Access Controls

Model-provider access is centralized through **LiteLLM**, with **OpenAI as the primary production LLM provider** and approved fallback behavior routed through the same control layer. This prevents product services from creating uncontrolled direct vendor dependencies. 

Model access controls:
- All provider calls route through LiteLLM. 
- API Layer never calls OpenAI directly. 
- Provider keys are stored in Doppler, not in source code or frontend code. 
- Internal AI endpoints are reachable only from trusted backend callers over the internal network. 

Rule:
- If a team wants to add a new AI provider, it needs review, ownership, and governance before any production dependency is created. 

---

### 20.3 Prompt Security

Prompts are part of the security surface because they shape model behavior, data exposure, and output reliability. The architecture treats prompts as controlled artifacts through prompt versioning, structured endpoint contracts, and regression testing against known examples. 

Prompt security controls:
- Prompt changes should be versioned and tracked. 
- AI endpoints return structured JSON, not unconstrained raw prose, reducing downstream misuse risk. 
- Workflow changes in LangGraph require controlled schema and regression discipline. 
- High-risk prompt behavior should be validated against golden datasets before rollout. 

### 20.3.1 Prompt Injection & Jailbreak Defenses

The platform assumes that malicious users will attempt prompt injection and jailbreak attacks through any user-controlled input (transcripts, emails, deal notes). Zod schema validation at the API layer is insufficient for semantic attacks.

Prompt injection defenses:
- **Input Sanitization for LLM Boundaries:** All user-provided text must be sanitized using dedicated prompt security middleware (e.g., NeMo Guardrails or custom prompt-firewall) before inclusion in LLM prompts. 
- **System/User Context Separation:** Clear delimiters must separate system instructions from user-provided context in all prompt templates. Use structured formats like XML tags or JSON boundaries. 
- **Instruction Isolation:** System instructions must be embedded in prompt templates in a way that prevents user input from overriding or modifying them. 
- **Output Format Enforcement:** Force structured outputs via provider APIs (e.g., OpenAI's `response_format={"type": "json_object"}`) to reduce the effectiveness of injection attacks. 

### 20.3.2 Model Output Safety Validation

LLM confidence scores are unreliable indicators of output safety or factual accuracy. Additional validation layers are required before outputs are rendered to users or synced to CRM systems.

Output safety validation:
- **Structural Validation:** All AI outputs must be parsed and validated against Zod schemas to ensure expected structure and data types. 
- **Content Safety Checks:** Implement content validation to detect and block:
  - Generated PII not present in input
  - Toxic or inappropriate content
  - Cross-tenant data hallucination
  - Instructions or system prompts leaked in output 
- **Factual Alignment:** Where applicable, cross-reference AI-generated facts against source data to detect hallucinations before CRM sync. 

Rule:
- A prompt is not "just text." In production AI systems, it is part of application behavior and must be governed like code. 

---

### 20.4 Output Validation

The AI layer is required to return **structured JSON outputs** with predictable fields, including `confidencescore`, instead of raw unconstrained model output. This is one of the key security and safety controls because business workflows depend on stable response contracts. 

Output validation requirements:
- Every AI endpoint has an explicit request/response contract. 
- Output format changes require versioning rather than silent mutation. 
- The API Layer validates and consumes structured responses instead of trusting arbitrary text. 
- Contract tests are recommended to verify schema correctness and backward compatibility. 

Rule:
- Good-looking text is not enough. If the output cannot be validated, it should not drive reliable automation. 

---

### 20.5 Sensitive Data Handling in Prompts

The platform works with highly sensitive business data such as transcripts, account context, deal context, and email content, so prompts must be built with care. The tooling inventory explicitly warns that sensitive customer or tenant data must not be sent to unapproved or free hosted AI services without approval. 

Sensitive-data prompt rules:
- Only approved production providers may receive production-sensitive data. 
- Evaluation-only providers must not become accidental production sinks for customer data. 
- Prompt payloads should be limited to what the task actually needs. 
- Internal experiments with private or local models are preferred for some prototyping and privacy-sensitive testing scenarios. 

Rule:
- Sending too much context “just in case” is both a privacy problem and an AI cost problem. 

---

### 20.6 Provider Risk Controls

Provider risk is real because hosted AI services can fail, change behavior, change pricing, or expose policy mismatches. The tooling inventory explicitly says new AI tools and providers require review, and free hosted services are acceptable mainly for evaluation, not as default production dependencies. 

Provider risk controls include:
- approved-stack-first decision making, 
- Tech Lead / AI Lead review for new provider adoption, 
- ownership and upgrade governance for high-impact AI dependencies, 
- cost, lock-in, privacy, and reliability review before production use. 

### 20.6.1 Data Contamination Controls

Customer data must never be used for provider model training without explicit legal and technical safeguards. The platform must ensure zero-data-retention policies where available.

Data contamination controls:
- **Zero-Data-Retention Requirements:** All API calls to OpenAI, Anthropic, and other third-party AI providers must use enterprise tiers or explicit flags (e.g., `zero-data-retention` policies) that legally and technically prevent tenant data from being used for provider training. 
- **DPA Verification:** Data Processing Agreements must explicitly state that provider will not use customer data for model training or improvement. 
- **Opt-Out Enforcement:** Configure API calls with provider-specific parameters to opt-out of data usage for training where technically available. 
- **Provider Auditing:** Regularly verify that provider settings and policies maintain zero-data-retention compliance. 

Rule:
- Convenience during experimentation must not silently become production architecture. 

---

### 20.7 Fallback Provider Rules

The architecture explicitly documents **fallback behavior** in the AI stack: LiteLLM uses OpenAI as the primary route with an approved fallback path such as Anthropic, and the transcription service similarly uses Whisper primary with AssemblyAI fallback. Fallbacks exist for resilience, not for bypassing governance. 

Fallback rules:
- Fallback behavior must be documented and tested. 
- Provider-specific logic should stay isolated behind the gateway layer. 
- Failover must preserve response contracts so the API Layer still receives predictable structured output. 
- Fallback usage should be observable for incident and cost analysis. 

Rule:
- A fallback is only useful if it is safe, tested, and operationally visible. 

---

### 20.8 AI Abuse Scenarios

The platform must assume AI features can be abused intentionally or accidentally. Abuse can include prompt misuse, cost amplification, oversized requests, unsafe automation, noisy repeated queries, or attempts to use AI outputs as unquestioned truth in downstream workflows. The architecture addresses this through service isolation, quotas, confidence gating, versioned contracts, and human review for risky cases. 

Examples of abuse-related controls:
- keep AI off critical read paths where possible by precomputing outputs after transcription, 
- apply quotas and rate controls to expensive AI endpoints, 
- prevent direct CRM auto-write for low-confidence outputs, 
- isolate AI failures so they do not crash the main product layer. 

Rule:
- AI security is not just about model access; it is also about controlling cost, failure impact, and unsafe downstream trust. 

---

### 20.9 Human Review for Low-Confidence Outputs

The architecture gives a very clear rule: every AI endpoint returns a **confidence score**, and if `confidencescore < 0.7`, the result must be marked for review. The API Layer must not automatically write flagged outputs to CRM or treat them as trusted automation results. 

Human-review rules:
- low-confidence outputs are flagged, 
- flagged outputs are held for review instead of auto-written to CRM, 
- review workflows are part of the AI safety model, not an optional extra. 

Rule:
- When the system is unsure, the platform should slow down and ask for human judgment rather than automating confidently in the wrong direction. 

---

### 20.10 Model Governance

Model governance covers versioning, evaluation, ownership, and controlled change management. The tooling inventory explicitly requires owners for production dependencies, prompt versioning, golden datasets, and controlled upgrades for major AI stack components such as LiteLLM, LangGraph, FastAPI, and model SDKs. 

Model governance controls:
- assign an owner for each production AI dependency, 
- pin package and model versions where applicable, 
- evaluate changes against golden datasets, 
- require rollback and test planning for major upgrades. 

Rule:
- A model or prompt change that affects production output is a product change and should be governed with the same seriousness as code deployment. 

---

## 21. Integration Security

### 21.1 CRM Integration Security

CRM systems such as **Salesforce, HubSpot, and Microsoft Dynamics 365** are core integrations, but the architecture is explicit that the CRM remains the **system of record**. The platform may read CRM context and write approved enrichment fields back, but it does not take ownership of core CRM state. 

CRM security controls:
- use native OAuth-based integration patterns, not generic iPaaS shortcuts. 
- treat credentials and tokens as high-sensitivity assets. 
- scope access to approved objects and actions only. 
- keep write-back limited to approved enrichment outputs rather than unrestricted mutation. 

Rule:
- The safest CRM integration is one that is powerful enough for product value but still clearly bounded. 

---

### 21.2 Email Integration Security

The architecture explicitly says the platform does **not** own email infrastructure and must use **delegated Gmail or Outlook / Office 365 APIs**, with **no custom SMTP or owned email server logic**. This is an important security boundary because it avoids taking on unnecessary email credential, deliverability, and abuse risk. 

Email integration controls:
- delegated sending only through approved provider APIs, 
- no direct custom SMTP server ownership, 
- tenant-scoped OAuth is required for mailbox-connected workflows. 
- email data and sending actions remain subject to opt-out and compliance controls. 

Rule:
- Keep the platform focused on composition and workflow intelligence, not reinventing mail infrastructure. 

---

### 21.3 Meeting Platform Security

Meeting integrations such as **Zoom, Google Meet, and Microsoft Teams** are treated as mission-critical ingestion paths because they feed recording capture, transcripts, and downstream insights. The architecture requires strong webhook security, queue-based ingestion, and connector-specific review. 

Meeting-platform security controls:
- webhook authenticity verification with HMAC where supported, 
- HTTPS-only inbound endpoints behind Cloudflare, 
- idempotent processing for duplicate event delivery, 
- queue isolation so meeting events do not force heavy synchronous work. 

Rule:
- Ingestion endpoints from meeting platforms are high-value attack and failure surfaces, so they should be treated like security-critical APIs. 

---

### 21.4 Telephony Integration Security

Telephony and dialer integrations are approved only with connector-specific review because they handle sensitive call data, recordings, and event streams. The tooling inventory classifies these integrations as high-sensitivity and notes that they require governance before adoption. 

Telephony security controls:
- review connector-specific auth and webhook models before onboarding, 
- treat recordings and metadata as sensitive customer data, 
- enforce the same webhook authenticity, idempotency, and queue-ingestion rules used for other inbound event sources. 

Rule:
- Do not assume all telephony vendors behave the same; each connector can change the threat model. 

---

### 21.5 Data Warehouse Export Security

The **Data Cloud export layer** exists so customers can export tenant-owned data into **customer-owned** destinations such as Snowflake, BigQuery, Databricks, Amazon S3, and Redshift. The architecture is explicit that customer warehouse credentials are client-provided and that the platform does not own customer analytics infrastructure. 

Warehouse-export security controls:
- exports are tenant-scoped, 
- credentials are stored securely and treated as high sensitivity, 
- sync design is daily and idempotent, 
- platform boundaries must remain export-oriented rather than becoming operator access into customer warehouses. 

Rule:
- Export capability should extend customer ownership, not blur ownership boundaries. 

---

### 21.6 OAuth Credential Handling

OAuth tokens for CRM, email, and other integrations are among the most sensitive fields in the platform. The architecture and tooling inventory both identify integration credentials, API keys, and secrets as high-risk data that must never appear in source code or frontend-visible paths. 

Credential-handling rules:
- store OAuth secrets and API credentials through approved secret-management controls such as Doppler where applicable, 
- persist encrypted credential material only where necessary, 
- never embed integration secrets in frontend code or repository files. 

Rule:
- If an OAuth credential leaks, the attacker may gain access to an external system the customer already trusts, so handling standards must be stricter than ordinary app data. 

---

### 21.7 Scope Minimization

Scope minimization is a simple but powerful control: request only the access needed for the feature. The architecture supports bounded write-back patterns and system-of-record rules, which naturally push the platform toward smaller OAuth permission footprints. 

Scope-minimization rules:
- request the minimum provider permissions needed, 
- keep CRM write scopes limited to approved enrichment behavior, 
- avoid broad mailbox or admin scopes when narrower delegated scopes are enough. 

Rule:
- Overbroad scopes increase both blast radius and customer trust concerns, even if they make implementation easier. 

---

### 21.8 Third-Party Dependency Trust Model

External integrations and providers are useful but never fully trusted. The tooling inventory repeatedly emphasizes approved-stack-first governance, no unreviewed new tools, security sensitivity tracking, ownership assignment, and explicit review for vendors that touch AI, data, auth, infra, or external integrations. 

Trust-model controls:
- every new vendor or integration requires review before codebase adoption, 
- review includes cost, lock-in, privacy, security, and operational impact, 
- evaluation-only tools must stay clearly separated from production-approved dependencies. 

Rule:
- “Third-party” should mean “verified and governed,” not “someone else’s problem.” 

---

### 21.9 Integration Failure Safeguards

The architecture assumes integrations will sometimes fail, timeout, duplicate events, or return inconsistent data. That is why it relies on retries, idempotency, queue isolation, alerting, and system-of-record boundaries rather than assuming perfect third-party behavior. 

Failure safeguards include:
- queue-based decoupling for inbound and async flows, 
- retry-safe and idempotent event handling, 
- fallback paths for critical AI and transcription providers, 
- observability through Sentry, Better Stack, and metrics for sync or ingestion issues. 

Rule:
- A secure integration is not one that never fails; it is one that fails in a controlled, observable, tenant-safe way. 

---


## 22. Logging, Monitoring, and Detection

### 22.1 Security Event Logging

The platform uses **structured logging** as a baseline requirement, not an optional debugging aid. The architecture states that every service should log in a structured format with important context such as `tenantid`, `userid`, module name, and trace identifiers so incidents can be investigated without guessing across services. 

Security-relevant events that must be logged include:
- authorization failures and forbidden access attempts, 
- webhook signature failures and replay-style rejection events, 
- queue processing failures and retry storms, 
- AI timeout or validation failures with endpoint and model context. 

Rule:
- If a security-relevant event cannot be traced by tenant, actor, endpoint, and time, incident response becomes slow and unreliable. 

---

### 22.2 Audit Logs

The architecture explicitly includes an **audit log** capability in Platform Core and states that modules should not write directly to audit tables; instead, they should use the shared audit service. This keeps audit behavior standardized and prevents teams from inventing different logging formats. 

Audit-log controls:
- `public.auditlogs` stores action, resource or entity, tenant, user, metadata, and timestamp context. 
- write operations across the platform should be traceable through audit records. 
- modules call `AuditService.log()` rather than inserting ad hoc rows themselves. 

Rule:
- Audit trails should be durable, consistent, and hard to bypass accidentally. 

---

### 22.3 Access Logs

Access logging exists at multiple layers: Cloudflare at the edge, application logs in the services, and uptime or health checks in the monitoring stack. Together these help answer simple but critical questions like who called what, from where, and whether the request was accepted, rejected, or throttled. 

Access-log expectations:
- public endpoint activity is visible through the platform’s edge and application logging layers, 
- service health and availability are monitored through Better Stack and health endpoints, 
- latency-sensitive behavior can be correlated with request patterns through metrics and logs. 

Rule:
- Access logs should support security review and performance triage without exposing secrets or raw tokens. 

---

### 22.4 Admin Action Logging

Administrative actions are higher risk than normal user activity because they can affect tenant settings, roles, integrations, exports, or compliance behavior. The architecture treats these operations as governed platform actions and expects them to be auditable through Platform Core controls. 

Admin actions that should always be logged include:
- role or permission changes, 
- integration connection or credential updates, 
- export or compliance-configuration changes, 
- other sensitive state changes initiated by privileged users. 

### 22.4.1 Break-Glass Access Runbook

Emergency database access requires formal procedures to prevent unauthorized access while enabling critical incident response.

Break-glass access requirements:
- **Temporary Access Only:** Emergency access must be time-limited and automatically expire after the incident resolution. 
- **Explicit Grant Process:** Access requires documented incident ticket and explicit approval from Tech Lead and Security Owner. 
- **Bastion Host or Teleport:** All emergency database access must route through a controlled bastion host or Teleport instance with session recording. 
- **Heavy Audit Logging:** All emergency access sessions must be recorded, logged, and reviewed post-incident. 
- **Justification Documentation:** Every break-glass access event must include documented business justification and impact assessment. 

Rule:
- If a privileged action can change platform posture or customer-visible behavior, it should leave a clear audit trail. 

---

### 22.5 Authentication Event Logging

Authentication is handled through **Supabase Auth + JWT verification**, and auth-related events are important both for security detection and for support workflows. The architecture makes protected-route enforcement global and treats auth as a shared platform-core capability. 

Authentication events to log or monitor include:
- failed JWT validation or expired-token access attempts, 
- login and session-related anomalies seen at the auth layer, 
- repeated unauthorized access attempts to protected routes. 

Rule:
- Auth failures should be visible enough to detect abuse patterns, but logs must never store sensitive token material. 

---

### 22.6 Webhook Monitoring

Webhook paths are mission-critical entry points, especially for meeting and telephony ingestion. The architecture explicitly defines webhook reliability targets, signature validation, rejection monitoring, and queue-based downstream processing for these endpoints. 

Webhook monitoring expectations:
- track webhook receipt-to-call-record creation flow, 
- monitor rejection spikes such as invalid HMAC or malformed payloads, 
- alert on webhook success-rate drops below the defined threshold, 
- correlate webhook failures with queue, storage, or downstream service issues. 

The architecture’s NFR table defines **Webhook Reliability** as **99.9% successfully ingested**, with alerting when the success ratio drops below threshold in the monitored window. 

---

### 22.7 Queue Anomaly Monitoring

BullMQ and Redis are critical-path infrastructure for transcription, AI processing, webhooks, retries, and cross-module events. The architecture repeatedly highlights queue depth, backlog, retry behavior, and dead-letter patterns as operational signals that must be monitored. 

Queue anomalies to detect include:
- backlog growth beyond normal levels, 
- repeated retries or dead-letter accumulation, 
- processing latency drifting beyond NFR targets, 
- Redis instability that could stall event-driven flows. 

Rule:
- A healthy API does not mean a healthy platform if async queues are silently backing up. 

---

### 22.8 Alerting Rules

The monitoring stack combines **Sentry** for error tracking, **Better Stack** for logs and uptime, and **Grafana** for dashboards and metrics. The architecture also defines explicit alert thresholds for latency, webhook reliability, LLM API errors, queue delay, and other operational signals. 

Documented alerting examples include:
- API and query latency breaches, 
- webhook success-rate drops, 
- AI provider latency and error-rate spikes, 
- transcription failure bursts, 
- queue backlog thresholds and processing slowdowns. 

Rule:
- Alerting should focus on actionable failure signals, not noisy low-value events that train the team to ignore alarms. 

---

### 22.9 SIEM or Log Aggregation

The approved central log aggregation tool is **Better Stack**, while Sentry and Grafana cover adjacent error and metric needs. The architecture does not describe a full traditional enterprise SIEM as a current mandatory component, so Better Stack functions as the primary searchable operational log layer in the approved stack today. 

Log-aggregation controls:
- centralized searchable structured logs in Better Stack, 
- exception aggregation in Sentry across Next.js, NestJS, and Python services, 
- metrics and dashboards in Grafana for queue, DB, and AI behavior. 

Rule:
- Centralized visibility is mandatory even if a formal SIEM is not yet part of the phase-one stack. 

---

### 22.10 Log Retention Rules

The tooling inventory notes that free or starter observability tiers often have weaker retention and lower visibility, and it recommends upgrading when production maturity requires stronger logging and monitoring. The architecture also treats retention and governance as part of the security posture rather than a pure cost choice. 

Retention rules:
- keep enough log history to investigate incidents, regressions, and tenant-impacting failures, 
- align retention upgrades with real production usage and compliance needs, 
- avoid retaining highly sensitive raw data longer than necessary, especially where privacy exposure grows faster than diagnostic value. 

Rule:
- Retention should be intentional: too little history breaks investigations, while too much uncontrolled history increases exposure and cost. 

---

## 23. Vulnerability Management

### 23.1 Dependency Scanning

The tooling inventory explicitly requires **dependency vulnerability checks** in CI, including **`npm audit` or equivalent for JavaScript** and **`pip-audit` for Python** services. This is especially important because the stack spans frontend, backend, AI services, containers, and integration SDKs. 

Dependency-scanning rules:
- run JS dependency audits in CI, 
- run Python dependency audits for AI services, 
- track remediation ownership by the team that owns the dependency, 
- block unresolved high or critical issues unless an approved exception exists. 

Rule:
- Dependency scanning should be automatic and repeatable, not something remembered only before launch. 

---

### 23.2 Secret Scanning

The architecture and tooling inventory are very strict about secret handling: **no secrets in repos, no secrets in container images, and centralized secret delivery through Doppler**. That discipline reduces the need for emergency cleanup later and should be reinforced with repo and CI scanning practices. 

Secret-scanning expectations:
- detect committed credentials, tokens, and API keys before merge, 
- treat exposed secrets as incidents requiring rotation, not just code cleanup, 
- keep all runtime secrets delivered centrally through Doppler. 

Rule:
- Removing a leaked secret from Git is not enough; the secret must also be considered compromised and rotated. 

---

### 23.3 Image Scanning

The approved stack is container-based, so image hygiene matters. The tooling inventory emphasizes version pinning, avoiding floating `latest` tags, and governing dependency upgrades, which are core foundations for any container-image vulnerability management program. 

Image-scanning controls should cover:
- base image and package CVE review, 
- pinned image tags rather than uncontrolled latest versions, 
- rebuild and rollout when critical container-layer vulnerabilities are discovered. 

Rule:
- A container image is part of the software supply chain; if it is not scanned and governed, the platform is not fully governed either. 

---

### 23.4 SAST

The architecture does not name a dedicated SAST product as a required phase-one tool, but it does define strong **CI quality gates** that act as static safety checks for important classes of issues. These include TypeScript type checking, Zod schema validation, Prisma schema validation, RLS enforcement checks, and no-cross-module-boundary checks on every PR. 

SAST-adjacent controls already in place include:
- `tsc --noEmit` type checking, 
- Zod schema validation scripts, 
- Prisma schema validation, 
- RLS enforcement checks, 
- module-boundary rule enforcement. 

Rule:
- Even without a branded SAST tool, static code and policy checks must still catch obvious security and architecture violations before merge. 

---

### 23.5 DAST

The approved stack does not mandate a named dedicated DAST platform in the current phase, but dynamic security-style testing can still be covered through realistic HTTP, end-to-end, and load-test workflows. The testing inventory explicitly recommends Supertest, Playwright, Testcontainers, and k6 for exercising real routes, auth boundaries, queue behavior, and performance-sensitive paths. 

DAST-like coverage should focus on:
- protected-route enforcement and auth edge cases, 
- webhook endpoint abuse and malformed payload behavior, 
- rate limiting, error handling, and validation failures under realistic requests. 

Rule:
- Dynamic security testing is about exercising the running system, not just reading source code. 

---

### 23.6 Patch Management

Patch management is governed through version pinning, dependency ownership, and controlled upgrade review. The tooling inventory explicitly says security fixes take priority over feature upgrades, and major dependency upgrades require impact notes, rollback plans, tests, and Tech Lead approval. 

Patch-management rules:
- every production dependency has a clear owner, 
- minor and patch updates can be batched in maintenance windows, 
- major upgrades require migration and rollback planning, 
- security updates take priority when risk is significant. 

Rule:
- An unowned dependency is an unpatched dependency waiting to become a problem. 

---

### 23.7 CVE Triage Process

The documented operating model supports CVE triage through ownership, CI scanning, approval governance, and exception handling discipline. When a vulnerability appears, the owning team should evaluate exploitability, package reach, runtime exposure, compensating controls, and urgency before deciding fix order. 

CVE triage should answer:
- Is the vulnerable package actually used in runtime paths or only in development tooling, 
- Is the affected service internet-facing or internally isolated, 
- Are there compensating controls like Cloudflare, RBAC, or non-public service exposure that reduce immediate risk, 
- What is the fastest safe remediation path. 

Rule:
- Triage should be fast and evidence-based, not driven only by raw scanner severity labels. 

---

### 23.8 Remediation SLAs

The source documents do not define exact numeric remediation SLAs, so the safe policy is to tie remediation urgency to severity, exploitability, and production exposure while keeping Tech Lead and security ownership involved. The tooling inventory explicitly prioritizes security fixes and expects blocking behavior for unresolved high or critical issues unless an exception is approved. 

Practical SLA guidance consistent with the documented model:
- critical internet-exposed issues should be treated as immediate work, 
- high-severity issues should be scheduled ahead of normal feature work unless strong compensating controls exist, 
- lower-severity items can be grouped into planned maintenance windows with ownership. 

Rule:
- If you want, this section can later be upgraded with exact SLA numbers once the team finalizes its formal vulnerability policy. 

---

### 23.9 Exception Handling

Not every finding can be fixed immediately, so exception handling needs discipline. The tooling inventory already implies this by allowing high or critical issues to pass only when an **approved exception** exists and by requiring ownership and review for risky changes. 

Security exception records should include:
- the finding and affected asset, 
- why immediate remediation is not feasible, 
- compensating controls in place, 
- owner, expiry date, and planned review point. 

Rule:
- A security exception is not a way to forget a risk; it is a way to document temporary acceptance of a risk. 

---

## 24. Penetration Testing

### 24.1 Pen Test Scope

The most important penetration-test scope for this platform follows the architecture’s real attack surfaces: public APIs, auth flows, webhook endpoints, tenant isolation, admin functions, integration flows, AI endpoints reachable through the application layer, and storage or export boundaries. These are the areas where failure would most directly impact customer data, trust, or uptime. 

Priority scope areas include:
- public REST APIs and JWT/RBAC enforcement, 
- multi-tenant isolation and RLS bypass attempts, 
- webhook authenticity, replay, and abuse handling, 
- admin and export flows, 
- integration setup and OAuth-connected workflows. 

Rule:
- Pen-test scope should follow the real architecture, not a generic checklist disconnected from how the system actually works. 

---

### 24.2 Test Frequency

The documents do not define a fixed pen-test calendar, but they strongly support event-driven security review around major releases, infrastructure changes, new integrations, and scaling milestones. The architecture also requires Tech Lead review for infrastructure changes and new technologies, which is a natural trigger for targeted security testing. 

A practical frequency model consistent with the sources is:
- before major external launch or enterprise onboarding, 
- after major authentication, webhook, export, or infrastructure changes, 
- periodically as the product matures and externally exposed scope grows. 

Rule:
- Pen testing is most valuable when tied to real change and risk, not treated as a once-a-year checkbox only. 

---

### 24.3 Internal vs External Testing

Both internal and external perspectives matter. Internal testing is useful for architecture-aware scenarios such as cross-module trust boundaries, RLS enforcement, and service-to-service assumptions, while external-style testing is essential for public APIs, auth, webhooks, edge protections, and abuse paths visible to attackers. 

Recommended split:
- **External-style testing** for internet-facing routes, Cloudflare-protected surfaces, auth, and webhooks. 
- **Internal architecture-aware testing** for tenant isolation, admin misuse, integration privilege boundaries, and AI workflow trust assumptions. 

Rule:
- External testing finds exposed weaknesses; internal testing finds design weaknesses that may not be obvious from the outside. 

---

### 24.4 Critical Scenarios to Test

The architecture makes some scenarios especially important because they combine sensitive data, public entry points, and business-critical workflows. These should be explicit pen-test scenarios, not left to chance. 

Critical scenarios include:
- JWT bypass, role escalation, or tenant-spoofing attempts, 
- RLS bypass and cross-tenant data leakage attempts, 
- webhook forgery, replay, and flood behavior, 
- queue abuse and duplicate-processing paths, 
- OAuth integration misuse or over-scoped token handling, 
- unsafe export or admin access behavior, 
- AI low-confidence outputs being auto-trusted incorrectly. 

Rule:
- Test the scary paths first: places where one bug can expose many tenants, trigger bad automation, or break trust fast. 

---

### 24.5 Reporting Format

The documents emphasize architecture discipline, ownership, ADRs, and actionable governance, so penetration-test reporting should map findings back to actual modules, services, endpoints, controls, and owners. A report that is too generic is much less useful to a delivery team. 

A useful report format should include:
- affected component and environment, 
- reproduction steps and evidence, 
- business impact and tenant impact, 
- severity, owner, and remediation recommendation. 

Rule:
- Reports should help engineers fix issues quickly, not just impress stakeholders with scanner-style language. 

---

### 24.6 Finding Severity Model

The source documents do not prescribe a named severity framework, but their risk posture clearly prioritizes internet exposure, tenant isolation, credential handling, webhook security, and privileged misuse. A practical severity model should weigh exploitability, breadth of tenant impact, privilege gained, detectability, and whether compensating controls exist. 

Severity should be considered highest when a finding can:
- cross tenant boundaries, 
- expose credentials or secrets, 
- bypass auth or RBAC, 
- compromise webhook trust or trigger uncontrolled downstream processing, 
- create large-scale data export or admin misuse. 

Rule:
- In this platform, cross-tenant and credential-impacting issues are usually more dangerous than isolated cosmetic bugs. 

---

### 24.7 Remediation Workflow

The remediation workflow should fit the governance already defined in the architecture: clear ownership, Tech Lead review for important changes, PR-based fixes, CI validation, and documented change tracking. The goal is to turn findings into controlled engineering work rather than side-channel patching. 

Remediation workflow expectations:
- assign an owner and target milestone, 
- fix through normal reviewed pull requests, 
- validate with existing CI gates such as schema, RLS, and boundary checks where relevant, 
- update architecture or policy docs if the fix changes shared behavior. 

Rule:
- Security fixes should land through the same disciplined engineering system as product fixes, just with higher urgency when risk is high. 

---

### 24.8 Retest Process

A penetration test is not complete when the first fix is merged; it is complete when the risk is verified as closed or correctly downgraded. The testing stack and CI controls already encourage reproducibility, which makes targeted retesting practical after remediation. 

Retest expectations:
- verify each fixed finding against the original scenario, 
- confirm no regression in tenant isolation, auth behavior, webhook handling, or other adjacent controls, 
- keep evidence of closure with the finding record and remediation PR. 

Rule:
- “Fixed in code” is weaker than “retested and proven fixed in behavior.” 

---



## 25. Incident Response

### 25.1 Incident Classification

Incidents should be classified by **customer impact, security impact, data exposure risk, and service degradation level**. The architecture already treats webhook failures, Redis outages, AI provider degradation, auth issues, and cross-tenant safety controls as escalation-worthy platform risks, so those areas should drive severity assignment. 

Practical classification model:
- **Critical:** confirmed or likely cross-tenant exposure, auth bypass, major outage, broken webhook ingestion at scale, or severe data-loss risk. 
- **High:** major feature degradation, provider outage with material customer impact, persistent queue backlog, export failure, or security control malfunction with compensating controls still present. 
- **Medium:** partial module degradation, elevated retry rates, isolated tenant impact, or non-critical provider failures with working fallback. 
- **Low:** minor operational issues, contained defects, or alerts with no meaningful customer impact. 

Rule:
- If an incident affects tenant isolation, credentials, or core ingestion reliability, classify high first and downgrade only with evidence. 

---

### 25.2 Detection Sources

Incident detection comes from the platform’s existing observability stack and reliability signals. The architecture explicitly uses **Sentry** for error tracking, **Better Stack** for logs and uptime, **Grafana** for metrics, and queue and webhook health thresholds for operational detection. 

Primary detection sources:
- Sentry exceptions and error bursts, 
- Better Stack uptime failures and structured log anomalies, 
- Grafana dashboards for queue depth, DB latency, AI latency, and error rates, 
- webhook rejection spikes and ingestion-success drops, 
- customer-reported failures when automated signals miss edge cases. 

Rule:
- The first alert may come from tooling or from a customer, but both must enter the same incident workflow. 

---

### 25.3 Escalation Path

The architecture references **on-call response**, **incident workflow maturity**, and **PagerDuty or equivalent later** as the operational path as the platform scales. In the current model, alerting should first reach the owning engineering function, with Tech Lead and security escalation when the incident affects shared architecture, customer data, or compliance boundaries. 

Escalation path:
1. Alert raised by Sentry, Better Stack, Grafana, webhook threshold, or engineer report. 
2. Primary service owner or on-call engineer acknowledges and triages. 
3. Tech Lead is engaged for cross-module, architectural, or production-severity incidents. 
4. Security Owner joins for data exposure, auth, credential, tenant-isolation, or compliance incidents. 
5. Product or customer-facing leads are informed for externally visible impact. 

Rule:
- Escalation should follow service ownership first, but security-sensitive incidents must not stay isolated inside one team. 

---

### 25.4 Roles and Responsibilities

The documents consistently assign ownership by domain such as **Frontend Lead, Backend Lead, AI Lead, DevOps Lead, Security Owner, Data Lead, and Tech Lead**. Incident response should use the same ownership model so freshers and senior engineers alike know who leads each problem area. 

Role expectations:
- **Primary owner:** triages and coordinates the affected service area. 
- **Tech Lead:** resolves cross-service decisions, rollback calls, and architecture-impacting tradeoffs. 
- **Security Owner:** leads evidence preservation, containment, and risk assessment for security incidents. 
- **DevOps Lead:** handles hosting, runtime, alerting, environment, and deployment controls. 
- **AI Lead / Data Lead / Integrations Owner:** handle provider, model, queue, export, or integration-specific recovery work. 

Rule:
- One incident should have one clear incident lead, even if multiple teams are helping. 

---

### 25.5 Containment Steps

Containment should focus on **limiting blast radius fast** while preserving evidence and avoiding unsafe hurried changes. The architecture already provides useful containment levers such as Cloudflare edge controls, queue decoupling, fallback providers, RBAC boundaries, and feature-level service separation. 

Typical containment actions:
- block or rate-limit abusive traffic at Cloudflare, 
- disable or isolate a failing integration or webhook source, 
- pause affected BullMQ workers or queues if duplicate or unsafe processing is occurring, 
- disable risky feature paths such as export or auto-write behavior when confidence or integrity is compromised, 
- rotate compromised secrets through Doppler if credential exposure is suspected. 

Rule:
- First stop the damage, then optimize the fix. 

---

### 25.6 Eradication Steps

Eradication removes the root cause after immediate containment. Depending on the incident, that may mean patching code, rotating credentials, removing bad deployments, clearing poisoned queue items, fixing configuration drift, or tightening validation and access rules. 

Common eradication actions:
- deploy a reviewed fix through the normal CI and release path, 
- rotate affected API keys, OAuth secrets, or internal shared secrets through Doppler, 
- purge malformed or duplicate queue jobs if they would re-trigger the issue, 
- revoke unsafe provider access or disable an integration until revalidated. 

Rule:
- If you only restart services without removing the root cause, the incident is paused, not solved. 

---

### 25.7 Recovery Steps

Recovery restores stable customer service while verifying that controls still work. The architecture already defines fallback behavior, queue retries, health checks, uptime monitoring, and performance thresholds that can be used to confirm the platform is genuinely back to normal. 

Recovery actions:
- restore service health and validate key endpoints, queues, and integrations, 
- verify webhook ingestion, auth, and tenant-scoped reads are behaving normally again, 
- confirm fallback systems are disabled or normalized appropriately after primary service recovery, 
- monitor closely for recurrence through Sentry, Better Stack, and Grafana. 

Rule:
- Recovery is complete only when both availability and control integrity are restored. 

---

### 25.8 Communication Plan

The architecture references collaboration tools like Slack or Teams and treats operational coordination as an important part of delivery maturity. Incident communication should therefore be structured, brief, and role-based rather than scattered across personal chats. 

Communication expectations:
- open a dedicated incident channel or thread for real-time coordination, 
- keep updates time-stamped and factual, 
- notify internal stakeholders when customer-visible impact or security risk exists, 
- communicate externally only after facts are verified and an owner is assigned. 

Rule:
- During an incident, one source of truth is better than ten partial conversations. 

---

### 25.9 Evidence Handling

Evidence handling matters most for security incidents, tenant-isolation concerns, auth failures, webhook abuse, or suspected credential compromise. The existing stack already supports evidence collection through structured logs, Sentry traces, audit logs, and queue or job records. 

Evidence-handling rules:
- preserve relevant logs, timestamps, request IDs, queue IDs, and audit records, 
- avoid deleting or overwriting evidence before triage is complete, 
- record what was observed, what was changed, and when containment actions happened. 

Rule:
- Good evidence handling helps both root-cause analysis and defensible customer communication later. 

---

### 25.10 Post-Incident Review

The architecture explicitly requires **post-incident review** for downtime events and ties NFR review to production incidents. Reviews should therefore produce concrete outcomes such as code fixes, runbook updates, alert tuning, architecture notes, or backlog items. 

A useful post-incident review should include:
- timeline, impact, root cause, and detection path, 
- what containment and recovery actions worked or failed, 
- what monitoring or process gaps allowed the incident to last longer, 
- follow-up actions with owners and due dates. 

Rule:
- The review is successful only if the team becomes less likely to repeat the same incident. 

---

## 26. Business Continuity and Recovery

### 26.1 Backup Strategy

The platform’s primary backup posture relies on **Supabase PostgreSQL with PITR** for the source-of-truth database, alongside managed storage and provider-level durability for other infrastructure components. The architecture also makes clear that transcripts, audits, sync state, and other critical tenant data live in PostgreSQL, so database recovery is the center of continuity planning. 

Backup strategy:
- use managed PITR for PostgreSQL recovery, 
- keep object/file storage in managed storage rather than ad hoc local disk, 
- rely on idempotent reprocessing and re-sync for some derived data where appropriate, such as CRM sync or search-index rebuild paths. 

Rule:
- Back up source-of-truth data first; derived data can often be rebuilt faster than it can be protected manually. 

---

### 26.2 Restore Testing

A backup strategy is incomplete if restore is never tested. The source material emphasizes manual QA tests, NFR review, and operational maturity, so restore verification should be treated as a routine resilience activity rather than an emergency-only step. 

Restore-testing expectations:
- test PostgreSQL restoration into a controlled environment, 
- verify RLS, tenant boundaries, and core application flows after restore, 
- confirm async systems and integrations can resume safely after recovery. 

Rule:
- A backup you have never restored is a hope, not a recovery strategy. 

---

### 26.3 RTO Targets

The architecture includes uptime targets, breach-response expectations, and operational thresholds, but it does not define formal universal RTO values for every subsystem. A practical continuity policy aligned with the documented stack is to set **service-level RTOs** based on customer impact and available fallback options. 

Recommended practical RTO targets:
- **Core API / auth / tenant data access:** 4 hours target to restore normal service after a major outage. 
- **Webhook ingestion path:** 2 hours target because ingestion delay directly affects downstream processing and customer trust. 
- **AI-generated features:** 8 hours target because some features can degrade gracefully while core product workflows remain usable. 
- **Analytics and non-critical derived views:** 24 hours target if transactional platform behavior remains intact. 

Rule:
- Shorter RTO should be assigned to core revenue-path and ingestion-path services, not necessarily every convenience feature. 

---

### 26.4 RPO Targets

RPO should reflect which data can be recreated and which cannot. Because PostgreSQL is the source of truth and supports PITR, it should have the strongest RPO objective, while some derived data can tolerate larger loss windows if it can be replayed or recomputed. 

Recommended practical RPO targets:
- **Primary PostgreSQL transactional data:** 15 minutes target using managed PITR capability. 
- **Critical webhook ingestion queue:** Near-zero RPO required for live webhook ingestion to prevent loss of irreversible meeting data. High-availability Redis configuration mandatory. 
- **Queue state / in-flight transient jobs:** up to 1 hour acceptable if jobs can be replayed or re-enqueued safely (non-critical jobs only). 
- **Search and derived AI artifacts:** up to 24 hours acceptable if rebuild and regeneration paths exist. 

Rule:
- Protect what is hard to recreate; rebuild what is cheap and deterministic to regenerate. 

---

### 26.5 Service Failover Approach

The architecture uses failover mostly through **graceful degradation and provider fallback**, not through fully active-active duplication of every service in the current phase. Examples already documented include OpenAI through LiteLLM with fallback provider routing, and Whisper with AssemblyAI fallback in transcription. 

Failover approach:
- use provider fallback where the architecture already supports it, 
- keep services isolated so one failing runtime does not crash the whole platform, 
- prioritize partial service continuity over full feature shutdown. 

Rule:
- Early-stage continuity is based more on controlled degradation and restartability than on expensive full redundancy everywhere. 

---

### 26.6 Provider Outage Handling

Provider outages are expected scenarios in this architecture. The documents explicitly describe fallback-oriented thinking for AI and transcription, and they also recommend keeping experimentation and production-provider approval disciplined. 

Provider-outage handling:
- for LLM issues, use LiteLLM fallback and monitor latency/error behavior, 
- for ASR issues, fall back from Whisper to AssemblyAI where configured, 
- if no safe fallback exists, degrade the affected feature while preserving core product access and data integrity. 

Rule:
- Do not let a provider outage turn into a platform-wide outage if a narrower degraded mode is possible. 

---

### 26.7 Queue Recovery

Redis and BullMQ are a critical-path dependency, and the tooling inventory explicitly notes that if Redis fails, event-driven processing stalls. That makes queue recovery a core part of business continuity, especially for webhooks, transcription, AI jobs, and sync workflows. 

Queue-recovery expectations:
- restore Redis availability first for async workflow continuity, 
- re-drive or re-enqueue idempotent jobs safely after recovery, 
- use dead-letter and retry-aware patterns to avoid duplicate side effects during restart. 

Rule:
- After queue recovery, validate idempotency before validating throughput. 

---

### 26.8 Data Recovery Validation

Recovery is not done when data is merely present again; it is done when the recovered data is **correct, tenant-safe, and application-usable**. The architecture strongly emphasizes RLS, schema ownership, and auditability, so those controls must be part of recovery validation. 

Data recovery validation should confirm:
- tenant-scoped reads still return only correct tenant data, 
- RLS and Prisma tenant enforcement are functioning, 
- critical tables, audit logs, and integration state are consistent, 
- key application journeys work with restored data. 

Rule:
- The real recovery check is not “did the database start,” but “did the product recover safely and correctly.” 

---

## 27. Secure SDLC

### 27.1 Security Requirements in Design

Security requirements are expected at design time because the architecture itself is heavily rule-driven. It defines approved technologies, data boundaries, RLS, RBAC, webhook security, AI boundaries, and integration constraints up front, which means design work must include those controls before implementation starts. 

Design-time security requirements include:
- choose only approved technologies unless an ADR is raised, 
- define tenant isolation, auth, and data ownership impact for every new feature, 
- document external dependencies, secret needs, and privacy impact early. 

Rule:
- Security should be part of feature design, not a cleanup task after coding. 

---

### 27.2 Security Review Checkpoints

The documents describe multiple natural review checkpoints: ADR approval for new technology, module-boundary review, migration review, and Tech Lead approval for risky changes. These act as the formal security and architecture checkpoints in the development lifecycle. 

Review checkpoints include:
- design review when introducing new tools, providers, or data stores, 
- migration review for schema and tenancy impact, 
- PR review for auth, RLS, secrets, boundary, and validation changes, 
- release review when production behavior or external exposure changes materially. 

Rule:
- The higher the blast radius, the earlier and more explicitly the review should happen. 

---

### 27.3 PR Security Gates

The architecture explicitly defines required GitHub Actions checks on every PR. These are some of the strongest practical Secure SDLC controls because they automatically stop unsafe changes before merge. 

Documented PR gates include:
- TypeScript type checking, 
- unit and integration tests with coverage expectations, 
- Zod schema validation, 
- Prisma schema validation, 
- RLS enforcement checks, 
- no cross-module import checks, 
- Sentry sourcemap upload as part of release-debuggability discipline. 

Rule:
- If a PR bypasses the required gates, the SDLC is no longer secure by design. 

---

### 27.4 Testing Requirements

The tooling inventory lays out a layered testing model: unit tests, API integration tests, infra-backed integration tests, E2E tests, load tests, AI evaluation, contract tests, and human review for low-confidence AI outputs. That is a strong Secure SDLC pattern because it treats different failure classes separately instead of hoping one test type covers everything. 

Testing requirements include:
- Jest and pytest for service-level logic, 
- Supertest for real HTTP route validation, 
- Testcontainers for PostgreSQL/Redis-backed realism, 
- Playwright for E2E browser journeys, 
- k6 for load and stress testing, 
- golden datasets and contract tests for AI behavior. 

Rule:
- Production readiness requires sync-path, async-path, and AI-path validation, not just happy-path unit tests. 

---

### 27.5 Release Approval Controls

The architecture requires approved ADRs for technology choices, CI validation before merge, and Tech Lead review for high-impact changes such as migrations, dependency upgrades, and architecture-affecting modifications. These form the release-approval backbone even before heavier enterprise release governance is added. 

Release approval controls:
- no Draft ADR-backed technology may merge to main, 
- production-impacting migrations require Tech Lead sign-off, 
- major dependency upgrades require migration plan, rollback plan, and tests, 
- unresolved high-risk security issues need approved exceptions if release must proceed. 

Rule:
- Release approval is where architecture discipline meets production accountability. 

---

### 27.6 Environment Promotion Rules

The documents emphasize environment discipline, version pinning, CI validation, and controlled deployments. That implies clear promotion rules from local to CI to staging to production, even if the early-stage platform keeps the environment model simpler than a large enterprise. 

Promotion rules should include:
- no direct production-only fixes without reviewed PRs except true emergency procedure, 
- environment versions must stay aligned and pinned, 
- secrets remain environment-scoped through Doppler, 
- staging should validate major release risk before production cutover. 

Rule:
- Environment promotion should reduce surprises, not just move code faster. 

---

### 27.7 Developer Training

The tooling inventory repeatedly says the stack should stay simple enough for freshers and new team members, and it highlights documentation, onboarding, local development parity, and shared tooling as strategic choices. That means training is part of Secure SDLC, not just a people issue. 

Developer training should cover:
- approved stack and why alternatives need review, 
- tenant isolation, RLS, RBAC, and secrets discipline, 
- webhook, queue, and AI safety patterns, 
- how to use CI feedback, ADRs, and testing layers correctly. 

Rule:
- A secure architecture fails quickly if new developers do not understand the rules they are expected to follow. 

---

### 27.8 Security Ownership by Team

Ownership is one of the strongest themes in the tooling inventory. Dependencies, providers, and operational areas all need explicit owners, and the same principle should apply to security responsibilities across the SDLC. 

Recommended team ownership model:
- **Security Owner:** auth, secrets, RLS, RBAC, compliance, and incident coordination. 
- **Backend Lead:** API validation, authorization, Prisma safety, and module boundaries. 
- **AI Lead:** model governance, prompt safety, provider controls, and confidence gating. 
- **DevOps Lead:** CI/CD, environments, observability, secret delivery, and recovery readiness. 
- **QA Lead:** E2E, regression, load, and validation of critical user journeys. 
- **Tech Lead:** final architecture governance and exception approval. 

Rule:
- Security ownership works best when everyone contributes, but specific people are still accountable. 

---





## 28. Security Testing Matrix

### 28.1 Unit Security Tests

Unit security tests should validate the smallest security-sensitive logic in isolation before broader integration testing begins. The approved testing stack already includes **Jest** for TypeScript services and **pytest** for Python AI services, and the documents explicitly recommend mocking expensive or external dependencies in unit tests. 

Unit security tests should cover:
- RBAC guard behavior and permission checks, 
- validation and schema-enforcement helpers, 
- token-handling helpers and auth utility logic, 
- prompt-safety or AI output-validation helpers where applicable. 

Rule:
- Unit tests should prove isolated security logic is correct, but they must not be used as a substitute for auth, DB, or queue-backed security tests. 

---

### 28.2 Integration Security Tests

Integration security tests are critical in this architecture because real security behavior depends on **HTTP boundaries, PostgreSQL, Redis, BullMQ, JWT guards, Prisma middleware, and RLS**, not just pure functions. The approved stack explicitly uses **Supertest** for API integration tests and **Testcontainers** for realistic PostgreSQL and Redis-backed test environments. 

Integration security tests should verify:
- authenticated route protection with real guards enabled, 
- schema validation and error handling on actual endpoints, 
- queue-backed workflow behavior under security-relevant failures, 
- RLS and tenant isolation using a real database, not mocks. 

Rule:
- If a control depends on the framework, database, queue, or middleware, it should be tested with those components present. 

---

### 28.3 Auth Tests

Authentication tests should validate **Supabase Auth + JWT verification**, protected routes, refresh-token handling, and role-based access outcomes. The architecture defines RS256 JWT verification, access token expiry, refresh-token rotation, guarded routes, and memory-only access-token handling as important security rules. 

Auth tests should include:
- sign-in success and failure cases, 
- expired, invalid, or malformed JWT rejection, 
- refresh-token flow and failed refresh handling, 
- role-based endpoint access and denied-path verification. 

Rule:
- Auth tests must confirm both identity validation and authorization outcomes, because a valid token with the wrong role is still a security failure for some routes. 

---

### 28.4 RLS Tests

RLS tests are one of the most important security-test categories in this platform because tenant isolation is enforced through **tenantid on every table, PostgreSQL RLS, Prisma middleware, TenantInterceptor, and JWT-derived tenant context**. The architecture explicitly requires RLS enforcement checks on every PR and treats RLS as non-negotiable. 

RLS test scenarios should cover:
- tenant A cannot read tenant B rows even with direct DB queries lacking explicit filters, 
- insert, update, delete, and select policy behavior, 
- failure when tenant context is missing, 
- Prisma middleware and DB-layer defense working together correctly. 

Rule:
- Tenant isolation should be tested as defense in depth, not as one policy check in one layer only. 

---

### 28.5 Webhook Verification Tests

Webhook verification tests should focus on the architecture’s mandatory **HMAC-SHA256 signature validation, idempotency checks, Cloudflare rate limiting assumptions, and queue-based ingestion flow**. The documents explicitly call webhook security mission-critical because a bad webhook can flood queues, create cost spikes, and disrupt all downstream modules. 

Webhook security tests should include:
- valid signature acceptance, 
- invalid signature rejection, 
- duplicate webhook handling via unique-id or idempotency logic, 
- malformed payload and replay-style behavior. 

Rule:
- Every inbound webhook route should be treated like an internet-facing attack surface, not a trusted integration shortcut. 

---

### 28.6 API Abuse Tests

API abuse tests should validate how the platform behaves under hostile or noisy traffic rather than only legitimate user requests. The architecture already identifies Cloudflare rate limits, queue backlog risks, webhook flooding, AI provider cost exposure, and concurrency-sensitive paths as operational and security concerns. 

API abuse testing should include:
- rate-limit and burst behavior on public or semi-public endpoints, 
- malformed request floods and oversized payload rejection, 
- auth brute-force and token misuse scenarios, 
- webhook burst simulation and queue-enqueue pressure tests with k6 where appropriate. 

Rule:
- Abuse testing is not only about blocking attackers; it is also about proving the platform fails safely under stress. 

---

### 28.7 Pen Test Coverage

Penetration testing should cover the highest-risk architecture surfaces, especially **auth, RLS, tenant isolation, webhook endpoints, admin paths, integrations, exports, and AI-assisted decision paths**. The earlier architecture sections consistently emphasize these as the most sensitive boundaries in the system. 

Pen-test coverage should include:
- JWT and RBAC bypass attempts, 
- cross-tenant access and RLS bypass attempts, 
- webhook forgery, replay, and flood paths, 
- admin or export misuse, 
- OAuth-connected integration abuse and token scope misuse. 

Rule:
- Pen-test scope should follow real business impact: anything that can expose tenant data, trigger unsafe automation, or break ingress deserves priority. 

---

### 28.8 Regression Security Tests

Regression security testing ensures fixes stay fixed as modules evolve. The tooling inventory and architecture already support this through PR gates, reusable fixtures, golden datasets, contract tests, event-flow verification, and realistic infra-backed tests. 

Regression security tests should cover:
- every previously fixed auth, RLS, webhook, or queue abuse bug, 
- contract-level validation for AI endpoints and structured outputs, 
- event-flow regressions that could re-open unsafe automation paths, 
- release-critical user journeys with protected routes and tenant-scoped data. 

Rule:
- Any security bug that required incident handling or hotfixing should gain a permanent regression test. 

---

## 29. Security Risks and Exceptions

### 29.1 Known Risks

The source documents already describe several architectural and operational risks that are known today rather than hypothetical. These include early-stage single points of failure, future migration points, provider dependencies, and scale-triggered architecture changes. 

Known risks include:
- Redis and BullMQ as a critical-path dependency and early single point of failure, 
- Railway-to-AWS migration risk as scale grows, 
- module extraction risk from modular monolith to services later, 
- provider dependence for LLM features and managed platform services. 

Rule:
- Known risks should be documented openly so the team can design tests, alerts, and mitigation plans around them. 

---

### 29.2 Accepted Risks

Some risks are intentionally accepted because the platform is staged for speed now and stronger redundancy later. The documents make this clear by approving early managed hosting, later HA upgrades, and later dedicated incident tooling rather than requiring enterprise-grade redundancy on day one. 

Currently acceptable risk examples include:
- Railway as the Phase 1–2 hosting path before AWS ECS migration, 
- no full Phase 1 LLM failover in some documented states of the architecture, with graceful retry/DLQ behavior instead, 
- planned, not immediate, upgrade to stronger Redis HA or on-call tooling. 

Rule:
- Accepted risk should be explicit, time-bounded where possible, and linked to a future trigger or mitigation plan. 

---

### 29.3 Temporary Exceptions

Temporary exceptions are necessary when a high-priority issue cannot be remediated immediately, but the tooling inventory already makes clear that unresolved high or critical issues should only continue with an **approved exception**. This means exceptions are governance objects, not informal verbal agreements. 

Each temporary exception should record:
- the finding or risk being accepted, 
- why immediate remediation is not feasible, 
- compensating controls in place, 
- owner, review date, and expiry date. 

Rule:
- If an exception has no owner or no expiry, it is not temporary in practice. 

---

### 29.4 Compensating Controls

Compensating controls are important because not every risk can be removed instantly. The architecture already relies on layered controls such as **RLS, Prisma middleware, JWT guards, RBAC, Cloudflare, HMAC verification, queue retries, DLQs, and human review for low-confidence AI outputs**. 

Common compensating controls in this platform include:
- defense in depth for tenant isolation, 
- Cloudflare rate limiting for exposed ingress paths, 
- fallback and retry behavior for provider or queue failures, 
- confidence-score gating and manual review for risky AI outputs. 

Rule:
- A compensating control should reduce real risk, not just sound reassuring in a document. 

---

### 29.5 Risk Owners

The tooling inventory is very clear that dependencies, services, and operational areas need explicit owners such as **Security Owner, DevOps Lead, AI Lead, Backend Lead, Data Lead, Integrations Owner, and Tech Lead**. Security risks should follow the same ownership model. 

Suggested ownership model:
- **Security Owner:** auth, secrets, RLS, RBAC, compliance, and incident coordination. 
- **DevOps Lead:** hosting, observability, deployment, and recovery risks. 
- **AI Lead:** provider, prompt, model, and low-confidence automation risks. 
- **Data Lead / Backend Lead:** database, queue, schema, and migration risks. 
- **Integrations Owner:** CRM, webhook, OAuth, and third-party integration risks. 

Rule:
- Every material risk should have one accountable owner even if several teams help mitigate it. 

---

### 29.6 Review Expiry Dates

The source documents do not define a universal expiry schedule, but they strongly support review discipline, ADR updates, exception handling, and time-bound operational governance. Risk and exception records should therefore always include a next review date and an expiry date where temporary acceptance is intended. 

Practical review guidance:
- critical temporary exceptions should be reviewed frequently, 
- accepted architectural risks should be revisited at phase transitions or scale triggers, 
- expired exceptions should force re-approval, remediation, or formal risk acceptance update. 

Rule:
- A risk register without review dates becomes a graveyard of forgotten problems. 

---

## 30. Operational Runbooks

### 30.1 Secret Rotation Runbook

The architecture explicitly states that **Doppler manages all environment variables**, no secrets should live in repos or images, and AI and integration credentials must be centrally governed. This makes Doppler the control point for secret rotation. 

Secret rotation runbook:
1. Identify the affected secret, owner, scope, and dependent services. 
2. Generate a replacement secret in the provider system, not in source code. 
3. Update the secret in Doppler and deploy only the affected services. 
4. Validate health checks, auth flows, and affected integrations. 
5. Revoke the old secret and record the rotation in the audit trail or incident log. 

Rule:
- Rotate centrally, validate quickly, revoke old credentials only after the new path is confirmed healthy. 

---

### 30.2 Token Compromise Runbook

Token compromise can affect user JWT sessions, refresh tokens, OAuth tokens, or service credentials depending on the incident. The architecture already supports session revocation, JWT expiry, refresh-token rotation, and role-change-driven forced re-login patterns. 

Token-compromise runbook:
1. Classify which token type is affected and estimate blast radius. 
2. Revoke active sessions or provider tokens where supported. 
3. Rotate related secrets or OAuth client credentials if compromise extends beyond one user session. 
4. Monitor for repeated unauthorized use and preserve evidence. 
5. Notify affected stakeholders if customer impact exists. 

Rule:
- If there is real compromise suspicion, treat the token as hostile immediately rather than waiting for perfect certainty. 

---

### 30.3 Webhook Abuse Runbook

Webhook abuse is a top-priority runbook because the architecture explicitly calls webhook security mission-critical and warns that bad webhooks can flood queues, create cost spikes, and impact all downstream modules. Protections already include HMAC verification, Cloudflare rate limiting, idempotency, priority queues, and alerting on rejection anomalies. 

Webhook abuse runbook:
1. Confirm whether abuse is invalid-signature spam, replay traffic, malformed floods, or noisy but legitimate bursts. 
2. Tighten Cloudflare rate limits or block abusive sources if needed. 
3. Verify HMAC validation, idempotency checks, and webhook secret integrity. 
4. Inspect BullMQ backlog and protect legitimate high-priority ingestion. 
5. Coordinate with the integration owner if source-side behavior appears broken. 

Rule:
- Protect the queue and ingress path first, then investigate the exact source pattern. 

---

### 30.4 Tenant Isolation Incident Runbook

A tenant isolation incident is one of the most severe scenarios in this platform because the architecture treats RLS, Prisma middleware, JWT claims, and RBAC as non-negotiable layered controls. Any suspected cross-tenant leak should be treated as a critical incident until disproven. 

Tenant-isolation incident runbook:
1. Escalate immediately to Security Owner and Tech Lead. 
2. Freeze affected write paths or high-risk read paths if exposure may still be active. 
3. Capture evidence, including request IDs, user IDs, tenant IDs, SQL path, and audit logs. 
4. Validate RLS policies, session tenant context, Prisma middleware behavior, and route-level auth path. 
5. Patch, retest, and review all similar endpoints before closing the incident. 

Rule:
- Never assume a cross-tenant issue is “just one endpoint” until the full control chain is checked. 

---

### 30.5 AI Provider Outage Runbook

The architecture documents provider routing through LiteLLM, queued retry behavior, 503 behavior for unavailable AI paths, and fallback strategy that evolves by phase. It also clearly separates AI-dependent features from core product layers where possible. 

AI provider outage runbook:
1. Confirm whether the issue is provider-side, LiteLLM routing, quota exhaustion, or credential failure. 
2. Check whether configured fallback is available and healthy. 
3. Allow queued jobs to retry with configured backoff and monitor DLQ growth. 
4. Degrade AI-dependent user flows safely rather than breaking the whole app. 
5. After recovery, replay DLQ jobs where appropriate and validate output quality. 

Rule:
- Preserve core product availability even when AI-assisted features are degraded. 

---

### 30.6 Redis Outage Runbook

Redis is explicitly documented as a **critical path** and early **single point of failure** because BullMQ and event-driven processing depend on it. If Redis is down, inter-module communication, transcription jobs, and AI processing can stall even if the API still appears alive. 

Redis outage runbook:
1. Confirm outage scope, whether Redis itself is unavailable or connectivity is failing. 
2. Alert DevOps Lead and affected service owners immediately. 
3. Pause non-essential queue producers if backlog amplification is likely. 
4. Restore Redis service or fail to the higher-availability path if available. 
5. Re-drive idempotent jobs carefully and verify no duplicate side effects. 

Rule:
- After Redis recovery, validate correctness before throughput. 

---

### 30.7 Database Restore Runbook

The primary database recovery model is **Supabase PostgreSQL with PITR**, and PostgreSQL is the source of truth for tenants, users, deals, transcripts, detections, AI outputs, audit logs, and sync state. That makes database restore one of the most sensitive operational runbooks. 

Database restore runbook:
1. Identify restore point and reason for recovery, such as corruption, deletion, or platform outage. 
2. Restore to a controlled environment first when possible. 
3. Validate schema integrity, RLS, tenant scoping, and critical application tables before cutover. 
4. Check integration state, queue recovery implications, and application health after reconnect. 
5. Run post-restore validation on key user journeys and audit-log continuity. 

Rule:
- A database restore is successful only when restored data is correct, tenant-safe, and usable by the application. 

---


## 31. Governance and Review

### 31.1 Control Ownership

Control ownership must be explicit, because the architecture already assigns clear accountability across the platform rather than leaving shared controls to informal team understanding. The System Architecture Document names the **Tech Lead** as document owner and sign-off authority, while the tooling inventory repeatedly maps platform areas to named owners such as **Security Owner, DevOps Lead, AI Lead, Backend Lead, Frontend Lead, Data Lead, QA Lead, and Integrations Owner**. 

Recommended control ownership model:
- **Tech Lead:** overall architecture governance, final approval on shared architecture changes, version upgrades, ADR direction, and document sign-off. 
- **Security Owner:** auth, JWT, RBAC, RLS, secrets governance, webhook security, incident coordination, and compliance-control enforcement. 
- **DevOps Lead:** hosting, deployment, Redis, observability, Cloudflare, Sentry, Better Stack, Grafana, backup and recovery readiness. 
- **AI Lead:** LiteLLM, OpenAI and fallback routing, AI endpoint contracts, prompt governance, confidence gating, model evaluation, and AI outage handling. 
- **Backend Lead / Data Lead:** NestJS services, Prisma, PostgreSQL, RLS enforcement checks, schema governance, event contracts, exports, and data-layer integrity. 
- **QA Lead:** integration, E2E, performance, regression, and security test execution discipline. 
- **Integrations Owner:** CRM, conferencing, email, webhook, OAuth, and warehouse export boundaries. 

Rule:
- Every control must have one clearly accountable owner, even if implementation support is shared across multiple teams. 

---

### 31.2 Review Cadence

The architecture document already defines a formal review cadence and staleness policy. It states that the document should be reviewed **every 3 months**, or **immediately after any major architecture decision or platform-wide change**, with **90 days without review** treated as potentially stale. 

Recommended review cadence:
- **Quarterly full review:** review the full security and governance posture at least every 3 months. 
- **Event-driven review:** review immediately after major architecture, integration, security, or compliance changes. 
- **Phase-transition review:** perform a full review at the start of each new delivery phase and before material extraction or migration decisions. 
- **Exception review:** review accepted risks and temporary exceptions on their defined review date, not only during quarterly cycles. 

Rule:
- Governance review should be both scheduled and event-driven, because waiting for the next quarter after a major change is too slow. 

---

### 31.3 Architecture Review Triggers

The System Architecture Document explicitly lists the kinds of changes that require immediate update and review, especially when they affect shared services, integrations, security controls, platform-wide data models, or AI processing patterns. It also requires checking whether a decision belongs in the shared architecture rather than inside a feature-only TDD. 

Architecture review should be triggered when:
- a new external integration is added or a major existing integration changes, 
- a new shared service, shared schema, or shared data model is introduced, 
- a platform-level architecture decision is reversed or significantly changed, 
- a new AI model type, routing pattern, agent workflow, or multi-feature AI pipeline is introduced, 
- a module extraction, hosting migration, search migration, or other phase-shaping infrastructure shift is proposed. 

Rule:
- If a decision affects more than one module or changes a shared platform boundary, it requires architecture review before merge. 

---

### 31.4 Compliance Review Triggers

The architecture and tooling inventory treat compliance as a built-in platform concern rather than a downstream legal cleanup task. They explicitly reference GDPR and CCPA controls, compliance settings, audit and retention controls, deletion and export behavior, and reference documents such as the Compliance Controls Matrix and Incident Response Playbook. 

Compliance review should be triggered when:
- data retention, deletion, export, or audit-log behavior changes, 
- a new data processor, AI provider, warehouse export path, or external integration is introduced, 
- customer data handling scope changes, especially for audio, transcripts, CRM data, or AI-generated outputs, 
- a platform-wide security control changes in a way that affects privacy, access, consent, or logging obligations, 
- a temporary exception or accepted risk touches regulated or customer-sensitive data handling. 

Rule:
- Any change that affects how customer data is stored, processed, exported, deleted, or accessed should trigger compliance review before release. 

---

### 31.5 Change Approval Rules

The update process in the System Architecture Document is very explicit: shared changes are made by PR, the PR must describe what changed and why, and **Tech Lead approval is mandatory** before merge. The tooling inventory reinforces the same rule for new shared tools, major upgrades, and platform-level decisions. 

Change approval rules should be:
- **Pull request required** for all shared governance, architecture, and control changes. 
- **Tech Lead approval mandatory** for any shared architecture or document change. 
- **Domain-owner review required** for changes affecting their section or control area, such as Security Owner, AI Lead, Backend Lead, or DevOps Lead. 
- **Higher scrutiny for major changes** such as infra migrations, auth changes, AI provider shifts, or module extraction. 
- **No silent production adoption** of new shared tools, models, or services without review. 

Rule:
- If a shared change cannot identify its approver, owner, and affected sections, it is not ready to merge. 

---

### 31.6 Versioning Rules

The architecture document already defines a formal versioning convention for the main document. It distinguishes **v0.x draft**, **v1.0 first approved**, **v1.x minor update**, and **v2.0 major revision**, with major versions reserved for significant architectural shifts such as platform, module, or core-technology changes. 

Versioning rules should be:
- **v0.x:** draft state, not yet the final approved engineering reference. 
- **v1.0:** first approved baseline after full review and sign-off. 
- **v1.x:** minor updates such as clarifications, corrections, new references, or governance improvements that do not fundamentally change architecture. 
- **v2.0 or higher major bump:** required when a core architectural decision changes significantly, such as hosting model, module structure, or foundational technology choice. 
- **Revision history update required:** every document update must add a corresponding revision-history entry before merge. 

Rule:
- Version numbers should reflect architectural impact, not just the amount of edited text. 

---

## 32. Appendices

### 32.1 Glossary

The System Architecture Document already includes a glossary and key-terms section, and it should remain the canonical appendix for shared definitions across engineering, QA, product, and operations. This is important because the platform uses many layered concepts such as modular monolith, Revenue Graph, RLS, BullMQ, LiteLLM, tenant isolation, and staged module delivery. 

The Glossary appendix should include:
- platform-specific terms, 
- security and compliance terms, 
- AI and data-layer terms, 
- operational and testing terms used across runbooks and review processes. 

Rule:
- If a term can be misunderstood by a fresher or a reviewer outside the owning team, define it in the glossary. 

---

### 32.2 Acronyms

The architecture document already tracks acronym-heavy content and should keep a dedicated acronym appendix for fast reference. This matters because the platform spans engineering, AI, infra, and compliance domains, each with its own shorthand. 

Acronyms appendix should include terms such as:
- ADR, API, ASR, RBAC, RLS, JWT, PITR, DLQ, PII, SLA, NFR, CRM, and WAF. 

Rule:
- Acronyms should be expanded once in body sections and always listed centrally in the appendix for quick lookup. 

---

### 32.3 Reference Diagrams

The architecture document already contains high-level architecture, system context, data flow, module boundary, and auth or tenancy flow references, even if some diagram rendering needs cleanup. A security or governance document should reference the approved diagrams rather than duplicating inconsistent copies. 

Reference diagrams appendix should point to:
- high-level platform architecture, 
- module and service boundary diagrams, 
- end-to-end data flow diagrams, 
- auth, tenant-isolation, and webhook-flow diagrams where maintained. 

Rule:
- Keep one approved source for each diagram and reference it consistently across related documents. 

---

### 32.4 Control Matrix

The tooling inventory and architecture both describe many controls, owners, and enforcement layers, which makes a consolidated control matrix useful as an appendix. This matrix should map controls to owner, implementation layer, validation method, review cadence, and related risks or documents. 

Control matrix columns should include:
- control ID, 
- control name and purpose, 
- owner, 
- implementation layer, such as app, DB, infra, or process, 
- validation method, such as tests, review, monitoring, or audit, 
- related risks, exceptions, and linked documents. 

Rule:
- The control matrix should help an auditor or fresher quickly answer who owns a control, where it lives, and how it is verified. 

---

### 32.5 Threat Register

While the detailed threat model is referenced as a separate security architecture document, the System Architecture Document already points to that supporting material and identifies high-risk surfaces such as webhooks, tenant isolation, auth, AI dependencies, and infrastructure migration paths. A summarized threat register appendix should consolidate those recurring risks in one place. 

Threat register entries should include:
- threat ID and title, 
- affected asset or boundary, 
- risk description and likely impact, 
- current controls and compensating controls, 
- owner, status, and next review date. 

Rule:
- The threat register should be living governance data, not a one-time workshop artifact. 

---

### 32.6 Data Flow References

Data flow references are especially important in this platform because the architecture is lifecycle-driven and many downstream capabilities depend on upstream event and data correctness. The System Architecture Document already treats end-to-end data flows and event flow verification as foundational platform behavior. 

The data-flow appendix should reference:
- capture to transcription flow, 
- transcription to Revenue Graph linking, 
- AI processing and summary generation flow, 
- CRM sync and warehouse export flow, 
- incident-relevant flows such as webhook ingress, queue processing, and restore-sensitive persistence paths. 

Rule:
- Every critical control should be traceable to at least one documented data flow. 

---

### 32.7 Related Documents

The System Architecture Document already names supporting documents that should be referenced instead of duplicating deep detail inside the main control document. Examples include the **Security Architecture Document (T-07)**, **Data Retention Policy (T-08)**, **Compliance Controls Matrix (T-09)**, and **Incident Response Playbook (T-10)**. 

Related documents appendix should include:
- System Architecture Document, 
- Security Architecture Document, 
- Data Retention Policy, 
- Compliance Controls Matrix, 
- Incident Response Playbook, 
- relevant feature TDDs, API design documents, QA plans, and tooling inventory where they govern shared controls. 

Rule:
- Appendices should reference the source of truth for detail, not clone it into multiple places where it will drift. 

---





