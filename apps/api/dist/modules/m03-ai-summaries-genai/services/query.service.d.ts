import { ConfigService } from '@nestjs/config';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
export declare class QueryService {
    private readonly repo;
    private config?;
    private fastapiUrl;
    constructor(repo: M03AiSummariesGenaiRepository, config?: ConfigService);
    private useLocalFallback;
    private formatErr;
    processQuery(params: {
        query: string;
        contextType: string;
        contextId?: string;
        sessionId?: string;
        orgId: string;
        userId: string;
    }): Promise<any>;
    private mockAnswer;
}
