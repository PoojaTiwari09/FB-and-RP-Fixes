# API Documentation: M03 AI Summaries GenAI - 3 Test Cases

Comprehensive API tests for m03-ai-summaries-genai

## Table of Contents

1. [[GET] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId](#-get-api-v1-ai-summaries-genai-briefs-brieftype-entityid)
2. [[POST] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId/generate](#-post-api-v1-ai-summaries-genai-briefs-brieftype-entityid-generate)
3. [[POST] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId](#-post-api-v1-ai-summaries-genai-briefs-brieftype-entityid)
4. [[POST] /api/v1/ai-summaries-genai/feedback/reports/:reportId](#-post-api-v1-ai-summaries-genai-feedback-reports-reportid)
5. [[GET] /api/v1/ai-summaries-genai/test/health](#-get-api-v1-ai-summaries-genai-test-health)
6. [[GET] /api/v1/ai-summaries-genai/test/workspace-stats](#-get-api-v1-ai-summaries-genai-test-workspace-stats)
7. [[POST] /api/v1/ai-summaries-genai/test/seed-crm](#-post-api-v1-ai-summaries-genai-test-seed-crm)
8. [[POST] /api/v1/ai-summaries-genai/test/smoke](#-post-api-v1-ai-summaries-genai-test-smoke)
9. [[POST] /api/v1/ai-summaries-genai/research/jobs](#-post-api-v1-ai-summaries-genai-research-jobs)
10. [[GET] /api/v1/ai-summaries-genai/research/jobs/:jobId](#-get-api-v1-ai-summaries-genai-research-jobs-jobid)
11. [[POST] /api/v1/ai-summaries-genai/research/jobs/:jobId/cancel](#-post-api-v1-ai-summaries-genai-research-jobs-jobid-cancel)
12. [[GET] /api/v1/ai-summaries-genai/research/jobs](#-get-api-v1-ai-summaries-genai-research-jobs)
13. [[GET] /api/v1/ai-summaries-genai/research/reports/:reportId](#-get-api-v1-ai-summaries-genai-research-reports-reportid)
14. [[GET] /api/v1/ai-summaries-genai/research/reports/:reportId/history](#-get-api-v1-ai-summaries-genai-research-reports-reportid-history)
15. [[GET] /api/v1/ai-summaries-genai/workspace/chat-history](#-get-api-v1-ai-summaries-genai-workspace-chat-history)
16. [[POST] /api/v1/ai-summaries-genai/workspace/chat-history](#-post-api-v1-ai-summaries-genai-workspace-chat-history)
17. [[DELETE] /api/v1/ai-summaries-genai/workspace/chat-history/:id](#-delete-api-v1-ai-summaries-genai-workspace-chat-history-id)
18. [[POST] /api/v1/ai-summaries-genai/workspace/deals](#-post-api-v1-ai-summaries-genai-workspace-deals)
19. [[PATCH] /api/v1/capture-transcription/calls/:callId/next-steps/:stepId](#-patch-api-v1-capture-transcription-calls-callid-next-steps-stepid)
20. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/discussion-points](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-discussion-points)
21. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/customer-needs](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-customer-needs)
22. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/risks](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-risks)
23. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/commitments](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-commitments)
24. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/stakeholders](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-stakeholders)
25. [[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/activity-context](#-get-api-v1-capture-transcription-calls-callid-briefs-briefid-activity-context)

---

## [GET] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/briefs/{{briefType}}/{{entityId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId/generate

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/briefs/{{briefType}}/{{entityId}}/generate`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/briefs/:briefType/:entityId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/briefs/{{briefType}}/{{entityId}}`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/feedback/reports/:reportId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/feedback/reports/{{reportId}}`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "type": "positive",
  "note": "Great insight"
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/test/health

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/test/health`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/test/workspace-stats

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/test/workspace-stats`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/test/seed-crm

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/test/seed-crm`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/test/smoke

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/test/smoke`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/research/jobs

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/jobs`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "query": "What are the top risks?",
  "contextType": "ACCOUNT"
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `const res = pm.response.json();`
  - `if (res.data && res.data.jobId) { pm.collectionVariables.set("jobId", res.data.jobId); }`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/research/jobs/:jobId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/jobs/{{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `const res = pm.response.json();`
  - `if (res.data && res.data.reportId) { pm.collectionVariables.set("reportId", res.data.reportId); }`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/research/jobs/:jobId/cancel

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/jobs/{{jobId}}/cancel`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `const res = pm.response.json();`
  - `if (res.data && res.data.reportId) { pm.collectionVariables.set("reportId", res.data.reportId); }`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/research/jobs

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/jobs`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/research/reports/:reportId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/reports/{{reportId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/research/reports/:reportId/history

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/research/reports/{{reportId}}/history`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/ai-summaries-genai/workspace/chat-history

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/workspace/chat-history`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/workspace/chat-history

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/workspace/chat-history`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "question": "What is the deal status?",
  "answer": "The deal is in proposal stage.",
  "citations": []
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `const res = pm.response.json();`
  - `if (res.data && res.data.id) { pm.collectionVariables.set("chatHistoryId", res.data.id); }`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [DELETE] /api/v1/ai-summaries-genai/workspace/chat-history/:id

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/workspace/chat-history/{{chatHistoryId}}`
- **Method / Endpoint Type**: `DELETE`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "question": "What is the deal status?",
  "answer": "The deal is in proposal stage.",
  "citations": []
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `const res = pm.response.json();`
  - `if (res.data && res.data.id) { pm.collectionVariables.set("chatHistoryId", res.data.id); }`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [POST] /api/v1/ai-summaries-genai/workspace/deals

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-summaries-genai/workspace/deals`
- **Method / Endpoint Type**: `POST`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "exampleField": "exampleValue",
  "count": 1
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test('Status code is 201', function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 5. Missing Required Fields
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "optionalField": "value"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [PATCH] /api/v1/capture-transcription/calls/:callId/next-steps/:stepId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/next-steps/{{stepId}}`
- **Method / Endpoint Type**: `PATCH`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Request Body (JSON)**:
```json
{
  "completed": true
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Bad Request (Validation)
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "completed": "not-a-boolean"
}
```
- **Assertions**:
  - `pm.test('Status code is 400', function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/discussion-points

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/discussion-points`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/customer-needs

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/customer-needs`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/risks

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/risks`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/commitments

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/commitments`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/stakeholders

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/stakeholders`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/activity-context

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/activity-context`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `00000000-0000-0000-0000-000000000001` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

No payload or parameters needed.

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test('Status code is 200', function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test('Response time is less than 5000ms', function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test('Status code is 401', function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

