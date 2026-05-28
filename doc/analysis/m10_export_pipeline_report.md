# M10 Export Pipeline Report

**Date:** 2026-05-27

## Before

- Export counted rows only; no files
- Fake download URLs
- No CSV/Parquet artifacts

## After

| Component | Path | Role |
|-----------|------|------|
| `csv-export.writer.ts` | UTF-8 CSV with escaping | Real files |
| `parquet-export.writer.ts` | Parquet binary (optional) or `.parquet.jsonl` fallback | Analytics-safe |
| `export-storage.service.ts` | `uploads/m10-exports/{tenant}/{run}/` | Disk layout |
| `data-cloud.service.ts` | Orchestrates extract → write → checkpoint → warehouse hook | Pipeline |

## Export run metadata

`M10DataCloudExportRun.filePaths` stores per-dataset:

```json
{
  "accounts": {
    "csv": "/path/accounts.csv",
    "parquet": "/path/accounts.parquet",
    "downloadCsv": "http://localhost:3001/api/v1/m10-data-compliance/exports/runs/{id}/download?dataset=accounts&format=csv",
    "downloadParquet": "...&format=parquet"
  }
}
```

## Download API

`GET /api/v1/m10-data-compliance/exports/runs/:runId/download?dataset=&format=`

Streams real file from disk (JWT + tenant guard).

## Async jobs

- BullMQ `data-cloud-export` queue
- Redis daily sync lock preserved
- Worker passes `runId` for replay correlation

## Status

**COMPLETE** — real export files; fake URLs eliminated.
