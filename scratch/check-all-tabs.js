const baseUrl = 'http://localhost:3001';
const tenantId = '00000000-0000-0000-0000-000000000001';
const managerUserId = '00000000-0000-0000-0000-000000000002'; // Manager

const managerHeaders = {
  'x-tenant-id': tenantId,
  'x-user-id': managerUserId,
  'x-user-role': 'sales_manager',
  'Content-Type': 'application/json'
};

const tabs = ['today', 'inProgress', 'upcoming', 'completed', 'snoozed'];

async function checkAllTabs() {
  for (const tab of tabs) {
    console.log(`\n--- Fetching Manager Tasks (${tab}) ---`);
    const mgrRes = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks?assigneeId=all&tab=${tab}&channel=all&groupBy=none&sortBy=due_date`, { headers: managerHeaders });
    const mgrData = await mgrRes.json();
    if (mgrData.success) {
      mgrData.data.groups.forEach(g => {
        if (g.count > 0) {
          console.log(`Group: "${g.groupLabel}" (count: ${g.count})`);
          g.tasks.forEach(t => {
            console.log(`  - ID: ${t.id || t.taskId}, Title: "${t.title}", Priority: "${t.priority}", Status: "${t.status}", DueDate: "${t.dueDate}"`);
          });
        }
      });
    } else {
      console.log(`Failed to fetch manager tasks for ${tab}:`, mgrData);
    }
  }
}

checkAllTabs();
