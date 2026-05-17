import { z } from 'zod';

export const CreateM08ExecutionSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM08ExecutionDto = z.infer<typeof CreateM08ExecutionSchema>;
