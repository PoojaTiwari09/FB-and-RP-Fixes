# M05 — Account Intelligence API Contract

> **Base URL:** `http://localhost:3001`  
> **API Version:** v1  
> **Base Path:** `/api/v1/account-intelligence`

---

## Module Overview

**Module Name:** M05 Account Intelligence  
**Base Path:** `/api/v1/account-intelligence`  
**Description:** Provides a 360° view of customer accounts sourced from CRM (HubSpot) integrations. Surfaces account health scores, engagement gap analysis (accounts with no recent activity), activity sparklines, board-based account views, and individual account detail pages. All data is tenant-scoped.

---

## Authentication & Authorization

| Property | Detail |
|---|---|
| Authentication Required | **Yes** — all endpoints |
| Auth Mechanism | `Authorization: Bearer <accessToken>` header |
| Tenant Scoping | `TenantGuard` extracts `tenantId` from the JWT |
| Role-Based Filtering | `SALES_REP` users are automatically filtered to only see accounts assigned to them |

---

## Endpoints Quick Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/accounts` | List accounts for a board with filters | Yes |
| `GET` | `/accounts/engagement-gap` | List accounts with no recent activity | Yes |
| `GET` | `/accounts/sparklines` | Get activity sparkline data for accounts | Yes |
| `GET` | `/accounts/:hubspotId` | Get full detail for a single account | Yes |

---

## Detailed Endpoint Contracts

---

### GET /api/v1/account-intelligence/accounts

**Description:** Returns a paginated and sortable list of customer accounts for a given board view. Supports filtering by rep, period, and sort order. `SALES_REP` users are automatically scoped to their own accounts.

**Request Headers**

| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <accessToken>` | Yes |

**Query Parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `board_slug` | `string` | **Yes** | — | The board view slug (e.g., `renewal-risk`, `enterprise-accounts`) |
| `tab_id` | `string` | No | — | Active tab filter within the board |
| `rep_id` | `string` | No | — | Filter by rep user ID (managers only; auto-set for SALES_REP) |
| `period` | `string` | No | — | Time period filter (e.g., `Q2-2026`, `last_30_days`) |
| `sort_field` | `string` | No | — | Field to sort by (e.g., `healthScore`, `exitARR`, `lastActivity`) |
| `sort_dir` | `string` | No | `asc` | Sort direction: `asc` or `desc` |
| `page` | `integer` | No | `1` | Page number |
| `page_size` | `integer` | No | `20` | Records per page |

**Success Response — 200 OK**

```json
{
  "data": [
    {
      "id": "acc-001",
      "name": "Technology Pacific",
      "hubspotId": "hs-12345",
      "ownerName": "Sarah Chen",
      "healthScore": 72.5,
      "exitARR": 180000,
      "renewalDate": "2026-12-16",
      "lastActivity": "2 days ago",
      "contactsCount": 5,
      "openDeals": 20000,
      "industry": "Software",
      "riskLevel": "medium"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 6,
    "totalPages": 1
  }
}
```

**Error Responses**

| Status | Error Code | Message | When It Occurs |
|---|---|---|---|
| `400` | `MISSING_PARAM` | `{ "error": "board_slug is required" }` | `board_slug` not provided |
| `401` | `UNAUTHORIZED` | Unauthorized | Missing or invalid token |
| `500` | `INTERNAL_ERROR` | Internal server error | Server-side failure |

---

### GET /api/v1/account-intelligence/accounts/engagement-gap

**Description:** Returns accounts that have had no recorded activity in the past N days. Used to surface accounts at risk of going dark.

> **Note:** This route must be called **before** `GET /accounts/:hubspotId` because Express matches literal path segments in order.

**Request Headers**

| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <accessToken>` | Yes |

**Query Parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `board_slug` | `string` | **Yes** | — | Board slug to scope the query |
| `days` | `integer` | No | `21` | Number of days of inactivity to flag (e.g., `14` = no activity in last 14 days) |

**Success Response — 200 OK**

```json
{
  "data": [
    {
      "accountId": "acc-005",
      "name": "CyberByte Systems",
      "ownerName": "Michael Rodriguez",
      "lastActivityDate": "2026-04-06",
      "daysSinceActivity": 66,
      "exitARR": 100000,
      "renewalDate": "2026-12-16",
      "riskLevel": "high"
    }
  ],
  "total": 1,
  "daysThreshold": 21
}
```

**Error Responses**

| Status | Error Code | Message | When It Occurs |
|---|---|---|---|
| `400` | `MISSING_PARAM` | `{ "error": "board_slug is required" }` | `board_slug` not provided |
| `401` | `UNAUTHORIZED` | Unauthorized | Missing or invalid token |

---

### GET /api/v1/account-intelligence/accounts/sparklines

**Description:** Returns compressed activity data (sparklines) for a set of accounts — used to render mini activity charts in the account list view.

**Request Headers**

| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <accessToken>` | Yes |

**Query Parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `board_slug` | `string` | **Yes** | — | Board slug to scope the query |
| `hubspot_ids` | `string` | No | — | Comma-separated list of HubSpot account IDs to get sparklines for (e.g., `hs-001,hs-002,hs-003`) |

**Success Response — 200 OK**

```json
{
  "sparklines": {
    "hs-12345": [
      { "date": "2026-05-01", "count": 3, "types": ["call", "email", "call"] },
      { "date": "2026-05-08", "count": 1, "types": ["meeting"] },
      { "date": "2026-05-15", "count": 2, "types": ["email", "call"] }
    ],
    "hs-67890": [
      { "date": "2026-05-01", "count": 0, "types": [] },
      { "date": "2026-05-08", "count": 1, "types": ["call"] }
    ]
  }
}
```

**Error Responses**

| Status | Error Code | Message | When It Occurs |
|---|---|---|---|
| `400` | `MISSING_PARAM` | `{ "error": "board_slug is required" }` | `board_slug` not provided |
| `401` | `UNAUTHORIZED` | Unauthorized | Missing or invalid token |

---

### GET /api/v1/account-intelligence/accounts/:hubspotId

**Description:** Returns the full account detail for a specific CRM account identified by its HubSpot ID. Includes contact list, recent activities, deal summary, and risk signals.

**Request Headers**

| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <accessToken>` | Yes |

**Path Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `hubspotId` | `string` | Yes | The HubSpot CRM account ID (e.g., `hs-12345`) |

**Success Response — 200 OK**

```json
{
  "id": "acc-001",
  "hubspotId": "hs-12345",
  "name": "Technology Pacific",
  "ownerName": "Sarah Chen",
  "ownerInitials": "SC",
  "industry": "Software",
  "healthScore": 72.5,
  "exitARR": 180000,
  "renewalDate": "2026-12-16",
  "lastActivity": "Yesterday",
  "contactsCount": 5,
  "openDeals": 20000,
  "contacts": [
    {
      "id": "contact-001",
      "name": "Marcus Lee",
      "title": "VP Engineering",
      "email": "marcus@techpacific.com",
      "phone": "+1-555-0101",
      "isChampion": true
    }
  ],
  "recentActivities": [
    {
      "type": "Call",
      "datetime": "2026-06-09T10:00:00.000Z",
      "with": "Marcus Lee",
      "subject": "Q3 Renewal Planning"
    }
  ],
  "overview": {
    "risksAndObjections": [
      {
        "title": "Budget concerns raised",
        "severity": "HIGH",
        "mentionedCount": 4,
        "lastMentioned": "2 days ago"
      }
    ]
  },
  "activityFeed": {
    "items": [
      {
        "type": "Call",
        "datetime": "2026-06-09T10:00:00.000Z",
        "with": "Marcus Lee",
        "subject": "Q3 Renewal Planning",
        "createdBy": "Sarah Chen"
      }
    ],
    "total": 12,
    "page": 1,
    "totalPages": 2
  },
  "briefContent": "**Account Summary**\n\nTechnology Pacific is a mid-market software company...",
  "todos": {
    "todos": [
      {
        "id": "todo-1",
        "title": "Send renewal proposal",
        "dueDate": "2026-12-20",
        "assignee": "Sarah Chen",
        "completed": false
      }
    ]
  },
  "crmFields": {
    "crmFields": [
      { "label": "CRM Stage", "value": "Negotiation" },
      { "label": "Close Date", "value": "Dec 31, 2026" },
      { "label": "Deal Value", "value": "$180,000" }
    ]
  }
}
```

**Error Responses**

| Status | Error Code | Message | When It Occurs |
|---|---|---|---|
| `404` | `NOT_FOUND` | Account not found | No account with that HubSpot ID |
| `401` | `UNAUTHORIZED` | Unauthorized | Missing or invalid token |

---

## Business Rules & Notes

- **`board_slug` is Required on List Endpoints:** The accounts list, engagement gap, and sparklines endpoints all require `board_slug`. Without it, a `400` error is returned.
- **Route Ordering:** The static sub-paths (`engagement-gap`, `sparklines`) are registered before the dynamic `/:hubspotId` param to prevent Express from incorrectly matching the string `"engagement-gap"` as a HubSpot ID.
- **SALES_REP Auto-Filter:** When the authenticated user has role `SALES_REP` or `sales_rep`, the API automatically appends `rep_id = req.userId` to the query. Managers can pass an explicit `rep_id` to filter by a specific rep.
- **HubSpot Sync:** Account data originates from HubSpot CRM via the integrations layer (see M05 webhooks). The `healthScore` is computed by the platform's risk scoring engine and refreshed nightly.
- **Engagement Gap Threshold:** The default engagement gap is 21 days. Use the `days` query param to change it (e.g., `?days=14` for 2-week threshold).
