import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
export type M06JobType = 'ai.prediction.run' | 'forecast.executive.materialize' | 'deal.stage.changed';
export declare class M06PredictionQueueService {
    private readonly queue;
    private readonly prisma;
    private readonly logger;
    constructor(queue: Queue, prisma: PrismaService);
    enqueuePrediction(tenantId: string, periodId: string, trigger: string, opts?: {
        baseline?: string;
        region?: string;
        submissionId?: string;
    }): Promise<{
        jobId: string;
        status: string;
    }>;
    enqueueExecutiveMaterialize(tenantId: string, periodId: string, submissionId: string, payload?: Record<string, unknown>): Promise<void>;
    getLatestJob(tenantId: string, periodId: string): Promise<{
        error: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        completedAt: Date | null;
        idempotencyKey: string;
        periodId: string;
        trigger: string;
        startedAt: Date | null;
    }>;
}
