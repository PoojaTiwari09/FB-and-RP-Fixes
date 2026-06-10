import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  const openPeriod = await prisma.forecastPeriod.findFirst({ where: { status: 'open' }});
  
  // Test rep-01
  const boardRep1 = await fetch(`http://localhost:3001/api/v1/forecasting/periods/${openPeriod?.id}/board?repUserId=rep-01`, {
    headers: { 'X-Tenant-ID': 'demo-tenant-01', 'x-user-id': 'rep-01' }
  }).then(res => res.json());

  console.log(`\n--- Rep-01 Math ---`);
  console.log(`Pipeline Deals: ${(boardRep1 as any).aiPrediction.explainability.deals.length}`);
  console.log(`Total Projected: ₹${(boardRep1 as any).aiPrediction.predictedAmount}`);

  // Test rep-02
  const boardRep2 = await fetch(`http://localhost:3001/api/v1/forecasting/periods/${openPeriod?.id}/board?repUserId=rep-02`, {
    headers: { 'X-Tenant-ID': 'demo-tenant-01', 'x-user-id': 'rep-02' }
  }).then(res => res.json());

  console.log(`\n--- Rep-02 Math ---`);
  console.log(`Pipeline Deals: ${(boardRep2 as any).aiPrediction.explainability.deals.length}`);
  console.log(`Total Projected: ₹${(boardRep2 as any).aiPrediction.predictedAmount}`);
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
