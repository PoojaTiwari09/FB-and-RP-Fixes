export declare class ActivitiesService {
    private supabase;
    getActivities(companyHubspotId: string, type?: string, limit?: number, fromDate?: string, toDate?: string, page?: number, pageSize?: number): Promise<{
        total: any;
        page: number;
        page_size: number;
        activities: any;
    }>;
}
