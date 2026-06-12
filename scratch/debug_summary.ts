import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@rri/database';
const prisma = new PrismaClient();

async function testUser(userId: string, userRole: string, label: string) {
  console.log(`\n=== New Calculation: ${label} ===`);
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const date = '2026-06-12';

  const assigneeId = (userRole === 'SALES_REP' || userRole === 'sales_rep') ? userId : 'all';
  const whereClause: any = { tenantid: tenantId };
  if (assigneeId !== 'all') {
    whereClause.assigneeId = { in: [assigneeId, 'me'] };
  }

  const rawTasks = await prisma.engageTask.findMany({ where: whereClause });
  const now = new Date();

  const isCurrentlySnoozed = (t: any) => {
    if (!t.snoozedUntil) return false;
    return new Date(t.snoozedUntil) > now;
  };

  const activeList = rawTasks.filter((t: any) => !isCurrentlySnoozed(t));

  // New logic for todayTasks
  const todayTasks = rawTasks.filter((t: any) => {
    if (isCurrentlySnoozed(t)) return false;
    const isDueTodayOrOverdue = t.dueDate && t.dueDate <= date;
    const isHighPriority = t.priority && t.priority.toLowerCase() === 'high';
    return isDueTodayOrOverdue || isHighPriority;
  });

  const completedToday = todayTasks.filter((t: any) => t.status.toLowerCase() === 'completed').length;
  const totalToday = todayTasks.length;
  const highPriorityRemaining = todayTasks.filter((t: any) => t.priority.toLowerCase() === 'high' && t.status.toLowerCase() !== 'completed').length;
  const atRisk = activeList.filter((t: any) => t.isAtRisk && t.status.toLowerCase() !== 'completed').length;
  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  console.log({
    totalToday,
    completedToday,
    atRisk,
    highPriorityRemaining,
    completionPercentage,
    headerAlert: `${highPriorityRemaining} high-priority deals need attention today — ${atRisk} at risk of slipping`
  });
}

async function main() {
  await testUser('00000000-0000-0000-0000-000000000003', 'SALES_REP', 'Fallback Rep');
  await testUser('22222222-2222-2222-2222-222222222222', 'SALES_REP', 'Alex Morgan (as Rep)');
  await testUser('33333333-3333-3333-3333-333333333333', 'SALES_REP', 'Sarah Chen (as Rep)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
