# M10 Scalability Report

**Date:** 2026-05-27

## Entity resolution

| Concern | Mitigation |
|---------|------------|
| O(n) fuzzy over all contacts/accounts | Cap 500 candidates per tenant; index on email/domain |
| AI HTTP latency | Only when deterministic insufficient |
| Repeated linking | Activity idempotency key |

## Export pipeline

| Concern | Mitigation |
|---------|------------|
| Memory for large datasets | Stream CSV write; batch via checkpoint increments |
| Disk growth | `M10_EXPORT_STORAGE_DIR`; retention policy TBD |
| Concurrent exports | Redis lock per tenant+connection |
| Retry storms | BullMQ backoff + idempotent jobId |

## Recommendations

1. Paginate extraction in 5k row batches (`M10_DATA_EXPORT_DEFAULT_BATCH_SIZE`)
2. Move fuzzy index to Meilisearch/pg_trgm at scale
3. S3 upload adapter in `LocalFileWarehouseProvider` for multi-node API

## Status

**Adequate** for pilot tenants; batching hooks ready for scale-up.
