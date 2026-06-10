import { DealService } from '@/services/deal.service';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
import { QueryDealDto, UpdateDealDto, DealResponseDto, DealListResponseDto, DealStatsResponseDto } from '@/schemas/deal.dto';
export declare class DealController {
    private readonly dealService;
    constructor(dealService: DealService);
    findAll(query: QueryDealDto, req: AuthenticatedRequest): Promise<DealListResponseDto>;
    getStats(req: AuthenticatedRequest): Promise<DealStatsResponseDto>;
    getHighRiskDeals(req: AuthenticatedRequest): Promise<DealResponseDto[]>;
    getDealsClosingSoon(req: AuthenticatedRequest): Promise<DealResponseDto[]>;
    getMyDeals(req: AuthenticatedRequest): Promise<DealResponseDto[]>;
    getRecentNotifications(req: AuthenticatedRequest): Promise<any[]>;
    findById(id: string, req: AuthenticatedRequest): Promise<DealResponseDto>;
    update(id: string, updateDto: UpdateDealDto, req: AuthenticatedRequest): Promise<DealResponseDto>;
}
