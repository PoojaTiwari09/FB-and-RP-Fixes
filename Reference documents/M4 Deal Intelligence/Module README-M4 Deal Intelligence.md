# Module README: M4 Deal Intelligence

## 1. Module Overview

M4 Deal Intelligence is the product module that helps users manage, review, and analyze the health of every deal in the pipeline. In the product mapping, this module contains two user-facing features: Deals Boards and View Deal Drivers. 

This module matters because it is where pipeline health becomes actionable for sales reps and managers. It turns CRM deal data, AI-generated risk signals, engagement context, and board-level warnings into a working view of what needs attention in the pipeline. 

From the platform lifecycle perspective, the user-facing outcomes of M4 sit mainly in the Execute stage because Deals Boards is part of M-07 Deal and Account Management, which produces pipeline views with AI risk warnings and deal health scores. At the same time, part of the M4 product experience depends on Understand-stage outputs because View Deal Drivers is currently placed in M-05 Smart Tracking and Search as rep-level deal risk visibility. 

Core outputs associated with the M4 product experience are:
- Unified pipeline board views for active deals, stages, filters, and risk visibility. 
- AI risk warnings and deal health scores shown on deals. 
- Rep-level deal risk visibility and aggregated deal driver analytics. 

## 2. Features in This Module

The product definition of M4 Deal Intelligence includes:
- Deals Boards, which centralizes pipeline management by combining CRM data with AI-driven insights so users can track deal health, risks, and engagement in one workspace. 
- View Deal Drivers, which shows how well each rep is doing on pipeline deals based on warnings coming from a selected deal board. 

These two features belong together from a product and buyer perspective because both help users understand pipeline health. However, they do not currently share the same architectural owner. 

## 3. Product vs Architecture Mapping

As a product module, M4 is a packaging and user-understanding layer. It groups all deal-intelligence capabilities that help users inspect and act on deal health. 

Architecturally, Deals Boards is owned by M-07 Deal and Account Management. The architecture defines M-07 as the module that provides a unified pipeline view combining CRM data, AI risk warnings, activity timelines, and deal health scores. 

Architecturally, View Deal Drivers is currently owned by M-05 Smart Tracking and Search. The architecture defines M-05 as producing rep-level deal risk visibility and specifically includes View Deal Drivers in that module. 

Because one product module maps to two implementation modules, an ADR is required if the team wants to keep this split long term, move View Deal Drivers into M-07 later, or introduce a new shared deal-intelligence service boundary. The README must treat this as an explicit architectural exception, not an accidental overlap. 

## 4. Module Boundaries

M4 owns the product experience for deal intelligence. At the product level, that means the scope includes managing, reviewing, and analyzing the health of every deal through Deals Boards and View Deal Drivers. 

M4 does not own raw CRM data ingestion, Revenue Graph entity linking, tracker detection generation, call summaries, or account-level workspace logic. Those responsibilities belong to upstream or adjacent architecture modules such as M-03 Revenue Graph, M-05 Smart Tracking and Search, M-06 Insight Generation, and M-07 Deal and Account Management. 

Allowed upstream dependencies for the M4 product experience include:
- M-03 Revenue Graph for connected deal, account, contact, and activity context. 
- M-05 Smart Tracking and Search for tracker detections and deal driver analytics. 
- M-06 Insight Generation for summaries and briefs consumed by board experiences. 

Downstream or adjacent consumers include:
- M-08 Execution and Automation, which reacts to signals and stage changes for next-best-action and workflow automation. 
- M-09 Forecasting, which consumes deal and execution data for forecasts and forecast boards. 
- M-09 Performance and Coaching, which uses broader performance outcomes and historical data for coaching and dashboards. 

## 5. Architecture Snapshot

The main architectural components behind the M4 experience are split across modules. M-07 serves the board UI and stores board configuration, deal records, health scores, and deal risk flags, while M-05 computes and serves deal driver analytics for rep-level risk visibility. 

The board read path is primarily an M-07 path. It reads deals, stages, risk flags, board configuration, and related context to render the unified pipeline view. 

The async refresh path depends on upstream event flows. M-07 uses upstream AI outputs for risk and engagement views, while M-05 consumes linked conversation and tracker-related signals and refreshes driver snapshots asynchronously through event-driven processing. 

Risk and engagement signals are used differently across the split. M-07 focuses on deal health, risk flags, and board presentation, while M-05 focuses on prevalent risk-signal aggregation per rep for the Deal Drivers experience. 

CRM and Revenue Graph dependencies are foundational. M-03 provides the connected deal, account, contact, and activity context that both M-05 and M-07 depend on for enrichment and display. 

## 6. APIs

Because the M4 product module is split architecturally, its APIs come from more than one implementation module. This must be documented clearly so developers do not assume one backend service owns the whole experience. 

Board listing and board-serving endpoints belong to M-07 Deal and Account Management. The architecture defines M-07 as the read-heavy UI-serving module for Deals Boards and Account Boards. 

Deal detail and board-related read endpoints also belong primarily to M-07, supported by M-03 and M-06 APIs for enriched deal, account, activity, and brief context. 

Driver analytics endpoints belong to M-05 Smart Tracking and Search. The architecture explicitly lists GET /api/v1/smart-tracking/deal-drivers as the endpoint for top deal risk signals for the current user’s active deals. 

Saved board-view style configuration is stored under M-07 through board configuration records such as dealboardconfigs. If future saved-driver views are introduced, ownership must be documented explicitly rather than assumed to be shared automatically. 

## 7. Events

The M4 product experience relies heavily on events, but event ownership stays with the underlying implementation modules. Product grouping does not change event ownership. 

Relevant upstream events include:
- call.transcription.completed from M-01, which feeds M-03. 
- revenuegraph.entity.linked from M-03, which feeds M-04 and M-05. 
- tracker.detection.created from M-05, which is emitted after smart tracking detects intent-based signals. 
- call.summary.generated from M-06, which the architecture lists as flowing to M-07 and M-08 in the platform event verification path. 
- deal.stage.changed from M-07, which is consumed downstream by M-08 and M-09. 

Event ownership boundaries:
- M-05 owns tracker-related events and deal-driver snapshot generation logic. 
- M-07 owns deal-stage and board-serving state. 
- M4 as a product module does not publish independent infrastructure events unless a future architecture change introduces a true standalone M4 service. 

Recompute trigger rules should be documented as:
- Recompute deal drivers when new tracker detections, linked revenue context changes, or selected board-warning inputs materially change the rep-level risk picture. 
- Refresh board state when deal-stage, risk-flag, engagement, or brief-related data changes. 
- Keep recomputation async and idempotent because the architecture requires event-driven module interaction and retry-safe event handling. 

## 8. Data Ownership

Data ownership for the M4 experience is split by implementation module, not by product naming. This is one of the most important things for engineers to understand. 

Board records and cached board-view configuration belong to M-07 through data structures such as deals, dealstages, dealhealthscores, deal_risk_flags, and dealboardconfigs. M-07 owns the pipeline board state and board-serving data model. 

Deal risk flags and health score stores also belong to M-07. The architecture explicitly places deal health scores and risk flags in the deals schema owned by M-07 Deal and Account Management. 

Driver analytics artifacts belong to M-05. The architecture documents deal driver snapshots and rep-level signal aggregation under the smart tracking area, including the dealdriversnapshots table for computed outputs. 

Tenant isolation follows the platform-wide shared PostgreSQL with row-level security model, with tenantId enforced across module schemas and writes. Retention and operational governance follow platform-wide data policies, and no module should bypass those shared controls. 

## 9. Local Development

Local development should follow the standard platform setup: run services in Docker Compose, keep module boundaries realistic, and avoid shortcutting event flows that the production architecture depends on. This is especially important because the M4 user experience spans more than one implementation module. 

Prerequisites include Docker, Docker Compose, the approved TypeScript/NestJS backend workflow, the Python AI services layer, PostgreSQL, and Redis as part of the standard local stack. The tooling guidance also emphasizes keeping local setup simple and understandable for junior engineers while staying architecture-aligned. 

Suggested setup steps:
1. Start the local platform stack with Docker Compose. 
2. Bring up PostgreSQL and Redis first, then backend and AI services. 
3. Seed CRM-linked deal, account, contact, and activity data through the approved local data path. 
4. Seed or replay tracker detections, summaries, and deal-risk-related events needed by M-05 and M-07. 
5. Verify that board APIs and deal-driver APIs both return tenant-scoped data correctly. 

Suggested run and test command guidance:
- Use the project-standard Docker Compose startup path for full-stack local runs. 
- Use backend unit and integration tests for NestJS modules. 
- Use event-flow tests for queue-based recompute and refresh flows. 
- Use Playwright only for end-to-end UI flows, not for backend business-logic validation. 

## 10. Configuration

Required environment variables should come from the approved central secrets workflow, not from ad hoc local files committed to the repo. The tooling guidance states that Doppler is the approved secrets management source and that secrets must not live in repositories or images. 

Expected required configuration areas for the M4 experience include:
- PostgreSQL connection settings. 
- Redis connection settings for BullMQ-backed async processing. 
- Auth and JWT configuration. 
- CRM integration credentials for deal and account sync paths where needed. 
- AI service endpoint configuration for upstream signal and insight generation dependencies. 

Optional environment variables may include feature flags, recompute tuning controls, cache durations, search settings, and observability toggles. Secret sources should remain Doppler-managed, and the team should maintain one environment registry or shared config reference as the single source of truth. 

## 11. Operational Notes

Common failure modes for the M4 experience usually come from broken upstream dependencies, not only from UI bugs. If Revenue Graph linking is incomplete, tracker events are missing, summaries are stale, or Redis-backed async processing is unhealthy, the board or driver experience will look incomplete even when the frontend is working correctly. 

Stale board data troubleshooting should start with dependency checks:
- Confirm M-03 linked entity data is current. 
- Confirm M-05 detections and driver snapshots are fresh. 
- Confirm M-06 insight outputs needed by M-07 are available. 
- Confirm Redis and BullMQ workers are healthy for async refresh paths. 

Recompute and replay notes:
- Replay upstream events in dependency order, not randomly, because downstream modules depend on upstream outputs. 
- Never patch another module’s private tables directly just to “fix” board or driver state. The architecture explicitly forbids direct cross-module database access. 
- **Event-Driven Loop Warning**: M-03 is an upstream dependency for M-07 context, but M-03 also consumes `deal.stage.changed` (emitted by M-07). This is an asynchronous data flow, not a synchronous code dependency. Developers must rely on async event propagation rather than attempting synchronous cross-module updates to prevent race conditions or circular update deadlocks.

Support ownership should follow the real implementation boundary:
- Board rendering, board config, deal risk flags, and deal health issues go first to the M-07 owning team. 
- Driver aggregation, tracker-driven rep risk visibility, and deal-driver endpoint issues go first to the M-05 owning team. 
- Cross-module failures should be coordinated by the Tech Lead because this product module spans multiple architecture modules. 

## 12. Related Docs

Primary related documents for this README are:
- System Architecture Document (SAD), which governs lifecycle stages, module boundaries, events, schemas, and architecture rules. 
- Feature TDDs for Deals Boards and View Deal Drivers, which must describe feature-specific internal logic not covered by the SAD. 
- Sequence diagrams and event-flow diagrams referenced by the architecture and feature design materials. 
- API docs and operational runbooks for M-05 and M-07 endpoints, jobs, and support procedures. 

