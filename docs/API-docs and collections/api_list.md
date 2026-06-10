# Revenue Intelligence Platform - Complete API Inventory

> **Document Purpose**: This document lists all APIs configured in the monorepo, structured module-wise. It serves as an exhaustive reference for backend integration, authentication/authorization requirements, payloads, and response structures.

## Global Authentication & Security Context

### Authentication Models
1. **Supabase JWT Authentication**: Enabled globally via NestJS `JwtAuthGuard` (built on passport-jwt) except on endpoints marked `@Public()`.
2. **Bypass Header (Development / Testing)**: In development, JWT verification is bypassed if the `x-tenant-id` header is present.
3. **TenantGuard & Multi-Tenancy**: Applied globally across most modules via `TenantGuard`, resolving `tenantId` (from `x-tenant-id` header or JWT claims) and injecting context (`userId`, `userRole` via `x-user-id` and `x-user-role` headers).
4. **FastAPI Microservices**: Primarily secure internal endpoints accessed by the NestJS gateways or protected via key/HMAC depending on execution mode.

### Legend
- **REST**: Representative State Transfer HTTP architecture.
- **SOAP**: Simple Object Access Protocol. (Note: The entire codebase utilizes RESTful JSON APIs; no SOAP endpoints are configured).
- **JWT / Tenant Header**: Requires valid Supabase Auth token, or `x-tenant-id` header in development.

## Table of Modules
- [AI Services (FastAPI Shared Microservice)](#ai-services-(fastapi-shared-microservice)) (6 Endpoints)
- [M01: Capture & Transcription](#m01-capture-and-transcription) (11 Endpoints)
- [M02: Conversation Intelligence](#m02-conversation-intelligence) (29 Endpoints)
- [M03: AI Summaries & GenAI](#m03-ai-summaries-and-genai) (34 Endpoints)
- [M04: Deal Intelligence](#m04-deal-intelligence) (152 Endpoints)
- [M05: Account Intelligence](#m05-account-intelligence) (32 Endpoints)
- [M06: Forecasting & Prediction](#m06-forecasting-and-prediction) (94 Endpoints)
- [M07: Revenue Dashboards](#m07-revenue-dashboards) (1 Endpoints)
- [M08: Sales Engagement](#m08-sales-engagement) (42 Endpoints)
- [M09: Coaching & Training](#m09-coaching-and-training) (79 Endpoints)
- [M10: Data Compliance & Trust](#m10-data-compliance-and-trust) (16 Endpoints)

## AI Services (FastAPI Shared Microservice)

### 1. `POST /extract/highlights`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`ExtractHighlightsResponse`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `highlights()` in [`extraction.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/routers/extraction.py)

---

### 2. `POST /extract/summarize`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`SummarizeResponse`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `summarize()` in [`extraction.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/routers/extraction.py)

---

### 3. `POST /extract/talk-ratio`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`TalkRatioResponse`):
  - `speakers: list[SpeakerRatio]`
  - `total_duration_ms: int`
- **Response Structure**:
JSON (`TalkRatioResponse`):
- `speakers: list[SpeakerRatio]`
- `total_duration_ms: int`
- **Controller Handler**: Function `talk_ratio()` in [`extraction.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/routers/extraction.py)

---

### 4. `GET /health`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `health()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/main.py)

---

### 5. `GET /internal/health`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `internal_health()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/main.py)

---

### 6. `POST /transcribe`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`TranscribeRequest`):
  - `audioUrl: str`
  - `callId: str`
  - `tenantId: str`
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `transcribe()` in [`transcription.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/apps/ai-services/app/routers/transcription.py)

---

## M01: Capture & Transcription

### 1. `GET /api/v1/capture-transcription/calls/:callId/ai-insights`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendAiReviewerDetailController.aiInsights()` in [`m01-frontend-ai-reviewer.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts)

---

### 2. `GET /api/v1/capture-transcription/calls/:callId/audio-url`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendAiReviewerDetailController.audioUrl()` in [`m01-frontend-ai-reviewer.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts)

---

### 3. `GET /api/v1/capture-transcription/calls/:callId/feedback`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendAiReviewerDetailController.feedback()` in [`m01-frontend-ai-reviewer.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts)

---

### 4. `GET /api/v1/capture-transcription/calls/:callId/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendCallDetailController.getNotes()` in [`m01-frontend-call-detail.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts)

---

### 5. `POST /api/v1/capture-transcription/calls/:callId/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendCallDetailController.createNote()` in [`m01-frontend-call-detail.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-call-detail.controller.ts)

---

### 6. `GET /api/v1/capture-transcription/calls/:callId/review`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendAiReviewerDetailController.review()` in [`m01-frontend-ai-reviewer.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts)

---

### 7. `GET /api/v1/capture-transcription/calls/:callId/transcript-entries`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('callId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendAiReviewerDetailController.transcriptEntries()` in [`m01-frontend-ai-reviewer.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-ai-reviewer.controller.ts)

---

### 8. `POST /api/v1/capture-transcription/calls/upload`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M01FrontendUploadController.upload()` in [`m01-frontend-upload.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/m01-frontend-upload.controller.ts)

---

### 9. `POST /api/v1/capture-transcription/calls/upload`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `UploadController.uploadAudio()` in [`upload.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/upload.controller.ts)

---

### 10. `POST /api/v1/webhooks/teams`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WebhookController.handleTeamsWebhook()` in [`webhook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/webhook.controller.ts)

---

### 11. `POST /api/v1/webhooks/zoom`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WebhookController.handleZoomWebhook()` in [`webhook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m01-capture-transcription/controllers/webhook.controller.ts)

---

## M02: Conversation Intelligence

### 1. `GET /api/v1/conversation-intelligence/conversations`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M02ConversationIntelligenceController.list()` in [`m02.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/m02.controller.ts)

---

### 2. `GET /api/v1/conversation-intelligence/conversations/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M02ConversationIntelligenceController.findById()` in [`m02.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/m02.controller.ts)

---

### 3. `GET /api/v1/conversation-intelligence/conversations/search`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M02ConversationIntelligenceController.search()` in [`m02.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/m02.controller.ts)

---

### 4. `GET /api/v1/conversation-intelligence/saved-searches`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M02ConversationIntelligenceController.getSavedSearches()` in [`m02.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/m02.controller.ts)

---

### 5. `POST /api/v1/conversation-intelligence/saved-searches`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M02ConversationIntelligenceController.saveSearch()` in [`m02.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/m02.controller.ts)

---

### 6. `GET /api/v1/conversation-intelligence/trackers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.getTrackers()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 7. `POST /api/v1/conversation-intelligence/trackers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.createTracker()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 8. `DELETE /api/v1/conversation-intelligence/trackers/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.deleteTracker()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 9. `PUT /api/v1/conversation-intelligence/trackers/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.updateTracker()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 10. `GET /api/v1/conversation-intelligence/trackers/detections`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.getAllDetections()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 11. `GET /api/v1/conversation-intelligence/trackers/detections/:entityId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.getDetectionsForConversation()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 12. `GET /api/v1/conversation-intelligence/trackers/stats`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrackerController.getStats()` in [`tracker.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/tracker.controller.ts)

---

### 13. `GET /api/v1/conversation-intelligence/vocabulary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `VocabularyCorrectionController.getRules()` in [`vocabulary-correction.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/vocabulary-correction.controller.ts)

---

### 14. `POST /api/v1/conversation-intelligence/vocabulary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `VocabularyCorrectionController.createRule()` in [`vocabulary-correction.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/vocabulary-correction.controller.ts)

---

### 15. `DELETE /api/v1/conversation-intelligence/vocabulary/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `VocabularyCorrectionController.deleteRule()` in [`vocabulary-correction.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/vocabulary-correction.controller.ts)

---

### 16. `GET /api/v1/conversation-intelligence/vocabulary/stats`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `VocabularyCorrectionController.getStats()` in [`vocabulary-correction.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/vocabulary-correction.controller.ts)

---

### 17. `GET /api/v1/m02-conversation-intelligence/conversations/:id/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicTagController.getTagsForConversation()` in [`topic-tag.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-tag.controller.ts)

---

### 18. `POST /api/v1/m02-conversation-intelligence/conversations/:id/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicTagController.addManualTag()` in [`topic-tag.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-tag.controller.ts)

---

### 19. `POST /api/v1/m02-conversation-intelligence/conversations/batch-tag`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicTagController.batchTagTranscripts()` in [`topic-tag.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-tag.controller.ts)

---

### 20. `GET /api/v1/m02-conversation-intelligence/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.getTopicModels()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 21. `POST /api/v1/m02-conversation-intelligence/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.createTopicModel()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 22. `DELETE /api/v1/m02-conversation-intelligence/topics/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.deleteTopicModel()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 23. `DELETE /api/v1/m02-conversation-intelligence/topics/remove`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.removeTopic()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 24. `POST /api/v1/m02-conversation-intelligence/topics/seed`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.seedDefaultTopics()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 25. `DELETE /api/v1/m02-conversation-intelligence/topics/tags/:tagId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('tagId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicTagController.deleteTag()` in [`topic-tag.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-tag.controller.ts)

---

### 26. `POST /api/v1/m02-conversation-intelligence/topics/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TopicManagementController.addTopicToModel()` in [`topic-management.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/topic-management.controller.ts)

---

### 27. `POST /api/v1/m02-conversation-intelligence/translate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TranslationController.translateContent()` in [`translation.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/translation.controller.ts)

---

### 28. `GET /api/v1/m02-conversation-intelligence/translate/settings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TranslationController.getSettings()` in [`translation.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/translation.controller.ts)

---

### 29. `POST /api/v1/m02-conversation-intelligence/translate/settings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TranslationController.updateSettings()` in [`translation.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m02-conversation-intelligence/controllers/translation.controller.ts)

---

## M03: AI Summaries & GenAI

### 1. `GET /api/admin/templates`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `list_templates()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 2. `POST /api/admin/templates`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `create_template()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 3. `DELETE /api/admin/templates/{template_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `delete_template()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 4. `GET /api/admin/templates/{template_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_template()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 5. `PUT /api/admin/templates/{template_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `update_template()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 6. `POST /api/ai-summaries/{brief_type}-brief/{entity_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `generate_brief()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 7. `GET /api/feedback`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_brief_feedback_stats()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 8. `POST /api/feedback`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `submit_brief_feedback()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 9. `POST /api/share/create`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `create_share_link()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 10. `POST /api/share/revoke`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `revoke_share_link()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 11. `GET /api/share/{token}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_shared_brief()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 12. `POST /api/v1/ai-summaries-genai/feedback/reports/:reportId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('reportId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `FeedbackController.submitReportFeedback()` in [`feedback.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/feedback.controller.ts)

---

### 13. `POST /api/v1/ai-summaries-genai/query`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `QueryController.askAnything()` in [`query.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/query.controller.ts)

---

### 14. `GET /api/v1/ai-summaries-genai/research/jobs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.listJobs()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 15. `POST /api/v1/ai-summaries-genai/research/jobs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.createJob()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 16. `GET /api/v1/ai-summaries-genai/research/jobs/:jobId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('jobId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.getJobStatus()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 17. `POST /api/v1/ai-summaries-genai/research/jobs/:jobId/cancel`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('jobId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.cancelJob()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 18. `GET /api/v1/ai-summaries-genai/research/reports/:reportId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('reportId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.getReport()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 19. `GET /api/v1/ai-summaries-genai/research/reports/:reportId/history`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('reportId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ResearchController.getReportHistory()` in [`research.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/research.controller.ts)

---

### 20. `GET /api/v1/ai-summaries-genai/test/health`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M03TestController.health()` in [`m03-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts)

---

### 21. `POST /api/v1/ai-summaries-genai/test/seed-crm`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M03TestController.seedCrm()` in [`m03-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts)

---

### 22. `POST /api/v1/ai-summaries-genai/test/smoke`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M03TestController.smoke()` in [`m03-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts)

---

### 23. `GET /api/v1/ai-summaries-genai/test/workspace-stats`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M03TestController.workspaceStats()` in [`m03-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts)

---

### 24. `GET /api/v1/ai-summaries-genai/workspace`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WorkspaceController.getWorkspace()` in [`workspace.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/controllers/workspace.controller.ts)

---

### 25. `GET /api/v1/data/summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_data_summary()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 26. `POST /api/v1/query`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`QueryResponse`):
  - `answer: str`
  - `citations: List[Citation]`
  - `follow_up_questions: List[str]`
  - `session_id: str`
  - `can_escalate: bool`
- **Response Structure**:
JSON (`QueryResponse`):
- `answer: str`
- `citations: List[Citation]`
- `follow_up_questions: List[str]`
- `session_id: str`
- `can_escalate: bool`
- **Controller Handler**: Function `ask_anything()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 27. `GET /api/v1/research/jobs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `list_jobs()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 28. `GET /api/v1/research/jobs/{job_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_job_status()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 29. `POST /api/v1/research/jobs/{job_id}/cancel`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `cancel_job()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 30. `GET /api/v1/research/reports/{report_id}`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_report()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 31. `POST /api/v1/research/reports/{report_id}/feedback`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `submit_feedback()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 32. `GET /api/v1/research/reports/{report_id}/history`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `get_report_history()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 33. `POST /api/v1/research/run`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`ResearchResponse`):
  - `job_id: str`
  - `status: JobStatus`
  - `report: Optional[ResearchReport]`
  - `progress_pct: int`
  - `progress_stage: str`
  - `error: Optional[str]`
- **Response Structure**:
JSON (`ResearchResponse`):
- `job_id: str`
- `status: JobStatus`
- `report: Optional[ResearchReport]`
- `progress_pct: int`
- `progress_stage: str`
- `error: Optional[str]`
- **Controller Handler**: Function `create_research_job()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

### 34. `GET /health`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`HealthResponse`):
- `status: str`
- `service: str`
- `groq_connected: bool`
- `supabase_connected: bool`
- **Controller Handler**: Function `health_check()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m03-ai-summaries-genai/fastapi/main.py)

---

## M04: Deal Intelligence

### 1. `POST /analytics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getAnalytics()` in [`analytics.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/analytics.controller.ts)

---

### 2. `GET /analytics/ae`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getAEAnalytics()` in [`analytics.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/analytics.controller.ts)

---

### 3. `GET /analytics/executive`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getExecutiveAnalytics()` in [`analytics.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/analytics.controller.ts)

---

### 4. `GET /analytics/historical`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getHistoricalMetrics()` in [`analytics.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/analytics.controller.ts)

---

### 5. `GET /analytics/manager`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getManagerAnalytics()` in [`analytics.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/analytics.controller.ts)

---

### 6. `GET /api/deal-drivers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversApiController.list()` in [`deal-drivers-api.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-api.controller.ts)

---

### 7. `POST /api/deal-drivers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversApiController.create()` in [`deal-drivers-api.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-api.controller.ts)

---

### 8. `DELETE /api/deal-drivers/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversApiController.remove()` in [`deal-drivers-api.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-api.controller.ts)

---

### 9. `GET /api/deal-drivers/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversApiController.getOne()` in [`deal-drivers-api.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-api.controller.ts)

---

### 10. `PUT /api/deal-drivers/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversApiController.update()` in [`deal-drivers-api.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-api.controller.ts)

---

### 11. `GET /api/deals/:dealId/drivers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversDealController.listForDeal()` in [`deal-drivers-deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers-deal.controller.ts)

---

### 12. `GET /api/v1/deal-management/:dealId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealById()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 13. `PATCH /api/v1/deal-management/:dealId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.updateDeal()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 14. `GET /api/v1/deal-management/:dealId/activity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealActivity()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 15. `GET /api/v1/deal-management/:dealId/brief`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealBrief()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 16. `GET /api/v1/deal-management/:dealId/comments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealComments()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 17. `POST /api/v1/deal-management/:dealId/comments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.postDealComment()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 18. `GET /api/v1/deal-management/:dealId/crm-fields`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealCrmFields()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 19. `DELETE /api/v1/deal-management/:dealId/escalation`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.removeEscalation()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 20. `GET /api/v1/deal-management/:dealId/escalation`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getEscalationStatus()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 21. `POST /api/v1/deal-management/:dealId/escalation`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.escalateDeal()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 22. `GET /api/v1/deal-management/:dealId/playbook`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealPlaybook()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 23. `PATCH /api/v1/deal-management/:dealId/playbook/criteria/:criterionId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.updatePlaybookCriterion()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 24. `GET /api/v1/deal-management/:dealId/warnings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealWarnings()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 25. `PATCH /api/v1/deal-management/:dealId/warnings/:warningId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.resolveWarning()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 26. `POST /api/v1/deal-management/:dealId/warnings/:warningId/action`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.triggerWarningAction()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 27. `GET /api/v1/deal-management/all`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getAllDeals()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 28. `GET /api/v1/deal-management/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealBoards()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 29. `GET /api/v1/deal-management/boards/:boardId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getBoardDetail()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 30. `GET /api/v1/deal-management/boards/:boardId/deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getDealsByBoard()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 31. `GET /api/v1/deal-management/deal-boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardsRepController.getDealBoards()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 32. `GET /api/v1/deal-management/deal-boards/:boardId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardsRepController.getBoardDetail()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 33. `GET /api/v1/deal-management/deal-boards/:boardId/deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardsRepController.getDealsByBoard()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 34. `GET /api/v1/deal-management/notifications`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getNotifications()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 35. `GET /api/v1/deal-management/notifications`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `NotificationsApiController.getNotifications()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 36. `POST /api/v1/deal-management/notifications`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.createNotification()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 37. `PATCH /api/v1/deal-management/notifications/read-all`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.markAllNotificationsRead()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 38. `PATCH /api/v1/deal-management/notifications/read-all`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `NotificationsApiController.markAllNotificationsRead()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 39. `GET /api/v1/deal-management/pipeline-summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.getPipelineSummary()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 40. `POST /api/v1/deal-management/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealsController.createDealTask()` in [`deals.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deals.controller.ts)

---

### 41. `POST /auth/login`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `AuthController.login()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/auth.controller.ts)

---

### 42. `POST /auth/logout`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
No payload
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `AuthController.logout()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/auth.controller.ts)

---

### 43. `GET /auth/me`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AuthController.getCurrentUser()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/auth.controller.ts)

---

### 44. `POST /auth/register`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `AuthController.register()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/auth.controller.ts)

---

### 45. `GET /boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.listBoards()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 46. `POST /boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.createBoard()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 47. `DELETE /boards/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.deleteBoard()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 48. `GET /boards/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.getBoardById()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 49. `PATCH /boards/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.updateBoard()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 50. `POST /boards/:id/publish`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.publishBoard()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 51. `POST /boards/:id/unpublish`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealBoardController.unpublishBoard()` in [`deal-board.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-board.controller.ts)

---

### 52. `GET /coaching/deals/:dealId/prompts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.getPromptsForDeal()` in [`coaching.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/coaching.controller.ts)

---

### 53. `GET /coaching/opportunities`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.getTeamOpportunities()` in [`coaching.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/coaching.controller.ts)

---

### 54. `POST /coaching/prompts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.generatePrompts()` in [`coaching.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/coaching.controller.ts)

---

### 55. `GET /deal-drivers/board-comparison`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getBoardComparison()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 56. `GET /deal-drivers/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getBoards()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 57. `GET /deal-drivers/boards/:boardId/warnings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardWarningConfigController.listBoardWarnings()` in [`board-warning-config.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/board-warning-config.controller.ts)

---

### 58. `POST /deal-drivers/boards/:boardId/warnings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardWarningConfigController.addWarningToBoard()` in [`board-warning-config.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/board-warning-config.controller.ts)

---

### 59. `DELETE /deal-drivers/boards/:boardId/warnings/:warningConfigId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardWarningConfigController.removeWarningFromBoard()` in [`board-warning-config.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/board-warning-config.controller.ts)

---

### 60. `PATCH /deal-drivers/boards/:boardId/warnings/:warningConfigId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('boardId', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardWarningConfigController.updateBoardWarning()` in [`board-warning-config.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/board-warning-config.controller.ts)

---

### 61. `GET /deal-drivers/coaching`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getCoachingEffectiveness()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 62. `GET /deal-drivers/drill-down`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getDrillDown()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 63. `POST /deal-drivers/events`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.createWarningEvent()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 64. `POST /deal-drivers/events/bulk`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.bulkCreateWarningEvents()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 65. `GET /deal-drivers/last-used-board`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getLastUsedBoard()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 66. `POST /deal-drivers/lifecycle`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.openDealLifecycle()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 67. `PATCH /deal-drivers/lifecycle/:id/close`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.closeDealLifecycle()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 68. `GET /deal-drivers/managers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getManagers()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 69. `GET /deal-drivers/matrix`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getMatrix()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 70. `GET /deal-drivers/matrix/export`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.exportMatrixCsv()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 71. `POST /deal-drivers/reassignments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.createDealReassignment()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 72. `GET /deal-drivers/reps`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getReps()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 73. `GET /deal-drivers/warning-definitions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningDefinitionsController.listWarningDefinitions()` in [`warning-definitions.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/warning-definitions.controller.ts)

---

### 74. `POST /deal-drivers/warning-definitions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningDefinitionsController.createWarningDefinition()` in [`warning-definitions.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/warning-definitions.controller.ts)

---

### 75. `PATCH /deal-drivers/warning-definitions/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id', ParseUUIDPipe`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningDefinitionsController.updateWarningDefinition()` in [`warning-definitions.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/warning-definitions.controller.ts)

---

### 76. `GET /deal-drivers/warnings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealDriversController.getWarnings()` in [`deal-drivers.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-drivers.controller.ts)

---

### 77. `GET /deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.findAll()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 78. `GET /deals/:dealId/activities`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.getActivities()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 79. `POST /deals/:dealId/activities`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.createActivity()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 80. `DELETE /deals/:dealId/activities/:activityId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.deleteActivity()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 81. `GET /deals/:dealId/activities/:activityId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.getActivity()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 82. `PATCH /deals/:dealId/activities/:activityId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.updateActivity()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 83. `GET /deals/:dealId/activities/timeline`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealActivityController.getTimeline()` in [`deal-activity.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-activity.controller.ts)

---

### 84. `GET /deals/:dealId/comments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.getCommentsForDeal()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 85. `POST /deals/:dealId/comments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.createComment()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 86. `DELETE /deals/:dealId/comments/:commentId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.deleteComment()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 87. `GET /deals/:dealId/comments/:commentId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.getComment()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 88. `PATCH /deals/:dealId/comments/:commentId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.updateComment()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 89. `GET /deals/:dealId/comments/coaching`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealCommentController.getCoachingComments()` in [`deal-comment.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-comment.controller.ts)

---

### 90. `GET /deals/:dealId/playbook`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.getPlaybook()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 91. `POST /deals/:dealId/playbook/initialize/bant`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.initializeBANT()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 92. `POST /deals/:dealId/playbook/initialize/meddicc`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.initializeMEDDICC()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 93. `POST /deals/:dealId/playbook/items`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.createPlaybookItem()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 94. `DELETE /deals/:dealId/playbook/items/:itemId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.deletePlaybookItem()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 95. `PATCH /deals/:dealId/playbook/items/:itemId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.updatePlaybookItem()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 96. `POST /deals/:dealId/playbook/suggestions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealPlaybookController.generateAISuggestions()` in [`deal-playbook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-playbook.controller.ts)

---

### 97. `POST /deals/:dealId/risk/deescalate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RiskEscalationController.deescalateRisk()` in [`risk-escalation.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/risk-escalation.controller.ts)

---

### 98. `POST /deals/:dealId/risk/escalate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RiskEscalationController.escalateRisk()` in [`risk-escalation.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/risk-escalation.controller.ts)

---

### 99. `GET /deals/:dealId/score/current`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AIScoreController.getCurrentScore()` in [`ai-score.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/ai-score.controller.ts)

---

### 100. `POST /deals/:dealId/score/generate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AIScoreController.generateScore()` in [`ai-score.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/ai-score.controller.ts)

---

### 101. `GET /deals/:dealId/score/history`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AIScoreController.getScoreHistory()` in [`ai-score.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/ai-score.controller.ts)

---

### 102. `PATCH /deals/:dealId/summaries/:summaryId/flag`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('summaryId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.flagForReview()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 103. `PATCH /deals/:dealId/summaries/:summaryId/unflag`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('summaryId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.unflagForReview()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 104. `GET /deals/:dealId/summaries/current`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.getCurrentSummary()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 105. `POST /deals/:dealId/summaries/generate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.generateSummary()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 106. `GET /deals/:dealId/summaries/history`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.getSummaryHistory()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 107. `GET /deals/:dealId/summaries/weekly-changes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealSummaryController.detectWeeklyChanges()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 108. `GET /deals/:dealId/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.getTasksForDeal()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 109. `POST /deals/:dealId/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.createTask()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 110. `DELETE /deals/:dealId/tasks/:taskId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.deleteTask()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 111. `GET /deals/:dealId/tasks/:taskId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.getTask()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 112. `PATCH /deals/:dealId/tasks/:taskId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.updateTask()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 113. `POST /deals/:dealId/tasks/generate-next-steps`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealTaskController.generateNextSteps()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 114. `PATCH /deals/:dealId/warnings/:warningId/resolve`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('warningId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealWarningController.resolveWarning()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 115. `GET /deals/:dealId/warnings/active`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealWarningController.getActiveWarnings()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 116. `POST /deals/:dealId/warnings/generate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealWarningController.generateWarnings()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 117. `GET /deals/:dealId/warnings/history`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealWarningController.getWarningHistory()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 118. `GET /deals/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.findById()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 119. `PATCH /deals/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.update()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 120. `GET /deals/closing-soon`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.getDealsClosingSoon()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 121. `GET /deals/high-risk`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.getHighRiskDeals()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 122. `GET /deals/my-deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.getMyDeals()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 123. `GET /deals/notifications/recent`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.getRecentNotifications()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 124. `GET /deals/stats`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DealController.getStats()` in [`deal.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal.controller.ts)

---

### 125. `POST /exports`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ExportController.createExport()` in [`export.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/export.controller.ts)

---

### 126. `GET /exports/download/:exportId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('exportId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ExportController.downloadExport()` in [`export.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/export.controller.ts)

---

### 127. `POST /m04-test/smoke`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M04TestController.smoke()` in [`m04-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/m04-test.controller.ts)

---

### 128. `DELETE /settings`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.deleteSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 129. `DELETE /settings/all`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.resetAllSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 130. `GET /settings/all`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getAllSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 131. `GET /settings/coaching`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getCoachingSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 132. `POST /settings/coaching`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.saveCoachingSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 133. `GET /settings/filters`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getFilters()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 134. `POST /settings/filters`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.saveFilters()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 135. `GET /settings/global`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getGlobalSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 136. `POST /settings/global`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.saveGlobalSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 137. `GET /settings/notifications`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getNotificationSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 138. `POST /settings/notifications`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.saveNotificationSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 139. `GET /settings/view`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.getViewSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 140. `POST /settings/view`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SettingsController.saveViewSettings()` in [`settings.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/settings.controller.ts)

---

### 141. `GET /summaries/flagged`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SummaryManagementController.getFlaggedSummaries()` in [`deal-summary.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-summary.controller.ts)

---

### 142. `POST /sync/deals/full`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SyncController.triggerFullSync()` in [`sync.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/sync.controller.ts)

---

### 143. `POST /sync/deals/incremental`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SyncController.triggerIncrementalSync()` in [`sync.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/sync.controller.ts)

---

### 144. `GET /sync/logs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SyncController.getSyncLogs()` in [`sync.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/sync.controller.ts)

---

### 145. `GET /sync/status`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SyncController.getSyncStatus()` in [`sync.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/sync.controller.ts)

---

### 146. `GET /tasks/my-tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TaskManagementController.getMyTasks()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 147. `GET /tasks/overdue`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TaskManagementController.getOverdueTasks()` in [`deal-task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-task.controller.ts)

---

### 148. `GET /warnings/by-severity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningManagementController.getWarningsBySeverity()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 149. `GET /warnings/by-type`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningManagementController.getWarningsByType()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 150. `GET /warnings/critical`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WarningManagementController.getCriticalWarnings()` in [`deal-warning.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/deal-warning.controller.ts)

---

### 151. `POST /webhooks/hubspot`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WebhookController.handleHubSpotWebhook()` in [`webhook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/webhook.controller.ts)

---

### 152. `POST /webhooks/hubspot/test`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WebhookController.testWebhook()` in [`webhook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m04-deal-intelligence/controllers/webhook.controller.ts)

---

## M05: Account Intelligence

### 1. `GET /api/v1/account-intelligence/accounts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AccountsController.getAccounts()` in [`accounts.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/accounts.controller.ts)

---

### 2. `GET /api/v1/account-intelligence/accounts/:hubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AccountsController.getAccountDetail()` in [`accounts.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/accounts.controller.ts)

---

### 3. `GET /api/v1/account-intelligence/accounts/engagement-gap`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AccountsController.getEngagementGap()` in [`accounts.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/accounts.controller.ts)

---

### 4. `GET /api/v1/account-intelligence/accounts/sparklines`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AccountsController.getSparklines()` in [`accounts.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/accounts.controller.ts)

---

### 5. `GET /api/v1/account-intelligence/activities/:companyHubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('companyHubspotId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ActivitiesController.getActivities()` in [`activities.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/activities.controller.ts)

---

### 6. `POST /api/v1/account-intelligence/ai/chat`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AiController.chat()` in [`ai.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/ai.controller.ts)

---

### 7. `POST /api/v1/account-intelligence/ai/summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AiController.generateSummary()` in [`ai.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/ai.controller.ts)

---

### 8. `GET /api/v1/account-intelligence/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.getAllBoards()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 9. `POST /api/v1/account-intelligence/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.createBoard()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 10. `DELETE /api/v1/account-intelligence/boards/:slug`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.deleteBoard()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 11. `GET /api/v1/account-intelligence/boards/:slug`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.getBoardBySlug()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 12. `PUT /api/v1/account-intelligence/boards/:slug`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.updateBoard()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 13. `PATCH /api/v1/account-intelligence/boards/:slug/brief-config`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.updateBriefConfig()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 14. `POST /api/v1/account-intelligence/boards/:slug/columns`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.addColumn()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 15. `DELETE /api/v1/account-intelligence/boards/:slug/columns/:colId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.deleteColumn()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 16. `PUT /api/v1/account-intelligence/boards/:slug/columns/:colId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.updateColumn()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 17. `POST /api/v1/account-intelligence/boards/:slug/duplicate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('slug'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.duplicateBoard()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 18. `GET /api/v1/account-intelligence/boards/permissions/:role`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('role'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.getPermissions()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 19. `GET /api/v1/account-intelligence/boards/team`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `BoardsController.getTeam()` in [`boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/boards.controller.ts)

---

### 20. `PATCH /api/v1/account-intelligence/edits/company/:hubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('hubspotId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `EditsController.editCompany()` in [`edits.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/edits.controller.ts)

---

### 21. `PATCH /api/v1/account-intelligence/edits/deal/:dealId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('dealId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `EditsController.editDeal()` in [`edits.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/edits.controller.ts)

---

### 22. `PATCH /api/v1/account-intelligence/edits/supplementary/:companyHubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('companyHubspotId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `EditsController.editSupplementary()` in [`edits.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/edits.controller.ts)

---

### 23. `DELETE /api/v1/account-intelligence/preferences/:role`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('role'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `PreferencesController.clearPreferences()` in [`preferences.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/preferences.controller.ts)

---

### 24. `GET /api/v1/account-intelligence/preferences/:role`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('role'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `PreferencesController.getAllPreferences()` in [`preferences.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/preferences.controller.ts)

---

### 25. `PUT /api/v1/account-intelligence/preferences/:role/:boardId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('role'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `PreferencesController.upsertPreferences()` in [`preferences.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/preferences.controller.ts)

---

### 26. `GET /api/v1/account-intelligence/preferences/:role/last-board`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('role'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `PreferencesController.getLastViewedBoard()` in [`preferences.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/preferences.controller.ts)

---

### 27. `POST /api/v1/account-intelligence/sync/trigger`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SyncController.triggerSync()` in [`sync.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/sync.controller.ts)

---

### 28. `GET /api/v1/account-intelligence/todos/:companyHubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('companyHubspotId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TodosController.getTodos()` in [`todos.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/todos.controller.ts)

---

### 29. `POST /api/v1/account-intelligence/todos/:companyHubspotId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('companyHubspotId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TodosController.createTodo()` in [`todos.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/todos.controller.ts)

---

### 30. `DELETE /api/v1/account-intelligence/todos/:todoId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('todoId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TodosController.deleteTodo()` in [`todos.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/todos.controller.ts)

---

### 31. `PATCH /api/v1/account-intelligence/todos/:todoId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('todoId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TodosController.updateTodo()` in [`todos.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/todos.controller.ts)

---

### 32. `POST /api/v1/account-intelligence/webhooks/hubspot`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `WebhookController.receiveWebhook()` in [`webhook.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m05-account-intelligence/controllers/webhook.controller.ts)

---

## M06: Forecasting & Prediction

### 1. `GET /api/forecast/activity/:submission_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('submission_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getSubmissionActivity()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 2. `GET /api/forecast/ai-predictor/scores/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
```json
{
  "predicted_value": 0.0,
  "explanation": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getAiPredictionScores()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 3. `GET /api/forecast/closed-deals/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getClosedDealsTotal()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 4. `GET /api/forecast/closed-deals/:rep_id/:deal_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getClosedDealValue()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 5. `GET /api/forecast/drill-down/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getRepDrilldown()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 6. `GET /api/forecast/drill-down/:rep_id/summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getRepDrilldownSummary()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 7. `GET /api/forecast/manager-board/:manager_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('manager_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getManagerBoard()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 8. `PATCH /api/forecast/notifications/:id/seen`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.markNotificationSeen()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 9. `GET /api/forecast/notifications/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getNotifications()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 10. `GET /api/forecast/periods`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getPeriods()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 11. `GET /api/forecast/periods/:period_id/reps`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('period_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getPeriodReps()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 12. `GET /api/forecast/pipeline/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getPipelineTotal()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 13. `GET /api/forecast/pipeline/:rep_id/:deal_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('rep_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getPipelineDealValue()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 14. `POST /api/forecast/submissions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.createOrUpdateSubmission()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 15. `PATCH /api/forecast/submissions/:id/approve`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.approveSubmission()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 16. `PATCH /api/forecast/submissions/:id/override`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.overrideSubmission()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 17. `PATCH /api/forecast/submissions/:id/reopen`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.reopenSubmission()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 18. `PATCH /api/forecast/submissions/:id/submit`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.submitForecast()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 19. `GET /api/forecast/submissions/:period_id/:rep_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('period_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getSubmissions()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 20. `GET /api/forecast/targets/:period_id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('period_id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.getTargets()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 21. `POST /api/forecast/targets/assign`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastUpgradeController.assignTargets()` in [`forecast-upgrade.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts)

---

### 22. `GET /api/v1/forecasting/admin/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.getBoards()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 23. `POST /api/v1/forecasting/admin/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`CreateBoardSchema`):
- `name: string`
- `scope: string`
- `teamId: string`
- `periodType: enum ('Monthly', 'Quarterly', 'monthly', 'quarterly')`
- `activePeriod: string`
- `periodId: string`
- `periodStartDate: string`
- `periodEndDate: string`
- `startDate: string`
- `endDate: string`
- `description: string`
- **Controller Handler**: `AdminForecastBoardsController.createBoard()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 24. `GET /api/v1/forecasting/admin/boards/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.getBoard()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 25. `PATCH /api/v1/forecasting/admin/boards/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateBoardSchema`):
- `name: string`
- `scope: string`
- `teamId: string`
- `periodType: enum ('Monthly', 'Quarterly', 'monthly', 'quarterly')`
- `activePeriod: string`
- `periodId: string`
- `periodStartDate: string`
- `periodEndDate: string`
- `startDate: string`
- `endDate: string`
- `description: string`
- `status: string`
- **Controller Handler**: `AdminForecastBoardsController.updateBoard()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 26. `PATCH /api/v1/forecasting/admin/boards/:id/archive`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.archiveBoard()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 27. `PATCH /api/v1/forecasting/admin/boards/:id/columns`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateColumnsSchema`):
- `columns: array`
- `id: string`
- `label: string`
- `type: enum ('Metric', 'Submission', 'Target')`
- `columnType: enum ('Metric', 'Submission', 'Target')`
- `submissionMode: enum ('N/A', 'Auto', 'Manual')`
- `isVisible: boolean`
- `sortOrder: number`
- **Controller Handler**: `AdminForecastBoardsController.updateColumns()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 28. `DELETE /api/v1/forecasting/admin/boards/:id/columns/:columnId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.deleteColumn()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 29. `PATCH /api/v1/forecasting/admin/boards/:id/columns/:columnId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateColumnSchema`):
- `label: string`
- `type: enum ('Metric', 'Submission', 'Target')`
- `columnType: enum ('Metric', 'Submission', 'Target')`
- `submissionMode: enum ('N/A', 'Auto', 'Manual')`
- `isVisible: boolean`
- **Controller Handler**: `AdminForecastBoardsController.updateColumn()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 30. `GET /api/v1/forecasting/admin/boards/:id/columns/:columnId/auto-submit-preview`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.autoSubmitPreview()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 31. `PATCH /api/v1/forecasting/admin/boards/:id/columns/:columnId/visibility`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateColumnVisibilitySchema`):
- `isVisible: boolean`
- **Controller Handler**: `AdminForecastBoardsController.updateColumnVisibility()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 32. `POST /api/v1/forecasting/admin/boards/:id/columns/from-crm`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`CreateColumnsFromCrmSchema`):
- `fields: array`
- **Controller Handler**: `AdminForecastBoardsController.createColumnsFromCrm()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 33. `POST /api/v1/forecasting/admin/boards/:id/columns/reorder`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`ReorderColumnsSchema`):
- `columnIds: array`
- **Controller Handler**: `AdminForecastBoardsController.reorderColumns()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 34. `GET /api/v1/forecasting/admin/boards/:id/crm-mapping`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.getCrmMapping()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 35. `PATCH /api/v1/forecasting/admin/boards/:id/crm-mapping`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateCrmMappingSchema`):
- `crmConnection: enum ('salesforce', 'hubspot', 'dynamics')`
- `forecastCategoryField: string`
- `pipelineSource: string`
- `closedSource: string`
- `closeDateField: string`
- `amountField: string`
- `columnMappings: string`
- `stageMappings: string`
- **Controller Handler**: `AdminForecastBoardsController.updateCrmMapping()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 36. `GET /api/v1/forecasting/admin/boards/:id/permissions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.getPermissions()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 37. `POST /api/v1/forecasting/admin/boards/:id/publish`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.publishBoard()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 38. `PATCH /api/v1/forecasting/admin/boards/:id/quotas`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateQuotasSchema`):
- `periodId: string`
- `quotas: array`
- `repUserId: string`
- `amount: number`
- `aprTarget: number`
- `mayTarget: number`
- `junTarget: number`
- **Controller Handler**: `AdminForecastBoardsController.updateQuotas()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 39. `POST /api/v1/forecasting/admin/boards/:id/quotas/import`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.importQuotas()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 40. `PATCH /api/v1/forecasting/admin/boards/:id/reminder-config`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateReminderConfigSchema`):
- `frequency: string`
- `sendDay: string`
- `sendTime: string`
- `timezoneBehavior: string`
- `inAppEnabled: boolean`
- `slackEnabled: boolean`
- `autoDismiss: boolean`
- `messageTemplate: string`
- **Controller Handler**: `AdminForecastBoardsController.updateReminderConfig()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 41. `PATCH /api/v1/forecasting/admin/boards/:id/save-draft`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.saveDraft()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 42. `POST /api/v1/forecasting/admin/boards/:id/stage-mapping`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`UpdateStageMappingSchema`):
- `stageMappings: string`
- **Controller Handler**: `AdminForecastBoardsController.updateStageMapping()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 43. `POST /api/v1/forecasting/admin/boards/:id/test-reminder`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.testReminder()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 44. `POST /api/v1/forecasting/admin/boards/:id/test-sync`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.testSync()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 45. `GET /api/v1/forecasting/admin/boards/crm/fields`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AdminForecastBoardsController.getCrmFields()` in [`admin-forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts)

---

### 46. `POST /api/v1/forecasting/auth/login`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.login()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 47. `POST /api/v1/forecasting/auth/register`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.register()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 48. `GET /api/v1/forecasting/boards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.listBoards()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 49. `POST /api/v1/forecasting/boards/:boardId/annotations`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.addAnnotation()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 50. `POST /api/v1/forecasting/boards/:boardId/approve-change`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.approveChangeRequest()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 51. `POST /api/v1/forecasting/boards/:boardId/exclude`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.excludeMember()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 52. `DELETE /api/v1/forecasting/boards/:boardId/exclude/:repUserId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.removeExclusion()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 53. `GET /api/v1/forecasting/boards/:boardId/pending-approvals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getPendingApprovals()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 54. `GET /api/v1/forecasting/boards/:boardId/pending-approvals/count`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getPendingApprovalsCount()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 55. `GET /api/v1/forecasting/boards/:boardId/reps/:repUserId/deals/:columnId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getRepDeals()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 56. `GET /api/v1/forecasting/boards/:boardId/reps/:repUserId/drilldown`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getRepDrilldown()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 57. `GET /api/v1/forecasting/boards/:boardId/reps/:repUserId/history/:columnId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getRepHistory()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 58. `PATCH /api/v1/forecasting/boards/:boardId/reps/:repUserId/submission`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.overrideSubmission()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 59. `PATCH /api/v1/forecasting/boards/:boardId/submissions/:submissionId/approve`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.approveSubmission()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 60. `PATCH /api/v1/forecasting/boards/:boardId/submissions/:submissionId/reopen`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.reopenSubmission()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 61. `POST /api/v1/forecasting/boards/:boardId/submit`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.submitForecast()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 62. `GET /api/v1/forecasting/boards/:boardId/view`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getBoardView()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 63. `GET /api/v1/forecasting/boards/by-period/:periodId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getBoardsByPeriod()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 64. `PATCH /api/v1/forecasting/boards/notifications/:id/seen`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.markNotificationSeen()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 65. `GET /api/v1/forecasting/boards/notifications/:repId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getNotifications()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 66. `GET /api/v1/forecasting/boards/submissions/:submissionId/activity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.getSubmissionActivity()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 67. `POST /api/v1/forecasting/boards/targets/assign`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ForecastBoardsController.assignTargets()` in [`forecast-boards.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts)

---

### 68. `POST /api/v1/forecasting/deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`createDealSchema`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.createDeal()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 69. `GET /api/v1/forecasting/executive/board`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ExecutiveController.getExecutiveDashboard()` in [`executive.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/executive.controller.ts)

---

### 70. `GET /api/v1/forecasting/executive/trends`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ExecutiveController.getExecutiveTrends()` in [`executive.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/executive.controller.ts)

---

### 71. `GET /api/v1/forecasting/periods`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.listPeriods()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 72. `GET /api/v1/forecasting/periods/:id/ai-prediction`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
```json
{
  "predicted_value": 0.0,
  "explanation": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getAiPrediction()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 73. `POST /api/v1/forecasting/periods/:id/ai-prediction/run`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
```json
{
  "predicted_value": 0.0,
  "explanation": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.runAiPrediction()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 74. `GET /api/v1/forecasting/periods/:id/ai-prediction/status`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
```json
{
  "predicted_value": 0.0,
  "explanation": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getAiPredictionStatus()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 75. `GET /api/v1/forecasting/periods/:id/board`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getPeriodBoard()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 76. `POST /api/v1/forecasting/periods/:id/lock`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.lockPeriod()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 77. `GET /api/v1/forecasting/periods/:id/math`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getMath()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 78. `GET /api/v1/forecasting/quotas`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getQuotas()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 79. `POST /api/v1/forecasting/quotas`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.upsertQuota()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 80. `POST /api/v1/forecasting/submissions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`submitDtoSchema`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.createSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 81. `GET /api/v1/forecasting/submissions/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 82. `PATCH /api/v1/forecasting/submissions/:id/approve`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.approveSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 83. `GET /api/v1/forecasting/submissions/:id/audit-log`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getSubmissionAuditLog()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 84. `GET /api/v1/forecasting/submissions/:id/lifecycle`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getSubmissionLifecycle()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 85. `POST /api/v1/forecasting/submissions/:id/override`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.overrideSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 86. `PATCH /api/v1/forecasting/submissions/:id/reopen`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.reopenSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 87. `POST /api/v1/forecasting/submissions/:id/submit`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.submitSubmission()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 88. `GET /api/v1/forecasting/team/at-risk-deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getAtRiskDeals()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 89. `GET /api/v1/forecasting/team/board`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getTeamBoard()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 90. `GET /api/v1/forecasting/team/reps/:repId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('repId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M06ForecastingPredictionController.getRepDrillDown()` in [`m06.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/m06.controller.ts)

---

### 91. `GET /api/v1/hubspot/callback`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `HubSpotController.handleCallback()` in [`hubspot.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/hubspot.controller.ts)

---

### 92. `POST /api/v1/hubspot/sync`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `HubSpotController.syncDeals()` in [`hubspot.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/controllers/hubspot.controller.ts)

---

### 93. `POST /explain`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`ExplainRequest`):
  - `modelInputs: Dict[str, Any]`
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: Function `explain()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/python-service/main.py)

---

### 94. `POST /predict`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (`PredictResponse`):
  - `predictedAmount: float`
  - `confidenceRangeLow: float`
  - `confidenceRangeHigh: float`
  - `modelInputs: Dict[str, Any]`
- **Response Structure**:
```json
{
  "predicted_value": 0.0,
  "explanation": { ... }
}
```
- **Controller Handler**: Function `predict()` in [`main.py`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m06-forecasting-prediction/python-service/main.py)

---

## M07: Revenue Dashboards

### 1. `POST /api/manager/revenue-dashboards/dashboards/:id/share`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M07DealAccountController.shareDashboard()` in [`m07.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m07-revenue-dashboards/controllers/m07.controller.ts)

---

## M08: Sales Engagement

### 1. `GET /api/v1/sales-engagement/dashboard/adoption`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getAdoptionDashboard()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 2. `GET /api/v1/sales-engagement/dashboard/play`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getPlayDashboard()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 3. `GET /api/v1/sales-engagement/dashboard/rep`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getRepDashboard()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 4. `GET /api/v1/sales-engagement/enrollments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getEnrollments()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 5. `POST /api/v1/sales-engagement/enrollments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`EnrollPlaySchema`):
  - `playId: string`
  - `dealId: string`
  - `userId: string`
  - `triggerEventId: string`
- **Response Structure**:
JSON (`EnrollPlaySchema`):
- `playId: string`
- `dealId: string`
- `userId: string`
- `triggerEventId: string`
- **Controller Handler**: `M08SalesEngagementController.enrollOpportunity()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 6. `GET /api/v1/sales-engagement/enrollments/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getEnrollmentById()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 7. `POST /api/v1/sales-engagement/enrollments/:id/note`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`CreateNoteSchema`):
- `noteText: string`
- **Controller Handler**: `M08SalesEngagementController.addNote()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 8. `POST /api/v1/sales-engagement/enrollments/:id/skip`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`SkipStepSchema`):
- `stepId: number`
- `reason: string`
- **Controller Handler**: `M08SalesEngagementController.skipStep()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 9. `PATCH /api/v1/sales-engagement/enrollments/:id/step`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`CompleteStepSchema`):
- `stepId: number`
- `notes: string`
- **Controller Handler**: `M08SalesEngagementController.completeStep()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 10. `GET /api/v1/sales-engagement/manager/activities/recent`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.recentActivities()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 11. `GET /api/v1/sales-engagement/manager/email-templates`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.emailTemplates()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 12. `GET /api/v1/sales-engagement/manager/search/linked-to`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.searchLinkedEntities()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 13. `GET /api/v1/sales-engagement/manager/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.tasks()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 14. `GET /api/v1/sales-engagement/manager/tasks/filters-config`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.filtersConfig()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 15. `GET /api/v1/sales-engagement/manager/tasks/summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.summary()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 16. `GET /api/v1/sales-engagement/manager/team/members`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.teamMembers()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 17. `GET /api/v1/sales-engagement/plays`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getPlays()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 18. `POST /api/v1/sales-engagement/plays`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`CreatePlaySchema`):
  - `name: string`
  - `steps: array`
  - `triggerConditions: array`
  - `isActive: boolean`
- **Response Structure**:
JSON (`CreatePlaySchema`):
- `name: string`
- `steps: array`
- `triggerConditions: array`
- `isActive: boolean`
- **Controller Handler**: `M08SalesEngagementController.createPlay()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 19. `GET /api/v1/sales-engagement/plays/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08SalesEngagementController.getPlayById()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 20. `PATCH /api/v1/sales-engagement/plays/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`UpdatePlaySchema`):
- `name: string`
- `steps: array`
- `triggerConditions: array`
- `isActive: boolean`
- **Controller Handler**: `M08SalesEngagementController.updatePlay()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 21. `POST /api/v1/sales-engagement/plays/clone`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`ClonePlaySchema`):
  - `playId: string`
- **Response Structure**:
JSON (`ClonePlaySchema`):
- `playId: string`
- **Controller Handler**: `M08SalesEngagementController.clonePlay()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 22. `POST /api/v1/sales-engagement/plays/deactivate`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`DeactivatePlaySchema`):
  - `playId: string`
- **Response Structure**:
JSON (`DeactivatePlaySchema`):
- `playId: string`
- **Controller Handler**: `M08SalesEngagementController.deactivatePlay()` in [`m08.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/m08.controller.ts)

---

### 23. `GET /api/v1/sales-engagement/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08TaskController.getTasks()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 24. `POST /api/v1/sales-engagement/tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`CreateTaskSchema`):
  - `type: string`
  - `description: string`
  - `dueDate: date`
- **Response Structure**:
JSON (`CreateTaskSchema`):
- `type: string`
- `description: string`
- `dueDate: date`
- **Controller Handler**: `M08TaskController.createTask()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 25. `GET /api/v1/sales-engagement/tasks/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08TaskController.getTaskById()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 26. `PATCH /api/v1/sales-engagement/tasks/:id/reassign`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`ReassignTaskSchema`):
- `userId: string`
- **Controller Handler**: `M08TaskController.reassignTask()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 27. `PATCH /api/v1/sales-engagement/tasks/:id/status`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`UpdateTaskStatusSchema`):
- `status: enum ('pending', 'completed', 'snoozed')`
- **Controller Handler**: `M08TaskController.updateStatus()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 28. `GET /api/v1/sales-engagement/tasks/my-tasks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08TaskController.getMyTasks()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 29. `GET /api/v1/sales-engagement/tasks/overdue`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08TaskController.getOverdueTasks()` in [`task.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/task.controller.ts)

---

### 30. `GET /api/v1/sales-engagement/workflows`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getWorkflows()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 31. `POST /api/v1/sales-engagement/workflows`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (`CreateWorkflowSchema`):
  - `name: string`
  - `description: string`
  - `triggerType: string`
  - `triggerConditions: string`
- **Response Structure**:
JSON (`CreateWorkflowSchema`):
- `name: string`
- `description: string`
- `triggerType: string`
- `triggerConditions: string`
- **Controller Handler**: `M08WorkflowController.createWorkflow()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 32. `GET /api/v1/sales-engagement/workflows/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getWorkflowById()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 33. `PATCH /api/v1/sales-engagement/workflows/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`UpdateWorkflowSchema`):
- `name: string`
- `description: string`
- `triggerType: string`
- `triggerConditions: string`
- `definition: string`
- `version: number`
- `isActive: boolean`
- **Controller Handler**: `M08WorkflowController.updateWorkflow()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 34. `GET /api/v1/sales-engagement/workflows/:id/runs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getWorkflowRuns()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 35. `GET /api/v1/sales-engagement/workflows/approvals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getApprovals()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 36. `PATCH /api/v1/sales-engagement/workflows/approvals/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
JSON (`SubmitApprovalSchema`):
- `status: enum ('approved', 'rejected')`
- `comment: string`
- **Controller Handler**: `M08WorkflowController.submitApproval()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 37. `GET /api/v1/sales-engagement/workflows/audit-logs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getAuditLogs()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 38. `GET /api/v1/sales-engagement/workflows/exceptions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getExceptions()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 39. `PATCH /api/v1/sales-engagement/workflows/exceptions/:id/resolve`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.resolveException()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 40. `GET /api/v1/sales-engagement/workflows/integrations`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.getIntegrations()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 41. `PUT /api/v1/sales-engagement/workflows/integrations/:provider`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('provider'`)
- **Response Structure**:
JSON (`UpdateIntegrationSchema`):
- `status: enum ('connected', 'disconnected', 'error')`
- `config: string`
- **Controller Handler**: `M08WorkflowController.updateIntegration()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

### 42. `POST /api/v1/sales-engagement/workflows/trigger`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M08WorkflowController.triggerWorkflowEvent()` in [`workflow.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m08-sales-engagement/controllers/workflow.controller.ts)

---

## M09: Coaching & Training

### 1. `GET /api/manager/coaching/activity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingActivity()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 2. `GET /api/manager/coaching/ai-insights`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingAiInsights()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 3. `GET /api/manager/coaching/filters`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingFilters()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 4. `GET /api/manager/coaching/interaction`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingInteraction()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 5. `GET /api/manager/coaching/rep/:repId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('repId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingRepDetails()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 6. `GET /api/manager/coaching/responsiveness`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingResponsiveness()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 7. `GET /api/manager/coaching/scorecards`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingScorecards()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 8. `GET /api/manager/coaching/team-vs-benchmark`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getCoachingTeamVsBenchmark()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 9. `GET /api/manager/revenue/accounts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
Query Parameters
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccounts()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 10. `GET /api/manager/revenue/accounts/:accountId/activities/recent`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getRecentActivities()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 11. `GET /api/manager/revenue/accounts/:accountId/activity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountActivity()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 12. `POST /api/manager/revenue/accounts/:accountId/ai-chat`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.sendAiChat()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 13. `GET /api/manager/revenue/accounts/:accountId/briefs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountBriefs()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 14. `GET /api/manager/revenue/accounts/:accountId/crm`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountCrm()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 15. `GET /api/manager/revenue/accounts/:accountId/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountNotes()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 16. `PATCH /api/manager/revenue/accounts/:accountId/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.saveNotes()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 17. `GET /api/manager/revenue/accounts/:accountId/overview`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountOverview()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 18. `GET /api/manager/revenue/accounts/:accountId/todos`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAccountTodos()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 19. `PATCH /api/manager/revenue/accounts/:accountId/todos/:todoId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('accountId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.toggleTodo()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 20. `GET /api/manager/revenue/accounts/alert`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getAlert()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 21. `GET /api/manager/revenue/accounts/summary`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getSummary()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 22. `GET /api/manager/revenue/accounts/viewers`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M09FrontendRevenueManagerController.getViewers()` in [`m09-frontend-revenue-manager.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts)

---

### 23. `GET /api/v1/coaching-training`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AppController.canActivate()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 24. `GET /api/v1/coaching-training/analytics/activity`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getActivityMetrics()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 25. `GET /api/v1/coaching-training/analytics/benchmarks`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getBenchmarks()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 26. `GET /api/v1/coaching-training/analytics/call-drilldown/:sessionId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('sessionId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getCallDrilldown()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 27. `GET /api/v1/coaching-training/analytics/compare/:repId`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('repId'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getRepComparison()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 28. `GET /api/v1/coaching-training/analytics/dashboard`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getDashboardStats()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 29. `GET /api/v1/coaching-training/analytics/export`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.exportCsv()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 30. `GET /api/v1/coaching-training/analytics/export-training`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.exportTrainingCsv()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 31. `GET /api/v1/coaching-training/analytics/interactions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getInteractionAnalytics()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 32. `GET /api/v1/coaching-training/analytics/manager-review`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getManagerReview()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 33. `GET /api/v1/coaching-training/analytics/my`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getMyAnalytics()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 34. `GET /api/v1/coaching-training/analytics/my-assignments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getMyAssignments()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 35. `GET /api/v1/coaching-training/analytics/my-notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getMyNotes()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 36. `GET /api/v1/coaching-training/analytics/reps`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getRepsWithStats()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 37. `GET /api/v1/coaching-training/analytics/team`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getTeamAnalytics()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 38. `GET /api/v1/coaching-training/analytics/topics`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getTopicInsights()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 39. `GET /api/v1/coaching-training/analytics/training-report`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `AnalyticsController.getTrainingReport()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 40. `POST /api/v1/coaching-training/auth/login`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `AuthController.login()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/auth.controller.ts)

---

### 41. `POST /api/v1/coaching-training/auth/register`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (Authentication Endpoint)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "org_id": "string"
  }
}
```
- **Controller Handler**: `AuthController.register()` in [`auth.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/auth.controller.ts)

---

### 42. `GET /api/v1/coaching-training/coaching/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.getNotes()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 43. `POST /api/v1/coaching-training/coaching/notes`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.createNote()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 44. `GET /api/v1/coaching-training/coaching/recommendations`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.getRecommendations()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 45. `POST /api/v1/coaching-training/coaching/recommendations`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `CoachingController.pushRecommendation()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 46. `GET /api/v1/coaching-training/scenarios`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.findAll()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 47. `POST /api/v1/coaching-training/scenarios`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.create()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 48. `DELETE /api/v1/coaching-training/scenarios/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.delete()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 49. `GET /api/v1/coaching-training/scenarios/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.findOne()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 50. `PATCH /api/v1/coaching-training/scenarios/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.update()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 51. `POST /api/v1/coaching-training/scenarios/analyze-audio`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.analyzeAudio()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 52. `POST /api/v1/coaching-training/scenarios/generate-persona`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.generatePersona()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 53. `POST /api/v1/coaching-training/scenarios/transcribe`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `ScenariosController.transcribeAudio()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 54. `GET /api/v1/coaching-training/sessions`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.findAll()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 55. `GET /api/v1/coaching-training/sessions/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getSessionById()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 56. `PATCH /api/v1/coaching-training/sessions/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.updateSession()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 57. `GET /api/v1/coaching-training/sessions/:id/hint`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getHint()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 58. `POST /api/v1/coaching-training/sessions/analyze-call`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.analyzeUploadedCall()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 59. `POST /api/v1/coaching-training/sessions/end`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.endSession()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 60. `GET /api/v1/coaching-training/sessions/get-voices`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getVoicesFrontendAlias()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 61. `GET /api/v1/coaching-training/sessions/get-voices-legacy`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getVoicesAlias()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 62. `POST /api/v1/coaching-training/sessions/message`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.sendMessageAlias()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 63. `GET /api/v1/coaching-training/sessions/my`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getMySessions()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 64. `POST /api/v1/coaching-training/sessions/retry`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.retrySession()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 65. `POST /api/v1/coaching-training/sessions/send-message`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.sendMessage()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 66. `POST /api/v1/coaching-training/sessions/send-voice`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.sendVoiceMessage()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 67. `POST /api/v1/coaching-training/sessions/start`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.startSession()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 68. `POST /api/v1/coaching-training/sessions/submit-to-manager`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.submitSessionToManager()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 69. `POST /api/v1/coaching-training/sessions/voice-message`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.sendVoiceMessageAlias()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 70. `GET /api/v1/coaching-training/sessions/voices`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `SessionsController.getVoices()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 71. `GET /api/v1/coaching-training/test/health`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TestController.health()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 72. `POST /api/v1/coaching-training/test/seed`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TestController.seedTestData()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 73. `POST /api/v1/coaching-training/test/smoke`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TestController.smokeTest()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 74. `POST /api/v1/coaching-training/test/token`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: Public (No authentication required)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TestController.generateToken()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 75. `GET /api/v1/coaching-training/training/assignments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrainingController.getAssignments()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 76. `POST /api/v1/coaching-training/training/assignments`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrainingController.createAssignments()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 77. `DELETE /api/v1/coaching-training/training/assignments/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrainingController.deleteAssignment()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 78. `PATCH /api/v1/coaching-training/training/assignments/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
URL Route Param (e.g. `@Param('id'`)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrainingController.updateAssignment()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

### 79. `POST /api/v1/coaching-training/training/submit-session`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
JSON Body (fields variable / dynamic)
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `TrainingController.submitSessionToManager()` in [`m09.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m09-coaching-training/controllers/m09.controller.ts)

---

## M10: Data Compliance & Trust

### 1. `GET /api/v1/m10-data-compliance/accounts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getAccounts()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 2. `GET /api/v1/m10-data-compliance/accounts/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getAccountById()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 3. `GET /api/v1/m10-data-compliance/contacts/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getContactById()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 4. `POST /api/v1/m10-data-compliance/crm-sync`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`TriggerCrmSyncSchema`):
- `crmSource: enum ('salesforce', 'hubspot', 'dynamics365')`
- `entityTypes: string`
- `fullSync: boolean`
- **Controller Handler**: `RevenueGraphController.triggerCrmSync()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 5. `GET /api/v1/m10-data-compliance/crm-sync-status`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getCrmSyncStatus()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 6. `GET /api/v1/m10-data-compliance/deals`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getDeals()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 7. `GET /api/v1/m10-data-compliance/deals/:id`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getDealById()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 8. `GET /api/v1/m10-data-compliance/deals/:id/relationship`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `RevenueGraphController.getDealRelationship()` in [`revenue-graph.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/revenue-graph/controllers/revenue-graph.controller.ts)

---

### 9. `GET /api/v1/m10-data-compliance/exports/connections`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DataCloudController.getConnections()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 10. `POST /api/v1/m10-data-compliance/exports/connections`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`RegisterConnectionSchema`):
- `destination: enum ('postgres', 'snowflake', 'bigquery', 's3', 'databricks', 'redshift')`
- `destinationName: string`
- `config: string`
- **Controller Handler**: `DataCloudController.registerConnection()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 11. `POST /api/v1/m10-data-compliance/exports/connections/:id/test`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DataCloudController.testConnection()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 12. `POST /api/v1/m10-data-compliance/exports/replay`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
JSON (`ReplayExportSchema`):
- `connectionId: string`
- `datasetName: enum ('accounts', 'contacts', 'deals', 'activities')`
- `windowStart: date`
- `windowEnd: date`
- **Controller Handler**: `DataCloudController.triggerReplay()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 13. `GET /api/v1/m10-data-compliance/exports/runs`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DataCloudController.getExportRuns()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 14. `GET /api/v1/m10-data-compliance/exports/runs/:runId/download`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `DataCloudController.downloadExport()` in [`data-cloud.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/data-cloud.controller.ts)

---

### 15. `GET /api/v1/m10-data-compliance/test/accounts`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M10TestController.accounts()` in [`m10-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/m10-test.controller.ts)

---

### 16. `POST /api/v1/m10-data-compliance/test/seed`

- **Request Format**: REST
- **Response Format**: JSON
- **Payload Security (Auth)**: JWT / Tenant Header (`x-tenant-id`, `x-user-id`, `x-user-role`)
- **Request Payload**:
No payload
- **Response Structure**:
Standard response envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
- **Controller Handler**: `M10TestController.seed()` in [`m10-test.controller.ts`](file:///c:\Users\Relanto\Desktop\RevenueIntellegence/modules/m10-data-compliance/controllers/m10-test.controller.ts)

---
