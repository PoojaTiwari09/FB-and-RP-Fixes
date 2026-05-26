import { M10DataComplianceService } from '../services/m10.service';
export declare class M10DataComplianceController {
    private readonly service;
    constructor(service: M10DataComplianceService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
