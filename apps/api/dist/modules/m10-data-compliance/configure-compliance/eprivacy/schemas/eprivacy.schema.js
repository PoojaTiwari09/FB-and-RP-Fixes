"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSuppressionSchema = exports.UpdateEPrivacyConsentSchema = void 0;
const zod_1 = require("zod");
exports.UpdateEPrivacyConsentSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email(),
    channel: zod_1.z.enum(["email", "call", "sms"]),
    purpose: zod_1.z.enum(["marketing", "tracking", "essential"]),
    status: zod_1.z.enum(["granted", "revoked"]),
    source: zod_1.z.enum(["cookie_banner", "preference_center"]),
});
exports.AddSuppressionSchema = zod_1.z.object({
    contactEmail: zod_1.z.string().email(),
    reason: zod_1.z.enum(["global_dnc", "eprivacy_revoke", "spam_complaint"]),
});
//# sourceMappingURL=eprivacy.schema.js.map