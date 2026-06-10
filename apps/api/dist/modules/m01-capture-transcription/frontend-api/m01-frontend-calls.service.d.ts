import { CallService } from '../services/call.service';
import { CallRepository } from '../repositories/call.repository';
import { PrismaService } from '../database/prisma.service';
export declare class M01FrontendCallsService {
    private readonly calls;
    private readonly callRepo;
    private readonly prisma;
    constructor(calls: CallService, callRepo: CallRepository, prisma: PrismaService);
    listCalls(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string): Promise<{
        data: {
            calls: {
                id: any;
                callName: any;
                account: string;
                dateTime: any;
                duration: string;
                type: string;
                stage: string;
                score: any;
                status: any;
                tags: any;
            }[];
            pagination: {
                page: number;
                size: number;
                total: number;
                totalPages: number;
            };
        };
        totalCount: number;
        page: number;
        size: number;
        calls: {
            id: any;
            callName: any;
            account: string;
            dateTime: any;
            duration: string;
            type: string;
            stage: string;
            score: any;
            status: any;
            tags: any;
        }[];
    } | {
        totalCount: number;
        page: number;
        size: number;
        calls: {
            callId: any;
            callTitle: any;
            dealType: any;
            account: string;
            owner: {
                ownerId: any;
                ownerName: any;
                avatarInitials: string;
            };
            dateTime: any;
            duration: string;
            keyInsight: any;
            status: string;
            participants: any;
        }[];
        data?: undefined;
    }>;
    getCall(callId: string, tenantId: string, rawQuery?: Record<string, string>, userId?: string, userRole?: string): Promise<{
        callId: any;
        callTitle: any;
        account: string;
        type: string;
        dealType: any;
        dateTime: any;
        date: any;
        time: string;
        duration: string;
        source: any;
        participants: any;
        owner: {
            ownerId: any;
            ownerName: any;
            avatarInitials: string;
        };
        status: string;
    } | {
        data: {
            participants: {
                name: string;
                role: string;
            }[];
            id: any;
            callName: any;
            account: string;
            dateTime: any;
            duration: string;
            type: string;
            stage: string;
            score: any;
            status: any;
            tags: any;
        };
    }>;
    getCallMetadata(callId: string, tenantId: string, userId?: string, userRole?: string): Promise<{
        audioUrl: string;
        callId: any;
        callTitle: any;
        account: string;
        type: string;
        dealType: any;
        dateTime: any;
        date: any;
        time: string;
        duration: string;
        source: any;
        participants: any;
        owner: {
            ownerId: any;
            ownerName: any;
            avatarInitials: string;
        };
    }>;
    searchCalls(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string): Promise<{
        totalCount: number;
        calls: {
            keyInsight: any;
            callId: any;
            callTitle: any;
            dealType: any;
            account: string;
            owner: {
                ownerId: any;
                ownerName: any;
                avatarInitials: string;
            };
            dateTime: any;
            duration: string;
            status: string;
            participants: any;
        }[];
    }>;
    listAccounts(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string): Promise<{
        accounts: {
            accountId: string;
            accountName: string;
        }[];
    }>;
    listParticipants(tenantId: string, rawQuery: Record<string, string>, userId?: string, userRole?: string): Promise<{
        participants: {
            participantId: string;
            name: string;
        }[];
    }>;
}
