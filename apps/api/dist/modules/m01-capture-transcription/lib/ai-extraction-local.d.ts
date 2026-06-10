import type { HighlightsResult, SummarizeResult, TalkRatioResult, UtterancePayload } from '../services/ai-extraction.client';
export declare function computeTalkRatioLocal(utterances: UtterancePayload[]): TalkRatioResult;
export declare function summarizeLocal(fullText: string): SummarizeResult;
export declare function extractHighlightsLocal(utterances: UtterancePayload[]): HighlightsResult;
