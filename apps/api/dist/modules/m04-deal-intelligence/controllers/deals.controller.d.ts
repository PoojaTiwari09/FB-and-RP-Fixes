import { PrismaService } from '../database/prisma.service';
import { DealSummaryService } from '../services/deal-summary.service';
interface ApiResponse<T> {
    success: boolean;
    data: T;
    isMock: boolean;
    error?: string;
}
export declare class DealsController {
    private readonly prisma;
    private readonly summaryService;
    private readonly logger;
    constructor(prisma: PrismaService, summaryService: DealSummaryService);
    private getBoardsFromDb;
    getDealBoards(req: any): Promise<ApiResponse<any[]>>;
    getBoardDetail(boardId: string, req: any, owner?: string): Promise<ApiResponse<any>>;
    getDealsByBoard(boardId: string, req: any, owner?: string): Promise<ApiResponse<any[]>>;
    getAllDeals(req: any): Promise<ApiResponse<any[]> & {
        count: number;
    }>;
    getPipelineSummary(req: any): Promise<ApiResponse<any[]>>;
    getDealById(dealId: string, req: any): Promise<ApiResponse<any>>;
    updateDeal(dealId: string, updates: {
        stage?: string;
        forecastCategory?: string;
        amount?: number | string;
        nextStep?: string;
        closeDate?: string;
    }): Promise<ApiResponse<any>>;
    getDealBrief(dealId: string, req: any): Promise<ApiResponse<any>>;
    getDealWarnings(dealId: string): Promise<ApiResponse<any[]>>;
    resolveWarning(dealId: string, warningId: string, body: {
        status: string;
    }): Promise<{
        message: string;
        warningId: string;
        status: string;
        error?: undefined;
    } | {
        message: string;
        error: any;
        warningId?: undefined;
        status?: undefined;
    }>;
    triggerWarningAction(dealId: string, warningId: string): Promise<{
        message: string;
        actionTriggered: boolean;
        status: string;
    }>;
    getDealPlaybook(dealId: string): Promise<ApiResponse<any>>;
    updatePlaybookCriterion(dealId: string, criterionId: string, body: {
        status: string;
        notes?: string;
    }): Promise<{
        message: string;
        criterionId: string;
        updatedStatus: string;
        error?: undefined;
    } | {
        message: string;
        error: any;
        criterionId?: undefined;
        updatedStatus?: undefined;
    }>;
    getDealActivity(dealId: string): Promise<ApiResponse<any>>;
    getDealCrmFields(dealId: string): Promise<ApiResponse<any>>;
    getStageOptions(): ApiResponse<any>;
    getNotifications(repName?: string): Promise<ApiResponse<any>>;
    createNotification(body: {
        repName: string;
        message: string;
        type?: string;
    }): Promise<ApiResponse<any>>;
    markAllNotificationsRead(repName?: string): Promise<ApiResponse<any>>;
    postDealComment(dealId: string, body: {
        comment?: string;
    }): Promise<ApiResponse<any>>;
    getDealComments(dealId: string): Promise<ApiResponse<any[]>>;
    escalateDeal(dealId: string): Promise<ApiResponse<any>>;
    removeEscalation(dealId: string): Promise<ApiResponse<any>>;
    getEscalationStatus(dealId: string): Promise<ApiResponse<any>>;
    createDealTask(body: {
        dealId: string;
        title: string;
        description?: string;
        dueDate?: string;
        assignee?: string;
    }): Promise<ApiResponse<any>>;
}
export declare class DealBoardsRepController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getBoardsFromDb;
    getDealBoards(): Promise<ApiResponse<any[]>>;
    getBoardDetail(boardId: string, owner?: string): Promise<ApiResponse<any>>;
    getDealsByBoard(boardId: string, owner?: string): Promise<ApiResponse<any[]>>;
}
export declare class NotificationsApiController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getNotifications(repName?: string): Promise<ApiResponse<any>>;
    markAllNotificationsRead(repName?: string): Promise<ApiResponse<any>>;
}
export {};
