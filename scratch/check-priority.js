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

async function checkTasks() {
  try {
    console.log('--- Fetching Representative Tasks ---');
    const repRes = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks`, { headers: defaultHeaders });
    const repData = await repRes.json();
    if (repData.success) {
      console.log(`Successfully fetched ${repData.data.length} tasks:`);
      repData.data.forEach(t => {
        console.log(`- ID: ${t.taskId || t.id}, Title: "${t.title}", Priority: "${t.priority}", Status: "${t.status}"`);
      });
    } else {
      console.log('Failed to fetch rep tasks:', repData);
    }

    console.log('\n--- Fetching Manager Tasks (Today tab) ---');
    const mgrRes = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks?assigneeId=me&tab=today&channel=all&groupBy=none&sortBy=due_date`, { headers: managerHeaders });
    const mgrData = await mgrRes.json();
    if (mgrData.success) {
      console.log(`Successfully fetched manager tasks. Groups:`);
      mgrData.data.groups.forEach(g => {
        console.log(`Group: "${g.groupLabel}" (count: ${g.count})`);
        g.tasks.forEach(t => {
          console.log(`  - ID: ${t.id || t.taskId}, Title: "${t.title}", Priority: "${t.priority}", Status: "${t.status}"`);
        });
      });
    } else {
      console.log('Failed to fetch manager tasks:', mgrData);
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
  }
}

checkTasks();
