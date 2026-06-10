import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { M09Repository } from '../repositories/m09.repository';
import { M09Worker } from '../workers/m09.worker';
import { StartSessionDto, SendMessageDto, CreateScenarioDto, UpdateScenarioDto, CreateAssignmentDto, UpdateAssignmentDto, ExportQueryDto } from '../schemas/m09.schema';
export declare class LlmService {
    private readonly configService?;
    private readonly groq;
    private readonly groqApiKey;
    private readonly elevenLabsApiKey;
    private readonly aiMockMode;
    private readonly activeProvider;
    private readonly providerReason;
    constructor(configService?: ConfigService);
    getRuntimeMode(): "mock" | "live";
    getActiveProviderName(): string;
    getProviderSelectionReason(): string;
    private buildMockBuyerResponse;
    private buildMockEvaluation;
    private buildMockCoachingActions;
    private buildMockLiveEvaluation;
    generateHint(history: any[], scenarioContext: string, hintsUsed?: number): Promise<string>;
    generateBuyerResponse(systemPrompt: string, history: any[], userMessage: string): Promise<string>;
    evaluateSession(evaluationPrompt: string): Promise<any>;
    generateCoachingActions(analysisPrompt: string): Promise<any>;
    transcribeAudio(filePath: string): Promise<string>;
    generateSpeech(text: string, voiceId: string): Promise<string | null>;
    generatePersonaFromTranscript(transcript: string): Promise<any>;
    private enrichPersonaDraft;
    evaluateLiveTurn(history: any[], lastUserMsg: string, scenarioContext?: string): Promise<any>;
    generateLiveCoachingTips(history: any[], lastUserMsg: string, lastBotReply: string): Promise<string[]>;
    diarizeTranscript(rawTranscript: string): Promise<Array<{
        role: string;
        content: string;
    }>>;
}
export declare class SessionsService {
    private readonly repository;
    private readonly llmService;
    private readonly worker;
    constructor(repository: M09Repository, llmService: LlmService, worker: M09Worker);
    findAll(repId: string, orgId: string): Promise<any>;
    getMySessions(repId: string, orgId: string): Promise<any>;
    getSessionById(sessionId: string, orgId: string): Promise<{
        messages_json: any;
        assignment_id: string;
        max_hints: number;
        id: string;
        rep_id: string;
        scenario_id: string;
        manager_id?: string | null;
        feedback_json: any | null;
        selected_voice_id?: string | null;
        completed_at?: Date | null;
        created_at: Date;
        is_practice: boolean;
        hints_used: number;
        lifecycle_status?: "active" | "paused" | "completed";
        elapsed_seconds?: number;
        scenario?: {
            id: string;
            org_id: string;
            persona_name: string;
            persona_type: string;
            context_text: string;
            difficulty: string;
            custom_prompt?: string | null;
            voice_id?: string | null;
            manager_id?: string | null;
            created_at: Date;
        };
        rep?: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
            org_id: string;
            manager_id?: string | null;
            password?: string | null;
            created_at: Date;
        };
    }>;
    startSession(dto: StartSessionDto, repId: string, orgId: string): Promise<{
        id: string;
        sessionId: string;
    }>;
    getHint(sessionId: string, orgId: string): Promise<{
        hint: string;
        hints_used: number;
        max_hints: number;
    }>;
    sendMessage(dto: SendMessageDto, orgId: string): Promise<{
        reply: string;
        audio: string;
        userText: string;
        live_coaching: any;
    }>;
    sendVoiceMessage(sessionId: string, audio: any, orgId: string): Promise<{
        userText: string;
        reply: string;
        audio: string;
        live_coaching: any;
    }>;
    endSession(sessionId: string, orgId: string): Promise<any>;
    retrySession(sessionId: string, repId: string, orgId: string): Promise<{
        id: string;
        sessionId: string;
    }>;
    getVoices(): Promise<any>;
    updateSession(id: string, dto: {
        messages_json?: any[];
        status?: string;
    }, orgId: string): Promise<{
        success: boolean;
    }>;
    submitSessionToManager(sessionId: string, repId: string, orgId: string): Promise<{
        success: boolean;
        assignmentId: string;
        message: string;
    }>;
    analyzeUploadedCall(repId: string, orgId: string, audio: any): Promise<any>;
}
export declare class ScenariosService {
    private readonly repository;
    private readonly llmService;
    constructor(repository: M09Repository, llmService: LlmService);
    findAll(orgId: string): Promise<any>;
    findOne(id: string, orgId: string): Promise<any>;
    create(dto: CreateScenarioDto, orgId: string, managerId?: string): Promise<any>;
    update(id: string, dto: UpdateScenarioDto, orgId: string): Promise<any>;
    delete(id: string, orgId: string): Promise<any>;
    transcribeAudio(audioBuffer: Buffer): Promise<string>;
    analyzeAudioForScenario(audioBuffer: Buffer): Promise<{
        raw_transcript: string;
        transcript: string;
        persona: any;
        turn_count: number;
    }>;
    generatePersonaFromTranscript(transcript: string): Promise<any>;
}
export declare class CoachingService {
    private readonly repository;
    constructor(repository: M09Repository);
    getNotes(userId: string, role: string, orgId: string): Promise<{
        id: any;
        rep_id: any;
        rep_name: any;
        rep_email: any;
        content: any;
        priority: any;
        created_at: any;
        is_agent_generated: any;
        weakest_skill: any;
    }[] | {
        id: any;
        rep_id: any;
        rep_name: string;
        content: any;
        priority: any;
        created_at: any;
        is_agent_generated: any;
        weakest_skill: any;
    }[]>;
    createNote(managerId: string, repId: string, content: string, priority: string, orgId: string): Promise<{
        is_agent_generated: boolean;
        created_at: Date;
        rep_id: string;
        manager_id?: string;
        org_id: string;
        content: string;
        priority: string;
        weakest_skill?: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    getRecommendations(repId: string): Promise<{
        id: string;
        rep_id: string;
        focus_area: string;
        weakest_skill: string;
        recommendation_text: string;
        suggested_action: string;
        priority: string;
        status: string;
        generated_at: Date;
    }[]>;
    pushRecommendation(managerId: string, repId: string, focusArea: string, text: string): Promise<{
        status: string;
        generated_at: Date;
        rep_id: string;
        focus_area: string;
        weakest_skill: string;
        recommendation_text: string;
        suggested_action: string;
        priority: string;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
}
export declare class TrainingService {
    private readonly repository;
    constructor(repository: M09Repository);
    createAssignments(dto: CreateAssignmentDto, managerId: string, orgId: string): Promise<{
        success: boolean;
    }>;
    getAssignments(user: any): Promise<any>;
    updateAssignment(id: string, dto: UpdateAssignmentDto, managerId: string): Promise<{
        id: string;
        rep_id: string;
        scenario_id: string;
        manager_id: string;
        session_id?: string | null;
        status: string;
        priority: string;
        deadline: Date;
        assigned_at: Date;
        completed_at?: Date | null;
        attempt_count: number;
        max_attempts?: number | null;
        max_hints?: number | null;
        best_score: number;
        best_session_id?: string | null;
        manager_score?: number | null;
        manager_note?: string | null;
        scenario?: {
            id: string;
            org_id: string;
            persona_name: string;
            persona_type: string;
            context_text: string;
            difficulty: string;
            custom_prompt?: string | null;
            voice_id?: string | null;
            manager_id?: string | null;
            created_at: Date;
        };
        rep?: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
            org_id: string;
            manager_id?: string | null;
            password?: string | null;
            created_at: Date;
        };
    }>;
    updateAssignmentByRep(id: string, dto: UpdateAssignmentDto, repId: string): Promise<{
        id: string;
        rep_id: string;
        scenario_id: string;
        manager_id: string;
        session_id?: string | null;
        status: string;
        priority: string;
        deadline: Date;
        assigned_at: Date;
        completed_at?: Date | null;
        attempt_count: number;
        max_attempts?: number | null;
        max_hints?: number | null;
        best_score: number;
        best_session_id?: string | null;
        manager_score?: number | null;
        manager_note?: string | null;
        scenario?: {
            id: string;
            org_id: string;
            persona_name: string;
            persona_type: string;
            context_text: string;
            difficulty: string;
            custom_prompt?: string | null;
            voice_id?: string | null;
            manager_id?: string | null;
            created_at: Date;
        };
        rep?: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
            org_id: string;
            manager_id?: string | null;
            password?: string | null;
            created_at: Date;
        };
    }>;
    deleteAssignment(id: string, managerId: string): Promise<{
        id: string;
        rep_id: string;
        scenario_id: string;
        manager_id: string;
        session_id?: string | null;
        status: string;
        priority: string;
        deadline: Date;
        assigned_at: Date;
        completed_at?: Date | null;
        attempt_count: number;
        max_attempts?: number | null;
        max_hints?: number | null;
        best_score: number;
        best_session_id?: string | null;
        manager_score?: number | null;
        manager_note?: string | null;
        scenario?: {
            id: string;
            org_id: string;
            persona_name: string;
            persona_type: string;
            context_text: string;
            difficulty: string;
            custom_prompt?: string | null;
            voice_id?: string | null;
            manager_id?: string | null;
            created_at: Date;
        };
        rep?: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
            org_id: string;
            manager_id?: string | null;
            password?: string | null;
            created_at: Date;
        };
    }>;
}
export declare class AnalyticsService {
    private readonly repository;
    constructor(repository: M09Repository);
    getDashboardStats(orgId: string, managerId?: string): Promise<{
        totalReps: number;
        activeSessions: number;
        avgTeamScore: number;
        repsNeedingAttention: number;
        completionRate: number;
        weeklyImprovement: number;
        scoreTrend: {
            date: string;
            score: number;
        }[];
        topPerformers: any;
        atRiskReps: any;
        trends: {
            avgScore: number;
            weeklyImprovement: number;
        };
    }>;
    getRepsWithStats(orgId: string, managerId?: string): Promise<any>;
    getTeamAnalytics(orgId: string, managerId?: string): Promise<{
        trendData: {
            date: string;
            score: any;
        }[];
        scenarioData: {
            name: string;
            score: number;
        }[];
        heatmapData: {
            date: string;
            count: number;
        }[];
        radarData: {
            subject: string;
            A: number;
            fullMark: number;
        }[];
        insights: {
            type: string;
            text: string;
            icon: string;
        }[];
        recommendations: {
            action: string;
            text: string;
            priority: string;
        }[];
    }>;
    getRepComparison(repId: string, orgId: string, managerId?: string): Promise<{
        radarData: {
            subject: string;
            Team: number;
            Rep: number;
            fullMark: number;
        }[];
    }>;
    getActivityMetrics(orgId: string, managerId?: string): Promise<{
        totalSessions: number;
        weeklySessions: number;
        engagementRate: number;
    }>;
    getInteractionAnalytics(orgId: string, managerId?: string): Promise<{
        avgTalkRatio: number;
        avgQuestionsAsked: number;
        avgClosingAttempts: number;
        totalExchanges: number;
    }>;
    getTopicInsights(orgId: string, managerId?: string): Promise<{
        topic: string;
        count: number;
        impact: string;
    }[]>;
    getCallDrilldown(sessionId: string, orgId: string): Promise<{
        id: string;
        transcript: any;
        messages_json: any;
        feedback: any;
        feedback_json: any;
        assignment_id: string;
        is_practice: boolean;
        created_at: Date;
        completed_at: Date;
    }>;
    getBenchmarks(orgId: string, managerId?: string): Promise<{
        openingTarget: number;
        discoveryTarget: number;
        closingTarget: number;
        talkRatioRange: string;
    }>;
    getManagerReview(managerId: string, orgId: string): Promise<{
        repsCount: any;
        coachingNotesSent: number;
        activeAssignments: number;
        overdueAssignments: number;
    }>;
    getTrainingReport(orgId: string, managerId?: string): Promise<{
        completionRate: number;
        completedAssignments: number;
        totalAssignments: number;
        averageTeamScore: number;
    }>;
    exportCsv(orgId: string, options: ExportQueryDto, managerId?: string): Promise<string>;
    exportTrainingCsv(orgId: string, options: ExportQueryDto, managerId?: string): Promise<string>;
    getSentNotes(managerId: string, orgId: string): Promise<{
        id: any;
        rep_id: any;
        rep_name: any;
        content: any;
        priority: any;
        created_at: any;
        is_agent_generated: any;
        weakest_skill: any;
    }[]>;
    getTeamAssignments(managerId: string, orgId: string): Promise<any[]>;
    getMyAnalytics(userId: string, orgId: string): Promise<{
        id: string;
        rep_id: string;
        scenario_id: string;
        manager_id?: string | null;
        messages_json: any;
        feedback_json: any | null;
        selected_voice_id?: string | null;
        completed_at?: Date | null;
        created_at: Date;
        is_practice: boolean;
        hints_used: number;
        lifecycle_status?: "active" | "paused" | "completed";
        elapsed_seconds?: number;
        scenario?: {
            id: string;
            org_id: string;
            persona_name: string;
            persona_type: string;
            context_text: string;
            difficulty: string;
            custom_prompt?: string | null;
            voice_id?: string | null;
            manager_id?: string | null;
            created_at: Date;
        };
        rep?: {
            id: string;
            email: string;
            name: string;
            role: string;
            status: string;
            org_id: string;
            manager_id?: string | null;
            password?: string | null;
            created_at: Date;
        };
    }[]>;
    getMyNotes(userId: string, orgId: string): Promise<{
        id: any;
        rep_id: any;
        rep_name: any;
        content: any;
        priority: any;
        created_at: any;
        is_agent_generated: any;
        weakest_skill: any;
    }[]>;
    getMyAssignments(userId: string, orgId: string): Promise<any[]>;
    private getNotes;
}
export declare class SchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly repository;
    private refreshTimer;
    private readonly REFRESH_INTERVAL_MS;
    constructor(repository: M09Repository);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private runRefreshCycle;
    private markOverdueAssignments;
}
