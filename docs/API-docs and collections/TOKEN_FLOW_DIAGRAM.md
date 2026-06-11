# JWT Token Flow - Visual Guide

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTMAN COLLECTION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 1: LOGIN (Get Token)                                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  Request: POST /api/v1/auth/login                                  │   │
│  │  ├─ Email: sarah.chen@relanto.com                                  │   │
│  │  ├─ Password: Password123!                                         │   │
│  │  └─ TenantSlug: relanto                                            │   │
│  │                                                                     │   │
│  │  ↓ [User clicks "Send"]                                            │   │
│  │                                                                     │   │
│  │  Response: 200 OK                                                  │   │
│  │  ├─ accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."        │   │
│  │  ├─ refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."       │   │
│  │  ├─ expiresIn: 600 (seconds)                                       │   │
│  │  └─ user: { id, email, role, permissions }                        │   │
│  │                                                                     │   │
│  │  ↓ [Test Script Runs Automatically]                               │   │
│  │                                                                     │   │
│  │  Test Script Extracts Token:                                       │   │
│  │  pm.collectionVariables.set('repAccessToken', accessToken)        │   │
│  │                                                                     │   │
│  │  ↓                                                                  │   │
│  │                                                                     │   │
│  │  ✅ Token Stored in Collection Variable: {{repAccessToken}}       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 2: USE TOKEN (Call Protected Endpoints)                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  Request: GET /api/v1/sales-engagement/tasks                       │   │
│  │  Headers:                                                           │   │
│  │  ├─ Authorization: Bearer {{repAccessToken}}                       │   │
│  │  │             ↑                                                    │   │
│  │  │             └─ POSTMAN REPLACES THIS WITH ACTUAL TOKEN         │   │
│  │  │                                                                  │   │
│  │  │  Actual header sent to server:                                 │   │
│  │  │  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │   │
│  │  └─                                                                │   │
│  │                                                                     │   │
│  │  ↓ [User clicks "Send"]                                            │   │
│  │                                                                     │   │
│  │  Backend Verifies Token:                                           │   │
│  │  ├─ Check signature (valid?)                                       │   │
│  │  ├─ Check expiration (not expired?)                                │   │
│  │  ├─ Check user exists                                              │   │
│  │  ├─ Check permissions                                              │   │
│  │  └─ Extract user context (who is making request?)                  │   │
│  │                                                                     │   │
│  │  ↓                                                                  │   │
│  │                                                                     │   │
│  │  Response: 200 OK                                                  │   │
│  │  {                                                                  │   │
│  │    "success": true,                                                │   │
│  │    "data": [                                                       │   │
│  │      { "id": "task-1", "title": "...", "status": "..." },         │   │
│  │      { "id": "task-2", "title": "...", "status": "..." }          │   │
│  │    ]                                                               │   │
│  │  }                                                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 3: TOKEN LIFETIME                                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  Token Created at:          10:00:00 AM                            │   │
│  │  Token Expires in:          600 seconds = 10 minutes               │   │
│  │  Token Expires at:          10:10:00 AM                            │   │
│  │                                                                     │   │
│  │  Timeline:                                                          │   │
│  │  ────────────────────────────────────────────────────────────      │   │
│  │  10:00  10:05         10:09:59        10:10         10:11          │   │
│  │   ↓     ↓             ↓               ↓             ↓              │   │
│  │  [Login][API calls   [Still Valid] [Expires]    [Must re-login]  │   │
│  │   OK]   OK]          ✅             ⏰           ❌              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step What Happens

### Step 1: Before Login
```
Collection Variables:
┌──────────────────────┐
│ repAccessToken: "" ✗ │  (Empty - no token yet)
│ taskId: ""           │
│ userId: ""           │
└──────────────────────┘
```

### Step 2: You Click "Send" on Login
```
Postman sends to Backend:
┌─────────────────────────────────┐
│ POST /api/v1/auth/login         │
│ {                               │
│   "email": "...",               │
│   "password": "...",            │
│   "tenantSlug": "relanto"       │
│ }                               │
└─────────────────────────────────┘
                ↓
Backend processes and responds:
┌─────────────────────────────────┐
│ HTTP 200 OK                     │
│ {                               │
│   "success": true,              │
│   "data": {                     │
│     "accessToken": "JWT...",    │
│     "refreshToken": "JWT...",   │
│     "user": {                   │
│       "id": "...",              │
│       "email": "...",           │
│       "role": "SALES_REP",      │
│       "permissions": [...]      │
│     }                           │
│   }                             │
│ }                               │
└─────────────────────────────────┘
```

### Step 3: Test Script Runs
```
Postman test script automatically does:
┌────────────────────────────────────────────────────┐
│ var jsonData = pm.response.json();                 │
│ pm.collectionVariables.set(                        │
│   'repAccessToken',                                │
│   jsonData.data.accessToken                        │
│ );                                                 │
└────────────────────────────────────────────────────┘

Result: Token extracted and stored!
```

### Step 4: After Login
```
Collection Variables:
┌──────────────────────────────────┐
│ repAccessToken: "eyJhbGciOiJI..." │ ✅ (Token stored!)
│ taskId: ""                        │
│ userId: ""                        │
└──────────────────────────────────┘
```

### Step 5: Next Request Uses Token
```
You click "Send" on any protected endpoint:

Request Setup:
┌────────────────────────────────────────────────────┐
│ GET /api/v1/sales-engagement/tasks                 │
│ Headers:                                           │
│   Authorization: Bearer {{repAccessToken}}         │
└────────────────────────────────────────────────────┘
                    ↓
Postman variable substitution:
┌────────────────────────────────────────────────────┐
│ GET /api/v1/sales-engagement/tasks                 │
│ Headers:                                           │
│   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR... │
└────────────────────────────────────────────────────┘
                    ↓
Sent to Backend:
Backend validates token:
├─ Signature valid? ✅
├─ Not expired? ✅
├─ User exists? ✅
├─ Has permissions? ✅
│
└─→ Response: 200 OK with data ✅
```

---

## Token Variable Substitution Examples

### Example 1: Using Manager Token
```
Stored Variable: {{accessToken}} = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Request:
GET /api/v1/conversation-intelligence/filters/options
Authorization: Bearer {{accessToken}}

What Postman Sends:
GET /api/v1/conversation-intelligence/filters/options
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Backend receives real token and validates it
```

### Example 2: Using Sales Rep Token
```
Stored Variable: {{repAccessToken}} = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Request:
GET /api/v1/sales-engagement/tasks
Authorization: Bearer {{repAccessToken}}

What Postman Sends:
GET /api/v1/sales-engagement/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Backend receives real token and validates it
```

### Example 3: Using Dynamic Task ID
```
Stored Variable: {{taskId}} = "task-abc-123-xyz"

Request:
GET /api/v1/sales-engagement/tasks/{{taskId}}/detail

What Postman Sends:
GET /api/v1/sales-engagement/tasks/task-abc-123-xyz/detail

✅ Backend receives real task ID
```

---

## Token Validation Flow at Backend

```
Request arrives with Authorization header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Backend JWT Guard checks:
┌─────────────────────────────────────────────────────┐
│ 1. Extract token from "Bearer ..."                  │
│    ↓                                                │
│ 2. Verify signature using JWT_SECRET                │
│    ├─ Valid? → Continue                            │
│    └─ Invalid? → Return 401 Unauthorized           │
│    ↓                                                │
│ 3. Check expiration timestamp                       │
│    ├─ Not expired? → Continue                      │
│    └─ Expired? → Return 401 Unauthorized           │
│    ↓                                                │
│ 4. Extract user ID from token                       │
│    ↓                                                │
│ 5. Load user from database                          │
│    ├─ User exists? → Continue                      │
│    └─ User deleted? → Return 401 Unauthorized      │
│    ↓                                                │
│ 6. Extract permissions from token                   │
│    ├─ Has required permission? → Execute endpoint  │
│    └─ Missing permission? → Return 403 Forbidden   │
│    ↓                                                │
│ 7. Endpoint executes with user context             │
│    ├─ Success → Return 200 with data               │
│    └─ Error → Return 400/500 with error message    │
└─────────────────────────────────────────────────────┘
```

---

## Common Scenarios

### Scenario 1: Successful Flow ✅
```
1. Login Request
   ↓
2. Backend returns token
   ↓
3. Test script stores token
   ↓
4. Protected request with token
   ↓
5. Backend validates token ✅
   ↓
6. Request executes successfully
   ↓
7. Response: 200 OK ✅
```

### Scenario 2: No Token ❌
```
1. Try to call protected endpoint
   ↓
2. No Authorization header
   ↓
3. Backend checks for token ❌ (missing)
   ↓
4. Response: 401 Unauthorized
   ↓
ERROR: "Authorization header required"
```

### Scenario 3: Invalid Token ❌
```
1. Authorization: Bearer invalid_token_xyz
   ↓
2. Backend tries to verify signature ❌ (fails)
   ↓
3. Response: 401 Unauthorized
   ↓
ERROR: "Invalid token signature"
```

### Scenario 4: Token Expired ❌
```
1. Got token at 10:00 AM
   ↓
2. Now it's 10:15 AM (15 minutes later, token expires in 10)
   ↓
3. Try to use token ❌ (expired)
   ↓
4. Backend checks expiration, it's past 10:10 AM
   ↓
5. Response: 401 Unauthorized
   ↓
ERROR: "Token expired"
SOLUTION: Run login again to get new token
```

### Scenario 5: Wrong Permissions ❌
```
1. Sales Rep logs in, gets token with permissions: ["task.view"]
   ↓
2. Try to access /api/v1/conversation-intelligence/reports
   ↓
3. Endpoint requires permission: "report.view"
   ↓
4. Backend checks: Sales Rep has "report.view"? ❌ No
   ↓
5. Response: 403 Forbidden
   ↓
ERROR: "Insufficient permissions"
SOLUTION: Use Manager token instead (has "report.view" permission)
```

---

## JWT Token Structure (What's Inside)

```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ

Structure:
┌─────────────────────────┬──────────────────────────────┬──────────────────┐
│ HEADER                  │ PAYLOAD                      │ SIGNATURE        │
├─────────────────────────┼──────────────────────────────┼──────────────────┤
│ {                       │ {                            │ HMACSHA256(      │
│   "alg": "HS256",       │   "iss": "r-revenue-api",    │   base64(header) │
│   "typ": "JWT"          │   "sub": "user-id-123",      │   ".",           │
│ }                       │   "email": "user@...",       │   base64(payload)│
│                         │   "role": "SALES_REP",       │   secret         │
│                         │   "permissions": [...],      │ )               │
│                         │   "iat": 1234567890,         │                  │
│                         │   "exp": 1234568490          │                  │
│                         │ }                            │                  │
│                         │                              │                  │
│ ↓                       │ ↓                            │ ↓                │
│ Encoded as Base64       │ Encoded as Base64            │ Hex encoded      │
└─────────────────────────┴──────────────────────────────┴──────────────────┘

Key Fields:
├─ "sub" (subject): User ID
├─ "email": User email
├─ "role": User role (MANAGER, SALES_REP)
├─ "permissions": Array of allowed actions
├─ "iat" (issued at): When token was created (Unix timestamp)
├─ "exp" (expiration): When token expires (Unix timestamp)
└─ "iss" (issuer): Who issued the token
```

---

## Postman Collection Variables Tab

```
Click on collection → Variables tab

You should see:

┌─────────────────────┬─────────────────────┬──────────────────────┐
│ Variable Name       │ Initial Value       │ Current Value        │
├─────────────────────┼─────────────────────┼──────────────────────┤
│ baseUrl             │ (empty)             │ http://localhost:3002│
│ accessToken         │ (empty)             │ eyJhbGciOi... (JWT) │
│ refreshToken        │ (empty)             │ eyJhbGciOi... (JWT) │
│ repAccessToken      │ (empty)             │ eyJhbGciOi... (JWT) │
│ userId              │ (empty)             │ 33333333-3333-...   │
│ repUserId           │ (empty)             │ (empty until set)    │
│ taskId              │ (empty)             │ (empty until set)    │
│ periodId            │ (empty)             │ (empty until set)    │
└─────────────────────┴─────────────────────┴──────────────────────┘

✅ Current Value is what Postman uses in requests
❌ Initial Value is just for reference (usually empty for secrets)
```

---

## Summary

1. **Token is automatically extracted** from login response by test script
2. **Token is automatically stored** in collection variable
3. **Token is automatically used** in requests via `{{variableName}}`
4. **You just need to click "Send"** on requests in the right order
5. **Everything else happens automatically!** ✅

No manual token copying needed! 🎉
