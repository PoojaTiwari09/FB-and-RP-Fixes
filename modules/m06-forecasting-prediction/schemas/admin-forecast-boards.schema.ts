import { z } from 'zod';

export const CreateBoardSchema = z.object({
  name: z.string().min(1),
  scope: z.string().optional(),
  teamId: z.string().optional(),
  periodType: z.enum(['Monthly', 'Quarterly', 'monthly', 'quarterly']),
  activePeriod: z.string().optional(),
  periodId: z.string().optional(),
  periodStartDate: z.string().optional(),
  periodEndDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => data.scope || data.teamId, { message: 'scope or teamId is required' });
export type CreateBoardDto = z.infer<typeof CreateBoardSchema>;

export const UpdateBoardSchema = z.object({
  name: z.string().optional(),
  scope: z.string().optional(),
  teamId: z.string().optional(),
  periodType: z.enum(['Monthly', 'Quarterly', 'monthly', 'quarterly']).optional(),
  activePeriod: z.string().optional(),
  periodId: z.string().optional(),
  periodStartDate: z.string().optional(),
  periodEndDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});
export type UpdateBoardDto = z.infer<typeof UpdateBoardSchema>;

export const ReorderColumnsSchema = z.object({
  columnIds: z.array(z.string()),
});
export type ReorderColumnsDto = z.infer<typeof ReorderColumnsSchema>;

export const UpdateColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string(),
      type: z.enum(['Metric', 'Submission', 'Target']).optional(),
      columnType: z.enum(['Metric', 'Submission', 'Target']).optional(),
      submissionMode: z.enum(['N/A', 'Auto', 'Manual']),
      isVisible: z.boolean(),
      sortOrder: z.number(),
    })
  ),
});
export type UpdateColumnsDto = z.infer<typeof UpdateColumnsSchema>;

export const FromCrmFieldSchema = z.object({
  crmObject: z.enum(['Opportunity', 'Account', 'Contact']),
  crmField: z.string(),
  label: z.string(),
  columnType: z.enum(['Metric', 'Submission', 'Target']),
  submissionMode: z.enum(['N/A', 'Auto', 'Manual']),
});
export const CreateColumnsFromCrmSchema = z.object({
  fields: z.array(FromCrmFieldSchema),
});
export type CreateColumnsFromCrmDto = z.infer<typeof CreateColumnsFromCrmSchema>;

export const UpdateColumnSchema = z.object({
  label: z.string().optional(),
  type: z.enum(['Metric', 'Submission', 'Target']).optional(),
  columnType: z.enum(['Metric', 'Submission', 'Target']).optional(),
  submissionMode: z.enum(['N/A', 'Auto', 'Manual']).optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateColumnDto = z.infer<typeof UpdateColumnSchema>;

export const UpdateColumnVisibilitySchema = z.object({
  isVisible: z.boolean(),
});
export type UpdateColumnVisibilityDto = z.infer<typeof UpdateColumnVisibilitySchema>;

export const UpdateStageMappingSchema = z.object({
  stageMappings: z.record(z.any()),
});
export type UpdateStageMappingDto = z.infer<typeof UpdateStageMappingSchema>;

export const UpdateCrmMappingSchema = z.object({
  crmConnection: z.enum(['salesforce', 'hubspot', 'dynamics']),
  forecastCategoryField: z.string().optional(),
  pipelineSource: z.string().optional(),
  closedSource: z.string().optional(),
  closeDateField: z.string().optional(),
  amountField: z.string().optional(),
  columnMappings: z.record(z.any()).optional(),
  stageMappings: z.record(z.any()).optional(),
});
export type UpdateCrmMappingDto = z.infer<typeof UpdateCrmMappingSchema>;

export const UpdateReminderConfigSchema = z.object({
  frequency: z.string(),
  sendDay: z.string(),
  sendTime: z.string(),
  timezoneBehavior: z.string(),
  inAppEnabled: z.boolean(),
  slackEnabled: z.boolean(),
  autoDismiss: z.boolean(),
  messageTemplate: z.string().optional(),
});
export type UpdateReminderConfigDto = z.infer<typeof UpdateReminderConfigSchema>;

export const UpdateQuotasSchema = z.object({
  periodId: z.string(),
  quotas: z.array(
    z.object({
      repUserId: z.string(),
      amount: z.number(),
      aprTarget: z.number().optional(),
      mayTarget: z.number().optional(),
      junTarget: z.number().optional(),
    })
  ),
});
export type UpdateQuotasDto = z.infer<typeof UpdateQuotasSchema>;
