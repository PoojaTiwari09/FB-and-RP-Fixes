import { z } from "zod";

export const sourceModeSchema = z.enum([
  "CRM_ONLY",
  "CALLS_ONLY",
  "TRANSCRIPTIONS_ONLY",
  "COMBINED",
]);

export const datasetObjectSchema = z.enum([
  "deals",
  "accounts",
  "calls",
  "transcriptions",
]);

export const datasetRelationshipSchema = z.object({
  sourceObject: datasetObjectSchema,
  sourceField: z.string().min(1),
  targetObject: datasetObjectSchema,
  targetField: z.string().min(1),
  status: z.enum(["AUTO_DETECTED", "MANUAL_OVERRIDE", "REJECTED"]),
});

export const createDatasetDtoSchema = z.object({
  name: z.string().min(2),
  sourceMode: sourceModeSchema,
  selectedObjects: z.array(datasetObjectSchema).min(1),
  selectedFields: z.record(z.array(z.string().min(1))),
  relationships: z.array(datasetRelationshipSchema),
});

export interface CreateDatasetDto extends z.infer<typeof createDatasetDtoSchema> {}
