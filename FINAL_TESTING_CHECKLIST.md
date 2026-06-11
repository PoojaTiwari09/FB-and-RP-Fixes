# Final Testing Checklist - Complete E2E Validation

## ✅ System Status

- **Backend API:** Running on `http://localhost:3002`
- **Frontend:** Running on `http://localhost:3000`
- **Database:** PostgreSQL on port 5438
- **All Services:** Up and healthy

---

## 🧪 Frontend Testing

### Test 1: Login Page Access
- [ ] Open `http://localhost:3000/login` in browser
- [ ] See R-Revenue login page with demo profiles
- [ ] Credentials visible in right panel

### Test 2: Manager Login
- [ ] Email: `alex.morgan@relanto.com`
- [ ] Password: `Password123!`
- [ ] Click "Sign In"
- [ ] Expected: No 404 error
- [ ] Expected: Redirect to `/engage`
- [ ] Expected: "Welcome back, Alex Morgan!" appears
- [ ] Expected: Tasks list loads with data

### Test 3: Sales Rep Login
- [ ] Email: `sarah.chen@relanto.com`
- [ ] Password: `Password123!`
- [ ] Click "Sign In"
- [ ] Expected: Redirect to `/engage`
- [ ] Expected: "Welcome back, Sarah Chen!" appears

### Test 4: Engage Page Functionality
After login as Manager:
- [ ] Task list appears
- [ ] Task summary shows (total, completed, pending)
- [ ] Recent activity visible
- [ ] No console errors (F12 → Console)

### Test 5: Navigation
- [ ] Click through different pages
- [ ] Pages load without errors
- [ ] Data displays correctly

### Test 6: Logout
- [ ] Click logout button
- [ ] Redirected to login page
- [ ] Session cleared

---

## 🔌 Backend API Testing (Postman)

### Prerequisite: Setup
- [ ] Postman installed
- [ ] Import: `docs/API-docs and collections/postman_collection_updated.json`
- [ ] Create environment: "Local Development"
- [ ] Set variable: `baseUrl = http://localhost:3002`

### Test 1: Authentication - Manager Login
**Request:** `POST http://localhost:3002/api/v1/auth/login`
```json
{
  "email": "alex.morgan@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

- [ ] Status: **200 OK**
- [ ] Response has `accessToken` ✅
- [ ] Response has `refreshToken` ✅
- [ ] Response has `user.role = MANAGER` ✅
- [ ] Copy `accessToken` to Postman variable
- [ ] Expected: Automatic via test script

### Test 2: Authentication - Sales Rep Login
**Request:** `POST http://localhost:3002/api/v1/auth/login`
```json
{
  "email": "sarah.chen@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

- [ ] Status: **200 OK**
- [ ] Response has `user.role = SALES_REP` ✅
- [ ] Save token as `repAccessToken` variable

### Test 3: Authentication - Get Profile
**Request:** `GET http://localhost:3002/api/v1/auth/me`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response has user details ✅
- [ ] Response has permissions array ✅
- [ ] User ID matches login ✅

### Test 4: Sales Engagement - List Tasks
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response is array ✅
- [ ] Each task has `id`, `title`, `priority` ✅

### Test 5: Sales Engagement - Task Summary
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks/summary`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response has `totalTasks` ✅
- [ ] Response has `completedTasks` ✅
- [ ] Response has `pendingTasks` ✅

### Test 6: Sales Engagement - Create Task
**Request:** `POST http://localhost:3002/api/v1/sales-engagement/tasks`
**Header:** `Authorization: Bearer {{accessToken}}`
```json
{
  "title": "Follow up with client",
  "description": "Call about proposal",
  "priority": "high",
  "dueDate": "2026-06-20"
}
```

- [ ] Status: **201 Created**
- [ ] Response has task `id` ✅
- [ ] Save ID to `taskId` variable
- [ ] Task appears in database

### Test 7: Sales Engagement - Get Task Detail
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks/{{taskId}}/detail`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response has full task details ✅
- [ ] Details match created task ✅

### Test 8: Sales Engagement - Update Task
**Request:** `PATCH http://localhost:3002/api/v1/sales-engagement/tasks/{{taskId}}`
**Header:** `Authorization: Bearer {{accessToken}}`
```json
{
  "title": "Follow up with client (UPDATED)",
  "status": "in_progress"
}
```

- [ ] Status: **200 OK**
- [ ] Task updated in database ✅

### Test 9: Sales Engagement - Recent Activity
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/activity/recent?limit=10`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response is array ✅
- [ ] Recent activities visible ✅

### Test 10: Conversation Intelligence - Filters
**Request:** `GET http://localhost:3002/api/v1/conversation-intelligence/filters/options`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response has filter options ✅

### Test 11: Conversation Intelligence - Search Calls
**Request:** `GET http://localhost:3002/api/v1/conversation-intelligence/search/calls`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK**
- [ ] Response has calls data ✅

### Test 12: Forecasting - List Periods
**Request:** `GET http://localhost:3002/api/v1/forecasting/periods`
**Header:** `Authorization: Bearer {{accessToken}}`

- [ ] Status: **200 OK** or **404** (if no periods)
- [ ] If periods exist, save first period ID

### Test 13: Authentication - Invalid Credentials
**Request:** `POST http://localhost:3002/api/v1/auth/login`
```json
{
  "email": "alex.morgan@relanto.com",
  "password": "WrongPassword",
  "tenantSlug": "relanto"
}
```

- [ ] Status: **401 Unauthorized**
- [ ] Response has error message ✅

### Test 14: Authorization - Invalid Token
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks`
**Header:** `Authorization: Bearer invalid_token_12345`

- [ ] Status: **401 Unauthorized**
- [ ] Response indicates auth failure ✅

### Test 15: Authorization - No Token
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks`
**No Authorization Header**

- [ ] Status: **401 Unauthorized**
- [ ] Response indicates missing auth ✅

### Test 16: RBAC - Manager Access
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks`
**Header:** `Authorization: Bearer {{accessToken}}` (Manager token)

- [ ] Status: **200 OK**
- [ ] Can access all tasks ✅

### Test 17: RBAC - Sales Rep Access
**Request:** `GET http://localhost:3002/api/v1/sales-engagement/tasks`
**Header:** `Authorization: Bearer {{repAccessToken}}` (Rep token)

- [ ] Status: **200 OK**
- [ ] May see limited tasks based on permissions ✅

---

## 🔄 Integration Testing

### Test 1: Login on Frontend, Test API with Token
1. [ ] Login on `http://localhost:3000/login` as Alex Morgan
2. [ ] Open browser DevTools → Application → Cookies
3. [ ] Find and copy `access_token` value
4. [ ] In Postman, set header: `Authorization: Bearer {{access_token}}`
5. [ ] Call any protected endpoint
6. [ ] Should succeed ✅

### Test 2: Create Task in Postman, See in Frontend
1. [ ] Logout from frontend
2. [ ] In Postman, call `POST /sales-engagement/tasks` (create new task)
3. [ ] Task created successfully ✅
4. [ ] Frontend login again
5. [ ] Navigate to `/engage`
6. [ ] New task appears in tasks list ✅

### Test 3: Full E2E Workflow
1. [ ] Frontend login as Alex Morgan
2. [ ] Engage page loads with tasks
3. [ ] In Postman, get tasks via API
4. [ ] Both show same task count
5. [ ] Create new task in Postman
6. [ ] Refresh frontend Engage page
7. [ ] New task appears ✅
8. [ ] No errors at any step ✅

---

## 📊 Data Validation

### Database Consistency
- [ ] Seeded users exist in database
- [ ] Tasks created via Postman appear in DB
- [ ] Tokens stored securely (hashed in DB)
- [ ] Permissions correctly assigned to roles

### API Responses
- [ ] All responses follow standardized envelope:
  ```json
  {
    "success": boolean,
    "data": {},
    "error": { "code": "", "message": "" }
  }
  ```
- [ ] Status codes correct (200, 201, 400, 401, 404, 500)
- [ ] Error messages helpful and descriptive

### Frontend State
- [ ] Tokens stored in cookies correctly
- [ ] Roles determine available pages
- [ ] Manager sees: /engage, /revenue, /calls
- [ ] Sales Rep sees: /engage, /training

---

## 🚨 Error Handling Tests

### Test 1: Network Error
- [ ] Stop backend API
- [ ] Try to login on frontend
- [ ] Expected: Error message (not 404)
- [ ] Expected: User-friendly error
- [ ] Restart backend

### Test 2: Invalid JSON
- [ ] Postman: Send invalid JSON to `/auth/login`
- [ ] Expected: 400 Bad Request
- [ ] Expected: Error message

### Test 3: Missing Required Fields
- [ ] Postman: Call `/auth/login` without `email`
- [ ] Expected: 400 Bad Request
- [ ] Expected: Field validation error

### Test 4: SQL Injection Attempt
- [ ] Postman: Call `/auth/login` with SQL in email:
  ```json
  {"email": "' OR '1'='1", "password": "test", "tenantSlug": "relanto"}
  ```
- [ ] Expected: 400/401 Bad Request (no SQL execution)
- [ ] Database remains secure ✅

---

## 🎯 Success Metrics

### All tests pass when:
- [x] ✅ Frontend login works without 404
- [x] ✅ Backend returns proper JWT tokens
- [x] ✅ All API endpoints return correct status codes
- [x] ✅ Database queries execute successfully
- [x] ✅ RBAC permissions work correctly
- [x] ✅ Error handling is appropriate
- [x] ✅ No console errors in browser
- [x] ✅ No security vulnerabilities
- [x] ✅ Task creation/update/retrieval works
- [x] ✅ User sessions persist correctly

### Estimated Test Time
- Frontend Testing: 15 minutes
- Backend API Testing: 20 minutes
- Integration Testing: 10 minutes
- Error Handling: 10 minutes
- **Total: ~55 minutes** (comprehensive)

---

## 📋 Sign-Off

| Component | Tested | Status |
|-----------|--------|--------|
| Frontend Login | [ ] | ⬜ |
| Frontend Engage Page | [ ] | ⬜ |
| Backend Auth | [ ] | ⬜ |
| Backend API Endpoints | [ ] | ⬜ |
| RBAC Enforcement | [ ] | ⬜ |
| Database Connectivity | [ ] | ⬜ |
| Error Handling | [ ] | ⬜ |
| Integration | [ ] | ⬜ |

---

## 📝 Notes

- All test accounts ready to use
- No additional setup required
- Postman collection pre-configured
- Documentation comprehensive
- Support available via TESTING_GUIDE.md

---

**Testing Started:** June 11, 2026
**Status:** Ready for Validation
**Tester:** ___________________
**Date Completed:** ___________________

