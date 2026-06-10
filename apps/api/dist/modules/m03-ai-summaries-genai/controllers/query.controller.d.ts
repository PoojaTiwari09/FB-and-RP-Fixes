import { QueryService } from '../services/query.service';
export declare class QueryController {
    private readonly queryService;
    constructor(queryService: QueryService);
    askAnything(body: {
        query: string;
        contextType?: string;
        contextId?: string;
        sessionId?: string;
    }, req: any): Promise<any>;
}
