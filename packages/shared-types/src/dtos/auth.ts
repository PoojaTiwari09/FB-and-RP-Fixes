import { z } from "zod";

export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().min(2),
});

export const registerDtoSchema = z.object({
  tenantName: z.string().min(2),
  tenantSlug: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "SALES_REP", "ANALYST"]).default("ADMIN"),
});

export interface LoginDto extends z.infer<typeof loginDtoSchema> {}
export interface RegisterDto extends z.infer<typeof registerDtoSchema> {}
