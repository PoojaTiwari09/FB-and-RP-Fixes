# M06 Deep Smoke Report

**Date:** 2026-05-27  
**Harness:** `test_case/testm6.py`

## Tests

| Case | Route | Expected |
|------|-------|----------|
| Executive snapshot | GET `/executive/snapshot` | 200/404 |
| AI job status | GET `/periods/current/ai-prediction/status` | 200/403/404 |
| Enqueue prediction | POST `/periods/current/ai-prediction/run` | 200/201/403/404 |
| HubSpot status | GET `/api/v1/hubspot/status` | 200/403 |

## Prerequisites

- API on `:3001`
- `x-tenant-id: demo-tenant-01`
- DB migrated with M06 tables
- Redis optional (`DISABLE_REDIS=true` — in-process queue may not process without Redis)

## Run

```bash
cd test_case
python testm6.py
```
