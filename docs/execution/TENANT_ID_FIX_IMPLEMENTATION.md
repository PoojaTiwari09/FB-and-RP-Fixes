# Tenant ID Fix - Implementation Guide

**Status:** Ready for Implementation  
**Total Fixes Required:** 41 locations  
**Estimated Time:** 30-45 minutes  
**Priority:** 🔴 **CRITICAL**

---

## 🔍 HOW TO IDENTIFY ISSUES

### Using VS Code Find/Replace

1. **Open Find/Replace:** `Ctrl+H` (Windows/Linux) or `Cmd+Option+H` (Mac)

2. **Search Pattern:**
   ```
   where:\s*{\s*tenantId
   ```

3. **Replace Pattern:**
   ```
   where: { tenantid
   ```

4. **Scope:** Search in files matching:
   - `**/*service.ts`
   - `**/*repository.ts`
   - `**/*controller.ts` (test files)

5. **Review Each Match** before replacing

### Using Command Line (ripgrep)

```bash
rg "tenantId" --glob="*.ts" apps/api/src/modules/

# Shows all occurrences with line numbers
```

---

## 📋 PRIORITY 1 - CRITICAL FIXES (6 files, 25 locations)

### File 1: M02-Frontend-Call-Reviews Service

**Path:** `apps/api/src/modules/m02-conversation-intelligence/services/m02-frontend-call-reviews.service.ts`

**Locations:** 4

```typescript
// ❌ Line 52 - BEFORE
callReview.count({ where: { tenantId } })

// ✅ Line 52 - AFTER
callReview.count({ where: { tenantid } })

// ❌ Line 58 - BEFORE
user.findMany({ where: { tenantId } })

// ✅ Line 58 - AFTER
user.findMany({ where: { tenantid } })

// ❌ Line 63 - BEFORE
callRecord.findMany({ where: { tenantId } })

// ✅ Line 63 - AFTER
callRecord.findMany({ where: { tenantid } })

// ❌ Line 227 - BEFORE
user.findMany({ where: { tenantId } })

// ✅ Line 227 - AFTER
user.findMany({ where: { tenantid } })
```

---

### File 2: M02-Frontend-Trackers Service

**Path:** `apps/api/src/modules/m02-conversation-intelligence/services/m02-frontend-trackers.service.ts`

**Locations:** 3

```typescript
// ❌ Line 58 - BEFORE
where: { tenantId, transcriptStatus }

// ✅ Line 58 - AFTER
where: { tenantid, transcriptStatus }

// ❌ Line 81 - BEFORE
where: { tenantId, slug }

// ✅ Line 81 - AFTER
where: { tenantid, slug }

// ❌ Line 89 - BEFORE
where: { tenantId, transcriptStatus }

// ✅ Line 89 - AFTER
where: { tenantid, transcriptStatus }
```

---

### File 3: Tracker Service

**Path:** `apps/api/src/modules/m02-conversation-intelligence/services/tracker.service.ts`

**Locations:** 6

```typescript
// ❌ Line 64 - BEFORE
where: { tenantId }

// ✅ Line 64 - AFTER
where: { tenantid }

// ❌ Line 128 - BEFORE
where: { tenantId, isActive: true }

// ✅ Line 128 - AFTER
where: { tenantid, isActive: true }

// ❌ Line 302 - BEFORE
where: { tenantId, entityId, entityType }

// ✅ Line 302 - AFTER
where: { tenantid, entityId, entityType }

// ❌ Line 313 - BEFORE
where: { tenantId }

// ✅ Line 313 - AFTER
where: { tenantid }

// ❌ Line 339 - BEFORE
count({ where: { tenantId } })

// ✅ Line 339 - AFTER
count({ where: { tenantid } })

// ❌ Lines 340-341 - BEFORE (similar patterns)
count({ where: { tenantId } })  // ×2 more

// ✅ Lines 340-341 - AFTER
count({ where: { tenantid } })  // ×2 more
```

---

### File 4: Translation Service

**Path:** `apps/api/src/modules/m02-conversation-intelligence/services/translation.service.ts`

**Locations:** 4

```typescript
// ❌ Line 120 - BEFORE
where: { tenantId, entityType, entityId, targetLanguage }

// ✅ Line 120 - AFTER
where: { tenantid, entityType, entityId, targetLanguage }

// ❌ Line 178 - BEFORE
findUnique({ where: { tenantId } })

// ✅ Line 178 - AFTER
findUnique({ where: { tenantid } })

// ❌ Line 220 - BEFORE
where: { tenantId }

// ✅ Line 220 - AFTER
where: { tenantid }

// ❌ Line 220 (another occurrence) - BEFORE
where: { tenantId }

// ✅ Line 220 - AFTER
where: { tenantid }
```

---

### File 5: Vocabulary-Correction Service

**Path:** `apps/api/src/modules/m02-conversation-intelligence/services/vocabulary-correction.service.ts`

**Locations:** 4

```typescript
// ❌ Line 68 - BEFORE
where: { tenantId }

// ✅ Line 68 - AFTER
where: { tenantid }

// ❌ Line 98 - BEFORE
where: { tenantId }

// ✅ Line 98 - AFTER
where: { tenantid }

// ❌ Line 111 - BEFORE
m01Call.count({ where: { tenantId } })

// ✅ Line 111 - AFTER
m01Call.count({ where: { tenantid } })

// ❌ Line 113 - BEFORE
where: { tenantId, correctionVersion }

// ✅ Line 113 - AFTER
where: { tenantid, correctionVersion }
```

---

### File 6: M02 Repository

**Path:** `apps/api/src/modules/m02-conversation-intelligence/repositories/m02.repository.ts`

**Locations:** 4

```typescript
// ❌ Line 222 - BEFORE
delegate.findMany({ where: { tenantId } })

// ✅ Line 222 - AFTER
delegate.findMany({ where: { tenantid } })

// ❌ Line 307 - BEFORE
delegate.findMany({ where: { tenantId } })

// ✅ Line 307 - AFTER
delegate.findMany({ where: { tenantid } })

// ❌ Line 390 - BEFORE
where: { tenantId }

// ✅ Line 390 - AFTER
where: { tenantid }

// ❌ Line 408 - BEFORE
delegate.findMany({ where: { tenantId } })

// ✅ Line 408 - AFTER
delegate.findMany({ where: { tenantid } })
```

---

## 📋 PRIORITY 2 - MEDIUM FIXES (3 files, 8 locations)

### File 7: M03 Repository

**Path:** `apps/api/src/modules/m03-ai-summaries-genai/repositories/m03.repository.ts`

**Locations:** 3

```typescript
// ❌ Line 23 - BEFORE
delegate.findMany({ where: { tenantId } })

// ✅ Line 23 - AFTER
delegate.findMany({ where: { tenantid } })

// ❌ Line 136 - BEFORE
delegate.findMany({ where: { tenantId } })

// ✅ Line 136 - AFTER
delegate.findMany({ where: { tenantid } })

// ❌ Lines 225-248 - BEFORE (Multiple)
where: { tenantId }  // on callRecord, account, deal, m10Contact

// ✅ Lines 225-248 - AFTER
where: { tenantid }  // on all models
```

---

### File 8: AI Extractor Service

**Path:** `apps/api/src/modules/m01-capture-transcription/services/ai-extractor.service.ts`

**Locations:** 3

```typescript
// ❌ Line 49 - BEFORE
d.findMany({ where: { tenantId } })

// ✅ Line 49 - AFTER
d.findMany({ where: { tenantid } })

// ❌ Line 197 - BEFORE
d.findMany({ where: { tenantId, callId } })

// ✅ Line 197 - AFTER
d.findMany({ where: { tenantid, callId } })

// ❌ Line 219 - BEFORE ⚠️ WILL 500 IF AIEXTRACTIONFIELD EXISTS
d.findMany({ where: { tenantId, isActive: true } })

// ✅ Line 219 - AFTER
d.findMany({ where: { tenantid, isActive: true } })
```

---

### File 9: M03 Test Controller

**Path:** `apps/api/src/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts`

**Locations:** 2

```typescript
// ❌ Lines 43-46 - BEFORE (Health Check Endpoint)
where: { tenantId }  // on callRecord, account, deal, m10Contact

// ✅ Lines 43-46 - AFTER
where: { tenantid }  // on all models
```

---

## 📋 PRIORITY 3 - TEST FILES (3 files, 8 locations)

### File 10-12: M08 Test Files

**Paths:**
- `apps/api/src/modules/m08-sales-engagement/tests/run-task-tests.ts`
- `apps/api/src/modules/m08-sales-engagement/tests/run-tests.ts`
- `apps/api/src/modules/m08-sales-engagement/tests/run-workflow-tests.ts`

**Pattern (Test Cleanup):**

```typescript
// ❌ BEFORE
where: { tenantId }

// ✅ AFTER
where: { tenantid }
```

---

## ✅ STEP-BY-STEP FIX PROCEDURE

### Step 1: Backup
```bash
git add -A
git commit -m "backup: before tenant id fixes"
git branch backup/tenantid-fixes
```

### Step 2: Fix Priority 1 Files

For each file in Priority 1:

1. Open file in VS Code
2. Use Find/Replace: `tenantId` → `tenantid`
3. Review each change
4. Save file
5. Commit: `git commit -m "fix(m02): tenantId → tenantid in [filename]"`

Example commands:
```bash
# Option 1: Manual find/replace in each file
# Use VS Code Ctrl+H

# Option 2: Using sed (Linux/Mac)
sed -i 's/tenantId/tenantid/g' apps/api/src/modules/m02-conversation-intelligence/services/m02-frontend-call-reviews.service.ts

# Option 3: Using PowerShell (Windows)
(Get-Content file.ts) -replace 'tenantId', 'tenantid' | Set-Content file.ts
```

### Step 3: Fix Priority 2 Files

Same procedure as Step 2.

### Step 4: Fix Priority 3 Files

Same procedure as Step 2.

### Step 5: Verify All Fixes

```bash
# Search for remaining tenantId in query contexts
rg "where:\s*{\s*tenantId" apps/api/src/modules/

# Should return 0 results

# Alternative: Check specific patterns
grep -r "tenantId" apps/api/src/modules/ | grep -E "where|create|data" || echo "✅ All fixed"
```

### Step 6: Test

```bash
# Compile TypeScript
npm run build

# Run tests
npm run test

# Start backend and test with Postman
npm run dev
```

### Step 7: Commit All Changes

```bash
git add -A
git commit -m "fix(tenant-id): fix tenantId → tenantid across all backend services

- Fixed M02 services (call-reviews, trackers, tracker, translation, vocabulary-correction)
- Fixed M02 repository
- Fixed M03 repository
- Fixed M01 AI extractor
- Fixed M03 test controller
- Fixed M08 test files

Resolves: tenantid_audit.md - 41 locations across 12 files

This fixes critical 500 errors on tenant-scoped queries and silent
data failures in multi-tenant scenarios."
```

---

## 🔍 VERIFICATION CHECKLIST

### Before Fixes
- [ ] Create backup branch
- [ ] Document current state
- [ ] Note any failing tests

### During Fixes
- [ ] Fix Priority 1 (6 files)
- [ ] Fix Priority 2 (3 files)
- [ ] Fix Priority 3 (3 files)
- [ ] Use Find/Replace consistently
- [ ] Review each change
- [ ] Commit frequently

### After Fixes
- [ ] Verify no `tenantId` in query contexts
- [ ] Compile TypeScript (no errors)
- [ ] Run test suite
- [ ] Start backend server
- [ ] Test with Postman collection
- [ ] Check for 500 errors in logs
- [ ] Verify multi-tenant data isolation
- [ ] Final commit

---

## 🧪 TESTING STRATEGY

### Unit Tests
```bash
npm run test -- --testPathPattern="m02|m03|m01"
```

### Integration Tests
```bash
# Start backend
npm run dev

# Run Postman collection for:
- Auth flows
- Tenant-scoped queries
- Multi-tenant scenarios
```

### Manual Testing
1. Login as Sales Rep
2. Test tenant-scoped queries
3. Login as Manager
4. Test manager-only queries
5. Verify data isolation

---

## 📊 SUMMARY

| Item | Count |
|------|-------|
| Total Files | 12 |
| Total Locations | 41 |
| Priority 1 | 6 files, 25 locations |
| Priority 2 | 3 files, 8 locations |
| Priority 3 | 3 files, 8 locations |

---

## ⚠️ COMMON MISTAKES TO AVOID

❌ **Don't:**
- Replace `userId`, `tenantSlug`, etc. — only `tenantId`
- Forget to test after changes
- Mix up `tenantId` in different contexts (some might be in non-Prisma code)

✅ **Do:**
- Review each match before replacing
- Test thoroughly
- Commit frequently
- Document changes

---

## ✅ SUCCESS CRITERIA

- [ ] All 41 locations fixed
- [ ] No `tenantId` in Prisma queries
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No 500 errors on tenant queries
- [ ] Multi-tenant data isolation verified
- [ ] Postman tests all pass
- [ ] Code reviewed and approved

---

## 📞 SUPPORT

If you encounter issues:
1. Check this guide for the specific file
2. Verify the exact line numbers
3. Review the before/after examples
4. Test changes incrementally
5. Refer to the Prisma schema for field names

Good luck with the fixes! 🚀
