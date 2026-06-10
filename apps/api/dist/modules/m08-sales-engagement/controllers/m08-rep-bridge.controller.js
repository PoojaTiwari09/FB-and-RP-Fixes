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
exports.M08RepBridgeController = void 0;
const common_1 = require("@nestjs/common");
const m08_rep_bridge_mock_1 = require("./m08-rep-bridge.mock");
let M08RepBridgeController = class M08RepBridgeController {
    getTasks(req) {
        return m08_rep_bridge_mock_1.MOCK_TASKS;
    }
    getSummary(req) {
        return m08_rep_bridge_mock_1.MOCK_TASK_SUMMARY;
    }
    getRecentActivity(req, limit) {
        const n = parseInt(limit || '10', 10);
        return m08_rep_bridge_mock_1.MOCK_RECENT_ACTIVITY.slice(0, Number.isFinite(n) ? n : 10);
    }
    getTaskDetail(taskId) {
        return m08_rep_bridge_mock_1.MOCK_TASK_DETAILS[taskId] || null;
    }
    getContactDetails(contactId) {
        return m08_rep_bridge_mock_1.MOCK_CONTACT_DETAILS[contactId] || null;
    }
    getEmailDraft(taskId) {
        return m08_rep_bridge_mock_1.MOCK_EMAIL_DRAFTS[taskId] || null;
    }
    getNotes(taskId) {
        const detail = m08_rep_bridge_mock_1.MOCK_TASK_DETAILS[taskId];
        return detail ? [{ id: 'note-001', noteText: detail.existingNotes || '' }] : [];
    }
    getLinkedInDraft(taskId) {
        return m08_rep_bridge_mock_1.MOCK_LINKEDIN_DRAFTS[taskId] || null;
    }
    getFilterOptions() {
        return m08_rep_bridge_mock_1.MOCK_FILTER_OPTIONS;
    }
    getEmailTemplates() {
        return m08_rep_bridge_mock_1.MOCK_EMAIL_TEMPLATES;
    }
    createTask(body) {
        const newTask = {
            taskId: `task-${Date.now()}`,
            contactId: body.contactId || '',
            contactName: body.contactName || 'New Contact',
            company: body.company || 'New Company',
            channelType: body.channelType || 'EMAIL',
            sequenceName: '',
            sequenceStep: '',
            scheduledTime: '',
            dueDateTime: new Date().toISOString(),
            interactionCount: 0,
            priority: body.priority || 'NORMAL',
            status: 'PENDING',
            isOverdue: false,
            isAtRisk: false,
        };
        m08_rep_bridge_mock_1.MOCK_TASKS.push(newTask);
        return newTask;
    }
    saveNotes(taskId, body) {
        if (m08_rep_bridge_mock_1.MOCK_TASK_DETAILS[taskId]) {
            m08_rep_bridge_mock_1.MOCK_TASK_DETAILS[taskId].existingNotes = body.notes;
        }
        return { success: true };
    }
    sendEmail(taskId, body) {
        return { success: true };
    }
    saveDraft(taskId, body) {
        return { success: true };
    }
    rephraseEmail(taskId, body) {
        return {
            rephrasedBody: (body.body || '').replace(/Hi/g, 'Hello') + '\n\n[AI Rephrased for ' + (body.tone || 'professional') + ' tone]'
        };
    }
    markComplete(taskId) {
        const t = m08_rep_bridge_mock_1.MOCK_TASKS.find(x => x.taskId === taskId);
        if (t) {
            t.status = 'COMPLETED';
            m08_rep_bridge_mock_1.MOCK_TASK_SUMMARY.completedCount++;
        }
        return { success: true };
    }
    skipTask(taskId) {
        const t = m08_rep_bridge_mock_1.MOCK_TASKS.find(x => x.taskId === taskId);
        if (t)
            t.status = 'SKIPPED';
        return { success: true };
    }
    dismissTask(taskId) {
        const t = m08_rep_bridge_mock_1.MOCK_TASKS.find(x => x.taskId === taskId);
        if (t)
            t.status = 'DISMISSED';
        return { success: true };
    }
    reassignTask(taskId, body) {
        return { success: true };
    }
    updateTask(taskId, body) {
        const t = m08_rep_bridge_mock_1.MOCK_TASKS.find(x => x.taskId === taskId);
        if (t) {
            Object.assign(t, body);
        }
        return { success: true };
    }
};
exports.M08RepBridgeController = M08RepBridgeController;
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('tasks/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('activity/recent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getRecentActivity", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/detail'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getTaskDetail", null);
__decorate([
    (0, common_1.Get)('contacts/:contactId/details'),
    __param(0, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getContactDetails", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/email-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getEmailDraft", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Get)('tasks/:taskId/linkedin-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getLinkedInDraft", null);
__decorate([
    (0, common_1.Get)('filters/options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getFilterOptions", null);
__decorate([
    (0, common_1.Get)('email-templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "getEmailTemplates", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/notes'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "saveNotes", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/send-email'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/save-draft'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/ai-rephrase'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "rephraseEmail", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/mark-complete'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "markComplete", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/skip'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "skipTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/dismiss'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "dismissTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId/reassign'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "reassignTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], M08RepBridgeController.prototype, "updateTask", null);
exports.M08RepBridgeController = M08RepBridgeController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement')
], M08RepBridgeController);
//# sourceMappingURL=m08-rep-bridge.controller.js.map