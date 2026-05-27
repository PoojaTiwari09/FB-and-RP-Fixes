# M06 Async Prediction Refactor Report

**Date:** 2026-05-27

## Before

- GET `/ai-prediction` read DB only (404 if no snapshot) — OK
- `createDeal` **synchronously** created `aiForecastSnapshot` in request path
- BullMQ worker existed but **no job producer**
- No job status persistence

## After

| Component | Role |
|-----------|------|
| `M06PredictionQueueService` | Enqueue with idempotency + `m06_prediction_jobs` rows |
| `M06ForecastingPredictionWorker` | Processes `ai.prediction.run`, `forecast.executive.materialize` |
| `ForecastSubmittedListener` | `@OnEvent('forecast.submitted')` → enqueue prediction + executive materialize |
| API | `POST .../ai-prediction/run`, `GET .../ai-prediction/status` |

## Request flow

```
POST /ai-prediction/run → enqueue → worker → aiForecastSnapshot.create → job completed
GET  /ai-prediction     → read latest snapshot (404 + job hint if pending)
```

## Safety

- Idempotency keys on Bull jobs and DB jobs
- Retries: 3 attempts, exponential backoff
- Rate limit: 60 min between recalcs (worker)
- `createDeal` enqueues instead of blocking on snapshot math

## Gap

- Python `:8000/predict` optional; worker falls back to deterministic explainability math
