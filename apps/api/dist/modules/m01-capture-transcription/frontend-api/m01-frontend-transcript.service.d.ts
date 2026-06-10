import { PrismaService } from '../database/prisma.service';
import { CallService } from '../services/call.service';
export declare class M01FrontendTranscriptService {
    private readonly calls;
    private readonly prisma;
    private readonly briefs;
    constructor(calls: CallService, prisma: PrismaService);
    private loadCall;
    getTranscript(callId: string, tenantId: string, rawQuery: Record<string, string>): Promise<{
        totalCount: number;
        transcript: {
            entryId: any;
            timestamp: string;
            speakerName: any;
            speakerType: "rep" | "customer";
            text: any;
            confidence: string;
        }[];
    }>;
    getSummary(callId: string, tenantId: string): Promise<{
        summary: string;
        generatedAt: string;
    }>;
    getTalkRatio(callId: string, tenantId: string): Promise<{
        rep: {
            percentage: number;
        };
        customer: {
            percentage: number;
        };
    }>;
    getAudio(callId: string, tenantId: string): Promise<{
        audioUrl: any;
        duration: string;
        format: string;
    }>;
    getTopics(callId: string, tenantId: string): Promise<{
        topics: {
            topicId: string;
            label: any;
            timestamp: string;
            description: any;
            color: string;
        }[];
    }>;
    getNextSteps(callId: string, tenantId: string): Promise<{
        nextSteps: import("./m01-frontend-next-steps.util").FrontendNextStep[];
    }>;
    patchNextStep(callId: string, stepId: string, tenantId: string, body: unknown): Promise<{
        stepId: string;
        completed: boolean;
        updatedAt: string;
    }>;
    private buildBriefBody;
    private analyzedBriefId;
    private autoBriefId;
    upsertAnalyzedBrief(callId: string, tenantId: string): Promise<{
        briefId: string;
    }>;
    private autoBriefGeneratedAt;
    listBriefs(callId: string, tenantId: string, rawQuery: Record<string, string>): Promise<{
        briefs: {
            briefId: string;
            briefTemplate: string;
            period: string;
            generatedAt: string;
            generatedFrom: string;
        }[];
    }>;
    getBrief(callId: string, briefId: string, tenantId: string): Promise<{
        briefId: string;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        generatedFrom: string;
    }>;
    generateBrief(callId: string, tenantId: string, body: unknown): Promise<{
        briefId: `${string}-${string}-${string}-${string}-${string}`;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        status: "completed";
    }>;
    getBriefTemplates(): {
        templates: {
            templateId: string;
            templateName: string;
        }[];
    };
    getBriefPeriods(): {
        periods: {
            periodId: string;
            periodLabel: string;
        }[];
    };
    shareLink(_callId: string, briefId: string): {
        shareableLink: string;
        expiresAt: string;
    };
    shareInternal(_callId: string, briefId: string, body: unknown): {
        message: string;
        sentTo: string[];
    };
    exportPdf(_callId: string, briefId: string): {
        downloadUrl: string;
        expiresAt: string;
    };
    formattedSummary(callId: string, briefId: string, tenantId: string): Promise<{
        briefId: string;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        generatedFrom: string;
    }>;
}
