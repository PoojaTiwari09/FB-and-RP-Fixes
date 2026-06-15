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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealActivityService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const deal_activity_entity_1 = require("@m04/entities/deal-activity.entity");
const deal_entity_1 = require("@m04/entities/deal.entity");
let DealActivityService = class DealActivityService {
    activityRepository;
    dealRepository;
    constructor(activityRepository, dealRepository) {
        this.activityRepository = activityRepository;
        this.dealRepository = dealRepository;
    }
    async getTimeline(dealId, query) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const queryBuilder = this.activityRepository
            .createQueryBuilder('activity')
            .where('activity.dealId = :dealId', { dealId });
        if (query.type) {
            queryBuilder.andWhere('activity.type = :type', { type: query.type });
        }
        if (query.startDate || query.endDate) {
            const startDate = query.startDate ? new Date(query.startDate) : new Date('1970-01-01');
            const endDate = query.endDate ? new Date(query.endDate) : new Date('2100-12-31');
            queryBuilder.andWhere('activity.activityDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        const total = await queryBuilder.getCount();
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const activities = await queryBuilder
            .orderBy('activity.activityDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const byTypeQuery = await this.activityRepository
            .createQueryBuilder('activity')
            .select('activity.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('activity.dealId = :dealId', { dealId })
            .groupBy('activity.type')
            .getRawMany();
        const byType = byTypeQuery.reduce((acc, item) => {
            const type = item.type;
            acc[type] = parseInt(item.count || '0', 10);
            return acc;
        }, {
            [deal_activity_entity_1.ActivityType.CALL]: 0,
            [deal_activity_entity_1.ActivityType.EMAIL]: 0,
            [deal_activity_entity_1.ActivityType.MEETING]: 0,
            [deal_activity_entity_1.ActivityType.NOTE]: 0,
            [deal_activity_entity_1.ActivityType.TASK]: 0,
        });
        const lastActivity = await this.activityRepository.findOne({
            where: { dealId },
            order: { activityDate: 'DESC' },
        });
        return {
            total,
            byType,
            activities: activities.map((a) => this.toResponseDto(a)),
            lastActivityDate: lastActivity?.activityDate,
        };
    }
    async getActivities(dealId, query) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const queryBuilder = this.activityRepository
            .createQueryBuilder('activity')
            .where('activity.dealId = :dealId', { dealId });
        if (query.type) {
            queryBuilder.andWhere('activity.type = :type', { type: query.type });
        }
        if (query.startDate || query.endDate) {
            const startDate = query.startDate ? new Date(query.startDate) : new Date('1970-01-01');
            const endDate = query.endDate ? new Date(query.endDate) : new Date('2100-12-31');
            queryBuilder.andWhere('activity.activityDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        const activities = await queryBuilder
            .orderBy('activity.activityDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return activities.map((a) => this.toResponseDto(a));
    }
    async getActivity(dealId, activityId) {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, dealId },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Activity not found');
        }
        return this.toResponseDto(activity);
    }
    async createActivity(dealId, dto, userId, userName) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const activity = this.activityRepository.create({
            dealId,
            type: dto.type,
            subject: dto.subject,
            summary: dto.summary,
            activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
            contactId: dto.contactId,
            contactName: dto.contactName,
            durationMinutes: dto.durationMinutes,
            crmActivityId: dto.crmActivityId || `manual-${Date.now()}`,
            crmData: dto.crmData,
        });
        const saved = await this.activityRepository.save(activity);
        return this.toResponseDto(saved);
    }
    async updateActivity(dealId, activityId, dto) {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, dealId },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Activity not found');
        }
        if (dto.subject !== undefined) {
            activity.subject = dto.subject;
        }
        if (dto.summary !== undefined) {
            activity.summary = dto.summary;
        }
        if (dto.activityDate !== undefined) {
            activity.activityDate = new Date(dto.activityDate);
        }
        if (dto.contactId !== undefined) {
            activity.contactId = dto.contactId;
        }
        if (dto.contactName !== undefined) {
            activity.contactName = dto.contactName;
        }
        if (dto.durationMinutes !== undefined) {
            activity.durationMinutes = dto.durationMinutes;
        }
        const updated = await this.activityRepository.save(activity);
        return this.toResponseDto(updated);
    }
    async deleteActivity(dealId, activityId) {
        const activity = await this.activityRepository.findOne({
            where: { id: activityId, dealId },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Activity not found');
        }
        await this.activityRepository.remove(activity);
    }
    async syncFromHubSpot(dealId, hubspotActivities) {
        let synced = 0;
        for (const hsActivity of hubspotActivities) {
            const existing = await this.activityRepository.findOne({
                where: {
                    dealId,
                    crmActivityId: hsActivity.id,
                },
            });
            if (existing) {
                continue;
            }
            const type = this.mapHubSpotActivityType(hsActivity.type);
            const activity = this.activityRepository.create({
                dealId,
                type,
                subject: hsActivity.metadata?.subject || hsActivity.type,
                summary: hsActivity.metadata?.body || hsActivity.metadata?.notes,
                activityDate: new Date(hsActivity.createdAt),
                crmActivityId: hsActivity.id,
                crmData: hsActivity,
            });
            await this.activityRepository.save(activity);
            synced++;
        }
        return synced;
    }
    mapHubSpotActivityType(hsType) {
        const typeMap = {
            EMAIL: deal_activity_entity_1.ActivityType.EMAIL,
            CALL: deal_activity_entity_1.ActivityType.CALL,
            MEETING: deal_activity_entity_1.ActivityType.MEETING,
            NOTE: deal_activity_entity_1.ActivityType.NOTE,
            TASK: deal_activity_entity_1.ActivityType.TASK,
        };
        return typeMap[hsType?.toUpperCase()] || deal_activity_entity_1.ActivityType.NOTE;
    }
    toResponseDto(activity) {
        return {
            id: activity.id,
            dealId: activity.dealId,
            type: activity.type,
            subject: activity.subject ?? undefined,
            summary: activity.summary ?? undefined,
            contactId: activity.contactId ?? undefined,
            contactName: activity.contactName ?? undefined,
            activityDate: activity.activityDate,
            durationMinutes: activity.durationMinutes ?? undefined,
            crmActivityId: activity.crmActivityId,
            crmData: activity.crmData ?? undefined,
            createdAt: activity.createdAt,
        };
    }
};
exports.DealActivityService = DealActivityService;
exports.DealActivityService = DealActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_activity_entity_1.DealActivity)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, typeof (_b = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _b : Object])
], DealActivityService);
//# sourceMappingURL=deal-activity.service.js.map