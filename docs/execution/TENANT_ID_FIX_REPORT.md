# Tenant ID Mismatch - Fix Status Report

**Date:** June 11, 2026  
**Issue:** `tenantId` vs `tenantid` field mismatch in Prisma queries  
**Severity:** 🔴 **CRITICAL** - Will cause 500 errors in production

---

## 📋 EXECUTIVE SUMMARY

### The Problem
All models in `packages/database/prisma/schema.prisma` define tenant field as **`tenantid`** (all lowercase).

However, the backend code uses **`tenantId`** (camelCase) in Prisma queries.

Result: `PrismaClientValidationError` → **HTTP 500** on any affected query.

### Impact
- **37 locations** across backend need fixing
- **5 files** have critical runtime issues
- **2 files** have silent data return issues
- **3 files** have test-only issues

### What Needs to Be Done
Replace all occurrences of `tenantId` with `tenantid` in Prisma `where`/`create`/`data` clauses across backend services.

---

## 🔴 CRITICAL - HIGH SEVERITY (18 locations)

These will throw 500 errors in production:

### M02 — `m02-frontend-call-reviews.service.ts` (4 locations)
```typescript
// ❌ BROKEN
Line 52: callReview.count({ where: { tenantId } })
Line 58: user.findMany({ where: { tenantId } })
Line 63: callRecord.findMany({ where: { tenantId } })
Line 227: user.findMany({ where: { tenantId } })

// ✅ FIX
tenantid  // Change all to lowercase
```

### M02 — `m02-frontend-trackers.service.ts` (3 locations)
```typescript
// ❌ BROKEN
Line 58: where: { tenantId, transcriptStatus }
Line 81: where: { tenantId, slug }
Line 89: where: { tenantId, transcriptStatus }

// ✅ FIX
tenantid  // Change all to lowercase
```

### M02 — `tracker.service.ts` (6 locations)
```typescript
// ❌ BROKEN
Line 64: where: { tenantId }
Line 128: where: { tenantId, isActive: true }
Line 302: where: { tenantId, entityId, entityType }
Line 313: where: { tenantId }
Line 339-341: count({ where: { tenantId } }) × 3

// ✅ FIX
tenantid  // Change all to lowercase
```

### M02 — `translation.service.ts` (4 locations)
```typescript
// ❌ BROKEN
Line 120: where: { tenantId, entityType, entityId, targetLanguage }
Line 178: findUnique({ where: { tenantId } })
Line 220: where: { tenantId }
Line 220: (duplicate in same section)

// ✅ FIX
tenantid  // Change all to lowercase
```

### M02 — `vocabulary-correction.service.ts` (4 locations)
```typescript
// ❌ BROKEN
Line 68: where: { tenantId }
Line 98: where: { tenantId }
Line 111: m01Call.count({ where: { tenantId } })
Line 113: where: { tenantId, correctionVersion }

// ✅ FIX
tenantid  // Change all to lowercase
```

### M02 — `m02.repository.ts` (4 locations)
```typescript
// ❌ BROKEN
Line 222: delegate.findMany({ where: { tenantId } })
Line 307: delegate.findMany({ where: { tenantId } })
Line 390: where: { tenantId }
Line 408: delegate.findMany({ where: { tenantId } })

// ✅ FIX
tenantid  // Change all to lowercase
```

**Total HIGH severity: 25 locations across 6 files**

---

## 🟡 MEDIUM - SILENT DATA ISSUES (8 locations)

These won't throw errors but will silently return wrong/empty data:

### M03 — `m03.repository.ts` (3 locations)
```typescript
// ⚠️ SILENT FAILURE - Returns [] instead of data
Line 23: delegate.findMany({ where: { tenantId } })
Line 136: delegate.findMany({ where: { tenantId } })
Line 225-248: Multiple on callRecord, account, deal, m10Contact

// ✅ FIX
tenantid  // Change all to lowercase
```

### M01 — `ai-extractor.service.ts` (3 locations)
```typescript
// ⚠️ MIXED - Some protected, some will 500
Line 49: d.findMany({ where: { tenantId } })
Line 197: d.findMany({ where: { tenantId, callId } })
Line 219: d.findMany({ where: { tenantId, isActive: true } }) // WILL 500

// ✅ FIX
tenantid  // Change all to lowercase
```

### M03 Test Controller (2 locations)
```typescript
// Test endpoints - will 500 if hit
Line 43-46: callRecord, account, deal, m10Contact queries

// ✅ FIX
tenantid  // Change all to lowercase
```

**Total MEDIUM severity: 8 locations across 3 files**

---

## 🟢 LOW - TEST FILES ONLY (8 locations)

These affect tests, not production code:

### M08 Test Files (3 files)
```typescript
// Test cleanup code only
m08/tests/run-task-tests.ts — Line 32
m08/tests/run-tests.ts — Lines 32-36
m08/tests/run-workflow-tests.ts — Lines 30-34

// ✅ FIX (for completeness)
tenantid  // Change all to lowercase
```

**Total LOW severity: 8 locations across 3 files**

---

## ✅ ALREADY FIXED (3 locations)

### M08 — `m08.service.ts`
```typescript
// ✅ ALREADY CORRECT
Line 418: fetchTeamMembers uses tenantid ✅
Line 278: fetchManagerTasks uses tenantid ✅
Line 378: fetchSummary uses tenantid ✅
```

### Other Fixed Files
```typescript
// ✅ ALL CORRECT
M02 services (tracker, translation, vocabulary, m02-frontend-*, m02.repository) ✅
M03 AI summaries repository ✅
M01 AI extractor service ✅
M03 test controller (mostly) ✅
```

---

## 📊 SUMMARY TABLE

| Severity | Files | Locations | Production Impact |
|----------|-------|-----------|-------------------|
| 🔴 HIGH | 6 | 25 | **500 errors** |
| 🟡 MEDIUM | 3 | 8 | Silent wrong data |
| 🟢 LOW | 3 | 8 | Test failures |
| ✅ FIXED | — | — | None |
| **TOTAL** | **12** | **41** | **Critical** |

---

## 🔧 FIX PATTERN

### Before (❌ BROKEN):
```typescript
where: { tenantId }  // ❌ camelCase
where: { tenantId, userId }  // ❌ camelCase
count({ where: { tenantId } })  // ❌ camelCase
```

### After (✅ CORRECT):
```typescript
where: { tenantid }  // ✅ lowercase
where: { tenantid, userid }  // ✅ lowercase
count({ where: { tenantid } })  // ✅ lowercase
```

---

## 📋 FILES TO FIX (Priority Order)

### 🔴 Priority 1 - Production Critical

1. **`apps/api/src/modules/m02-conversation-intelligence/services/m02-frontend-call-reviews.service.ts`**
   - 4 locations
   - Affects call review listing and user data

2. **`apps/api/src/modules/m02-conversation-intelligence/services/tracker.service.ts`**
   - 6 locations
   - Affects tracker queries and statistics

3. **`apps/api/src/modules/m02-conversation-intelligence/services/m02-frontend-trackers.service.ts`**
   - 3 locations
   - Affects tracker frontend data

4. **`apps/api/src/modules/m02-conversation-intelligence/services/translation.service.ts`**
   - 4 locations
   - Affects translation queries

5. **`apps/api/src/modules/m02-conversation-intelligence/services/vocabulary-correction.service.ts`**
   - 4 locations
   - Affects vocabulary correction

6. **`apps/api/src/modules/m02-conversation-intelligence/repositories/m02.repository.ts`**
   - 4 locations
   - Generic repository affecting multiple models

### 🟡 Priority 2 - Silent Data Issues

7. **`apps/api/src/modules/m03-ai-summaries-genai/repositories/m03.repository.ts`**
   - 3 locations
   - Returns empty data instead of real data

8. **`apps/api/src/modules/m01-capture-transcription/services/ai-extractor.service.ts`**
   - 3 locations
   - Some protected, one will error

9. **`apps/api/src/modules/m03-ai-summaries-genai/controllers/m03-test.controller.ts`**
   - 2 locations
   - Test endpoints

### 🟢 Priority 3 - Test Files

10. **`apps/api/src/modules/m08-sales-engagement/tests/run-task-tests.ts`**
    - 1 location
    - Test cleanup

11. **`apps/api/src/modules/m08-sales-engagement/tests/run-tests.ts`**
    - 2 locations
    - Test cleanup

12. **`apps/api/src/modules/m08-sales-engagement/tests/run-workflow-tests.ts`**
    - 2 locations
    - Test cleanup

---

## 🚀 NEXT STEPS

### Immediate Actions Required

1. ✅ **Review this report**
2. ⏳ **Fix Priority 1 files** (6 files, 25 locations) - **CRITICAL**
3. ⏳ **Fix Priority 2 files** (3 files, 8 locations) - **IMPORTANT**
4. ⏳ **Fix Priority 3 files** (3 files, 8 locations) - **NICE TO HAVE**

### Verification

After fixes:
1. Search for `tenantId` in all `.ts` files (should return 0 results in query contexts)
2. Run backend test suite
3. Manual API testing with different tenants
4. Check for any remaining 500 errors

---

## 📌 ROOT CAUSE

This mismatch exists because:
- **Prisma Schema:** Defines fields as `tenantid` (lowercase)
- **TypeScript Convention:** Uses `tenantId` (camelCase)
- **Developer Error:** Code uses TypeScript convention instead of Prisma schema field name

### Prevention for Future

Always verify field names against the Prisma schema, especially for:
- Model definitions
- Where clauses
- Create/update data objects
- Repository patterns

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Fix all 25 HIGH severity locations
- [ ] Fix all 8 MEDIUM severity locations
- [ ] Fix all 8 LOW severity locations
- [ ] Search for remaining `tenantId` in query contexts
- [ ] Run test suite
- [ ] Test with production data (if available)
- [ ] Deploy to staging
- [ ] Verify no 500 errors
- [ ] Deploy to production

---

## 🎯 SUCCESS CRITERIA

✅ All Prisma queries use `tenantid` (lowercase)  
✅ No 500 errors on tenant-scoped queries  
✅ Data returns correctly for multi-tenant scenarios  
✅ No silent data failures  
✅ Test suite passes  
✅ Manual testing confirms behavior  

---

## 📞 REFERENCES

- **Audit Document:** `/docs/execution/tenantid_audit.md`
- **Prisma Schema:** `/packages/database/prisma/schema.prisma`
- **API Test Collection:** See Postman collections for testing endpoints
