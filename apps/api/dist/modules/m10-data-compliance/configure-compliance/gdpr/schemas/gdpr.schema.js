"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDataBreachStatusSchema = exports.CreateDataBreachSchema = exports.CreateRopaSchema = exports.UpdateDsarStatusSchema = exports.CreateDsarSchema = void 0;
const zod_1 = require("zod");
exports.CreateDsarSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email(),
    requestType: zod_1.z.enum(["erasure", "portability", "access", "rectification"]),
    details: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.UpdateDsarStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "in_progress", "completed", "rejected"]),
});
exports.CreateRopaSchema = zod_1.z.object({
    purpose: zod_1.z.string().min(1),
    dataCategories: zod_1.z.array(zod_1.z.string()).min(1),
    lawfulBasis: zod_1.z.string().min(1),
    retentionPeriod: zod_1.z.string().min(1),
});
exports.CreateDataBreachSchema = zod_1.z.object({
    incidentDate: zod_1.z.string().datetime(),
    detectionDate: zod_1.z.string().datetime(),
    description: zod_1.z.string().min(1),
    affectedData: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.UpdateDataBreachStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["investigating", "mitigated", "reported"]),
});
//# sourceMappingURL=gdpr.schema.js.map