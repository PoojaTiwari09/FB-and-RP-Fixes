const { PrismaClient } = require('./index.js');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.engageTask.findMany({
    select: {
      taskId: true,
      title: true,
      contactName: true,
      companyName: true,
      assigneeId: true,
      assigneeName: true,
      status: true
    }
  });
  console.log('All Tasks in DB:', JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
