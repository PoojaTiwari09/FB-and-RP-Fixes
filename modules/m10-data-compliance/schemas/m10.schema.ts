import { z } from 'zod';

export const CreateM10DataComplianceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
});

export interface CreateM10DataComplianceDto extends z.infer<typeof CreateM10DataComplianceSchema> {}
