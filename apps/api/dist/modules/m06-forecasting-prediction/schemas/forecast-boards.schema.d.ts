import { z } from 'zod';
export declare const ForecastBoardSubmitSchema: z.ZodObject<{
    submittedAmount: z.ZodNumber;
    bestCaseAmount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    committedDealIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    notes?: string;
    committedDealIds?: string[];
    submittedAmount?: number;
    bestCaseAmount?: number;
}, {
    notes?: string;
    committedDealIds?: string[];
    submittedAmount?: number;
    bestCaseAmount?: number;
}>;
export type ForecastBoardSubmitDto = z.infer<typeof ForecastBoardSubmitSchema>;
