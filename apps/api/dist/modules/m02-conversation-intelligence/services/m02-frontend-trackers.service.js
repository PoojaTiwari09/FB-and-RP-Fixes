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
exports.M02FrontendTrackersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
function wrapData(payload) {
    return { data: payload };
}
function dateRangeStart(dateRange) {
    const now = new Date();
    switch (dateRange) {
        case 'last-7-days':
            return new Date(now.getTime() - 7 * 86400000);
        case 'last-30-days':
            return new Date(now.getTime() - 30 * 86400000);
        case 'last-quarter':
            return new Date(now.getTime() - 90 * 86400000);
        case 'last-6-months':
            return new Date(now.getTime() - 180 * 86400000);
        default:
            return null;
    }
}
let M02FrontendTrackersService = class M02FrontendTrackersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get db() {
        return this.prisma;
    }
    async listTrackers(tenantId, query) {
        const search = (query.search ?? '').trim().toLowerCase();
        const since = dateRangeStart(query.dateRange ?? 'last-30-days');
        const trackers = await this.db.m02Tracker.findMany({
            where: { tenantid: tenantId,
                isActive: true,
                ...(search
                    ? {
                        name: { contains: search, mode: 'insensitive' },
                    }
                    : {}),
            },
            orderBy: { name: 'asc' },
            include: {
                detections: {
                    where: since ? { createdAt: { gte: since } } : undefined,
                },
            },
        });
        const totalCalls = await this.db.callRecord.count({
            where: { tenantid: tenantId, transcriptStatus: 'completed' },
        });
        const denominator = Math.max(totalCalls, 1);
        const rows = trackers.map((t) => {
            const entityIds = new Set((t.detections ?? []).map((d) => d.entityId));
            const percentage = Math.min(100, Math.round((entityIds.size / denominator) * 100));
            return {
                id: t.slug,
                name: t.name,
                percentage: percentage || (t.detections?.length ? Math.min(100, t.detections.length * 25) : 0),
                trend: t.trend ?? 0,
            };
        });
        rows.sort((a, b) => b.percentage - a.percentage);
        return wrapData(rows);
    }
    async getTrackerDetail(tenantId, trackerSlug) {
        const tracker = await this.db.m02Tracker.findFirst({
            where: { tenantid: tenantId, slug: trackerSlug },
            include: { detections: true },
        });
        if (!tracker)
            throw new common_1.NotFoundException('Tracker not found');
        const detections = tracker.detections ?? [];
        const entityIds = new Set(detections.map((d) => d.entityId));
        const totalCalls = await this.db.callRecord.count({
            where: { tenantid: tenantId, transcriptStatus: 'completed' },
        });
        const denominator = Math.max(totalCalls, 1);
        const percentage = Math.min(100, Math.round((entityIds.size / denominator) * 100) ||
            (detections.length ? Math.min(100, detections.length * 25) : 0));
        const accountCounts = new Map();
        const repCounts = new Map();
        for (const d of detections) {
            if (d.accountName) {
                accountCounts.set(d.accountName, (accountCounts.get(d.accountName) ?? 0) + 1);
            }
            if (d.repName) {
                repCounts.set(d.repName, (repCounts.get(d.repName) ?? 0) + 1);
            }
        }
        const topAccounts = [...accountCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
        const topReps = [...repCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
        return wrapData({
            percentage,
            mentions: detections.length,
            topAccounts: topAccounts.length ? topAccounts : ['No account data yet'],
            topReps: topReps.length ? topReps : ['No rep data yet'],
            aiInsight: tracker.aiInsight || 'No insight available for this tracker yet.',
        });
    }
    async askTracker(tenantId, trackerSlug, question) {
        const list = await this.listTrackers(tenantId, {});
        const rows = list.data ?? list;
        const tracker = rows.find((t) => t.id === trackerSlug);
        const detailRes = await this.getTrackerDetail(tenantId, trackerSlug);
        const detail = detailRes.data ?? detailRes;
        const name = tracker?.name ?? trackerSlug;
        const pct = detail.percentage ?? tracker?.percentage ?? 0;
        const trend = tracker?.trend ?? 0;
        const trendWord = trend >= 0 ? 'increasing' : 'decreasing';
        const answer = `Based on transcript analysis for "${name}": ${question.trim()} This topic appears in about ${pct}% of completed calls (${detail.mentions} mention(s) detected), with an ${trendWord} trend of ${Math.abs(trend)}% versus the prior period. Top accounts: ${(detail.topAccounts ?? []).join(', ')}.`;
        return wrapData({ answer });
    }
};
exports.M02FrontendTrackersService = M02FrontendTrackersService;
exports.M02FrontendTrackersService = M02FrontendTrackersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M02FrontendTrackersService);
//# sourceMappingURL=m02-frontend-trackers.service.js.map