import { Response } from 'express';
import { DealDriversService } from '../services/deal-drivers.service';
import { MatrixCache } from '../services/matrix.cache';
import { MatrixQueryDto, DrillDownQueryDto, BoardComparisonQueryDto, CoachingQueryDto, CreateWarningEventDto, OpenDealLifecycleDto, CloseDealLifecycleDto, CreateDealReassignmentDto, BulkWarningEventDto } from '../schemas/deal-drivers.dto';
import { DatabaseService } from '../database/database.service';
export declare class DealDriversController {
    private readonly service;
    private readonly db;
    private readonly matrixCache;
    constructor(service: DealDriversService, db: DatabaseService, matrixCache: MatrixCache);
    getMatrix(q: MatrixQueryDto, req: any): Promise<import("../entities/deal-drivers.entities").DealDriversMatrix>;
    getDrillDown(q: DrillDownQueryDto, req: any): Promise<import("../entities/deal-drivers.entities").DrillDownResult>;
    getBoardComparison(q: BoardComparisonQueryDto, req: any): Promise<import("../entities/deal-drivers.entities").BoardComparisonResult>;
    getCoachingEffectiveness(q: CoachingQueryDto, req: any): Promise<import("../entities/deal-drivers.entities").CoachingEffectivenessResult>;
    getBoards(req: any): Promise<any[]>;
    getManagers(req: any): Promise<any[]>;
    getReps(managerId: string, req: any): Promise<any[]>;
    getLastUsedBoard(req: any): Promise<any>;
    getWarnings(): Promise<Record<string, unknown>[]>;
    exportMatrixCsv(q: MatrixQueryDto, req: any, res: Response): Promise<void>;
    createWarningEvent(body: CreateWarningEventDto): Promise<Record<string, unknown>>;
    bulkCreateWarningEvents(body: BulkWarningEventDto): Promise<{
        inserted: number;
        skipped: number;
        errors: {
            index: number;
            reason: string;
        }[];
    }>;
    openDealLifecycle(body: OpenDealLifecycleDto): Promise<Record<string, unknown>>;
    closeDealLifecycle(lifecycleId: string, body: CloseDealLifecycleDto): Promise<Record<string, unknown>>;
    createDealReassignment(body: CreateDealReassignmentDto): Promise<Record<string, unknown>>;
}
