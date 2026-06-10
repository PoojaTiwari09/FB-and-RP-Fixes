"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendFilterSearchSchema = exports.FrontendSearchCallsQuerySchema = exports.FrontendListCallsQuerySchema = void 0;
const zod_1 = require("zod");
exports.FrontendListCallsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    size: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(['all', 'completed', 'processing', 'failed', 'skipped']).optional(),
    duration: zod_1.z.enum(['all', 'lt2', '2to10', 'gt10']).optional(),
    dealType: zod_1.z.string().optional(),
    account: zod_1.z.string().optional(),
    participantId: zod_1.z.string().optional(),
    ownerId: zod_1.z.string().optional(),
    dateRange: zod_1.z.enum(['all', 'last7days', 'last30days', 'custom']).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
exports.FrontendSearchCallsQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    size: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.FrontendFilterSearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    accountId: zod_1.z.string().optional(),
});
//# sourceMappingURL=m01-frontend-calls.schema.js.map