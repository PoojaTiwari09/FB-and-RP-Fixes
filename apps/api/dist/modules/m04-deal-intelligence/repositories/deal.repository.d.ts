import { Deal, DealStage, ForecastCategory } from '@/entities';
import { M04EntityRepository } from '../database/m04-entity.repository';
export interface DealFilters {
    ownerId?: string;
    stage?: DealStage;
    forecastCategory?: ForecastCategory;
    minAmount?: number;
    maxAmount?: number;
    closeDateFrom?: Date;
    closeDateTo?: Date;
    isHighRisk?: boolean;
    search?: string;
}
export declare class DealRepository {
    private readonly dealRepository;
    constructor(dealRepository: M04EntityRepository<Deal>);
    create(deal: Partial<Deal>): Promise<Deal>;
    findById(id: string, relations?: string[]): Promise<Deal | null>;
    findByCrmId(crmDealId: string): Promise<Deal | null>;
    findAll(filters: DealFilters, page?: number, limit?: number): Promise<[Deal[], number]>;
    findByBoardFilters(boardFilters: any[], page?: number, limit?: number): Promise<[Deal[], number]>;
    update(id: string, updates: Partial<Deal>): Promise<Deal | null>;
    delete(id: string): Promise<void>;
    getDealsForOwner(ownerId: string, limit?: number): Promise<Deal[]>;
    getHighRiskDeals(limit?: number): Promise<Deal[]>;
    getDealsClosingSoon(days?: number): Promise<Deal[]>;
    getDealsByForecastCategory(category: ForecastCategory): Promise<Deal[]>;
    calculateTotalValue(filters: DealFilters): Promise<number>;
    countByStage(): Promise<Record<string, number>>;
}
