# Doc #11d — TDD: AI Smart Tracker

## 1. Document Control

- **Document Title:** Technical Design Document — AI Smart Tracker
- **Feature Name:** AI Smart Tracker
- **Product Module:** M2 Conversation Intelligence
- **Architecture Owner Module:** M2 Conversation Intelligence (Workspace: `/modules/m02-conversation-intelligence/`, Schema: `m02_conversation_intelligence`)
- **Version:** v3.0 Approved
- **Status:** Approved
- **Owner:** Tech Lead / Smart Tracking Squad
- **Reviewers:** AI Lead, Backend Lead, QA Lead, Product Manager
- **Last Updated:** 2026-05-18

---

## 2. Purpose

AI Smart Tracker uses AI to identify and track important business concepts across calls and emails by understanding intent, not just keywords. Its purpose is to convert raw conversation content into reusable, structured business signals such as pricing concerns, competitor mentions, objections, risks, and other custom intent detections.

This feature belongs in the M2 module because M2 is the central system for understanding customer conversations and generating structured signals. Detections are combined with search, downstream signal consumption, and deal-risk surfacing in M4 Deal Intelligence and M5 Account Intelligence.

### Business Problem
- Keyword rules are too brittle for real sales conversations because buyers express the same idea in many different ways.
- Teams need a way to detect intent like pricing pressure, competitor risk, next-step commitment, or budget concern even when exact phrases differ.
- Detected signals must be reusable by summaries, workflows, and deal-risk views downstream.

### What the Feature Does
- Lets admins define trackers as AI-detectable business signals.
- Runs semantic intent detection over calls and emails.
- Stores ranked detections with snippet, timestamp, context IDs, and confidence.
- Emits `tracker.detection.created` for downstream consumers.

---

## 3. Scope

### In Scope
- Tracker definition creation and publishing.
- Semantic intent detection on calls and outbound emails.
- Confidence-scored detection results with supporting snippet and timestamp.
- Event emission through `tracker.detection.created`.
- Downstream use in Insight Generation, Sales Engagement, and Deal Drivers.

### Out of Scope
- Topic tagging (handled by AI Topic Tagger).
- Theme clustering over large call sets (handled by AI Theme Spotter).
- Direct CRM write-back automation logic (handled by M10).
- Live in-call guidance.

### Assumptions
- A transcript or email body exists before tracker detection runs.
- Tracker definitions are tenant-scoped and can be published or unpublished.
- Detection runs asynchronously through approved internal AI services.
- Revenue Graph enrichment may arrive before or after initial detection creation.

### Upstream Dependencies
- **M1 Capture & Transcription:** `call.transcription.completed` event for call detection.
- **M8 Sales Engagement:** `email.sent` event for outbound email detection.
- **M10 Data & Compliance:** `revenue_graph.entity.linked` event for deal/account enrichment.
- **M2 Topic Tagger:** `call.topics.tagged` event for search indexing enrichment.

### Downstream Consumers
- **M3 AI Summaries & GenAI:** Consumes `tracker.detection.created` for summary generation.
- **M8 Sales Engagement:** Consumes detections for automated email playbook enrollments.
- **M4 Deal Intelligence** and **M5 Account Intelligence:** Uses detections and deal-driver outputs for risk visibility.

---

## 4. Users and Triggers

### Primary Users
- RevOps admins creating and publishing trackers.
- Managers watching repeated risk and objection signals.
- Reps and leaders consuming tracker-driven risk summaries in downstream views.

### Trigger Types
- `call.transcription.completed` triggers tracker detection on transcripts.
- `email.sent` triggers tracker detection on outbound email content.

### Entry Points
- API: `POST /api/v1/m02-conversation-intelligence/trackers` creates a custom AI Smart Tracker.
- API: `GET /api/v1/m02-conversation-intelligence/trackers` lists trackers for the tenant.
- API: `GET /api/v1/m02-conversation-intelligence/trackers/:id/detections` returns detections for a tracker.

---

## 5. Functional Flow

### Happy Path
1. An admin creates and publishes a tracker definition.
2. A new transcript or outbound email event arrives.
3. M2 enqueues detection jobs for all published trackers relevant to that scope.
4. M2 calls the private AI endpoint `POST /internal/detect-trackers` in the AI services layer.
5. The AI service evaluates semantic intent against tracker definitions and returns detections with confidence, snippet, and timing context.
6. M2 filters, ranks, and stores valid detections in `tracker_detections`.
7. If M10 linking data is available, detections are enriched with deal and contact context; if not, enrichment happens later after `revenue_graph.entity.linked` arrives.
8. M2 emits `tracker.detection.created`.
9. Downstream modules refresh summaries, workflows, and risk views based on those detections.

### Core Design Note
- Smart Tracker is an **intent detector**, not a string-matching rule engine. This means “customer is worried about budget” should still match a pricing-risk tracker even if the exact word "pricing" never appears.

---

## 6. Inputs and Outputs

### Inputs
- `tenantId` (UUID)
- Tracker definitions.
- Transcript text or email body.

### Output Records
- `tracker_detections` rows containing tracker ID, call ID, tenant ID, optional deal/contact IDs, snippet, timestamp, confidence, and detection time.

### Events Emitted
- `tracker.detection.created` conforming to standard `EventEnvelopeSchema`:
  ```json
  {
    "eventId": "uuid",
    "eventName": "tracker.detection.created",
    "eventVersion": "v1",
    "tenantId": "uuid",
    "producer": "m02-conversation-intelligence",
    "occurredAt": "2026-05-18T12:00:00Z",
    "publishedAt": "2026-05-18T12:00:01Z",
    "correlationId": "uuid",
    "payload": {
      "detectionId": "uuid",
      "trackerId": "uuid",
      "callId": "uuid",
      "tenantId": "uuid",
      "dealId": "uuid",
      "snippet": "We may need to revisit pricing because the budget is already tight.",
      "confidenceScore": 0.89,
      "detectedAt": "2026-05-18T12:00:00Z"
    }
  }
  ```

---

## 7. Data Model

All M2 tables are stored in the PostgreSQL schema `m02_conversation_intelligence`.

### `trackers` Table
- `id` (UUID, Primary Key) -> mapped to `trackerId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `name` (VARCHAR)
- `business_question` (TEXT) -> mapped to `businessQuestion`
- `type` (VARCHAR) -> competitor, pricing, objection, risk, custom
- `scope` (VARCHAR) -> allcalls, inbound, outbound, emails
- `created_by` (UUID) -> mapped to `createdBy`
- `is_published` (BOOLEAN) -> mapped to `isPublished`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `tracker_detections` Table
- `id` (UUID, Primary Key) -> mapped to `detectionId`
- `tracker_id` (UUID, Indexed) -> mapped to `trackerId`
- `call_id` (UUID, Indexed) -> mapped to `callId`
- `tenant_id` (UUID, Indexed) -> mapped to `tenantId`
- `deal_id` (UUID, Indexed) -> mapped to `dealId`
- `contact_id` (UUID, Indexed) -> mapped to `contactId`
- `snippet` (TEXT)
- `timestamp_ms` (INTEGER) -> mapped to `timestampMs`
- `confidence_score` (DECIMAL) -> mapped to `confidenceScore`
- `detected_at` (TIMESTAMP) -> mapped to `detectedAt`

---

## 8. AI Processing

- **Task:** Semantic intent classification.
- **Internal AI Endpoint:** `POST /internal/detect-trackers`
- **Gating Confidence Rule:**
  - Let `DEAL_DRIVER_THRESHOLD = 0.70`.
  - Detections with `confidenceScore < 0.70` are recorded in the DB but filtered out from Deal Drivers views.

---

## 16. Appendix: Deal Driver Snapshot Logic

```typescript
export interface TrackerDetection {
  detectionId: string;
  trackerId: string;
  callId: string;
  dealId: string | null;
  confidenceScore: number;
}

export function filterDetectionsForDealDrivers(
  detections: TrackerDetection[],
  threshold: number = 0.70
): TrackerDetection[] {
  return detections.filter(
    (det) => det.dealId !== null && det.confidenceScore >= threshold
  );
}
```