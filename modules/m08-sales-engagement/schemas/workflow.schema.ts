import { z } from 'zod';

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional().nullable(),
  triggerType: z.string().min(1, 'Trigger type is required'),
  triggerConditions: z.any().default({}),
  definition: z.any().default({}),
  version: z.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  triggerType: z.string().optional(),
  triggerConditions: z.any().optional(),
  definition: z.any().optional(),
  version: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const SubmitApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});

export const UpdateIntegrationSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'error']),
  config: z.any().optional(),
});

export type CreateWorkflowDto = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowDto = z.infer<typeof UpdateWorkflowSchema>;
export type SubmitApprovalDto = z.infer<typeof SubmitApprovalSchema>;
export type UpdateIntegrationDto = z.infer<typeof UpdateIntegrationSchema>;
