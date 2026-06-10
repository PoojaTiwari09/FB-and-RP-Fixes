"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastBoardSubmitSchema = void 0;
const zod_1 = require("zod");
exports.ForecastBoardSubmitSchema = zod_1.z.object({
    submittedAmount: zod_1.z.number().nonnegative(),
    bestCaseAmount: zod_1.z.number().nonnegative().optional(),
    notes: zod_1.z.string().optional(),
    committedDealIds: zod_1.z.array(zod_1.z.string().min(1)).default([]),
});
//# sourceMappingURL=forecast-boards.schema.js.map