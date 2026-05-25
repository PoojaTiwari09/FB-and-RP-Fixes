import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M04DealIntelligenceWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
