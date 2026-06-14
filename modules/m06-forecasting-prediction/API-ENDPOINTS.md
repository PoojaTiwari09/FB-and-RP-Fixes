# M06 — Forecasting & Prediction Module: Complete API Endpoint Reference

> **Base URL (Backend):** `http://localhost:3001`  
> **Frontend Proxy Base:** `/api/v1/forecasting`  
> **Source Controllers:**  
> - `modules/m06-forecasting-prediction/controllers/m06.controller.ts`  
> - `modules/m06-forecasting-prediction/controllers/forecast-boards.controller.ts`  
> - `modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts`  
> - `modules/m06-forecasting-prediction/controllers/forecast-upgrade.controller.ts`  
> - `modules/m06-forecasting-prediction/controllers/executive.controller.ts`  
> - `modules/m06-forecasting-prediction/controllers/hubspot.controller.ts`

---

## Common Request Headers

All endpoints (unless noted) require the following headers:

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `X-Tenant-ID` | `string (UUID)` | ✅ Yes | Tenant identifier. Demo value: `00000000-0000-0000-0000-000000000001` |
| `x-user-id` | `string` | Contextual | User identifier (rep or manager) |
| `x-user-role` | `string` | Contextual | Role of the user: `manager` or `sales_rep` |
| `Content-Type` | `application/json` | For POST/PATCH/PUT | Body format |

> Missing `X-Tenant-ID` will result in `403 ForbiddenException`.

---

## 1. Forecast Periods

### 1.1 List All Forecast Periods

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/periods` |
| **Frontend Proxy** | `/api/v1/forecasting/periods` |
| **Controller** | `m06.controller.ts → listPeriods()` |
| **Frontend Usage** | `repBoard.service.ts` → `fetch('/api/forecast/periods')` |
| **Purpose** | Returns all forecast periods for the tenant, ordered by start date (newest first). Used by both rep board and manager board to populate period selectors. |

**Request Headers:**

| Header | Required | Value |
|--------|----------|-------|
| `X-Tenant-ID` | ✅ | Tenant UUID |

**Request Params:** None

**Response Body (Array):**

```json
[
  {
    "periodId": "uuid",
    "tenantId": "uuid",
    "name": "Q2 FY26",
    "startDate": "2026-04-01",
    "endDate": "2026-06-30",
    "revenueTarget": 50000000,
    "isLocked": false
  }
]
```

**Frontend Usage:** `fetchPeriods()` in `services/m06-api.ts`, `getRepBoardView()` and `getManagerBoardView()` in source-services.

---

### 1.2 Lock a Forecast Period

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/lock` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/lock` |
| **Controller** | `m06.controller.ts → lockPeriod()` |
| **Frontend Usage** | ❌ Not called from any current frontend component (admin/backend use only) |
| **Purpose** | Locks a period so no further submissions or edits can be made. Sets `isLocked = true` and `status = 'locked'`. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | ✅ | Forecast period ID |

**Request Headers:** Standard headers including `X-Tenant-ID`

**Response Body:**

```json
{
  "isLocked": true,
  "period": { ...periodObject }
}
```

---

### 1.3 Get Period Board (Legacy)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/board` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/board` |
| **Controller** | `m06.controller.ts → getPeriodBoard()` |
| **Frontend Usage** | `fetchRepPeriodBoard()` in `services/m06-api.ts` |
| **Purpose** | Returns the full board view for a period for a specific rep. Legacy endpoint used by `RepForecastView.tsx`. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | ✅ | Forecast period ID |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `repUserId` | `string` | Optional | Filter for a specific rep's board |
| `lob` | `string` | Optional | Filter by line of business |

**Response Body:** Full board payload including `aiPrediction`, `submissions`, `period`, `quota`, `repDrafts`, etc.

---

### 1.4 Get AI Prediction for a Period

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/ai-prediction` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/ai-prediction` |
| **Controller** | `m06.controller.ts → getAiPrediction()` |
| **Frontend Usage** | `fetchAiPrediction()` in `services/m06-api.ts`; `handleBaselineChange()` in `RepForecastView.tsx` |
| **Purpose** | Returns the AI revenue prediction for a period. Supports filtering by baseline, region, and rep. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | ✅ | Forecast period ID |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `baseline` | `string` | Optional | Baseline type: `avg_last_2`, `last_period`, `same_period_last_year`, `current`, or `null` |
| `region` | `string` | Optional | Region filter: `Americas`, `EMEA`, `APAC`, `Company` |
| `repUserId` | `string` | Optional | Filter prediction for a specific rep |

**Response Body:**

```json
{
  "aiPrediction": {
    "predictedAmount": 45000000,
    "confidenceRangeLow": 40000000,
    "confidenceRangeHigh": 50000000,
    "computedAt": "2026-06-11T08:00:00.000Z",
    "baselineNote": "Uses average of last 2 periods.",
    "explainability": {
      "deals": [...],
      "closedWonDetails": { "total": 12000000, "deals": [...] },
      "pipelineByStage": [...],
      "expectedDeals": { "rate": 0.35, "addressablePipeline": 20000000, "contribution": 7000000 }
    }
  }
}
```

---

### 1.5 Trigger AI Prediction Run

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/ai-prediction/run` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/ai-prediction/run` |
| **Controller** | `m06.controller.ts → runAiPrediction()` |
| **Frontend Usage** | ❌ Not called from any frontend component (admin/backend use only) |
| **Purpose** | Triggers an async AI prediction job for the given period. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | ✅ | Forecast period ID |

**Response Body:**

```json
{
  "jobId": "string",
  "status": "queued"
}
```

---

### 1.6 Get AI Prediction Job Status

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/ai-prediction/status` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/ai-prediction/status` |
| **Controller** | `m06.controller.ts → getAiPredictionStatus()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Polls the status of a running AI prediction job. |

**Response Body:**

```json
{
  "status": "running" | "completed" | "failed",
  "progress": 75,
  "completedAt": "2026-06-11T09:00:00.000Z"
}
```

---

### 1.7 Get Forecast Math / Explainability

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/periods/:id/math` |
| **Frontend Proxy** | `/api/v1/forecasting/periods/:id/math` |
| **Controller** | `m06.controller.ts → getMath()` |
| **Frontend Usage** | ❌ Indirectly — math data is embedded in the board response; `MathDrawer.tsx` displays it client-side |
| **Purpose** | Returns detailed explainability/math breakdown for the AI prediction. |

**Response Body:** Full explainability breakdown including stage-by-stage pipeline analysis, win rates, and deal scoring.

---

## 2. Deals

### 2.1 Create a Deal

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/deals` |
| **Frontend Proxy** | `/api/v1/forecasting/deals` |
| **Controller** | `m06.controller.ts → createDeal()` |
| **Frontend Usage** | `handleCreateDeal()` in `RepForecastView.tsx`; `AddDealModal.tsx` triggers this |
| **Purpose** | Creates a new deal in the forecasting pipeline. Optimistically shown on the UI before backend sync. |

**Request Headers:** Standard + `Content-Type: application/json`

**Request Body:**

```json
{
  "dealName": "HDFC Expansion Q2",
  "stage": "Negotiation",
  "amount": 5000000,
  "closeDate": "2026-06-30",
  "probability": 0.8,
  "region": "Americas",
  "lob": "Enterprise Software",
  "repUserId": "sarah"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dealName` | `string` | ✅ | Deal name (min 1 char) |
| `stage` | `string` | ✅ | CRM stage name |
| `amount` | `number` | ✅ | Deal value (non-negative) |
| `closeDate` | `string` | ✅ | ISO date string |
| `probability` | `number` | Optional | Win probability (0–1) |
| `region` | `string` | Optional | Geographic region |
| `lob` | `string` | Optional | Line of Business |
| `repUserId` | `string` | Optional | Rep user ID |

**Response Body:**

```json
{
  "id": "uuid",
  "dealName": "HDFC Expansion Q2",
  "stage": "Negotiation",
  "amount": 5000000,
  "closeDate": "2026-06-30",
  "createdAt": "2026-06-11T09:00:00.000Z"
}
```

---

## 3. Submissions (Legacy / M06 Core)

### 3.1 Create / Save a Forecast Draft

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/submissions` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions` |
| **Controller** | `m06.controller.ts → createSubmission()` |
| **Frontend Usage** | `handleSubmit()` in `RepForecastView.tsx` (for both draft and submit flow) |
| **Purpose** | Creates a new forecast draft or updates an existing one. |

**Request Body:**

```json
{
  "lob": "Enterprise Software",
  "commitForecast": 45000000,
  "bestCaseForecast": 55000000,
  "notes": "HDFC renewal pending sign-off.",
  "repUserId": "sarah",
  "status": "draft"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lob` | `string` | ✅ | Line of business |
| `commitForecast` | `number` | ✅ | Committed forecast amount |
| `bestCaseForecast` | `number` | Optional | Best case scenario amount |
| `notes` | `string` | Optional | Justification notes |
| `repUserId` | `string` | Optional | Rep user ID |
| `status` | `string` | Optional | `draft` or `submitted` |

**Response Body:**

```json
{
  "id": "uuid",
  "lob": "Enterprise Software",
  "commitForecast": 45000000,
  "status": "draft",
  "createdAt": "2026-06-11T09:10:00.000Z"
}
```

---

### 3.2 Submit a Forecast

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/submit` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/submit` |
| **Controller** | `m06.controller.ts → submitSubmission()` |
| **Frontend Usage** | `handleSubmit()` in `RepForecastView.tsx` (called after creating draft when status is `submitted`) |
| **Purpose** | Transitions a draft submission to `submitted` status, locking it for manager review. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string (UUID)` | ✅ | Submission ID |

**Response Body:**

```json
{
  "id": "uuid",
  "status": "submitted",
  "submittedAt": "2026-06-11T09:15:00.000Z"
}
```

---

### 3.3 Get a Submission

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id` |
| **Controller** | `m06.controller.ts → getSubmission()` |
| **Frontend Usage** | ❌ Not directly called; submission data is embedded in board responses |
| **Purpose** | Retrieves a specific submission by ID. |

**Response Body:**

```json
{
  "id": "uuid",
  "lob": "Enterprise Software",
  "commitForecast": 45000000,
  "bestCaseForecast": 55000000,
  "notes": "...",
  "status": "submitted",
  "repUserId": "sarah",
  "createdAt": "2026-06-11T09:10:00.000Z"
}
```

---

### 3.4 Get Submission Audit Log

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/audit-log` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/audit-log` |
| **Controller** | `m06.controller.ts → getSubmissionAuditLog()` |
| **Frontend Usage** | `loadData()` in `RepForecastView.tsx` → populates `AuditLog.tsx` sidebar |
| **Purpose** | Returns the full audit trail / activity log for a submission. |

**Response Body:**

```json
{
  "auditLogs": [
    {
      "id": "uuid",
      "action": "Draft created",
      "actorRole": "sales_rep",
      "createdAt": "2026-06-11T08:00:00.000Z"
    },
    {
      "id": "uuid",
      "action": "Forecast submitted",
      "actorRole": "sales_rep",
      "createdAt": "2026-06-11T09:15:00.000Z"
    }
  ],
  "versions": [...]
}
```

---

### 3.5 Get Submission Lifecycle

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/lifecycle` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/lifecycle` |
| **Controller** | `m06.controller.ts → getSubmissionLifecycle()` |
| **Frontend Usage** | ❌ Not called from any frontend component (lifecycle is displayed from audit log data in `ForecastEntry.tsx`) |
| **Purpose** | Returns lifecycle stage transitions for a submission. |

---

### 3.6 Approve a Submission

| Field | Value |
|-------|-------|
| **Method** | `POST` / `PATCH` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/approve` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/approve` |
| **Controller** | `m06.controller.ts → approveSubmission()` |
| **Frontend Usage** | `approval.service.ts → approveSubmission()` → called via `PATCH /api/forecast/submissions/:id/approve` |
| **Purpose** | Approves a rep's submitted forecast. Requires manager ID. |

**Request Body:**

```json
{
  "managerId": "uuid",
  "managerName": "Rachel Singh"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `managerId` | `string` | ✅ | Manager's user ID |
| `managerName` | `string` | Optional | Manager display name |

**Response Body:**

```json
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2026-06-11T10:00:00.000Z",
  "managerId": "uuid"
}
```

---

### 3.7 Reopen a Submission

| Field | Value |
|-------|-------|
| **Method** | `POST` / `PATCH` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/reopen` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/reopen` |
| **Controller** | `m06.controller.ts → reopenSubmission()` |
| **Frontend Usage** | `approval.service.ts → reopenSubmission()` |
| **Purpose** | Reopens a submitted/approved forecast for revision. Requires manager comment explaining why. |

**Request Body:**

```json
{
  "managerId": "uuid",
  "managerName": "Rachel Singh",
  "comment": "Commit appears aggressive. Please revise to align with late-stage deals."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `managerId` | `string` | ✅ | Manager's user ID |
| `comment` | `string` | ✅ | Reason for reopening |
| `managerName` | `string` | Optional | Manager display name |

---

### 3.8 Override a Submission

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/submissions/:id/override` |
| **Frontend Proxy** | `/api/v1/forecasting/submissions/:id/override` |
| **Controller** | `m06.controller.ts → overrideSubmission()` |
| **Frontend Usage** | `approval.service.ts → managerOverrideSubmission()` |
| **Purpose** | Allows a manager to override a rep's submitted commit value. Shows override banner in the rep's `ForecastEntry.tsx`. |

**Request Body:**

```json
{
  "managerId": "uuid",
  "managerName": "Rachel Singh",
  "overrideValue": 40000000,
  "justification": "Adjusted based on pipeline quality analysis.",
  "approveNow": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `managerId` | `string` | ✅ | Manager's user ID |
| `overrideValue` | `number` | ✅ | New override amount |
| `justification` | `string` | ✅ | Reason for override |
| `approveNow` | `boolean` | Optional | Simultaneously approve after override |

**Response Body:**

```json
{
  "id": "uuid",
  "status": "approved",
  "overrideValue": 40000000,
  "justification": "...",
  "managerId": "uuid"
}
```

---

## 4. Authentication

### 4.1 Register a User

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/auth/register` |
| **Frontend Proxy** | `/api/v1/forecasting/auth/register` |
| **Controller** | `m06.controller.ts → register()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Registers a new user for the forecasting module. |

**Request Body:**

```json
{
  "email": "sarah@company.com",
  "password": "securePassword",
  "name": "Sarah Chen",
  "role": "sales_rep"
}
```

---

### 4.2 Login

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/auth/login` |
| **Frontend Proxy** | `/api/v1/forecasting/auth/login` |
| **Controller** | `m06.controller.ts → login()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Authenticates a user and returns a session token. |

**Request Body:**

```json
{
  "email": "sarah@company.com",
  "password": "securePassword"
}
```

**Response Body:**

```json
{
  "token": "jwt-token-string",
  "user": { "id": "uuid", "email": "sarah@company.com", "role": "sales_rep" }
}
```

---

## 5. Team / Manager Board

### 5.1 Get Team Board

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/team/board` |
| **Frontend Proxy** | `/api/v1/forecasting/team/board` |
| **Controller** | `m06.controller.ts → getTeamBoard()` |
| **Frontend Usage** | `fetchTeamBoard()` in `services/m06-api.ts` |
| **Purpose** | Returns the team-level forecast board for a manager — all reps' submissions, rollup totals, AI prediction, and at-risk analysis. |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `baseline` | `string` | Optional | `avg_last_2`, `last_period`, `same_period_last_year`, `current` |
| `region` | `string` | Optional | `Americas`, `EMEA`, `APAC`, `Company` |
| `periodId` | `string` | Optional | Target period ID (defaults to current active period) |

**Response Body:**

```json
{
  "period": { "id": "uuid", "name": "Q2 FY26", ... },
  "reps": [
    {
      "repUserId": "sarah",
      "repName": "Sarah Chen",
      "commitForecast": 45000000,
      "bestCaseForecast": 55000000,
      "status": "submitted",
      "quota": 50000000,
      "attainmentPct": 90
    }
  ],
  "rollup": { "totalCommit": 90000000, "totalBestCase": 110000000 },
  "aiPrediction": { ... }
}
```

---

### 5.2 Get Team Forecast (Legacy Alias)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/team-forecast` |
| **Frontend Proxy** | `/api/v1/forecasting/team-forecast` |
| **Controller** | `m06.controller.ts → getTeamForecast()` (delegates to `getTeamBoard`) |
| **Frontend Usage** | `fetchTeamBoard()` falls back to this if `/team/board` returns 404 |
| **Purpose** | Legacy alias for `/team/board`. Kept for backward compatibility with older clients. |

**Query Params:** Same as `/team/board`

---

### 5.3 Get Rep Drill-Down (Manager View)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/team/reps/:repId` |
| **Frontend Proxy** | `/api/v1/forecasting/team/reps/:repId` |
| **Controller** | `m06.controller.ts → getRepDrillDown()` |
| **Frontend Usage** | ❌ Not directly called; manager drill-down uses `/api/forecast/drill-down/:rep_id` via `managerBoard.service.ts` |
| **Purpose** | Returns the drill-down view for a specific rep including all their deals, pipeline summary, and submission status. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `repId` | `string` | ✅ | Rep user ID |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `periodId` | `string` | ✅ | Forecast period ID |

---

### 5.4 Get At-Risk Deals

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/team/at-risk-deals` |
| **Frontend Proxy** | `/api/v1/forecasting/team/at-risk-deals` |
| **Controller** | `m06.controller.ts → getAtRiskDeals()` |
| **Frontend Usage** | `fetchAtRiskDeals()` in `services/m06-api.ts` |
| **Purpose** | Returns deals flagged as at-risk (low AI score, past due, stalled stages) across the team. |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `region` | `string` | Optional | Filter by region |

**Response Body:**

```json
{
  "atRiskDeals": [
    {
      "dealId": "uuid",
      "dealName": "Infosys Expansion",
      "repName": "Sarah Chen",
      "stage": "Proposal",
      "amount": 8000000,
      "closeDate": "2026-06-20",
      "riskReason": "Past due — no update in 14 days",
      "aiScore": 0.3
    }
  ]
}
```

---

## 6. Quotas

### 6.1 Upsert Quota

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/quotas` |
| **Frontend Proxy** | `/api/v1/forecasting/quotas` |
| **Controller** | `m06.controller.ts → upsertQuota()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Creates or updates a quota entry for a specific rep in a period. |

**Request Body:**

```json
{
  "periodId": "uuid",
  "repUserId": "sarah",
  "amount": 50000000
}
```

---

### 6.2 Get Quotas

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/quotas` |
| **Frontend Proxy** | `/api/v1/forecasting/quotas` |
| **Controller** | `m06.controller.ts → getQuotas()` |
| **Frontend Usage** | ❌ Not called from any frontend component (quota data is embedded in board responses) |
| **Purpose** | Returns all quota entries for a given period. |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `periodId` | `string` | ✅ | Forecast period ID |

**Response Body:**

```json
[
  {
    "repUserId": "sarah",
    "amount": 50000000,
    "periodId": "uuid"
  }
]
```

---

## 7. Forecast Boards (New Architecture)

> Controller: `forecast-boards.controller.ts`  
> Base path: `/api/v1/forecasting/boards`

### 7.1 List All Boards

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards` |
| **Frontend Proxy** | `/api/v1/forecasting/boards` |
| **Controller** | `forecast-boards.controller.ts → listBoards()` |
| **Frontend Usage** | ❌ Not directly called |
| **Purpose** | Lists all forecast boards for the tenant. |

**Request Headers:** `X-Tenant-ID`

**Response Body:**

```json
[
  {
    "id": "uuid",
    "name": "Q2 FY26 Forecast Board",
    "status": "active",
    "periodType": "quarterly",
    "columns": [...],
    "createdAt": "..."
  }
]
```

---

### 7.2 Get Board by Period

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/by-period/:periodId` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/by-period/:periodId` |
| **Controller** | `forecast-boards.controller.ts → getBoardsByPeriod()` |
| **Frontend Usage** | `fetchForecastBoard()` and `submitForecast()` in `services/m06-api.ts` |
| **Purpose** | Returns the active board configuration for a given period. Used to resolve board ID before performing submit or view operations. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `periodId` | `string (UUID)` | ✅ | Forecast period ID |

**Response Body:**

```json
{
  "board": {
    "id": "uuid",
    "name": "Q2 FY26 Forecast Board",
    "status": "active",
    "columns": [
      { "id": "col-pipeline", "label": "Pipeline", "columnType": "Metric", "submissionMode": "Auto" },
      { "id": "col-best-case", "label": "Best Case", "columnType": "Submission", "submissionMode": "Manual" },
      { "id": "col-commit", "label": "Commit", "columnType": "Submission", "submissionMode": "Manual" },
      { "id": "col-closed", "label": "Closed Won", "columnType": "Metric", "submissionMode": "Auto" }
    ]
  },
  "period": {
    "id": "uuid",
    "name": "Q2 FY26",
    "revenueTarget": 50000000,
    "isLocked": false
  }
}
```

---

### 7.3 Get Board View

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/view` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/view` |
| **Controller** | `forecast-boards.controller.ts → getBoardView()` |
| **Frontend Usage** | `fetchForecastBoard()` in `services/m06-api.ts` (second call after resolving board ID) |
| **Purpose** | Returns the complete board view including all rep rows, rollup totals, and per-column cell values. Role-aware — reps see own row, managers see all rows. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | `string (UUID)` | ✅ | Board ID |

**Additional Request Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `X-User-ID` | ✅ | Caller's user ID |
| `x-user-role` | ✅ | `manager` or `sales_rep` |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `includeInactive` | `boolean` | Optional | Include inactive/excluded reps in response |

**Response Body:**

```json
{
  "board": { "id": "uuid", "name": "Q2 FY26 Forecast Board" },
  "columns": [...],
  "rows": [
    {
      "repUserId": "sarah",
      "repName": "Sarah Chen",
      "avatarInitials": "SC",
      "isExcluded": false,
      "cells": {
        "col-pipeline": { "value": 20000000, "submissionId": null },
        "col-commit": { "value": 45000000, "submissionId": "uuid" }
      },
      "submissionStatus": "submitted",
      "targetAttainment": { "quota": 50000000, "closed": 12000000, "attainmentPct": 90 }
    }
  ],
  "rollup": { "cells": {...}, "targetAttainment": {...}, "submittedCount": 3, "totalCount": 5 }
}
```

---

### 7.4 Submit Forecast on Board

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/submit` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/submit` |
| **Controller** | `forecast-boards.controller.ts → submitForecast()` |
| **Frontend Usage** | `submitForecast()` in `services/m06-api.ts` (second step of new-architecture submit) |
| **Purpose** | Submits a forecast value for a specific column for a rep. This is the primary submission endpoint in the new board architecture. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | `string (UUID)` | ✅ | Board ID |

**Additional Request Headers:** `X-User-ID`, `x-user-role`

**Request Body:**

```json
{
  "columnId": "col-commit",
  "repUserId": "sarah",
  "value": 45000000,
  "note": "Strong Q2 pipeline with HDFC renewal confirmed.",
  "dealId": "uuid",
  "status": "submitted"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `columnId` | `string` | ✅ | Column being submitted (`col-commit`, `col-best-case`) |
| `repUserId` | `string` | ✅ | Rep user ID |
| `value` | `number` | ✅ | Forecast value |
| `note` | `string` | Optional | Submission note/justification |
| `dealId` | `string` | Optional | Associated deal ID |
| `status` | `string` | Optional | `submitted` or `draft` |

**Response Body:**

```json
{
  "success": true,
  "submissionId": "uuid",
  "status": "submitted"
}
```

---

### 7.5 Approve Change Request

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/approve-change` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/approve-change` |
| **Controller** | `forecast-boards.controller.ts → approveChangeRequest()` |
| **Frontend Usage** | `approveChangeRequest()` in `source-services/repBoard.service.ts` (stubbed — returns `{ success: true }`) |
| **Purpose** | Approves a rep's requested change to a previously submitted value. |

**Request Body:**

```json
{
  "repUserId": "sarah",
  "dealId": "uuid",
  "columnId": "col-commit"
}
```

---

### 7.6 Get Rep Deals for a Column

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/deals/:columnId` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/deals/:columnId` |
| **Controller** | `forecast-boards.controller.ts → getRepDeals()` |
| **Frontend Usage** | ❌ Not called from any current frontend component |
| **Purpose** | Returns the list of deals a rep has associated with a specific forecast column. |

---

### 7.7 Get Rep Submission History for a Column

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/history/:columnId` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/history/:columnId` |
| **Controller** | `forecast-boards.controller.ts → getRepHistory()` |
| **Frontend Usage** | ❌ Not called from frontend; `SubmissionHistory.tsx` uses audit log data |
| **Purpose** | Returns historical submission values for a rep in a specific column. |

---

### 7.8 Get Rep Drill-Down (Board Architecture)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/drilldown` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/drilldown` |
| **Controller** | `forecast-boards.controller.ts → getRepDrilldown()` |
| **Frontend Usage** | ❌ Not called from frontend (drill-down uses ForecastUpgrade controller routes) |
| **Purpose** | Returns the full deal-level drill-down for a rep under the new board architecture. |

---

### 7.9 Add Manager Annotation

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/annotations` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/annotations` |
| **Controller** | `forecast-boards.controller.ts → addAnnotation()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Allows a manager to add an annotation/comment to a rep's submission. |

**Request Body:**

```json
{
  "submissionId": "uuid",
  "repUserId": "sarah",
  "annotation": "Good progress, watch the HDFC deal closely.",
  "managerId": "uuid"
}
```

---

### 7.10 Exclude a Member from Board

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/exclude` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/exclude` |
| **Controller** | `forecast-boards.controller.ts → excludeMember()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Excludes a rep from the board view (e.g., on leave, transferred). |

**Request Body:**

```json
{
  "repUserId": "sarah",
  "reason": "On extended leave",
  "managerId": "uuid"
}
```

---

### 7.11 Remove Exclusion

| Field | Value |
|-------|-------|
| **Method** | `DELETE` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/exclude/:repUserId` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/exclude/:repUserId` |
| **Controller** | `forecast-boards.controller.ts → removeExclusion()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Re-includes a previously excluded rep into the board view. |

---

### 7.12 Approve Submission (Board Architecture)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/submissions/:submissionId/approve` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/submissions/:submissionId/approve` |
| **Controller** | `forecast-boards.controller.ts → approveSubmission()` |
| **Frontend Usage** | ❌ Frontend uses ForecastUpgrade routes instead (`/api/forecast/submissions/:id/approve`) |
| **Purpose** | Manager approves a submission in the new board architecture. |

---

### 7.13 Reopen Submission (Board Architecture)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/submissions/:submissionId/reopen` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/submissions/:submissionId/reopen` |
| **Controller** | `forecast-boards.controller.ts → reopenSubmission()` |
| **Frontend Usage** | ❌ Frontend uses ForecastUpgrade routes |
| **Purpose** | Manager reopens a submission for revision in the new board architecture. |

---

### 7.14 Override Submission (Board Architecture)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/submission` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/reps/:repUserId/submission` |
| **Controller** | `forecast-boards.controller.ts → overrideSubmission()` |
| **Frontend Usage** | ❌ Frontend uses ForecastUpgrade routes |
| **Purpose** | Manager overrides a rep's submission value in the new board architecture. |

**Request Body:**

```json
{
  "columnId": "col-commit",
  "value": 40000000,
  "note": "Adjusted based on pipeline quality review."
}
```

---

### 7.15 Get Pending Approvals Count

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/pending-approvals/count` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/pending-approvals/count` |
| **Controller** | `forecast-boards.controller.ts → getPendingApprovalsCount()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Returns the count of pending approval submissions for a manager on a specific board. |

**Additional Request Headers:** `X-User-ID` (manager's ID)

**Response Body:**

```json
{ "count": 3 }
```

---

### 7.16 Get Pending Approvals

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/:boardId/pending-approvals` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/:boardId/pending-approvals` |
| **Controller** | `forecast-boards.controller.ts → getPendingApprovals()` |
| **Frontend Usage** | ❌ Frontend uses `getPendingApprovals()` in `managerBoard.service.ts` via `/api/forecast/manager-board/:id` and `/api/forecast/drill-down/:repId` |
| **Purpose** | Returns list of pending approval submissions for a manager. |

---

### 7.17 Assign Targets

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/forecasting/boards/targets/assign` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/targets/assign` |
| **Controller** | `forecast-boards.controller.ts → assignTargets()` |
| **Frontend Usage** | ❌ Frontend uses `assignTargets()` in `managerBoard.service.ts` which calls `/api/forecast/targets/assign` |
| **Purpose** | Assigns quota targets for multiple reps in a period in the new board architecture. |

**Request Body:**

```json
{
  "periodId": "uuid",
  "assignments": [
    { "repUserId": "sarah", "targetValue": 50000000 },
    { "repUserId": "alex", "targetValue": 45000000 }
  ]
}
```

---

### 7.18 Get Notifications for Rep

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/notifications/:repId` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/notifications/:repId` |
| **Controller** | `forecast-boards.controller.ts → getNotifications()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Returns unread notifications for a rep (e.g., approval, reopen events). |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "approved",
      "message": "Your Q2 forecast has been approved.",
      "seen": false,
      "createdAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

---

### 7.19 Mark Notification as Seen

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/v1/forecasting/boards/notifications/:id/seen` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/notifications/:id/seen` |
| **Controller** | `forecast-boards.controller.ts → markNotificationSeen()` |
| **Frontend Usage** | ❌ Not called from any frontend component |
| **Purpose** | Marks a specific notification as read/seen. |

---

### 7.20 Get Submission Activity Log (Board Architecture)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/boards/submissions/:submissionId/activity` |
| **Frontend Proxy** | `/api/v1/forecasting/boards/submissions/:submissionId/activity` |
| **Controller** | `forecast-boards.controller.ts → getSubmissionActivity()` |
| **Frontend Usage** | ❌ Frontend uses ForecastUpgrade route: `/api/forecast/activity/:submission_id` |
| **Purpose** | Returns the activity log for a submission (board architecture). |

---

## 8. Admin — Forecast Boards

> Controller: `admin-forecast-boards.controller.ts`  
> Base path: `/api/v1/forecasting/admin/boards`  
> ⚠️ **All admin endpoints are backend-only. None are called from the current frontend.**

### 8.1 List Boards (Admin)

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards` | List all boards for admin management |

---

### 8.2 Get Board (Admin)

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards/:id` | Get full admin detail for a board |

---

### 8.3 Create Board

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards` | Create a new forecast board |

**Request Body (`CreateBoardDto`):**

```json
{
  "name": "Q3 FY26 Forecast Board",
  "scope": "team",
  "teamId": "uuid",
  "periodType": "Quarterly",
  "periodId": "uuid",
  "periodStartDate": "2026-07-01",
  "periodEndDate": "2026-09-30",
  "description": "Standard Q3 quarterly board"
}
```

---

### 8.4 Update Board

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id` | Update board metadata |

**Request Body (`UpdateBoardDto`):** Same fields as CreateBoardDto, all optional, plus `status`.

---

### 8.5 Update Board Columns (Bulk)

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/columns` | Replace all columns on a board |

**Request Body (`UpdateColumnsDto`):**

```json
{
  "columns": [
    { "id": "uuid", "label": "Pipeline", "columnType": "Metric", "submissionMode": "Auto", "isVisible": true, "sortOrder": 1 },
    { "id": "uuid", "label": "Commit", "columnType": "Submission", "submissionMode": "Manual", "isVisible": true, "sortOrder": 2 }
  ]
}
```

---

### 8.6 Create Columns from CRM

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/columns/from-crm` | Auto-create columns mapped from CRM fields |

**Request Body (`CreateColumnsFromCrmDto`):**

```json
{
  "fields": [
    {
      "crmObject": "Opportunity",
      "crmField": "amount",
      "label": "Pipeline Amount",
      "columnType": "Metric",
      "submissionMode": "Auto"
    }
  ]
}
```

---

### 8.7 Update a Single Column

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/columns/:columnId` | Update label, type, visibility of one column |

---

### 8.8 Update Column Visibility

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/columns/:columnId/visibility` | Toggle column visibility |

**Request Body:**

```json
{ "isVisible": false }
```

---

### 8.9 Delete Column

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `DELETE` | `/api/v1/forecasting/admin/boards/:id/columns/:columnId` | Remove a column from the board |

---

### 8.10 Reorder Columns

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/columns/reorder` | Set the display order of columns |

**Request Body:**

```json
{ "columnIds": ["uuid1", "uuid2", "uuid3"] }
```

---

### 8.11 Update CRM Mapping

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/crm-mapping` | Configure CRM data source for the board |

**Request Body (`UpdateCrmMappingDto`):**

```json
{
  "crmConnection": "hubspot",
  "forecastCategoryField": "forecast_category",
  "pipelineSource": "open_deals",
  "closedSource": "closed_won",
  "closeDateField": "closedate",
  "amountField": "amount",
  "columnMappings": {},
  "stageMappings": {}
}
```

---

### 8.12 Get CRM Mapping

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards/:id/crm-mapping` | Retrieve current CRM mapping config |

---

### 8.13 Update Stage Mapping

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/stage-mapping` | Map CRM stage names to forecast categories |

**Request Body:**

```json
{
  "stageMappings": {
    "Prospecting": "pipeline",
    "Negotiation": "best_case",
    "Closed Won": "closed_won"
  }
}
```

---

### 8.14 Update Reminder Config

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/reminder-config` | Configure automatic reminder notifications |

**Request Body (`UpdateReminderConfigDto`):**

```json
{
  "frequency": "weekly",
  "sendDay": "Monday",
  "sendTime": "09:00",
  "timezoneBehavior": "team",
  "inAppEnabled": true,
  "slackEnabled": false,
  "autoDismiss": true,
  "messageTemplate": "Reminder: Please submit your forecast by EOD Friday."
}
```

---

### 8.15 Update Quotas (Admin)

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/quotas` | Set quotas for all reps |

**Request Body (`UpdateQuotasDto`):**

```json
{
  "periodId": "uuid",
  "quotas": [
    { "repUserId": "sarah", "amount": 50000000, "aprTarget": 15000000, "mayTarget": 18000000, "junTarget": 17000000 }
  ]
}
```

---

### 8.16 Publish Board

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/publish` | Make a draft board live/active |

---

### 8.17 Save Board as Draft

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/save-draft` | Save current board state as draft |

---

### 8.18 Archive Board

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `PATCH` | `/api/v1/forecasting/admin/boards/:id/archive` | Archive a board (hide from active lists) |

---

### 8.19 Get CRM Fields

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards/crm/fields` | List available CRM fields for column mapping |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `object` | `string` | Optional | CRM object type: `Opportunity`, `Account`, `Contact` |
| `boardId` | `string` | Optional | Board context for pre-filtered fields |

---

### 8.20 Test Sync

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/test-sync` | Dry-run CRM data sync for a board |

---

### 8.21 Test Reminder

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/test-reminder` | Send a test reminder notification |

---

### 8.22 Import Quotas via CSV

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `POST` | `/api/v1/forecasting/admin/boards/:id/quotas/import` | Upload a CSV file to bulk-import quotas |

**Content-Type:** `multipart/form-data`  
**Form Field:** `file` (binary CSV)

**CSV Format:** `repUserId, amount`

---

### 8.23 Get Board Permissions

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards/:id/permissions` | Get access control permissions for a board |

---

### 8.24 Auto-Submit Preview

| Method | Backend URL | Purpose |
|--------|-------------|---------|
| `GET` | `/api/v1/forecasting/admin/boards/:id/columns/:columnId/auto-submit-preview` | Preview what would be auto-submitted for a column |

---

## 9. Forecast Upgrade (Source-of-Truth for Frontend Services)

> Controller: `forecast-upgrade.controller.ts`  
> Base path: `/api` (note: no `/v1` prefix)  
> ⚠️ **These are the routes actively consumed by the frontend's source-services.**

### 9.1 Get Submissions for Period + Rep

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/submissions/:period_id/:rep_id` |
| **Frontend Usage** | `getSubmissionHistory()` in `source-services/history.service.ts` |
| **Purpose** | Returns all forecast submissions for a rep in a specific period. Used to build submission history view. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period_id` | `string` | ✅ | Forecast period ID |
| `rep_id` | `string` | ✅ | Rep user ID |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deal_id": "uuid",
      "deal_name": "HDFC Expansion",
      "period_id": "uuid",
      "rep_id": "sarah",
      "best_case_value": 8000000,
      "commit_value": 6000000,
      "best_case_state": "approved",
      "commit_state": "submitted",
      "created_at": "2026-06-05T10:00:00.000Z"
    }
  ]
}
```

---

### 9.2 Create or Update Submission

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/forecast/submissions` |
| **Frontend Usage** | `submitForecast()` in `source-services/repBoard.service.ts` (saves value per-deal per-column) |
| **Purpose** | Creates or updates a per-deal forecast value (best_case or commit). |

**Request Body:**

```json
{
  "rep_id": "sarah",
  "deal_id": "uuid",
  "period_id": "uuid",
  "field": "commit",
  "value": 5000000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rep_id` | `string` | ✅ | Rep user ID |
| `deal_id` | `string` | ✅ | Deal ID |
| `period_id` | `string` | ✅ | Period ID |
| `field` | `"best_case"` \| `"commit"` | ✅ | Which field to update |
| `value` | `number` | ✅ | Forecast value |

---

### 9.3 Submit Forecast (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/forecast/submissions/:id/submit` |
| **Frontend Usage** | `submitForecast()` in `source-services/repBoard.service.ts` (when `status === 'submitted'`) |
| **Purpose** | Transitions a submission to `submitted` state. |

**Request Body:**

```json
{
  "rep_id": "sarah",
  "field": "commit"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rep_id` | `string` | ✅ | Rep user ID |
| `field` | `"best_case"` \| `"commit"` \| `"both"` | ✅ | Which field(s) to submit |

---

### 9.4 Approve Submission (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/forecast/submissions/:id/approve` |
| **Frontend Usage** | `approveSubmission()` in `source-services/approval.service.ts` |
| **Purpose** | Manager approves a rep's submitted forecast. |

**Request Body:**

```json
{
  "manager_id": "00000000-0000-0000-0000-000000000002",
  "field": "both"
}
```

---

### 9.5 Reopen Submission (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/forecast/submissions/:id/reopen` |
| **Frontend Usage** | `reopenSubmission()` in `source-services/approval.service.ts` |
| **Purpose** | Manager reopens a submitted forecast for revision. |

**Request Body:**

```json
{
  "manager_id": "00000000-0000-0000-0000-000000000002"
}
```

---

### 9.6 Override Submission (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/forecast/submissions/:id/override` |
| **Frontend Usage** | `managerOverrideSubmission()` in `source-services/approval.service.ts`; also `submitForecast()` in `repBoard.service.ts` when `status === 'overridden'` |
| **Purpose** | Manager overrides a rep's submitted forecast value. |

**Request Body:**

```json
{
  "manager_id": "00000000-0000-0000-0000-000000000002",
  "field": "commit",
  "override_value": 40000000
}
```

---

### 9.7 Get Notifications (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/notifications/:rep_id` |
| **Frontend Usage** | ❌ Not called from frontend |
| **Purpose** | Returns notifications for a rep. |

---

### 9.8 Mark Notification Seen (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `PATCH` |
| **Backend URL** | `/api/forecast/notifications/:id/seen` |
| **Frontend Usage** | ❌ Not called from frontend |
| **Purpose** | Marks a notification as seen. |

---

### 9.9 Get Submission Activity Log

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/activity/:submission_id` |
| **Frontend Usage** | `getSubmissionHistory()` in `history.service.ts`; `getPendingApprovals()` in `managerBoard.service.ts` |
| **Purpose** | Returns the activity log entries for a submission. Used to build `SubmissionHistory.tsx` and annotate pending approvals. |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "submitted",
      "performed_by_name": "Sarah Chen",
      "timestamp": "2026-06-10T14:30:00.000Z",
      "notes": "Submitted commit forecast"
    }
  ]
}
```

---

### 9.10 Get Targets for Period

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/targets/:period_id` |
| **Frontend Usage** | `getRepBoardView()` and `getRepDrillDown()` in `source-services` (to fetch rep quota) |
| **Purpose** | Returns all rep quota targets for a period. |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "rep_id": "sarah",
      "rep_name": "Sarah Chen",
      "target_value": 50000000,
      "period_id": "uuid"
    }
  ]
}
```

---

### 9.11 Assign Targets (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/forecast/targets/assign` |
| **Frontend Usage** | `assignTargets()` in `source-services/managerBoard.service.ts` |
| **Purpose** | Assigns quota targets for multiple reps for a period. |

**Request Body:**

```json
{
  "period_id": "uuid",
  "manager_id": "00000000-0000-0000-0000-000000000002",
  "assignments": [
    { "rep_id": "sarah", "target_value": 50000000 },
    { "rep_id": "alex", "target_value": 45000000 }
  ]
}
```

---

### 9.12 Get Forecast Periods (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/periods` |
| **Frontend Usage** | `getRepBoardView()` and `getManagerBoardView()` in source-services |
| **Purpose** | Returns all forecast periods. This is the Upgrade-controller version (no tenant header required). |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Q2 FY26",
      "start_date": "2026-04-01",
      "end_date": "2026-06-30",
      "submission_deadline": "2026-06-30"
    }
  ]
}
```

---

### 9.13 Get Period Reps

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/periods/:period_id/reps` |
| **Frontend Usage** | ❌ Not called from frontend |
| **Purpose** | Returns list of reps active in a period. |

---

### 9.14 Get Closed Deals Total

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/closed-deals/:rep_id` |
| **Frontend Usage** | ❌ Not called from frontend (data is in drill-down summary) |
| **Purpose** | Returns total closed-won revenue for a rep in a period. |

**Query Params:** `period_id`

---

### 9.15 Get Closed Deal Value

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/closed-deals/:rep_id/:deal_id` |
| **Frontend Usage** | ❌ Not called from frontend |
| **Purpose** | Returns the value of a specific closed deal. |

---

### 9.16 Get Pipeline Total

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/pipeline/:rep_id` |
| **Frontend Usage** | ❌ Not called from frontend (data is in drill-down summary) |
| **Purpose** | Returns total open pipeline for a rep in a period. |

---

### 9.17 Get Pipeline Deal Value

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/pipeline/:rep_id/:deal_id` |
| **Frontend Usage** | ❌ Not called from frontend |
| **Purpose** | Returns pipeline value for a specific deal. |

---

### 9.18 Get AI Prediction Scores

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/ai-predictor/scores/:rep_id` |
| **Frontend Usage** | ❌ Not called from frontend (scores are embedded in drill-down data) |
| **Purpose** | Returns AI prediction scores for all deals belonging to a rep. |

---

### 9.19 Get Rep Drill-Down (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/drill-down/:rep_id` |
| **Frontend Usage** | `getRepBoardView()` and `getRepDrillDown()` in source-services; `getPendingApprovals()` in `managerBoard.service.ts` |
| **Purpose** | Returns full deal-level drill-down for a rep including AI scores, submission states, and manager annotations. This is the **primary data source** for the rep board view. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `rep_id` | `string` | ✅ | Rep user ID |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period_id` | `string` | ✅ | Forecast period ID |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "deal_id": "uuid",
      "deal_name": "HDFC Expansion",
      "account_name": "HDFC Bank",
      "amount": 8000000,
      "stage": "Negotiation",
      "close_date": "2026-06-30",
      "is_closed_won": false,
      "is_closed_lost": false,
      "is_past_due": false,
      "best_case_value": 8000000,
      "commit_value": 6000000,
      "best_case_state": "submitted",
      "commit_state": "approved",
      "manager_annotation": "Good deal — watch legal.",
      "has_pending_request": false,
      "requested_best_case": null,
      "requested_commit": null,
      "ai_prediction_score": 0.82
    }
  ]
}
```

---

### 9.20 Get Rep Drill-Down Summary

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/drill-down/:rep_id/summary` |
| **Frontend Usage** | `getRepBoardView()` and `getRepDrillDown()` in source-services |
| **Purpose** | Returns aggregated pipeline, best case, commit, and closed-won totals for a rep. Drives the summary cards on the board. |

**Query Params:** `period_id`

**Response Body:**

```json
{
  "success": true,
  "data": {
    "pipeline_total": 25000000,
    "best_case_total": 18000000,
    "commit_total": 14000000,
    "closed_won_total": 12000000
  }
}
```

---

### 9.21 Get Manager Board (Upgrade)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/forecast/manager-board/:manager_id` |
| **Frontend Usage** | `getManagerBoardView()` and `getPendingApprovals()` in `source-services/managerBoard.service.ts` |
| **Purpose** | Returns the manager's board with all reps' aggregated data (pipeline, best case, commit, closed, targets, pending requests). This is the **primary data source** for the manager board view. |

**Path Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `manager_id` | `string` | ✅ | Manager user ID |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period_id` | `string` | ✅ | Forecast period ID |

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "rep_id": "sarah",
      "rep_name": "Sarah Chen",
      "pipeline_total": 25000000,
      "best_case_total": 18000000,
      "commit_total": 14000000,
      "closed_total": 12000000,
      "target_value": 50000000,
      "target_progress_pct": 52,
      "has_pending_requests": true,
      "ai_prediction_score": 0.78
    }
  ]
}
```

---

## 10. Executive Dashboard

> Controller: `executive.controller.ts`  
> Base path: `/api/v1/forecasting`

### 10.1 Get Executive Dashboard / Board

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/executive/dashboard` (alias: `/api/v1/forecasting/executive/board`) |
| **Frontend Usage** | ❌ Not called from any current frontend component |
| **Purpose** | Returns an aggregated executive-level view across all regions and reps. Includes company-wide rollup, regional breakdowns, AI prediction, and trend data. |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `region` | `string` | Optional | `Americas`, `EMEA`, `APAC`, `Company` |
| `baseline` | `string` | Optional | `avg_last_2`, `last_period`, `same_period_last_year`, `current` |
| `periodId` | `string` | Optional | Target period ID |

---

### 10.2 Get Executive Trends

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/forecasting/executive/trends` |
| **Frontend Usage** | ❌ Not called from any current frontend component |
| **Purpose** | Returns trend data for executive reporting — quarter-over-quarter comparisons, win rate evolution, and regional performance trends. |

---

## 11. HubSpot Integration

> Controller: `hubspot.controller.ts`  
> Base path: `/api/v1/hubspot`

### 11.1 Get HubSpot Auth URL

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/hubspot/auth-url` |
| **Frontend Usage** | `handleConnect()` in `HubSpotConnect.tsx` |
| **Purpose** | Returns the OAuth authorization URL for connecting a HubSpot account. Frontend redirects user to this URL to initiate OAuth. |

**Request Headers:** `x-tenant-id`

**Response Body:**

```json
{
  "url": "https://app.hubspot.com/oauth/authorize?client_id=...&redirect_uri=...&state=tenantId"
}
```

---

### 11.2 HubSpot OAuth Callback

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/hubspot/callback` |
| **Frontend Usage** | Handled automatically — HubSpot redirects browser here; backend then redirects to `http://localhost:3000?hubspot=connected` or `?hubspot=error` |
| **Purpose** | Handles the OAuth callback from HubSpot. Exchanges auth code for access token and redirects to frontend. |

**Query Params (set by HubSpot):**

| Param | Type | Description |
|-------|------|-------------|
| `code` | `string` | OAuth authorization code |
| `state` | `string` | Tenant ID (passed in state to correlate) |

**Redirect:** `http://localhost:3000?hubspot=connected` on success, `?hubspot=error&msg=...` on failure.

---

### 11.3 Get HubSpot Connection Status

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Backend URL** | `/api/v1/hubspot/status` |
| **Frontend Usage** | `checkStatus()` in `HubSpotConnect.tsx` (on component mount) |
| **Purpose** | Returns whether HubSpot is currently connected for the tenant. |

**Request Headers:** `x-tenant-id`

**Response Body:**

```json
{ "connected": true }
```

---

### 11.4 Sync Deals from HubSpot

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/hubspot/sync` |
| **Frontend Usage** | `handleSync()` in `HubSpotConnect.tsx` |
| **Purpose** | Pulls open deals from HubSpot CRM and imports them into the M06 forecasting pipeline. Returns the list of imported deals to display in the frontend sync result table. |

**Request Headers:** `x-tenant-id`

**Response Body:**

```json
{
  "imported": 4,
  "deals": [
    {
      "id": "uuid",
      "dealName": "Tech Corp Q3 Deal",
      "stage": "Negotiation",
      "amount": 7500000,
      "closeDate": "2026-09-30",
      "probability": 0.75,
      "region": "APAC",
      "hubspotId": "hs-deal-123"
    }
  ],
  "message": "Successfully synced 4 deals from HubSpot"
}
```

**Field Mappings (HubSpot → M06):**

| HubSpot Field | M06 Field |
|---------------|-----------|
| `dealname` | `dealName` |
| `amount` | `amount` |
| `dealstage` | `stage` (mapped via stage mapping) |
| `closedate` | `closeDate` |
| `hs_deal_stage_probability` | AI confidence input |

---

### 11.5 Disconnect HubSpot

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Backend URL** | `/api/v1/hubspot/disconnect` |
| **Frontend Usage** | `handleDisconnect()` in `HubSpotConnect.tsx` |
| **Purpose** | Revokes the HubSpot connection for the tenant. |

**Request Headers:** `x-tenant-id`

**Response Body:**

```json
{ "disconnected": true }
```

---

## Frontend API Coverage Summary

The table below summarizes which backend endpoints are actually called by the frontend:

| Backend Endpoint | Frontend Called? | Frontend Component / Service |
|-----------------|-----------------|------------------------------|
| `GET /api/v1/forecasting/periods` | ✅ | `fetchPeriods()`, `repBoard.service.ts`, `managerBoard.service.ts` |
| `GET /api/v1/forecasting/periods/:id/board` | ✅ | `fetchRepPeriodBoard()` in `m06-api.ts` → `RepForecastView.tsx` |
| `GET /api/v1/forecasting/periods/:id/ai-prediction` | ✅ | `fetchAiPrediction()`, `handleBaselineChange()` in `RepForecastView.tsx` |
| `POST /api/v1/forecasting/periods/:id/ai-prediction/run` | ❌ | Backend/admin only |
| `GET /api/v1/forecasting/periods/:id/ai-prediction/status` | ❌ | Backend/admin only |
| `GET /api/v1/forecasting/periods/:id/math` | ❌ | Embedded in board response |
| `POST /api/v1/forecasting/periods/:id/lock` | ❌ | Backend/admin only |
| `POST /api/v1/forecasting/deals` | ✅ | `handleCreateDeal()` → `RepForecastView.tsx` → `AddDealModal.tsx` |
| `POST /api/v1/forecasting/submissions` | ✅ | `handleSubmit()` in `RepForecastView.tsx` |
| `POST /api/v1/forecasting/submissions/:id/submit` | ✅ | `handleSubmit()` in `RepForecastView.tsx` |
| `GET /api/v1/forecasting/submissions/:id` | ❌ | Data embedded in board |
| `GET /api/v1/forecasting/submissions/:id/audit-log` | ✅ | `loadData()` → `AuditLog.tsx` |
| `GET /api/v1/forecasting/submissions/:id/lifecycle` | ❌ | Not used |
| `POST /api/v1/forecasting/submissions/:id/approve` | ❌ | Uses Upgrade route |
| `POST /api/v1/forecasting/submissions/:id/reopen` | ❌ | Uses Upgrade route |
| `POST /api/v1/forecasting/submissions/:id/override` | ❌ | Uses Upgrade route |
| `POST /api/v1/forecasting/auth/register` | ❌ | Backend only |
| `POST /api/v1/forecasting/auth/login` | ❌ | Backend only |
| `GET /api/v1/forecasting/team/board` | ✅ | `fetchTeamBoard()` in `m06-api.ts` |
| `GET /api/v1/forecasting/team-forecast` | ✅ | Fallback in `fetchTeamBoard()` |
| `GET /api/v1/forecasting/team/reps/:repId` | ❌ | Not used by frontend |
| `GET /api/v1/forecasting/team/at-risk-deals` | ✅ | `fetchAtRiskDeals()` in `m06-api.ts` |
| `POST /api/v1/forecasting/quotas` | ❌ | Backend only |
| `GET /api/v1/forecasting/quotas` | ❌ | Embedded in board |
| `GET /api/v1/forecasting/boards` | ❌ | Not used directly |
| `GET /api/v1/forecasting/boards/by-period/:periodId` | ✅ | `fetchForecastBoard()` and `submitForecast()` in `m06-api.ts` |
| `GET /api/v1/forecasting/boards/:boardId/view` | ✅ | `fetchForecastBoard()` in `m06-api.ts` |
| `POST /api/v1/forecasting/boards/:boardId/submit` | ✅ | `submitForecast()` in `m06-api.ts` → `RepForecastView.tsx` |
| `POST /api/v1/forecasting/boards/:boardId/approve-change` | ⚠️ Stub | `approveChangeRequest()` in `repBoard.service.ts` (returns stub `{success:true}`) |
| All other board endpoints | ❌ | Backend/admin only |
| `GET /api/forecast/submissions/:period_id/:rep_id` | ✅ | `getSubmissionHistory()` in `history.service.ts` |
| `POST /api/forecast/submissions` | ✅ | `submitForecast()` in `repBoard.service.ts` |
| `PATCH /api/forecast/submissions/:id/submit` | ✅ | `submitForecast()` in `repBoard.service.ts` |
| `PATCH /api/forecast/submissions/:id/approve` | ✅ | `approveSubmission()` in `approval.service.ts` |
| `PATCH /api/forecast/submissions/:id/reopen` | ✅ | `reopenSubmission()` in `approval.service.ts` |
| `PATCH /api/forecast/submissions/:id/override` | ✅ | `managerOverrideSubmission()` in `approval.service.ts`; `repBoard.service.ts` |
| `GET /api/forecast/activity/:submission_id` | ✅ | `history.service.ts`, `managerBoard.service.ts` |
| `GET /api/forecast/targets/:period_id` | ✅ | `repBoard.service.ts`, `managerBoard.service.ts` |
| `POST /api/forecast/targets/assign` | ✅ | `assignTargets()` in `managerBoard.service.ts` |
| `GET /api/forecast/periods` | ✅ | `repBoard.service.ts`, `managerBoard.service.ts` |
| `GET /api/forecast/drill-down/:rep_id` | ✅ | `repBoard.service.ts`, `managerBoard.service.ts` |
| `GET /api/forecast/drill-down/:rep_id/summary` | ✅ | `repBoard.service.ts`, `managerBoard.service.ts` |
| `GET /api/forecast/manager-board/:manager_id` | ✅ | `managerBoard.service.ts` |
| `GET /api/v1/forecasting/executive/dashboard` | ❌ | Not used |
| `GET /api/v1/forecasting/executive/trends` | ❌ | Not used |
| `GET /api/v1/hubspot/auth-url` | ✅ | `HubSpotConnect.tsx` |
| `GET /api/v1/hubspot/callback` | ✅ | Browser redirect (HubSpot-initiated) |
| `GET /api/v1/hubspot/status` | ✅ | `HubSpotConnect.tsx` |
| `POST /api/v1/hubspot/sync` | ✅ | `HubSpotConnect.tsx` |
| `POST /api/v1/hubspot/disconnect` | ✅ | `HubSpotConnect.tsx` |
| All Admin (`/admin/boards/*`) | ❌ | Backend/admin only |

---

## Error Response Format

All endpoints return errors in the following format:

```json
{
  "statusCode": 400,
  "message": "periodId, repUserId, and amount are required",
  "error": "Bad Request"
}
```

| HTTP Status | NestJS Exception | Common Cause |
|-------------|-----------------|--------------|
| `400` | `BadRequestException` | Missing or invalid request body/query params |
| `403` | `ForbiddenException` | Missing `X-Tenant-ID` header |
| `404` | `NotFoundException` | Resource not found |
| `500` | `InternalServerErrorException` | Unexpected server error |

---

*Document generated from source code analysis of the M06 Forecasting & Prediction module.*  
*Backend: `modules/m06-forecasting-prediction/controllers/`*  
*Frontend: `apps/web/src/features/forecast-boards/`*
