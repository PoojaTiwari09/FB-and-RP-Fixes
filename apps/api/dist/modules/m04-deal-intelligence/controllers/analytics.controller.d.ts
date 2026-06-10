import { AnalyticsService } from '@/services/analytics.service';
import { GetAnalyticsRequestDto, AEAnalyticsResponseDto, ManagerAnalyticsResponseDto, ExecutiveAnalyticsResponseDto, HistoricalMetricsRequestDto, HistoricalMetricsResponseDto } from '@/schemas/analytics.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getAnalytics(dto: GetAnalyticsRequestDto, req: AuthenticatedRequest): Promise<AEAnalyticsResponseDto | ManagerAnalyticsResponseDto | ExecutiveAnalyticsResponseDto>;
    getHistoricalMetrics(dto: HistoricalMetricsRequestDto, req: AuthenticatedRequest): Promise<HistoricalMetricsResponseDto[]>;
    getAEAnalytics(boardId: string | undefined, req: AuthenticatedRequest): Promise<AEAnalyticsResponseDto>;
    getManagerAnalytics(boardId: string | undefined, req: AuthenticatedRequest): Promise<ManagerAnalyticsResponseDto>;
    getExecutiveAnalytics(req: AuthenticatedRequest): Promise<ExecutiveAnalyticsResponseDto>;
}
