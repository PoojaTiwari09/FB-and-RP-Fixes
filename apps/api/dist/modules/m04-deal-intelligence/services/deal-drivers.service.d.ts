import { DealDriversRepository } from '../repositories/deal-drivers.repository';
import { MatrixCache } from './matrix.cache';
import { Period, DealDriversMatrix, DrillDownResult, BoardComparisonResult, CoachingEffectivenessResult } from '../entities/deal-drivers.entities';
export declare class DealDriversService {
    private readonly repo;
    private readonly matrixCache;
    constructor(repo: DealDriversRepository, matrixCache: MatrixCache);
    private assertAccess;
    private assertManagerAccess;
    getMatrix(params: {
        requestingUserId: string;
        requestingUserRoles: string[];
        managerId: string;
        boardId: string;
        period: Period;
        now?: Date;
    }): Promise<DealDriversMatrix>;
    getDrillDown(params: {
        requestingUserRoles: string[];
        repId: string;
        warningId: string;
        boardId: string;
        period: Period;
        now?: Date;
    }): Promise<DrillDownResult>;
    getBoardComparison(params: {
        requestingUserRoles: string[];
        baselineBoardId: string;
        comparisonBoardId: string;
        managerId: string | null;
        period: Period;
        now?: Date;
    }): Promise<BoardComparisonResult>;
    getCoachingEffectiveness(params: {
        requestingUserRoles: string[];
        repId: string;
        boardId: string;
        now?: Date;
    }): Promise<CoachingEffectivenessResult>;
    private computeRepSnapshot;
    private computeBoardRates;
    private buildInsightSummary;
    private generateComparisonInsight;
    private generateCoachingInsight;
}
