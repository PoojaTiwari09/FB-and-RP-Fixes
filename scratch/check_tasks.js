const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.engageTask.findMany();
  console.log(`Total tasks in DB: ${tasks.length}`);
  tasks.forEach(t => {
    console.log({
      taskId: t.taskId,
      contactName: t.contactName,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      assigneeId: t.assigneeId,
      assigneeName: t.assigneeName
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
