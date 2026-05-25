import { PrismaService } from '../database/prisma.service';
interface CreateTranscriptData {
    tenantId: string;
    callId: string;
    fullText: string;
    utterances: UtteranceData[];
    assemblyAiJobId?: string;
}
interface UtteranceData {
    speaker: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence: number;
    sequenceIndex: number;
}
export declare class TranscriptRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateTranscriptData): Promise<{
        utterances: {
            id: string;
            sequenceIndex: number;
            speaker: string;
            text: string;
            startMs: number;
            endMs: number;
            confidence: number;
            isLowConfidence: boolean;
            transcriptId: string;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        fullText: string;
        summary: string | null;
        keyHighlights: import("@prisma/client/runtime/library").JsonValue | null;
        nextSteps: string[];
        talkRatio: import("@prisma/client/runtime/library").JsonValue | null;
        assemblyAiJobId: string | null;
    }>;
    patchAiFields(callId: string, fields: {
        summary?: string;
        keyHighlights?: object;
        nextSteps?: string[];
        talkRatio?: object;
    }): Promise<{
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        fullText: string;
        summary: string | null;
        keyHighlights: import("@prisma/client/runtime/library").JsonValue | null;
        nextSteps: string[];
        talkRatio: import("@prisma/client/runtime/library").JsonValue | null;
        assemblyAiJobId: string | null;
    }>;
    findByCallId(callId: string, tenantId: string): Promise<({
        utterances: {
            id: string;
            sequenceIndex: number;
            speaker: string;
            text: string;
            startMs: number;
            endMs: number;
            confidence: number;
            isLowConfidence: boolean;
            transcriptId: string;
        }[];
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        fullText: string;
        summary: string | null;
        keyHighlights: import("@prisma/client/runtime/library").JsonValue | null;
        nextSteps: string[];
        talkRatio: import("@prisma/client/runtime/library").JsonValue | null;
        assemblyAiJobId: string | null;
    }) | null>;
}
export {};
