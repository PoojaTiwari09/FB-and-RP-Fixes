import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealWarning, WarningType, WarningSeverity } from '@/entities';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import { AuditLogService } from './audit-log.service';
export declare class DealWarningService {
    private readonly warningRepository;
    private readonly aiClientService;
    private readonly dealService;
    private readonly auditLogService;
    private readonly logger;
    constructor(warningRepository: Repository<DealWarning>, aiClientService: AIClientService, dealService: DealService, auditLogService: AuditLogService);
    generateWarnings(dealId: string, userId: string): Promise<DealWarning[]>;
    getActiveWarnings(dealId: string): Promise<DealWarning[]>;
    getWarningHistory(dealId: string, limit?: number): Promise<DealWarning[]>;
    resolveWarning(warningId: string, userId: string): Promise<DealWarning>;
    getCriticalWarnings(limit?: number): Promise<DealWarning[]>;
    getWarningsByType(type: WarningType, limit?: number): Promise<DealWarning[]>;
    getWarningsBySeverity(severity: WarningSeverity, limit?: number): Promise<DealWarning[]>;
}
