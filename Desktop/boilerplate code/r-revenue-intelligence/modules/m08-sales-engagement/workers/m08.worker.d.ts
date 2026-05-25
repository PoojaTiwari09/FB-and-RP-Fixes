import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M08SalesEngagementWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
