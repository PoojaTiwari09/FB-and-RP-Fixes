A. Feature-Specific Additions — TDD: Deals Boards

Architecture Mapping Note
Deals Boards belongs to the product-facing module M4 Deal Intelligence, whose business purpose is to help teams manage, review, and analyze the health of every deal. Architecturally, however, Deals Boards is owned by M-07 Deal and Account Management. This TDD must therefore use M4 for product naming and M-07 for implementation ownership. Any integration, API, event, schema, or execution responsibility described below should be interpreted as M-07-owned unless explicitly marked as upstream or downstream dependency. This note exists to prevent incorrect implementation routing caused by the current mismatch between product packaging and architecture boundaries.

A1. Board Purpose and Board Types
Deals Boards is the primary pipeline workspace for deal-level execution review. It centralizes pipeline management by combining CRM data with AI-driven insights so that sellers, managers, and revenue leaders can review deal health, risks, activity, and engagement in one place.

The board exists to answer four core business questions:
1. Which deals need attention now?
2. Why is a deal healthy or at risk?
3. Which deals are changing based on new conversation and insight signals?
4. What should the user review next inside the pipeline?

Supported board types should be defined as:
- My Deals Board: shows only deals owned by the current user.
- Team Deals Board: shows deals owned by members of the user’s reporting scope.
- Pipeline Review Board: grouped by stage for manager inspection and weekly reviews.
- Risk Board: prioritized list of deals with active warnings, low health scores, or stale engagement.
- Custom Saved Board: user-defined view with persisted filters, columns, sorting, and grouping.

Board types are logical views over the same M-07 deal data and board query layer. They do not create separate source-of-truth records for deal state. The source of truth remains the deal record, related health score records, risk flags, activity history, and upstream insight outputs consumed by M-07.

A2. Deal Row Schema
Each Deals Board row represents one deal record enriched with AI-derived and activity-derived fields required for board rendering, sorting, filtering, and health review.

Minimum row schema:
- dealId: internal UUID for the deal.
- tenantId: tenant boundary key.
- crmDealId: external CRM identifier.
- accountId: linked account identifier.
- accountName: account display name.
- dealName: human-readable deal name.
- ownerUserId: current deal owner.
- ownerDisplayName: current deal owner label shown in UI.
- stage: current pipeline stage.
- stageOrder: sortable stage index from tenant stage configuration.
- value: current deal amount from CRM.
- closeDate: expected close date from CRM.
- healthScore: latest computed numeric score.
- healthCategory: normalized label such as healthy, watch, or risk.
- riskFlagCount: count of active risk flags.
- riskFlagSummary: short joined summary of the highest-priority active risks.
- engagementScore: latest engagement score consumed or derived for board display.
- lastActivityAt: timestamp of latest linked activity.
- daysSinceLastContact: derived freshness metric.
- pastDueNextSteps: boolean or count indicating overdue next steps if available from upstream summary/insight outputs.
- latestInsightAt: timestamp of latest applied Stage 4 insight refresh affecting this row.
- lastSignalAt: timestamp of latest signal used in health recomputation.
- warningState: normalized board warning state used for badges and filters.
- sourceFreshnessState: fresh, stale, partial, or unavailable.
- boardUpdatedAt: timestamp when the materialized row payload was last refreshed for UI serving.

Optional enrichment fields:
- primaryContactName
- meetingCountLast30Days
- emailCountLast30Days
- openRisksByType
- latestSummaryVersion
- latestBriefVersion
- trackerSignalCount
- nextRecommendedAction
- confidenceLabel for explanation quality

The board row schema must be optimized for read-heavy UI access. Derived values should be precomputed where possible to avoid expensive fan-out during every board load.

A3. Default Columns and Configurable Columns
The board must open with a sensible default configuration that supports immediate pipeline review without requiring setup.

Default columns:
- Deal Name
- Account
- Owner
- Stage
- Value
- Close Date
- Health
- Risk Flags
- Last Activity
- Days Since Last Contact

Configurable columns:
- Engagement Score
- Past Due Next Steps
- Latest Insight Refresh
- Primary Contact
- Meeting Count
- Email Count
- Warning State
- Tracker Signal Count
- Summary Status
- Brief Status
- Custom CRM fields approved for board display

Column configuration rules:
- Users may show, hide, and reorder configurable columns.
- Tenant admins may define organization defaults.
- Some system columns must remain pinned or always available for usability, such as Deal Name and Stage.
- Column preferences must persist per user in the board configuration store.
- Shared or saved views may persist a team-level column set, but personal overrides should still be supported where product policy allows.

A4. Health Score and Warning Computation Inputs
Deals Boards does not invent deal state independently. It consumes CRM pipeline context plus upstream insight outputs and recomputes board-visible health state when those inputs change.

Primary computation inputs include:
- CRM deal stage
- deal owner
- deal value
- expected close date
- linked account and contact context
- activity recency from calls, meetings, and emails
- conversation outputs linked through Revenue Graph
- tracker detections from Smart Tracking
- generated summaries and deal briefs from Stage 4 outputs
- risk detections and engagement scoring inputs defined in M-07 architecture
- historical health score and active unresolved risk flags

The TDD must define a transparent scoring input contract even if the final scoring formula evolves later. At minimum, the logic should specify:
- what fields are mandatory versus optional,
- how stale or missing inputs affect score confidence,
- which signals produce warnings immediately,
- which signals only adjust score but do not create warnings,
- how ties and conflicting signals are resolved,
- when a row is marked partial because not all dependencies were available.

Illustrative warning categories:
- No recent customer engagement
- Close date approaching with weak activity
- Negative or risk-bearing tracker detections
- Missing next step or overdue next step
- Stage aging beyond threshold
- Summary or insight indicates risk escalation
- CRM context incomplete or stale

The SAD states that M-07 uses AI for risk detection and engagement scoring from Stage 4 outputs. Therefore this TDD must explicitly define which Stage 4 outputs are consumed by Deals Boards, how they are mapped into board-level health fields, and which of them trigger a row status change versus only refreshing explanation text.

A5. Filtering, Sorting, Grouping, and Saved Views
Deals Boards must support fast operational review of large pipelines. The board should behave like an intelligent workspace, not a static table.

Filtering must support:
- owner
- team
- stage
- value range
- close date range
- health category
- warning state
- risk flag presence
- activity recency
- account
- source freshness state
- custom CRM fields approved for board use

Sorting must support:
- close date
- deal value
- health score
- last activity date
- stage order
- risk flag count
- engagement score
- latest insight refresh time

Grouping must support:
- stage
- owner
- health category
- warning state
- account segment if available from CRM context

Saved view rules:
- Users can save personal views with filters, grouping, sorting, and visible columns.
- Managers or RevOps can save shared team views where permitted.
- One view can be marked default per user.
- Saved views must store only configuration metadata, not duplicate deal data.
- Deleting a saved view must not affect deal records or other users’ personal views.

A6. Board Refresh Triggers and Cache Policy
Deals Boards is a read-heavy workspace backed by asynchronous recomputation. The TDD must define exactly when board rows refresh and which events cause health recalculation.

User-driven refresh triggers:
- opening the board,
- manual refresh action,
- changing filters, grouping, sorting, or saved view,
- opening a deal detail and returning to the board when row freshness threshold has expired.

System-driven refresh triggers:
- CRM sync updates deal core fields such as stage, owner, value, or close date,
- Revenue Graph updates linkage between interaction and deal,
- tracker detection created or updated,
- summary generation completed,
- deal brief refreshed,
- risk detection recomputed,
- engagement score recomputed,
- deal stage change confirmed,
- async backfill or replay job completed.

Refresh policy:
- Board row payloads should be served from a cached or materialized read model for low-latency UI response.
- Row recomputation should be event-driven where possible, not done synchronously on every board request.
- A board request may read the latest available row snapshot and attach freshness metadata.
- If upstream inputs changed but recomputation is still pending, the row should surface a refreshing or stale indicator rather than blocking the entire board load.
- Partial refresh is allowed at row level; one failed row recompute must not fail the whole board.
- Retry behavior for async refresh jobs must be idempotent and compatible with BullMQ retries and DLQ handling.
- Cache invalidation must happen on relevant upstream events and on user configuration changes where the rendered projection changes.
- Personal board configuration cache must be separate from deal row data cache.

Recommended freshness model:
- Hot board row cache for commonly accessed views.
- Materialized read model updated by events for large board loads.
- Config cache for user column and saved-view metadata.
- Stale-while-revalidate behavior for non-critical UI reads.
- Hard refresh path for support or admin troubleshooting only.

A7. Row Status Change Rules
The board must define deterministic rules for when a deal row visibly changes state.

A row status should change when:
- health score crosses a category threshold,
- a new active risk flag is created,
- all active risk flags are resolved,
- days since last contact crosses configured threshold,
- close date enters risk window without required engagement,
- summary or brief introduces a higher-severity risk classification,
- CRM stage changes,
- linkage changes attach new relevant activities or conversations to the deal.

A row should not change visible status for cosmetic or explanation-only updates unless the explanation changes a warning, score, category, or freshness state.

A8. Dependency and Ownership Clarification
Deals Boards is implemented by M-07 but depends on upstream outputs from M-03, M-05, and M-06 before presenting board-level intelligence. M-07 must not directly own forecasting math, outbound automation orchestration, or unrelated account workspace behavior. Any data needed from another module must arrive through published events, approved public APIs, or documented read-model exceptions already approved in architecture.

A9. Non-Goals for This Feature Section
The following are out of scope for Deals Boards:
- forecast prediction logic,
- account board behavior,
- CRM schema ownership outside approved sync boundaries,
- authoring tracker definitions,
- summary generation internals,
- orchestration play execution,
- dashboard analytics beyond board-specific metrics,
- direct AI model implementation inside M-07 product code.

A10. Implementation Reminder for Engineers
This feature is easy to misroute because product naming says M4 Deal Intelligence while architecture ownership says M-07 Deal and Account Management. All backend implementation for Deals Boards should therefore be reviewed against M-07 boundaries first, then checked for declared dependencies on M-03, M-05, and M-06 outputs. If a needed dependency is unresolved, document it explicitly instead of silently crossing module boundaries.