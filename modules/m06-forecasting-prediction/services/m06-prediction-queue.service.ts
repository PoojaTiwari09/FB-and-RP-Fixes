import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';

export type M06JobType = 'ai.prediction.run' | 'forecast.executive.materialize' | 'deal.stage.changed';

@Injectable()
export class M06PredictionQueueService {
  private readonly logger = new Logger(M06PredictionQueueService.name);

  constructor(
    @InjectQueue('m06-queue') private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async enqueuePrediction(
    tenantId: string,
    periodId: string,
    trigger: string,
    opts?: { baseline?: string; region?: string; submissionId?: string },
  ): Promise<{ jobId: string; status: string }> {
    const idempotencyKey = `pred:${tenantId}:${periodId}:${trigger}:${opts?.submissionId ?? 'none'}`;

    const existing = await this.prisma.m06PredictionJob.findUnique({
      where: { idempotencyKey },
    });
    if (existing && ['pending', 'running'].includes(existing.status)) {
      return { jobId: existing.id, status: existing.status };
    }

    const jobRecord = await this.prisma.m06PredictionJob.upsert({
      where: { idempotencyKey },
      create: {
        tenantId,
        periodId,
        status: 'pending',
        trigger,
        idempotencyKey,
      },
      update: { status: 'pending', error: null, completedAt: null },
    });

    const bullJob = await this.queue.add(
      'm06-job',
      {
        type: 'ai.prediction.run' as M06JobType,
        tenantId,
        periodId,
        trigger,
        baseline: opts?.baseline,
        region: opts?.region,
        submissionId: opts?.submissionId,
        dbJobId: jobRecord.id,
      },
      {
        jobId: idempotencyKey,
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.log(`Enqueued prediction ${bullJob.id} for period ${periodId}`);
    return { jobId: jobRecord.id, status: 'pending' };
  }

  async enqueueExecutiveMaterialize(
    tenantId: string,
    periodId: string,
    submissionId: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const idempotencyKey = `exec:${tenantId}:${periodId}:${submissionId}`;

    await this.queue.add(
      'm06-job',
      {
        type: 'forecast.executive.materialize' as M06JobType,
        tenantId,
        periodId,
        submissionId,
        payload,
      },
      {
        jobId: idempotencyKey,
        removeOnComplete: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      },
    );
  }

  async getLatestJob(tenantId: string, periodId: string) {
    return this.prisma.m06PredictionJob.findFirst({
      where: { tenantId, periodId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
