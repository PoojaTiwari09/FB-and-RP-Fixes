# M07 Dashboard Rendering Validation

**Date:** 2026-05-27

## Frontend surfaces

| Area | Path | Role |
|------|------|------|
| Dashboard page | `apps/web/.../pages/dashboards/page.tsx` | Main workspace |
| Dashboard client | `components/dashboard-client.tsx` | Widget grid, filters |
| Chart/KPI | `chart-card.tsx`, `kpi-card.tsx` | Visualization |
| Shared view | `shared-dashboard-client.tsx` + `share/route.ts` | Read-only token access |
| API client | `lib/api.ts` | Backend + Next route calls |

## Persistence flow

```
dashboard-client → POST/PATCH /api/dashboards
  → prisma.dashboardConfig.upsert (layout JSON v3: { dashboards: [...] })
  → tenantId + userId compound unique
```

## Validated contracts

| Concern | Status |
|---------|--------|
| Layout v1/v2/v3 parsing | OK in `route.ts` `parseLayout()` |
| Multi-dashboard list | OK |
| Share tokens in `visibleWidgets` | OK after field rename |
| Filter state persistence | OK (`timeRange`, `targetConfig`, etc.) |
| Shared dashboard read-only | OK (`readOnly: true` on shared entries) |
| RBAC on Nest routes | JWT + RolesGuard on guarded endpoints |

## Backend rendering (Nest)

- Sample dashboard builder: unguarded dev endpoints for widget catalog/config
- KPI endpoint: role-scoped via `TenantInterceptor`

## Issues addressed

- Prisma accessor/field rename prevents runtime `dashboardconfigs` undefined after `prisma generate`

## Follow-ups

- Align `lib/api.ts` base paths with Nest `api/v1/revenue-dashboards` where duplicated
- Add E2E test for chart render with mocked deal payload

## Status

**PASS** — persistence contract stable; rendering depends on valid layout JSON from reconciled model.
