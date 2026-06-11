# Quick Start: Testing with Postman in 5 Minutes

## The Flow (What Happens)

```
1. You Click "Send" on Login Request
                ↓
2. Postman sends credentials to: POST /api/v1/auth/login
                ↓
3. Backend returns JWT token in response
                ↓
4. Postman's test script extracts token
                ↓
5. Token is stored in Collection Variable (e.g., {{repAccessToken}})
                ↓
6. Next request automatically uses: Authorization: Bearer {{repAccessToken}}
                ↓
7. Backend verifies token and returns data
```

---

## Step-by-Step: Sales Rep Login & Test

### Step 1: Import Collection (First Time Only)
1. Open Postman
2. Click **Import**
3. Select: `postman_collection_updated.json`
4. Done! ✅

---

### Step 2: Login as Sales Rep

**Left Sidebar Path:**
```
Collections 
  → R-Revenue Intelligence Platform...
    → Authentication
      → 2. POST /auth/login - Sales Rep  ← CLICK HERE
```

**Request Body is already filled:**
```json
{
  "email": "sarah.chen@relanto.com",
  "password": "Password123!",
  "tenantSlug": "relanto"
}
```

**Action:**
1. Click the request name (see path above)
2. Click **"Send"** (blue button, top right)

**What You'll See:**
- Status: **200 OK** ✅
- Response body shows token:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "user": { "email": "sarah.chen@relanto.com", "role": "SALES_REP" }
    }
  }
  ```

**Tests Tab Shows:**
- ✅ Status code is 200
- ✅ Response has accessToken
- ✅ User role is SALES_REP

---

### Step 3: Verify Token is Stored

1. **Top of left sidebar**, find the collection name
2. Right-click → **Edit** OR click the collection name
3. Click **"Variables"** tab
4. Look for `repAccessToken` row
5. In the **"Current Value"** column, you should see a long JWT token (not empty!)

✅ **If you see the token, you're ready!**

---

### Step 4: Use Token in Protected Endpoint

**Left Sidebar Path:**
```
Collections
  → R-Revenue Intelligence Platform...
    → Sales Engagement (M08)
      → 1. GET /sales-engagement/tasks  ← CLICK HERE
```

**Notice the Request:**
- Headers section shows: `Authorization: Bearer {{repAccessToken}}`
- This automatically uses your stored token!

**Action:**
1. Click the request
2. Click **"Send"**

**What You'll See:**
- Status: **200 OK** ✅
- Response body shows tasks:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "task-123",
        "title": "Follow up with prospect",
        "status": "pending"
      }
    ]
  }
  ```

---

## Done! 🎉

You've successfully:
1. ✅ Logged in
2. ✅ Got a JWT token
3. ✅ Used the token in a protected endpoint
4. ✅ Got a response with data

---

## Test Other Endpoints (Same Process)

All requests in the collection use the same pattern:

```
1. If it's a login endpoint → Click Send → Token stored automatically
2. If it's a protected endpoint → Click Send → Uses stored token automatically
```

### Test As Manager

1. Go to: **Authentication → 1. POST /auth/login - Manager**
2. Click **Send**
3. Token stored in `{{accessToken}}`
4. Now use Manager-specific endpoints with this token

### Create and Update a Task

1. **Create:** Go to **Sales Engagement → 4. POST /sales-engagement/tasks**
   - Click Send
   - New task created, ID stored in `{{taskId}}`

2. **Update:** Go to **Sales Engagement → 6. PATCH /sales-engagement/tasks/{id}**
   - Click Send
   - Task gets updated (uses `{{taskId}}` automatically)

3. **Mark Complete:** Go to **Sales Engagement → 7. POST .../mark-complete**
   - Click Send
   - Task marked as complete

---

## Troubleshooting

### Problem: "Authorization invalid" or 401 Error
**Solution:**
1. Go to collection → Variables tab
2. Check if your token variable has a value (not empty)
3. If empty, run the login request again
4. Try the protected endpoint again

### Problem: Can't find the request
**Solution:**
1. Click the **collection name** in left sidebar
2. It should expand showing folders
3. Look for the folder (Authentication, Sales Engagement, etc.)
4. Click the request name inside

### Problem: Getting 404 Not Found
**Solution:**
1. Make sure backend API is running: `pnpm --filter api run start`
2. Check `baseUrl` in Variables is: `http://localhost:3002`
3. Try login again

### Problem: Tests show red ❌
**Solution:**
1. Click **Tests** tab after sending
2. Look for which test failed
3. Check Response tab to see error message
4. Most likely cause: Token expired or invalid

---

## Super Quick Reference

| Want To... | Find This Request | Token Variable |
|-----------|------------------|-----------------|
| Login as Manager | Auth → Login - Manager | `{{accessToken}}` |
| Login as Sales Rep | Auth → Login - Sales Rep | `{{repAccessToken}}` |
| List Tasks | Sales Engagement → List Tasks | `{{repAccessToken}}` |
| Create Task | Sales Engagement → Create Task | `{{repAccessToken}}` |
| Update Task | Sales Engagement → Update Task | `{{repAccessToken}}` |
| Get Profile | Auth → Get Current User | `{{accessToken}}` |
| Search Calls | Conversation Intelligence → Search | `{{accessToken}}` |

---

## Key Takeaway

**You don't need to manually copy-paste tokens!**

The Postman collection automatically:
1. ✅ Extracts token from login response
2. ✅ Stores in collection variables
3. ✅ Uses token in next requests
4. ✅ All automatic via `{{variableName}}`

Just click **Send** on requests in the right order, and everything works! 🚀

---

## Complete Test Sequence (Copy-Paste This)

1. **Auth → Login - Sales Rep** → Send
2. **Sales Engagement → List Tasks** → Send
3. **Sales Engagement → Create Task** → Send
4. **Sales Engagement → Get Task Detail** → Send
5. **Sales Engagement → Update Task** → Send
6. **Sales Engagement → Mark Complete** → Send
7. **RBAC → Sales Rep Access** → Send

All tests should pass ✅ if backend is running!
