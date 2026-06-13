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
exports.M05FrontendDealsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("../services/accounts.service");
const edits_service_1 = require("../services/edits.service");
const todos_service_1 = require("../services/todos.service");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
let M05FrontendDealsController = class M05FrontendDealsController {
    accountsService;
    editsService;
    todosService;
    constructor(accountsService, editsService, todosService) {
        this.accountsService = accountsService;
        this.editsService = editsService;
        this.todosService = todosService;
    }
    async getDealOverview(dealId) {
        const detail = await this.accountsService.getDealDetail(dealId);
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
        if (detail.deal.close_date && !['Closed Won', 'Closed Lost'].includes(detail.deal.stage)) {
            const closeDateTime = new Date(detail.deal.close_date).getTime();
            if (closeDateTime < Date.now()) {
                risks.push({
                    title: 'Past Close Date',
                    severity: 'HIGH',
                    mentionedCount: 1,
                    lastMentioned: 'Date Check'
                });
            }
        }
        return { risksAndObjections: risks };
    }
    async getDealActivity(dealId, type, page, size) {
        const detail = await this.accountsService.getDealDetail(dealId);
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
    async getDealBriefs(dealId) {
        const detail = await this.accountsService.getDealDetail(dealId);
        let briefContent = '';
        if (detail.briefAvailable && detail.briefContent) {
            const json = detail.briefContent;
            if (typeof json === 'string') {
                briefContent = json;
            }
            else if (json && typeof json === 'object') {
                const headline = json.briefContent || json.headline || json.summary || 'Deal Brief';
                const risk = json.risk_level || json.risk || 'Unknown';
                const keyPoints = Array.isArray(json.key_points) ? json.key_points : [];
                briefContent = `### ${headline}\n\n**Risk Level:** ${risk.toUpperCase()}\n\n#### Key Points:\n` + keyPoints.map((p) => `- ${p}`).join('\n');
            }
            else {
                briefContent = `**Deal Summary for ${detail.deal.deal_name}**\n\nNo AI Brief cached for the parent company ${detail.company?.name || ''}.`;
            }
        }
        else {
            briefContent = `**Deal Summary for ${detail.deal.deal_name}**\n\nNo AI Brief cached for the parent company ${detail.company?.name || ''}.`;
        }
        return {
            briefContent
        };
    }
    async getDealTodos(dealId) {
        const detail = await this.accountsService.getDealDetail(dealId);
        if (!detail.company) {
            return { todos: [] };
        }
        const allItems = await this.todosService.getTodos(detail.company.hubspot_id);
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
    async toggleTodo(dealId, todoId, body) {
        const updated = await this.todosService.updateTodo(todoId, { completed: body.completed });
        return { success: true, completed: updated.completed };
    }
    async getDealNotes(dealId) {
        const detail = await this.accountsService.getDealDetail(dealId);
        return {
            notes: detail.supplementary?.manager_note || '',
            updatedAt: new Date().toISOString()
        };
    }
    async saveDealNotes(dealId, body, req) {
        const detail = await this.accountsService.getDealDetail(dealId);
        if (!detail.company) {
            throw new common_1.NotFoundException('Parent company not found for notes');
        }
        const role = req.userRole || 'manager';
        await this.editsService.editSupplementary(detail.company.hubspot_id, 'manager_note', body.notes, role);
        return { success: true };
    }
    async getDealCrm(dealId) {
        const detail = await this.accountsService.getDealDetail(dealId);
        return {
            crmFields: [
                { label: 'Deal Name', value: detail.deal.deal_name || 'Unknown' },
                { label: 'Stage', value: detail.deal.stage || 'Unknown' },
                { label: 'Amount', value: detail.deal.amount?.toString() || '0' },
                { label: 'Deal Type', value: detail.deal.deal_type || 'Unknown' },
                { label: 'Close Date', value: detail.deal.close_date ? new Date(detail.deal.close_date).toDateString() : 'Unknown' },
                { label: 'Company Name', value: detail.company?.name || 'Unknown' },
                { label: 'Industry', value: detail.company?.industry || 'Unknown' },
            ]
        };
    }
};
exports.M05FrontendDealsController = M05FrontendDealsController;
__decorate([
    (0, common_1.Get)(':dealId/overview'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealOverview", null);
__decorate([
    (0, common_1.Get)(':dealId/activity'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealActivity", null);
__decorate([
    (0, common_1.Get)(':dealId/briefs'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealBriefs", null);
__decorate([
    (0, common_1.Get)(':dealId/todos'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealTodos", null);
__decorate([
    (0, common_1.Patch)(':dealId/todos/:todoId'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('todoId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "toggleTodo", null);
__decorate([
    (0, common_1.Get)(':dealId/notes'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealNotes", null);
__decorate([
    (0, common_1.Patch)(':dealId/notes'),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "saveDealNotes", null);
__decorate([
    (0, common_1.Get)(':dealId/crm'),
    __param(0, (0, common_1.Param)('dealId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], M05FrontendDealsController.prototype, "getDealCrm", null);
exports.M05FrontendDealsController = M05FrontendDealsController = __decorate([
    (0, common_1.Controller)('api/manager/revenue/deals'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        edits_service_1.EditsService,
        todos_service_1.TodosService])
], M05FrontendDealsController);
//# sourceMappingURL=m05-frontend-deals.controller.js.map