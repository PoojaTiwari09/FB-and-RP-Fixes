import { ResearchService } from '../services/research.service';
import { ReportService } from '../services/report.service';
import { CreateJobDto } from '../interfaces/research.dto';
export declare class ResearchController {
    private readonly researchService;
    private readonly reportService;
    constructor(researchService: ResearchService, reportService: ReportService);
    createJob(dto: CreateJobDto, req: any): Promise<{
        jobId: any;
        status: string;
        estimatedDurationSeconds: number;
        message: string;
    }>;
    getJobStatus(jobId: string, req: any): Promise<any>;
    cancelJob(jobId: string, req: any): Promise<{
        status: string;
        jobId: string;
    }>;
    listJobs(req: any, status?: string, limit?: number): Promise<{
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
    getReport(reportId: string, req: any): Promise<any>;
    getReportHistory(reportId: string, req: any): Promise<{
        versions: {
            reportId: any;
            version: any;
            createdAt: any;
            status: any;
            modelUsed: any;
            metadata: any;
        }[];
    }>;
}
