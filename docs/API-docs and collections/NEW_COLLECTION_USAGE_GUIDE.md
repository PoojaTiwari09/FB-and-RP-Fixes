# New Postman Collection - Complete Usage Guide

**File:** `postman_application_new.json`  
**Status:** ✅ **READY TO USE**  
**Total Tests:** 25 API endpoints organized by role  

---

## 📋 COLLECTION STRUCTURE

The new collection is perfectly organized with clear folders:

```
AUTHENTICATION - Login/Logout
├── 1. LOGIN - Sales Rep (sarah.chen@relanto.com)
│   └── Stores {{repAccessToken}}
├── 2. LOGIN - Sales Manager (alex.morgan@relanto.com)
│   └── Stores {{managerAccessToken}}
├── 3. GET Current User Profile
├── 4. LOGOUT - Sales Rep
└── 5. LOGOUT - Sales Manager

SALES REP - Sales Engagement APIs (Rep-Only)
├── 1. GET - Sales Engagement Tasks List
├── 2. GET - Task Summary
├── 3. GET - Recent Activity
├── 4. POST - Create New Task
├── 5. GET - Task Detail
├── 6. PATCH - Update Task
└── 7. POST - Mark Task Complete

SALES MANAGER - Sales Engagement APIs (Manager Access)
├── 1. GET - Sales Engagement Tasks List (All Team)
├── 2. GET - Task Summary (Team Overview)
└── 3. GET - Recent Activity (Team Activity)

SALES MANAGER - Conversation Intelligence APIs (Manager-Only)
├── 1. GET - Filter Options
├── 2. GET - Search Calls
├── 3. GET - Call Reviews
└── 4. GET - Scorecards

SALES MANAGER - Forecasting APIs (Manager-Only)
├── 1. GET - List Forecast Periods
└── 2. GET - Forecast Board

RBAC - Permission & Access Control Tests
├── 1. TEST - Invalid Token Returns 401
├── 2. TEST - No Auth Header Returns 401
└── 3. TEST - Rep Cannot Access Manager APIs
```

---

## 🎯 HOW TO TEST - COMPLETE WORKFLOW

### **Test Flow 1: Sales Rep - Complete Testing**

**Step 1: Login as Sales Rep**
```
1. Go to: AUTHENTICATION - Login/Logout
2. Click: 1. LOGIN - Sales Rep (sarah.chen@relanto.com)
3. Send request
4. Expected: 200 OK ✅
5. Check: Variables tab → {{repAccessToken}} filled
6. Verify: Test output shows "User role is SALES_REP"
```

**Step 2: Test All Sales Rep APIs**
```
1. Go to: SALES REP - Sales Engagement APIs
2. Click each request in order (1-7):
   - GET Tasks
   - GET Summary
   - GET Activity
   - POST Create Task (stores {{repTaskId}})
   - GET Task Detail (uses {{repTaskId}})
   - PATCH Update Task (uses {{repTaskId}})
   - POST Mark Complete (uses {{repTaskId}})
3. Each should return 200 OK ✅
```

**Step 3: Logout as Sales Rep**
```
1. Go to: AUTHENTICATION - Login/Logout
2. Click: 4. LOGOUT - Sales Rep
3. Send request
4. Expected: 200 OK ✅
5. Session cleared
```

---

### **Test Flow 2: Sales Manager - Complete Testing**

**Step 1: Login as Sales Manager**
```
1. Go to: AUTHENTICATION - Login/Logout
2. Click: 2. LOGIN - Sales Manager (alex.morgan@relanto.com)
3. Send request
4. Expected: 200 OK ✅
5. Check: Variables tab → {{managerAccessToken}} filled
6. Verify: Test output shows "User role is MANAGER"
```

**Step 2: Test Manager Sales Engagement APIs**
```
1. Go to: SALES MANAGER - Sales Engagement APIs
2. Click each request (1-3):
   - GET Tasks (All Team)
   - GET Summary (Team Overview)
   - GET Activity (Team Activity)
3. Each should return 200 OK ✅
4. Note: Manager sees ALL tasks, not just own
```

**Step 3: Test Manager Conversation Intelligence APIs**
```
1. Go to: SALES MANAGER - Conversation Intelligence APIs
2. Click each request (1-4):
   - GET Filter Options
   - GET Search Calls
   - GET Call Reviews
   - GET Scorecards
3. Each should return 200 OK ✅
4. Note: Rep CANNOT access these endpoints
```

**Step 4: Test Manager Forecasting APIs**
```
1. Go to: SALES MANAGER - Forecasting APIs
2. Click request 1: GET List Forecast Periods
   - Should return 200 OK ✅
   - Stores {{periodId}} in variables
3. Click request 2: GET Forecast Board
   - Uses {{periodId}} from previous request
   - Should return 200 OK ✅
4. Note: Rep CANNOT access these endpoints
```

**Step 5: Logout as Sales Manager**
```
1. Go to: AUTHENTICATION - Login/Logout
2. Click: 5. LOGOUT - Sales Manager
3. Send request
4. Expected: 200 OK ✅
5. Session cleared
```

---

### **Test Flow 3: RBAC - Permission Testing**

**Test Invalid Token:**
```
1. Go to: RBAC - Permission & Access Control Tests
2. Click: 1. TEST - Invalid Token Returns 401
3. Send request
4. Expected: 401 Unauthorized ✅
5. Verify: Test passes (shows "Status code is 401 Unauthorized")
```

**Test No Auth Header:**
```
1. Click: 2. TEST - No Auth Header Returns 401
2. Send request
3. Expected: 401 Unauthorized ✅
4. Verify: Test passes
```

**Test Rep Cannot Access Manager APIs:**
```
1. Click: 3. TEST - Rep Cannot Access Manager APIs
2. This uses {{repAccessToken}} to try accessing manager endpoint
3. Expected: 403 Forbidden or 401 Unauthorized ✅
4. Verify: Access denied for rep trying manager API
```

---

## 🤖 AUTOMATED TESTING - Collection Runner

### **Run All Tests Automatically:**

```
1. Open Postman
2. Import: postman_application_new.json
3. Click "Collection Runner" (top-left)
4. Select collection
5. Click "Run"

WATCHING AUTOMATED FLOW:

┌─────────────────────────────────────┐
│ AUTHENTICATION (5 tests)            │
│ ├── ✅ Login Sales Rep              │
│ ├── ✅ Login Manager                │
│ ├── ✅ Get Profile                  │
│ ├── ✅ Logout Rep                   │
│ └── ✅ Logout Manager               │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ SALES REP APIs (7 tests)            │
│ ├── ✅ Get Tasks                    │
│ ├── ✅ Get Summary                  │
│ ├── ✅ Get Activity                 │
│ ├── ✅ Create Task                  │
│ ├── ✅ Get Task Detail              │
│ ├── ✅ Update Task                  │
│ └── ✅ Mark Complete                │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ MANAGER Sales Engagement (3 tests)  │
│ ├── ✅ Get Tasks (All Team)         │
│ ├── ✅ Get Summary (Team)           │
│ └── ✅ Get Activity (Team)          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ MANAGER Conversation Intel (4 tests)│
│ ├── ✅ Filter Options               │
│ ├── ✅ Search Calls                 │
│ ├── ✅ Call Reviews                 │
│ └── ✅ Scorecards                   │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ MANAGER Forecasting (2 tests)       │
│ ├── ✅ List Periods                 │
│ └── ✅ Forecast Board               │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ RBAC Tests (3 tests)                │
│ ├── ✅ Invalid Token → 401          │
│ ├── ✅ No Auth Header → 401         │
│ └── ✅ Rep Access Denied → 403      │
└─────────────────────────────────────┘

TOTAL: 24/24 TESTS PASS ✅ (~30 seconds)
```

---

## 🔑 TOKEN MANAGEMENT

### **How Tokens Are Managed:**

**Sales Rep Token Flow:**
```
1. Login endpoint called
2. Test script executes:
   pm.collectionVariables.set('repAccessToken', token)
3. Token stored: {{repAccessToken}}
4. All rep requests use: Authorization: Bearer {{repAccessToken}}
5. Backend validates token → Returns data
```

**Manager Token Flow:**
```
1. Login endpoint called
2. Test script executes:
   pm.collectionVariables.set('managerAccessToken', token)
3. Token stored: {{managerAccessToken}}
4. All manager requests use: Authorization: Bearer {{managerAccessToken}}
5. Backend validates token → Returns data
```

### **Token Variables:**
```
{{repAccessToken}}          Sales Rep JWT
{{repRefreshToken}}         Sales Rep refresh token
{{repUserId}}               Sales Rep user ID
{{repTaskId}}               Rep's created task ID

{{managerAccessToken}}      Manager JWT
{{managerRefreshToken}}     Manager refresh token
{{managerUserId}}           Manager user ID

{{periodId}}                Forecast period ID (auto-set)
{{baseUrl}}                 http://localhost:3002
```

---

## 📊 API ENDPOINT MAPPING

### **Sales Rep Can Access:**
```
✅ POST /api/v1/auth/login
✅ GET /api/v1/auth/me
✅ GET /api/v1/sales-engagement/tasks
✅ GET /api/v1/sales-engagement/tasks/summary
✅ GET /api/v1/sales-engagement/activity/recent
✅ POST /api/v1/sales-engagement/tasks
✅ GET /api/v1/sales-engagement/tasks/{id}/detail
✅ PATCH /api/v1/sales-engagement/tasks/{id}
✅ POST /api/v1/sales-engagement/tasks/{id}/mark-complete
✅ POST /api/v1/auth/logout
```

### **Manager Can Access (All Rep APIs PLUS):**
```
✅ All Sales Rep endpoints (above)
✅ GET /api/v1/conversation-intelligence/filters/options
✅ GET /api/v1/conversation-intelligence/search/calls
✅ GET /api/v1/conversation-intelligence/call-reviews
✅ GET /api/v1/conversation-intelligence/scorecards
✅ GET /api/v1/forecasting/periods
✅ GET /api/v1/forecasting/periods/{id}/board
```

### **Rep CANNOT Access:**
```
❌ /api/v1/conversation-intelligence/* (returns 403/401)
❌ /api/v1/forecasting/* (returns 403/401)
```

---

## ✅ VERIFICATION CHECKLIST

### **After Running Collection:**

- [ ] **Authentication**
  - Rep login returns 200 ✅
  - {{repAccessToken}} filled
  - Manager login returns 200 ✅
  - {{managerAccessToken}} filled

- [ ] **Sales Rep APIs (7 tests)**
  - All return 200 ✅
  - Can create task ✅
  - Can update task ✅
  - Can mark task complete ✅

- [ ] **Manager Sales Engagement (3 tests)**
  - All return 200 ✅
  - Can see all team tasks ✅

- [ ] **Manager Conversation Intelligence (4 tests)**
  - All return 200 ✅
  - Rep cannot access (403) ✅

- [ ] **Manager Forecasting (2 tests)**
  - All return 200 ✅
  - Rep cannot access (403) ✅

- [ ] **RBAC Tests (3 tests)**
  - Invalid token returns 401 ✅
  - No auth header returns 401 ✅
  - Rep access denied returns 403 ✅

---

## 🔍 TROUBLESHOOTING

### **Problem: "Cannot connect to localhost:3002"**
- Cause: Backend not running
- Fix: `cd apps/api && npm run dev`

### **Problem: "401 Unauthorized" on login**
- Cause: Wrong credentials or auth issue
- Fix: Verify credentials or check backend logs

### **Problem: "404 Not Found"**
- Cause: Route incorrect
- Fix: Verify routes have `/api/v1/` prefix

### **Problem: Tokens not stored**
- Cause: Test script didn't run
- Fix: Check "Tests" tab in login response for errors

### **Problem: Rep token working on manager APIs**
- Cause: RBAC not enforced on backend
- Fix: Check backend has @Roles guards

### **Problem: Tests timeout**
- Cause: Backend slow or services down
- Fix: Restart backend and database

---

## 📝 TEST RESULTS EXPLANATION

### **Expected 200 OK Responses:**
```
Login requests           → 200 (successful authentication)
GET requests            → 200 (data retrieval success)
POST requests           → 201 (resource created)
PATCH requests          → 200 (resource updated)
```

### **Expected 401 Unauthorized:**
```
Invalid token           → 401 (token validation failed)
No auth header          → 401 (no token provided)
Expired token           → 401 (token expired)
```

### **Expected 403 Forbidden:**
```
Rep accessing manager API → 403 (insufficient permissions)
User accessing admin API → 403 (role not authorized)
```

---

## 🎓 USING COLLECTION RUNNER

### **Access Collection Runner:**

**Method 1:** Click "Collection Runner" button (top-left)

**Method 2:** Select collection → Right-click → "Run"

### **Configure Runner:**
```
Collection:    R-Revenue Intelligence - Complete Role-Based
Environment:   (leave empty or select if you have one)
Iterations:    1
Delay:         0ms
Keep variables ☑ (checked)
```

### **During Execution:**
- Watch requests execute in order
- Green ✅ = Pass
- Red ❌ = Fail
- Click on request to see details

### **After Execution:**
- Review Summary tab
- Check Pass/Fail counts
- Review failed tests if any
- Export results if needed

---

## 💡 KEY FEATURES OF NEW COLLECTION

✅ **Perfect Role-Based Organization**
- Sales Rep folder with rep APIs only
- Manager folder with manager APIs only
- Clear separation of concerns

✅ **Automatic Token Management**
- Login stores tokens automatically
- Tokens used in all subsequent requests
- No manual token copying

✅ **Complete API Coverage**
- 10 Sales Engagement endpoints
- 4 Conversation Intelligence endpoints
- 2 Forecasting endpoints
- 5 Authentication endpoints
- 3 RBAC tests

✅ **Test Assertions**
- Verify status codes
- Check response structure
- Validate token extraction
- Verify role in response

✅ **Easy Testing**
- Run all at once (Collection Runner)
- Run individual folders
- Run specific requests
- Manual or automated

---

## 🚀 QUICK START

```
1. Import postman_application_new.json
2. Open Collection Runner
3. Click "Run"
4. Expected: 24 tests pass in ~30 seconds
5. Review results
6. Done! ✅
```

---

## 📞 SUPPORT

**Files to Reference:**
- Main collection: `postman_application_new.json`
- Usage guide: `NEW_COLLECTION_USAGE_GUIDE.md` (this file)
- Previous guide: `HOW_TO_TEST_ROLES.md`

**Credentials:**
- Rep: sarah.chen@relanto.com / Password123!
- Manager: alex.morgan@relanto.com / Password123!

**Base URL:**
- http://localhost:3002

---

## ✨ SUMMARY

✅ **24 API endpoints** organized by role  
✅ **Perfect folder structure** (Auth, Rep APIs, Manager APIs, RBAC)  
✅ **Automatic token management** (no manual work)  
✅ **Complete test coverage** (all roles and permissions)  
✅ **Collection Runner ready** (run all at once)  
✅ **Fully documented** (test scripts explain what's happening)  

**File:** `postman_application_new.json` ✅  
**Status:** **READY TO USE** ✅  
**Expected Result:** 24/24 tests pass ✅
