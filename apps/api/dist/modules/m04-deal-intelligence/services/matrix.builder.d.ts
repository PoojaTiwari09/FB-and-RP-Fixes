import { DealDriversMatrix, Period, PeriodWindow, RepDealSet, ActivationMap } from '../entities/deal-drivers.entities';
interface RepInfo {
    id: string;
    name: string;
    segment: string | null;
}
interface WarningDef {
    warningId: string;
    warningKey: string;
    label: string;
    sortOrder: number;
}
export declare function buildMatrix(params: {
    boardId: string;
    boardName: string;
    managerId: string;
    managerName: string;
    period: Period;
    periodWindow: PeriodWindow;
    reps: RepInfo[];
    warnings: WarningDef[];
    repDealSets: Map<string, RepDealSet>;
    activationMap: ActivationMap;
}): DealDriversMatrix;
export {};
