# M05 API Validation Report

**Date:** 2026-05-27  
**Prefix:** `/api/v1/account-intelligence`

## Route ownership (post-fix)

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/` | M05 metadata | Open |
| GET | `/test/health` | M05Test | Open |
| POST | `/test/smoke` | M05Test | Open |
| GET | `/accounts` | Accounts | Query: `board_slug` required |
| GET | `/accounts/:hubspotId` | Accounts | Detail |
| GET | `/boards` | Boards | List |
| POST | `/webhooks/hubspot` | Webhook | HMAC when secret set |

## Contracts validated

- Module root returns route map (no duplicate mock accounts array)
- Accounts error when `board_slug` missing
- Webhook returns `{ processed: N }` on success
- Webhook 401 on bad signature when secret configured

## Gaps (environment)

- Supabase-backed routes return 500 if `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` unset
- TenantGuard not on all M05 controllers (boards use Supabase RLS assumptions)

## Frontend alignment

- All M05 client calls use `${API_URL}/api/v1/account-intelligence/...` (fixed)
