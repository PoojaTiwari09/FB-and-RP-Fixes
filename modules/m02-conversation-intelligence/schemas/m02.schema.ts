import { z } from 'zod';

export const CreateM02ConversationIntelligenceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export interface CreateM02ConversationIntelligenceDto extends z.infer<typeof CreateM02ConversationIntelligenceSchema> {}
