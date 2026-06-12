# API Documentation: M11 AI Deep Researcher - 3 Test Cases

Comprehensive API tests for m11-ai-deep-researcher

## Table of Contents

1. [[POST] POST /api/v1/ai-deep-researcher/run](#-post-post-api-v1-ai-deep-researcher-run)
2. [[GET] GET /api/v1/ai-deep-researcher/filters/defaults](#-get-get-api-v1-ai-deep-researcher-filters-defaults)
3. [[GET] GET /api/v1/ai-deep-researcher/example-questions](#-get-get-api-v1-ai-deep-researcher-example-questions)
4. [[GET] GET /api/v1/ai-deep-researcher/progress/:jobId](#-get-get-api-v1-ai-deep-researcher-progress-jobid)
5. [[GET] GET /api/v1/ai-deep-researcher/dashboard](#-get-get-api-v1-ai-deep-researcher-dashboard)
6. [[GET] GET /api/v1/ai-deep-researcher/executive-summary](#-get-get-api-v1-ai-deep-researcher-executive-summary)
7. [[GET] GET /api/v1/ai-deep-researcher/key-findings](#-get-get-api-v1-ai-deep-researcher-key-findings)
8. [[GET] GET /api/v1/ai-deep-researcher/objections](#-get-get-api-v1-ai-deep-researcher-objections)
9. [[GET] GET /api/v1/ai-deep-researcher/trends](#-get-get-api-v1-ai-deep-researcher-trends)
10. [[GET] GET /api/v1/ai-deep-researcher/risks-opportunities](#-get-get-api-v1-ai-deep-researcher-risks-opportunities)
11. [[GET] GET /api/v1/ai-deep-researcher/recommendations](#-get-get-api-v1-ai-deep-researcher-recommendations)
12. [[GET] GET /api/v1/ai-deep-researcher/evidence](#-get-get-api-v1-ai-deep-researcher-evidence)
13. [[POST] POST /api/v1/ai-deep-researcher/escalation](#-post-post-api-v1-ai-deep-researcher-escalation)
14. [[POST] POST /api/v1/ai-deep-researcher/recommendation/share](#-post-post-api-v1-ai-deep-researcher-recommendation-share)
15. [[GET] GET /api/v1/ai-deep-researcher/reps](#-get-get-api-v1-ai-deep-researcher-reps)
16. [[GET] GET /api/v1/ai-deep-researcher/reps/:repId/calls](#-get-get-api-v1-ai-deep-researcher-reps-repid-calls)
17. [[GET] GET /api/v1/ai-deep-researcher/objections/:objectionId/rep-breakdown](#-get-get-api-v1-ai-deep-researcher-objections-objectionid-rep-breakdown)
18. [[GET] GET /api/v1/ai-deep-researcher/objections/:objectionId/evidence](#-get-get-api-v1-ai-deep-researcher-objections-objectionid-evidence)
19. [[GET] GET /api/v1/ai-deep-researcher/accounts/:accountId](#-get-get-api-v1-ai-deep-researcher-accounts-accountid)
20. [[GET] GET /api/v1/ai-deep-researcher/recommendations/:recId](#-get-get-api-v1-ai-deep-researcher-recommendations-recid)

---

## [POST] POST /api/v1/ai-deep-researcher/run

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/run`
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
  "query": "What patterns distinguish our won deals from lost deals this quarter?",
  "filters": {
    "segment": "Mid-Market"
  }
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test("Status code is 201", function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`
  - `var jsonData = pm.response.json();`
  - `if (jsonData.success && jsonData.data && jsonData.data.jobId) {`
  - `    pm.collectionVariables.set("jobId", jsonData.data.jobId);`
  - `}`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "query": "",
  "filters": {}
}
```
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/filters/defaults

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/filters/defaults`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/example-questions

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/example-questions`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/progress/:jobId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/progress/:jobId`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/dashboard

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/dashboard?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/executive-summary

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/executive-summary?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/key-findings

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/key-findings?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/objections

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/objections?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/trends

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/trends?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/risks-opportunities

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/risks-opportunities?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/recommendations

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/recommendations?jobId={{jobId}}`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/evidence

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/evidence?jobId={{jobId}}&finding=all&page=1&size=10`
- **Method / Endpoint Type**: `GET`

### 2. Headers

| Header Key | Value | Description |
|---|---|---|
| `Content-Type` | `application/json` | | 
| `x-tenant-id` | `test-tenant` | | 
| `Authorization` | `Bearer {{jwtToken}}` | Bearer Token Auth |

### 3. Payload Details

**Query Parameters**:

| Parameter | Value | Description |
|---|---|---|
| `jobId` | `{{jobId}}` | |
| `finding` | `all` | |
| `page` | `1` | |
| `size` | `10` | |

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `200 OK`
- **Assertions & Logic**:
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [POST] POST /api/v1/ai-deep-researcher/escalation

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/escalation`
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
  "jobId": "{{jobId}}",
  "question": "What about pricing concerns?"
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test("Status code is 201", function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "jobId": "",
  "question": ""
}
```
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [POST] POST /api/v1/ai-deep-researcher/recommendation/share

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/recommendation/share`
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
  "jobId": "{{jobId}}",
  "recommendationId": "{{recId}}",
  "channel": "slack"
}
```

### 4. Test Cases & Expected Responses

#### Test Case 1: Happy Path (Valid Request)
- **Expected Status**: `201 Created`
- **Assertions & Logic**:
  - `pm.test("Status code is 201", function () {`
  - `    pm.response.to.have.status(201);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Payload Sent**:
```json
{
  "jobId": "",
  "recommendationId": "",
  "channel": ""
}
```
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/reps

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/reps`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Invalid JWT
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/reps/:repId/calls

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/reps/:repId/calls`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/objections/:objectionId/rep-breakdown

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/objections/:objectionId/rep-breakdown`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/objections/:objectionId/evidence

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/objections/:objectionId/evidence`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/accounts/:accountId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/accounts/:accountId`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

## [GET] GET /api/v1/ai-deep-researcher/recommendations/:recId

### 1. General Details

- **Endpoint**: `{{baseUrl}}/api/v1/ai-deep-researcher/recommendations/:recId`
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
  - `pm.test("Status code is 200", function () {`
  - `    pm.response.to.have.status(200);`
  - `});`
  - `pm.test("Response time is less than 5000ms", function () {`
  - `    pm.expect(pm.response.responseTime).to.be.below(5000);`
  - `});`

#### Test Case 2: Missing JWT (Authentication Required)
- **Authentication Mode**: `noauth` (removes the Authorization header)
- **Expected Status**: `401 Unauthorized`
- **Assertions**:
  - `pm.test("Status code is 401", function () {`
  - `    pm.response.to.have.status(401);`
  - `});`

#### Test Case 3: 3. Validation Error / Bad Request
- **Expected Status**: `400 Bad Request`
- **Invalid Path/Query Param Sent**: Space character `" "` (`%20`) to trigger validation.
- **Assertions**:
  - `pm.test("Status code is 400", function () {`
  - `    pm.response.to.have.status(400);`
  - `});`


---

