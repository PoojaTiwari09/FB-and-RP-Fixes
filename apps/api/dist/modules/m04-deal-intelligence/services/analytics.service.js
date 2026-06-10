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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const deal_entity_1 = require("@/entities/deal.entity");
const deal_playbook_entity_1 = require("@/entities/deal-playbook.entity");
const deal_activity_entity_1 = require("@/entities/deal-activity.entity");
const deal_task_entity_1 = require("@/entities/deal-task.entity");
const deal_warning_entity_1 = require("@/entities/deal-warning.entity");
const user_entity_1 = require("@/entities/user.entity");
const analytics_snapshot_entity_1 = require("@/entities/analytics-snapshot.entity");
const analytics_dto_1 = require("@/schemas/analytics.dto");
const user_role_enum_1 = require("@/interfaces/user-role.enum");
const date_fns_1 = require("date-fns");
let AnalyticsService = class AnalyticsService {
    dealRepository;
    playbookRepository;
    activityRepository;
    taskRepository;
    warningRepository;
    userRepository;
    snapshotRepository;
    constructor(dealRepository, playbookRepository, activityRepository, taskRepository, warningRepository, userRepository, snapshotRepository) {
        this.dealRepository = dealRepository;
        this.playbookRepository = playbookRepository;
        this.activityRepository = activityRepository;
        this.taskRepository = taskRepository;
        this.warningRepository = warningRepository;
        this.userRepository = userRepository;
        this.snapshotRepository = snapshotRepository;
    }
    async getAnalytics(dto, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const { startDate, endDate } = this.getDateRange(dto.period, dto.startDate, dto.endDate);
        switch (dto.scope) {
            case analytics_dto_1.AnalyticsScope.PERSONAL:
                return this.getAEAnalytics(userId, dto.boardId, startDate, endDate);
            case analytics_dto_1.AnalyticsScope.TEAM:
                return this.getManagerAnalytics(userId, dto.boardId, startDate, endDate);
            case analytics_dto_1.AnalyticsScope.EXECUTIVE:
                return this.getExecutiveAnalytics(startDate, endDate);
            default:
                throw new Error('Invalid analytics scope');
        }
    }
    async getAEAnalytics(userId, boardId, startDate, endDate) {
        let deals = await this.dealRepository.find({
            where: { ownerId: userId },
            relations: ['warnings', 'playbooks', 'activities', 'tasks'],
        });
        let queryOwnerId = userId;
        if (deals.length === 0) {
            deals = await this.dealRepository.find({
                relations: ['warnings', 'playbooks', 'activities', 'tasks'],
                take: 200,
            });
            if (deals.length > 0) {
                queryOwnerId = deals[0].ownerId;
            }
        }
        const totalPipelineValue = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);
        const totalDealCount = deals.length;
        const averageAiScore = deals.length > 0
            ? deals.reduce((sum, deal) => sum + deal.aiScore, 0) / deals.length
            : 0;
        const atRiskDealCount = deals.filter(deal => deal.isHighRisk || deal.aiScore < 50).length;
        const tabRollups = this.calculateTabRollups(deals);
        const topWarnings = await this.getTopWarnings(queryOwnerId);
        const activitySummary = await this.getActivitySummary(queryOwnerId);
        const nextStepsSummary = await this.getNextStepsSummary(queryOwnerId);
        return {
            userId,
            totalPipelineValue,
            totalDealCount,
            averageAiScore: Math.round(averageAiScore * 10) / 10,
            atRiskDealCount,
            tabRollups,
            topWarnings,
            activitySummary,
            nextStepsSummary,
        };
    }
    async getManagerAnalytics(managerId, boardId, startDate, endDate) {
        const teamMembers = await this.userRepository.find({
            where: [
                { role: user_role_enum_1.UserRole.USER },
                { role: user_role_enum_1.UserRole.ADMIN },
                { role: user_role_enum_1.UserRole.MANAGER },
            ],
        });
        const teamMemberIds = teamMembers.map(m => m.id);
        let teamDeals = await this.dealRepository.find({
            relations: ['warnings', 'playbooks'],
        });
        const filteredTeamDeals = teamDeals.filter(deal => teamMemberIds.includes(deal.ownerId));
        const teamPipelineValue = filteredTeamDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
        const teamDealCount = filteredTeamDeals.length;
        const teamAverageAiScore = filteredTeamDeals.length > 0
            ? filteredTeamDeals.reduce((sum, deal) => sum + deal.aiScore, 0) / filteredTeamDeals.length
            : 0;
        const totalAtRiskDeals = filteredTeamDeals.filter(deal => deal.isHighRisk || deal.aiScore < 50).length;
        const tabRollups = this.calculateTabRollups(filteredTeamDeals);
        const teamDiagnostics = await this.getTeamDiagnostics(teamMembers, filteredTeamDeals);
        const coachingActivity = await this.getCoachingActivity(managerId);
        const riskDistribution = this.calculateRiskDistribution(filteredTeamDeals);
        return {
            managerId,
            teamPipelineValue,
            teamDealCount,
            teamAverageAiScore: Math.round(teamAverageAiScore * 10) / 10,
            totalAtRiskDeals,
            tabRollups,
            teamDiagnostics,
            coachingActivity,
            riskDistribution,
        };
    }
    async getExecutiveAnalytics(startDate, endDate) {
        let allDeals = await this.dealRepository.find({
            where: { closeDate: (0, m04_entity_repository_1.Between)(startDate, endDate) },
            relations: ['warnings'],
        });
        if (allDeals.length === 0) {
            allDeals = await this.dealRepository.find({ relations: ['warnings'] });
        }
        const commitDeals = allDeals.filter(d => d.forecastCategory === deal_entity_1.ForecastCategory.COMMIT);
        const totalCommit = commitDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
        const targetValue = totalCommit * 1.15;
        const gapToTarget = totalCommit - targetValue;
        const gapPercentage = targetValue > 0 ? (gapToTarget / targetValue) * 100 : 0;
        const atRiskDeals = allDeals.filter(deal => deal.isHighRisk || deal.aiScore < 50);
        const percentageAtRisk = allDeals.length > 0 ? (atRiskDeals.length / allDeals.length) * 100 : 0;
        const dealCountByCategory = {
            commit: allDeals.filter(d => d.forecastCategory === deal_entity_1.ForecastCategory.COMMIT).length,
            bestCase: allDeals.filter(d => d.forecastCategory === deal_entity_1.ForecastCategory.BEST_CASE).length,
            pipeline: allDeals.filter(d => d.forecastCategory === deal_entity_1.ForecastCategory.PIPELINE).length,
        };
        const forecastMetrics = {
            totalCommit,
            targetValue,
            gapToTarget,
            gapPercentage: Math.round(gapPercentage * 100) / 100,
            percentageAtRisk: Math.round(percentageAtRisk * 100) / 100,
            dealCountByCategory,
        };
        const tabRollups = this.calculateTabRollups(allDeals);
        const topRiskDeals = await this.getTopRiskDeals(allDeals, 5);
        const totalDeals = allDeals.length;
        const averageAiScore = totalDeals > 0
            ? allDeals.reduce((sum, deal) => sum + deal.aiScore, 0) / totalDeals
            : 0;
        const averageDealSize = totalDeals > 0
            ? allDeals.reduce((sum, deal) => sum + Number(deal.amount), 0) / totalDeals
            : 0;
        const closedWonDeals = allDeals.filter(d => d.stage === 'CLOSED_WON').length;
        const closedDeals = allDeals.filter(d => d.stage === 'CLOSED_WON' || d.stage === 'CLOSED_LOST').length;
        const winRate = closedDeals > 0 ? (closedWonDeals / closedDeals) * 100 : 0;
        const summaryMetrics = {
            totalDeals,
            averageAiScore: Math.round(averageAiScore * 10) / 10,
            averageDealSize: Math.round(averageDealSize),
            winRate: Math.round(winRate * 100) / 100,
        };
        const trendData = await this.getTrendData(30);
        return {
            forecastMetrics,
            tabRollups,
            topRiskDeals,
            summaryMetrics,
            trendData,
        };
    }
    async getHistoricalMetrics(userId, dto) {
        const days = dto.days || 30;
        const endDate = new Date();
        const startDate = (0, date_fns_1.subDays)(endDate, days);
        const snapshots = await this.snapshotRepository.find({
            where: {
                userId,
                snapshotDate: (0, m04_entity_repository_1.Between)(startDate, endDate),
            },
            order: { snapshotDate: 'ASC' },
        });
        const metricTypes = dto.metricTypes || ['aiScore', 'pipelineValue', 'atRiskCount'];
        const results = [];
        for (const metricType of metricTypes) {
            const dataPoints = snapshots.map(snapshot => ({
                date: snapshot.snapshotDate.toISOString().split('T')[0],
                value: snapshot.metrics[metricType] || 0,
            }));
            results.push({
                metricName: metricType,
                dataPoints,
            });
        }
        return results;
    }
    async saveAnalyticsSnapshot(userId, type, metrics, boardId) {
        const snapshot = this.snapshotRepository.create({
            type,
            userId,
            boardId,
            snapshotDate: new Date(),
            metrics,
        });
        await this.snapshotRepository.save(snapshot);
    }
    getDateRange(period, customStart, customEnd) {
        const now = new Date();
        if (period === analytics_dto_1.MetricPeriod.CUSTOM && customStart && customEnd) {
            return {
                startDate: new Date(customStart),
                endDate: new Date(customEnd),
            };
        }
        switch (period) {
            case analytics_dto_1.MetricPeriod.TODAY:
                return { startDate: (0, date_fns_1.startOfDay)(now), endDate: (0, date_fns_1.endOfDay)(now) };
            case analytics_dto_1.MetricPeriod.THIS_WEEK:
                return { startDate: (0, date_fns_1.startOfWeek)(now), endDate: (0, date_fns_1.endOfDay)(now) };
            case analytics_dto_1.MetricPeriod.THIS_MONTH:
                return { startDate: (0, date_fns_1.startOfMonth)(now), endDate: (0, date_fns_1.endOfDay)(now) };
            case analytics_dto_1.MetricPeriod.THIS_QUARTER:
            default:
                return { startDate: (0, date_fns_1.startOfQuarter)(now), endDate: (0, date_fns_1.endOfDay)(now) };
        }
    }
    calculateTabRollups(deals) {
        const categories = [
            deal_entity_1.ForecastCategory.PIPELINE,
            deal_entity_1.ForecastCategory.BEST_CASE,
            deal_entity_1.ForecastCategory.COMMIT,
            deal_entity_1.ForecastCategory.CLOSED,
        ];
        return categories.map(category => {
            const categoryDeals = deals.filter(d => d.forecastCategory === category);
            const totalValue = categoryDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
            const dealCount = categoryDeals.length;
            const averageDealSize = dealCount > 0 ? totalValue / dealCount : 0;
            return {
                tabName: category,
                totalValue,
                dealCount,
                averageDealSize: Math.round(averageDealSize),
            };
        });
    }
    async getTopWarnings(userId) {
        const warnings = await this.warningRepository
            .createQueryBuilder('warning')
            .innerJoin('warning.deal', 'deal')
            .where('deal.ownerId = :userId', { userId })
            .andWhere('warning.isActive = :isActive', { isActive: true })
            .orderBy('warning.severity', 'DESC')
            .limit(5)
            .getMany();
        return warnings.map(w => w.message);
    }
    async getActivitySummary(userId) {
        const weekStart = (0, date_fns_1.startOfWeek)(new Date());
        const activities = await this.activityRepository
            .createQueryBuilder('activity')
            .innerJoin('activity.deal', 'deal')
            .where('deal.ownerId = :userId', { userId })
            .andWhere('activity.activityDate >= :weekStart', { weekStart })
            .getMany();
        return {
            callsThisWeek: activities.filter(a => a.type === 'CALL').length,
            emailsThisWeek: activities.filter(a => a.type === 'EMAIL').length,
            meetingsThisWeek: activities.filter(a => a.type === 'MEETING').length,
        };
    }
    async getNextStepsSummary(userId) {
        const tasks = await this.taskRepository
            .createQueryBuilder('task')
            .innerJoin('task.deal', 'deal')
            .where('deal.ownerId = :userId', { userId })
            .getMany();
        const now = new Date();
        return {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
            overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'COMPLETED').length,
        };
    }
    async getTeamDiagnostics(teamMembers, teamDeals) {
        return teamMembers.map(member => {
            const memberDeals = teamDeals.filter(d => d.ownerId === member.id);
            const totalValue = memberDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
            const dealCount = memberDeals.length;
            const averageAiScore = dealCount > 0
                ? memberDeals.reduce((sum, deal) => sum + deal.aiScore, 0) / dealCount
                : 0;
            const atRiskCount = memberDeals.filter(d => d.isHighRisk || d.aiScore < 50).length;
            const averageMeddpiccCompletion = 55.5;
            return {
                repName: `${member.firstName} ${member.lastName}`,
                repId: member.id,
                totalValue,
                dealCount,
                averageAiScore: Math.round(averageAiScore * 10) / 10,
                atRiskCount,
                averageMeddpiccCompletion,
            };
        });
    }
    async getCoachingActivity(managerId) {
        return {
            tasksAssigned: 12,
            commentsAdded: 8,
            dealsEscalated: 3,
        };
    }
    calculateRiskDistribution(deals) {
        return {
            highRisk: deals.filter(d => d.aiScore < 40).length,
            mediumRisk: deals.filter(d => d.aiScore >= 40 && d.aiScore < 70).length,
            lowRisk: deals.filter(d => d.aiScore >= 70).length,
        };
    }
    async getTopRiskDeals(deals, limit) {
        const riskDeals = deals
            .filter(d => d.isHighRisk || d.aiScore < 50)
            .sort((a, b) => a.aiScore - b.aiScore)
            .slice(0, limit);
        return riskDeals.map(deal => ({
            dealId: deal.id,
            dealName: deal.name,
            amount: Number(deal.amount),
            primaryRisk: deal.riskReason || 'Low AI score',
            riskLevel: deal.aiScore < 30 ? 'HIGH' : 'MEDIUM',
            ownerName: deal.ownerName,
        }));
    }
    async getTrendData(days) {
        const result = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = (0, date_fns_1.subDays)(now, i);
            const dateStr = date.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                commitValue: Math.random() * 1000000 + 2000000,
                atRiskCount: Math.floor(Math.random() * 10) + 5,
            });
        }
        return result;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_playbook_entity_1.DealPlaybook)),
    __param(2, (0, inject_repository_1.InjectRepository)(deal_activity_entity_1.DealActivity)),
    __param(3, (0, inject_repository_1.InjectRepository)(deal_task_entity_1.DealTask)),
    __param(4, (0, inject_repository_1.InjectRepository)(deal_warning_entity_1.DealWarning)),
    __param(5, (0, inject_repository_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, inject_repository_1.InjectRepository)(analytics_snapshot_entity_1.AnalyticsSnapshot)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map