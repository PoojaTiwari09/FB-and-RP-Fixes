import { DealStage, ForecastCategory } from '@/entities';
export declare class QueryDealDto {
    ownerId?: string;
    stage?: DealStage;
    forecastCategory?: ForecastCategory;
    minAmount?: number;
    maxAmount?: number;
    closeDateFrom?: Date;
    closeDateTo?: Date;
    isHighRisk?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class UpdateDealDto {
    name?: string;
    stage?: DealStage;
    amount?: number;
    forecastCategory?: ForecastCategory;
    closeDate?: Date;
    probability?: number;
    nextStep?: string;
    accountName?: string;
}
export declare class DealResponseDto {
    id: string;
    crmDealId: string;
    name: string;
    stage: DealStage;
    amount: number;
    forecastCategory: ForecastCategory;
    ownerId: string;
    ownerName: string;
    accountId?: string;
    accountName?: string;
    closeDate?: Date;
    probability: number;
    aiScore: number;
    warningCount: number;
    contactCount: number;
    activityStrength: number;
    isHighRisk: boolean;
    riskReason?: string;
    nextStep?: string;
    lastActivityAt?: Date;
    lastSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class DealListResponseDto {
    deals: DealResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class DealStatsResponseDto {
    totalValue: number;
    countByStage: Record<string, number>;
    highRiskCount: number;
    closingSoonCount: number;
}
