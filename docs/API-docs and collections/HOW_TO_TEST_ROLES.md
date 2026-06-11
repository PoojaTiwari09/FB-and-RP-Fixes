# How to Test Sales Rep and Manager Roles in Postman

**Status:** ✅ **FIXED - All routes now include `/api/v1/` prefix**

---

## 📋 WHAT WAS FIXED

### Authentication Routes Issues:
❌ **BEFORE:**
```
POST /auth/register           ← Missing /api/v1/
POST /auth/login              ← Missing /api/v1/
POST /auth/logout             ← Missing /api/v1/
GET /auth/me                  ← Missing /api/v1/
```

✅ **AFTER:**
```
POST /api/v1/auth/register    ✓
POST /api/v1/auth/login       ✓
POST /api/v1/auth/logout      ✓
GET /api/v1/auth/me           ✓
```

### Collection Restructuring:
✅ **Organized by Role:**
```
SALES REP - Complete Flow
├── Login
├── Get Profile
├── Sales Engagement APIs (5 APIs)
└── Logout

SALES MANAGER - Complete Flow
├── Login
├── Get Profile
├── Sales Engagement APIs
├── Conversation Intelligence APIs (3 APIs)
├── Forecasting APIs (2 APIs)
└── Logout

RBAC & Permission Tests
├── Invalid Token Test
└── No Auth Header Test
```

---

## 🎯 HOW TO TEST - STEP BY STEP

### Method 1: Collection Runner (Recommended - Automated)

This is the **easiest way** to test both roles completely automatically.

#### Steps:

1. **Open Postman**
   - Launch Postman application

2. **Import Fixed Collection**
   - Click "Import" button (top-left)
   - Select: `postman_application.json` (from docs folder)
   - Collection now loaded

3. **Open Collection Runner**
   - Click "Collection Runner" button (top-left toolbar)
   - OR: Select collection → Right-click → "Run"

4. **Configure Runner**
   - Collection: "R-Revenue Intelligence - Role-Based Testing (FIXED)"
   - Data: (leave empty)
   - Delays: 0ms
   - Options: Keep defaults

5. **Click "Run Collection"**
   - Watch the tests execute automatically

6. **Review Results**
   - All 17 tests should show ✅ GREEN
   - Expected time: ~20 seconds

#### What Happens Automatically:

**Sales Rep Sequence (7 tests):**
```
✅ Rep Login (token stored: {{repAccessToken}})
   ↓
✅ Get Rep Profile (verifies role = SALES_REP)
   ↓
✅ Get Sales Engagement Tasks (using {{repAccessToken}})
   ↓
✅ Get Task Summary (using {{repAccessToken}})
   ↓
✅ Get Recent Activity (using {{repAccessToken}})
   ↓
✅ Create Task (using {{repAccessToken}})
   ↓
✅ Rep Logout (token cleared)
```

**Manager Sequence (9 tests):**
```
✅ Manager Login (token stored: {{managerAccessToken}})
   ↓
✅ Get Manager Profile (verifies role = MANAGER)
   ↓
✅ Get Sales Engagement Tasks (using {{managerAccessToken}})
   ↓
✅ Get Conversation Calls (using {{managerAccessToken}})
   ↓
✅ Get Call Reviews (using {{managerAccessToken}})
   ↓
✅ Get Scorecards (using {{managerAccessToken}})
   ↓
✅ Get Forecast Periods (using {{managerAccessToken}})
   ↓
✅ Get Forecast Board (using {{managerAccessToken}})
   ↓
✅ Manager Logout (token cleared)
```

**RBAC Tests (2 tests):**
```
✅ Invalid Token → 401 Unauthorized
✅ No Auth Header → 401 Unauthorized
```

---

### Method 2: Manual Sequential Testing (For Understanding)

If you want to manually test each request to understand the flow:

#### Sales Rep Testing:

1. **Login as Sales Rep**
   - Request: `SALES REP - Complete Flow > 1. SALES REP Login`
   - Click "Send"
   - Expected: 200 OK
   - Check: Variables tab shows `{{repAccessToken}}` filled

2. **Check Profile**
   - Request: `SALES REP - Complete Flow > 2. Get Current Rep Profile`
   - Click "Send"
   - Expected: 200 OK, role = "SALES_REP"

3. **Test Sales Rep APIs**
   - Request: `SALES REP - Complete Flow > 3. REP API - Get Sales Engagement Tasks`
   - Click "Send"
   - Expected: 200 OK, returns tasks array
   - Continue with requests 4, 5, 6

4. **Logout**
   - Request: `SALES REP - Complete Flow > 7. SALES REP Logout`
   - Click "Send"
   - Expected: 200 OK
   - Token cleared

#### Manager Testing:

Repeat same steps for Manager:
- `SALES MANAGER - Complete Flow` folder
- Login → Test APIs → Logout
- But Manager has access to more APIs

---

## 🔑 TOKEN FLOW EXPLANATION

### How Tokens Work:

**Rep Login:**
```
POST /api/v1/auth/login
{
  "email": "sarah.chen@relanto.com",
  "password": "Password123!"
}

↓ Response:
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "refresh...",
    "user": { "role": "SALES_REP" }
  }
}

↓ Test Script Extracts:
pm.collectionVariables.set('repAccessToken', token)

↓ Stored in Variable:
{{repAccessToken}} = "eyJ..."
```

**Using Token in Next Requests:**
```
GET /api/v1/sales-engagement/tasks

Headers:
Authorization: Bearer {{repAccessToken}}

↓ Postman Substitutes:
Authorization: Bearer eyJ...

↓ Backend Verifies:
✓ Valid token
✓ User role = SALES_REP
✓ Returns data
```

### Token Variables in Collection:

```
{{repAccessToken}}          → Sales Rep's JWT token
{{repRefreshToken}}         → Sales Rep's refresh token
{{repUserId}}               → Sales Rep's user ID
{{managerAccessToken}}      → Manager's JWT token
{{managerRefreshToken}}     → Manager's refresh token
{{managerUserId}}           → Manager's user ID
{{periodId}}                → Forecast period ID (auto-set)
```

**All managed automatically by test scripts!**

---

## 📊 COLLECTION STRUCTURE

### Folder 1: SALES REP - Complete Flow (7 tests)

| # | Request | Method | Endpoint | Token |
|---|---------|--------|----------|-------|
| 1 | SALES REP Login | POST | /api/v1/auth/login | None → Sets {{repAccessToken}} |
| 2 | Get Current Rep Profile | GET | /api/v1/auth/me | {{repAccessToken}} |
| 3 | Get Sales Engagement Tasks | GET | /api/v1/sales-engagement/tasks | {{repAccessToken}} |
| 4 | Get Task Summary | GET | /api/v1/sales-engagement/tasks/summary | {{repAccessToken}} |
| 5 | Get Recent Activity | GET | /api/v1/sales-engagement/activity/recent | {{repAccessToken}} |
| 6 | Create Task | POST | /api/v1/sales-engagement/tasks | {{repAccessToken}} |
| 7 | SALES REP Logout | POST | /api/v1/auth/logout | {{repAccessToken}} |

### Folder 2: SALES MANAGER - Complete Flow (9 tests)

| # | Request | Method | Endpoint | Token |
|---|---------|--------|----------|-------|
| 1 | SALES MANAGER Login | POST | /api/v1/auth/login | None → Sets {{managerAccessToken}} |
| 2 | Get Current Manager Profile | GET | /api/v1/auth/me | {{managerAccessToken}} |
| 3 | Get Sales Engagement Tasks | GET | /api/v1/sales-engagement/tasks | {{managerAccessToken}} |
| 4 | Get Conversation Intelligence - Calls | GET | /api/v1/conversation-intelligence/search/calls | {{managerAccessToken}} |
| 5 | Get Call Reviews | GET | /api/v1/conversation-intelligence/call-reviews | {{managerAccessToken}} |
| 6 | Get Scorecards | GET | /api/v1/conversation-intelligence/scorecards | {{managerAccessToken}} |
| 7 | Get Forecast Periods | GET | /api/v1/forecasting/periods | {{managerAccessToken}} |
| 8 | Get Forecast Board | GET | /api/v1/forecasting/periods/{{periodId}}/board | {{managerAccessToken}} |
| 9 | SALES MANAGER Logout | POST | /api/v1/auth/logout | {{managerAccessToken}} |

### Folder 3: RBAC & Permission Tests (2 tests)

| # | Request | Method | Endpoint | Expected |
|---|---------|--------|----------|----------|
| 1 | Invalid Token Test | GET | /api/v1/sales-engagement/tasks | 401 Unauthorized |
| 2 | No Auth Header Test | GET | /api/v1/sales-engagement/tasks | 401 Unauthorized |

**Total: 18 requests | All routes fixed with `/api/v1/` prefix**

---

## ✅ WHAT TO VERIFY

### After Running Collection:

1. **All Tests Pass:**
   - Green ✅ checkmarks for all 18 tests
   - 0 red ❌ failures

2. **Rep Sequence Worked:**
   - ✅ Rep login returned 200
   - ✅ Rep token stored in {{repAccessToken}}
   - ✅ All rep APIs returned 200
   - ✅ Rep logout returned 200

3. **Manager Sequence Worked:**
   - ✅ Manager login returned 200
   - ✅ Manager token stored in {{managerAccessToken}}
   - ✅ All manager APIs returned 200
   - ✅ Manager has access to Intelligence & Forecasting
   - ✅ Manager logout returned 200

4. **RBAC Tests Worked:**
   - ✅ Invalid token returned 401
   - ✅ No auth header returned 401

5. **Token Variables:**
   - {{repAccessToken}} was populated
   - {{managerAccessToken}} was populated
   - Variables automatically cleared after logout

---

## 🚀 QUICK START

**Fastest way to test everything:**

```
1. Open Postman
2. Import: postman_application.json
3. Click "Collection Runner"
4. Select collection
5. Click "Run"
6. Watch 18 tests execute automatically ✅
```

**Expected Result:** 18/18 tests pass in ~20 seconds

---

## 🔍 TROUBLESHOOTING

### Problem: "Cannot connect to localhost:3002"
**Cause:** Backend not running  
**Fix:** Start backend first
```bash
cd apps/api
npm run dev
# Wait for: "API listening on http://localhost:3002"
```

### Problem: "401 Unauthorized" on first request
**Cause:** Credentials wrong or backend auth issue  
**Fix:**
1. Verify credentials:
   - Rep: sarah.chen@relanto.com / Password123!
   - Manager: alex.morgan@relanto.com / Password123!
2. Check backend logs for auth errors
3. Ensure database has users

### Problem: "404 Not Found"
**Cause:** Route missing `/api/v1/` prefix  
**Fix:** This should be fixed now. If still seeing 404:
1. Verify collection is using `postman_application.json` (FIXED version)
2. Check route paths include `/api/v1/`
3. Example correct: `/api/v1/auth/login`

### Problem: Tests pass but no data returned
**Cause:** Database is empty  
**Fix:**
1. Create data first using POST requests
2. Or check database has seed data
3. Try GET requests again

### Problem: Only some tests pass
**Cause:** Token not being stored between requests  
**Fix:**
1. Check "Tests" tab in previous login request
2. Should show green ✅ for "Response has accessToken"
3. Check Variables tab - token should be filled
4. If not, login request failed

---

## 📖 USING COLLECTION RUNNER

### Access Collection Runner:

**Method 1:**
- Click "Collection Runner" button (top-left, next to "Collections" and "APIs")

**Method 2:**
- Select collection folder
- Right-click
- Choose "Run"

### Collection Runner Interface:

```
┌─────────────────────────────────────────┐
│ Collection Runner                       │
├─────────────────────────────────────────┤
│ Collection: [dropdown]                  │
│ Environment: [dropdown]                 │
│ Iterations: 1                           │
│ Delay: 0ms                              │
│ ☑ Keep variable values                  │
│ ☑ Continue on error                     │
├─────────────────────────────────────────┤
│ [Run]                                   │
└─────────────────────────────────────────┘
```

### During Execution:

```
┌─────────────────────────────────────────┐
│ Test Results                            │
├─────────────────────────────────────────┤
│ 1/18: SALES REP Login          ✅ 200   │
│ 2/18: Get Rep Profile          ✅ 200   │
│ 3/18: Get Tasks                ✅ 200   │
│ ...                                     │
│ 18/18: No Auth Header Test     ✅ 401   │
├─────────────────────────────────────────┤
│ Summary: 18/18 passed ✅                │
│ Time: 22 seconds                        │
└─────────────────────────────────────────┘
```

---

## 🎓 KEY CONCEPTS

### Automatic Token Management:

The collection automatically handles tokens:

1. **Login Response Processing:**
   - Test script runs after response
   - Extracts accessToken from JSON
   - Stores in collection variable

2. **Token Persistence:**
   - Available for all subsequent requests
   - Automatically included in Authorization header
   - No manual copying needed

3. **Role-Based Testing:**
   - Different tokens for different roles
   - Test scripts verify correct role
   - Same endpoints may return different data

### Test Assertions:

Each request has test scripts that verify:
- Status code is correct (200, 201, 401, etc.)
- Response has expected properties
- Token extracted successfully
- Role matches expected value

---

## 📝 NEXT STEPS

1. **Import Collection:**
   - File: `postman_application.json`
   - Location: `docs/API-docs and collections/`

2. **Run Collection:**
   - Collection Runner
   - Select collection
   - Click "Run"

3. **Verify Results:**
   - All 18 tests should pass ✅
   - Both roles tested completely
   - Token flow working properly

4. **Check Results:**
   - View execution time
   - Review failed tests (if any)
   - Check response bodies

5. **Understand Flow:**
   - Read test assertions
   - Look at request/response pairs
   - Study token variable usage

---

## ✨ SUMMARY

✅ **All authentication routes now have `/api/v1/` prefix**  
✅ **Collection organized by role (Rep vs Manager)**  
✅ **Complete automatic token flow**  
✅ **18 tests covering both roles**  
✅ **RBAC permission verification included**  
✅ **Ready to run in Collection Runner**  

**To Test:** Import collection → Open Collection Runner → Click "Run"

**Expected:** 18/18 tests pass ✅ in ~20 seconds
