import { z } from 'zod';
export declare const FrontendListCallsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["all", "completed", "processing", "failed", "skipped"]>>;
    duration: z.ZodOptional<z.ZodEnum<["all", "lt2", "2to10", "gt10"]>>;
    dealType: z.ZodOptional<z.ZodString>;
    account: z.ZodOptional<z.ZodString>;
    participantId: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodOptional<z.ZodString>;
    dateRange: z.ZodOptional<z.ZodEnum<["all", "last7days", "last30days", "custom"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    account?: string;
    status?: "failed" | "all" | "completed" | "skipped" | "processing";
    search?: string;
    ownerId?: string;
    dealType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    duration?: "all" | "lt2" | "2to10" | "gt10";
    participantId?: string;
    dateRange?: "all" | "custom" | "last7days" | "last30days";
}, {
    account?: string;
    status?: "failed" | "all" | "completed" | "skipped" | "processing";
    search?: string;
    ownerId?: string;
    dealType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    duration?: "all" | "lt2" | "2to10" | "gt10";
    participantId?: string;
    dateRange?: "all" | "custom" | "last7days" | "last30days";
}>;
export type FrontendListCallsQuery = z.infer<typeof FrontendListCallsQuerySchema>;
export declare const FrontendSearchCallsQuerySchema: z.ZodObject<{
    q: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    size?: number;
    q?: string;
}, {
    page?: number;
    size?: number;
    q?: string;
}>;
export declare const FrontendFilterSearchSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accountId?: string;
    search?: string;
}, {
    accountId?: string;
    search?: string;
}>;
