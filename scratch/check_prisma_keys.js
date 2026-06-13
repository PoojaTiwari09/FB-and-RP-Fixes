import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const servicePath = path.resolve(__dirname, '../modules/m08-sales-engagement/database/prisma.service');
const { PrismaService } = require(servicePath);

const prisma = new PrismaService();

async function test() {
  const tasks = await prisma.engageTask.findMany({
    select: { taskId: true, assigneeId: true, assigneeName: true }
  });
  console.log('Engage Tasks and Assignees:', tasks);
}

test();
