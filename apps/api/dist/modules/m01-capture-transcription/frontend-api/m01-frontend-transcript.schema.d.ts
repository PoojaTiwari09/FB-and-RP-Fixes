import { z } from 'zod';
export declare const TranscriptListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    showLowConfidenceOnly: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"true">, z.ZodLiteral<"false">, z.ZodBoolean]>>, boolean, boolean | "true" | "false">;
}, "strip", z.ZodTypeAny, {
    search?: string;
    page?: number;
    size?: number;
    showLowConfidenceOnly?: boolean;
}, {
    search?: string;
    page?: number;
    size?: number;
    showLowConfidenceOnly?: boolean | "true" | "false";
}>;
export declare const PatchNextStepSchema: z.ZodObject<{
    completed: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    completed?: boolean;
}, {
    completed?: boolean;
}>;
export declare const GenerateBriefSchema: z.ZodObject<{
    briefTemplate: z.ZodString;
    period: z.ZodString;
}, "strip", z.ZodTypeAny, {
    period?: string;
    briefTemplate?: string;
}, {
    period?: string;
    briefTemplate?: string;
}>;
export declare const ShareInternalSchema: z.ZodObject<{
    recipientEmails: z.ZodArray<z.ZodString, "many">;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    recipientEmails?: string[];
}, {
    message?: string;
    recipientEmails?: string[];
}>;
