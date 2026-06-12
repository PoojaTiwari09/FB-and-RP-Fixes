import { z } from "zod";

export const CreateDsarSchema = z.object({
  contactEmail: z.string().email(),
  requestType: z.enum(["erasure", "portability", "access", "rectification"]),
  details: z.record(z.unknown()).optional(),
});

export const UpdateDsarStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "rejected"]),
});

export const CreateRopaSchema = z.object({
  purpose: z.string().min(1),
  dataCategories: z.array(z.string()).min(1),
  lawfulBasis: z.string().min(1),
  retentionPeriod: z.string().min(1),
});

export const CreateDataBreachSchema = z.object({
  incidentDate: z.string().datetime(),
  detectionDate: z.string().datetime(),
  description: z.string().min(1),
  affectedData: z.array(z.string()).min(1),
});

export const UpdateDataBreachStatusSchema = z.object({
  status: z.enum(["investigating", "mitigated", "reported"]),
});

export type CreateDsarDto = z.infer<typeof CreateDsarSchema>;
export type UpdateDsarStatusDto = z.infer<typeof UpdateDsarStatusSchema>;
export type CreateRopaDto = z.infer<typeof CreateRopaSchema>;
export type CreateDataBreachDto = z.infer<typeof CreateDataBreachSchema>;
export type UpdateDataBreachStatusDto = z.infer<
  typeof UpdateDataBreachStatusSchema
>;
