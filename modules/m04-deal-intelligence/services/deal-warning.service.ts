import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@/database/inject-repository';
import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealWarning, WarningType, WarningSeverity, AuditAction, AuditEntityType } from '@/entities';
import { AIClientService } from './ai-client.service';
import { DealService } from './deal.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class DealWarningService {
  private readonly logger = new Logger(DealWarningService.name);

  constructor(
    @InjectRepository(DealWarning)
    private readonly warningRepository: Repository<DealWarning>,
    private readonly aiClientService: AIClientService,
    private readonly dealService: DealService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async generateWarnings(dealId: string, userId: string): Promise<DealWarning[]> {
    this.logger.log(`Generating AI warnings for deal ${dealId}`);

    const deal = await this.dealService.findById(dealId, userId);
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    // Calculate days in stage
    const daysInStage = deal.updatedAt
      ? Math.floor((Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Prepare AI request
    const aiRequest = {
      dealId: deal.id,
      dealName: deal.name,
      stage: deal.stage,
      amount: Number(deal.amount),
      lastActivityDate: deal.lastActivityAt || undefined,
      contactCount: deal.contactCount,
      activityStrength: deal.activityStrength,
      playbookCompletion: 0, // TODO: Calculate from playbook
      daysInStage,
      context: deal.crmData || {},
    };

    // Call AI service
    const aiResponse = await this.aiClientService.generateWarnings(aiRequest);

    // Deactivate old warnings
    await this.warningRepository.update(
      { dealId, isActive: true },
      { isActive: false },
    );

    // Create new warnings
    const warnings: DealWarning[] = [];
    for (const warning of aiResponse.warnings) {
      const newWarning = this.warningRepository.create({
        dealId: deal.id,
        type: warning.type as WarningType,
        severity: warning.severity as WarningSeverity,
        message: warning.message,
        recommendedAction: warning.recommendedAction,
        isActive: true,
        metadata: {
          overallRiskScore: aiResponse.overallRiskScore,
          isTopRisk: aiResponse.topRisk?.type === warning.type,
        },
      });

      warnings.push(await this.warningRepository.save(newWarning));
    }

    // Update deal warning count and risk status
    await this.dealService.updateWarningCount(dealId, warnings.length);

    const criticalWarnings = warnings.filter(
      (w) => w.severity === WarningSeverity.CRITICAL,
    );
    if (criticalWarnings.length > 0) {
      await this.dealService.markAsHighRisk(
        dealId,
        criticalWarnings[0].message,
      );
    } else if (aiResponse.overallRiskScore > 50) {
      await this.dealService.markAsHighRisk(
        dealId,
        `Overall risk score: ${aiResponse.overallRiskScore}`,
      );
    } else {
      await this.dealService.clearHighRisk(dealId);
    }

    await this.auditLogService.log({
      userId,
      action: AuditAction.GENERATE_WARNINGS,
      entityType: AuditEntityType.DEAL,
      entityId: dealId,
      metadata: {
        warningCount: warnings.length,
        criticalCount: criticalWarnings.length,
        overallRiskScore: aiResponse.overallRiskScore,
      },
    });

    return warnings;
  }

  async getActiveWarnings(dealId: string): Promise<DealWarning[]> {
    const warnings = await this.warningRepository.find({
      where: { dealId, isActive: true },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });

    if (warnings.length === 0) {
      this.logger.log(`No active warnings found for deal ${dealId}. Generating...`);
      const deal = await this.dealService.findDealByIdWithoutLogging(dealId);
      if (deal) {
        return this.generateWarnings(dealId, deal.ownerId);
      }
    }

    return warnings;
  }

  async getWarningHistory(
    dealId: string,
    limit: number = 50,
  ): Promise<DealWarning[]> {
    return this.warningRepository.find({
      where: { dealId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async resolveWarning(
    warningId: string,
    userId: string,
  ): Promise<DealWarning> {
    const warning = await this.warningRepository.findOne({
      where: { id: warningId },
    });

    if (!warning) {
      throw new NotFoundException(`Warning with ID ${warningId} not found`);
    }

    warning.isActive = false;
    warning.resolvedAt = new Date();
    warning.resolvedBy = userId;

    const updatedWarning = await this.warningRepository.save(warning);

    // Update deal warning count
    const activeWarnings = await this.getActiveWarnings(warning.dealId);
    await this.dealService.updateWarningCount(warning.dealId, activeWarnings.length);

    await this.auditLogService.log({
      userId,
      action: AuditAction.RESOLVE_WARNING,
      entityType: AuditEntityType.DEAL_WARNING,
      entityId: warningId,
      metadata: {
        dealId: warning.dealId,
        warningType: warning.type,
      },
    });

    return updatedWarning;
  }

  async getCriticalWarnings(limit: number = 20): Promise<DealWarning[]> {
    return this.warningRepository.find({
      where: {
        severity: WarningSeverity.CRITICAL,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['deal'],
    });
  }

  async getWarningsByType(
    type: WarningType,
    limit: number = 50,
  ): Promise<DealWarning[]> {
    return this.warningRepository.find({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['deal'],
    });
  }

  async getWarningsBySeverity(
    severity: WarningSeverity,
    limit: number = 50,
  ): Promise<DealWarning[]> {
    return this.warningRepository.find({
      where: { severity, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['deal'],
    });
  }
}
