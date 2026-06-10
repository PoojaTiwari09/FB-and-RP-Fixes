import { WarningType, WarningSeverity } from '@/entities';
export declare class GenerateWarningsDto {
    dealId: string;
}
export declare class DealWarningResponseDto {
    id: string;
    dealId: string;
    type: WarningType;
    severity: WarningSeverity;
    message: string;
    recommendedAction?: string;
    isActive: boolean;
    metadata?: Record<string, any>;
    resolvedAt?: Date;
    resolvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WarningListResponseDto {
    warnings: DealWarningResponseDto[];
    total: number;
}
export declare class QueryWarningDto {
    type?: WarningType;
    severity?: WarningSeverity;
    limit?: number;
}
export declare class ResolveWarningDto {
    warningId: string;
}
