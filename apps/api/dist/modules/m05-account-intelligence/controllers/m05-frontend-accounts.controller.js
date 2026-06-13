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
exports.M05FrontendAccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("../services/accounts.service");
const edits_service_1 = require("../services/edits.service");
const todos_service_1 = require("../services/todos.service");
const ai_service_1 = require("../services/ai.service");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const MOCK_TEAMS = [
    { id: 'team_01', name: 'Enterprise West', memberCount: 4 },
    { id: 'team_02', name: 'Commercial East', memberCount: 6 },
];
const MOCK_REPS = [
    { id: 'rep_01', name: 'Sarah Mitchell', initials: 'SM', avatarUrl: '' },
    { id: 'rep_02', name: 'James Torres', initials: 'JT', avatarUrl: '' },
    { id: 'rep_03', name: 'Priya Nair', initials: 'PN', avatarUrl: '' },
    { id: 'manager_01', name: 'Alan Clayborn', initials: 'AC', avatarUrl: '' },
];
let M05FrontendAccountsController = class M05FrontendAccountsController {
    accountsService;
    editsService;
    todosService;
    aiService;
    constructor(accountsService, editsService, todosService, aiService) {
        this.accountsService = accountsService;
        this.editsService = editsService;
        this.todosService = todosService;
        this.aiService = aiService;
    }
    async getAlertBanner(req) {
        const res = await this.accountsService.getEngagementGap('demo', 14);
        return {
            totalARR: res.low_engagement_arr,
            accountCount: res.low_engagement_count,
            inactiveDays: res.window_days,
        };
    }
    async getSummary(req, viewing, period) {
        const res = await this.accountsService.getAccounts(req.tenantId, {
            board_slug: 'demo',
            rep_id: viewing,
            period,
        }, req.userId, req.userRole);
        const allArr = res.summary.all_arr || 0;
        const allCount = res.summary.all_count || 0;
        const atRiskCount = res.summary.tab_counts['at-risk']?.count || 0;
        const highArrCount = res.summary.tab_counts['high-arr']?.count || 0;
        return [
            { label: 'Accounts', value: allArr, count: allCount },
            { label: 'Renewal', value: allArr * 0.4, count: atRiskCount },
            { label: 'Upsell', value: allArr * 0.2, count: highArrCount },
            { label: 'Churn Risk', value: allArr * 0.1, count: atRiskCount }
        ];
    }
    async getViewers() {
        return {
            teams: MOCK_TEAMS,
            reps: MOCK_REPS,
        };
    }
    async getAccountsList(req, viewing, period, noActivity, search, sortBy, sortOrder, page, size) {
        console.log('[DEBUG] Frontend requesting Accounts List', {
            userRole: req.userRole,
            userId: req.userId,
            tenantId: req.tenantId,
            viewing,
            period,
            noActivity,
        });
        const res = await this.accountsService.getAccounts(req.tenantId, {
            board_slug: 'demo',
            rep_id: viewing,
            period,
            sort_field: sortBy,
            sort_dir: sortOrder,
            page: page ? parseInt(page) : 1,
            page_size: size ? parseInt(size) : 20,
        }, req.userId, req.userRole);
        let accs = res.accounts;
        if (noActivity === 'true') {
            accs = accs.filter(a => a.zero_activity_flag);
        }
        if (search) {
            const lower = search.toLowerCase();
            accs = accs.filter(a => a.name.toLowerCase().includes(lower));
        }
        const formatted = accs.map(a => ({
            accountId: a.hubspot_id,
            accountName: a.name,
            owner: {
                id: a.assigned_rep.id,
                name: a.assigned_rep.name,
                initials: a.assigned_rep.name.split(' ').map((n) => n[0]).join(''),
            },
            exitARR: a.exit_arr,
            contactsCount: a.contacts_count,
            activity: a.activities_21d,
            lastActivity: a.last_activity_days !== null ? `${a.last_activity_days} days ago` : 'No activity',
            managerNote: a.manager_note,
            openDeals: a.open_deals_summary?.total_amount || 0,
            renewalDate: a.renewal_date,
        }));
        return {
            accounts: formatted,
            page: res.page,
            size: res.page_size,
            total: res.total,
            totalPages: Math.ceil(res.total / res.page_size),
        };
    }
    async getRecentActivities(accountId, limit) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return [];
        const activities = detail.activities || [];
        const num = limit ? parseInt(limit) : 5;
        return activities.slice(0, num).map((a) => ({
            type: a.type,
            datetime: a.timestamp,
            with: 'Primary Contact',
            subject: a.subject || 'No subject',
        }));
    }
    async sendAiChat(accountId, body) {
        try {
            const res = await this.aiService.chat({
                company_hubspot_id: accountId,
                message: body.message,
                conversation_history: body.history || [],
            });
            return { reply: res.reply };
        }
        catch (e) {
            return { reply: `AI chat is offline. M05 Database company ID: ${accountId}. Message received: ${body.message}` };
        }
    }
    async getAccountOverview(accountId) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return { risksAndObjections: [], overviewInfo: null, recentActivities: [] };
        const risks = [];
        const score = detail.supplementary?.ai_risk_score ?? 0;
        if (score > 50) {
            risks.push({
                title: 'High AI Risk Score',
                severity: 'HIGH',
                mentionedCount: 3,
                lastMentioned: 'Yesterday'
            });
        }
        else if (score > 30) {
            risks.push({
                title: 'Moderate AI Risk Score',
                severity: 'MEDIUM',
                mentionedCount: 2,
                lastMentioned: '2 days ago'
            });
        }
        else if (score > 0) {
            risks.push({
                title: 'Low AI Risk Score',
                severity: 'LOW',
                mentionedCount: 1,
                lastMentioned: '3 days ago'
            });
        }
        const lastActivity = detail.activities?.[0];
        const lastActivityDays = lastActivity
            ? Math.round((Date.now() - new Date(lastActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24))
            : null;
        if (lastActivityDays === null || lastActivityDays > 21) {
            risks.push({
                title: 'Engagement Gap (No activity in 21+ days)',
                severity: 'HIGH',
                mentionedCount: 2,
                lastMentioned: 'System Scan'
            });
        }
        const company = detail.company;
        const repId = company?.assigned_rep_id;
        const TEAM_MAP = {
            rep_01: 'Sarah Mitchell',
            rep_02: 'James Torres',
            rep_03: 'Priya Nair',
            manager_01: 'Alan Clayborn',
        };
        const assignedRep = (repId && TEAM_MAP[repId]) || repId || 'Unassigned';
        const renewalDeals = (detail.deals || []).filter((d) => d.deal_type === 'Renewal' && !['Closed Won', 'Closed Lost'].includes(d.stage));
        const renewalDate = renewalDeals.length > 0
            ? renewalDeals.sort((a, b) => new Date(a.close_date).getTime() - new Date(b.close_date).getTime())[0].close_date
            : null;
        const openDeals = (detail.deals || []).filter((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
        const openDealsAmount = openDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const rawNote = detail.supplementary?.manager_note || null;
        let managerNote = rawNote;
        if (rawNote && rawNote.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(rawNote);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    managerNote = parsed[0].text || null;
                }
            }
            catch { }
        }
        const overviewInfo = {
            assignedRep,
            healthScore: company?.healthscore != null
                ? Number(company.healthscore)
                : company?.health_score != null
                    ? Number(company.health_score)
                    : null,
            exitArr: company?.exit_arr || 0,
            renewalDate,
            contactsCount: detail.contacts?.length || 0,
            lastActivityLabel: lastActivityDays !== null ? `${lastActivityDays} days ago` : 'No activity',
            managerNote,
            openDealsAmount
        };
        const recentActivities = (detail.activities || []).slice(0, 8).map((a) => {
            let mappedType = a.type || 'Note';
            if (mappedType.toUpperCase() === 'EMAIL')
                mappedType = 'Email';
            else if (mappedType.toUpperCase() === 'MEETING')
                mappedType = 'Meeting';
            else if (mappedType.toUpperCase() === 'CALL')
                mappedType = 'Call';
            else if (mappedType.toUpperCase() === 'NOTE')
                mappedType = 'Note';
            return {
                type: mappedType,
                datetime: a.timestamp,
                subject: a.subject || a.body || `${mappedType} Activity`
            };
        });
        return { risksAndObjections: risks, overviewInfo, recentActivities };
    }
    async getAccountActivity(accountId, type, page, size) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return { items: [], total: 0, page: 1, totalPages: 0 };
        let acts = (detail.activities || []).map((a) => {
            let mappedType = a.type || 'Note';
            if (mappedType.toUpperCase() === 'EMAIL')
                mappedType = 'Email';
            else if (mappedType.toUpperCase() === 'MEETING')
                mappedType = 'Meeting';
            else if (mappedType.toUpperCase() === 'CALL')
                mappedType = 'Call';
            else if (mappedType.toUpperCase() === 'NOTE')
                mappedType = 'Note';
            return {
                type: mappedType,
                datetime: a.timestamp,
                with: 'Contact',
                subject: a.subject || a.body || `${mappedType} Activity`,
                createdBy: 'Unassigned'
            };
        });
        if (type && type !== 'all') {
            acts = acts.filter(a => a.type.toLowerCase() === type.toLowerCase());
        }
        return {
            items: acts,
            total: acts.length,
            page: 1,
            totalPages: 1
        };
    }
    async getAccountBriefs(accountId) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return { briefContent: '' };
        const { data: briefCache } = await this.accountsService.supabase
            .from('ai_briefs_cache')
            .select('*')
            .eq('company_hubspot_id', accountId)
            .order('generated_at', { ascending: false })
            .limit(1);
        const briefContent = this.accountsService.buildFormattedBriefMarkdown(detail.company, detail.contacts || [], detail.deals || [], detail.activities || [], detail.supplementary, briefCache || []);
        return {
            briefContent
        };
    }
    async getAccountTodos(accountId) {
        const allItems = await this.todosService.getTodos(accountId);
        const todos = allItems
            .filter((t) => t.type === 'todo')
            .map((t) => ({
            id: t.id,
            title: t.content,
            dueDate: t.completed_at || new Date().toISOString(),
            assignee: 'Rep',
            completed: t.completed
        }));
        return { todos };
    }
    async toggleTodo(accountId, todoId, body) {
        const updated = await this.todosService.updateTodo(todoId, { completed: body.completed });
        return { success: true, completed: updated.completed };
    }
    async getAccountNotes(accountId) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return { notes: '' };
        return {
            notes: detail.supplementary?.manager_note || '',
            updatedAt: new Date().toISOString()
        };
    }
    async saveAccountNotes(accountId, body, req) {
        const role = req.userRole || 'manager';
        await this.editsService.editSupplementary(accountId, 'manager_note', body.notes, role);
        return { success: true };
    }
    async getAccountCrm(accountId) {
        const detail = await this.accountsService.getAccountDetail(accountId);
        if ('error' in detail)
            return { crmFields: [] };
        return {
            crmFields: [
                { label: 'Industry', value: detail.company?.industry || 'Unknown' },
                { label: 'Employee Count', value: detail.company?.employee_count?.toString() || 'Unknown' },
                { label: 'City', value: detail.company?.city || 'Unknown' },
                { label: 'ARR', value: detail.company?.exit_arr?.toString() || '0' },
                { label: 'Domain', value: detail.company?.domain || 'Unknown' }
            ]
        };
    }
};
exports.M05FrontendAccountsController = M05FrontendAccountsController;
__decorate([
    (0, common_1.Get)('alert'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAlertBanner", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('viewing')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('viewers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getViewers", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('viewing')),
    __param(2, (0, common_1.Query)('period')),
    __param(3, (0, common_1.Query)('noActivity')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountsList", null);
__decorate([
    (0, common_1.Get)(':accountId/activities/recent'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getRecentActivities", null);
__decorate([
    (0, common_1.Post)(':accountId/ai-chat'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "sendAiChat", null);
__decorate([
    (0, common_1.Get)(':accountId/overview'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountOverview", null);
__decorate([
    (0, common_1.Get)(':accountId/activity'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountActivity", null);
__decorate([
    (0, common_1.Get)(':accountId/briefs'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountBriefs", null);
__decorate([
    (0, common_1.Get)(':accountId/todos'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountTodos", null);
__decorate([
    (0, common_1.Patch)(':accountId/todos/:todoId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Param)('todoId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "toggleTodo", null);
__decorate([
    (0, common_1.Get)(':accountId/notes'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountNotes", null);
__decorate([
    (0, common_1.Patch)(':accountId/notes'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "saveAccountNotes", null);
__decorate([
    (0, common_1.Get)(':accountId/crm'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendAccountsController.prototype, "getAccountCrm", null);
exports.M05FrontendAccountsController = M05FrontendAccountsController = __decorate([
    (0, common_1.Controller)('api/manager/revenue/accounts'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        edits_service_1.EditsService,
        todos_service_1.TodosService,
        ai_service_1.AiService])
], M05FrontendAccountsController);
//# sourceMappingURL=m05-frontend-accounts.controller.js.map