export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum TaskSource {
    AI_SUGGESTED = "AI_SUGGESTED",
    MANAGER_ASSIGNED = "MANAGER_ASSIGNED",
    USER_CREATED = "USER_CREATED"
}
export declare class CreateTaskDto {
    title: string;
    description?: string;
    priority: TaskPriority;
    assigneeId: string;
    assigneeName: string;
    dueDate?: string;
    source?: TaskSource;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
}
export declare class TaskResponseDto {
    id: string;
    dealId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    source: TaskSource;
    assigneeId: string;
    assigneeName: string;
    assignedBy?: string;
    assignedByName?: string;
    dueDate?: Date;
    completedAt?: Date;
    completedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class GenerateNextStepsDto {
    count?: number;
}
