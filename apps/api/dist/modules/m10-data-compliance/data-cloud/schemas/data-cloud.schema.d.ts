import { z } from 'zod';
export declare const RegisterConnectionSchema: z.ZodObject<{
    destination: z.ZodEnum<["postgres", "snowflake", "bigquery", "s3", "databricks", "redshift"]>;
    destinationName: z.ZodOptional<z.ZodString>;
    config: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    destination?: "postgres" | "snowflake" | "bigquery" | "s3" | "databricks" | "redshift";
    destinationName?: string;
    config?: Record<string, unknown>;
}, {
    destination?: "postgres" | "snowflake" | "bigquery" | "s3" | "databricks" | "redshift";
    destinationName?: string;
    config?: Record<string, unknown>;
}>;
export type RegisterConnectionDto = z.infer<typeof RegisterConnectionSchema>;
export declare const ReplayExportSchema: z.ZodObject<{
    connectionId: z.ZodString;
    datasetName: z.ZodEnum<["accounts", "contacts", "deals", "activities"]>;
    windowStart: z.ZodString;
    windowEnd: z.ZodString;
}, "strip", z.ZodTypeAny, {
    connectionId?: string;
    datasetName?: "deals" | "accounts" | "contacts" | "activities";
    windowStart?: string;
    windowEnd?: string;
}, {
    connectionId?: string;
    datasetName?: "deals" | "accounts" | "contacts" | "activities";
    windowStart?: string;
    windowEnd?: string;
}>;
export type ReplayExportDto = z.infer<typeof ReplayExportSchema>;
export declare const ExportJobSchema: z.ZodObject<{
    tenantId: z.ZodString;
    connectionId: z.ZodString;
    datasetName: z.ZodEnum<["accounts", "contacts", "deals", "activities"]>;
    syncMode: z.ZodDefault<z.ZodEnum<["incremental", "full_backfill"]>>;
    windowStart: z.ZodOptional<z.ZodString>;
    windowEnd: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodString;
    runId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string;
    connectionId?: string;
    datasetName?: "deals" | "accounts" | "contacts" | "activities";
    windowStart?: string;
    windowEnd?: string;
    runId?: string;
    idempotencyKey?: string;
    syncMode?: "incremental" | "full_backfill";
}, {
    tenantId?: string;
    connectionId?: string;
    datasetName?: "deals" | "accounts" | "contacts" | "activities";
    windowStart?: string;
    windowEnd?: string;
    runId?: string;
    idempotencyKey?: string;
    syncMode?: "incremental" | "full_backfill";
}>;
export type ExportJobDto = z.infer<typeof ExportJobSchema>;
