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
exports.M01FrontendCallsService = void 0;
const common_1 = require("@nestjs/common");
const role_helpers_1 = require("../../platform-core/auth/role-helpers");
const call_service_1 = require("./call.service");
const call_repository_1 = require("../repositories/call.repository");
const prisma_service_1 = require("../database/prisma.service");
const m01_frontend_calls_schema_1 = require("../schemas/m01-frontend-calls.schema");
const m01_frontend_mapper_1 = require("./m01-frontend.mapper");
let M01FrontendCallsService = class M01FrontendCallsService {
    calls;
    callRepo;
    prisma;
    constructor(calls, callRepo, prisma) {
        this.calls = calls;
        this.callRepo = callRepo;
        this.prisma = prisma;
    }
    repOwnsCall(callOwner, userId, userName) {
        if (!userId && !userName)
            return true;
        return callOwner === userId || (!!userName && callOwner === userName);
    }
    async listCalls(tenantId, rawQuery, userId, userRole, userName) {
        const q = m01_frontend_calls_schema_1.FrontendListCallsQuerySchema.parse(rawQuery);
        if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
            const offset = (q.page - 1) * q.size;
            const extra = {};
            const andClauses = [];
            if ((0, role_helpers_1.isSalesRepRole)(userRole)) {
                const ownerClause = (0, role_helpers_1.repOwnerFilter)('callOwner', userId, userName);
                if (ownerClause)
                    andClauses.push(ownerClause);
            }
            if (q.search?.trim()) {
                const needle = q.search.trim();
                andClauses.push({
                    OR: [
                        { title: { contains: needle, mode: 'insensitive' } },
                        { callOwner: { contains: needle, mode: 'insensitive' } },
                        { accountId: { contains: needle, mode: 'insensitive' } },
                    ],
                });
            }
            if (rawQuery.type && rawQuery.type !== 'All Types') {
                const typeNeedle = String(rawQuery.type).replace(/-/g, ' ');
                andClauses.push({
                    OR: [
                        { title: { contains: typeNeedle, mode: 'insensitive' } },
                        { callType: { contains: typeNeedle, mode: 'insensitive' } },
                    ],
                });
            }
            if (andClauses.length > 0)
                extra.AND = andClauses;
            const { records, total } = await this.callRepo.findAll(tenantId, { sortBy: 'callDate', order: 'desc', limit: q.size, offset }, extra);
            const callReviews = await this.prisma.callReview.findMany({
                where: { tenantid: tenantId },
            });
            const reviewMap = new Map(callReviews.map((cr) => [cr.callTitle, cr]));
            const calls = records.map((r) => (0, m01_frontend_mapper_1.mapAiReviewerCallRow)(r, reviewMap.get(r.title)));
            return {
                calls,
                pagination: {
                    page: q.page,
                    size: q.size,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / q.size)),
                },
            };
        }
        const offset = (q.page - 1) * q.size;
        const extra = {};
        const andClauses = [];
        if ((0, role_helpers_1.isSalesRepRole)(userRole)) {
            const ownerClause = (0, role_helpers_1.repOwnerFilter)('callOwner', userId, userName);
            if (ownerClause)
                andClauses.push(ownerClause);
        }
        const isCallsList = !rawQuery.view &&
            rawQuery.format !== 'ai-reviewer' &&
            rawQuery.view !== 'ai-reviewer';
        if (isCallsList && (!q.status || q.status === 'all')) {
            andClauses.push({ transcriptStatus: 'completed' });
            andClauses.push({ audioUrl: { not: null } });
            andClauses.push({ transcript: { isNot: null } });
        }
        if (q.status && q.status !== 'all') {
            const statusClause = q.status === 'processing' ? { in: ['processing', 'pending'] } : q.status;
            andClauses.push({ transcriptStatus: statusClause });
        }
        if (q.dealType) {
            const types = q.dealType.split(',').filter(Boolean).map((t) => t.toLowerCase());
            if (types.length > 0) {
                andClauses.push({ callType: { in: types } });
            }
        }
        if (q.ownerId) {
            andClauses.push({ callOwner: q.ownerId });
        }
        if (q.account) {
            const accounts = q.account.split(',').filter(Boolean);
            if (accounts.length > 0) {
                andClauses.push({
                    OR: [
                        ...accounts.map((acc) => ({ accountId: { contains: acc, mode: 'insensitive' } })),
                        ...accounts.map((acc) => ({ title: { contains: acc, mode: 'insensitive' } })),
                    ],
                });
            }
        }
        if (q.participantId) {
            const parts = q.participantId.split(',').filter(Boolean);
            if (parts.length > 0) {
                andClauses.push({
                    participants: { hasSome: parts },
                });
            }
        }
        if (q.search?.trim()) {
            const needle = q.search.trim();
            andClauses.push({
                OR: [
                    { title: { contains: needle, mode: 'insensitive' } },
                    { callOwner: { contains: needle, mode: 'insensitive' } },
                    { accountId: { contains: needle, mode: 'insensitive' } },
                ],
            });
        }
        if (q.duration && q.duration !== 'all') {
            if (q.duration === 'lt2') {
                andClauses.push({ durationSeconds: { lt: 120 } });
            }
            else if (q.duration === '2to10') {
                andClauses.push({ durationSeconds: { gte: 120, lte: 600 } });
            }
            else if (q.duration === 'gt10') {
                andClauses.push({ durationSeconds: { gt: 600 } });
            }
        }
        if (q.dateRange && q.dateRange !== 'all' && q.dateRange !== 'custom') {
            const days = q.dateRange === 'last7days' ? 7 : 30;
            andClauses.push({ callDate: { gte: new Date(Date.now() - days * 86400000) } });
        }
        else if (q.dateRange === 'custom' && (q.startDate || q.endDate)) {
            andClauses.push({
                callDate: {
                    ...(q.startDate ? { gte: new Date(q.startDate) } : {}),
                    ...(q.endDate ? { lte: new Date(q.endDate) } : {}),
                },
            });
        }
        if (andClauses.length > 0) {
            extra.AND = andClauses;
        }
        let listStatus;
        if (q.status && q.status !== 'all' && q.status !== 'processing') {
            listStatus = q.status;
        }
        const { records, total } = await this.callRepo.findAll(tenantId, {
            status: listStatus,
            sortBy: 'callDate',
            order: 'desc',
            limit: q.size,
            offset,
        }, extra);
        return {
            totalCount: total,
            page: q.page,
            size: q.size,
            calls: records.map(m01_frontend_mapper_1.mapCallListItem),
        };
    }
    async getCall(callId, tenantId, rawQuery = {}, userId, userRole, userName) {
        const record = await this.calls.getCallDetail(callId, tenantId);
        if ((0, role_helpers_1.isSalesRepRole)(userRole) && !this.repOwnsCall(record.callOwner, userId, userName)) {
            throw new Error('Access denied');
        }
        if (rawQuery.view === 'ai-reviewer' || rawQuery.format === 'ai-reviewer') {
            const matchingReview = await this.prisma.callReview.findFirst({
                where: { callTitle: record.title, tenantid: tenantId },
            });
            const row = (0, m01_frontend_mapper_1.mapAiReviewerCallRow)(record, matchingReview);
            const participants = Array.isArray(record.participants)
                ? record.participants.map((p, i) => ({
                    name: p,
                    role: i === 0 ? 'Rep' : 'Buyer',
                }))
                : [
                    { name: record.callOwner || 'Rep', role: 'Rep' },
                    { name: 'Buyer', role: 'Buyer' },
                ];
            return { data: { ...row, participants } };
        }
        return (0, m01_frontend_mapper_1.mapCallDetail)(record);
    }
    async getCallMetadata(callId, tenantId, userId, userRole, userName) {
        const record = await this.calls.getCallDetail(callId, tenantId);
        if ((0, role_helpers_1.isSalesRepRole)(userRole) && !this.repOwnsCall(record.callOwner, userId, userName)) {
            throw new Error('Access denied');
        }
        return (0, m01_frontend_mapper_1.mapCallMetadata)(record);
    }
    async searchCalls(tenantId, rawQuery, userId, userRole, userName) {
        const q = m01_frontend_calls_schema_1.FrontendSearchCallsQuerySchema.parse(rawQuery);
        const offset = (q.page - 1) * q.size;
        const hits = await this.calls.searchTranscripts(tenantId, {
            q: q.q,
            limit: q.size,
            offset,
        });
        let calls = (Array.isArray(hits) ? hits : []).map(m01_frontend_mapper_1.mapCallSearchHit);
        if ((0, role_helpers_1.isSalesRepRole)(userRole)) {
            calls = calls.filter((c) => this.repOwnsCall(c.callOwner, userId, userName));
        }
        return {
            totalCount: calls.length,
            calls,
        };
    }
    async listAccounts(tenantId, rawQuery, userId, userRole, userName) {
        const { search } = m01_frontend_calls_schema_1.FrontendFilterSearchSchema.parse(rawQuery);
        const where = { tenantid: tenantId };
        if ((0, role_helpers_1.isSalesRepRole)(userRole)) {
            const ownerClause = (0, role_helpers_1.repOwnerFilter)('callOwner', userId, userName);
            if (ownerClause)
                Object.assign(where, ownerClause);
        }
        const rows = await this.prisma.callRecord.findMany({
            where,
            select: { accountId: true, title: true },
            take: 500,
        });
        const seen = new Map();
        for (const r of rows) {
            const id = r.accountId || 'unknown';
            const name = r.accountId || r.title || 'Unknown account';
            if (!seen.has(id))
                seen.set(id, name);
        }
        let accounts = [...seen.entries()].map(([accountId, accountName]) => ({
            accountId,
            accountName,
        }));
        if (search?.trim()) {
            const needle = search.trim().toLowerCase();
            accounts = accounts.filter((a) => a.accountName.toLowerCase().includes(needle) ||
                a.accountId.toLowerCase().includes(needle));
        }
        return { accounts };
    }
    async listParticipants(tenantId, rawQuery, userId, userRole, userName) {
        const { search, accountId } = m01_frontend_calls_schema_1.FrontendFilterSearchSchema.parse(rawQuery);
        const where = { tenantid: tenantId };
        if (accountId)
            where.accountId = accountId;
        if ((0, role_helpers_1.isSalesRepRole)(userRole)) {
            const ownerClause = (0, role_helpers_1.repOwnerFilter)('callOwner', userId, userName);
            if (ownerClause)
                Object.assign(where, ownerClause);
        }
        const rows = await this.prisma.callRecord.findMany({
            where,
            select: { participants: true },
            take: 500,
        });
        const seen = new Map();
        for (const r of rows) {
            for (const p of r.participants ?? []) {
                if (!seen.has(p))
                    seen.set(p, p);
            }
        }
        let participants = [...seen.entries()].map(([participantId, name]) => ({
            participantId,
            name,
        }));
        if (search?.trim()) {
            const needle = search.trim().toLowerCase();
            participants = participants.filter((p) => p.name.toLowerCase().includes(needle) ||
                p.participantId.toLowerCase().includes(needle));
        }
        return { participants };
    }
};
exports.M01FrontendCallsService = M01FrontendCallsService;
exports.M01FrontendCallsService = M01FrontendCallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [call_service_1.CallService,
        call_repository_1.CallRepository,
        prisma_service_1.PrismaService])
], M01FrontendCallsService);
//# sourceMappingURL=m01-frontend-calls.service.js.map