import { PrismaClient } from '../packages/database/node_modules/.prisma/client';
const p = new PrismaClient();
async function main() {
  const tasks = await p.engageTask.findMany({ select: { taskId: true }, orderBy: { createdAt: 'asc' } });
  console.log('ALL TASK IDs IN DB:');
  tasks.forEach(t => console.log(`  '${t.taskId}'`));
  console.log(`Total: ${tasks.length}`);
}
main().finally(() => p.$disconnect());
