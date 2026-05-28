# Doc #11b — Technical Design Document: Native Connectors

## 1. Document Control

- **Document Title:** TDD — Native Connectors
- **Feature Name:** Native Connectors
- **Module Name:** M-01 Capture & Transcription
- **Document ID:** DOC-11B-M01-NATIVE-CONNECTORS
- **Version:** v3.0
- **Status:** Approved
- **Owner:** Tech Lead / Integrations Lead
- **Reviewers:** Backend Lead, Security Owner, AI Lead, DevOps Lead, QA Lead, RevOps Product Owner
- **Last Updated:** 2026-05-18
- **Primary Upstream References:** System Architecture Document (SAD), M-01 feature mapping, Tooling and Services Inventory
- **Primary Downstream Dependencies Enabled By This Feature:** Call Transcription, AI Data Extractor, Revenue Graph ingestion readiness, future email/calendar and CRM sync flows

### 1.1 Purpose of this document

This document defines the internal technical design for the **Native Connectors** feature inside **M-01 Capture & Transcription**. It covers connector onboarding, credential handling, webhook registration, connection lifecycle, source health tracking, reconnect and disconnect behavior, and the rules that allow upstream systems to feed M-01 safely and consistently.

### 1.2 Design authority and boundaries

This TDD owns feature-specific design for external connector setup and lifecycle management only. It does not redefine platform-wide rules such as modular monolith constraints, tenant isolation, queue standards, auth foundations, or shared observability rules, which remain governed by the SAD.

### 1.3 Why this document matters

Without Native Connectors, M-01 has no trusted way to receive recordings, metadata, CRM context, or email/calendar context from external systems. Native Connectors are the controlled entry gate that makes the rest of the capture pipeline possible.

---

## 2. Purpose

### 2.1 Problem statement

Revenue intelligence only works when customer interaction data is captured automatically from the systems where work actually happens. If Zoom, Teams, Meet, dialers, CRM, Gmail, or Outlook are not connected correctly, the platform receives no reliable input, which means no transcript, no structured extraction, and no downstream intelligence.

### 2.2 What this feature does

Native Connectors provides secure, out-of-the-box integrations for supported external systems. It manages source onboarding, credential storage, webhook setup, connection verification, sync status tracking, reconnect/disconnect workflows, and idempotent source event intake so M-01 can capture interactions without manual logging or ETL.

### 2.3 Why this feature exists in M-01

M-01 is the capture-stage module. Native Connectors belongs here because it is the mechanism that brings raw interaction data into the platform and establishes the trusted source channels used by Call Transcription and AI Data Extractor.

### 2.4 Business value

This feature enables:
- Automatic interaction capture from conferencing and telephony sources.
- Trusted webhook intake with verified source authenticity.
- CRM, email, and calendar connection foundations for future context enrichment.
- Reduced manual data entry by sales teams and RevOps.
- Faster customer onboarding because standard integrations are productized instead of custom-built each time.

---

## 3. Scope

### 3.1 In scope

- Connector onboarding flow for supported systems.
- Tenant-scoped source registration and configuration.
- OAuth2 and webhook-based authentication flows where applicable.
- Storage of connector metadata in M-01 source tables.
- Webhook registration and secret provisioning for supported providers.
- Source status lifecycle management.
- Health checks and last sync tracking.
- Reconnect and disconnect behavior.
- Verification of source ownership and tenant association.
- Idempotent handling of inbound source events.
- Minimal connector read APIs for listing and status visibility in the product.
- Observability around source failures, auth failures, webhook verification failures, and sync health.

### 3.2 Out of scope

- Deep CRM bidirectional data modeling.
- Revenue Graph entity linking logic.
- Email composition or outbound mail sending.
- AI-based transcript or field extraction logic.
- Downstream analytics and search indexing.
- Human workflow design for complex admin dashboards beyond basic source management.
- Building custom one-off integrations outside the approved supported connector list.
- Owning third-party systems or replacing their infrastructure.

### 3.3 Assumptions

- Platform Core already provides JWT auth, tenant context, RBAC, and audit logging.
- RevOps or admin users are responsible for connector setup.
- External systems provide supported auth and event mechanisms.
- Sensitive tokens and secrets are stored in approved secrets systems and encrypted persistence paths.
- Redis, PostgreSQL, and queue-backed async processing are available.

### 3.4 Dependencies

**Internal dependencies**
- Platform Core auth and RBAC.
- Audit logging service.
- PostgreSQL with tenant isolation.
- BullMQ + Redis for async onboarding and sync jobs.
- Secret management through approved platform tooling.
- M-01 Call Transcription and AI Data Extractor as downstream feature consumers.

**External dependencies**
- Zoom
- Microsoft Teams
- Google Meet
- Telephony/dialer providers
- Salesforce
- HubSpot
- Microsoft Dynamics 365
- Gmail
- Outlook / Office 365

The architecture treats all of these as external systems outside the product boundary, and the platform reads from or writes approved outputs to them without claiming ownership of those systems.

---

## 4. Users and Triggers

### 4.1 Primary users or systems

- RevOps admins
- Workspace admins
- AE/SDR users indirectly benefiting from connected sources
- External provider systems sending webhooks or participating in OAuth flows
- Internal M-01 sync jobs and connector workers.

### 4.2 Trigger conditions

This feature starts when one of the following happens:
- A RevOps user connects a new source from the app.
- A connector token expires and needs re-authentication.
- A provider sends a webhook requiring source lookup and verification.
- A scheduled health check or sync job runs.
- A user disconnects a source.
- An admin retries or repairs a failed connector.

### 4.3 Entry points

Typical entry points:
- `POST /api/v1/m01-capture-transcription/sources`
- `GET /api/v1/m01-capture-transcription/sources`
- OAuth callback routes
- Provider webhook registration or verification callback routes
- Internal scheduled sync job trigger
- Admin reconnect/disconnect action endpoints

The architecture explicitly lists `POST /api/v1/m01-capture-transcription/sources` and `GET /api/v1/m01-capture-transcription/sources` as M-01 endpoints for source connection and status listing.

### 4.4 Preconditions

Before a connector can be used:
- User must be authenticated.
- User must have RevOps or admin role.
- Tenant must be resolved.
- Required provider credentials or OAuth approval must be completed.
- Connector type must be one of the approved supported systems.
- Required secrets and callback URLs must be configured for the environment.

---

## 5. Functional Flow

### 5.1 Happy path

1. RevOps user opens the Connect Source flow in the product.
2. User selects a source type such as Zoom, Teams, Meet, dialer, Salesforce, HubSpot, Dynamics, Gmail, or Outlook.
3. M-01 validates that the connector type is supported and available in the current phase.
4. User authenticates using OAuth2 or enters required source configuration details, depending on the provider.
5. M-01 stores a tenant-scoped source record in `m01_capture_transcription.ingestion_sources`.
6. If the provider supports or requires webhooks, M-01 registers the webhook endpoint and generates or stores verification secrets.
7. M-01 performs initial connection verification, such as token exchange, test API call, or webhook challenge handling.
8. Source status is set to `connected` if validation succeeds.
9. Initial metadata such as platform, last sync time, auth mode, and status is persisted.
10. Scheduled or event-driven jobs use the connector to pull or receive interaction data for downstream M-01 features.

### 5.2 Alternate paths

- Provider connection succeeds, but webhook registration fails, so source status becomes `error` with actionable recovery reason.
- OAuth succeeds, but initial scope set is incomplete, so connector is created in a degraded state and flagged for re-consent.
- Manual configuration is saved first, and final verification completes asynchronously.
- Source is connected but temporarily throttled by provider APIs, so sync is delayed without disconnecting the connector.

### 5.3 Failure paths

- OAuth token exchange fails.
- Webhook verification challenge fails.
- Provider rejects callback URL.
- Required permission scopes are missing.
- Duplicate connector is created for the same tenant and same logical source.
- Token expires and refresh fails.
- Provider API becomes unavailable.
- Reconnect attempt fails after retries.
- Disconnect removes app-side access, but provider-side webhook cleanup partially fails.

### 5.4 Retry behavior

- Async onboarding steps may retry for transient provider/network issues.
- Token refresh may retry using safe backoff rules.
- Webhook registration retries only when provider semantics allow safe repetition.
- Sync health updates retry on transient DB or queue issues.
- Permanent auth failures should not loop endlessly; they must move connector to `error` or `reauth_required` state.

### 5.5 Queue responsibilities

BullMQ is used for:
- async connector verification
- background webhook registration tasks
- token refresh jobs
- scheduled source sync checks
- repair and reconnect attempts
- provider backfill jobs where needed

This keeps request handlers short and avoids blocking UI or provider callbacks on slow external APIs.

---

## 6. Inputs and Outputs

### 6.1 Inputs

**User-provided inputs**
- connector type
- provider account or workspace selection
- OAuth grant or auth code
- optional display name
- source-specific settings
- tenant context
- acting user ID

**System inputs**
- provider callback payloads
- webhook verification tokens or signatures
- access token and refresh token data
- provider metadata such as workspace ID, account ID, tenant ID, domain, or team ID
- scheduled sync trigger metadata

**Inbound source event inputs**
- webhook headers
- event payload
- event ID or external unique identifier
- source/provider identity
- raw request body for signature verification.

### 6.2 Output artifacts

This feature produces:
- connected source records
- auth metadata and source configuration state
- webhook registration details
- connector health status
- last sync timestamps
- reconnect/disconnect audit trail
- verified mapping from external provider identity to internal tenant source
- downstream eligibility for call ingestion and context enrichment.

### 6.3 Events emitted

Native Connectors is mainly a control-plane feature, but it should publish internal events when connector lifecycle changes matter operationally. Recommended internal events:

- `connector.connected`
- `connector.connection.failed`
- `connector.reauth.required`
- `connector.disconnected`
- `connector.health.degraded`

These events are primarily for platform observability and async repair workflows. These are strictly internal-only events and will not be formalized in the shared platform event registry. The core published cross-module event required by M-01 remains `call.transcription.completed`, not connector events.

### 6.4 APIs exposed or consumed

**Exposed by M-01**
- `POST /api/v1/m01-capture-transcription/sources`
- `GET /api/v1/m01-capture-transcription/sources`
- reconnect/disconnect endpoints
- OAuth callback endpoints
- provider webhook endpoints for supported conferencing and telephony systems

**Consumed by M-01**
- provider OAuth token endpoints
- provider webhook registration APIs
- provider metadata and recording APIs
- provider health or validation endpoints where available.

---

## 7. Data Model

### 7.1 Tables used

Primary M-01 table for Native Connectors:
- `m01_capture_transcription.ingestion_sources`

Related read/write tables depending on downstream actions:
- `m01_capture_transcription.calls` for call-producing connectors
- platform audit logs through Core service
- future connector state or token tables if design is later normalized further.

### 7.2 Table ownership

Native Connectors owns source connection records in M-01. Other modules may consume connector outcomes through events or public APIs but must not write directly into `m01_capture_transcription.ingestion_sources`.

### 7.3 Current core fields from architecture

#### `m01_capture_transcription.ingestion_sources`
- `source_id` UUID primary key
- `tenant_id` UUID not null
- `platform` varchar
- `connection_status` varchar
- `last_synced_at` timestamptz
- `webhook_secret` text

The architecture explicitly shows this table as the M-01 source registry for connected platforms and webhook secret management.

### 7.4 Recommended additional fields

To make connector lifecycle manageable in production, this TDD recommends adding:
- `externalAccountId` varchar
- `externalWorkspaceId` varchar nullable
- `displayName` varchar
- `authType` varchar
- `tokenStatus` varchar
- `reauthRequired` boolean
- `lastHealthCheckAt` timestamptz
- `lastErrorCode` varchar nullable
- `lastErrorMessage` text nullable
- `disconnectedAt` timestamptz nullable
- `createdByUserId` UUID
- `updatedAt` timestamptz
- `configJson` jsonb for provider-specific non-secret configuration

Secrets themselves should not be stored casually as plain DB text unless encrypted by approved platform controls and justified by implementation constraints.

### 7.5 Validation rules

- Every source row must include `tenantId`.
- `platform` must be from the allowed enum list.
- `connectionStatus` must be from controlled lifecycle states.
- Only one active connector of the same unique provider account per tenant should be allowed unless explicitly designed otherwise.
- Provider account identity must be verified before marking as `connected`.
- Secret and token fields must never be returned in normal API responses.

### 7.6 Idempotency keys

Recommended idempotency keys:
- `tenantId + platform + externalAccountId`
- webhook registration job key per source
- provider webhook event ID
- OAuth callback state token
- scheduled sync job key per source and sync window

These keys prevent duplicate connector creation, duplicate webhook setup, and duplicate source event processing.

### 7.7 Suggested status lifecycle

Recommended connector lifecycle:
- `pending`
- `verifying`
- `connected`
- `degraded`
- `reauth_required`
- `error`
- `disconnected`

This gives enough states for product visibility and operational recovery without overcomplicating the first release.

---

## 8. Service and Integration Design

### 8.1 Internal services involved

- Source Management Controller
- Connector Service
- OAuth Callback Handler
- Webhook Verification Service
- Webhook Registration Service
- Provider Client Adapters
- Token Refresh Worker
- Health Check Worker
- Audit Logging Service
- Queue publishers and consumers for async connector jobs.

### 8.2 External integrations

Supported source categories for Native Connectors include:
- Conferencing: Zoom, Microsoft Teams, Google Meet
- Telephony: supported dialer and telephony providers
- CRM: Salesforce, HubSpot, Microsoft Dynamics 365
- Email/Calendar: Gmail, Outlook / Office 365

The feature mapping explicitly defines Native Connectors as secure integrations across CRM, email/calendar, conferencing, telephony, and GTM tools to auto-capture interactions and enrich with CRM context.

### 8.3 Auth method

Auth varies by connector type:
- Conferencing and telephony webhooks: HMAC-SHA256 verification for inbound events.
- CRM, Gmail, Outlook, and many provider account connections: OAuth2 delegated authorization.
- Internal service calls: platform-approved internal auth and secret delivery.

The architecture is explicit that conferencing webhooks are mission-critical entry points and must use HMAC verification plus idempotency and rate limiting.

### 8.4 Rate limits and quotas

Connector design must consider:
- provider API rate limits
- OAuth refresh token quotas or rotation rules
- webhook burst traffic
- initial backfill or sync spikes
- tenant-level connector activity bursts

Connector workers must throttle provider calls and prefer queued background execution over synchronous UI blocking.

### 8.5 Fallback behavior

- If provider metadata fetch fails temporarily, keep connector in `degraded` instead of fully disconnected.
- If token refresh fails permanently, move to `reauth_required`.
- If webhook creation fails, store the connector but do not treat it as healthy for ingestion.
- If provider callback volume spikes, queue and rate-limit rather than dropping all traffic immediately.

---

## 9. AI Processing

### 9.1 AI step in the pipeline

Native Connectors itself is not an AI-heavy feature. Its main job is secure integration orchestration, not inference. However, it is part of the AI-native pipeline because it supplies the trusted source inputs that later AI services consume.

### 9.2 AI service endpoint

This feature does not directly require a dedicated AI endpoint for normal onboarding or connector lifecycle management. It is upstream of AI-dependent features such as transcription and extraction.

### 9.3 Input to AI

No direct AI input is required for connector creation. Any source data collected through these connectors may later become input to:
- transcription service for audio
- AI extraction service for transcript text
- future summarization, topic detection, and search enrichment flows.

### 9.4 Output from AI

Not applicable for baseline connector lifecycle. If future connector intelligence is added, such as auto-diagnosing connector issues, it must remain optional and separate from the core connector reliability path.

### 9.5 Confidence handling

Not applicable for primary connector operations. Reliability and verification status replace confidence semantics here.

### 9.6 Human review rules

Human intervention is required when:
- a connector is stuck in `reauth_required`
- permissions are incomplete
- webhook verification repeatedly fails
- provider-side app setup is incomplete
- disconnect cleanup is only partially successful

This is an operational review path, not an AI review path.

---

## 10. Security and Compliance

### 10.1 Tenant isolation

Every connector must be tenant-scoped. Every row in `m01_capture_transcription.ingestion_sources` must include `tenant_id`, and every query must enforce tenant filtering through the approved RLS and application-level protections.

### 10.2 Access control

- Only authorized admin or RevOps users can create, reconnect, or disconnect sources.
- Normal sales users should only see allowed source status views if product policy permits it.
- Webhook endpoints must validate authenticity before any heavy processing.
- Source secrets and tokens must never be exposed in user-facing APIs.

### 10.3 Secret handling

- OAuth client secrets, refresh tokens, webhook secrets, and provider keys must be stored in approved secret management or encrypted persistence.
- Doppler is the approved secrets platform for environment-level secret handling.
- No secrets in source control, logs, screenshots, or plaintext error messages.

### 10.4 Audit logging

Audit at minimum:
- source created
- source verification succeeded or failed
- webhook registered
- token refreshed
- reauth required
- source disconnected
- source reconnected
- admin override or repair action

Audit entries should include tenant and acting user context, but not raw secrets.

### 10.5 Data retention

Connector metadata should be retained for operational continuity and audit. Sensitive tokens should follow the strictest practical retention and rotation policy supported by provider and platform controls.

### 10.6 Compliance constraints

- Respect least-privilege scopes when requesting provider permissions.
- Do not over-collect data beyond feature need.
- Respect customer ownership of CRM and communication data.
- Follow platform compliance settings and regional restrictions where they affect connector-enabled data flows.

---

## 11. Error Handling

### 11.1 Validation errors

Examples:
- unsupported connector type
- missing required OAuth state
- malformed callback payload
- invalid webhook challenge payload
- duplicate active source for same tenant/provider account

Behavior:
- reject at boundary
- return proper user-safe and provider-safe error responses
- log structured error context
- do not create partially trusted connector state unless explicitly designed.

### 11.2 Provider failures

Examples:
- OAuth provider downtime
- token endpoint failure
- webhook registration API failure
- provider metadata fetch timeout
- rate limit exceeded
- refresh token revoked

Behavior:
- retry transient issues
- classify permanent auth failures distinctly
- surface clear operational status to users and support teams.

### 11.3 Timeout handling

Timeout-sensitive stages:
- OAuth token exchange
- provider metadata fetch
- webhook registration API call
- token refresh
- health check APIs

Behavior:
- use bounded timeout per provider operation
- retry only safe idempotent operations
- move source to degraded or reauth state on repeated failure.

### 11.4 Partial success rules

Examples:
- source saved but webhook registration failed
- OAuth complete but required scopes missing
- disconnect in app succeeded but remote webhook deletion failed

Rules:
- show honest status
- do not label source healthy until all minimum required setup is complete
- preserve enough state for recovery and support debugging
- avoid silently pretending the connector is operational.

### 11.5 Dead-letter queue conditions

Move jobs to dead-letter handling when:
- connector verification repeatedly fails with non-recoverable worker errors
- repeated token refresh jobs fail unexpectedly
- provider response format breaks contract repeatedly
- sync health worker cannot persist final connector state after retries
- webhook registration repair job exhausts retry attempts.

---

## 12. Observability

### 12.1 Logs

Structured logs should include:
- `tenantId`
- `sourceId`
- `platform`
- `externalAccountId` where safe
- `jobId`
- `connectionStatus`
- `errorCode`
- retry count

Never log access tokens, refresh tokens, raw secrets, or full sensitive provider payloads.

### 12.2 Metrics

Track at minimum:
- connector creation attempts
- connector success rate
- connector failure rate by provider
- OAuth callback success/failure
- webhook registration success/failure
- token refresh success/failure
- webhook verification failures
- source health degradation count
- reconnect success rate
- disconnect completion rate
- sync lag and last sync age by source.

### 12.3 Alerts

Alert on:
- spike in webhook verification failures
- high connector onboarding failure rate
- repeated token refresh failures
- many sources entering `reauth_required`
- provider-specific outage patterns
- degraded source count crossing threshold
- dead-letter growth for connector workers.

### 12.4 Trace points

Important trace boundaries:
- source creation request
- OAuth redirect
- OAuth callback
- webhook registration attempt
- provider validation call
- DB commit of source record
- token refresh
- health check execution
- disconnect cleanup.

### 12.5 Dashboard needs

Connector dashboards should show:
- active connectors by platform
- unhealthy connectors by status
- reauth-required trend
- webhook verification health
- provider failure distribution
- token refresh success rate
- source sync freshness.

---

## 13. Non-Functional Requirements

### 13.1 Performance

- Source creation UI flows should return quickly and push slow provider work to async jobs where possible.
- Webhook endpoints must remain lightweight and safe under burst traffic.
- Connector listing endpoints should be fast enough for admin pages and source health views.

### 13.2 Scalability

- Connector lifecycle management must scale across many tenants and many provider accounts.
- External API pressure must be absorbed through queueing, backoff, and per-provider throttling rather than request-thread blocking.

### 13.3 Reliability

- Webhook verification must be deterministic and consistent.
- Duplicate source events must be safely ignored through idempotency.
- Token refresh and connector health workflows must be recoverable.
- Connector status must reflect actual operational truth, not optimistic assumptions.

### 13.4 Availability

- A single provider outage must not break all connector types.
- Control-plane actions should degrade per integration, not platform-wide.
- Queue-backed repair patterns should reduce the need for manual intervention.

### 13.5 Maintainability

- Use adapter-based design per provider.
- Keep shared connector lifecycle logic centralized.
- Hide provider quirks behind normalized internal contracts.
- Keep provider-specific business rules out of unrelated modules so freshers can work safely without touching the entire platform.

---

## 14. Test Strategy

### 14.1 Unit tests

Must cover:
- supported connector type validation
- source status transition rules
- idempotency key generation
- OAuth state validation
- webhook signature verification
- duplicate source detection
- provider adapter normalization logic.

### 14.2 Integration tests

Must cover:
- `POST /api/v1/m01-capture-transcription/sources`
- `GET /api/v1/m01-capture-transcription/sources`
- OAuth callback handling
- provider webhook verification
- source persistence in PostgreSQL
- queue-backed registration or refresh jobs
- tenant isolation and RBAC enforcement.

### 14.3 Contract tests

Must cover:
- provider callback payload schemas
- webhook request verification contract
- normalized internal source metadata contract
- provider adapter response mapping
- connector list API response shape with secrets removed.

### 14.4 Idempotency tests

Must verify:
- same connector cannot be created twice accidentally for same tenant/provider identity
- duplicate webhook registration job does not create duplicate registration side effects
- duplicate webhook event is ignored safely
- duplicate OAuth callback processing does not create conflicting source states.

### 14.5 Failure injection tests

Must simulate:
- invalid OAuth state
- expired auth code
- provider token refresh failure
- webhook signature mismatch
- webhook registration timeout
- provider 429 throttling
- provider 5xx outage
- PostgreSQL temporary outage
- Redis temporary outage
- partial disconnect cleanup failure.

### 14.6 Suggested edge-case coverage

- reconnect after long inactivity
- workspace renamed on provider side
- provider account transferred or disabled
- revoked scopes after initial success
- same user tries to connect already-linked provider account again
- webhook hits endpoint after connector was disconnected
- stale source status due to missing health updates.

### 14.7 Merge gate expectation

No Native Connectors change should merge unless:
- auth and RBAC tests pass
- webhook verification tests pass
- source lifecycle tests pass
- idempotency tests pass
- integration tests cover at least one OAuth connector and one webhook-based connector path.

---

## 15. Open Questions

1. Which exact provider list is in Phase 1 GA versus Phase 2 planned for Native Connectors?
2. Should CRM, email, and calendar connectors be managed in the same `m01_capture_transcription.ingestion_sources` table, or split later by subtype?
3. Where should encrypted provider refresh tokens live: encrypted DB column, secrets manager reference, or both?
4. What exact reconnect UX should product expose for `reauth_required` state?
5. **[RESOLVED]** Connector lifecycle events will remain internal-only and will not be formalized in the shared platform event registry.
6. What is the maximum allowed number of active sources per tenant per provider?
7. Should webhook registration be mandatory for all conferencing connectors, or can some providers start in polling mode?
8. How should we support provider-specific features without polluting the shared connector abstraction?
9. What is the operational SLA for token refresh recovery before user-visible degradation?
10. Should GTM tool connectors beyond the currently named systems be part of this TDD now, or deferred to a later extension document?

---

## Appendix A — Supported Source Systems

### A.1 Phase-aligned supported categories

Native Connectors covers these source categories:
- CRM
- Email and calendar
- Conferencing
- Telephony / dialers
- GTM tools as approved additions

The feature mapping explicitly describes Native Connectors this way at the product level.

### A.2 Explicit systems named in architecture

**Conferencing / call capture**
- Zoom
- Google Meet
- Microsoft Teams
- Dialers / telephony tools.

**CRM**
- Salesforce
- HubSpot
- Microsoft Dynamics 365.

**Email / Calendar**
- Gmail
- Outlook / Office 365.

### A.3 Connector support rule

Only approved providers should be exposed in production UI. New providers require Tech Lead review and must follow the same auth, idempotency, observability, and security rules as existing connectors.

---

## Appendix B — Connector Onboarding Flow

### B.1 Standard onboarding flow

1. User chooses provider.
2. Platform validates role and tenant.
3. Platform initiates OAuth or source-specific setup.
4. Provider returns authorization response.
5. Platform exchanges code for tokens if applicable.
6. Platform fetches minimal account/workspace identity.
7. Platform creates or updates tenant-scoped source record.
8. Platform registers webhook if required.
9. Platform runs initial health verification.
10. Platform marks source as connected or degraded.

### B.2 Freshers implementation rule

Keep onboarding logic split into:
- controller for request handling
- provider adapter for external API differences
- lifecycle service for status changes
- queue jobs for slow and retryable work

Do not mix provider-specific code directly inside controllers.

---

## Appendix C — Webhook Registration Flow

### C.1 Goal

Webhook registration ensures providers can notify M-01 when calls complete, recordings are available, or relevant source events occur. This is a critical part of automatic capture for conferencing and telephony systems.

### C.2 Rules

- Every webhook endpoint must be provider-specific or provider-aware.
- Every inbound webhook must support signature verification.
- Webhook secret must be stored securely.
- Provider challenge/verification flows must be handled before marking webhook as healthy.
- Duplicate webhook registrations should be prevented with idempotency keys.
- Cloudflare rate limits and queue-first processing protect the platform from abuse or bursts.

### C.3 Minimal registration metadata

Store:
- source ID
- provider webhook ID if available
- callback URL
- secret reference
- registration status
- last verified at
- failure reason if broken

---

## Appendix D — Source Health and Sync Status

### D.1 Health states

Recommended operational meaning:
- `connected`: auth valid, required setup complete, source healthy
- `degraded`: connected but one or more checks failing
- `reauth_required`: auth no longer sufficient
- `error`: setup failed or persistent issue
- `disconnected`: intentionally disabled or removed

### D.2 Health checks

Checks may include:
- token validity
- provider API reachability
- webhook verification health
- recent successful sync or event receipt
- scope sufficiency
- account/workspace availability

### D.3 Last sync semantics

`lastSyncedAt` should reflect the latest successful sync or verified inbound event processing point for that source, depending on provider mode.

---

## Appendix E — Reconnect and Disconnect Handling

### E.1 Reconnect rules

- Reconnect should preserve source identity where possible.
- Reconnect should not create duplicate connectors.
- Reconnect should refresh tokens, permissions, and webhook health.
- Reconnect must be auditable.

### E.2 Disconnect rules

- Disconnect should revoke or forget platform-side active use of the connector.
- Provider-side webhook cleanup should be attempted where supported.
- Source status must become `disconnected`.
- Historical captured data remains unless retention or deletion policy says otherwise.
- New events from disconnected sources should be rejected or ignored after source lookup.

### E.3 Partial disconnect failure

If provider-side cleanup fails:
- mark disconnect locally
- record remote cleanup failure
- alert support/ops if needed
- do not silently claim full cleanup if remote webhook still exists

---

## Appendix F — Recommended Provider Adapter Pattern

### F.1 Adapter interface

Each provider adapter should implement a normalized interface such as:
- `startAuth()`
- `handleCallback()`
- `verifyConnection()`
- `registerWebhook()`
- `refreshToken()`
- `disconnect()`
- `healthCheck()`
- `normalizeInboundEvent()`

### F.2 Why this matters

This keeps provider-specific quirks isolated and makes the system easier for junior engineers to extend safely. When Zoom and Teams differ, the difference should live in adapters, not leak across controllers or core lifecycle logic.

### F.3 Architecture rule

Do not let a connector implementation directly couple M-01 to downstream modules. Native Connectors should only establish and manage trusted data ingress. Downstream features react later through M-01 workflows and events.

---

## Appendix G — Implementation Notes for Engineers

### G.1 What TypeScript should do

- connector APIs
- source lifecycle management
- OAuth handling
- webhook verification
- queue orchestration
- DB writes
- health checks
- audit logging

### G.2 What TypeScript should not do

- do not put AI inference here
- do not directly write to other module schemas
- do not hardcode secrets
- do not block user requests with slow provider operations
- do not trust inbound webhooks without verification

### G.3 Engineering principle

Native Connectors should feel boring and dependable. If integrations are predictable, secure, and observable, the rest of M-01 becomes much easier to build and support.