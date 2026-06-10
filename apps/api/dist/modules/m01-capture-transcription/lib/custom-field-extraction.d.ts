export interface UtteranceSlice {
    text: string;
    startMs: number;
    speaker: string;
}
export interface ExtractionFieldInput {
    question: string;
    fieldLabel: string;
    fieldName: string;
    dataType: string;
    extractionHint?: string | null;
    enumOptions?: string[];
}
export interface FieldExtractionOutput {
    extractedValue: string | null;
    rawEvidence: string | null;
    evidenceTimestampMs: number | null;
    confidenceScore: number | null;
}
export declare function extractCustomField(field: ExtractionFieldInput, fullText: string, utterances: UtteranceSlice[]): FieldExtractionOutput;
