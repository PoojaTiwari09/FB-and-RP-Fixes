import { M03AiSummariesGenaiService } from '../services/m03.service';
export declare class M03AiSummariesGenaiController {
    private readonly service;
    constructor(service: M03AiSummariesGenaiService);
    findAll(req: any): Promise<{
        message: string;
    }[]>;
    create(dto: any, req: any): Promise<any>;
}
