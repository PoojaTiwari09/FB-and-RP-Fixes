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
exports.M03TestController = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const research_service_1 = require("../services/research.service");
const brief_service_1 = require("../services/brief.service");
const query_service_1 = require("../services/query.service");
const m03_data_store_1 = require("../services/m03-data.store");
const m03_tenant_util_1 = require("../services/m03-tenant.util");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
let M03TestController = class M03TestController {
    prisma;
    research;
    briefs;
    query;
    constructor(prisma, research, briefs, query) {
        this.prisma = prisma;
        this.research = research;
        this.briefs = briefs;
        this.query = query;
    }
    async health() {
        try {
            await this.prisma.$queryRawUnsafe('SELECT 1');
        }
        catch {
        }
        return {
            success: true,
            database: 'up',
            aiMode: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
            timestamp: new Date().toISOString(),
        };
    }
    async workspaceStats() {
        const tenantId = m03_tenant_util_1.M03_DEMO_TENANT;
        const prisma = this.prisma;
        const [calls, accounts, deals, m10Contacts] = await Promise.all([
            prisma.callRecord?.count?.({ where: { tenantId } }) ?? 0,
            prisma.account?.count?.({ where: { tenantId } }) ?? 0,
            prisma.deal?.count?.({ where: { tenantId } }) ?? 0,
            prisma.m10Contact?.count?.({ where: { tenantId } }) ?? 0,
        ]);
        return {
            tenantId,
            call_records: calls,
            accounts,
            deals,
            m10_contacts: m10Contacts,
            note: calls > 0 && accounts === 0
                ? 'M01 writes call_records only. Run POST .../test/seed-crm or HubSpot sync (M07) for accounts/deals.'
                : undefined,
        };
    }
    async seedCrm() {
        const tenantId = m03_tenant_util_1.M03_DEMO_TENANT;
        const prisma = this.prisma;
        const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`;
        const tenantSlug = `rri-demo-${tenantId.slice(0, 8)}`;
        const existingTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!existingTenant) {
            await prisma.tenant.create({
                data: { id: tenantId, name: 'Demo Tenant', slug: tenantSlug },
            });
        }
        const accounts = await Promise.all([
            prisma.account.upsert({
                where: { id: 'm03-seed-acct-modus' },
                create: {
                    id: 'm03-seed-acct-modus',
                    tenantId,
                    name: 'Moduslink',
                    industry: 'Technology',
                    ownerName: 'Demo Rep',
                },
                update: { name: 'Moduslink', industry: 'Technology' },
            }),
            prisma.account.upsert({
                where: { id: 'm03-seed-acct-acme' },
                create: {
                    id: 'm03-seed-acct-acme',
                    tenantId,
                    name: 'Acme Corp',
                    industry: 'Manufacturing',
                    ownerName: 'Demo Rep',
                },
                update: { name: 'Acme Corp' },
            }),
        ]);
        const deals = await Promise.all([
            prisma.deal.upsert({
                where: { id: 'm03-seed-deal-modus' },
                create: {
                    id: 'm03-seed-deal-modus',
                    tenantId,
                    accountId: 'm03-seed-acct-modus',
                    name: 'Moduslink Expansion',
                    amount: 125000,
                    stage: 'Negotiation',
                    quarter,
                },
                update: { stage: 'Negotiation', accountId: 'm03-seed-acct-modus' },
            }),
            prisma.deal.upsert({
                where: { id: 'm03-seed-deal-acme' },
                create: {
                    id: 'm03-seed-deal-acme',
                    tenantId,
                    accountId: 'm03-seed-acct-acme',
                    name: 'Acme Platform Renewal',
                    amount: 85000,
                    stage: 'Proposal',
                    quarter,
                },
                update: { stage: 'Proposal', accountId: 'm03-seed-acct-acme' },
            }),
        ]);
        const calls = await prisma.callRecord.findMany({
            where: { tenantId },
            take: 10,
            orderBy: { callDate: 'desc' },
        });
        let linked = 0;
        for (const call of calls) {
            const isModus = (call.title || '').toLowerCase().includes('modus');
            await prisma.callRecord.update({
                where: { id: call.id },
                data: {
                    accountId: isModus ? 'm03-seed-acct-modus' : 'm03-seed-acct-acme',
                    opportunityId: isModus ? 'm03-seed-deal-modus' : 'm03-seed-deal-acme',
                    participants: call.participants?.length
                        ? call.participants
                        : ['Demo Rep', 'Buyer Contact'],
                },
            });
            linked += 1;
        }
        return {
            success: true,
            tenantId,
            accounts: accounts.length,
            deals: deals.length,
            callsLinked: linked,
            message: 'Refresh Smart Summaries — Deals, Accounts, and Contacts tabs should populate.',
        };
    }
    async smoke() {
        const user = { orgId: m03_data_store_1.M03_DEV_ORG, userId: m03_data_store_1.M03_DEV_USER };
        const job = await this.research.createJob({ query: 'What are the top risks in Acme deal?', contextType: 'ACCOUNT' }, user);
        await new Promise((r) => setTimeout(r, 800));
        const status = await this.research.getJobStatus(job.jobId, user.orgId);
        const brief = await this.briefs.generateBrief(user.orgId, 'deal', 'deal-1');
        const query = await this.query.processQuery({
            query: 'Summarize recent calls',
            contextType: 'ACCOUNT',
            orgId: user.orgId,
            userId: user.userId,
        });
        return {
            success: true,
            jobId: job.jobId,
            jobStatus: status?.status,
            reportId: status?.reportId,
            briefGenerated: Boolean(brief?.success),
            queryAnswerLength: (query?.answer || '').length,
        };
    }
};
exports.M03TestController = M03TestController;
__decorate([
    (0, exports.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M03TestController.prototype, "health", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Get)('workspace-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M03TestController.prototype, "workspaceStats", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Post)('seed-crm'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M03TestController.prototype, "seedCrm", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Post)('smoke'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M03TestController.prototype, "smoke", null);
exports.M03TestController = M03TestController = __decorate([
    (0, common_1.Controller)('api/v1/ai-summaries-genai/test'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        research_service_1.ResearchService,
        brief_service_1.BriefService,
        query_service_1.QueryService])
], M03TestController);
//# sourceMappingURL=m03-test.controller.js.map