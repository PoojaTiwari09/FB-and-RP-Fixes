# M02 — Test execution guide

**Runner:** `testm2.py`  
**Source audit script:** `doc/test_result/m02_deep_smoke.mjs`  
**Module:** Conversation Intelligence

---

## Prerequisites

1. M01 stabilized and API running on **http://localhost:3001**.
2. Demo tenant seeded: `00000000-0000-0000-0000-000000000001`.
3. Python **3.9+**.

```powershell
cd r-revenue-intelligence-monorepo

$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
$env:M02_SEMANTIC_BACKEND = "simulated"
$env:DISABLE_REDIS = "true"

pnpm --filter api run start
```

---

## Run commands

```powershell
cd r-revenue-intelligence-monorepo\doc\test_result\test_case

python testm2.py

# Custom base URL
$env:M02_API_URL = "http://localhost:3001/api/v1"
python testm2.py

python testm2.py --base-url http://localhost:3001/api/v1
```

**Exit code:** `0` = all 37 passed, `1` = failures.

Node original (equivalent):

```powershell
node ..\doc\test_result\m02_deep_smoke.mjs
```

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `M02_API_URL` | `http://localhost:3001/api/v1` | API root |
| `M02_TENANT_A` | `00000000-0000-0000-0000-000000000001` | Seeded tenant |
| `M02_TENANT_B` | `00000000-0000-0000-0000-0000000000ff` | Isolation tenant (empty) |
| `M02_USER_A` | `00000000-0000-0000-0000-000000000002` | User for saved searches |

Headers sent when applicable:

- `x-tenant-id`
- `x-user-id` (saved-search routes)

---

## Individual test cases (37)

### Phase A — Auth & tenant guard (6)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| A1 | GET /conversations w/o tenant → 401 | GET | `/conversation-intelligence/conversations` | 401 |
| A2 | GET /conversations w/ tenant A → 200 | GET | `/conversation-intelligence/conversations` | 200 + body |
| A3 | GET /conversations w/ tenant B → empty | GET | `/conversation-intelligence/conversations` | 200, 0 rows |
| A4 | GET /vocabulary w/o tenant → 401 | GET | `/conversation-intelligence/vocabulary` | 401 |
| A5 | GET /trackers w/o tenant → 401 | GET | `/conversation-intelligence/trackers` | 401 |
| A6 | POST /saved-searches w/o tenant → 401 | POST | `/conversation-intelligence/saved-searches` | 401 |

### Phase B — Conversations list & filters (5)

| # | Test name | Method | Path | Body check |
|---|-----------|--------|------|------------|
| B1 | GET /conversations limit=5 page=1 | GET | `...?limit=5&page=1` | ≤5 items |
| B2 | GET /conversations sentiment=Positive | GET | `...?sentiment=Positive&limit=3` | all Positive |
| B3 | GET /conversations channel=email | GET | `...?channel=email&limit=3` | all email |
| B4 | GET /conversations topic=Pricing Strategy | GET | `...?topic=Pricing%20Strategy` | 200 |
| B5 | GET /conversations beyond page → empty | GET | `...?page=9999&limit=10` | 0 items |

### Phase C — Hybrid search (7)

| # | Test name | Method | Path | Body check |
|---|-----------|--------|------|------------|
| C1 | GET /search "pricing" → has results | GET | `.../search?query=pricing` | length > 0 |
| C2 | GET /search case-insensitive | GET | `.../search?query=PRICING` | length > 0 |
| C3 | GET /search empty query | GET | `.../search?query=` | array |
| C4 | GET /search nonsense → 0 results | GET | `.../search?query=zxqwerty12345` | length = 0 |
| C5 | GET /search paginated (limit=3) | GET | `.../search?query=demo&limit=3` | length ≤ 3 |
| C6 | GET /search multi-word query | GET | `.../search?query=onboarding%20training` | length > 0 |
| C7 | GET /search tenant B → empty | GET | `.../search?query=pricing` (tenant B) | length = 0 |

### Phase D — Saved searches (3)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| D1 | POST /saved-searches | POST | `/conversation-intelligence/saved-searches` | 201, tenant+user set |
| D2 | GET /saved-searches | GET | `/conversation-intelligence/saved-searches` | 200, array |
| D3 | GET /saved-searches w/o user → 401 | GET | `/conversation-intelligence/saved-searches` | 401 |

### Phase E — Trackers (4)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| E1 | POST /trackers | POST | `/conversation-intelligence/trackers` | 201 |
| E2 | GET /trackers | GET | `/conversation-intelligence/trackers` | 200, array |
| E3 | GET /trackers/stats | GET | `/conversation-intelligence/trackers/stats` | 200, `totalTrackers` |
| E4 | GET /trackers/detections | GET | `/conversation-intelligence/trackers/detections` | 200, array |

### Phase F — Topic taxonomy & tags (4)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| F1 | POST /topics/seed (idempotent) | POST | `/m02-conversation-intelligence/topics/seed` | 200 or 201 |
| F2 | GET /topics | GET | `/m02-conversation-intelligence/topics` | 200, array |
| F3 | GET /topics w/o tenant → 401 | GET | `/m02-conversation-intelligence/topics` | 401 |
| F4 | GET /conversations/:id/topics w/o tenant → 401 | GET | `/m02-conversation-intelligence/conversations/some-id/topics` | 401 |

### Phase G — Translation (3)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| G1 | GET /translate/settings | GET | `/m02-conversation-intelligence/translate/settings` | 200 |
| G2 | POST /translate/settings | POST | `/m02-conversation-intelligence/translate/settings` | 200 or 201 |
| G3 | GET /translate/settings w/o tenant → 401 | GET | `/m02-conversation-intelligence/translate/settings` | 401 |

### Phase H — Vocabulary corrections (3)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| H1 | POST /vocabulary | POST | `/conversation-intelligence/vocabulary` | 201 |
| H2 | GET /vocabulary | GET | `/conversation-intelligence/vocabulary` | 200, array |
| H3 | GET /vocabulary/stats | GET | `/conversation-intelligence/vocabulary/stats` | 200, `termsCount` |

### Phase I — Concurrency stress (2)

| # | Test name | Method | Path | Expected |
|---|-----------|--------|------|----------|
| I1 | 5 parallel /saved-searches | POST ×5 | `/conversation-intelligence/saved-searches` | 5/5 success |
| I2 | 5 parallel /search varied keywords | GET ×5 | `/conversation-intelligence/conversations/search?query=...` | 5/5 success |
