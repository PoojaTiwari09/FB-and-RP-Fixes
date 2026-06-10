/**
 * Sync manager call reviews for all 4 M01 demo calls.
 * Run: pnpm exec tsx packages/database/prisma/seed-call-reviews.ts
 */
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const DEMO_CALL_IDS = [
  '11111111-1111-1111-1111-000000000001',
  '11111111-1111-1111-1111-000000000002',
  '11111111-1111-1111-1111-000000000003',
  '11111111-1111-1111-1111-000000000004',
];

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildReview(tenantId: string, c: any, index: number) {
  const callTypes = ['Discovery', 'Demo', 'Negotiation', 'Training'];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Completed'];
  const priorities = ['High', 'Medium', 'High', 'Medium'];
  return {
    tenantId: tenantid: tenantId,
    reviewId: `rv_${String(index + 1).padStart(3, '0')}`,
    callTitle: c.title,
    scorecardName:
      index === 2 ? 'Negotiation Scorecard' : index === 3 ? 'Demo Call Scorecard' : 'Discovery Call Scorecard',
    scorecardId: index === 2 ? 'sc_03' : index === 1 ? 'sc_02' : 'sc_01',
    customer: c.accountId || 'Unknown Account',
    dateTime: c.callDate.toISOString(),
    callType: callTypes[index] ?? c.callType ?? 'Discovery',
    duration: formatMmSs(c.durationSeconds ?? 1800),
    priority: priorities[index] ?? 'Medium',
    status: statuses[index] ?? 'Pending',
    aiFlags: index === 0 ? ['High Risk Deal', 'No Next Steps'] : ['Good Rapport'],
    dueDate: new Date(Date.now() + (7 - index) * 86400000).toISOString(),
    salesRep: c.callOwner || 'Rep',
    reviewer: 'Alex Martinez',
    reviewMode: 'AI-Assisted',
    scorecardVersion: 'v2.3',
    talkRatio: { rep: 45, customer: 55 },
    sentimentSummary: 'Positive with budget caution',
    sentimentScore: 65 + index * 3,
    risksDetected: index === 2 ? ['Contract timeline', 'Budget negotiation'] : ['Budget timeline unclear'],
    keyHighlights: ['Customer asked about integration', 'Competitor mentioned'],
    aiSummary: c.transcript?.summary || 'AI summary pending.',
    quickStats: { topics: 4, actionItems: 3 },
    dealLinked: `${c.accountId || 'Account'} — Q2 Initiative`,
    hasReview: true,
    questions: [],
    feedback: {},
  };
}

async function main() {
  const calls = await prisma.callRecord.findMany({
    where: { tenantid: TENANT_ID, id: { in: DEMO_CALL_IDS }, transcriptStatus: 'completed' },
    orderBy: { id: 'asc' },
    include: { transcript: true },
  });

  console.log(`Seeding ${calls.length} call reviews for`, TENANT_ID);

  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    const payload = buildReview(TENANT_ID, c, i);
    await prisma.callReview.upsert({
      where: { reviewId: payload.reviewId },
      update: {
        callTitle: payload.callTitle,
        customer: payload.customer,
        dateTime: payload.dateTime,
        salesRep: payload.salesRep,
        duration: payload.duration,
        aiSummary: payload.aiSummary,
        callType: payload.callType,
        priority: payload.priority,
      },
      create: payload,
    });
    console.log(`  ${payload.reviewId} — ${payload.callTitle}`);
  }

  const count = await prisma.callReview.count({ where: { tenantid: TENANT_ID } });
  console.log(`Done (${count} call reviews)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
