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
exports.M03AiSummariesGenaiRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const m03_data_store_1 = require("../services/m03-data.store");
const m03_tenant_util_1 = require("../services/m03-tenant.util");
const crypto_1 = require("crypto");
let M03AiSummariesGenaiRepository = class M03AiSummariesGenaiRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    aiBriefDelegate() {
        return this.prisma.aiBrief ?? null;
    }
    chatDelegate() {
        return this.prisma.aiChatHistory ?? null;
    }
    async findAll(tenantId) {
        const delegate = this.aiBriefDelegate();
        if (delegate?.findMany) {
            return delegate.findMany({
                where: { tenantId },
                orderBy: { updatedAt: 'desc' },
                take: 50,
            });
        }
        return m03_data_store_1.m03DataStore.listBriefs(tenantId);
    }
    async create(data) {
        const row = {
            id: (0, crypto_1.randomUUID)(),
            tenantId: data.tenantId,
            briefType: data.briefType || 'account',
            entityId: data.entityId || 'unknown',
            generatedSummary: data.generatedSummary || null,
            generationStatus: 'completed',
            sourceReferences: [],
            llmModel: 'mock',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const delegate = this.aiBriefDelegate();
        if (delegate?.upsert) {
            try {
                return await delegate.upsert({
                    where: {
                        tenantId_briefType_entityId: {
                            tenantId: row.tenantId,
                            briefType: row.briefType,
                            entityId: row.entityId,
                        },
                    },
                    create: row,
                    update: {
                        generatedSummary: row.generatedSummary,
                        generationStatus: row.generationStatus,
                        updatedAt: new Date(),
                    },
                });
            }
            catch {
            }
        }
        m03_data_store_1.m03DataStore.insertBrief({
            id: row.id,
            org_id: row.tenantId,
            brief_type: row.briefType,
            entity_id: row.entityId,
            generated_summary: row.generatedSummary,
            generation_status: row.generationStatus,
            created_at: row.createdAt.toISOString(),
        });
        return row;
    }
    async getBrief(tenantId, briefType, entityId) {
        const tid = (0, m03_tenant_util_1.resolveM03TenantId)(tenantId);
        const delegate = this.aiBriefDelegate();
        if (delegate?.findUnique) {
            try {
                const row = await delegate.findUnique({
                    where: {
                        tenantId_briefType_entityId: { tenantId: tid, briefType, entityId },
                    },
                });
                if (row)
                    return this.mapBrief(row);
            }
            catch {
            }
        }
        const mem = m03_data_store_1.m03DataStore.listBriefs(tid, entityId).find((b) => b.brief_type === briefType && b.entity_id === entityId);
        return mem ? this.mapBrief(mem) : null;
    }
    async upsertBrief(params) {
        try {
            return await this.create({
                tenantId: params.tenantId,
                briefType: params.briefType,
                entityId: params.entityId,
                generatedSummary: params.generatedSummary,
            });
        }
        catch {
            m03_data_store_1.m03DataStore.insertBrief({
                id: (0, crypto_1.randomUUID)(),
                org_id: params.tenantId,
                brief_type: params.briefType,
                entity_id: params.entityId,
                generated_summary: params.generatedSummary,
                generation_status: params.generationStatus || 'completed',
                created_at: new Date().toISOString(),
            });
            return this.getBrief(params.tenantId, params.briefType, params.entityId);
        }
    }
    async listChatHistory(tenantId, limit = 50) {
        const delegate = this.chatDelegate();
        if (delegate?.findMany) {
            return delegate.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        return m03_data_store_1.m03DataStore.chatHistory
            .filter((c) => c.tenant_id === tenantId || c.org_id === tenantId)
            .slice(0, limit);
    }
    async saveChatMessage(params) {
        const row = {
            id: (0, crypto_1.randomUUID)(),
            tenantId: params.tenantId,
            userId: params.userId,
            question: params.question,
            answer: params.answer,
            citations: params.citations || [],
            createdAt: new Date(),
        };
        const delegate = this.chatDelegate();
        if (delegate?.create) {
            return delegate.create({ data: row });
        }
        m03_data_store_1.m03DataStore.chatHistory.unshift({
            id: row.id,
            tenant_id: row.tenantId,
            org_id: row.tenantId,
            user_id: row.userId,
            question: row.question,
            answer: row.answer,
            citations: row.citations,
            created_at: row.createdAt.toISOString(),
        });
        return row;
    }
    async getWorkspace(tenantId) {
        const tid = (0, m03_tenant_util_1.resolveM03TenantId)(tenantId);
        try {
            const fromDb = await this.loadWorkspaceFromPostgres(tid);
            if (fromDb.calls.length > 0 ||
                fromDb.accounts.length > 0 ||
                fromDb.deals.length > 0) {
                return fromDb;
            }
        }
        catch (err) {
            console.warn('[M03] Postgres workspace load failed:', err?.message || err);
        }
        if (tid === m03_tenant_util_1.M03_DEMO_TENANT || tid === m03_data_store_1.M03_DEV_ORG) {
            return m03_data_store_1.m03DataStore.workspace;
        }
        return { deals: [], accounts: [], contacts: [], calls: [] };
    }
    async loadEntityContext(tenantId, briefType, entityId) {
        const ws = await this.getWorkspace(tenantId);
        if (briefType === 'call') {
            return ws.calls.find((c) => c.id === entityId) ?? null;
        }
        if (briefType === 'deal') {
            return ws.deals.find((d) => d.id === entityId) ?? null;
        }
        if (briefType === 'account') {
            return ws.accounts.find((a) => a.id === entityId) ?? null;
        }
        if (briefType === 'contact') {
            return ws.contacts.find((c) => c.id === entityId) ?? null;
        }
        return null;
    }
    async loadWorkspaceFromPostgres(tenantId) {
        const prisma = this.prisma;
        const [callRecords, accounts, deals, m10Contacts] = await Promise.all([
            prisma.callRecord?.findMany
                ? prisma.callRecord.findMany({
                    where: { tenantId },
                    orderBy: { callDate: 'desc' },
                    take: 50,
                    include: { transcript: true },
                })
                : [],
            prisma.account?.findMany
                ? prisma.account.findMany({
                    where: { tenantId },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                })
                : [],
            prisma.deal?.findMany
                ? prisma.deal.findMany({
                    where: { tenantId },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                    include: { account: true },
                })
                : [],
            prisma.m10Contact?.findMany
                ? prisma.m10Contact.findMany({
                    where: { tenantId },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                })
                : [],
        ]);
        const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
        const calls = callRecords.map((c) => {
            const transcriptText = c.transcript?.fullText ||
                c.transcript?.summary ||
                '';
            const accountName = c.accountId
                ? accountNameById.get(c.accountId) || null
                : null;
            return {
                id: c.id,
                title: c.title || 'Call',
                transcript: transcriptText,
                account_id: c.accountId || '',
                accountId: c.accountId || '',
                account_name: accountName,
                deal_id: c.opportunityId || '',
                dealId: c.opportunityId || '',
                call_owner: c.callOwner,
                duration_seconds: c.durationSeconds,
                created_at: c.callDate?.toISOString?.() || c.createdAt?.toISOString?.() || '',
                transcript_status: c.transcriptStatus,
                call_source: c.callSource,
                participants: c.participants || [],
            };
        });
        const dealsNorm = deals.map((d) => ({
            id: d.id,
            name: d.name,
            stage: d.stage,
            amount: d.amount != null ? String(d.amount) : null,
            account_id: d.accountId || d.account?.id || '',
            accountId: d.accountId || d.account?.id || '',
            account_name: d.account?.name || accountNameById.get(d.accountId) || null,
            created_at: d.createdAt?.toISOString?.() || '',
        }));
        const accountsNorm = accounts.map((a) => ({
            id: a.id,
            name: a.name,
            industry: a.industry || 'Technology',
            owner_name: a.ownerName,
            health_score: a.healthScore,
            created_at: a.createdAt?.toISOString?.() || '',
        }));
        let contactsNorm = m10Contacts.map((c) => ({
            id: c.id,
            name: c.name || c.email,
            email: c.email,
            role: c.title || 'Stakeholder',
            account_id: c.accountId || '',
            accountId: c.accountId || '',
        }));
        if (contactsNorm.length === 0) {
            contactsNorm = this.contactsFromCallParticipants(calls);
        }
        return {
            deals: dealsNorm,
            accounts: accountsNorm,
            contacts: contactsNorm,
            calls,
        };
    }
    contactsFromCallParticipants(calls) {
        const seen = new Set();
        const out = [];
        for (const call of calls) {
            for (const p of call.participants || []) {
                const name = typeof p === 'string' ? p : p?.name || p?.email;
                if (!name || seen.has(name))
                    continue;
                seen.add(name);
                out.push({
                    id: `participant-${seen.size}`,
                    name,
                    email: name.includes('@') ? name : '',
                    role: 'Participant',
                    account_id: call.account_id || '',
                    accountId: call.account_id || '',
                });
            }
        }
        return out.slice(0, 30);
    }
    mapBrief(row) {
        return {
            id: row.id,
            briefType: row.briefType ?? row.brief_type,
            entityId: row.entityId ?? row.entity_id,
            generatedSummary: row.generatedSummary ?? row.generated_summary,
            generationStatus: row.generationStatus ?? row.generation_status,
            sourceReferences: row.sourceReferences ?? row.source_references ?? [],
            llmModel: row.llmModel ?? row.llm_model,
            createdAt: row.createdAt ?? row.created_at,
        };
    }
};
exports.M03AiSummariesGenaiRepository = M03AiSummariesGenaiRepository;
exports.M03AiSummariesGenaiRepository = M03AiSummariesGenaiRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M03AiSummariesGenaiRepository);
//# sourceMappingURL=m03.repository.js.map