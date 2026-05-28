# M05 Controller Overlap Report

**Date:** 2026-05-27  
**Status:** Resolved

## Problem

`m05.controller.ts` exposed `GET /` and `POST /` on `api/v1/account-intelligence` with **mock** list/create via `M05AccountIntelligenceRepository`, overlapping conceptually with real account flows on `AccountsController` (`/accounts`).

## Resolution

| Controller | Routes | Ownership |
|------------|--------|-----------|
| `M05AccountIntelligenceController` | `GET /api/v1/account-intelligence` | Module metadata only (no mock CRUD) |
| `M05TestController` | `GET/POST .../test/health`, `.../test/smoke` | Smoke/ops |
| `AccountsController` | `GET .../accounts`, `.../accounts/:hubspotId`, etc. | **Account intelligence data** |
| `BoardsController` | `.../boards/*` | Board config |
| `WebhookController` | `.../webhooks/hubspot` | HubSpot ingestion |

## Removed behavior

- Mock `findAll` / `create` on module root
- `TenantGuard` on mock root (was misleading for smoke)

## Repository

`m05.repository.ts` now uses real `prisma.account` for internal/programmatic use (not exposed on duplicate HTTP routes).

## Frontend impact

- No client called mock root for boards; `api.ts` paths fixed to `M05_API` prefix (separate report)
