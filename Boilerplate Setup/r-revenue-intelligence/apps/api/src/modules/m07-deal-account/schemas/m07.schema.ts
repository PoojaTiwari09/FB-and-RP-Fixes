import { z } from 'zod';

export const CreateM07DealAccountSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM07DealAccountDto = z.infer<typeof CreateM07DealAccountSchema>;
