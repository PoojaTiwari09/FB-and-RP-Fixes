import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataCloudService } from '../services/data-cloud.service';
export declare class DataCloudWorker extends WorkerHost {
    private readonly service;
    private readonly logger;
    constructor(service: DataCloudService);
    process(job: Job): Promise<void>;
    onCompleted(job: Job): void;
    onFailed(job: Job | undefined, error: Error): void;
    onStalled(jobId: string): void;
}
