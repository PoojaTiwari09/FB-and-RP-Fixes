import { CallService } from '../services/call.service';
export declare class CallsController {
    private readonly svc;
    constructor(svc: CallService);
    listCalls(query: Record<string, string>, req: any): Promise<{
        records: ({
            transcript: {
                id: string;
                summary: string | null;
            } | null;
        } & {
            tenantId: string;
            title: string;
            callDate: Date;
            durationSeconds: number;
            callType: string;
            callSource: string;
            participants: string[];
            callOwner: string;
            accountId: string | null;
            opportunityId: string | null;
            audioUrl: string | null;
            transcriptStatus: string;
            id: string;
            failureReason: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
    }>;
    createCall(body: unknown, req: any): Promise<{
        tenantId: string;
        title: string;
        callDate: Date;
        durationSeconds: number;
        callType: string;
        callSource: string;
        participants: string[];
        callOwner: string;
        accountId: string | null;
        opportunityId: string | null;
        audioUrl: string | null;
        transcriptStatus: string;
        id: string;
        failureReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCall(id: string, req: any): Promise<{
        transcript: ({
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
        }) | null;
        notes: {
            tenantId: string;
            content: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            callId: string;
            authorId: string;
        }[];
        shares: {
            tenantId: string;
            sharedWithId: string;
            sharedWithType: string;
            id: string;
            callId: string;
            sharedByUserId: string;
            sharedAt: Date;
        }[];
    } & {
        tenantId: string;
        title: string;
        callDate: Date;
        durationSeconds: number;
        callType: string;
        callSource: string;
        participants: string[];
        callOwner: string;
        accountId: string | null;
        opportunityId: string | null;
        audioUrl: string | null;
        transcriptStatus: string;
        id: string;
        failureReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    searchTranscripts(query: Record<string, string>, req: any): Promise<{
        callId: string;
        callTitle: string;
        excerpt: string;
        startMs: number;
    }[]>;
    searchWithinCall(id: string, query: Record<string, string>, req: any): Promise<{
        id: string;
        sequenceIndex: number;
        speaker: string;
        text: string;
        startMs: number;
        endMs: number;
        confidence: number;
        isLowConfidence: boolean;
        transcriptId: string;
    }[]>;
    createNote(id: string, body: unknown, req: any): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    updateNote(noteId: string, body: unknown, req: any): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    deleteNote(noteId: string, req: any): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    shareCall(id: string, body: unknown, req: any): Promise<{
        tenantId: string;
        sharedWithId: string;
        sharedWithType: string;
        id: string;
        callId: string;
        sharedByUserId: string;
        sharedAt: Date;
    }>;
}
