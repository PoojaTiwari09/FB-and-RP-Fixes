import { PrismaService } from '../database/prisma.service';
import { ShareCallDto } from '../schemas/m01.schema';
export declare class SearchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchAcrossOrg(tenantId: string, q: string, limit: number, offset: number): Promise<{
        callId: string;
        callTitle: string;
        excerpt: string;
        startMs: number;
    }[]>;
    searchWithinCall(callId: string, tenantId: string, q: string): Promise<{
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
}
export declare class ShareRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    share(callId: string, tenantId: string, sharedByUserId: string, dto: ShareCallDto): Promise<{
        tenantId: string;
        sharedWithId: string;
        sharedWithType: string;
        id: string;
        callId: string;
        sharedByUserId: string;
        sharedAt: Date;
    }>;
    findByCallId(callId: string, tenantId: string): Promise<{
        tenantId: string;
        sharedWithId: string;
        sharedWithType: string;
        id: string;
        callId: string;
        sharedByUserId: string;
        sharedAt: Date;
    }[]>;
}
