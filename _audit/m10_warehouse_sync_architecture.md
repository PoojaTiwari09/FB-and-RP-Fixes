# M10 Warehouse Sync Architecture

**Date:** 2026-05-27

## Design

Prisma/PostgreSQL remains **source of truth**. Warehouse sync is **async** and **post-file-generation**.

```
exportDataset()
  → extract rows (incremental watermark)
  → write CSV + Parquet to local storage
  → upsert checkpoint
  → WarehouseRegistry.sync()
```

## Provider abstraction

| Provider | Destination | Behavior |
|----------|-------------|----------|
| `LocalFileWarehouseProvider` | postgres, s3, local | Acknowledges staged files |
| `SnowflakeWarehouseProvider` | snowflake | Hook stub — validates account/warehouse config |
| `BigQueryWarehouseProvider` | bigquery | Hook stub — validates projectId/datasetId |

Interface: `warehouse-provider.interface.ts`  
Registry: `warehouse-registry.ts`

## Env configuration

- `M10_EXPORT_STORAGE_DIR` — file root
- `M10_EXPORT_PARQUET_BINARY=true` — enable parquetjs binary when installed
- `M10_DATA_EXPORT_*` — feature flags per env-registry.md
- Connection `config` JSON holds warehouse credentials (secret refs)

## Failure recovery

- Export run status: `running` → `success` | `failed`
- `filePaths` partial on failure
- Redis lock released in `finally`
- BullMQ retries (3 attempts, exponential backoff)

## Future connectors

Snowflake COPY / BigQuery load jobs plug into provider `sync()` without changing `DataCloudService` interface.

## Status

**OPERATIONAL** — hooks wired; full native connectors are Phase 2.
