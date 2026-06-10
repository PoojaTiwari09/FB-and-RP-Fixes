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
exports.ForecastBoardsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const prisma_service_1 = require("../database/prisma.service");
const forecast_boards_repository_1 = require("../repositories/forecast-boards.repository");
let ForecastBoardsService = class ForecastBoardsService {
    repo;
    prisma;
    eventPublisher;
    constructor(repo, prisma = undefined, eventPublisher = undefined) {
        this.repo = repo;
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    isManagerRole(role) {
        const r = role?.toLowerCase();
        return r === 'manager' || r === 'executive' || r === 'admin';
    }
    assertManager(role) {
        if (role && !this.isManagerRole(role))
            throw new common_1.ForbiddenException('Manager access required');
    }
    assertAdminOrManager(role) {
        if (role && !this.isManagerRole(role))
            throw new common_1.ForbiddenException('Manager or admin access required');
    }
    async resolveForecastUserId(tenantId, platformUserId) {
        if (!platformUserId)
            return undefined;
        const platformUser = await this.prisma.user.findUnique({ where: { id: platformUserId } });
        if (platformUser) {
            const fUser = await this.prisma.forecastUser.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { email: platformUser.email },
                        { name: platformUser.name },
                        { id: platformUserId }
                    ]
                }
            });
            if (fUser)
                return fUser.id;
        }
        return platformUserId;
    }
    periodId(board) {
        return board.periodId ?? board.activePeriod;
    }
    normalizeColumn(column) {
        const columnType = column.columnType ?? column.type ?? 'Metric';
        return {
            ...column,
            columnType,
            type: columnType,
            submissionMode: column.submissionMode ?? 'N/A',
            isVisible: column.isVisible ?? true,
            sortOrder: column.sortOrder ?? 0,
            infoTooltip: column.infoTooltip ?? null,
        };
    }
    initials(name) {
        return (name || '')
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    isSubmissionColumn(column) {
        const type = (column.columnType ?? column.type ?? '').toLowerCase();
        return type === 'submission' && (column.submissionMode ?? '').toLowerCase() === 'manual';
    }
    submissionField(column) {
        const label = column.label.toLowerCase();
        if (label.includes('commit') || label.includes('forecasted retention'))
            return 'commitForecast';
        if (label.includes('best') || label.includes('actual retention'))
            return 'bestCaseForecast';
        return null;
    }
    async loadBoard(tenantId, boardId) {
        const board = await this.prisma.forecastBoard.findFirst({
            where: { id: boardId, tenantId },
            include: {
                columns: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } },
                exclusions: true,
            },
        });
        if (!board)
            throw new common_1.NotFoundException('Board not found');
        return board;
    }
    async listPeriods(tenantId) {
        if (this.repo?.findPeriodsByTenant) {
            const periods = await this.repo.findPeriodsByTenant(tenantId);
            return periods.map((period) => ({
                periodId: period.id,
                tenantId: period.tenantId,
                name: period.name,
                startDate: period.startDate.toISOString().slice(0, 10),
                endDate: period.endDate.toISOString().slice(0, 10),
                revenueTarget: period.revenueTarget,
                isLocked: period.isLocked,
            }));
        }
        const periods = await this.prisma.forecastPeriod.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } });
        return periods.map((period) => ({
            periodId: period.id,
            tenantId: period.tenantId,
            name: period.name,
            startDate: period.startDate.toISOString().slice(0, 10),
            endDate: period.endDate.toISOString().slice(0, 10),
            revenueTarget: period.revenueTarget,
            isLocked: period.isLocked,
        }));
    }
    async getBoard(tenantId, periodId) {
        if (this.repo?.resolvePeriod) {
            const period = await this.repo.resolvePeriod(tenantId, periodId);
            if (!period)
                throw new common_1.NotFoundException('Period not found');
            const [aiPrediction, coverageMetrics, submissions] = await Promise.all([
                this.repo.findLatestAiSnapshot(tenantId, period.id),
                this.repo.findLatestCoverageMetrics(tenantId, period.id),
                this.repo.findSubmissionsForPeriod(tenantId, period.id),
            ]);
            return { period, aiPrediction, coverageMetrics, submissions };
        }
        const period = await this.loadPeriod(tenantId, periodId);
        if (!period)
            throw new common_1.NotFoundException('Period not found');
        const [aiPrediction, submissions] = await Promise.all([
            this.prisma.aiForecastSnapshot.findFirst({ where: { tenantId, periodId: period.id }, orderBy: { computedAt: 'desc' } }),
            this.prisma.forecastSubmission.findMany({ where: { tenantId, periodId: period.id } }),
        ]);
        return { period, aiPrediction, coverageMetrics: null, submissions };
    }
    async submitManualForecast(tenantId, periodId, userId, data, idempotencyKey) {
        if (this.repo?.resolvePeriod) {
            const period = await this.repo.resolvePeriod(tenantId, periodId);
            if (!period)
                throw new common_1.NotFoundException('Period not found');
            if (period.isLocked || period.status === 'locked')
                throw new common_1.ForbiddenException('Forecast period is locked');
            if (idempotencyKey) {
                const existing = await this.repo.findSubmissionByIdempotencyKey(tenantId, idempotencyKey);
                if (existing)
                    return existing;
            }
            const previous = await this.repo.findMaxVersionForUser(tenantId, period.id, userId, data.lob ?? 'Enterprise Software');
            const version = (previous?.version ?? 0) + 1;
            const submission = await this.repo.appendSubmission({
                tenantId,
                periodId: period.id,
                repUserId: userId,
                lob: data.lob ?? previous?.lob ?? 'Enterprise Software',
                version,
                commitForecast: data.submittedAmount,
                bestCaseForecast: data.bestCaseAmount,
                committedDealIds: data.committedDealIds ?? [],
                idempotencyKey,
                notes: data.notes,
                status: 'submitted',
                submittedAt: new Date(),
            });
            await this.repo.appendAuditLog({
                tenantId,
                forecastSubmissionId: submission.id,
                action: 'Submitted',
                actorId: userId,
                actorRole: 'Sales Rep',
                metadata: { version },
            });
            this.eventPublisher?.publish('forecast.submitted', {
                tenantId,
                occurredAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
                payload: { submissionId: submission.id, periodId: period.id, userId, submittedAmount: data.submittedAmount, version },
            });
            return { ...submission, submittedAmount: data.submittedAmount };
        }
        const submission = await this.prisma.forecastSubmission.create({
            data: {
                tenantId,
                periodId,
                repUserId: userId,
                lob: data.lob ?? 'Enterprise',
                version: 1,
                commitForecast: data.submittedAmount,
                bestCaseForecast: data.bestCaseAmount,
                committedDealIds: data.committedDealIds ?? [],
                idempotencyKey,
                notes: data.notes,
                status: 'submitted',
                submittedAt: new Date(),
            },
        });
        return { ...submission, submittedAmount: data.submittedAmount };
    }
    async loadPeriod(tenantId, periodId) {
        return this.prisma.forecastPeriod.findFirst({ where: { id: periodId, tenantId } });
    }
    inPeriodWhere(period) {
        return period ? { closeDate: { gte: period.startDate, lte: period.endDate } } : {};
    }
    latestByRep(submissions) {
        const map = new Map();
        for (const submission of submissions) {
            if (!map.has(submission.repUserId))
                map.set(submission.repUserId, submission);
        }
        return map;
    }
    buildCells(columns, submission, pipeline, closed, quota, annotation) {
        const cells = {};
        for (const rawColumn of columns) {
            const column = this.normalizeColumn(rawColumn);
            const label = column.label.toLowerCase();
            let value = null;
            let isAutoSubmit = false;
            if (label.includes('pipeline')) {
                value = pipeline;
                isAutoSubmit = true;
            }
            else if (label.includes('closed')) {
                value = closed;
                isAutoSubmit = true;
            }
            else if (label.includes('target')) {
                value = quota;
                isAutoSubmit = true;
            }
            else if (label.includes('commit') || label.includes('forecasted retention')) {
                value = submission?.commitForecast ?? null;
            }
            else if (label.includes('best') || label.includes('actual retention')) {
                value = submission?.bestCaseForecast ?? null;
            }
            cells[column.id] = {
                value,
                submissionId: submission?.id ?? null,
                lastUpdatedAt: submission?.updatedAt ?? submission?.submittedAt ?? null,
                isAutoSubmit,
                note: submission?.notes ?? null,
                managerAnnotation: annotation ?? submission?.managerComment ?? null,
            };
        }
        return cells;
    }
    mapDeal(deal) {
        const isPastDue = new Date(deal.closeDate) < new Date() && !deal.isClosedWon && !deal.isClosedLost;
        return {
            id: deal.id,
            dealName: deal.dealName,
            accountName: deal.accountName ?? deal.dealName,
            amount: deal.amount,
            stage: deal.stage,
            closeDate: deal.closeDate,
            isClosedWon: deal.isClosedWon,
            isClosedLost: deal.isClosedLost,
            region: deal.region,
            lob: deal.lob,
            riskScore: deal.riskScore ?? null,
            riskLabel: deal.riskLabel ?? deal.riskReason ?? null,
            riskFlags: deal.riskFlags ?? [],
            isPastDue,
        };
    }
    async listBoards(tenantId) {
        const boards = await this.prisma.forecastBoard.findMany({
            where: { tenantId, status: 'active' },
            orderBy: { createdAt: 'desc' },
        });
        return boards.map((board) => ({
            id: board.id,
            name: board.name,
            status: board.status,
            periodType: board.periodType,
            periodId: this.periodId(board),
            teamId: board.teamId ?? board.scope,
            createdAt: board.createdAt,
        }));
    }
    async getBoardByPeriod(tenantId, periodId) {
        const board = await this.prisma.forecastBoard.findFirst({
            where: { tenantId, activePeriod: periodId, status: 'active' },
            include: { columns: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        if (!board)
            throw new common_1.NotFoundException('No active board exists for that period');
        const period = await this.loadPeriod(tenantId, this.periodId(board));
        return {
            board: {
                id: board.id,
                name: board.name,
                status: board.status,
                periodType: board.periodType,
                periodId: this.periodId(board),
                teamId: board.teamId ?? board.scope,
                createdAt: board.createdAt,
                columns: board.columns.map((column) => this.normalizeColumn(column)),
            },
            period: period && {
                id: period.id,
                name: period.name,
                startDate: period.startDate,
                endDate: period.endDate,
                isLocked: period.isLocked,
            },
        };
    }
    async getBoardView(tenantId, boardId, role, userId, includeInactive = false) {
        const board = await this.loadBoard(tenantId, boardId);
        const period = await this.loadPeriod(tenantId, this.periodId(board));
        const columns = board.columns.map((column) => this.normalizeColumn(column));
        const isManager = this.isManagerRole(role);
        const forecastUserId = await this.resolveForecastUserId(tenantId, userId) ?? userId;
        let users = isManager
            ? await this.prisma.forecastUser.findMany({ where: { tenantId, OR: [{ managerId: forecastUserId }, { id: forecastUserId }] } })
            : await this.prisma.forecastUser.findMany({ where: { tenantId, id: forecastUserId } });
        if (!includeInactive)
            users = users.filter((user) => user.role !== 'inactive');
        users.sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : a.name.localeCompare(b.name)));
        const userIds = users.flatMap((user) => [user.id, user.repId].filter(Boolean));
        const exclusions = board.exclusions.filter((exclusion) => exclusion.isActive);
        const excludedIds = new Set(exclusions.map((exclusion) => exclusion.repUserId));
        const [submissions, quotas, deals, snapshots, annotations] = await Promise.all([
            this.prisma.forecastSubmission.findMany({
                where: { tenantId, periodId: this.periodId(board), repUserId: { in: userIds } },
                orderBy: [{ repUserId: 'asc' }, { version: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.quota.findMany({ where: { tenantId, periodId: this.periodId(board), repUserId: { in: userIds } } }),
            this.prisma.crmDeal.findMany({ where: { tenantId, repUserId: { in: userIds }, ...this.inPeriodWhere(period) } }),
            this.prisma.aiForecastSnapshot.findMany({ where: { tenantId, periodId: this.periodId(board) }, orderBy: { predictedAmount: 'desc' } }),
            this.prisma.boardSubmissionAnnotation.findMany({ where: { tenantId, boardId } }),
        ]);
        const latestSubmission = this.latestByRep(submissions);
        const quotaByRep = new Map(quotas.map((quota) => [quota.repUserId, quota]));
        const annotationBySubmission = new Map(annotations.map((annotation) => [annotation.submissionId, annotation.content]));
        const aiRankByRep = new Map(snapshots.map((snapshot, index) => [snapshot.repUserId ?? snapshot.submissionId, index + 1]));
        const rows = users
            .map((user) => {
            const ids = [user.id, user.repId].filter(Boolean);
            const isExcluded = ids.some((id) => excludedIds.has(id));
            const repDeals = deals.filter((deal) => deal.repUserId && ids.includes(deal.repUserId));
            const pipeline = repDeals.filter((deal) => !deal.isClosedWon && !deal.isClosedLost).reduce((sum, deal) => sum + deal.amount, 0);
            const closed = repDeals.filter((deal) => deal.isClosedWon).reduce((sum, deal) => sum + deal.amount, 0);
            const submission = ids.map((id) => latestSubmission.get(id)).find(Boolean);
            let dealForecasts = {};
            if (submission && submission.committedDealIds) {
                try {
                    const parsed = typeof submission.committedDealIds === 'string'
                        ? JSON.parse(submission.committedDealIds)
                        : submission.committedDealIds;
                    if (parsed && parsed.dealForecasts) {
                        dealForecasts = parsed.dealForecasts;
                    }
                }
                catch (e) {
                }
            }
            const mappedDeals = repDeals.map((deal) => {
                const mapped = this.mapDeal(deal);
                const savedForecast = dealForecasts[deal.id];
                let requestedBestCase = null;
                let requestedCommit = null;
                let requestedBestCaseNote = null;
                let requestedCommitNote = null;
                if (submission && submission.committedDealIds) {
                    try {
                        const parsed = typeof submission.committedDealIds === 'string'
                            ? JSON.parse(submission.committedDealIds)
                            : submission.committedDealIds;
                        if (parsed && parsed.requestedChanges && parsed.requestedChanges[deal.id]) {
                            const req = parsed.requestedChanges[deal.id];
                            if (req.bestCase) {
                                requestedBestCase = req.bestCase.value;
                                requestedBestCaseNote = req.bestCase.note;
                            }
                            if (req.commit) {
                                requestedCommit = req.commit.value;
                                requestedCommitNote = req.commit.note;
                            }
                        }
                    }
                    catch (e) {
                    }
                }
                return {
                    ...mapped,
                    bestCase: savedForecast ? savedForecast.bestCase : null,
                    commit: savedForecast ? savedForecast.commit : null,
                    submissionStatus: submission?.status ?? 'not_started',
                    requestedBestCase,
                    requestedCommit,
                    requestedBestCaseNote,
                    requestedCommitNote,
                };
            });
            const quotaRecord = ids.map((id) => quotaByRep.get(id)).find(Boolean);
            const quota = quotaRecord?.amount ?? null;
            const attainmentPct = quota && quota > 0 ? (closed / quota) * 100 : null;
            return {
                userId: user.id,
                name: user.name,
                repUserId: user.id,
                repName: user.name,
                avatarInitials: this.initials(user.name),
                isExcluded,
                isInactive: user.role === 'inactive',
                cells: this.buildCells(columns, submission, pipeline, closed, quota, annotationBySubmission.get(submission?.id)),
                targetAttainment: { quota, closed, attainmentPct },
                aiPredictionScore: isManager ? null : aiRankByRep.get(user.id) ?? null,
                submissionStatus: submission?.status ?? 'not_started',
                metrics: {
                    pipeline,
                    closed,
                    bestCase: submission?.bestCaseForecast ?? null,
                    commit: submission?.commitForecast ?? null,
                    target: quota,
                    targetAttainment: attainmentPct,
                },
                deals: mappedDeals,
            };
        })
            .filter((row) => includeInactive || !row.isInactive);
        const rollupRows = rows.filter((row) => !row.isExcluded);
        const rollupCells = columns.reduce((acc, column) => {
            acc[column.id] = rollupRows.reduce((sum, row) => sum + (Number(row.cells[column.id]?.value) || 0), 0);
            return acc;
        }, {});
        const totalQuota = rollupRows.reduce((sum, row) => sum + (row.targetAttainment.quota || 0), 0);
        const totalClosed = rollupRows.reduce((sum, row) => sum + row.targetAttainment.closed, 0);
        const rollup = {
            cells: rollupCells,
            targetAttainment: { totalQuota, totalClosed, attainmentPct: totalQuota > 0 ? (totalClosed / totalQuota) * 100 : null },
            submittedCount: rollupRows.filter((row) => row.submissionStatus === 'submitted' || row.submissionStatus === 'approved').length,
            totalCount: rollupRows.length,
        };
        const firstRow = rows[0];
        const dueDays = period ? Math.ceil((period.endDate.getTime() - Date.now()) / 86400000) : 999;
        const deadlineBanner = dueDays >= 0 && dueDays <= 3 && firstRow?.submissionStatus === 'not_started'
            ? { message: `Your forecast is due in ${dueDays} day(s)`, isDue: true }
            : null;
        const latestSnapshot = await this.prisma.aiForecastSnapshot.findFirst({
            where: { tenantId, periodId: this.periodId(board) },
            orderBy: { computedAt: 'desc' },
        });
        const envelope = {
            board: { id: board.id, name: board.name, status: board.status, periodType: board.periodType },
            period: period && { id: period.id, name: period.name, startDate: period.startDate, endDate: period.endDate, isLocked: period.isLocked },
            columns,
            rollup,
            deadlineBanner,
            aiPredictionSummary: latestSnapshot && {
                predictedAmount: latestSnapshot.predictedAmount,
                confidenceRangeLow: latestSnapshot.confidenceRangeLow,
                confidenceRangeHigh: latestSnapshot.confidenceRangeHigh,
                computedAt: latestSnapshot.computedAt,
            },
        };
        await Promise.all(users.map(async (user) => {
            const ids = [user.id, user.repId].filter(Boolean);
            const repDeals = deals.filter((deal) => deal.repUserId && ids.includes(deal.repUserId));
            const pipelineVal = repDeals.filter((deal) => !deal.isClosedWon && !deal.isClosedLost).reduce((sum, deal) => sum + deal.amount, 0);
            await this.prisma.pipelineValuesCache.upsert({
                where: { tenantId_periodId_repId_dealId: { tenantId, periodId: this.periodId(board), repId: user.id, dealId: '' } },
                create: { tenantId, periodId: this.periodId(board), repId: user.id, dealId: '', pipelineValue: pipelineVal, computedAt: new Date() },
                update: { pipelineValue: pipelineVal, computedAt: new Date() }
            });
        }));
        const shapedRows = rows.map(({ deals: _deals, ...row }) => row);
        if (isManager)
            return { ...envelope, rows: shapedRows };
        return { ...envelope, rows: shapedRows, repRow: shapedRows[0] ?? null, deals: firstRow?.deals ?? [] };
    }
    async submitForecast(tenantId, boardId, data, actorId, role) {
        const board = await this.loadBoard(tenantId, boardId);
        const period = await this.loadPeriod(tenantId, this.periodId(board));
        if (period?.isLocked)
            throw new common_1.BadRequestException('Period is locked - submissions not allowed');
        const forecastActorId = await this.resolveForecastUserId(tenantId, actorId) ?? actorId;
        const forecastRepUserId = await this.resolveForecastUserId(tenantId, data.repUserId) ?? data.repUserId;
        const normalizedRole = role?.toLowerCase();
        if (normalizedRole === 'sales_rep' && forecastActorId && forecastActorId !== forecastRepUserId) {
            throw new common_1.ForbiddenException('Sales reps can submit only their own forecast');
        }
        if (role && board.exclusions.some((exclusion) => exclusion.isActive && exclusion.repUserId === forecastRepUserId)) {
            throw new common_1.ForbiddenException('Rep is excluded from this board');
        }
        const latest = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId: this.periodId(board), repUserId: forecastRepUserId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
        });
        if (data.status === 'submitted' && !data.dealId && !data.columnId) {
            if (!latest) {
                throw new common_1.BadRequestException('No draft submission found to submit');
            }
            const submission = await this.prisma.forecastSubmission.create({
                data: {
                    tenantId,
                    periodId: this.periodId(board),
                    repUserId: forecastRepUserId,
                    lob: latest.lob,
                    version: latest.version + 1,
                    commitForecast: latest.commitForecast,
                    bestCaseForecast: latest.bestCaseForecast,
                    notes: data.note ?? latest.notes,
                    status: 'submitted',
                    submittedAt: new Date(),
                    committedDealIds: latest.committedDealIds,
                },
            });
            await this.prisma.forecastAuditLog.create({
                data: {
                    tenantId,
                    forecastSubmissionId: submission.id,
                    action: 'BOARD_SUBMIT',
                    actorId: forecastActorId || forecastRepUserId,
                    actorRole: role || 'sales_rep',
                    metadata: { boardId, periodId: this.periodId(board), repUserId: forecastRepUserId, note: data.note },
                },
            });
            this.eventPublisher?.publish('forecast.submitted', {
                tenantId,
                correlationId: crypto.randomUUID(),
                payload: { submissionId: submission.id, periodId: submission.periodId, userId: forecastRepUserId, submittedAmount: submission.commitForecast, version: submission.version, lob: submission.lob },
            });
            return { ...submission, submission, timestamp: submission.updatedAt };
        }
        if (!data.columnId || data.value == null || data.value < 0) {
            throw new common_1.BadRequestException('columnId and non-negative value are required');
        }
        const column = board.columns.find((item) => item.id === data.columnId);
        if (!column || !this.isSubmissionColumn(column))
            throw new common_1.BadRequestException('Column is not manually submittable');
        const field = this.submissionField(column);
        if (!field)
            throw new common_1.BadRequestException('Only Commit and Best Case columns can be submitted');
        if (normalizedRole === 'sales_rep' && latest && !['draft', 'reopened'].includes(latest.status)) {
            if (data.status !== 'change_request') {
                throw new common_1.ForbiddenException('Submission is locked until a manager reopens it');
            }
        }
        let dealForecasts = {};
        let requestedChanges = {};
        if (latest && latest.committedDealIds) {
            try {
                const parsed = typeof latest.committedDealIds === 'string'
                    ? JSON.parse(latest.committedDealIds)
                    : latest.committedDealIds;
                if (parsed) {
                    if (parsed.dealForecasts)
                        dealForecasts = parsed.dealForecasts;
                    if (parsed.requestedChanges)
                        requestedChanges = parsed.requestedChanges;
                }
            }
            catch (e) {
            }
        }
        const fieldKey = field === 'commitForecast' ? 'commit' : 'bestCase';
        const isChangeRequest = data.status === 'change_request';
        if (data.dealId) {
            if (isChangeRequest) {
                if (!requestedChanges[data.dealId]) {
                    requestedChanges[data.dealId] = {};
                }
                requestedChanges[data.dealId][fieldKey] = {
                    value: data.value,
                    note: data.note || '',
                };
            }
            else {
                if (!dealForecasts[data.dealId]) {
                    dealForecasts[data.dealId] = { bestCase: null, commit: null };
                }
                dealForecasts[data.dealId][fieldKey] = data.value;
            }
        }
        let commitForecast = latest?.commitForecast ?? 0;
        let bestCaseForecast = latest?.bestCaseForecast ?? null;
        if (!isChangeRequest) {
            if (data.dealId) {
                commitForecast = Object.values(dealForecasts).reduce((sum, d) => sum + (d.commit ?? 0), 0);
                bestCaseForecast = Object.values(dealForecasts).reduce((sum, d) => sum + (d.bestCase ?? 0), 0);
            }
            else {
                if (field === 'commitForecast') {
                    commitForecast = data.value;
                }
                else {
                    bestCaseForecast = data.value;
                }
            }
        }
        const nextStatus = isChangeRequest && latest ? latest.status : (data.status || (data.dealId ? (normalizedRole === 'sales_rep' ? 'draft' : 'submitted') : 'submitted'));
        const submission = await this.prisma.forecastSubmission.create({
            data: {
                tenantId,
                periodId: this.periodId(board),
                repUserId: forecastRepUserId,
                lob: latest?.lob ?? 'Enterprise',
                version: (latest?.version ?? 0) + 1,
                commitForecast,
                bestCaseForecast,
                notes: data.note ?? latest?.notes,
                status: nextStatus,
                submittedAt: nextStatus === 'submitted' ? new Date() : latest?.submittedAt,
                committedDealIds: { dealForecasts, requestedChanges },
            },
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId,
                forecastSubmissionId: submission.id,
                action: 'BOARD_SUBMIT',
                actorId: forecastActorId || forecastRepUserId,
                actorRole: role || 'sales_rep',
                metadata: { boardId, columnId: data.columnId, columnLabel: column.label, value: data.value, periodId: this.periodId(board), repUserId: forecastRepUserId, dealId: data.dealId },
            },
        });
        this.eventPublisher?.publish('forecast.submitted', {
            tenantId,
            correlationId: crypto.randomUUID(),
            payload: { submissionId: submission.id, periodId: submission.periodId, userId: forecastRepUserId, submittedAmount: submission.commitForecast, version: submission.version, lob: submission.lob },
        });
        return { ...submission, submission, timestamp: submission.updatedAt };
    }
    async approveChangeRequest(tenantId, boardId, data, actorId, role) {
        this.assertManager(role);
        const board = await this.loadBoard(tenantId, boardId);
        const forecastRepUserId = await this.resolveForecastUserId(tenantId, data.repUserId) ?? data.repUserId;
        const forecastActorId = await this.resolveForecastUserId(tenantId, actorId) ?? actorId;
        const latest = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId: this.periodId(board), repUserId: forecastRepUserId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
        });
        if (!latest || !latest.committedDealIds) {
            throw new common_1.BadRequestException('No submission or requests found');
        }
        let dealForecasts = {};
        let requestedChanges = {};
        try {
            const parsed = typeof latest.committedDealIds === 'string'
                ? JSON.parse(latest.committedDealIds)
                : latest.committedDealIds;
            if (parsed) {
                if (parsed.dealForecasts)
                    dealForecasts = parsed.dealForecasts;
                if (parsed.requestedChanges)
                    requestedChanges = parsed.requestedChanges;
            }
        }
        catch (e) {
            throw new common_1.BadRequestException('Failed to parse committed deal forecasts');
        }
        const req = requestedChanges[data.dealId];
        if (!req) {
            throw new common_1.BadRequestException('No pending change request found for this deal');
        }
        const column = board.columns.find((c) => c.id === data.columnId);
        if (!column)
            throw new common_1.BadRequestException('Invalid columnId');
        const field = this.submissionField(column);
        if (!field)
            throw new common_1.BadRequestException('Invalid column field');
        const fieldKey = field === 'commitForecast' ? 'commit' : 'bestCase';
        const change = req[fieldKey];
        if (!change) {
            throw new common_1.BadRequestException(`No pending change request found for field ${fieldKey}`);
        }
        if (!dealForecasts[data.dealId]) {
            dealForecasts[data.dealId] = { bestCase: null, commit: null };
        }
        dealForecasts[data.dealId][fieldKey] = change.value;
        delete req[fieldKey];
        if (Object.keys(req).length === 0) {
            delete requestedChanges[data.dealId];
        }
        const commitForecast = Object.values(dealForecasts).reduce((sum, d) => sum + (d.commit ?? 0), 0);
        const bestCaseForecast = Object.values(dealForecasts).reduce((sum, d) => sum + (d.bestCase ?? 0), 0);
        const submission = await this.prisma.forecastSubmission.create({
            data: {
                tenantId,
                periodId: this.periodId(board),
                repUserId: forecastRepUserId,
                lob: latest.lob,
                version: latest.version + 1,
                commitForecast,
                bestCaseForecast,
                notes: `Change approved by manager: ${change.note}`,
                status: latest.status,
                submittedAt: latest.submittedAt,
                committedDealIds: { dealForecasts, requestedChanges },
            },
        });
        await this.prisma.forecastAuditLog.create({
            data: {
                tenantId,
                forecastSubmissionId: submission.id,
                action: 'CHANGE_APPROVED',
                actorId: forecastActorId || forecastRepUserId,
                actorRole: role || 'manager',
                metadata: { boardId, columnId: data.columnId, value: change.value, dealId: data.dealId, repUserId: forecastRepUserId },
            },
        });
        return submission;
    }
    async getRepDeals(tenantId, boardId, repUserId, columnId, actorId, role) {
        const forecastActorId = await this.resolveForecastUserId(tenantId, actorId) ?? actorId;
        const forecastRepUserId = await this.resolveForecastUserId(tenantId, repUserId) ?? repUserId;
        if (role?.toLowerCase() === 'sales_rep' && forecastActorId !== forecastRepUserId)
            throw new common_1.ForbiddenException('Sales reps can view only their own deals');
        const board = await this.loadBoard(tenantId, boardId);
        const period = await this.loadPeriod(tenantId, this.periodId(board));
        const column = board.columns.find((item) => item.id === columnId);
        if (!column)
            throw new common_1.BadRequestException('Invalid columnId');
        const label = column.label.toLowerCase();
        const where = { tenantId, repUserId: forecastRepUserId, ...this.inPeriodWhere(period) };
        if (label.includes('closed'))
            where.isClosedWon = true;
        if (label.includes('pipeline')) {
            where.isClosedWon = false;
            where.isClosedLost = false;
        }
        const deals = (await this.prisma.crmDeal.findMany({ where, orderBy: { amount: 'desc' } })).map((deal) => this.mapDeal(deal));
        return { deals, totalValue: deals.reduce((sum, deal) => sum + deal.amount, 0), count: deals.length };
    }
    async getRepHistory(tenantId, boardId, repUserId, columnId, actorId, role) {
        const forecastActorId = await this.resolveForecastUserId(tenantId, actorId) ?? actorId;
        const forecastRepUserId = await this.resolveForecastUserId(tenantId, repUserId) ?? repUserId;
        if (role?.toLowerCase() === 'sales_rep' && forecastActorId !== forecastRepUserId)
            throw new common_1.ForbiddenException('Sales reps can view only their own history');
        const board = await this.loadBoard(tenantId, boardId);
        const period = await this.loadPeriod(tenantId, this.periodId(board));
        const column = board.columns.find((item) => item.id === columnId);
        if (!column)
            throw new common_1.BadRequestException('Invalid columnId');
        const field = this.submissionField(column);
        const submissions = await this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId: this.periodId(board), repUserId: forecastRepUserId },
            orderBy: { createdAt: 'asc' },
        });
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthlyMap = new Map();
        for (const submission of submissions) {
            const monthKey = `${submission.createdAt.getFullYear()}-${submission.createdAt.getMonth()}`;
            monthlyMap.set(monthKey, submission);
        }
        const monthlySubmissions = Array.from(monthlyMap.values());
        let previousValue = null;
        const history = monthlySubmissions.map((submission) => {
            const value = Number(field === 'bestCaseForecast' ? submission.bestCaseForecast : submission.commitForecast);
            const delta = previousValue == null ? null : value - previousValue;
            const entry = {
                weekLabel: months[submission.createdAt.getMonth()],
                submitterName: submission.managerId ? 'Manager' : 'Sales Rep',
                submittedAt: submission.submittedAt ?? submission.createdAt,
                value,
                previousValue,
                delta,
                deltaDirection: delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
                note: submission.notes,
            };
            previousValue = value;
            return entry;
        });
        return Object.assign(history, { history });
    }
    async getRepDrilldown(tenantId, boardId, repUserId, actorId, role) {
        this.assertManager(role);
        const board = await this.loadBoard(tenantId, boardId);
        const forecastRepUserId = await this.resolveForecastUserId(tenantId, repUserId) ?? repUserId;
        const forecastActorId = await this.resolveForecastUserId(tenantId, actorId) ?? actorId;
        if (role === 'manager') {
            const directReport = await this.prisma.forecastUser.findFirst({ where: { tenantId, id: forecastRepUserId, managerId: forecastActorId } });
            if (!directReport)
                throw new common_1.ForbiddenException('Rep is not a direct report');
        }
        const view = await this.getBoardView(tenantId, boardId, 'sales_rep', forecastRepUserId);
        const rep = await this.prisma.forecastUser.findFirst({ where: { tenantId, id: forecastRepUserId } });
        const submission = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId: this.periodId(board), repUserId: forecastRepUserId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
        });
        return {
            rep: { id: forecastRepUserId, name: rep?.name, avatarInitials: this.initials(rep?.name) },
            summaryCards: {
                pipeline: view.repRow?.cells[view.columns.find((c) => c.label.toLowerCase().includes('pipeline'))?.id]?.value ?? 0,
                commit: submission?.commitForecast ?? null,
                bestCase: submission?.bestCaseForecast ?? null,
                closed: view.repRow?.targetAttainment.closed ?? 0,
            },
            deals: (view.deals ?? []).map((deal) => ({ ...deal, actualRetention: deal.isClosedWon ? deal.amount : null, forecastedRetention: submission?.commitForecast ?? null, churn: null, upForRenewal: false, upForRenewalAmount: null })),
            submission,
            targetAttainment: view.repRow?.targetAttainment ?? { quota: null, closed: 0, attainmentPct: null },
            existingAnnotation: submission?.managerComment ?? null,
            columns: view.columns,
        };
    }
    async addManagerAnnotation(tenantId, boardId, submissionId, managerId, annotation, role, repUserId) {
        this.assertManager(role);
        if (!annotation.trim())
            throw new common_1.BadRequestException('annotation is required');
        const saved = await this.prisma.boardSubmissionAnnotation.upsert({
            where: { boardId_submissionId: { boardId, submissionId } },
            create: { boardId, tenantId, submissionId, managerId, content: annotation },
            update: { content: annotation, managerId },
        });
        await this.prisma.forecastSubmission.update({ where: { id: submissionId }, data: { managerComment: annotation, managerId } });
        await this.prisma.forecastAuditLog.create({
            data: { tenantId, forecastSubmissionId: submissionId, action: 'MANAGER_ANNOTATION', actorId: managerId, actorRole: role || 'manager', metadata: { boardId, repUserId } },
        });
        return { ...saved, annotation: saved.content, updatedAt: saved.updatedAt };
    }
    async excludeMember(tenantId, boardId, repUserId, managerId, reason, role) {
        this.assertAdminOrManager(role);
        await this.loadBoard(tenantId, boardId);
        const exclusion = await this.prisma.boardExclusion.upsert({
            where: { boardId_repUserId: { boardId, repUserId } },
            create: { boardId, tenantId, repUserId, excludedBy: managerId },
            update: { isActive: true, excludedBy: managerId, excludedAt: new Date() },
        });
        return { ...exclusion, excluded: exclusion.isActive, repUserId, impactMessage: "This rep's data has been removed from all team rollups and analytics" };
    }
    async removeExclusion(tenantId, boardId, repUserId, role) {
        this.assertAdminOrManager(role);
        await this.loadBoard(tenantId, boardId);
        await this.prisma.boardExclusion.update({ where: { boardId_repUserId: { boardId, repUserId } }, data: { isActive: false } });
        return { included: true, repUserId };
    }
    async approveSubmission(tenantId, boardId, submissionId, managerId, role) {
        this.assertManager(role);
        const submission = await this.prisma.forecastSubmission.update({
            where: { id: submissionId },
            data: { status: 'approved', approvedAt: new Date(), managerId },
        });
        if (submission.committedDealIds) {
            try {
                const parsed = typeof submission.committedDealIds === 'string'
                    ? JSON.parse(submission.committedDealIds)
                    : submission.committedDealIds;
                if (parsed && parsed.dealForecasts) {
                    for (const [dealId, df] of Object.entries(parsed.dealForecasts)) {
                        const commitVal = df.commit;
                        if (commitVal !== null && commitVal !== undefined) {
                            await this.prisma.crmDeal.update({
                                where: { id: dealId },
                                data: {
                                    manualForecast: commitVal,
                                    manualForecastUpdatedAt: new Date(),
                                }
                            });
                        }
                    }
                }
            }
            catch (e) {
                console.error('Failed to sync manual forecast to deals during approval', e);
            }
        }
        try {
            await this.prisma.forecastNotification.create({
                data: {
                    tenantId,
                    repId: submission.repUserId,
                    submissionId: submission.id,
                    actionType: 'approved',
                    dealName: 'Team Rollup',
                    finalValue: submission.commitForecast,
                    isSeen: false,
                }
            });
        }
        catch (e) {
            console.error('Failed to create approval notification', e);
        }
        await this.prisma.forecastAuditLog.create({ data: { tenantId, forecastSubmissionId: submissionId, action: 'SUBMISSION_APPROVED', actorId: managerId, actorRole: role || 'manager', metadata: { boardId } } });
        return { submissionId, status: 'approved', approvedAt: submission.approvedAt };
    }
    async reopenSubmission(tenantId, boardId, submissionId, managerId, role) {
        this.assertManager(role);
        const submission = await this.prisma.forecastSubmission.update({
            where: { id: submissionId },
            data: { status: 'reopened', reopenedAt: new Date(), managerId },
        });
        try {
            await this.prisma.forecastNotification.create({
                data: {
                    tenantId,
                    repId: submission.repUserId,
                    submissionId: submission.id,
                    actionType: 'reopened',
                    dealName: 'Team Rollup',
                    finalValue: null,
                    isSeen: false,
                }
            });
        }
        catch (e) {
            console.error('Failed to create reopen notification', e);
        }
        await this.prisma.forecastAuditLog.create({ data: { tenantId, forecastSubmissionId: submissionId, action: 'SUBMISSION_REOPENED', actorId: managerId, actorRole: role || 'manager', metadata: { boardId } } });
        return { submissionId, status: 'reopened', reopenedAt: submission.reopenedAt };
    }
    async overrideSubmission(tenantId, boardId, repUserId, managerId, data, role) {
        this.assertManager(role);
        const board = await this.loadBoard(tenantId, boardId);
        const column = board.columns.find((item) => item.id === data.columnId);
        if (!column)
            throw new common_1.BadRequestException('Invalid columnId');
        const field = this.submissionField(column);
        if (!field)
            throw new common_1.BadRequestException('Only Commit and Best Case columns can be updated');
        const latest = await this.prisma.forecastSubmission.findFirst({
            where: { tenantId, periodId: this.periodId(board), repUserId },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
        });
        const submission = await this.prisma.forecastSubmission.create({
            data: {
                tenantId,
                periodId: this.periodId(board),
                repUserId,
                lob: latest?.lob ?? 'Enterprise',
                version: (latest?.version ?? 0) + 1,
                commitForecast: field === 'commitForecast' ? data.value : latest?.commitForecast ?? 0,
                bestCaseForecast: field === 'bestCaseForecast' ? data.value : latest?.bestCaseForecast ?? null,
                managerComment: data.note,
                managerId,
                status: 'submitted',
                submittedAt: latest?.submittedAt ?? new Date(),
            },
        });
        try {
            const deals = await this.prisma.crmDeal.findMany({
                where: { tenantId, repUserId, isClosedWon: false, isClosedLost: false }
            });
            if (deals.length > 0) {
                for (const deal of deals) {
                    await this.prisma.crmDeal.update({
                        where: { id: deal.id },
                        data: {
                            manualForecast: data.value / deals.length,
                            manualForecastUpdatedAt: new Date(),
                        }
                    });
                }
            }
        }
        catch (e) {
            console.error('Failed to sync manual forecast to deals during override', e);
        }
        try {
            await this.prisma.forecastNotification.create({
                data: {
                    tenantId,
                    repId: repUserId,
                    submissionId: submission.id,
                    actionType: 'overridden',
                    dealName: 'Team Rollup',
                    finalValue: data.value,
                    isSeen: false,
                }
            });
        }
        catch (e) {
            console.error('Failed to create override notification', e);
        }
        await this.prisma.forecastAuditLog.create({
            data: { tenantId, forecastSubmissionId: submission.id, action: 'MANAGER_OVERRIDE', actorId: managerId, actorRole: role || 'manager', metadata: { boardId, repUserId, columnLabel: column.label, oldValue: latest?.[field], newValue: data.value } },
        });
        this.eventPublisher?.publish('forecast.submitted', { tenantId, correlationId: crypto.randomUUID(), payload: { submissionId: submission.id, periodId: submission.periodId, userId: repUserId, submittedAmount: submission.commitForecast, version: submission.version, lob: submission.lob } });
        return { submission };
    }
    async getPendingApprovalsCount(tenantId, boardId, managerId) {
        const board = await this.loadBoard(tenantId, boardId);
        const reps = await this.prisma.forecastUser.findMany({ where: { tenantId, managerId } });
        const count = await this.prisma.forecastSubmission.count({
            where: { tenantId, periodId: this.periodId(board), repUserId: { in: reps.map((rep) => rep.id) }, status: 'submitted' },
        });
        return { pendingCount: count };
    }
    async getPendingApprovals(tenantId, boardId, managerId) {
        const board = await this.loadBoard(tenantId, boardId);
        const reps = await this.prisma.forecastUser.findMany({ where: { tenantId, managerId } });
        const submissions = await this.prisma.forecastSubmission.findMany({
            where: { tenantId, periodId: this.periodId(board), repUserId: { in: reps.map((rep) => rep.id) }, status: 'submitted' },
            orderBy: { submittedAt: 'desc' },
        });
        return submissions.map((submission) => {
            const rep = reps.find((item) => item.id === submission.repUserId);
            return {
                repUserId: submission.repUserId,
                repName: rep?.name,
                avatarInitials: this.initials(rep?.name),
                commitValue: submission.commitForecast,
                bestCaseValue: submission.bestCaseForecast,
                submittedAt: submission.submittedAt,
                note: submission.notes,
                submissionId: submission.id,
            };
        });
    }
    async assignTargets(tenantId, body, managerId, role) {
        this.assertManager(role);
        const { periodId, assignments } = body;
        const results = await Promise.all(assignments.map(async (assign) => {
            return this.prisma.quota.upsert({
                where: {
                    tenantId_periodId_repUserId: {
                        tenantId,
                        periodId,
                        repUserId: assign.repUserId,
                    }
                },
                create: {
                    tenantId,
                    periodId,
                    repUserId: assign.repUserId,
                    amount: assign.targetValue,
                    managerId,
                },
                update: {
                    amount: assign.targetValue,
                    managerId,
                }
            });
        }));
        return { success: true, count: results.length, data: results };
    }
    async getNotifications(tenantId, repId) {
        return this.prisma.forecastNotification.findMany({
            where: { tenantId, repId, isSeen: false },
            orderBy: { createdAt: 'desc' }
        });
    }
    async markNotificationSeen(tenantId, id) {
        return this.prisma.forecastNotification.update({
            where: { id },
            data: { isSeen: true }
        });
    }
    async getSubmissionActivity(tenantId, submissionId) {
        return this.prisma.forecastAuditLog.findMany({
            where: { tenantId, forecastSubmissionId: submissionId },
            orderBy: { createdAt: 'asc' }
        });
    }
};
exports.ForecastBoardsService = ForecastBoardsService;
exports.ForecastBoardsService = ForecastBoardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [forecast_boards_repository_1.ForecastBoardsRepository,
        prisma_service_1.PrismaService,
        event_publisher_service_1.EventPublisherService])
], ForecastBoardsService);
//# sourceMappingURL=forecast-boards.service.js.map