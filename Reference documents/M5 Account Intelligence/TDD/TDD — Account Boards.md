# TDD — Account Boards

## 1. Document Control

| Field | Value |
|---|---|
| Document Title | Technical Design Document — Account Boards  |
| Feature Name | Account Boards  |
| Product Module Name | M5 Account Intelligence  |
| Architecture Owner Module | M-07 Deal and Account Management  |
| Lifecycle Stage | Execute |
| Version | v1.0-draft  |
| Status | Draft  |
| Owner | Tech Lead / M-07 Module Owner  |
| Reviewers | Product Manager, Backend Lead, Frontend Lead, QA Lead, AI Lead  |
| Last Updated | 2026-04-30  |

### Ownership note

This document uses two names that must not be confused. **M5 Account Intelligence** is the product-facing module name used in planning and packaging, while the implementation ownership in the architecture sits under **M-07 Deal and Account Management**.   
For developers, this means Account Boards should be described as part of the M5 product scope, but built and governed using M-07 service boundaries, APIs, tables, security rules, and event patterns. 

---

## 2. Purpose

### Business problem

Revenue teams often need account status, CRM history, engagement activity, recent conversation signals, and AI-generated context to make decisions, but this information is spread across CRM tools, call analysis tools, email systems, and manual notes.   
This causes slow account reviews, missed renewal risks, weak expansion planning, and inconsistent prioritization across Sales, Customer Success, and RevOps teams. 

### What Account Boards does

Account Boards provides a centralized account workspace that gives go-to-market teams a unified view of all customer accounts.   
It combines CRM data, engagement activity, conversation insights, and AI-generated context into one structured board so teams can prioritize accounts, track engagement, monitor health, and decide next actions without switching tools. 

### Why it belongs in Account Intelligence

This feature belongs in **M5 Account Intelligence** because its main job is to help teams manage accounts strategically rather than manage individual calls, single deals, or forecasting periods.   
At architecture level, it fits under **M-07 Deal and Account Management** because M-07 is responsible for the unified account workspace and pipeline-facing execution experiences. 

### Business value

Account Boards supports strategic account management for renewals, expansions, and health tracking by surfacing the most important account signals in one place.   
The feature reduces context-switching, improves prioritization, and helps teams act faster using AI-generated account context and account-level engagement signals. 

---

## 3. Scope

### In scope

- Account board list view for tenant-scoped accounts with filters, sorting, and saved user configuration. 
- Account detail view showing linked contacts, linked deals, activities, engagement score, renewal signals, and AI-generated account brief. 
- Consumption of account-linked CRM context, activities, conversation-derived signals, and M-06 account brief outputs. 
- Computation and display of account health indicators, prioritization cues, and recommended next actions for workspace use. 
- Board refresh behavior triggered by user request, scheduled refresh, and upstream signal changes. 

### Out of scope

- Forecast generation, forecast rollups, and forecast board logic owned by M-09. 
- Workflow orchestration, branching automations, and play execution owned by M-08. 
- Deal-board-specific stage management, deal pipeline grouping, and deal-only health logic except where deal data is shown as account context. 
- CRM ingestion, entity linking, and raw AI summarization logic, which remain owned by upstream modules. 

### Assumptions

- CRM accounts, contacts, deals, and activities are already synced and linked through upstream modules before Account Boards is used. 
- M-06 can provide account-level brief data through the public insights API when available. 
- M-07 remains a read-heavy UI-serving module and should not directly own AI model execution. 
- The platform runs in a shared multi-tenant PostgreSQL model with row-level security and tenant-scoped access. 

### Upstream dependencies

| Upstream Module | Dependency | Why Needed |
|---|---|---|
| M-03 Revenue Graph | Accounts, contacts, deals, activities, linked entity context  | Account Boards needs account-linked CRM and activity context to build rows and detail views.  |
| M-05 Smart Tracking and Search | Tracker detections and conversation-derived risk/activity signals  | These signals help identify account health issues and renewal/engagement warnings.  |
| M-06 Insight Generation | Account briefs and AI-generated account context  | Account Boards shows AI account summaries and context blocks inside the workspace.  |
| M-02 Sales Engagement | Email sent activity signals  | Outbound engagement updates help refresh activity recency and engagement rollups.  |

### Downstream consumers

Account Boards is primarily a user-facing feature and does not act as a major platform publisher.   
M-07 is described as a read-heavy UI-serving module and emits no standard platform events for Account Boards, except internal update-request behavior such as deal stage update requests on the deal side. 

---

## 4. Users and Triggers

### Primary users

- Sales teams managing renewals, expansions, and account prioritization. 
- Customer Success teams monitoring account health and ongoing engagement. 
- RevOps teams reviewing account portfolio coverage, saved views, and operational consistency. 

### Entry points

- Account board page load from the main application workspace. 
- Account detail page open from a selected board row. 
- Manual board refresh initiated by a user. 
- Background refresh after upstream signal or brief changes. 

### Trigger types

- **User-requested load:** user opens the account board or account detail page. 
- **Manual refresh:** user clicks refresh for board or account detail. 
- **Scheduled refresh:** periodic recomputation of engagement and stale signal status. 
- **Event-driven refresh:** upstream data changes mark row/detail data stale and enqueue refresh. 

### Preconditions

- Tenant authentication and RBAC checks must pass before any account data is returned. 
- The account must exist in tenant-scoped linked records from M-03. 
- If AI account brief data is unavailable, the board must still load base account, activity, and engagement context with partial-state indicators. 

### Refresh behavior summary

The board loads on user request, but it should not recompute all account intelligence synchronously on every read because M-07 is a read-heavy module designed to serve UI efficiently from stored and aggregated data.   
Instead, the board should read from M-07-owned configs and score tables, consume upstream linked data through public APIs, and use stale markers plus async refresh jobs when upstream insight changes arrive. 

---

## 5. Functional Flow

### Happy path

1. User opens **Account Board** in the frontend.   
2. Frontend calls `GET /api/v1/deal-management/account-boards` with tenant and user auth context.   
3. M-07 loads the user’s account board config from `account_board_configs`, including visible columns and saved filters.   
4. M-07 fetches tenant-scoped account master data, linked activities, linked deals, and related contacts using permitted public access patterns from M-03 data surfaces.   
5. M-07 loads latest `engagement_scores`, `renewal_signals`, and latest account brief references where available.   
6. M-07 assembles each board row using CRM fields, activity rollups, engagement score, renewal indicators, and AI account summary snippets.   
7. Frontend renders board rows with filters, sorting, health indicator, prioritization cues, and next-action hints.   
8. When user opens an account row, frontend calls `GET /api/v1/deal-management/account-boards/:id`.   
9. M-07 returns account detail data including contacts, deals, activities, engagement score history, renewal signals, and AI-generated account brief. 

### Alternate paths

- If account brief is stale but still usable, M-07 returns the latest stored brief with a `stale=true` metadata flag and schedules a background refresh. 
- If engagement score is stale, M-07 returns the latest available score and recomputes asynchronously. 
- If some activity sources are delayed, the board still loads with partial activity rollups and a freshness timestamp. 

### Failure paths

- If CRM-linked account context is missing, the row is excluded from board results or shown in a degraded state depending on tenant configuration and minimum data rules. 
- If account detail is requested for an account outside tenant scope or without RBAC permission, the API returns authorization failure without data leakage. 
- If M-06 brief retrieval fails, the board still returns non-AI fields and a fallback “AI context unavailable” state. 

### Retry behavior

Async refresh jobs must be idempotent and use queue retry behavior consistent with platform patterns, including retry attempts and dead-letter handling for failed jobs.   
When repeated upstream events hit the same account in a short period, refresh should be debounced or deduplicated so one account is not recomputed many times unnecessarily. 

---

## 6. Inputs and Outputs

### Inputs

| Input Type | Source | Usage |
|---|---|---|
| Account master data | M-03 Revenue Graph / CRM-linked account records  | Base board row identity and account attributes.  |
| Contacts | M-03 linked contact data  | Account detail panel and relationship context.  |
| Deals | M-03 linked deal data  | Expansion/renewal context and account-level rollup.  |
| Activities | Unified activities table / M-03 linked activities  | Engagement recency, activity counts, timeline rendering.  |
| Tracker/risk signals | M-05 detections and related signals  | Health warnings and signal explanations.  |
| Account brief | M-06 `GET /api/v1/insights/accounts/:id/brief`  | AI-generated account summary and health context block.  |
| Email activity | M-02 `email.sent` effects and linked activity rows  | Outbound activity recency and engagement mix.  |

### Derived signals

- Latest engagement score and score trend from `engagementscores`. 
- Renewal risk/opportunity signal set from `renewalsignals`. 
- Last activity timestamp and activity gap duration from linked activities. 
- Health category derived from engagement, renewal signals, AI brief health indicators, and activity freshness. 
- Prioritization state derived from health risk, renewal timing, expansion indicators, and recent engagement trajectory. 

### Output records

#### Board row output

Each board row should return the minimum schema below so frontend and backend stay aligned. 

| Field | Type | Description |
|---|---|---|
| accountId | UUID | Internal tenant-scoped account identifier.  |
| crmAccountId | string \| null | CRM account reference if available.  |
| accountName | string | Display name for board row.  |
| ownerUserId | UUID \| null | Account owner if mapped.  |
| segment | string \| null | Segment or tier from CRM/account model.  |
| industry | string \| null | CRM-derived industry value.  |
| arr | number \| null | ARR or account value if available.  |
| lastActivityAt | datetime \| null | Most recent linked activity timestamp.  |
| engagementScore | number \| null | Latest normalized score 0.0 to 1.0.  |
| engagementLabel | string \| null | e.g. healthy, watch, low engagement.  |
| healthStatus | string | Overall account health category.  |
| renewalSignals | array | Active renewal-related signals for the account.  |
| openDealCount | number | Linked open deals count.  |
| primaryContacts | array | Small contact summary list for row preview.  |
| aiContextSummary | string \| null | Short latest AI account context snippet.  |
| nextBestAction | string \| null | Recommended next action text shown in board.  |
| dataFreshness | object | Freshness timestamps and stale flags for row sections.  |

#### Account detail output

The detail response includes the board row fields plus:
- Full account brief. 
- Contacts list. 
- Linked deals summary. 
- Activity timeline. 
- Engagement score history and components. 
- Renewal signal details with source references when allowed. 
- Recommended next actions with explanation metadata. 

### APIs consumed

- `GET /api/v1/deal-management/account-boards` for board view. 
- `GET /api/v1/deal-management/account-boards/:id` for account detail view. 
- `GET /api/v1/insights/accounts/:id/brief` from M-06 for AI account brief. 
- Public M-03 account/deal/activity read patterns for linked account context. 

### APIs exposed

- `GET /api/v1/deal-management/account-boards` 
- `GET /api/v1/deal-management/account-boards/:id` 
- `PATCH /api/v1/deal-management/account-boards/config` for user configuration, if implemented alongside parity with deals config pattern. This follows the existing config ownership model in M-07 even though the SAD explicitly lists account board config storage more than explicit patch endpoints. 

### Events emitted

No standard platform events are emitted by Account Boards because M-07 is primarily a read-heavy UI-serving module.   
If internal refresh jobs are introduced, they should use internal queue messages only and must not become public cross-module contracts without architecture review. 

---

## 7. Data Model

### Tables used

| Table | Owner | Purpose |
|---|---|---|
| `account_board_configs` | M-07  | Per-user board column/filter configuration.  |
| `engagement_scores` | M-07  | Historical account engagement score log with components.  |
| `renewal_signals` | M-07  | Account-level renewal risk/opportunity signal history.  |
| `account_status_overrides` | M-07 | Persists user-driven execution state (e.g., manual Next Action overrides). |
| `accounts` | M-03 with M-07 consumption  | Master account records synced from CRM.  |
| `contacts` | M-03 with M-07 consumption  | Master contact records linked to account.  |
| `accountcontacts` | M-03 with M-07 consumption  | Account-contact relationships.  |
| `activities` | M-03 with M-07 consumption  | Unified call, email, meeting, and related activity log.  |
| `deals` | M-07 / linked via M-03 context  | Linked deal context for account detail.  |
| `accountbriefs` | M-06  | AI-generated account summary and health signals.  |

### Fields owned by M-07 for Account Boards

- `account_board_configs.visiblecolumns` 
- `account_board_configs.filters` or `defaultfilters` depending on final schema normalization. 
- `engagement_scores.score` 
- `engagement_scores.components` 
- `engagement_scores.computedat` 
- `renewal_signals.signaltype` 
- `renewal_signals.detectedat` 
- `renewal_signals.sourcecallid` where available. 

### Aggregates and cache views

To keep board reads fast, M-07 should use precomputed or latest-known account engagement score records rather than recomputing raw activity math on every request.   
A lightweight read model or SQL view may be used to join latest account score, latest brief metadata, recent activity timestamp, and active renewal signals into one row-serving structure, as long as ownership boundaries are not violated. 

### Validation rules

- Every row must include `accountId`, `tenantId` context, and `accountName`. 
- Scores must be normalized between 0.0 and 1.0. 
- A row must not expose data from another tenant under any condition. 
- AI context can be null, but must include freshness metadata when absent or stale. 
- If linked account data is insufficient for minimum rendering, the row must be filtered out or marked incomplete based on product rule. 

### Recompute strategy

Account health should be **stored and refreshed asynchronously**, not fully recomputed on every board read.   
The recommended strategy is:
- Store latest engagement score snapshots in `engagement_scores`. 
- Store renewal signals as append-only detections in `renewal_signals`. 
- Read latest M-06 account brief on demand or cache brief metadata locally with stale markers. 
- Recompute score/priority when important upstream changes happen or on scheduled background refresh. 

### Minimum board row schema

The backend contract for a board row must include:
`accountId, accountName, ownerUserId, segment, industry, arr, lastActivityAt, engagementScore, healthStatus, renewalSignals, openDealCount, aiContextSummary, nextBestAction, dataFreshness`. 

---

## 8. AI and Scoring Logic

### AI inputs consumed from upstream modules

- M-06 account brief summary text. 
- M-06 health signals and renewal indicators from `accountbriefs`. 
- M-05 tracker detections that imply account risk, silence, competitor presence, or other business-relevant patterns. 
- M-03 linked account, deal, and activity context that gives the AI outputs business grounding. 

### Engagement score inputs

Engagement score should combine a weighted set of account activity indicators such as:
- Recency of last customer interaction. 
- Count of recent meetings/calls/emails over configured windows. 
- Diversity of engagement across contacts and channels. 
- Presence or absence of recent meaningful conversation activity. 
- Decay factor when no new activities occur for a defined period. 

### Account health computation inputs

Overall account health should be based on:
- Latest engagement score. 
- Active renewal signals like low engagement, champion left, competitor mention, or other account-level warnings. 
- AI brief health indicators from M-06. 
- Number and state of linked open deals, when relevant to account execution context. 
- Activity freshness and trend compared with the previous scoring window. 

### Suggested health rules

This TDD recommends the following implementation-friendly rule set:
- **Healthy:** engagement score >= 0.75, no high-severity renewal signals, recent activity present.  
- **Watch:** engagement score 0.45 to 0.74, or one moderate renewal signal, or declining trend.  
- **At Risk:** engagement score < 0.45, or any high-severity renewal signal, or stale activity beyond threshold.  
These thresholds are product defaults and should be tenant-configurable later if RevOps customization is added. 

### Context summary rules

The board should show one short AI context block per account row and a richer block in account detail.   
Recommended row-level context block:
- 1-line account summary from latest M-06 account brief. 
- Top 1 to 3 health signals. 
- One suggested next action. 

Recommended detail-level context blocks:
- Account summary. 
- Health drivers. 
- Renewal indicators. 
- Expansion indicators if detected in signals/brief. 
- Recommended next actions. 

### Recommended next actions

Next actions shown in the workspace should be derived from a simple priority engine:
- If low engagement and no recent meeting, recommend re-engagement outreach. 
- If renewal signal exists and close date window is near, recommend renewal review. 
- If activity is strong and expansion indicators appear, recommend expansion planning. 
- If AI confidence is low, recommend manual review instead of prescriptive action. 

### Confidence and explanation handling

Every AI-derived summary or recommendation should carry:
- `confidenceScore` from upstream brief where available. 
- `explanations` array listing top contributing signals or components. 
- `sourceRefs` to activities/calls/signals when permissible. 

If confidence is below the accepted threshold, the UI should label the suggestion as low-confidence and avoid presenting it as a hard recommendation. 

---

## 9. Service and Integration Design

### Internal services involved

- **Frontend app** renders board and detail views using M-07 APIs. 
- **M-07 DealAccountModule** serves board responses and owns board configuration, engagement score records, and renewal signals. 
- **M-03 Revenue Graph** provides linked account, contact, deal, and activity context through approved access patterns. 
- **M-05 Smart Tracking** provides signal detections used for risk and health interpretation. 
- **M-06 Insight Generation** provides account briefs through its public API. 

### CRM dependencies

Account Boards depends on CRM-synced account, contact, deal, and activity data already normalized into platform structures.   
M-07 must not call CRM APIs directly for this feature; CRM interaction remains behind upstream ownership and linked data surfaces. 

### Revenue Graph or linked entity usage

Account Boards uses Revenue Graph-linked entity context so every activity, contact, and deal shown in the account workspace is already associated with the correct account.   
This avoids feature-local matching logic and keeps entity resolution inside the architecture layer where it belongs. 

### Public API contracts

#### GET `/api/v1/deal-management/account-boards`

Returns paginated account board rows using user config plus request filters. 

Suggested request params:
- `page`
- `pageSize`
- `sortBy`
- `sortOrder`
- `segment`
- `ownerUserId`
- `healthStatus`
- `renewalSignalType`
- `activityGapDays`
- `search`

Suggested response:
```json
{
  "rows": [
    {
      "accountId": "uuid",
      "accountName": "Acme Corp",
      "ownerUserId": "uuid",
      "segment": "Enterprise",
      "industry": "SaaS",
      "arr": 120000,
      "lastActivityAt": "2026-04-29T10:15:00Z",
      "engagementScore": 0.82,
      "healthStatus": "healthy",
      "renewalSignals": ["low_engagement"],
      "openDealCount": 2,
      "aiContextSummary": "Renewal on track but executive sponsor engagement is down.",
      "nextBestAction": "Schedule executive check-in this week.",
      "dataFreshness": {
        "activityAt": "2026-04-29T10:15:00Z",
        "scoreAt": "2026-04-30T02:00:00Z",
        "briefAt": "2026-04-30T02:05:00Z",
        "stale": false
      }
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 230
}
```

#### GET `/api/v1/deal-management/account-boards/:id`

Returns detailed account workspace payload with summary, contacts, deals, activities, signals, and AI context. 

### Boundary rule

M-07 must fetch or consume account-linked data only through events, public APIs, or approved shared read patterns documented in the architecture.   
It must **never** read another module’s internal tables by bypassing ownership rules, because the architecture explicitly forbids direct inter-module access to internals. 

### Fallback behavior

- If M-06 account brief is unavailable, return `aiContextSummary = null` and `aiContextState = unavailable`. 
- If M-05 signal source is delayed, keep last-known `renewalSignals` and mark signal freshness stale. 
- If activity join is incomplete, render counts from available activity types and attach a partial-data warning. 

---

## 10. Security and Compliance

### Tenant isolation

All reads and writes for Account Boards must remain tenant-scoped under the shared PostgreSQL multi-tenant model with row-level security.   
Every query must include tenant context injected by platform middleware such as `TenantInterceptor`, and no board response may contain cross-tenant IDs, names, or aggregate values. 

### RBAC and account access rules

Only authenticated users with the correct tenant role may view account board or account detail data.   
Role checks should support at least Sales, Customer Success, RevOps, Manager, and Admin patterns, with visibility constrained by tenant role definitions and account ownership rules where configured. 

### Audit logging

Changes to saved board configuration, manual refresh requests, and any explicit user-written actions in the account workspace should be written to immutable audit logs through Platform Core patterns.   
Read-only board views do not need per-row audit writes unless required by enterprise audit mode. 

### Sensitive data handling

- Do not expose encrypted integration credentials or internal system tokens in board responses. 
- Mask or omit sensitive contact data based on RBAC rules. 
- Show AI explanations only from authorized tenant-scoped sources. 
- Respect platform retention and compliance rules inherited from upstream modules. 

---

## 11. Error Handling

### Missing CRM account context

If the account exists in config or selection state but no linked CRM/account record is available, return `404` for detail or omit from board result set based on request type.   
This condition should also emit an observability signal for missing account-context joins. 

### Missing linked interaction data

If no activities or interactions are linked yet, the board should still render the account with:
- `lastActivityAt = null`
- `engagementScore = null` or default baseline
- `healthStatus = unknown` or `watch`
- `emptyStateReason = no_linked_activity`  
This keeps the workspace usable while making the data gap visible. 

### Stale account signals

If score, brief, or signal timestamps exceed freshness thresholds, M-07 should return the last-known values with stale markers and queue background refresh.   
The API should not block the user on a full recomputation unless explicitly requested for admin/debug use. 

### Partial board refresh rules

Partial refresh is allowed at section level:
- Refresh engagement score without waiting for brief regeneration. 
- Refresh renewal signals without recomputing full board config. 
- Refresh account brief independently from board row rendering. 

This prevents one stale subsystem from blocking the whole account board. 

### Retry and DLQ behavior for async refresh jobs

Refresh jobs must be idempotent per `tenantId + accountId + refreshType + version/freshnessKey`.   
Recommended queue behavior:
- Retry up to 3 times for transient failures. 
- Exponential backoff between retries. 
- Move permanently failing jobs to dead-letter queue. 
- Raise alert when DLQ volume crosses threshold. 

---

## 12. Observability

### Logs

Structured logs must include:
- `tenantId`
- `userId` when user-triggered
- `accountId`
- `requestId`
- `refreshType`
- `dataFreshness`
- `partialState`
- `errorCode` on failure  
These fields make board and detail issues debuggable without exposing sensitive content. 

### Metrics

Track at minimum:
- Board load latency. 
- Account detail load latency. 
- Stale data rate. 
- Refresh job success rate. 
- Refresh job failure rate. 
- Missing account-context join rate. 
- Null AI brief rate. 
- Engagement score recompute duration. 

### Alerts

Trigger alerts for:
- P95 board latency above target. 
- Repeated refresh job failures. 
- Dead-letter queue growth. 
- Sudden spike in stale rows or missing account joins. 
- Account brief dependency outage from M-06. 

### Refresh-job monitoring

Each refresh job should expose:
- queue depth
- processing time
- retry count
- DLQ count
- stale accounts remaining  
This is required because board freshness depends on upstream and async refresh coordination. 

### Board performance monitoring

Track:
- query execution time
- row assembly time
- rows returned per request
- sort/filter response time
- account detail payload size  
These measures help keep the board fast for large account portfolios. 

---

## 13. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Board load latency | P95 under 2.5 seconds for standard tenant board loads.  |
| Account detail latency | P95 under 2.0 seconds when latest cached brief exists.  |
| Filter/sort responsiveness | Under 1.0 second for common indexed filters on normal page size.  |
| Scalability | Support large tenant portfolios through pagination, indexed filtering, and precomputed score reads.  |
| Refresh reliability | >= 99% successful refresh completion excluding upstream hard failures.  |
| Data freshness | Critical account signals should refresh within configured SLA after upstream change.  |

### Notes

The SAD emphasizes modular monolith boundaries, shared PostgreSQL with RLS, and read-heavy UI modules using efficient serving patterns.   
Because of that, Account Boards should favor precomputed snapshots, indexed read models, and async refresh over expensive synchronous recomputation on every page load. 

---

## 14. Test Strategy

### Unit tests

Cover:
- Health status classification rules. 
- Prioritization rule evaluation. 
- Next-best-action selection. 
- Freshness state classification. 
- Partial response assembly when AI context is absent. 

### Integration tests

Cover:
- `GET /account-boards` with real tenant-scoped seed data. 
- `GET /account-boards/:id` with linked contacts, deals, activities, and account brief. 
- M-06 account brief dependency success and failure fallback. 
- M-03 linked data joins for account, activity, and contact data. 

### Event-driven refresh tests

Cover:
- Upstream signal marks account stale. 
- Deduplicated refresh when multiple updates hit same account rapidly. 
- Retry and DLQ behavior for refresh worker failures. 
- Refresh result updates latest score/signal timestamps correctly. 

### UI contract tests

Cover:
- Minimum row schema stability between backend and frontend. 
- Null-safe rendering of AI context, contacts, and activity sections. 
- Filter and sort contract compatibility. 
- Stale badge and partial-data warning rendering. 

### Regression tests for health and prioritization rules

Regression suites must lock expected outputs for:
- healthy account
- watch account
- at-risk account
- no-activity account
- renewal-risk account
- expansion-opportunity account  
This prevents silent logic drift as scoring and signal logic evolve. 

---

## Appendix A — Recommended freshness thresholds

| Component | Freshness Rule |
|---|---|
| Activities | stale if latest join/update older than 15 minutes from expected sync window.  |
| Engagement score | stale if computed more than 24 hours ago or invalidated by major new activity.  |
| Renewal signals | stale if source stream lag exceeds configured processing SLA.  |
| AI account brief | stale if older than latest important linked signal set or configured summary TTL.  |

## Appendix B — Recommended account detail sections

1. Account overview.   
2. AI account context.   
3. Health and engagement.   
4. Renewal and expansion signals.   
5. Contacts and stakeholders.   
6. Linked deals.   
7. Activity timeline.   
8. Recommended next actions. 

## Appendix C — Simple fresher note

If you are new to this system, remember this rule: **Account Boards is a product feature in M5, but the engineering owner is M-07**.   
So when you build APIs, tables, refresh jobs, security rules, or tests, follow M-07 architecture boundaries and consume M-03, M-05, and M-06 only through approved APIs or events. 

---

## 15. Summary of Resolved Open Questions

1. **How should M5 react to `email.sent`?**  
   *Decision:* M5 (M-07) consumes `email.sent` to refresh the `lastActivityAt` timestamp and recompute the `engagement_score` for the affected account.

2. **Should AI Account Briefs be mandatory?**  
   *Decision:* No. If M-06 is unavailable, the board must return a partial response with `aiContextSummary = null` and appropriate freshness metadata.

3. **Where is Saved View configuration stored?**  
   *Decision:* In `account_board_configs` owned by M-07. This table persists columns, filters, and sorting per user.

4. **Is health score recomputed on every read?**  
   *Decision:* No. To preserve M-07 as a read-heavy UI module, scores are stored in `engagement_scores` and refreshed asynchronously via BullMQ workers.

