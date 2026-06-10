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
exports.M08TaskRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let M08TaskRepository = class M08TaskRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIdempotency(tenantId, source, sourceId) {
        return this.prisma.task.findUnique({
            where: {
                tenantId_source_sourceId: {
                    tenantId,
                    source,
                    sourceId,
                },
            },
        });
    }
    async createTask(tenantId, userId, dto) {
        if (dto.sourceId) {
            const existing = await this.checkIdempotency(tenantId, dto.source, dto.sourceId);
            if (existing) {
                return existing;
            }
        }
        return this.prisma.task.create({
            data: {
                tenantId,
                userId,
                type: dto.type,
                description: dto.description,
                dueDate: new Date(dto.dueDate),
                priority: dto.priority,
                source: dto.source,
                sourceId: dto.sourceId || null,
                status: 'pending',
            },
        });
    }
    async findTaskById(tenantId, taskId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, tenantId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        return task;
    }
    async findTasks(tenantId, filters) {
        const where = { tenantId };
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.priority !== undefined) {
            where.priority = filters.priority;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.source) {
            where.source = filters.source;
        }
        if (filters.search) {
            where.description = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }
        if (filters.dueDateRange) {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            if (filters.dueDateRange === 'today') {
                where.dueDate = {
                    gte: startOfToday,
                    lte: endOfToday,
                };
            }
            else if (filters.dueDateRange === 'overdue') {
                where.dueDate = {
                    lt: startOfToday,
                };
                where.status = {
                    not: 'completed',
                };
            }
            else if (filters.dueDateRange === 'week') {
                const nextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
                where.dueDate = {
                    gte: startOfToday,
                    lte: nextWeek,
                };
            }
        }
        return this.prisma.task.findMany({
            where,
            orderBy: [
                { status: 'asc' },
                { priority: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'asc' },
            ],
        });
    }
    async updateTaskStatus(tenantId, taskId, status) {
        await this.findTaskById(tenantId, taskId);
        return this.prisma.task.update({
            where: { id: taskId },
            data: { status },
        });
    }
    async reassignTask(tenantId, taskId, userId) {
        await this.findTaskById(tenantId, taskId);
        return this.prisma.task.update({
            where: { id: taskId },
            data: { userId },
        });
    }
};
exports.M08TaskRepository = M08TaskRepository;
exports.M08TaskRepository = M08TaskRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M08TaskRepository);
//# sourceMappingURL=task.repository.js.map