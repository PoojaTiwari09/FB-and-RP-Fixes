# M03 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `doc/test_result/doc/test_result/doc/test_result/test_case/testm3.py`  
**API:** `http://localhost:3001/api/v1/ai-summaries-genai`

## Results: 9/9 PASS

| Phase | Test | Result |
|-------|------|--------|
| A | GET `/test/health` | PASS |
| B | GET `/workspace` | PASS |
| C | POST `/query` (Ask Anything) | PASS |
| D | POST `/research/jobs` + GET status | PASS |
| E | POST brief generate + GET brief | PASS |
| F | POST `/test/smoke` (E2E orchestration) | PASS |
| G | GET brief with wrong org → `data: null` | PASS |

## Flows verified

- Frontend → NestJS orchestration (no browser AI keys in test path)
- Research job simulation when FastAPI unavailable
- Brief persistence with `String?` summary semantics
- Tenant isolation on brief reads
- Query mock fallback with citations

## How to run

```bash
cd test_case
python testm3.py
```

Documented in `test3.md`.
