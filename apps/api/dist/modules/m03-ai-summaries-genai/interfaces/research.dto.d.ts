export declare class CreateJobDto {
    query: string;
    contextType?: string;
    contextId?: string;
    scope?: string;
    periodDays?: number;
    filters?: Record<string, any>;
    webDataEnabled?: boolean;
}
export declare class JobStatusDto {
    jobId: string;
    status: string;
    progressPct: number;
    progressStage: string;
    query: string;
    filters: Record<string, any>;
    subQueries: any[];
    error: string | null;
    reportId: string | null;
    createdAt: string;
    completedAt: string | null;
}
export declare class FeedbackDto {
    type: string;
    sectionId?: string;
    bulletId?: string;
    note?: string;
}
