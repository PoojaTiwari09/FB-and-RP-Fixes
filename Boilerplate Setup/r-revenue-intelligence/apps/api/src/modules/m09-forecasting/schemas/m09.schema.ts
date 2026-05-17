import { z } from 'zod';

export const CreateM09ForecastingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateM09ForecastingDto = z.infer<typeof CreateM09ForecastingSchema>;
