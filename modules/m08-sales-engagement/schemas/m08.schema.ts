import { z } from 'zod';

export const PlayStepSchema = z.object({
  stepNum: z.number().int().positive(),
  actionType: z.string(),
  description: z.string(),
  dueOffsetDays: z.number().int().nonnegative(),
});

export const TriggerConditionSchema = z.object({
  eventType: z.string(),
  field: z.string(),
  operator: z.string(),
  value: z.string(),
});

export const CreatePlaySchema = z.object({
  name: z.string().min(1, 'Playbook name is required'),
  steps: z.array(PlayStepSchema).min(1, 'Playbook must contain at least one step'),
  triggerConditions: z.array(TriggerConditionSchema).default([]),
  isActive: z.boolean().default(true),
});

export const UpdatePlaySchema = z.object({
  name: z.string().optional(),
  steps: z.array(PlayStepSchema).optional(),
  triggerConditions: z.array(TriggerConditionSchema).optional(),
  isActive: z.boolean().optional(),
});

export const ClonePlaySchema = z.object({
  playId: z.string().uuid('Invalid Playbook ID'),
});

export const DeactivatePlaySchema = z.object({
  playId: z.string().uuid('Invalid Playbook ID'),
});

export const EnrollPlaySchema = z.object({
  playId: z.string().uuid('Invalid Playbook ID'),
  dealId: z.string().uuid('Invalid Deal ID'),
  userId: z.string().uuid('Invalid User ID'),
  triggerEventId: z.string().uuid('Invalid Trigger Event ID').optional(),
});

export const CompleteStepSchema = z.object({
  stepId: z.number().int().positive(),
  notes: z.string().optional(),
});

export const SkipStepSchema = z.object({
  stepId: z.number().int().positive(),
  reason: z.string().min(1, 'Skip reason is required'),
});

export const CreateNoteSchema = z.object({
  noteText: z.string().min(1, 'Note content is required'),
});

export type CreatePlayDto = z.infer<typeof CreatePlaySchema>;
export type UpdatePlayDto = z.infer<typeof UpdatePlaySchema>;
export type ClonePlayDto = z.infer<typeof ClonePlaySchema>;
export type DeactivatePlayDto = z.infer<typeof DeactivatePlaySchema>;
export type EnrollPlayDto = z.infer<typeof EnrollPlaySchema>;
export type CompleteStepDto = z.infer<typeof CompleteStepSchema>;
export type SkipStepDto = z.infer<typeof SkipStepSchema>;
export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;
