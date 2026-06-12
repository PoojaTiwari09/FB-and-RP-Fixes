import axios from 'axios';

async function test(headers: Record<string, string>, label: string) {
  console.log(`\n=== Testing ${label} ===`);
  try {
    const tasksRes = await axios.get('http://localhost:3001/api/v1/sales-engagement/tasks', { headers });
    const summaryRes = await axios.get('http://localhost:3001/api/v1/sales-engagement/tasks/summary', { headers });
    console.log('Tasks Count:', tasksRes.data.data ? tasksRes.data.data.length : tasksRes.data.length);
    console.log('Summary:', summaryRes.data.data || summaryRes.data);
    if (tasksRes.data.data) {
      console.log('Task list details:', tasksRes.data.data.map((t: any) => ({
        taskId: t.taskId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        isOverdue: t.isOverdue,
        contactName: t.contactName
      })));
    }
  } catch (err: any) {
    console.error('Error:', err.message, err.response?.data);
  }
}

async function main() {
  // 1. Default fallback headers
  await test({
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'x-user-id': '00000000-0000-0000-0000-000000000003',
    'x-user-role': 'SALES_REP'
  }, 'Fallback/Anonymous Rep (Sarah Chen/Unknown)');
}

main();
