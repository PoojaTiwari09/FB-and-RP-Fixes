# Module Analysis — `m10-data-compliance`

> Order #2 in the lifecycle (per your chart): "Links every captured interaction to the right Account, Contact, and Deal (Revenue Graph)". Depends only on M01 (`call.transcription.completed`).
>
> This module owns the **Revenue Graph** (cross-module entity linking) and the **Data Cloud / Data Export** + **Compliance Settings** features.

---

## 1. Purpose

Three product surfaces:

1. **Revenue Graph** — turns raw calls/emails/meetings into linked entities (Accounts ↔ Deals ↔ Contacts ↔ Activities).
2. **Data Cloud / Data Export** — sync platform data to external warehouses (Snowflake, BigQuery, Redshift) + tenant data export (GDPR Article 20).
3. **Configure Compliance Settings** — opt-out + region (GDPR/CCPA) + retention policies.

Maps to TDDs:

* `M10 Data & Compliance/TDD/TDD-Revenue Graph.md`
* `M10 Data & Compliance/TDD/TDD-Data Cloud or Data Export.md`
* `M10 Data & Compliance/TDD/TDD-Configure Compliance Settings.md`

---

## 2. Layout

```
modules/m10-data-compliance/
├── m10-data-compliance.module.ts
├── prisma/schema.prisma
├── controllers/
│   ├── m10.controller.ts
│   ├── revenue-graph.controller.ts    GET /nodes, /edges, POST /resolve
│   └── data-cloud.controller.ts       POST /exports, GET /exports/:id
├── services/
│   ├── m10.service.ts
│   ├── revenue-graph.service.ts       entity resolution algorithm
│   ├── data-cloud.service.ts          warehouse sync jobs
│   └── prisma.service.ts
├── repositories/
│   ├── m10.repository.ts
│   ├── revenue-graph.repository.ts
│   └── data-cloud.repository.ts
└── seeds/, schemas/, interfaces/, events/, database/, migrations/
```

---

## 3. Frontend

`apps/web/src/modules/m10-data-compliance/` (18 files):

* Revenue Graph viewer (node+edge visualization).
* Compliance settings form.
* Data export wizard.

Top-level Next route: `apps/web/src/app/modules/m10-data-compliance/revenue-graph/page.tsx`.

---

## 4. API surface

Base path: `/api/v1/data-compliance`.

| Method | Path |
| ------ | ---- |
| GET    | `/revenue-graph/nodes?tenantId=...&type=Account|Deal|Contact|Activity` |
| GET    | `/revenue-graph/edges?from=...&to=...` |
| POST   | `/revenue-graph/resolve` (force re-link an activity to an account/deal/contact) |
| GET    | `/data-cloud/exports` |
| POST   | `/data-cloud/exports` (kick off `data_cloud_export_jobs`) |
| GET    | `/data-cloud/exports/:id/download` |
| GET    | `/settings` (tenant compliance settings) |
| PATCH  | `/settings` (region, opt-out rules) |
| POST   | `/settings/anonymize/:userId` (right-to-be-forgotten) |

---

## 5. Database (unified schema mapping)

| Unified model | Notes |
| ------------- | ----- |
| `RevenueGraphNodes` | tenant + entity_type + entity_id + properties (Json) |
| `RevenueGraphEdges` | tenant + from_node + to_node + relationship_type + confidence |
| `ComplianceSettings` (or `compliance_settings`) | per tenant: region, allowedConsents, retentionDays |
| `DataCloudExportJobs` | status, format (csv/parquet), targetWarehouse, completedAt |
| `OptOuts` | per contact/account opt-out flags |
| `AuditLogs` | source of truth for compliance audit trail |
| `Activities` | source data (also written by M01) |

---

## 6. Events

| Direction | Event |
| --------- | ----- |
| IN  | `call.transcription.completed` (M01) | extract `accountId`/`dealId` references and write edges. |
| IN  | `call.uploaded` (M01) | precreate a node for the call. |
| OUT | `revenue_graph.entity.linked` | consumed by M02, M03, M05. |
| OUT | `compliance.policy.changed` | consumed by every module that gates on opt-out. |
| OUT | `data.cloud.export.completed` |

---

## 7. Gaps & debts

| Severity | Issue |
| -------- | ----- |
| HIGH | Entity resolution algorithm (`revenue-graph.service.ts`) is mostly stub — needs deterministic + fuzzy matching against `Accounts`, `Contacts`, `Deals` by email domain + name. |
| HIGH | No actual warehouse client implementation; `data-cloud.service.ts` only writes to `data_cloud_export_jobs` and returns a fake URL. |
| MEDIUM | Compliance settings don't yet expose RLS configuration — RLS migration tracked in §B5. |
| LOW | Anonymization endpoint (`/settings/anonymize/:userId`) — needs to cascade into all PII columns; currently a stub. |

---

## 8. Smoke checklist

* `GET /api/v1/data-compliance/revenue-graph/nodes?tenantId=demo&type=Account` returns `[]`.
* `POST /api/v1/data-compliance/data-cloud/exports` with `{ format:'csv', objects:['Calls'] }` returns 202 with `jobId`.
* `GET /api/v1/data-compliance/data-cloud/exports/:jobId/download` returns 200 (or 404 if job not done).
* `GET /api/v1/data-compliance/settings` returns default compliance settings for the tenant.
* After a `call.transcription.completed` event the publisher logs `revenue_graph.entity.linked`.
