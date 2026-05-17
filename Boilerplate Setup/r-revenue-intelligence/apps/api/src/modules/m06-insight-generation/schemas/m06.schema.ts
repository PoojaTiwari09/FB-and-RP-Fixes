import { z } from 'zod';

export const CreateM06InsightGenerationSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM06InsightGenerationDto = z.infer<typeof CreateM06InsightGenerationSchema>;
