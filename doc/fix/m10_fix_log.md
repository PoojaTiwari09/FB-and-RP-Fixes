# M10 Fix Log

**Date:** 2026-05-27

## Entity resolution

- Added `entity-resolution.engine.ts` (Levenshtein, token overlap, ambiguity detection)
- Enhanced `revenue-graph.service.ts` L1/L2/L3 matching
- Added `listAccountsForMatching`, `listContactsForMatching` repository helpers

## Data export

- Replaced stub `exportDataset` with CSV + Parquet file generation
- Added `ExportStorageService`, `WarehouseRegistry`
- Added `filePaths` to `M10DataCloudExportRun`
- Added real download endpoint `GET /exports/runs/:id/download`

## Prisma

- Merged all M10 models into `packages/database/prisma/schema.prisma`
- `prisma db push` applied

## Smoke

- Added `M10TestController` (unguarded `/test/*`)
- Added `doc/test_result/doc/test_result/doc/test_result/test_case/testm10.py`

## Schema

- `RegisterConnectionSchema.destinationName` optional
