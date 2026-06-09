import { M09FrontendTrainingsService } from './m09-frontend-trainings.service';
export declare class M09FrontendTrainingsController {
    private readonly svc;
    constructor(svc: M09FrontendTrainingsService);
    list(status: string, req: any): Promise<{
        trainings: any;
    }>;
    getSetup(trainingId: string, req: any): Promise<{
        id: any;
        title: any;
        contactPersona: {
            name: any;
            jobTitle: any;
            company: any;
            motivations: any;
            communicationStyle: any;
        };
        meetingContext: {
            scenario: any;
            objective: any;
            backgroundForTrainee: any;
        };
        playbookSections: {
            id: string;
            title: string;
            questions: {
                id: string;
                text: string;
                tags: string[];
                whyItMatters: string;
            }[];
        }[];
        voices: {
            id: string;
            label: string;
            description: string;
            previewText: string;
        }[];
    }>;
    getTraining(trainingId: string, req: any): Promise<{
        id: any;
        title: any;
        contactPersona: {
            name: any;
            jobTitle: any;
            company: any;
            motivations: any;
            communicationStyle: any;
        };
        meetingContext: {
            scenario: any;
            objective: any;
            backgroundForTrainee: any;
        };
        playbookSections: {
            id: string;
            title: string;
            questions: {
                id: string;
                text: string;
                tags: string[];
                whyItMatters: string;
            }[];
        }[];
        voices: {
            id: string;
            label: string;
            description: string;
            previewText: string;
        }[];
    }>;
    start(trainingId: string, body: unknown, req: any): Promise<{
        sessionId: string;
        status: string;
        startedAt: string;
    }>;
    getSession(trainingId: string, sessionId: string, req: any): Promise<{
        sessionId: any;
        status: any;
        elapsedSeconds: any;
        messageCount: number;
        selectedVoiceId: any;
        messages: {
            id: any;
            sender: string;
            text: any;
            timestampSeconds: any;
        }[];
        context: {
            id: any;
            title: any;
            contactPersona: {
                name: any;
                jobTitle: any;
                company: any;
                motivations: any;
                communicationStyle: any;
            };
            meetingContext: {
                scenario: any;
                objective: any;
                backgroundForTrainee: any;
            };
            playbookSections: {
                id: string;
                title: string;
                questions: {
                    id: string;
                    text: string;
                    tags: string[];
                    whyItMatters: string;
                }[];
            }[];
            voices: {
                id: string;
                label: string;
                description: string;
                previewText: string;
            }[];
        };
    }>;
    sendMessage(trainingId: string, sessionId: string, body: unknown, req: any): Promise<{
        userMessage: {
            id: string;
            sender: string;
            text: any;
            timestampSeconds: number;
        };
        aiResponse: {
            id: string;
            sender: string;
            text: string;
            timestampSeconds: number;
            audioUrl: string;
        };
        scorecardUpdate: {
            pb_01: string;
        };
    }>;
    pause(trainingId: string, sessionId: string, req: any): Promise<{
        success: boolean;
        status: string;
    }>;
    resume(trainingId: string, sessionId: string, req: any): Promise<{
        success: boolean;
        status: string;
    }>;
    end(trainingId: string, sessionId: string, req: any): Promise<{
        success: boolean;
        status: string;
    }>;
    results(trainingId: string, sessionId: string, req: any): Promise<{
        trainingId: any;
        trainingTitle: any;
        resultsReady: boolean;
        status: string;
        overallScore?: undefined;
        maxScore?: undefined;
        performanceTier?: undefined;
        tierLabel?: undefined;
        summaryText?: undefined;
        performanceTags?: undefined;
        scoredSections?: undefined;
        performanceBreakdown?: undefined;
        transcript?: undefined;
    } | {
        trainingId: any;
        trainingTitle: any;
        overallScore: any;
        maxScore: number;
        performanceTier: string;
        tierLabel: string;
        summaryText: any;
        performanceTags: any;
        scoredSections: {
            id: string;
            categoryName: string;
            score: any;
            maxScore: number;
            status: string;
            questions: {
                id: string;
                text: string;
                tags: string[];
                whyItMatters: string;
            }[];
        }[];
        performanceBreakdown: {
            category: string;
            score: any;
            maxScore: number;
            percentage: number;
            description: string;
            strengths: any;
            areasForImprovement: any;
        }[];
        transcript: {
            id: any;
            sender: string;
            text: any;
            timestampSeconds: any;
        }[];
        resultsReady: boolean;
        status?: undefined;
    }>;
}
