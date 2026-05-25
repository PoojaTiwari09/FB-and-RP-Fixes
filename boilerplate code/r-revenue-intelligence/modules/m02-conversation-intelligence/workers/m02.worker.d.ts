import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class M02ConversationIntelligenceWorker extends WorkerHost {
    process(job: Job): Promise<void>;
}
