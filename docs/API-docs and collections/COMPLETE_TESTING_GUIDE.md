# Complete Postman Collection Testing Guide

## ✅ FIXED CONFIGURATION

### Port Setup (FINAL - DO NOT CHANGE)
- **Backend API**: Port **3002** 
- **Frontend (Next.js)**: Port **3000**
- **Postman**: Tests against backend on port 3002

### Environment Variables (VERIFIED)

**Root `.env`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002  ✓
PORT=3002  ✓
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002  ✓
NEXT_PUBLIC_M08_API_BASE_URL=http://localhost:3002  ✓
```

---

## 🔑 TOKEN FLOW EXPLANATION

### How Tokens Work Automatically in Postman

1. **Login Request** → Backend returns `accessToken` + `refreshToken`
2. **Test Script** (runs automatically after login) → Extracts tokens and stores in Postman variables
3. **Subsequent Requests** → Use `{{accessToken}}` from variables in Authorization header
4. **Token Persistence** → Stored in collection variables for entire test run

```javascript
// Test script runs automatically after login
pm.test("Response has accessToken", function () {
    var jsonData = pm.response.json();
    pm.collectionVariables.set('accessToken', jsonData.data.accessToken);
    pm.collectionVariables.set('refreshToken', jsonData.data.refreshToken);
});
```

---

## 📋 COMPLETE TEST RUN - SINGLE EXECUTION FLOW

### **Step 1: Authenticate Manager**

**Request:** `1. POST /auth/login - Manager`
```json
{
  "email": "alex.morgan@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "refresh...",
    "user": {
      "id": "uuid",
      "email": "alex.morgan@relanto.com",
      "role": "MANAGER",
      "frontendRole": "sales_manager"
    }
  }
}
```

✅ **Token stored in `{{accessToken}}` variable**
✅ **Test script verifies `role === MANAGER`**

---

### **Step 2: Test Manager APIs - Sales Engagement**

Run these requests **in sequence** (all use `{{accessToken}}`):

1. **GET /sales-engagement/tasks** → Lists all tasks
2. **GET /sales-engagement/tasks/summary** → Task statistics
3. **GET /sales-engagement/activity/recent** → Recent activities
4. **POST /sales-engagement/tasks** → Create new task
   - Response sets `{{taskId}}` variable
5. **GET /sales-engagement/tasks/{id}/detail** → Uses `{{taskId}}`
6. **PATCH /sales-engagement/tasks/{id}** → Update task
7. **POST /sales-engagement/tasks/{id}/mark-complete** → Mark complete

✅ **All requests automatically include `Authorization: Bearer {{accessToken}}`**

---

### **Step 3: Test Manager APIs - Conversation Intelligence**

1. **GET /conversation-intelligence/filters/options** → Filter metadata
2. **GET /conversation-intelligence/search/calls** → Search call records
3. **GET /conversation-intelligence/call-reviews** → List reviews
4. **GET /conversation-intelligence/scorecards** → Manager scorecards

---

### **Step 4: Test Manager APIs - Forecasting**

1. **GET /forecasting/periods** → List forecast periods
   - Response sets `{{periodId}}` if available
2. **GET /forecasting/periods/{id}/board** → Uses `{{periodId}}`

---

### **Step 5: Manager Logout**

**Request:** `5. POST /auth/logout`
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

✅ **Clear manager token from variables**

---

### **Step 6: Authenticate Sales Rep**

**Request:** `2. POST /auth/login - Sales Rep`
```json
{
  "email": "sarah.chen@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "role": "SALES_REP"
    }
  }
}
```

✅ **Token stored in `{{repAccessToken}}` variable** (different from manager)
✅ **Test script verifies `role === SALES_REP`**

---

### **Step 7: Test Sales Rep APIs - Sales Engagement**

Run all 7 Sales Engagement requests using `{{repAccessToken}}`:
- The collection has a dedicated folder for Sales Rep with these same endpoints
- All responses should work for SALES_REP role

---

### **Step 8: RBAC Permission Tests**

#### Test 2.1: Manager Access - Sales Engagement
- Uses `{{accessToken}}` (manager token)
- Should return **200 OK** ✅

#### Test 2.2: Sales Rep Access - Sales Engagement  
- Uses `{{repAccessToken}}` (sales rep token)
- Should return **200 OK** ✅

#### Test 2.3: Invalid Token
- Uses `Bearer invalid_token_12345`
- Should return **401 Unauthorized** ✅

#### Test 2.4: No Auth Header
- No Authorization header
- Should return **401 Unauthorized** ✅

---

### **Step 9: Sales Rep Logout**

**Request:** `5. POST /auth/logout`
- Uses `{{repAccessToken}}`
- Clears sales rep session

---

## 🚀 HOW TO RUN COMPLETE TEST IN POSTMAN

### **Method 1: Collection Runner (Recommended)**

1. Open `postman_collection_updated.json` in Postman
2. Click **"Collection Runner"** (top-left)
3. Select collection from dropdown
4. Click **"Run"**
5. Postman executes all requests in order:
   - Manager login
   - All manager API tests
   - Sales rep login
   - All sales rep API tests
   - Verification tests

**Expected Result:** All requests show ✅ Green (pass)

---

### **Method 2: Manual Sequential Testing**

1. **Authentication** folder
   - Click `1. POST /auth/login - Manager` → Send
   - Observe token stored in variables
   - Click `1. GET /auth/me` → Send (uses token)

2. **Sales Engagement** folder
   - Click `1. GET /sales-engagement/tasks` → Send
   - Continues with other requests

3. **Conversation Intelligence** folder
   - Click each request in order

4. **Forecasting** folder
   - Click each request in order

---

## ✅ VERIFICATION CHECKLIST

### Before Running Tests:
- [ ] Backend running on port 3002: `npm run dev` (in `/apps/api`)
- [ ] PostgreSQL running: `docker-compose up -d postgres`
- [ ] Redis running: `docker-compose up -d redis`
- [ ] Frontend updated with `.env.local` port 3002
- [ ] Postman collection imported: `postman_collection_updated.json`

### After Login - Each Should Show:
- [ ] Status code: **200**
- [ ] Response has `success: true`
- [ ] `data.accessToken` extracted and stored
- [ ] `data.user.role` matches expected (MANAGER or SALES_REP)

### During API Tests - Each Should Show:
- [ ] Status code: **200**
- [ ] Response has `success: true`
- [ ] Correct data structure in response
- [ ] No 401/403 permission errors

### After Test Run:
- [ ] Green checkmark for all requests
- [ ] "Test Results" tab shows all assertions passed
- [ ] Console shows token operations: "accessToken set", "repAccessToken set", etc.

---

## 🔍 TROUBLESHOOTING

### Problem: `401 Unauthorized`
**Cause:** Token not extracted or expired
**Fix:** 
1. Run login request again
2. Check "Tests" tab in login response - should show green ✅
3. Verify `{{accessToken}}` is set in Variables tab

### Problem: `ECONNREFUSED 127.0.0.1:3002`
**Cause:** Backend not running
**Fix:**
```bash
cd apps/api
npm run dev
# Wait for "Listening on port 3002"
```

### Problem: `404 Not Found` on endpoints
**Cause:** Backend routes not registered
**Fix:**
1. Check backend logs: `GET /api/v1/sales-engagement/tasks` endpoint exists
2. Verify NestJS module exports the route
3. Restart backend if routes recently added

### Problem: Tasks appear empty in responses
**Cause:** Database has no test data
**Fix:**
1. Run database seeders (if available)
2. Or use `POST /sales-engagement/tasks` to create test data first
3. Then run `GET /sales-engagement/tasks` to retrieve

---

## 📊 TOKEN VARIABLE REFERENCE

### Collection Variables Used:

| Variable | Purpose | Set By | Used In |
|----------|---------|--------|---------|
| `{{baseUrl}}` | Base URL for all requests | Static in collection | All requests |
| `{{accessToken}}` | Manager's JWT token | Login - Manager response | Manager API requests |
| `{{refreshToken}}` | Manager's refresh token | Login - Manager response | Logout request |
| `{{repAccessToken}}` | Sales Rep's JWT token | Login - Sales Rep response | Sales Rep API requests |
| `{{userId}}` | Manager user ID | Login - Manager response | Profile requests (optional) |
| `{{repUserId}}` | Sales Rep user ID | Login - Sales Rep response | Profile requests (optional) |
| `{{taskId}}` | Created task ID | POST /tasks response | GET/PATCH/DELETE task requests |
| `{{periodId}}` | Forecast period ID | GET /periods response | GET /periods/{id}/board |

---

## 🎯 EXPECTED OUTCOMES

### Successful Run Should Show:

```
Authentication
✅ 1. POST /auth/login - Manager          | 200 OK | 1.2s
✅ 2. POST /auth/login - Sales Rep        | 200 OK | 1.1s
✅ 3. POST /auth/register - New User      | 201 OK | 0.9s
✅ 4. GET /auth/me - Get Current User     | 200 OK | 0.8s
✅ 5. POST /auth/logout - Logout          | 200 OK | 0.7s

Sales Engagement (M08)
✅ 1. GET /sales-engagement/tasks         | 200 OK | 0.5s
✅ 2. GET /sales-engagement/tasks/summary | 200 OK | 0.6s
✅ 3. GET /sales-engagement/activity/recent | 200 OK | 0.7s
✅ 4. POST /sales-engagement/tasks        | 201 OK | 0.8s
✅ 5. GET /sales-engagement/tasks/{id}    | 200 OK | 0.5s
✅ 6. PATCH /sales-engagement/tasks/{id}  | 200 OK | 0.6s
✅ 7. POST /sales-engagement/tasks/mark-complete | 200 OK | 0.5s

Conversation Intelligence (M02)
✅ 1. GET /conversation-intelligence/filters | 200 OK | 0.6s
✅ 2. GET /conversation-intelligence/calls   | 200 OK | 0.8s
✅ 3. GET /conversation-intelligence/reviews | 200 OK | 0.7s
✅ 4. GET /conversation-intelligence/scorecards | 200 OK | 0.9s

Forecasting (M06)
✅ 1. GET /forecasting/periods            | 200 OK | 0.5s
✅ 2. GET /forecasting/periods/{id}/board | 200 OK | 0.6s

RBAC & Permissions Tests
✅ 1. Manager Access - Sales Engagement   | 200 OK | 0.5s
✅ 2. Sales Rep Access - Sales Engagement | 200 OK | 0.5s
✅ 3. Invalid Token - Should Fail         | 401 ⚠️  | 0.2s
✅ 4. No Auth Header - Should Fail        | 401 ⚠️  | 0.2s

Total: 22 requests | 22 passed | 0 failed | ~15 seconds
```

---

## 📝 QUICK REFERENCE - REQUEST ORDER IN COLLECTION RUNNER

```
1. Authentication / Login - Manager            (stores {{accessToken}})
2. Authentication / Login - Sales Rep          (stores {{repAccessToken}})
3. Authentication / Register                   (optional)
4. Authentication / Get Current User
5. Sales Engagement / Tasks (GET)              (uses {{accessToken}})
6. Sales Engagement / Tasks (POST)             (creates {{taskId}})
7. Sales Engagement / Tasks (GET detail)       (uses {{taskId}})
... more Sales Engagement requests
8. Conversation Intelligence / Filters
9. Conversation Intelligence / Calls
... more Conversation Intelligence requests
10. Forecasting / Periods                      (stores {{periodId}})
11. Forecasting / Board
12. RBAC Tests (Permission verification)
13. Authentication / Logout
```

---

## 🎓 Key Concepts

### Collection Variables
- Persist throughout test run
- Shared across all requests
- Set in test scripts: `pm.collectionVariables.set('key', value)`
- Accessed with `{{variableName}}`

### Test Scripts
- Execute automatically after each response
- Extract data (tokens, IDs)
- Validate response structure
- Set variables for next requests

### Bearer Token Format
```
Authorization: Bearer {{accessToken}}
```
- Token extracted from login response
- Automatically included in all authenticated requests

### Role-Based Access
- Different tokens for different roles (Manager vs Sales Rep)
- Same endpoints may return different data based on role
- Permission tests verify access control

---

## 📞 SUPPORT

If tests fail, check in this order:

1. **Is backend running?** → Check port 3002
2. **Is database ready?** → Check PostgreSQL connection
3. **Is login working?** → Check credentials are correct
4. **Are tokens stored?** → Check Variables tab in Postman
5. **Are routes registered?** → Check backend logs for route registration

For detailed logs, run backend with:
```bash
npm run dev -- --debug
```
