import { PrismaService } from '../database/prisma.service';
import { CreateCallDto, ListCallsQueryDto } from '../schemas/m01.schema';
import { Prisma } from '@prisma/client';
export declare class CallRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateCallDto & {
        tenantId: string;
    }): Promise<{
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
    findAll(tenantId: string, query: ListCallsQueryDto): Promise<{
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
    findById(id: string, tenantId: string): Promise<({
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
            keyHighlights: Prisma.JsonValue | null;
            nextSteps: string[];
            talkRatio: Prisma.JsonValue | null;
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
    }) | null>;
    updateStatus(id: string, tenantId: string, status: string, failureReason?: string): Promise<{
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
}
