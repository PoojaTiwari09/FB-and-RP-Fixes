B. Feature-Specific Additions — TDD: View Deal Drivers

Architecture Mapping Note
View Deal Drivers belongs to the product-facing module M4 Deal Intelligence because it helps teams review and analyze the health of every deal. Architecturally, however, View Deal Drivers is currently tied to M-05 Smart Tracking and Search, where the platform places rep-level deal risk visibility and signal detection logic. This TDD must therefore use M4 for business and product naming, but M-05 for implementation ownership, APIs, event consumption, storage, and processing responsibility. This boundary must stay explicit because Deals Boards is owned by M-07 while View Deal Drivers is owned by M-05, even though both are presented together in the product module.

B1. Driver Definition Model
A driver is a normalized analytical explanation that represents a recurring reason why deals for a rep, team, or selected board segment are showing risk, warning, or weakened health. The purpose of the driver model is not to restate one raw warning at a time, but to convert repeated warning patterns across deals into a small set of understandable business explanations.

View Deal Drivers should answer these questions:
1. What risk patterns are most common across the selected rep’s active deals?
2. Which signals are driving poor deal health most often?
3. Are the drivers getting better, worse, or staying stable over time?
4. Which driver categories deserve manager attention first?

Each driver record should contain at minimum:
- driverId: internal UUID for the computed driver record.
- tenantId: tenant boundary key.
- scopeType: rep, team, board-view, or segment.
- scopeId: userId, teamId, or saved-view identifier depending on scope.
- boardContextId: source board or selected board definition used to compute drivers.
- driverType: normalized category such as engagement-gap, stage-stall, no-next-step, close-date-risk, tracker-risk, summary-risk, crm-incomplete.
- driverLabel: short UI-safe human-readable label.
- driverDescription: one-paragraph explanation of what this driver means.
- severity: low, medium, high, or critical.
- affectedDealCount: number of distinct deals impacted by this driver.
- detectionCount: number of raw warning or signal occurrences rolled into this driver.
- affectedValue: optional pipeline value associated with impacted deals.
- comparisonDirection: up, down, flat, or insufficient-data.
- comparisonValue: absolute or percentage delta against prior comparison window.
- topDealIds: top impacted deals used for drill-down.
- sourceSignals: structured list of source warning and signal types contributing to this driver.
- confidenceScore: confidence in the driver explanation quality.
- explanationText: formatted UI explanation shown in the drawer or detail panel.
- computedAt: timestamp of driver computation.
- windowStartAt: start of analysis window.
- windowEndAt: end of analysis window.

The driver model should remain aggregated and explanatory. It should not become a duplicate of the raw deal risk flag table or the board row table.

B2. Signal Source Mapping
View Deal Drivers depends on upstream signal generation and then maps those raw signals into normalized driver categories. Because this feature is tied to M-05, the system should treat M-05 as the signal aggregation and interpretation layer, not the owner of underlying CRM deal state.

Primary signal sources include:
- Revenue Graph linkage between calls, emails, meetings, accounts, contacts, and deals.
- Smart Tracker detections generated from intent-based NLP.
- Topic and theme outputs where approved for driver enrichment.
- AI summaries and deal briefs when available as explanatory context.
- Deal board warning states selected from the board context.
- Activity recency and engagement freshness from linked activity data.
- CRM pipeline fields such as stage, owner, amount, and close date for contextualization only.

Recommended source-to-driver mapping:
- Missing recent activity -> engagement-gap
- Negative or risky tracker detections -> tracker-risk
- Stage aging above threshold -> stage-stall
- Close date near with weak evidence -> close-date-risk
- Missing or overdue next step -> no-next-step
- Repeated summary risk mentions -> summary-risk
- Missing linked CRM context or broken linkage -> crm-incomplete
- Multiple weak signals across engagement and summaries -> multi-signal-risk

Source mapping rules:
- One raw signal may contribute to more than one driver candidate, but final display should avoid duplicate counting of the same deal in the same driver category.
- Source signals must retain provenance so drill-down can explain why the driver exists.
- CRM context should enrich drivers, but CRM fields alone should not create AI-style drivers unless a rule explicitly allows it.
- If a source signal is stale or low confidence, it may reduce explanation confidence without always blocking driver generation.

B3. Warning-to-Driver Transformation Logic
The raw inputs for View Deal Drivers are warnings and signals, especially those coming from a selected deal board and upstream tracking outputs. The transformation layer must convert these low-level events into a compact, manager-friendly explanation set.

Transformation pipeline:
1. Read selected board context and deal set.
2. Collect all active warnings and relevant linked signals for deals in that scope.
3. Normalize raw warning names into a controlled taxonomy of driver types.
4. Deduplicate repeated warnings for the same deal where they represent the same business issue.
5. Group normalized warnings across deals by driver type.
6. Rank drivers based on affected deal count, impacted pipeline value, severity mix, and recent growth trend.
7. Generate a short explanation for each driver with evidence references.
8. Persist the computed driver snapshot for low-latency UI reads.

Normalization examples:
- “No customer response in X days” and “no recent meeting activity” can both map to engagement-gap.
- “Close date soon but low engagement” and “late-stage deal with weak recent signals” can map to close-date-risk.
- “Tracker detected objection” and “tracker detected competitor mention” may remain separate driver types if product wants finer drill-down, or may roll into tracker-risk with subtype metadata.

Transformation rules:
- A single deal should count once per driver type within the same window.
- Multiple warnings on the same deal can still increase severity or evidence richness.
- Resolved warnings should drop out of the active driver set on next recompute.
- If the selected board changes filters, the driver set must recompute against the filtered deal universe.
- If board warnings are not yet refreshed, the UI should indicate that drivers reflect the latest available snapshot, not block the whole experience.

Clarification on analytical responsibility
View Deal Drivers does not behave as a passive read-only viewer of Deals Board warnings. It reads warning context from the selected deal board, but it also computes additional derived analytics inside M-05. These derived analytics include warning normalization, driver grouping, rep-level aggregation, trend comparison, ranking, and explanation generation. The selected deal board defines the deal scope and warning input set, but the driver model, aggregation rules, and explanation logic are owned by M-05. Therefore, this feature should be implemented as “board-scoped derived analytics,” not as a simple projection of existing board warning rows.



B4. Rep-Level Aggregation Rules
The core business description of View Deal Drivers is that it shows how well each rep is doing on pipeline deals based on warnings coming from a selected deal board. Therefore rep-level aggregation must be simple, deterministic, and easy to explain.

Aggregation unit:
- Primary aggregation is by rep owner of the deal.
- Secondary rollups may support manager or team views, but the base logic must still roll up from deal owner level.

Rep aggregation rules:
- Include only deals visible in the selected board scope.
- Count a deal under the current owner of record.
- Count one deal once per driver category in a given analysis window.
- Aggregate by affected deal count first, then optionally by pipeline value.
- Closed-won and closed-lost deals are excluded unless the chosen board explicitly includes them.
- Unassigned deals should appear under an “Unassigned” bucket if visible to the user.
- Reassigned deals should follow the owner effective at computation time unless historical ownership analysis is explicitly enabled.

Suggested ranking order for rep view:
1. Highest affected deal count.
2. Highest affected pipeline value.
3. Highest severity mix.
4. Most negative recent change.

This keeps the feature useful for pipeline review instead of turning it into a generic analytics dashboard.

B5. Time-Window and Comparison Logic
View Deal Drivers needs time logic so users can tell whether a risk pattern is getting better or worse. The system should compute drivers for a primary analysis window and compare against a previous equivalent window.

Recommended supported windows:
- Last 7 days
- Last 14 days
- Last 30 days
- Current quarter to date
- Custom range, if enabled by product policy

Comparison rules:
- Default comparison should be against the immediately preceding window of equal length.
- If the selected range is 30 days, compare to the prior 30-day period.
- If insufficient prior data exists, mark comparison as insufficient-data.
- Comparison should be calculated on both affected deal count and detection count; pipeline value comparison is optional but recommended.
- The UI should show clear trend direction such as increasing, decreasing, or stable.
- Large trend swings caused by tiny counts should be marked carefully to avoid misleading interpretation.

Windowing rules:
- A driver belongs to the active window if its underlying warning or signal falls within the selected time range or remains unresolved and active in that range.
- **Decision**: All deal drivers must be computed based on **Active Overlap** (warnings that were unresolved during the analysis window) to ensure consistency with the Deals Board view.
- Time zone handling must be tenant-aware and consistent with board date filters.
- Backfills or delayed events should be marked in recompute logs so trend anomalies can be audited.

B6. Driver Explanation Format for UI
The driver explanation format should be short, evidence-based, and understandable by a manager scanning many reps quickly. The UI should not show raw model output. It should show a structured explanation produced from normalized driver data.

Recommended explanation object:
- title: short label, e.g. “Low engagement in late-stage deals”
- summary: one or two sentences describing the pattern
- whyItAppears: structured list of evidence conditions
- affectedDeals: count of impacted deals
- affectedValue: optional pipeline amount
- trend: increased, decreased, stable, or insufficient-data
- topExamples: top 3 to 5 deal references
- confidenceLabel: high, medium, low
- lastUpdatedAt: timestamp
- sourceTags: tracker, summary, activity, crm, board-warning

Recommended UI text pattern:
“This rep has 6 active deals showing low engagement risk. The pattern is concentrated in late-stage opportunities with no recent meetings or emails in the selected window. The driver is up from the previous period and is affecting high-value deals.”

Explanation rules:
- Explanations must cite source categories, not hallucinated reasons.
- Confidence should drop when source coverage is partial or stale.
- If a driver was built mainly from board warnings, the explanation should say so.
- If a driver mixes tracker detections and summary outputs, the explanation should separate those signals clearly.
- Explanation text must remain short enough for cards, tables, and drawers, with longer detail available only in expanded view.
- Low-confidence explanations must be labeled and should never be presented as certain causal truth.

B7. Snapshot, Recompute, and Serving Model
View Deal Drivers should be served from precomputed or cached snapshots rather than recomputing every query synchronously. The SAD already positions M-05 as an event-driven, signal-centric module, so this feature should follow the same pattern.

Recommended serving model:
- Compute driver snapshots asynchronously per tenant and board scope.
- Persist snapshots in an M-05-owned store such as dealdriversnapshots or equivalent read model.
- Recompute when source warnings, tracker detections, board filters, or selected comparison windows materially change.
- Serve UI reads from the latest successful snapshot with freshness metadata.
- Allow stale-while-revalidate behavior for non-critical reads.
- Use idempotent snapshot keys per tenant, scope, board context, and time window.

Suggested recompute triggers:
- tracker.detection.created
- warning state changed for a deal included in a selected board scope
- summary or brief refresh changes driver-relevant evidence
- manual refresh from UI
- scheduled daily or intra-day refresh for high-usage tenants
- saved board definition changed in a way that changes deal inclusion

B8. Dependency and Ownership Clarification
View Deal Drivers is architecturally owned by M-05 Smart Tracking and Search because it turns upstream detections and board warnings into rep-level driver visibility. It depends on Revenue Graph linkage from M-03, tracker detections and search-oriented signal stores in M-05, and selected board context that is business-related to M4 and operationally exposed through the Deals Board experience. It must not quietly absorb M-07 board ownership, M-06 summary generation ownership, or M-09 forecasting logic.

B9. Non-Goals for This Feature Section
The following are out of scope for View Deal Drivers:
- full Deals Board row rendering,
- deal health score ownership,
- forecast rollups,
- manager coaching workflows,
- tracker authoring UI,
- summary generation internals,
- direct CRM writeback,
- raw AI prompt design inside product services,
- generic BI dashboarding beyond driver-specific analytics.

B10. Implementation Reminder for Engineers
This feature is easy to implement incorrectly if engineers treat it as just a Deals Board extension. Product-wise it sits beside Deals Boards under M4 Deal Intelligence, but architecture-wise it belongs to M-05 Smart Tracking and Search. Any code that computes, stores, ranks, or explains drivers should therefore stay inside M-05 boundaries unless an ADR explicitly changes ownership later.