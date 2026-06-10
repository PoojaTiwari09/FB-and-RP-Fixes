import { Period } from '../entities/deal-drivers.entities';
export declare class MatrixQueryDto {
    managerId: string;
    boardId: string;
    period?: Period;
    token?: string;
}
export declare class DrillDownQueryDto {
    repId: string;
    warningId: string;
    boardId: string;
    period?: Period;
}
export declare class BoardComparisonQueryDto {
    baselineBoardId: string;
    comparisonBoardId: string;
    managerId?: string;
    period?: Period;
}
export declare class CoachingQueryDto {
    repId: string;
    boardId: string;
}
export declare enum WarningEventStatus {
    ACTIVE = "ACTIVE",
    RESOLVED = "RESOLVED"
}
export declare class CreateWarningEventDto {
    dealId: string;
    warningId: string;
    status: WarningEventStatus;
    triggeredAt: string;
}
export declare class OpenDealLifecycleDto {
    dealId: string;
    repId: string;
    boardId: string;
    openedAt: string;
}
export declare class CloseDealLifecycleDto {
    closedAt: string;
}
export declare class CreateDealReassignmentDto {
    dealId: string;
    fromRepId: string;
    toRepId: string;
    reassignedAt: string;
}
export declare class BulkWarningEventDto {
    events: CreateWarningEventDto[];
}
export declare class CreateWarningDefinitionDto {
    key: string;
    label: string;
    description?: string;
}
export declare class UpdateWarningDefinitionDto {
    label?: string;
    description?: string;
    isActive?: boolean;
}
