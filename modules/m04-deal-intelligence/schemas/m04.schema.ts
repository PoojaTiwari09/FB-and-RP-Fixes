import { z } from 'zod';

export const CreateM04DealIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export interface CreateM04DealIntelligenceDto extends z.infer<typeof CreateM04DealIntelligenceSchema> {}
