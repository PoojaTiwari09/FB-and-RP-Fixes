type Utterance = {
    speaker?: string;
    text?: string;
    startMs?: number;
    endMs?: number;
};
type Highlight = {
    label?: string;
    text?: string;
    timestampMs?: number;
    speaker?: string;
};
type TranscriptLike = {
    fullText?: string;
    summary?: string;
    utterances?: Utterance[];
    keyHighlights?: Highlight[];
    nextSteps?: string[];
    talkRatio?: Record<string, {
        percentage?: number;
    } | number>;
};
export type GeneratedReviewQuestion = {
    questionText: string;
    managerAnswer: 'Yes' | 'Partial' | 'No';
    score: number;
    maxScore: number;
    managerComments: string;
    aiSuggestion: string;
    transcriptTimestamp: string;
};
export type GeneratedReviewSection = {
    sectionName: string;
    sectionScore: number;
    questions: GeneratedReviewQuestion[];
};
export type GeneratedReview = {
    scorecardName: string;
    scorecardVersion: string;
    reviewedBy: {
        name: string;
        role: string;
    };
    reviewDate: string;
    overallScore: number;
    status: string;
    sections: GeneratedReviewSection[];
};
export declare function buildReviewFromTranscript(record: {
    title?: string;
    callType?: string;
    callDate?: Date | string;
    updatedAt?: Date | string;
    callOwner?: string;
    transcript?: TranscriptLike | null;
    transcriptStatus?: string;
}): GeneratedReview | null;
export {};
