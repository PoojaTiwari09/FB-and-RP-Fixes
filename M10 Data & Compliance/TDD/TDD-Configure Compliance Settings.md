# TDD — Configure Compliance Settings

**Document ID:** Doc #11b  
**Module (Product-facing):** M10 Data Compliance  
**Feature:** Configure Compliance Settings  
**Architecture Owner:** Platform Core / Cross-Cutting Governance  
**Status:** Draft  
**Primary Engineers:** Backend Platform, Security, CRM Integration, Admin Settings  
**Primary Consumers:** Sales Engagement, Workflow Automation, Email Composer, calling workflows, admin console, audit and governance services  
**Last Updated:** 2026-05-05

---

## Boundary Note

**Ownership boundary:** This feature appears inside the product-facing M10 Data Compliance module, but it is **not owned by a single business module like M-03**. Configure Compliance Settings is a **cross-cutting governance capability** owned by Platform Core and enforced across all outreach and customer-data usage paths. It reads from shared compliance records, CRM opt-out records, consent state, tenant policy configuration, and regional privacy rules, then applies those rules at policy evaluation points across the platform.

**Shared dependencies:**  
- Platform Core for auth, RBAC, audit logging, API gateway, event bus, tenant context, and policy enforcement middleware  
- CRM connectors for opt-out state, do-not-contact flags, legal basis metadata, and record sync  
- Sales Engagement surfaces such as Email Composer, Workflow Automation, Orchestrate, tasking, and any future call workflows  
- Compliance schema for consent logs, CRM opt-outs, compliance policies, export requests, and deletion requests  
- Shared PostgreSQL with strict tenant isolation and Row-Level Security (RLS)

---

## 1. Purpose

Configure Compliance Settings allows tenant admins and authorized RevOps users to define how outreach and customer-data usage must comply with privacy, consent, and communication governance rules. The feature exists to ensure the platform does not send emails, trigger calls, queue outreach actions, or use customer data in restricted ways when doing so would violate CRM opt-out preferences, tenant policy configuration, regional privacy rules, or client-consent constraints.

This is a foundational control layer, not a cosmetic admin settings page. Its main role is to turn legal and governance requirements into enforceable system behavior so that the platform can block, allow, or conditionally restrict outreach and data usage decisions consistently across modules.

---

## 2. Goals

The Configure Compliance Settings design must achieve the following goals:

- Allow admins to define tenant-level communication compliance policies.
- Enforce CRM opt-out preferences before outbound email or call actions are executed.
- Support regional policy handling, including GDPR and CCPA-oriented rules.
- Respect consent, tenant isolation, and client-controlled data usage boundaries.
- Provide centralized policy evaluation points so enforcement is consistent across all channels.
- Maintain a complete audit trail for policy creation, update, activation, deactivation, and enforcement outcomes.
- Prevent restricted outreach from being executed even if a downstream workflow attempts it.
- Expose clear denial reasons for UI, logs, support, and admin review.
- Keep policy enforcement deterministic, traceable, and safe under retries.

---

## 3. Non-Goals

This TDD does not cover:

- Revenue Graph entity linking
- Data Cloud export implementation
- Full legal interpretation of GDPR, CCPA, or other regulations
- Contract management workflows
- Cookie consent systems for public websites
- Security incident response processes
- Transcript-level compliance monitoring of call content

If a future feature scans conversations for regulated language or policy violations during calls, that belongs in a separate compliance monitoring or QA-related TDD.

---

## 4. Feature Summary

Configure Compliance Settings is the feature that allows admins to configure email and call compliance rules so that sales outreach follows privacy regulations and internal governance constraints. It enforces communication restrictions based on CRM opt-out data and regional policies, and the broader architecture treats it as a cross-cutting governance layer applied across outreach, data usage, tenant isolation, and client-consent boundaries.

The feature has five main responsibilities:

1. **Policy configuration**  
   Admins define tenant-specific rules for outreach restrictions and governance behavior.

2. **Policy evaluation**  
   Before an email send, call action, workflow step, or related outbound action executes, the platform evaluates whether the action is allowed.

3. **Consent and opt-out enforcement**  
   CRM opt-out records, consent state, and lawful communication restrictions are checked before action execution.

4. **Regional governance handling**  
   Region-specific rules such as GDPR- or CCPA-driven restrictions influence communication permission and data usage behavior.

5. **Audit and traceability**  
   Every policy change and every blocked or allowed decision must be explainable through logs and audit records.

---

## 5. Business Value

Revenue platforms create risk when they automate outreach without governance checks. A rep may unknowingly email an opted-out contact, trigger a workflow in a restricted region, or continue using data after consent has changed. Configure Compliance Settings reduces that risk by moving privacy and communication controls from tribal knowledge into enforceable software behavior.

This creates value in several ways:
- Reduced legal and operational risk
- Better trust with enterprise customers
- Safer workflow automation
- Less manual checking by reps and RevOps
- Stronger audit readiness
- Clear customer ownership over how their data is used

---

## 6. Users and Consumers

### Primary admin users
- Tenant admins
- RevOps managers
- Security/compliance operations users

### Primary runtime consumers
- Email Composer
- Workflow Automation
- Orchestrate
- future call or dial actions
- admin preview and validation flows
- background job processors that enqueue outreach

### Secondary consumers
- Audit log viewers
- Support tooling
- customer success operations
- internal reporting dashboards

---

## 7. Scope

### In scope
- Policy configuration UI/backend model support
- Tenant-level policy storage and activation
- CRM opt-out enforcement
- Region-based communication restrictions
- Consent and lawful-usage gates where applicable
- Enforcement at email and call decision points
- Audit logging for policy changes
- Audit logging for enforcement outcomes
- Read APIs for policy status and evaluation diagnostics
- Safe default-deny behavior when critical compliance data is unavailable

### Out of scope
- Public legal advisory logic
- Manual legal review workflows
- third-party DLP suites
- in-call speech compliance scoring
- warehouse deletion execution
- custom contract clause management per enterprise MSA

---

## 8. Architecture Ownership

| Area | Owner | Notes |
|---|---|---|
| Policy configuration model | Platform Core / Governance | Primary owner |
| CRM opt-out sync and enforcement data | CRM Integration + Platform Core | Shared dependency |
| Outreach-time email restriction checks | Sales Engagement + Platform Core | Platform Core owns rule engine, Sales Engagement calls it |
| Call restriction checks | Platform Core + future calling layer | Enforcement point before call execution |
| Consent log storage | Compliance schema / Platform Core | Shared governance record |
| Audit logging | Platform Core | Shared service |
| Tenant isolation controls | Platform Core | Enforced everywhere |

---

## 9. Functional Requirements

### FR-1 Admin policy configuration
The system shall allow authorized admin or RevOps users to create, update, activate, deactivate, and review tenant-specific compliance policies for outreach and data usage.

### FR-2 CRM opt-out enforcement
The system shall check CRM opt-out records before any outbound email send, call action, or workflow-triggered communication is executed.

### FR-3 Regional policy handling
The system shall evaluate regional rules based on contact, account, tenant, or configured jurisdiction signals and apply the correct policy behavior for that region.

### FR-4 Policy evaluation service
The platform shall expose a centralized policy evaluation service that can answer whether a planned action is allowed, blocked, or conditionally restricted.

### FR-5 Outreach-time enforcement
Email and call actions must be checked at runtime immediately before execution, not only at configuration time.

### FR-6 Audit logging
All policy changes and all policy enforcement outcomes shall be logged with actor, timestamp, tenant, action type, and decision reason.

### FR-7 Consent-sensitive data usage
If tenant policy or customer consent prohibits certain data usage patterns, the platform shall block those actions and log the reason.

### FR-8 Tenant isolation
All policy records, opt-out records, consent logs, and enforcement results must remain tenant-scoped and protected by RLS and service-level checks.

### FR-9 Safe failure mode
If compliance-critical data is unavailable during action execution and the configured rule requires it, the system shall fail closed and block the action.

### FR-10 Explainability
Blocked actions must return clear reason codes suitable for UI display, logs, support review, and audit records.

---

## 10. Non-Functional Requirements

### Performance
- Policy evaluation for runtime outreach must be low-latency so it does not noticeably slow user-triggered sends.
- Bulk workflow evaluation must support queue-based throughput without bypassing checks.

### Reliability
- No outreach action may skip compliance evaluation due to retry behavior, async race conditions, or partial failure.
- Evaluation and logging must be idempotent for repeated attempts.

### Security
- Only authorized roles may create or change policies.
- Policy evaluation endpoints must be authenticated and tenant-scoped.
- Audit records must be immutable or append-only where required by platform standards.

### Scalability
- The design must support tenant-specific policies without requiring code forks per customer.
- Regional policies must be data-driven, not hardcoded per client.

### Observability
- Block/allow decision counts, error rates, missing data rates, and policy lookup failures must be measurable and alertable.

---

## 11. Policy Model Overview

Configure Compliance Settings should be designed as a policy-driven control system rather than a set of scattered flags. A policy contains metadata, scope, activation state, configuration values, and evaluation rules that runtime modules consult before performing communication or governed data actions.

### Core policy concepts
- **Policy**: A tenant-defined governance rule set
- **Policy type**: Email, call, consent, region, retention, training-usage, etc.
- **Scope**: Tenant-wide, region-specific, channel-specific, workflow-specific
- **Activation state**: Draft, active, inactive, archived
- **Evaluation result**: Allow, block, allow-with-warning, require-review
- **Reason code**: Structured explanation for decision outcomes

### Example policy categories
- Email opt-out enforcement
- Call opt-out enforcement
- Region-based outreach restrictions
- Consent-required usage restrictions
- Data usage restrictions for AI or workflow actions
- Quiet-time or allowed-contact-window policies if later introduced

---

## 12. Compliance Data Sources

The policy engine may rely on several data sources.

### 12.1 CRM opt-out records
These records indicate that a contact should not be contacted through certain channels. They are a primary enforcement source for outreach decisions.

### 12.2 Consent logs
Consent grant and revocation records provide evidence of whether a contact or customer has permitted certain categories of data use or communication.

### 12.3 Regional policy definitions
These define which rule families apply to which geographies or legal contexts, such as GDPR- or CCPA-oriented handling.

### 12.4 Tenant policy configuration
Tenant admins define how the platform should interpret and enforce allowed actions for their organization.

### 12.5 Contact and account context
Region, account owner, communication channel, and CRM state may affect evaluation outcomes.

### 12.6 System action context
The engine must know what action is being attempted:
- email send
- scheduled email
- workflow-generated outreach
- task recommendation
- call initiation
- contact import usage
- AI training usage if governed by consent policy

---

## 13. Admin Configuration Model

### 13.1 Admin capabilities
Authorized admins should be able to:
- create a new compliance policy
- edit an existing policy
- activate or deactivate a policy
- test or preview policy behavior
- assign rule scope by region or channel
- define fallback behavior when data is missing
- review past changes
- inspect enforcement logs

### 13.2 Suggested configuration fields
- Policy name
- Policy type
- Description
- Region or jurisdiction scope
- Channel scope (`email`, `call`, `workflow`, `data_usage`)
- Default action (`allow`, `block`, `review`)
- Opt-out enforcement enabled flag
- Consent required flag
- Missing data fallback (`allow`, `block`, `review`)
- Active status
- Effective from / effective until
- Created by / updated by

### 13.3 Example policy object
```json
{
  "policyId": "pol_001",
  "tenantId": "tenant_001",
  "name": "EU Outreach Restrictions",
  "policyType": "regional_outreach",
  "region": "EU",
  "channelScope": ["email", "call"],
  "optOutEnforced": true,
  "consentRequired": true,
  "missingDataFallback": "block",
  "defaultAction": "block",
  "isActive": true
}
```

---

## 14. CRM Opt-Out Enforcement

CRM opt-out enforcement is one of the most important parts of this feature. Before any outbound communication is executed, the platform must check whether the target contact has opted out in the CRM or related compliant source.

### Enforcement rules
- If a contact is marked opted out for email, email send must be blocked.
- If a contact is marked opted out for call, call initiation must be blocked.
- Workflow-generated actions must perform the same checks as manual actions.
- Bulk sends must evaluate each target separately.
- Cached opt-out data must have freshness and invalidation rules.
- If the source of truth is unavailable and policy says fail closed, the action must be blocked.

### Example blocked result
```json
{
  "decision": "block",
  "reasonCode": "CRM_OPTOUT_EMAIL",
  "message": "Contact is marked as opted out for email communication.",
  "policyId": "pol_email_default"
}
```

### Operational note
Opt-out enforcement must happen both:
- when building recipient lists or workflow candidates, and
- immediately before final send or call execution

This double-check reduces risk from stale lists and delayed jobs.

---

## 15. Regional Policy Handling

The system must support region-specific behavior because communication permissions and customer rights vary by geography and legal framework.

### Initial supported rule families
- GDPR-oriented restrictions
- CCPA-oriented restrictions

### Region resolution inputs
Region may be inferred or configured from:
- contact country or state
- account billing region
- tenant-configured jurisdiction rules
- CRM legal fields
- import metadata or customer master data

### Design rules
- Policies should be data-driven and extensible.
- The runtime engine should not hardcode one-off enterprise logic.
- If multiple regions appear applicable, precedence rules must be defined.
- The final evaluation result must record which region policy was applied.

### Example precedence
1. Contact-specific legal region
2. Account legal region
3. Tenant default region
4. Global fallback policy

---

## 16. Policy Evaluation Engine

The policy evaluation engine is the core runtime service that determines whether a planned action is allowed.

### Inputs
- Tenant ID
- Actor ID
- Target contact or account
- Channel (`email`, `call`, etc.)
- Planned action type
- Region context
- CRM opt-out state
- Consent state
- Active policy set
- request timestamp

### Outputs
- Decision
- Reason code
- Matched policy
- Applied region
- Required next step, if any
- Audit payload

### Evaluation outcomes
- `allow`
- `block`
- `allow_with_warning`
- `require_review`

### Example evaluation request
```json
{
  "tenantId": "tenant_001",
  "actorId": "user_001",
  "actionType": "email_send",
  "channel": "email",
  "contactId": "ct_001",
  "accountId": "acct_001",
  "region": "EU"
}
```

### Example evaluation response
```json
{
  "decision": "block",
  "reasonCode": "GDPR_CONSENT_REQUIRED",
  "policyId": "pol_001",
  "appliedRegion": "EU",
  "auditRequired": true
}
```

---

## 17. Policy Evaluation Points

Compliance checks must happen at well-defined enforcement points across the platform.

### 17.1 Email Composer
Before an email is sent or scheduled, the system must evaluate:
- CRM email opt-out
- region policy
- consent-sensitive restrictions
- missing-data fallback behavior

### 17.2 Workflow Automation
Before a workflow step sends an email, assigns a communication task, or triggers outreach, the step must call the policy engine.

### 17.3 Orchestrate / guided plays
Recommended next actions involving outreach must be filtered or marked if blocked by policy.

### 17.4 Call initiation or call tasking
Before a call action is started or queued, the system must evaluate call restrictions and region rules.

### 17.5 Bulk operations
Bulk sends and sequence-style actions must evaluate each target individually, not only the parent job.

### 17.6 Data usage gates
If a tenant disallows certain AI or workflow uses without consent, the relevant job must call policy evaluation before execution.

---

## 18. Outreach-Time Enforcement Design

The architecture must treat compliance evaluation as a runtime gate, not a one-time admin check.

### Required enforcement pattern
1. User or workflow requests communication action
2. Runtime service resolves target(s)
3. Policy engine evaluates action per target
4. Decision returned
5. Allowed actions proceed
6. Blocked actions are stopped and logged
7. UI or workflow receives structured reason

### Why this matters
Configuration-time validation is not enough because:
- opt-out state can change after list creation
- region or consent data may update
- delayed workflows may run hours later
- retries must still re-check permission

### Fail-closed situations
The system should block actions when:
- contact compliance state cannot be loaded
- policy configuration is invalid or missing but required
- tenant context is missing
- data freshness rules are violated and fallback says block

---

## 19. Audit and Policy-Change Logging

Auditability is mandatory because this feature affects legal and governance-sensitive actions.

### Log categories
- Policy created
- Policy updated
- Policy activated/deactivated
- Policy deleted or archived
- Enforcement allow decision
- Enforcement block decision
- Missing-data fallback triggered
- Consent change received
- CRM opt-out sync update

### Required audit fields
- Audit record ID
- Tenant ID
- Actor ID or system actor
- Action type
- Policy ID
- Target entity if applicable
- Timestamp
- Old value / new value for changes
- Decision result
- Reason code
- Correlation ID

### Example audit record
```json
{
  "auditId": "aud_001",
  "tenantId": "tenant_001",
  "actorId": "user_admin_01",
  "actionType": "policy_update",
  "policyId": "pol_001",
  "changedFields": ["missingDataFallback", "isActive"],
  "timestamp": "2026-05-05T10:00:00Z"
}
```

---

## 20. Data Model

The architecture already identifies a compliance-oriented schema that stores governance records such as consent logs, CRM opt-outs, compliance policies, data export requests, and deletion requests. This feature mainly works with that compliance schema.

### 20.1 Core tables
- `consent_logs`
- `crm_optouts`
- `compliance_policies`
- `auditlogs` or equivalent shared audit table
- optional `compliance_evaluation_events`
- optional `policy_versions`

### 20.2 Suggested table purposes

#### `consent_logs`
Stores consent grant and revocation records per tenant and contact.

#### `crm_optouts`
Stores CRM opt-out state used for communication enforcement.

#### `compliance_policies`
Stores tenant policy definitions for regional, channel, and governance rules.

#### `policy_versions`
Stores versioned snapshots of policies to support change history.

#### `compliance_evaluation_events`
Stores runtime policy decision history for analytics and diagnostics.

### 20.3 Example columns

#### `compliance_policies`
- `policy_id`
- `tenant_id`
- `region`
- `policy_type`
- `configuration`
- `is_active`
- `created_by`
- `created_at`
- `updated_at`

#### `crm_optouts`
- `optout_id`
- `tenant_id`
- `contact_id`
- `email`
- `channel`
- `opted_out_at`
- `optout_source`

#### `consent_logs`
- `log_id`
- `tenant_id`
- `contact_id`
- `consent_type`
- `granted_at`
- `revoked_at`
- `source`

All tables must include tenant-safe indexing and RLS enforcement.

---

## 21. API Design

Representative APIs for admin and runtime use:

### 21.1 Admin APIs
- `GET /api/v1/admin/compliance/policies`
- `POST /api/v1/admin/compliance/policies`
- `PATCH /api/v1/admin/compliance/policies/:id`
- `POST /api/v1/admin/compliance/policies/:id/activate`
- `POST /api/v1/admin/compliance/policies/:id/deactivate`

### 21.2 Evaluation APIs
- `POST /api/v1/compliance/evaluate`
- `POST /api/v1/compliance/evaluate/bulk`

### 21.3 Audit APIs
- `GET /api/v1/admin/compliance/audit-logs`
- `GET /api/v1/admin/compliance/evaluations`

### 21.4 API rules
- Admin APIs require admin or approved RevOps role.
- Evaluation APIs require authenticated system or module callers.
- Every request must carry tenant context.
- Responses must use structured reason codes.
- Bulk APIs must return per-target decisions.

---

## 22. Event Contracts

### 22.1 Events consumed
Representative inbound events may include:
- `crm.optout.updated`
- `consent.updated`
- `policy.changed`
- `workflow.action.requested`
- `email.send.requested`
- `call.action.requested`

### 22.2 Events emitted
Representative outbound events may include:
- `compliance.policy.updated`
- `compliance.evaluation.completed`
- `outreach.blocked.compliance`
- `consent.restriction.applied`

### 22.3 Example evaluation-completed event
```json
{
  "eventId": "evt_cmp_001",
  "tenantId": "tenant_001",
  "actionType": "email_send",
  "targetContactId": "ct_001",
  "decision": "block",
  "reasonCode": "CRM_OPTOUT_EMAIL",
  "policyId": "pol_email_default",
  "evaluatedAt": "2026-05-05T10:10:00Z"
}
```

### 22.4 Event rules
- Events must be idempotent.
- Block decisions must be loggable even on retries.
- Event schemas must be versioned.
- Consumers must not infer permission without explicit evaluation.

---

## 23. Roles and Permissions

### Allowed policy administrators
- `admin`
- `revops` with granted configuration permission

### Runtime access
- Sales Engagement services may call evaluation APIs.
- Workflow services may call evaluation APIs.
- Frontend clients should not bypass backend evaluation for enforcement-critical decisions.

### Important rule
A rep may see that an action is blocked, but only authorized roles may change the policy that caused the block.

---

## 24. Security and Tenant Isolation

This feature is especially sensitive because it controls who may be contacted and how customer data may be used.

### Requirements
- Every compliance table includes `tenant_id`.
- RLS must be enabled and forced on compliance tables.
- Application middleware must reject requests without tenant context.
- JWT claims must carry tenant identity and role.
- Policy records are tenant-owned and not globally shared.
- Cross-tenant policy reads are forbidden.
- Audit logs must never expose secrets or unrelated tenant data.

### Governance rules
- No action may proceed if its compliance state belongs to a different tenant.
- AI services may not override compliance decisions.
- Consent-sensitive data usage must be blocked if explicit consent is absent and tenant policy requires it.

---

## 25. Failure Handling

### Failure categories
- CRM opt-out source unavailable
- consent source unavailable
- invalid or conflicting policy configuration
- missing tenant context
- policy engine timeout
- audit write failure
- stale compliance cache

### Handling strategy
- Missing tenant context: reject immediately
- Invalid policy config: block evaluation and surface admin error
- Upstream compliance data unavailable: follow fail-open or fail-closed setting, default recommended is fail-closed for outbound communication
- Audit write failure on blocked decision: retry and alert
- Cache stale beyond allowed threshold: re-fetch or block

---

## 26. Observability

### Metrics
- Total evaluations
- Allow rate
- Block rate
- Review-required rate
- Reason-code frequency
- CRM opt-out check failures
- Consent lookup failures
- Policy lookup latency
- Evaluation latency
- Missing-data fallback count

### Logs
- Correlation ID
- Policy matched
- Region applied
- Data sources consulted
- Final decision
- Reason code
- cache freshness metadata

### Alerts
- Sudden drop in evaluation volume
- Spike in policy engine failures
- Spike in missing compliance data
- Audit log write failures
- CRM opt-out sync failures
- Unusually high blocked-action rates after policy change

---

## 27. Admin Experience Notes

The admin console should help users understand policy impact before they break live workflows.

### Recommended UI behaviors
- Show active vs inactive policies
- Show channel and region scope clearly
- Support draft before activation
- Show human-readable examples of blocked scenarios
- Show last modified by and last modified time
- Show recent enforcement counts per policy
- Warn before activating a stricter policy that may block active workflows

These are product design notes, but they help ensure the technical model remains understandable to non-engineering admins.

---

## 28. Testing Strategy

### Unit tests
- Email opt-out block rule
- Call opt-out block rule
- Region precedence resolution
- Missing-data fallback behavior
- Consent-required policy behavior
- policy activation and deactivation
- reason-code generation

### Integration tests
- CRM opt-out update changes runtime evaluation
- Policy edit is reflected in evaluation service
- Workflow action calls policy engine before execution
- audit log written for block decision
- RLS enforcement on compliance tables
- role-based restriction on admin APIs

### End-to-end tests
- Admin creates policy, activates it, and sees block on email send
- Opted-out contact blocked from workflow-generated send
- EU contact blocked without required consent under configured rule
- Policy change produces audit entry
- Missing compliance data triggers fail-closed block
- Blocked action returns readable reason in UI/API

### Test data requirements
- Multi-tenant fixtures
- contacts across multiple regions
- opted-in and opted-out contacts
- consent granted and revoked examples
- policies with conflicting scopes
- stale cache scenarios
- bulk-send evaluation cases

---

## 29. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Outreach sent to opted-out contact | Legal and trust risk | Runtime enforcement, CRM sync freshness checks, fail-closed behavior |
| Policy rules become too fragmented | Hard to reason about decisions | Central evaluation engine, policy precedence rules, versioning |
| Cross-tenant policy leakage | Severe security issue | Mandatory tenant context, RLS, API authorization |
| Workflow bypasses policy engine | Unsafe automation | Enforcement gate required in all outbound execution paths |
| Missing data causes accidental allow | Governance breach | Configurable fallback, recommended fail-closed for communication |
| No audit trace for decisions | Poor support and audit readiness | Mandatory audit logging and correlation IDs |
| Too much hardcoded legal logic | Maintenance burden | Data-driven regional policy model |

---

## 30. Open Decisions

The following points may need Tech Lead and PM review:

1. Whether `allow_with_warning` is supported in Phase 1 or only `allow` / `block`
2. Exact set of roles allowed to edit policies
3. Whether low-confidence region resolution should default to tenant region or block
4. Whether bulk workflows stop on first blocked contact or continue per-target
5. Whether compliance evaluation events are stored in a dedicated table or shared audit logs only
6. Whether consent-sensitive AI training governance is handled here or split into a separate policy family
7. Whether policy version rollback is exposed in admin UI

---

## 31. Implementation Notes

- Product services, policy APIs, and enforcement logic remain in TypeScript.
- Any AI assistance for region inference or metadata normalization must not become the final authority for compliance decisions.
- Final compliance allow/block decisions must remain deterministic in the product service.
- Policy data should be configuration-driven and version-aware.
- All enforcement-critical paths must call the policy engine before action execution.
- No module may assume a communication action is allowed without explicit evaluation.

---

## 32. Example Runtime Scenario

A tenant admin enables an active policy requiring email opt-out enforcement and stricter consent handling for EU contacts. Later, a seller tries to send an email from Email Composer to a contact in the EU. The send service calls the compliance evaluation API, which checks tenant policy, region, CRM opt-out state, and consent records. The contact is missing the required consent state, so the decision returns `block` with the reason code `GDPR_CONSENT_REQUIRED`. The email is not sent, the UI shows a clear explanation, and an audit record is written.

---

## 33. Acceptance Criteria

The feature is considered complete when all of the following are true:

- Admins can create, edit, activate, and deactivate tenant-scoped compliance policies.
- CRM opt-out checks are enforced before email and call actions execute.
- Regional policy handling supports GDPR- and CCPA-oriented rule families.
- Runtime policy evaluation returns structured allow/block decisions with reason codes.
- Workflow and manual outreach paths both call the same policy engine.
- Policy changes and enforcement outcomes are audit logged.
- Compliance data remains tenant-scoped and protected by RLS and service-layer checks.
- Fail-closed behavior is available for compliance-critical missing-data scenarios.

---

## 34. References

- Product mapping for Configure Compliance Settings under M10 Data & Compliance
- Compliance feature definition: admins configure email and call compliance rules using CRM opt-out data and regional policies
- System architecture guidance: cross-cutting governance, CRM opt-out enforcement, GDPR/CCPA handling, tenant isolation, consent constraints, and compliance schema ownership


