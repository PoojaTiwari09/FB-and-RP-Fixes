import { ActivitiesService } from '../services/activities.service';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    getActivities(companyHubspotId: string, type?: string, limit?: string, fromDate?: string, toDate?: string, page?: string, pageSize?: string): Promise<{
        total: any;
        page: number;
        page_size: number;
        activities: any;
    }>;
}
