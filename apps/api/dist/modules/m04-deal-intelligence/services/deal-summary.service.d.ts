import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealSummary } from '@/entities';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import { AuditLogService } from './audit-log.service';
export declare class DealSummaryService {
    private readonly summaryRepository;
    private readonly aiClientService;
    private readonly dealService;
    private readonly auditLogService;
    private readonly logger;
    constructor(summaryRepository: Repository<DealSummary>, aiClientService: AIClientService, dealService: DealService, auditLogService: AuditLogService);
    generateSummary(dealId: string, userId: string): Promise<DealSummary>;
    private generateSimulatedBrief;
    getCurrentSummary(dealId: string): Promise<DealSummary | null>;
    getSummaryHistory(dealId: string, limit?: number): Promise<DealSummary[]>;
    detectWeeklyChanges(dealId: string): Promise<Record<string, any>>;
    flagForReview(summaryId: string, userId: string): Promise<void>;
    unflagForReview(summaryId: string, userId: string): Promise<void>;
    getFlaggedSummaries(limit?: number): Promise<DealSummary[]>;
}
