import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { M06ForecastingPredictionService } from '../services/m06.service';
import type { M06JobType } from '../services/m06-prediction-queue.service';

const M06_RECALC_LIMIT_MINUTES = 60;

@Processor('m06-queue')
export class M06ForecastingPredictionWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastingService: M06ForecastingPredictionService,
  ) {
    super();
  }

  async process(job: Job) {
    const { type, tenantId, periodId } = job.data as {
      type: M06JobType;
      tenantId: string;
      periodId: string;
      dbJobId?: string;
      submissionId?: string;
      baseline?: string;
      region?: string;
    };

    if (type === 'forecast.executive.materialize') {
      await this.materializeExecutive(job);
      return;
    }

    if (type === 'ai.prediction.run' || type === 'deal.stage.changed') {
      await this.runPrediction(job);
      return;
    }
  }

  private async runPrediction(job: Job) {
    const { tenantId, periodId, dbJobId } = job.data;

    if (dbJobId) {
      await this.prisma.m06PredictionJob.update({
        where: { id: dbJobId },
        data: { status: 'running', startedAt: new Date() },
      });
    }

    const lastSnapshot = await this.prisma.aiForecastSnapshot.findFirst({
      where: { tenantId, periodId },
      orderBy: { computedAt: 'desc' },
    });

    if (lastSnapshot) {
      const minutesSince = (Date.now() - lastSnapshot.computedAt.getTime()) / 60000;
      if (minutesSince < M06_RECALC_LIMIT_MINUTES && lastSnapshot.idempotencyKey === job.id) {
        return;
      }
    }

    try {
      const period = await this.prisma.forecastPeriod.findFirst({
        where: { id: periodId, tenantId },
      });
      if (!period) throw new Error('Period not found');

      const explainability = await this.forecastingService['buildExplainability'](
        tenantId,
        period,
        lastSnapshot?.modelInputs ?? {},
      );
      const closedWon = explainability.closedWonDetails?.total || 0;
      const weightedPipeline =
        explainability.deals?.reduce((s: number, d: any) => s + (d.contribution || 0), 0) || 0;
      const expectedDeals = (lastSnapshot?.modelInputs as any)?.expectedDeals?.contribution || 0;
      let predictedAmount = closedWon + weightedPipeline + expectedDeals;
      const spread = predictedAmount * 0.2;

      let modelInputs: any = lastSnapshot?.modelInputs ?? { source: 'worker' };
      try {
        const res = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, periodId }),
        });
        if (res.ok) {
          const prediction = await res.json();
          predictedAmount = (prediction as any).predictedAmount ?? predictedAmount;
          await this.prisma.aiForecastSnapshot.create({
            data: {
              tenantId,
              periodId,
              predictedAmount: (prediction as any).predictedAmount ?? predictedAmount,
              confidenceRangeLow: (prediction as any).confidenceRangeLow ?? predictedAmount - spread / 2,
              confidenceRangeHigh: (prediction as any).confidenceRangeHigh ?? predictedAmount + spread / 2,
              modelInputs: (prediction as any).modelInputs ?? modelInputs,
              idempotencyKey: job.id ?? randomUUID(),
            },
          });
          if (dbJobId) {
            await this.prisma.m06PredictionJob.update({
              where: { id: dbJobId },
              data: { status: 'completed', completedAt: new Date() },
            });
          }
          return;
        }
      } catch {
        /* fallback to deterministic snapshot below */
      }

      await this.prisma.aiForecastSnapshot.create({
        data: {
          tenantId,
          periodId,
          predictedAmount,
          confidenceRangeLow: Math.round(predictedAmount - spread / 2),
          confidenceRangeHigh: Math.round(predictedAmount + spread / 2),
          modelInputs,
          idempotencyKey: job.id ?? randomUUID(),
        },
      });

      if (dbJobId) {
        await this.prisma.m06PredictionJob.update({
          where: { id: dbJobId },
          data: { status: 'completed', completedAt: new Date() },
        });
      }
    } catch (err: any) {
      if (dbJobId) {
        await this.prisma.m06PredictionJob.update({
          where: { id: dbJobId },
          data: { status: 'failed', error: err?.message, completedAt: new Date() },
        });
      }
      throw err;
    }
  }

  private async materializeExecutive(job: Job) {
    const { tenantId, periodId, submissionId } = job.data;
    const idempotencyKey = `exec:${tenantId}:${periodId}:${submissionId}`;

    const existing = await this.prisma.forecastExecutiveSnapshot.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return;

    const dashboard = await this.forecastingService.getExecutiveDashboard(
      tenantId,
      undefined,
      undefined,
      periodId,
      { skipSnapshot: true },
    );

    await this.prisma.forecastExecutiveSnapshot.create({
      data: {
        tenantId,
        periodId,
        submissionId,
        payload: dashboard as any,
        idempotencyKey,
      },
    });
  }
}
