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
exports.WorkspaceController = void 0;
const common_1 = require("@nestjs/common");
const workspace_service_1 = require("../services/workspace.service");
const auth_guard_1 = require("../guards/auth.guard");
let WorkspaceController = class WorkspaceController {
    workspace;
    constructor(workspace) {
        this.workspace = workspace;
    }
    async getWorkspace(req) {
        return this.workspace.getWorkspace(req.user.orgId);
    }
    getChatHistory(req) {
        return this.workspace.getChatHistory(req.user.orgId);
    }
    saveChat(body, req) {
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            throw new common_1.BadRequestException('Request body is required and cannot be empty');
        }
        if (!body.question || typeof body.question !== 'string') {
            throw new common_1.BadRequestException('question is required and must be a string');
        }
        if (!body.answer || typeof body.answer !== 'string') {
            throw new common_1.BadRequestException('answer is required and must be a string');
        }
        const raw = JSON.stringify(body);
        if (raw.length > 10000) {
            throw new common_1.BadRequestException('Request payload too large');
        }
        return this.workspace.saveChat(req.user.orgId, req.user.userId, body.question, body.answer, body.citations || []);
    }
    deleteChat(id, req) {
        return this.workspace.deleteChat(req.user.orgId, id);
    }
    createDeal(body, req) {
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            throw new common_1.BadRequestException('Request body is required and cannot be empty');
        }
        if (body.exampleField === undefined || typeof body.exampleField !== 'string') {
            throw new common_1.BadRequestException('exampleField is required and must be a string');
        }
        if (body.count === undefined || typeof body.count !== 'number') {
            throw new common_1.BadRequestException('count is required and must be a number');
        }
        const raw = JSON.stringify(body);
        if (raw.length > 10000) {
            throw new common_1.BadRequestException('Request payload too large');
        }
        return this.workspace.upsertDeal(req.user.orgId, body);
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getWorkspace", null);
__decorate([
    (0, common_1.Get)('chat-history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Post)('chat-history'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "saveChat", null);
__decorate([
    (0, common_1.Delete)('chat-history/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "deleteChat", null);
__decorate([
    (0, common_1.Post)('deals'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "createDeal", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, common_1.Controller)('api/v1/ai-summaries-genai/workspace'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [workspace_service_1.WorkspaceService])
], WorkspaceController);
//# sourceMappingURL=workspace.controller.js.map