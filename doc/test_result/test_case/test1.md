# M01 — Test execution guide

**Runner:** `testm1.py`  
**Source audit script:** `doc/test_result/m01_deep_smoke.ps1`  
**Module:** Capture & Transcription (`/api/v1/capture-transcription`)

---

## Prerequisites

1. PostgreSQL running with seeded data (tenant `dev-tenant-001`).
2. API on port **3001** (use `ts-node`, not `tsx` — Nest DI requires decorator metadata).

```powershell
cd r-revenue-intelligence-monorepo

$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:DISABLE_REDIS = "true"

pnpm --filter api run start
```

3. Python **3.9+** installed.

---

## Run commands

```powershell
cd r-revenue-intelligence-monorepo\doc\test_result\test_case

# Default (localhost:3001)
python testm1.py

# Custom API base
$env:M01_API_URL = "http://localhost:3001/api/v1/capture-transcription"
python testm1.py

# Or CLI flag
python testm1.py --base-url http://localhost:3001/api/v1/capture-transcription --webhooks-url http://localhost:3001/api/v1/webhooks
```

**Exit code:** `0` = all passed, `1` = one or more failures.

Optional PowerShell original:

```powershell
pwsh -File ..\doc\test_result\m01_deep_smoke.ps1
```

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `M01_API_URL` | `http://localhost:3001/api/v1/capture-transcription` | M01 REST base |
| `M01_WEBHOOKS_URL` | `http://localhost:3001/api/v1/webhooks` | Zoom webhooks |
| `M01_TENANT_A` | `dev-tenant-001` | Seeded tenant |
| `M01_TENANT_B` | `test-tenant-isolation` | Empty tenant for isolation |

---

## Individual test cases (37+)

### Phase A — Auth / tenant isolation

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| A1 | no tenant header rejected | GET | `/calls` | 401 or 403 |
| A2 | happy GET /calls with tenant | GET | `/calls` | 200 |
| A3 | tenant B sees no seeded calls | GET | `/calls` | 200 |

### Phase B — List + filter + sort

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| B1 | list completed only | GET | `/calls?status=completed` | 200 |
| B2 | list pending | GET | `/calls?status=pending` | 200 |
| B3 | list source=zoom | GET | `/calls?source=zoom` | 200 |
| B4 | sort by title asc | GET | `/calls?sortBy=title&order=asc` | 200 |
| B5 | limit + offset paging | GET | `/calls?limit=1&offset=0` | 200 |
| B6 | invalid status rejected | GET | `/calls?status=garbage` | 400 or 500 |
| B7 | invalid limit rejected | GET | `/calls?limit=9999` | 400 or 500 |

### Phase C — Single resource

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| C1 | GET seeded call by id | GET | `/calls/{CALL1}` | 200 |
| C2 | GET unknown call -> 404 | GET | `/calls/00000000-...` | 404 |
| C3 | GET seeded call across tenant -> 404 | GET | `/calls/{CALL1}` (tenant B) | 404 |

### Phase D — Search

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| D1 | org-wide search pricing | GET | `/calls/search?q=pricing` | 200 |
| D2 | search with date range | GET | `/calls/search?q=pricing&dateFrom=...` | 200 |
| D3 | in-call search | GET | `/calls/{CALL1}/search?q=competitor` | 200 |
| D4 | search empty query rejected | GET | `/calls/search?q=` | 400 or 500 |
| D5 | in-call search wrong tenant | GET | `/calls/{CALL1}/search?q=x` (tenant B) | 200 or 404 |

### Phase E — Notes CRUD

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| E1 | create note | POST | `/calls/{CALL1}/notes` | 201 |
| E2 | update note | PUT | `/calls/{CALL1}/notes/{id}` | 200 |
| E3 | delete note | DELETE | `/calls/{CALL1}/notes/{id}` | 204 |
| E4 | create note empty body rejected | POST | `/calls/{CALL1}/notes` | 400 or 500 |

### Phase F — Sharing

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| F1 | share with user | POST | `/calls/{CALL1}/share` | 201 |
| F2 | share with team (idempotent) | POST | `/calls/{CALL1}/share` | 201 |
| F3 | share invalid type rejected | POST | `/calls/{CALL1}/share` | 400 or 500 |

### Phase G — Next steps

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| G1 | GET next-steps (seeded) | GET | `/calls/{CALL1}/next-steps` | 200 |
| G2 | POST add next-step | POST | `/calls/{CALL1}/next-steps` | 201 |
| G3 | PATCH update index 0 | PATCH | `/calls/{CALL1}/next-steps` | 200 |
| G4 | DELETE next-step index 0 | DELETE | `/calls/{CALL1}/next-steps/0` | 204 |
| G5 | DELETE out-of-range index | DELETE | `/calls/{CALL1}/next-steps/9999` | 404 or 500 |

### Phase H — Utterance edit

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| H1 | fetch call detail for utterance | GET | `/calls/{CALL1}` | 200 |
| H2 | PATCH utterance text | PATCH | `/utterances/{uttId}` | 200 |

### Phase I — Create call lifecycle

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| I1 | POST /calls — create | POST | `/calls` | 201 |
| I2 | GET newly created call | GET | `/calls/{newId}` | 200 |
| I3 | POST extract-ai (no transcript) | POST | `/calls/{newId}/extract-ai` | 400 or 500 |
| I4 | DELETE newly created call | DELETE | `/calls/{newId}` | 200 |
| I5 | POST /calls — invalid (no participants) | POST | `/calls` | 400 or 500 |
| I6 | POST /calls — unknown callType | POST | `/calls` | 400 or 500 |

### Phase J — AI extraction

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| J1 | POST extract-ai on seeded call | POST | `/calls/{CALL1}/extract-ai` | 202 |
| J2 | POST extract-ai on unknown call | POST | `/calls/00000000-.../extract-ai` | 404 or 500 |

### Phase K — Webhooks

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| K1 | webhook without signature rejected | POST | `/api/v1/webhooks/zoom` | 401 |
| K2 | webhook test bypass (dev) | POST | `/api/v1/webhooks/zoom` + `x-webhook-test: 1` | 200 |

### Phase L — Concurrency

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| L1 | 5 concurrent note creates | POST ×5 | `/calls/{CALL1}/notes` | 201 ×5 |

### Phase M — Static assets

| # | Test name | Method | Path | Expected HTTP |
|---|-----------|--------|------|---------------|
| M1 | GET /uploads/ (static mount) | GET | `http://localhost:3001/uploads/audio/` | 200, 301, 302, or 404 |

**Seeded call IDs:** `11111111-1111-1111-1111-000000000001` (and 002, 003).
