import { M02ConversationIntelligenceService } from '../services/m02.service';
export declare class M02ConversationIntelligenceController {
    private readonly service;
    constructor(service: M02ConversationIntelligenceService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
