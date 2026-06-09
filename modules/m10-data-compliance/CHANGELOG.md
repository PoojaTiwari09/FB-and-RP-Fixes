# Changelog — M10 Data & Compliance

## [1.1.0] - 2026-05-19

### Added — Revenue Graph Feature (TDD Doc #11a v3.0)

**Backend (`modules/m10-data-compliance/revenue-graph/`)**
- `revenue-graph.module.ts` — NestJS sub-feature module with BullMQ queue registration
- `controllers/revenue-graph.controller.ts` — REST API at `/api/v1/m10-data-compliance/*`
  - `GET /accounts`, `GET /accounts/:id`
  - `GET /deals`, `GET /deals/:id`, `GET /deals/:id/relationship`
  - `GET /contacts/:id`
  - `POST /crm-sync`, `GET /crm-sync-status`
- `services/revenue-graph.service.ts` — full entity linking pipeline (FR1–FR6)
  - Deterministic resolution: email exact match → domain match → open deals
  - AI semantic fallback via Python `M10_AI_SERVICE_BASE_URL` (non-fatal)
  - Idempotency gate via `m10_activities.idempotencyKey`
  - Audit trail via `m10_link_decision_logs`
  - Event publication: `revenue_graph.entity.linked` (post durable write only)
- `repositories/revenue-graph.repository.ts` — sole DB access layer for m10_* tables
- `workers/revenue-graph.worker.ts` — BullMQ worker consuming `call.transcription.completed`
- `events/revenue-graph.events.ts` — `M10_REVENUE_GRAPH_EVENTS` and `M10_REVENUE_GRAPH_QUEUES`
- `schemas/revenue-graph.schema.ts` — Zod validation for all API/event boundaries
- `dto/response-revenue-graph.dto.ts` — typed response interfaces

**Database (`prisma/schema.prisma`)**
- Full `m10_data_compliance` schema: accounts, contacts, deals, deal_contacts, activities, interaction_links, link_decision_logs, mapping_rule_sets, crm_sync_states, compliance_policies, data_cloud_connections, data_cloud_export_runs, data_cloud_checkpoints

**Frontend (`apps/web/src/modules/m10-data-compliance/`)**
- `types/revenue-graph.types.ts` — TypeScript interfaces mirroring backend DTOs
- `api/revenue-graph.api.ts` — typed fetch client for all endpoints
- `components/RevenueGraphDashboard.tsx` — premium dark dashboard with deals board, accounts list, CRM sync control, stat cards, confidence badges, stage pills
- `revenue-graph/page.tsx` — Next.js page route with SEO metadata

**Module**
- `m10-data-compliance.module.ts` — updated to import `RevenueGraphModule`

## [1.0.0] - Initial Boilerplate
- Scaffolded module with placeholder controller, service, repository, worker, prisma schema
