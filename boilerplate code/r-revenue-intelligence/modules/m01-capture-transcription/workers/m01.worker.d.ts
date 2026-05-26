import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CallService } from '../services/call.service';
interface TranscribeJobData {
    callId: string;
    audioUrl: string;
    tenantId: string;
}
export declare class M01CaptureTranscriptionWorker extends WorkerHost {
    private readonly callService;
    private readonly logger;
    private readonly aiServiceUrl;
    constructor(callService: CallService);
    process(job: Job<TranscribeJobData>): Promise<void>;
}
export {};
