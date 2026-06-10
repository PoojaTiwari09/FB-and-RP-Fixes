import { z } from 'zod';
export declare const SubmitDtoSchema: z.ZodObject<{
    lob: z.ZodString;
    commitForecast: z.ZodNumber;
    bestCaseForecast: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    repUserId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    status?: string;
    repUserId?: string;
    lob?: string;
    commitForecast?: number;
    bestCaseForecast?: number;
}, {
    notes?: string;
    status?: string;
    repUserId?: string;
    lob?: string;
    commitForecast?: number;
    bestCaseForecast?: number;
}>;
export declare const CreateDealSchema: z.ZodObject<{
    dealName: z.ZodString;
    stage: z.ZodString;
    amount: z.ZodNumber;
    closeDate: z.ZodString;
    probability: z.ZodOptional<z.ZodNumber>;
    region: z.ZodOptional<z.ZodEnum<["Americas", "EMEA", "APAC"]>>;
    lob: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount?: number;
    stage?: string;
    closeDate?: string;
    probability?: number;
    dealName?: string;
    region?: "EMEA" | "APAC" | "Americas";
    lob?: string;
}, {
    amount?: number;
    stage?: string;
    closeDate?: string;
    probability?: number;
    dealName?: string;
    region?: "EMEA" | "APAC" | "Americas";
    lob?: string;
}>;
export declare const OverrideDtoSchema: z.ZodObject<{
    managerId: z.ZodString;
    managerName: z.ZodString;
    overrideValue: z.ZodNumber;
    justification: z.ZodString;
    approveNow: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    managerId?: string;
    managerName?: string;
    justification?: string;
    overrideValue?: number;
    approveNow?: boolean;
}, {
    managerId?: string;
    managerName?: string;
    justification?: string;
    overrideValue?: number;
    approveNow?: boolean;
}>;
export declare const ReopenDtoSchema: z.ZodObject<{
    managerId: z.ZodString;
    managerName: z.ZodString;
    comment: z.ZodString;
}, "strip", z.ZodTypeAny, {
    comment?: string;
    managerId?: string;
    managerName?: string;
}, {
    comment?: string;
    managerId?: string;
    managerName?: string;
}>;
export declare const ApproveDtoSchema: z.ZodObject<{
    managerId: z.ZodString;
    managerName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    managerId?: string;
    managerName?: string;
}, {
    managerId?: string;
    managerName?: string;
}>;
export type SubmitDto = z.infer<typeof SubmitDtoSchema>;
export type CreateDealDto = z.infer<typeof CreateDealSchema>;
export type OverrideDto = z.infer<typeof OverrideDtoSchema>;
export type ReopenDto = z.infer<typeof ReopenDtoSchema>;
export type ApproveDto = z.infer<typeof ApproveDtoSchema>;
