"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareInternalSchema = exports.GenerateBriefSchema = exports.PatchNextStepSchema = exports.TranscriptListQuerySchema = void 0;
const zod_1 = require("zod");
exports.TranscriptListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    size: zod_1.z.coerce.number().int().min(1).max(200).default(50),
    search: zod_1.z.string().optional(),
    showLowConfidenceOnly: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false'), zod_1.z.boolean()])
        .optional()
        .transform((v) => v === true || v === 'true'),
});
exports.PatchNextStepSchema = zod_1.z.object({
    completed: zod_1.z.boolean(),
});
exports.GenerateBriefSchema = zod_1.z.object({
    briefTemplate: zod_1.z.string().min(1),
    period: zod_1.z.string().min(1),
});
exports.ShareInternalSchema = zod_1.z.object({
    recipientEmails: zod_1.z.array(zod_1.z.string().email()).min(1),
    message: zod_1.z.string().optional(),
});
//# sourceMappingURL=m01-frontend-transcript.schema.js.map