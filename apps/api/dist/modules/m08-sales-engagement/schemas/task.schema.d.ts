import { z } from 'zod';
export declare const CreateTaskSchema: z.ZodObject<{
    type: z.ZodString;
    description: z.ZodString;
    dueDate: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    source: z.ZodDefault<z.ZodString>;
    sourceId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    priority?: number;
    dueDate?: string;
    description?: string;
    type?: string;
    source?: string;
    sourceId?: string;
}, {
    priority?: number;
    dueDate?: string;
    description?: string;
    type?: string;
    source?: string;
    sourceId?: string;
}>;
export declare const UpdateTaskStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "completed", "snoozed"]>;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "pending" | "snoozed";
}, {
    status?: "completed" | "pending" | "snoozed";
}>;
export declare const ReassignTaskSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
}, {
    userId?: string;
}>;
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskStatusDto = z.infer<typeof UpdateTaskStatusSchema>;
export type ReassignTaskDto = z.infer<typeof ReassignTaskSchema>;
