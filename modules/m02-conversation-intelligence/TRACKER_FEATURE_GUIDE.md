# Smart Trackers Feature - Testing Guide

## Overview
Smart Trackers automatically scan transcripts for specific keywords and log detections. This guide shows how to test the complete end-to-end functionality.

## Backend Implementation Status ✅

### 1. Detection Logic (tracker.service.ts)
- ✅ Scans transcripts for tracker keywords
- ✅ Supports speaker scope filtering (agent/customer)
- ✅ Supports timing conditions (within first X minutes, after X minutes)
- ✅ Extracts context around detected keywords
- ✅ Saves detections to database

### 2. API Endpoints (tracker.controller.ts)
- ✅ `POST /api/v1/conversation-intelligence/trackers` - Create tracker
- ✅ `GET /api/v1/conversation-intelligence/trackers` - List all trackers
- ✅ `PUT /api/v1/conversation-intelligence/trackers/:id` - Update tracker
- ✅ `DELETE /api/v1/conversation-intelligence/trackers/:id` - Delete tracker
- ✅ `GET /api/v1/conversation-intelligence/trackers/stats` - Get statistics
- ✅ `GET /api/v1/conversation-intelligence/trackers/detections` - Get all detections
- ✅ `GET /api/v1/conversation-intelligence/trackers/detections/:entityId` - Get detections for specific conversation

### 3. Integration (m02.service.ts)
- ✅ Automatic scanning on transcript upload
- ✅ Automatic scanning on transcript update

### 4. UI Components
- ✅ TrackerManagement.tsx - Create/manage trackers
- ✅ TranscriptDetailModal.tsx - Display detections in conversation details

---

## Testing Steps

### Step 1: Start the Backend API

```bash
cd r-revenue-intelligence-monorepo
pnpm run dev
```

Ensure the API is running on `http://localhost:3001`

### Step 2: Create a Tracker via API

```bash
curl -X POST http://localhost:3001/api/v1/conversation-intelligence/trackers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Competitor Mentions",
    "keywords": ["Salesforce", "HubSpot", "Gong", "Chorus"],
    "isActive": true,
    "speakerScope": "all",
    "timingCondition": null
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Competitor Mentions",
  "keywords": ["Salesforce", "HubSpot", "Gong", "Chorus"],
  "isActive": true,
  "tenantId": "00000000-0000-0000-0000-000000000001",
  "createdAt": "2026-05-25T..."
}
```

### Step 3: Upload a Transcript with Keywords

```bash
curl -X POST http://localhost:3001/api/v1/conversation-intelligence/conversations/upload \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "type": "call",
    "title": "Sales Call with Acme Corp",
    "transcript": "Agent: Hello, thanks for calling. Customer: I was looking at Salesforce and HubSpot, but I heard Gong is better. Agent: Let me tell you about our product compared to Salesforce.",
    "agentName": "John Smith",
    "customerName": "Jane Doe",
    "channel": "call",
    "diarizedTranscript": [
      {
        "speaker": "Agent",
        "text": "Hello, thanks for calling.",
        "start": 0,
        "end": 3
      },
      {
        "speaker": "Customer",
        "text": "I was looking at Salesforce and HubSpot, but I heard Gong is better.",
        "start": 3,
        "end": 10
      },
      {
        "speaker": "Agent",
        "text": "Let me tell you about our product compared to Salesforce.",
        "start": 10,
        "end": 15
      }
    ]
  }'
```

**Expected Behavior:**
- Transcript is saved to database
- Vocabulary correction runs (if rules exist)
- **Tracker scanning runs automatically**
- Detections are saved to `m02_tracker_detections` table

### Step 4: Verify Detections

```bash
curl -X GET "http://localhost:3001/api/v1/conversation-intelligence/trackers/detections/{conversation_id}?entityType=call" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001"
```

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "trackerId": "uuid",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "entityType": "call",
    "entityId": "conversation_uuid",
    "keyword": "Salesforce",
    "context": "...Salesforce and HubSpot...",
    "position": 45,
    "createdAt": "2026-05-25T...",
    "tracker": {
      "id": "uuid",
      "name": "Competitor Mentions"
    }
  },
  {
    "id": "uuid",
    "keyword": "HubSpot",
    "context": "...Salesforce and HubSpot...",
    "tracker": {
      "name": "Competitor Mentions"
    }
  },
  {
    "id": "uuid",
    "keyword": "Gong",
    "context": "...heard Gong is better...",
    "tracker": {
      "name": "Competitor Mentions"
    }
  }
]
```

### Step 5: Check Tracker Statistics

```bash
curl -X GET http://localhost:3001/api/v1/conversation-intelligence/trackers/stats \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001"
```

**Expected Response:**
```json
{
  "totalTrackers": 1,
  "activeTrackers": 1,
  "totalDetections": 3,
  "detectionsThisMonth": 3
}
```

---

## UI Testing Steps

### Step 1: Add TrackerManagement Component to Your Page

In your conversation intelligence page (e.g., `ConversationLibraryView.tsx`), add:

```tsx
import { TrackerManagement } from './TrackerManagement';

// In your component JSX, add a tab or section:
<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
  <TrackerManagement />
</div>
```

### Step 2: Test Tracker Creation in UI

1. Navigate to the Tracker Management section
2. Click "Create New Tracker"
3. Enter:
   - **Name**: "Competitor Mentions"
   - **Keywords**: "Salesforce, HubSpot, Gong, Chorus"
4. Click "Create Tracker"
5. Verify the tracker appears in the list with "Active" status

### Step 3: Upload Transcript via UI

1. Navigate to the conversation library
2. Click "Upload Transcript"
3. Fill in:
   - **Type**: Call
   - **Title**: "Test Call with Competitors"
   - **Transcript**: Paste a transcript containing "Salesforce", "HubSpot", or "Gong"
   - **Agent Name**: "John"
   - **Customer Name**: "Jane"
4. Click Upload

### Step 4: View Detections in Transcript Modal

1. Click on the uploaded conversation to open the detail modal
2. Scroll to the sidebar
3. Look for "Tracker Detections" section (with Target icon)
4. Verify detections are displayed with:
   - Tracker name
   - Detected keyword
   - Context snippet
   - Detection date

---

## Advanced Testing

### Test Speaker Scope Filtering

Create a tracker with speaker scope:

```bash
curl -X POST http://localhost:3001/api/v1/conversation-intelligence/trackers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Agent Price Mentions",
    "keywords": ["price", "cost", "discount"],
    "isActive": true,
    "speakerScope": "agent"
  }'
```

Upload a transcript where both agent and customer mention "price". Only agent mentions should be detected.

### Test Timing Conditions

Create a tracker with timing condition:

```bash
curl -X POST http://localhost:3001/api/v1/conversation-intelligence/trackers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Early Objections",
    "keywords": ["too expensive", "not interested"],
    "isActive": true,
    "timingCondition": "within_first",
    "timingMinutes": 2
  }'
```

Upload a transcript with timestamps. Only keyword mentions in the first 2 minutes should be detected.

---

## Database Verification

### Check Trackers Table

```sql
SELECT * FROM m02_trackers WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
```

### Check Detections Table

```sql
SELECT 
  d.*,
  t.name as tracker_name,
  t.keywords
FROM m02_tracker_detections d
JOIN m02_trackers t ON d.tracker_id = t.id
WHERE d.tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY d.created_at DESC;
```

---

## Troubleshooting

### Issue: No detections found

**Check:**
1. Is the tracker active? (`isActive: true`)
2. Does the transcript contain the exact keyword (case-insensitive)?
3. Are the speaker scope conditions met?
4. Are the timing conditions met?

**Debug:**
```bash
# Check if tracker exists
curl -X GET http://localhost:3001/api/v1/conversation-intelligence/trackers \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001"

# Check if transcript contains keyword manually
# The detection is case-insensitive
```

### Issue: Detections not showing in UI

**Check:**
1. Are you using the correct tenant ID?
2. Is the conversation ID correct?
3. Check browser console for API errors

**Debug:**
```javascript
// In browser console
fetch('http://localhost:3001/api/v1/conversation-intelligence/trackers/detections/{id}?entityType=call', {
  headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000001' }
}).then(r => r.json()).then(console.log)
```

---

## Feature Capabilities Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Keyword Detection | ✅ | Detects exact keyword matches (case-insensitive) |
| Context Extraction | ✅ | Extracts 50 chars before/after keyword |
| Speaker Scope | ✅ | Filter by agent/customer/all |
| Timing Conditions | ✅ | Filter by time in call (within first X, after X) |
| Multiple Keywords | ✅ | One tracker can have multiple keywords |
| Multiple Trackers | ✅ | Multiple trackers can scan same transcript |
| Statistics | ✅ | Track total detections, active trackers, monthly stats |
| UI Management | ✅ | Create, edit, delete, activate/deactivate trackers |
| UI Display | ✅ | View detections in conversation detail modal |
| Automatic Scanning | ✅ | Runs on every transcript upload/update |

---

## Next Steps for Production

1. **Add Background Job**: Scan existing conversations when a new tracker is created
2. **Add Notifications**: Alert when important keywords are detected
3. **Add Export**: Export detections to CSV for analysis
4. **Add Trending**: Show detection trends over time
5. **Add Dashboard**: Visual dashboard for tracker analytics
