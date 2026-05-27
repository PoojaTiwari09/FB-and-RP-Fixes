# M05 Frontend Contract Report

**Date:** 2026-05-27

## Critical fix: API base path

**Before:** `${API_URL}/accounts`, `/boards`, etc. (wrong — hit non-M05 routes or 404)  
**After:** `${M05_API}` = `${API_URL}/api/v1/account-intelligence`

File: `apps/web/src/modules/m05-account-intelligence/lib/api.ts`

## Types

- `AccountSummary.health_score?: number | null` — aligns with backend `health_score`
- `assigned_rep` unchanged — maps from canonical `assigned_rep_id` only

## Flows

| UI | API |
|----|-----|
| Board page | `fetchBoards`, `fetchAccounts` |
| Account panel | `fetchAccountDetail`, activities, todos, AI |
| Admin | `updateBoard`, `triggerSync` |
| Sync bar | `/sync/status`, `/sync/trigger` |

## Owner display

- UI shows `account.assigned_rep.name` — must not read `hubspot_owner_id` directly

## Remaining

- E2E browser smoke not run in this pass
- Configure `NEXT_PUBLIC_API_URL` → `http://localhost:3001`
