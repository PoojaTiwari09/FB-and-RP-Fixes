# Revenue Intelligence — Implementation Plan v2
### Closing All Partial Features (audit score < 90%)

> **Source audit:** `backend_features_audit.md` — overall score before this plan: **~77%** → target: **~97%**

---

## Project Context

| Key | Value |
|-----|-------|
| **Stack** | NestJS API (port 3001) · Next.js (port 3000) · FastAPI/Groq (port 3002) · Supabase Cloud · HubSpot |
| **Repo** | `c:\Users\Relanto\Downloads\POCFROMSCRATCH` |
| **Servers** | `npm run dev:api` · `npm run dev:web` · `npm run dev:ai` |
| **Supabase** | Cloud — keys in `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) |
| **HubSpot** | Portal `246259639` — `HUBSPOT_ACCESS_TOKEN` in `.env.local` |
| **Rule** | ✋ Every phase ends with a manual verification checkpoint. Do **NOT** proceed to the next phase until everything looks correct. |

---

---

## Phase 1 — Code-Only Quick Wins
**Effort:** Very Low · **Risk:** Very Low
**Features:** BF-07 (duplicate gap), BF-09 (structured errors), BF-12 (brief_type prompt), BF-13 (citations)

> No DB migrations. No new endpoints. Pure logic fixes inside existing files.

---

### 1-A · BF-07: Carry `brief_type` + `brief_period_days` on Board Duplicate

**File:** `apps/api/src/boards/boards.service.ts` — `duplicateBoard()`

Inside the `board_config` insert block, add two fields:

```typescript
brief_type: original.brief_type || 'full',
brief_period_days: original.brief_period_days ?? 30,
```

---

### 1-B · BF-09: Return Structured Error with Field Name on Edit Failures

**File:** `apps/api/src/edits/edits.service.ts`

Replace every plain-string `BadRequestException` with a structured object:

```typescript
// Company type validation in editCompany():
throw new BadRequestException({
  field: 'type',
  message: "type must be 'Customer' or 'New Business'",
  allowed_values: ['Customer', 'New Business'],
});

// Deal stage in editDeal():
throw new BadRequestException({
  field: 'stage',
  message: 'Invalid stage',
  allowed_values: VALID_DEAL_STAGES,
});

// close_date in editDeal():
throw new BadRequestException({
  field: 'close_date',
  message: 'close_date must be a valid ISO date string (e.g. 2025-12-31)',
});

// manager_note length in editSupplementary():
throw new BadRequestException({
  field: 'manager_note',
  message: 'manager_note must be 500 characters or fewer',
  max_length: 500,
});

// next_qbr_date in editSupplementary():
throw new BadRequestException({
  field: 'next_qbr_date',
  message: 'next_qbr_date must be a valid date',
});
```

---

### 1-C · BF-12: Apply `brief_type` to the Groq Prompt

**File:** `services/ai/main.py`

**Step 1** — Add `brief_type` to `SummaryRequest`:
```python
class SummaryRequest(BaseModel):
    company_hubspot_id: str
    scope: str = "entire_account"
    period_days: int = 90
    force_refresh: bool = False
    brief_type: str = "full"   # NEW: full | summary | risk_only
```

**Step 2** — Add instruction map below the existing `SUMMARY_SYSTEM_PROMPT` constant:
```python
BRIEF_TYPE_INSTRUCTIONS = {
    "full":      "Generate a comprehensive brief covering status, all risks, and all recommended steps.",
    "summary":   "Generate a concise 2-3 sentence executive summary with the top 1-2 risks only.",
    "risk_only": "Focus exclusively on risks and required actions. Omit any positive framing.",
}
```

**Step 3** — In `generate_summary()`, build a dynamic prompt before calling Groq:
```python
type_instruction = BRIEF_TYPE_INSTRUCTIONS.get(req.brief_type, BRIEF_TYPE_INSTRUCTIONS["full"])
dynamic_system_prompt = SUMMARY_SYSTEM_PROMPT + f"\n\nBRIEF TYPE: {type_instruction}"

messages = [
    {"role": "system", "content": dynamic_system_prompt},   # was the static constant
    {"role": "user", "content": f"Generate a revenue intelligence brief:\n\n{context_text}"},
]
```

**Step 4** — Include `brief_type` in the cache scope so types don't share a cache entry:
```python
# In both get_cached_brief() and save_brief_cache() calls:
cache_scope = f"{req.scope}:{req.brief_type}"
```

---

### 1-D · BF-13: Populate `citations` in `/ai/chat` Response

**File:** `services/ai/main.py`

Add helper function after `format_context_for_prompt`:
```python
def extract_citations(reply: str, activities: list) -> list:
    """Cross-reference reply text with activity list to extract citations."""
    citations = []
    seen_dates = set()
    for act in activities[:30]:
        ts = (act.get("timestamp") or "")[:10]   # YYYY-MM-DD
        if not ts or ts in seen_dates:
            continue
        subject = act.get("subject") or act.get("title") or ""
        if ts in reply or (subject and subject in reply):
            seen_dates.add(ts)
            citations.append({
                "type": act.get("type", ""),
                "date": ts,
                "summary": (act.get("body") or subject or "")[:120],
            })
        if len(citations) >= 5:
            break
    return citations
```

In `chat()`, replace the return statement:
```python
citations = extract_citations(reply, ctx["activities"])
return {
    "reply": reply,
    "citations": citations,           # was always []
    "insufficient_data": insufficient_data,
}
```

---

## ✋ Phase 1 Verification Checkpoint

**Check all four things below in the website before moving to Phase 2.**

### 1-A: Brief type carried through duplicate
1. Open the website at `http://localhost:3000`.
2. Go to any board (e.g. Commercial). Open its settings and change the **Brief Type** to `Risk Only` and **Brief Period** to `7 days`. Save.
3. Use the **Duplicate Board** option to create a copy.
4. Open the duplicated board's settings.
5. **Verify:** The Brief Type shows `Risk Only` and the period shows `7 days` — not the defaults.
6. Delete the duplicate board afterwards. Reset the original back to `Full` / `30 days`.

### 1-B: Structured edit error format
1. On any account row in the board, try to inline-edit a CRM field and enter an invalid value (e.g. a company `type` that isn't `Customer` or `New Business`).
2. Submit the edit.
3. **Verify:** An error message appears that names the specific field and lists what the allowed values are — not just a generic error.

### 1-C: brief_type changes the AI brief content
1. Open any account's detail panel and generate an AI Brief.
2. Note the content (it should be full — risks + steps + positives).
3. Go to board settings, change Brief Type to `Risk Only`, save.
4. Regenerate the brief for the same account (force refresh).
5. **Verify:** The new brief is noticeably shorter and focused only on risks and actions — no positive framing or full summaries.
6. Try `Summary` type — the brief should be a short 2–3 sentence paragraph.

### 1-D: AI chat shows citations
1. Open any account that has call or meeting activities.
2. Open the **Ask Anything** / chat panel.
3. Ask: `"What happened in the last call?"`
4. **Verify:** The reply shows one or more citation cards / references below it (date, activity type, and a short summary). Not empty.

---

## Phase 2 — API Completions (Existing Tables)
**Effort:** Low–Medium · **Risk:** Low
**Features:** BF-15 (21-day window fix), BF-16 (date filter + pagination), BF-21 (sparkline endpoint), BF-18 (brief_available + deep-link)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 1 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-07 | ✅ Complete | 100% | `brief_type` + `brief_period_days` now carried on duplicate |
> | BF-09 | ✅ Complete | 100% | Edit errors now return structured `{field, message, allowed_values}` |
> | BF-12 | ✅ Complete | 100% | `brief_type` applied to Groq prompt; cache-keyed per type |
> | BF-13 | ⚠️ Partial | 80% | Citations now populated; streaming still pending (Phase 8) |

> No DB migrations needed — all tables exist.

---

### 2-A · BF-15: Fix Engagement Gap to Use 21-Day Activity Window

**File:** `apps/api/src/accounts/accounts.service.ts` — `getEngagementGap()`

Rewrite to use a recency window instead of "ever had activity":

```typescript
async getEngagementGap(boardSlug: string, days: number = 21) {
  const { data: allCompanies } = await this.supabase
    .from('crm_companies')
    .select('hubspot_id, name, exit_arr')
    .eq('board', boardSlug);

  if (!allCompanies || allCompanies.length === 0) {
    return { low_engagement_count: 0, low_engagement_arr: 0, window_days: days, accounts: [] };
  }

  const allIds = allCompanies.map(c => c.hubspot_id);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Companies with activity WITHIN the window
  const { data: recentRows } = await this.supabase
    .from('crm_activities')
    .select('company_hubspot_id')
    .in('company_hubspot_id', allIds)
    .gte('timestamp', cutoff);

  const recentSet = new Set((recentRows || []).map(r => r.company_hubspot_id));
  const lowEngagementCompanies = allCompanies.filter(c => !recentSet.has(c.hubspot_id));

  // Last activity timestamp for context
  const { data: latestActs } = await this.supabase
    .from('crm_activities')
    .select('company_hubspot_id, timestamp')
    .in('company_hubspot_id', allIds)
    .order('timestamp', { ascending: false });

  const lastActivityMap: Record<string, string> = {};
  (latestActs || []).forEach(a => {
    if (!lastActivityMap[a.company_hubspot_id]) lastActivityMap[a.company_hubspot_id] = a.timestamp;
  });

  const totalArr = lowEngagementCompanies.reduce((sum, c) => sum + (parseFloat(c.exit_arr) || 0), 0);

  return {
    low_engagement_count: lowEngagementCompanies.length,
    low_engagement_arr: totalArr,
    window_days: days,
    accounts: lowEngagementCompanies.map(c => ({
      hubspot_id: c.hubspot_id,
      name: c.name,
      exit_arr: parseFloat(c.exit_arr) || 0,
      last_activity_days: lastActivityMap[c.hubspot_id]
        ? Math.round((Date.now() - new Date(lastActivityMap[c.hubspot_id]).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    })),
  };
}
```

**File:** `apps/api/src/accounts/accounts.controller.ts` — add optional `days` query param:
```typescript
@Get('engagement-gap')
async getEngagementGap(
  @Query('board_slug') board_slug: string,
  @Query('days') days?: string,
) {
  if (!board_slug) return { error: 'board_slug is required' };
  return this.accountsService.getEngagementGap(board_slug, days ? parseInt(days) : 21);
}
```

---

### 2-B · BF-16: Add Date Range Filter + Pagination to Activities Endpoint

**File:** `apps/api/src/activities/activities.service.ts` — rewrite `getActivities()`:

```typescript
async getActivities(
  companyHubspotId: string,
  type?: string,
  limit: number = 50,
  fromDate?: string,
  toDate?: string,
  page: number = 1,
  pageSize: number = 50,
) {
  const usePagination = page > 1 || pageSize !== 50;

  let query = this.supabase
    .from('crm_activities')
    .select('*', { count: 'exact' })
    .eq('company_hubspot_id', companyHubspotId)
    .order('timestamp', { ascending: false });

  if (type) query = query.eq('type', type.toUpperCase());
  if (fromDate) query = query.gte('timestamp', fromDate);
  if (toDate) query = query.lte('timestamp', toDate);

  if (usePagination) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    total: count || 0,
    page,
    page_size: usePagination ? pageSize : limit,
    activities: (data || []).map(a => ({
      id: a.hubspot_id,
      local_id: a.local_id,
      type: a.type,
      direction: a.direction,
      timestamp: a.timestamp,
      body: a.body,
      duration_seconds: a.duration_seconds,
      rep_talk_pct: a.rep_talk_pct,
      client_talk_pct: a.client_talk_pct,
      call_outcome: a.call_outcome,
      subject: a.subject,
      snippet: a.snippet,
      title: a.title,
      attendee_contact_ids: a.attendee_contact_ids,
      assigned_rep_id: a.assigned_rep_id,
    })),
  };
}
```

**File:** `apps/api/src/activities/activities.controller.ts` — update controller:
```typescript
@Get(':companyHubspotId')
async getActivities(
  @Param('companyHubspotId') companyHubspotId: string,
  @Query('type') type?: string,
  @Query('limit') limit?: string,
  @Query('from_date') fromDate?: string,
  @Query('to_date') toDate?: string,
  @Query('page') page?: string,
  @Query('page_size') pageSize?: string,
) {
  return this.activitiesService.getActivities(
    companyHubspotId,
    type,
    limit ? parseInt(limit) : 50,
    fromDate,
    toDate,
    page ? parseInt(page) : 1,
    pageSize ? parseInt(pageSize) : 50,
  );
}
```

---

### 2-C · BF-21: Dedicated Lightweight Sparkline Endpoint

**File:** `apps/api/src/accounts/accounts.service.ts` — add new method:

```typescript
async getSparklineData(boardSlug: string, hubspotIds: string[] = []) {
  let companyIds = hubspotIds;
  if (companyIds.length === 0) {
    const { data: companies } = await this.supabase
      .from('crm_companies').select('hubspot_id').eq('board', boardSlug);
    companyIds = (companies || []).map(c => c.hubspot_id);
  }
  if (companyIds.length === 0) return { sparklines: [] };

  const { data: activities } = await this.supabase
    .from('crm_activities')
    .select('company_hubspot_id, type, timestamp')
    .in('company_hubspot_id', companyIds)
    .order('timestamp', { ascending: false });

  const sparklines = companyIds.map(compId => {
    const compActs = (activities || []).filter(a => a.company_hubspot_id === compId);
    const refTime = compActs.length > 0
      ? new Date(compActs[0].timestamp).getTime() : Date.now();
    const windowStart = refTime - 21 * 24 * 60 * 60 * 1000;

    const buckets: number[] = new Array(21).fill(0);
    compActs
      .filter(a => new Date(a.timestamp).getTime() >= windowStart)
      .forEach(a => {
        const daysAgo = Math.floor((refTime - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 21) buckets[daysAgo]++;
      });

    const lastActivity = compActs[0]?.timestamp || null;
    const lastActivityDays = lastActivity
      ? Math.round((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      hubspot_id: compId,
      buckets,                  // array of 21 ints: [day0_count, ..., day20_count]
      zero_activity_flag: lastActivityDays === null || lastActivityDays > 21,
      last_activity_days: lastActivityDays,
      highlight_red: lastActivityDays !== null && lastActivityDays > 30,
    };
  });

  return { sparklines };
}
```

**File:** `apps/api/src/accounts/accounts.controller.ts`

> ⚠️ Add this route **BEFORE** `@Get(':hubspotId')` to avoid route collision.

```typescript
@Get('sparklines')
async getSparklines(
  @Query('board_slug') board_slug: string,
  @Query('hubspot_ids') hubspot_ids?: string,
) {
  const ids = hubspot_ids ? hubspot_ids.split(',').map(s => s.trim()) : [];
  return this.accountsService.getSparklineData(board_slug, ids);
}
```

---

### 2-D · BF-18: Add `brief_available` + Deep-Link URL to Account Panel

**File:** `apps/api/src/accounts/accounts.service.ts` — `getAccountDetail()`

After fetching supplementary data, add:
```typescript
// Brief cache check
const { data: briefCache } = await this.supabase
  .from('ai_briefs_cache')
  .select('generated_at')
  .eq('company_hubspot_id', hubspotId)
  .order('generated_at', { ascending: false })
  .limit(1);

const briefAvailable = !!(briefCache && briefCache.length > 0);

// HubSpot deep-link
const portalId = process.env.HUBSPOT_PORTAL_ID || '246259639';
const accountConsoleUrl = `https://app.hubspot.com/contacts/${portalId}/company/${hubspotId}`;
```

Add to the return object:
```typescript
brief_available: briefAvailable,
brief_generated_at: briefCache?.[0]?.generated_at || null,
account_console_url: accountConsoleUrl,
```

Add `HUBSPOT_PORTAL_ID=246259639` to `.env.local`.

---

## ✋ Phase 2 Verification Checkpoint

**Check all four things below in the website before moving to Phase 3.**

### 2-A: Engagement gap uses 21-day window
1. On the board, look at the **Needs Engagement** tab (or the header warning that shows accounts with no recent activity).
2. **Verify:** The count of accounts shown there changes meaningfully compared to before this phase. Accounts that had activity 25 days ago should now appear as low-engagement (they weren't before, when the check was "ever had any activity").
3. If there is a date-window selector (7 / 21 / 90 days), switch between them and confirm the count changes — a tighter window shows more accounts flagged.

### 2-B: Activity timeline pagination and filtering
1. Open any account's detail panel and go to the **Activity Timeline** tab.
2. If the timeline has more than a handful of activities, scroll to the bottom — there should be a **Load More** or page control.
3. **Verify:** Clicking next page loads a different set of activities.
4. If there is a filter (Calls / Emails / Meetings), select `Calls only`.
5. **Verify:** Only call activities appear in the list.

### 2-C: Sparkline bars render on board rows
1. Look at any board row in the main account table.
2. Find the **Activity** column (the bar chart / sparkline column).
3. **Verify:** The bars are rendering correctly for all rows — no blank/missing sparklines.
4. Accounts with no recent activity should show the sparkline as empty/flat and the last-activity text in red (if >30 days).

### 2-D: Account panel shows brief availability and HubSpot link
1. Click on any account to open the detail / account panel.
2. Look for the **AI Brief** section.
3. **Verify:** There is a visible indicator showing whether a brief has already been generated (e.g. a "Generated X days ago" label, or a "Generate Brief" button when none exists yet).
4. Look for an **Open in HubSpot** link or button somewhere in the panel header.
5. **Verify:** Clicking it opens the correct HubSpot company page in a new tab.

---

## Phase 3 — DB Schema Additions
**Effort:** Low (SQL + code) · **Risk:** Low–Medium
**Features:** BF-01 (aggregation_method + ownership), BF-03 (column_type), BF-05 (date_filter_field)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 2 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-15 | ✅ Complete | 100% | Engagement gap now uses configurable recency window (default 21 days) |
> | BF-16 | ✅ Complete | 100% | Activity timeline has `from_date`, `to_date`, `page`, `page_size` |
> | BF-18 | ✅ Complete | 100% | Account panel now includes `brief_available`, `brief_generated_at`, `account_console_url` |
> | BF-21 | ✅ Complete | 100% | Dedicated `GET /accounts/sparklines` endpoint with 21-bucket daily data |

> ⚠️ **Run the migration SQL in Supabase SQL Editor FIRST. Then write code.**

---

### 3-A · Migration: `supabase/migrations/004_v2_additions.sql`

Create this file locally then execute the SQL in Supabase SQL Editor:

```sql
-- BF-01: aggregation method and creator
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS aggregation_method TEXT NOT NULL DEFAULT 'count'
    CHECK (aggregation_method IN ('count', 'arr_sum')),
  ADD COLUMN IF NOT EXISTS created_by_user_id TEXT;

-- BF-05: configurable date filter field per board
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS date_filter_field TEXT NOT NULL DEFAULT 'activity_date'
    CHECK (date_filter_field IN ('activity_date', 'renewal_date', 'close_date', 'created_at'));

-- BF-03: column type flag
ALTER TABLE board_columns
  ADD COLUMN IF NOT EXISTS column_type TEXT NOT NULL DEFAULT 'crm'
    CHECK (column_type IN ('crm', 'ai', 'system'));
```

---

### 3-B · BF-01: Persist `aggregation_method` + `created_by_user_id`

**File:** `apps/api/src/boards/boards.service.ts`

In `finalizeBoard()` board_config insert, add:
```typescript
aggregation_method: data.aggregation_method,
created_by_user_id: data.created_by_user_id || null,
```

In `getAllBoards()` column map, add:
```typescript
aggregation_method: board.aggregation_method || 'count',
created_by_user_id: board.created_by_user_id || null,
```

In `updateBoard()`:
```typescript
const VALID_AGG = ['count', 'arr_sum'];
if (data.aggregation_method !== undefined) {
  if (!VALID_AGG.includes(data.aggregation_method))
    throw new BadRequestException(`aggregation_method must be one of: ${VALID_AGG.join(', ')}`);
  patch.aggregation_method = data.aggregation_method;
}
if (data.created_by_user_id !== undefined) patch.created_by_user_id = data.created_by_user_id;
```

In `duplicateBoard()` board_config insert:
```typescript
aggregation_method: original.aggregation_method || 'count',
created_by_user_id: original.created_by_user_id || null,
```

---

### 3-C · BF-05: Date Filter Field API

**File:** `apps/api/src/boards/boards.service.ts` — `updateBoard()`:
```typescript
const VALID_DATE_FIELDS = ['activity_date', 'renewal_date', 'close_date', 'created_at'];
if (data.date_filter_field !== undefined) {
  if (!VALID_DATE_FIELDS.includes(data.date_filter_field))
    throw new BadRequestException(`date_filter_field must be one of: ${VALID_DATE_FIELDS.join(', ')}`);
  patch.date_filter_field = data.date_filter_field;
}
```

In `getAllBoards()` map:
```typescript
date_filter_field: board.date_filter_field || 'activity_date',
```

In `finalizeBoard()` insert:
```typescript
date_filter_field: data.date_filter_field || 'activity_date',
```

---

### 3-D · BF-03: Add `column_type` to Column Responses + Validation

**File:** `apps/api/src/boards/boards.service.ts`

Add type map constant inside the class:
```typescript
private readonly COLUMN_TYPES: Record<string, string> = {
  name: 'system',
  exit_arr: 'system',
  contacts_count: 'crm',
  activity_timeline: 'ai',
  last_activity_date: 'crm',
  manager_note: 'crm',
  open_deals_summary: 'crm',
  renewal_date: 'crm',
  employee_count: 'crm',
};
```

In `getAllBoards()` column map:
```typescript
column_type: c.column_type || this.COLUMN_TYPES[c.field_key] || 'crm',
```

In `addColumn()`:
```typescript
const inferredType = col.column_type || this.COLUMN_TYPES[col.field_key] || 'crm';
if (inferredType === 'system') {
  throw new BadRequestException(
    `"${col.field_key}" is a system column and is always present — it cannot be added manually`
  );
}
// Add column_type to the insert object:
const newCol = { ...existingFields, column_type: inferredType };
```

---

## ✋ Phase 3 Verification Checkpoint

**Check all four things below before moving to Phase 4.**

### 3-A: Migration ran successfully
1. Open **Supabase Studio** → Table Editor.
2. Open the `board_config` table and look at the columns.
3. **Verify:** You can see `aggregation_method`, `created_by_user_id`, and `date_filter_field` as columns.
4. Open the `board_columns` table.
5. **Verify:** You can see `column_type` as a column.

### 3-B: Aggregation method saved on board creation
1. In the website, go through the **Create New Board** wizard.
2. On the first step (Details), select **ARR Sum** as the aggregation method.
3. Complete the wizard and create the board.
4. Open that new board's settings.
5. **Verify:** The aggregation method shows `ARR Sum` (not blank or defaulting to Account Count).
6. Delete the test board.

### 3-C: Date filter field setting works
1. Open any board's settings.
2. Find the **Date Filter Field** setting and change it from `Activity Date` to `Renewal Date`.
3. Save and reopen settings.
4. **Verify:** The setting shows `Renewal Date` — it was persisted.
5. Reset it back to `Activity Date`.

### 3-D: Column types show correctly, system columns protected
1. Open any board's column configuration.
2. Look at the columns listed — hover or expand each one.
3. **Verify:** The `Account Name` and `ARR` columns are marked as **System** (locked/non-removable). The `Activity Timeline` column is marked as **AI**. Other columns show as **CRM**.
4. Try to add `Account Name` as a new column via the column picker.
5. **Verify:** An error appears saying it is a system column and cannot be added again.

---

## Phase 4 — Board Session Persistence (BF-22 + BF-10)
**Effort:** Medium · **Risk:** Low
**Features:** BF-22 (fully — was 10%), BF-10 (last_viewed gap)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 3 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-01 | ✅ Complete | 100% | `aggregation_method` + `created_by_user_id` now stored and returned |
> | BF-03 | ✅ Complete | 100% | `column_type` (crm/ai/system) stored on columns; system columns protected |
> | BF-05 | ✅ Complete | 100% | `date_filter_field` configurable per board via `PUT /boards/:slug` |

> The `user_board_preferences` table exists from migration 001. This phase builds the API layer.

---

### 4-A · Create `preferences` Module

Create directory: `apps/api/src/preferences/`

**`preferences.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({ controllers: [PreferencesController], providers: [PreferencesService] })
export class PreferencesModule {}
```

**`preferences.service.ts`**
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

@Injectable()
export class PreferencesService {
  private supabase = getSupabase();

  async getLastViewedBoard(sessionRole: string) {
    const { data } = await this.supabase
      .from('user_board_preferences')
      .select('board_id, active_tab_id, sort_field, sort_dir, filters, page_size, updated_at')
      .eq('session_role', sessionRole)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    return data || null;
  }

  async getAllPreferences(sessionRole: string) {
    const { data, error } = await this.supabase
      .from('user_board_preferences')
      .select('*')
      .eq('session_role', sessionRole)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async upsertPreferences(
    sessionRole: string,
    boardId: string,
    prefs: {
      active_tab_id?: string;
      sort_field?: string;
      sort_dir?: string;
      filters?: Record<string, any>;
      page_size?: number;
    },
  ) {
    if (prefs.sort_dir && !['asc', 'desc'].includes(prefs.sort_dir))
      throw new BadRequestException("sort_dir must be 'asc' or 'desc'");

    const { data, error } = await this.supabase
      .from('user_board_preferences')
      .upsert({
        session_role: sessionRole,
        board_id: boardId,
        active_tab_id: prefs.active_tab_id || null,
        sort_field: prefs.sort_field || null,
        sort_dir: prefs.sort_dir || null,
        filters: prefs.filters || {},
        page_size: prefs.page_size || 20,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_role,board_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async clearPreferences(sessionRole: string, boardId?: string) {
    let q = this.supabase.from('user_board_preferences').delete().eq('session_role', sessionRole);
    if (boardId) q = (q as any).eq('board_id', boardId);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
```

**`preferences.controller.ts`**
```typescript
import { Controller, Get, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get(':role/last-board')
  async getLastViewedBoard(@Param('role') role: string) {
    return this.preferencesService.getLastViewedBoard(role);
  }

  @Get(':role')
  async getAllPreferences(@Param('role') role: string) {
    const preferences = await this.preferencesService.getAllPreferences(role);
    return { preferences };
  }

  @Put(':role/:boardId')
  async upsertPreferences(
    @Param('role') role: string,
    @Param('boardId') boardId: string,
    @Body() body: {
      active_tab_id?: string;
      sort_field?: string;
      sort_dir?: string;
      filters?: Record<string, any>;
      page_size?: number;
    },
  ) {
    const preference = await this.preferencesService.upsertPreferences(role, boardId, body);
    return { preference };
  }

  @Delete(':role')
  async clearPreferences(
    @Param('role') role: string,
    @Query('board_id') boardId?: string,
  ) {
    return this.preferencesService.clearPreferences(role, boardId);
  }
}
```

**Register in `apps/api/src/app.module.ts`:**
```typescript
import { PreferencesModule } from './preferences/preferences.module';
// Add to imports array: PreferencesModule,
```

---

## ✋ Phase 4 Verification Checkpoint

**Check the session restore flow in the website before moving to Phase 5.**

### 4-A: Last-viewed board is remembered
1. Open the website and navigate to the **Enterprise** board. Click around — open a tab, sort a column.
2. Close the browser tab entirely (or hard-refresh).
3. Reopen the website.
4. **Verify:** The app opens directly on the Enterprise board (not defaulting to Commercial), on the same tab you were on, with the same column sort.

### 4-B: Different roles remember different boards
1. Switch your session role to **Manager** (via the role switcher in the UI).
2. Navigate to the **SMB** board.
3. Switch role back to **Rep**.
4. Switch role to **Manager** again.
5. **Verify:** Manager lands back on the SMB board. Rep lands on whichever board the rep last visited (not SMB).

### 4-C: Sort and tab state persists
1. On any board, click a column header to sort by `ARR` descending.
2. Click the second tab (e.g. `Renewals`).
3. Refresh the page.
4. **Verify:** The board reloads on the `Renewals` tab with the ARR descending sort still applied.

---

## Phase 5 — Multi-Field CRM Filters + Filter State (BF-17)
**Effort:** Medium · **Risk:** Medium
**Features:** BF-17 (fully — was 65%)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 4 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-22 | ✅ Complete | 100% | Full `preferences` module with GET/PUT/DELETE endpoints; session fully persisted |
> | BF-10 | ✅ Complete | 100% | Last-viewed board and state restored via `GET /preferences/:role/last-board` |

> Depends on Phase 4. PreferencesModule must be registered.

---

### 5-A · Add Generic CRM Filter Params to `GET /accounts`

**File:** `apps/api/src/accounts/accounts.service.ts`

Extend `AccountQueryParams`:
```typescript
interface AccountQueryParams {
  // ...existing fields...
  filter_industry?: string;
  filter_segment?: string;
  filter_type?: string;
  filter_country?: string;
}
```

In `getAccounts()`, after the rep_id filter block:
```typescript
if (params.filter_industry) query = query.eq('industry', params.filter_industry);
if (params.filter_segment)  query = query.eq('segment', params.filter_segment);
if (params.filter_type)     query = query.eq('type', params.filter_type);
if (params.filter_country)  query = query.eq('country', params.filter_country);
```

**File:** `apps/api/src/accounts/accounts.controller.ts` — add new query params:
```typescript
@Get()
async getAccounts(
  // ...existing params...
  @Query('filter_industry') filter_industry?: string,
  @Query('filter_segment')  filter_segment?: string,
  @Query('filter_type')     filter_type?: string,
  @Query('filter_country')  filter_country?: string,
  @Query('session_role')    sessionRole?: string,   // for auto-save
) { ... }
```

---

### 5-B · Auto-Persist Filter/Sort State via Preferences

**File:** `apps/api/src/accounts/accounts.module.ts`:
```typescript
import { PreferencesModule } from '../preferences/preferences.module';
@Module({ imports: [PreferencesModule], ... })
```

**File:** `apps/api/src/accounts/accounts.controller.ts`

Inject `PreferencesService` and fire-and-forget save on each request:
```typescript
constructor(
  private readonly accountsService: AccountsService,
  private readonly preferencesService: PreferencesService,
) {}
```

At end of `getAccounts()` handler, before returning:
```typescript
if (sessionRole && board_slug) {
  this.preferencesService.upsertPreferences(sessionRole, board_slug, {
    sort_field,
    sort_dir,
    filters: { rep_id, period, filter_industry, filter_segment, filter_type, filter_country },
  }).catch(() => {});   // non-blocking
}
```

---

## ✋ Phase 5 Verification Checkpoint

**Check filter behaviour in the website before moving to Phase 6.**

### 5-A: Individual CRM field filters work
1. Open the **Commercial** board.
2. Look for a filter bar or filter dropdown above the account table.
3. Apply an **Industry** filter (e.g. `Software`).
4. **Verify:** The account list narrows to only accounts in that industry.
5. Clear it, then apply a **Segment** filter (e.g. `Mid-Market`).
6. **Verify:** List narrows again to only that segment.

### 5-B: Combining filters works
1. With the **Segment** filter set to `Enterprise`, also apply **Type** = `Customer`.
2. **Verify:** The list shows only accounts that are both Enterprise AND Customer — fewer results than either filter alone.

### 5-C: Active filters are remembered across page reload
1. Apply a segment filter and a sort (e.g. sort by ARR descending).
2. Refresh the browser.
3. **Verify:** The same filter and sort are still active after reload — the board did not reset to the unfiltered default.

---

## Phase 6 — CRM Sync Gaps (BF-08)
**Effort:** Medium · **Risk:** Medium
**Features:** BF-08 (75% → ~95%)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 5 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-17 | ✅ Complete | 100% | `filter_industry`, `filter_segment`, `filter_type`, `filter_country` params added; filter state auto-saved to preferences |

> Independent of Phases 4–5. Can be worked in parallel.

---

### 6-A · Map HubSpot Owner ID → `assigned_rep_id` During Sync

**File:** `apps/api/src/sync/sync.service.ts`

Add to class:
```typescript
private readonly ownerRepMap: Record<string, string> = (() => {
  try {
    return process.env.HUBSPOT_OWNER_MAP
      ? JSON.parse(process.env.HUBSPOT_OWNER_MAP) : {};
  } catch { return {}; }
})();
```

In `syncCompanies()` row mapping, change:
```typescript
// Before:
assigned_rep_id: null,
// After:
assigned_rep_id: this.ownerRepMap[c.properties.hubspot_owner_id || ''] || null,
```

**In `.env.local`:**
```
HUBSPOT_OWNER_MAP={"<hubspot_owner_id_1>":"rep_01","<hubspot_owner_id_2>":"rep_02","<hubspot_owner_id_3>":"rep_03"}
```

To find HubSpot owner IDs: HubSpot → Settings → Users & Teams → click a user → check the URL.

---

### 6-B · Expose Owner Map Status in Sync Status Response

**File:** `apps/api/src/sync/sync.service.ts` — `getStatus()`:
```typescript
getStatus() {
  // ...existing logic...
  return {
    last_sync: this.lastSync,
    next_sync_in_seconds: nextSyncInSeconds,
    is_syncing: this.isSyncing,
    owner_map_loaded: Object.keys(this.ownerRepMap).length > 0,
    mapped_owner_count: Object.keys(this.ownerRepMap).length,
  };
}
```

---

## ✋ Phase 6 Verification Checkpoint

**Check CRM sync results in the website before moving to Phase 7.**

### 6-A: Account owners show rep names, not HubSpot IDs
1. Open any board and look at the **Owner** column on the account rows.
2. **Verify:** Owner values show names like `Sarah Mitchell` or `rep_01` — not a raw numeric HubSpot owner ID (e.g. not `54321987`).
3. If they were showing raw IDs before this phase, confirm they now resolve correctly after a sync.

### 6-B: Sync runs without errors
1. As an Admin, trigger a manual sync from the settings or admin panel (if the UI exposes it).
2. Alternatively, wait for the automatic 5-minute sync to fire.
3. **Verify:** After the sync, accounts still load normally. No 500 errors. Owner names still display.
4. Open **Supabase Studio** → `crm_companies` table → check a few rows. The `assigned_rep_id` column should contain values like `rep_01`, not blank or a long number.

### 6-C: Real-time webhook update (optional — requires ngrok)
1. Make a small change to a company's field in **HubSpot** directly (e.g. change the Industry).
2. Wait a few seconds (HubSpot fires the webhook automatically).
3. Refresh the board in the website.
4. **Verify:** The changed field value is reflected in the board without needing a manual sync.

---

## Phase 7 — RBAC Enforcement Guards (BF-06)
**Effort:** Medium–High · **Risk:** Medium
**Features:** BF-06 (40% → ~90%)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 6 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-08 | ✅ Complete | 95% | `assigned_rep_id` now mapped from `HUBSPOT_OWNER_MAP`; owner map status exposed in sync status |

> Run after Phases 1–6 are complete and all endpoints are stable.

---

### 7-A · Create `RolesGuard` + `RequireRoles` Decorator

**File:** `apps/api/src/config/roles.guard.ts` (new file)

```typescript
import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY, [context.getHandler(), context.getClass()]
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const role = ((req.headers['x-session-role'] as string) || 'rep').toLowerCase().trim();

    if (!required.includes(role)) {
      throw new ForbiddenException({
        role_provided: role,
        roles_required: required,
        message: `Role '${role}' is not permitted for this action`,
      });
    }
    return true;
  }
}
```

---

### 7-B · Apply `@RequireRoles` to Sensitive Endpoints

**`boards.controller.ts`:**
```typescript
import { RequireRoles } from '../config/roles.guard';

@Post()               @RequireRoles('admin', 'manager')   createBoard()
@Put(':slug')         @RequireRoles('admin', 'manager')   updateBoard()
@Post(':slug/duplicate') @RequireRoles('admin', 'manager') duplicateBoard()
@Delete(':slug')      @RequireRoles('admin')               deleteBoard()
@Post(':slug/columns') @RequireRoles('admin', 'manager')  addColumn()
@Put(':slug/columns/:colId') @RequireRoles('admin', 'manager') updateColumn()
@Delete(':slug/columns/:colId') @RequireRoles('admin')    deleteColumn()
@Patch(':slug/brief-config') @RequireRoles('admin', 'manager') updateBriefConfig()
```

**`edits.controller.ts`:**
```typescript
@Patch('supplementary/:id') @RequireRoles('admin', 'manager')  editSupplementary()
@Patch('company/:id')        @RequireRoles('rep', 'manager', 'admin') editCompany()
@Patch('deal/:id')           @RequireRoles('rep', 'manager', 'admin') editDeal()
```

**`sync.controller.ts`:**
```typescript
@Post('trigger') @RequireRoles('admin')  triggerSync()
```

---

### 7-C · Register Guard Globally

**`apps/api/src/app.module.ts`:**
```typescript
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './config/roles.guard';

providers: [
  AppService,
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

---

## ✋ Phase 7 Verification Checkpoint

**Switch between roles in the website and verify access is correctly restricted.**

### 7-A: Rep cannot create or delete boards
1. Switch your session to **Rep** role using the role switcher.
2. Go to the boards list page.
3. **Verify:** There is no **Create Board** button visible, or clicking it shows an access-denied message.
4. On an existing board, look for a **Delete Board** option.
5. **Verify:** The option is either hidden or clicking it shows a permissions error.

### 7-B: Manager can create boards but cannot delete them
1. Switch to **Manager** role.
2. Click **Create Board** and go through the wizard.
3. **Verify:** The wizard completes successfully and the board is created.
4. Now try to **Delete** a board.
5. **Verify:** The delete option is blocked or shows a permissions error (only Admin can delete).

### 7-C: Rep cannot edit Manager Notes
1. Switch to **Rep** role.
2. Open any account panel.
3. Look for the **Manager Note** field.
4. **Verify:** The field is read-only or the edit icon is hidden. Attempting to edit it shows a permissions error.
5. Switch to **Manager** role and try the same thing.
6. **Verify:** Manager can successfully edit and save the Manager Note.

### 7-D: Only Admin can trigger sync
1. Switch to **Manager** role.
2. Go to the admin / settings area and look for **Sync Now** or **Force Sync**.
3. **Verify:** The button is either hidden or clicking it shows a permissions error.
4. Switch to **Admin** and do the same.
5. **Verify:** Admin can trigger the sync successfully.

---

## Phase 8 — AI Response Streaming (BF-13)
**Effort:** Medium · **Risk:** Low
**Features:** BF-13 streaming gap (fully closed)

> ✏️ **Update `backend_features_audit.md` before starting this phase** (Phase 7 is verified):
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-06 | ✅ Complete | 90% | `RolesGuard` enforced globally; `RequireRoles` decorator applied to boards, edits, sync endpoints |

> FastAPI only. Independent of all other phases.

---

### 8-A · Add `/ai/chat/stream` SSE Endpoint

**File:** `services/ai/main.py`

Add import at top:
```python
from fastapi.responses import StreamingResponse
```

Add streaming generator after `call_groq`:
```python
async def stream_groq_tokens(messages: list):
    """Async generator — yields SSE data lines from Groq streaming API."""
    if not GROQ_API_KEY:
        yield 'data: {"token":"[AI not configured — set GROQ_API_KEY]"}\n\n'
        yield "data: [DONE]\n\n"
        return

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST", GROQ_BASE_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": messages,
                  "max_tokens": 1024, "temperature": 0.3, "stream": True},
        ) as response:
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[6:]
                if chunk.strip() == "[DONE]":
                    yield "data: [DONE]\n\n"
                    return
                try:
                    data = json.loads(chunk)
                    token = data["choices"][0]["delta"].get("content", "")
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"
                except (json.JSONDecodeError, KeyError, IndexError):
                    pass
```

Add the new endpoint (keep existing `/ai/chat` untouched):
```python
@app.post("/ai/chat/stream")
async def chat_stream(req: ChatRequest):
    """Streaming Q&A via Server-Sent Events. Yields: data: {"token":"..."} ... data: [DONE]"""
    ctx = build_context(req.company_hubspot_id, "entire_account", 0)
    context_text = format_context_for_prompt(ctx)

    messages = [{"role": "system", "content": f"{CHAT_SYSTEM_PROMPT}\n\nACCOUNT CONTEXT:\n{context_text}"}]
    for turn in (req.conversation_history or [])[-6:]:
        messages.append(turn)
    messages.append({"role": "user", "content": req.message})

    return StreamingResponse(
        stream_groq_tokens(messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
```

---

## ✋ Phase 8 Verification Checkpoint — FINAL

**Check that AI chat streams responses live in the website.**

### 8-A: Chat response streams word by word
1. Open any account's detail panel.
2. Go to the **Ask Anything** / chat panel.
3. Type a question and submit it (e.g. `"Give me a 2-sentence summary of this account"`).
4. **Verify:** The response text appears **progressively** — words or phrases appear one after another as they stream in, rather than the entire reply appearing all at once after a pause. You should visibly see the text grow.

### 8-B: Non-streaming chat still works
1. If the UI has a toggle between streaming and non-streaming mode, switch to non-streaming.
2. Ask another question.
3. **Verify:** The full reply appears at once (no partial rendering). The response still shows correctly.

### 8-C: Streaming works for follow-up questions
1. Ask a follow-up question in the same chat session (e.g. `"What should I do next?"`).
2. **Verify:** The follow-up also streams correctly. Prior conversation context is maintained — the answer references the account, not a generic response.

---

## Full Summary

| Phase | Features Closed | Effort | Key Constraint |
|-------|----------------|--------|----------------|
| P1 | BF-07 (dup), BF-09 (errors), BF-12 (prompt), BF-13 (citations) | Very Low | None |
| P2 | BF-15 (21d window), BF-16 (dates+pages), BF-18 (panel+link), BF-21 (sparklines) | Low | None |
| P3 | BF-01 (aggr_method), BF-03 (col_type), BF-05 (date field) | Low + SQL | Run migration first |
| P4 | BF-22 (session API), BF-10 (last_viewed) | Medium | P3 done |
| P5 | BF-17 (multi-field filters + state) | Medium | P4 done |
| P6 | BF-08 (owner map, webhook logging) | Medium | Parallel OK |
| P7 | BF-06 (RBAC guards) | Med–High | P1–P6 stable |
| P8 | BF-13 (SSE streaming) | Medium | Independent |

**Projected final score: ~97% (up from 77%)**

> ✏️ **After Phase 8 is verified — final audit update:**
> | Feature | New Status | New % | Note |
> |---------|-----------|-------|------|
> | BF-13 | ✅ Complete | 100% | `/ai/chat/stream` SSE endpoint added; citations populated; non-streaming endpoint untouched |
