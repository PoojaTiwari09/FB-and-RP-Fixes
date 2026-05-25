import { M04DealIntelligenceService } from '../services/m04.service';
export declare class M04DealIntelligenceController {
    private readonly service;
    constructor(service: M04DealIntelligenceService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
