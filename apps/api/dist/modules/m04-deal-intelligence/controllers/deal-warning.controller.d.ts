import { DealWarningService } from '@/services/deal-warning.service';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
import { DealWarningResponseDto, WarningListResponseDto, QueryWarningDto } from '@/schemas/deal-warning.dto';
export declare class DealWarningController {
    private readonly warningService;
    constructor(warningService: DealWarningService);
    generateWarnings(dealId: string, req: AuthenticatedRequest): Promise<DealWarningResponseDto[]>;
    getActiveWarnings(dealId: string): Promise<DealWarningResponseDto[]>;
    getWarningHistory(dealId: string, query: QueryWarningDto): Promise<WarningListResponseDto>;
    resolveWarning(warningId: string, req: AuthenticatedRequest): Promise<DealWarningResponseDto>;
}
export declare class WarningManagementController {
    private readonly warningService;
    constructor(warningService: DealWarningService);
    getCriticalWarnings(query: QueryWarningDto): Promise<DealWarningResponseDto[]>;
    getWarningsByType(query: QueryWarningDto): Promise<DealWarningResponseDto[]>;
    getWarningsBySeverity(query: QueryWarningDto): Promise<DealWarningResponseDto[]>;
}
