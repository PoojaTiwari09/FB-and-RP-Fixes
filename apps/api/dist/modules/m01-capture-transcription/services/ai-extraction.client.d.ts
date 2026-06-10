export interface UtterancePayload {
    speaker: string;
    text: string;
    start_ms: number;
    end_ms: number;
    sequence_index: number;
}
export interface SummarizeResult {
    summary: string;
    next_steps: string[];
    confidence_score: number;
    flagged_for_review: boolean;
}
export interface Highlight {
    label: string;
    text: string;
    timestamp_ms: number;
    speaker: string;
}
export interface HighlightsResult {
    highlights: Highlight[];
    confidence_score: number;
    flagged_for_review: boolean;
}
export interface SpeakerRatio {
    speaker: string;
    duration_ms: number;
    percentage: number;
}
export interface TalkRatioResult {
    speakers: SpeakerRatio[];
    total_duration_ms: number;
}
export declare class AiExtractionClient {
    private readonly logger;
    summarize(tenantId: string, callId: string, fullText: string, utterances: UtterancePayload[]): Promise<SummarizeResult>;
    extractHighlights(tenantId: string, callId: string, fullText: string, utterances: UtterancePayload[]): Promise<HighlightsResult>;
    computeTalkRatio(tenantId: string, callId: string, utterances: UtterancePayload[]): Promise<TalkRatioResult>;
    private post;
}
