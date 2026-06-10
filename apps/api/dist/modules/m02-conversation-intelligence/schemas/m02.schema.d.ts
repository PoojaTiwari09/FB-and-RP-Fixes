import { z } from 'zod';
export declare const CreateM02ConversationIntelligenceSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    name?: string;
}, {
    tenantId?: string;
    name?: string;
}>;
export type CreateM02ConversationIntelligenceDto = z.infer<typeof CreateM02ConversationIntelligenceSchema>;
