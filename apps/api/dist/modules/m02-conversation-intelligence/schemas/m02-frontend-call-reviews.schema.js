"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsHistoryQuerySchema = exports.CoachingBodySchema = exports.SaveAnswerSchema = exports.PatchReviewSchema = exports.CallReviewsListQuerySchema = void 0;
const zod_1 = require("zod");
exports.CallReviewsListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    size: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    callType: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['newest', 'oldest', 'dueDate']).optional().default('newest'),
});
exports.PatchReviewSchema = zod_1.z.object({
    scorecardId: zod_1.z.string().optional(),
    reviewerId: zod_1.z.string().optional(),
});
exports.SaveAnswerSchema = zod_1.z.object({
    questionId: zod_1.z.string(),
    answer: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number(), zod_1.z.string()]),
    isNa: zod_1.z.boolean().optional(),
    coachingComment: zod_1.z.string().optional(),
    aiAccepted: zod_1.z.boolean().optional(),
});
exports.CoachingBodySchema = zod_1.z.object({
    strengths: zod_1.z.array(zod_1.z.string()).optional(),
    improvements: zod_1.z.array(zod_1.z.string()).optional(),
    coachingNotes: zod_1.z.string().optional(),
    recommendedActions: zod_1.z.array(zod_1.z.string()).optional(),
    internalNotes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    shareWithRep: zod_1.z.boolean().optional(),
});
exports.AnalyticsHistoryQuerySchema = zod_1.z.object({
    repId: zod_1.z.string().optional(),
    dateRange: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
});
//# sourceMappingURL=m02-frontend-call-reviews.schema.js.map