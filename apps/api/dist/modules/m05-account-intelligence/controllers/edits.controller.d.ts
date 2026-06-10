import { EditsService } from '../services/edits.service';
export declare class EditsController {
    private readonly editsService;
    constructor(editsService: EditsService);
    editCompany(hubspotId: string, body: {
        field: string;
        value: string;
        role: string;
    }): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
    editDeal(dealId: string, body: {
        field: string;
        value: string;
        role: string;
    }): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
    editSupplementary(companyHubspotId: string, body: {
        field: string;
        value: string;
        role: string;
    }): Promise<{
        success: boolean;
        hubspot_updated: boolean;
        postgres_updated: boolean;
    }>;
}
