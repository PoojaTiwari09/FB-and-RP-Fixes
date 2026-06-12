// M10 Configure Compliance — Zod Validation Schemas
// Owned by: modules/m10-data-compliance/ (TDD Doc #11b v3.0)

import { z } from "zod";

// ─── Policy Management (TDD §7.1, §7.2) ──────────────────────────────────────

export const CreatePolicySchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  channel: z.enum(["email", "call", "sms", "data_export"]),
  regionFamily: z.enum(["GDPR", "CCPA", "GLOBAL"]).default("GLOBAL"),
  ruleDefinition: z
    .object({
      requireExplicitConsent: z.boolean().optional(),
      fallbackAction: z.enum(["block", "allow"]).default("block"),
      customRules: z.record(z.unknown()).optional(),
    })
    .default({}),
});

export const UpdatePolicySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  channel: z.enum(["email", "call", "sms", "data_export"]).optional(),
  regionFamily: z.enum(["GDPR", "CCPA", "GLOBAL"]).optional(),
  ruleDefinition: z
    .object({
      requireExplicitConsent: z.boolean().optional(),
      fallbackAction: z.enum(["block", "allow"]).optional(),
      customRules: z.record(z.unknown()).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── Runtime Evaluation Gate (TDD §7.3) ──────────────────────────────────────

export const EvaluateOutreachSchema = z.object({
  correlationId: z.string().uuid(),
  recipientEmail: z.string().email(),
  channel: z.enum(["email", "call", "sms"]),
  context: z
    .object({
      jurisdiction: z.string().optional(),
      outboundType: z.string().optional(),
      senderId: z.string().optional(),
      contactId: z.string().uuid().optional(),
    })
    .default({}),
});

// ─── Opt-Out Management ───────────────────────────────────────────────────────

export const UpsertOptOutSchema = z.object({
  contactEmail: z.string().email(),
  channel: z.enum(["email", "call", "sms"]),
  isOptedOut: z.boolean(),
});

export const CreateConsentLogSchema = z.object({
  contactEmail: z.string().email(),
  consentType: z.string().min(1),
  status: z.enum(["granted", "revoked"]),
  source: z.enum(["web_form", "manual_crm", "opt_in_email", "api"]),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreatePolicyDto = z.infer<typeof CreatePolicySchema>;
export type UpdatePolicyDto = z.infer<typeof UpdatePolicySchema>;
export type EvaluateOutreachDto = z.infer<typeof EvaluateOutreachSchema>;
export type UpsertOptOutDto = z.infer<typeof UpsertOptOutSchema>;
export type CreateConsentLogDto = z.infer<typeof CreateConsentLogSchema>;
