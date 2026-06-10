import { CallService } from '../services/call.service';
import { CallAiPipelineService } from '../services/call-ai-pipeline.service';
import { M01FrontendTranscriptService } from './m01-frontend-transcript.service';
export type CallProcessPhase = 'transcribing' | 'analyzing' | 'ready' | 'error';
export declare class M01FrontendCallProcessingService {
    private readonly calls;
    private readonly pipeline;
    private readonly transcriptUi;
    constructor(calls: CallService, pipeline: CallAiPipelineService, transcriptUi: M01FrontendTranscriptService);
    getStatus(callId: string, tenantId: string): Promise<{
        callId: string;
        transcriptStatus: string;
        phase: CallProcessPhase;
        utteranceCount: number;
        hasSummary: boolean;
        hasAudio: boolean;
        message: string;
    }>;
    private statusMessage;
    processCall(callId: string, tenantId: string): Promise<{
        phase: CallProcessPhase;
        transcriptStatus: string;
        message: string;
    }>;
}
