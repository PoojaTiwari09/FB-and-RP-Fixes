import { z } from 'zod';

export const FrontendListCallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['all', 'completed', 'processing', 'failed', 'skipped']).optional(),
  duration: z.enum(['all', 'lt2', '2to10', 'gt10']).optional(),
  dealType: z.string().optional(),
  account: z.string().optional(),
  participantId: z.string().optional(),
  ownerId: z.string().optional(),
  dateRange: z.enum(['all', 'last7days', 'last30days', 'custom']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type FrontendListCallsQuery = z.infer<typeof FrontendListCallsQuerySchema>;

export const FrontendSearchCallsQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export const FrontendFilterSearchSchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
});
