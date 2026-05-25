import { PrismaClient } from '@prisma/client';
import { M06ForecastingPredictionService } from '../services/m06.service';

const prisma = new PrismaClient();

async function main() {
  const service = new M06ForecastingPredictionService(prisma as any, null as any);
  
  try {
    await service.createDeal('demo-tenant-01', {
      dealName: 'Test Deal Priya',
      stage: 'Proposal',
      amount: 1000000,
      closeDate: '2026-06-15T00:00:00Z',
      probability: 50,
      region: 'EMEA',
      lob: 'Enterprise Software',
      repUserId: 'rep-02'
    });
    console.log("Deal created successfully");
  } catch(e) {
    console.error("Error creating deal:", e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
