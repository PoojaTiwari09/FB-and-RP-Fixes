import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  const q2 = await prisma.forecastPeriod.findFirst({
    where: { name: 'Q2 FY26', tenantId: TENANT_ID }
  });

  if (!q2) throw new Error("Q2 period not found");

  const deals = await prisma.crmDeal.findMany({
    where: {
      tenantId: TENANT_ID,
      closeDate: { gte: q2.startDate, lte: q2.endDate }
    }
  });

  console.log(`Found ${deals.length} deals in Q2 FY26`);

  for (const deal of deals) {
    if (!deal.repUserId) continue;

    // We will set commit = amount if stage > Discovery, best case = amount for all
    let commitVal = deal.amount * 0.8;
    if (deal.stage === 'Closed Won') commitVal = deal.amount;
    else if (deal.stage === 'Discovery') commitVal = deal.amount * 0.4;

    await prisma.forecastSubmission.create({
      data: {
        tenantId: TENANT_ID,
        periodId: q2.id,
        repUserId: deal.repUserId,
        dealId: deal.id,
        lob: 'Enterprise Software',
        commitForecast: commitVal,
        bestCaseForecast: deal.amount,
        status: 'submitted',
        version: 1,
        bestCaseState: 'editable',
        commitState: 'editable'
      }
    });
  }

  console.log("Submissions created per-deal!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
