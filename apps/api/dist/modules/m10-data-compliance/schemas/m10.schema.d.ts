import { z } from 'zod';
export declare const CreateM10DataComplianceSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    name?: string;
}, {
    tenantId?: string;
    name?: string;
}>;
export type CreateM10DataComplianceDto = z.infer<typeof CreateM10DataComplianceSchema>;
