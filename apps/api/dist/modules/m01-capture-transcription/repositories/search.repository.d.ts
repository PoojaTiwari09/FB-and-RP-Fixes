import { z } from 'zod';
import { PrismaService } from '../database/prisma.service';
import { ShareCallDto } from '../schemas/m01.schema';
export declare const ExtendedSearchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
    ownerId: z.ZodOptional<z.ZodString>;
    callType: z.ZodOptional<z.ZodEnum<["inbound", "outbound", "meeting"]>>;
}, "strip", z.ZodTypeAny, {
    callType?: "inbound" | "outbound" | "meeting";
    ownerId?: string;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    q?: string;
}, {
    callType?: "inbound" | "outbound" | "meeting";
    ownerId?: string;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    q?: string;
}>;
export type ExtendedSearchQueryDto = z.infer<typeof ExtendedSearchQuerySchema>;
export interface OrgSearchResult {
    utteranceId: string;
    callId: string;
    callTitle: string;
    callDate: Date;
    speaker: string;
    excerpt: string;
    startMs: number;
}
export interface OrgSearchResponse {
    results: OrgSearchResult[];
    total: number;
    matchCount: number;
}
export declare class SearchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchAcrossOrg(tenantId: string, dto: ExtendedSearchQueryDto): Promise<OrgSearchResponse>;
    searchWithinCall(callId: string, tenantId: string, q: string): Promise<{
        results: {
            id: string;
            tenantId: string;
            text: string;
            sequenceIndex: number;
            transcriptId: string;
            speaker: string;
            originalText: string | null;
            startMs: number;
            endMs: number;
            confidence: number;
            isLowConfidence: boolean;
        }[];
        matchCount: number;
    }>;
}
export declare class ShareRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    share(callId: string, tenantId: string, sharedByUserId: string, dto: ShareCallDto): Promise<{
        id: string;
        tenantId: string;
        callId: string;
        sharedByUserId: string;
        sharedWithId: string;
        sharedWithType: string;
        sharedAt: Date;
    }>;
    findByCallId(callId: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        callId: string;
        sharedByUserId: string;
        sharedWithId: string;
        sharedWithType: string;
        sharedAt: Date;
    }[]>;
}
