import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(auditLog);
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: AuditAction, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findRecentDealUpdates(limit: number = 30): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType: AuditEntityType.DEAL, action: AuditAction.UPDATE_DEAL },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
