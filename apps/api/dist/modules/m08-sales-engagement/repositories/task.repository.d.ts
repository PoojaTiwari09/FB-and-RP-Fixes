import { PrismaService } from '../database/prisma.service';
import { CreateTaskDto } from '../schemas/task.schema';
export declare class M08TaskRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkIdempotency(tenantId: string, source: string, sourceId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }>;
    createTask(tenantId: string, userId: string, dto: CreateTaskDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }>;
    findTaskById(tenantId: string, taskId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }>;
    findTasks(tenantId: string, filters: {
        status?: string;
        priority?: number;
        dueDateRange?: 'today' | 'overdue' | 'week';
        type?: string;
        source?: string;
        userId?: string;
        search?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }[]>;
    updateTaskStatus(tenantId: string, taskId: string, status: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }>;
    reassignTask(tenantId: string, taskId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        priority: number;
        dueDate: Date;
        description: string;
        type: string;
        userId: string;
        source: string;
        sourceId: string | null;
    }>;
}
