import { M02FrontendTrackersService } from './m02-frontend-trackers.service';
export declare class M02FrontendTrackersController {
    private readonly svc;
    constructor(svc: M02FrontendTrackersService);
    list(query: Record<string, string>, req: Record<string, string>): Promise<{
        data: any;
    }>;
    detail(trackerId: string, req: Record<string, string>): Promise<{
        data: {
            percentage: number;
            mentions: any;
            topAccounts: string[];
            topReps: string[];
            aiInsight: any;
        };
    }>;
    ask(trackerId: string, body: {
        question?: string;
    }, req: Record<string, string>): Promise<{
        data: {
            answer: string;
        };
    }>;
}
