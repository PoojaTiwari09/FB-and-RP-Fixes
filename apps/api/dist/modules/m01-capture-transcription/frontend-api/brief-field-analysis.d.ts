type Highlight = {
    label?: string;
    text?: string;
    description?: string;
    timestampMs?: number;
    speaker?: string;
};
export declare function deriveCustomerNeeds(highlights: Highlight[], summary: string): {
    title: string;
    description: string;
}[];
export declare function deriveRisks(highlights: Highlight[], summary: string): {
    title: string;
    description: string;
    severity: string;
}[];
type UtteranceRow = {
    speaker?: string;
    text?: string;
    startMs?: number;
    endMs?: number;
};
export declare function deriveKeyDiscussionPointsFromUtterances(utterances: UtteranceRow[], highlights: Highlight[]): {
    timestamp: string;
    description: string;
}[];
export declare function deriveStakeholdersFromCall(participants: string[] | null | undefined, utterances: UtteranceRow[], account: string): {
    name: string;
    title: string;
    company: string;
    avatarInitials: string;
}[];
export {};
