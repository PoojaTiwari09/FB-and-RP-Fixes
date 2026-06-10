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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealDriversService = void 0;
const common_1 = require("@nestjs/common");
const deal_drivers_repository_1 = require("../repositories/deal-drivers.repository");
const matrix_cache_1 = require("./matrix.cache");
const period_util_1 = require("./period.util");
const deal_membership_calculator_1 = require("./deal-membership.calculator");
const warning_activation_calculator_1 = require("./warning-activation.calculator");
const matrix_builder_1 = require("./matrix.builder");
const deal_drivers_entities_1 = require("../entities/deal-drivers.entities");
const ALLOWED_ROLES = [
    deal_drivers_entities_1.UserRole.SALES_MANAGER,
    deal_drivers_entities_1.UserRole.CRO,
    deal_drivers_entities_1.UserRole.ADMIN_REVOPS,
];
let DealDriversService = class DealDriversService {
    repo;
    matrixCache;
    constructor(repo, matrixCache) {
        this.repo = repo;
        this.matrixCache = matrixCache;
    }
    assertAccess(roles) {
        const allowed = roles.some((r) => ALLOWED_ROLES.includes(r));
        if (!allowed)
            throw new common_1.ForbiddenException('Deal Drivers requires manager or higher role.');
    }
    async assertManagerAccess(requestingUserId, requestingUserRoles, managerId) {
        const isSalesManager = requestingUserRoles.includes(deal_drivers_entities_1.UserRole.SALES_MANAGER);
        if (isSalesManager && requestingUserId !== managerId) {
            throw new common_1.ForbiddenException(`Sales managers can only view their own team. Requested manager: ${managerId}`);
        }
        const hasAccess = await this.repo.checkManagerAccess(requestingUserId, managerId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException(`You do not have permission to view manager ${managerId}'s team data.`);
        }
    }
    async getMatrix(params) {
        this.assertAccess(params.requestingUserRoles);
        await this.assertManagerAccess(params.requestingUserId, params.requestingUserRoles, params.managerId);
        const cacheKey = this.matrixCache.key(params.managerId, params.boardId, params.period);
        const cached = this.matrixCache.get(cacheKey);
        if (cached)
            return cached;
        const now = params.now ?? new Date();
        const window = (0, period_util_1.resolvePeriodWindow)(params.period, now);
        const [manager, directReports, boardWarnings] = await Promise.all([
            this.repo.getManagerById(params.managerId),
            this.repo.getDirectReports(params.managerId),
            this.repo.getWarningsForBoard(params.boardId),
        ]);
        if (!manager)
            throw new common_1.NotFoundException(`Manager ${params.managerId} not found`);
        if (directReports.length === 0 || boardWarnings.length === 0) {
            const board = await this.repo.getBoardById(params.boardId);
            const earlyMatrix = (0, matrix_builder_1.buildMatrix)({
                boardId: params.boardId, boardName: board?.name ?? '',
                managerId: params.managerId, managerName: manager.name,
                period: params.period, periodWindow: window,
                reps: directReports.map((r) => ({ id: r.id, name: r.name, segment: r.segment ?? null })),
                warnings: [],
                repDealSets: new Map(),
                activationMap: new Map(),
            });
            this.matrixCache.set(cacheKey, earlyMatrix, params.period);
            return earlyMatrix;
        }
        const board = await this.repo.getBoardById(params.boardId);
        if (!board)
            throw new common_1.NotFoundException(`Board ${params.boardId} not found`);
        const repIds = directReports.map((r) => r.id);
        const warningDefs = boardWarnings.map((bw) => ({
            warningId: bw.warningId,
            warningKey: bw.warningKey,
            label: bw.label,
            sortOrder: bw.sortOrder,
        }));
        const warningIds = warningDefs.map((w) => w.warningId);
        const rawDeals = await this.repo.getQualifyingDealsForTeam(repIds, params.boardId, window);
        const repDealSets = (0, deal_membership_calculator_1.computeRepDealSets)(rawDeals, window);
        const allDealIds = [...new Set(rawDeals.map((d) => d.dealId))];
        const rawEvents = allDealIds.length > 0
            ? await this.repo.getWarningEventsForDeals(allDealIds, warningIds)
            : [];
        const activationMap = (0, warning_activation_calculator_1.computeWarningActivations)(rawEvents, window);
        if (params.requestingUserRoles.includes(deal_drivers_entities_1.UserRole.SALES_MANAGER)) {
            await this.repo.setLastUsedBoard(params.requestingUserId, params.boardId).catch(() => { });
        }
        const reps = directReports.map((r) => ({
            id: r.id, name: r.name, segment: r.segment ?? null,
        }));
        const matrix = (0, matrix_builder_1.buildMatrix)({
            boardId: board.id, boardName: board.name,
            managerId: manager.id, managerName: manager.name,
            period: params.period, periodWindow: window,
            reps, warnings: warningDefs, repDealSets, activationMap,
        });
        this.matrixCache.set(cacheKey, matrix, params.period);
        return matrix;
    }
    async getDrillDown(params) {
        this.assertAccess(params.requestingUserRoles);
        const now = params.now ?? new Date();
        const window = (0, period_util_1.resolvePeriodWindow)(params.period, now);
        const [rep, warning, board] = await Promise.all([
            this.repo.getRepById(params.repId),
            this.repo.getWarningById(params.warningId),
            this.repo.getBoardById(params.boardId),
        ]);
        if (!rep)
            throw new common_1.NotFoundException(`Rep ${params.repId} not found`);
        if (!warning)
            throw new common_1.NotFoundException(`Warning ${params.warningId} not found`);
        if (!board)
            throw new common_1.NotFoundException(`Board ${params.boardId} not found`);
        const rawDeals = await this.repo.getQualifyingDealsForTeam([params.repId], params.boardId, window);
        const repDealSets = (0, deal_membership_calculator_1.computeRepDealSets)(rawDeals, window);
        const repSet = repDealSets.get(params.repId);
        if (!repSet || repSet.dealCount === 0) {
            return {
                repId: rep.id, repName: rep.name,
                warningId: warning.id, warningLabel: warning.label,
                boardId: board.id, boardName: board.name,
                period: params.period, flaggedCount: 0, totalDealCount: 0, percentage: 0, deals: [],
            };
        }
        const rawEvents = await this.repo.getWarningEventsForDeals(repSet.qualifyingDealIds, [params.warningId]);
        const activationMap = (0, warning_activation_calculator_1.computeWarningActivations)(rawEvents, window);
        const flaggedDealIds = repSet.qualifyingDealIds.filter((id) => activationMap.get(id)?.get(params.warningId)?.meetsThreshold === true);
        if (flaggedDealIds.length === 0) {
            return {
                repId: rep.id, repName: rep.name,
                warningId: warning.id, warningLabel: warning.label,
                boardId: board.id, boardName: board.name,
                period: params.period,
                flaggedCount: 0, totalDealCount: repSet.dealCount, percentage: 0, deals: [],
            };
        }
        const dealDetails = await this.repo.getDealDetails(flaggedDealIds);
        const deals = dealDetails.map((d) => ({
            dealId: d.dealId,
            accountName: d.accountName,
            amount: d.amount,
            currency: d.currency,
            crmStage: d.crmStage,
            closeDate: d.closeDate,
            warningActiveHours: activationMap.get(d.dealId)?.get(params.warningId)?.activeHours ?? 0,
            viewDealUrl: `/boards/${params.boardId}/deals/${d.dealId}?tab=warnings`,
        }));
        deals.sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
        const percentage = Math.round((flaggedDealIds.length / repSet.dealCount) * 100);
        return {
            repId: rep.id, repName: rep.name,
            warningId: warning.id, warningLabel: warning.label,
            boardId: board.id, boardName: board.name,
            period: params.period,
            flaggedCount: flaggedDealIds.length,
            totalDealCount: repSet.dealCount,
            percentage, deals,
        };
    }
    async getBoardComparison(params) {
        this.assertAccess(params.requestingUserRoles);
        if (params.baselineBoardId === params.comparisonBoardId) {
            throw new Error('SAME_BOARD_COMPARISON: baseline and comparison boards must be different.');
        }
        const now = params.now ?? new Date();
        const window = (0, period_util_1.resolvePeriodWindow)(params.period, now);
        const [baselineBoard, comparisonBoard, baselineWarnings, comparisonWarnings] = await Promise.all([
            this.repo.getBoardById(params.baselineBoardId),
            this.repo.getBoardById(params.comparisonBoardId),
            this.repo.getWarningsForBoard(params.baselineBoardId),
            this.repo.getWarningsForBoard(params.comparisonBoardId),
        ]);
        if (!baselineBoard)
            throw new common_1.NotFoundException('Baseline board not found');
        if (!comparisonBoard)
            throw new common_1.NotFoundException('Comparison board not found');
        let repIds = [];
        if (params.managerId) {
            const reps = await this.repo.getDirectReports(params.managerId);
            repIds = reps.map((r) => r.id);
        }
        const [baselineRates, comparisonRates] = await Promise.all([
            this.computeBoardRates(params.baselineBoardId, baselineWarnings, repIds, window),
            this.computeBoardRates(params.comparisonBoardId, comparisonWarnings, repIds, window),
        ]);
        const baselineWarningIds = new Set(baselineWarnings.map((w) => w.warningId));
        const comparisonWarningIds = new Set(comparisonWarnings.map((w) => w.warningId));
        const baselineRateMap = new Map(baselineRates.map((r) => [r.warningId, r]));
        const comparisonRateMap = new Map(comparisonRates.map((r) => [r.warningId, r]));
        for (const rate of baselineRates) {
            rate.isBoardSpecific = !comparisonWarningIds.has(rate.warningId);
            rate.deltaFromBaseline = null;
            rate.deltaDirection = null;
        }
        for (const rate of comparisonRates) {
            rate.isBoardSpecific = !baselineWarningIds.has(rate.warningId);
            if (!rate.isBoardSpecific) {
                const base = baselineRateMap.get(rate.warningId);
                if (base) {
                    rate.deltaFromBaseline = rate.percentage - base.percentage;
                    rate.deltaDirection = rate.deltaFromBaseline > 0 ? 'WORSE'
                        : rate.deltaFromBaseline < 0 ? 'BETTER' : 'UNCHANGED';
                }
            }
        }
        const overlappingWarningIds = [...baselineWarningIds].filter((id) => comparisonWarningIds.has(id));
        const overlapping = overlappingWarningIds.map((id) => {
            const base = baselineRateMap.get(id);
            const comp = comparisonRateMap.get(id);
            const delta = comp.percentage - base.percentage;
            return {
                warningId: id,
                label: base.label,
                baselinePct: base.percentage,
                comparisonPct: comp.percentage,
                delta,
                direction: (delta > 0 ? 'WORSE' : delta < 0 ? 'BETTER' : 'UNCHANGED'),
            };
        }).sort((a, b) => b.delta - a.delta);
        const insightText = this.generateComparisonInsight(overlapping, baselineBoard.name, comparisonBoard.name);
        const insightSummary = this.buildInsightSummary(overlapping);
        return {
            baselineBoardId: params.baselineBoardId,
            baselineBoardName: baselineBoard.name,
            comparisonBoardId: params.comparisonBoardId,
            comparisonBoardName: comparisonBoard.name,
            managerId: params.managerId,
            period: params.period,
            baselineRates, comparisonRates, overlappingWarnings: overlapping,
            insightText, insightSummary,
        };
    }
    async getCoachingEffectiveness(params) {
        this.assertAccess(params.requestingUserRoles);
        const now = params.now ?? new Date();
        const [rep, board, warnings] = await Promise.all([
            this.repo.getRepById(params.repId),
            this.repo.getBoardById(params.boardId),
            this.repo.getWarningsForBoard(params.boardId),
        ]);
        if (!rep)
            throw new common_1.NotFoundException(`Rep ${params.repId} not found`);
        if (!board)
            throw new common_1.NotFoundException(`Board ${params.boardId} not found`);
        const warningDefs = warnings.map((bw) => ({
            warningId: bw.warningId, label: bw.label,
        }));
        const warningIds = warningDefs.map((w) => w.warningId);
        const [baselineSnapshot, currentSnapshotRaw] = await Promise.all([
            this.computeRepSnapshot(params.repId, params.boardId, deal_drivers_entities_1.Period.LAST_30_DAYS, warningIds, warningDefs, now),
            this.computeRepSnapshot(params.repId, params.boardId, deal_drivers_entities_1.Period.NOW, warningIds, warningDefs, now),
        ]);
        const baseMap = new Map(baselineSnapshot.map((s) => [s.warningId, s]));
        const currentSnapshot = currentSnapshotRaw.map((curr) => {
            const base = baseMap.get(curr.warningId);
            if (base?.percentage == null || curr.percentage == null) {
                return { ...curr, deltaPercentage: null, direction: null };
            }
            const delta = curr.percentage - base.percentage;
            const direction = delta < 0 ? 'IMPROVED' : delta > 0 ? 'REGRESSED' : 'UNCHANGED';
            return { ...curr, deltaPercentage: delta, direction: direction };
        });
        const improvements = currentSnapshot.filter((s) => s.direction === 'IMPROVED').map((s) => s.warningId);
        const regressions = currentSnapshot.filter((s) => s.direction === 'REGRESSED').map((s) => s.warningId);
        const unchangedCount = currentSnapshot.filter((s) => s.direction === 'UNCHANGED').length;
        let overallDirection;
        if (improvements.length === 0 && regressions.length === 0)
            overallDirection = 'NO_CHANGE';
        else if (improvements.length > regressions.length)
            overallDirection = 'IMPROVING';
        else if (regressions.length > improvements.length)
            overallDirection = 'REGRESSING';
        else
            overallDirection = 'MIXED';
        const hasBaselineData = baselineSnapshot.some((s) => s.percentage !== null);
        const hasCurrentData = currentSnapshotRaw.some((s) => s.percentage !== null);
        const repSummary = {
            improvedCount: improvements.length,
            regressedCount: regressions.length,
            unchangedCount,
            overallDirection,
            hasBaselineData,
            hasCurrentData,
        };
        const insightText = this.generateCoachingInsight(rep.name, baselineSnapshot, currentSnapshot, improvements, regressions, warningDefs, hasBaselineData, hasCurrentData);
        return {
            repId: rep.id, repName: rep.name,
            boardId: board.id, boardName: board.name,
            baselinePeriod: deal_drivers_entities_1.Period.LAST_30_DAYS,
            currentPeriod: deal_drivers_entities_1.Period.NOW,
            baselineSnapshot, currentSnapshot, improvements, regressions, insightText, repSummary,
        };
    }
    async computeRepSnapshot(repId, boardId, period, warningIds, warningDefs, now) {
        const window = (0, period_util_1.resolvePeriodWindow)(period, now);
        const rawDeals = await this.repo.getQualifyingDealsForTeam([repId], boardId, window);
        const repDealSets = (0, deal_membership_calculator_1.computeRepDealSets)(rawDeals, window);
        const repSet = repDealSets.get(repId);
        if (!repSet || repSet.dealCount === 0) {
            return warningDefs.map((w) => ({
                warningId: w.warningId, label: w.label,
                percentage: null, flaggedCount: 0, dealCount: 0,
                deltaPercentage: null, direction: null,
            }));
        }
        const rawEvents = await this.repo.getWarningEventsForDeals(repSet.qualifyingDealIds, warningIds);
        const activationMap = (0, warning_activation_calculator_1.computeWarningActivations)(rawEvents, window);
        return warningDefs.map((w) => {
            const flaggedCount = (0, warning_activation_calculator_1.countFlaggedDeals)(activationMap, repSet.qualifyingDealIds, w.warningId);
            const percentage = Math.round((flaggedCount / repSet.dealCount) * 100);
            return {
                warningId: w.warningId, label: w.label, percentage, flaggedCount, dealCount: repSet.dealCount,
                deltaPercentage: null, direction: null,
            };
        });
    }
    async computeBoardRates(boardId, warnings, repIds, window) {
        if (warnings.length === 0)
            return [];
        const warningIds = warnings.map((w) => w.warningId);
        const rawDeals = await this.repo.getQualifyingDealsForTeam(repIds, boardId, window);
        const allDealIds = [...new Set(rawDeals.map((d) => d.dealId))];
        const totalDeals = allDealIds.length;
        if (totalDeals === 0) {
            return warnings.map((w) => ({
                warningId: w.warningId, warningKey: w.warningKey, label: w.label,
                flaggedCount: 0, totalDeals: 0, percentage: 0,
                isBoardSpecific: false, deltaFromBaseline: null, deltaDirection: null,
            }));
        }
        const rawEvents = await this.repo.getWarningEventsForDeals(allDealIds, warningIds);
        const activationMap = (0, warning_activation_calculator_1.computeWarningActivations)(rawEvents, window);
        return warnings.map((w) => {
            let flaggedCount = 0;
            for (const dealId of allDealIds) {
                if (activationMap.get(dealId)?.get(w.warningId)?.meetsThreshold)
                    flaggedCount++;
            }
            return {
                warningId: w.warningId, warningKey: w.warningKey, label: w.label,
                flaggedCount, totalDeals,
                percentage: Math.round((flaggedCount / totalDeals) * 100),
                isBoardSpecific: false, deltaFromBaseline: null, deltaDirection: null,
            };
        });
    }
    buildInsightSummary(overlapping) {
        const worseningCount = overlapping.filter((w) => w.direction === 'WORSE').length;
        const improvingCount = overlapping.filter((w) => w.direction === 'BETTER').length;
        const worstItem = overlapping.filter((w) => w.direction === 'WORSE').sort((a, b) => b.delta - a.delta)[0] ?? null;
        let recommendation;
        if (worseningCount >= 2)
            recommendation = 'escalate_enablement';
        else if (worseningCount === 1)
            recommendation = 'individual_coaching';
        else
            recommendation = 'on_track';
        return {
            worseningCount, improvingCount,
            topWorseningWarning: worstItem?.label ?? null,
            topWorseningDelta: worstItem?.delta ?? null,
            recommendation,
        };
    }
    generateComparisonInsight(overlapping, baselineName, comparisonName) {
        if (overlapping.length === 0)
            return `No overlapping warnings between ${baselineName} and ${comparisonName}.`;
        const worst = overlapping.filter((w) => w.direction === 'WORSE');
        if (worst.length === 0)
            return `All shared warnings improve or stay flat from ${baselineName} → ${comparisonName}. Pipeline health is consistent.`;
        const top = worst.slice(0, 2)
            .map((w) => `"${w.label}" worsens ${w.baselinePct}% → ${w.comparisonPct}%`)
            .join(' and ');
        return `${top} as deals mature. Problem compounds at closing stage — not discovery. Closing process enablement needed.`;
    }
    generateCoachingInsight(repName, baseline, current, improvements, regressions, warningDefs, hasBaselineData, hasCurrentData) {
        if (!hasBaselineData && !hasCurrentData) {
            return `No deal data found for ${repName} in either period. No comparison available.`;
        }
        if (!hasBaselineData) {
            return `No data for ${repName} in the last 30 days. Current period data is available — comparison not yet possible.`;
        }
        if (!hasCurrentData) {
            return `${repName} has no active qualifying deals right now. Last 30-day baseline is available for reference.`;
        }
        if (regressions.length === 0 && improvements.length === 0) {
            return `No change detected for ${repName} between periods.`;
        }
        const labelMap = new Map(warningDefs.map((w) => [w.warningId, w.label]));
        const baseMap = new Map(baseline.map((s) => [s.warningId, s]));
        const currMap = new Map(current.map((s) => [s.warningId, s]));
        const parts = [];
        if (improvements.length > 0) {
            const top = improvements[0];
            const b = baseMap.get(top)?.percentage ?? 0;
            const c = currMap.get(top)?.percentage ?? 0;
            parts.push(`"${labelMap.get(top)}" dropped ${b}% → ${c}%`);
        }
        const suffix = regressions.length === 0
            ? 'Coaching is working — continue reinforcement. No regression detected.'
            : `Regression on: ${regressions.map((id) => `"${labelMap.get(id)}"`).join(', ')}. Review coaching approach.`;
        return [parts.join('. '), suffix].filter(Boolean).join('. ');
    }
};
exports.DealDriversService = DealDriversService;
exports.DealDriversService = DealDriversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [deal_drivers_repository_1.DealDriversRepository,
        matrix_cache_1.MatrixCache])
], DealDriversService);
//# sourceMappingURL=deal-drivers.service.js.map