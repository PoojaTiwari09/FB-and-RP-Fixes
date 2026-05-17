import { z } from 'zod';

export const CreateM05SmartTrackingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM05SmartTrackingDto = z.infer<typeof CreateM05SmartTrackingSchema>;
