"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReassignTaskSchema = exports.UpdateTaskStatusSchema = exports.CreateTaskSchema = void 0;
const zod_1 = require("zod");
exports.CreateTaskSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Task type is required'),
    description: zod_1.z.string().min(1, 'Task description is required'),
    dueDate: zod_1.z.string().datetime({ message: 'Invalid due date format' }),
    priority: zod_1.z.number().int().min(1).max(3).default(2),
    source: zod_1.z.string().default('manual'),
    sourceId: zod_1.z.string().uuid().optional().nullable(),
});
exports.UpdateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'completed', 'snoozed']),
});
exports.ReassignTaskSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid User ID format'),
});
//# sourceMappingURL=task.schema.js.map