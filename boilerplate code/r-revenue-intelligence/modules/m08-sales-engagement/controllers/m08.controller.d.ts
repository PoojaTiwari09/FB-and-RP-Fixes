import { M08SalesEngagementService } from '../services/m08.service';
export declare class M08SalesEngagementController {
    private readonly service;
    constructor(service: M08SalesEngagementService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
