import { z } from 'zod';

export const SubmitDtoSchema = z.object({
  lob: z.string().min(1, 'LOB is required'),
  commitForecast: z.number().positive('Commit Forecast must be positive'),
  bestCaseForecast: z.number().positive().optional(),
  notes: z.string().optional(),
  repUserId: z.string().optional(),
  status: z.string().optional(),
});

export const CreateDealSchema = z.object({
  dealName: z.string().min(1),
  stage: z.string().min(1),
  amount: z.number().nonnegative(),
  closeDate: z.string().min(1),
  probability: z.number().min(0).max(100).optional(),
  region: z.enum(['Americas', 'EMEA', 'APAC']).optional(),
  lob: z.string().optional(),
});

export const OverrideDtoSchema = z.object({
  managerId: z.string().min(1),
  managerName: z.string().min(1),
  overrideValue: z.number().positive('Override value must be positive'),
  justification: z.string().min(5, 'Justification must be at least 5 characters'),
  approveNow: z.boolean().optional(),
});

export const ReopenDtoSchema = z.object({
  managerId: z.string().min(1),
  managerName: z.string().min(1),
  comment: z.string().min(1, 'Comment is required when reopening'),
});

export const ApproveDtoSchema = z.object({
  managerId: z.string().min(1),
  managerName: z.string().min(1),
});

export type SubmitDto = z.infer<typeof SubmitDtoSchema>;
export type CreateDealDto = z.infer<typeof CreateDealSchema>;
export type OverrideDto = z.infer<typeof OverrideDtoSchema>;
export type ReopenDto = z.infer<typeof ReopenDtoSchema>;
export type ApproveDto = z.infer<typeof ApproveDtoSchema>;
