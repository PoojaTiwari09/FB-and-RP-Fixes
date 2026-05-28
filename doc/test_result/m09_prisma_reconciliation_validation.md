# M09 — Prisma Reconciliation Validation

**Date:** 2026-05-27

## Canonical schema (packages/database)

| Unified model | DB table | Schema |
|---------------|----------|--------|
| `trainerscenarios` | `dashboards.trainerscenarios` | `dashboards` |
| `trainersessions` | `dashboards.trainersessions` | `dashboards` |

Key fields: `scenarioid`, `tenantid`, `sessionid`, `userid`, `conversation` (Json), `scorecardresult` (Json), `status`, `completedat`, `createdat`.

## Legacy module schema (deprecated)

`modules/m09-coaching-training/prisma/schema.prisma` — **not used at runtime**. Marked `prisma/DEPRECATED.md`.

## Runtime wiring

- `database/prisma.service.ts` extends `PrismaClient` from `@rri/database`.
- `repositories/m09.repository.ts` — delegate-safe:
  - Probes `trainerscenarios` / `trainersessions`.
  - Falls back to `m09-memory.store.ts` when legacy `trainingScenario` absent.
  - Maps unified ↔ legacy shapes via `m09-prisma-mappers.ts`.

## UUID alignment

Seed scenarios use UUIDs (`00000000-0000-0000-0000-000000000101/102`) so unified Postgres writes do not fail on non-UUID ids like `scenario-1`.

## Validation tests

| Test | Result |
|------|--------|
| `POST /test/seed` | PASS |
| `GET /scenarios` (JWT) | PASS |
| `POST /test/smoke` (create session, message, end) | PASS |
| `pnpm exec prisma generate` (packages/database) | Expected pass when DB URL set |

## Drift status

| Check | Status |
|-------|--------|
| Zero runtime `prisma.trainingScenario` without fallback | **Fixed** |
| Local schema ownership | **Documented deprecated** |
| Duplicate schema conflicts at runtime | **Resolved** |
