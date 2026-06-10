import { SessionsService, ScenariosService } from '../services/m09.service';
import { M09Repository } from '../repositories/m09.repository';
export declare class M09FrontendTrainingsService {
    private readonly sessions;
    private readonly scenarios;
    private readonly repo;
    constructor(sessions: SessionsService, scenarios: ScenariosService, repo: M09Repository);
    listTrainings(userId: string, orgId: string, status?: string): Promise<{
        trainings: any;
    }>;
    getTraining(trainingId: string, orgId: string): Promise<{
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
    startSession(trainingId: string, body: unknown, userId: string, orgId: string): Promise<{
        sessionId: string;
        status: string;
        startedAt: string;
    }>;
    getSession(trainingId: string, sessionId: string, orgId: string): Promise<{
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
    sendMessage(trainingId: string, sessionId: string, body: unknown, orgId: string): Promise<{
        userMessage: {
            id: string;
            sender: string;
            text: string;
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
    pauseSession(trainingId: string, sessionId: string, orgId: string): Promise<{
        success: boolean;
        status: string;
    }>;
    resumeSession(trainingId: string, sessionId: string, orgId: string): Promise<{
        success: boolean;
        status: string;
    }>;
    endSession(trainingId: string, sessionId: string, orgId: string): Promise<{
        success: boolean;
        status: string;
    }>;
    getResults(trainingId: string, sessionId: string, orgId: string): Promise<{
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
    getManagerDashboard(orgId: string): Promise<{
        activeTrainings: any;
        trainings: any;
    }>;
    createManagerTraining(body: unknown, orgId: string): Promise<{
        success: boolean;
        trainingId: any;
    }>;
    reassignTraining(trainingId: string, body: unknown, orgId: string): Promise<{
        success: boolean;
        newTrainingId: string;
    }>;
}
