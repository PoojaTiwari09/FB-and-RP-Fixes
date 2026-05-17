import { z } from 'zod';

export const CreateM02SalesEngagementSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM02SalesEngagementDto = z.infer<typeof CreateM02SalesEngagementSchema>;
