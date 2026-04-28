# API Design Standards

## Document Control

- **Document Type:** API Design Standards
- **Product:** R-Revenue Intelligence
- **Organization:** Relanto.ai
- **Version:** v0.1
- **Status:** Draft
- **Owner:** Tech Lead — R-Revenue Intelligence Platform
- **Reviewers:** Backend Lead, AI Lead, Frontend Lead, Security Owner, QA Lead
- **Last Updated:** April 2026

## Purpose

### Why This Document Exists

This document defines the standard rules for designing APIs across the R-Revenue Intelligence platform. Its purpose is to ensure that all APIs are consistent, secure, predictable, easy to consume, and easy to maintain as the platform grows across modules, teams, and integration points.

Without a common API design standard, different modules can drift into different naming styles, response formats, error models, authentication patterns, and validation approaches. That creates confusion for frontend engineers, backend engineers, QA, AI engineers, integration developers, and freshers who are trying to understand or extend the system.

This document exists to prevent that drift. It gives the team one shared reference for how APIs must be structured, how requests and responses must look, how security and tenant boundaries must be enforced, and how new endpoints must be reviewed before they are merged.

This is not only a documentation artifact. It is a governance document. The rules here are expected to be enforced in implementation, code review, API review, Swagger documentation, and testing.

### Intended Audience

This document is written for anyone who designs, reviews, builds, tests, documents, or integrates with APIs in the R-Revenue Intelligence platform.

Primary readers include:

- Backend engineers creating new endpoints or modifying existing ones
- Frontend engineers consuming APIs and depending on stable contracts
- AI/ML engineers exposing internal service interfaces to the product layer
- QA engineers validating request, response, auth, and error behavior
- Security reviewers checking auth, RBAC, tenant isolation, and sensitive data handling
- Tech leads and reviewers approving architectural consistency
- Freshers and interns who need a clear, repeatable API pattern to follow

If a team member is adding a new endpoint, changing a response shape, introducing a webhook, defining an async job contract, or exposing an internal service interface, they should read this document first.

### What This Document Governs

This document governs the design standards for all APIs used within the R-Revenue Intelligence platform.

This includes:

- External product APIs consumed by the frontend
- Internal service APIs between platform components
- Async job trigger and polling APIs
- Webhook receiver endpoints
- Admin and platform utility APIs
- Common request and response structure rules
- Error handling conventions
- Validation and contract rules
- Authentication and authorization requirements
- Multi-tenant safety expectations
- Pagination, filtering, and sorting conventions
- Versioning and deprecation expectations
- Documentation and review requirements for new endpoints

This document should be treated as the default API rulebook unless a more specific approved document overrides a narrow case.

### What This Document Does Not Cover

This document does not describe the business logic of individual features. It does not explain how a specific feature works internally, what prompt a specific AI workflow uses, or how one module computes its feature-specific outputs.

The following are out of scope for this document:

- Feature-specific business rules
- Detailed implementation logic inside controllers, services, or workers
- UI behavior and screen-level interaction design
- Database schema design in full detail
- AI prompt content and model tuning details
- Infrastructure deployment configuration
- Sprint planning, task breakdown, and estimation
- Full QA test plans for individual features

If the question is “How should an API be designed?” this document is the right place.

If the question is “How does this specific feature work internally?” that belongs in a feature TDD, technical design document, implementation spec, or module-specific API document.


## Scope

### APIs Covered

This document applies to all APIs that are designed, exposed, consumed, or maintained as part of the R-Revenue Intelligence platform.

This includes:

- Frontend-facing product APIs exposed by the NestJS API layer
- Internal service APIs between the platform API layer and Python AI services
- Async job trigger and job-status polling APIs
- Webhook receiver endpoints for inbound external systems
- Admin and platform utility APIs such as health and operational endpoints
- Integration-facing APIs that read from or write to approved third-party systems
- Versioned API contracts documented through Swagger or equivalent OpenAPI tooling

Unless explicitly approved as an exception, every new endpoint must follow the standards in this document.

### Systems in Scope

The standards in this document apply across all system components that either expose APIs directly or depend on API contracts as part of normal operation.

Systems in scope include:

- Next.js frontend consuming product APIs
- NestJS modular monolith exposing platform APIs
- FastAPI AI Services Layer exposing internal service interfaces
- FastAPI transcription and speech-processing services where internal HTTP or job contracts exist
- BullMQ-backed async workflows where API-triggered background processing is involved
- Webhook ingestion entry points for conferencing, dialer, and external event systems
- CRM, email, calendar, warehouse, and notification integration boundaries where API contracts must be defined clearly

This document is especially important at the boundaries between systems, because those are the places where inconsistency, ambiguity, and integration bugs spread fastest.

### Environments in Scope

These API standards apply consistently across all official environments of the platform.

Environments in scope include:

- Local development
- Development
- Staging
- Production

An API contract should not behave one way in local and another way in staging or production unless the difference is explicitly documented and approved. Environment differences may affect infrastructure scale, secrets, rate limits, or external connectivity, but they must not casually change request shape, response shape, auth behavior, or error structure.

### Internal vs External APIs

The platform uses both external APIs and internal APIs, and both are governed by this document, but they are governed with different expectations.

**External APIs** are APIs exposed for product clients or trusted platform consumers. These include frontend-facing REST endpoints, admin endpoints, webhook endpoints, and any documented contract that a product consumer or integration layer depends on. External APIs must prioritize clarity, stability, strong documentation, predictable errors, backward compatibility, and safe evolution over time.

**Internal APIs** are APIs used for controlled service-to-service communication inside the platform, such as NestJS calling FastAPI AI services or internal services coordinating long-running work. Internal APIs may move faster than public-facing APIs, but they are still not allowed to be ad hoc. They must remain versioned, documented, validated, authenticated, observable, and safe for multi-team development.

Internal does not mean informal. If another service depends on it, it is a real contract and must be treated like one.

## Design Principles

### Consistency First

Consistency is more important than local preference. A slightly imperfect standard used everywhere is better than multiple “better” patterns used inconsistently.

All APIs in the platform should follow the same naming conventions, HTTP semantics, validation rules, authentication model, request structure, response envelope, pagination pattern, and error format wherever possible. This reduces onboarding time, lowers frontend complexity, simplifies QA, and makes the system easier to reason about for both senior engineers and freshers.

If two endpoints solve similar problems, they should look and behave similar enough that a developer can predict one from the other.

### Contract Before Code

An API contract must be defined before implementation begins. Engineers should not write endpoint logic first and decide the request and response shape later.

Before coding starts, the endpoint should have a clear contract covering:

- URL and method
- Purpose
- Auth requirement
- Request schema
- Response schema
- Error cases
- Role access rules
- Tenant-scoping expectations
- Sync vs async behavior
- Documentation expectation

This contract-first approach prevents rework, avoids frontend-backend mismatch, improves review quality, and makes Swagger or OpenAPI documentation a real design artifact instead of an afterthought.

### Backward Compatibility

APIs must evolve carefully. Existing consumers should not break because one team changed a request field, renamed a property, changed an enum value, or removed a response field without a migration path.

Backward compatibility is especially important for:

- Frontend-facing APIs
- Integration APIs
- Async job contracts
- Shared internal service interfaces used across teams
- Webhook processing contracts that depend on stable assumptions

If a change would break an existing consumer, it must be treated as a versioning or deprecation event, not as a casual refactor.

### Simplicity for Consumers

APIs should be easy to understand and easy to use correctly.

That means:

- Use clear resource names
- Keep request shapes predictable
- Prefer one obvious way to call an endpoint
- Avoid hidden behavior
- Avoid overloaded endpoints that do many unrelated things
- Return structured, readable errors
- Keep pagination, filtering, and sorting patterns uniform
- Avoid forcing consumers to guess which fields are required, optional, nullable, computed, or server-controlled

A good API should reduce consumer confusion, not shift complexity from backend code into frontend guesswork.

### Secure by Default

Security should be the default behavior of the API, not an optional add-on.

Every API must assume that:

- Requests may be malformed
- Clients may be unauthorized
- Users may attempt access beyond their role
- Tenant boundaries must never be trusted from client input
- Webhook sources must be verified
- Sensitive data may appear in payloads, logs, or errors if not handled carefully

Default API behavior should include strong validation, JWT enforcement where required, RBAC checks, tenant-safe access patterns, secret-based internal auth where applicable, HMAC verification for webhooks, and safe error responses that do not leak internals.

If an endpoint is public or unauthenticated, that should be an explicit exception, not an accident.

### Observable by Default

Every API should be designed so that failures, latency, retries, and abuse patterns are visible in production.

At minimum, APIs should support:

- Request ID propagation
- Structured logging
- Error tracking
- Latency monitoring
- Rate limit visibility
- Async job visibility where background work exists
- Enough context to debug issues safely without reading raw production traffic manually

An API that works but cannot be diagnosed during failure is not production-ready. Observability is part of API design, not only infrastructure design.

### Multi-Tenant Safe by Default

The platform is multi-tenant, so every API must be designed with tenant safety as a first-class rule.

This means:

- Tenant context must come from trusted auth or platform context, not from client-controlled request input
- Cross-tenant access must be impossible by default
- Endpoint behavior must respect both route-level role permissions and record-level tenant scoping
- Logs, errors, async jobs, and internal calls must preserve tenant context correctly
- Shared services must not bypass tenant boundaries for convenience

A feature is not considered correct if it works functionally but violates tenant isolation assumptions.

### Async Where Work Is Long Running

APIs should not keep users waiting on long-running work when the operation is naturally asynchronous.

If a workflow involves heavy AI processing, transcription, batch analysis, large exports, multi-step orchestration, or slow downstream dependencies, the API should use an async design pattern instead of blocking the request until completion.

This usually means:

- Return HTTP 202 Accepted
- Create a job record or job identifier
- Provide a polling or status-check mechanism
- Expose clear job states such as queued, processing, completed, and failed
- Keep sync APIs for only the operations where user waiting time is acceptable

This principle protects user experience, avoids timeout-heavy designs, improves reliability, and matches the event-driven patterns already used across the platform.


## API Landscape

### Public Client APIs

Public client APIs are the APIs exposed by the platform for frontend consumption and other approved product-facing consumers.

These APIs are primarily served by the NestJS API layer and are expected to be:

- Stable and well-documented
- Versioned
- Authenticated unless explicitly public
- Tenant-safe
- Protected by RBAC where required
- Consistent in request and response shape
- Safe for long-term frontend dependency

Typical examples include:

- Authentication APIs
- Deal, account, and board APIs
- Forecasting APIs
- Conversation intelligence APIs
- Insight generation APIs
- Sales engagement APIs
- Performance and coaching APIs
- Admin and settings APIs

Public client APIs are the most visible contracts in the platform and therefore require the highest level of consistency and backward-compatibility discipline.

### Internal Service APIs

Internal service APIs are APIs used for service-to-service communication inside the R-Revenue Intelligence platform.

These APIs are not intended for browser or third-party direct use. They are used by controlled internal components such as:

- NestJS calling FastAPI AI services
- NestJS calling transcription services
- Internal orchestration layers coordinating long-running work
- Platform services passing trusted internal headers and context

Internal APIs must still be treated as real contracts. They must be:

- Versioned or otherwise explicitly governed
- Authenticated using approved internal mechanisms
- Validated
- Observable
- Timeout-aware
- Safe for retries
- Tenant-context aware

Internal APIs are allowed to optimize for platform control and operational efficiency, but they are not allowed to become undocumented or inconsistent just because they are not public.

### Webhook Endpoints

Webhook endpoints are inbound APIs that receive events from external systems such as conferencing tools, dialers, and other approved integrations.

Webhook endpoints are special because:

- They are externally triggered
- They often do not use JWT authentication
- They must verify authenticity using HMAC or an equivalent signature scheme
- They must defend against replay, duplication, and malformed payloads
- They often act as the entry point to async workflows

Webhook endpoints should be designed to acknowledge quickly, validate strictly, enqueue downstream processing safely, and avoid doing heavy work inline during request handling.

Examples include:

- Meeting recording ingestion hooks
- Call metadata ingestion hooks
- External event receiver endpoints
- Provider callback endpoints

Webhook endpoints are not “just another POST route.” They require stricter protection because they sit directly at the system boundary.

### Admin and Platform APIs

Admin and platform APIs are APIs used for tenant administration, operational tasks, system metadata, and platform-level utilities.

These include APIs such as:

- Health endpoints
- Admin user management
- Tenant-level settings
- Billing or subscription management
- Integration configuration
- Compliance configuration
- Operational support endpoints

These APIs are often more sensitive than normal product APIs because they may expose broader tenant scope, privileged actions, or operational control. For that reason, they must be strongly protected, explicitly documented, and role-restricted.

## URL and Namespace Standards

### Base Path Convention

All externally exposed platform APIs must live under a single consistent base path.

Standard pattern:

```text
/api/v1/{module-prefix}/...
```

Examples:

- `/api/v1/auth/...`
- `/api/v1/ingestion/...`
- `/api/v1/engagement/...`
- `/api/v1/revenue-graph/...`
- `/api/v1/conversation-intelligence/...`
- `/api/v1/smart-tracking/...`
- `/api/v1/insights/...`
- `/api/v1/deal-management/...`
- `/api/v1/execution/...`
- `/api/v1/forecasting/...`
- `/api/v1/performance/...`
- `/api/v1/admin/...`
- `/api/v1/health`

No externally exposed endpoint may live outside the approved API base path unless it is an explicitly approved infrastructure exception.

### Versioning in Path

All public-facing APIs must include the major API version in the path.

Standard pattern:

```text
/api/v1/...
```

Rules:

- Use path-based versioning for public APIs
- The first production version is `v1`
- Breaking changes require a new major version
- Non-breaking additions should stay within the same major version
- Do not silently change existing contract behavior in place if consumers depend on it

Versioning in the path keeps routing explicit, helps frontend teams reason about compatibility, and makes deprecation planning easier.

### Module Prefix Ownership

Each module owns exactly one canonical API prefix. No two modules may share a prefix, and no endpoint may be placed under another module’s namespace.

Canonical prefixes:

- `auth` → Authentication
- `ingestion` → M-01 Data Ingestion
- `engagement` → M-02 Sales Engagement
- `revenue-graph` → M-03 Revenue Graph
- `conversation-intelligence` → M-04 Conversation Intelligence
- `smart-tracking` → M-05 Smart Tracking
- `insights` → M-06 Insight Generation
- `deal-management` → M-07 Deal and Account Management
- `execution` → M-08 Execution Automation
- `forecasting` → M-09 Forecasting
- `performance` → M-10 Performance Coaching
- `admin` → Platform Core Admin
- `health` → Platform Core Health

Rules:

- A module must not create endpoints under another module’s prefix
- Cross-module data access should happen through APIs or events, not namespace leakage
- If ownership is unclear, resolve ownership first before adding the endpoint
- Namespace mistakes are architecture mistakes, not just naming issues

### Resource Naming Rules

Resource paths must use clear noun-based naming.

Preferred style:

- Use plural nouns for collections
- Use singular identifiers only as path parameters
- Name resources after domain concepts, not UI widgets or backend classes

Good examples:

- `/api/v1/forecasting/periods`
- `/api/v1/forecasting/periods/{periodId}`
- `/api/v1/performance/trainer-scenarios`
- `/api/v1/deal-management/boards/deals`

Avoid:

- Verb-first resource names
- Controller-style names
- Internal code names
- Ambiguous abbreviations unless they are already platform-standard

A URL should describe the resource being addressed, not the implementation detail behind it.

### Action Endpoint Naming Rules

When an operation does not fit normal CRUD semantics cleanly, an action endpoint may be used.

Rules for action endpoints:

- Prefer resource-oriented design first
- Use action endpoints only when the operation represents a domain action, command, or workflow trigger
- Action names should be short, explicit, and verb-based
- Place the action after the resource or resource identifier

Examples:

- `/api/v1/forecasting/periods/{periodId}/submit`
- `/api/v1/engagement/emails/generate`
- `/api/v1/insights/research`
- `/api/v1/performance/trainer-sessions/{sessionId}/turn`

Avoid action endpoints like:

- `/api/v1/doThing`
- `/api/v1/processNow`
- `/api/v1/runMagic`
- `/api/v1/forecasting/submitForecastForUser`

If the action is a command, name it like a business action, not a developer shortcut.

### Nested Resource Rules

Nested resources are allowed when the child resource is meaningfully scoped by the parent resource.

Use nesting when:

- The child cannot be understood well without the parent
- The child is naturally accessed within the context of the parent
- The nesting improves clarity instead of creating deep, hard-to-read URLs

Good examples:

- `/api/v1/forecasting/periods/{periodId}/board`
- `/api/v1/forecasting/periods/{periodId}/coverage`
- `/api/v1/performance/trainer-sessions/{sessionId}/result`

Rules:

- Keep nesting shallow
- Prefer no more than two meaningful resource levels in most cases
- Do not encode the full object graph into the URL
- If a child resource is commonly accessed independently, promote it to its own top-level resource

### Trailing Slash Rules

API endpoints must not use trailing slashes.

Use:

- `/api/v1/forecasting/periods`

Do not use:

- `/api/v1/forecasting/periods/`

Rules:

- Define one canonical path only
- Do not support multiple forms casually
- Redirect behavior should be avoided for API routes unless intentionally designed

Consistent path style prevents client confusion, cache inconsistency, and route-matching edge cases.

### Case and Separator Rules

All URL paths must use lowercase letters and hyphen-separated words.

Rules:

- Use lowercase only
- Use hyphens for multi-word path segments
- Do not use camelCase in URLs
- Do not use spaces
- Do not use underscores in path segments unless required by an external compatibility case
- Path parameters should use descriptive camelCase placeholders in documentation if needed, but the actual path segment remains stable and lowercase in structure

Good examples:

- `/api/v1/revenue-graph/deals`
- `/api/v1/conversation-intelligence/scorecards`
- `/api/v1/smart-tracking/trackers`

Bad examples:

- `/api/v1/revenueGraph/deals`
- `/api/v1/ConversationIntelligence/scorecards`
- `/api/v1/smart_tracking/trackers`

## HTTP Method Standards

### GET

Use `GET` to retrieve data without changing server state.

Use `GET` for:

- Fetching a collection
- Fetching a single resource
- Fetching filtered or paginated results
- Fetching computed read-only views
- Fetching status or metadata

Rules:

- `GET` must not create, update, delete, or trigger side effects
- `GET` must be safe to retry
- `GET` should support caching where appropriate
- Expensive reads should still remain read-only; if processing is long-running, use async preparation elsewhere and expose results through `GET`

### POST

Use `POST` to create resources or trigger commands that are not naturally idempotent.

Use `POST` for:

- Creating a new resource
- Triggering a domain action
- Starting an async workflow
- Submitting a payload for processing
- Sending a command that changes state

Examples:

- Create a forecast period
- Submit a forecast
- Generate an AI email draft
- Start an AI trainer session
- Receive a webhook event

Rules:

- `POST` is generally not idempotent unless explicitly designed with idempotency protection
- If `POST` triggers long-running work, prefer returning `202 Accepted`
- If `POST` creates a resource immediately, return `201 Created` where appropriate

### PUT

Use `PUT` to fully replace a resource representation when full replacement semantics are truly intended.

Rules:

- `PUT` means complete replacement, not partial patching
- The client is expected to send the full intended resource state
- Omitted mutable fields may be treated as cleared or reset depending on the contract
- Use `PUT` sparingly if the product mostly works with partial updates

If the platform rarely needs full resource replacement, do not force `PUT` into places where `PATCH` is the more accurate method.

### PATCH

Use `PATCH` for partial updates to an existing resource.

Use `PATCH` when:

- Only a subset of fields changes
- The client should not be required to send the full object
- The operation updates configuration, status, metadata, or editable fields on an existing resource

Examples:

- Save dashboard layout configuration
- Update selected fields on a tracker
- Modify settings on an existing entity

Rules:

- `PATCH` must clearly define which fields are editable
- Validation must apply to changed fields and any affected invariants
- Partial update behavior must be documented precisely
- `PATCH` should not be used as a vague “do anything” method

### DELETE

Use `DELETE` to remove a resource or to request its deletion.

Rules:

- `DELETE` should target a specific resource
- `DELETE` may represent hard delete or soft delete, but the behavior must be documented
- `DELETE` must enforce role and tenant safety strictly
- Repeating `DELETE` on an already deleted resource should behave predictably according to the contract

Do not use `DELETE` for generalized destructive actions that are better modeled as state transitions or domain commands.

### Method Idempotency Rules

Idempotency means that repeating the same request produces the same resulting state.

Method expectations:

- `GET` must be idempotent
- `PUT` should be idempotent
- `DELETE` should be idempotent in observable effect where practical
- `PATCH` may or may not be idempotent depending on the operation
- `POST` is not assumed idempotent by default

Rules:

- If an operation may be retried by clients, proxies, workers, or webhooks, design for idempotency where possible
- For command-style `POST` endpoints, use idempotency keys or duplicate detection when replay risk is real
- Webhook receivers must handle duplicate delivery safely
- Async job triggers should avoid accidental duplicate execution for the same logical request

Idempotency is especially important in distributed systems because retries happen even when application code did not intend them.

### Safe vs Unsafe Operations

Safe operations do not modify server state. Unsafe operations do.

Safe operations:

- `GET`
- Read-only status retrieval
- Metadata retrieval
- Paginated list retrieval
- Search or filter retrieval when no write occurs

Unsafe operations:

- Resource creation
- Resource updates
- Resource deletion
- Command execution
- Webhook ingestion that triggers processing
- Async workflow initiation

Rules:

- Safe operations should never create hidden side effects
- Unsafe operations must require the correct auth, validation, and observability controls
- Consumers should be able to trust method meaning from the HTTP verb itself
- Do not hide write behavior behind a `GET` route for convenience

If an endpoint changes data, triggers jobs, sends messages, or mutates workflow state, it is unsafe and must use the correct non-GET method.


## Request Design Standards

### Required Headers

Every request must include the headers required for its API type.

For standard authenticated client APIs, the required headers are:

- `Authorization: Bearer <access-token>` for all protected endpoints
- `Content-Type: application/json` for requests with a JSON body

For internal service APIs, additional required headers apply:

- `X-Internal-Secret`
- `X-Tenant-Id`
- `X-Request-Id`

For webhook endpoints, the required verification header depends on the provider contract, but the platform standard is to require a signature header such as:

- `X-Webhook-Signature`

Rules:

- Protected endpoints must reject missing or invalid auth headers
- JSON endpoints must reject unsupported content types
- Internal endpoints must reject requests that do not carry the required internal auth and tracing headers
- Webhook endpoints must reject unsigned or invalidly signed requests immediately

### Optional Headers

Optional headers may be supported when they provide useful client control or observability, but they must be explicitly documented.

Typical optional headers may include:

- `X-Request-Id` from trusted upstream callers
- `Accept-Language` when localized output is supported
- Provider-specific webhook metadata headers
- Feature or experiment headers only when explicitly approved

Rules:

- Optional headers must not silently change security boundaries
- Optional headers must not override trusted tenant identity
- Undocumented optional headers must not become hidden API behavior
- If a header changes response behavior, that behavior must be documented

### Correlation and Request ID

Every request must be traceable through the platform using a request identifier.

Rules:

- Each inbound request must have a `requestId`
- If a trusted upstream request ID is present and valid, it may be reused
- If none is present, the platform must generate one
- The same request ID must flow through logs, downstream internal calls, async job creation context where relevant, and the final response envelope
- Internal API calls must forward the request ID using `X-Request-Id`

This allows engineers to trace one user action across frontend calls, API processing, AI service calls, queue submissions, retries, and failure events.

### Content Type Rules

JSON is the default request format for platform APIs.

Rules:

- Request bodies must use `Content-Type: application/json` unless a documented exception exists
- Endpoints that accept JSON must reject unsupported media types
- Multipart, binary, or provider-specific formats are allowed only where explicitly required, such as file upload or webhook edge cases
- Clients must not send form-encoded payloads to JSON endpoints unless an endpoint explicitly supports them

If an endpoint accepts a non-JSON format, that must be treated as a documented exception, not an implicit convenience.

### Request Body Shape

Request bodies must be predictable, validated, and shaped around the operation being performed.

Rules:

- Use JSON objects as the top-level request body structure
- Do not accept primitive top-level bodies such as raw strings, arrays, or numbers for normal platform endpoints
- The body should contain only fields relevant to the request
- Use explicit schemas for all body validation
- Reject malformed or unknown request shapes rather than trying to guess user intent
- Keep request bodies narrow and purposeful; do not create “god payloads” that mix unrelated concerns

A request body should make it obvious what the client is trying to do and which fields are required to do it safely.

### Field Naming Convention

All request body fields must use a consistent naming convention.

Standard:

- Use `camelCase` for JSON field names

Examples:

- `emailAddress`
- `periodId`
- `pageSize`
- `sortOrder`
- `dueDate`
- `confidenceScore`

Rules:

- Do not mix `camelCase`, `snake_case`, and `PascalCase` in the same API contract
- Keep field names descriptive and domain-oriented
- Avoid internal implementation names leaking into API payloads
- Use booleans with meaningful names such as `isLocked`, `hasNextPage`, or `flaggedForReview`

Consistency in field naming reduces mapping bugs across frontend, backend, and AI service layers.

### Null vs Empty vs Missing

`null`, empty values, and missing fields must have distinct meanings.

Rules:

- Use a missing field to mean “not provided”
- Use `null` only when the contract explicitly allows “known absence” or “no value”
- Use empty string `""` only when empty text is a valid business value
- Use empty array `[]` only when “present but no items” is the intended meaning
- Do not treat `null`, empty string, empty array, and missing field as interchangeable
- Validation rules must define which of these are allowed for each field

Examples:

- Missing `dueDate` in a partial update means “do not change it”
- `dueDate: null` may mean “clear the due date” if the contract allows clearing
- `tags: []` means “set tags to empty”
- `notes: ""` means “notes intentionally empty,” not “notes missing”

Ambiguity here causes subtle bugs, especially in partial updates and AI-assisted workflows.

### Default Value Rules

Defaults must be explicit, predictable, and documented.

Rules:

- Defaults are allowed only where they reduce consumer burden without hiding important behavior
- If a field has a server-side default, document it clearly
- Defaults must be stable across environments unless explicitly documented otherwise
- Do not apply surprising business defaults that change workflow meaning silently
- Query parameter defaults such as pagination or sort order must be consistent across endpoints

Typical safe defaults include:

- `page = 1`
- `pageSize = 25`
- `sortBy = createdAt`
- `sortOrder = desc`

Defaults should make common requests easier, not obscure what the API is doing.

### Client-Supplied vs Server-Controlled Fields

APIs must clearly distinguish between fields the client is allowed to send and fields the server controls.

Client-supplied fields typically include:

- User input
- Search filters
- Sort preferences
- Editable resource attributes
- Workflow parameters that the client is authorized to choose

Server-controlled fields typically include:

- `tenantId`
- `userId` derived from auth context
- `createdAt`
- `updatedAt`
- Internal status transitions not exposed for direct editing
- Computed scores
- Audit metadata
- Request metadata

Rules:

- Never accept `tenantId` from request body or query parameters for protected multi-tenant APIs
- Never trust client-supplied ownership or privilege fields unless the endpoint explicitly governs them and the caller has authority
- Server-controlled fields must be derived from trusted context or internal logic
- If a client sends forbidden server-controlled fields, reject the request or ignore them according to the endpoint contract, but do not let them affect behavior

## Response Design Standards

### Standard Success Envelope

All successful API responses must use the standard success envelope.

Standard shape:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:00:00.000Z"
  }
}
```

Rules:

- Do not return raw objects or arrays for normal API success responses
- `success` must always be `true` for successful responses
- `data` contains the primary response payload
- `meta` contains response metadata
- Paginated responses extend `meta` with pagination details
- Async accepted responses may return a job payload inside `data`

This wrapper keeps all endpoints structurally predictable for frontend, QA, logging, and debugging.

### Standard Error Envelope

All error responses must use the standard error envelope.

Standard shape:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": []
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:00:00.000Z"
}
```

Rules:

- `success` must always be `false`
- `error` must always be a nested object (no flattened `errorCode` / `message` at the top level)
- Error responses must include a machine-readable error code
- Error responses must include a human-readable message
- Validation failures should include structured field-level details
- Internal failures must not leak stack traces, secrets, or unsafe internals to clients
- Error shape must remain consistent across modules

### Meta Object Rules

The `meta` object is reserved for response metadata, not business payload data.

Rules:

- `meta` must include `requestId` and `timestamp` on successful responses
- `meta` may include pagination data for list responses
- `meta` may include non-business metadata such as processing notes, version markers, or cursor info where needed
- Business fields must remain inside `data`, not in `meta`
- Do not overload `meta` with domain-specific payload details

The purpose of `meta` is consistency and transport-level clarity, not convenience dumping.

### Timestamp Format

All timestamps in request and response contracts must use ISO 8601 format.

Rules:

- Use full ISO 8601 timestamps for event times, audit fields, response metadata, and async job timestamps
- Use UTC timestamps unless there is a very clear reason not to
- Date-only fields may use ISO date format when the field is conceptually a date rather than a moment in time
- Do not mix multiple timestamp styles across endpoints

Examples:

- `2026-04-22T09:00:00.000Z`
- `2026-04-22`

Time format inconsistency creates bugs in frontend rendering, filtering, sorting, and integration mapping.

### Request ID Echoing

Every response must include the request ID associated with the request.

Rules:

- Success responses must include `meta.requestId`
- Error responses must include `requestId`
- Async job responses must include the request ID from the initiating request
- Internal services should also propagate and surface the request ID where useful

This makes support, debugging, and incident analysis much faster because one user-reported failure can be traced end to end.

### Raw Response Exceptions

Raw responses are not allowed by default.

Rules:

- No endpoint may return a raw object or raw array unless an explicit exception is approved
- Exceptions should be rare and usually limited to infrastructure or compatibility cases
- If a raw response exception is approved, it must be documented clearly and justified

Default rule:

- Wrap everything in the standard response envelope

Consistency matters more than micro-optimizing away a thin wrapper.

### Pagination Meta Rules

Paginated list responses must include pagination details in the `meta.pagination` object.

Standard shape:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:00:00.000Z",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalRecords": 142,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

Rules:

- Use the same pagination structure across all paginated endpoints
- `page` and `pageSize` must reflect the effective values used
- `totalRecords` and `totalPages` should be included when available
- `hasNextPage` and `hasPreviousPage` must be consistent with the actual result window
- Pagination metadata belongs in `meta.pagination`, not mixed into `data`

## Resource Modeling Standards

### Resource-Oriented Design

APIs should be modeled around business resources and domain actions, not around controller names, UI screens, or database tables alone.

Rules:

- Start from domain concepts such as deals, accounts, summaries, trackers, periods, sessions, and users
- Expose resources in a way that matches how consumers think about the domain
- Keep URLs resource-oriented and predictable
- Use actions only when the domain behavior does not fit normal CRUD semantics well

Resource-oriented APIs are easier to document, easier to reuse, and easier for freshers to understand.

### When to Use Collections

Use collection resources when the client interacts with multiple instances of the same domain object.

Examples:

- `/api/v1/forecasting/periods`
- `/api/v1/performance/trainer-scenarios`
- `/api/v1/admin/users`

Use a collection when:

- The client needs to list items
- The client needs filtering, pagination, or sorting
- New instances can be created under that resource
- The resource naturally represents many items

Collections are usually plural and usually support `GET` for listing and `POST` for creation when creation is allowed.

### When to Use Singleton Resources

Use a singleton resource when only one meaningful resource exists in a given scope.

Examples:

- Current user profile
- Tenant settings
- Health status
- A board view scoped to a specific parent entity

Singletons are appropriate when:

- There is conceptually one resource, not many
- The resource is tied to the authenticated caller or current tenant
- A collection pattern would be artificial or misleading

Examples of singleton-style patterns:

- `/api/v1/health`
- `/api/v1/admin/settings`
- `/api/v1/forecasting/periods/{periodId}/board`

Do not force plural collection patterns when the domain object is naturally singular in that context.

### Child Resources

Child resources are appropriate when a resource exists meaningfully under a parent resource.

Use child resources when:

- The child belongs to one parent in a strong way
- Access to the child usually starts from the parent context
- The nested form improves clarity

Examples:

- `/api/v1/forecasting/periods/{periodId}/coverage`
- `/api/v1/performance/trainer-sessions/{sessionId}/result`

Rules:

- Keep parent-child relationships explicit
- Avoid excessive nesting depth
- If the child becomes independently important, consider promoting it to its own top-level resource

### Action Endpoints

Action endpoints are allowed when business behavior is command-like and does not map cleanly to create, replace, update, fetch, or delete.

Use action endpoints for:

- Submit
- Generate
- Retry
- Regenerate
- Start
- Turn
- Sync
- Approve
- Cancel

Examples:

- `/api/v1/forecasting/periods/{periodId}/submit`
- `/api/v1/engagement/emails/generate`
- `/api/v1/insights/research`
- `/api/v1/insights/calls/{callId}/summary/regenerate`

Rules:

- Prefer resource-first design before introducing actions
- Name actions in business language
- Avoid vague verbs
- Keep the command target clear from the URL structure

### Bulk Operations

Bulk operations are allowed when they are operationally useful and the domain supports handling multiple items in one request.

Examples:

- Bulk status update
- Bulk assignment
- Bulk export trigger
- Bulk archive
- Bulk retry

Rules:

- Bulk endpoints must be explicit; do not overload single-resource endpoints with hidden array behavior
- Clearly define whether the operation is all-or-nothing or partial-success
- Response payloads must make per-item outcome visible when partial success is possible
- Bulk operations should use async processing if the payload or work is large
- Bulk operations must enforce the same auth, role, and tenant-safety rules as single-item operations

Example pattern:

- `/api/v1/deal-management/deals/bulk/archive`
- `/api/v1/admin/users/bulk/invite`

### Soft Delete vs Hard Delete

Deletion behavior must be explicit and documented.

Soft delete means:

- The resource is marked inactive, archived, deleted, or hidden
- Data remains recoverable or auditable
- Reads may exclude the resource by default

Hard delete means:

- The resource is permanently removed
- Recovery is not expected through normal product behavior

Rules:

- Default to soft delete when auditability, recovery, or compliance review matters
- Use hard delete only when there is a strong reason and the risk is understood
- Document the deletion behavior clearly in the endpoint contract
- If soft delete is used, define whether deleted resources can be restored
- If hard delete is used, ensure authorization and safeguards are stronger because the action is irreversible

In a multi-tenant B2B platform, soft delete is usually the safer default for most user-facing business resources, while hard delete should be reserved for clearly justified cases.

## Status Code Standards

### Success Codes

Use success status codes precisely and consistently.

Standard success codes:

- `200 OK` for successful read operations and successful non-creation synchronous operations
- `201 Created` when a new resource is successfully created immediately
- `202 Accepted` when the request is valid and accepted for asynchronous processing, but the final result is not yet ready

Rules:

- Do not return `200` for resource creation when `201` is more accurate
- Do not return `201` for actions that only start background work; use `202`
- Platform standard is `200 OK` with `{ "success": true, "data": null, "meta": { ... } }` for operations with no meaningful return value (including `DELETE`)
- `204 No Content` is not used in this platform because the standard envelope requires a body
- Prefer precision over convenience in status code selection

### Client Error Codes

Client error codes indicate that the request cannot be processed as sent by the caller.

Standard client error codes:

- `400 Bad Request` for malformed request structure or schema validation failure
- `401 Unauthorized` for missing, invalid, expired, or unauthenticated access credentials
- `403 Forbidden` for authenticated callers who do not have permission to perform the operation
- `404 Not Found` when the requested resource does not exist within the caller’s accessible scope
- `409 Conflict` when the request conflicts with current resource state or uniqueness rules
- `422 Unprocessable Entity` when the request is structurally valid but cannot be completed because of domain or workflow constraints
- `429 Too Many Requests` when the caller exceeds rate limits

Rules:

- Do not blur `401` and `403`
- Do not use `404` to hide authorization failures unless explicitly required by a threat model decision
- Use `409` for state conflict, duplication, version mismatch, or uniqueness collision
- Use `422` for business-rule failure after validation passes

### Server Error Codes

Server error codes indicate that the platform failed while trying to process a valid request.

Standard server error codes:

- `500 Internal Server Error` for unexpected unhandled server failures
- `503 Service Unavailable` when a required internal dependency or external upstream dependency is unavailable, timed out, or operationally degraded

Rules:

- `500` is for unexpected platform-side failure
- `503` is for dependency or temporary service availability failure
- Do not leak raw exception details in `500` or `503` responses
- All server errors must be logged and traceable using request ID

If the user can reasonably retry later because the system is temporarily unhealthy, `503` is usually more accurate than `500`.

### Async Processing Codes

Use async processing codes when work is accepted but not completed within the request lifecycle.

Standard async behavior:

- `202 Accepted` when a job is queued for background work
- Follow-up polling endpoint returns `200` when the job completes successfully
- Polling endpoint may return a failure envelope if the job ends in a failed state

Rules:

- `202` responses should include at least a `jobId`, current status, and a polling URL or status lookup reference
- Do not block the request until long-running work is complete just to return `200`
- Async job contracts must clearly distinguish `queued`, `processing`, `completed`, and `failed`

### Conflict and Validation Rules

Validation and conflict failures must use the correct status family.

Use:

- `400` when the request shape, field type, enum, format, or parameter constraints fail validation
- `409` when the request conflicts with existing state, uniqueness, or version assumptions
- `422` when validation passed but business rules reject execution

Examples:

- Invalid email format → `400`
- `pageSize = 500` when max is 100 → `400`
- Duplicate email template name → `409`
- Submitting a locked forecast period → `422`
- Enrolling a closed deal into an active workflow → `422`

This distinction matters because it helps frontend and integration consumers decide whether to fix input, resolve state, or guide the user differently.

### Retryable vs Non-Retryable Errors

Error responses must be designed so consumers can tell whether retrying makes sense.

Typically retryable:

- `429 Too Many Requests`
- `503 Service Unavailable`
- Some transient `409 Conflict` cases if the contract explicitly documents retry after refresh
- Some async polling failures when the initial request is fine but the background dependency failed and retry is supported

Typically non-retryable without changing input or state:

- `400 Bad Request`
- `401 Unauthorized` unless token refresh can resolve it
- `403 Forbidden`
- `404 Not Found`
- `422 Unprocessable Entity`

Rules:

- Validation failures are non-retryable until the request changes
- Permission failures are non-retryable unless auth context changes
- Temporary dependency failures should be represented in a way that makes retry behavior obvious
- If an error is retryable, the message or details should guide the caller clearly

## Error Handling Standards

### Error Code Naming Convention

Error codes must be stable, machine-readable, and consistent across modules.

Standard convention:

- Use uppercase error codes
- Use concise semantic names
- Prefer underscore-separated words

Examples:

- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `UNPROCESSABLE`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`
- `JOB_FAILED`

Rules:

- Error codes are contracts; do not change them casually
- Prefer shared platform-wide codes where possible
- Add module-specific domain codes only when the generic code is not enough
- Domain-specific codes should still follow the same naming convention

### Human-Readable Error Messages

Every error response must include a human-readable message.

Rules:

- Messages should be clear, short, and useful
- Messages should help the consumer understand what went wrong
- Messages should not leak internal implementation details
- Messages should be suitable for logs, support usage, and optional UI display
- Do not return stack traces, SQL errors, provider secrets, or internal class names

Good examples:

- `Request validation failed`
- `JWT token has expired`
- `You do not have permission to access this resource`
- `Rate limit exceeded. Resets in 47 seconds`
- `AI service is temporarily unavailable`

Bad examples:

- `ZodError: invalid_type at path body.email`
- `PrismaClientKnownRequestError P2002`
- `FetchError ECONNRESET at internal-service`

### Validation Error Details Structure

Validation failures must include structured details so consumers can identify exactly what failed.

Recommended structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "received": "not-an-email"
      },
      {
        "field": "pageSize",
        "message": "Must be a number between 1 and 100",
        "received": 500
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:00:00.000Z"
}
```

Rules:

- Include one detail object per invalid field or parameter when practical
- Use `details` only for structured error context, not for arbitrary unstructured logs
- The details shape should remain consistent across body, query, and path validation errors

### Field-Level Error Format

Field-level errors must identify the failing field and explain the failure clearly.

Recommended keys:

- `field`
- `message`
- `received` when useful
- optionally `expected` when it adds value without confusion

Rules:

- Use API field names, not backend variable names
- For nested structures, use a clear path notation
- Keep the message understandable by a consumer, not just by a framework expert
- Do not overload the field-level detail with internal debug data

Examples:

- `field: "email"`
- `field: "filters.stage"`
- `field: "items[2].ownerId"`

### Domain Error Mapping

Domain and infrastructure errors must be mapped into stable API-level error responses.

Rules:

- Business rule violations must map to `409` or `422` depending on the case
- Uniqueness conflicts must not leak raw database errors; map them to `409`
- Missing resources must map to `404`
- Role violations must map to `403`
- Expired tokens should map to a stable auth error code such as `TOKEN_EXPIRED`
- Internal provider or SDK exceptions must be translated into platform-standard error shapes

Examples:

- Duplicate template name → `409 CONFLICT`
- Closed deal cannot enter play → `422 UNPROCESSABLE`
- Unknown period ID in tenant scope → `404 NOT_FOUND`
- Missing JWT → `401 UNAUTHORIZED`

The API contract should expose platform meaning, not library implementation details.

### Internal Error Masking

Internal failures must be masked before returning a response to the client.

Rules:

- Never expose stack traces
- Never expose SQL text, ORM error objects, provider secrets, access tokens, or internal hostnames
- Never expose raw upstream payloads unless explicitly safe and intentionally surfaced
- Return a stable code and a safe human-readable message instead
- Log the full internal diagnostic detail server-side with the request ID

Good client-facing message:

- `An unexpected error occurred`

Better operational behavior:

- Full exception captured in Sentry or logs
- Request ID included in the response
- Support can trace the incident without exposing internals to the user

### Dependency Failure Handling

When internal or external dependencies fail, the API must respond consistently and safely.

Dependencies may include:

- AI services
- Transcription services
- CRM APIs
- Email APIs
- Redis
- PostgreSQL
- Supabase Auth
- Other approved platform services

Rules:

- Temporary dependency failures should usually map to `503 SERVICE_UNAVAILABLE`
- Dependency timeouts should be treated as operational failures, not validation failures
- If retries are happening internally, the client response should still remain bounded and predictable
- Log dependency name, request ID, and safe context internally
- Do not leak raw provider error objects to clients

If a dependency failure affects only async processing, return `202` for the initial accepted request and surface job failure through the job status contract instead of pretending the work completed.

## Validation Standards

### Schema-First Validation

All inputs must be validated against explicit schemas before business logic runs.

Rules:

- Define validation schemas before or alongside endpoint implementation
- Request validation must happen at the boundary
- No unvalidated request body, query parameter, path parameter, or internal payload should reach service logic
- Validation rules must be part of the API contract, not hidden inside deep business code

A schema-first approach improves reliability, documentation quality, and frontend-backend alignment.

### DTO and Runtime Validation

Static typing alone is not enough. Runtime validation is mandatory.

Rules:

- DTOs can define expected shapes at the code level
- Runtime validators such as Zod must enforce the contract on real incoming requests
- TypeScript types help developers; runtime validation protects the system
- DTOs and runtime schemas must stay aligned

Do not assume a request is valid just because the frontend is typed. APIs must defend themselves at runtime.

### Query Parameter Validation

All query parameters must be validated explicitly.

Typical query parameters include:

- `page`
- `pageSize`
- `sortBy`
- `sortOrder`
- filters
- search strings
- date ranges

Rules:

- Validate type, format, enum membership, and allowed ranges
- Apply standard defaults only after validation logic is defined clearly
- Reject invalid values instead of silently coercing dangerous input
- Document allowed query parameters for every endpoint

Examples:

- `page` must be an integer greater than or equal to 1
- `pageSize` must be an integer between 1 and 100
- `sortOrder` must be `asc` or `desc`

### Path Parameter Validation

Path parameters must be validated before they are used.

Rules:

- Validate ID format, UUID shape, or documented identifier format
- Reject malformed path parameters with `400`
- Do not pass unchecked path values into data access logic
- If the ID is well-formed but not found in the caller’s scope, return `404`

Examples:

- `periodId` must be a valid UUID
- `sessionId` must be a valid UUID
- Provider callback path tokens must match the expected format if used

### Body Validation

Every request body must be validated against the endpoint’s schema.

Rules:

- Validate required fields
- Validate optional fields when present
- Validate nested objects and arrays
- Validate business-safe structure before service execution
- Reject malformed or unsupported request bodies immediately

Body validation should happen before any database write, external API call, or side-effecting command is attempted.

### Enum Validation

Fields with a finite set of allowed values must use explicit enum validation.

Rules:

- Enumerated values must be documented clearly
- Reject unknown enum values
- Do not silently map near-matches or typos
- Keep enum naming consistent across endpoints where the same concept appears

Examples:

- `sortOrder` → `asc | desc`
- role → `AE | SDR | Manager | RevOps | Admin`
- job status → `queued | processing | completed | failed`

Enum strictness helps prevent frontend drift and workflow ambiguity.

### Range and Length Rules

Numeric and text inputs must define safe boundaries.

Rules:

- Numeric fields must define minimum and maximum ranges where meaningful
- String fields should define maximum length and minimum length where needed
- Arrays should define size limits when large inputs could create abuse or instability
- Validation limits should reflect real business and operational constraints

Examples:

- `pageSize` between 1 and 100
- confidence score between 0 and 1
- names, descriptions, prompts, or notes capped at safe documented limits
- batch requests capped to a documented item count

Range and length rules are part of reliability and abuse prevention, not just form quality.

### Reject Unknown Fields Policy

Unknown fields must be rejected by default unless an endpoint explicitly supports extensibility.

Rules:

- Do not silently accept unexpected fields in request bodies
- Reject unknown fields to prevent typo bugs, ambiguous intent, and unsafe hidden behavior
- If extensibility is intentionally supported, document the extension mechanism clearly
- The same strictness should apply to internal service contracts unless a versioned extension model exists

Examples:

- If the schema expects `email`, reject `emial`
- If the schema expects `pageSize`, reject `page_size`
- If the schema does not accept `tenantId`, reject it rather than ignore it silently in strict mode

Strict input validation is especially valuable in a multi-team system because it catches mistakes early and keeps contracts honest.

## Filtering, Sorting, and Pagination

### Standard Query Parameters

All list-style endpoints must use the same standard query parameter pattern where applicable.

Standard query parameters:

- `page`
- `pageSize`
- `sortBy`
- `sortOrder`
- filter fields documented for the resource
- `q` for free-text search when supported

Rules:

- Do not invent endpoint-specific pagination names unless there is a strong reason
- Keep parameter naming consistent across modules
- Validate all query parameters before using them
- If an endpoint does not support one of these parameters, document that explicitly

Standardization here keeps frontend data access simple and predictable.

### Pagination Defaults

When pagination is supported and the client does not specify values, the platform standard defaults apply.

Default values:

- `page = 1`
- `pageSize = 25`
- `sortBy = createdAt`
- `sortOrder = desc`

Rules:

- These defaults should apply consistently across paginated list endpoints unless a documented exception is necessary
- Defaults must be visible in Swagger or equivalent API documentation
- The response metadata must reflect the effective values actually used

### Pagination Limits

Pagination must protect the platform from abuse and accidental oversized reads.

Rules:

- `page` must be an integer greater than or equal to 1
- `pageSize` must be an integer between 1 and 100 by default
- Endpoints may define a lower `pageSize` maximum (recommended for AI-heavy, cost-sensitive, or high-latency lists), but must document the max in OpenAPI and enforce it in validation
- Requests outside those limits must be rejected with validation errors
- Do not silently accept oversized `pageSize` values by clipping them without telling the client

A hard maximum of 100 items per page keeps list endpoints predictable and safer for shared infrastructure.

### Sort Field Rules

Sorting must be explicit and constrained to safe, supported fields.

Rules:

- `sortBy` must only allow documented sortable fields for the resource
- Do not accept arbitrary database field names from clients
- If a field is not sortable, reject it rather than ignoring it silently
- Sort fields should map to stable API concepts, not fragile internal implementation names
- Enforce `sortBy` with an explicit allowlist (e.g., `z.enum([...])`) and map to Prisma `orderBy` fields internally; never pass user input directly into ORM order clauses

Examples of safe sortable fields:

- `createdAt`
- `updatedAt`
- `name`
- `detectedAt`
- `submittedAt`

### Sort Direction Rules

Sort direction must be standardized.

Allowed values:

- `asc`
- `desc`

Rules:

- Reject any other value
- Do not accept mixed aliases like `ascending`, `DESCENDING`, `1`, or `-1`
- If omitted, use the standard default `desc` unless the endpoint explicitly documents otherwise

### Filtering Conventions

Filtering should use simple, explicit query parameters rather than custom mini-languages.

Recommended patterns:

- `status=active`
- `stage=negotiation`
- `ownerId=<uuid>`
- `fromDate=2026-04-01`
- `toDate=2026-04-30`
- `isPublished=true`

Rules:

- Filter names must be descriptive and domain-oriented
- Filter values must be validated like any other input
- Repeated filters or array filters must use one documented pattern consistently
- Do not overload a single generic `filter` string with many hidden semantics unless a search backend truly requires it and the contract is documented clearly

If a resource supports many filters, document the supported set explicitly instead of allowing arbitrary query keys.

### Search Query Rules

When free-text search is supported, use a standard query parameter.

Standard:

- `q`

Rules:

- `q` should represent user-entered search text
- Search endpoints must still support pagination and sorting rules where applicable
- Search input should be length-limited to prevent abuse
- Search behavior should be documented clearly when hybrid search, semantic search, or typo-tolerant search is involved
- Search queries must never bypass tenant scoping

Examples:

- `/api/v1/smart-tracking/conversations?q=budget`
- `/api/v1/smart-tracking/conversations?q=pricing&page=1&pageSize=25`

### Cursor vs Offset Guidance

Use offset-style pagination by default for normal product lists unless there is a clear scalability reason to use cursors.

Guidance:

- Use page-based offset pagination for standard UI list views
- Consider cursor-based pagination when datasets are very large, continuously changing, or sensitive to duplicate/skip issues under heavy write activity
- Do not mix offset and cursor models on the same endpoint casually
- If cursor pagination is introduced later, document it clearly as a separate contract pattern

Hard requirement:

- Cursor-based pagination is required for transcription segment lists, real-time event feeds, and any list where the dataset grows faster than the user's page-view rate (to avoid duplicates/missing items under concurrent writes)

For the current platform standards, page and pageSize are the canonical default approach.

## Idempotency and Retry Safety

### Idempotent Endpoint Rules

Endpoints must be designed with replay and retry safety in mind.

Rules:

- `GET` must always be idempotent
- `PUT` should be idempotent
- `DELETE` should be idempotent in resulting state where practical
- `PATCH` may be idempotent depending on the operation
- `POST` is not idempotent by default and must be treated carefully when duplicates matter

If an operation can be repeated by the browser, frontend retry logic, network intermediaries, workers, or webhook providers, the API must define what happens on replay.

### Idempotency Keys

Idempotency keys should be used for operations where duplicate submission risk is meaningful and the action is not naturally idempotent.

Use idempotency keys for cases such as:

- payment-like actions if introduced later
- export job creation
- external callback processing
- bulk operations with non-trivial side effects
- command-style creation endpoints that may be retried automatically

Rules:

- The idempotency key must represent one logical client intent
- Repeating the same request with the same idempotency key should not create duplicate work
- The platform should either return the original successful result or a consistent duplicate-safe response
- Idempotency behavior must be documented per endpoint

### Duplicate Request Handling

Duplicate requests must be handled explicitly, not left to chance.

Possible handling strategies:

- Return the already-created resource
- Return the existing job record
- Ignore the duplicate safely
- Return a conflict when the duplicate violates business rules and reuse is not supported
- Detect duplication using a unique business key, job key, webhook ID, or explicit idempotency key

Rules:

- Duplicate handling must be deterministic
- Do not create multiple side effects for the same logical command if the operation is meant to be replay-safe
- If duplicate requests are expected under normal operation, design for them from day one

### Retry Expectations

Clients and internal services should know what is safe to retry.

General guidance:

- `GET` requests are safe to retry
- `429` and `503` responses may be retried with backoff
- Validation and permission failures should not be retried unchanged
- Long-running async commands should prefer a single accepted request plus polling, not repeated command submission
- Internal service calls must use bounded retries with exponential backoff where configured

Rules:

- Retries must be bounded
- Retries must preserve request ID and idempotency context where relevant
- Retrying a request must not silently create duplicate side effects

### Webhook Deduplication

Webhook endpoints must assume duplicate delivery is normal.

Rules:

- Every webhook must verify authenticity first
- Every webhook must perform duplicate detection before triggering downstream work
- Duplicate detection should use a provider event ID, webhook ID, or a stable derived key
- If the same webhook is delivered twice, the second delivery must not enqueue duplicate processing
- Deduplication decisions must be logged with request ID and provider-safe context

The architecture already expects webhook duplicate prevention through unique webhook identifiers and queue-safe processing patterns.

### Conflict Detection Rules

Conflicts must be detected intentionally and surfaced clearly.

Use conflict detection for:

- uniqueness violations
- duplicate logical creation
- optimistic version mismatch
- command replay without valid idempotent handling
- invalid transitions caused by current resource state

Rules:

- Use `409 Conflict` when the main issue is current state collision
- Use `422 Unprocessable Entity` when the request is valid but business rules disallow it even without a state collision
- Never expose raw database uniqueness errors directly to clients
- Map conflicts into stable API codes and messages

Concurrent Write Policy:

- High-contention resources (e.g., deals, forecast submissions, playbooks, board configuration) must use optimistic locking (ETag / `If-Match` or an explicit `version` / `updatedAt` field)
- Client sends `PATCH`/`PUT` with `If-Match: <etag>` (preferred) or includes the last-seen `version`/`updatedAt` in the request body per endpoint contract
- Server returns `409 Conflict` (error code: `VERSION_MISMATCH`) when the version does not match current state
- Client must reload the latest representation and re-apply changes

## Asynchronous API Standards

### When to Use Async Processing

Use asynchronous processing when work is too slow, too expensive, too failure-prone, or too multi-step to keep inside a normal request-response cycle.

Use async for:

- AI deep research generation
- transcription
- large exports
- batch processing
- multi-step AI workflows
- heavy integrations
- large fan-out downstream actions

Do not use async for small, user-facing actions that are expected to complete quickly and where immediate response matters.

### 202 Accepted Pattern

When an endpoint accepts long-running work, it must return `202 Accepted` immediately rather than waiting for final completion.

Standard pattern:

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "queued",
    "pollUrl": "/api/v1/insights/research/{jobId}",
    "estimatedSeconds": 120
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:00:00.000Z"
  }
}
```

Rules:

- Return `202` only after validation and authorization succeed
- Include the job identifier
- Include the initial job status
- Include a polling reference
- Include an estimate only if it is reasonably meaningful

### Job Resource Shape

Async jobs should have a predictable resource representation.

Recommended fields:

- `jobId`
- `status`
- `createdAt`
- `startedAt`
- `completedAt`
- `failedAt`
- `result` when completed
- `error` when failed
- optional progress or estimate fields when useful

Rules:

- Keep job fields consistent across modules
- Job resources must remain tenant-scoped
- Internal execution details should not leak through the job API unless intentionally exposed

### Polling Endpoint Convention

Every async command that returns `202` must expose a clear polling mechanism.

Recommended pattern:

- `POST /api/v1/{module}/...` to create the job
- `GET /api/v1/{module}/{job-resource}/{jobId}` to check status

Example:

- `POST /api/v1/insights/research`
- `GET /api/v1/insights/research/{jobId}`

Rules:

- Polling endpoints must be documented along with the command endpoint
- Polling endpoints must use normal auth and tenant safety rules
- Polling endpoints must not require clients to infer hidden URLs

### Job Status Values

Async job statuses must be standardized.

Standard values:

- `queued`
- `processing`
- `completed`
- `failed`

Rules:

- Do not invent many near-duplicate statuses without strong need
- Status names must be lowercase and stable
- Job status transitions must be monotonic and understandable
- If cancellation is introduced later, define it explicitly rather than overloading `failed`

### Completion Response Rules

When a pollable job finishes successfully, the polling endpoint should return a completed response with the result.

Standard pattern:

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "completed",
    "result": {},
    "completedAt": "2026-04-22T09:10:00.000Z"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:10:01.000Z"
  }
}
```

Rules:

- Completed responses should use `200 OK`
- The result should be placed inside `data.result` or an equivalent documented result field
- The final response should remain inside the standard response envelope

### Failure Response Rules

When an async job fails after all retries, the polling endpoint must return a stable failure response.

Standard pattern:

```json
{
  "success": false,
  "data": {
    "jobId": "uuid",
    "status": "failed",
    "failedAt": "2026-04-22T09:10:00.000Z"
  },
  "error": {
    "code": "JOB_FAILED",
    "message": "AI Services Layer returned an error during report generation"
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:10:01.000Z"
}
```

Rules:

- Do not pretend failed jobs are successful just because the polling request itself worked
- Return a stable machine-readable failure code
- Mask internal failure details
- Preserve request ID and timestamps

### Timeout and Retry Policy

Async and internal service execution must follow bounded timeout and retry rules.

Platform-aligned guidance:

- Sync user-facing calls should use shorter timeouts
- Background jobs may use longer timeouts
- Internal calls should use bounded retries, commonly 3 attempts with exponential backoff where configured
- Exhausted retries should move work to a failure state or dead-letter queue
- Timeouts must be observable and logged with request ID and tenant context

The current architecture already applies timeout-based behavior for AI service endpoints and returns `503` to frontend consumers when a synchronous internal dependency times out.

### DLQ (Dead Letter Queue) Recovery Policy

For BullMQ-backed async workflows, DLQ is a data durability and correctness mechanism. A silent DLQ is a data loss event.

Policy:

- DLQ ownership: Platform/Operations owns DLQ monitoring and alerting; module owners own diagnosis and replay of their job types
- Retention: failed jobs must remain available for manual inspection/replay for at least 14 days (or the approved ops standard, whichever is longer)
- Replay: engineers must have a documented, repeatable way to replay DLQ jobs safely (idempotent handlers, safe dedupe, and audit logging required)
- Alerting: page/alert when DLQ depth exceeds a defined threshold or grows continuously over a rolling window
- Runbook: each async-heavy module must link to (or include) a short runbook describing how to inspect DLQ entries, replay safely, and mitigate recurring causes

## Authentication Standards

### Supported Authentication Methods

The platform supports a small, explicit set of authentication methods based on API type.

Supported methods:

- Bearer JWT for normal client-facing protected APIs
- Public no-auth access only for explicitly approved endpoints
- Internal shared-secret authentication for trusted service-to-service APIs
- HMAC signature verification for webhook endpoints

No other authentication pattern should be introduced without explicit approval and documentation.

### Bearer JWT Rules

Bearer JWT is the standard authentication method for protected client APIs.

Rules:

- Send JWT in the `Authorization` header
- Format must be `Authorization: Bearer <access-token>`
- Every protected endpoint must verify token validity and expiry
- JWT-derived user and tenant context is the trusted source for access control
- Every protected route must also apply role and record-scope enforcement where required

JWT is required for all normal protected endpoints except explicitly documented public exceptions.

### Public Endpoint Exceptions

Only a small set of endpoints may be public.

Current approved public exceptions include:

- sign-in endpoint
- sign-up endpoint
- token refresh endpoint
- health endpoint

Rules:

- Public access must be explicit, documented, and reviewed
- Public does not mean unvalidated or unprotected
- Public endpoints must still apply strict input validation, rate limiting where appropriate, and observability controls
- Adding a new public endpoint requires deliberate approval

### Internal Secret Authentication

Internal service APIs must use the approved internal secret model.

Rules:

- Internal requests must include `X-Internal-Secret`
- Internal requests must also carry `X-Tenant-Id` and `X-Request-Id`
- The internal service must reject requests missing a valid secret
- Internal secrets must come from secure secret management, not hardcoded values
- Internal auth protects FastAPI services from direct unauthorized invocation

Internal auth does not replace validation, observability, or tenant safety. It is only one layer.

### Webhook Signature Authentication

Webhook endpoints must authenticate requests using signature verification rather than JWT.

Rules:

- Verify the provider signature on every webhook request
- Use HMAC-SHA256 or the provider-approved equivalent
- Reject invalid signatures immediately with `401`
- Store webhook secrets securely
- Perform replay and duplicate protection in addition to signature validation

Webhook endpoints are external trust boundaries and must be treated as high-risk ingress points.

### Token Handling Rules

Token handling must follow the platform’s security model.

Current standard:

- Access token is short-lived
- Access token is stored in memory only
- Refresh token is stored in an `HttpOnly` cookie
- Refresh flow is triggered when a `401 TOKEN_EXPIRED` response is received
- The client retries the original request after successful refresh

Rules:

- Never store access tokens in `localStorage`
- Never store access tokens in `sessionStorage`
- Never accept refresh tokens through casual insecure patterns if the approved cookie-based flow exists
- Never log tokens
- Never expose tokens in error payloads
- Frontend must implement a refresh singleton to prevent refresh races:
  - Use a shared in-flight promise for the refresh call
  - All concurrent `401 TOKEN_EXPIRED` handlers wait on the same refresh promise
  - Only one refresh call goes out at a time
  - All waiting callers retry with the single new token

This model reduces XSS exposure while keeping the user session workable for normal frontend flows.

## Authorization Standards

### Request Processing Order (Guards / Interceptors / Validation)

Protected request execution order must be consistent so that auth, tenant context, RBAC, throttling, and validation behave predictably.

Expected order:

```text
JwtAuthGuard → TenantInterceptor → RbacGuard → TenantThrottlerGuard → ZodValidationPipe → Handler
```

### RBAC Rules

All protected endpoints must enforce Role-Based Access Control using the platform’s approved role model.

Supported platform roles:

- `AE`
- `SDR`
- `Manager`
- `RevOps`
- `Admin`

Access intent by role:

- `AE` can access their own deals, calls, emails, and tasks
- `SDR` can access their own outreach tasks and permitted shared prospect data
- `Manager` can access data for their direct team
- `RevOps` can access tenant-wide operational and configuration data
- `Admin` has the highest tenant-level authority, including user and billing administration

Rules:

- RBAC must be applied to every protected endpoint
- Authenticated does not mean authorized
- Role rules must be explicit and documented
- Role expansion must be conservative and reviewed

### Role Declaration on Endpoints

Every protected endpoint must declare its allowed roles directly at the route layer.

Rules:

- Use the NestJS `Roles` decorator on every protected route
- The RBAC guard must enforce the declared roles before the route handler runs
- Missing role declaration on a protected endpoint is a review failure
- Swagger or equivalent docs must reflect role expectations where possible

This keeps authorization visible to reviewers and prevents “hidden permission logic” deep in service code.

### Tenant Scoping Rules

Authorization is not complete until tenant scope is enforced.

Rules:

- Route-level RBAC decides who may call the endpoint
- Tenant scoping decides which tenant’s data they may reach
- Record queries must always be scoped to the current trusted tenant context
- No module may bypass tenant scoping for convenience

An endpoint is not secure if it checks role correctly but still allows the wrong tenant’s data to be queried.

### Record-Level Access Control

Some endpoints require finer control than route-level RBAC.

Examples:

- AEs should only see their own records
- Managers should only see records for direct reports
- RevOps and Admin may see broader tenant-level data where appropriate

Rules:

- Record visibility checks must be enforced in the service layer
- RBAC and record-level scoping are separate and both are required
- Record ownership, team membership, and permitted scope must be derived from trusted server-side context
- Client input must never be trusted to define record visibility

### Admin Endpoint Restrictions

Admin endpoints are more sensitive than normal product endpoints and must be protected accordingly.

Rules:

- Admin endpoints must be restricted to `Admin` unless a narrower documented exception exists
- `RevOps` access to admin-like functionality must be explicitly approved per endpoint
- High-impact actions such as user management, billing changes, tenant configuration, and compliance settings require stricter role review
- Admin endpoints must be logged with strong audit coverage

Do not expose administrative behavior under normal user-facing endpoints.

### Least Privilege Principle

All authorization decisions must follow least privilege.

Rules:

- Grant the minimum access needed for the role and use case
- Do not broaden endpoint access “for convenience”
- Prefer narrower access first, then expand only with a clear reason
- Temporary broad access must never become the permanent default

If there is doubt, choose the narrower permission model and escalate through review.

## Multi-Tenancy Rules

### Tenant Context Source

Tenant context must come from trusted authenticated context, not from user-controlled input.

Approved tenant context sources:

- verified JWT claims
- tenant resolution performed server-side after auth
- trusted internal headers for service-to-service requests

Rules:

- Tenant context must be established before business logic runs
- The `TenantInterceptor` or equivalent platform mechanism must populate tenant context for every protected request
- Internal services must receive tenant context through trusted internal headers only

### Never Accept Tenant ID from Client

Protected APIs must never accept `tenantId` from request body, query parameters, or user-controlled headers as the source of truth.

Rules:

- Ignore or reject client-supplied `tenantId` on protected endpoints
- Derive tenant context from JWT or trusted internal context only
- If a client sends `tenantId`, it must not influence data scoping
- Any endpoint design that relies on user-supplied tenant identity is incorrect by default

This is one of the most important platform safety rules.

### Tenant Isolation Rules

Tenant isolation must be enforced at multiple layers.

Defense-in-depth layers include:

- API layer tenant context enforcement
- Prisma middleware auto-scoping
- PostgreSQL row-level security
- role and record-level checks
- audit logging and traceability

Rules:

- Every read and write must stay within the active tenant scope
- Tenant isolation must apply to synchronous APIs, async jobs, logs, events, and internal calls
- Tenant context loss is a security issue, not just a bug

### Cross-Tenant Access Prohibition

Cross-tenant access is prohibited unless an explicitly approved platform operation requires it and is protected outside normal product APIs.

Rules:

- Normal product endpoints must never expose another tenant’s data
- No user role should gain access to another tenant’s records through query parameters, guessed IDs, or internal shortcuts
- Background jobs must preserve tenant scope correctly
- Search, analytics, exports, and AI retrieval must all remain tenant-scoped

A feature is unacceptable if it works functionally but leaks data across tenants.

### Auditability of Tenant Context

Tenant context must be observable and auditable.

Rules:

- Structured logs must include tenant context where safe and appropriate
- Request tracing must preserve tenant context through internal calls and async workflows
- Audit logs must record who performed a write and in which tenant context
- Missing tenant context in protected write paths is a platform defect

Auditability is what lets the team prove isolation, investigate incidents, and debug safely.

## Rate Limiting Standards

### Tenant-Based Limits

Rate limiting must primarily be enforced per tenant so one customer cannot saturate shared infrastructure.

Rules:

- Apply core API limits per tenant
- Use tenant-aware throttling derived from authenticated context
- Rate limiting must not depend only on IP address for authenticated APIs
- Rate limit decisions must remain consistent across retries and scaled instances

The architecture already uses tenant-aware rate limiting with Redis-backed state.

### Plan-Tier Limits

Rate limits must align with the tenant’s plan tier.

Current plan-tier limits:

- `Starter`: 60 requests/minute, 5,000 requests/day
- `Growth`: 200 requests/minute, 20,000 requests/day
- `Pro`: 500 requests/minute, 100,000 requests/day
- `Enterprise`: 2,000 requests/minute, unlimited daily usage

Rules:

- The effective rate limit must be derived from the tenant’s plan
- Tier changes must take effect without contract ambiguity
- Rate limit policy must be documented and visible to support and operations teams

### AI Endpoint Limits

AI-heavy endpoints must have tighter or additional limits because they are cost-sensitive and computationally expensive.

Current AI endpoint hourly limits:

- `Starter`: 20 AI requests/hour
- `Growth`: 100 AI requests/hour
- `Pro`: 500 AI requests/hour
- `Enterprise`: unlimited

Examples of AI-limited endpoints include:

- Ask Anything
- AI Deep Researcher
- AI Email Composer
- AI Trainer turn generation

Rules:

- AI-specific quotas apply in addition to normal API rate limits
- AI rate limiting must be per tenant
- Exceeding AI quota must return the standard rate-limit response shape

### Rate Limit Headers

Rate limit headers must be included consistently so clients can react intelligently.

Standard headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `X-RateLimit-Tier`

Rules:

- Include headers on normal responses and rate-limited responses where practical
- Header values must reflect the effective tenant plan and active window
- Do not send misleading values when multiple layered limits exist

### 429 Response Shape

Rate-limited requests must return a standard `429` response.

Recommended shape:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Resets in 47 seconds.",
    "details": {
      "limit": 200,
      "remaining": 0,
      "resetInSeconds": 47,
      "tier": "Growth"
    }
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:00:00.000Z"
}
```

Rules:

- Include a machine-readable error code
- Include enough detail for the client to back off properly
- Include `Retry-After` header on every `429` response (seconds until reset for the limiting window)
- Keep the response shape consistent with the platform error envelope

### API Gateway Contract (Cloudflare / Railway)

The edge gateway is the first line of defense for abuse protection and rate limiting. NestJS must behave predictably behind the gateway.

Rules:

- Gateway must forward the original client IP using `CF-Connecting-IP` and `X-Forwarded-For` (append-only); NestJS must not trust arbitrary client-sent `X-Forwarded-For` unless it comes from the gateway
- Gateway must forward `X-Request-Id` if present; otherwise it should allow NestJS to generate one at ingress
- Tenant-based throttling in NestJS (`TenantThrottlerGuard`) is the primary limit for authenticated APIs; Cloudflare/Railway limits are complementary outer protection (per-IP / WAF / DDoS)
- If Cloudflare blocks a request before it reaches NestJS, it will not return the platform JSON envelope; platform-level `429` JSON envelope is guaranteed only when the request reaches the application
- Rate-limit tests must be explicit about which layer they validate (gateway vs application)

### Backoff Expectations

Clients and internal consumers must back off responsibly after rate limiting or temporary service failure.

Rules:

- Use exponential backoff with jitter where practical
- Respect `Retry-After` when provided
- Do not immediately hammer retry on `429` or `503`
- Frontend auto-retry should be conservative, especially for unsafe methods
- Background workers must use bounded retries

## Security Standards

### Secure Defaults

Every API must be secure by default.

Rules:

- Protected unless explicitly public
- Validated before execution
- role-checked before access
- tenant-scoped by default
- observable by default
- rate-limited where needed
- safe error responses only

Security should be the starting point, not an afterthought added after feature completion.

### Input Sanitization

All user-controlled input must be validated and handled safely before use.

Rules:

- Validate all inputs at the API boundary
- Reject malformed or unexpected fields
- Sanitize or normalize data where required for safe downstream processing
- Do not pass raw user input directly into search backends, prompts, logs, or integration calls without control

Validation and sanitization work together; one does not replace the other.

### Output Encoding Considerations

APIs should return data safely and predictably so downstream consumers can render it without confusion or injection risk.

Rules:

- Return structured JSON, not executable content
- Avoid reflecting unsafe raw input into messages when not necessary
- Downstream UI layers remain responsible for HTML-safe rendering, but APIs should avoid creating unsafe output patterns
- Do not store or surface rich text or markup casually unless the contract requires it and sanitization is defined

### Sensitive Data Rules

Sensitive data must be minimized, protected, and never exposed without need.

Rules:

- Return only the fields needed for the consumer’s use case
- Do not expose secrets, tokens, credentials, or internal service details
- Avoid returning raw third-party error payloads
- Sensitive operational metadata should stay server-side unless explicitly required

### PII Handling in APIs

PII handling must follow the platform’s compliance and redaction model.

Current platform behavior:

- highly sensitive structured PII such as card numbers, SSNs, bank account numbers, passport numbers, national IDs, and spoken passwords is redacted before transcripts are stored
- names, phone numbers, email addresses, and company names are not automatically redacted because they are core revenue intelligence data
- additional custom redaction patterns may be tenant-configurable

Rules:

- APIs must not expose unredacted sensitive transcript content that the platform promises to redact
- Do not log raw sensitive payloads casually
- PII access should remain role-appropriate and tenant-scoped
- Any new PII exposure path must go through security review

### Secret Handling Rules

Secrets must be handled only through approved secret-management practices.

Rules:

- Store secrets in Doppler or the approved secrets manager
- Never hardcode secrets in code
- Never commit secrets to repos
- Never return secrets in API responses
- Never include secrets in logs, traces, or error messages

This applies to JWT-related config, internal shared secrets, webhook secrets, API keys, and provider credentials.

### Webhook Security Requirements

Webhook endpoints are a high-risk ingress surface and require stronger protections.

Rules:

- Verify HMAC signature on every webhook request
- Reject invalid signatures with `401` immediately
- Use timing-safe comparison
- Store secrets securely
- Enforce duplicate detection
- Apply rate limits and abuse protection
- Push accepted work to the queue quickly instead of doing heavy processing inline

### Abuse Protection Expectations

APIs must assume abusive or accidental bad traffic will happen.

Controls should include:

- Cloudflare edge protection
- WAF and DDoS protection
- per-tenant rate limiting
- per-IP outer protection for public or webhook endpoints
- strict validation
- safe queueing
- observability and alerting

Security is not just about auth; it is also about resisting misuse and protecting shared capacity.

## Internal API Standards

### NestJS to FastAPI Contract Rules

Internal service-to-service APIs between NestJS and FastAPI are real contracts and must remain stable and documented.

Rules:

- Internal endpoints must be versioned or explicitly governed
- Request and response schemas must be documented
- Internal payloads must be validated
- Internal API changes must not be made casually because multiple modules depend on them
- The API layer remains the owner of business logic; FastAPI services perform AI/ML and processing responsibilities only

### Internal Header Requirements

All NestJS-to-FastAPI requests must include the required trusted headers.

Required headers:

- `X-Internal-Secret`
- `X-Tenant-Id`
- `X-Request-Id`
- `Content-Type: application/json`

Rules:

- Missing required internal headers must cause request rejection
- Internal headers must come only from trusted platform services
- Tenant context for internal work must travel through these trusted headers, not user-controlled values
- `X-Internal-Secret` must rotate at least every 90 days; Platform/DevOps owns rotation and coordinated rollout (new secret accepted before old is revoked)

### Timeout Rules

Internal calls must use explicit timeouts based on the endpoint’s workload.

Current timeout guidance from the architecture:

- transcribe: 10 minutes
- summarize: 60 seconds
- detect-trackers: 120 seconds
- generate-email: 30 seconds
- answer-query: 60 seconds
- score-call: 120 seconds
- simulate-turn: 30 seconds
- detect-themes: 5 minutes
- generate-embeddings: 60 seconds

Rules:

- Never make unbounded internal HTTP calls
- Use shorter timeouts for sync user-facing operations
- Use longer timeouts only for background workloads where justified
- Timeout values must be observable and reviewable

### Service Authentication

FastAPI internal services must authenticate the caller before processing.

Rules:

- Validate `X-Internal-Secret` on every internal request
- Reject unauthorized internal traffic with `401`
- Do not allow browser or third-party clients to call internal FastAPI endpoints directly
- Secret validation is mandatory even on private network paths

### Failure Propagation Rules

Internal service failures must be propagated safely and consistently.

Rules:

- Temporary FastAPI unavailability or timeout should result in `503 SERVICE_UNAVAILABLE` at the client-facing API layer for synchronous operations
- Internal errors must be logged with request ID and tenant context
- Do not leak raw internal exception details to frontend consumers
- For background workflows, prefer retries, DLQ handling, and job failure states over synchronous user-facing crashes
- Do not convert every dependency failure into a generic `500` when `503` is more accurate

### No Direct Consumer Access

Internal APIs are not consumer APIs.

Rules:

- They must not be documented as public endpoints
- They must not be reachable by frontend clients as supported product APIs
- They must not rely on browser auth flows
- Any direct consumer access path to internal AI services is a security and architecture violation

## Webhook Standards

### Webhook Endpoint Naming

Webhook endpoints must use explicit, provider-aware naming under the owning module.

Recommended pattern:

```text
/api/v1/{module}/webhooks/{provider}
```

Examples:

- `/api/v1/ingestion/webhooks/zoom`
- `/api/v1/ingestion/webhooks/teams`
- `/api/v1/ingestion/webhooks/google-meet`

Rules:

- Keep webhook routes separate from normal client APIs
- Namespace them under the owning module
- Use plural `webhooks` for consistency

### Signature Verification

Every webhook request must be authenticated before any business action is taken.

Rules:

- Verify the provider signature header
- Use HMAC-SHA256 or the provider-approved equivalent
- Reject invalid signatures with `401`
- Use timing-safe comparison
- Store provider secrets in approved secret management only

### Idempotency Handling

Webhook delivery is not guaranteed to be exactly once, so webhook processing must be idempotent.

Rules:

- Deduplicate using provider event ID, webhook ID, or a stable unique key
- Prevent duplicate queue submission for the same logical event
- Treat duplicate webhook delivery as normal behavior, not as an edge case
- Log duplicates for observability

### Fast Acknowledgement Pattern

Webhook handlers should validate quickly and acknowledge quickly.

Rules:

- Do authentication and basic validation immediately
- Persist minimal receipt state if needed
- Enqueue downstream processing
- Return quickly instead of doing long-running work inline

This reduces provider retries, lowers timeout risk, and protects ingress stability.

### Queue-First Processing

Webhook-triggered workflows must use queue-first architecture for any non-trivial work.

Rules:

- Do not perform transcription, AI generation, or large integration flows directly inside the webhook request
- Hand off work to BullMQ or the approved async mechanism
- Use queue priorities and DLQ behavior as defined by platform standards
- Preserve request ID and tenant context when creating jobs

### Replay Protection

Webhook security must include replay protection, not just signature verification.

Rules:

- Detect reused webhook/event IDs
- Reject or safely ignore replayed events
- Apply time-window checks if the provider supports them
- Keep replay protection keys scoped correctly and expired appropriately

### Monitoring and Alerting

Webhook health must be monitored because it is a critical ingress path.

Rules:

- Log webhook accept/reject outcomes
- Track invalid signature rates
- Alert on unusual rejection spikes
- Monitor queue depth and downstream processing failures
- Surface operational issues in Sentry, logs, and metrics dashboards

For this platform, webhook security is mission-critical because malformed or malicious ingress could flood queues, inflate AI costs, or contaminate downstream data if not stopped early.

## Data Contract Standards

### OpenAPI as Source of Truth

OpenAPI must be the source of truth for API contracts.

Rules:

- Every externally exposed endpoint must be represented in Swagger/OpenAPI
- The documented request shape, response shape, auth requirement, path, query parameters, and error responses are the contract
- Code, tests, and frontend integrations must align to the published OpenAPI contract
- If implementation and OpenAPI differ, the endpoint is considered out of compliance

OpenAPI is not a nice-to-have. It is the formal API contract.

### Request and Response Schema Rules

Every endpoint must define explicit request and response schemas.

Rules:

- Define schemas for path params, query params, headers when relevant, request body, success response, and error response
- Request and response schemas must use stable field names and types
- Avoid `any`, undocumented free-form objects, and ambiguous polymorphism unless there is a strong reason
- Response schemas must reflect the standard response envelope unless an approved exception exists
- Internal endpoints should also have explicit schemas even if they are not published publicly

### Enum Governance

Enums are contract elements and must be governed carefully.

Rules:

- Every enum used in a request or response must have a defined owner
- Enum values must be documented in OpenAPI
- Enum values must be stable once released
- Adding enum values is allowed only when downstream consumers can tolerate them
- Renaming or removing enum values is a breaking change unless versioned

Examples of governed enums include:

- roles
- sort directions
- job statuses
- workflow statuses
- severity levels

### Field Deprecation Rules

Fields must not disappear suddenly from a released contract.

Rules:

- Deprecated fields must be marked as deprecated in OpenAPI
- Deprecation must be documented in changelog or release notes
- Deprecated fields should continue to behave predictably during the deprecation period
- Do not reuse an old field name for a new meaning
- New consumers should be guided to the replacement field or pattern

A deprecated field is still a supported field until the removal process completes.

### Breaking vs Non-Breaking Changes

Contract changes must be classified correctly before merge.

Breaking changes include:

- removing a field
- renaming a field
- changing field type incompatibly
- changing required fields incompatibly
- changing enum values incompatibly
- changing auth requirements incompatibly
- changing path or method incompatibly
- changing response shape incompatibly
- changing error codes or semantics in a way consumers rely on

Non-breaking changes typically include:

- adding optional fields
- adding new endpoints
- adding new optional query parameters
- adding new documented error examples
- adding new response metadata that consumers can ignore safely

If there is doubt, treat the change as breaking until reviewed.

### Contract Review Checklist

Every contract change must pass a simple review checklist before merge.

Checklist:

- OpenAPI updated
- request schema updated
- response schema updated
- auth documented
- role requirements documented
- error responses documented
- examples added or updated
- pagination and filtering documented if applicable
- backward compatibility assessed
- frontend impact assessed
- migration path documented if needed
- changelog entry prepared if consumer-visible

If the OpenAPI diff is empty for a new endpoint, the PR is not ready for review.

## Versioning and Change Management

### API Versioning Strategy

The platform uses explicit path-based major versioning.

Standard:

```text
/api/v1/...
```

Rules:

- Public APIs must include the major version in the path
- Breaking changes require a new major version such as `v2`
- Non-breaking changes should remain within the existing version
- Internal AI service endpoints also follow explicit versioning such as `v1` and `v2`

Versioning must be intentional and visible, not implicit.

### Backward Compatibility Policy

Released APIs must remain backward compatible within the same major version.

Rules:

- Do not break existing consumers in place
- Prefer additive change over destructive change
- Preserve response fields and semantics that consumers already rely on
- If behavior must change incompatibly, release a new major version instead
- Compatibility applies to public APIs first, but stable internal service contracts should follow the same discipline

### Deprecation Policy

Deprecation must be explicit, documented, and time-bound.

Rules:

- Mark deprecated endpoints or fields in OpenAPI
- Announce the deprecation clearly
- Provide a replacement path
- Keep the deprecated version operational during the deprecation window
- Monitor usage if possible before removal

Deprecation is a managed transition, not a silent warning hidden in code.

### Sunset Process

Sunset of deprecated contracts must follow a controlled process.

Minimum current platform rule:

- Old endpoint versions remain live for a minimum sunset window after v2 is available:
  - Public client APIs: minimum 8 weeks
  - Internal service APIs: minimum 30 days

Recommended sunset steps:

- mark deprecated
- publish replacement guidance
- announce timeline
- monitor remaining usage
- remove only after the agreed window and review

### Version Migration Playbook (Dual-Version Support)

Breaking changes ship as a new major version (e.g., `v2`) and run side-by-side with the prior version during the sunset window.

Rules:

- Dual-version support is implemented at the NestJS routing layer (`/api/v1/...` and `/api/v2/...` live concurrently); gateway/proxy may route traffic, but the application contract remains explicit by path
- Deprecation notice must be communicated in release notes and the API changelog, and must be shared with frontend/consumer owners at least one sprint before removal
- Migration owner must be assigned in the versioning PR (module owner for the API, plus a named consumer owner for large migrations); the migration owner is responsible for tracking remaining consumers and retiring the old version
- Removing a version requires evidence that known consumers have migrated (or an explicitly accepted risk decision)

No contract should be removed casually because “the frontend was updated already.”

### Change Announcement Rules

Consumer-visible API changes must be announced clearly.

Rules:

- Announce breaking changes before release
- Announce deprecations with timing and migration guidance
- Include affected endpoints, fields, auth changes, and response changes
- Keep announcements easy to understand for frontend engineers, QA, and integrators

The goal is to reduce surprise and last-minute breakage.

### Migration Guidance Rules

When a change requires consumer action, migration guidance is mandatory.

Migration guidance should include:

- what changed
- why it changed
- who is affected
- what to update
- examples before and after
- deadline for migration if applicable

Rules:

- Migration notes must be practical, not vague
- If a field is replaced, name the replacement directly
- If an endpoint is replaced, show the new path, method, and shape
- If auth behavior changes, document the required consumer changes explicitly

## Documentation Standards

### Swagger OpenAPI Requirement

Swagger/OpenAPI documentation is mandatory for every API endpoint.

Rules:

- No new endpoint may merge without Swagger documentation
- OpenAPI must reflect the actual implementation
- OpenAPI must include auth requirements, parameters, request schema, success responses, and error responses
- Docs must stay current as the endpoint evolves

Swagger is part of the definition of done, not post-work.

### Required Endpoint Documentation

Every documented endpoint must include at least:

- summary
- purpose
- method and path
- auth requirement
- allowed roles if protected
- path parameters
- query parameters
- request body schema if applicable
- success response schema
- error response schema
- async behavior if applicable
- pagination behavior if applicable
- deprecation marker if applicable

Documentation should let a fresher understand how to call the endpoint without reading backend code.

### Example Requests

Every meaningful endpoint should include at least one example request.

Rules:

- Use realistic field names and values
- Keep examples aligned with the schema
- Show query parameters for list endpoints where useful
- Include auth examples where helpful, but never real secrets or tokens

Good examples reduce integration mistakes faster than prose alone.

### Example Responses

Every meaningful endpoint should include example success responses.

Rules:

- Use the standard response envelope
- Include realistic `meta` structure
- For paginated endpoints, show pagination metadata
- For async endpoints, show the accepted-job shape and the completed-job shape when relevant

Examples should match actual platform conventions exactly.

### Error Examples

Endpoints must document likely error responses, not only the happy path.

At minimum, document relevant examples for:

- `400 INVALID_REQUEST`
- `401 UNAUTHORIZED` or `TOKEN_EXPIRED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 UNPROCESSABLE`
- `429 RATE_LIMITED`
- `503 SERVICE_UNAVAILABLE` where applicable

Rules:

- Show realistic error codes and messages
- Include validation detail examples when validation is non-trivial
- Keep the error shape consistent with the standard error envelope

### Auth Documentation

Auth expectations must be explicit in the docs.

Document clearly:

- whether the endpoint is public or protected
- whether Bearer JWT is required
- whether internal headers are required for internal APIs
- whether webhook signature verification applies
- which roles may call the endpoint if protected

Developers should never have to guess how an endpoint is secured.

### Changelog Expectations

Consumer-visible API changes must be recorded in a changelog or equivalent release history.

Changelog entries should capture:

- endpoint added
- endpoint deprecated
- field added
- field deprecated
- auth change
- rate-limit change
- behavior change
- version change

Rules:

- Keep entries concise but useful
- Group by release or deployment window
- Include migration notes when required

## Observability Standards

### Request ID Propagation

Every request must be traceable end to end using a request ID.

Rules:

- Generate or accept a valid request ID at ingress
- Include request ID in response metadata
- Propagate request ID to internal service calls using `X-Request-Id`
- Preserve request ID in async job creation context and related logs where possible
- Use the same request ID when reporting downstream dependency failures

This is the backbone of production debugging.

### Structured Logging Requirements

All API-related logs must be structured.

Structured logs should include, where appropriate:

- request ID
- tenant ID
- user ID
- module name
- endpoint or action
- status code
- latency
- error code
- dependency name when relevant

Rules:

- Do not rely on unstructured free-text logs alone
- Do not log secrets or raw tokens
- Keep log fields consistent across services
- Logs must be searchable in the approved log platform

The architecture already expects structured logging with tenant, module, and trace context.

Required log schema for every API request:

```json
{
  "level": "info | warn | error",
  "timestamp": "ISO 8601",
  "requestId": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "module": "deal-management",
  "action": "GET /api/v1/deal-management/boards/deals",
  "statusCode": 200,
  "latencyMs": 142,
  "errorCode": null
}
```

### Metrics Expectations

Every production API surface should emit enough metrics to understand health and load.

Metrics should cover at minimum:

- request count
- success rate
- error rate
- latency
- rate-limit events
- queue depth for async-heavy flows
- dependency failure counts where relevant

Rules:

- Metrics should be broken down by endpoint or endpoint family where useful
- Multi-tenant platforms should track enough dimensions to identify noisy tenants without exposing data unsafely
- Async systems should track queue and retry behavior, not just HTTP traffic

### Error Tracking Expectations

Unhandled errors and important failures must be captured in the approved error-tracking system.

Rules:

- All unhandled API exceptions must be reported to Sentry
- Dependency failures, timeout breaches, and retry exhaustion should also be visible in error tracking
- Error reports must include request ID and enough safe context to debug
- Sensitive data must be redacted before sending to error tracking

If production errors exist only in logs and not in error tracking, incident response becomes much slower.

### Latency Monitoring

Latency must be monitored as a first-class operational signal.

Rules:

- Track latency by endpoint and dependency path
- Distinguish normal read latency from slow AI- or integration-related operations
- Watch p50, p95, and p99 where meaningful
- Alert on sustained latency degradation, not just full outages
- Internal service timeouts must be measured and visible in metrics dashboards

Latency is part of API quality, not only an infrastructure concern.

### Audit Logging Rules

Write operations and high-risk actions must generate audit logs.

Audit logs should capture:

- tenant ID
- user ID
- action
- entity type
- entity ID
- relevant safe payload summary
- timestamp

Rules:

- Audit logs must be immutable or treated as append-only operational history
- Sensitive secrets and raw tokens must never be written to audit logs
- Admin actions, configuration changes, role changes, and critical write flows require especially strong audit coverage
- Audit logging is not the same as debug logging; it exists for accountability and traceability

In this platform, audit logs are part of the public schema and represent the immutable record of write activity across the system.

## Performance Standards

### Response Time Targets

API performance targets must be explicit and category-based.

Current platform targets:

- list and read endpoints: p99 under 300ms
- synchronous AI-backed endpoints: p99 under 5,000ms where user-facing AI latency is acceptable
- async trigger endpoints: under 200ms to acknowledge and enqueue work
- webhook ingestion endpoints: under 200ms to validate and acknowledge quickly
- all synchronous API endpoints overall: p99 under 500ms as the broader platform target

Rules:

- Measure latency continuously in production-like environments
- Track p50, p95, and p99 for meaningful endpoints
- Exclude long-running async job completion time from synchronous HTTP latency targets
- If an endpoint cannot reliably meet synchronous targets, redesign it as async instead of stretching the timeout forever

### Payload Size Guidance

Payloads should be intentionally small, predictable, and fit the endpoint purpose.

Rules:

- Return only fields needed by the consumer
- Use pagination for list endpoints
- Do not return oversized nested objects by default
- Avoid large transcript or analytics payloads in generic read endpoints unless the contract clearly requires them
- Prefer summary fields in list views and detailed fields in dedicated detail endpoints
- Large exports should use async generation rather than giant synchronous responses

Smaller payloads improve latency, reduce bandwidth, and make frontend code easier for freshers to work with.

### Timeout Budgets

Every network and processing path must have an explicit timeout budget.

Current internal AI timeout guidance includes:

- summarize: 60 seconds
- answer-query: 60 seconds
- generate-email: 30 seconds
- score-call: 120 seconds
- detect-trackers: 120 seconds
- detect-themes: 5 minutes
- simulate-turn: 30 seconds
- embedding generation: 15 to 60 seconds depending on endpoint path
- transcription-related processing is queue-driven and should not rely on a single long synchronous HTTP request

Rules:

- Never use unbounded timeouts
- Sync user-facing endpoints must use tighter timeout budgets than background jobs
- Timeouts must reflect real user experience, not just backend patience
- Timeout values must be visible in code and reviewable
- A timeout breach must produce a controlled failure path, not a hung request

### Expensive Operation Handling

Expensive work must not sit on the critical read path.

Rules:

- Precompute AI outputs whenever the architecture already supports post-call async generation
- Keep dashboards and common reads backed by stored results, not live AI calls
- Heavy jobs such as transcription, theme detection, bulk summarization, export generation, and large sync operations must run async
- If an operation is CPU-heavy, token-heavy, or fan-out heavy, enqueue it
- User-facing endpoints should acknowledge work quickly and let background systems complete the expensive part

The architecture is very clear that AI should never block common read flows when it can be precomputed.

### Caching Guidance

Caching is allowed when it improves performance without weakening correctness or tenant isolation.

Rules:

- Cache only data that is safe to reuse within the same tenant scope
- Include tenant context in cache keys for tenant-scoped data
- Use TTLs appropriate to the freshness needs of the endpoint
- Do not use cache as a substitute for fixing slow hot-path queries
- Cached responses must still respect authorization and record visibility constraints

Typical good cache candidates include frequently read list metadata, stable reference data, and short-lived computed results.

### Batch vs Chatty API Guidance

Prefer fewer well-shaped calls over many tiny round trips.

Rules:

- Design endpoints around real UI use cases, not database tables
- Avoid chatty frontend flows that require many sequential requests to render one screen
- Offer batch or aggregate endpoints where the UI genuinely needs combined data
- Do not collapse unrelated domains into one endpoint just to reduce request count
- Keep batching within module ownership boundaries

A good endpoint reduces network chatter without creating a god-endpoint.

## Testing Standards

### Unit Test Expectations

Unit tests must cover isolated business logic and validation behavior.

Rules:

- Use unit tests for services, guards, helpers, transformers, and pure business rules
- Mock external systems such as OpenAI, Whisper, CRM APIs, and Redis when testing isolated logic
- Keep unit tests fast and deterministic
- Do not pretend a unit test proves cross-service behavior
- Product-layer TypeScript tests must verify orchestration and guardrails, not real AI inference quality

Current approved tools include Jest for TypeScript services and pytest for Python-side logic.

### Integration Test Expectations

Integration tests must validate real application behavior at boundaries that matter.

Rules:

- Test HTTP endpoints with realistic auth, validation, and response handling
- Test database-backed flows against realistic infrastructure where possible
- Test queue-backed workflows with real or production-like dependencies when practical
- Verify status codes, response shape, persistence behavior, and side effects
- Use Testcontainers or equivalent infra-backed setup for PostgreSQL and Redis when meaningful

Integration tests are required because this platform depends heavily on auth, DB, queue, and service boundaries.

### Contract Test Expectations

Contract tests are mandatory for interfaces that other code depends on.

Rules:

- Validate request and response shapes for public APIs
- Validate NestJS-to-FastAPI internal JSON contracts
- Validate event payload schemas for BullMQ-based workflows
- Validate AI-service structured JSON outputs at the schema level, not only by visual inspection
- Run contract tests whenever versioned endpoint schemas change

If a consumer depends on a shape, that shape needs a test.

### Negative Test Cases

Every important endpoint must include negative-path tests.

At minimum, cover as relevant:

- invalid request body
- invalid query parameters
- missing required fields
- invalid enum values
- malformed IDs
- unsupported method
- missing auth
- invalid token
- expired token
- forbidden role
- rate-limited request
- missing tenant context in protected paths
- downstream timeout or dependency failure when applicable

Negative tests are not optional; they are where many real production bugs appear.

### Authorization Test Cases

Protected routes must have explicit authorization tests.

Rules:

- Verify allowed roles succeed
- Verify disallowed roles receive `403`
- Verify unauthenticated requests receive `401`
- Verify admin-only endpoints reject non-admin roles
- Verify role checks happen before business action execution

If an endpoint is protected but has no auth test, the review is incomplete.

### Tenant Isolation Test Cases

Tenant isolation must be tested directly, not assumed.

Rules:

- Verify one tenant cannot read another tenant’s records
- Verify one tenant cannot update or delete another tenant’s records
- Verify list endpoints return only records from the authenticated tenant
- Verify background jobs preserve tenant scope
- Verify cache keys and search paths do not leak data across tenants
- Verify Prisma middleware and RLS assumptions with realistic tests

This is one of the most important test areas in the whole platform.

### Rate Limit Test Cases

Rate limiting behavior must be tested as part of platform correctness.

Rules:

- Verify within-limit requests succeed
- Verify over-limit requests return `429`
- Verify headers such as limit, remaining, and reset are present when expected
- Verify tenant-aware limits behave correctly across different tenants
- Verify AI-specific limits and plan-tier limits behave correctly where implemented
- Verify retries or bursts do not bypass counters accidentally

### Async Flow Test Cases

Async flows must be tested end to end, not only at enqueue time.

Rules:

- Verify job enqueue behavior
- Verify idempotency for duplicate events or duplicate webhooks
- Verify retry behavior on transient failure
- Verify DLQ or failure-state handling when retries exhaust
- Verify completion events and persistence side effects
- Verify request ID and tenant context propagation where applicable

For this platform, async testing is critical because much of the value chain runs through BullMQ and worker flows.

## API Review Checklist

### Design Review

Every new or changed endpoint must pass a basic design review.

Check:

- does the endpoint solve a real product use case
- is the path and naming clear
- is the endpoint in the correct module
- is the sync vs async decision sensible
- is the payload shape practical for the consumer
- is pagination, filtering, and sorting handled correctly if relevant

A good design review prevents rework later.

### Security Review

Every API change must pass a security review proportional to its risk.

Check:

- auth requirement clear
- RBAC applied correctly
- tenant scoping enforced
- no client-controlled tenant authority
- sensitive fields minimized
- secrets not exposed
- webhook or internal endpoint protections applied if relevant
- abuse and rate-limit implications considered

### Contract Review

Every endpoint change must pass contract review.

Check:

- request schema defined
- response schema defined
- error schema defined
- enums documented
- examples updated
- backward compatibility assessed
- versioning impact assessed
- frontend and consumer impact understood

### Swagger Review

Swagger/OpenAPI review is mandatory.

Check:

- endpoint documented
- request schema accurate
- response schema accurate
- auth documented
- role requirement documented where possible
- error examples included
- examples realistic
- deprecation markers included if applicable

No undocumented endpoint should be treated as production-ready.

### Tenant Safety Review

Tenant safety review is a separate explicit checkpoint.

Check:

- tenant context source trusted
- no `tenantId` accepted from request body as source of truth
- read queries tenant-scoped
- write queries tenant-scoped
- background jobs preserve tenant scope
- logs and audit events include tenant context safely
- cache keys and search queries remain tenant-safe

### Error Handling Review

Error handling must be reviewed intentionally.

Check:

- standard error envelope used
- no raw dependency errors leaked
- validation errors clear
- rate-limit errors consistent
- timeout and downstream failure behavior defined
- retry behavior sensible for async flows
- user-facing messages safe and useful

### Observability Review

Observability must be part of API review, not a later add-on.

Check:

- request ID propagated
- structured logs added
- metrics emitted
- latency measurable
- errors reported to Sentry
- important async states visible in logs or dashboards
- alert impact considered for critical flows

### Test Coverage Review

Before merge, reviewers must confirm that test coverage is meaningful.

Check:

- unit tests added where logic changed
- integration tests added where API behavior changed
- contract tests updated when schemas changed
- negative tests added
- auth and tenant tests included for protected endpoints
- async tests included where jobs or events are involved
- performance-sensitive changes have load or benchmark follow-up when needed

## Implementation Guardrails

### No Raw Responses

Endpoints must not return raw provider or raw internal service responses directly.

Rules:

- Normalize responses into the platform contract
- Wrap errors in the standard error envelope
- Convert internal AI output into approved API response shapes
- Do not leak raw OpenAI, FastAPI, Prisma, or third-party payloads to consumers

This keeps contracts stable and easier for juniors to consume safely.

### No Cross-Module Prefix Leakage

Endpoints and payloads must respect module ownership boundaries.

Rules:

- Do not expose another module’s internal schema naming casually
- Do not leak raw database table prefixes like `m03_` or internal ownership details into public API contracts unless explicitly intentional
- Keep public APIs product-friendly and ownership-safe
- Cross-module data must come through approved APIs or events, not by exposing internals

### No Tenant ID from Request Body

Protected APIs must never treat request-body `tenantId` as authority.

Rules:

- Derive tenant context from trusted auth or trusted internal headers only
- Ignore or reject client-provided tenant IDs on protected endpoints
- Tests and review must explicitly verify this rule
- Any design that depends on user-supplied tenant identity is incorrect by default

### No Undocumented Endpoints

Every endpoint must be documented before it is considered done.

Rules:

- No hidden routes
- No private “temporary” production endpoint without documentation
- Swagger must be updated before merge
- Internal endpoints must also have documented contracts even if not publicly exposed

### No Direct AI Calls from Product Layer

TypeScript product services must not call AI providers directly.

Rules:

- Product-layer NestJS code must call approved FastAPI AI services
- Provider SDKs must remain inside the AI services boundary
- Direct OpenAI or similar provider calls from product modules are a hard architecture violation
- Reviewers must reject any PR that leaks AI inference into the product layer

This is one of the clearest architectural guardrails in the platform.

### No Breaking Change Without Version Review

Breaking API changes require explicit version review before merge.

Rules:

- Do not change released contracts incompatibly inside the same version without approval
- Assess whether the change is breaking before implementation is finalized
- If breaking, create a new version or follow the approved deprecation path
- Swagger, changelog, and migration guidance must be updated as part of the same change

If there is uncertainty, treat the change as breaking and escalate for review.

## Governance

### Ownership Model

This API standards document is governed as a platform-level engineering reference.

Ownership model:

- **Document Owner:** Tech Lead
- **Contributing Owners:** Backend Lead, AI Lead, Frontend Lead, QA Lead, Security reviewer as applicable
- **Required Readers:** all engineers before production-affecting API work
- **Primary Users:** backend engineers, frontend engineers, AI engineers, QA, Tech Lead

Rules:

- The Tech Lead is the final approver for platform-wide API standards
- Domain leads are responsible for accuracy in their areas
- Engineers must follow this document before creating or changing endpoints
- Feature-level TDDs may add detail, but they must not contradict platform-level standards

### Approval Process

Changes to API standards must go through controlled review.

Process:

1. Update the relevant standards section in a branch
2. Describe what changed, why it changed, and what modules or consumers are affected
3. Link any impacted TDDs, ADRs, and OpenAPI diffs
4. Obtain required reviewer approvals
5. Obtain mandatory Tech Lead approval before merge
6. Update version and revision history in the document
7. Notify the team after merge

Rules:

- No platform-standard change merges without explicit Tech Lead approval
- Consumer-visible contract changes require broader reviewer visibility
- Security-sensitive changes require security review before approval
- Standards changes and implementation changes should stay tightly coordinated

### Exception Handling Process

Exceptions to the standards are allowed only by explicit review, not by convenience.

Rules:

- Exceptions must be documented, time-bound, and justified
- Every exception must name the owner, scope, reason, risk, and expiry or review date
- Temporary exceptions must include the remediation plan
- An undocumented exception is treated as a violation, not as a special case

Recommended exception record fields:

- exception ID
- requested by
- approved by
- affected endpoints or modules
- standard being waived
- business reason
- technical risk
- mitigation
- expiration date
- follow-up task link

### Review Cadence

This standards document must be reviewed on a fixed cadence and also after important changes.

Current cadence aligned to platform governance:

- review every 3 months
- review immediately after any major architecture or platform contract decision
- review immediately after major incident learnings that affect API policy

Rules:

- If the document goes stale, review must be scheduled before major new API work proceeds
- High-risk areas such as auth, tenant isolation, and webhook security should be revisited sooner if incidents or major changes occur
- Review results should be recorded in revision history

### ADR Linkage

Architecturally meaningful API decisions must link back to ADRs.

Rules:

- If a new standard changes platform architecture, service boundary, security posture, or major contract policy, it requires ADR linkage
- ADR references must be included in the change record or PR
- Superseded decisions must point to the replacing ADR
- Draft ADR decisions must not be treated as final policy until approved

Examples of API-related ADR areas:

- versioning strategy
- auth and identity approach
- internal service boundaries
- observability stack
- rate limiting model
- secrets and webhook security model

### Enforcement in PR Review and CI

These standards must be enforced in both human review and automated checks.

PR review enforcement:

- reviewers check module prefix correctness
- reviewers check OpenAPI diff presence
- reviewers check auth, roles, tenant safety, and error envelope usage
- reviewers reject undocumented endpoints
- reviewers reject direct AI-provider calls from the product layer
- reviewers reject breaking changes without version review

CI enforcement should include where applicable:

CI Pipeline Enforcement (Minimum Required):

- `tsc --noEmit` typecheck
- `jest` unit tests with a coverage gate (minimum 80% line coverage)
- `jest` integration tests against Testcontainers
- Zod schema contract test suite (request/response schemas and error envelope shape)
- `eslint` (must include `no-direct-ai-provider-call` rule)
- `prisma validate`
- `swagger-cli validate` (fail if OpenAPI is out of sync)
- Module-boundary lint rule (no cross-prefix imports)

Rules:

- A standard that is not enforceable should still be reviewable in a checklist
- Repeated violations should be converted into stronger CI rules where practical

## Templates

### New Endpoint Template

Use this as the minimum endpoint design template.

```ts
@Controller('/api/v1/<module>')
@UseGuards(JwtAuthGuard, RbacGuard, TenantThrottlerGuard)
export class ExampleController {
  @Post('/<resource>')
  @Roles('AE', 'Manager')
  @ApiOperation({ summary: 'Short endpoint summary' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'INVALID_REQUEST' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 429, description: 'RATE_LIMITED' })
  async createResource(
    @Body(new ZodValidationPipe(CreateSchema)) dto: CreateDto,
    @CurrentUser() user: JwtPayload,
    @RequestId() requestId: string,
  ): Promise<StandardResponse<ResourceDto>> {
    const data = await this.service.create(dto, user, requestId);

    return {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

Template rules:

- use canonical module prefix
- apply auth and RBAC where required
- never take `tenantId` from request body as authority
- document in Swagger before merge
- return the standard response envelope

### Standard Success Response Template

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example resource"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:30:00.000Z"
  }
}
```

Rules:

- `success` must be `true`
- `data` contains the endpoint result
- `meta.requestId` is required
- `meta.timestamp` is required

### Standard Error Response Template

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "received": "bad-email"
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:30:00.000Z"
}
```

Rules:

- `success` must be `false`
- `error.code` must be machine-readable
- `error.message` must be safe and understandable
- `details` is optional but recommended for validation and conflict cases
- never leak raw stack traces or provider payloads

### Async Job Response Template

Initial `202 Accepted` response:

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "queued",
    "pollUrl": "/api/v1/insights/research/uuid",
    "estimatedSeconds": 120
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:30:00.000Z"
  }
}
```

Completed poll response:

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "completed",
    "result": {
      "reportId": "uuid"
    },
    "completedAt": "2026-04-22T09:32:00.000Z"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:32:00.000Z"
  }
}
```

Failed poll response:

```json
{
  "success": false,
  "data": {
    "jobId": "uuid",
    "status": "failed",
    "failedAt": "2026-04-22T09:32:00.000Z"
  },
  "error": {
    "code": "JOB_FAILED",
    "message": "AI Services Layer returned an error during report generation"
  },
  "requestId": "uuid",
  "timestamp": "2026-04-22T09:32:00.000Z"
}
```

### Pagination Response Template

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Record A"
    },
    {
      "id": "uuid-2",
      "name": "Record B"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-22T09:30:00.000Z",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalRecords": 142,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

Standard pagination query parameters:

- `page`
- `pageSize`
- `sortBy`
- `sortOrder`

## Examples

### Simple CRUD Endpoint Example

Example: create a tracker

```http
POST /api/v1/smart-tracking/trackers
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "name": "Pricing objection",
  "description": "Detect when prospects push back on price",
  "isActive": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "trk_123",
    "name": "Pricing objection",
    "description": "Detect when prospects push back on price",
    "isActive": true
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-04-22T09:30:00.000Z"
  }
}
```

### Paginated List Example

Example: list deals

```http
GET /api/v1/deal-management/boards/deals?page=1&pageSize=25&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <access-token>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "deal_001",
      "name": "Acme Renewal",
      "stage": "proposal",
      "ownerId": "user_001"
    },
    {
      "id": "deal_002",
      "name": "Beta Expansion",
      "stage": "discovery",
      "ownerId": "user_002"
    }
  ],
  "meta": {
    "requestId": "req_124",
    "timestamp": "2026-04-22T09:31:00.000Z",
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "totalRecords": 142,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "received": "not-an-email"
      },
      {
        "field": "pageSize",
        "message": "Must be a number between 1 and 100",
        "received": 500
      }
    ]
  },
  "requestId": "req_125",
  "timestamp": "2026-04-22T09:31:30.000Z"
}
```

### Async Job Example

Trigger request:

```http
POST /api/v1/insights/research
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "accountId": "acc_123",
  "question": "Why is this deal slipping?"
}
```

Accepted response:

```json
{
  "success": true,
  "data": {
    "jobId": "job_001",
    "status": "queued",
    "pollUrl": "/api/v1/insights/research/job_001",
    "estimatedSeconds": 120
  },
  "meta": {
    "requestId": "req_126",
    "timestamp": "2026-04-22T09:32:00.000Z"
  }
}
```

### Rate Limited Response Example

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Resets in 47 seconds.",
    "details": {
      "limit": 200,
      "remaining": 0,
      "resetInSeconds": 47,
      "tier": "Growth"
    }
  },
  "requestId": "req_127",
  "timestamp": "2026-04-22T09:32:30.000Z"
}
```

Expected related headers:

```text
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1713245820
X-RateLimit-Tier: Growth
Retry-After: 47
```

### Webhook Endpoint Example

Example: Zoom webhook ingestion

```http
POST /api/v1/ingestion/webhooks/zoom
X-Webhook-Signature: <hmac-signature>
Content-Type: application/json
```

Handler expectations:

- verify HMAC signature before business logic
- reject invalid signatures with `401`
- deduplicate by provider event ID where possible
- enqueue work quickly
- return fast acknowledgement
- avoid long-running processing inside the webhook request

Acknowledgement response:

```json
{
  "success": true,
  "data": {
    "accepted": true,
    "eventId": "evt_001",
    "status": "queued"
  },
  "meta": {
    "requestId": "req_128",
    "timestamp": "2026-04-22T09:33:00.000Z"
  }
}
```

## Glossary

### API Terms

- **API**: Application Programming Interface; the contract through which clients call platform functionality
- **Endpoint**: a method and path combination such as `GET /api/v1/deals`
- **Contract**: the documented request and response shape plus behavior
- **OpenAPI / Swagger**: the formal machine-readable and human-readable API contract documentation
- **Backward compatible**: a change that does not break existing consumers
- **Breaking change**: a change that requires consumer updates to keep working
- **Deprecation**: a supported but discouraged contract element scheduled for replacement or removal
- **Pagination**: splitting large result sets into pages
- **Idempotency**: repeating the same request or event does not create duplicate side effects

### Platform-Specific Terms

- **Tenant**: one customer organization in the multi-tenant platform
- **Tenant Context**: the trusted tenant identity attached to a request after auth
- **Revenue Graph**: the platform’s connected model linking calls, contacts, accounts, deals, and AI outputs
- **Platform Core**: shared cross-cutting layer providing auth, RBAC, tenant interception, validation, logging, and health
- **BullMQ**: internal queue and event backbone for async jobs
- **AI Services Layer**: the FastAPI service that owns AI/ML inference and structured AI outputs
- **Transcription Service**: the separate FastAPI service handling audio processing and transcription
- **Module Prefix**: the canonical API path segment assigned to a module, such as `/api/v1/insights`
- **Standard Envelope**: the required top-level API response wrapper for success and error responses

### Security Terms

- **RBAC**: Role-Based Access Control
- **RLS**: Row-Level Security in PostgreSQL
- **JWT**: JSON Web Token used for authenticated API access
- **Least Privilege**: granting only the minimum access required
- **HMAC**: Hash-based Message Authentication Code used for webhook signature verification
- **PII**: Personally Identifiable Information
- **Replay Attack**: reuse of a valid webhook or request to trigger duplicate processing
- **Tenant Isolation**: controls ensuring one tenant cannot access another tenant’s data
- **Internal Secret**: shared secret used to authenticate NestJS-to-FastAPI internal calls

## Revision History

### Version Log

Use the following table format for future updates.

| Version | Date | Author | Sections Affected | Summary |
|---|---|---|---|---|
| v0.1 | Apr 2026 | Tech Lead | Initial sections | Initial API standards draft created |
| v0.2 | Apr 2026 | Tech Lead | Auth, tenancy, envelopes | Added auth, RBAC, tenant, and response-envelope standards |
| v0.3 | Apr 2026 | Tech Lead | Rate limits, internal APIs, webhooks | Added rate limiting, internal FastAPI contract rules, and webhook standards |
| v0.4 | Apr 2026 | Tech Lead | Contracts, observability, performance, testing | Added contract governance, observability, performance, testing, and review checklists |
| v1.0 | Apr 2026 | Tech Lead | All | First approved API standards baseline |

Rules:

- every document change must add a new version log row before merge
- even small corrections should be recorded
- major policy changes should reference ADRs or linked design decisions where applicable

### Change Summary

For each release or document update, include:

- what changed
- why it changed
- affected modules or consumers
- migration impact if any
- linked ADRs, TDDs, or implementation PRs

Recommended change summary template:

```text
Change:
Reason:
Affected Areas:
Consumer Impact:
Migration Needed:
Linked ADRs:
Linked PRs:
```

### Approved By

Approval record should be explicit.

Recommended approval block:

```text
Document Owner: Tech Lead
Reviewed By: Backend Lead, AI Lead, Frontend Lead, QA Lead
Security Review: Required for security-impacting changes
Approved By: Tech Lead
Approval Date: YYYY-MM-DD
Next Review Date: YYYY-MM-DD
```

Rules:

- approval must be recorded for each major version
- major revisions require renewed approval
- draft versions must not be mistaken for approved platform policy
