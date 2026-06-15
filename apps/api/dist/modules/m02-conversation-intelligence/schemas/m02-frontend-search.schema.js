"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02CreateStreamBodySchema = exports.M02ExportBodySchema = exports.M02AiAskBodySchema = exports.M02SearchCallsQuerySchema = void 0;
const zod_1 = require("zod");
exports.M02SearchCallsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    size: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    tab: zod_1.z.enum(['all', 'calls', 'emails']).default('calls'),
    team: zod_1.z.string().optional(),
    rep: zod_1.z.string().optional(),
    stage: zod_1.z.string().optional(),
    participants: zod_1.z.string().optional(),
    wordsOrPhrases: zod_1.z.string().optional(),
    phraseMatchType: zod_1.z
        .enum(['contains', 'mentioned_by_any', 'said_anytime'])
        .optional(),
    topics: zod_1.z.string().optional(),
    trackers: zod_1.z.string().optional(),
    scorecardResult: zod_1.z.string().optional(),
    callTitle: zod_1.z.string().optional(),
    callType: zod_1.z.enum(['all', 'internal', 'customer']).optional(),
    sortBy: zod_1.z.enum(['date', 'call_duration', 'deal']).default('date'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    chartGranularity: zod_1.z
        .enum(['days', 'weeks', 'months', 'quarters'])
        .default('weeks'),
});
exports.M02AiAskBodySchema = zod_1.z.object({
    callId: zod_1.z.string().min(1).optional(),
    question: zod_1.z.string().optional().default(''),
});
exports.M02ExportBodySchema = zod_1.z.object({
    filters: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
    fields: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
});
exports.M02CreateStreamBodySchema = zod_1.z.object({
    name: zod_1.z.string().optional().default('Unnamed Stream'),
    filters: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
    notifications: zod_1.z
        .object({
        inApp: zod_1.z.boolean().optional(),
        slack: zod_1.z.boolean().optional(),
        emailDigest: zod_1.z.boolean().optional(),
    })
        .optional(),
    shareWithTeam: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=m02-frontend-search.schema.js.map