import { z } from 'zod';

export const CreateM03RevenueGraphSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM03RevenueGraphDto = z.infer<typeof CreateM03RevenueGraphSchema>;
