# Collection Run Checklist ✅

## Before You Start

- [ ] Backend API running on port 3002
  ```
  Command: pnpm --filter api run start
  Look for: "API listening on http://localhost:3002"
  ```

- [ ] PostgreSQL running on port 5438
  ```
  Command: docker-compose up -d postgres
  Container: revenue_intel_db
  ```

- [ ] Redis running on port 6379
  ```
  Command: docker-compose up -d redis
  Container: revenue_intel_redis
  ```

- [ ] Postman collection imported
  ```
  File: postman_collection_updated.json
  Collection name: "R-Revenue Intelligence Platform..."
  ```

- [ ] Collection variables visible
  ```
  Right-click collection → Edit (or click name)
  → Variables tab
  Should see: baseUrl, accessToken, repAccessToken, etc.
  ```

---

## Quick Start: Run Everything

### Option A: Fastest (Using Runner)

```
1. Click "Runner" (top menu bar in Postman)
2. Select your collection from left sidebar
3. Settings:
   ✅ Keep variable values
   ✅ Persist responses for a session
   ❌ Stop run if an error occurs (UNCHECK)
4. Select all requests (check boxes)
5. Click "Start Run" (orange button)
6. Watch results scroll
7. Summary at end shows: ✅ Passed vs ❌ Failed
```

### Option B: Manual (Full Control)

Run requests in this exact order:

**Phase 1: Authentication**
```
□ 1. POST /auth/login - Manager
  └─ Wait for response
  └─ Check token in Variables tab

□ 2. POST /auth/login - Sales Rep
  └─ Wait for response
  └─ Check repAccessToken in Variables tab

□ 3. GET /auth/me
  └─ Should return user profile
```

**Phase 2: Sales Engagement**
```
□ 4. GET /sales-engagement/tasks
□ 5. GET /sales-engagement/tasks/summary
□ 6. GET /sales-engagement/activity/recent
□ 7. POST /sales-engagement/tasks (creates task)
□ 8. GET /sales-engagement/tasks/{id}/detail
□ 9. PATCH /sales-engagement/tasks/{id}
□ 10. POST /sales-engagement/tasks/{id}/mark-complete
```

**Phase 3: Conversation Intelligence**
```
□ 11. GET /conversation-intelligence/filters/options
□ 12. GET /conversation-intelligence/search/calls
□ 13. GET /conversation-intelligence/call-reviews
□ 14. GET /conversation-intelligence/scorecards
```

**Phase 4: Forecasting**
```
□ 15. GET /forecasting/periods
□ 16. GET /forecasting/periods/{id}/board
```

**Phase 5: RBAC Tests**
```
□ 17. Manager Access - Should return 200 ✅
□ 18. Sales Rep Access - Should return 200 ✅
□ 19. Invalid Token - Should return 401 ✅
□ 20. No Auth Header - Should return 401 ✅
```

---

## After Each Request

### Check These Three Things:

#### 1️⃣ Status Code
```
✅ 200 OK = Success
✅ 201 Created = Success (POST creating resource)
✅ 401 Unauthorized = Expected (for auth tests)
❌ 404 Not Found = ERROR
❌ 500 Internal Server Error = ERROR
```

#### 2️⃣ Tests Tab (Green ✅ or Red ❌)
```
Click "Tests" tab after response

Green ✅ = Test passed
Red ❌ = Test failed (check error message)

Look for:
✅ Status code is [expected]
✅ Response has [expected field]
✅ User role is [expected role]
```

#### 3️⃣ Response Body
```
Click "Body" tab

Look for:
✅ "success": true (request worked)
❌ "success": false (request failed)

Check "data" field has actual content
```

---

## Token Storage Verification

### After Login Request:

**Step 1: Check Response**
```
Body tab should show:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "...",
      "role": "..."
    }
  }
}
```

**Step 2: Check Tests Tab**
```
Should see green checks ✅ for:
✅ Status code is 200
✅ Response has accessToken
✅ User role is MANAGER/SALES_REP
```

**Step 3: Verify Variables Stored**
```
1. Right-click collection name
2. Click "Edit"
3. Go to "Variables" tab
4. Find: {{accessToken}} or {{repAccessToken}}
5. Look at "Current Value" column
6. Should show long JWT token (not empty!)

✅ Correct: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ Wrong: (empty)
```

---

## For Each Protected Request

### Check Header Includes Token

**Before clicking Send:**
1. Look at request (don't expand it fully)
2. In upper area, should see:
   ```
   Authorization | Bearer {{repAccessToken}}
   ```
3. Variable name tells you which token:
   - `{{accessToken}}` = Manager token
   - `{{repAccessToken}}` = Sales Rep token

### Verify Token is Used

**After clicking Send:**
1. Check Response Body has data (not 401 error)
2. Check Tests tab shows ✅
3. Status should be 200 OK

---

## Troubleshooting Quick Fixes

### Problem: 401 Unauthorized
```
Solution:
□ Check Variables tab - is token filled? (not empty)
□ If empty, run Login request again
□ Check request uses correct token variable
□ If still failing, check backend logs for errors
```

### Problem: 404 Not Found
```
Solution:
□ Check backend running: "API listening on :3002"
□ Check Variables: baseUrl = http://localhost:3002
□ Check PostgreSQL running: docker ps
□ Restart API if needed
```

### Problem: Token Not Stored
```
Solution:
□ Check Response body - does it have accessToken?
□ Check Tests tab - does it show errors?
□ Check Variables tab - what's the current value?
□ Try Login request again manually
□ Check backend logs for errors
```

### Problem: One Request Fails, Others Skip
```
Solution:
□ In Runner settings, uncheck: "Stop run if error occurs"
□ Or fix the failing request and re-run collection
□ Failed requests can be re-run individually
```

---

## Expected Results Summary

### Successful Collection Run:
```
✅ Login endpoints: 200 OK + token stored
✅ Protected endpoints: 200 OK + data returned
✅ Task creation: 201 Created + taskId stored
✅ RBAC tests: Expected status codes returned
✅ Invalid token test: 401 Unauthorized returned
✅ No auth test: 401 Unauthorized returned
✅ All Tests tabs: Green ✅ (all passed)
✅ Variables tab: All tokens filled
```

### Failed Collection Run Would Have:
```
❌ Login returns 401 or 500
❌ Protected endpoints return 401 or 404
❌ Tests tabs show Red ❌
❌ Variables tab shows empty tokens
❌ Response bodies show error messages
```

---

## Complete Verification Checklist

After running entire collection, check:

```
TOKEN STORAGE:
□ {{accessToken}} is filled (Manager token)
□ {{repAccessToken}} is filled (Sales Rep token)
□ {{taskId}} is filled (from create task)
□ {{periodId}} is filled (if available)

LOGIN TESTS:
□ Manager login: 200 OK ✅
□ Sales Rep login: 200 OK ✅
□ Get profile: 200 OK ✅

PROTECTED ENDPOINTS:
□ List tasks: 200 OK ✅
□ Get summary: 200 OK ✅
□ Get activity: 200 OK ✅
□ Create task: 201 Created ✅
□ Get task detail: 200 OK ✅
□ Update task: 200 OK ✅
□ Mark complete: 200 OK ✅

CONVERSATION INTELLIGENCE:
□ Get filters: 200 OK ✅
□ Search calls: 200 OK ✅
□ Get reviews: 200 OK ✅
□ Get scorecards: 200 OK ✅

FORECASTING:
□ Get periods: 200 OK ✅
□ Get board: 200 OK ✅

RBAC TESTS:
□ Manager access: 200 OK ✅
□ Sales Rep access: 200 OK ✅
□ Invalid token: 401 Unauthorized ✅
□ No auth header: 401 Unauthorized ✅

RESPONSE DATA:
□ All responses have "success": true
□ All responses have "data" field
□ Data field has content (not empty)

TEST SCRIPTS:
□ All Tests tabs show Green ✅
□ No Red ❌ marks
□ Error count is 0
```

**If all checked ✅, Your API is 100% working!** 🎉

---

## One-Click Reference

### Services Needed (Must be Running):
```bash
# Terminal 1: Backend API
pnpm --filter api run start

# Terminal 2: Databases (Docker)
docker-compose up -d postgres redis
```

### Postman Steps:
```
1. Runner → Select Collection → Start Run
OR
2. Manual: Follow sequence in "Quick Start" section
```

### Success Indicator:
```
✅ All login requests return 200 OK
✅ Variables filled with tokens
✅ Protected endpoints return 200 OK
✅ Tests all pass (green ✅)
```

---

## Need Help?

**Refer to full guides:**
- `RUN_COMPLETE_COLLECTION.md` - Detailed step-by-step
- `POSTMAN_TESTING_GUIDE.md` - Complete reference
- `TOKEN_FLOW_DIAGRAM.md` - How tokens work
- `README.md` - Overview

**Quick issues:**
- 401 Error → Check Variables tab for token
- 404 Error → Check backend running on 3002
- Token empty → Run Login request again
- Test failed → Check Response body for error

Happy testing! 🚀
