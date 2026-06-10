import { M01FrontendCallsService } from './m01-frontend-calls.service';
export declare class M01FrontendCallsController {
    private readonly svc;
    constructor(svc: M01FrontendCallsService);
    listCalls(query: Record<string, string>, req: any): Promise<{
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
    searchCalls(query: Record<string, string>, req: any): Promise<{
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
    listAccounts(query: Record<string, string>, req: any): Promise<{
        accounts: {
            accountId: string;
            accountName: string;
        }[];
    }>;
    listParticipants(query: Record<string, string>, req: any): Promise<{
        participants: {
            participantId: string;
            name: string;
        }[];
    }>;
    getCallMetadata(callId: string, req: any): Promise<{
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
    getCall(callId: string, query: Record<string, string>, req: any): Promise<{
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
}
