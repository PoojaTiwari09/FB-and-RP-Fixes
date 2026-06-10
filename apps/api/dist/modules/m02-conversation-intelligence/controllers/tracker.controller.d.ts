import { TrackerService } from '../services/tracker.service';
export declare class TrackerController {
    private readonly trackerService;
    constructor(trackerService: TrackerService);
    createTracker(req: Record<string, any>, body: any): Promise<any>;
    getTrackers(req: Record<string, any>): Promise<any>;
    getStats(req: Record<string, any>): Promise<{
        totalTrackers: any;
        activeTrackers: any;
        totalDetections: any;
        detectionsThisMonth: any;
    }>;
    getAllDetections(req: Record<string, any>): Promise<any>;
    getDetectionsForConversation(req: Record<string, any>, entityId: string, entityType?: string): Promise<any>;
    updateTracker(req: Record<string, any>, id: string, body: any): Promise<any>;
    deleteTracker(req: Record<string, any>, id: string): Promise<any>;
}
