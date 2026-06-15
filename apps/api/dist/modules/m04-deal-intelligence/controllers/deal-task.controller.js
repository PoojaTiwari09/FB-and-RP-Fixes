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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManagementController = exports.DealTaskController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deal_task_service_1 = require("@m04/services/deal-task.service");
const task_dto_1 = require("@m04/schemas/task.dto");
const jwt_guard_1 = require("../../platform-core/guards/jwt.guard");
const tenant_guard_1 = require("../../platform-core/guards/tenant.guard");
const authenticated_request_interface_1 = require("@m04/interfaces/authenticated-request.interface");
let DealTaskController = class DealTaskController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    async getTasksForDeal(dealId, status) {
        return this.taskService.getTasksForDeal(dealId, status);
    }
    async getTask(dealId, taskId) {
        return this.taskService.getTask(dealId, taskId);
    }
    async createTask(dealId, dto, req) {
        return this.taskService.createTask(dealId, dto, req.user?.id, `${req.user?.firstName} ${req.user?.lastName}`);
    }
    async updateTask(dealId, taskId, dto, req) {
        return this.taskService.updateTask(dealId, taskId, dto, req.user?.id);
    }
    async deleteTask(dealId, taskId) {
        await this.taskService.deleteTask(dealId, taskId);
        return { message: 'Task deleted successfully' };
    }
    async generateNextSteps(dealId, dto, req) {
        return this.taskService.generateNextSteps(dealId, dto.count || 3, req.user?.id, `${req.user?.firstName} ${req.user?.lastName}`);
    }
};
exports.DealTaskController = DealTaskController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get tasks for a deal',
        description: 'Retrieve all tasks associated with a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        description: 'Filter by task status',
        enum: task_dto_1.TaskStatus,
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tasks retrieved successfully',
        type: [task_dto_1.TaskResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof task_dto_1.TaskStatus !== "undefined" && task_dto_1.TaskStatus) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "getTasksForDeal", null);
__decorate([
    (0, common_1.Get)(':taskId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single task',
        description: 'Retrieve details of a specific task',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'taskId',
        description: 'Task ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task retrieved successfully',
        type: task_dto_1.TaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Task not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "getTask", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a task',
        description: 'Create a new task for a deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Task created successfully',
        type: task_dto_1.TaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof task_dto_1.CreateTaskDto !== "undefined" && task_dto_1.CreateTaskDto) === "function" ? _c : Object, typeof (_d = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)(':taskId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a task',
        description: 'Update task details or status',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'taskId',
        description: 'Task ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task updated successfully',
        type: task_dto_1.TaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Task not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_e = typeof task_dto_1.UpdateTaskDto !== "undefined" && task_dto_1.UpdateTaskDto) === "function" ? _e : Object, typeof (_f = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)(':taskId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a task',
        description: 'Remove a task from the deal',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiParam)({
        name: 'taskId',
        description: 'Task ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Task deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Task not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Post)('generate-next-steps'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate AI next steps',
        description: 'Generate AI-suggested next steps as tasks',
    }),
    (0, swagger_1.ApiParam)({
        name: 'dealId',
        description: 'Deal ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Next steps generated successfully',
        type: [task_dto_1.TaskResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Deal not found',
    }),
    __param(0, (0, common_1.Param)('dealId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_g = typeof task_dto_1.GenerateNextStepsDto !== "undefined" && task_dto_1.GenerateNextStepsDto) === "function" ? _g : Object, typeof (_h = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], DealTaskController.prototype, "generateNextSteps", null);
exports.DealTaskController = DealTaskController = __decorate([
    (0, swagger_1.ApiTags)('Deal Tasks'),
    (0, common_1.Controller)('deals/:dealId/tasks'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof deal_task_service_1.DealTaskService !== "undefined" && deal_task_service_1.DealTaskService) === "function" ? _a : Object])
], DealTaskController);
let TaskManagementController = class TaskManagementController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    async getMyTasks(req, status) {
        return this.taskService.getTasksForUser(req.user.id, status);
    }
    async getOverdueTasks(req) {
        return this.taskService.getOverdueTasks(req.user.id);
    }
};
exports.TaskManagementController = TaskManagementController;
__decorate([
    (0, common_1.Get)('my-tasks'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my tasks',
        description: 'Retrieve all tasks assigned to the current user',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        description: 'Filter by task status',
        enum: task_dto_1.TaskStatus,
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Tasks retrieved successfully',
        type: [task_dto_1.TaskResponseDto],
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _k : Object, typeof (_l = typeof task_dto_1.TaskStatus !== "undefined" && task_dto_1.TaskStatus) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], TaskManagementController.prototype, "getMyTasks", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get overdue tasks',
        description: 'Retrieve all overdue tasks for the current user',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Overdue tasks retrieved successfully',
        type: [task_dto_1.TaskResponseDto],
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof authenticated_request_interface_1.AuthenticatedRequest !== "undefined" && authenticated_request_interface_1.AuthenticatedRequest) === "function" ? _m : Object]),
    __metadata("design:returntype", Promise)
], TaskManagementController.prototype, "getOverdueTasks", null);
exports.TaskManagementController = TaskManagementController = __decorate([
    (0, swagger_1.ApiTags)('Tasks'),
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, swagger_1.ApiCookieAuth)(),
    __metadata("design:paramtypes", [typeof (_j = typeof deal_task_service_1.DealTaskService !== "undefined" && deal_task_service_1.DealTaskService) === "function" ? _j : Object])
], TaskManagementController);
//# sourceMappingURL=deal-task.controller.js.map