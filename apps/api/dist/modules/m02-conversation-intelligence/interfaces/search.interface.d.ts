import { z } from 'zod';
export interface SearchResult {
    entityId: string;
    entityType: 'call' | 'email';
    score: number;
    snippet?: string;
    title?: string;
    customerName?: string;
    agentName?: string;
    date?: string;
    duration?: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    topics?: string[];
    overallScore?: number;
    channel?: 'call' | 'email';
}
export declare class SearchQueryDto {
    query?: string;
    agent?: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    topic?: string;
    channel?: 'call' | 'email';
    page?: number;
    limit?: number;
    datePreset?: string;
    startDate?: string;
    endDate?: string;
}
export declare class SavedSearchDto {
    name: string;
    queryString?: string;
    filters?: Record<string, any>;
}
export interface DiarizedTurn {
    speaker: string;
    text: string;
    start: number;
    end: number;
}
export interface Scorecard {
    greeting: number;
    problemUnderstanding: number;
    productExplanation: number;
    objectionHandling: number;
    nextStep: number;
    closingQuality: number;
}
export interface TopicTag {
    topicName: string;
    confidenceScore: number;
    explanation?: string;
    evidenceSnippet?: string;
    source: 'aimodel' | 'manual';
}
export interface ConversationRecord {
    id: string;
    tenantId: string;
    title: string;
    channel: 'call' | 'email';
    customerName: string;
    agentName: string;
    date: string;
    duration: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    sentimentScore: number;
    overallScore: number;
    topics: string[];
    summary: string;
    transcript: string;
    diarizedTranscript: DiarizedTurn[];
    scorecard: Scorecard;
    competitorsDetected: string[];
    coachingSuggestion: string;
    keywords: string[];
    topicTags?: TopicTag[];
}
export interface SavedSearchRecord {
    id: string;
    tenantId: string;
    userId: string;
    name: string;
    queryString: string;
    filters: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface SearchSyncLog {
    id: string;
    tenantId: string;
    entityType: 'transcript' | 'email';
    lastSyncedAt?: string;
    recordsSynced?: number;
    syncStatus?: 'COMPLETED' | 'FAILED' | 'PENDING';
    entityId?: string;
    idempotencyKey: string;
    indexedAt?: string;
}
export declare const SearchQuerySchema: z.ZodObject<{
    query: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    agent: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sentiment: z.ZodOptional<z.ZodEnum<["Positive", "Neutral", "Negative", ""]>>;
    topic: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    channel: z.ZodOptional<z.ZodEnum<["call", "email", ""]>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>>;
    datePreset: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    channel?: "" | "email" | "call";
    topic?: string;
    sentiment?: "" | "Neutral" | "Positive" | "Negative";
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    agent?: string;
    datePreset?: string;
}, {
    query?: string;
    channel?: "" | "email" | "call";
    topic?: string;
    sentiment?: "" | "Neutral" | "Positive" | "Negative";
    startDate?: string;
    endDate?: string;
    page?: unknown;
    limit?: unknown;
    agent?: string;
    datePreset?: string;
}>;
export declare const SavedSearchSchema: z.ZodObject<{
    name: z.ZodString;
    queryString: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    filters: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    filters?: Record<string, any>;
    queryString?: string;
}, {
    name?: string;
    filters?: Record<string, any>;
    queryString?: string;
}>;
