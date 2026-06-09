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
exports.M09FrontendRevenueManagerController = void 0;
const common_1 = require("@nestjs/common");
const m09_frontend_auth_guard_1 = require("./m09-frontend-auth.guard");
const prisma_service_1 = require("../database/prisma.service");
let M09FrontendRevenueManagerController = class M09FrontendRevenueManagerController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAlert() {
        const config = await this.prisma.managerAccountsConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.alertBanner || { totalARR: 0, accountCount: 0, inactiveDays: 0 };
    }
    async getSummary() {
        const config = await this.prisma.managerAccountsConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.kpiSummary || [];
    }
    async getViewers() {
        const config = await this.prisma.managerAccountsConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.viewers || { teams: [], reps: [] };
    }
    async getAccounts(search, noActivity, sortBy, sortOrder) {
        let accounts = await this.prisma.managerAccount.findMany({});
        if (search) {
            const q = search.toLowerCase();
            accounts = accounts.filter((a) => a.name.toLowerCase().includes(q));
        }
        if (noActivity === 'true' || noActivity === 'true') {
            accounts = accounts.filter((a) => {
                const act = a.activity;
                return !act || act.length === 0;
            });
        }
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            accounts.sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];
                if (sortBy === 'accountName') {
                    valA = a.name;
                    valB = b.name;
                }
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return valA.localeCompare(valB) * order;
                }
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return (valA - valB) * order;
                }
                return 0;
            });
        }
        return {
            total: accounts.length,
            page: 1,
            size: 25,
            totalPages: 1,
            accounts: accounts.map((a) => ({
                accountId: a.id,
                accountName: a.name,
                owner: { id: a.ownerId, name: a.ownerName, initials: a.ownerInitials },
                exitARR: a.exitARR,
                contactsCount: a.contactsCount,
                activity: a.activity,
                lastActivity: a.lastActivity,
                managerNote: a.managerNote,
                openDeals: a.openDeals,
                renewalDate: a.renewalDate,
            })),
        };
    }
    async getRecentActivities(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        return acc?.recentActivities || [];
    }
    async getAccountOverview(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        return acc?.overview || { risksAndObjections: [] };
    }
    async getAccountActivity(accountId, type) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        const feed = acc?.activityFeed || { items: [], total: 0, page: 1, totalPages: 0 };
        const items = feed.items || [];
        const filteredItems = type && type !== 'all'
            ? items.filter((item) => item.type?.toLowerCase() === type.toLowerCase())
            : items;
        return {
            items: filteredItems,
            total: filteredItems.length,
            page: 1,
            totalPages: 1,
        };
    }
    async getAccountBriefs(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        if (!acc) {
            return { briefContent: 'Account not found.' };
        }
        const systemPrompt = `You are a helpful sales coaching assistant. Generate a professional and structured account brief for a sales representative based on the provided account metadata. You MUST return ONLY raw JSON matching exactly this structure, with no markdown fences, no preamble, and no extra text:
{
  "overview": "string",
  "keyDiscussionPoints": "string",
  "customerNeedsGoals": "string",
  "risksObjections": "string",
  "decisionsCommitments": "string",
  "nextSteps": "string",
  "keyStakeholders": "string or null",
  "recentActivityContext": "string or null"
}`;
        const userMessage = `Generate an account brief for the following account:
Account Name: ${acc.name}
Exit ARR: $${acc.exitARR.toLocaleString()}
Contacts Count: ${acc.contactsCount}
Open Deals: $${acc.openDeals.toLocaleString()}
Renewal Date: ${acc.renewalDate}
Last Activity: ${acc.lastActivity}
Manager Note: ${acc.managerNote || 'None'}
Activities: ${JSON.stringify(acc.activity)}`;
        let briefContent = '';
        try {
            briefContent = await this.callGroq(systemPrompt, userMessage);
        }
        catch (e) {
            console.error('[Briefs] Groq call failed, using fallback:', e);
        }
        if (!briefContent) {
            briefContent = JSON.stringify({
                overview: `${acc.name} is a key account with $${acc.exitARR.toLocaleString()} ARR. They have ${acc.contactsCount} contacts and $${acc.openDeals.toLocaleString()} open deals.`,
                keyDiscussionPoints: `Last activity recorded on ${acc.lastActivity}.`,
                customerNeedsGoals: `Need to ensure successful renewal by ${acc.renewalDate}.`,
                risksObjections: `No specific risks recorded.`,
                decisionsCommitments: `None recorded.`,
                nextSteps: `Follow up on open deals and plan renewal review meeting.`,
                keyStakeholders: `Manager note: ${acc.managerNote || 'None'}`,
                recentActivityContext: null
            });
        }
        return { briefContent };
    }
    async callGroq(systemPrompt, userMessage) {
        const key = process.env.GROQ_API_KEY;
        if (!key) {
            return '';
        }
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage },
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                console.warn(`[Groq] API error ${res.status}: ${text}`);
                return '';
            }
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() || '';
        }
        catch (err) {
            console.warn('[Groq] Fetch failed:', err);
            return '';
        }
    }
    getLocalChatFallback(msg, accountName) {
        const msgLower = msg.toLowerCase();
        if (msgLower.includes('budget') || msgLower.includes('cost') || msgLower.includes('price')) {
            return `For the account ${accountName}, budget constraints were noted. The customer mentioned that high implementation costs might delay sign-off. Emphasize our ROI calculator and flexible quarterly terms in your next proposal.`;
        }
        if (msgLower.includes('competitor') || msgLower.includes('compete') || msgLower.includes('vendor')) {
            return `Our signals indicate ${accountName} is actively evaluating competing products for their enterprise needs. Make sure to schedule a deep-dive call showcasing our unique security integrations and multi-tenant scaling capabilities.`;
        }
        if (msgLower.includes('renewal') || msgLower.includes('date') || msgLower.includes('when')) {
            return `The renewal for ${accountName} is scheduled for Dec 16, 2024. The current sentiment is positive, but we need to resolve the pending legal reviews to ensure there are no last-minute delays.`;
        }
        if (msgLower.includes('contact') || msgLower.includes('who') || msgLower.includes('champion')) {
            return `The main contact at ${accountName} is Marcus Lee (VP Engineering), who is highly supportive. However, we also need to win over the Finance Director to secure final approval.`;
        }
        return `Based on recent updates for ${accountName}, they are currently in negotiation stage for a deal valued at $180,000. Key next step: follow up on the proposal sent yesterday and schedule a review session.`;
    }
    async getAccountTodos(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        return acc?.todos || { todos: [] };
    }
    async toggleTodo(accountId, todoId, completed) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        if (!acc)
            return { success: false };
        const todosData = acc.todos?.todos || [];
        const updated = todosData.map((t) => t.id === todoId ? { ...t, completed } : t);
        await this.prisma.managerAccount.update({
            where: { id: accountId },
            data: { todos: { todos: updated } },
        });
        return { success: true };
    }
    async getAccountNotes(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        return {
            notes: acc?.notes || '',
            updatedAt: acc?.notesUpdatedAt || null,
        };
    }
    async saveNotes(accountId, notes) {
        await this.prisma.managerAccount.update({
            where: { id: accountId },
            data: { notes, notesUpdatedAt: new Date() },
        });
        return { success: true };
    }
    async getAccountCrm(accountId) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        return acc?.crmFields || { crmFields: [] };
    }
    async sendAiChat(accountId, message) {
        const acc = await this.prisma.managerAccount.findUnique({
            where: { id: accountId },
        });
        if (!acc) {
            return { reply: 'Account not found.' };
        }
        const systemPrompt = `You are a helpful sales assistant. Answer the user's question about the account "${acc.name}" dynamically based on their query. Keep it concise (2-4 sentences) and professional.`;
        let reply = '';
        try {
            reply = await this.callGroq(systemPrompt, message);
        }
        catch (e) {
            console.error('[AI Chat] Groq call failed, using fallback:', e);
        }
        if (!reply) {
            reply = this.getLocalChatFallback(message, acc.name);
        }
        const history = acc.aiChatHistory || [];
        history.push({ role: 'user', message });
        history.push({ role: 'assistant', reply });
        await this.prisma.managerAccount.update({
            where: { id: accountId },
            data: { aiChatHistory: history },
        });
        return { reply };
    }
    async getCoachingFilters() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.filters || { periods: [], teams: [] };
    }
    async getCoachingActivity() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.activity || [];
    }
    async getCoachingInteraction() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.interaction || { reps: [], benchmarks: {} };
    }
    async getCoachingResponsiveness() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.responsiveness || [];
    }
    async getCoachingScorecards() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.scorecards || [];
    }
    async getCoachingAiInsights() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.aiInsights || [];
    }
    async getCoachingTeamVsBenchmark() {
        const config = await this.prisma.managerCoachingConfig.findUnique({
            where: { id: 'default' },
        });
        return config?.teamVsBenchmark || [];
    }
    async getCoachingRepDetails(repId) {
        const rep = await this.prisma.managerCoachingRep.findUnique({
            where: { id: repId },
        });
        if (!rep) {
            return {
                header: { repId, name: 'Sales Representative', initials: 'SR', avatarColor: '#ccc', title: 'Interaction Coaching', callsAnalyzed: 0 },
                kpis: {
                    talkRatio: { value: '50%', optimalText: 'Optimal <43%', status: 'warning' },
                    questionRate: { value: '12/hr', optimalText: 'Optimal 18+/hr', status: 'warning' },
                    monologue: { value: '2m 15s', optimalText: 'Optimal <2 min', status: 'warning' },
                },
                trend: { title: 'Talk ratio — Trend', benchmark: 43, insightText: 'No data', weeks: [] },
                recentCalls: [],
                observedPatterns: [],
                recommendedActions: [],
                coachingHistory: []
            };
        }
        return rep;
    }
};
exports.M09FrontendRevenueManagerController = M09FrontendRevenueManagerController;
__decorate([
    (0, common_1.Get)('revenue/accounts/alert'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAlert", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/viewers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getViewers", null);
__decorate([
    (0, common_1.Get)('revenue/accounts'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('noActivity')),
    __param(2, (0, common_1.Query)('sortBy')),
    __param(3, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/activities/recent'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getRecentActivities", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/overview'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountOverview", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/activity'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountActivity", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/briefs'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountBriefs", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/todos'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountTodos", null);
__decorate([
    (0, common_1.Patch)('revenue/accounts/:accountId/todos/:todoId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Param)('todoId')),
    __param(2, (0, common_1.Body)('completed')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "toggleTodo", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/notes'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountNotes", null);
__decorate([
    (0, common_1.Patch)('revenue/accounts/:accountId/notes'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "saveNotes", null);
__decorate([
    (0, common_1.Get)('revenue/accounts/:accountId/crm'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getAccountCrm", null);
__decorate([
    (0, common_1.Post)('revenue/accounts/:accountId/ai-chat'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "sendAiChat", null);
__decorate([
    (0, common_1.Get)('coaching/filters'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingFilters", null);
__decorate([
    (0, common_1.Get)('coaching/activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingActivity", null);
__decorate([
    (0, common_1.Get)('coaching/interaction'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingInteraction", null);
__decorate([
    (0, common_1.Get)('coaching/responsiveness'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingResponsiveness", null);
__decorate([
    (0, common_1.Get)('coaching/scorecards'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingScorecards", null);
__decorate([
    (0, common_1.Get)('coaching/ai-insights'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingAiInsights", null);
__decorate([
    (0, common_1.Get)('coaching/team-vs-benchmark'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingTeamVsBenchmark", null);
__decorate([
    (0, common_1.Get)('coaching/rep/:repId'),
    __param(0, (0, common_1.Param)('repId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M09FrontendRevenueManagerController.prototype, "getCoachingRepDetails", null);
exports.M09FrontendRevenueManagerController = M09FrontendRevenueManagerController = __decorate([
    (0, common_1.Controller)('api/manager'),
    (0, common_1.UseGuards)(m09_frontend_auth_guard_1.M09FrontendAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M09FrontendRevenueManagerController);
//# sourceMappingURL=m09-frontend-revenue-manager.controller.js.map