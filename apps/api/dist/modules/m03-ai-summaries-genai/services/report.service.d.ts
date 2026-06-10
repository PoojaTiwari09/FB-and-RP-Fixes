export declare class ReportService {
    getReport(reportId: string, orgId: string): Promise<any>;
    getReportHistory(reportId: string, orgId: string): Promise<{
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
