const baseUrl = 'http://localhost:3001';
const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000003'; // Alex Morgan (rep)
const managerUserId = '00000000-0000-0000-0000-000000000002'; // Manager

const defaultHeaders = {
  'x-tenant-id': tenantId,
  'x-user-id': userId,
  'x-user-role': 'representative',
  'Content-Type': 'application/json'
};

const managerHeaders = {
  'x-tenant-id': tenantId,
  'x-user-id': managerUserId,
  'x-user-role': 'sales_manager',
  'Content-Type': 'application/json'
};

async function runTest() {
  console.log('Starting M08 API Validation...\n');

  let testTaskId = 'task-001'; // Fallback seed task ID
  const contactId = 'contact-001'; // Seeded contact ID

  // Helper to print result
  function logResult(name, res, data) {
    const status = res.status;
    const ok = status >= 200 && status < 300;
    const indicator = ok ? '✅ SUCCESS' : '❌ FAIL';
    console.log(`[${indicator}] ${name}`);
    console.log(`  URL: ${res.url}`);
    console.log(`  Status: ${status}`);
    if (!ok) {
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    }
  }

  // Group 1: Tasks (Core Representative Routes)
  console.log('=== Group 1: Tasks (Core Representative Routes) ===');

  // 1. GET /tasks - List Tasks
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('1. GET /tasks - List Tasks', res, data);
  } catch (err) {
    console.log('❌ 1. GET /tasks - List Tasks error:', err.message);
  }

  // 2. GET /tasks/my-tasks - Rep Tasks
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/my-tasks`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('2. GET /tasks/my-tasks - Rep Tasks', res, data);
  } catch (err) {
    console.log('❌ 2. GET /tasks/my-tasks - Rep Tasks error:', err.message);
  }

  // 3. GET /tasks/overdue - Overdue Tasks
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/overdue`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('3. GET /tasks/overdue - Overdue Tasks', res, data);
  } catch (err) {
    console.log('❌ 3. GET /tasks/overdue - Overdue Tasks error:', err.message);
  }

  // 4. POST /tasks - Create Task (Manual)
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        type: 'EMAIL',
        description: 'Send proposal follow-up document',
        dueDate: '2026-06-12T10:00:00.000Z',
        priority: 2,
        source: 'manual'
      })
    });
    const data = await res.json();
    logResult('4. POST /tasks - Create Task (Manual)', res, data);
    if (data && data.success && data.data && data.data.taskId) {
      testTaskId = data.data.taskId;
      console.log(`  Captured dynamic testTaskId: ${testTaskId}`);
    } else if (data && data.success && data.data && data.data.id) {
      testTaskId = data.data.id;
      console.log(`  Captured dynamic testTaskId (id): ${testTaskId}`);
    }
  } catch (err) {
    console.log('❌ 4. POST /tasks - Create Task error:', err.message);
  }

  // 5. GET /tasks/:id - Get Task by ID
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('5. GET /tasks/:id - Get Task by ID', res, data);
  } catch (err) {
    console.log('❌ 5. GET /tasks/:id error:', err.message);
  }

  // 6. PATCH /tasks/:id/status - Update Task Status
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/status`, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify({
        status: 'completed'
      })
    });
    const data = await res.json();
    logResult('6. PATCH /tasks/:id/status - Update Task Status', res, data);
  } catch (err) {
    console.log('❌ 6. PATCH /tasks/:id/status error:', err.message);
  }

  // 7. PATCH /tasks/:id/reassign - Reassign Task (requires manager/admin role)
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/reassign`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({
        newAssigneeId: userId,
        scope: 'this_task_only',
        reason: 'Reassigning due to capacity changes'
      })
    });
    const data = await res.json();
    logResult('7. PATCH /tasks/:id/reassign - Reassign Task', res, data);
  } catch (err) {
    console.log('❌ 7. PATCH /tasks/:id/reassign error:', err.message);
  }

  console.log('\n=== Group 2: BFF Managers & Dashboard Views ===');

  // 1. GET /manager/tasks - Tasks Hub
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks?assigneeId=me&tab=today&channel=all&groupBy=none&sortBy=due_date`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('1. GET /manager/tasks - Tasks Hub', res, data);
  } catch (err) {
    console.log('❌ GET /manager/tasks error:', err.message);
  }

  // 2. GET /manager/tasks/summary - Stats Overview
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks/summary?assigneeId=me&date=2026-06-11`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('2. GET /manager/tasks/summary - Stats Overview', res, data);
  } catch (err) {
    console.log('❌ GET /manager/tasks/summary error:', err.message);
  }

  // 3. GET /manager/tasks/filters-config - Filter Dropdown Rules
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks/filters-config`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('3. GET /manager/tasks/filters-config - Filter Dropdown Rules', res, data);
  } catch (err) {
    console.log('❌ GET /manager/tasks/filters-config error:', err.message);
  }

  // 4. GET /manager/team/members - Fetch Team Reps
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/team/members`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('4. GET /manager/team/members - Fetch Team Reps', res, data);
  } catch (err) {
    console.log('❌ GET /manager/team/members error:', err.message);
  }

  // 5. GET /manager/search/linked-to - Link To Contact Search
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/search/linked-to?search=Alex`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('5. GET /manager/search/linked-to - Link To Contact Search', res, data);
  } catch (err) {
    console.log('❌ GET /manager/search/linked-to error:', err.message);
  }

  // 6. GET /manager/email-templates - Manager Email Templates
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/email-templates`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('6. GET /manager/email-templates - Manager Email Templates', res, data);
  } catch (err) {
    console.log('❌ GET /manager/email-templates error:', err.message);
  }

  // 7. GET /manager/activities/recent - Manager Interaction Auditing
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/activities/recent`, {
      method: 'GET',
      headers: managerHeaders
    });
    const data = await res.json();
    logResult('7. GET /manager/activities/recent - Manager Interaction Auditing', res, data);
  } catch (err) {
    console.log('❌ GET /manager/activities/recent error:', err.message);
  }

  console.log('\n=== Group 3: Email Composer, Outbound & GenAI ===');

  // 1. GET /tasks/:taskId/email-draft - Fetch AI Email Draft
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/email-draft`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('1. GET /tasks/:taskId/email-draft - Fetch AI Email Draft', res, data);
  } catch (err) {
    console.log('❌ GET /tasks/:taskId/email-draft error:', err.message);
  }

  // 2. GET /email-templates - Rep Email Templates
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/email-templates`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('2. GET /email-templates - Rep Email Templates', res, data);
  } catch (err) {
    console.log('❌ GET /email-templates error:', err.message);
  }

  // 3. POST /tasks/:taskId/notes - Add notes on task
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/notes`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        notes: 'Spoke to client, requested proposal update.'
      })
    });
    const data = await res.json();
    logResult('3. POST /tasks/:taskId/notes - Add notes on task', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/notes error:', err.message);
  }

  // 4. POST /tasks/:taskId/save-draft - Save Email Draft
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/save-draft`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        to: 'client@company.com',
        from: 'rep@relanto.ai',
        subject: 'Proposal details draft',
        body: 'Hi Sarah, here are the follow up details.'
      })
    });
    const data = await res.json();
    logResult('4. POST /tasks/:taskId/save-draft - Save Email Draft', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/save-draft error:', err.message);
  }

  // 5. POST /tasks/:taskId/ai-rephrase - AI Rephrase Email Body
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/ai-rephrase`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        currentBody: 'hey check this out please',
        tone: 'professional',
        contactName: 'Sarah',
        companyName: 'Acme Corp'
      })
    });
    const data = await res.json();
    logResult('5. POST /tasks/:taskId/ai-rephrase - AI Rephrase Email Body', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/ai-rephrase error:', err.message);
  }

  // 6. POST /tasks/:taskId/send-email - Dispatch Outbound Email
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/send-email`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        to: 'client@company.com',
        from: 'rep@relanto.ai',
        subject: 'Proposal Details follow-up',
        body: 'Hi Sarah, here are the follow up details we discussed on our call.'
      })
    });
    const data = await res.json();
    logResult('6. POST /tasks/:taskId/send-email - Dispatch Outbound Email', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/send-email error:', err.message);
  }

  console.log('\n=== Group 4: BFF Rep View Augmented Operations ===');

  // 1. GET /tasks/summary - Rep Dashboard Metrics
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/summary`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('1. GET /tasks/summary - Rep Dashboard Metrics', res, data);
  } catch (err) {
    console.log('❌ GET /tasks/summary error:', err.message);
  }

  // 2. GET /activity/recent - Rep Recent Activity Trail
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/activity/recent?limit=10`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('2. GET /activity/recent - Rep Recent Activity Trail', res, data);
  } catch (err) {
    console.log('❌ GET /activity/recent error:', err.message);
  }

  // 3. GET /tasks/:taskId/detail - Rep Augmented Task Detail
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/detail`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('3. GET /tasks/:taskId/detail - Rep Augmented Task Detail', res, data);
  } catch (err) {
    console.log('❌ GET /tasks/:taskId/detail error:', err.message);
  }

  // 4. GET /contacts/:contactId/details - Rep Contact Profile Lookup
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/contacts/cnt-001/details`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('4. GET /contacts/:contactId/details (as cnt-001) - Rep Contact Profile Lookup', res, data);
  } catch (err) {
    console.log('❌ GET /contacts/:contactId/details (cnt-001) error:', err.message);
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/contacts/${contactId}/details`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('4b. GET /contacts/:contactId/details (as contact-001) - Rep Contact Profile Lookup', res, data);
  } catch (err) {
    console.log('❌ GET /contacts/:contactId/details (contact-001) error:', err.message);
  }

  // 5. GET /tasks/:taskId/linkedin-draft - Rep LinkedIn Script Draft
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/linkedin-draft`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('5. GET /tasks/:taskId/linkedin-draft - Rep LinkedIn Script Draft', res, data);
  } catch (err) {
    console.log('❌ GET /tasks/:taskId/linkedin-draft error:', err.message);
  }

  // 6. GET /filters/options - Rep Filter Dropdown Rules
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/filters/options`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('6. GET /filters/options - Rep Filter Dropdown Rules', res, data);
  } catch (err) {
    console.log('❌ GET /filters/options error:', err.message);
  }

  // 7. GET /users/assignable - Get Assignable Users list
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/users/assignable`, {
      method: 'GET',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('7. GET /users/assignable - Get Assignable Users list', res, data);
  } catch (err) {
    console.log('❌ GET /users/assignable error:', err.message);
  }

  console.log('\n=== Group 5: Task Completion, Skips, Snoozes & Dismissals ===');

  // 1. POST /tasks/:taskId/mark-complete - Mark Completed
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/mark-complete`, {
      method: 'POST',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('1. POST /tasks/:taskId/mark-complete - Mark Completed', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/mark-complete error:', err.message);
  }

  // 2. POST /tasks/:taskId/skip - Skip and Defer Task
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/skip`, {
      method: 'POST',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('2. POST /tasks/:taskId/skip - Skip and Defer Task', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/skip error:', err.message);
  }

  // 3. POST /tasks/:taskId/dismiss - Remove Task permanently
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}/dismiss`, {
      method: 'POST',
      headers: defaultHeaders
    });
    const data = await res.json();
    logResult('3. POST /tasks/:taskId/dismiss - Remove Task permanently', res, data);
  } catch (err) {
    console.log('❌ POST /tasks/:taskId/dismiss error:', err.message);
  }

  // 4. PATCH /tasks/:taskId - Update/Snooze Task
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks/${testTaskId}`, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify({
        snoozedUntil: '2026-06-20T00:00:00.000Z'
      })
    });
    const data = await res.json();
    logResult('4. PATCH /tasks/:taskId - Update/Snooze Task', res, data);
  } catch (err) {
    console.log('❌ PATCH /tasks/:taskId error:', err.message);
  }

  console.log('\n=== Group 6: Health & System Diagnostics ===');

  // 1. GET /test/health - Check Backend status
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/test/health`, {
      method: 'GET'
    });
    const data = await res.json();
    logResult('1. GET /test/health - Check Backend status', res, data);
  } catch (err) {
    console.log('❌ GET /test/health error:', err.message);
  }

  // 2. POST /test/smoke - Perform Smoke diagnostics
  try {
    const res = await fetch(`${baseUrl}/api/v1/sales-engagement/test/smoke`, {
      method: 'POST'
    });
    const data = await res.json();
    logResult('2. POST /test/smoke - Perform Smoke diagnostics', res, data);
  } catch (err) {
    console.log('❌ POST /test/smoke error:', err.message);
  }
}

runTest();
