export declare const AUDIO_2MIN = "https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3";
export declare const AUDIO_3MIN = "https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3";
export declare const AUDIO_10MIN = "https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav";
export declare const AUDIO_RESOURCES = "https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3";
export declare const DEMO_CALL_IDS: readonly ["11111111-1111-1111-1111-000000000001", "11111111-1111-1111-1111-000000000002", "11111111-1111-1111-1111-000000000003", "11111111-1111-1111-1111-000000000004"];
export type DemoUtterance = {
    speaker: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence: number;
    isLowConfidence: boolean;
    sequenceIndex: number;
};
export type DemoTranscriptBundle = {
    fullText: string;
    durationSeconds: number;
    utterances: DemoUtterance[];
    talkRatio: {
        Rep: {
            durationMs: number;
            percentage: number;
        };
        Customer: {
            durationMs: number;
            percentage: number;
        };
    };
    summary: string;
    keyHighlights: Array<{
        label: string;
        text: string;
        timestampMs: number;
        speaker: string;
    }>;
    nextSteps: string[];
};
export declare const DEMO_2MIN: DemoTranscriptBundle;
export declare const DEMO_3MIN: DemoTranscriptBundle;
export declare const DEMO_10MIN: DemoTranscriptBundle;
export declare const DEMO_RESOURCES: DemoTranscriptBundle;
