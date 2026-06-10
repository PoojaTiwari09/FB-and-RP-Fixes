import { PrismaService } from '../database/prisma.service';
import { ResearchService } from '../services/research.service';
import { BriefService } from '../services/brief.service';
import { QueryService } from '../services/query.service';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("node_modules/@nestjs/common").CustomDecorator<string>;
export declare class M03TestController {
    private readonly prisma;
    private readonly research;
    private readonly briefs;
    private readonly query;
    constructor(prisma: PrismaService, research: ResearchService, briefs: BriefService, query: QueryService);
    health(): Promise<{
        success: boolean;
        database: string;
        aiMode: string;
        timestamp: string;
    }>;
    workspaceStats(): Promise<{
        tenantId: string;
        call_records: any;
        accounts: any;
        deals: any;
        m10_contacts: any;
        note: string;
    }>;
    seedCrm(): Promise<{
        success: boolean;
        tenantId: string;
        accounts: 2;
        deals: 2;
        callsLinked: number;
        message: string;
    }>;
    smoke(): Promise<{
        success: boolean;
        jobId: any;
        jobStatus: any;
        reportId: any;
        briefGenerated: boolean;
        queryAnswerLength: any;
    }>;
}
