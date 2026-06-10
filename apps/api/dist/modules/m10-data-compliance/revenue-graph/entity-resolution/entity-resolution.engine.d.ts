export type ConfidenceLevel = 'high' | 'medium' | 'low';
export interface MatchCandidate {
    id: string;
    score: number;
    confidence: ConfidenceLevel;
    signals: string[];
    explanation?: Record<string, unknown>;
}
declare const FREE_DOMAINS: Set<string>;
export declare function normalizeEmail(email: string): string;
export declare function extractDomain(email: string): string | null;
export declare function isFreeMailDomain(domain: string): boolean;
export declare function normalizeName(name: string): string;
export declare function levenshtein(a: string, b: string): number;
export declare function stringSimilarity(a: string, b: string): number;
export declare function tokenOverlapScore(a: string, b: string): number;
export declare function combinedSimilarity(a: string, b: string): number;
export declare function scoreToConfidence(score: number, high?: number, medium?: number): ConfidenceLevel;
export declare function rankAccountCandidates(queryName: string | undefined, queryDomain: string | undefined, accounts: Array<{
    id: string;
    name: string;
    domain?: string | null;
}>, opts?: {
    minScore?: number;
    ignoredDomains?: string[];
}): MatchCandidate[];
export declare function rankContactCandidates(queryEmail: string | undefined, queryName: string | undefined, contacts: Array<{
    id: string;
    email: string;
    name?: string | null;
}>, opts?: {
    minScore?: number;
}): MatchCandidate[];
export declare function detectAmbiguity(candidates: MatchCandidate[], epsilon?: number): boolean;
export declare function pickBestCandidate(candidates: MatchCandidate[]): {
    best: MatchCandidate | null;
    ambiguous: boolean;
    rejected: MatchCandidate[];
};
export declare function inferAccountFromContacts(contacts: Array<{
    id: string;
    accountId?: string | null;
}>): string | null;
export { FREE_DOMAINS };
