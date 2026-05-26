import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { M06ForecastingPredictionService } from '../services/m06.service';

const M06_RECALC_DELAY_MS = 5000;
const M06_RECALC_LIMIT_MINUTES = 60;

@Processor('m06-queue')
export class M06ForecastingPredictionWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastingService: M06ForecastingPredictionService
  ) {
    super();
  }

  async process(job: Job) {
    console.log(`Processing job in module M-06`, job.id);
    const { tenantId, periodId, event } = job.data;

    if (event !== 'deal.stage.changed') return;

    // Feature 7: Rate limiting
    const lastSnapshot = await this.prisma.aiForecastSnapshot.findFirst({
      where: { tenantId, periodId },
      orderBy: { computedAt: 'desc' }
    });

    if (lastSnapshot) {
      const minutesSinceLast = (Date.now() - lastSnapshot.computedAt.getTime()) / (1000 * 60);
      if (minutesSinceLast < M06_RECALC_LIMIT_MINUTES) {
        console.log(`Recalculation skipped. Last snapshot was ${minutesSinceLast.toFixed(1)} mins ago.`);
        return;
      }
      
      // Idempotency check
      if (lastSnapshot.idempotencyKey === job.id) {
        console.log('Skipping due to idempotency key match');
        return;
      }
    }

    // Debounce simulation
    await new Promise(resolve => setTimeout(resolve, M06_RECALC_DELAY_MS));

    try {
      // Simulate getting prediction from python service
      const predictionResponse = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tenantId,
            periodId,
            openPipeline: [],
            closedWonAmount: 50000000,
            historicalRates: [],
            historicalExpectedDealRate: 0.124,
            totalAddressablePipeline: 126600000,
        })
      });

      if (!predictionResponse.ok) {
        throw new Error('Python service failed');
      }
      
      const prediction = await predictionResponse.json();

      await this.prisma.aiForecastSnapshot.create({
        data: {
          tenantId,
          periodId,
          predictedAmount: prediction.predictedAmount,
          confidenceRangeLow: prediction.confidenceRangeLow,
          confidenceRangeHigh: prediction.confidenceRangeHigh,
          modelInputs: prediction.modelInputs,
          idempotencyKey: job.id ?? crypto.randomUUID()
        }
      });
      console.log('Recalculation complete.');
    } catch (error) {
      console.error('Worker failed, re-queueing...', error);
      throw error; // Let BullMQ handle retry
    }
  }
}
