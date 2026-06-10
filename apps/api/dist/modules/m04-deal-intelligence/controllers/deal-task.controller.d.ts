import { DealTaskService } from '@/services/deal-task.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus, GenerateNextStepsDto } from '@/schemas/task.dto';
import { AuthenticatedRequest } from '@/interfaces/authenticated-request.interface';
export declare class DealTaskController {
    private readonly taskService;
    constructor(taskService: DealTaskService);
    getTasksForDeal(dealId: string, status?: TaskStatus): Promise<TaskResponseDto[]>;
    getTask(dealId: string, taskId: string): Promise<TaskResponseDto>;
    createTask(dealId: string, dto: CreateTaskDto, req: AuthenticatedRequest): Promise<TaskResponseDto>;
    updateTask(dealId: string, taskId: string, dto: UpdateTaskDto, req: AuthenticatedRequest): Promise<TaskResponseDto>;
    deleteTask(dealId: string, taskId: string): Promise<{
        message: string;
    }>;
    generateNextSteps(dealId: string, dto: GenerateNextStepsDto, req: AuthenticatedRequest): Promise<TaskResponseDto[]>;
}
export declare class TaskManagementController {
    private readonly taskService;
    constructor(taskService: DealTaskService);
    getMyTasks(req: AuthenticatedRequest, status?: TaskStatus): Promise<TaskResponseDto[]>;
    getOverdueTasks(req: AuthenticatedRequest): Promise<TaskResponseDto[]>;
}
