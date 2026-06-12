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
  console.log('Querying task.findMany...');
  try {
    const tasks = await prisma.task.findMany();
    console.log(`Success! Found ${tasks.length} tasks.`);
  } catch (err) {
    console.error('task.findMany error:', err);
  }

  console.log('Querying engageTask.findMany...');
  try {
    const engageTasks = await prisma.engageTask.findMany();
    console.log(`Success! Found ${engageTasks.length} engageTasks.`);
  } catch (err) {
    console.error('engageTask.findMany error:', err);
  }

  console.log('Attempting task.create...');
  try {
    const newTask = await prisma.task.create({
      data: {
        tenantid: '00000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000003',
        type: 'EMAIL',
        description: 'Test manual task creation',
        dueDate: new Date(),
        priority: 2,
        source: 'manual',
        status: 'pending',
      }
    });
    console.log('Success! Created task:', newTask);
  } catch (err) {
    console.error('task.create error:', err);
  }
}

test();
