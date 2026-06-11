# Postman Testing Guide - Complete JWT Authentication Flow

## Overview
This guide walks you through testing the API with JWT authentication. Tokens obtained from login are automatically stored and reused in subsequent API calls.

---

## Prerequisites
- Postman installed
- Backend API running on `http://localhost:3002`
- Collection imported: `postman_collection_updated.json`

---

## Step 1: Import the Collection

1. Open **Postman**
2. Click **Import** (top left)
3. Select the file: `postman_collection_updated.json`
4. Collection will appear in left sidebar under "Collections"

### Verify Collection Variables
1. Click the collection name: **"R-Revenue Intelligence Platform - Complete API Testing"**
2. Click the **"Variables"** tab
3. You should see:
   - `baseUrl` = `http://localhost:3002`
   - `accessToken` = (empty - will be filled after login)
   - `repAccessToken` = (empty - will be filled after login)
   - Other variables for token storage

---

## Step 2: Login as Sales Rep (Sarah Chen)

### What Happens:
- You send credentials to `/api/v1/auth/login`
- Backend returns `accessToken` and `refreshToken`
- The test script automatically saves `accessToken` as a collection variable
- This token is then used for all subsequent API calls

### How to Do It:

1. **Navigate to the request:**
   - Left sidebar → Expand "Authentication" folder
   - Click "**2. POST /auth/login - Sales Rep**"

2. **View the request body:**
   ```json
   {
     "email": "sarah.chen@relanto.com",
     "password": "Password123!",
     "tenantSlug": "relanto"
   }
   ```

3. **Click "Send"** (blue button, top right)

4. **Response should look like:**
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "expiresIn": 600,
       "tokenType": "Bearer",
       "user": {
         "id": "33333333-3333-3333-3333-333333333333",
         "email": "sarah.chen@relanto.com",
         "name": "Sarah Chen",
         "role": "SALES_REP",
         "frontendRole": "sales_rep",
         "tenantId": "11111111-1111-1111-1111-111111111111",
         "permissions": ["task.view"]
       }
     }
   }
   ```

5. **Check the Tests tab:**
   - After sending, click the **"Tests"** tab to see test results
   - You should see: ✅ "Status code is 200"
   - ✅ "Response has accessToken"
   - ✅ "User role is SALES_REP"

6. **Token is now stored!**
   - The test script automatically ran and saved the token
   - You can verify this by clicking the collection name and going to **Variables** tab
   - You should see `repAccessToken` is now filled with your JWT

---

## Step 3: Use the Token in Protected Endpoints

Now that you have the token, you can use it in any protected endpoint.

### Example: Get Task List

1. **Navigate to request:**
   - Left sidebar → Expand "Sales Engagement (M08)" folder
   - Click "**1. GET /sales-engagement/tasks - List Tasks**"

2. **View the Authorization header:**
   - The request already has: `Authorization: Bearer {{repAccessToken}}`
   - This uses the token you got from login

3. **Click "Send"**

4. **What happens:**
   - Postman replaces `{{repAccessToken}}` with your actual token
   - Backend verifies the token
   - Backend returns tasks for the logged-in user

5. **Response:**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "task-123",
         "title": "Follow up with prospect",
         "status": "pending",
         "priority": "high",
         "dueDate": "2026-06-20"
       }
     ]
   }
   ```

---

## Step 4: Complete Testing Workflow

Follow this order for full testing:

### Phase 1: Authentication ✅
1. ✅ **Login as Manager** (alex.morgan@relanto.com)
   - Request: "1. POST /auth/login - Manager"
   - Stores: `accessToken` and `refreshToken`
   
2. ✅ **Login as Sales Rep** (sarah.chen@relanto.com)
   - Request: "2. POST /auth/login - Sales Rep"
   - Stores: `repAccessToken` and `repUserId`

3. ✅ **Get Current User Profile**
   - Request: "4. GET /auth/me - Get Current User"
   - Uses: `Authorization: Bearer {{accessToken}}` (Manager token)
   - Verify you get Manager profile

### Phase 2: Sales Engagement (Using Sales Rep Token) ✅
1. ✅ **List Tasks**
   - Request: "1. GET /sales-engagement/tasks - List Tasks"
   - Uses: `{{repAccessToken}}`

2. ✅ **Get Task Summary**
   - Request: "2. GET /sales-engagement/tasks/summary - Task Summary"
   - Uses: `{{repAccessToken}}`

3. ✅ **Create New Task**
   - Request: "4. POST /sales-engagement/tasks - Create Task"
   - Uses: `{{repAccessToken}}`
   - Stores the created task ID in `taskId` variable

4. ✅ **Get Task Detail**
   - Request: "5. GET /sales-engagement/tasks/{id} - Get Task Detail"
   - Uses: `taskId` variable (auto-populated from create)
   - Uses: `{{repAccessToken}}`

5. ✅ **Update Task**
   - Request: "6. PATCH /sales-engagement/tasks/{id} - Update Task"
   - Uses: `taskId` and `repAccessToken`

### Phase 3: Conversation Intelligence ✅
1. ✅ **Get Filter Options**
   - Request: "1. GET /conversation-intelligence/filters/options"
   - Uses: `{{accessToken}}` (Manager)

2. ✅ **Search Calls**
   - Request: "2. GET /conversation-intelligence/search/calls"
   - Uses: `{{accessToken}}`

### Phase 4: RBAC Testing ✅
1. ✅ **Manager Access - Sales Engagement**
   - Request: "1. Manager Access - Sales Engagement"
   - Uses: `{{accessToken}}` (Manager token)
   - Should succeed

2. ✅ **Sales Rep Access - Sales Engagement**
   - Request: "2. Sales Rep Access - Sales Engagement"
   - Uses: `{{repAccessToken}}` (Sales Rep token)
   - Should succeed

3. ✅ **Invalid Token - Should Fail**
   - Request: "3. Invalid Token - Should Fail"
   - Uses: `Bearer invalid_token_12345`
   - Should return 401 Unauthorized

---

## Understanding Token Storage

### How Variables Work in Postman

1. **Collection Variables** (what we use):
   - Stored at collection level
   - Available to all requests in the collection
   - Persist between requests
   - Can be set manually or by test scripts

2. **Setting Variables in Test Scripts:**
   ```javascript
   // Extract token from response and save it
   pm.collectionVariables.set('repAccessToken', jsonData.data.accessToken);
   ```

3. **Using Variables in Requests:**
   ```
   Authorization: Bearer {{repAccessToken}}
   ```

### Viewing/Editing Variables

1. Click collection name
2. Go to **Variables** tab
3. See all current values
4. Edit manually if needed (click the value)

---

## Common Token Issues & Solutions

### Issue 1: Token Expired
**Problem:** Getting 401 Unauthorized after some time
**Solution:** 
- Run the login request again to get a fresh token
- Tokens expire in 600 seconds (10 minutes) by default

### Issue 2: Wrong Token for Role
**Problem:** Using `{{accessToken}}` (Manager) when testing Sales Rep endpoints
**Solution:**
- Use the correct token variable:
  - Manager requests: `{{accessToken}}`
  - Sales Rep requests: `{{repAccessToken}}`

### Issue 3: Token Not Showing in Variables
**Problem:** Variable shows empty after login
**Solution:**
1. Go to collection **Variables** tab
2. Look at "Current Value" (not "Initial Value")
3. If still empty, check the test script ran (look at Tests tab)
4. Try login again

### Issue 4: "No Auth Header" Error
**Problem:** 401 Unauthorized on protected endpoint
**Solution:**
1. Check the request has Authorization header
2. Verify it says: `Bearer {{tokenVariableName}}`
3. Check the variable is filled (go to Variables tab)
4. If variable is empty, run login first

---

## Example: Complete Testing Sequence

Follow this exact sequence to test everything:

```
Step 1: LOGIN AS SALES REP
├─ Request: "2. POST /auth/login - Sales Rep"
├─ Send
└─ ✅ Token stored in {{repAccessToken}}

Step 2: LIST TASKS
├─ Request: "1. GET /sales-engagement/tasks - List Tasks"
├─ Uses: {{repAccessToken}} (auto)
├─ Send
└─ ✅ See list of tasks

Step 3: CREATE NEW TASK
├─ Request: "4. POST /sales-engagement/tasks - Create Task"
├─ Uses: {{repAccessToken}} (auto)
├─ Send
└─ ✅ Task created, ID stored in {{taskId}}

Step 4: GET TASK DETAIL
├─ Request: "5. GET /sales-engagement/tasks/{id} - Get Task Detail"
├─ Uses: {{taskId}} and {{repAccessToken}} (auto)
├─ Send
└─ ✅ See detailed task info

Step 5: UPDATE TASK
├─ Request: "6. PATCH /sales-engagement/tasks/{id} - Update Task"
├─ Uses: {{taskId}} and {{repAccessToken}} (auto)
├─ Send
└─ ✅ Task updated

Step 6: MARK COMPLETE
├─ Request: "7. POST /sales-engagement/tasks/{id}/mark-complete"
├─ Uses: {{taskId}} and {{repAccessToken}} (auto)
├─ Send
└─ ✅ Task marked complete
```

---

## Viewing Response Details in Postman

### After clicking "Send":

1. **Status Code** (top right)
   - ✅ 200 = Success
   - ❌ 401 = Unauthorized (need valid token)
   - ❌ 403 = Forbidden (don't have permission)
   - ❌ 404 = Not Found

2. **Tabs**:
   - **Body** = Response JSON data
   - **Headers** = Response headers (includes Content-Type, etc.)
   - **Tests** = Test script results (✅ or ❌)

3. **Response Body**:
   - `"success": true` = API call succeeded
   - `"success": false` = API call failed (check error message)
   - `"data"` = Actual response payload

---

## Test Different User Roles

### Testing as Manager (alex.morgan@relanto.com)

1. **Run login:**
   - Request: "1. POST /auth/login - Manager"
   - Stores token in: `{{accessToken}}`

2. **Use in endpoints:**
   - Use any request with `Authorization: Bearer {{accessToken}}`
   - Manager has permissions: `report.view`, `task.assign`, `user.invite`

### Testing as Sales Rep (sarah.chen@relanto.com)

1. **Run login:**
   - Request: "2. POST /auth/login - Sales Rep"
   - Stores token in: `{{repAccessToken}}`

2. **Use in endpoints:**
   - Use any request with `Authorization: Bearer {{repAccessToken}}`
   - Sales Rep has permissions: `task.view` only

### Compare Permissions

| Permission | Manager | Sales Rep |
|-----------|---------|-----------|
| task.view | ✅ | ✅ |
| task.assign | ✅ | ❌ |
| report.view | ✅ | ❌ |
| user.invite | ✅ | ❌ |

---

## Testing Error Scenarios

### Test 1: No Authorization Header
1. Request: "4. No Auth Header - Should Fail"
2. Send
3. Should return **401 Unauthorized**
4. Response: `{"success": false, "error": "Unauthorized"}`

### Test 2: Invalid Token
1. Request: "3. Invalid Token - Should Fail"
2. Send
3. Should return **401 Unauthorized**
4. Response indicates token is invalid

### Test 3: Token Expired
1. Wait 10+ minutes after login (tokens expire in 600 seconds)
2. Try to use the old token
3. Should return **401 Unauthorized**
4. Solution: Run login again to get fresh token

---

## Debugging Tips

### If tests fail, check:

1. **Status Code**
   - Is it 200/201 (success) or 401/403/404 (error)?

2. **Response Body**
   - Click "Body" tab
   - Look for error message in `"error"` field

3. **Test Script Output**
   - Click "Tests" tab
   - See which tests passed ✅ and which failed ❌

4. **Variables**
   - Click collection name → Variables tab
   - Check if token is actually stored
   - Check `baseUrl` is `http://localhost:3002`

5. **Backend Status**
   - Make sure API is running: `pnpm --filter api run start`
   - Check terminal for errors

6. **Request Headers**
   - Click request name to expand
   - Verify Authorization header is present
   - Verify it says: `Bearer {{tokenVariableName}}`

---

## Quick Reference: All Seeded Users

| Name | Email | Password | Role | Use Token Variable |
|------|-------|----------|------|-------------------|
| Alex Morgan | alex.morgan@relanto.com | Password123! | MANAGER | `{{accessToken}}` |
| Sarah Chen | sarah.chen@relanto.com | Password123! | SALES_REP | `{{repAccessToken}}` |
| Michael Rodriguez | michael.rod@relanto.com | Password123! | SALES_REP | Create new login |
| David Park | david.park@relanto.com | Password123! | SALES_REP | Create new login |
| Sujeevan | sujeevan@relanto.com | Password123! | SALES_REP | Create new login |

---

## Summary

✅ **Key Points:**
1. Always run **Login** first to get token
2. Login test script **automatically stores token** in collection variables
3. All subsequent requests **automatically use the token** via `{{tokenVariableName}}`
4. Different roles use **different token variables** (Manager vs Sales Rep)
5. Tokens expire in **600 seconds** - login again if you get 401 errors
6. Check **Variables tab** to see stored tokens
7. Check **Tests tab** after each request to see if it passed

🚀 **You're ready to test!** Follow the sequences above and everything should work perfectly.
