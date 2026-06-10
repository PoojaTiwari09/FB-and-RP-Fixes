import { z } from 'zod';
export declare const CreateWorkflowSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    triggerType: z.ZodString;
    triggerConditions: z.ZodDefault<z.ZodAny>;
    definition: z.ZodDefault<z.ZodAny>;
    version: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    triggerType?: string;
    triggerConditions?: any;
    definition?: any;
    version?: number;
    isActive?: boolean;
}, {
    name?: string;
    description?: string;
    triggerType?: string;
    triggerConditions?: any;
    definition?: any;
    version?: number;
    isActive?: boolean;
}>;
export declare const UpdateWorkflowSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    triggerType: z.ZodOptional<z.ZodString>;
    triggerConditions: z.ZodOptional<z.ZodAny>;
    definition: z.ZodOptional<z.ZodAny>;
    version: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    triggerType?: string;
    triggerConditions?: any;
    definition?: any;
    version?: number;
    isActive?: boolean;
}, {
    name?: string;
    description?: string;
    triggerType?: string;
    triggerConditions?: any;
    definition?: any;
    version?: number;
    isActive?: boolean;
}>;
export declare const SubmitApprovalSchema: z.ZodObject<{
    status: z.ZodEnum<["approved", "rejected"]>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "approved" | "rejected";
    comment?: string;
}, {
    status?: "approved" | "rejected";
    comment?: string;
}>;
export declare const UpdateIntegrationSchema: z.ZodObject<{
    status: z.ZodEnum<["connected", "disconnected", "error"]>;
    config: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    status?: "error" | "connected" | "disconnected";
    config?: any;
}, {
    status?: "error" | "connected" | "disconnected";
    config?: any;
}>;
export type CreateWorkflowDto = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowDto = z.infer<typeof UpdateWorkflowSchema>;
export type SubmitApprovalDto = z.infer<typeof SubmitApprovalSchema>;
export type UpdateIntegrationDto = z.infer<typeof UpdateIntegrationSchema>;
