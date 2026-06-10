import { CallAiPipelineService } from './call-ai-pipeline.service';
interface TranscriptionCompletedPayload {
    eventId: string;
    version: string;
    occurredAt: string;
    tenantId: string;
    callId: string;
}
export declare class AiExtractionSubscriber {
    private readonly pipeline;
    private readonly logger;
    constructor(pipeline: CallAiPipelineService);
    handleTranscriptionCompleted(payload: TranscriptionCompletedPayload): Promise<void>;
    handleLegacy(payload: TranscriptionCompletedPayload): Promise<void>;
}
export {};
