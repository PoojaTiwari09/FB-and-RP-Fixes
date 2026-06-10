export interface RedactionResult {
    redactedText: string;
    originalText: string;
    wasRedacted: boolean;
    redactedTypes: string[];
}
export declare class PiiRedactionService {
    private readonly logger;
    redact(text: string): RedactionResult;
    redactUtterances<T extends {
        text: string;
    }>(utterances: T[]): Array<T & {
        originalText: string;
    }>;
}
