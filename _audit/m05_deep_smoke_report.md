# M05 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `test_case/testm5.py`  
**API:** `http://localhost:3001`

## Results: 7/7 PASS

| Test | Result | Notes |
|------|--------|-------|
| GET `/test/health` | PASS | |
| POST `/test/smoke` | PASS | |
| GET module info | PASS | No mock list |
| GET `/accounts` (no board_slug) | PASS | Returns error object |
| GET `/accounts?board_slug=demo` | PASS | 500 acceptable without Supabase |
| GET `/boards` | PASS | 500 acceptable without Supabase |
| POST webhook (dev, no secret) | PASS | 200 |

## With `M05_HUBSPOT_WEBHOOK_SECRET` set

- Invalid HMAC → expect 401
- Valid HMAC → expect 200

## Run

```bash
cd test_case
python testm5.py
```

Optional: `M05_HUBSPOT_WEBHOOK_SECRET=local-test-secret python testm5.py`
