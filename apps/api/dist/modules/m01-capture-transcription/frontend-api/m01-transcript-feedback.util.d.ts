type Highlight = {
    label?: string;
    text?: string;
};
export type GeneratedFeedback = {
    tags: string[];
    strengths: string[];
    improvementAreas: string[];
    coachingNotes: string;
    recommendedActions: string[];
    acknowledgement: {
        isAcknowledged: boolean;
        acknowledgedAt: string | null;
        repResponse: string | null;
    };
    actionItems: Array<{
        id: string;
        title: string;
        description: string;
        dueDate: string;
        assignedBy: string;
        status: string;
        notes: string;
    }>;
};
export declare function buildFeedbackFromTranscript(record: {
    id?: string;
    callOwner?: string;
    transcript?: {
        summary?: string;
        keyHighlights?: Highlight[];
        nextSteps?: string[];
    } | null;
    transcriptStatus?: string;
}): GeneratedFeedback | null;
export {};
