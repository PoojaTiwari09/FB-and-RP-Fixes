# SDD — Module M-01 Capture

## 1. What This Module Does
Strategic implementation for features inside lifecycle stage of the platform.

## 2. APIs
- `GET /api/v1/ingestion`
- `POST /api/v1/ingestion`

## 3. Events Consumed
- Upstream events triggered in platform.

## 4. Events Emitted
- `call.transcription.completed`

## 5. Database Tables
- `m01_capture`

## 6. AI Service Calls
- Internal AI Python router integration if needed.
