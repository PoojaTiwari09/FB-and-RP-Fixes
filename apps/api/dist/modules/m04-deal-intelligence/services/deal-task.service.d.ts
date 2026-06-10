import { M04EntityRepository as Repository } from '@/database/m04-entity.repository';
import { DealTask } from '@/entities/deal-task.entity';
import { Deal } from '@/entities/deal.entity';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus } from '@/schemas/task.dto';
import { AIClientService } from './ai-client.service';
export declare class DealTaskService {
    private readonly taskRepository;
    private readonly dealRepository;
    private readonly aiClientService;
    constructor(taskRepository: Repository<DealTask>, dealRepository: Repository<Deal>, aiClientService: AIClientService);
    getTasksForDeal(dealId: string, status?: TaskStatus): Promise<TaskResponseDto[]>;
    getTasksForUser(userId: string, status?: TaskStatus): Promise<TaskResponseDto[]>;
    getTask(dealId: string, taskId: string): Promise<TaskResponseDto>;
    createTask(dealId: string, dto: CreateTaskDto, createdBy?: string, createdByName?: string): Promise<TaskResponseDto>;
    updateTask(dealId: string, taskId: string, dto: UpdateTaskDto, userId?: string): Promise<TaskResponseDto>;
    deleteTask(dealId: string, taskId: string): Promise<void>;
    generateNextSteps(dealId: string, count?: number, userId?: string, userName?: string): Promise<TaskResponseDto[]>;
    getOverdueTasks(userId?: string): Promise<TaskResponseDto[]>;
    private toResponseDto;
}
