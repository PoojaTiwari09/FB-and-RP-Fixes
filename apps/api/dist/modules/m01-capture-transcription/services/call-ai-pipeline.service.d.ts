import { TranscriptRepository } from '../repositories/transcript.repository';
import { AiExtractorService } from './ai-extractor.service';
import { AiExtractionClient } from './ai-extraction.client';
export declare class CallAiPipelineService {
    private readonly transcripts;
    private readonly aiClient;
    private readonly aiExtractor;
    private readonly logger;
    constructor(transcripts: TranscriptRepository, aiClient: AiExtractionClient, aiExtractor: AiExtractorService);
    runForCall(tenantId: string, callId: string): Promise<void>;
    private normalizeTalkRatio;
    private runSummarize;
    private runHighlights;
    private runTalkRatio;
}
