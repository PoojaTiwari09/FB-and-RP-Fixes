# M05 Dependency Report

**Date:** 2026-05-27

## Upstream

| Module | Integration |
|--------|-------------|
| M01 | `ownerUserId` for platform user linkage (future) |
| M03 | AI briefs via `/ai/summary` |
| M10 | CRM reads via env `M10_CRM_API_*` (registry) |
| HubSpot | Sync + webhooks |

## Downstream consumers

- M07 dashboards (account KPIs)
- M06 forecasting (account context)

## Internal graph

```
AppModule → M05AccountIntelligenceModule
  ├── Supabase (crm_companies, boards, activities) — primary runtime
  ├── Prisma (@rri/database Account) — repository + future cutover
  ├── BullMQ m05-queue — worker stub
  └── EventPublisher — account.updated
```

## External packages

- `@supabase/supabase-js`
- `@hubspot/api-client`
- `@nestjs/bullmq`
- `@rri/database`

## Env dependencies

See `m05_webhook_env_validation_report.md` and registry v3.0+ (HubSpot, Supabase, M05_HUBSPOT_WEBHOOK_SECRET).
