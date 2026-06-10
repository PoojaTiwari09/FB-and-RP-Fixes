import { M02FrontendSearchService } from './m02-frontend-search.service';
export declare class M02FrontendSearchController {
    private readonly svc;
    constructor(svc: M02FrontendSearchService);
    searchCalls(query: Record<string, string>, req: Record<string, string>): Promise<{
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
    getCallDrawer(callId: string, req: Record<string, string>): Promise<{
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
}
export declare class M02FrontendFiltersController {
    private readonly svc;
    constructor(svc: M02FrontendSearchService);
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
}
export declare class M02FrontendCallsActionsController {
    private readonly svc;
    constructor(svc: M02FrontendSearchService);
    aiAsk(body: unknown, req: Record<string, string>): Promise<{
        callId: string;
        question: string;
        answer: string;
        suggestedQuestions: string[];
    }>;
    startExport(body: unknown, req: Record<string, string>): Promise<{
        jobId: string;
        status: string;
    }>;
}
export declare class M02FrontendStreamsController {
    private readonly svc;
    constructor(svc: M02FrontendSearchService);
    createStream(body: unknown, req: Record<string, string>): Promise<{
        streamId: string;
        name: string;
        status: string;
    }>;
}
