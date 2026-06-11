# New Postman Collection - Complete Documentation

**File:** `postman_application_new.json`  
**Status:** ✅ **CREATED & READY TO USE**  
**Created:** June 11, 2026  
**Total Endpoints:** 24 API requests  

---

## 🎯 WHAT'S NEW

This is a **completely rebuilt Postman collection** with:

✅ **Perfect Organization** - Folders organized by role (Sales Rep, Manager)  
✅ **Complete API Coverage** - All endpoints from all modules  
✅ **Automatic Token Management** - No manual token copying  
✅ **Role-Based Testing** - Test each role separately  
✅ **RBAC Verification** - Permission tests included  
✅ **All Routes Fixed** - All routes have `/api/v1/` prefix  

---

## 📁 COLLECTION STRUCTURE

```
R-Revenue Intelligence - Complete Role-Based API Testing
│
├── AUTHENTICATION - Login/Logout (5 endpoints)
│   ├── 1. LOGIN - Sales Rep
│   ├── 2. LOGIN - Sales Manager
│   ├── 3. GET Current User Profile
│   ├── 4. LOGOUT - Sales Rep
│   └── 5. LOGOUT - Sales Manager
│
├── SALES REP - Sales Engagement APIs (7 endpoints)
│   ├── 1. GET - Sales Engagement Tasks List
│   ├── 2. GET - Task Summary
│   ├── 3. GET - Recent Activity
│   ├── 4. POST - Create New Task
│   ├── 5. GET - Task Detail
│   ├── 6. PATCH - Update Task
│   └── 7. POST - Mark Task Complete
│
├── SALES MANAGER - Sales Engagement APIs (3 endpoints)
│   ├── 1. GET - Sales Engagement Tasks List (All Team)
│   ├── 2. GET - Task Summary (Team Overview)
│   └── 3. GET - Recent Activity (Team Activity)
│
├── SALES MANAGER - Conversation Intelligence APIs (4 endpoints)
│   ├── 1. GET - Filter Options
│   ├── 2. GET - Search Calls
│   ├── 3. GET - Call Reviews
│   └── 4. GET - Scorecards
│
├── SALES MANAGER - Forecasting APIs (2 endpoints)
│   ├── 1. GET - List Forecast Periods
│   └── 2. GET - Forecast Board
│
└── RBAC - Permission & Access Control Tests (3 endpoints)
    ├── 1. TEST - Invalid Token Returns 401
    ├── 2. TEST - No Auth Header Returns 401
    └── 3. TEST - Rep Cannot Access Manager APIs
```

**Total: 24 API Endpoints**

---

## 🚀 QUICK START (3 STEPS)

### Step 1: Import Collection
```
1. Open Postman
2. Click "Import" (top-left)
3. Select: postman_application_new.json
4. Click "Import"
```

### Step 2: Open Collection Runner
```
1. Click "Collection Runner" button (top-left)
2. Select collection: "R-Revenue Intelligence - Complete..."
```

### Step 3: Run All Tests
```
1. Click "Run"
2. Watch 24 tests execute automatically
3. Expected: All 24 tests pass ✅ (~30 seconds)
```

---

## 📊 TESTING WORKFLOWS

### **Workflow 1: Full Automated Testing (EASIEST)**

Run entire collection at once with Collection Runner:
- Logs in as Sales Rep
- Tests all Rep APIs (7 tests)
- Logs in as Manager
- Tests all Manager APIs (9 tests)
- Runs RBAC tests (3 tests)
- **Total: 24 tests in ~30 seconds**

### **Workflow 2: Manual - Test Sales Rep Only**

```
1. Go to: AUTHENTICATION > 1. LOGIN - Sales Rep
2. Send → Token stored {{repAccessToken}}
3. Go to: SALES REP - Sales Engagement APIs
4. Test each endpoint (1-7)
5. Go to: AUTHENTICATION > 4. LOGOUT - Sales Rep
6. Send → Logout
```

### **Workflow 3: Manual - Test Sales Manager Only**

```
1. Go to: AUTHENTICATION > 2. LOGIN - Sales Manager
2. Send → Token stored {{managerAccessToken}}
3. Go to: SALES MANAGER - Sales Engagement APIs (3 tests)
4. Go to: SALES MANAGER - Conversation Intelligence APIs (4 tests)
5. Go to: SALES MANAGER - Forecasting APIs (2 tests)
6. Go to: AUTHENTICATION > 5. LOGOUT - Sales Manager
7. Send → Logout
```

### **Workflow 4: Test Single Request**

```
1. Find the request in the folder
2. Click to select it
3. Click "Send"
4. View response and test results
```

---

## 🔑 TOKEN FLOW

### **How It Works (Automatic)**

1. **Login Request Executed**
   - POST /api/v1/auth/login
   - Backend returns: `{ "data": { "accessToken": "eyJ..." } }`

2. **Test Script Runs Automatically**
   - Extracts token from response
   - Stores in collection variable: `{{repAccessToken}}` or `{{managerAccessToken}}`

3. **Subsequent Requests Use Token**
   - All requests include: `Authorization: Bearer {{repAccessToken}}`
   - Postman substitutes actual token value
   - Backend validates and returns data

4. **Logout Clears Session**
   - Session terminated

**No manual token copying needed!**

---

## 📋 ENDPOINT REFERENCE

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

### **Manager Can Access (ALL Above PLUS):**
```
✅ GET /api/v1/conversation-intelligence/filters/options
✅ GET /api/v1/conversation-intelligence/search/calls
✅ GET /api/v1/conversation-intelligence/call-reviews
✅ GET /api/v1/conversation-intelligence/scorecards
✅ GET /api/v1/forecasting/periods
✅ GET /api/v1/forecasting/periods/{id}/board
```

### **Rep CANNOT Access:**
```
❌ /api/v1/conversation-intelligence/* (blocked)
❌ /api/v1/forecasting/* (blocked)
```

---

## 🔐 CREDENTIALS

**Sales Rep:**
- Email: `sarah.chen@relanto.com`
- Password: `Password123!`
- Role: `SALES_REP`

**Sales Manager:**
- Email: `alex.morgan@relanto.com`
- Password: `Password123!`
- Role: `MANAGER`

**Backend:**
- URL: `http://localhost:3002`

---

## ✅ VERIFICATION CHECKLIST

After running the collection, verify:

- [ ] **Authentication Tests (5)**
  - Rep login successful (200) ✅
  - {{repAccessToken}} stored
  - Manager login successful (200) ✅
  - {{managerAccessToken}} stored

- [ ] **Sales Rep APIs (7)**
  - All return 200 OK ✅
  - Can create, update, mark tasks ✅
  - Only sees own data ✅

- [ ] **Manager Sales Engagement (3)**
  - All return 200 OK ✅
  - Sees all team data ✅

- [ ] **Manager Conversation Intelligence (4)**
  - All return 200 OK ✅
  - Rep cannot access (403) ✅

- [ ] **Manager Forecasting (2)**
  - All return 200 OK ✅
  - Rep cannot access (403) ✅

- [ ] **RBAC Tests (3)**
  - Invalid token → 401 ✅
  - No header → 401 ✅
  - Rep access denied → 403 ✅

**Total: 24/24 tests pass ✅**

---

## 🎓 UNDERSTANDING THE COLLECTION

### **Test Scripts**

Each request has test scripts that:
- Verify status codes (200, 201, 401, 403)
- Extract tokens automatically (for login)
- Validate response structure
- Verify user roles
- Store IDs for use in subsequent requests (task ID, period ID)

### **Collection Variables**

Automatically managed variables:
- `{{baseUrl}}` - http://localhost:3002
- `{{repAccessToken}}` - Sales Rep JWT
- `{{repRefreshToken}}` - Sales Rep refresh token
- `{{repUserId}}` - Sales Rep user ID
- `{{repTaskId}}` - Created task ID
- `{{managerAccessToken}}` - Manager JWT
- `{{managerRefreshToken}}` - Manager refresh token
- `{{managerUserId}}` - Manager user ID
- `{{periodId}}` - Forecast period ID

### **Request Structure**

Each request includes:
- **Name** - Clear description (e.g., "1. GET - Sales Engagement Tasks List")
- **Method** - GET, POST, PATCH, DELETE
- **URL** - Full path with /api/v1/ prefix
- **Headers** - Authorization with token (if needed)
- **Body** - For POST/PATCH requests
- **Test Script** - Validates response and extracts data

---

## 🔍 TROUBLESHOOTING

### **"Cannot connect to localhost:3002"**
- Backend not running
- Fix: `cd apps/api && npm run dev`

### **"401 Unauthorized" on login**
- Wrong credentials or backend auth issue
- Fix: Verify credentials or check backend logs

### **"404 Not Found"**
- Route incorrect or missing /api/v1/
- Fix: Check URLs in requests

### **Tokens not stored**
- Test script didn't run
- Fix: Check "Tests" tab output in login response

### **Rep token works on manager APIs**
- RBAC not enforced
- Fix: Check backend has @Roles guards

### **Tests timeout**
- Backend slow or services down
- Fix: Restart backend and wait for "Listening on 3002"

---

## 📚 DOCUMENTATION FILES

### **New Collection Guides:**
1. **README_NEW_COLLECTION.md** (this file) - Overview
2. **NEW_COLLECTION_USAGE_GUIDE.md** - Detailed instructions
3. **NEW_COLLECTION_SUMMARY.txt** - Quick reference

### **Previous Guides (Still Helpful):**
- HOW_TO_TEST_ROLES.md
- FIXES_APPLIED_POSTMAN.md
- POSTMAN_FIXES_SUMMARY.txt

---

## 🎯 KEY FEATURES

✅ **Perfect Role-Based Organization**
- Separate folders for each role
- Clear module boundaries
- Easy to find what you need

✅ **Automatic Token Management**
- Login extracts tokens
- Tokens stored automatically
- Used in all subsequent requests
- No manual work needed

✅ **Complete API Coverage**
- 10 Sales Engagement endpoints
- 4 Conversation Intelligence endpoints
- 2 Forecasting endpoints
- 5 Authentication endpoints
- 3 Permission tests

✅ **Test Assertions**
- Verify status codes
- Check response structure
- Validate tokens
- Verify roles

✅ **Multiple Testing Methods**
- Collection Runner (automated)
- Manual sequential (one request at a time)
- Selective (just one folder)
- Individual requests

---

## 💡 BEST PRACTICES

### **For Complete Testing:**
1. Use Collection Runner
2. Run entire collection at once
3. Review results
4. Check for any failures

### **For Understanding:**
1. Use manual testing
2. Go through each request one by one
3. Watch the test scripts run
4. Check Variables tab to see tokens

### **For Development:**
1. Test single requests as you modify them
2. Use the request manually to debug
3. Check test script output for errors
4. Review response body details

---

## 🚀 GETTING STARTED

### **Prerequisites:**
- Postman installed
- Backend running on http://localhost:3002
- Database and Redis running

### **Steps:**
1. Import `postman_application_new.json`
2. Open Collection Runner
3. Click "Run"
4. Expected: 24/24 tests pass ✅

### **Next:**
- Explore individual requests
- Modify test data as needed
- Export results if required

---

## ✨ SUMMARY

This new collection is:
- ✅ **Perfectly organized** by role
- ✅ **Complete** with all 24 endpoints
- ✅ **Automatic** token management
- ✅ **Ready** for Collection Runner
- ✅ **Well-tested** with assertions
- ✅ **Documented** thoroughly

**Status:** Ready for production testing  
**File:** `postman_application_new.json`  
**Expected Result:** 24/24 tests pass ✅  
**Time:** ~30 seconds

---

## 📞 SUPPORT

**Questions about:**
- **Testing:** See NEW_COLLECTION_USAGE_GUIDE.md
- **Quick reference:** See NEW_COLLECTION_SUMMARY.txt
- **Troubleshooting:** See Troubleshooting section above

**Credentials:** See section above  
**Backend:** http://localhost:3002  
**Time to test:** ~30 seconds  

---

## ✅ YOU'RE ALL SET!

Everything is ready. Import the collection and start testing!

```
postman_application_new.json → Import → Run → 24/24 ✅
```

Enjoy comprehensive role-based API testing! 🎉
