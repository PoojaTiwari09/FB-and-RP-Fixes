import { M07RevenueDashboardsService } from '../services/m07.service';
export declare class M07RevenueDashboardsController {
    private readonly service;
    constructor(service: M07RevenueDashboardsService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
