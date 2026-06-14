"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealUpdateSchema = exports.DealCommentCreateSchema = exports.WarningResolveSchema = exports.PlaybookCriterionUpdateSchema = exports.DealTaskCreateSchema = exports.NotificationCreateSchema = exports.PaginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.PaginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).optional().default(25),
    sortBy: zod_1.z.enum(['name', 'amount', 'stage', 'updatedAt', 'closeDate']).optional().default('updatedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    q: zod_1.z.string().optional(),
});
exports.NotificationCreateSchema = zod_1.z.object({
    repName: zod_1.z.string().min(1, 'repName is required'),
    message: zod_1.z.string().min(1, 'message is required'),
    type: zod_1.z.string().optional(),
});
exports.DealTaskCreateSchema = zod_1.z.object({
    dealId: zod_1.z.string().uuid('Invalid dealId format'),
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    assignee: zod_1.z.string().optional(),
});
exports.PlaybookCriterionUpdateSchema = zod_1.z.object({
    status: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
});
exports.WarningResolveSchema = zod_1.z.object({
    status: zod_1.z.string().min(1),
});
exports.DealCommentCreateSchema = zod_1.z.object({
    comment: zod_1.z.string().min(1, 'Comment text is required'),
});
exports.DealUpdateSchema = zod_1.z.object({
    stage: zod_1.z.string().optional(),
    forecastCategory: zod_1.z.string().optional(),
    amount: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    nextStep: zod_1.z.string().optional(),
    closeDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=m04.dto.js.map