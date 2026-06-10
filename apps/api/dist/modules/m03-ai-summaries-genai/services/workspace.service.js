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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const m03_repository_1 = require("../repositories/m03.repository");
const m03_data_store_1 = require("./m03-data.store");
const crypto_1 = require("crypto");
let WorkspaceService = class WorkspaceService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getWorkspace(tenantId) {
        const ws = await this.repo.getWorkspace(tenantId);
        return {
            deals: ws.deals.map(this.normalizeDeal),
            accounts: ws.accounts.map(this.normalizeAccount),
            contacts: ws.contacts.map(this.normalizeContact),
            calls: ws.calls.map(this.normalizeCall),
        };
    }
    getChatHistory(tenantId) {
        return this.repo.listChatHistory(tenantId);
    }
    async saveChat(tenantId, userId, question, answer, citations) {
        return this.repo.saveChatMessage({ tenantId, userId, question, answer, citations });
    }
    async deleteChat(tenantId, id) {
        const idx = m03_data_store_1.m03DataStore.chatHistory.findIndex((c) => c.id === id && (c.tenant_id === tenantId || c.org_id === tenantId));
        if (idx >= 0)
            m03_data_store_1.m03DataStore.chatHistory.splice(idx, 1);
        return { deleted: true };
    }
    upsertDeal(tenantId, payload) {
        const row = {
            id: payload.id || (0, crypto_1.randomUUID)(),
            org_id: tenantId,
            name: payload.name,
            stage: payload.stage || 'Qualification',
            account_id: payload.accountId || payload.account_id,
            created_at: new Date().toISOString(),
        };
        m03_data_store_1.m03DataStore.workspace.deals = [
            row,
            ...m03_data_store_1.m03DataStore.workspace.deals.filter((d) => d.id !== row.id),
        ];
        return this.normalizeDeal(row);
    }
    normalizeDeal(d) {
        return {
            id: d.id,
            name: d.name,
            stage: d.stage ?? 'Qualification',
            accountId: d.account_id ?? d.accountId ?? '',
            account_id: d.account_id ?? d.accountId ?? '',
            created_at: d.created_at ?? '',
        };
    }
    normalizeAccount(a) {
        return { id: a.id, name: a.name ?? '' };
    }
    normalizeContact(c) {
        return {
            id: c.id,
            name: c.name ?? '',
            email: c.email ?? '',
            accountId: c.account_id ?? c.accountId ?? '',
            account_id: c.account_id ?? c.accountId ?? '',
        };
    }
    normalizeCall(c) {
        return {
            id: c.id,
            title: c.title ?? 'Discovery Call',
            transcript: c.transcript ?? '',
            accountId: c.account_id ?? c.accountId ?? '',
            account_id: c.account_id ?? c.accountId ?? '',
            account_name: c.account_name ?? null,
            dealId: c.deal_id ?? c.dealId ?? '',
            deal_id: c.deal_id ?? c.dealId ?? '',
            created_at: c.created_at ?? '',
            duration_seconds: c.duration_seconds,
            call_source: c.call_source,
            participants: c.participants ?? [],
        };
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m03_repository_1.M03AiSummariesGenaiRepository])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map