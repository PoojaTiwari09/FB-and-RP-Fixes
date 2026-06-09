import { z } from "zod";

export const timeRangeSchema = z.enum(["CURRENT_QUARTER", "LAST_QUARTER"]);

export const metricNameSchema = z.enum([
  "bookings",
  "targetAttainment",
  "winRate",
]);

export const createDashboardDtoSchema = z.object({
  title: z.string().min(2),
  datasetId: z.string().cuid().optional(),
});

export const createWidgetDtoSchema = z.object({
  dashboardId: z.string().cuid(),
  type: z.enum(["KPI", "BAR", "LINE", "PIE", "FUNNEL"]),
  title: z.string().min(2),
  metric: metricNameSchema,
  xField: z.string().optional(),
  yField: z.string().optional(),
  filters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  timeRange: timeRangeSchema.default("CURRENT_QUARTER"),
});

export type CreateDashboardDto = z.infer<typeof createDashboardDtoSchema>;
export type CreateWidgetDto = z.infer<typeof createWidgetDtoSchema>;
