# R-Revenue Intelligence Platform - Complete Testing Guide

## 🚀 Quick Start

### Prerequisites
- Backend API running on `http://localhost:3002`
- Frontend running on `http://localhost:3000`
- PostgreSQL running on port 5438
- Postman installed

---

## Part 1: Frontend Testing (Browser)

### Step 1: Access Login Page
1. Open browser: `http://localhost:3000/login`
2. You should see the R-Revenue login page with demo profiles

### Step 2: Login with Seeded Accounts

**Option A: Sales Manager**
- Email: `alex.morgan@relanto.com`
- Password: `Password123!`
- Click: Sign In

**Option B: Sales Representative**
- Email: `sarah.chen@relanto.com`
- Password: `Password123!`
- Click: Sign In

**Option C: Click Demo Profile Cards**
- On the right side, you'll see preset demo profiles
- Click on any profile to autofill credentials
- Click: Sign In

### Step 3: Verify Login Success ✅

After login, you should see:
- Redirect to `/engage` or `/revenue` (depends on role)
- Welcome message appears
- Navigation sidebar visible
- No error messages in console

**If login fails:**
- Check browser console (F12 → Console)
- Should see error message like "Invalid credentials" not "404"
- If you see "404", backend API is not running

### Step 4: Test Frontend Navigation

**As Sales Manager (alex.morgan@relanto.com):**
- Access `/revenue` - Revenue dashboards
- Access `/calls/search` - Call search
- Access `/calls/translator` - Call translator
- Access `/deal-drivers` - Deal drivers

**As Sales Rep (sarah.chen@relanto.com):**
- Access `/engage` - Sales engagement (tasks)
- Access `/training` - Training modules
- Access `/smart-call` - Smart call recordings

### Step 5: Test Core Features

**Sales Engagement (Engage Page):**
1. View tasks dashboard
2. Check tasks summary
3. Verify recent activity loads
4. Try to view task details
5. Try to create/edit tasks

**Expected:** All data loads without 404 or 500 errors

---

## Part 2: Backend API Testing (Postman)

### Setup Postman Collection

1. **Import the collection:**
   - Open Postman
   - Click: Import
   - Select: `r-revenue-intelligence-monorepo/docs/API-docs and collections/postman_application.json`

2. **Configure Environment Variables:**
   - Click: Environments (bottom left)
   - Create new environment: "Local Development"
   - Add these variables:

   ```
   baseUrl           = http://localhost:3002
   tenantSlug        = relanto
   adminEmail        = alex.morgan@relanto.com
   adminPassword     = Password123!
   tenantId          = relanto
   userId            = (leave empty, will be set by auth)
   accessToken       = (leave empty, will be set by auth)
   refreshToken      = (leave empty, will be set by auth)
   ```

3. **Select Environment:**
   - Click environment dropdown (top right)
   - Select: "Local Development"

---

## Part 3: API Testing Flow

### Test 1: Authentication Flow

#### 1a. POST /api/v1/auth/register (Optional)
```
POST http://localhost:3002/api/v1/auth/register
Content-Type: application/json

{
  "tenantName": "Relanto",
  "tenantSlug": "relanto",
  "name": "New User",
  "email": "newuser@relanto.com",
  "password": "Password123!",
  "role": "sales_rep"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "expiresIn": 600,
    "tokenType": "Bearer",
    "user": {
      "id": "...",
      "email": "newuser@relanto.com",
      "name": "New User",
      "role": "SALES_REP",
      "frontendRole": "sales_rep",
      "tenantId": "...",
      "permissions": [...]
    }
  }
}
```

#### 1b. POST /api/v1/auth/login ✅ (Main Test)
```
POST http://localhost:3002/api/v1/auth/login
Content-Type: application/json

{
  "email": "alex.morgan@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

**Expected:** 200 OK with JWT tokens

**Save these in Postman:**
- `pm.collectionVariables.set("accessToken", jsonData.data.accessToken);`
- `pm.collectionVariables.set("refreshToken", jsonData.data.refreshToken);`

#### 1c. GET /api/v1/auth/me
```
GET http://localhost:3002/api/v1/auth/me
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with current user profile

#### 1d. POST /api/v1/auth/logout
```
POST http://localhost:3002/api/v1/auth/logout
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected:** 200 OK (revokes refresh token)

---

### Test 2: Sales Engagement API

#### 2a. GET /api/v1/sales-engagement/tasks (Manager)
```
GET http://localhost:3002/api/v1/sales-engagement/tasks
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with array of tasks

#### 2b. GET /api/v1/sales-engagement/tasks/summary
```
GET http://localhost:3002/api/v1/sales-engagement/tasks/summary
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with task counts
```json
{
  "success": true,
  "data": {
    "totalTasks": 10,
    "completedTasks": 3,
    "pendingTasks": 7,
    "overdueTasks": 1
  }
}
```

#### 2c. GET /api/v1/sales-engagement/activity/recent
```
GET http://localhost:3002/api/v1/sales-engagement/activity/recent?limit=10
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with recent activities

#### 2d. POST /api/v1/sales-engagement/tasks (Create Task)
```
POST http://localhost:3002/api/v1/sales-engagement/tasks
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Follow up with client",
  "description": "Call the client to discuss proposal",
  "priority": "high",
  "dueDate": "2026-06-15",
  "assigneeId": "{{userId}}"
}
```

**Expected:** 201 Created with task ID

---

### Test 3: Conversation Intelligence (Calls)

#### 3a. GET /api/v1/conversation-intelligence/filters/options
```
GET http://localhost:3002/api/v1/conversation-intelligence/filters/options
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with filter options

#### 3b. GET /api/v1/conversation-intelligence/search/calls
```
GET http://localhost:3002/api/v1/conversation-intelligence/search/calls?tab=all
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with calls search results

#### 3c. GET /api/v1/conversation-intelligence/call-reviews
```
GET http://localhost:3002/api/v1/conversation-intelligence/call-reviews
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with call reviews

---

### Test 4: Forecasting API

#### 4a. GET /api/v1/forecasting/periods
```
GET http://localhost:3002/api/v1/forecasting/periods
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with forecast periods

#### 4b. GET /api/v1/forecasting/periods/{periodId}/board
```
GET http://localhost:3002/api/v1/forecasting/periods/{{periodId}}/board
Authorization: Bearer {{accessToken}}
```

**Expected:** 200 OK with forecast board data

---

### Test 5: RBAC & Permissions

#### 5a. Manager Access (Should succeed)
```
GET http://localhost:3002/api/v1/sales-engagement/tasks
Authorization: Bearer {{managerAccessToken}}
```

**Expected:** 200 OK

#### 5b. Sales Rep Access (May be limited)
```
GET http://localhost:3002/api/v1/sales-engagement/tasks
Authorization: Bearer {{repAccessToken}}
```

**Expected:** 200 OK (with filtered results based on permissions)

---

## Part 4: Complete End-to-End Test

### Flow: Login → View Engage Page → Create Task → Verify in Backend

1. **Login Frontend:**
   - Go to `http://localhost:3000/login`
   - Login as alex.morgan@relanto.com
   - Redirect to `/engage`

2. **Verify Engage Page Loads:**
   - Tasks list appears
   - Summary shows
   - Recent activity visible

3. **Test Backend API:**
   ```
   POST http://localhost:3002/api/v1/auth/login
   ```
   - Copy accessToken

4. **List Tasks:**
   ```
   GET http://localhost:3002/api/v1/sales-engagement/tasks
   Authorization: Bearer {{accessToken}}
   ```

5. **Create Task:**
   ```
   POST http://localhost:3002/api/v1/sales-engagement/tasks
   Authorization: Bearer {{accessToken}}
   Content-Type: application/json

   {
     "title": "Test Task",
     "description": "Created from Postman",
     "priority": "high",
     "dueDate": "2026-06-20"
   }
   ```

6. **Verify in Frontend:**
   - Refresh `/engage` page
   - New task should appear in the list

---

## Part 5: Troubleshooting

### Common Issues & Fixes

| Issue | Symptom | Solution |
|-------|---------|----------|
| Login 404 | "404 Not Found" | Backend API not running on 3002 |
| 401 Unauthorized | Missing auth header | Use `Authorization: Bearer {{accessToken}}` |
| Invalid credentials | Login fails | Check email/password (case-sensitive) |
| CORS error | Cross-origin request blocked | Check next.config rewrites |
| Token expired | 401 after time | Call `/api/v1/auth/refresh` with refreshToken |
| Database error | 500 error on API | Check PostgreSQL running on 5438 |
| Tasks not loading | Empty engage page | Check backend logs for errors |

### Debug Steps

1. **Check Backend Logs:**
   ```
   # Terminal where API is running
   # Look for any error messages
   ```

2. **Check Frontend Console:**
   - Open `http://localhost:3000`
   - Press F12 (Developer Tools)
   - Go to Console tab
   - Look for error messages

3. **Check Network Tab:**
   - In DevTools, click Network tab
   - Try to login
   - Look for failed requests
   - Click request to see response

4. **Test Backend Directly:**
   ```
   curl -X POST http://localhost:3002/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alex.morgan@relanto.com","password":"Password123!","tenantSlug":"relanto"}'
   ```

---

## Part 6: Test Checklist

### Authentication ✅
- [ ] Register new user
- [ ] Login with email/password
- [ ] Get profile (/me)
- [ ] Logout (revoke token)
- [ ] Token refresh (if implemented)
- [ ] Invalid credentials return 401
- [ ] Missing auth header returns 401

### Sales Engagement ✅
- [ ] List tasks
- [ ] Get task summary
- [ ] View recent activity
- [ ] Create task
- [ ] Update task
- [ ] Delete task
- [ ] Mark task complete

### Calls/Conversation Intelligence ✅
- [ ] Get filter options
- [ ] Search calls
- [ ] Get call details
- [ ] Get call reviews
- [ ] AI question answering

### RBAC & Permissions ✅
- [ ] Manager can access all endpoints
- [ ] Sales Rep can access limited endpoints
- [ ] Permissions enforced correctly
- [ ] Role-based content filtering works

### Frontend Screens ✅
- [ ] Login page loads
- [ ] Engage page loads (tasks)
- [ ] Revenue page loads (managers only)
- [ ] Call search page loads
- [ ] Navigation works
- [ ] Logout works

---

## Seeded Test Accounts

| Name | Email | Role | Password |
|------|-------|------|----------|
| Alex Morgan | alex.morgan@relanto.com | Manager | Password123! |
| Sarah Chen | sarah.chen@relanto.com | Sales Rep | Password123! |
| Michael Rodriguez | michael.rod@relanto.com | Sales Rep | Password123! |
| David Park | david.park@relanto.com | Sales Rep | Password123! |
| Sujeevan | sujeevan@relanto.com | Sales Rep | Password123! |

**Tenant:** relanto

---

## Quick Commands

### Start Backend
```bash
cd r-revenue-intelligence-monorepo
pnpm --filter api run start
```

### Start Frontend
```bash
cd r-revenue-intelligence-monorepo
pnpm --filter web run dev
```

### Test API with Curl
```bash
# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.morgan@relanto.com","password":"Password123!","tenantSlug":"relanto"}'

# Get tasks (replace TOKEN with actual token)
curl -X GET http://localhost:3002/api/v1/sales-engagement/tasks \
  -H "Authorization: Bearer TOKEN"
```

---

## Success Criteria

✅ **All tests pass when:**
1. Frontend login works without 404
2. Backend API returns proper JWT tokens
3. Engage page loads with real task data
4. Postman requests return 200-201 responses
5. RBAC permissions work (different roles see different data)
6. No error logs in backend or frontend console
7. Database queries execute successfully
8. Token refresh works
9. Logout revokes token

---

## Next Steps

If all tests pass:
1. Deploy to staging environment
2. Run automated integration tests
3. Load testing with multiple concurrent users
4. Security testing (SQL injection, XSS, etc.)
5. Production deployment

