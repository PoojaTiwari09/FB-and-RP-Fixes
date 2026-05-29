import { z } from 'zod';

export const TranscriptListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  showLowConfidenceOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export const PatchNextStepSchema = z.object({
  completed: z.boolean(),
});

export const GenerateBriefSchema = z.object({
  briefTemplate: z.string().min(1),
  period: z.string().min(1),
});

export const ShareInternalSchema = z.object({
  recipientEmails: z.array(z.string().email()).min(1),
  message: z.string().optional(),
});
