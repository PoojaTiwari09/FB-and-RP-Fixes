import { z } from 'zod';

export const CreateM01CaptureSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM01CaptureDto = z.infer<typeof CreateM01CaptureSchema>;
