# M10 Runtime Risk Report

**Date:** 2026-05-27

## Resolved

| Risk | Mitigation |
|------|------------|
| Prisma client missing M10 models | Merged into `@rri/database` |
| Stub entity matching | Full engine + layered resolution |
| Fake export URLs | Real files + download route |
| No warehouse path | Provider registry with hooks |

## Open — medium

| Risk | Notes |
|------|-------|
| M01→M10 BullMQ bridge | EventEmitter vs BullMQ queue for linking |
| JWT on all production routes | Smoke uses `/test/*` bypass |
| Parquet binary optional | JSONL fallback unless `parquetjs` + env flag |
| CRM sync still state-only | No external CRM adapter |

## Open — low

| Risk | Notes |
|------|-------|
| Data Cloud UI no Next route | Component exists; backend-only scope |
| Large tenant fuzzy scan | Candidate cap 500 per entity type |

## Status

No critical blockers for backend smoke and export file generation.
