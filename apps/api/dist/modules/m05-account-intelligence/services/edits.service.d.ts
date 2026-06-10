export declare class EditsService {
    private supabase;
    editCompany(hubspotId: string, field: string, value: string, role: string): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
    editDeal(dealHubspotId: string, field: string, value: string, role: string): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
    editSupplementary(companyHubspotId: string, field: string, value: string, role: string): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
}
