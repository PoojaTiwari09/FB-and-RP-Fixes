import { z } from 'zod';

export const CreateM10CoachingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM10CoachingDto = z.infer<typeof CreateM10CoachingSchema>;
