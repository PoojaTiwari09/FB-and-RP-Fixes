import { M08SalesEngagementService } from '../services/m08.service';
export declare class M08SalesEngagementController {
    private readonly service;
    constructor(service: M08SalesEngagementService);
    getPlays(req: any): Promise<any>;
    getPlayById(id: string, req: any): Promise<any>;
    createPlay(body: any, req: any): Promise<any>;
    updatePlay(id: string, body: any, req: any): Promise<any>;
    clonePlay(body: any, req: any): Promise<any>;
    deactivatePlay(body: any, req: any): Promise<any>;
    enrollOpportunity(body: any, req: any): Promise<any>;
    getEnrollments(query: any, req: any): Promise<any>;
    getEnrollmentById(id: string, req: any): Promise<any>;
    completeStep(id: string, body: any, req: any): Promise<any>;
    skipStep(id: string, body: any, req: any): Promise<any>;
    addNote(id: string, body: any, req: any): Promise<any>;
    getAdoptionDashboard(req: any): Promise<any>;
    getRepDashboard(req: any): Promise<any>;
    getPlayDashboard(req: any): Promise<any>;
    private enforceRole;
}
