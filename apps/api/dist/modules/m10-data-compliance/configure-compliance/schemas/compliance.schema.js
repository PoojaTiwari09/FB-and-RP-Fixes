"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateConsentLogSchema = exports.UpsertOptOutSchema = exports.EvaluateOutreachSchema = exports.UpdatePolicySchema = exports.CreatePolicySchema = void 0;
const zod_1 = require("zod");
exports.CreatePolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255),
    description: zod_1.z.string().max(1000).optional(),
    channel: zod_1.z.enum(["email", "call", "sms", "data_export"]),
    regionFamily: zod_1.z.enum(["GDPR", "CCPA", "GLOBAL"]).default("GLOBAL"),
    ruleDefinition: zod_1.z
        .object({
        requireExplicitConsent: zod_1.z.boolean().optional(),
        fallbackAction: zod_1.z.enum(["block", "allow"]).default("block"),
        customRules: zod_1.z.record(zod_1.z.unknown()).optional(),
    })
        .default({}),
});
exports.UpdatePolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255).optional(),
    description: zod_1.z.string().max(1000).optional(),
    channel: zod_1.z.enum(["email", "call", "sms", "data_export"]).optional(),
    regionFamily: zod_1.z.enum(["GDPR", "CCPA", "GLOBAL"]).optional(),
    ruleDefinition: zod_1.z
        .object({
        requireExplicitConsent: zod_1.z.boolean().optional(),
        fallbackAction: zod_1.z.enum(["block", "allow"]).optional(),
        customRules: zod_1.z.record(zod_1.z.unknown()).optional(),
    })
        .optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.EvaluateOutreachSchema = zod_1.z.object({
    correlationId: zod_1.z.string().uuid(),
    recipientEmail: zod_1.z.string().email(),
    channel: zod_1.z.enum(["email", "call", "sms"]),
    context: zod_1.z
        .object({
        jurisdiction: zod_1.z.string().optional(),
        outboundType: zod_1.z.string().optional(),
        senderId: zod_1.z.string().optional(),
        contactId: zod_1.z.string().uuid().optional(),
    })
        .default({}),
});
exports.UpsertOptOutSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email(),
    channel: zod_1.z.enum(["email", "call", "sms"]),
    isOptedOut: zod_1.z.boolean(),
});
exports.CreateConsentLogSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email(),
    consentType: zod_1.z.string().min(1),
    status: zod_1.z.enum(["granted", "revoked"]),
    source: zod_1.z.enum(["web_form", "manual_crm", "opt_in_email", "api"]),
});
//# sourceMappingURL=compliance.schema.js.map