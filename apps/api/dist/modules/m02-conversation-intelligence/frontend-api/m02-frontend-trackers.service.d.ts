import { PrismaService } from '../database/prisma.service';
export declare class M02FrontendTrackersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get db();
    listTrackers(tenantId: string, query: {
        search?: string;
        teamId?: string;
        dateRange?: string;
        interactionType?: string;
    }): Promise<{
        data: any;
    }>;
    getTrackerDetail(tenantId: string, trackerSlug: string): Promise<{
        data: {
            percentage: number;
            mentions: any;
            topAccounts: string[];
            topReps: string[];
            aiInsight: any;
        };
    }>;
    askTracker(tenantId: string, trackerSlug: string, question: string): Promise<{
        data: {
            answer: string;
        };
    }>;
}
