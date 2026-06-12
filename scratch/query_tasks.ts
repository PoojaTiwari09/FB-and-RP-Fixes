import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@rri/database';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`--- DB Users: ${users.length} ---`);
  users.forEach(u => {
    console.log({ id: u.id, name: u.name, role: u.role, email: u.email, tenantId: u.tenantid });
  });

  const tenants = await prisma.tenant.findMany();
  console.log(`--- DB Tenants: ${tenants.length} ---`);
  tenants.forEach((t: any) => {
    console.log({ id: t.id, name: t.name, slug: t.slug });
  });

  const tasks = await prisma.engageTask.findMany();
  console.log(`--- DB Tasks: ${tasks.length} ---`);
  tasks.forEach(t => {
    console.log({
      taskId: t.taskId,
      contactName: t.contactName,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      assigneeId: t.assigneeId,
      assigneeName: t.assigneeName,
      tenantId: t.tenantid
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
