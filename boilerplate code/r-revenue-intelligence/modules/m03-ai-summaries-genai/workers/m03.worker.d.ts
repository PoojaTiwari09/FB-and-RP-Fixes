import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M03AiSummariesGenaiWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
