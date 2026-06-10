import { z } from 'zod';

export const CreateM03AiSummariesGenaiSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export interface CreateM03AiSummariesGenaiDto extends z.infer<typeof CreateM03AiSummariesGenaiSchema> {}
