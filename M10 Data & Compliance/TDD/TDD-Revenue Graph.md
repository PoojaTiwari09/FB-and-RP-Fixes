# TDD — Revenue Graph

**Document ID:** Doc #11a  
**Module (Product-facing):** M10 Data Compliance  
**Feature:** Revenue Graph  
**Architecture Owner:** M-03 Revenue Graph  
**Status:** Draft  
**Primary Engineers:** Backend Platform, Data Platform, CRM Integration  
**Primary Consumers:** M-04 Conversation Intelligence, M-05 Smart Tracking and Search, M-06 Insight Generation, M-07 Deal and Account Management, M-09 Forecasting, M-10 Performance and Coaching  
**Last Updated:** 2026-05-05

---

## Boundary Note

**Ownership boundary:** This feature appears inside the product-facing M10 Data Compliance module, but the real architecture owner is **M-03 Revenue Graph**. Revenue Graph owns the connected revenue data layer that links captured interactions to accounts, contacts, deals, and activities. It depends on upstream capture events from M-01 and exposes linked entity context to downstream modules through public APIs and events. It must not absorb downstream business logic such as scoring, forecasting, coaching, or UI rendering.

**Shared dependencies:**  
- M-01 Capture and Transcription for call, email, meeting, and CRM capture events  
- Platform Core for auth, API gateway, event bus, queueing, observability, and tenant enforcement  
- CRM connectors for Salesforce, HubSpot, and Microsoft Dynamics 365  
- AI services layer for optional entity-resolution assistance and contextual enrichment  
- Shared PostgreSQL with strict tenant isolation and Row-Level Security (RLS)

---

## 1. Purpose

Revenue Graph is the structured relationship layer that connects all captured customer interaction data into business context. Its purpose is to transform raw interaction records such as calls, emails, meetings, CRM updates, and activity signals into a linked graph of revenue entities so the platform can understand who interacted, with which account, in support of which deal, and at what point in the customer lifecycle.  

This feature is foundational because downstream modules cannot produce reliable AI outputs, deal intelligence, forecasting, or workflow automation unless the system first knows how each interaction maps to the correct account, contact, deal, and activity history. Revenue Graph is therefore the source of truth for cross-entity relationship context inside the platform.

---

## 2. Goals

The Revenue Graph design must achieve the following goals:

- Automatically ingest captured interaction signals without manual rep logging.
- Link each interaction to the correct tenant, account, contact, deal, user, and activity timeline.
- Preserve CRM identifiers and internal platform identifiers without losing traceability.
- Support configurable mapping logic where default rules are not sufficient.
- Provide graph context to downstream modules through public APIs and event publication.
- Maintain high correctness under multi-tenant isolation constraints.
- Allow reprocessing and backfill when CRM mappings, contact ownership, or deal relationships change.
- Support explainability so engineers and admins can understand why a link was created.
- Keep all writes idempotent and safe under retries, duplicate events, and partial failures.

---

## 3. Non-Goals

This TDD does not cover:

- Call transcription internals
- NLP scoring, topic tagging, theme detection, or summarization
- Forecast calculation logic
- Outreach compliance configuration and policy enforcement
- Warehouse export implementation details
- UI wireframes and frontend rendering logic

Those concerns belong to their own feature TDDs or platform documents.

---

## 4. Feature Summary

Revenue Graph is defined as the feature that connects all captured data into a relationship graph to understand revenue relationships and deal context. It is designed as a three-layer architecture:

1. **Automated Data Capture Engine**  
   Captures revenue-related interaction signals across channels such as calls, meetings, emails, CRM records, and external activity sources.

2. **Contextual Data Mapping**  
   Organizes and links those captured records to the correct revenue entities such as accounts, contacts, deals, teams, and users.

3. **AI Context Layer**  
   Uses the structured graph to supply contextual understanding for AI models, automation logic, insights generation, and downstream analytics.

This three-layer design makes Revenue Graph the connected data foundation for the rest of the platform.

---

## 5. Business Value

Revenue teams usually lose context because interaction data sits in disconnected systems. Calls may exist in conferencing tools, contact records in CRM, notes in email threads, and pipeline state in opportunity tables. Revenue Graph solves this by creating one connected model where every interaction can be placed into the right business context.

This enables:
- Better deal visibility
- More accurate AI analysis
- Cleaner account history
- Reliable forecasting inputs
- Search and reporting by entity relationships rather than by raw transcript alone
- Less manual CRM data entry

---

## 6. Users and Consumers

### Primary internal users
- Backend engineers building downstream modules
- RevOps admins validating CRM linkage quality
- QA engineers testing end-to-end data correctness
- Support engineers diagnosing data mapping issues

### Primary product consumers
- Deal Boards
- Account Boards
- Smart Trackers
- Ask Anything
- AI Summaries
- Forecasting
- Dashboards
- Coaching analytics

### External systems
- Salesforce
- HubSpot
- Microsoft Dynamics 365
- Email providers
- Conferencing platforms
- Telephony connectors

---

## 7. Scope

### In scope
- Ingestion of interaction metadata and CRM entity references from upstream capture systems
- Linking interactions to accounts, contacts, deals, users, and activities
- Maintaining relationship edges and history
- Re-linking and replay when upstream or CRM data changes
- Revenue Graph APIs for lookup and retrieval
- Revenue Graph event publication for downstream consumers
- Confidence scoring and explainability metadata for mappings
- Tenant-safe storage and access controls
- Idempotent processing and replay-safe jobs

### Out of scope
- Transcript generation
- Call scoring logic
- Smart tracker semantic logic
- Summary generation
- Data export jobs
- Compliance enforcement decisions

---

## 8. Architecture Ownership

| Area | Owner | Notes |
|---|---|---|
| Revenue Graph ingestion and linking | M-03 Revenue Graph | Primary owner of this TDD |
| Capture event production | M-01 Capture & Transcription | Upstream dependency |
| AI entity-resolution helper endpoints | AI services layer | Optional assistive service, not source of truth |
| CRM connectors | Integration layer / Platform services | Supplies external entity state |
| Downstream insight consumers | M-04, M-05, M-06, M-07, M-09, M-10 | Read Revenue Graph via events or public APIs |

---

## 9. Functional Requirements

### FR-1 Automatic capture intake
The system shall receive captured interaction signals from upstream systems without requiring manual user action. Supported source categories include calls, meetings, emails, CRM activity changes, and external engagement records.

### FR-2 Tenant resolution
Every inbound record shall be resolved to exactly one tenant before any write occurs. Records with missing or invalid tenant context must be quarantined and must not enter shared business tables.

### FR-3 Entity linking
The system shall link each interaction to zero or more accounts, contacts, deals, users, and activities using deterministic rules first and AI-assisted heuristics only where necessary.

### FR-4 Mapping confidence
Each link decision shall store a confidence classification such as `high`, `medium`, `low`, plus an explainability payload describing which matching rules contributed to the result.

### FR-5 Idempotent writes
Repeated delivery of the same event or replayed job must not create duplicate links or duplicate activity timeline records.

### FR-6 Reprocessing support
The system shall support replay and re-linking when CRM ownership changes, duplicate records are merged, a contact is reassigned, or mapping rules are updated.

### FR-7 Public read APIs
The system shall provide stable public APIs to fetch account, contact, deal, and activity context for downstream modules and frontend consumers.

### FR-8 Event publication
After successful linking, the system shall publish a `revenue_graph.entity.linked` event containing the resolved entity references and metadata required by downstream subscribers.

### FR-9 Auditability
The system shall preserve enough metadata to explain how a link was created, updated, or replaced.

### FR-10 Isolation and governance
All graph data shall be partitioned by tenant and enforced by RLS and service-layer tenant checks.

---

## 10. Non-Functional Requirements

### Performance
- Initial entity-linking for a single interaction should complete within acceptable async processing windows.
- Read APIs for deal/account/contact lookups should support low-latency frontend and downstream module usage.
- Bulk replay jobs must be batch-based and queue-driven to avoid exhausting database connections.

### Reliability
- All jobs must be retry-safe.
- Duplicate event delivery must not corrupt graph state.
- Partial failures must route to retry or dead-letter paths with observability.

### Scalability
- Design must support growth in calls, emails, meetings, and CRM activities without redesign of the core model.
- Indexing must prioritize tenant-scoped access patterns.

### Security
- Every table must include `tenant_id`.
- No cross-tenant joins without explicit system-level approval.
- APIs must enforce JWT auth plus tenant scope.

### Observability
- All link attempts, failures, replays, and low-confidence outcomes must be measurable.
- Traces must correlate upstream capture IDs to graph writes and emitted events.

---

## 11. End-to-End Flow

The standard processing flow is:

1. M-01 or an approved connector captures an interaction.
2. Upstream system publishes a capture-complete event.
3. Revenue Graph intake worker consumes the event.
4. Tenant is resolved and validated.
5. CRM and platform context are loaded.
6. Deterministic linking rules execute.
7. If confidence remains insufficient, AI-assisted entity resolution may be invoked.
8. Final entity mapping is written idempotently.
9. Activity timeline entries and relationship edges are updated.
10. `revenue_graph.entity.linked` is published for downstream consumers.
11. Downstream modules consume the event and enrich their own workflows.

---

## 12. Core Components

### 12.1 Automated Data Capture Engine

This layer is responsible for receiving or normalizing interaction signals produced by capture systems. It does not perform final business linking by itself. Its job is to create a normalized intake record that can be processed consistently regardless of source platform.

#### Responsibilities
- Accept call, meeting, email, CRM, and external activity intake events
- Normalize source-specific payloads into one canonical intake model
- Enforce source authentication and payload validation
- Resolve tenant and connector identity
- Persist raw-to-normalized traceability references
- Forward normalized records into the mapping pipeline

#### Typical source inputs
- Call transcription completed
- Meeting captured
- Email sent or received
- CRM task or note synced
- Calendar event associated with call
- Telephony activity captured

#### Example normalized intake shape
```json
{
  "eventId": "evt_123",
  "tenantId": "tenant_001",
  "sourceType": "call",
  "sourcePlatform": "zoom",
  "sourceRecordId": "zoom_call_7788",
  "occurredAt": "2026-05-05T08:30:00Z",
  "participants": [
    {"email": "rep@company.com", "role": "internal"},
    {"email": "buyer@client.com", "role": "external"}
  ],
  "crmHints": {
    "accountId": null,
    "dealId": null,
    "contactIds": []
  },
  "artifacts": {
    "transcriptId": "tr_001",
    "calendarEventId": "cal_009"
  }
}
```

#### Design notes
- This layer should never assume one source is the system of truth for business linkage.
- It should preserve all hints but not over-trust any one hint.
- It must support duplicate delivery and delayed arrivals.

---

### 12.2 Contextual Data Mapping

This is the heart of Revenue Graph. It transforms normalized intake records into linked business context using deterministic rules, ranking logic, configurable mapping rules, and optional AI-assisted resolution.

#### Responsibilities
- Match participants to contacts
- Match domains and CRM references to accounts
- Match interactions to open or recently active deals
- Create or update activity records
- Store mapping explanations and confidence
- Handle ambiguous, missing, or conflicting CRM context
- Support re-linking and replay workflows

#### Entity types
- Tenant
- User
- Team
- Account
- Contact
- Deal / Opportunity
- Activity
- Interaction artifact
- Source connector

#### Deterministic mapping signals
- CRM IDs already present in source payload
- Email address exact match
- Account domain match
- Calendar attendee overlap
- Deal participants already associated with account/contact
- Recent open deal activity recency
- Meeting title or metadata hint
- Contact-owner and rep-owner relationships
- Existing prior links for same thread or conversation

#### Configurable mapping rules
Admins or RevOps may define tenant-level preferences such as:
- Prefer open deals over closed deals
- Prefer exact email-domain account match
- Ignore personal email domains for account inference
- Limit deal matching to active pipeline stages
- Require minimum confidence before link finalization
- Route low-confidence items to review queue

#### AI-assisted resolution
AI assistance is allowed only when deterministic logic does not produce enough certainty. AI may suggest likely entity matches using transcript context, participant references, historical relationship patterns, and CRM semantics, but final business acceptance rules remain in the TypeScript product service.

#### Conflict handling
If multiple candidate deals or contacts are possible:
- Rank candidates
- Compare confidence
- Apply tenant rules
- Mark low-confidence outcomes
- Optionally send to review queue
- Avoid silent hard-linking on weak evidence

---

### 12.3 AI Context Layer

The AI Context Layer is not a separate graph store. It is the contextual interface built on top of the linked graph so downstream AI and workflow modules can operate with business meaning instead of raw interaction text.

#### Responsibilities
- Expose linked context to AI services
- Provide account/deal/contact relationship snapshots
- Enrich downstream event payloads with stable entity references
- Support retrieval of activity history around a deal or account
- Help downstream modules answer questions like:
  - Which account is this call associated with?
  - Which active deal is most likely relevant?
  - Which contacts participated?
  - What was the recent history before this interaction?
  - Which activities belong to the same thread or engagement pattern?

#### Example downstream usage
- M-04 uses linked deal stage and account context during conversation analysis.
- M-05 uses linked account/deal/contact context to enrich tracker detections.
- M-06 uses graph relationships to generate deal and account briefs.
- M-07 uses graph activity history to show engagement timelines and deal context.
- M-09 uses linked opportunity and activity signals as forecasting inputs.

---

## 13. Entity Linking Design

### 13.1 Linking order
The standard linking order is:

1. Resolve tenant
2. Resolve internal users and workspace participants
3. Resolve contacts
4. Resolve account
5. Resolve deal
6. Create/update activity record
7. Write relationship edges
8. Publish event

This order is important because deal inference is often dependent on contact and account context.

### 13.2 Account linking
Account linkage may use:
- CRM account ID in source payload
- Email domain match from external participants
- Existing contact-to-account relationship
- Historical interaction history
- Meeting organizer account association
- Tenant-specific mapping rules

### 13.3 Contact linking
Contact linkage may use:
- Exact email address match
- CRM participant mapping
- Calendar attendee identity
- Historical source-platform participant bindings
- Thread-level prior contact associations

### 13.4 Deal linking
Deal linkage may use:
- CRM opportunity ID in payload
- Open deals for resolved account
- Deals involving resolved contacts
- Recent owner activity
- Calendar metadata
- Transcript or subject hints
- Tenant rule filters by stage, recency, or owner

### 13.5 Activity linking
Every successfully processed interaction should create or update an activity node or activity record so downstream modules can build timelines and engagement histories.

### 13.6 Low-confidence and unresolved states
If no reliable mapping is possible:
- Create the interaction/activity intake record
- Mark status as unresolved or low-confidence
- Store candidate entities
- Publish a diagnostic event if needed
- Allow replay after CRM state changes or admin review

---

## 14. Data Model

The exact schema may evolve, but the feature must support the following logical entities.

### 14.1 Core tables
- `accounts`
- `contacts`
- `deals`
- `activities`
- `deal_contacts`
- `interaction_links`
- `crm_sync_state`
- `mapping_rule_sets`
- `link_decision_log`

### 14.2 Suggested table purposes

#### `accounts`
Stores tenant-scoped CRM-synced account records and platform enrichment fields.

#### `contacts`
Stores tenant-scoped contact records and identity resolution fields.

#### `deals`
Stores opportunity/deal records required for relationship mapping and downstream context.

#### `activities`
Stores interaction timeline entries linked to accounts, contacts, deals, users, and source artifacts.

#### `interaction_links`
Stores resolved many-to-many entity relationships per source interaction, including confidence and explanation.

#### `mapping_rule_sets`
Stores tenant-specific configuration for entity matching behavior.

#### `link_decision_log`
Stores audit details explaining how link outcomes were produced.

### 14.3 Common columns
All business tables must include:
- `tenant_id`
- primary key UUID
- created/updated timestamps
- source system identifiers where relevant
- idempotency key or equivalent dedupe key where applicable

---

## 15. API Design

Revenue Graph must expose public read APIs for downstream modules and the frontend. Representative endpoints:

### 15.1 Accounts
- `GET /api/v1/revenue-graph/accounts`
- `GET /api/v1/revenue-graph/accounts/:id`

### 15.2 Deals
- `GET /api/v1/revenue-graph/deals`
- `GET /api/v1/revenue-graph/deals/:id`

### 15.3 Contacts
- `GET /api/v1/revenue-graph/contacts/:id`

### 15.4 CRM sync and diagnostics
- `POST /api/v1/revenue-graph/crm-sync`
- `GET /api/v1/revenue-graph/crm-sync-status`

### 15.5 API rules
- APIs are read-oriented for downstream consumers.
- Cross-module consumers must use public APIs, not direct schema access.
- API responses must be tenant-scoped and permission-checked.
- Pagination, filtering, and stable response contracts are required.
- Low-confidence link metadata should be available to privileged admin/RevOps consumers.

### 15.6 Example response
```json
{
  "dealId": "deal_001",
  "tenantId": "tenant_001",
  "name": "ACME Renewal FY26",
  "stage": "Negotiation",
  "account": {
    "accountId": "acct_001",
    "name": "ACME Corp"
  },
  "contacts": [
    {"contactId": "ct_001", "name": "Jane Buyer", "email": "jane@acme.com"}
  ],
  "recentActivities": [
    {
      "activityId": "act_099",
      "type": "call",
      "occurredAt": "2026-05-05T08:30:00Z"
    }
  ]
}
```

---

## 16. Event Contracts

### 16.1 Events consumed
Representative inbound events may include:
- `call.transcription.completed`
- `email.sent`
- `meeting.captured`
- `crm.sync.completed`
- `activity.import.completed`

### 16.2 Event emitted
Primary outbound event:
- `revenue_graph.entity.linked`

### 16.3 Example emitted payload
```json
{
  "eventId": "evt_rg_001",
  "tenantId": "tenant_001",
  "sourceType": "call",
  "sourceRecordId": "zoom_call_7788",
  "activityId": "act_099",
  "accountId": "acct_001",
  "dealId": "deal_001",
  "contactIds": ["ct_001", "ct_002"],
  "confidence": "high",
  "linkedAt": "2026-05-05T08:31:10Z",
  "explanation": {
    "signals": [
      "calendar_attendee_exact_match",
      "crm_account_domain_match",
      "open_deal_recent_activity_match"
    ]
  }
}
```

### 16.4 Event rules
- Event publication occurs only after durable write success.
- Consumers must treat events as at-least-once delivered.
- Event payloads must be versioned.
- Publisher owns schema evolution; consumers must tolerate additive fields.

---

## 17. State and Status Model

Every intake record or activity linkage should move through a clear status lifecycle.

### Suggested statuses
- `received`
- `normalized`
- `mapping_in_progress`
- `linked`
- `linked_low_confidence`
- `unresolved`
- `replay_pending`
- `failed`
- `dead_lettered`

### Notes
- `linked_low_confidence` is valid and should not be hidden.
- `unresolved` is not a silent drop; it is an actionable state.
- `replay_pending` allows future correction after CRM or rules changes.

---

## 18. Idempotency and Replay

Idempotency is mandatory because event-driven systems can redeliver messages, jobs can retry, and bulk backfills may replay historical data.

### Requirements
- Every inbound event must carry or derive an idempotency key.
- The write path must detect already-processed interactions.
- Replayed jobs must update existing link state instead of inserting duplicates.
- Emitted events should not be duplicated for unchanged graph outcomes unless explicitly configured.

### Replay scenarios
- CRM merge of duplicate contacts
- Contact moved to different account
- Deal reopened or reassigned
- New mapping rules introduced
- Historical backfill after connector onboarding
- Bug fix in linking logic

### Replay strategy
- Use queue-driven batch replay
- Recompute candidate matches
- Compare old vs new outcome
- Update links only if outcome changes
- Publish change event when linked entities materially change

---

## 19. Error Handling

### Error categories
- Invalid payload
- Missing tenant
- Connector auth failure
- CRM lookup unavailable
- Ambiguous entity match
- AI helper timeout
- Database write conflict
- Event publish failure

### Handling strategy
- Validation errors go to quarantine or dead-letter with reason codes.
- Temporary dependency failures retry with backoff.
- Ambiguous matches do not hard-fail the whole record; store unresolved or low-confidence state.
- Event publish failure after durable write must trigger an outbox-based recovery path if available.

---

## 20. Security and Tenant Isolation

Revenue Graph handles core client data and therefore must enforce strict isolation.

### Requirements
- Every table includes `tenant_id`.
- RLS policies must be enabled on tenant-owned tables.
- APIs enforce auth + tenant context + role authorization.
- No global search across tenants.
- Admin diagnostics must remain tenant-scoped.
- Internal jobs must propagate tenant context end-to-end.
- Debug logs must not leak transcript bodies or CRM secrets unnecessarily.

### Governance rules
- Revenue Graph may store links and business context, but it does not override CRM system-of-record ownership semantics.
- AI assistance may recommend matches but cannot bypass tenant, consent, or platform access controls.

---

## 21. Observability

### Metrics
- Intake events received per source
- Link success rate
- Low-confidence rate
- Unresolved rate
- Replay volume
- Duplicate event suppression count
- Linking latency p50/p95/p99
- API latency and error rate
- Event publication success rate

### Logs
- Correlation ID per interaction flow
- Link decision summary
- Candidate ranking output
- Replay before/after diff summary
- Failure reason code

### Alerts
- Spike in unresolved mappings
- CRM lookup dependency failure
- Queue backlog growth
- Cross-tenant access guard failure
- Event bus publish failure
- Sudden drop in `revenue_graph.entity.linked` volume

---

## 22. Admin and Operational Controls

Revenue Graph should support controlled operations for support and RevOps teams.

### Recommended controls
- Re-run linkage for a single interaction
- Re-run linkage for one account or deal
- Bulk replay by date range
- View mapping explanation
- Review low-confidence links
- Inspect connector sync status
- Toggle tenant-specific mapping rules
- Export diagnostics for support

All such controls must be permission-guarded and audited.

---

## 23. Testing Strategy

### Unit tests
- Exact email match
- Domain-to-account match
- Deal candidate ranking
- Low-confidence threshold behavior
- Idempotency key handling
- Mapping rule evaluation
- Replay diff detection

### Integration tests
- Upstream capture event to linked entity event
- CRM lookup fallback behavior
- Public API retrieval after linking
- Duplicate event delivery
- Multi-tenant isolation enforcement
- RLS policy validation

### End-to-end tests
- Captured call linked to account, contacts, and deal
- Email interaction linked into account/deal timeline
- CRM update changes mapping after replay
- Low-confidence path visible in diagnostics
- Downstream consumer receives `revenue_graph.entity.linked`

### Test data requirements
- Multi-tenant fixtures
- Same email domain across tenants
- Duplicate contact names
- Multiple open deals under one account
- Missing CRM references
- Reassigned deal owner scenarios

---

## 24. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong entity linking | Downstream insights become misleading | Confidence scoring, explainability, replay support, low-confidence review path |
| Cross-tenant leakage | Severe security breach | Mandatory tenant propagation, RLS, automated tests, API authorization |
| Duplicate event delivery | Duplicate links or activities | Idempotency keys, upsert patterns, dedupe constraints |
| CRM inconsistency | Unstable mappings | Sync status tracking, replay workflows, rule-based ranking |
| Overuse of AI heuristics | Non-deterministic behavior | Deterministic rules first, AI assist only as fallback, acceptance logic stays in product service |
| Queue backlog | Delayed downstream processing | Scalable workers, alerts, backpressure controls |
| Tight coupling with downstream modules | Harder extraction and maintenance | Events + public APIs only, no internal cross-module reads |

---

## 25. Open Decisions

The following decisions may require Tech Lead sign-off before implementation is finalized:

1. Final schema names and table ownership boundaries
2. Exact confidence scoring rubric
3. Whether unresolved links go to manual review UI in Phase 1 or Phase 2
4. Whether event outbox pattern is mandatory from day one
5. Which tenant-level mapping rules are admin-configurable initially
6. Whether account inference should ever use transcript semantic hints without contact match
7. Which diagnostics are exposed to frontend vs internal support tools

---

## 26. Implementation Notes

- Product services remain in TypeScript.
- Any AI entity-resolution helper must remain in Python AI services and be invoked asynchronously or via internal APIs as approved by platform rules.
- Business acceptance logic for final linkage remains in the product service, not in the AI service.
- All inter-module communication must happen through published events or public APIs.
- No downstream module may query Revenue Graph internal tables directly unless a named architecture exception exists and is approved.

---

## 27. Example Processing Scenario

A Zoom call is captured for a seller and two buyer participants. The transcription completes and emits `call.transcription.completed`. Revenue Graph normalizes the call metadata, resolves the external participant emails to contacts, uses account-domain matching to identify the customer account, ranks two open deals on that account, and selects the most likely active renewal based on recent activity and attendee overlap. It writes the activity, stores the link explanation, and emits `revenue_graph.entity.linked`. Downstream modules then use the linked deal and account context for topic analysis, summaries, tracker detections, and deal board timelines.

---

## 28. Acceptance Criteria

The feature is considered complete when all of the following are true:

- Captured interactions can be linked to tenant-scoped business entities with deterministic and replay-safe processing.
- Revenue Graph exposes stable public APIs for account, contact, and deal context.
- `revenue_graph.entity.linked` is published after successful durable writes.
- Low-confidence and unresolved paths are explicitly represented and observable.
- Multi-tenant isolation is enforced by schema design, service checks, and RLS.
- Reprocessing workflows can safely update incorrect or stale mappings.
- Downstream modules can consume Revenue Graph outputs without direct schema coupling.

---

## 29. References

- Product module mapping for M10 Data & Compliance, including Revenue Graph, Configure Compliance, and Data Cloud
- Revenue Graph feature description: Automated Data Capture Engine, Contextual Data Mapping, and AI Context Layer
- System architecture guidance for M-03 Revenue Graph, entity-linking events, public APIs, tenant isolation, and event-driven module boundaries

