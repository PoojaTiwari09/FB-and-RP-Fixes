import { z } from 'zod';
export declare const PlayStepSchema: z.ZodObject<{
    stepNum: z.ZodNumber;
    actionType: z.ZodString;
    description: z.ZodString;
    dueOffsetDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    description?: string;
    stepNum?: number;
    actionType?: string;
    dueOffsetDays?: number;
}, {
    description?: string;
    stepNum?: number;
    actionType?: string;
    dueOffsetDays?: number;
}>;
export declare const TriggerConditionSchema: z.ZodObject<{
    eventType: z.ZodString;
    field: z.ZodString;
    operator: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: string;
    eventType?: string;
    field?: string;
    operator?: string;
}, {
    value?: string;
    eventType?: string;
    field?: string;
    operator?: string;
}>;
export declare const CreatePlaySchema: z.ZodObject<{
    name: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        stepNum: z.ZodNumber;
        actionType: z.ZodString;
        description: z.ZodString;
        dueOffsetDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }, {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }>, "many">;
    triggerConditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        eventType: z.ZodString;
        field: z.ZodString;
        operator: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }, {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }>, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    triggerConditions?: {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }[];
    isActive?: boolean;
    steps?: {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }[];
}, {
    name?: string;
    triggerConditions?: {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }[];
    isActive?: boolean;
    steps?: {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }[];
}>;
export declare const UpdatePlaySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        stepNum: z.ZodNumber;
        actionType: z.ZodString;
        description: z.ZodString;
        dueOffsetDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }, {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }>, "many">>;
    triggerConditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        eventType: z.ZodString;
        field: z.ZodString;
        operator: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }, {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }>, "many">>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    triggerConditions?: {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }[];
    isActive?: boolean;
    steps?: {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }[];
}, {
    name?: string;
    triggerConditions?: {
        value?: string;
        eventType?: string;
        field?: string;
        operator?: string;
    }[];
    isActive?: boolean;
    steps?: {
        description?: string;
        stepNum?: number;
        actionType?: string;
        dueOffsetDays?: number;
    }[];
}>;
export declare const ClonePlaySchema: z.ZodObject<{
    playId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    playId?: string;
}, {
    playId?: string;
}>;
export declare const DeactivatePlaySchema: z.ZodObject<{
    playId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    playId?: string;
}, {
    playId?: string;
}>;
export declare const EnrollPlaySchema: z.ZodObject<{
    playId: z.ZodString;
    dealId: z.ZodString;
    userId: z.ZodString;
    triggerEventId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    dealId?: string;
    playId?: string;
    triggerEventId?: string;
}, {
    userId?: string;
    dealId?: string;
    playId?: string;
    triggerEventId?: string;
}>;
export declare const CompleteStepSchema: z.ZodObject<{
    stepId: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    stepId?: number;
}, {
    notes?: string;
    stepId?: number;
}>;
export declare const SkipStepSchema: z.ZodObject<{
    stepId: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    stepId?: number;
    reason?: string;
}, {
    stepId?: number;
    reason?: string;
}>;
export declare const CreateNoteSchema: z.ZodObject<{
    noteText: z.ZodString;
}, "strip", z.ZodTypeAny, {
    noteText?: string;
}, {
    noteText?: string;
}>;
export type CreatePlayDto = z.infer<typeof CreatePlaySchema>;
export type UpdatePlayDto = z.infer<typeof UpdatePlaySchema>;
export type ClonePlayDto = z.infer<typeof ClonePlaySchema>;
export type DeactivatePlayDto = z.infer<typeof DeactivatePlaySchema>;
export type EnrollPlayDto = z.infer<typeof EnrollPlaySchema>;
export type CompleteStepDto = z.infer<typeof CompleteStepSchema>;
export type SkipStepDto = z.infer<typeof SkipStepSchema>;
export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;
