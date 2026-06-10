import { z } from 'zod';

// ── CT-01 / CT-02: Register a new call record ──────────────────────────────
export const CreateCallSchema = z.object({
  title:          z.string().min(1).max(255),
  callDate:       z.coerce.date(),
  durationSeconds:z.number().int().min(0).default(0),
  callType:       z.enum(['inbound', 'outbound', 'meeting']),
  callSource:     z.enum(['zoom', 'teams', 'meet', 'dialer', 'manual']),
  participants:   z.array(z.string()).min(1),
  callOwner:      z.string().min(1),
  accountId:      z.string().optional(),
  opportunityId:  z.string().optional(),
  audioUrl:       z.string().url().optional(),
});
export interface CreateCallDto extends z.infer<typeof CreateCallSchema> {}

// ── S3 catalog upload ───────────────────────────────────────────────────────
export const UploadFromS3Schema = z.object({
  recordingId: z.enum(['2min_sales', '3mins_sales']),
});
export interface UploadFromS3Dto extends z.infer<typeof UploadFromS3Schema> {}

// ── CT-22: Create a note ───────────────────────────────────────────────────
export const CreateNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});
export interface CreateNoteDto extends z.infer<typeof CreateNoteSchema> {}

// ── CT-22: Update a note ───────────────────────────────────────────────────
export const UpdateNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});
export interface UpdateNoteDto extends z.infer<typeof UpdateNoteSchema> {}

// ── CT-23: Share a call ────────────────────────────────────────────────────
export const ShareCallSchema = z.object({
  sharedWithId:   z.string().min(1),
  sharedWithType: z.enum(['user', 'team']),
});
export interface ShareCallDto extends z.infer<typeof ShareCallSchema> {}

// ── CT-05 / CT-21: Search query ───────────────────────────────────────────
export const SearchQuerySchema = z.object({
  q:      z.string().min(1).max(200),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export interface SearchQueryDto extends z.infer<typeof SearchQuerySchema> {}

// ── List calls query ──────────────────────────────────────────────────────
export const ListCallsQuerySchema = z.object({
  status:  z.enum(['pending', 'processing', 'completed', 'failed', 'skipped']).optional(),
  source:  z.enum(['zoom', 'teams', 'meet', 'dialer', 'manual']).optional(),
  sortBy:  z.enum(['callDate', 'title', 'durationSeconds', 'transcriptStatus', 'createdAt']).default('callDate'),
  order:   z.enum(['asc', 'desc']).default('desc'),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
  offset:  z.coerce.number().int().min(0).default(0),
});
export interface ListCallsQueryDto extends z.infer<typeof ListCallsQuerySchema> {}

// ── Admin settings ────────────────────────────────────────────────────────
export const UpdateAdminSettingsSchema = z.object({
  transcriptionEnabled:    z.boolean().optional(),
  minCallDurationSeconds:  z.number().int().min(0).optional(),
  piiRedactionEnabled:     z.boolean().optional(),
});
export interface UpdateAdminSettingsDto extends z.infer<typeof UpdateAdminSettingsSchema> {}

// ── US-11: Next Steps CRUD ───────────────────────────────────────────
export const AddNextStepSchema = z.object({
  step: z.string().min(1).max(1000),
});
export interface AddNextStepDto extends z.infer<typeof AddNextStepSchema> {}

export const UpdateNextStepSchema = z.object({
  step:  z.string().min(1).max(1000),
  index: z.number().int().min(0),
});
export interface UpdateNextStepDto extends z.infer<typeof UpdateNextStepSchema> {}

export const DeleteNextStepSchema = z.object({
  index: z.coerce.number().int().min(0),
});
export interface DeleteNextStepDto extends z.infer<typeof DeleteNextStepSchema> {}

// ── Inline utterance edit (US-19 / CT-24) ──────────────────────────
export const UpdateUtteranceSchema = z.object({
  text: z.string().min(1).max(5000),
});
export interface UpdateUtteranceDto extends z.infer<typeof UpdateUtteranceSchema> {}
