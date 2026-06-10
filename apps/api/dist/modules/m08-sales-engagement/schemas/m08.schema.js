"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNoteSchema = exports.SkipStepSchema = exports.CompleteStepSchema = exports.EnrollPlaySchema = exports.DeactivatePlaySchema = exports.ClonePlaySchema = exports.UpdatePlaySchema = exports.CreatePlaySchema = exports.TriggerConditionSchema = exports.PlayStepSchema = void 0;
const zod_1 = require("zod");
exports.PlayStepSchema = zod_1.z.object({
    stepNum: zod_1.z.number().int().positive(),
    actionType: zod_1.z.string(),
    description: zod_1.z.string(),
    dueOffsetDays: zod_1.z.number().int().nonnegative(),
});
exports.TriggerConditionSchema = zod_1.z.object({
    eventType: zod_1.z.string(),
    field: zod_1.z.string(),
    operator: zod_1.z.string(),
    value: zod_1.z.string(),
});
exports.CreatePlaySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Playbook name is required'),
    steps: zod_1.z.array(exports.PlayStepSchema).min(1, 'Playbook must contain at least one step'),
    triggerConditions: zod_1.z.array(exports.TriggerConditionSchema).default([]),
    isActive: zod_1.z.boolean().default(true),
});
exports.UpdatePlaySchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    steps: zod_1.z.array(exports.PlayStepSchema).optional(),
    triggerConditions: zod_1.z.array(exports.TriggerConditionSchema).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.ClonePlaySchema = zod_1.z.object({
    playId: zod_1.z.string().uuid('Invalid Playbook ID'),
});
exports.DeactivatePlaySchema = zod_1.z.object({
    playId: zod_1.z.string().uuid('Invalid Playbook ID'),
});
exports.EnrollPlaySchema = zod_1.z.object({
    playId: zod_1.z.string().uuid('Invalid Playbook ID'),
    dealId: zod_1.z.string().uuid('Invalid Deal ID'),
    userId: zod_1.z.string().uuid('Invalid User ID'),
    triggerEventId: zod_1.z.string().uuid('Invalid Trigger Event ID').optional(),
});
exports.CompleteStepSchema = zod_1.z.object({
    stepId: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().optional(),
});
exports.SkipStepSchema = zod_1.z.object({
    stepId: zod_1.z.number().int().positive(),
    reason: zod_1.z.string().min(1, 'Skip reason is required'),
});
exports.CreateNoteSchema = zod_1.z.object({
    noteText: zod_1.z.string().min(1, 'Note content is required'),
});
//# sourceMappingURL=m08.schema.js.map