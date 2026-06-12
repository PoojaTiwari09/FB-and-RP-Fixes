# M01 Capture Transcription API Documentation

## Global Authentication & Headers
All requests require the following headers to be set:

| Header | Example Value | Description |
|---|---|---|
| `Authorization` | `Bearer eyJhbG...` | Your JWT Access Token (Required) |
| `x-tenant-id` | `tenant-123` | Your organization tenant ID (Optional if present in JWT) |

---

## 1. Create Call (Captures call_id)

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls`

**Request Payload:**
```json
{
  "title": "Discovery Call - Acme Corp",
  "callDate": "2026-06-11T14:10:49.582Z",
  "callType": "outbound",
  "callSource": "zoom",
  "dealType": "Discovery",
  "participants": [
    "John Doe",
    "Jane Smith"
  ],
  "callOwner": "33333333-3333-3333-3333-333333333333"
}
```

---

## 2. Upload from S3

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls/upload-from-s3`

**Request Payload:**
```json
{
  "recordingId": "2min_sales"
}
```

---

## 3. Trigger AI Extraction

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/extract-ai`

---

## 4. Get Calls List

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls?page=1&limit=20&sort=callDate&order=desc`

---

## 5. Get Call By ID

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}`

---

## 6. Generate Brief (Captures brief_id)

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs`

**Request Payload:**
```json
{
  "briefTemplate": "Standard Call Brief",
  "period": "Full Call"
}
```

---

## 7. Get Brief Sections

### Get Discussion Points

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/discussion-points`

---

### Get Customer Needs

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/customer-needs`

---

### Get Risks

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/risks`

---

### Get Commitments

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/commitments`

---

### Get Stakeholders

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/stakeholders`

---

### Get Activity Context

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/briefs/{{brief_id}}/activity-context`

---

## 8. Transcript & Analysis

### Get Transcript (Captures utterance_id)

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/transcript`

---

### Get AI Summary

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/transcript/summary`

---

### Get Talk Ratio

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/transcript/talk-ratio`

---

### Get Topics

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/transcript/topics`

---

## 9. Notes

### Add Note (Captures note_id)

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/notes`

**Request Payload:**
```json
{
  "note": "Follow up on pricing next week"
}
```

---

### Get Notes

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/notes`

---

### Update Note

**Method:** `PUT`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/notes/{{note_id}}`

**Request Payload:**
```json
{
  "content": "Follow up on pricing TOMORROW"
}
```

---

## 10. Next Steps

### Add Next Step

**Method:** `POST`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/next-steps`

**Request Payload:**
```json
{
  "step": "Send follow-up email"
}
```

---

### Get Next Steps

**Method:** `GET`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/next-steps`

**Response Payload:**
```json
{
  "nextSteps": [
    {
      "stepId": "step-0",
      "description": "Send follow-up email",
      "completed": false
    }
  ]
}
```

---

### Update Next Step (Toggle Complete)

**Method:** `PATCH`

**Endpoint:** `/api/v1/capture-transcription/calls/{{call_id}}/next-steps`

**Request Payload:**
```json
{
  "index": 0,
  "step": "Send follow-up email completed"
}
```

---

