const baseUrl = 'http://localhost:3001';
const tenantId = '00000000-0000-0000-0000-000000000001';
const managerUserId = '00000000-0000-0000-0000-000000000002'; // Manager

const managerHeaders = {
  'x-tenant-id': tenantId,
  'x-user-id': managerUserId,
  'x-user-role': 'sales_manager',
  'Content-Type': 'application/json'
};

async function createAndVerify() {
  try {
    const payload = {
      taskType: 'email',
      title: 'High Priority Test Task',
      linkedToId: 'contact-001',
      linkedToType: 'contact',
      dueDate: '2026-06-12',
      dueTime: '05:00 PM',
      description: 'Test high priority task',
      assigneeId: managerUserId,
      priority: 'HIGH'
    };

    console.log('Sending POST to create task...');
    const createRes = await fetch(`${baseUrl}/api/v1/sales-engagement/tasks`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify(payload)
    });
    const createData = await createRes.json();
    console.log('Create Response:', createData);

    if (createData.success && createData.data) {
      const createdId = createData.data.taskId || createData.data.id;
      console.log(`Created Task ID: ${createdId}`);

      console.log('\nFetching manager tasks to see where it lands...');
      const mgrRes = await fetch(`${baseUrl}/api/v1/sales-engagement/manager/tasks?assigneeId=me&tab=today&channel=all&groupBy=none&sortBy=due_date`, { headers: managerHeaders });
      const mgrData = await mgrRes.json();
      if (mgrData.success) {
        mgrData.data.groups.forEach(g => {
          console.log(`Group: "${g.groupLabel}"`);
          const found = g.tasks.find(t => (t.id === createdId || t.taskId === createdId));
          if (found) {
            console.log(`  -> FOUND in "${g.groupLabel}":`, found);
          }
        });
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createAndVerify();
