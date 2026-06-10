"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DealWarningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealWarningService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const entities_1 = require("@/entities");
const ai_client_service_1 = require("./ai-client.service");
const deal_service_1 = require("./deal.service");
const audit_log_service_1 = require("./audit-log.service");
let DealWarningService = DealWarningService_1 = class DealWarningService {
    warningRepository;
    aiClientService;
    dealService;
    auditLogService;
    logger = new common_1.Logger(DealWarningService_1.name);
    constructor(warningRepository, aiClientService, dealService, auditLogService) {
        this.warningRepository = warningRepository;
        this.aiClientService = aiClientService;
        this.dealService = dealService;
        this.auditLogService = auditLogService;
    }
    async generateWarnings(dealId, userId) {
        this.logger.log(`Generating AI warnings for deal ${dealId}`);
        const deal = await this.dealService.findById(dealId, userId);
        if (!deal) {
            throw new common_1.NotFoundException(`Deal with ID ${dealId} not found`);
        }
        const daysInStage = deal.updatedAt
            ? Math.floor((Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const aiRequest = {
            dealId: deal.id,
            dealName: deal.name,
            stage: deal.stage,
            amount: Number(deal.amount),
            lastActivityDate: deal.lastActivityAt || undefined,
            contactCount: deal.contactCount,
            activityStrength: deal.activityStrength,
            playbookCompletion: 0,
            daysInStage,
            context: deal.crmData || {},
        };
        const aiResponse = await this.aiClientService.generateWarnings(aiRequest);
        await this.warningRepository.update({ dealId, isActive: true }, { isActive: false });
        const warnings = [];
        for (const warning of aiResponse.warnings) {
            const newWarning = this.warningRepository.create({
                dealId: deal.id,
                type: warning.type,
                severity: warning.severity,
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
        await this.dealService.updateWarningCount(dealId, warnings.length);
        const criticalWarnings = warnings.filter((w) => w.severity === entities_1.WarningSeverity.CRITICAL);
        if (criticalWarnings.length > 0) {
            await this.dealService.markAsHighRisk(dealId, criticalWarnings[0].message);
        }
        else if (aiResponse.overallRiskScore > 50) {
            await this.dealService.markAsHighRisk(dealId, `Overall risk score: ${aiResponse.overallRiskScore}`);
        }
        else {
            await this.dealService.clearHighRisk(dealId);
        }
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.GENERATE_WARNINGS,
            entityType: entities_1.AuditEntityType.DEAL,
            entityId: dealId,
            metadata: {
                warningCount: warnings.length,
                criticalCount: criticalWarnings.length,
                overallRiskScore: aiResponse.overallRiskScore,
            },
        });
        return warnings;
    }
    async getActiveWarnings(dealId) {
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
    async getWarningHistory(dealId, limit = 50) {
        return this.warningRepository.find({
            where: { dealId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async resolveWarning(warningId, userId) {
        const warning = await this.warningRepository.findOne({
            where: { id: warningId },
        });
        if (!warning) {
            throw new common_1.NotFoundException(`Warning with ID ${warningId} not found`);
        }
        warning.isActive = false;
        warning.resolvedAt = new Date();
        warning.resolvedBy = userId;
        const updatedWarning = await this.warningRepository.save(warning);
        const activeWarnings = await this.getActiveWarnings(warning.dealId);
        await this.dealService.updateWarningCount(warning.dealId, activeWarnings.length);
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.RESOLVE_WARNING,
            entityType: entities_1.AuditEntityType.DEAL_WARNING,
            entityId: warningId,
            metadata: {
                dealId: warning.dealId,
                warningType: warning.type,
            },
        });
        return updatedWarning;
    }
    async getCriticalWarnings(limit = 20) {
        return this.warningRepository.find({
            where: {
                severity: entities_1.WarningSeverity.CRITICAL,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['deal'],
        });
    }
    async getWarningsByType(type, limit = 50) {
        return this.warningRepository.find({
            where: { type, isActive: true },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['deal'],
        });
    }
    async getWarningsBySeverity(severity, limit = 50) {
        return this.warningRepository.find({
            where: { severity, isActive: true },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['deal'],
        });
    }
};
exports.DealWarningService = DealWarningService;
exports.DealWarningService = DealWarningService = DealWarningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.DealWarning)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        ai_client_service_1.AIClientService,
        deal_service_1.DealService,
        audit_log_service_1.AuditLogService])
], DealWarningService);
//# sourceMappingURL=deal-warning.service.js.map