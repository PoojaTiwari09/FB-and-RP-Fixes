import { Queue } from 'bullmq';
import { CallRepository } from '../repositories/call.repository';
import { TranscriptRepository } from '../repositories/transcript.repository';
import { NotesRepository } from '../repositories/notes.repository';
import { SearchRepository, ShareRepository } from '../repositories/search.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { CreateCallDto, CreateNoteDto, UpdateNoteDto, ShareCallDto, SearchQueryDto, ListCallsQueryDto } from '../schemas/m01.schema';
export declare class CallService {
    private readonly calls;
    private readonly transcripts;
    private readonly notes;
    private readonly search;
    private readonly shares;
    private readonly events;
    private readonly queue;
    constructor(calls: CallRepository, transcripts: TranscriptRepository, notes: NotesRepository, search: SearchRepository, shares: ShareRepository, events: EventPublisherService, queue: Queue);
    createCall(dto: CreateCallDto, tenantId: string): Promise<{
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
    listCalls(tenantId: string, query: ListCallsQueryDto): Promise<{
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
    getCallDetail(callId: string, tenantId: string): Promise<{
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
    searchTranscripts(tenantId: string, query: SearchQueryDto): Promise<{
        callId: string;
        callTitle: string;
        excerpt: string;
        startMs: number;
    }[]>;
    searchWithinCall(callId: string, tenantId: string, query: SearchQueryDto): Promise<{
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
    createNote(callId: string, tenantId: string, authorId: string, dto: CreateNoteDto): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    updateNote(noteId: string, tenantId: string, dto: UpdateNoteDto): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    deleteNote(noteId: string, tenantId: string): Promise<{
        tenantId: string;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        callId: string;
        authorId: string;
    }>;
    shareCall(callId: string, tenantId: string, userId: string, dto: ShareCallDto): Promise<{
        tenantId: string;
        sharedWithId: string;
        sharedWithType: string;
        id: string;
        callId: string;
        sharedByUserId: string;
        sharedAt: Date;
    }>;
    onTranscriptionCompleted(callId: string, tenantId: string, transcriptData: {
        fullText: string;
        utterances: Array<{
            speaker: string;
            text: string;
            startMs: number;
            endMs: number;
            confidence: number;
            sequenceIndex: number;
        }>;
        assemblyAiJobId?: string;
    }): Promise<void>;
    onTranscriptionFailed(callId: string, tenantId: string, reason: string): Promise<void>;
}
