import { z } from 'zod';
export declare const CreateM03AiSummariesGenaiSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    name?: string;
}, {
    tenantId?: string;
    name?: string;
}>;
export type CreateM03AiSummariesGenaiDto = z.infer<typeof CreateM03AiSummariesGenaiSchema>;
