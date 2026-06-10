import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { AuditLog, AuditAction, AuditEntityType } from '@/entities';
export interface CreateAuditLogDto {
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    userId?: string;
    userName?: string;
    changesBefore?: Record<string, any>;
    changesAfter?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
export declare class AuditLogService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(dto: CreateAuditLogDto): Promise<AuditLog>;
    findByEntity(entityType: AuditEntityType, entityId: string, limit?: number): Promise<AuditLog[]>;
    findByUser(userId: string, limit?: number): Promise<AuditLog[]>;
    findByAction(action: AuditAction, limit?: number): Promise<AuditLog[]>;
    findRecentDealUpdates(limit?: number): Promise<AuditLog[]>;
}
