"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportJobSchema = exports.ReplayExportSchema = exports.RegisterConnectionSchema = void 0;
const zod_1 = require("zod");
exports.RegisterConnectionSchema = zod_1.z.object({
    destination: zod_1.z.enum([
        "postgres",
        "snowflake",
        "bigquery",
        "s3",
        "databricks",
        "redshift",
    ]),
    destinationName: zod_1.z.string().min(1).max(100).optional(),
    config: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
});
exports.ReplayExportSchema = zod_1.z.object({
    connectionId: zod_1.z.string().uuid(),
    datasetName: zod_1.z.enum(["accounts", "contacts", "deals", "activities"]),
    windowStart: zod_1.z.string().datetime(),
    windowEnd: zod_1.z.string().datetime(),
});
exports.ExportJobSchema = zod_1.z.object({
    tenantId: zod_1.z.string().uuid(),
    connectionId: zod_1.z.string().uuid(),
    datasetName: zod_1.z.enum(["accounts", "contacts", "deals", "activities"]),
    syncMode: zod_1.z.enum(["incremental", "full_backfill"]).default("incremental"),
    windowStart: zod_1.z.string().datetime().optional(),
    windowEnd: zod_1.z.string().datetime().optional(),
    idempotencyKey: zod_1.z.string(),
    runId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=data-cloud.schema.js.map