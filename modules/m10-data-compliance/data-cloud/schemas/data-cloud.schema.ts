// M10 Data Cloud — Zod Validation Schemas
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)

import { z } from 'zod';

// ─── Register Connection ──────────────────────────────────────────────────────
export const RegisterConnectionSchema = z.object({
  destination: z.enum(['postgres', 'snowflake', 'bigquery', 's3', 'databricks', 'redshift']),
  destinationName: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional().default({}),
});
export type RegisterConnectionDto = z.infer<typeof RegisterConnectionSchema>;

// ─── Replay Trigger ───────────────────────────────────────────────────────────
export const ReplayExportSchema = z.object({
  connectionId: z.string().uuid(),
  datasetName: z.enum(['accounts', 'contacts', 'deals', 'activities']),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
});
export type ReplayExportDto = z.infer<typeof ReplayExportSchema>;

// ─── Export Job Payload (internal BullMQ job data) ───────────────────────────
export const ExportJobSchema = z.object({
  tenantId: z.string().uuid(),
  connectionId: z.string().uuid(),
  datasetName: z.enum(['accounts', 'contacts', 'deals', 'activities']),
  syncMode: z.enum(['incremental', 'full_backfill']).default('incremental'),
  windowStart: z.string().datetime().optional(),
  windowEnd: z.string().datetime().optional(),
  idempotencyKey: z.string(),
  runId: z.string().uuid().optional(),
});
export type ExportJobDto = z.infer<typeof ExportJobSchema>;
