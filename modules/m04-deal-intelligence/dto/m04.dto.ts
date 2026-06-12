import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  sortBy: z.enum(['name', 'amount', 'stage', 'updatedAt', 'closeDate']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  q: z.string().optional(),
});

export const NotificationCreateSchema = z.object({
  repName: z.string().min(1, 'repName is required'),
  message: z.string().min(1, 'message is required'),
  type: z.string().optional(),
});

export const DealTaskCreateSchema = z.object({
  dealId: z.string().uuid('Invalid dealId format'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignee: z.string().optional(),
});

export const PlaybookCriterionUpdateSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional(),
  comment: z.string().optional(),
});

export const WarningResolveSchema = z.object({
  status: z.string().min(1),
});

export const DealCommentCreateSchema = z.object({
  comment: z.string().min(1, 'Comment text is required'),
});

export const DealUpdateSchema = z.object({
  stage: z.string().optional(),
  forecastCategory: z.string().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  nextStep: z.string().optional(),
  closeDate: z.string().optional(),
});
