"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAdminSettingsSchema = exports.ListCallsQuerySchema = exports.SearchQuerySchema = exports.ShareCallSchema = exports.UpdateNoteSchema = exports.CreateNoteSchema = exports.CreateCallSchema = void 0;
const zod_1 = require("zod");
exports.CreateCallSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    callDate: zod_1.z.coerce.date(),
    durationSeconds: zod_1.z.number().int().min(0).default(0),
    callType: zod_1.z.enum(['inbound', 'outbound', 'meeting']),
    callSource: zod_1.z.enum(['zoom', 'teams', 'meet', 'dialer', 'manual']),
    participants: zod_1.z.array(zod_1.z.string()).min(1),
    callOwner: zod_1.z.string().min(1),
    accountId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    audioUrl: zod_1.z.string().url().optional(),
});
exports.CreateNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
});
exports.UpdateNoteSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(5000),
});
exports.ShareCallSchema = zod_1.z.object({
    sharedWithId: zod_1.z.string().min(1),
    sharedWithType: zod_1.z.enum(['user', 'team']),
});
exports.SearchQuerySchema = zod_1.z.object({
    q: zod_1.z.string().min(1).max(200),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
exports.ListCallsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    source: zod_1.z.enum(['zoom', 'teams', 'meet', 'dialer', 'manual']).optional(),
    sortBy: zod_1.z.enum(['callDate', 'title', 'durationSeconds', 'transcriptStatus']).default('callDate'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
exports.UpdateAdminSettingsSchema = zod_1.z.object({
    transcriptionEnabled: zod_1.z.boolean().optional(),
    minCallDurationSeconds: zod_1.z.number().int().min(0).optional(),
    piiRedactionEnabled: zod_1.z.boolean().optional(),
});
