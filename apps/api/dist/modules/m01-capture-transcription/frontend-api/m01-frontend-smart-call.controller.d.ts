import { M01FrontendSmartCallService } from './m01-frontend-smart-call.service';
export declare class M01FrontendSmartCallController {
    private readonly svc;
    constructor(svc: M01FrontendSmartCallService);
    listContacts(query: Record<string, string>): Promise<{
        contacts: {
            contactId: string;
            contactName: string;
            jobTitle: string;
            company: string;
            avatarUrl: string | null;
            lastInteractionLabel: string;
            phone: string;
        }[];
        total: number;
        hasMore: boolean;
    }>;
    preCallBrief(contactId: string): Promise<{
        contactId: string;
        contactName: string;
        contactCompany: string;
        supportedIntegrations: string[];
        preCallBriefing: string;
        keyObjections: string[];
        dealStage: any;
        arrValue: any;
    }>;
    start(body: {
        contactId: string;
        taskId?: string;
    }): Promise<{
        sessionId: `${string}-${string}-${string}-${string}-${string}`;
        contactId: string;
        contactName: string;
        contactCompany: string;
        taskTitle: string;
        status: string;
        wsEndpoint: string;
        message: string;
    }>;
    end(sessionId: string, body: {
        endedAt?: string;
        generateSummary?: boolean;
    }): {
        sessionId: string;
        status: string;
        callSummaryId: string;
        message: string;
    };
    summary(sessionId: string): {
        sessionId: string;
        callSummaryId: string;
        duration: string;
        callType: string;
        signalLabel: string;
        signalType: string;
        overallScore: number;
        dimensionScores: {
            dimension: string;
            score: number;
            maxScore: number;
        }[];
        aiSummary: string;
        keyMoments: {
            timestamp: string;
            type: string;
            color: string;
            description: string;
        }[];
        missedOpportunities: {
            title: string;
            subLabel: string;
            questions: string[];
        };
        suggestedImprovements: string[];
        conversationTimeline: {
            startTime: string;
            endTime: string;
            topic: string;
        }[];
        transcriptUrl: string;
    };
    transcript(sessionId: string): Promise<{
        sessionId: string;
        contactName: unknown;
        duration: string;
        segments: {
            timestamp: any;
            speaker: any;
            text: any;
        }[];
    }>;
    persist(sessionId: string, body: Record<string, unknown>): Promise<{
        dbSessionId: string;
    } | {
        ok: boolean;
    }>;
    chunk(sessionId: string, body: Record<string, unknown>): Promise<{
        ok: boolean;
    }>;
    summaries(sessionId: string): Promise<{
        chunk_index: number;
        time_start: string;
        time_end: string;
        summary_text: string;
        key_topics: string[];
        sentiment: string;
        competitors_mentioned: string[];
        raw_transcript: string;
    }[]>;
}
