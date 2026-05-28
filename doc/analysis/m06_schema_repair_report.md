# M06 Schema Repair Report

**Date:** 2026-05-27

## AiForecastSnapshots duplicate columns (unified doc schema)

**File:** `final_product/schema.prisma`  
**Issue (§B2):** Duplicate lowercase fields (`predictedamount`, `confidencerangelow`, etc.) alongside mapped camelCase fields.

**Fix:** Removed duplicate-purpose columns; kept single canonical set with `@map` for DB columns. `computedAt` typed as `DateTime?`. `idempotencyKey` marked `@unique`.

## Live M06 runtime schema

Module-local `AiForecastSnapshot` was already clean (no duplicates). Central schema aligned to that shape with camelCase DB columns matching existing M06 migrations.

## New tables

- `forecast_executive_snapshots` — materialized executive dashboard payloads
- `m06_prediction_jobs` — async prediction job persistence

## Drift prevention

- One Prisma generate path: `@rri/database`
- No second generator output under M06 module
