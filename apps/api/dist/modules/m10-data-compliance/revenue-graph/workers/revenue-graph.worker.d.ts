import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RevenueGraphService } from '../services/revenue-graph.service';
export declare class RevenueGraphWorker extends WorkerHost {
    private readonly service;
    private readonly logger;
    constructor(service: RevenueGraphService);
    process(job: Job): Promise<void>;
    onCompleted(job: Job): void;
    onFailed(job: Job | undefined, error: Error): void;
    onStalled(jobId: string): void;
}
