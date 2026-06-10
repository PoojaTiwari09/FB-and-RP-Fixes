import { DealSummaryService } from '@/services/deal-summary.service';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
import { DealSummaryResponseDto, SummaryHistoryResponseDto, WeeklyChangesResponseDto, QuerySummaryDto } from '@/schemas/deal-summary.dto';
export declare class DealSummaryController {
    private readonly summaryService;
    constructor(summaryService: DealSummaryService);
    generateSummary(dealId: string, req: AuthenticatedRequest): Promise<DealSummaryResponseDto>;
    getCurrentSummary(dealId: string): Promise<DealSummaryResponseDto | null>;
    getSummaryHistory(dealId: string, query: QuerySummaryDto): Promise<SummaryHistoryResponseDto>;
    detectWeeklyChanges(dealId: string): Promise<WeeklyChangesResponseDto>;
    flagForReview(summaryId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    unflagForReview(summaryId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
}
export declare class SummaryManagementController {
    private readonly summaryService;
    constructor(summaryService: DealSummaryService);
    getFlaggedSummaries(query: QuerySummaryDto): Promise<DealSummaryResponseDto[]>;
}
