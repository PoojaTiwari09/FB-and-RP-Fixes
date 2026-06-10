import { NotesRepository } from '../repositories/notes.repository';
import { M01FrontendTranscriptService } from './m01-frontend-transcript.service';
import { M01FrontendCallProcessingService } from './m01-frontend-call-processing.service';
import { M01FrontendCallsService } from './m01-frontend-calls.service';
export declare class M01FrontendCallDetailController {
    private readonly svc;
    private readonly processing;
    private readonly callsUi;
    private readonly notesRepo;
    constructor(svc: M01FrontendTranscriptService, processing: M01FrontendCallProcessingService, callsUi: M01FrontendCallsService, notesRepo: NotesRepository);
    getMetadata(callId: string, req: Record<string, string>): Promise<{
        audioUrl: string;
        callId: any;
        callTitle: any;
        account: string;
        type: string;
        dealType: any;
        dateTime: any;
        date: any;
        time: string;
        duration: string;
        source: any;
        participants: any;
        owner: {
            ownerId: any;
            ownerName: any;
            avatarInitials: string;
        };
    }>;
    getProcessStatus(callId: string, req: Record<string, string>): Promise<{
        callId: string;
        transcriptStatus: string;
        phase: import("./m01-frontend-call-processing.service").CallProcessPhase;
        utteranceCount: number;
        hasSummary: boolean;
        hasAudio: boolean;
        message: string;
    }>;
    processCall(callId: string, req: Record<string, string>): Promise<{
        phase: import("./m01-frontend-call-processing.service").CallProcessPhase;
        transcriptStatus: string;
        message: string;
    }>;
    getTranscript(callId: string, query: Record<string, string>, req: Record<string, string>): Promise<{
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
    getSummary(callId: string, req: Record<string, string>): Promise<{
        summary: string;
        generatedAt: string;
    }>;
    getTalkRatio(callId: string, req: Record<string, string>): Promise<{
        rep: {
            percentage: number;
        };
        customer: {
            percentage: number;
        };
    }>;
    getAudio(callId: string, req: Record<string, string>): Promise<{
        audioUrl: any;
        duration: string;
        format: string;
    }>;
    getTopics(callId: string, req: Record<string, string>): Promise<{
        topics: {
            topicId: string;
            label: any;
            timestamp: string;
            description: any;
            color: string;
        }[];
    }>;
    getNextSteps(callId: string, req: Record<string, string>): Promise<{
        nextSteps: import("./m01-frontend-next-steps.util").FrontendNextStep[];
    }>;
    patchNextStep(callId: string, stepId: string, body: unknown, req: Record<string, string>): Promise<{
        stepId: string;
        completed: boolean;
        updatedAt: string;
    }>;
    listBriefs(callId: string, query: Record<string, string>, req: Record<string, string>): Promise<{
        briefs: {
            briefId: string;
            briefTemplate: string;
            period: string;
            generatedAt: string;
            generatedFrom: string;
        }[];
    }>;
    getBrief(callId: string, briefId: string, req: Record<string, string>): Promise<{
        briefId: string;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        generatedFrom: string;
    }>;
    generateBrief(callId: string, body: unknown, req: Record<string, string>): Promise<{
        briefId: `${string}-${string}-${string}-${string}-${string}`;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        status: "completed";
    }>;
    regenerateBrief(callId: string, _briefId: string, req: Record<string, string>): Promise<{
        phase: import("./m01-frontend-call-processing.service").CallProcessPhase;
        transcriptStatus: string;
        message: string;
    }>;
    shareLink(callId: string, briefId: string): {
        shareableLink: string;
        expiresAt: string;
    };
    shareInternal(callId: string, briefId: string, body: unknown): {
        message: string;
        sentTo: string[];
    };
    exportPdf(callId: string, briefId: string): {
        downloadUrl: string;
        expiresAt: string;
    };
    formattedSummary(callId: string, briefId: string, req: Record<string, string>): Promise<{
        briefId: string;
        briefTemplate: string;
        period: string;
        generatedAt: string;
        generatedFrom: string;
    }>;
    getNotes(callId: string, req: Record<string, any>): Promise<{
        data: {
            noteId: string;
            callId: string;
            note: string;
            userId: string;
            timestamp: string;
            createdAt: string;
        }[];
    }>;
    createNote(callId: string, body: {
        note?: string;
        content?: string;
        userId?: string;
    }, req: Record<string, string>): Promise<{
        data: {
            noteId: string;
            callId: string;
            note: string;
            userId: string;
            timestamp: string;
            createdAt: string;
        };
    }>;
}
export declare class M01FrontendBriefTemplatesController {
    private readonly svc;
    constructor(svc: M01FrontendTranscriptService);
    list(): {
        templates: {
            templateId: string;
            templateName: string;
        }[];
    };
}
export declare class M01FrontendBriefPeriodsController {
    private readonly svc;
    constructor(svc: M01FrontendTranscriptService);
    list(): {
        periods: {
            periodId: string;
            periodLabel: string;
        }[];
    };
}
