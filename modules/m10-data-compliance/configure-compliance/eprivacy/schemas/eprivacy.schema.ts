import { z } from "zod";

export const UpdateEPrivacyConsentSchema = z.object({
  contactEmail: z.string().email(),
  channel: z.enum(["email", "call", "sms"]),
  purpose: z.enum(["marketing", "tracking", "essential"]),
  status: z.enum(["granted", "revoked"]),
  source: z.enum(["cookie_banner", "preference_center"]),
});

export const AddSuppressionSchema = z.object({
  contactEmail: z.string().email(),
  reason: z.enum(["global_dnc", "eprivacy_revoke", "spam_complaint"]),
});

export type UpdateEPrivacyConsentDto = z.infer<
  typeof UpdateEPrivacyConsentSchema
>;
export type AddSuppressionDto = z.infer<typeof AddSuppressionSchema>;
