"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuotasSchema = exports.UpdateReminderConfigSchema = exports.UpdateCrmMappingSchema = exports.UpdateStageMappingSchema = exports.UpdateColumnVisibilitySchema = exports.UpdateColumnSchema = exports.CreateColumnsFromCrmSchema = exports.FromCrmFieldSchema = exports.UpdateColumnsSchema = exports.ReorderColumnsSchema = exports.UpdateBoardSchema = exports.CreateBoardSchema = void 0;
const zod_1 = require("zod");
exports.CreateBoardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    scope: zod_1.z.string().optional(),
    teamId: zod_1.z.string().optional(),
    periodType: zod_1.z.enum(['Monthly', 'Quarterly', 'monthly', 'quarterly']),
    activePeriod: zod_1.z.string().optional(),
    periodId: zod_1.z.string().optional(),
    periodStartDate: zod_1.z.string().optional(),
    periodEndDate: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
}).refine((data) => data.scope || data.teamId, { message: 'scope or teamId is required' });
exports.UpdateBoardSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    scope: zod_1.z.string().optional(),
    teamId: zod_1.z.string().optional(),
    periodType: zod_1.z.enum(['Monthly', 'Quarterly', 'monthly', 'quarterly']).optional(),
    activePeriod: zod_1.z.string().optional(),
    periodId: zod_1.z.string().optional(),
    periodStartDate: zod_1.z.string().optional(),
    periodEndDate: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.ReorderColumnsSchema = zod_1.z.object({
    columnIds: zod_1.z.array(zod_1.z.string()),
});
exports.UpdateColumnsSchema = zod_1.z.object({
    columns: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().optional(),
        label: zod_1.z.string(),
        type: zod_1.z.enum(['Metric', 'Submission', 'Target']).optional(),
        columnType: zod_1.z.enum(['Metric', 'Submission', 'Target']).optional(),
        submissionMode: zod_1.z.enum(['N/A', 'Auto', 'Manual']),
        isVisible: zod_1.z.boolean(),
        sortOrder: zod_1.z.number(),
    })),
});
exports.FromCrmFieldSchema = zod_1.z.object({
    crmObject: zod_1.z.enum(['Opportunity', 'Account', 'Contact']),
    crmField: zod_1.z.string(),
    label: zod_1.z.string(),
    columnType: zod_1.z.enum(['Metric', 'Submission', 'Target']),
    submissionMode: zod_1.z.enum(['N/A', 'Auto', 'Manual']),
});
exports.CreateColumnsFromCrmSchema = zod_1.z.object({
    fields: zod_1.z.array(exports.FromCrmFieldSchema),
});
exports.UpdateColumnSchema = zod_1.z.object({
    label: zod_1.z.string().optional(),
    type: zod_1.z.enum(['Metric', 'Submission', 'Target']).optional(),
    columnType: zod_1.z.enum(['Metric', 'Submission', 'Target']).optional(),
    submissionMode: zod_1.z.enum(['N/A', 'Auto', 'Manual']).optional(),
    isVisible: zod_1.z.boolean().optional(),
});
exports.UpdateColumnVisibilitySchema = zod_1.z.object({
    isVisible: zod_1.z.boolean(),
});
exports.UpdateStageMappingSchema = zod_1.z.object({
    stageMappings: zod_1.z.record(zod_1.z.any()),
});
exports.UpdateCrmMappingSchema = zod_1.z.object({
    crmConnection: zod_1.z.enum(['salesforce', 'hubspot', 'dynamics']),
    forecastCategoryField: zod_1.z.string().optional(),
    pipelineSource: zod_1.z.string().optional(),
    closedSource: zod_1.z.string().optional(),
    closeDateField: zod_1.z.string().optional(),
    amountField: zod_1.z.string().optional(),
    columnMappings: zod_1.z.record(zod_1.z.any()).optional(),
    stageMappings: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.UpdateReminderConfigSchema = zod_1.z.object({
    frequency: zod_1.z.string(),
    sendDay: zod_1.z.string(),
    sendTime: zod_1.z.string(),
    timezoneBehavior: zod_1.z.string(),
    inAppEnabled: zod_1.z.boolean(),
    slackEnabled: zod_1.z.boolean(),
    autoDismiss: zod_1.z.boolean(),
    messageTemplate: zod_1.z.string().optional(),
});
exports.UpdateQuotasSchema = zod_1.z.object({
    periodId: zod_1.z.string(),
    quotas: zod_1.z.array(zod_1.z.object({
        repUserId: zod_1.z.string(),
        amount: zod_1.z.number(),
        aprTarget: zod_1.z.number().optional(),
        mayTarget: zod_1.z.number().optional(),
        junTarget: zod_1.z.number().optional(),
    })),
});
//# sourceMappingURL=admin-forecast-boards.schema.js.map