import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { M08SalesEngagementService } from '../services/m08.service';
export declare class M08SalesEngagementWorker extends WorkerHost {
    private readonly service;
    constructor(service: M08SalesEngagementService);
    process(job: Job<any, any, string>): Promise<any>;
}
