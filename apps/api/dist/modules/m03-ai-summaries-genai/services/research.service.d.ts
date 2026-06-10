import { ConfigService } from '@nestjs/config';
import { CreateJobDto } from '../interfaces/research.dto';
export declare class ResearchService {
    private config?;
    private fastapiUrl;
    constructor(config?: ConfigService);
    createJob(dto: CreateJobDto, user: any): Promise<{
        jobId: any;
        status: string;
    }>;
    private dispatchToFastAPI;
    private simulateJobCompletion;
    getJobStatus(jobId: string, orgId: string): Promise<any>;
    cancelJob(jobId: string, orgId: string): Promise<{
        cancelled: boolean;
        reason: string;
    } | {
        cancelled: boolean;
        reason?: undefined;
    }>;
    listJobs(orgId: string, userId: string, status?: string, limit?: number): Promise<{
        jobs: {
            jobId: any;
            status: any;
            progressPct: any;
            progressStage: any;
            query: any;
            filters: any;
            createdAt: any;
            completedAt: any;
        }[];
        total: number;
    }>;
    getActiveJobCount(orgId: string, userId: string): Promise<number>;
    logAudit(user: any, eventType: string, details: any): Promise<void>;
}
