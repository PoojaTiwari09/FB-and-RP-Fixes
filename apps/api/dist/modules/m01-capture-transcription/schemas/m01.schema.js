"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUtteranceSchema = exports.DeleteNextStepSchema = exports.UpdateNextStepSchema = exports.AddNextStepSchema = exports.UpdateAdminSettingsSchema = exports.ListCallsQuerySchema = exports.SearchQuerySchema = exports.ShareCallSchema = exports.UpdateNoteSchema = exports.CreateNoteSchema = exports.UploadFromS3Schema = exports.CreateCallSchema = void 0;
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
exports.UploadFromS3Schema = zod_1.z.object({
    recordingId: zod_1.z.enum(['2min_sales', '3mins_sales']),
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
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed', 'skipped']).optional(),
    source: zod_1.z.enum(['zoom', 'teams', 'meet', 'dialer', 'manual']).optional(),
    sortBy: zod_1.z.enum(['callDate', 'title', 'durationSeconds', 'transcriptStatus', 'createdAt']).default('callDate'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
exports.UpdateAdminSettingsSchema = zod_1.z.object({
    transcriptionEnabled: zod_1.z.boolean().optional(),
    minCallDurationSeconds: zod_1.z.number().int().min(0).optional(),
    piiRedactionEnabled: zod_1.z.boolean().optional(),
});
exports.AddNextStepSchema = zod_1.z.object({
    step: zod_1.z.string().min(1).max(1000),
});
exports.UpdateNextStepSchema = zod_1.z.object({
    step: zod_1.z.string().min(1).max(1000),
    index: zod_1.z.number().int().min(0),
});
exports.DeleteNextStepSchema = zod_1.z.object({
    index: zod_1.z.coerce.number().int().min(0),
});
exports.UpdateUtteranceSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(5000),
});
//# sourceMappingURL=m01.schema.js.map