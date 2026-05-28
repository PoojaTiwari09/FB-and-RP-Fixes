# M06 Event Materialization Report

**Date:** 2026-05-27

## Event: `forecast.submitted`

**Emitter:** `M06ForecastingPredictionService.submitForecast()` (unchanged contract)

**Consumer:** `ForecastSubmittedListener`

```
forecast.submitted
  → enqueue ai.prediction.run
  → enqueue forecast.executive.materialize
```

## Executive snapshot materialization

**Model:** `ForecastExecutiveSnapshot`  
**Worker job:** `forecast.executive.materialize`  
**Payload:** Full `getExecutiveDashboard()` result (computed with `skipSnapshot: true`)

**Read path:** `getExecutiveDashboard()` returns materialized `payload` when present (avoids heavy recompute on every request).

## Consistency

- Idempotency: `exec:{tenantId}:{periodId}:{submissionId}`
- Replay-safe: upsert/skip if snapshot exists
- Eventual consistency: dashboard may be stale until worker completes

## Not yet implemented

- `forecast.locked` emission
- `deal.stage.changed` producer (worker still handles type if enqueued)
