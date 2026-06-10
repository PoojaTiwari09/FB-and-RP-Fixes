"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIntegrationSchema = exports.SubmitApprovalSchema = exports.UpdateWorkflowSchema = exports.CreateWorkflowSchema = void 0;
const zod_1 = require("zod");
exports.CreateWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workflow name is required'),
    description: zod_1.z.string().optional().nullable(),
    triggerType: zod_1.z.string().min(1, 'Trigger type is required'),
    triggerConditions: zod_1.z.any().default({}),
    definition: zod_1.z.any().default({}),
    version: zod_1.z.number().int().default(1),
    isActive: zod_1.z.boolean().default(true),
});
exports.UpdateWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional().nullable(),
    triggerType: zod_1.z.string().optional(),
    triggerConditions: zod_1.z.any().optional(),
    definition: zod_1.z.any().optional(),
    version: zod_1.z.number().int().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.SubmitApprovalSchema = zod_1.z.object({
    status: zod_1.z.enum(['approved', 'rejected']),
    comment: zod_1.z.string().optional(),
});
exports.UpdateIntegrationSchema = zod_1.z.object({
    status: zod_1.z.enum(['connected', 'disconnected', 'error']),
    config: zod_1.z.any().optional(),
});
//# sourceMappingURL=workflow.schema.js.map