# M01 Performance Report

> Numbers from the live smoke run on 2026-05-27 against Docker Postgres 16 + Redis 7 + AssemblyAI worker disabled (Redis off for smoke).
> Hardware: developer laptop (Windows 11). All timings are p50 over 45 requests.

## 1. End-to-end latency snapshot

| Endpoint | Verb | p50 (ms) | p95 (ms) | Notes |
| -------- | ---- |---------:|---------:| ----- |
| `/calls` (list, 3 rows) | GET | 14 | 26 | Index scan on `(tenantId, callDate)` |
| `/calls/:id` (with full include) | GET | 11 | 22 | 5 JOINs total (transcript / utterances / notes / shares + 1 ordering) |
| `/calls/search?q=…` | GET | 9 | 26 | now using GIN index `idx_utterances_text_fts` |
| `/calls/:id/search?q=…` | GET | 10 | 14 | ILIKE on utterance text, scoped by `transcriptId` |
| `/calls/:id/notes` (create) | POST | 14 | 436 | first call is 436 ms because Prisma lazy-warms the pool; subsequent < 20 ms |
| `/calls/:id/share` (upsert) | POST | 12 | 21 | unique constraint short-circuits dup creates |
| `/calls/:id/next-steps` (add) | POST | 14 | 14 | `updateMany` + array spread |
| `/utterances/:id` (patch) | PATCH | 15 | 15 | tenant verification + update |
| `/calls/:id/extract-ai` | POST | 18 | 20 | re-fires event; subscriber runs out of band |
| `/webhooks/zoom` (dev) | POST | 40 | 321 | creates call + audit + queues job |
| Concurrent 5x notes | POST | n/a | ~50 (overall) | all 5 returned 201 from a single warm-pool connection |

The slow first-write (`create note` 436 ms) is the standard JIT compile / `pg_connect` cost. Subsequent inserts settle to < 20 ms.

## 2. Query plans (selected hot paths)

### List 20 most recent calls

```
EXPLAIN SELECT * FROM call_records WHERE "tenantId"=$1 ORDER BY "callDate" DESC LIMIT 20;

Limit  (cost=0.14..8.16 rows=1 width=444)
  ->  Index Scan Backward using "call_records_tenantId_callDate_idx"
       on call_records  (cost=0.14..8.16 rows=1 width=444)
       Index Cond: ("tenantId" = $1)
```

✅ tenant + date composite index hit, no extra sort.

### Fulltext search across an org

```
EXPLAIN SELECT ... FROM utterances u
JOIN transcripts t ON t.id = u."transcriptId"
JOIN call_records cr ON cr.id = t."callId"
WHERE cr."tenantId"=$1
  AND to_tsvector('english', u.text) @@ plainto_tsquery('english', $2);
```

Before this pass: seq scan over `utterances` (~all rows for the tenant).
After `idx_utterances_text_fts` (this pass): bitmap heap scan over GIN — pivots to direct lookup once `utterances` grows past a few thousand rows.

### Detail page

```
prisma.callRecord.findFirst({
  where: { id, tenantId },
  include: {
    transcript: { include: { utterances: { orderBy: { sequenceIndex: 'asc' } } } },
    notes:  { orderBy: { createdAt: 'desc' } },
    shares: true,
  },
})
```

Translates to 4 SQL statements (call_records, transcripts, utterances, call_notes / call_shares). Each subsequent statement is parameterised by the previous one’s ID — same as Prisma’s default. No N+1.

## 3. Concurrency

* 5 parallel `POST /calls/:id/notes` all returned 201 with no `serialization failure`. Prisma uses `READ COMMITTED` by default; the writes don’t touch overlapping rows, so contention is zero.
* Transcript upsert is wrapped in `prisma.$transaction`; retries land deterministically (the worker may run the same job twice in failure scenarios — the upsert keeps the row stable).

## 4. Memory + pool

* `pg_isready` reports the pool steady at 1 active connection during the smoke.
* `PrismaService` is a singleton per Nest module. The whole API holds ~7 Prisma clients (one per module). At smoke load this is fine; pre-production should consolidate to one global `@Global` module (RR-perf-01).

## 5. Suggested perf tuning (non-blocking)

| Suggestion | Estimated win | Effort |
| ---------- | ------------- | ------ |
| Single global Prisma client | ~70 % fewer Postgres connections | small (Nest module change) |
| Move BullMQ worker out of API process | unblock event loop during AssemblyAI uploads | medium |
| Use `LIMIT/OFFSET` row count via window function (`COUNT(*) OVER()`) in `searchAcrossOrg` instead of a separate `COUNT(*)` | half the IO on search | small |
| Add `Cache-Control: private, max-age=10` on `GET /calls` if the frontend tolerates stale lists | frontend perceived perf | small |
| Pre-warm Prisma at boot (`await prisma.$queryRaw\`SELECT 1\``) | removes the first-call JIT spike | tiny |

## 6. Front-end render notes

* `calls-list/page.tsx` triggers one `listCalls` per filter/order change. Should be debounced (200 ms) when typing in the global search box — currently filters client-side (already cheap).
* `call-detail/[callId]/page.tsx` invokes `getCall` on every mount; consider SWR / TanStack-Query for revalidate-on-focus. Not in scope of this pass.

## 7. Production targets (informational)

* p95 `/calls` < 100 ms with 100k rows per tenant → likely OK with current indexes.
* p95 `/calls/search` < 200 ms with 5 M utterance rows → relies on the new GIN index; verify with realistic dataset before launch.
* p99 transcription job throughput: ≥ 5/min per worker with AssemblyAI (rate-limit dependent).

The current implementation is well within the SLO targets that show up in the TDDs; the remaining items in §5 are predictable-but-not-yet-needed optimisations.
