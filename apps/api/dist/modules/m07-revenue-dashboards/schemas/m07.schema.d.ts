import { z } from 'zod';
export declare const CreateM07RevenueDashboardsSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    name?: string;
}, {
    tenantId?: string;
    name?: string;
}>;
export type CreateM07RevenueDashboardsDto = z.infer<typeof CreateM07RevenueDashboardsSchema>;
