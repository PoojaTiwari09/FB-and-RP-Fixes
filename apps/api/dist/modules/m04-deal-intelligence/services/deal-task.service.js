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
exports.DealTaskService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@/database/inject-repository");
const m04_entity_repository_1 = require("@/database/m04-entity.repository");
const deal_task_entity_1 = require("@/entities/deal-task.entity");
const deal_entity_1 = require("@/entities/deal.entity");
const task_dto_1 = require("@/schemas/task.dto");
const ai_client_service_1 = require("./ai-client.service");
let DealTaskService = class DealTaskService {
    taskRepository;
    dealRepository;
    aiClientService;
    constructor(taskRepository, dealRepository, aiClientService) {
        this.taskRepository = taskRepository;
        this.dealRepository = dealRepository;
        this.aiClientService = aiClientService;
    }
    async getTasksForDeal(dealId, status) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .where('task.dealId = :dealId', { dealId });
        if (status) {
            queryBuilder.andWhere('task.status = :status', { status });
        }
        const tasks = await queryBuilder
            .orderBy('task.priority', 'DESC')
            .addOrderBy('task.dueDate', 'ASC')
            .addOrderBy('task.createdAt', 'DESC')
            .getMany();
        const todayStr = new Date().toISOString().split('T')[0];
        return tasks.map((task) => {
            const dueDateStr = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null;
            const isOverdue = dueDateStr && dueDateStr < todayStr && task.status !== task_dto_1.TaskStatus.COMPLETED;
            if (isOverdue && task.priority !== 'HIGH') {
                task.priority = 'HIGH';
            }
            return this.toResponseDto(task);
        });
    }
    async getTasksForUser(userId, status) {
        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .where('task.assigneeId = :userId', { userId });
        if (status) {
            queryBuilder.andWhere('task.status = :status', { status });
        }
        const tasks = await queryBuilder
            .orderBy('task.priority', 'DESC')
            .addOrderBy('task.dueDate', 'ASC')
            .addOrderBy('task.createdAt', 'DESC')
            .getMany();
        const todayStr = new Date().toISOString().split('T')[0];
        return tasks.map((task) => {
            const dueDateStr = task.dueDate ? task.dueDate.toISOString().split('T')[0] : null;
            const isOverdue = dueDateStr && dueDateStr < todayStr && task.status !== task_dto_1.TaskStatus.COMPLETED;
            if (isOverdue && task.priority !== 'HIGH') {
                task.priority = 'HIGH';
            }
            return this.toResponseDto(task);
        });
    }
    async getTask(dealId, taskId) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId, dealId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return this.toResponseDto(task);
    }
    async createTask(dealId, dto, createdBy, createdByName) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        const dueDateStr = dueDate ? dueDate.toISOString().split('T')[0] : null;
        const isOverdue = dueDateStr && dueDateStr < todayStr;
        const priority = isOverdue ? 'HIGH' : dto.priority;
        const task = this.taskRepository.create({
            dealId,
            title: dto.title,
            description: dto.description,
            status: task_dto_1.TaskStatus.PENDING,
            priority,
            source: dto.source || task_dto_1.TaskSource.USER_CREATED,
            assigneeId: dto.assigneeId,
            assigneeName: dto.assigneeName,
            assignedBy: createdBy,
            assignedByName: createdByName,
            dueDate,
        });
        const saved = await this.taskRepository.save(task);
        return this.toResponseDto(saved);
    }
    async updateTask(dealId, taskId, dto, userId) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId, dealId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (dto.title !== undefined) {
            task.title = dto.title;
        }
        if (dto.description !== undefined) {
            task.description = dto.description;
        }
        if (dto.status !== undefined) {
            task.status = dto.status;
            if (dto.status === task_dto_1.TaskStatus.COMPLETED && !task.completedAt) {
                task.completedAt = new Date();
                task.completedBy = userId || null;
            }
            else if (dto.status !== task_dto_1.TaskStatus.COMPLETED) {
                task.completedAt = null;
                task.completedBy = null;
            }
        }
        if (dto.priority !== undefined) {
            task.priority = dto.priority;
        }
        if (dto.dueDate !== undefined) {
            task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        }
        const updated = await this.taskRepository.save(task);
        return this.toResponseDto(updated);
    }
    async deleteTask(dealId, taskId) {
        const task = await this.taskRepository.findOne({
            where: { id: taskId, dealId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.taskRepository.remove(task);
    }
    async generateNextSteps(dealId, count = 3, userId, userName) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        try {
            const nextSteps = await this.aiClientService.generateNextSteps({
                dealId,
                dealName: deal.name,
                stage: deal.stage,
                recentActivities: [],
                warnings: [],
                playbookGaps: [],
            });
            const tasks = [];
            for (const step of nextSteps.nextSteps) {
                const task = this.taskRepository.create({
                    dealId,
                    title: step.action,
                    description: step.reasoning,
                    status: task_dto_1.TaskStatus.PENDING,
                    priority: step.priority,
                    source: task_dto_1.TaskSource.AI_SUGGESTED,
                    assigneeId: userId || deal.ownerId,
                    assigneeName: userName || deal.ownerName,
                    dueDate: null,
                });
                const saved = await this.taskRepository.save(task);
                tasks.push(this.toResponseDto(saved));
            }
            return tasks;
        }
        catch (error) {
            console.error('Failed to generate AI next steps:', error);
            throw error;
        }
    }
    async getOverdueTasks(userId) {
        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .where('task.status != :completed', { completed: task_dto_1.TaskStatus.COMPLETED })
            .andWhere('task.status != :cancelled', { cancelled: task_dto_1.TaskStatus.CANCELLED })
            .andWhere('task.dueDate < :now', { now: new Date() });
        if (userId) {
            queryBuilder.andWhere('task.assigneeId = :userId', { userId });
        }
        const tasks = await queryBuilder
            .orderBy('task.dueDate', 'ASC')
            .getMany();
        return tasks.map((task) => this.toResponseDto(task));
    }
    toResponseDto(task) {
        return {
            id: task.id,
            dealId: task.dealId,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            source: task.source,
            assigneeId: task.assigneeId,
            assigneeName: task.assigneeName,
            assignedBy: task.assignedBy ?? undefined,
            assignedByName: task.assignedByName ?? undefined,
            dueDate: task.dueDate ?? undefined,
            completedAt: task.completedAt ?? undefined,
            completedBy: task.completedBy ?? undefined,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    }
};
exports.DealTaskService = DealTaskService;
exports.DealTaskService = DealTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_task_entity_1.DealTask)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [m04_entity_repository_1.M04EntityRepository,
        m04_entity_repository_1.M04EntityRepository,
        ai_client_service_1.AIClientService])
], DealTaskService);
//# sourceMappingURL=deal-task.service.js.map