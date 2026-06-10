import { z } from 'zod';
export declare const CallReviewsListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    size: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodString>;
    callType: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodEnum<["newest", "oldest", "dueDate"]>>>;
}, "strip", z.ZodTypeAny, {
    callType?: string;
    status?: string;
    priority?: string;
    sort?: "dueDate" | "newest" | "oldest";
    search?: string;
    page?: number;
    size?: number;
}, {
    callType?: string;
    status?: string;
    priority?: string;
    sort?: "dueDate" | "newest" | "oldest";
    search?: string;
    page?: number;
    size?: number;
}>;
export declare const PatchReviewSchema: z.ZodObject<{
    scorecardId: z.ZodOptional<z.ZodString>;
    reviewerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scorecardId?: string;
    reviewerId?: string;
}, {
    scorecardId?: string;
    reviewerId?: string;
}>;
export declare const SaveAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    answer: z.ZodUnion<[z.ZodBoolean, z.ZodNumber, z.ZodString]>;
    isNa: z.ZodOptional<z.ZodBoolean>;
    coachingComment: z.ZodOptional<z.ZodString>;
    aiAccepted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    answer?: string | number | boolean;
    questionId?: string;
    isNa?: boolean;
    coachingComment?: string;
    aiAccepted?: boolean;
}, {
    answer?: string | number | boolean;
    questionId?: string;
    isNa?: boolean;
    coachingComment?: string;
    aiAccepted?: boolean;
}>;
export declare const CoachingBodySchema: z.ZodObject<{
    strengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    improvements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    coachingNotes: z.ZodOptional<z.ZodString>;
    recommendedActions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    internalNotes: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    shareWithRep: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tags?: string[];
    strengths?: string[];
    coachingNotes?: string;
    recommendedActions?: string[];
    improvements?: string[];
    internalNotes?: string;
    shareWithRep?: boolean;
}, {
    tags?: string[];
    strengths?: string[];
    coachingNotes?: string;
    recommendedActions?: string[];
    improvements?: string[];
    internalNotes?: string;
    shareWithRep?: boolean;
}>;
export declare const AnalyticsHistoryQuerySchema: z.ZodObject<{
    repId: z.ZodOptional<z.ZodString>;
    dateRange: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    repId?: string;
    search?: string;
    page?: number;
    dateRange?: string;
}, {
    repId?: string;
    search?: string;
    page?: number;
    dateRange?: string;
}>;
