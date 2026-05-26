import { z } from "zod";

export const crmIngestedEventSchema = z.object({
  tenantId: z.string().cuid(),
  source: z.literal("hubspot"),
  records: z.number().int().nonnegative(),
  occurredAt: z.string(),
});

export type CrmIngestedEvent = z.infer<typeof crmIngestedEventSchema>;
