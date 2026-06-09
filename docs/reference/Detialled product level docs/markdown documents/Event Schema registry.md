## 1. Purpose and Scope

**Why this section exists**  
This section explains the purpose of the Event Schema Registry, what it covers, and what is intentionally out of scope.

---

## 2. How to Use This Document

**Why this section exists**  
This section helps developers, QA engineers, architects, and reviewers understand how to read, use, and maintain this registry correctly.

---

## 3. Event Architecture Context

**Why this section exists**  
This section connects the Event Schema Registry to the platform’s event-driven architecture, including BullMQ, module boundaries, and asynchronous processing flows already defined in the architecture document.

**Related document**  
- [System Architecture Document](./System_architecture.docx)

---

## 3.1 Schema Registry Implementation Model

**Why this section exists**  
This section establishes the technical backbone that makes the registry enforceable at runtime, not just a documentation artifact. Without concrete schema storage and distribution, contract drift becomes inevitable.

### 3.1.1 Central Contract Package Strategy

The event schema registry must be backed by an executable contracts package that holds the source-of-truth schema definitions.

**Required structure:**

```
/contracts/
  /events/
    /call.transcription.completed/
      v1/
        schema.ts          # Zod schema definition
        index.ts           # Typed exports
        fixtures.ts        # Test payloads
    /crm.fields.extracted/
      v1/
        schema.ts
        index.ts
        fixtures.ts
```

**Key principles:**
- One event folder per official event
- One versioned subfolder per schema version
- All schemas exported as versioned constants (never `latest`)
- Envelopes and payloads defined separately but composed
- Example fixtures included for every version

### 3.1.2 Versioned Schema Exports

Every event must export its schema with an explicit version suffix to prevent ambiguous imports.

**Required pattern:**

```typescript
// contracts/events/call.transcription.completed/v1/schema.ts
import { z } from 'zod';

export const EventEnvelope = z.object({
  eventId: z.string().uuid(),
  eventName: z.literal('call.transcription.completed'),
  eventVersion: z.literal('v1'),
  // ... rest of envelope fields
});

export const PayloadSchema_v1 = z.object({
  callId: z.string().uuid(),
  transcriptId: z.string().uuid(),
  durationSeconds: z.number().gt(0),
  // ... payload fields
});

export const CallTranscriptionCompleted_v1 = EventEnvelope.extend({
  payload: PayloadSchema_v1,
});

export type CallTranscriptionCompleted_v1 = z.infer<typeof CallTranscriptionCompleted_v1>;
```

**Mandatory rule:**  
No event is valid unless backed by a versioned executable schema in the contracts repository.

### 3.1.3 Schema Distribution Mechanism

Consumers and producers must never define divergent schemas. The contracts package must be a first-class dependency imported in all event handling code.

**Distribution strategy:**
- Contracts published as npm package or monorepo dependency
- Versioned independently of service code
- Always pinned to specific version (no floating ranges)
- Imported directly into producer validation and consumer parsing
- No ad-hoc schema duplication in service code

### 3.1.4 Runtime Compatibility Enforcement

At runtime, the system must detect schema mismatches and enforce version compatibility.

**Required checks:**
- Consumer declares supported versions upfront
- Producer publishes explicit schema version in envelope
- Consumer rejects unsupported versions with clear error
- Version mismatch logged with full context
- Dead-letter routing for version conflicts

---

## 3.2 Version Routing Strategy

**Why this section exists**  
Event versioning is only safe when the system has a clear, consistent model for how multiple versions coexist at runtime.

### 3.2.1 Version Routing Model

The platform must choose ONE versioning model globally: **Versioned Queues** (Recommended).

**Versioned Queues Model:**
- Separate queue per version: `call.transcription.completed.v1`, `call.transcription.completed.v2`
- Clean producer responsibility
- Version conflicts are operational, not code-based
- Dead-letter paths are clearer: `call.transcription.completed.v1.dlq`
- Migration periods are explicit

**When transitioning versions:**
1. Create new queue: `event.name.v2`
2. Keep old queue active: `event.name.v1`
3. Producer publishes to `v2` queue
4. Consumers gradually migrate to subscribe to `v2`
5. Deprecate `v1` after migration complete

### 3.2.2 Producer Responsibility During Versioning

- Emit **only one version** at a time (no v1 and v2 mixing)
- Envelope `eventVersion` **must** match queue name
- Deployment required to switch versions
- Version switch is auditable and intentional

### 3.2.3 Consumer Responsibility During Versioning

- Declare which versions supported explicitly
- Subscribe only to supported version queues
- Validate `eventVersion` matches schema
- Reject unsupported versions with tracing

---

## 3.3 Automated Contract Diffing

**Why this section exists**  
Breaking changes in event schemas must be caught automatically before production. Manual review alone is insufficient.

### 3.3.1 What Must Be Detected Automatically

The CI pipeline must reject:
- **Removed fields** — Field in v1 missing in v2
- **Type changes** — Field type changed (string → number)
- **Required field additions** — Field became required that was optional
- **Enum changes** — Valid enum values removed
- **Renamed fields** — Field names changed
- **Nullable changes** — Field became non-nullable when nullable

### 3.3.2 Diffing Implementation

Use one of these approaches:

**Zod-based validation:**
```typescript
function isBackwardCompatible(v1Schema: z.ZodSchema, v2Schema: z.ZodSchema): boolean {
  return v1Fixtures.every(fixture => v2Schema.safeParse(fixture).success);
}
```

**JSON Schema + Spectral rules:**
- Convert schemas to JSON Schema
- Apply Spectral rules to detect breaking changes
- Rules defined in version control

### 3.3.3 CI Enforcement

Every PR affecting schemas must:
1. Run diffing tool comparing old vs new
2. Flag breaking changes for explicit review
3. Require version bump acknowledgment
4. Block merge if breaking without version increment
5. Block merge if version changed without actual breaking changes

---

## 3.4 Consumer-Driven Contracts (CDC)

**Why this section exists**  
Producer-only ownership is incomplete. Consumers have legitimate field expectations that must be visible and protected.

### 3.4.1 Consumer Contract Registration

Each consumer must formally declare which event fields it uses:

```yaml
# M-03 Revenue Graph event contracts
- event: call.transcription.completed
  version: v1
  criticality: high
  fieldsUsed:
    - callId
    - tenantId
    - durationSeconds
    - confidenceScore
  fieldsCanBecomeOptional: []
```

### 3.4.2 Producer Enforcement

Producer CI must verify:
- Never remove fields used by registered consumers
- Never change types of used fields
- Never make critical fields optional
- Generate impact analysis before approval

### 3.4.3 Impact Analysis Report

Auto-generated for each schema change:

```
Event: call.transcription.completed
Change: Add optional 'audioQualityScore'

Affected consumers:
  ✓ M-03 Revenue Graph (not using new field)
  ✓ M-04 Conversation Intelligence (not using new field)

Approval: Auto-approved (backward-compatible)
```

---

## 3.5 Event Size and Throughput Constraints

**Why this section exists**  
Unbounded event payloads cause queue memory pressure and operational incidents. Hard limits prevent runaway design.

### 3.5.1 Event Size Limits (Mandatory)

| Constraint | Limit | Reason |
|---|---|---|
| Max payload size | 256 KB recommended | Fits in BullMQ memory |
| Max payload (absolute ceiling) | 512 KB | Hard operational limit |
| Max nested depth | 3 levels | Simplifies parsing |
| Max array length (default) | 1000 items | Prevents duplication |
| Max string field | 10 KB | Memory safety |

### 3.5.2 Schema-Level Enforcement

Every schema must declare explicit limits:

```typescript
export const PayloadSchema_v1 = z.object({
  callId: z.string().uuid(),
  tags: z.array(z.string()).max(50),
  largeContent: z.string().max(5000),
  metadata: z.record(z.string()).max(20),
});
```

### 3.5.3 Large Data Handling Rule

**Any field larger than 50 KB must be stored separately and referenced, not embedded.**

```typescript
// ❌ Wrong: embedded large transcript
{ transcriptText: "...very long text..." }

// ✓ Correct: reference to storage
{
  transcriptStorageUrl: "s3://bucket/transcript-123.txt",
  transcriptSizeBytes: 45000,
  transcriptHash: "sha256:abc123"
}
```

### 3.5.4 Throughput Monitoring

Document expected event volume:

| Event | Max events/sec | Alert threshold |
|---|---|---|
| `call.transcription.completed` | 100 | Alert if >150/sec |
| `crm.fields.extracted` | 200 | Alert if >300/sec |
| `call.scored` | 100 | Alert if >150/sec |

---

## 4. Event Design Principles

This section defines the core rules that every platform event must follow. These principles ensure that events remain stable, understandable, and safe to use across modules as the system grows.

### 4.1 Events represent facts

An event must describe something that has already happened in the system. Event names must be written in past-tense business form, such as `call.transcription.completed`, `crm.fields.extracted`, or `deal.stage.changed`.

Events must not be used as commands. For example, `generate.summary` or `update.deal.stage` should not be treated as platform events because they describe requested actions rather than completed facts.

### 4.2 Producer ownership

Each event has exactly one owning producer. The producer is responsible for:
- Defining the event name
- Defining and maintaining the schema
- Publishing only valid payloads
- Versioning the contract when breaking changes are introduced

Consumers may read and react to an event, but they do not control the contract of that event.

### 4.3 Stable contracts

Once an event is published and consumed by other modules, its contract is considered stable. Existing fields must not be renamed, removed, or changed in meaning without following the versioning process.

A producer may add new optional fields in a backward-compatible way, but it must not silently introduce breaking schema changes.

### 4.4 Immutability

An emitted event is an immutable historical record. After publication, the payload must never be edited or re-written in place.

If a later correction is required, the system must publish a new event that reflects the corrected state rather than mutating the old event.

### 4.5 Idempotency by design

Every consumer must assume that the same event can be delivered more than once. Event processing must therefore be idempotent.

Idempotent processing means:
- Reprocessing the same event must not create duplicate records
- Reprocessing the same event must not trigger duplicate side effects
- Consumers should use `eventId` and business keys to detect duplicates where needed

### 4.6 Loose coupling

Modules must communicate through published events or approved APIs, not by directly depending on each other’s internal implementation.

An event consumer must rely only on documented fields in the event schema. It must not assume hidden behavior, undocumented fields, or internal producer logic.

### 4.7 Tenant-safe design

Every event must preserve tenant boundaries. Event payloads must carry the correct tenant context so consumers can process the event safely without crossing tenant data boundaries.

No event design is valid if it makes tenant ownership ambiguous.

### 4.8 Observable and operable

Every event must be traceable in production. Events must support logging, retries, dead-letter handling, and debugging through consistent metadata and queue naming conventions.

If an event cannot be monitored or replayed safely, its design is incomplete.

---

## 5. Standard Event Envelope

Every platform event must include a standard envelope. The envelope carries metadata that is common across all event types and allows the platform to validate, route, trace, retry, and monitor events consistently.

The envelope is separate from the business payload. The envelope fields are mandatory unless explicitly marked otherwise.

### 5.1 Required envelope fields

| Field | Type | Required | Description |
|---|---|---|---|
| `eventId` | UUID | Yes | Globally unique identifier for this event instance |
| `eventName` | string | Yes | Official event name, for example `call.transcription.completed` |
| `eventVersion` | string | Yes | Schema version of the event, for example `v1` |
| `schemaId` | string | Yes | Unique schema identifier, e.g., `call.transcription.completed@v1` |
| `schemaHash` | string | No | SHA256 hash of schema definition for drift detection |
| `tenantId` | UUID | Yes | Tenant context for safe multi-tenant processing |
| `producer` | string | Yes | Owning module or service that emitted the event |
| `source` | object | No | Source context with service and instanceId for traceability |
| `occurredAt` | ISO 8601 timestamp | Yes | Time at which the business event occurred |
| `publishedAt` | ISO 8601 timestamp | Yes | Time at which the event was published to the queue |
| `correlationId` | UUID or string | No | Identifier used to trace related work across modules |
| `causationId` | UUID or string | No | Identifier of the parent event or request that caused this event |
| `traceId` | UUID or string | No | Distributed tracing identifier (OpenTelemetry compatible) |
| `spanId` | UUID or string | No | Current span identifier (OpenTelemetry compatible) |
| `parentSpanId` | UUID or string | No | Parent span identifier (OpenTelemetry compatible) |
| `partitionKey` | string | No | Partition key for ordered processing (tenantId or callId recommended) |
| `priority` | string enum | No | Processing priority such as `high`, `normal`, or `low` |
| `payload` | object | Yes | Business-specific event payload |

### 5.2 Envelope rules

The following rules apply to the standard event envelope:
- `eventId` must be unique for every published event instance
- `eventName` must exactly match the registry entry
- `eventVersion` must map to a documented schema version
- `schemaId` must be in format `eventName@version` (e.g., `call.transcription.completed@v1`)
- `schemaHash` should match the current schema definition; mismatch indicates potential drift
- `tenantId` must always be present for tenant-scoped events
- `source` object must include `service` name and `instanceId` (e.g., pod ID, container ID) for instance-level traceability
- `occurredAt` records business time, while `publishedAt` records queue publication time
- `partitionKey` should be used to enforce ordered delivery (typically `tenantId` or entity identifier like `callId`)
- `spanId` and `parentSpanId` must align with active OpenTelemetry trace context
- `payload` must contain only the business data specific to that event

### 5.3 Envelope example

```json
{
  "eventId": "0b6c3c3c-5d7a-4df6-9d0f-12ab34cd56ef",
  "eventName": "call.transcription.completed",
  "eventVersion": "v1",
  "schemaId": "call.transcription.completed@v1",
  "schemaHash": "sha256:abc123def456...",
  "tenantId": "8de12ab3-4456-4c88-9f01-98ab76cd54ef",
  "producer": "M-01 Data Ingestion",
  "source": {
    "service": "transcription-worker",
    "instanceId": "pod-xyz-123"
  },
  "occurredAt": "2026-04-23T08:30:15Z",
  "publishedAt": "2026-04-23T08:30:19Z",
  "correlationId": "req-12345",
  "causationId": "evt-67890",
  "traceId": "trace-67890",
  "spanId": "span-abc123",
  "parentSpanId": "span-parent456",
  "partitionKey": "8de12ab3-4456-4c88-9f01-98ab76cd54ef",
  "priority": "high",
  "payload": {
    "callId": "11111111-2222-3333-4444-555555555555",
    "transcriptId": "66666666-7777-8888-9999-aaaaaaaaaaaa",
    "durationSeconds": 1842,
    "languageDetected": "en",
    "confidenceScore": 0.94
  }
}
```

### 5.4 Why the envelope matters

A standard envelope keeps all events consistent even when their business payloads differ. It helps:
- Consumers validate events in a predictable way
- Observability tools trace failures across modules
- Retry and DLQ systems work consistently
- Future service extraction happen without changing core event semantics

### 5.5 Source vs Producer Clarity

**Producer** is the logical module or service that owns the event contract and is responsible for its schema.

**Source** is the specific runtime instance (service, pod, container) that actually emitted the event.

This distinction enables instance-level traceability:

```json
{
  "producer": "M-01 Data Ingestion",  // Logical owner of contract
  "source": {
    "service": "transcription-worker",  // Runtime service name
    "instanceId": "pod-xyz-123"         // Specific instance ID
  }
}
```

This allows:
- Debugging which specific instance had issues
- Horizontal scaling with clear instance attribution
- Load balancing analysis
- Instance-specific metrics and alerts

---

## 6. Payload Schema Conventions

This section defines how business payload fields must be designed inside the `payload` object of each event.

### 6.1 Naming style

All payload fields must use a single naming convention. The recommended convention for event payloads is `camelCase`.

Examples:
- `callId`
- `transcriptId`
- `languageDetected`
- `confidenceScore`

Do not mix `snake_case`, `camelCase`, and `PascalCase` in the same registry.

### 6.2 Required vs optional fields

Each field must be explicitly marked as either:
- Required, meaning it must always be present
- Optional, meaning it may be omitted in valid cases

Optional fields must not be used to hide required business meaning. If a consumer always needs a field to process the event safely, that field must be required.

### 6.3 Nullability rules

A field being optional is different from a field being nullable.

Use these rules:
- Optional means the field may be absent
- Nullable means the field is present but may have the value `null`

Use `null` only when the field is known but intentionally has no value. Do not use `null` and omission interchangeably.

Examples:
- `dealId?: string` means deal context may not be available
- `calendarEventId: null` means the field exists but no linked calendar event was found

### 6.4 Type conventions

Use strongly defined field types wherever possible.

Recommended types:
- UUID for entity identifiers such as `eventId`, `tenantId`, `callId`, `dealId`
- ISO 8601 timestamp for date-time fields such as `occurredAt`, `publishedAt`, `linkedAt`
- Integer for counts such as `speakerCount`
- Number for measured values such as `durationSeconds` or `confidenceScore`
- Boolean for true/false state fields
- Enum for restricted values such as platform names, statuses, or priority levels
- Array for repeated values such as `contactIds` or `participantList`
- Object for nested structured data only when a flat model is not practical

### 6.5 Enum usage

Where a field has a limited allowed set of values, define it as an enum in the schema.

Examples:
- `sourcePlatform`: `zoom | teams | meet | dialer`
- `priority`: `high | normal | low`
- `providerUsed`: `whisper | assemblyai`

Enums must be documented clearly in the registry to avoid hidden assumptions across producers and consumers.

### 6.6 Confidence scores

Events that carry AI-generated outputs should include confidence information where relevant.

Confidence fields should follow these conventions:
- Use the name `confidenceScore`
- Use a numeric value between `0.0` and `1.0`
- Document the interpretation threshold in the event definition
- If low-confidence outputs require review, include a boolean field such as `flaggedForReview`

### 6.7 Collections and nested objects

Arrays should be used only when the event naturally contains repeated items. Each array item must have a clearly defined structure.

Nested objects are allowed when they group closely related values, but deeply nested payloads should be avoided unless they meaningfully improve clarity.

Prefer simple payloads that are easy to validate, inspect, and replay.

### 6.8 Field descriptions must be explicit

Every payload field in the registry must document:
- Field name
- Type
- Required or optional status
- Nullable or not nullable
- Description
- Example value, where helpful

No payload field should exist without a documented meaning.

### 6.9 Backward compatibility rules

Payload schemas must evolve safely.

Allowed without version bump:
- Adding a new optional field
- Clarifying documentation
- Tightening internal producer validation without changing payload shape

Requires version bump:
- Renaming a field
- Removing a field
- Changing field type
- Changing field meaning
- Making an optional field required

### 6.10 Validation expectation

Every payload must be validated before publish and before consume using the approved runtime schema validation approach.

A producer must never publish malformed payloads. A consumer must never trust an incoming payload without validation.

### 6.11 Payload design goal

Payloads should be:
- Small enough to move safely through the queue
- Rich enough to support all valid consumers
- Explicit enough for freshers to understand
- Stable enough to survive future module extraction


## 7. Event Classification

This section groups platform events into clear categories so engineers can understand the role of each event at a glance. Event classification improves readability, reduces confusion during implementation, and helps future modules reuse the same event design approach.

### 7.1 Domain events

Domain events describe meaningful business facts that happened inside the platform. These events represent business state changes that other modules care about.

Examples:
- `call.transcription.completed`
- `deal.stage.changed`
- `forecast.submitted`
- `call.summary.generated`
- `research.report.completed`

Use a domain event when:
- A business state has changed
- Other modules need to react to that change
- The event has lasting business meaning beyond one workflow step

### 7.2 Workflow events

Workflow events represent progress inside a multi-step internal processing flow. These events are commonly used to trigger downstream automation, asynchronous jobs, and coordinated post-processing.

Examples:
- `crm.fields.extracted`
- `call.topics.tagged`
- `tracker.detection.created`

Use a workflow event when:
- One completed processing step should trigger the next step
- The event is part of an internal asynchronous pipeline
- The event helps break long-running work into smaller reliable stages

### 7.3 Integration events

Integration events represent interactions with external systems or synchronization boundaries. These events usually reflect something that must be recorded, propagated, or synchronized across product and external platforms.

Examples:
- `email.sent`
- `deal.stage.changed` when used to propagate CRM-aligned state
- `crm.fields.extracted` when resulting data is pushed into the connected CRM

Use an integration event when:
- External systems must be updated or informed
- The platform needs a durable record of external-facing activity
- A module translates internal state into externally meaningful updates

### 7.4 System events

System events are operational or platform-level events used for infrastructure, monitoring, replay, maintenance, or internal lifecycle management. These are not primary business events, but they are useful for operability and reliability.

Examples may include:
- Queue failure events
- Replay or reprocessing events
- Dead-letter events
- Maintenance or audit-triggered internal events

Use a system event when:
- The event exists mainly for platform operation and reliability
- The event supports monitoring, recovery, or diagnostics
- The event does not represent a customer-facing business fact

### 7.5 Classification rules

**Each event MUST have exactly ONE primary classification.**

Ambiguity about whether an event is "Domain / Workflow" or "Domain / Integration" indicates a design smell. If an event serves multiple purposes, one of these is true:
- The event is overloaded and should be split into two distinct events
- The classification hierarchy is unclear and needs rethinking
- The event is in the wrong domain

**Rule: No dual classifications.**

If an event seems to fit two categories equally, the design should be reviewed before approval. Choose the primary reason the event exists and classify it accordingly.

**Example resolution:**
- ❌ `crm.fields.extracted` classified as both "Workflow / Integration" 
- ✓ Reclassify as "Workflow" (primary purpose: trigger internal enrichment)
- ✓ Or reclassify as "Integration" (primary purpose: sync CRM data)
- Document why one was chosen

### 7.6 Event Granularity Rule

One event = one atomic business fact. Not multiple unrelated updates.

Events must represent a single, cohesive business change, not an aggregation of multiple unrelated state changes.

**Good examples:**
- `call.transcription.completed` — Transcription of one call is done
- `deal.stage.changed` — A deal moved to a new stage
- `crm.fields.extracted` — Fields were extracted from one call

**Bad examples (too fat):**
- `call.processing.complete` containing transcription, summary, topics, and scores
  - Split into: `call.transcription.completed`, `call.summary.generated`, `call.topics.tagged`, `call.scored`
- `batch.operations.complete` containing multiple unrelated batches
  - Split into individual `*.completed` events

**Bad examples (too chatty):**
- `field.extracted` for every single field
  - Use: `call.fields.extracted` with array of fields extracted

### 7.7 Event Choreography vs Orchestration Rule

The platform must be clear about which event flows use event choreography (decentralized) vs orchestration (centralized workflow engine).

**Event Choreography:** Events trigger next steps independently
- No central orchestrator
- Each consumer independently publishes events for next steps
- Examples: `call.transcription.completed` → M-04 immediately starts scoring

**Orchestration:** Central workflow engine controls flow
- Single point of coordination
- Events notify orchestrator of status
- Orchestrator decides next step
- Example: Forecasting workflow engine orchestrates multiple sub-steps

**Rule:** Clearly document which model applies for each multi-event flow. Do not create hidden orchestrations disguised as choreography.

Flows should be documented in architecture or module boundary documents. Design reviews must confirm orchestration vs choreography intent is explicit.

---

## 8. Registry Summary Table

This section provides the master quick-reference table for all approved platform events. It allows engineers, QA, and reviewers to see the official event landscape in one place without opening every detailed schema section.

Only events listed in this section are considered approved platform contracts. If an event is not listed here, it must not be emitted or consumed as an official platform event.

### 8.1 Master registry

| Event Name | Classification | Producer | Consumers | Priority | Retry Policy | Backoff | DLQ |
|---|---|---|---|---|---|---|---|
| `call.transcription.completed` | Workflow | M-01 Data Ingestion | M-02, M-03, M-04, M-05, M-06 | High | 3 retries | Exponential: 30s, 60s, 120s | `call.transcription.completed.dlq` |
| `crm.fields.extracted` | Workflow | M-01 Data Ingestion | M-03 Revenue Graph | Normal | 3 retries | Exponential: 30s, 60s, 120s | `crm.fields.extracted.dlq` |
| `email.sent` | Integration | M-02 Sales Engagement | M-03, M-05, M-07 | Normal | 3 retries | Exponential: 30s, 60s, 120s | `email.sent.dlq` |
| `revenue_graph.entity.linked` | Domain | M-03 Revenue Graph | M-04, M-05 | High | 3 retries | Exponential: 30s, 60s, 120s | `revenue_graph.entity.linked.dlq` |
| `deal.stage.changed` | Integration | M-03 Revenue Graph | M-07, M-08, M-09 | High | 2 retries | Fixed: 30s, 30s | `deal.stage.changed.dlq` |
| `call.topics.tagged` | Workflow | M-04 Conversation Intelligence | M-05, M-06 | Normal | 3 retries | Exponential: 60s | `call.topics.tagged.dlq` |
| `call.scored` | Domain | M-04 Conversation Intelligence | M-10 Performance Coaching | Normal | 3 retries | Exponential: 60s | `call.scored.dlq` |
| `tracker.detection.created` | Domain | M-05 Smart Tracking | M-06, M-08 | High | 3 retries | Exponential: 30s, 60s, 120s | `tracker.detection.created.dlq` |
| `call.summary.generated` | Domain | M-06 Insight Generation | M-03, M-07, M-08, M-10 | Normal | 2 retries | Fixed: 30s, 30s | `call.summary.generated.dlq` |
| `research.report.completed` | Domain | M-06 Insight Generation | Frontend | Normal | 2 retries | Fixed: 30s, 30s | `research.report.completed.dlq` |
| `forecast.submitted` | Domain | M-09 Forecasting | M-10 Performance Coaching | Low | 2 retries | Fixed: 30s, 30s | `forecast.submitted.dlq` |

### 8.2 Registry table rules

The summary table must be kept short and scannable. It is not intended to replace the full schema definitions.

Each row in this table must include:
- Official event name
- Primary classification
- Single owning producer
- Approved consumers
- Priority level
- Retry policy
- Backoff strategy
- Dead-letter queue name

### 8.3 Update policy

Whenever a new event is introduced, modified, deprecated, or retired, this summary table must be updated before implementation is considered complete.

This table is the fastest way to verify whether an event officially exists in the platform.

---

## 9. Detailed Event Schemas

This section provides the full contract for each approved event. Each event must have its own subsection so that producers, consumers, QA engineers, and reviewers can understand exactly how the event should behave.

Every detailed event schema must follow the same template. This keeps the registry readable and makes implementation safer.

### 9.1 Detailed schema template

Each event subsection must contain the following information:

- Event name
- Classification
- Business meaning
- Producer
- Consumers
- Trigger point
- Queue name
- Priority
- Retry policy
- Backoff policy
- Dead-letter queue
- Version
- Standard envelope requirements
- Payload field definitions
- Validation rules
- Idempotency rules
- Consumer actions
- Failure handling notes
- Example payload
- Backward compatibility notes
- Related modules and flows

### 9.2 Event subsection structure

Use the following repeatable structure for every event:

#### 9.x `event.name`

**Classification**  
Primary event category.

**Business meaning**  
What business fact or workflow completion this event represents.

**Producer**  
The module or service that owns and emits the event.

**Consumers**  
The modules or services allowed to consume the event.

**Trigger point**  
The exact moment in the workflow when the event must be published.

**Queue name**  
The BullMQ queue name used for this event.

**Priority**  
The processing priority of the event.

**Retry policy**  
Number of retries allowed before dead-letter routing.

**Backoff policy**  
Whether retry delay is fixed or exponential, including interval values.

**DLQ**  
Dead-letter queue name.

**Version**  
Current schema version, such as `v1`.

**Required envelope fields**  
Reference to the standard event envelope fields that must wrap the payload.

**Payload fields**  
A field-by-field table documenting the business payload.

**Validation rules**  
Rules that must pass before publish and before consume.

**Idempotency rules**  
How duplicate delivery is handled safely.

**Consumer actions**  
Expected downstream behavior by each consumer.

**Failure handling**  
What happens if processing fails, retries are exhausted, or payload validation fails.

**Example payload**  
A valid sample payload for implementation and testing.

**Compatibility notes**  
Versioning notes, deprecation notes, or schema evolution guidance.

**Related flows**  
Architecture flows or modules where this event is used.

### 9.3 Payload field table format

Use this standard table format for payload fields:

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| `fieldName` | `type` | Yes/No | Yes/No | Meaning of the field | Sample value |

This table must be complete for every event. No field should appear in a real payload without being documented here.

### 9.4 Recommended event order

The detailed schemas should be documented in the following order:

1. `call.transcription.completed`
2. `crm.fields.extracted`
3. `email.sent`
4. `revenue_graph.entity.linked`
5. `deal.stage.changed`
6. `call.topics.tagged`
7. `call.scored`
8. `tracker.detection.created`
9. `call.summary.generated`
10. `research.report.completed`
11. `forecast.submitted`

This order follows the current platform architecture and keeps upstream foundational events before downstream dependent events.

### 9.5 Example subsection shell

Use the following shell for each event:

#### 9.1 `call.transcription.completed`

**Classification**  
Domain / Workflow

**Business meaning**  
Indicates that a call has been successfully transcribed and is now available for downstream processing.

**Producer**  
M-01 Data Ingestion

**Consumers**  
M-02 Sales Engagement, M-03 Revenue Graph, M-04 Conversation Intelligence, M-05 Smart Tracking, M-06 Insight Generation

**Trigger point**  
Published after transcript storage is completed and the call status is marked complete.

**Queue name**  
`call.transcription.completed`

**Priority**  
High

**Retry policy**  
3 retries

**Backoff policy**  
Exponential: 30s, 60s, 120s

**DLQ**  
`call.transcription.completed.dlq`

**Version**  
`v1`

**Payload fields**

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| `callId` | UUID | Yes | No | Unique identifier of the call | `11111111-2222-3333-4444-555555555555` |
| `transcriptId` | UUID | Yes | No | Unique identifier of the transcript | `66666666-7777-8888-9999-aaaaaaaaaaaa` |
| `tenantId` | UUID | Yes | No | Tenant that owns the call | `8de12ab3-4456-4c88-9f01-98ab76cd54ef` |
| `durationSeconds` | number | Yes | No | Call duration in seconds | `1842` |
| `speakerCount` | number | Yes | No | Number of identified speakers | `3` |
| `languageDetected` | string | Yes | No | Detected transcript language | `en` |
| `confidenceScore` | number | Yes | No | Confidence score of transcription quality | `0.94` |

**Validation rules**  
- `callId`, `transcriptId`, and `tenantId` must be valid UUIDs  
- `durationSeconds` must be greater than 0  
- `confidenceScore` must be between `0.0` and `1.0`

**Idempotency rules**  
Consumers must safely ignore duplicate deliveries using `eventId` and business-level duplicate checks where required.

**Consumer actions**  
- M-02 may generate follow-up actions  
- M-03 links call data into the revenue graph  
- M-04 starts scoring and topic analysis  
- M-05 starts tracker detection  
- M-06 starts summary generation

**Failure handling**  
If downstream processing fails, retries must follow queue policy. After retry exhaustion, the event must move to the configured DLQ.

**Example payload**

```json
{
  "eventId": "0b6c3c3c-5d7a-4df6-9d0f-12ab34cd56ef",
  "eventName": "call.transcription.completed",
  "eventVersion": "v1",
  "tenantId": "8de12ab3-4456-4c88-9f01-98ab76cd54ef",
  "producer": "M-01 Data Ingestion",
  "occurredAt": "2026-04-23T08:30:15Z",
  "publishedAt": "2026-04-23T08:30:19Z",
  "payload": {
    "callId": "11111111-2222-3333-4444-555555555555",
    "transcriptId": "66666666-7777-8888-9999-aaaaaaaaaaaa",
    "durationSeconds": 1842,
    "speakerCount": 3,
    "languageDetected": "en",
    "confidenceScore": 0.94
  }
}
```

### 9.6 Authoring rule

Every official event in the summary table must have a corresponding detailed schema subsection in this section.

No event is considered fully documented until:
- Its summary row exists
- Its detailed schema exists
- Its payload fields are fully defined
- Its retry and idempotency behavior are documented
- A valid example payload is included

## 10. Producer and Consumer Responsibilities

This section defines the responsibilities of event producers and event consumers. Clear ownership is required so that event-driven communication remains reliable, testable, and easy to evolve across modules.

### 10.1 Producer responsibilities

The producer owns the event contract. A producer is the only module or service allowed to define the business meaning, payload shape, and versioning rules for the event it emits.

Every producer must:
- Publish events only after the underlying business state change has been committed successfully
- Emit only registered events that exist in this document
- Validate the event envelope and payload before publishing
- Include all required metadata such as `eventId`, `eventName`, `eventVersion`, `tenantId`, and timestamps
- Use the officially approved queue name, retry policy, priority, and DLQ configuration
- Keep the event contract backward compatible unless a version change is explicitly introduced
- Document any new optional field before emitting it in production
- Ensure tenant context is always present and correct
- Ensure emitted data is safe to share with approved consumers

A producer must not:
- Publish malformed or partially complete payloads
- Rename or remove fields without following versioning rules
- Emit undocumented fields and expect consumers to understand them
- Depend on a consumer’s internal implementation details
- Assume consumers will process the event immediately

### 10.2 Consumer responsibilities

A consumer reacts to an event but does not own the event contract. The consumer must treat every incoming event as an external contract, even if both producer and consumer currently live in the same modular monolith.

Every consumer must:
- Validate the event envelope and payload before processing
- Process events idempotently so duplicate delivery does not create duplicate side effects
- Ignore undocumented fields unless explicitly adopted through the registry
- Fail safely when validation or downstream processing fails
- Respect tenant boundaries in every read and write
- Log failures with enough context for tracing and replay
- Handle out-of-order and repeated delivery where applicable
- Follow the event retry and DLQ strategy defined for that queue

A consumer must not:
- Assume exactly-once delivery
- Assume that another consumer has already processed the same event
- Depend on event arrival ordering unless explicitly guaranteed
- Mutate the event contract locally
- Query another module’s private tables as a shortcut around the event contract

### 10.3 Shared responsibilities

Producers and consumers share responsibility for keeping the platform event-driven and loosely coupled.

Both sides must:
- Use only approved queue names and schema versions
- Keep implementation aligned with the registry
- Add tests when contracts are introduced or changed
- Update this document before or along with implementation
- Raise a review when a new cross-module dependency appears

### 10.4 Publish-after-commit rule

A producer must publish an event only after the source-of-truth state change has been persisted successfully. This prevents consumers from acting on state that does not actually exist.

For example:
- `call.transcription.completed` should be emitted only after transcript storage is complete
- `deal.stage.changed` should be emitted only after the deal stage change is durably recorded
- `call.summary.generated` should be emitted only after the summary is stored successfully

### 10.5 Consumer-side idempotency expectations

Consumers must implement duplicate protection using one or more of the following:
- `eventId` tracking
- Unique constraints on business keys
- Safe upsert behavior
- Existence checks before creating derived records
- Idempotency keys for downstream workflows

This is mandatory because BullMQ retries and duplicate delivery are expected behaviors in the platform.

---

## 11. Validation and Contract Enforcement

This section defines how event contracts are validated and enforced in code, in CI, and during review. The goal is to ensure that event payloads are always trustworthy and that schema drift is caught early.

### 11.1 Runtime validation

All event payloads must be validated at runtime before publish and before consume.

Validation must cover:
- Standard event envelope fields
- Event-specific payload fields
- Required versus optional field presence
- Type checks
- Enum checks
- Nullability rules
- Range checks such as `confidenceScore` between `0.0` and `1.0`

No producer may publish an event without schema validation. No consumer may trust a payload that has not passed validation.

### 11.2 Schema definition standard

Event contracts should be defined using the approved schema-validation approach used by the platform. For TypeScript product services, Zod is the standard runtime validation tool.

Each event should have:
- A Zod schema for the envelope
- A Zod schema for the payload
- A typed contract exported from a shared contracts location
- Example fixtures for testing where useful

### 11.3 Validation points

Validation must happen at these points:
1. Before the producer publishes the event
2. Immediately when the consumer receives the event
3. In automated tests that verify valid and invalid payload examples
4. In CI checks that ensure contract definitions remain valid

Validation at only one point is not enough. Producer validation protects outgoing quality. Consumer validation protects the boundary.

### 11.4 CI and PR enforcement

Contract enforcement must be part of the standard CI pipeline.

At minimum, CI should include:
- TypeScript type checks
- Unit and integration tests
- Zod schema validation checks
- Prisma schema validation where applicable
- Module boundary checks
- No cross-module import checks
- Required registry/document review for new event contracts

A pull request that introduces or changes an event contract must not merge unless:
- The schema definition exists
- The event is registered in this document
- Tests are added or updated
- Review confirms backward compatibility or approved version bump

### 11.5 Review expectations

Every event contract change must be reviewed with the same seriousness as an API contract change.

Reviewers must verify:
- The event name follows naming rules
- The producer is the correct owner
- The payload contains only necessary fields
- Field meanings are clearly documented
- The event is tenant-safe
- Retry and DLQ behavior are documented
- Idempotency handling is clear
- Schema evolution risk is understood

### 11.6 Validation failure behavior

If producer-side validation fails:
- The event must not be published
- The producer must log the failure with context
- The business flow should return or handle the error according to module rules

If consumer-side validation fails:
- The consumer must reject the payload
- The failure must be logged with traceable metadata
- Retry behavior depends on whether the failure is transient or permanent
- Clearly malformed events should be routed to DLQ or failure handling paths according to queue policy

### 11.7 Registry as enforcement source

This document is not only reference material. It is the human-readable source of truth for contract review.

Code, tests, queue configuration, and CI checks must align with this registry. If code and registry disagree, the mismatch must be treated as a contract issue.

---

## 12. Versioning and Change Management

This section defines how event schemas evolve over time without breaking existing consumers. Event contracts are long-lived integration boundaries and must be changed with discipline.

### 12.1 Versioning principles

Every official event must have an explicit schema version. The version should be included in the event envelope using a field such as `eventVersion`.

Versioning exists to:
- Protect consumers from silent breaking changes
- Allow producers to evolve safely
- Support staged migrations across modules
- Enable future service extraction without contract confusion

### 12.2 What counts as a breaking change

The following changes are breaking and require a new event version:
- Renaming a field
- Removing a field
- Changing a field type
- Changing a field’s meaning
- Changing an enum in a way that breaks existing consumers
- Making an optional field required
- Changing nested object shape in a non-backward-compatible way

### 12.3 What is backward compatible

The following changes are usually backward compatible and may remain in the same version if documented and reviewed:
- Adding a new optional field
- Clarifying descriptions or examples
- Tightening producer-side validation without changing payload shape
- Adding new enum values only when all consumers can safely ignore unknown values

Even backward-compatible changes must still be documented in this registry.

### 12.4 Version naming

Use simple explicit version naming such as:
- `v1`
- `v2`
- `v3`

Do not use ambiguous contract identifiers such as `latest` or undocumented timestamp-based schema names.

### 12.5 Change rollout strategy

When a breaking schema change is needed:
1. Define the new version in this registry
2. Add the new schema in code
3. Keep the old version active during the migration period
4. Update consumers to support the new version
5. Deprecate the old version with a documented removal plan
6. Remove the old version only after all approved consumers have migrated

### 12.6 Producer obligations during migration

During version migration, the producer must:
- Clearly document which version is active
- Publish the correct version consistently
- Avoid mixing undocumented payload shapes under the same version
- Support agreed overlap periods where both versions must exist

### 12.7 Consumer obligations during migration

During version migration, consumers must:
- Explicitly declare which versions they support
- Reject unsupported versions safely
- Avoid relying on undocumented fields during transition
- Complete migration before the deprecation deadline

### 12.8 Deprecation policy

When an event version is deprecated, the registry must capture:
- Deprecated version
- Replacement version
- Deprecation date
- Planned removal date
- Migration notes

Deprecated contracts should remain readable in the document until fully retired.

### 12.9 Change log expectation

Each schema change should be traceable. This registry should maintain lightweight change notes so reviewers can understand what changed, when, and why.

For each material contract change, record:
- Date
- Event name
- Version affected
- Summary of change
- Approval or review reference

---

## 14. Idempotency, Deduplication, and Safe Reprocessing

This section consolidates all idempotency-related requirements into one comprehensive standard. Idempotency is non-negotiable: all consumers must be idempotent.

### 14.1 Idempotency Requirement

All consumers must assume **at-least-once delivery**. The same event may arrive multiple times due to retries, worker restarts, and upstream retries. Event processing must be **idempotent**.

Idempotent processing means:
- Processing the same event twice produces the same final state as processing once
- Duplicate delivery must not create duplicate records, alerts, or side effects
- Safe reprocessing is possible after transient failures

This is a **mandatory platform rule**, not an optimization.

### 14.2 Idempotency Storage Strategy

Idempotency keys must be stored persistently to detect and reject duplicates. The storage strategy must be:
- **Per-consumer decision:** Each consumer chooses its deduplication mechanism
- **Persistent:** Survives process restarts
- **Queryable:** Can quickly check if an event was already processed

**Recommended storage options:**

**Option A: Event ID Tracking Table**
```sql
CREATE TABLE processed_events (
  consumerId VARCHAR,
  eventId UUID,
  processedAt TIMESTAMP,
  PRIMARY KEY (consumerId, eventId)
);
```
- Simple to implement
- Requires cleanup (TTL purging)
- Works for all consumers

**Option B: Unique Constraints on Business Keys**
```sql
CREATE TABLE call_processing (
  callId UUID,
  transcriptId UUID,
  status VARCHAR,
  UNIQUE(callId, transcriptId)  -- Business key prevents duplicates
);
```
- No separate tracking table needed
- Leverages database constraints
- Works when business keys are unique

**Option C: Idempotency Keys in Workflow Systems**
- If using workflow engine (e.g., Temporal), use native idempotency keys
- Keyed by (workflowId, activityId, attemptId)
- Built-in dedup by engine

**Option D: Cache-based (Redis)**
- Store processed eventIds in Redis with TTL
- Fast lookups
- Requires cache to be available (risk of duplicates on cache failure)
- Suitable for high-throughput, non-critical operations

### 14.3 Idempotency TTL (Time-To-Live)

Events must remain deduplicable for a reasonable window to handle replays and late arrivals.

**Mandatory TTL Policy:**

- **Minimum:** 7 days (allows normal retry/replay scenarios)
- **Recommended:** 30 days (covers outage recovery)
- **Maximum:** 90 days (prevents unbounded storage)

**TTL enforcement:**
```
processedEventRecord.expiresAt = eventPublishedAt + 30 days
```

**Rationale:**
- Events older than TTL window are assumed unlikely to arrive
- Long TTLs catch truly late replays (infrastructure issues, stalled workers)
- Short TTLs save storage but risk duplicate acceptance
- Business logic should determine appropriate value per event type

**Storage cleanup:**
```sql
DELETE FROM processed_events
WHERE processedAt < NOW() - INTERVAL '30 days';
```

### 14.4 Delivery Guarantee Model

Platform events operate under **at-least-once delivery**. Consumers must never assume exactly-once delivery.

This means:
- Same event may be delivered more than once ✓
- Events may arrive out of order ✓
- Event may be delayed significantly ✓
- Each delivery is independent retry attempt ✓

### 14.5 Deduplication Strategies

Consumers may use one or more of these deduplication strategies:

**Strategy A: Event ID Tracking**
- Check if eventId exists in processed_events table
- If exists, skip processing
- If not exists, process and insert

**Strategy B: Business Key Uniqueness**
- Use unique constraints on business entities
- Attempt insert/upsert
- Database rejects/ignores duplicate
- Idempotent by default

**Strategy C: Existence Check Before Create**
```typescript
const existing = await db.calls.findOne({ callId: event.payload.callId });
if (existing) return; // Already processed
await db.calls.create(event.payload);
```

**Strategy D: Safe Upsert Operations**
```typescript
await db.deals.upsert(
  { dealId: event.payload.dealId },
  { ...event.payload },  // Update or insert
);
```

**Strategy E: State Recomputation**
- Instead of incrementally mutating, recompute entire state from source truth
- If reprocessed, computed state is identical
- Example: deal score recalculated from current state rather than incrementally updated

### 14.6 Recommended Deduplication Patterns

**For create-once records:**
```typescript
const duplicate = await db.existenceCheck(businessKey);
if (duplicate) return; // Idempotent: skip
await db.insert({ ...event.payload });
```

**For upsert operations:**
```typescript
await db.upsert(
  { id: event.payload.id },
  { ...event.payload },
);
// Idempotent: second execution overwrites with same data
```

**For derived calculations:**
```typescript
// Recalculate from source rather than incrementally update
const score = calculateScore(callId);
await db.scores.upsert({ callId }, { score });
// Idempotent: same inputs always produce same output
```

**For notifications:**
```typescript
const sent = await alertService.findByEventId(eventId);
if (sent) return; // Already alerted
await alertService.send({ eventId, ...event.payload });
```

### 14.7 Handling Out-of-Order Events

Consumers must not depend on event arrival order.

If context from upstream events is required:
- **Option A:** Retry with backoff until upstream event arrives
- **Option B:** Process with partial context and mark incomplete
- **Option C:** Wait briefly (e.g., 5 second delay) for upstream event
- **Option D:** Query source-of-truth instead of relying on event data

**Never silently fail just because related context was late.**

### 14.8 Reprocessing and Replay Safety

Replay is allowed only if consumer logic is idempotent. Before enabling replay:
- Confirm duplicate side effects are prevented
- Confirm downstream systems can tolerate re-execution
- Verify unique constraints exist
- Confirm event matches supported schema version
- Test replay in staging before production

### 14.9 Examples of Idempotent Behavior

**Good:**
- Skipping transcript processing if callId already has transcript
- Ignoring duplicate competitor alert via unique (eventId) constraint
- Recomputing deal health score from current state (same state = same output)
- Preventing duplicate Data Cloud exports using daily idempotency window

**Bad:**
- Incrementing call count on every retry (non-idempotent)
- Sending alert without checking eventId (duplicates sent)
- Creating multiple summary versions for same call
- Starting workflow multiple times without dedup

### 14.10 What Must Never Happen

The following are unacceptable:
- ❌ Duplicate alerts sent to users due to retry
- ❌ Duplicate CRM writes from replay without safeguards
- ❌ Multiple summary records created for one call version
- ❌ Workflow runs triggered multiple times for same trigger
- ❌ Cross-tenant records created due to missing tenant checks

### 14.11 Testing Idempotency

Every consumer must have tests proving idempotency:

```typescript
// Test: Processing same event twice is idempotent
const event = createValidEvent();
const result1 = await consumer.handleEvent(event);
const result2 = await consumer.handleEvent(event); // Replay
expect(result2).toEqual(result1); // Same outcome
const records = await db.count({ callId: event.payload.callId });
expect(records).toEqual(1); // No duplicates
```

---

## 15. Retry, DLQ, and Failure Semantics

This section defines the security expectations for event payloads and event processing. Because the platform is multi-tenant and handles customer interactions, CRM-linked data, and AI-derived insights, every event must preserve strict tenant isolation and safe data handling.

### 15.1 Tenant isolation is mandatory

Every tenant-scoped event must include `tenantId` in its envelope and must preserve that tenant context through all producer, queue, consumer, and storage steps.

Consumers must always use the incoming tenant context when reading and writing data. No consumer may process an event without a valid tenant boundary.

### 15.2 No cross-tenant processing

A consumer must never:
- Read records belonging to another tenant while processing an event
- Write derived records into the wrong tenant partition
- Use global lookups that bypass tenant isolation
- Replay an event into a different tenant context
- Reuse cached data from another tenant during event handling

All event-driven logic must remain compatible with the platform’s row-level tenant isolation model.

### 15.3 Sensitive data minimization

Event payloads should contain only the data required for approved consumers to do their work. Do not include sensitive fields in payloads unless they are truly needed.

Payload design should prefer:
- Stable identifiers over large duplicated objects
- Short derived snippets over full raw content where possible
- Minimal business context instead of broad data copies
- Explicitly documented fields only

### 15.4 PII and confidential data handling

Events may contain or reference customer-sensitive information such as:
- Contact names
- Email addresses
- Meeting snippets
- CRM-linked entity identifiers
- AI-generated risk signals
- Forecast submissions
- User activity metadata

Such fields must be treated as sensitive. They must not be logged carelessly, copied unnecessarily, or exposed to unauthorized consumers.

### 15.5 Logging safety rules

Operational logs must not dump full raw event payloads by default when those payloads include sensitive or tenant-specific data.

Logs should prefer:
- `eventId`
- `eventName`
- `eventVersion`
- `tenantId`
- Producer and consumer names
- Retry count
- Error category
- Safe identifiers needed for debugging

If payload inspection is needed for diagnostics, it must follow controlled access rules and avoid exposing unnecessary raw content.

### 15.6 Access control expectations

Only approved modules and services may consume a given event. Just because an event is on the event bus does not mean every module may use it.

Access decisions should reflect:
- Business need
- Module ownership boundaries
- Data sensitivity
- Principle of least privilege
- Future auditability

### 15.7 Sensitive field review

Events that carry transcript snippets, CRM data, or AI-generated outputs should be reviewed for:
- Whether the field is actually required
- Whether a shortened or masked version is sufficient
- Whether the field increases privacy risk
- Whether the field should remain in storage only and not travel on the bus

### 15.8 Replay security

Event replay must preserve original tenant boundaries and must be access-controlled.

Replay tools or scripts must:
- Require authorized access
- Clearly show target tenant
- Avoid bulk replay across mixed tenants without controls
- Prevent accidental replay into non-matching environments

### 15.9 External boundary safety

When event processing triggers writes to external systems such as CRM, Slack, or data warehouse targets, the consumer must:
- Use the correct tenant-specific credentials and configuration
- Respect access and opt-out policies
- Avoid leaking one tenant’s data into another tenant’s integration target
- Log enough metadata for audit without exposing sensitive payloads

### 15.10 Security design principle

An event contract is not complete unless its tenant safety and sensitive-data implications are understood. If a field introduces privacy risk or weakens tenant isolation, it must be redesigned before approval.

---

## 15.1 Field-Level Classification

Every event payload field must be classified according to data sensitivity to ensure proper handling, logging, and access control.

### 15.1.1 Classification Levels

| Classification | Description | Handling Requirements |
|---|---|---|
| **public** | Non-sensitive business data | Safe to log, no special restrictions |
| **internal** | Internal operational data | Log with context, internal access only |
| **sensitive** | Customer-identifiable information | Mask in logs, restricted access |
| **restricted** | Highly confidential data | Never log, strict access controls |

### 15.1.2 Field Classification Examples

```typescript
// Example field classifications in schema documentation
export const PayloadSchema_v1 = z.object({
  callId: z.string().uuid(),           // public - business identifier
  durationSeconds: z.number(),          // public - operational metric
  participantEmail: z.string(),         // sensitive - PII, mask in logs
  transcriptText: z.string(),           // restricted - never log full content
  confidenceScore: z.number(),         // public - AI metric
  riskLevel: z.string(),               // internal - operational classification
});
```

### 15.1.3 Classification Rules

- **Default to public**: Fields are public unless explicitly marked otherwise
- **Document classification**: Every field must have documented classification
- **Audit compliance**: Restricted fields require compliance review
- **Logging rules**: Sensitive/restricted fields must be masked or excluded from logs

### 15.1.4 Encryption Requirements

| Data Type | At Rest | In Transit | Logging |
|---|---|---|---|
| Public | Standard encryption | TLS enabled | Full logging allowed |
| Internal | Standard encryption | TLS enabled | Context logging only |
| Sensitive | Enhanced encryption | TLS with mutual auth | Masked logging only |
| Restricted | Enhanced encryption + key rotation | TLS with mutual auth | No logging (metadata only) |

---

## 15.2 Retry Classification

Not all failures should be retried. Retry classification prevents wasting resources on permanent failures and ensures appropriate handling of different error types.

### 15.2.1 Retry Decision Matrix

| Failure Type | Should Retry? | Reason | Max Retries |
|---|---|---|---|
| **Validation error** | No | Schema will never validate | 0 |
| **External API timeout** | Yes | Temporary service issue | 3 |
| **Database connection lost** | Yes | Transient infra issue | 3 |
| **Business rule violation** | No | Logic error, won't fix | 0 |
| **Rate limiting** | Yes | Temporary throttling | 2 |
| **Authentication failure** | No | Config issue, needs fix | 0 |
| **Network partition** | Yes | Temporary connectivity | 3 |
| **Resource exhaustion** | Maybe | Depends on type | 1-2 |

### 15.2.2 Retry Classification Implementation

```typescript
function shouldRetry(error: Error, attemptCount: number): boolean {
  const errorType = classifyError(error);
  const retryConfig = RETRY_CLASSIFICATION[errorType];
  
  return retryConfig.shouldRetry && attemptCount < retryConfig.maxRetries;
}

const RETRY_CLASSIFICATION = {
  VALIDATION_ERROR: { shouldRetry: false, maxRetries: 0 },
  EXTERNAL_TIMEOUT: { shouldRetry: true, maxRetries: 3 },
  DATABASE_ERROR: { shouldRetry: true, maxRetries: 3 },
  BUSINESS_RULE_VIOLATION: { shouldRetry: false, maxRetries: 0 },
  RATE_LIMITED: { shouldRetry: true, maxRetries: 2 },
  AUTHENTICATION_FAILED: { shouldRetry: false, maxRetries: 0 },
  NETWORK_ERROR: { shouldRetry: true, maxRetries: 3 },
  RESOURCE_EXHAUSTED: { shouldRetry: true, maxRetries: 2 }
};
```

### 15.2.3 Retry Backoff Strategy by Classification

| Error Type | Backoff Strategy | Intervals |
|---|---|---|
| External API timeout | Exponential | 30s, 60s, 120s |
| Database connection | Exponential | 5s, 15s, 30s |
| Rate limiting | Fixed | 60s, 60s |
| Network partition | Exponential | 10s, 30s, 90s |
| Resource exhaustion | Linear | 30s, 60s |

---

## 15.3 DLQ Ownership and Resolution

Dead-letter queues require clear ownership and resolution processes to prevent accumulation of unresolved failures.

### 15.3.1 DLQ Ownership Assignment

Each event must have a designated DLQ owner responsible for:

| Event | DLQ Owner | Resolution SLA | Escalation Path |
|---|---|---|---|
| `call.transcription.completed` | M-01 Data Ingestion | 4 hours | Platform Core → Tech Lead |
| `crm.fields.extracted` | M-01 Data Ingestion | 4 hours | Platform Core → Tech Lead |
| `email.sent` | M-02 Sales Engagement | 2 hours | M-02 Lead → Platform Core |
| `revenue_graph.entity.linked` | M-03 Revenue Graph | 4 hours | M-03 Lead → Platform Core |
| `deal.stage.changed` | M-03 Revenue Graph | 2 hours | M-03 Lead → Platform Core |

### 15.3.2 DLQ Resolution Process

**Step 1: Immediate Assessment (within 1 hour)**
- Categorize failure type (transient vs permanent)
- Check for systemic issues (multiple events failing)
- Determine replay viability

**Step 2: Resolution Action (within SLA)**
- **Transient issues**: Fix underlying cause, replay events
- **Permanent issues**: Document root cause, archive events
- **Schema issues**: Coordinate with producer for contract fix

**Step 3: Documentation (within 24 hours)**
- Record root cause analysis
- Update prevention measures
- Share learnings with team

### 15.3.3 DLQ Monitoring and Alerts

**Alert thresholds:**
- **Critical**: >100 events in DLQ within 1 hour
- **Warning**: >50 events in DLQ within 4 hours
- **Info**: >10 events in DLQ within 24 hours

**Dashboard metrics:**
- DLQ depth by event type
- Resolution time by owner
- Failure categorization trends
- Replay success rates

### 15.3.4 Replay Authority and Safety

**Authorized replay personnel:**
- Event producer owners
- Platform Core team members
- Designated DevOps/SRE engineers

**Replay safety checks:**
- Verify tenant context preservation
- Validate schema compatibility
- Check for duplicate processing risk
- Confirm downstream system readiness

**Replay audit trail:**
- Who initiated replay
- When replay occurred
- Which events were replayed
- Replay success/failure status

---

## 16. Ordering and Event Delivery Guarantees

This section defines the platform guarantees for event delivery order and completeness. Event-driven systems must be clear about what ordering and delivery semantics consumers can rely on.

### 16.1 Delivery Guarantee Model

Platform events operate under **at-least-once delivery**. This means:
- The same event **may be delivered more than once** ✓
- Events **may arrive out of order** ✓  
- Events **may be delayed significantly** ✓
- Each delivery is an independent attempt ✓

Consumers must never assume exactly-once delivery.

### 16.2 Ordering Expectations

Event consumers must not assume events always arrive in perfect business order. In asynchronous systems, delivery timing may differ due to:
- Retry timing differences between events
- Queue backlogs and processing delays
- Delayed job processing
- Consumer restarts and rebalancing
- External dependency delays

Where strict sequencing matters, the consumer must enforce that sequencing using business logic rather than relying on queue timing.

### 16.3 Event Ordering Guarantees

The platform provides these ordering guarantees:
- **Per-partition ordering:** Events with the same `partitionKey` are processed in order
- **Global ordering:** NOT guaranteed across different partition keys
- **Event dependencies:** Consumers must handle events arriving out of dependency order

**Implementation:**
- Use `partitionKey` (e.g., `tenantId` or `callId`) to enforce order for related events
- BullMQ with single queue processes events in roughly FIFO order, but retries may reorder
- Consumers should not depend on global ordering

### 16.4 Handling Out-of-Order Events

If a consumer depends on upstream context that may arrive later, use one of these approaches:

**Option A: Delay processing for a short window**
```typescript
// Wait briefly for upstream event to arrive
await delay(1000);
const upstream = await getUpstreamEvent(eventId);
if (!upstream) process(event, null);
else process(event, upstream);
```

**Option B: Retry with backoff**
```typescript
async function processWithRetry(event) {
  const upstream = await getUpstreamEvent(event.causationId);
  if (!upstream) throw new Error('Upstream not ready'); // Retry
  process(event, upstream);
}
```

**Option C: Query source-of-truth instead of event data**
```typescript
// Don't rely on event containing all data
const fullContext = await db.getContext(event.payload.callId);
process(event, fullContext);
```

**Option D: Process with partial context**
```typescript
// Mark as incomplete, refresh later when context arrives
await db.insertIncomplete({ ...event.payload, status: 'waiting' });
// Later, when upstream arrives: refresh all waiting records
```

**Never silently fail just because related context was late.**

### 16.5 Partition Key Usage

Use `partitionKey` to enforce ordered processing for related events:

```json
{
  "eventId": "...",
  "partitionKey": "tenant-123",  // All events for tenant-123 processed in order
  "payload": { "callId": "call-abc" }
}
```

**Recommended partition keys:**
- `tenantId` — Tenant-level ordering
- `callId` — Call-specific ordering
- `dealId` — Deal-specific ordering
- Or combination: `{tenantId}:{callId}`

**Effect:** 
- Events with same partition key are processed sequentially
- Events with different partition keys may process in parallel
- Enables safe per-tenant or per-entity ordering without global bottleneck

---

## 17. Observability and Monitoring

This section defines how platform events must be logged, traced, measured, and alerted in production. Events are not reliable unless the team can see them move through the system and quickly detect when they fail.

### 17.1 Observability goals

Event observability must allow the team to answer these questions quickly:
- Was the event published successfully?
- Which consumer processed it?
- How long did processing take?
- Did it retry?
- Did it fail permanently?
- Did it reach the DLQ?
- Which tenant was affected?
- What downstream dependency failed?

### 17.2 Required event log context

Every producer and consumer should log the following safe metadata for each important event-processing step:
- `eventId`
- `eventName`
- `eventVersion`
- `tenantId`
- Producer module or service
- Consumer module or service
- Queue name
- Processing attempt number
- Correlation or trace identifier
- Outcome status such as published, started, succeeded, retried, failed, dead-lettered

These fields make event journeys traceable across modules.

### 17.3 Logging stages

At minimum, event logs should exist at these stages:
- Publish attempt
- Publish success or failure
- Consumer receipt
- Validation failure
- Processing start
- Processing success
- Retry scheduling
- Retry exhaustion
- DLQ handoff
- Replay execution

### 17.4 Metrics to capture

The platform should capture event metrics such as:
- Publish success rate
- Consumer success rate
- Retry count
- DLQ count
- Queue depth
- Consumer lag
- Processing latency
- End-to-end event completion time
- Validation failure rate
- Replay count
- Per-event failure rate by type

These metrics should be tracked at both platform and event-name level.

### 17.5 Recommended dimensions

Where possible, event metrics should be filterable by:
- Event name
- Producer
- Consumer
- Queue name
- Tenant
- Priority
- Environment
- Failure type

This makes troubleshooting much faster during incidents.

### 17.6 Tracing expectations

Events should participate in distributed tracing using `traceId`, `spanId`, `parentSpanId`, and `correlationId` where supported. This ensures OpenTelemetry alignment across the platform.

Tracing should help connect:
- Source API request or webhook
- Producer-side business action
- Queue publication
- Consumer-side processing
- Downstream external calls
- Final success or failure outcome

This is especially important for multi-step flows such as transcription, entity linking, tracking, summary generation, and downstream CRM sync.

### 17.7 Alerting expectations

Alerts should be configured for important failure signals such as:
- Sudden spike in consumer failures
- DLQ growth above threshold
- Queue backlog growth above threshold
- High validation failure rate
- Sustained publish failures
- Repeated external dependency failures
- Missing expected event flow from an upstream module
- High processing latency on critical high-priority events

Critical path events should have tighter alerting thresholds than lower-priority events.

### 17.8 Dashboard expectations

Operational dashboards should include:
- Queue depth by event
- Success and failure rate by event
- Retry and DLQ trends
- Consumer latency percentiles
- High-priority event backlog
- Top failing consumers
- External dependency failure correlation
- Tenant-specific incident visibility where appropriate

### 17.9 Tooling alignment

Event observability should align with the platform’s approved monitoring stack for:
- Error tracking
- Metrics dashboards
- Structured logs
- Uptime and alerting
- Tracing support

All event instrumentation should follow the same conventions so that engineers can debug without switching mental models per module.

### 17.10 Observability rule

If an event exists in production but cannot be traced, measured, and alerted on, then the event is operationally incomplete.

---

## 18. Testing Requirements

This section defines the minimum testing expectations for event contracts and event-driven processing. Event systems fail in ways that normal request-response testing often misses, so dedicated testing is required.

### 18.1 Testing goals

Event testing must verify:
- Contract correctness
- Runtime validation behavior
- Producer correctness
- Consumer correctness
- Retry and DLQ behavior
- Idempotent processing
- Safe replay
- Backward compatibility during schema evolution

### 18.2 Unit tests

Unit tests should cover:
- Schema validation logic
- Envelope construction
- Payload transformation logic
- Required versus optional field handling
- Enum and range validation
- Idempotency guard logic
- Retry decision helpers
- Failure classification logic

Unit tests should be fast and run on every pull request.

### 18.3 Contract tests

Contract tests verify that the producer emits payloads matching the registered schema and that consumers can validate and process supported schema versions.

Each official event should have contract tests for:
- A valid example payload
- Missing required fields
- Invalid types
- Invalid enum values
- Unsupported versions
- Nullability edge cases
- Optional field additions

### 17.4 Integration tests

Integration tests should cover realistic event flow across module boundaries.

Examples:
- Publish `call.transcription.completed` and verify downstream handlers are triggered correctly
- Publish `tracker.detection.created` and verify risk flags and alerts behave correctly
- Publish `deal.stage.changed` and verify dependent modules recompute or react correctly

Integration tests should confirm that event bus behavior, persistence, and consumer logic work together.

### 18.5 Idempotency tests

Every consumer of an official event should have tests proving duplicate delivery safety.

At minimum, test that:
- The same event processed twice does not create duplicate records
- Repeated processing does not duplicate external side effects
- Existing-record checks and unique constraints behave correctly
- Replays remain safe under normal expected conditions

### 18.6 Retry and DLQ tests

Critical events should have tests that simulate transient and permanent failures.

Test scenarios should include:
- Temporary downstream failure followed by successful retry
- Retry exhaustion leading to DLQ
- Validation failure leading to immediate rejection
- Backoff policy behavior
- Logging and metric emission on failure paths

### 18.7 Replay tests

Replay tests verify that events moved from failure state back into processing can be handled safely.

Replay testing should confirm:
- The consumer remains idempotent
- Replayed events do not cross tenant boundaries
- Replayed events still match supported schema versions
- Replay does not trigger duplicate side effects

### 17.8 Backward compatibility tests

When a schema evolves, tests must verify compatibility between versions.

These tests should confirm:
- Existing consumers still handle supported old versions
- New optional fields do not break older consumers
- Breaking changes correctly require version bumps
- Deprecated versions remain readable during transition windows

### 17.9 Fixture and example payloads

Each event should have maintained example payload fixtures for use in:
- Unit tests
- Contract tests
- Integration tests
- Replay tests
- Developer onboarding

Fixtures should include both valid and invalid examples.

### 17.10 CI expectations

Event tests must run in CI and block merge when contract safety is at risk.

A pull request affecting event contracts should not merge unless:
- Validation tests pass
- Contract tests pass
- Integration coverage is updated where required
- Backward compatibility impact is reviewed
- Registry documentation is updated

### 18.11 Load Testing Requirements

Every event must be validated under load to ensure the system can handle expected throughput without degradation.

**Required load testing per event:**
- **Baseline performance**: Measure processing latency at normal volume
- **Peak load testing**: Test at 2x expected volume for 30 minutes
- **Sustained load testing**: Test at 1.5x expected volume for 4 hours
- **Burst handling**: Validate sudden traffic spikes (10x normal for 1 minute)

**Load testing metrics to capture:**
- Event processing latency percentiles (p50, p95, p99)
- Queue depth under load
- Consumer throughput capacity
- Memory usage patterns
- Database connection pool utilization
- External dependency call rates

### 18.12 Chaos Testing Requirements

Chaos testing validates system resilience under failure conditions. Event systems must remain operational even when components fail.

**Required chaos scenarios:**
- **Consumer crash simulation**: Kill consumer processes mid-processing
- **Network partition testing**: Simulate network connectivity loss
- **Queue failure simulation**: Temporarily disable BullMQ queues
- **Database connection loss**: Cut database connections during processing
- **External dependency failure**: Mock downstream service failures
- **Resource exhaustion**: Simulate memory/CPU constraints

**Chaos testing validation:**
- Events should not be lost during failures
- DLQ should capture failed events appropriately
- System should recover automatically when failures resolve
- No data corruption or cross-tenant leakage
- Retry mechanisms should function correctly

### 18.13 Queue Saturation Tests

Validate system behavior when queues approach capacity limits.

**Queue saturation scenarios:**
- **Full queue testing**: Fill queue to max capacity
- **Backpressure validation**: Test producer behavior when queues are full
- **Consumer lag recovery**: Test recovery from large consumer backlog
- **Priority queue behavior**: Verify high-priority events bypass normal queue

### 18.14 Retry Storm Simulation

Test system behavior when many events fail simultaneously and trigger retries.

**Retry storm scenarios:**
- **Mass failure simulation**: 100+ events failing simultaneously
- **Retry amplification testing**: Validate retry backoff prevents thundering herd
- **DLQ capacity testing**: Ensure DLQ can handle retry storm volume
- **System recovery testing**: Verify recovery after underlying issue is fixed

### 17.11 Testing rule

An event is not production-ready just because it publishes successfully once. It is production-ready only when its normal path, failure path, retry path, duplicate path, and migration path are all tested.


## 18. Event Lifecycle Governance

This section defines how event contracts are created, reviewed, approved, updated, deprecated, and retired. Event governance is necessary because events are long-lived integration contracts between modules and future services.

### 18.1 Governance objective

The objective of event lifecycle governance is to ensure that:
- New events are introduced deliberately
- Existing event contracts remain stable
- Breaking changes are controlled
- Consumers are protected from silent contract drift
- Deprecated events are retired safely
- The registry remains the single source of truth

### 18.2 When governance is required

Governance is required whenever any of the following happens:
- A new platform event is proposed
- An existing event payload is changed
- A new consumer is added to an existing event
- Retry, DLQ, or priority behavior changes
- A new event version is introduced
- An event is deprecated or retired
- An event classification changes
- Sensitive fields are added or removed

No such change should be implemented informally in code alone.

### 18.3 New event proposal process

A new event must go through the following process before implementation is considered complete:

1. Identify the business need for the event.
2. Confirm that an existing event does not already solve the problem.
3. Define the producer, consumers, business meaning, and classification.
4. Define the event envelope and payload schema.
5. Document retry, DLQ, idempotency, and security considerations.
6. Add the event to the registry summary table.
7. Add the full detailed schema subsection to this document.
8. Add schema definitions and tests in code.
9. Raise a PR for review.
10. Obtain Tech Lead approval before production rollout.

### 18.4 Approval expectations

An event contract should be approved only when all of the following are true:
- The event has a clear business meaning
- The producer is the correct owner
- Approved consumers are identified
- The payload contains only necessary fields
- Versioning impact is understood
- Idempotency behavior is documented
- Retry and DLQ behavior are documented
- Tenant safety and sensitive data impact are reviewed
- Tests are added
- This registry is updated

### 18.5 Change control for existing events

Changes to an existing event must follow controlled review.

Minor compatible changes may include:
- Adding a new optional field
- Clarifying descriptions
- Improving examples
- Tightening validation without changing contract shape

Material changes requiring stronger review may include:
- New required fields
- Renamed fields
- Changed field types
- Changed event meaning
- New event versions
- Consumer-impacting retry behavior changes

### 18.6 Deprecation process

When an event or event version is no longer recommended, it must be formally deprecated.

Deprecation requires:
- Marking the event or version as deprecated in this registry
- Naming the recommended replacement
- Documenting the reason for deprecation
- Recording the deprecation date
- Recording the planned removal date
- Informing affected module owners and reviewers

Deprecated events must remain readable in the document until retirement is complete.

### 18.7 Retirement process

An event may be retired only after all approved consumers have migrated away from it and the retirement has been reviewed.

Retirement steps:
1. Confirm no active production consumers depend on the event
2. Confirm replacement event or workflow exists where needed
3. Remove event usage from code
4. Remove queue processing configuration if applicable
5. Update registry status to retired
6. Preserve historical notes in the document or revision history

### 18.8 Emergency changes

Emergency changes to event handling may happen during incidents, but emergency implementation does not bypass documentation requirements.

If a temporary exception is made:
- The change must be documented immediately after stabilization
- Tech Lead review is still required
- Any temporary workaround must be clearly marked
- Follow-up cleanup and permanent correction must be tracked

### 18.9 Ownership model

The event producer owns the contract, but governance is shared across the engineering organization.

Typical responsibilities:
- **Producer owner:** contract definition and safe publication
- **Consumer owner:** compatibility and safe handling
- **Tech Lead:** approval, architecture consistency, contract discipline
- **QA:** contract and flow validation
- **DevOps / SRE:** operational monitoring and failure visibility

### 18.10 Review cadence

This registry should be reviewed:
- Whenever a new event is introduced
- Whenever an existing event changes
- During major module extraction work
- During major architecture review cycles
- Whenever incident analysis shows a contract weakness

### 18.11 Governance Enforcement Mechanisms

Governance requires concrete enforcement mechanisms to prevent drift and ensure compliance.

**Event Review Board (Lightweight)**
- **Composition**: Tech Lead + 2 senior engineers + 1 QA representative
- **Meeting cadence**: Weekly 30-minute review session
- **Scope**: Review all event-related PRs and contract changes
- **Authority**: Can block merges, request changes, approve contracts

**Mandatory Checklist Gate in PR**
Every PR affecting events must include a completed checklist:

```
[ ] Event schema documented in registry
[ ] Schema version specified and compatible
[ ] Consumer contracts registered (CDC)
[ ] Field-level security classifications documented
[ ] Idempotency strategy documented
[ ] Retry/DLQ behavior specified
[ ] Load testing scenarios defined
[ ] Chaos testing scenarios defined
[ ] Backward compatibility impact assessed
[ ] Tenant safety reviewed
[ ] Performance impact evaluated
[ ] Monitoring/alerting requirements specified
```

**Contract Approval Labels**
PRs must be labeled before merge:
- `event-contract-approved` - Ready for merge
- `event-contract-changes-requested` - Needs revisions
- `event-contract-blocked` - Critical issues, cannot proceed

**Automated Enforcement Checks**
CI must automatically verify:
- Schema validation against contracts package
- No breaking changes without version bump
- All required envelope fields present
- Consumer contracts reference valid fields
- Size limits enforced in schemas
- Security classifications present for sensitive fields

**Compliance Monitoring**
Monthly audit of:
- Undocumented events in production code
- Schema drift between code and registry
- Missing consumer contract registrations
- Unapproved field classifications
- Events without proper testing coverage

**Enforcement Escalation Path**
1. **First violation**: Warning + required remediation plan
2. **Second violation**: Block event-related PRs until fixed
3. **Chronic violations**: Escalate to engineering leadership

### 18.12 Governance rule

No event is official until it is documented, reviewed, and approved.  
If an event exists in code but not in this registry, it must be treated as undocumented and brought into governance review immediately.

---

## 19. Open Issues and Future Events

This section is reserved for unresolved questions, planned event additions, pending schema decisions, and future event candidates that are not yet approved for production use.

### 19.1 Purpose of this section

This section exists to prevent undocumented event ideas from spreading into code informally. It gives the team one place to capture event-related future work without pretending those events are already approved contracts.

### 19.2 What belongs here

Use this section for:
- Proposed but not yet approved events
- Pending schema decisions
- Events blocked by upstream module readiness
- Planned event version upgrades
- Known contract gaps
- Open questions from architecture review
- Events expected during future module extraction
- Temporary placeholders for future workflow/system events

### 19.3 What does not belong here

This section must not be used for:
- Approved production events
- Final schema definitions
- Implementation notes that belong in code
- Module-internal temporary debugging events
- Unreviewed ideas without business context

Approved events belong in the registry summary table and the detailed schema section, not here.

### 19.4 Suggested tracking format

Use the following format for each open item:

| ID | Item | Type | Status | Owner | Notes |
|---|---|---|---|---|---|
| `OPEN-001` | Short title of issue or future event | Open issue / Future event / Version change | Proposed / Under review / Blocked | Team or owner | Short explanation |

### 19.5 Example entries

| ID | Item | Type | Status | Owner | Notes |
|---|---|---|---|---|---|
| `OPEN-001` | Define failure event standard for permanent processing errors | Open issue | Proposed | Platform Core | Need decision on whether failure events become first-class platform contracts |
| `OPEN-002` | Future workflow event for play enrollment activation | Future event | Blocked | M-08 Execution | Depends on final workflow engine design |
| `OPEN-003` | Introduce `v2` of `call.summary.generated` with richer next-step structure | Version change | Under review | M-06 Insight Generation | Must assess consumer impact before approval |
| `OPEN-004` | Add event for warehouse export completion visibility | Future event | Proposed | M-03 Revenue Graph | Useful for Data Cloud operational monitoring |

### 19.6 Status meanings

Suggested statuses:
- **Proposed** — idea exists, not yet reviewed
- **Under review** — being actively discussed
- **Blocked** — depends on another architecture decision or module
- **Approved for future** — accepted conceptually, not yet implemented
- **Rejected** — reviewed and intentionally not adopted
- **Superseded** — replaced by a better event or design

### 19.7 Future event guidance

When listing a future event, capture at minimum:
- Proposed event name
- Tentative producer
- Expected consumers
- Business purpose
- Open design questions
- Dependencies
- Whether it is likely domain, workflow, integration, or system

This makes later design work faster and reduces rediscovery effort.

### 19.8 Open issues discipline

Every item in this section should be revisited periodically. Old unresolved items create confusion if they remain without status updates.

At minimum, each item should have:
- A clear owner
- A current status
- A last review note or date when feasible

### 19.9 Rule for future items

Nothing in this section is production-approved until it is promoted into:
- The registry summary table, and
- The detailed event schemas section

Until then, these items are planning artifacts only.

---

## 20. Event Anti-Patterns

This section explicitly documents common mistakes and anti-patterns that must be avoided in event design. Understanding what NOT to do is as important as understanding what TO do.

### 20.1 Fat Events (Anti-Pattern)

**Problem:** Events that contain too much data, making them heavy, slow to process, and difficult to evolve.

**Examples of fat events:**
```json
// ❌ BAD: Embedding full transcript in event
{
  "eventName": "call.transcription.completed",
  "payload": {
    "callId": "123",
    "transcriptText": "Full 50KB transcript text here...", // Too large
    "fullAudioData": "base64 encoded audio...", // Definitely too large
    "speakerDiarization": "detailed analysis data...", // Unnecessary
    "allRelatedContacts": [...] // Unrelated data
  }
}
```

**Correct approach:**
```json
// ✅ GOOD: Reference to large data
{
  "eventName": "call.transcription.completed", 
  "payload": {
    "callId": "123",
    "transcriptId": "456",
    "transcriptStorageUrl": "s3://bucket/transcript-456.txt",
    "transcriptSizeBytes": 51200,
    "durationSeconds": 1842,
    "languageDetected": "en"
  }
}
```

### 20.2 Command Events (Anti-Pattern)

**Problem:** Using events to request actions rather than report completed facts.

**Examples of command events:**
```json
// ❌ BAD: Command-style events
{
  "eventName": "generate.summary",        // Command, not fact
  "eventName": "update.deal.stage",        // Command, not fact  
  "eventName": "send.email",               // Command, not fact
  "eventName": "process.transcript"        // Command, not fact
}
```

**Correct approach:**
```json
// ✅ GOOD: Fact-style events
{
  "eventName": "call.summary.generated",   // Fact: summary exists
  "eventName": "deal.stage.changed",       // Fact: stage already changed
  "eventName": "email.sent",              // Fact: email was sent
  "eventName": "call.transcription.completed" // Fact: transcription done
}
```

### 20.3 Hidden Coupling via Payload Assumptions (Anti-Pattern)

**Problem:** Consumers making assumptions about undocumented fields or implicit relationships.

**Examples of hidden coupling:**
```typescript
// ❌ BAD: Assuming undocumented field structure
function handleTranscriptionCompleted(event) {
  // Consumer assumes internal structure not documented in schema
  const speakerCount = event.payload.participants.length; // participants not documented
  const primarySpeaker = event.payload.participants[0].name; // Undocumented nested field
}

// ❌ BAD: Assuming business logic from field names
function handleCallCompleted(event) {
  // Consumer assumes call was successful based on field name, not documented behavior
  if (event.payload.callStatus === 'completed') {
    // Assumes 'completed' always means success, but this isn't documented
  }
}
```

**Correct approach:**
```typescript
// ✅ GOOD: Relying only on documented fields
function handleTranscriptionCompleted(event) {
  const callId = event.payload.callId;           // Documented
  const durationSeconds = event.payload.durationSeconds; // Documented
  const languageDetected = event.payload.languageDetected; // Documented
  
  // Business logic based on documented schema only
}
```

### 20.4 Event Chaining Loops (Anti-Pattern)

**Problem:** Creating circular dependencies where events trigger each other in loops.

**Example of event chaining loop:**
```
M-01: call.transcription.completed → M-04
M-04: call.scored → M-06  
M-06: call.summary.generated → M-01
M-01: call.transcription.completed → M-04 (loop!)
```

**Prevention strategies:**
- Map event flows before implementation
- Ensure clear producer/consumer boundaries
- Avoid bidirectional event dependencies between same modules
- Use orchestration for complex multi-step workflows instead of pure choreography

### 20.5 Cross-Tenant Leakage (Anti-Pattern)

**Problem:** Events that can cause data to leak between tenants or break tenant isolation.

**Examples of cross-tenant leakage:**
```json
// ❌ BAD: Missing tenant context
{
  "eventName": "call.transcription.completed",
  "payload": {
    "callId": "123",
    "transcriptId": "456"
    // Missing tenantId - could process wrong tenant's data
  }
}

// ❌ BAD: Global operations without tenant scoping
{
  "eventName": "system.maintenance.completed",
  "payload": {
    "affectedCalls": ["call-123", "call-456", "call-789"] // Which tenants?
  }
}
```

**Correct approach:**
```json
// ✅ GOOD: Clear tenant context
{
  "eventName": "call.transcription.completed",
  "tenantId": "tenant-abc", // Always present
  "payload": {
    "callId": "123",
    "transcriptId": "456"
  }
}
```

### 20.6 Event Explosion (Anti-Pattern)

**Problem:** Creating too many fine-grained events that overwhelm the system.

**Examples of event explosion:**
```
// ❌ BAD: Too granular events
field.updated.firstName
field.updated.lastName  
field.updated.email
field.updated.phone
field.updated.company
// ... hundreds more

// ✅ GOOD: Appropriate granularity
contact.profile.updated
```

**Guidelines to prevent explosion:**
- One logical business change = one event
- Group related field updates into single events
- Consider event frequency and system impact
- Use arrays for multiple related items

### 20.7 Silent Schema Evolution (Anti-Pattern)

**Problem:** Making breaking changes without proper versioning or documentation.

**Examples of silent evolution:**
```json
// v1 (original)
{
  "payload": {
    "callId": "123",
    "duration": 1800
  }
}

// v2 (silent breaking change - not allowed)
{
  "payload": {
    "callId": "123", 
    "durationSeconds": 1800, // Field renamed!
    "confidenceScore": 0.95  // New required field!
  }
}
```

**Correct approach:**
```json
// v2 (proper evolution)
{
  "eventVersion": "v2",
  "payload": {
    "callId": "123",
    "durationSeconds": 1800, // Documented breaking change
    "duration": 1800,        // Keep old field for backward compatibility
    "confidenceScore": 0.95 // Documented as new optional field
  }
}
```

### 20.8 Mixing Concerns (Anti-Pattern)

**Problem:** Events that serve multiple unrelated purposes.

**Examples of mixed concerns:**
```json
// ❌ BAD: Event doing too many things
{
  "eventName": "call.processing.complete",
  "payload": {
    "transcriptData": {...},    // Transcription concern
    "summaryData": {...},      // Summary concern  
    "scoringData": {...},      // Scoring concern
    "crmSyncResult": {...},    // Integration concern
    "billingInfo": {...}       // Billing concern
  }
}
```

**Correct approach:**
```json
// ✅ GOOD: Separate, focused events
{
  "eventName": "call.transcription.completed",
  "payload": { "transcriptData": {...} }
}

{
  "eventName": "call.summary.generated", 
  "payload": { "summaryData": {...} }
}

{
  "eventName": "call.scored",
  "payload": { "scoringData": {...} }
}
```

### 20.9 Anti-Pattern Detection Rules

**During design review, check for:**

- [ ] Event size > 256KB (fat event)
- [ ] Event name sounds like a command (generate, update, send, process)
- [ ] Consumer code references undocumented fields
- [ ] Circular event dependencies in flow diagram
- [ ] Missing tenantId in tenant-scoped events
- [ ] More than 20 events for same business entity
- [ ] Breaking changes without version bump
- [ ] Events mixing multiple business concerns

**If any anti-pattern detected:**
- Block the PR until resolved
- Require architecture review
- Document the resolution approach
- Add preventive measures to guidelines

---

## 21. Appendix

This appendix contains supporting reference material that helps engineers, QA, and reviewers use the Event Schema Registry consistently. It is intentionally practical and should make day-to-day implementation easier.

### 20.1 What the appendix contains

The appendix may include:
- Example event payloads
- Naming cheatsheets
- Field type conventions
- JSON patterns
- Envelope examples
- Glossary of key terms
- Common validation rules
- Example do-and-don’t patterns

### 20.2 Naming cheatsheet

Use the following naming rules for event names:
- Use lowercase letters
- Use dot-separated words
- Use business-oriented naming
- Use past-tense meaning where possible
- Keep names concise but descriptive

Good examples:
- `call.transcription.completed`
- `crm.fields.extracted`
- `deal.stage.changed`
- `forecast.submitted`

Avoid:
- `do.transcription`
- `summary.generate`
- `dealUpdate`
- `event123`

### 20.3 Standard envelope example

```json
{
  "eventId": "0b6c3c3c-5d7a-4df6-9d0f-12ab34cd56ef",
  "eventName": "call.transcription.completed",
  "eventVersion": "v1",
  "tenantId": "8de12ab3-4456-4c88-9f01-98ab76cd54ef",
  "producer": "M-01 Data Ingestion",
  "occurredAt": "2026-04-23T08:30:15Z",
  "publishedAt": "2026-04-23T08:30:19Z",
  "correlationId": "req-12345",
  "traceId": "trace-67890",
  "priority": "high",
  "payload": {
    "callId": "11111111-2222-3333-4444-555555555555",
    "transcriptId": "66666666-7777-8888-9999-aaaaaaaaaaaa",
    "durationSeconds": 1842,
    "languageDetected": "en",
    "confidenceScore": 0.94
  }
}
```

### 20.4 Payload field table template

Use this table format in every detailed event section:

| Field | Type | Required | Nullable | Description | Example |
|---|---|---|---|---|---|
| `fieldName` | `type` | Yes/No | Yes/No | Meaning of the field | Sample value |

### 20.5 Common field conventions

| Field Type | Convention |
|---|---|
| UUIDs | Use canonical UUID string format |
| Timestamps | Use ISO 8601 UTC timestamps |
| Enums | Document all allowed values explicitly |
| Confidence scores | Use numeric range `0.0` to `1.0` |
| Booleans | Use `true` / `false` only |
| Arrays | Keep item structure documented and consistent |
| Optional fields | Omit when absent unless nullability is explicitly required |

### 20.6 Optional vs nullable reminder

Remember:
- **Optional** means the field may be absent
- **Nullable** means the field is present but may be `null`

These are not the same and must not be used interchangeably.

### 20.7 Example glossary

| Term | Meaning |
|---|---|
| Event | A durable record that something happened |
| Producer | The module or service that emits an event |
| Consumer | The module or service that reacts to an event |
| Envelope | Common metadata wrapper around all events |
| Payload | Event-specific business data |
| Idempotency | Safe repeated processing without duplicate side effects |
| DLQ | Dead-letter queue for failed event processing |
| Backoff | Delay strategy used between retries |
| Replay | Reprocessing a previously failed or delayed event |
| Contract | The agreed schema and behavior of an event |

### 20.8 Example validation checklist

Use this quick checklist before approving an event:
- Is the event name business-meaningful?
- Is the producer the correct owner?
- Are required and optional fields clear?
- Is `tenantId` present?
- Are retry and DLQ settings defined?
- Is idempotency documented?
- Are security and sensitive-field concerns reviewed?
- Are tests added?
- Is the summary table updated?
- Is the detailed schema section complete?

### 20.9 Example do-and-don’t patterns

**Do**
- Publish events after durable state change
- Validate before publish and before consume
- Use documented field names only
- Make consumers idempotent
- Keep payloads minimal and explicit

**Don’t**
- Use events as undocumented internal shortcuts
- Rename fields without versioning
- Assume exactly-once delivery
- Put unnecessary sensitive data in payloads
- Introduce an event in code without updating this registry

### 20.10 Appendix maintenance rule

The appendix should remain lightweight and practical.  
If material becomes normative contract content rather than helper reference, it should be moved into the main body of the document.
 