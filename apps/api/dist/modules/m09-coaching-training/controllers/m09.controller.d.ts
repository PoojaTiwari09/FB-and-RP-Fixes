import { ExecutionContext, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { LlmService, SessionsService, ScenariosService, CoachingService, TrainingService, AnalyticsService } from '../services/m09.service';
import { M09Repository } from '../repositories/m09.repository';
import { PrismaService } from '../database/prisma.service';
import { StartSessionDto, SendMessageDto, CreateScenarioDto, UpdateScenarioDto, CreateNoteDto, CreateAssignmentDto, UpdateAssignmentDto, ExportQueryDto } from '../schemas/m09.schema';
export declare class AppController {
    root(): {
        name: string;
        version: string;
        status: string;
        docs: string;
        health: string;
        endpoints: {
            auth: string[];
            sessions: string[];
            scenarios: string[];
            analytics: string[];
            coaching: string[];
            training: string[];
        };
        timestamp: string;
    };
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: string[]) => import("node_modules/@nestjs/common").CustomDecorator<string>;
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("node_modules/@nestjs/common").CustomDecorator<string>;
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly repository;
    private readonly jwtService;
    constructor(reflector: Reflector, repository: M09Repository, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    findAll(user: any): Promise<any>;
    getMySessions(user: any): Promise<any>;
    getVoices(): Promise<any>;
    getVoicesFrontendAlias(): Promise<any>;
    getSessionById(id: string, user: any): Promise<{
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
    getHint(id: string, user: any): Promise<{
        hint: string;
        hints_used: number;
        max_hints: number;
    }>;
    startSession(dto: StartSessionDto, user: any): Promise<{
        id: string;
        sessionId: string;
    }>;
    sendMessage(dto: SendMessageDto, user: any): Promise<{
        reply: string;
        audio: string;
        userText: string;
        live_coaching: any;
    }>;
    sendVoiceMessage(sessionId: string, audio: any, user: any): Promise<{
        userText: string;
        reply: string;
        audio: string;
        live_coaching: any;
    }>;
    endSession(dto: any, user: any): Promise<any>;
    submitSessionToManager(body: {
        sessionId: string;
    }, user: any): Promise<{
        success: boolean;
        assignmentId: string;
        message: string;
    }>;
    retrySession(dto: any, user: any): Promise<{
        id: string;
        sessionId: string;
    }>;
    sendMessageAlias(dto: SendMessageDto, user: any): Promise<{
        reply: string;
        audio: string;
        userText: string;
        live_coaching: any;
    }>;
    sendVoiceMessageAlias(sessionId: string, audio: any, user: any): Promise<{
        userText: string;
        reply: string;
        audio: string;
        live_coaching: any;
    }>;
    getVoicesAlias(): Promise<any>;
    updateSession(id: string, dto: {
        messages_json?: any[];
        status?: string;
    }, user: any): Promise<{
        success: boolean;
    }>;
    analyzeUploadedCall(audio: any, user: any): Promise<any>;
}
export declare class ScenariosController {
    private readonly scenariosService;
    constructor(scenariosService: ScenariosService);
    findAll(user: any): Promise<any>;
    findOne(id: string, user: any): Promise<any>;
    create(dto: CreateScenarioDto, user: any): Promise<any>;
    update(id: string, dto: UpdateScenarioDto, user: any): Promise<any>;
    delete(id: string, user: any): Promise<any>;
    transcribeAudio(audio: any): Promise<{
        transcript: string;
    }>;
    analyzeAudio(audio: any): Promise<{
        raw_transcript: string;
        transcript: string;
        persona: any;
        turn_count: number;
    }>;
    generatePersona(transcript: string): Promise<any>;
}
export declare class CoachingController {
    private readonly coachingService;
    constructor(coachingService: CoachingService);
    getNotes(user: any): Promise<{
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
    createNote(dto: CreateNoteDto, user: any): Promise<{
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
    getRecommendations(user: any): Promise<{
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
    pushRecommendation(dto: {
        repId: string;
        focusArea: string;
        text: string;
    }, user: any): Promise<{
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
export declare class TrainingController {
    private readonly trainingService;
    private readonly sessionsService;
    constructor(trainingService: TrainingService, sessionsService: SessionsService);
    submitSessionToManager(body: {
        sessionId: string;
    }, user: any): Promise<{
        success: boolean;
        assignmentId: string;
        message: string;
    }>;
    createAssignments(dto: CreateAssignmentDto, user: any): Promise<{
        success: boolean;
    }>;
    getAssignments(user: any): Promise<any>;
    updateAssignment(id: string, dto: UpdateAssignmentDto, user: any): Promise<{
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
    deleteAssignment(id: string, user: any): Promise<{
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
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(user: any): Promise<{
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
    getRepsWithStats(user: any): Promise<any>;
    getRepComparison(repId: string, user: any): Promise<{
        radarData: {
            subject: string;
            Team: number;
            Rep: number;
            fullMark: number;
        }[];
    }>;
    getTeamAnalytics(user: any): Promise<{
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
    getActivityMetrics(user: any): Promise<{
        totalSessions: number;
        weeklySessions: number;
        engagementRate: number;
    }>;
    getInteractionAnalytics(user: any): Promise<{
        avgTalkRatio: number;
        avgQuestionsAsked: number;
        avgClosingAttempts: number;
        totalExchanges: number;
    }>;
    getTopicInsights(user: any): Promise<{
        topic: string;
        count: number;
        impact: string;
    }[]>;
    getCallDrilldown(sessionId: string, user: any): Promise<{
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
    getBenchmarks(user: any): Promise<{
        openingTarget: number;
        discoveryTarget: number;
        closingTarget: number;
        talkRatioRange: string;
    }>;
    getManagerReview(user: any): Promise<{
        repsCount: any;
        coachingNotesSent: number;
        activeAssignments: number;
        overdueAssignments: number;
    }>;
    getTrainingReport(user: any): Promise<{
        completionRate: number;
        completedAssignments: number;
        totalAssignments: number;
        averageTeamScore: number;
    }>;
    exportCsv(user: any, query: ExportQueryDto): Promise<string>;
    exportTrainingCsv(user: any, query: ExportQueryDto): Promise<string>;
    getMyAnalytics(user: any): Promise<{
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
    getMyNotes(user: any): Promise<{
        id: any;
        rep_id: any;
        rep_name: any;
        content: any;
        priority: any;
        created_at: any;
        is_agent_generated: any;
        weakest_skill: any;
    }[]>;
    getMyAssignments(user: any): Promise<any[]>;
}
export declare class TestController {
    private readonly prisma;
    private readonly repository;
    private readonly sessionsService;
    private readonly analyticsService;
    private readonly llmService;
    private readonly jwtService;
    constructor(prisma: PrismaService, repository: M09Repository, sessionsService: SessionsService, analyticsService: AnalyticsService, llmService: LlmService, jwtService: JwtService);
    private ensureSeedData;
    health(): Promise<{
        success: boolean;
        database: string;
        aiMode: string;
        provider: string;
        counts: {
            scenarios: any;
        };
        timestamp: string;
    }>;
    seedTestData(): Promise<{
        success: boolean;
        message: string;
        repId: string;
        managerId: string;
        orgId: string;
    }>;
    generateToken(dto: {
        userId: string;
    }): Promise<{
        token: string;
        userId: any;
        org_id: any;
        role: any;
    }>;
    smokeTest(): Promise<{
        success: boolean;
        aiMode: string;
        sessionId: string;
        replyPreview: string;
        finalScore: any;
        analyticsEntries: number;
    }>;
}
