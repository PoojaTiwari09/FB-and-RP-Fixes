"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveDtoSchema = exports.ReopenDtoSchema = exports.OverrideDtoSchema = exports.CreateDealSchema = exports.SubmitDtoSchema = void 0;
const zod_1 = require("zod");
exports.SubmitDtoSchema = zod_1.z.object({
    lob: zod_1.z.string().min(1, 'LOB is required'),
    commitForecast: zod_1.z.number().positive('Commit Forecast must be positive'),
    bestCaseForecast: zod_1.z.number().positive().optional(),
    notes: zod_1.z.string().optional(),
    repUserId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.CreateDealSchema = zod_1.z.object({
    dealName: zod_1.z.string().min(1),
    stage: zod_1.z.string().min(1),
    amount: zod_1.z.number().nonnegative(),
    closeDate: zod_1.z.string().min(1),
    probability: zod_1.z.number().min(0).max(100).optional(),
    region: zod_1.z.enum(['Americas', 'EMEA', 'APAC']).optional(),
    lob: zod_1.z.string().optional(),
});
exports.OverrideDtoSchema = zod_1.z.object({
    managerId: zod_1.z.string().min(1),
    managerName: zod_1.z.string().min(1),
    overrideValue: zod_1.z.number().positive('Override value must be positive'),
    justification: zod_1.z.string().min(5, 'Justification must be at least 5 characters'),
    approveNow: zod_1.z.boolean().optional(),
});
exports.ReopenDtoSchema = zod_1.z.object({
    managerId: zod_1.z.string().min(1),
    managerName: zod_1.z.string().min(1),
    comment: zod_1.z.string().min(1, 'Comment is required when reopening'),
});
exports.ApproveDtoSchema = zod_1.z.object({
    managerId: zod_1.z.string().min(1),
    managerName: zod_1.z.string().min(1),
});
//# sourceMappingURL=m06.schema.js.map