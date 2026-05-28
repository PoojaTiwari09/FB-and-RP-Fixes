# M09 — Test execution guide

**Runner:** `testm9.py`  
**Module base:** `/api/v1/coaching-training`

## Prerequisites

1. API on `http://localhost:3001` (ts-node, not tsx).
2. Optional: `GROQ_API_KEY` for live AI; without it, mock mode is used.

```powershell
cd r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence
$env:DATABASE_URL = "postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public"
pnpm --filter api run start
```

## Run

```powershell
cd r-revenue-intelligence-monorepo\doc\test_result\test_case
python testm9.py
```

## Environment

| Variable | Default |
|----------|---------|
| `M09_API_URL` | `http://localhost:3001/api/v1/coaching-training` |
| `M09_TEST_EMAIL` | `rep@example.com` |
| `M09_TEST_PASSWORD` | `password123` |
| `M09_LLM_PROVIDER` | `mock` / `groq` / `openai` / `gemini` |
| `JWT_SECRET` | required in production |

## Test phases

| Phase | Cases |
|-------|-------|
| A | Health, module root |
| B | Seed, built-in `/test/smoke` E2E |
| C | Login, invalid login, unauthenticated scenarios |
| D | List scenarios (JWT) |
| E | Start session, message, end, get session |
| F | Public voices |
| G | 5× parallel health |
| — | Signed JWT via `/test/token` |
