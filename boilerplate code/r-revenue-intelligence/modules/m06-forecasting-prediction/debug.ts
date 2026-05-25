import { PrismaClient } from '@prisma/client';
import { M06ForecastingPredictionService } from './services/m06.service';

const prisma = new PrismaClient();
const service = new M06ForecastingPredictionService(prisma as any, { publish: () => { } } as any);

async function run() {
  try {
    const res = await service.getAiPrediction('demo-tenant-01', 'current');
    console.log("SUCCESS:", res);
  } catch (e) {
    console.error("FAILED:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
