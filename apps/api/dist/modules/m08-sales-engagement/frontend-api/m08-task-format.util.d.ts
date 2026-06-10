type TaskLike = {
    title?: string | null;
    contactName: string;
    companyName: string;
    channel: string;
    dueDateTime?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    sequenceName?: string | null;
    sequenceStep?: string | null;
    workflowName?: string | null;
    workflowStep?: string | null;
};
export declare function parseDueDateTime(dueDate: string, dueTime?: string | null): string;
export declare function resolveDueDateTime(task: TaskLike): string;
export declare function buildTaskTitle(task: TaskLike): string;
export declare function resolveSequenceName(task: TaskLike): string;
export declare function resolveSequenceStep(task: TaskLike): string;
export {};
