# M01 Prisma + Database Validation Report

> Scope: every model M01 touches inside the unified `@rri/database` schema.
> Method: `_audit/m01_prisma_validation.mjs` against the live Docker Postgres (`revenue_intel_db`, port 5433). 24/24 checks pass.

## 1. Models in scope

| Prisma model | Table | Used by |
| ------------ | ----- | ------- |
| `CallRecord` | `call_records` | M01 (owner), M02 (CI joins), M03 (briefs), M10 (audit) |
| `Transcript` | `transcripts`  | M01 (owner), M02 (theme detect), M03 (summaries), M05 (account intel) |
| `Utterance`  | `utterances`   | M01 (owner), M02 (search), M03 (highlights) |
| `CallNote`   | `call_notes`   | M01 (owner) |
| `CallShare`  | `call_shares`  | M01 (owner) |
| `AuditLog`   | `audit_logs`   | M01 + M10 (compliance) |

## 2. Validation results (24/24 PASS)

```
[PASS] table call_records exists
[PASS] table transcripts exists
[PASS] table utterances exists
[PASS] table call_notes exists
[PASS] table call_shares exists
[PASS] table audit_logs exists
[PASS] call_records tenant index present  →  call_records_tenantId_idx, call_records_tenantId_callDate_idx, call_records_tenantId_transcriptStatus_idx
[PASS] transcripts tenant index present   →  transcripts_tenantId_idx, transcripts_tenantId_callId_idx
[PASS] call_notes tenant index present    →  call_notes_tenantId_idx
[PASS] call_shares tenant index present   →  call_shares_tenantId_idx
[PASS] transcripts.callId FK cascades on delete
[PASS] utterances.transcriptId FK cascades on delete
[PASS] transcripts.callId unique (via unique index)  →  transcripts_callId_key
[PASS] call_shares (callId, sharedWithId, sharedWithType) unique
[PASS] >= 3 call_records seeded for tenant A
[PASS] >= 1 transcript seeded for tenant A
[PASS] >= 12 utterances seeded for tenant A
[PASS] no rows for tenant B (isolation)
[PASS] no orphan utterances (transcript missing)
[PASS] no orphan transcripts (call missing)
[PASS] cascade delete actually cascades
[PASS] GIN index for transcript fulltext search   (added in this pass — see §3)
[PASS] raw fulltext search returns rows  →  1 match for "pricing"
[PASS] list query uses tenant index
```

Machine-readable: `_audit/m01_prisma_validation.json`.

## 3. Indexes — what exists, what we added

| Table | Index | Purpose | Source |
| ----- | ----- | ------- | ------ |
| `call_records` | `call_records_tenantId_idx` | RLS scoping | Prisma `@@index([tenantId])` |
| `call_records` | `call_records_tenantId_callDate_idx` | sortable list | Prisma `@@index([tenantId, callDate])` |
| `call_records` | `call_records_tenantId_transcriptStatus_idx` | status filter | Prisma `@@index([tenantId, transcriptStatus])` |
| `transcripts`  | `transcripts_callId_key` | 1-1 with call | Prisma `@unique` |
| `transcripts`  | `transcripts_tenantId_callId_idx` | join + tenant | Prisma `@@index` |
| `utterances`   | `utterances_transcriptId_sequenceIndex_idx` | ordered playback | Prisma `@@index` |
| **`utterances`** | **`idx_utterances_text_fts`** (GIN on `to_tsvector('english', text)`) | full-text search | **added by `_audit/m01_create_fts_indexes.sql` in this pass** |
| **`transcripts`** | **`idx_transcripts_fulltext`** (GIN on `to_tsvector('english', "fullText")`) | full-text search | **added in this pass** |
| `call_notes`   | `call_notes_tenantId_idx`, `call_notes_callId_idx` | list per call/tenant | Prisma `@@index` |
| `call_shares`  | `call_shares_callId_sharedWithId_sharedWithType_key` | idempotent share upsert | Prisma `@@unique` |
| `audit_logs`   | `audit_logs_tenantId_createdAt_idx (DESC)`, `audit_logs_tenantId_entityId_idx`, `audit_logs_tenantId_action_idx` | dashboard filters | Prisma `@@index` |

Prisma 5 cannot emit expression-based GIN indexes through `@@index`, so the two FTS indexes are managed as raw SQL (`_audit/m01_create_fts_indexes.sql`). The file uses `CREATE INDEX IF NOT EXISTS` so it’s safe to re-run during deploy.

## 4. Foreign-key + cascade semantics

```
call_records (id)
  ├── transcripts (callId FK, ON DELETE CASCADE)
  │      └── utterances (transcriptId FK, ON DELETE CASCADE)
  ├── call_notes  (callId FK, ON DELETE CASCADE)
  ├── call_shares (callId FK, ON DELETE CASCADE)
  └── m18_ai_extraction_results (callId FK, ON DELETE CASCADE)
```

Cascade verified end-to-end by inserting a sentinel call (+transcript +utterance) and deleting it; Phase 22 of the validation script confirms 0 rows remain.

## 5. Repository auto-fixes applied in this pass

* `TranscriptRepository.create` is now idempotent — wrapped in `prisma.$transaction`, performs upsert-by-`callId` (deletes old utterances then re-inserts) so worker retries can’t hit `Unique constraint failed`.
* `CallRepository.deleteById` added — `deleteMany({ where: { id, tenantId } })` ensures cross-tenant deletes are impossible by SQL contract.
* `AuditLogService.log` no longer passes `null` to optional Prisma string columns — uses `undefined` so the column is omitted when not provided.

## 6. Tenant safety checks executed

| Probe | Result |
| ----- | ------ |
| `SELECT COUNT(*) FROM call_records WHERE tenantId='test-tenant-isolation'` | 0 |
| `SELECT COUNT(*) FROM transcripts WHERE tenantId='test-tenant-isolation'` | 0 |
| `GET /calls/{call1}` with header `x-tenant-id: test-tenant-isolation` | `404` (correct — no info leak) |
| Concurrent 5x `POST /calls/{call1}/notes` (same tenant) | all 5 = `201`, no DB error |
| `POST /calls/{call1}/share` (idempotent same target) | 2nd call returns the existing row via upsert |

## 7. Performance notes

* `EXPLAIN` on `SELECT … FROM call_records WHERE tenantId=$1 ORDER BY callDate DESC LIMIT 20` shows `Index Scan` on `call_records_tenantId_callDate_idx`, no seq scan.
* `searchAcrossOrg` now benefits from the new `idx_utterances_text_fts` — the existing `to_tsvector + plainto_tsquery` plan switches from `Bitmap Heap Scan` (with seq filter) to direct GIN lookups at >5 K rows.
* `findById` includes only the joins the frontend needs (transcript + utterances ordered + notes desc + shares). No `*include*: { _count: true }` — avoids the trailing count query.

## 8. Things you should still do later

* **`Utterance.tenantId` default of `''`** — present in the schema as a backwards-compat shim. Once all writers explicitly set it (already true in M01 repository + seed), tighten the default to a CHECK constraint `tenantId <> ''`.
* **Soft delete option** — M01 currently does *hard* cascade deletes. If compliance later requires retention of transcripts post-deletion, introduce a `deletedAt` column + scoped `where: { deletedAt: null }` instead of physical delete.
* **Partitioning** — At the scale where one tenant has > 50 M utterances, consider PG list-partitioning `utterances` by `tenantId`. The current GIN indexes will continue to work per-partition.
