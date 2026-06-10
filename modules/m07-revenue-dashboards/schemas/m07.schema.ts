import { z } from 'zod';

export const CreateM07RevenueDashboardsSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export interface CreateM07RevenueDashboardsDto extends z.infer<typeof CreateM07RevenueDashboardsSchema> {}
