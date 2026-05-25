import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M10DataComplianceWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
