import { z } from 'zod';

export const CallReviewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  callType: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'dueDate']).optional().default('newest'),
});

export const PatchReviewSchema = z.object({
  scorecardId: z.string().optional(),
  reviewerId: z.string().optional(),
});

export const SaveAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.boolean(), z.number(), z.string()]),
  isNa: z.boolean().optional(),
  coachingComment: z.string().optional(),
  aiAccepted: z.boolean().optional(),
});

export const CoachingBodySchema = z.object({
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  coachingNotes: z.string().optional(),
  recommendedActions: z.array(z.string()).optional(),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  shareWithRep: z.boolean().optional(),
});

export const AnalyticsHistoryQuerySchema = z.object({
  repId: z.string().optional(),
  dateRange: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});
