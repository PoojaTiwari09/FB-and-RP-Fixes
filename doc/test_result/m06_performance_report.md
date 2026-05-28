# M06 Performance Report

**Date:** 2026-05-27

## Improvements

| Area | Before | After |
|------|--------|-------|
| createDeal | Sync snapshot math + DB write | Enqueue only (~ms) |
| Executive dashboard | Always full `getTeamBoard` chain | Reads materialized JSON when available |
| AI recalc | Never ran (no producer) | Debounced worker (60 min) |

## Remaining hotspots

- `getTeamBoard` / `getBoard` — many Prisma queries per request when cache miss
- `getExecutiveDashboard` compute path — O(reps × deals) when materializing
- HubSpot sync — 50 deals per page, sequential upserts

## Recommendations

1. Index `forecast_submissions(tenantId, periodId, repUserId, version)`
2. Enable Redis in production for worker throughput
3. Partial executive snapshots per region/baseline key
