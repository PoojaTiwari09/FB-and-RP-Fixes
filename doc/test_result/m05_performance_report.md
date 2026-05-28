# M05 Performance Report

**Date:** 2026-05-27

## Observations (smoke)

| Endpoint | Latency (local) |
|----------|-----------------|
| `/test/health` | ~60ms |
| `/accounts?board_slug=demo` | ~7s (500 — Supabase connection timeout/retry) |
| `/boards` | ~7s (same) |
| Webhook POST | ~20ms |

## Hot paths

- `getAccounts` — multi-query Supabase (companies, activities, deals, supplementary); N+1 risk on large boards
- Sync — paginated HubSpot + batch upsert every 5 min

## Recommendations

1. Cap `page_size` via `M05_MAX_PAGE_SIZE`
2. Index `crm_companies(board, assigned_rep_id, hubspot_id)`
3. After Prisma cutover: single query with `include` limits
4. Cache board rows per `M05_BOARD_CACHE_TTL_SEC` when Redis enabled

## Conclusion

Performance acceptable for metadata/smoke paths; account list requires Supabase connectivity and query tuning at scale.
