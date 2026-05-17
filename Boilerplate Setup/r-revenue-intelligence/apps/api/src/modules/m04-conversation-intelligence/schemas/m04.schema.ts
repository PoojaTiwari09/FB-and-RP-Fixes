import { z } from 'zod';

export const CreateM04ConversationIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM04ConversationIntelligenceDto = z.infer<typeof CreateM04ConversationIntelligenceSchema>;
