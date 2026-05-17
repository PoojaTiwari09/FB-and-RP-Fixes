# SDD — Module M-06 Insight-generation

## 1. What This Module Does
Strategic implementation for features inside lifecycle stage of the platform.

## 2. APIs
- `GET /api/v1/insights`
- `POST /api/v1/insights`

## 3. Events Consumed
- Upstream events triggered in platform.

## 4. Events Emitted
- `call.summary.generated`

## 5. Database Tables
- `m06_insight_generation`

## 6. AI Service Calls
- Internal AI Python router integration if needed.
