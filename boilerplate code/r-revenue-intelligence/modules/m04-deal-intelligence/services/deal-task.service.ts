import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@/database/inject-repository';
import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealTask } from '@/entities/deal-task.entity';
import { Deal } from '@/entities/deal.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskStatus,
  TaskSource,
} from '@/schemas/task.dto';
import { AIClientService } from './ai-client.service';

@Injectable()
export class DealTaskService {
  constructor(
    @InjectRepository(DealTask)
    private readonly taskRepository: Repository<DealTask>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly aiClientService: AIClientService,
  ) {}

  /**
   * Get all tasks for a deal
   */
  async getTasksForDeal(dealId: string, status?: TaskStatus): Promise<TaskResponseDto[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
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

    return tasks.map((task) => this.toResponseDto(task));
  }

  /**
   * Get tasks assigned to a user
   */
  async getTasksForUser(userId: string, status?: TaskStatus): Promise<TaskResponseDto[]> {
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

    return tasks.map((task) => this.toResponseDto(task));
  }

  /**
   * Get a single task
   */
  async getTask(dealId: string, taskId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, dealId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponseDto(task);
  }

  /**
   * Create a task
   */
  async createTask(
    dealId: string,
    dto: CreateTaskDto,
    createdBy?: string,
    createdByName?: string,
  ): Promise<TaskResponseDto> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const task = this.taskRepository.create({
      dealId,
      title: dto.title,
      description: dto.description,
      status: TaskStatus.PENDING,
      priority: dto.priority,
      source: dto.source || TaskSource.USER_CREATED,
      assigneeId: dto.assigneeId,
      assigneeName: dto.assigneeName,
      assignedBy: createdBy,
      assignedByName: createdByName,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    } as Partial<DealTask>);

    const saved = await this.taskRepository.save(task);
    return this.toResponseDto(saved as DealTask);
  }

  /**
   * Update a task
   */
  async updateTask(
    dealId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId?: string,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, dealId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.title !== undefined) {
      task.title = dto.title;
    }

    if (dto.description !== undefined) {
      task.description = dto.description;
    }

    if (dto.status !== undefined) {
      task.status = dto.status;

      // Track completion
      if (dto.status === TaskStatus.COMPLETED && !task.completedAt) {
        task.completedAt = new Date();
        task.completedBy = userId || null;
      } else if (dto.status !== TaskStatus.COMPLETED) {
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

  /**
   * Delete a task
   */
  async deleteTask(dealId: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, dealId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
  }

  /**
   * Generate AI-suggested next steps
   */
  async generateNextSteps(
    dealId: string,
    count: number = 3,
    userId?: string,
    userName?: string,
  ): Promise<TaskResponseDto[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    try {
      // Call AI service to generate next steps
      const nextSteps = await this.aiClientService.generateNextSteps({
        dealId,
        dealName: deal.name,
        stage: deal.stage,
        recentActivities: [],
        warnings: [],
        playbookGaps: [],
      });

      // Create tasks from AI suggestions
      const tasks: TaskResponseDto[] = [];
      for (const step of nextSteps.nextSteps) {
        const task = this.taskRepository.create({
          dealId,
          title: step.action,
          description: step.reasoning,
          status: TaskStatus.PENDING,
          priority: step.priority as any,
          source: TaskSource.AI_SUGGESTED,
          assigneeId: userId || deal.ownerId,
          assigneeName: userName || deal.ownerName,
          dueDate: null,
        } as Partial<DealTask>);

        const saved = await this.taskRepository.save(task);
        tasks.push(this.toResponseDto(saved as DealTask));
      }

      return tasks;
    } catch (error) {
      console.error('Failed to generate AI next steps:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId?: string): Promise<TaskResponseDto[]> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.status != :completed', { completed: TaskStatus.COMPLETED })
      .andWhere('task.status != :cancelled', { cancelled: TaskStatus.CANCELLED })
      .andWhere('task.dueDate < :now', { now: new Date() });

    if (userId) {
      queryBuilder.andWhere('task.assigneeId = :userId', { userId });
    }

    const tasks = await queryBuilder
      .orderBy('task.dueDate', 'ASC')
      .getMany();

    return tasks.map((task) => this.toResponseDto(task));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(task: DealTask): TaskResponseDto {
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
}
