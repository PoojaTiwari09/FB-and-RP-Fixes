import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTaskDto } from '../schemas/task.schema';

@Injectable()
export class M08TaskRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async checkIdempotency(tenantId: string, source: string, sourceId: string) {
    return this.prisma.task.findUnique({
      where: {
        tenantid_source_sourceId: {
          tenantid: tenantId,
          source,
          sourceId,
        },
      },
    });
  }

  async createTask(tenantId: string, userId: string, dto: CreateTaskDto) {
    // Unique check to guarantee idempotency
    if (dto.sourceId) {
      const existing = await this.checkIdempotency(tenantId, dto.source, dto.sourceId);
      if (existing) {
        return existing;
      }
    }

    return this.prisma.task.create({
      data: {
        tenantid: tenantId,
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

  async findTaskById(tenantId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantid: tenantId },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    return task;
  }

  async findTasks(
    tenantId: string,
    filters: {
      status?: string;
      priority?: number;
      dueDateRange?: 'today' | 'overdue' | 'week';
      type?: string;
      source?: string;
      userId?: string;
      search?: string;
    }
  ) {
    const where: any = { tenantid: tenantId };

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

    // Due Date logic filter
    if (filters.dueDateRange) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (filters.dueDateRange === 'today') {
        where.dueDate = {
          gte: startOfToday,
          lte: endOfToday,
        };
      } else if (filters.dueDateRange === 'overdue') {
        where.dueDate = {
          lt: startOfToday,
        };
        where.status = {
          not: 'completed',
        };
      } else if (filters.dueDateRange === 'week') {
        const nextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
        where.dueDate = {
          gte: startOfToday,
          lte: nextWeek,
        };
      }
    }

    // Prioritized Sorting: status ASC (pending -> snoozed -> completed), priority ASC (1 -> 3), dueDate ASC, createdAt ASC
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

  async updateTaskStatus(tenantId: string, taskId: string, status: string) {
    await this.findTaskById(tenantId, taskId); // Assert existence

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async reassignTask(tenantId: string, taskId: string, userId: string) {
    await this.findTaskById(tenantId, taskId); // Assert existence

    return this.prisma.task.update({
      where: { id: taskId },
      data: { userId },
    });
  }
}
