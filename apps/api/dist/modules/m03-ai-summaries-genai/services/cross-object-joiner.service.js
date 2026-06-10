"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossObjectJoinerService = void 0;
const common_1 = require("@nestjs/common");
const m03_data_store_1 = require("./m03-data.store");
let CrossObjectJoinerService = class CrossObjectJoinerService {
    async joinForScope(orgId, scope) {
        const ws = m03_data_store_1.m03DataStore.workspace;
        let accountIds = scope.accountIds || [];
        if (!accountIds.length) {
            accountIds = ws.accounts
                .filter((a) => a.org_id === orgId && (!scope.region || a.region === scope.region))
                .map((a) => a.id);
        }
        if (!accountIds.length)
            return this.emptyContext();
        const accounts = ws.accounts.filter((a) => a.org_id === orgId && accountIds.includes(a.id));
        let deals = ws.deals.filter((d) => d.org_id === orgId && accountIds.includes(d.account_id));
        if (scope.stage)
            deals = deals.filter((d) => d.stage === scope.stage);
        const dealIds = deals.map((d) => d.id);
        const contacts = ws.contacts.filter((c) => c.org_id === orgId && accountIds.includes(c.account_id));
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - (scope.periodDays || 60));
        const callMap = new Map();
        for (const call of ws.calls.filter((c) => c.org_id === orgId)) {
            const inAccount = accountIds.includes(call.account_id);
            const inDeal = call.deal_id && dealIds.includes(call.deal_id);
            if (inAccount || inDeal)
                callMap.set(call.id, call);
        }
        const calls = Array.from(callMap.values());
        const callToDeal = {};
        const dealToAccount = {};
        const accountToContacts = {};
        for (const call of calls) {
            if (call.deal_id)
                callToDeal[call.id] = call.deal_id;
        }
        for (const deal of deals) {
            if (deal.account_id)
                dealToAccount[deal.id] = deal.account_id;
        }
        for (const contact of contacts) {
            if (!accountToContacts[contact.account_id])
                accountToContacts[contact.account_id] = [];
            accountToContacts[contact.account_id].push(contact.id);
        }
        return {
            calls,
            emails: [],
            deals,
            accounts,
            contacts,
            relationships: { callToDeal, dealToAccount, accountToContacts },
        };
    }
    emptyContext() {
        return {
            calls: [],
            emails: [],
            deals: [],
            accounts: [],
            contacts: [],
            relationships: { callToDeal: {}, dealToAccount: {}, accountToContacts: {} },
        };
    }
};
exports.CrossObjectJoinerService = CrossObjectJoinerService;
exports.CrossObjectJoinerService = CrossObjectJoinerService = __decorate([
    (0, common_1.Injectable)()
], CrossObjectJoinerService);
//# sourceMappingURL=cross-object-joiner.service.js.map