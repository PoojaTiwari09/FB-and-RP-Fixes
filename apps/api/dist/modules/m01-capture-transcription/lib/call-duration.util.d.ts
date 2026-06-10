export declare function durationSecondsFromUtterances(utterances: Array<{
    endMs?: number;
    startMs?: number;
}> | null | undefined): number;
export declare function resolveDurationSeconds(record: {
    durationSeconds?: number | null;
    transcript?: {
        utterances?: Array<{
            endMs?: number;
            startMs?: number;
        }>;
    } | null;
}): number;
export declare function uniqueSpeakersFromUtterances(utterances: Array<{
    speaker?: string;
}> | null | undefined): string[];
