import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M09CoachingTrainingWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
