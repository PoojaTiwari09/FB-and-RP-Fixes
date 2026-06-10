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
exports.M08TaskController = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("../services/task.service");
const task_schema_1 = require("../schemas/task.schema");
let M08TaskController = class M08TaskController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    async getTasks(req, status, priorityStr, dueDateRange, type, source, search, queryUserId) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'representative';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const filters = {};
        if (status)
            filters.status = status;
        if (priorityStr)
            filters.priority = parseInt(priorityStr);
        if (dueDateRange)
            filters.dueDateRange = dueDateRange;
        if (type)
            filters.type = type;
        if (source)
            filters.source = source;
        if (search)
            filters.search = search;
        if (userRole === 'representative') {
            filters.userId = currentUserId;
        }
        else {
            if (queryUserId) {
                filters.userId = queryUserId;
            }
        }
        return this.taskService.getTasks(tenantId, filters);
    }
    async getMyTasks(req, status) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.taskService.getMyTasks(tenantId, currentUserId, status);
    }
    async getOverdueTasks(req) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        return this.taskService.getOverdueTasks(tenantId, currentUserId);
    }
    async getTaskById(id, req) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'representative';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const task = await this.taskService.getTaskById(tenantId, id);
        if (userRole === 'representative' && task.userId !== currentUserId) {
            throw new common_1.ForbiddenException('You do not have access to this task');
        }
        return task;
    }
    async createTask(body, req) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const result = task_schema_1.CreateTaskSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: result.error.errors,
            });
        }
        return this.taskService.createTask(result.data, tenantId, currentUserId);
    }
    async updateStatus(id, body, req) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'representative';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const result = task_schema_1.UpdateTaskStatusSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: result.error.errors,
            });
        }
        const task = await this.taskService.getTaskById(tenantId, id);
        if (userRole === 'manager') {
            throw new common_1.ForbiddenException('Managers do not have permission to update task status directly');
        }
        if (userRole === 'representative' && task.userId !== currentUserId) {
            throw new common_1.ForbiddenException('You cannot update status on other representatives tasks');
        }
        return this.taskService.updateTaskStatus(id, result.data.status, tenantId);
    }
    async reassignTask(id, body, req) {
        const tenantId = req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
        const userRole = req.headers['x-user-role'] || 'representative';
        const currentUserId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
        const result = task_schema_1.ReassignTaskSchema.safeParse(body);
        if (!result.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: result.error.errors,
            });
        }
        if (userRole === 'representative') {
            throw new common_1.ForbiddenException('Only managers and administrators can reassign tasks');
        }
        return this.taskService.reassignTask(id, result.data.userId, tenantId, currentUserId);
    }
};
exports.M08TaskController = M08TaskController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('dueDateRange')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('source')),
    __param(6, (0, common_1.Query)('search')),
    __param(7, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('my-tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "getMyTasks", null);
__decorate([
    (0, common_1.Get)('overdue'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "getOverdueTasks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "getTaskById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/reassign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], M08TaskController.prototype, "reassignTask", null);
exports.M08TaskController = M08TaskController = __decorate([
    (0, common_1.Controller)('api/v1/sales-engagement/tasks'),
    __param(0, (0, common_1.Inject)(task_service_1.M08TaskService)),
    __metadata("design:paramtypes", [task_service_1.M08TaskService])
], M08TaskController);
//# sourceMappingURL=task.controller.js.map