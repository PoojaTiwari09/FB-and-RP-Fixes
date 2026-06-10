import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();

async function resetDeals() {
  try {
    const tenantId = 'demo-tenant-01';
    
    // Delete manually added deals
    const deleted = await prisma.$executeRaw`
      DELETE FROM crm_deals 
      WHERE source = 'manual' OR "createdBy" = 'user' OR "dealName" NOT LIKE 'Historical Deal%' 
        AND "dealName" NOT IN (
          'HDFC Renewal', 'Infosys Exp.', 'Wipro Pilot', 'TCS License', 'Tata Steel CRM', 'Reliance Digital',
          'Pinnacle Corp - Renewal', 'Apex Solutions', 'ZenCloud Enterprise', 'Harman Auto Tech', 'Edelweiss Capital',
          'BlueStar Technologies', 'Meridian Logistics', 'Greenfield EMEA', 'DHL Freight Analytics'
        )
    `;
    console.log(`Deleted manual deals`);

    // Get period
    const period = await prisma.forecastPeriod.findFirst({ where: { tenantid: tenantId, status: 'open' } });
    if (!period) {
      console.log('No open period');
      return;
    }

    // Call python prediction service to recalculate AiForecastSnapshot
    const activeDeals = await prisma.crmDeal.findMany({ where: { tenantid: tenantId, isClosedWon: false, isClosedLost: false } });
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        periodId: period.id,
        openPipeline: activeDeals,
        closedWonAmount: 50000000,
        historicalRates: [],
        historicalExpectedDealRate: 0.124,
        totalAddressablePipeline: 126600000,
      })
    });

    if (response.ok) {
      const prediction = await response.json();
      await prisma.aiForecastSnapshot.create({
        data: {
          tenantid: tenantId,
          periodId: period.id,
          predictedAmount: (prediction as any).predictedAmount,
          confidenceRangeLow: (prediction as any).confidenceRangeLow,
          confidenceRangeHigh: (prediction as any).confidenceRangeHigh,
          modelInputs: (prediction as any).modelInputs,
          idempotencyKey: 'reset-' + Date.now(),
        }
      });
      console.log('Created new AI snapshot');
    } else {
      console.log('Failed to fetch from python service:', response.status);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

resetDeals();

