import { M09Repository } from '../repositories/m09.repository';
import { LlmService } from '../services/m09.service';
export declare class M09Worker {
    private readonly repository;
    private readonly llmService;
    constructor(repository: M09Repository, llmService: LlmService);
    runCoachingAgent(sessionId: string, repId: string, feedback: any, scenario: any): Promise<any>;
    refreshAnalytics(orgId: string): Promise<boolean>;
}
