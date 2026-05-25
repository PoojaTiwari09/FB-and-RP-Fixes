import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M05AccountIntelligenceWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
