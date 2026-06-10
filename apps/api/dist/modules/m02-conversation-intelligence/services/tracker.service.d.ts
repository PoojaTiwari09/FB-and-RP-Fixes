import { PrismaService } from '../database/prisma.service';
export declare class TrackerService {
    private prisma;
    private readonly logger;
    private static memTrackers;
    private static memDetections;
    constructor(prisma: PrismaService);
    private get trackerDelegate();
    private get detectionDelegate();
    createTracker(data: {
        tenantId: string;
        name: string;
        keywords: string[];
        isActive?: boolean;
        speakerScope?: string;
        timingCondition?: string;
        timingMinutes?: number;
    }): Promise<any>;
    getTrackers(tenantId: string): Promise<any>;
    updateTracker(id: string, tenantId: string, data: any): Promise<any>;
    deleteTracker(id: string, tenantId: string): Promise<any>;
    addKeywordsToTracker(trackerId: string, tenantId: string, keywords: string[]): Promise<any>;
    scanTranscriptForTrackers(tenantId: string, entityId: string, entityType: 'call' | 'email', transcript: string, diarizedTranscript?: any[]): Promise<any[]>;
    private findKeywordOccurrences;
    private checkSpeakerScope;
    private checkTimingCondition;
    getDetectionsForConversation(tenantId: string, entityId: string, entityType: 'call' | 'email'): Promise<any>;
    getAllDetections(tenantId: string): Promise<any>;
    getTrackerStats(tenantId: string): Promise<{
        totalTrackers: any;
        activeTrackers: any;
        totalDetections: any;
        detectionsThisMonth: any;
    }>;
}
