import { z } from 'zod';

export const M02SearchCallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  tab: z.enum(['all', 'calls', 'emails']).default('calls'),
  team: z.string().optional(),
  rep: z.string().optional(),
  stage: z.string().optional(),
  participants: z.string().optional(),
  wordsOrPhrases: z.string().optional(),
  phraseMatchType: z
    .enum(['contains', 'mentioned_by_any', 'said_anytime'])
    .optional(),
  topics: z.string().optional(),
  trackers: z.string().optional(),
  scorecardResult: z.string().optional(),
  callTitle: z.string().optional(),
  callType: z.enum(['all', 'internal', 'customer']).optional(),
  sortBy: z.enum(['date', 'call_duration', 'deal']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  chartGranularity: z
    .enum(['days', 'weeks', 'months', 'quarters'])
    .default('weeks'),
});

export const M02AiAskBodySchema = z.object({
  callId: z.string().min(1).optional(),
  question: z.string().optional().default(''),
});

export const M02ExportBodySchema = z.object({
  filters: z.record(z.unknown()).optional().default({}),
  fields: z.record(z.unknown()).optional().default({}),
});

export const M02CreateStreamBodySchema = z.object({
  name: z.string().optional().default('Unnamed Stream'),
  filters: z.record(z.unknown()).optional().default({}),
  notifications: z
    .object({
      inApp: z.boolean().optional(),
      slack: z.boolean().optional(),
      emailDigest: z.boolean().optional(),
    })
    .optional(),
  shareWithTeam: z.boolean().optional(),
});
