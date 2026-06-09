import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.engageTask.findMany();
  console.log('ALL TASKS IN DB COUNT:', tasks.length);
  for (const t of tasks) {
    console.log(`- taskId: ${t.taskId}, tenantId: ${t.tenantId}, title: ${t.title}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
