import { z } from "zod";

export const frontendRoleSchema = z.enum(["sales_rep", "sales_manager"]);

export const backendRoleSchema = z.enum([
  "ADMIN",
  "MANAGER",
  "SALES_REP",
  "ANALYST",
  "EXECUTIVE",
]);

export const registerRoleSchema = z.union([
  backendRoleSchema,
  frontendRoleSchema,
]);

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
  role: registerRoleSchema.default("SALES_REP"),
});

export const refreshDtoSchema = z.object({
  refreshToken: z.string().min(20),
});

export const logoutDtoSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: backendRoleSchema,
  frontendRole: frontendRoleSchema,
  tenantId: z.string().uuid(),
  tenantSlug: z.string(),
  permissions: z.array(z.string()),
});

export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal("Bearer"),
  user: authUserSchema,
});

export interface LoginDto extends z.infer<typeof loginDtoSchema> {}
export interface RegisterDto extends z.infer<typeof registerDtoSchema> {}
export interface RefreshDto extends z.infer<typeof refreshDtoSchema> {}
export interface LogoutDto extends z.infer<typeof logoutDtoSchema> {}
export interface AuthUserDto extends z.infer<typeof authUserSchema> {}
export interface AuthTokenResponseDto extends z.infer<typeof authTokenResponseSchema> {}
