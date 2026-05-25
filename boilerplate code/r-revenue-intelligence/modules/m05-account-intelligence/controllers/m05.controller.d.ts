import { M05AccountIntelligenceService } from '../services/m05.service';
export declare class M05AccountIntelligenceController {
    private readonly service;
    constructor(service: M05AccountIntelligenceService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
