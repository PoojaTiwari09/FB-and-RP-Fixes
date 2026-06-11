# Run Complete Collection - Full Workflow Guide

## What You're Seeing in Postman

The collection has multiple requests in order:
1. ✅ Login requests (get tokens)
2. ✅ Protected endpoints (use tokens)
3. ✅ RBAC tests (verify permissions)

**Important:** Requests must run in order because:
- Login stores token in `{{repAccessToken}}`
- Next request uses that token automatically
- If you skip login, protected endpoints will fail

---

## How Token Storage Works

### Step 1: Login Request Runs
```
POST /api/v1/auth/login
├─ Sends: email, password, tenantSlug
└─ Receives: accessToken, refreshToken
```

### Step 2: Test Script Extracts Token
```javascript
// Automatic test script runs after response:
pm.collectionVariables.set('repAccessToken', jsonData.data.accessToken);
```

### Step 3: Token Stored in Collection Variable
```
Collection Variables:
├─ repAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
└─ accessToken = (Manager token if you ran manager login)
```

### Step 4: Next Request Uses Token
```
GET /api/v1/sales-engagement/tasks
Headers:
├─ Authorization: Bearer {{repAccessToken}}
│         ↓ (Postman replaces this)
└─ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Complete Running Guide

### Option 1: Run Entire Collection (Recommended for Testing)

**Settings to Configure:**

1. **Postman UI - Left Panel:**
   - Right-click collection name: "R-Revenue Intelligence Platform..."
   - Click **"Run"** (or top menu: Runner)

2. **Or from Runner Tab (Better for seeing results):**
   - Click top menu: **"Runner"**
   - Select collection in left sidebar
   - Configure settings (see below)

3. **Select All Requests:**
   - All requests should be checked ✅
   - Or selectively choose what to run

4. **Run Configuration (Important!):**
   ```
   ✅ Run in sequence (don't run parallel)
   ✅ Delay between requests: 100-500ms
   ✅ Persist responses for a session
   ✅ Keep variable values
   ```

5. **Click "Start Run"** (big orange button)

**What You'll See:**
- Each request runs in order
- ✅ Login runs → token stored
- ✅ Protected requests use token automatically
- ✅ Tests pass/fail shown for each
- ✅ Variables update as requests complete

---

### Option 2: Run Sequence Manually (Full Control)

Follow this exact order:

#### Phase 1: Authentication ✅
```
1. Click: Authentication → 1. POST /auth/login - Manager
   └─ Click Send
   └─ ✅ Token stored in {{accessToken}}

2. Click: Authentication → 2. POST /auth/login - Sales Rep
   └─ Click Send
   └─ ✅ Token stored in {{repAccessToken}}

3. Click: Authentication → 4. GET /auth/me - Get Current User
   └─ Click Send
   └─ ✅ Uses {{accessToken}} automatically
```

#### Phase 2: Sales Engagement (M08) ✅
```
4. Click: Sales Engagement → 1. GET /sales-engagement/tasks
   └─ Click Send
   └─ ✅ Uses {{repAccessToken}} automatically

5. Click: Sales Engagement → 2. GET /sales-engagement/tasks/summary
   └─ Click Send
   └─ ✅ Uses {{repAccessToken}} automatically

6. Click: Sales Engagement → 3. GET /sales-engagement/activity/recent
   └─ Click Send
   └─ ✅ Uses {{repAccessToken}} automatically

7. Click: Sales Engagement → 4. POST /sales-engagement/tasks
   └─ Click Send
   └─ ✅ Creates task, stores ID in {{taskId}}

8. Click: Sales Engagement → 5. GET /sales-engagement/tasks/{id}/detail
   └─ Click Send
   └─ ✅ Uses {{taskId}} and {{repAccessToken}} automatically

9. Click: Sales Engagement → 6. PATCH /sales-engagement/tasks/{id}
   └─ Click Send
   └─ ✅ Updates task using {{taskId}}

10. Click: Sales Engagement → 7. POST /sales-engagement/tasks/{id}/mark-complete
    └─ Click Send
    └─ ✅ Marks task complete using {{taskId}}
```

#### Phase 3: Conversation Intelligence (M02) ✅
```
11. Click: Conversation Intelligence → 1. GET /filters/options
    └─ Click Send
    └─ ✅ Uses {{accessToken}} (Manager)

12. Click: Conversation Intelligence → 2. GET /search/calls
    └─ Click Send
    └─ ✅ Uses {{accessToken}} (Manager)

13. Click: Conversation Intelligence → 3. GET /call-reviews
    └─ Click Send
    └─ ✅ Uses {{accessToken}} (Manager)

14. Click: Conversation Intelligence → 4. GET /scorecards
    └─ Click Send
    └─ ✅ Uses {{accessToken}} (Manager)
```

#### Phase 4: Forecasting (M06) ✅
```
15. Click: Forecasting → 1. GET /forecasting/periods
    └─ Click Send
    └─ ✅ Uses {{accessToken}} (Manager)

16. Click: Forecasting → 2. GET /forecasting/periods/{id}/board
    └─ Click Send
    └─ ✅ Uses {{periodId}} if available, or {{accessToken}}
```

#### Phase 5: RBAC & Permissions ✅
```
17. Click: RBAC & Permissions Tests → 1. Manager Access
    └─ Click Send
    └─ ✅ Should return 200 OK (Manager has permission)

18. Click: RBAC & Permissions Tests → 2. Sales Rep Access
    └─ Click Send
    └─ ✅ Should return 200 OK (Sales Rep has permission)

19. Click: RBAC & Permissions Tests → 3. Invalid Token
    └─ Click Send
    └─ ✅ Should return 401 Unauthorized (expected failure)

20. Click: RBAC & Permissions Tests → 4. No Auth Header
    └─ Click Send
    └─ ✅ Should return 401 Unauthorized (expected failure)
```

---

## Verify Token Storage at Each Step

### After Login Request

1. **Check Response:**
   - Status should be: **200 OK** ✅
   - Response body should have `"accessToken"` field

2. **Check Tests Tab:**
   - Should show ✅ marks for:
     - "Status code is 200"
     - "Response has accessToken"
     - "User role is [correct role]"

3. **Check Variables:**
   - Go to collection → **Variables** tab
   - Look for `repAccessToken` or `accessToken`
   - Current Value should have a long JWT token (not empty!)

### If Token is NOT Stored

**Troubleshoot:**
1. Check Response body - does it have `"success": true`?
2. Check Tests tab - any red ❌ marks?
3. Look at Response error message
4. Try login request again
5. Make sure backend is running on port 3002

---

## How to Monitor Token Flow

### Method 1: Check Variables Tab
After each request that should store a token:
1. Click collection name in left sidebar
2. Go to **Variables** tab
3. Look at **"Current Value"** column
4. You should see tokens appear there

### Method 2: Check Tests Tab
After each request:
1. Click **Tests** tab
2. See which tests passed ✅ or failed ❌
3. Red ❌ means test failed (check error message)

### Method 3: Check Response Body
After each request:
1. Click **Body** tab
2. Look for:
   - `"success": true` = Request worked
   - `"success": false` = Request failed
   - `"data"` field has actual response

### Method 4: Check Authorization Header
Before clicking Send:
1. Expand the request
2. Look for **Headers** section
3. Should see:
   ```
   Authorization: Bearer {{repAccessToken}}
   ```
4. The variable name tells you which token will be used

---

## Common Issues When Running Collection

### Issue 1: Token Not Stored After Login

**Symptoms:**
- Login seems to work (200 OK)
- But `{{repAccessToken}}` stays empty in Variables tab

**Causes:**
1. Test script didn't run
2. Response doesn't have `accessToken` field
3. Variable name is wrong

**Fix:**
1. Go to login request → **Tests** tab
2. Check if test script is there
3. Go to Variables tab, check variable name spelling
4. Run login again manually
5. Check Response body for actual token

### Issue 2: 401 Unauthorized on Protected Endpoint

**Symptoms:**
- Login worked ✅
- But protected endpoint returns 401 ❌

**Causes:**
1. Token expired (older than 10 minutes)
2. Token variable is empty
3. Wrong token variable used
4. Token not being sent in header

**Fix:**
1. Check Variables tab - is token filled?
2. If empty, run login again
3. Check request uses correct token variable:
   - Manager endpoints: `{{accessToken}}`
   - Sales Rep endpoints: `{{repAccessToken}}`
4. Check Authorization header is there
5. Try request immediately after login

### Issue 3: 404 Not Found

**Symptoms:**
- Getting 404 on all requests

**Causes:**
1. Backend not running on port 3002
2. Wrong base URL in Variables
3. Database not connected

**Fix:**
1. Check backend is running:
   - Terminal should show: "API listening on http://localhost:3002"
2. Check Variables → `baseUrl` = `http://localhost:3002`
3. Make sure databases running:
   - PostgreSQL on 5438
   - Redis on 6379

### Issue 4: First Request Fails, Rest Skip

**Symptoms:**
- Login fails
- All other requests marked as skipped/not run

**Causes:**
1. Stop on error is enabled
2. Collection requires sequential execution
3. Login failed so no token for others

**Fix:**
1. In Runner settings, check:
   - "Stop run if an error occurs" = should be UNCHECKED ❌
   - Or CHECK it if you want to stop on failure
2. Fix login issue first
3. Re-run collection

---

## Best Practices for Running Collection

### ✅ Do This:
1. ✅ Run login requests **first**
2. ✅ Wait for response before next request
3. ✅ Check Variables tab after login
4. ✅ Use correct token variable for role
5. ✅ Run tests in sequence (not parallel)
6. ✅ Check Response/Tests tabs after each request
7. ✅ Keep backend running during entire test

### ❌ Don't Do This:
1. ❌ Skip login requests
2. ❌ Run protected endpoint before getting token
3. ❌ Run parallel (causes race conditions)
4. ❌ Use Manager token for Sales Rep endpoints
5. ❌ Run same collection twice without getting new tokens
6. ❌ Ignore red ❌ marks in tests
7. ❌ Stop backend while running tests

---

## Expected Results

### Successful Run Should Show:

```
✅ 1. POST /auth/login - Manager
   Status: 200 OK
   Tests: ✅✅✅ (3 passed)
   Variables: {{accessToken}} = "eyJhbGci..."

✅ 2. POST /auth/login - Sales Rep
   Status: 200 OK
   Tests: ✅✅✅ (3 passed)
   Variables: {{repAccessToken}} = "eyJhbGci..."

✅ 3. POST /auth/register
   Status: 200 OK
   Tests: ✅✅ (2 passed)
   Variables: {{userId}} = "uuid..."

✅ 4. GET /auth/me
   Status: 200 OK
   Tests: ✅✅ (2 passed)
   Response: User profile data

✅ 5. POST /sales-engagement/tasks
   Status: 201 Created
   Tests: ✅✅ (2 passed)
   Variables: {{taskId}} = "task-uuid"

✅ 6. GET /sales-engagement/tasks
   Status: 200 OK
   Tests: ✅✅ (2 passed)
   Response: Array of tasks

✅ 7-15. [Other requests]
   Status: 200 OK
   Tests: ✅ (all passed)

✅ 16-19. RBAC Tests
   Status: 200 or 401 (expected)
   Tests: ✅ (all passed - both success and failure scenarios)
```

---

## Step-by-Step: Run Complete Collection

### Fastest Way (Using Runner):

1. **Open Postman**
2. **Click Runner** (top menu bar)
3. **Select collection** from left sidebar
4. **Run configuration:**
   - Keep variables: ✅ Checked
   - Persist responses: ✅ Checked
   - Stop on error: ❌ Unchecked (uncheck if checked)
5. **Select all requests** (check the boxes)
6. **Click "Start Run"** (orange button)
7. **Watch the results** scroll by
8. **Summary at end** shows pass/fail count

### Manual Way (Full Control):

1. **Use sequence from "Option 2" above**
2. **Run login first** → Check token stored
3. **Run protected endpoints** → Should all work
4. **Check Variables after each phase** → Should be populated

---

## Verify Everything Works

### Checklist After Running Collection:

- [ ] All login requests returned 200 OK
- [ ] {{accessToken}} has a value (not empty)
- [ ] {{repAccessToken}} has a value (not empty)
- [ ] {{taskId}} has a value (from create task)
- [ ] Protected endpoints returned 200 OK
- [ ] RBAC tests returned expected status codes
- [ ] Invalid token test returned 401
- [ ] No auth header test returned 401
- [ ] Response bodies have data
- [ ] Test scripts all passed (green ✅)

If all checked ✅, **your entire API is working correctly!**

---

## Summary

### How Token Flow Works in Collection:
```
1. Login Request Runs
   ↓
2. Backend returns token
   ↓
3. Test script extracts it
   ↓
4. Stored in {{tokenVariableName}}
   ↓
5. Next request uses: Authorization: Bearer {{tokenVariableName}}
   ↓
6. Postman replaces with actual token
   ↓
7. Backend validates and processes
   ↓
8. Response returned ✅
```

### Key Points:
- **Tokens are automatic** - Test scripts handle it
- **Run in sequence** - Don't run requests in parallel
- **Check Variables tab** - See what's stored
- **Check Tests tab** - See what passed/failed
- **Login must run first** - Other endpoints need token

You're ready to run! 🚀
