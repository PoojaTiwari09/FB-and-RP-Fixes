import { z } from 'zod';

/** TDD §4 — POST /periods/:id/submit request body */
export const ForecastBoardSubmitSchema = z.object({
  submittedAmount: z.number().nonnegative(),
  bestCaseAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  committedDealIds: z.array(z.string().min(1)).default([]),
});

export interface ForecastBoardSubmitDto extends z.infer<typeof ForecastBoardSubmitSchema> {}
