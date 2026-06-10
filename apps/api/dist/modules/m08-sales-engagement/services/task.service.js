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
exports.M08TaskService = void 0;
const common_1 = require("@nestjs/common");
const task_repository_1 = require("../repositories/task.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
let M08TaskService = class M08TaskService {
    repo;
    events;
    constructor(repo, events) {
        this.repo = repo;
        this.events = events;
    }
    async createTask(dto, tenantId, userId) {
        const task = await this.repo.createTask(tenantId, userId, dto);
        await this.events.publish('task.created', {
            taskId: task.id,
            tenantId,
            userId,
            type: task.type,
            priority: task.priority,
        });
        return task;
    }
    async getTasks(tenantId, filters) {
        return this.repo.findTasks(tenantId, filters);
    }
    async getMyTasks(tenantId, userId, status) {
        return this.repo.findTasks(tenantId, {
            userId,
            ...(status ? { status } : {}),
        });
    }
    async getOverdueTasks(tenantId, userId) {
        return this.repo.findTasks(tenantId, {
            userId,
            dueDateRange: 'overdue',
        });
    }
    async getTaskById(tenantId, taskId) {
        return this.repo.findTaskById(tenantId, taskId);
    }
    async updateTaskStatus(taskId, status, tenantId) {
        const updated = await this.repo.updateTaskStatus(tenantId, taskId, status);
        await this.events.publish(`task.${status}`, {
            taskId: updated.id,
            tenantId,
            userId: updated.userId,
            status: updated.status,
        });
        return updated;
    }
    async reassignTask(taskId, targetUserId, tenantId, managerUserId) {
        const updated = await this.repo.reassignTask(tenantId, taskId, targetUserId);
        await this.events.publish('task.reassigned', {
            taskId: updated.id,
            tenantId,
            fromUserId: updated.userId,
            toUserId: targetUserId,
            reassignedBy: managerUserId,
        });
        return updated;
    }
    async handleCallTranscriptionCompleted(payload) {
        console.log(`[Transcription Task Auto-Consumer] Received call.transcription.completed event: ${payload.eventId}`);
        const source = 'AI';
        const sourceId = payload.eventId;
        const existing = await this.repo.checkIdempotency(payload.tenantId, source, sourceId);
        if (existing) {
            console.warn(`[Duplicate Event Ignored] Follow-up task already exists for Event ID ${payload.eventId}`);
            return existing;
        }
        const nextBizDay = this.calculateNextBusinessDay(new Date());
        const dto = {
            type: 'followup',
            description: `AI Auto-Generated Follow-up: ${payload.summary || 'Follow up on competitive signal and proposal updates.'}`,
            dueDate: nextBizDay.toISOString(),
            priority: 1,
            source,
            sourceId,
        };
        console.log(`[Auto-Task Generation] Instantiating follow-up task for User ${payload.userId}`);
        return this.createTask(dto, payload.tenantId, payload.userId);
    }
    calculateNextBusinessDay(date) {
        const result = new Date(date);
        const day = result.getDay();
        if (day === 5) {
            result.setDate(result.getDate() + 3);
        }
        else if (day === 6) {
            result.setDate(result.getDate() + 2);
        }
        else {
            result.setDate(result.getDate() + 1);
        }
        result.setHours(9, 0, 0, 0);
        return result;
    }
};
exports.M08TaskService = M08TaskService;
exports.M08TaskService = M08TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(task_repository_1.M08TaskRepository)),
    __param(1, (0, common_1.Inject)(event_publisher_service_1.EventPublisherService)),
    __metadata("design:paramtypes", [task_repository_1.M08TaskRepository,
        event_publisher_service_1.EventPublisherService])
], M08TaskService);
//# sourceMappingURL=task.service.js.map