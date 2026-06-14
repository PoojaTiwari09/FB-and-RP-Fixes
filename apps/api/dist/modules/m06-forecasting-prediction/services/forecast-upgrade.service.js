"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastUpgradeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const crypto = __importStar(require("crypto"));
let ForecastUpgradeService = class ForecastUpgradeService {
    prisma;
    eventPublisher;
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    async getSubmissions(periodId, repId) {
        const subs = await this.prisma.forecastSubmission.findMany({
            where: { periodId, repUserId: repId, NOT: { dealId: null } },
            orderBy: [{ dealId: 'asc' }, { version: 'desc' }],
        });
        const latestMap = new Map();
        for (const sub of subs) {
            if (sub.dealId && !latestMap.has(sub.dealId)) {
                latestMap.set(sub.dealId, sub);
            }
        }
        const result = [];
        for (const [dealId, sub] of latestMap.entries()) {
            const deal = await this.prisma.crmDeal.findUnique({ where: { id: dealId } });
            result.push({
                id: sub.id,
                deal_id: dealId,
                deal_name: deal?.dealName ?? 'Deal',
                best_case_value: sub.bestCaseForecast ?? 0,
                commit_value: sub.commitForecast ?? 0,
                best_case_state: sub.bestCaseState,
                commit_state: sub.commitState,
                approved_best_case: sub.approvedBestCase,
                approved_commit: sub.approvedCommit,
            });
        }
        return result;
    }
    async createOrUpdateSubmission(repId, dealId, periodId, field, value) {
        const latest = await this.prisma.forecastSubmission.findFirst({
            where: { repUserId: repId, dealId, periodId },
            orderBy: { version: 'desc' },
        });
        const isBestCase = field === 'best_case';
        let sub;
        if (latest && latest.status === 'draft' && latest.bestCaseState === 'editable' && latest.commitState === 'editable') {
            sub = await this.prisma.forecastSubmission.update({
                where: { id: latest.id },
                data: {
                    bestCaseForecast: isBestCase ? value : latest.bestCaseForecast,
                    commitForecast: !isBestCase ? value : latest.commitForecast,
                }
            });
        }
        else {
            const version = (latest?.version ?? 0) + 1;
            const bestCaseForecast = isBestCase ? value : (latest?.bestCaseForecast ?? 0);
            const commitForecast = !isBestCase ? value : (latest?.commitForecast ?? 0);
            sub = await this.prisma.forecastSubmission.create({
                data: {
                    tenantid: latest?.tenantid ?? '00000000-0000-0000-0000-000000000001',
                    periodId,
                    repUserId: repId,
                    dealId,
                    lob: latest?.lob ?? 'Enterprise',
                    version,
                    bestCaseForecast,
                    commitForecast,
                    bestCaseState: latest?.bestCaseState ?? 'editable',
                    commitState: latest?.commitState ?? 'editable',
                    approvedBestCase: latest?.approvedBestCase ?? null,
                    approvedCommit: latest?.approvedCommit ?? null,
                    status: latest?.status ?? 'draft',
                },
            });
        }
        if (!latest) {
            await this.logActivity(sub.id, 'draft_created', repId, `Draft created for deal: ${dealId}`);
        }
        return sub;
    }
    async submitForecast(id, repId, field) {
        const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
        if (!latest)
            throw new common_1.NotFoundException('Submission not found');
        const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'submitted' : latest.bestCaseState;
        const nextCommitState = (field === 'commit' || field === 'both') ? 'submitted' : latest.commitState;
        const sub = await this.prisma.forecastSubmission.create({
            data: {
                tenantid: latest.tenantid,
                periodId: latest.periodId,
                repUserId: latest.repUserId,
                dealId: latest.dealId,
                lob: latest.lob,
                version: latest.version + 1,
                bestCaseForecast: latest.bestCaseForecast,
                commitForecast: latest.commitForecast,
                bestCaseState: nextBestCaseState,
                commitState: nextCommitState,
                approvedBestCase: latest.approvedBestCase,
                approvedCommit: latest.approvedCommit,
                status: 'submitted',
            },
        });
        await this.logActivity(sub.id, 'submitted', repId, `Submitted ${field} forecast for deal: ${latest.dealId}`);
        this.eventPublisher?.publish('forecast.submitted', {
            tenantid: sub.tenantid,
            correlationId: crypto.randomUUID(),
            payload: {
                submissionId: sub.id,
                periodId: sub.periodId,
                userId: sub.repUserId,
                submittedAmount: sub.commitForecast,
                version: sub.version,
                lob: sub.lob,
            },
        });
        return { id: sub.id, best_case_state: sub.bestCaseState, commit_state: sub.commitState };
    }
    async approveSubmission(id, managerId, field) {
        const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
        if (!latest)
            throw new common_1.NotFoundException('Submission not found');
        const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'approved' : latest.bestCaseState;
        const nextCommitState = (field === 'commit' || field === 'both') ? 'approved' : latest.commitState;
        const approvedBestCase = (field === 'best_case' || field === 'both') ? latest.bestCaseForecast : latest.approvedBestCase;
        const approvedCommit = (field === 'commit' || field === 'both') ? latest.commitForecast : latest.approvedCommit;
        const sub = await this.prisma.forecastSubmission.create({
            data: {
                tenantid: latest.tenantid,
                periodId: latest.periodId,
                repUserId: latest.repUserId,
                dealId: latest.dealId,
                lob: latest.lob,
                version: latest.version + 1,
                bestCaseForecast: latest.bestCaseForecast,
                commitForecast: latest.commitForecast,
                bestCaseState: nextBestCaseState,
                commitState: nextCommitState,
                approvedBestCase,
                approvedCommit,
                status: 'approved',
                managerId,
            },
        });
        await this.logActivity(sub.id, 'approved', managerId, `Approved ${field} forecast`);
        const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
        const rep = await this.prisma.forecastUser.findFirst({ where: { id: latest.repUserId } });
        await this.createNotification(latest.repUserId, rep?.name ?? 'Rep', sub.id, 'approved', field, deal?.dealName ?? 'Deal', approvedBestCase, approvedCommit);
        if (approvedCommit !== null && latest.dealId) {
            await this.syncManualForecast(latest.repUserId, latest.dealId, latest.periodId, approvedCommit);
        }
        return {
            id: sub.id,
            approved_best_case: sub.approvedBestCase,
            approved_commit: sub.approvedCommit,
            best_case_state: sub.bestCaseState,
            commit_state: sub.commitState,
        };
    }
    async reopenSubmission(id, managerId) {
        const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
        if (!latest)
            throw new common_1.NotFoundException('Submission not found');
        const sub = await this.prisma.forecastSubmission.create({
            data: {
                tenantid: latest.tenantid,
                periodId: latest.periodId,
                repUserId: latest.repUserId,
                dealId: latest.dealId,
                lob: latest.lob,
                version: latest.version + 1,
                bestCaseForecast: latest.bestCaseForecast,
                commitForecast: latest.commitForecast,
                bestCaseState: 'reopened',
                commitState: 'reopened',
                approvedBestCase: latest.approvedBestCase,
                approvedCommit: latest.approvedCommit,
                status: 'reopened',
                managerId,
            },
        });
        await this.logActivity(sub.id, 'reopened', managerId, 'Reopened submission');
        const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
        const rep = await this.prisma.forecastUser.findFirst({ where: { id: latest.repUserId } });
        await this.createNotification(latest.repUserId, rep?.name ?? 'Rep', sub.id, 'reopened', 'both', deal?.dealName ?? 'Deal', latest.bestCaseForecast, latest.commitForecast);
        return { id: sub.id, best_case_state: sub.bestCaseState, commit_state: sub.commitState };
    }
    async overrideSubmission(id, managerId, field, overrideValue) {
        const latest = await this.prisma.forecastSubmission.findUnique({ where: { id } });
        if (!latest)
            throw new common_1.NotFoundException('Submission not found');
        const nextBestCaseState = (field === 'best_case' || field === 'both') ? 'overridden' : latest.bestCaseState;
        const nextCommitState = (field === 'commit' || field === 'both') ? 'overridden' : latest.commitState;
        const approvedBestCase = (field === 'best_case' || field === 'both') ? overrideValue : latest.approvedBestCase;
        const approvedCommit = (field === 'commit' || field === 'both') ? overrideValue : latest.approvedCommit;
        const sub = await this.prisma.forecastSubmission.create({
            data: {
                tenantid: latest.tenantid,
                periodId: latest.periodId,
                repUserId: latest.repUserId,
                dealId: latest.dealId,
                lob: latest.lob,
                version: latest.version + 1,
                bestCaseForecast: latest.bestCaseForecast,
                commitForecast: latest.commitForecast,
                bestCaseState: nextBestCaseState,
                commitState: nextCommitState,
                approvedBestCase,
                approvedCommit,
                status: latest.status,
                managerId,
                overriddenBy: managerId,
            },
        });
        await this.logActivity(sub.id, 'overridden', managerId, `Overrode ${field} with value ${overrideValue}`);
        const deal = await this.prisma.crmDeal.findUnique({ where: { id: latest.dealId || '' } });
        const rep = await this.prisma.forecastUser.findFirst({ where: { id: latest.repUserId } });
        await this.createNotification(latest.repUserId, rep?.name ?? 'Rep', sub.id, 'overridden', field, deal?.dealName ?? 'Deal', approvedBestCase, approvedCommit);
        if (approvedCommit !== null && latest.dealId) {
            await this.syncManualForecast(latest.repUserId, latest.dealId, latest.periodId, approvedCommit);
        }
        return {
            id: sub.id,
            approved_best_case: sub.approvedBestCase,
            approved_commit: sub.approvedCommit,
            best_case_state: sub.bestCaseState,
            commit_state: sub.commitState,
        };
    }
    async getNotifications(repId) {
        const list = await this.prisma.forecastNotification.findMany({
            where: { repId, isSeen: false },
            orderBy: { createdAt: 'desc' },
        });
        return list.map((n) => ({
            id: n.id,
            action_type: n.actionType,
            request_type: n.requestType ?? 'both',
            deal_name: n.dealName,
            rep_name: n.repName ?? 'Rep',
            best_case_value: n.bestCaseValue ?? n.finalValue,
            commit_value: n.commitValue ?? n.finalValue,
            created_at: n.createdAt.toISOString(),
        }));
    }
    async markNotificationSeen(id) {
        await this.prisma.forecastNotification.update({
            where: { id },
            data: { isSeen: true },
        });
        return { success: true };
    }
    async getSubmissionActivity(submissionId) {
        const list = await this.prisma.forecastAuditLog.findMany({
            where: { forecastSubmissionId: submissionId },
            orderBy: { createdAt: 'asc' },
        });
        const result = [];
        for (const log of list) {
            const actor = await this.prisma.forecastUser.findFirst({ where: { id: log.actorId } });
            result.push({
                id: log.id,
                status: log.action,
                performed_by_name: actor?.name ?? log.actorName ?? 'System',
                timestamp: log.createdAt.toISOString(),
                notes: log.metadata?.notes ?? null,
            });
        }
        return result;
    }
    async logActivity(submissionId, status, performedByUserId, notes) {
        const actor = await this.prisma.forecastUser.findFirst({ where: { id: performedByUserId } });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantid: '00000000-0000-0000-0000-000000000001',
                forecastSubmissionId: submissionId,
                action: status,
                actorId: performedByUserId,
                actorName: actor?.name ?? 'System',
                actorRole: actor?.role ?? 'System',
                metadata: notes ? { notes } : undefined,
            },
        });
    }
    async createNotification(repId, repName, submissionId, actionType, requestType, dealName, bestCaseValue, commitValue) {
        await this.prisma.forecastNotification.create({
            data: {
                tenantid: '00000000-0000-0000-0000-000000000001',
                repId,
                repName,
                submissionId,
                actionType,
                requestType,
                dealName,
                bestCaseValue,
                commitValue,
                finalValue: commitValue ?? bestCaseValue ?? 0,
                isSeen: false,
            },
        });
    }
    async getTargets(periodId) {
        const list = await this.prisma.quota.findMany({ where: { periodId } });
        const result = [];
        for (const q of list) {
            const rep = await this.prisma.forecastUser.findFirst({ where: { id: q.repUserId } });
            result.push({
                rep_id: q.repUserId,
                rep_name: rep?.name ?? 'Rep',
                target_value: q.amount,
            });
        }
        return result;
    }
    async assignTargets(periodId, managerId, assignments) {
        for (const assign of assignments) {
            await this.prisma.quota.upsert({
                where: {
                    tenantid_periodId_repUserId: {
                        tenantid: '00000000-0000-0000-0000-000000000001',
                        periodId,
                        repUserId: assign.rep_id,
                    },
                },
                create: {
                    tenantid: '00000000-0000-0000-0000-000000000001',
                    periodId,
                    repUserId: assign.rep_id,
                    amount: assign.target_value,
                },
                update: {
                    amount: assign.target_value,
                },
            });
        }
        return { assigned_count: assignments.length };
    }
    async getPeriods() {
        const periods = await this.prisma.forecastPeriod.findMany({
            orderBy: { startDate: 'desc' },
        });
        return periods.map((p) => ({
            id: p.id,
            name: p.name,
            start_date: p.startDate.toISOString().slice(0, 10),
            end_date: p.endDate.toISOString().slice(0, 10),
            submission_deadline: p.submissionDeadline ? p.submissionDeadline.toISOString().slice(0, 10) : p.endDate.toISOString().slice(0, 10),
        }));
    }
    async getPeriodReps(periodId) {
        const subs = await this.prisma.forecastSubmission.findMany({
            where: { periodId },
            select: { repUserId: true },
            distinct: ['repUserId'],
        });
        const quotas = await this.prisma.quota.findMany({
            where: { periodId },
            select: { repUserId: true },
            distinct: ['repUserId'],
        });
        const repIds = Array.from(new Set([...subs.map(s => s.repUserId), ...quotas.map(q => q.repUserId)]));
        const result = [];
        for (const repId of repIds) {
            const rep = await this.prisma.forecastUser.findFirst({ where: { id: repId } });
            if (rep) {
                result.push({ rep_id: rep.id, rep_name: rep.name });
            }
        }
        return result;
    }
    async getClosedDealsTotal(repId, periodId) {
        const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
        if (!period)
            return { rep_id: repId, period_id: periodId, total_closed_value: 0 };
        const deals = await this.prisma.crmDeal.findMany({
            where: {
                repUserId: repId,
                stage: 'Closed Won',
                isClosedWon: true,
                closeDate: { gte: period.startDate, lte: period.endDate },
            },
        });
        const total = deals.reduce((sum, d) => sum + d.amount, 0);
        return { rep_id: repId, period_id: periodId, total_closed_value: total };
    }
    async getClosedDealValue(repId, dealId) {
        const deal = await this.prisma.crmDeal.findFirst({
            where: { id: dealId, repUserId: repId, isClosedWon: true, stage: 'Closed Won' },
        });
        return { deal_id: dealId, closed_value: deal ? deal.amount : 0 };
    }
    async getPipelineTotal(repId, periodId) {
        const row = await this.prisma.pipelineValuesCache.findUnique({
            where: {
                tenantid_periodId_repId_dealId: {
                    tenantid: '00000000-0000-0000-0000-000000000001',
                    periodId,
                    repId,
                    dealId: '00000000-0000-0000-0000-000000000000',
                },
            },
        });
        if (!row) {
            await this.recomputePipeline(repId, '', periodId);
            const recomputed = await this.prisma.pipelineValuesCache.findUnique({
                where: {
                    tenantid_periodId_repId_dealId: {
                        tenantid: '00000000-0000-0000-0000-000000000001',
                        periodId,
                        repId,
                        dealId: '00000000-0000-0000-0000-000000000000',
                    },
                },
            });
            return { rep_id: repId, period_id: periodId, pipeline_value: recomputed ? recomputed.pipelineValue : 0 };
        }
        return { rep_id: repId, period_id: periodId, pipeline_value: row.pipelineValue };
    }
    async getPipelineDealValue(repId, dealId, periodId) {
        const row = await this.prisma.pipelineValuesCache.findUnique({
            where: {
                tenantid_periodId_repId_dealId: {
                    tenantid: '00000000-0000-0000-0000-000000000001',
                    periodId,
                    repId,
                    dealId,
                },
            },
        });
        if (!row) {
            await this.recomputePipeline(repId, dealId, periodId);
            const recomputed = await this.prisma.pipelineValuesCache.findUnique({
                where: {
                    tenantid_periodId_repId_dealId: {
                        tenantid: '00000000-0000-0000-0000-000000000001',
                        periodId,
                        repId,
                        dealId,
                    },
                },
            });
            return { deal_id: dealId, period_id: periodId, pipeline_value: recomputed ? recomputed.pipelineValue : 0 };
        }
        return { deal_id: dealId, period_id: periodId, pipeline_value: row.pipelineValue };
    }
    async recomputePipeline(repId, dealId, periodId) {
        const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
        if (!period)
            return;
        if (dealId) {
            const deal = await this.prisma.crmDeal.findUnique({ where: { id: dealId } });
            if (deal && !deal.isClosedWon && !deal.isClosedLost) {
                const val = deal.amount * (deal.probability ?? 0.4);
                await this.prisma.pipelineValuesCache.upsert({
                    where: {
                        tenantid_periodId_repId_dealId: {
                            tenantid: '00000000-0000-0000-0000-000000000001',
                            periodId,
                            repId,
                            dealId,
                        },
                    },
                    create: {
                        tenantid: '00000000-0000-0000-0000-000000000001',
                        periodId,
                        repId,
                        dealId,
                        pipelineValue: val,
                    },
                    update: { pipelineValue: val, computedAt: new Date() },
                });
            }
        }
        const allDeals = await this.prisma.crmDeal.findMany({
            where: {
                repUserId: repId,
                isClosedWon: false,
                isClosedLost: false,
                closeDate: { gte: period.startDate, lte: period.endDate },
            },
        });
        const totalVal = allDeals.reduce((sum, d) => sum + (d.amount * (d.probability ?? 0.4)), 0);
        await this.prisma.pipelineValuesCache.upsert({
            where: {
                tenantid_periodId_repId_dealId: {
                    tenantid: '00000000-0000-0000-0000-000000000001',
                    periodId,
                    repId,
                    dealId: '00000000-0000-0000-0000-000000000000',
                },
            },
            create: {
                tenantid: '00000000-0000-0000-0000-000000000001',
                periodId,
                repId,
                dealId: '00000000-0000-0000-0000-000000000000',
                pipelineValue: totalVal,
            },
            update: { pipelineValue: totalVal, computedAt: new Date() },
        });
    }
    async getAiPredictionScores(repId) {
        const deals = await this.prisma.crmDeal.findMany({
            where: { repUserId: repId, isClosedWon: false, isClosedLost: false, aiPredictionScore: { not: null } },
            select: { id: true, aiPredictionScore: true },
        });
        return deals.map(d => ({
            deal_id: d.id,
            ai_prediction_score: d.aiPredictionScore,
        }));
    }
    async syncManualForecast(repId, dealId, periodId, finalValue) {
        await this.prisma.crmDeal.update({
            where: { id: dealId },
            data: {
                manualForecast: finalValue,
                manualForecastUpdatedAt: new Date(),
            },
        });
    }
    async getPeriods() {
        const periods = await this.prisma.forecastPeriod.findMany({
            where: { tenantid: '00000000-0000-0000-0000-000000000001' },
            orderBy: { startDate: 'desc' },
        });
        return periods.map((period) => ({
            id: period.id,
            name: period.name,
            start_date: period.startDate.toISOString().slice(0, 10),
            end_date: period.endDate.toISOString().slice(0, 10),
            submission_deadline: period.endDate.toISOString().slice(0, 10),
            is_locked: period.isLocked,
        }));
    }
    async getPeriodReps(periodId) {
        const reps = await this.prisma.forecastUser.findMany({
            where: { tenantid: '00000000-0000-0000-0000-000000000001', role: 'sales_rep' },
        });
        return reps.map(r => ({ rep_id: r.id, name: r.name }));
    }
    async getRepDrilldown(repId, periodId) {
        const period = await this.prisma.forecastPeriod.findUnique({ where: { id: periodId } });
        if (!period)
            throw new common_1.NotFoundException('Period not found');
        const deals = await this.prisma.crmDeal.findMany({
            where: { repUserId: repId, closeDate: { gte: period.startDate, lte: period.endDate } },
        });
        const result = [];
        for (const deal of deals) {
            const latestSub = await this.prisma.forecastSubmission.findFirst({
                where: { periodId, repUserId: repId, dealId: deal.id },
                orderBy: { version: 'desc' },
            });
            const pipeVal = await this.getPipelineDealValue(repId, deal.id, periodId);
            const scoreList = await this.getAiPredictionScores(repId);
            const score = scoreList.find((s) => s.deal_id === deal.id)?.ai_prediction_score ?? 65;
            const closedVal = deal.isClosedWon ? deal.amount : 0;
            const hasPending = latestSub?.commitState === 'submitted' || latestSub?.bestCaseState === 'submitted';
            const isPastDue = new Date(deal.closeDate) < new Date() && !deal.isClosedWon && !deal.isClosedLost;
            result.push({
                id: latestSub?.id ?? null,
                deal_id: deal.id,
                deal_name: deal.dealName,
                account_name: deal.dealName.split(' ')[0] ?? 'Account',
                amount: deal.amount,
                stage: deal.stage,
                close_date: deal.closeDate.toISOString(),
                is_closed_won: deal.isClosedWon,
                is_closed_lost: deal.isClosedLost,
                is_past_due: isPastDue,
                pipeline_value: pipeVal.pipeline_value,
                best_case_value: latestSub?.bestCaseForecast ?? 0,
                approved_best_case: latestSub?.approvedBestCase ?? null,
                best_case_state: latestSub?.bestCaseState ?? 'editable',
                commit_value: latestSub?.commitForecast ?? 0,
                approved_commit: latestSub?.approvedCommit ?? null,
                commit_state: latestSub?.commitState ?? 'editable',
                closed_value: closedVal,
                ai_prediction_score: score,
                has_pending_request: hasPending,
                manager_annotation: latestSub?.managerComment ?? null,
                requested_best_case: latestSub?.bestCaseState === 'submitted' ? (latestSub?.bestCaseForecast ?? null) : null,
                requested_commit: latestSub?.commitState === 'submitted' ? (latestSub?.commitForecast ?? null) : null,
                requested_best_case_note: latestSub?.bestCaseState === 'submitted' ? (latestSub?.notes ?? null) : null,
                requested_commit_note: latestSub?.commitState === 'submitted' ? (latestSub?.notes ?? null) : null,
            });
        }
        return result;
    }
    async getRepDrilldownSummary(repId, periodId) {
        const drilldown = await this.getRepDrilldown(repId, periodId);
        const pipeline_total = drilldown.reduce((sum, d) => sum + d.pipeline_value, 0);
        const best_case_total = drilldown.reduce((sum, d) => sum + (d.approved_best_case !== null ? d.approved_best_case : d.best_case_value), 0);
        const commit_total = drilldown.reduce((sum, d) => sum + (d.approved_commit !== null ? d.approved_commit : d.commit_value), 0);
        const closed_won_total = drilldown.reduce((sum, d) => sum + d.closed_value, 0);
        return {
            pipeline_total,
            best_case_total,
            commit_total,
            closed_won_total,
        };
    }
    async getManagerBoard(managerId, periodId) {
        const reps = await this.prisma.forecastUser.findMany({
            where: { tenantid: '00000000-0000-0000-0000-000000000001', role: 'sales_rep', managerId },
        });
        const result = [];
        for (const rep of reps) {
            const summary = await this.getRepDrilldownSummary(rep.id, periodId);
            const quota = await this.prisma.quota.findFirst({
                where: { periodId, repUserId: rep.id },
            });
            const scores = await this.getAiPredictionScores(rep.id);
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + (s.ai_prediction_score ?? 0), 0) / scores.length) : 75;
            const targetVal = quota ? quota.amount : 0;
            const progress = targetVal > 0 ? ((summary.closed_won_total + summary.commit_total) / targetVal) * 100 : 0;
            const drilldownDeals = await this.getRepDrilldown(rep.id, periodId);
            const hasPending = drilldownDeals.some((d) => d.has_pending_request);
            result.push({
                rep_id: rep.id,
                rep_name: rep.name,
                pipeline_total: summary.pipeline_total,
                best_case_total: summary.best_case_total,
                commit_total: summary.commit_total,
                closed_total: summary.closed_won_total,
                ai_prediction_score: avgScore,
                target_value: targetVal,
                target_progress_pct: Math.round(progress),
                has_pending_requests: hasPending,
            });
        }
        return result;
    }
};
exports.ForecastUpgradeService = ForecastUpgradeService;
exports.ForecastUpgradeService = ForecastUpgradeService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_publisher_service_1.EventPublisherService])
], ForecastUpgradeService);
//# sourceMappingURL=forecast-upgrade.service.js.map