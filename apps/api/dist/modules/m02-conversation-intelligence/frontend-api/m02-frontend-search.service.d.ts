import { PrismaService } from '../database/prisma.service';
import { M02ConversationIntelligenceService } from '../services/m02.service';
export declare class M02FrontendSearchService {
    private readonly m02;
    private readonly prisma;
    private readonly exportJobs;
    private readonly streams;
    constructor(m02: M02ConversationIntelligenceService, prisma: PrismaService);
    getFilterOptions(): {
        teams: {
            value: string;
            label: string;
        }[];
        reps: {
            value: string;
            label: string;
        }[];
        stages: {
            value: string;
            label: string;
        }[];
        topics: {
            value: string;
            label: string;
        }[];
        trackers: {
            value: string;
            label: string;
        }[];
        scorecardResults: {
            value: string;
            label: string;
        }[];
        callTypes: {
            value: string;
            label: string;
        }[];
        phraseMatchTypes: {
            value: string;
            label: string;
        }[];
    };
    searchCalls(tenantId: string, rawQuery: Record<string, string>): Promise<{
        meta: {
            total: number;
            page: number;
            size: number;
            totalPages: number;
            callsCount: number;
            emailsCount: number;
        };
        chart: {
            granularity: "months" | "days" | "weeks" | "quarters";
            data: {
                label: string;
                count: number;
            }[];
            days: {
                label: string;
                count: number;
            }[];
            weeks: {
                label: string;
                count: number;
            }[];
            months: {
                label: string;
                count: number;
            }[];
            quarters: {
                label: string;
                count: number;
            }[];
        };
        emailChart: {
            granularity: "months" | "days" | "weeks" | "quarters";
            data: {
                label: string;
                count: number;
            }[];
            days: {
                label: string;
                count: number;
            }[];
            weeks: {
                label: string;
                count: number;
            }[];
            months: {
                label: string;
                count: number;
            }[];
            quarters: {
                label: string;
                count: number;
            }[];
        };
        emailResults: any[];
        results: {
            id: string;
            title: string;
            rep: {
                id: string;
                name: string;
            };
            date: string;
            durationMinutes: number;
            score: number;
            scoreLabel: string;
            deal: string;
            type: "call";
            status: string;
        }[];
    }>;
    getCallDrawer(tenantId: string, callId: string): Promise<{
        id: any;
        title: any;
        date: any;
        durationSeconds: any;
        durationLabel: string;
        participants: any;
        account: any;
        type: any;
        status: any;
        score: number;
        scoreLabel: string;
        recordingUrl: any;
        nextSteps: any;
        keyHighlights: {
            label: any;
            text: any;
        }[];
        conversationHighlights: {
            timestampSeconds: number;
            timestampLabel: string;
            tag: any;
            tagColor: string;
            quote: any;
        }[];
        timelineLabel: string;
        transcript: any;
    }>;
    aiAsk(tenantId: string, body: {
        callId: string;
        question: string;
    }): Promise<{
        callId: string;
        question: string;
        answer: string;
        suggestedQuestions: string[];
    }>;
    startExport(_tenantId: string, _body: unknown): Promise<{
        jobId: string;
        status: string;
    }>;
    createStream(_tenantId: string, body: {
        name: string;
    }): Promise<{
        streamId: string;
        name: string;
        status: string;
    }>;
}
